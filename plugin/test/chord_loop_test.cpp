// A chord played from MIDI (one note per MIDI slot) must survive the looper and "Record moment" (1.0.14).
// Two Glass notes are held, note 1 is let go first: the replay must keep note 2 sounding, as it did live.
// Before 1.0.14 both notes were recorded onto one slot, so letting go of note 1 silenced the layer or moment.
#include "he_core.h"
#include <cmath>
#include <cstdio>
#include <vector>
using namespace he;
static const double SR = 48000;
struct Rig {
  Host h{SR}; std::vector<float> o;
  Rig() { std::vector<double> P(NPARAM); for (int k = 0; k < NPARAM; k++) P[k] = PARAMS[k].def; P[P_REV_MIX] = 0; P[P_AURA_HOLD] = 0; h.init(P.data(), 1337); }
  void run(double sec) { float L[BL], R[BL]; int n = (int)std::lround(sec * SR / BL); for (int b = 0; b < n; b++) { h.block(L, R); o.insert(o.end(), L, L + BL); } }
  double now() const { return o.size() / SR; }
  double db(double a, double b) const { size_t i0 = (size_t)(a * SR), i1 = (size_t)(b * SR); double s = 0; for (size_t i = i0; i < i1; i++) s += (double)o[i] * o[i]; return 20 * std::log10(std::sqrt(s / (i1 - i0)) + 1e-12); }
  // the chord, starting now: note 1 at +0, note 2 at +0.1, note 1 up at +1.0, note 2 up at +2.0, 0.2 s tail
  void chord() {
    h.gesture(GLASS, 'd', .5, .5, .8, 220, 1); run(.1);
    h.gesture(GLASS, 'd', .5, .5, .8, 330, 2); run(.9);
    h.gesture(GLASS, 'u', 0, 0, 0, 0, 1); run(1.0);
    h.gesture(GLASS, 'u', 0, 0, 0, 0, 2); run(.2);
  }
};
static int fails = 0;
static void check(bool ok, const char* what) { std::printf("%s %s\n", ok ? "PASS" : "FAIL", what); if (!ok) fails++; }

int main() {
  {  // the looper
    Rig r; r.run(.2); r.h.loop("rec", 0, 0, true); double t0 = r.now(); r.chord(); r.h.loop("stop", 0, 0, true);
    double len = r.now() - t0, p0 = r.now(); r.run(len * 2);
    double liveBoth = r.db(t0 + .3, t0 + .9), liveOne = r.db(t0 + 1.2, t0 + 1.9);
    double playBoth = r.db(p0 + len + .3, p0 + len + .9), playOne = r.db(p0 + len + 1.2, p0 + len + 1.9);
    std::printf("looper: both held live %.1f / replay %.1f dBFS; note 2 alone live %.1f / replay %.1f dBFS\n", liveBoth, playBoth, liveOne, playOne);
    check(playOne > liveOne - 12, "the looper keeps note 2 sounding after note 1 is let go");
    check(playBoth > liveBoth - 12, "the looper replays the held chord");
  }
  {  // Record moment, then play the moment
    Rig r; r.run(.2);
    Msg m; m.t = Msg::CMREC; m.on = true; r.h.msg(m); double t0 = r.now(); r.chord();
    m.on = false; r.h.msg(m); r.run(.05);
    CmCapture cap; bool got = r.h.takeCapture(cap); check(got, "Record moment made a capture");
    if (!got) return 1;
    int ups = 0; for (auto& e : cap.ev) if (e.k == 'u') ups++;
    check(ups == 1, "the moment lifts the chord once, at the last release");
    auto d = std::make_shared<CmDefinition>(); d->voice = -1; double off = cap.ev.empty() ? 0 : cap.ev[0].t; d->len = (cap.dur - off) / cap.sr;
    for (auto& e : cap.ev) d->ev.push_back({(e.t - off) / cap.sr, e.s, e.k, e.x, e.y, e.p, e.hz});
    Msg def; def.t = Msg::CMDEF; def.id = 7; def.def = d; r.h.msg(def); r.run(.6);
    Msg go; go.t = Msg::CMOMENT; go.id = 7; go.on = true; r.h.msg(go); double p0 = r.now(); r.run(2.4);
    double liveOne = r.db(t0 + 1.2, t0 + 1.9), playOne = r.db(p0 + 1.2, p0 + 1.9);
    std::printf("moment: note 2 alone live %.1f / replay %.1f dBFS\n", liveOne, playOne);
    check(playOne > liveOne - 12, "the moment keeps sounding after note 1 is let go");
  }
  return fails ? 1 : 0;
}
