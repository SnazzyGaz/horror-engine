// Superball (Moan) is mixed as stereo but used to write only the left work buffer, so a leftover 128-sample right
// buffer was replayed every block as a constant tone at sr/128 (and its harmonics) after the voice went silent.
// After the fix it writes R = L, and both work buffers are cleared before each voice is rendered.
// Horror Engine by Garyck Arntzen (https://x.com/_mintydoge). GNU AGPLv3.
#include "he_core.h"
#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif
#include <cmath>
#include <cstdio>
#include <vector>

static int fails = 0;
static void ok(bool c, const char* m) { std::printf("%s %s\n", c ? "PASS" : "FAIL", m); if (!c) fails++; }
static double dB(double a) { return 20 * std::log10(a + 1e-300); }
static double peak(const std::vector<float>& x, size_t a, size_t b) {
  double m = 0; for (size_t i = a; i < b && i < x.size(); i++) m = std::fmax(m, std::fabs(x[i])); return m;
}
static double goertzel(const std::vector<float>& x, size_t a, size_t b, double freq, double sr) {
  double w = 2 * M_PI * freq / sr, coeff = 2 * std::cos(w), s0 = 0, s1 = 0, s2 = 0;
  size_t end = b < x.size() ? b : x.size();
  for (size_t i = a; i < end; i++) { s0 = (double)x[i] + coeff * s1 - s2; s2 = s1; s1 = s0; }
  size_t n = end > a ? end - a : 1;
  return std::sqrt(s1 * s1 + s2 * s2 - coeff * s1 * s2) / (double)n * 2;
}

struct Take { std::vector<float> L, R; double sr; };
static Take scene(double sr) {
  std::vector<double> P(he::NPARAM); for (int k = 0; k < he::NPARAM; k++) P[k] = he::PARAMS[k].def;
  P[he::P_REV_MIX] = 0; P[he::P_BODY_AMT] = 0; P[he::P_HARM_MIX] = 0;
  P[he::P_MOAN_REV] = 0; P[he::P_MOAN_SPR] = 0; P[he::P_MOAN_HSEND] = 0;
  P[he::P_AURA_HOLD] = 0; P[he::P_AURA_FREEZE] = 0;
  he::Host h(sr); h.init(P.data(), 1337);
  auto B = [&](double t) { return (int)std::lround(t * sr / he::BL); };
  int nb = B(4.5); Take r; r.sr = sr; r.L.resize((size_t)nb * he::BL); r.R.resize((size_t)nb * he::BL);
  auto stroke = [&](int b, double t0, double t1, int s) {
    if (b == B(t0)) h.gesture(s, 'd', .2, .5, .9);
    if (b > B(t0) && b < B(t1)) {
      double u = (b * he::BL / sr - t0) / (t1 - t0);
      h.gesture(s, 'm', .2 + .5 * u, .5, .9);
    }
    if (b == B(t1)) h.gesture(s, 'u', 0, 0, 0);
  };
  for (int b = 0; b < nb; b++) {
    stroke(b, .05, .35, he::SPRING);
    if (b == B(.40)) h.panic();
    stroke(b, .70, 1.30, he::MOAN);
    h.block(&r.L[(size_t)b * he::BL], &r.R[(size_t)b * he::BL]);
  }
  return r;
}

int main() {
  char m[400];
  for (double sr : {44100.0, 48000.0, 96000.0}) {
    Take r = scene(sr);
    auto F = [&](double t) { return (size_t)std::lround(t * sr / he::BL) * he::BL; };
    double during = peak(r.L, F(.80), F(1.20));
    std::snprintf(m, sizeof m, "%6.0f Hz: Superball itself sounds (peak %.1f dBFS)", sr, dB(during));
    ok(during > std::pow(10, -40 / 20.0), m);
    size_t after = F(1.30), limN = (size_t)std::lround(sr);
    double lim = std::pow(10, -80 / 20.0);
    size_t silent = after;
    for (size_t i = after; i + 128 < r.L.size(); i += 128) {
      if (peak(r.L, i, i + 128) < lim && peak(r.R, i, i + 128) < lim * 8) { silent = i; break; }
    }
    if (silent + limN > r.L.size()) silent = r.L.size() - limN;
    size_t b = silent + limN; if (b > r.L.size()) b = r.L.size();
    double fund = sr / he::BL, worst = 0;
    std::printf("%6.0f Hz: after Superball is silent (from %.2f s):\n", sr, silent / sr);
    for (int h = 1; h <= 4; h++) {
      std::vector<float> mid(b - silent);
      for (size_t i = 0; i < mid.size(); i++) mid[i] = 0.5f * (r.L[silent + i] + r.R[silent + i]);
      double eL = goertzel(r.L, silent, b, fund * h, sr);
      double eR = goertzel(r.R, silent, b, fund * h, sr);
      double eM = goertzel(mid, 0, mid.size(), fund * h, sr);
      worst = std::fmax(worst, std::fmax(eL, std::fmax(eR, eM)));
      std::printf("  %.2f Hz  L %.1f  R %.1f  mid %.1f dBFS\n", fund * h, dB(eL), dB(eR), dB(eM));
    }
    std::snprintf(m, sizeof m, "%6.0f Hz: no block-rate energy (sr/128 and harmonics) after Superball is silent (worst %.1f dBFS, fund %.2f Hz)",
                  sr, dB(worst), fund);
    ok(worst < std::pow(10, -90 / 20.0), m);
  }
  std::printf(fails ? "%d failed\n" : "all passed\n", fails);
  return fails ? 1 : 0;
}
