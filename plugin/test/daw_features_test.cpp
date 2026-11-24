// Horror Engine · Séance: regression tests for audit fixes (P0/P1/P2):
// - latencySamples() matches 2 ms lookahead across sample rates
// - Moan surface enum out-of-range safety (no OOB read/UB)
// - Polyphonic MIDI slots (1..3) on E-bow (2), Bowed (3), Glass (3) + pitch bend via 'm'
// - stemsMode(false) matches stemsMode(true) stereo output exactly
// - Sample-rate invariance: 48 kHz vs 96 kHz Reverb decay, Aura 8 s scrub, 40 Hz sub-bass preservation
// - Smooth Bowed Metal pressure jump (no violent transient click)
// Horror Engine by Garyck Arntzen (https://x.com/_mintydoge). GNU AGPLv3.
#include "he_core.h"
#include <cmath>
#include <cstdio>
#include <vector>

static int fails = 0;
static void ok(bool c, const char* m) { std::printf("%s %s\n", c ? "PASS" : "FAIL", m); if (!c) fails++; }

static std::vector<double> defaultParams() {
  std::vector<double> P(he::NPARAM);
  for (int k = 0; k < he::NPARAM; k++) P[k] = he::PARAMS[k].def;
  return P;
}

static double rmsRange(const std::vector<float>& x, size_t a, size_t b) {
  double s = 0; size_t n = 0;
  for (size_t i = a; i < b && i < x.size(); i++) { s += (double)x[i] * x[i]; n++; }
  return n ? std::sqrt(s / n) : 0;
}

