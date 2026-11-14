// Horror Engine · Séance, the plugin: VST3 and CLAP around the C++ port of src/engine.js.
// Horror Engine by Garyck Arntzen (https://x.com/_mintydoge). Plugin released under the GNU AGPLv3 (see LICENSE).
#pragma once
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
  // the scope (mono, last 2048 samples) and the last minute of output
  float scope[2048] = {}; std::atomic<int> scopeW{0};
  bool copyLastSeconds(double seconds, juce::AudioBuffer<float>& out, double& sampleRate);
  // your sound in: the track's input or a file
  enum InputSource { IN_NONE = 0, IN_TRACK, IN_FILE };
  std::atomic<int> inputSource{IN_NONE}; std::atomic<bool> fileLoop{true}, fileEnded{false};
  void setInputFile(std::unique_ptr<juce::AudioBuffer<float>> buf);   // resampled to the session rate
  double sessionRate() const { return sr_; }

 private:
  static juce::AudioProcessorValueTreeState::ParameterLayout layout();
  void applyParams(bool force);
  void handleMidi(const juce::MidiMessage& m);
  void runEvent(const UiEvent& e);
  void noteOn(int tag, double hz, double vel);
  void noteOff(int tag);
  void releaseAll(int voice);
  void momentN(int n);
  void momentToggle(int id);
  void pushNote(const AudioNote& n);

  std::unique_ptr<Controller> ctl_;
  std::unique_ptr<he::Host> host_;
  juce::RangedAudioParameter* params_[he::NPARAM] = {};
  std::atomic<float>* raw_[he::NPARAM] = {};
  double last_[he::NPARAM] = {};
  double sr_ = 48000;
  int blocks_ = 0;
  // held notes (MIDI and the computer keyboard): the latest leads
  struct Held { int tag; double hz; };
  std::vector<Held> held_; int heldVoice_ = 0; int midiCC_[128] = {};
  // editor -> audio
  static constexpr int QN = 1024;
  juce::AbstractFifo fifo_{QN}; UiEvent events_[QN];
  juce::AbstractFifo noteFifo_{512}; AudioNote notes_[512];
  juce::AbstractFifo tmFifo_{64}; he::Telemetry tms_[64];
  juce::SpinLock capLock_; he::CmCapture cap_; bool capReady_ = false;
  juce::AudioBuffer<float> inBuf_, outTmp_;
  // last minute
  juce::AudioBuffer<float> ring_; std::atomic<int> ringW_{0}, ringFill_{0};
  // input file
  juce::SpinLock fileLock_; std::unique_ptr<juce::AudioBuffer<float>> file_; int filePos_ = 0;
  bool inputOn_ = false;
};
