// Horror Engine · Séance: GOODBYE (and Esc) is a hard stop (1.0.3). With Aura holding, Freeze on, a ghost looper
// layer playing, the drone and a stinger going and a 30 s hall, the output must be below -90 dBFS within 50 ms, fade
// without a click, and stay silent until something is played; the next touch then plays normally.
// Horror Engine by Garyck Arntzen (https://x.com/_mintydoge). GNU AGPLv3.
#include "he_core.h"
#include <cmath>
#include <cstdio>
#include <functional>
#include <vector>

static int fails = 0;
static void ok(bool c, const char* m) { std::printf("%s %s\n", c ? "PASS" : "FAIL", m); if (!c) fails++; }
static double dB(double a) { return 20 * std::log10(a + 1e-300); }

struct Run { std::vector<float> L; he::Telemetry tm; double hold = 0, freeze = 0; bool drone = true, sting = true; };
// the scene, rendered block by block; `bye` < 0: no GOODBYE; `more` adds events at block b
static Run scene(double sr, double end, double bye, std::function<void(he::Host&, int)> more = nullptr) {
  std::vector<double> P(he::NPARAM); for (int k = 0; k < he::NPARAM; k++) P[k] = he::PARAMS[k].def;
  P[he::P_AURA_HOLD] = 1; P[he::P_REV_DECAY] = 30; P[he::P_REV_MIX] = 1; P[he::P_REV_SIZE] = 1;
  he::Host h(sr); h.init(P.data(), 1337);
  auto B = [&](double t) { return (int)std::lround(t * sr / he::BL); };
  int nb = B(end); Run r; r.L.resize((size_t)nb * he::BL); std::vector<float> R(he::BL);
  for (int b = 0; b < nb; b++) {
    if (b == B(.1)) h.loop("rec");
    for (int k = 0; k < 2; k++) { if (b == B(.15 + k * .9)) h.gesture(he::BOWED, 'd', .3, .4, .6); if (b > B(.15 + k * .9) && b < B(.9 + k * .9)) h.gesture(he::BOWED, 'm', .3 + .2 * std::sin(b * .05), .4, .7); if (b == B(.9 + k * .9)) h.gesture(he::BOWED, 'u', 0, 0, 0); }
    if (b == B(2)) h.loop("stop");
    if (b == B(2.05)) h.loop("ghost", 1, 1);
    if (b == B(2.1)) h.gesture(he::EBOW, 'd', .4, .5, .7);
    if (b > B(2.1) && b < B(3.4)) h.gesture(he::EBOW, 'm', .4 + .1 * std::sin(b * .03), .5, .7);
    if (b == B(3.4)) h.gesture(he::EBOW, 'u', 0, 0, 0);
    if (b == B(2.4)) h.moment(he::M_DRONE, true);
    if (b == B(3)) h.setParam(he::P_AURA_FREEZE, 1);
    if (b == B(3.5)) h.moment(he::M_STINGER, true);
    if (bye >= 0 && b == B(bye)) h.panic();
    if (more) more(h, b);
    h.block(&r.L[(size_t)b * he::BL], R.data());
  }
  h.telemetry(r.tm); r.hold = h.param(he::P_AURA_HOLD); r.freeze = h.param(he::P_AURA_FREEZE);
  r.drone = h.momentActive(he::M_DRONE); r.sting = h.momentActive(he::M_STINGER);
  return r;
}
static double peak(const std::vector<float>& x, size_t a, size_t b) { double m = 0; for (size_t i = a; i < b && i < x.size(); i++) m = std::fmax(m, std::fabs(x[i])); return m; }
// high-frequency energy: rms of the second difference
static double hf(const std::vector<float>& x, size_t a, size_t b) { double s = 0; for (size_t i = a + 2; i < b; i++) { double d = x[i] - 2 * x[i - 1] + x[i - 2]; s += d * d; } return std::sqrt(s / (b - a)); }

