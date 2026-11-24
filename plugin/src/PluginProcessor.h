// Horror Engine · Séance, the plugin: VST3 and CLAP around the C++ port of src/engine.js.
// Horror Engine by Garyck Arntzen (https://x.com/_mintydoge). Plugin released under the GNU AGPLv3 (see LICENSE).
#pragma once
#include "ParamHold.h"
#include <juce_audio_processors/juce_audio_processors.h>
#include <juce_audio_formats/juce_audio_formats.h>
#include <atomic>
#include <memory>
#include "he_core.h"

class Controller;

// editor / controller -> audio thread (plain data apart from the custom-moment definition)
struct UiEvent {
  enum Type { GESTURE, NOTE_ON, NOTE_OFF, RELEASE_ALL, MOMENT, MOMENT_N, CMOMENT, CMDEF, CMREC, LOOP, PANIC, INPUT } type = GESTURE;
  int voice = 0; char kind = 'd'; float x = .5f, y = .5f, p = .6f, hz = 0;
  int id = 0; bool on = false; int tag = 0;
  int loopAction = 0; int layer = 0; float lv = 0; bool free = false;
  std::shared_ptr<const he::CmDefinition> def;
};
enum LoopAction { LA_REC, LA_STOP, LA_CLEAR, LA_UNDO, LA_REDO, LA_DEL, LA_MUTE, LA_SRC, LA_GHOST };

// audio thread -> message thread
struct AudioNote { enum Type { SET_PARAM, LEARN_GOT } type = SET_PARAM; int k = 0; float v = 0; int ch = 0, cc = 0; };

class HorrorProcessor : public juce::AudioProcessor {
 public:
  HorrorProcessor();
  ~HorrorProcessor() override;

  void prepareToPlay(double sampleRate, int samplesPerBlock) override;
  void releaseResources() override {}
  bool isBusesLayoutSupported(const BusesLayout& layouts) const override;
  void processBlock(juce::AudioBuffer<float>&, juce::MidiBuffer&) override;
  using AudioProcessor::processBlock;

  juce::AudioProcessorEditor* createEditor() override;
  bool hasEditor() const override { return true; }
  const juce::String getName() const override { return "Horror Engine"; }
  bool acceptsMidi() const override { return true; }
  bool producesMidi() const override { return false; }
  bool isMidiEffect() const override { return false; }
  double getTailLengthSeconds() const override { return 30.0; }

  int getNumPrograms() override;
  int getCurrentProgram() override;
  void setCurrentProgram(int index) override;
  const juce::String getProgramName(int index) override;
  void changeProgramName(int, const juce::String&) override {}

  void getStateInformation(juce::MemoryBlock& destData) override;
  void setStateInformation(const void* data, int sizeInBytes) override;

  juce::AudioProcessorValueTreeState apvts;
  juce::RangedAudioParameter* param(int i) const { return params_[i]; }
  float value(int i) const { return raw_[i]->load(); }
  Controller& controller() { return *ctl_; }

  // message thread -> audio
  void push(const UiEvent& e);
  // audio -> message thread
  bool popNote(AudioNote& n);
  bool popTelemetry(he::Telemetry& t);
  bool takeCapture(he::CmCapture& c);

  // read by the audio thread, written by the controller
  std::atomic<int> selVoice{0}, learnArmed{0};
  std::atomic<int> mmap[16][120];                    // learned CC -> parameter index, -1 none
  std::atomic<int> cmOrder[64]; std::atomic<int> cmCount{0};   // your own moments in panel order (engine handles)
  std::atomic<bool> wantJunk{false};
  std::atomic<bool> syncToHost{true};
  std::atomic<float> hostTempo{0};                  // the host's tempo, 0 if it gives none (for the looper drawer)                // looper Sync to host (used while the host plays at a known tempo)
  // the scope (mono, last 2048 samples) and the last minute of output
  float scope[2048] = {}; std::atomic<int> scopeW{0};
  // smoothed output peak, written on the audio thread, read on the message thread (Dread letter glow)
  float outputLevel() const { return outputLevel_.load(std::memory_order_relaxed); }
  bool copyLastSeconds(double seconds, juce::AudioBuffer<float>& out, double& sampleRate);
  // your sound in: the track's input or a file
  enum InputSource { IN_NONE = 0, IN_TRACK, IN_FILE };
  std::atomic<int> inputSource{IN_NONE}; std::atomic<bool> fileLoop{true}, fileEnded{false};
  void setInputFile(std::unique_ptr<juce::AudioBuffer<float>> buf);   // resampled to the session rate
  double sessionRate() const { return sr_; }

 private:
  static juce::AudioProcessorValueTreeState::ParameterLayout layout();
  void applyParams(bool force, int numSamples = 0);
  void handleMidi(const juce::MidiMessage& m);
  void runEvent(const UiEvent& e);
  void noteOn(int tag, double hz, double vel);
  void noteOff(int tag);
  void releaseHeldAt(size_t idx);
  void releaseSustained();
  void updateActivePitchAndPressure();
  double effPressure(double vel) const;
  void releaseAll(int voice);
  void momentN(int n);
  void momentToggle(int id);
  void pushNote(const AudioNote& n);

  std::shared_ptr<std::atomic<bool>> alive_ = std::make_shared<std::atomic<bool>>(true);
  std::unique_ptr<Controller> ctl_;
  std::unique_ptr<he::Host> host_;
  juce::RangedAudioParameter* params_[he::NPARAM] = {};
  std::atomic<float>* raw_[he::NPARAM] = {};
  double last_[he::NPARAM] = {};
  ParamHold hold_[he::NPARAM];   // a CC moved this parameter; keep its value until the host parameter catches up
  // host-automatable board gesture parameters (plugin-only; keep he::NPARAM and preset schemas unchanged)
  std::atomic<float>* boardRaw_[4] = {};   // board.touch, board.x, board.y, board.pressure
  bool boardWasDown_ = false;
  int boardVoice_ = 0;
  float boardLastX_ = .5f, boardLastY_ = .5f, boardLastP_ = .6f;
  void midiParam(int k, double v);
  double sr_ = 48000;
  int blocks_ = 0;
  // held notes (MIDI and the computer keyboard): polyphonic on E-bow (2), Bowed (3), Glass (3); last-note mono on others
  struct Held { int tag; int voice; int slot; double baseHz; double vel; bool sustained; };
  std::vector<Held> held_; int midiCC_[128] = {};
  double pbMul_ = 1.0, atMod_ = -1.0, mwMod_ = -1.0; bool modLive_ = false;
  bool sustain_ = false;
  // editor / host -> audio
  static constexpr int QN = 1024;
  juce::SpinLock fifoWriteLock_;
  juce::AbstractFifo fifo_{QN}; UiEvent events_[QN];
  juce::AbstractFifo noteFifo_{512}; AudioNote notes_[512];
  juce::AbstractFifo tmFifo_{64}; he::Telemetry tms_[64];
  juce::SpinLock capLock_; he::CmCapture cap_; bool capReady_ = false;
  juce::AudioBuffer<float> inBuf_, outTmp_;
  // last minute
  juce::SpinLock ringLock_;
  juce::AudioBuffer<float> ring_; std::atomic<int> ringW_{0}, ringFill_{0};
  std::atomic<float> outputLevel_{0};
  // input file
  juce::SpinLock fileLock_; std::unique_ptr<juce::AudioBuffer<float>> file_; int filePos_ = 0;
  bool inputOn_ = false;
};