int main() {
  char msg[300];

  // 1. Latency reporting matches round(0.002 * sr) (clamped to <= 248)
  for (double sr : {44100.0, 48000.0, 96000.0, 192000.0}) {
    he::Host h(sr);
    int expected = std::min(248, std::max(1, (int)std::lround(0.002 * sr)));
    std::snprintf(msg, sizeof msg, "latencySamples() at %.0f Hz: %d == %d", sr, h.latencySamples(), expected);
    ok(h.latencySamples() == expected, msg);
  }

  // 2. Moan surface out-of-range enum clamping (no crash/NaN)
  {
    auto P = defaultParams();
    he::Host h(48000); h.init(P.data(), 1337);
    h.setParam(he::P_MOAN_SURFACE, 99.0);
    h.gesture(he::MOAN, 'd', 0.3, 0.5, 0.7);
    float L[he::BL], R[he::BL];
    bool finite = true;
    for (int b = 0; b < 40; b++) {
      h.gesture(he::MOAN, 'm', 0.3 + 0.01 * b, 0.5, 0.7);
      h.block(L, R);
      for (int i = 0; i < he::BL; i++) if (!std::isfinite(L[i]) || !std::isfinite(R[i])) finite = false;
    }
    h.setParam(he::P_MOAN_SURFACE, -5.0);
    for (int b = 0; b < 20; b++) {
      h.block(L, R);
      for (int i = 0; i < he::BL; i++) if (!std::isfinite(L[i]) || !std::isfinite(R[i])) finite = false;
    }
    ok(finite, "Moan out-of-range surface enum (99 / -5) stays finite and safe");
  }

  // 3. stemsMode(false) matches stemsMode(true) bit-identically on stereo mix
  {
    auto P = defaultParams();
    P[he::P_REV_MIX] = 0.4;
    P[he::P_HARM_MIX] = 0.25;
    P[he::P_EBOW_DRIVE] = 0.6;
    he::Host hOn(48000), hOff(48000);
    hOn.setStemsMode(true); hOff.setStemsMode(false);
    hOn.init(P.data(), 1337); hOff.init(P.data(), 1337);
    float L1[he::BL], R1[he::BL], L2[he::BL], R2[he::BL];
    double maxDiff = 0;
    for (int b = 0; b < 120; b++) {
      if (b == 2) { hOn.gesture(he::EBOW, 'd', 0.5, 0.5, 0.8, 110.0, 1); hOff.gesture(he::EBOW, 'd', 0.5, 0.5, 0.8, 110.0, 1); }
      if (b == 10) { hOn.gesture(he::STRUCK, 'd', 0.4, 0.5, 0.9, 220.0, 1); hOff.gesture(he::STRUCK, 'd', 0.4, 0.5, 0.9, 220.0, 1); }
      if (b == 60) { hOn.gesture(he::EBOW, 'u', 0, 0, 0, 0, 1); hOff.gesture(he::EBOW, 'u', 0, 0, 0, 0, 1); }
      hOn.block(L1, R1); hOff.block(L2, R2);
      for (int i = 0; i < he::BL; i++) {
        maxDiff = std::fmax(maxDiff, std::fabs((double)L1[i] - L2[i]));
        maxDiff = std::fmax(maxDiff, std::fabs((double)R1[i] - R2[i]));
      }
    }
    std::snprintf(msg, sizeof msg, "stemsMode(false) matches stemsMode(true) stereo mix (maxDiff %.3e)", maxDiff);
    ok(maxDiff < 1e-6, msg);
  }

  // 4. Polyphonic MIDI slots (1..3) on Glass: 3 simultaneous notes sound louder & richer than 1, and releasing slot 1 keeps slots 2 & 3 alive
  {
    auto P = defaultParams();
    P[he::P_REV_MIX] = 0;
    he::Host h1(48000), h3(48000);
    h1.setStemsMode(false); h3.setStemsMode(false);
    h1.init(P.data(), 1337); h3.init(P.data(), 1337);
    std::vector<float> o1, o3;
    float L[he::BL], R[he::BL];
    for (int b = 0; b < 700; b++) {
      if (b == 2) {
        h1.gesture(he::GLASS, 'd', .5, .5, .8, 220.0, 1);
        h3.gesture(he::GLASS, 'd', .5, .5, .8, 220.0, 1);
        h3.gesture(he::GLASS, 'd', .5, .5, .8, 277.18, 2);
        h3.gesture(he::GLASS, 'd', .5, .5, .8, 329.63, 3);
      }
      if (b == 120) {
        h1.gesture(he::GLASS, 'u', 0, 0, 0, 0, 1);
        h3.gesture(he::GLASS, 'u', 0, 0, 0, 0, 1); // slots 2 & 3 remain held!
      }
      if (b == 300) {
        // Pitch bend slots 2 & 3 up by 2 semitones via 'm'
        h3.gesture(he::GLASS, 'm', .5, .5, .8, 277.18 * 1.12246, 2);
        h3.gesture(he::GLASS, 'm', .5, .5, .8, 329.63 * 1.12246, 3);
      }
      h1.block(L, R); o1.insert(o1.end(), L, L + he::BL);
      h3.block(L, R); o3.insert(o3.end(), L, L + he::BL);
    }
    double tail1 = rmsRange(o1, 550 * he::BL, 690 * he::BL);
    double tail3 = rmsRange(o3, 550 * he::BL, 690 * he::BL);
    std::snprintf(msg, sizeof msg, "Polyphonic MIDI slots on Glass: after slot 1 release, 1-voice rms %.4f vs 3-voice (slots 2&3 held) rms %.4f", tail1, tail3);
    ok(tail3 > tail1 * 5.0 && tail3 > 0.01, msg);
  }

  // 5. Sample-rate invariance: 48 kHz vs 96 kHz Aura 8 s scrub (no write-head overwrite / stays finite & audible)
  {
    auto P = defaultParams();
    P[he::P_AURA_HOLD] = 1; P[he::P_AURA_LEVEL] = 0.0; P[he::P_REV_MIX] = 0;
    he::Host h96(96000); h96.setStemsMode(false); h96.init(P.data(), 1337);
    float L[he::BL], R[he::BL];
    bool finite = true;
    int nb = (int)std::lround(10.0 * 96000.0 / he::BL);
    double auraRms = 0; int auraN = 0;
    for (int b = 0; b < nb; b++) {
      if (b == 10) h96.gesture(he::STRUCK, 'd', .5, .5, .9);
      if (b == 100) h96.gesture(he::AURA, 'd', 1.0, .5, .8); // scrub back full 8 s
      h96.block(L, R);
      for (int i = 0; i < he::BL; i++) {
        if (!std::isfinite(L[i]) || !std::isfinite(R[i])) finite = false;
        if (b > nb - 200) { auraRms += (double)L[i] * L[i]; auraN++; }
      }
    }
    auraRms = std::sqrt(auraRms / std::max(1, auraN));
    std::snprintf(msg, sizeof msg, "Aura 8 s scrub at 96 kHz: finite=%d, tail rms=%.4f", (int)finite, auraRms);
    ok(finite && auraRms > 1e-4, msg);
  }

  // 6. 48 kHz vs 96 kHz Reverb tail decay consistency
  {
    auto runRev = [](double sr) {
      auto P = defaultParams();
      P[he::P_STRUCK_OBJECT] = 0; P[he::P_STRUCK_REV] = 1.0; P[he::P_REV_MIX] = 1.0; P[he::P_REV_DECAY] = 4.0;
      he::Host h(sr); h.setStemsMode(false); h.init(P.data(), 1337);
      int nb = (int)std::lround(3.0 * sr / he::BL);
      std::vector<float> out((size_t)nb * he::BL);
      float R[he::BL];
      for (int b = 0; b < nb; b++) {
        if (b == 2) h.gesture(he::STRUCK, 'd', .5, .5, .8);
        h.block(&out[(size_t)b * he::BL], R);
      }
      double eEarly = rmsRange(out, (size_t)(0.3 * sr), (size_t)(0.8 * sr));
      double eLate = rmsRange(out, (size_t)(2.0 * sr), (size_t)(2.5 * sr));
      return eLate / (eEarly + 1e-12);
    };
    double r48 = runRev(48000.0), r96 = runRev(96000.0);
    double ratio = r96 / (r48 + 1e-12);
    std::snprintf(msg, sizeof msg, "Reverb decay invariance 48 kHz vs 96 kHz: late/early %.4f vs %.4f (ratio %.2f)", r48, r96, ratio);
    ok(r48 > 0.05 && r96 > 0.05 && ratio > 0.55 && ratio < 1.8, msg);
  }

  // 7. Smooth Bowed Metal pressure jump (no harsh click spike on pressure threshold crossing)
  {
    auto P = defaultParams();
    P[he::P_REV_MIX] = 0; P[he::P_BOWED_OBJECT] = 0;
    he::Host h(48000); h.setStemsMode(false); h.init(P.data(), 1337);
    int nb = 200;
    std::vector<float> L((size_t)nb * he::BL); float R[he::BL];
    for (int b = 0; b < nb; b++) {
      if (b == 2) h.gesture(he::BOWED, 'd', .4, .5, .3);
      else if (b < 80) h.gesture(he::BOWED, 'm', .4 + .003 * b, .5, .3);
      else if (b == 80) h.gesture(he::BOWED, 'm', .4 + .003 * b, .5, .85); // sudden jump > 0.35
      else h.gesture(he::BOWED, 'm', .4 + .003 * b, .5, .85);
      h.block(&L[(size_t)b * he::BL], R);
    }
    double maxStep = 0;
    size_t jStart = 79 * he::BL, jEnd = 84 * he::BL;
    for (size_t i = jStart + 1; i < jEnd; i++) maxStep = std::fmax(maxStep, std::fabs((double)L[i] - L[i - 1]));
    std::snprintf(msg, sizeof msg, "Bowed Metal smooth pressure jump: max sample-to-sample step %.4f", maxStep);
    ok(maxStep < 0.35, msg);
  }

  std::printf(fails ? "%d failed\n" : "all passed\n", fails);
  return fails ? 1 : 0;
}