int main() {
  char m[300];
  for (double sr : {44100.0, 48000.0, 96000.0}) {
    int bb = (int)std::lround(4.0 * sr / he::BL); size_t t0 = (size_t)bb * he::BL, n25 = (size_t)std::lround(.025 * sr), n50 = (size_t)std::lround(.05 * sr);
    Run a = scene(sr, 6, 4.0), ref = scene(sr, 6, -1);
    double before = peak(a.L, t0 - (size_t)(.5 * sr), t0), after = peak(a.L, t0 + n50, a.L.size());
    std::snprintf(m, sizeof m, "%6.0f Hz: loud before GOODBYE (%.1f dBFS), %.1f dBFS from 50 ms on (Aura hold, Freeze, ghost layer, drone, stinger, 30 s hall)", sr, dB(before), dB(after));
    ok(before > std::pow(10, -30 / 20.0) && after < std::pow(10, -90 / 20.0), m);
    bool same = true; for (size_t i = 0; i < t0; i++) if (a.L[i] != ref.L[i]) { same = false; break; }
    ok(same, "  identical to the same scene without GOODBYE up to the press");
    double hA = hf(a.L, t0, t0 + n25), hR = hf(ref.L, t0, t0 + n25), last = peak(a.L, t0 + n25 - (size_t)(.001 * sr), t0 + n25);
    std::snprintf(m, sizeof m, "  no click: high-frequency energy over the fade %.1f dB vs %.1f dB without GOODBYE; last ms of the fade %.1f dB under the peak", dB(hA), dB(hR), dB(before) - dB(last));
    ok(hA <= hR * 1.0001 && last < before * .01, m);
    ok(a.hold < .5 && a.freeze < .5 && !a.drone && !a.sting, "  Aura hold and Freeze off, moments stopped");
    ok(a.tm.nLayers == 1 && a.tm.layers[0].mute, "  the looper layer is kept, muted");
    // nothing restarts by itself; the next touch plays normally
    Run c = scene(sr, 7, 4.0, [&](he::Host& h, int b) { if (b == (int)std::lround(6 * sr / he::BL)) h.gesture(he::STRUCK, 'd', .5, .5, .7); });
    size_t t6 = (size_t)std::lround(6 * sr / he::BL) * he::BL;
    double quiet = peak(c.L, t0 + n50, t6), next = peak(c.L, t6, c.L.size());
    std::snprintf(m, sizeof m, "  silent until the next touch (peak %.1f dB), which then sounds (%.1f dBFS)", dB(quiet), dB(next));
    ok(quiet == 0 && next > std::pow(10, -40 / 20.0), m);
    // a touch during the fade waits for it, then sounds
    Run d = scene(sr, 5, 4.0, [&](he::Host& h, int b) { if (b == bb + 2) h.gesture(he::STRUCK, 'd', .5, .5, .7); });
    std::snprintf(m, sizeof m, "  a touch during the fade is held back and then plays (%.1f dBFS)", dB(peak(d.L, t0 + n50, d.L.size())));
    ok(peak(d.L, t0 + n25 + he::BL, d.L.size()) > std::pow(10, -40 / 20.0), m);
    // unmuting the layer plays it again; Hold on again works
    Run e = scene(sr, 6, 4.0, [&](he::Host& h, int b) { if (b == bb + 40) h.loop("mute", 1, 0); });
    std::snprintf(m, sizeof m, "  unmuting the layer plays it again (%.1f dBFS)", dB(peak(e.L, t0 + n50, e.L.size())));
    ok(peak(e.L, t0 + n50, e.L.size()) > std::pow(10, -50 / 20.0), m);
    Run f = scene(sr, 6, 4.0, [&](he::Host& h, int b) { if (b == bb + 40) { h.setParam(he::P_AURA_HOLD, 1); h.gesture(he::STRUCK, 'd', .5, .5, .7); } });
    ok(f.hold > .5 && peak(f.L, t0 + n50, f.L.size()) > 0, "  Hold switched back on is kept and plays");
    // Double-GOODBYE with Struck Metal (regression test for Struck pool self-pointer aliasing after copy-assign)
    {
      std::vector<double> P(he::NPARAM); for (int k = 0; k < he::NPARAM; k++) P[k] = he::PARAMS[k].def;
      P[he::P_STRUCK_OBJECT] = 2; // Bell (long decay)
      P[he::P_REV_MIX] = 0;
      he::Host h(sr); h.init(P.data(), 1337);
      auto B = [&](double t) { return (int)std::lround(t * sr / he::BL); };
      int nb = B(2.5); std::vector<float> L((size_t)nb * he::BL), R(he::BL);
      for (int b = 0; b < nb; b++) {
        if (b == B(.05)) h.gesture(he::STRUCK, 'd', .5, .5, .9);
        if (b == B(.30)) h.panic();
        if (b == B(.80)) h.gesture(he::STRUCK, 'd', .6, .5, .9);
        if (b == B(1.20)) h.panic();
        if (b == B(1.40)) h.gesture(he::STRUCK, 'u', 0, 0, 0); // lift byeQuiet gate without new trigger
        h.block(&L[(size_t)b * he::BL], R.data());
      }
      double p1 = peak(L, (size_t)B(.05) * he::BL, (size_t)B(.30) * he::BL);
      double p2 = peak(L, (size_t)B(.80) * he::BL, (size_t)B(1.20) * he::BL);
      double after2 = peak(L, (size_t)B(1.45) * he::BL, L.size());
      std::snprintf(m, sizeof m, "  double-GOODBYE Struck Bell: strike1 %.1f dBFS, strike2 %.1f dBFS, after 2nd panic %.1f dBFS", dB(p1), dB(p2), dB(after2));
      ok(p1 > 0.05 && p2 > 0.05 && after2 < std::pow(10, -90 / 20.0), m);
    }
  }
  std::printf(fails ? "%d failed\n" : "all passed\n", fails);
  return fails ? 1 : 0;
}
