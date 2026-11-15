// Horror Engine · Séance: a CC moving a parameter must not flicker back to the host's stale value.
// Horror Engine by Garyck Arntzen (https://x.com/_mintydoge). GNU AGPLv3.
//
// Models the plugin's three parties: the audio thread (applyParams + handleMidi), the controller's 30 Hz timer that
// passes MIDI values on to the host parameter, and the host parameter itself. Runs the same loop with and without
// ParamHold; the old behaviour (no hold) has to show the flicker, the new one must not.
#include "../src/ParamHold.h"
#include <cstdio>
#include <cstdlib>
#include <deque>
#include <random>

static int fails = 0;
static void ok(bool c, const char* m) { std::printf("%s %s\n", c ? "PASS" : "FAIL", m); if (!c) fails++; }

struct Sim {
  bool useHold; double sr = 48000;
  double host = 0;              // the host parameter (normalised)
  double last = 0, engine = 0;  // the processor's last_ and the engine's value
  ParamHold hold;
  std::deque<double> notes;     // AudioNotes waiting for the controller's timer
  long long t = 0, nextTimer = 1600;
  int backSteps = 0;            // the engine moved against the sweep direction
  double prevEngine = 0;
  void apply(int n) {
    double v = host;
    if (useHold && hold.holding() && !hold.follow(v, n)) return;
    if (v != last) { last = v; setEngine(v); }
  }
  void setEngine(double v) { if (v < prevEngine - 1e-9) backSteps++; prevEngine = engine = v; }
  void cc(double v) { setEngine(v); last = v; if (useHold) hold.midi(v, (long long)(sr * .5)); notes.push_back(v); }
  void timer() { while (!notes.empty()) { host = notes.front(); notes.pop_front(); } }   // setValueNotifyingHost
  // a rising CC sweep 0..127, one step every `every` samples, rendered in host buffers of random sizes
  void sweep(int every, std::mt19937& rng) {
    std::uniform_int_distribution<int> bs(32, 1024); long long nextCC = 0; int val = 0;
    while (val <= 127 || t < nextCC + 48000) {
      int n = bs(rng); apply(n);
      for (long long s = t; s < t + n; s++) {
        if (val <= 127 && s >= nextCC) { cc(val / 127.0); val++; nextCC += every; }
        if (s >= nextTimer) { timer(); nextTimer += 1600; }   // 30 Hz
      }
      t += n;
    }
  }
};

int main() {
  std::mt19937 rng(7);
  { Sim a; a.useHold = false; a.sweep(256, rng);
    char m[200]; std::snprintf(m, sizeof m, "without the hold the stale host value comes back (%d backward steps in a rising sweep)", a.backSteps); ok(a.backSteps > 0, m); }
  { Sim a; a.useHold = true; a.sweep(256, rng);
    char m[200]; std::snprintf(m, sizeof m, "with the hold a rising CC sweep never steps back (%d backward steps)", a.backSteps); ok(a.backSteps == 0, m);
    ok(std::fabs(a.engine - 1) < 1e-9 && std::fabs(a.host - 1) < 1e-9 && !a.hold.holding(), "engine, host parameter and hold all end at the last CC value"); }
  { Sim a; a.useHold = true; a.sweep(4000, rng);   // slow knob: every update is caught by the timer
    char m[200]; std::snprintf(m, sizeof m, "slow CC moves: no backward steps (%d)", a.backSteps); ok(a.backSteps == 0, m); }
  { // the host never takes the value (an update lost): after the timeout the host's value wins
    ParamHold h; h.midi(.8, 24000); int blocks = 0; bool took = false;
    while (!took && blocks < 1000) { took = h.follow(.2, 512); blocks++; }
    ok(took && blocks == 47, "a lost update: the host's value wins again after the 0.5 s timeout"); }
  { // host automation lands near the MIDI value: caught up, hold released at once
    ParamHold h; h.midi(.5, 24000); ok(h.follow(.5004, 512) && !h.holding(), "a host value within tolerance releases the hold at once"); }
  { ParamHold h; ok(h.follow(.3, 512), "no CC: the host parameter drives the engine as before"); }
  std::printf(fails ? "%d failed\n" : "all passed\n", fails);
  return fails ? 1 : 0;
}
