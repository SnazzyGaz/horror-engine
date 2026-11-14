// Internal: shared helpers and the engine state the voices read. Part of the C++ port of src/engine.js.
// (c) 2026 Garyck Arntzen (https://x.com/_mintydoge), MIT licence.
#pragma once
#include <cmath>
#include <cstdint>
#include <cstring>
#include <vector>
#include "he_core.h"

namespace he {

static const double TAU = 6.283185307179586, PI = 3.141592653589793;   // Math.PI (M_PI is not standard C++)
static inline double clamp(double x, double a, double b) { return x < a ? a : x > b ? b : x; }
static inline double db(double x) { return std::pow(10.0, x / 20.0); }
static inline double pw(double d, double a, double b, double c) { return d < .5 ? a + (b - a) * d * 2 : b + (c - b) * (d - .5) * 2; }
// JavaScript Math.round: halves go up
static inline double jsround(double x) { return std::floor(x + .5); }
// JavaScript "x | 0" for values in int range: truncate toward zero
static inline int64_t trunc64(double x) { return (int64_t)x; }
static inline double fmax2(double a, double b) { return a > b ? a : b; }
static inline double fmin2(double a, double b) { return a < b ? a : b; }

// xorshift32, exactly as Rng in engine.js
struct Rng {
  uint32_t s;
  explicit Rng(uint32_t seed = 1337) : s(seed ? seed : 1) {}
  double u() { uint32_t x = s; x ^= x << 13; x ^= x >> 17; x ^= x << 5; s = x; return x / 4294967296.0; }
  double b() { return u() * 2 - 1; }
};

// a block-sized float buffer (the JavaScript Float32Array(128) scratch buffers)
struct FB { float d[BL]; FB() { std::memset(d, 0, sizeof d); } float& operator[](int i) { return d[i]; } float operator[](int i) const { return d[i]; } void fill0() { std::memset(d, 0, sizeof d); } };

// harmonic generator (HG in engine.js)
struct HG {
  double pk = 0, ms = 0, d1 = 0, d2 = 0;
  void run(float* x, int n, double c2, double c3, double c4, double c5, double k, bool rm = false) {
    double pk0 = pk, ms0 = ms, e1 = d1, e2 = d2, rel = 1 - k;
    for (int i = 0; i < n; i++) {
      double v = x[i], av = v < 0 ? -v : v, a; pk0 = av > pk0 ? av : pk0 * rel;
      if (rm) { ms0 += k * (v * v - ms0); a = std::sqrt(2 * ms0) + 1e-9; } else a = pk0 + 1e-9;
      double u = v / a; if (u > 1.3) u = 1.3; else if (u < -1.3) u = -1.3;
      double u2 = u * u, ev = a * (c2 * (2 * u2 - 1) + c4 * (8 * u2 * u2 - 8 * u2 + 1)), od = a * u * (c3 * (4 * u2 - 3) + c5 * (16 * u2 * u2 - 20 * u2 + 5));
      e2 = ev - e1 + .995 * e2; e1 = ev; x[i] = (float)(v + e2 + od);
    }
    pk = pk0 + 1e-18; ms = ms0 + 1e-18; d1 = e1; d2 = e2 + 1e-18;
  }
};

// a contact on a voice instance (Engine.Cv entries) and a gesture slot (Slot)
struct Slot { int src = -1; bool on = false; double tx = .5, ty = .5, x = .5, y = .5, p = .6, spd = 0, hz = 0, autoSpd = -1, kick = 0; explicit Slot(int s = -1) : src(s) {} };
struct Contact { bool on = false; double x = .5, y = .5, p = .6, spd = 0, hz = 0; bool autoOn = false; Slot* own = nullptr; double kick = 0; };

// what every voice may read from the engine
struct EState {
  // the sample rate must be set before Engine's members (voices, hall) are built: they read it in their constructors
  EState() = default; explicit EState(double s) : sr(s) {}
  double sr = 48000; Rng rng{1337}; double P[NPARAM] = {};
  double dread = .2, distance = .15, material = .5, pitchSt = 0, pitchMul = 1, mPitch = 0, mDread = 0, mAura = 0;
  double instab = 1, detune = 2, rough = 0, subAmt = 0, driveOff = 0, matT = 1, matSlope = 1, matStretch = 0, matBright = .7;
  double water = 0, wv[16] = {}, wLevel = 0, wTilt = 0, strX = .5, dr2 = 0, symG = 0; bool autoFreeze = false;
  const float* symIn = nullptr; const void* src0 = nullptr;
};
// waterphone immersion (immerse in engine.js)
static inline double immerse(const EState* E, double x) { double d = E->wLevel + .8 * E->wTilt * (2 * x - 1); return 1 - .06 * (d < 0 ? 0 : d > 1 ? 1 : d); }
static inline double rulerHz(double Lcm) { double L = Lcm / 100; return .652 / (L * L); }

// a voice: render one block into L (and R for stereo voices)
struct Voice_ { virtual ~Voice_() {} virtual void reset() = 0; virtual void render(float* L, float* R, int n, Contact& C) = 0; };

}  // namespace he
