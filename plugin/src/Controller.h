// Horror Engine · Séance: the message-thread side of the plugin, a port of src/ui.js and src/seance/seance.js
// (everything they do apart from drawing): parameters, undo/redo, presets, MIDI learn, moments and your own moments,
// the looper's commands, your sound in, the last minute, share links and preset files.
// Horror Engine by Garyck Arntzen (https://x.com/_mintydoge). Plugin released under the GNU AGPLv3.
#pragma once
#include <juce_audio_processors/juce_audio_processors.h>
#include <juce_audio_formats/juce_audio_formats.h>
#include <map>
#include <vector>
#include "he_core.h"
#include "he_presets.gen.h"

class HorrorProcessor;

struct VoiceInfo { const char* n; const char* d; const char* x; const char* y; const char* h; };
extern const VoiceInfo SRC[he::NS];
extern const char* const ROMAN[he::NS];
extern const char* const HE_S[he::NS];
struct MomentInfo { const char* id; const char* name; const char* desc; };
extern const MomentInfo MOMENTS[5];

struct CustomMoment {
  juce::String id, name, created; int voice = -1; double len = 0; juce::var ev, lanes; int handle = 0;
  juce::var toVar() const;
};

class Controller : private juce::Timer {
 public:
  explicit Controller(HorrorProcessor& p);
  ~Controller() override;

  // ---- parameters ----
  static double norm(int k, double v);
  static double denorm(int k, double n);
  static juce::String fmt(int k, double v);
  static double midiValue(int k, int v7);
  static int indexOf(const juce::String& id);
  double P(int k) const;
  double P(const juce::String& id) const { int k = indexOf(id); return k >= 0 ? P(k) : 0; }
  void setParam(int k, double v, bool quiet = false);
  void setParam(const juce::String& id, double v) { int k = indexOf(id); if (k >= 0) setParam(k, v); }
  // a knob drag is one undo step
  void hBegin(const juce::String& label);
  void hEnd();
  bool hGrpOpen() const { return hGrp_ != nullptr; }
  void beginGesture(int k);
  void endGesture(int k);

  // ---- undo / redo ----
  void undo();
  void redo();
  bool canUndo() const { return hpos_ > 0; }
  bool canRedo() const { return hpos_ < (int)hist_.size(); }
  juce::String undoTitle() const;
  juce::String redoTitle() const;

  // ---- voices ----
  int sel() const { return sel_; }
  void select(int i);
  bool padDown = false;
  int octave() const { return octave_; }
  int setOct(int n);
  double noteHz(int semi) const { return 55 * std::pow(2.0, octave_ + semi / 12.0); }
  double basePr = .6;
  void noteOn(int tag, double hz, double vel);
  void noteOff(int tag);
  void gesture(char k, double x, double y, double p);
  void toggleHold();
  void toggleFreeze();
  void panic();
  static const char* const OFF_KEYS[4];
  bool offDirty(int s) const;
  bool anyOffDirty() const;
  void resetOff(int s);
  void offDefaults();
  bool offSure = false; bool offUndoActive() const { return offUndo_.size() > 0; }

  // ---- presets ----
  int presetIndex() const { return preset_; }
  std::atomic<int> presetIndexAtomic{0};
  juce::String presetName() const;
  void loadPreset(int i);
  void step(int d) { loadPreset((preset_ + d + he::NPRESET) % he::NPRESET); }
  bool edited() const;
  bool isFav(const juce::String& n) const { return favs_.contains(n); }
  void star(const juce::String& n);
  void applyAll(const std::vector<double>& vals, const juce::String& label);
  void savePresetFile();
  void loadPresetFile();

  // ---- MIDI learn ----
  bool picking = false;
  void pick(bool on);
  void learnStart(int k);
  int learnStop();
  int learning() const { return learnId_; }
  void learnGot(int ch, int cc);
  juce::String mmKeyOf(int k) const;
  static juce::String mmDesc(const juce::String& key);
  void mmForget(int k);
  void mmForgetAll();
  int mmCount() const { return (int)mmap_.size(); }

