// Horror Engine · Séance: a drag on the board pulls as smoothly at any host buffer size (1.0.4). C++ twin of the web
// app's test/glide.js. A hand sweeping the board is sampled as the UI really delivers it (one move per 60 fps frame, or
// a busy UI giving 20-50 ms gaps) and handed to the engine in clumps at the start of each host buffer (256, 512 or
// 1024 samples), as processBlock does. Plain moves ('m') jump and then stop, so the hand speed the Bowed and Glass
// voices hear pulses; gliding moves ('n', what the board sends since 1.0.4) must keep that speed steady.
// `drag_test -v` prints the table. Horror Engine by Garyck Arntzen (https://x.com/_mintydoge). GNU AGPLv3.
#include "he_core.h"
#include <cmath>
#include <cstdio>
#include <cstring>
#include <string>
#include <vector>

static int fails = 0;
static void ok(bool c, const std::string& m) { std::printf("%s %s\n", c ? "PASS" : "FAIL", m.c_str()); if (!c) fails++; }
struct Rng { uint32_t s; explicit Rng(uint32_t x) : s(x) {} double u() { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s % 1000000u) / 1e6; } };
static const double PI = 3.141592653589793, DUR = 3, T0 = .05;
static void pos(double t, double& x, double& y) { double s = t - T0; x = .5 + .32 * std::sin(2 * PI * .55 * s); y = .45 + .12 * std::sin(2 * PI * .21 * s + 1); }
enum Kind { EVERY_BLOCK, FPS60, SLOW };
static std::vector<double> times(Kind k, uint32_t seed, double sr) {
  Rng r(seed); double t = T0; std::vector<double> out;
  while (t < T0 + DUR) { t += k == EVERY_BLOCK ? he::BL / sr : k == FPS60 ? 1 / 60.0 : .02 + .03 * r.u(); out.push_back(t); }
  return out;
}
struct Res { double rip, mean; };
static Res run(double sr, int voice, const std::vector<double>& ts, int buf, char k) {
  std::vector<double> P(he::NPARAM); for (int i = 0; i < he::NPARAM; i++) P[i] = he::PARAMS[i].def;
  he::Host h(sr); h.init(P.data(), 1337);
  std::vector<float> L((size_t)buf), R((size_t)buf); std::vector<double> spd; size_t i = 0;
  double x, y; pos(T0, x, y); h.gesture(voice, 'd', x, y, .6);
  long long end = (long long)std::lround((T0 + DUR + .1) * sr), f = 0; int sub = 0;
  while (f < end) {
    // processBlock: everything the UI sent by the end of this buffer is applied at its start
    double until = (double)(f + buf) / sr;
    while (i < ts.size() && ts[i] <= until) { pos(ts[i], x, y); h.gesture(voice, k, x, y, .6); i++; }
    for (int j = 0; j < buf; j += he::BL) { h.render(L.data() + j, R.data() + j, he::BL); spd.push_back(h.touch(voice).spd); }
    f += buf; sub++;
  }
  double bps = sr / he::BL; int a = (int)std::lround((T0 + .4) * bps), b = (int)std::lround((T0 + DUR - .2) * bps), w = (int)std::lround(.03 * bps);
  double s = 0, m = 0; int c = 0;
  for (int n = a; n < b; n++) { double av = 0; for (int j = n - w; j <= n + w; j++) av += spd[(size_t)j]; av /= 2 * w + 1; s += (spd[(size_t)n] - av) * (spd[(size_t)n] - av); m += spd[(size_t)n]; c++; }
  return {std::sqrt(s / c) / (m / c), m / c};
}
// a slow skate: a mouse dragged at 10-25 px/s across a 700 px board reports a move only when it reaches a new pixel,
// so plain moves leave the hand standing between them and the glass lets go; glides hold its speed across the gaps
struct Slow { double off, cv; };
static Slow slow(double sr, double v, char k) {
  std::vector<double> P(he::NPARAM); for (int i = 0; i < he::NPARAM; i++) P[i] = he::PARAMS[i].def;
  he::Host h(sr); h.init(P.data(), 1337);
  float L[he::BL], R[he::BL]; Rng r(5); int last = -1; long long nf = 1; std::vector<double> sp;
  h.gesture(he::GLASS, 'd', .15, .5, .6);
  for (long long f = 0; f < (long long)(4 * sr); f += he::BL) {
    if (f % 512 == 0) while (nf / 60.0 <= (f + 512) / sr) { int px = (int)std::floor(.15 * 700 + v * nf / 60.0 + (r.u() - .5) * .6); if (px != last) { last = px; h.gesture(he::GLASS, k, px / 700.0, .5, .6); } nf++; }
    h.render(L, R, he::BL); if (f > .5 * sr) sp.push_back(h.touch(he::GLASS).spd);
  }
  double m = 0, s = 0, off = 0; for (double x : sp) { m += x; if (x < .004) off++; } m /= sp.size(); for (double x : sp) s += (x - m) * (x - m);
  return {off / sp.size(), std::sqrt(s / sp.size()) / m};
}
int main(int argc, char** argv) {
  bool v = argc > 1 && !std::strcmp(argv[1], "-v");
  const double rates[2] = {44100, 48000}; const int voices[2] = {he::BOWED, he::GLASS}; const char* vn[2] = {"Bowed", "Glass"};
  const int bufs[3] = {256, 512, 1024};
  for (double sr : rates) for (int vi = 0; vi < 2; vi++) {
    Res ref = run(sr, voices[vi], times(EVERY_BLOCK, 1, sr), he::BL, 'm');
    if (v) std::printf("%s %.0f Hz, hand sampled every block: speed ripple %.3f, mean speed %.3f\n", vn[vi], sr, ref.rip, ref.mean);
    for (Kind kd : {FPS60, SLOW}) for (int bf : bufs) {
      auto ts = times(kd, 7, sr); Res om = run(sr, voices[vi], ts, bf, 'm'), on = run(sr, voices[vi], ts, bf, 'n');
      char tag[160]; std::snprintf(tag, sizeof tag, "%s %.0f Hz, %s, %d-sample buffers", vn[vi], sr, kd == FPS60 ? "60 fps moves" : "20-50 ms moves", bf);
      if (v) std::printf("  %s: plain moves ripple %.3f | glides %.3f\n", tag, om.rip, on.rip);
      char m[300];
      std::snprintf(m, sizeof m, "%s: glide speed ripple %.3f (plain moves %.3f, every block %.3f)", tag, on.rip, om.rip, ref.rip);
      ok(on.rip < om.rip * .5 && on.rip < .09, m);
      std::snprintf(m, sizeof m, "%s: glides keep the mean speed (%.3f vs %.3f)", tag, on.mean, ref.mean);
      ok(std::fabs(on.mean - ref.mean) < .06 * ref.mean, m);
    }
  }
  for (double sr : rates) for (double v : {10.0, 25.0}) {
    Slow om = slow(sr, v, 'm'), on = slow(sr, v, 'n'); char m[300];
    std::snprintf(m, sizeof m, "Glass %.0f Hz, a slow skate at %.0f px/s: glides keep the glass in touch (let go %.0f%% vs %.0f%%, speed cv %.2f vs %.2f)", sr, v, 100 * on.off, 100 * om.off, on.cv, om.cv);
    ok(on.off < .1 && on.cv < .3 && on.cv < om.cv * .6, m);
  }
  std::printf(fails ? "%d failed\n" : "all passed\n", fails);
  return fails ? 1 : 0;
}
