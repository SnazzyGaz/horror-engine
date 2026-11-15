// Horror Engine DSP core, C++17 port of src/engine.js (seance-ui branch).
// Engine (c) 2026 Garyck Arntzen (https://x.com/_mintydoge). This port is part of the Horror Engine plugin, AGPLv3.
//
// The same nine physical models, shared body, harmonizer, hall, Aura, moments, custom moments and gesture looper as
// the web app, translated line for line so the plugin and the browser sound alike. Arrays the JavaScript keeps in
// Float32Array are float here and everything else is double, so rounding happens in the same places; random numbers
// are drawn in the same order.
//
// The engine runs in fixed 128-sample blocks. Host::render() takes any length and buffers internally.
#pragma once
#include <cstdint>
#include <memory>
#include <string>
#include <vector>
#include "he_params.gen.h"

namespace he {

constexpr int BL = 128;              // block length (samples)
constexpr int NS = 9;                // voices
constexpr int NSTEM = NS + 5;        // + hall return, reverse swell, harmonizer return, body, input

enum Voice { EBOW = 0, HURDY, BOWED, GLASS, STRUCK, SPRING, JUNK, AURA, MOAN };
enum Moment { M_RISER = 0, M_STINGER, M_DRONE, M_HEART, M_WALLS };

// a custom moment as the UI hands it over (times in seconds; the engine turns them into frames)
struct CmEvent { double t; int s; char k; double x, y, p, hz; };
struct CmLaneDef { int k; double min, max; bool exp, isInt, abs; std::vector<std::pair<double, double>> pts; };
struct CmDefinition { int voice = -1; double len = 0; std::vector<CmEvent> ev; std::vector<CmLaneDef> lanes; };

// what "Record moment" captured (frames from arming); see Engine.recM in engine.js
struct CmCapture {
  double sr = 48000, dur = 0;
  struct Ev { double t; int s; char k; double x, y, p, hz; };
  struct Pv { double t; int k; double v; };
  std::vector<Ev> ev; std::vector<Pv> pv; std::vector<std::pair<int, double>> p0;   // p0: start values of the moved knobs
};

// one engine message, the C++ form of the JavaScript {t: ...} objects
struct Msg {
  enum Type { PARAM, GESTURE, MOMENT, CMOMENT, CMDEF, CMREC, LOOP, PANIC, INPUT, INIT } t = PARAM;
  // PARAM
  int k = -1; double v = 0;
  // GESTURE: s voice, g 'd' down / 'm' move / 'n' gliding move (the board's drags, 1.0.4) / 'u' up
  int s = 0; char g = 'd'; double x = .5, y = .5, p = .6, hz = 0;
  // MOMENT / CMOMENT (id = custom moment handle) / CMREC (on)
  int id = 0; bool on = false; double arg = 0;
  // CMDEF: definition (null removes it)
  std::shared_ptr<const CmDefinition> def;
  // LOOP: a = "rec" "stop" "clear" "undo" "redo" "del" "mute" "src" "ghost"; layer for per-layer actions
  std::string a; int layer = 0; double lv = 0; bool free = false;
  // INIT: all parameter values (NPARAM doubles) and the seed
  const double* params = nullptr; uint32_t seed = 1337;
};

// the host's transport, for the looper's Sync to host (plugin only; the web app has no host clock)
struct Transport { bool valid = false, playing = false; double bpm = 0, ppq = 0, barPpq = -1; int num = 4, den = 4; };

struct LayerInfo { int id = 0, src = 0; float len = 0, pos = 0; bool mute = false, ghost = false; };
constexpr int MAXLAYERTM = 32, MAXCMTM = 32, JUNKTM = 81 * 3 + 3;
// the JavaScript host's "tm" message
struct Telemetry {
  float peakL = 0, peakR = 0, gainReduction = 1; float voicePeak[NS] = {};
  int nLayers = 0; LayerInfo layers[MAXLAYERTM]; bool looping = false; float lane = 0;
  int undoCount = 0, nUndo = 0, nRedo = 0;
  float riser = -1; bool stinger = false, drone = false, heart = false, walls = false;
  int nCm = 0; int cmId[MAXCMTM] = {}; float cmPos[MAXCMTM] = {}; float cmRec = -1;
  float inPeak = 0; bool frozen = false; float bodyPeak = 0, harmPeak = 0;
  int junkN = -1; float junk[JUNKTM] = {};
  int64_t frame = 0;
  bool synced = false, recWaiting = false; float bpm = 0; int laneBars = 0;   // Sync to host
};

class Engine;

class Host {
 public:
  explicit Host(double sampleRate);
  ~Host();
  Host(const Host&) = delete;
  Host& operator=(const Host&) = delete;

  void msg(const Msg& m);
  void block(float* L, float* R, const float* IL = nullptr, const float* IR = nullptr);   // exactly BL frames
  // any number of frames: engine blocks are rendered on demand (input is used a block later)
  void render(float* L, float* R, int n, const float* IL = nullptr, const float* IR = nullptr);

  // conveniences over msg()
  void init(const double* params, uint32_t seed = 1337);
  void setParam(int id, double v);
  double param(int id) const;
  void gesture(int voice, char kind, double x, double y, double pressure, double hz = 0);
  void moment(int id, bool on, double arg = 0);
  void loop(const char* action, int layer = 0, double v = 0, bool free = false);
  void panic();
  void inputOn(bool on);
  // Sync to host: call once per host buffer, before render(), with the transport at the buffer's first sample. With sync on
  // and the host playing at a known tempo the looper follows the host's position (bars, loop points, jumps); otherwise it
  // runs free, exactly as in the web app. Never calling this keeps the engine identical to the web one.
  void transport(const Transport& t, bool syncOn);

  bool wantJunk = false;                                     // telemetry carries the junk tray's pieces
  bool ready() const { return ready_; }
  int64_t frame() const;
  double sampleRate() const { return sr_; }
  void telemetry(Telemetry& t);                              // fill t; peaks since the last call are reset
  // the finished "Record moment" capture, if any (taken once)
  bool takeCapture(CmCapture& out);
  bool momentActive(int id) const;                           // a built-in moment is running
  bool cmActive(int id) const;                               // a custom moment is playing
  static int paramIndex(const char* id);                     // -1 if unknown
  // the live touch on a voice, after the engine's smoothing (read-only; for tests and meters)
  struct Touch { bool on = false; double x = 0, y = 0, p = 0, spd = 0; };
  Touch touch(int voice) const;

 private:
  double sr_;
  std::unique_ptr<Engine> e_;
  float bufL_[BL], bufR_[BL]; int bufPos_ = BL;
  float inAccL_[BL], inAccR_[BL]; int inPos_ = 0;
  bool ready_ = false;
  Transport tr_; bool trSync_ = false, trSet_ = false; int64_t trOff_ = 0;
  std::vector<Msg> byeQ_, byeRun_;                           // messages held back while GOODBYE fades out
};

}  // namespace he