  // ---- moments ----
  bool momentOn(int i) const;                 // built-in, from the telemetry
  float riserProgress() const { return tm.riser; }
  void momentToggle(int i);                   // built-in 0-4
  void momentN(int n);                        // 0-4 built-in, then your own in panel order
  std::vector<CustomMoment> CMS;
  bool cmArmed = false; bool cmPending = false; CustomMoment cmPend; juce::String cmOpen;
  float cmPlaying(const CustomMoment& c) const;   // -1 not playing, else progress
  void cmToggle(const CustomMoment& c);
  void cmRecToggle();
  void cmNameDone(bool keep, const juce::String& name);
  juce::String cmFreeName() const;
  void cmRename(const juce::String& id, const juce::String& name);
  void cmSetVoice(const juce::String& id, int v);
  void cmUp(const juce::String& id);
  void cmDelete(const juce::String& id);
  void cmExport(const juce::String& id);
  void cmImportFile();
  int cmMerge(const juce::var& list);
  std::vector<std::pair<int, std::shared_ptr<const he::CmDefinition>>> engineDefinitions() const;

  // ---- looper ----
  bool freeLength = false;
  // computer-keyboard playing: off by default so Space, letters and digits stay with the host (FL Studio and others);
  // saved with the project
  bool keysOn = false;
  bool syncToHost() const;            // looper Sync to host (default on; saved with the project)
  void setSyncToHost(bool on);
  float hostTempo() const;            // 0 when the host gives no tempo
  void loopToggle();
  void loopCmd(int action, int layer = 0, double v = 0);

  // ---- your sound in ----
  bool inputOn() const { return inKind_ != 0; }
  int inputKind() const { return inKind_; }   // 0 off, 1 track, 2 file
  juce::String inputState() const;
  void inputTrack();
  void inputFile();
  void inputStop(bool quiet = false);
  bool inputLoop = true;
  float inPk = 0;

  // ---- menu ----
  void retroSave();
  void shareLink();
  juce::String status() const;

  // ---- telemetry (latest, for drawing) ----
  he::Telemetry tm; float srcPk[he::NS] = {}; float pkL = 0, pkR = 0, gr = 1; bool started = false;

  // ---- toasts and change counters ----
  juce::String toastText; juce::uint32 toastAt = 0; int toastSeq = 0;
  void toast(const juce::String& t);
  int version = 0;        // bumped when lists (moments, MIDI map, favourites) change
  int paramVersion = 0;   // bumped on any parameter change made here

  void poll() { timerCallback(); }   // tests: take the audio thread's news now

  // ---- state ----
  juce::ValueTree saveState() const;
  mutable juce::CriticalSection stateLock;   // CMS and the MIDI map, which the host may save from its own thread
  void loadState(const juce::ValueTree& v);

 private:
  void timerCallback() override;
  void send(const struct UiEvent& e);
  struct HEntry { char k = 'p'; std::vector<std::pair<int, std::pair<double, double>>> ch; int autoId = -1; juce::int64 t = 0; juce::String label; bool offDef = false; };
  void hNote(int k, double from, double to);
  void histPush(const HEntry& e);
  void hApply(const HEntry& e, bool back);
  juce::String hName(const HEntry& e) const;
  void hLoop(int uc);
  void mmSync();
  void cmSync();
  void cmSend(const CustomMoment& c);
  bool cmValid(const juce::var& c) const;
  CustomMoment fromVar(const juce::var& c) const;
  void cmCaptured(const he::CmCapture& m);
  void cmImport(const juce::var& j);
  void inputGo(int kind, const juce::String& name);
  juce::PropertiesFile& settings();
  void saveFavs();
  void releaseAll();
  static juce::String stamp();
  void saveFile(const juce::String& name, const juce::String& filters, std::function<bool(const juce::File&)> write, std::function<void(const juce::File&)> ok);

  HorrorProcessor& p_;
  int sel_ = 0, octave_ = 0, preset_ = 0, nextHandle_ = 1;
  std::vector<HEntry> hist_; int hpos_ = 0; std::unique_ptr<HEntry> hGrp_; int hMute_ = 0; int ucSeen_ = -1;
  std::map<juce::String, int> mmap_;   // "cc:ch:cc" -> parameter
  int learnId_ = -1; juce::uint32 learnT_ = 0;
  juce::StringArray favs_;
  std::map<int, double> offUndo_; juce::uint32 offUndoT_ = 0; int offGrp_ = -1;
  int inKind_ = 0; juce::String inName_;
  std::unique_ptr<juce::FileChooser> chooser_;
  std::unique_ptr<juce::PropertiesFile> settings_;
  int gestureDepth_[he::NPARAM] = {};
};
