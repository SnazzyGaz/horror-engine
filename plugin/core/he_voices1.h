// Internal: voices I-V (E-bow string, hurdy-gurdy, friction bank, bowed metal, glass, struck metal).
// Line-for-line port of src/engine.js. Horror Engine (c) 2026 Garyck Arntzen (https://x.com/_mintydoge). GNU AGPLv3 (see LICENSE).
#pragma once
#include "he_state.h"

namespace he {

// ---------- E-bow tuning table: extra loop delay in samples (rows: loss coefficient c; columns: log2 loop length)
static const double EB_C[7] = {.5, .558, .615, .692, .769, .884, .98};
static const double EB_T[7][15] = {{-1.036,-1.023,-0.979,-0.875,-0.64,-0.236,0.579,2.107,5.513,11.487,22.485,44.995,85.469,152.93,266.53},{-1.096,-1.074,-1.023,-0.939,-0.754,-0.45,0.163,1.264,3.783,8.077,16.246,34.518,66.395,126.115,223.202},{-1.135,-1.109,-1.062,-0.994,-0.861,-0.66,-0.267,0.387,1.723,4.393,9.334,19.768,40.528,78.795,147.219},{-1.166,-1.139,-1.094,-1.032,-0.932,-0.782,-0.513,-0.098,0.661,2.12,4.551,10.41,20.906,43.85,85.368},{-1.187,-1.149,-1.117,-1.053,-0.967,-0.832,-0.609,-0.283,0.268,1.307,2.901,6.471,13.562,27.882,52.706},{-1.214,-1.163,-1.146,-1.075,-0.988,-0.867,-0.671,-0.397,0.037,0.84,1.971,4.291,8.922,17.204,36.116},{-1.226,-1.174,-1.15,-1.091,-0.996,-0.881,-0.689,-0.433,-0.02,0.73,1.743,3.693,7.794,15.15,31.371}};
static inline double ebowTune(double Pp, double c) {
  double x = (std::log(Pp) / std::log(2.0) - 5) * 2; if (x < 0) x = 0; else if (x > 13.999) x = 13.999;
  if (c < .5) c = .5; else if (c > .98) c = .98;
  int j = 0; while (j < 5 && c > EB_C[j + 1]) j++;
  double u = (c - EB_C[j]) / (EB_C[j + 1] - EB_C[j]); int i = (int)x; double v = x - i; const double* A = EB_T[j]; const double* B = EB_T[j + 1];
  return (A[i] * (1 - v) + A[i + 1] * v) * (1 - u) + (B[i] * (1 - v) + B[i + 1] * v) * u;
}

/* ---------- 1. E-bow string: waveguide loop with a self-oscillating electromagnetic driver ---------- */
struct Ebow : Voice_ {
  EState* E; static const int N = 16384, mask = N - 1;
  std::vector<float> b[2], ih[2];
  int64_t w = 0; double lp[2] = {}, env[2] = {}, agc[2] = {}, bx1[2] = {}, bx2[2] = {}, by1[2] = {}, by2[2] = {}, apX[2] = {}, apY[2] = {};
  double f = 0, dr = 0, drift = 0; int h = 1; double hT = 0, sph = 0, dc1 = 0, dc2 = 0, hm = 1; HG hg;
  struct { double b0, a1, a2, x1 = 0, x2 = 0, y1 = 0, y2 = 0, env = 0; } pz;
  explicit Ebow(EState* e) : E(e) {
    for (int k = 0; k < 2; k++) { b[k].assign(N, 0.f); ih[k].assign(N, 0.f); }
    double w0 = TAU * 250 / E->sr, al = std::sin(w0) / (2 * .8), a0 = 1 + al;
    pz.b0 = (1 + std::cos(w0)) / 2 / a0; pz.a1 = -2 * std::cos(w0) / a0; pz.a2 = (1 - al) / a0;
  }
  void reset() override {
    for (int k = 0; k < 2; k++) { std::fill(b[k].begin(), b[k].end(), 0.f); std::fill(ih[k].begin(), ih[k].end(), 0.f); lp[k] = env[k] = agc[k] = bx1[k] = bx2[k] = by1[k] = by2[k] = apX[k] = apY[k] = 0; }
    dr = 0; pz.x1 = pz.x2 = pz.y1 = pz.y2 = pz.env = 0;
  }
  void render(float* L, float*, int n, Contact& C) override {
    const double* P = E->P;
    const float* sym = (this == E->src0 && E->symG > 0) ? E->symIn : nullptr; double symG = E->symG;
    double sr = E->sr, D = E->dread; Rng& rng = E->rng; double slack = P[P_EBOW_SLACK], damp = P[P_EBOW_DAMP];
    int exm = (int)P[P_EBOW_EXCITE]; double slideR = P[P_EBOW_SLIDE] != 0 ? P[P_EBOW_SLIDE] : 1;
    double base = C.hz > 0 ? C.hz : P[P_EBOW_PITCH] * std::pow(2.0, (C.x - .5) * 2 * slideR);
    drift = drift * std::pow(.995, 48000.0 / sr) + rng.b() * .1 * std::sqrt(48000.0 / sr);
    double fT = clamp(base * E->pitchMul * std::pow(2.0, drift * slack * 4 * E->instab / 1200), sr / 7000, 2500);
    if (f == 0) f = fT;
    f += (fT - f) * srAlpha(.3, sr);
    double fr0 = f;
    double dT = C.on && !exm ? clamp(P[P_EBOW_SUSTAIN] * (.3 + .7 * C.p) + C.spd * .5, 0, 1.3) : 0;
    int hp = (int)P[P_EBOW_HARM], hh = hp + 1;
    if (hp == 3) {
      hT -= n;
      if (hT <= 0) { double q = dT + D; if (q > .9 && rng.u() < (q - .8)) h = rng.u() < .5 ? 2 : 3; else h = 1; hT = sr * (.3 + rng.u() * 1.5); }
      hh = h;
    }
    double T60 = .5 + 9 * (1 - damp) * (1 - damp) * (.5 + E->matT * .5);
    double g = std::pow(10.0, -3 / (T60 * fr0));
    double c48 = clamp(.5 + .48 * (1 - damp) * (.6 + .4 * E->material), .05, .98);
    double c = srAlpha(c48, sr);
    double kT = slack * .06, eR = 1 / .25, kN = 1 + kT * .6, buzz = P[P_EBOW_BUZZ], thr = 1.1 - buzz * .9;
    double pos = clamp(P[P_EBOW_POS] + (C.on && C.hz <= 0 ? (C.y - .5) * .2 : 0), .03, .5);
    double det = std::pow(2.0, (3 + E->detune) / 1200), sub = E->subAmt;
    double fh = fmin2(fr0 * hh, sr * .4), w0 = TAU * fh / sr, al = std::sin(w0) / 8, a0 = 1 / (1 + al), b0 = al * a0, a1 = -2 * std::cos(w0) * a0, a2 = (1 - al) * a0;
    double drUp = srAlpha(.0008, sr), drDn = srAlpha(.001, sr), envC = srAlpha(.0006, sr), agcC = srAlpha(.003, sr);
    int64_t ww = w; double drr = dr, dinc = TAU * fr0 * .5 / sr;
    for (int i = 0; i < n; i++) L[i] = 0;
    for (int k = 0; k < 2; k++) {
      float* bb = b[k].data(); float* ihh = ih[k].data();
      double lpk = lp[k], envk = env[k], agck = agc[k], x1 = bx1[k], x2 = bx2[k], y1 = by1[k], y2 = by2[k], ax = apX[k], ay0 = apY[k];
      double Pp = sr / (k ? fr0 * det : fr0), t0 = ebowTune(32, c48), Lb = Pp - (1 - c) / c + 1.3 + t0 + (ebowTune(Pp * 48000 / sr, c48) - t0) * sr / 48000, amp = k ? .6 : 1;
      ww = w; drr = dr;
      if (C.kick > 0) {
        double Lk = fmin2(Lb, N - 2), ka = C.kick * (exm == 2 ? .9 : 1.4) * amp;
        for (int j = 0; j < Lk; j++) { double u = j / Lk, sh = exm == 2 ? (u < .2 ? u / .2 : (1 - u) / .8) : (u > .06 && u < .2 ? std::sin(PI * (u - .06) / .14) : 0); float& t = bb[(ww - 1 - j) & mask]; t = (float)(t + ka * sh); }
        envk = fmax2(envk, .02);
      }
      for (int i = 0; i < n; i++) {
        drr += (dT - drr) * (dT > drr ? drUp : drDn);
        double A = envk * eR, Le = fmax2(2.0, Lb * kN / (1 + kT * fmin2(A * A, 4)));
        // 1st-order Thiran allpass fractional delay (unity magnitude at all frequencies, no slide damping ripple)
        double rp = (double)ww - Le, i0 = std::floor(rp), fr = rp - i0; int64_t ii = (int64_t)i0;
        double y = bb[ii & mask] * (1 - fr) + bb[(ii + 1) & mask] * fr;
        lpk += c * (y - lpk);
        double ay = y < 0 ? -y : y; envk += envC * (ay - envk);
        double bp = b0 * (y - x2) - a1 * y1 - a2 * y2; x2 = x1; x1 = y; y2 = y1; y1 = bp;
        double ab = bp < 0 ? -bp : bp; agck += agcC * (ab - agck);
        double q2 = 1.5 * bp / (agck + .01); q2 = q2 / (1 + (q2 < 0 ? -q2 : q2));
        double inj = drr * (.05 * q2 + .004 * rng.b());
        ihh[ww & mask] = (float)inj;
        double v = lpk * g + inj - .5 * ihh[(ww - trunc64(Le * pos)) & mask] + (sym ? sym[i] * symG * (1 - drr) : 0);
        if (v > thr) v = thr + (v - thr) * .2;
        v = v / (1 + .15 * v * v) + 1e-18;
        bb[ww & mask] = (float)v;
        L[i] = (float)(L[i] + amp * (y - .6 * bb[(ww - trunc64(Le * .13)) & mask]));
        ww++;
      }
      lp[k] = lpk; env[k] = envk; agc[k] = agck; bx1[k] = x1; bx2[k] = x2; by1[k] = y1; by2[k] = y2; apX[k] = ax; apY[k] = ay0;
    }
    w = ww & mask; dr = drr; C.kick = 0;
    double hmT = hh > 1 ? .55 : 1; hm += (hmT - hm) * srAlpha(.05, sr); if (hm != 1) for (int i = 0; i < n; i++) L[i] = (float)(L[i] * hm);
    hg.run(L, n, .16, 0, .03, 0, 1 - std::exp(-1 / (.03 * sr)), sr);
    double e0 = env[0], ph = sph, d1 = dc1, d2 = dc2, og = 1.3, pzA = P[P_EBOW_PICKUP] * 8, dcR = std::pow(.998, 48000.0 / sr), pzEnvC = srAlpha(.002, sr);
    for (int i = 0; i < n; i++) {
      ph += dinc; if (ph > TAU) ph -= TAU;
      double o = L[i] * og + std::sin(ph) * sub * e0 * 3;
      if (pzA > 0) {
        double aL = L[i] < 0 ? -L[i] : L[i]; pz.env += pzEnvC * (aL - pz.env); double en = pz.env * 1.5 + 1e-6, qz = L[i] * 6 / en; qz = qz / (1 + (qz < 0 ? -qz : qz)) * en * .5;
        double hpv = pz.b0 * (qz - 2 * pz.x1 + pz.x2) - pz.a1 * pz.y1 - pz.a2 * pz.y2; pz.x2 = pz.x1; pz.x1 = qz; pz.y2 = pz.y1; pz.y1 = hpv + 1e-18; o += hpv * pzA;
      }
      d2 = o - d1 + dcR * d2; d1 = o; L[i] = (float)d2;
    }
    sph = ph; dc1 = d1; dc2 = d2;
  }
};

/* ---------- 2. Hurdy-gurdy: three bowed waveguide strings on a rosined wheel ---------- */
struct Hurdy : Voice_ {
  EState* E; static const int N = 8192, mask = N - 1;
  struct Str { std::vector<float> nd, bd; double sf = 0, f = 0, apBx = 0, apBy = 0, apNx = 0, apNy = 0; } st[3];
  int64_t w = 0; double bv = 0, nz = 0, crank = 0, pc = 0, bz = 0, bzl = 0;
  double mf[6] = {182, 287, 405, 540, 790, 1210}, mq[6] = {.07, .06, .05, .05, .04, .03};
  double y1[6] = {}, y2[6] = {}, x1 = 0, x2 = 0, sph = 0, env = 0, ma1[6] = {}, ma2[6] = {}, mb[6] = {}, lens[3] = {}, fr[3] = {}, gains[3] = {1, .75, .65};
  explicit Hurdy(EState* e) : E(e) { for (auto& s : st) { s.nd.assign(N, 0.f); s.bd.assign(N, 0.f); } }
  void reset() override { for (auto& s : st) { std::fill(s.nd.begin(), s.nd.end(), 0.f); std::fill(s.bd.begin(), s.bd.end(), 0.f); s.sf = s.apBx = s.apBy = s.apNx = s.apNy = 0; } bv = 0; for (int k = 0; k < 6; k++) y1[k] = y2[k] = 0; }
  void render(float* L, float*, int n, Contact& C) override {
    const double* P = E->P; double sr = E->sr, D = E->dread; Rng& rng = E->rng;
    double crT = C.on ? P[P_HURDY_CRANK] * (C.autoOn ? fmin2(1, C.spd / .4) : .45 + 1.6 * C.spd) : 0;
    crank += (crT - crank) * srAlpha(.04, sr);
    double cr = crank, acc = (cr - pc) / (n / sr); pc = cr;
    double buzzP = P[P_HURDY_BUZZ];
    if (acc > 6 - buzzP * 4.5) bz = fmin2(1, bz + .5);
    bz *= std::pow(.93, 48000.0 / sr);
    double bzAmt = buzzP * fmin2(1, bz + fmax2(0, cr - (3.6 - buzzP * 2.4)) * .6);
    double pr = clamp(P[P_HURDY_PRESS] * (C.on ? .55 + .75 * C.p : 1), 0, 1), cn = fmin2(1, cr / 3);
    double bvT = cr > .02 ? .035 * fmin2(1, cn * 10) + .19 * cn : 0, slope = 5 - 4 * pr, rosin = P[P_HURDY_ROSIN] * E->instab;
    double root = P[P_HURDY_ROOT] * E->pitchMul;
    double r2 = E->dr2 != 0 ? E->dr2 : 1.5 + (1.41421 - 1.5) * clamp((D - .3) * 2, 0, 1), r3 = 2 + .1189 * clamp((D - .5) * 2, 0, 1);
    double mel = P[P_HURDY_MELODY] > .5 && C.on ? std::pow(2.0, jsround(C.x * 12) / 12) : 1;
    fr[0] = root * std::pow(2.0, -E->detune / 2400); fr[1] = root * r2; fr[2] = C.hz > 0 ? C.hz * E->pitchMul : root * r3 * mel;
    double pole = clamp(.75 - .2 * 22050 / sr - (E->material - .5) * .2, .2, .9), fg = .95;
    for (int k = 0; k < 6; k++) { double Rr = std::exp(-6.91 / (mq[k] * (.5 + E->matT) * sr)), th = TAU * mf[k] / sr; ma1[k] = 2 * Rr * std::cos(th); ma2[k] = Rr * Rr; mb[k] = (1 - Rr * Rr) / 2; }
    double fC = srAlpha(.2, sr), nzC = srAlpha(.02, sr), bvC = srAlpha(.0008, sr), bzlC = srAlpha(.25, sr), envC = srAlpha(.0005, sr);
    for (int k = 0; k < 3; k++) { Str& s = st[k]; if (s.f == 0) s.f = fr[k]; s.f += (fr[k] - s.f) * fC; lens[k] = clamp(sr / s.f - 3.3, 8, 8000); }
    double bvv = bv, nzz = nz, bzl0 = bzl, X1 = x1, X2 = x2, ph = sph, en = env, sub = E->subAmt, dinc = TAU * st[0].f * .5 / sr; int64_t ww = w;
    for (int i = 0; i < n; i++) {
      nzz += nzC * (rng.b() - nzz);
      bvv += (bvT - bvv) * bvC;
      double vb = bvv * (1 + rosin * 6 * nzz), sum = 0, z2 = 0;
      for (int k = 0; k < 3; k++) {
        Str& s = st[k];
        double lb = fmax2(1.0, lens[k] * .127), ln = fmax2(1.0, lens[k] - lb);
        double rp = (double)ww - lb, i0 = std::floor(rp), f0 = rp - i0; int64_t ii = (int64_t)i0; double rb = s.bd[ii & mask] * (1 - f0) + s.bd[(ii + 1) & mask] * f0;
        rp = (double)ww - ln; i0 = std::floor(rp); f0 = rp - i0; ii = (int64_t)i0; double rn = s.nd[ii & mask] * (1 - f0) + s.nd[(ii + 1) & mask] * f0;
        s.sf = fg * ((1 - pole) * rb + pole * s.sf) + 1e-18;
        double br = -s.sf, nr = -rn, dv = vb - (br + nr), q = dv * slope; if (q < 0) q = -q; q += .75; q = 1 / (q * q); q *= q; if (q > 1) q = 1;
        double nv = dv * q;
        s.nd[ww & mask] = (float)(br + nv); s.bd[ww & mask] = (float)(nr + nv);
        sum += rb * gains[k]; if (k == 1) z2 = rb;
      }
      ww++;
      double bzs = clamp(z2 * 14, -1, 1); bzl0 += bzlC * (bzs - bzl0);
      double x = sum + (bzs - bzl0) * bzAmt * .22, body = 0;
      for (int k = 0; k < 6; k++) { double y = ma1[k] * y1[k] - ma2[k] * y2[k] + mb[k] * (x - X2); y2[k] = y1[k]; y1[k] = y; body += y; }
      X2 = X1; X1 = x;
      double ax = x < 0 ? -x : x; en += envC * (ax - en);
      ph += dinc; if (ph > TAU) ph -= TAU;
      L[i] = (float)(x * 1.1 + body * 2.2 + std::sin(ph) * sub * en * 3);
    }
    w = ww & mask; bv = bvv; nz = nzz; bzl = bzl0; x1 = X1; x2 = X2; sph = ph; env = en;
  }
};

/* ---------- modal bank driven through a friction (velocity-weakening) contact ---------- */
struct Fric {
  int n, cnt = 0; std::vector<double> a1, a2, bb, wi, wo, y1, y2; double x1 = 0, x2 = 0, fl = 0;
  explicit Fric(int nn) : n(nn), a1(nn), a2(nn), bb(nn), wi(nn), wo(nn), y1(nn), y2(nn) {}
  void reset() { std::fill(y1.begin(), y1.end(), 0.0); std::fill(y2.begin(), y2.end(), 0.0); x1 = x2 = fl = 0; }
  void set(int k, double f, double t60, double wik, double wok, double sr) {
    if (f > sr * .45 || f < 15) { bb[k] = 0; wi[k] = 0; wo[k] = 0; a1[k] = 0; a2[k] = 0; return; }
    double R = std::exp(-6.91 / (fmax2(t60, .004) * sr)); a1[k] = 2 * R * std::cos(TAU * f / sr); a2[k] = R * R; bb[k] = (1 - R * R) / 2; wi[k] = wik; wo[k] = wok;
  }
  void run(float* out, int nn, const float* vb, const float* pg, double sa, const float* nzA, double lpc) {
    int N = cnt; double X1 = x1, X2 = x2, FL = fl;
    for (int i = 0; i < nn; i++) {
      double v = 0; int k;
      for (k = 0; k < N; k++) v += wi[k] * y1[k];
      double u = (vb[i] - v) * sa, x = pg[i] * u * std::exp(.5 - .5 * u * u) + nzA[i];
      FL += lpc * (x - FL); x = FL;
      double o = 0, xd = x - X2;
      for (k = 0; k < N; k++) { double y = a1[k] * y1[k] - a2[k] * y2[k] + bb[k] * xd + 1e-18; y2[k] = y1[k]; y1[k] = y; o += y * wo[k]; }
      X2 = X1; X1 = x; out[i] = (float)o;
    }
    x1 = X1; x2 = X2; fl = FL;
  }
};

/* ---------- 3. Bowed metal ---------- */
struct ModeSet { int n; double r[14]; double g[14]; double t; };
static const ModeSet BOW_SETS[5] = {
  {9, {1, 6.267, 17.55, 34.39, 56.84, 84.91, 2.89, 11.3, 25.2}, {1, .8, .6, .45, .3, .2, .25, .2, .15}, 2.2},
  {8, {1, 2.756, 5.404, 8.933, 13.34, 18.64, 24.81, 31.87}, {1, .85, .7, .6, .5, .4, .3, .25}, 3},
  {10, {1, 2.02, 3.01, 4.08, 5.03, 6.1, 7.2, 8.15, 9.3, 10.4}, {1, .8, .7, .6, .5, .45, .4, .35, .3, .25}, 3.5},
  {14, {1, 1.47, 2.09, 2.56, 3.19, 3.86, 4.31, 5.12, 5.87, 6.73, 7.61, 8.44, 9.6, 11.1}, {1, .9, .8, .8, .7, .7, .6, .6, .5, .5, .4, .4, .3, .3}, 1.6},
  {14, {1, 1.59, 2.14, 2.3, 2.65, 2.92, 3.16, 3.5, 3.6, 4.06, 4.6, 5.13, 5.65, 6.25}, {.8, 1, .9, .7, .8, .6, .7, .55, .5, .5, .45, .4, .35, .3}, 4.5}};
struct Bowed : Voice_ {
  EState* E; Fric m{14}; FB vb, nz, pg; double v = 0, bend = .5, wob = 0; HG hg; double lpr = -1, kk = 0, jmp = 0; bool hasRx = false; double rx = .5;
  explicit Bowed(EState* e) : E(e) {}
  void reset() override { m.reset(); v = 0; lpr = -1; kk = 0; jmp = 0; }
  void render(float* L, float*, int n, Contact& C) override {
    const double* P = E->P; double sr = E->sr; int ob = (int)P[P_BOWED_OBJECT]; const ModeSet& S = BOW_SETS[ob < 0 ? 0 : ob > 4 ? 4 : ob]; int N = S.n; m.cnt = N;
    double pr = clamp(P[P_BOWED_PRESS] * (C.on ? .4 + C.p : 1), 0, 1.4);
    double bT = clamp(P[P_BOWED_BEND] + (C.on && C.hz <= 0 ? (C.y - .5) * .7 : 0), 0, 1); bend += (bT - bend) * srAlpha(.15, sr);
    double bd = bend, Lr = P[P_BOWED_LENGTH] * (.7 + .6 * bd), damp = P[P_BOWED_DAMP];
    double f0 = (C.hz > 0 ? C.hz : ob == 0 ? rulerHz(Lr) : P[P_BOWED_SIZE]) * E->pitchMul;
    // Smooth mode-jump damping burst instead of instantaneous y1/y2 *= 0.2 (eliminates pressure-automation clicks)
    if (C.on) { if (lpr < 0) lpr = pr; if (std::fabs(pr - lpr) > .15) { lpr = pr; kk = 1; for (int q = 0; q < N; q++) { m.y1[q] *= .2; m.y2[q] *= .2; } } } else lpr = -1;
    double prf = clamp(pr / 1.1, 0, 1), rt = std::pow(ob == 0 ? 30.0 : 10.0, .85 * (1 - prf)), wd = E->water * .04;
    wob += n / sr * 5.3; double vib = 1 + std::sin(wob) * .002 * E->instab;
    double pos = C.on ? .04 + C.x * .4 : .1, T = S.t * (1 - damp * .9) * E->matT, stt = 1 + E->matStretch;
    if (ob == 1) { if (C.on) { rx = C.x; hasRx = true; } } double imm = ob == 1 ? immerse(E, hasRx ? rx : .5) : 1;
    for (int k = 0; k < N; k++) {
      double r = S.r[k], f;
      if (ob == 0) f = f0 * r;
      else if (ob == 2) f = f0 * std::pow(r, .78 + .44 * bd) * (.75 + .5 * bd);
      else f = f0 * std::pow(r, .9 + .2 * bd);
      f = f0 * std::pow(f / f0, stt) * vib;
      if (ob != 0 && wd > 0) f *= 1 + wd * E->wv[k];
      if (ob == 1) f *= imm;
      double t60 = T * 1000 / (1000 + E->matSlope * f) * (.6 + .4 / (1 + k * .3));
      double lr = std::log(r / rt), wi = S.g[k] * (.3 + .7 * std::fabs(std::sin((k + 1) * 2.9 * (pos + .06)))) * (.06 + 2 * std::exp(-1.5 * lr * lr));
      m.set(k, f, t60, wi, S.g[k] * (.6 + .4 * E->matBright), sr);
    }
    double vT = C.on ? (C.autoOn ? P[P_BOWED_SPEED] * (.5 + C.p * .7) : C.spd * (.4 + 1.6 * P[P_BOWED_SPEED])) : 0;
    vT = fmin2(vT, 1.2) * .5;
    double vv = v, vC = srAlpha(.0015, sr), sa = (1.6 + .5 * fmin2(pr, 1)) / fmax2(vT, .04), pgv = (1 + 4 * pr) * fmax2(vT, .04), nzG = (.02 + .1 * pr * pr) * (.5 + E->matBright);
    Rng& rng = E->rng;
    for (int i = 0; i < n; i++) { vv += (vT - vv) * vC; vb[i] = (float)vv; nz[i] = (float)(vv * nzG * rng.b()); pg[i] = (float)pgv; }
    v = vv;
    if (kk > 0) { for (int i = 0; i < n; i++) nz[i] = (float)(nz[i] + kk * .02 * rng.b()); kk *= std::pow(.5, 48000.0 / sr); if (kk < .01) kk = 0; }
    m.run(L, n, vb.d, pg.d, sa, nz.d, srAlpha(.5 + .4 * E->matBright, sr));
    for (int i = 0; i < n; i++) L[i] = (float)(L[i] * 2.6);
    double hq = .5 + .5 * fmin2(pr, 1); hg.run(L, n, .06 * hq, .1 * hq, .03 * hq, .04 * hq, 1 - std::exp(-1 / (.02 * sr)), sr);
  }
};

/* ---------- 4. Glass & friction ---------- */
struct GlassSet { double f; int n; double r[12]; double t; };
static const GlassSet GLASS_SETS[4] = {
  {870, 12, {1, 1.58, 2.24, 2.92, 3.46, 4.1, 5.3, 6.1, 7.9, 9.4, 11.2, 13.1}, .35},
  {640, 8, {1, 2.32, 4.25, 6.63, 9.38, 12.5, 1.004, 2.33}, 2.6},
  {1150, 7, {.28, 1, 1.9, 2.6, 4.1, 5.8, 7.7}, .5},
  {520, 12, {1, 1.7, 2.9, 3.6, 4.3, 5.1, 5.8, 6.6, 7.3, 8.1, 9.2, 10.4}, .045}};
struct Glass : Voice_ {
  EState* E; HG hg; double fp = 0, fa = 0; Fric m{12}; FB vb, nz, pg; double pu = 0, pa = 0, v = 0; bool stuck = true; double cnt = 0, sp = 0, pv = 0, sq = 0, cg = 1;
  explicit Glass(EState* e) : E(e) {}
  void reset() override { m.reset(); v = 0; }
  void render(float* L, float*, int n, Contact& C) override {
    const double* P = E->P; double sr = E->sr; int sfc = (int)P[P_GLASS_SURFACE]; const GlassSet& S = GLASS_SETS[sfc < 0 ? 0 : sfc > 3 ? 3 : sfc]; int N = S.n, ct = (int)P[P_GLASS_CONTACT]; Rng& rng = E->rng; m.cnt = N;
    double pr = clamp(P[P_GLASS_PRESS] * (C.on ? .4 + C.p : 1), 0, 1.4), wet = P[P_GLASS_WET], jud = P[P_GLASS_JUDDER] * E->instab;
    double f0 = (C.hz > 0 ? C.hz * 4 : S.f * P[P_GLASS_SIZE]) * E->pitchMul * (sfc == 1 ? 1 - .2 * P[P_GLASS_FILL] : 1), pos = C.x, tilt = C.on && C.hz <= 0 ? C.y : .5, stt = 1 + E->matStretch;
    for (int k = 0; k < N; k++) {
      double f = f0 * std::pow(S.r[k], stt), t60 = S.t * (.4 + E->matT * .6) * 1400 / (1400 + E->matSlope * f);
      double wi = (.35 + .65 * std::fabs(std::sin((k + 1.3) * 2.3 * (pos + .11)))) * std::pow((k + 1.0) / N * 2, (tilt - .5) * 2.4) / (1 + k * .08);
      if (ct == 1) wi /= (1 + k * .5); else wi *= 1 + k * .22;
      m.set(k, f, t60, wi, 1 / (1 + k * (ct == 1 ? .35 : .1)), sr);
    }
    double spd = C.on ? (C.autoOn ? .45 : C.spd) : 0;
    if (pv - spd > .12) sq = fmin2(1, (pv - spd) * 3);
    pv = spd; sq *= .9;
    spd = fmin2(1, spd + sq * .5);
    sp += (spd - sp) * srAlpha(.2, sr); spd = sp;
    double vSlip = spd > .004 ? .06 + .5 * spd : 0, duty = clamp(.22 + .8 * wet, 0, 1);
    double fS = 3 + 42 * spd * (1.2 - pr * .5);
    double nzG = ct == 2 ? .5 : ct == 1 ? .04 : .14, sa = (ct == 1 ? 1.6 : 1.7 + .4 * pr) / fmax2(vSlip, .06), lpc = srAlpha(ct == 1 ? .28 : ct == 2 ? .6 : .95, sr);
    cg = cg + ((C.on || vSlip > 0 ? 1 : 0) - cg) * srAlpha(.05, sr);
    double vv = v, c0 = cnt, sm = srAlpha(ct == 1 ? .01 : .12, sr); bool stk = stuck;
    double pgv = (1 + 4 * pr) * fmax2(vSlip, .06) * cg, bs = 0, puu = pu, paa = pa; int PL = (int)fmax2(4, (double)(int64_t)(sr * (ct == 1 ? .0025 : .00018)));
    for (int k2 = 0; k2 < N; k2++) bs += m.bb[k2] * m.wi[k2];
    double kx = .02 * N / (bs + 1e-9) * (ct == 1 ? .5 : 1);
    for (int i = 0; i < n; i++) {
      if (duty < .98 && vSlip > 0) {
        if (--c0 <= 0) {
          double per = sr / fS * std::exp(jud * 1.1 * rng.b());
          stk = !stk; c0 = fmax2(8, per * (stk ? 1 - duty : duty));
          if (!stk) { puu = PL; double r1 = rng.u(); double r2 = rng.u(); paa = pr * (.25 + spd) * (.5 + r1) * kx / PL * (r2 < .5 ? -1 : 1); }
        }
      } else stk = false;
      vv += ((stk ? 0 : vSlip) - vv) * sm; vb[i] = (float)vv; pg[i] = (float)(stk ? pgv * .04 : pgv);
      double ex = vv * nzG * pr * rng.b() * kx * .02;
      if (puu > 0) { ex += paa * (.5 - .5 * std::cos(TAU * puu / PL)); puu--; }
      nz[i] = (float)ex;
    }
    v = vv; cnt = c0; stuck = stk; pu = puu; pa = paa;
    m.run(L, n, vb.d, pg.d, sa, nz.d, lpc);
    double gG = (ct == 1 ? .62 : 5) * (sfc == 3 ? .5 : 1);
    for (int i = 0; i < n; i++) L[i] = (float)(L[i] * gG);
    if (ct == 1) {
      double hm = P[P_GLASS_HARM]; if (hm > 0) hg.run(L, n, .05 * hm, .06 * hm, .02 * hm, 0, 1 - std::exp(-1 / (.03 * sr)), sr, true);
      double frr = TAU * (4 + 4 * fmin2(1, spd * 1.6)) / sr, fpp = fp, faa = fa, faT = spd > .01 ? .42 * P[P_GLASS_BEAT] : 0, faC = srAlpha(.0005, sr);
      for (int i = 0; i < n; i++) { fpp += frr; if (fpp > TAU) fpp -= TAU; faa += (faT - faa) * faC; L[i] = (float)(L[i] * (1 - faa * .5 * std::cos(fpp))); }
      fp = fpp; fa = faa;
    }
  }
};

/* ---------- 5. Struck & plucked metal (polyphonic modal) ---------- */
struct StrSet { int n; double r[14], g[14], t[14]; };
static const StrSet STR_SETS[5] = {
  {7, {1, 6.267, 17.55, 34.39, 56.84, 2.9, 11.4}, {1, .5, .3, .2, .1, .12, .1}, {1, .5, .3, .2, .15, .3, .2}},
  {8, {1, 2.756, 5.404, 8.933, 13.34, 18.64, 24.81, 31.87}, {1, .8, .64, .5, .4, .32, .25, .2}, {1, .8, .6, .45, .35, .25, .2, .15}},
  {14, {.5, 1, 1.2, 1.5, 2, 2.5, 2.67, 3, 4, 5.33, 6.67, 8.2, .5017, 1.004}, {.6, 1, .7, .5, .8, .3, .3, .4, .35, .2, .15, .1, .4, .6}, {1.6, 1, .8, .7, .6, .45, .4, .35, .3, .2, .15, .1, 1.5, .95}},
  {14, {1, 1.47, 2.09, 2.56, 3.19, 3.86, 4.31, 5.12, 5.87, 6.73, 7.61, 8.44, 9.6, 11.1}, {1, .9, .8, .8, .7, .7, .6, .6, .5, .5, .4, .4, .3, .3}, {1, .9, .8, .75, .7, .6, .55, .5, .45, .4, .35, .3, .25, .2}},
  {7, {1, 1.58, 2.21, 2.95, 3.6, 4.8, 6.3}, {1, .6, .4, .3, .2, .12, .08}, {1, .7, .5, .4, .3, .2, .15}}};
static const double STR_VEL[5] = {9, 1.2, 1, 1.2, 2};
struct SVoice { bool on = false; int n = 0, obj = 0; double R[14] = {}, th[14] = {}, a1[14] = {}, a2[14] = {}, g[14] = {}, y1[14] = {}, y2[14] = {}; double pl = 0, pp = 0, vel = 0, nzm = 0, life = 0, slap = 0, gs = 0, age = 0, wait = 0, clk = 0, cn = 0, cb1 = 0, cb2 = 0, fade = 0; };
struct Struck : Voice_ {
  EState* E; static const int SV = 12; SVoice pool[SV + 1]; int v[SV]; int fv; double FADE; struct { double b0, a1, a2; } cbp;
  explicit Struck(EState* e) : E(e) {
    for (int i = 0; i < SV; i++) v[i] = i; fv = SV; FADE = fmax2(16, jsround(E->sr * .005));
    double w0 = TAU * 1800 / E->sr, al = std::sin(w0) / (2 * 1.5), a0 = 1 + al; cbp.b0 = al / a0; cbp.a1 = -2 * std::cos(w0) / a0; cbp.a2 = (1 - al) / a0;
  }
  void reset() override { for (int i = 0; i < SV; i++) pool[v[i]].on = false; pool[fv].on = false; }
  // NAN = "undefined" in the JavaScript (take it from the parameters)
  void trigger(double hz, double vel, double pos, double obj = NAN, double hard = NAN, double decay = NAN, double clk = NAN, double dly = NAN) {
    const double* P = E->P; double sr = E->sr; int vi = -1, i;
    for (i = 0; i < SV; i++) if (!pool[v[i]].on) { vi = i; break; }
    if (vi < 0) {
      for (i = 0, vi = 0; i < SV; i++) if (pool[v[i]].age > pool[v[vi]].age) vi = i;
      int old = v[vi]; int spare = fv; fv = old; pool[old].fade = FADE; v[vi] = spare;
    }
    SVoice& V = pool[v[vi]];
    if (std::isnan(obj) || obj < 0) obj = (int)P[P_STRUCK_OBJECT];
    int ob = (int)obj; if (ob > 4) ob = 4;
    if (std::isnan(hard)) hard = P[P_STRUCK_HARD];
    if (std::isnan(decay)) decay = P[P_STRUCK_DECAY];
    const StrSet& S = STR_SETS[ob]; int N = S.n; bool wood = ob == 4;
    double matT = wood ? .5 : E->matT, slope = wood ? 2.5 : E->matSlope, st = 1 + (wood ? 0 : E->matStretch), maxT = 0, gs = 0;
    if (wood) decay = fmin2(decay, 1.2) * .25;
    hz *= E->pitchMul; if (ob == 1) hz *= immerse(E, E->strX);
    for (int k = 0; k < N; k++) {
      double f = hz * std::pow(S.r[k], st) * (1 + E->detune * .00006 * E->rng.b()), t60 = decay * S.t[k] * matT * 1000 / (1000 + slope * f * .5);
      if (f > sr * .45) { V.g[k] = 0; V.a1[k] = 0; V.a2[k] = 0; continue; }
      double R = std::exp(-6.91 / (fmax2(t60, .005) * sr)), th = TAU * f / sr;
      V.a1[k] = 2 * R * std::cos(th); V.a2[k] = R * R; V.R[k] = R; V.th[k] = th;
      V.g[k] = std::sin(th) * S.g[k] * (.25 + .75 * std::fabs(std::sin((k + 1) * 2.7 * (pos * .8 + .12))));
      gs += V.g[k]; if (t60 > maxT) maxT = t60;
      V.y1[k] = 0; V.y2[k] = 0;
    }
    V.n = N; V.on = true; V.obj = ob; V.vel = (vel * vel * .9 + vel * .1) * STR_VEL[ob] * (ob == 0 ? clamp(150 / hz, 1, 6) : 1);
    V.pl = fmax2(3, jsround(sr * (.0085 - .0082 * std::sqrt(clamp(hard * (.6 + .5 * E->matBright) * (.6 + .4 * vel), 0, 1)))));
    V.pp = 0; V.nzm = .15 * hard; V.wait = dly > 0 ? (double)(int64_t)dly : 0; V.life = jsround(sr * maxT * 1.3) + V.pl + V.wait; V.age = 0; V.fade = 0;
    V.clk = clk > 0 ? clk * vel : 0; V.cn = jsround(sr * .004); V.cb1 = V.cb2 = 0;
    V.slap = ob == 0 ? P[P_STRUCK_SLAP] : 0; V.gs = gs;
  }
  void voice(SVoice& V, float* L, int n, Rng& rng) {
    int N = V.n; double pl = V.pl, pp = V.pp, sc = V.vel * 2 / pl * 28, slap = V.slap, thr = 2.2 * V.vel * (1.05 - slap), sk = slap > 0 ? .5 / (V.gs + 1e-9) : 0, d = 0;
    double fade = V.fade, fs = FADE, wait = V.wait;
    for (int i = 0; i < n; i++) {
      if (wait > 0) { wait--; continue; }
      double x = 0;
      if (pp < pl) { x = sc * (.5 - .5 * std::cos(TAU * pp / pl)) * (1 + V.nzm * rng.b() * 3); pp++; }
      if (sk > 0 && d > thr) x -= (d - thr) * sk * 1.6;
      d = 0;
      for (int k = 0; k < N; k++) { double y = V.a1[k] * V.y1[k] - V.a2[k] * V.y2[k] + V.g[k] * x + 1e-18; V.y2[k] = V.y1[k]; V.y1[k] = y; d += y; }
      if (V.clk > 0 && V.cn > 0) { double nzz = rng.b(), c = cbp.b0 * nzz - cbp.a1 * V.cb1 - cbp.a2 * V.cb2; V.cb2 = V.cb1; V.cb1 = c; d += c * V.clk * 160 * (V.cn / (E->sr * .004)); V.cn--; }
      if (fade > 0) { d *= fade / fs; if (--fade == 0) { V.on = false; break; } }
      L[i] = (float)(L[i] + d);
    }
    V.pp = pp; V.wait = wait; V.age += n; if (V.fade > 0) V.fade = fade; if (V.age > V.life) V.on = false;
  }
  void render(float* L, float*, int n, Contact&) override {
    Rng& rng = E->rng; double wd = E->water * .04;
    if (wd > 0) for (int j0 = 0; j0 < SV; j0++) { SVoice& v0 = pool[v[j0]]; if (!v0.on || v0.obj == 0 || v0.obj == 4) continue; for (int k0 = 0; k0 < v0.n; k0++) if (v0.g[k0] != 0) v0.a1[k0] = 2 * v0.R[k0] * std::cos(v0.th[k0] * (1 + wd * E->wv[(k0 + j0) & 15])); }
    for (int i = 0; i < n; i++) L[i] = 0;
    for (int j = 0; j < SV; j++) { if (!pool[v[j]].on) continue; voice(pool[v[j]], L, n, rng); }
    if (pool[fv].on) voice(pool[fv], L, n, rng);
    for (int i = 0; i < n; i++) L[i] = (float)(L[i] * .022);
  }
};

}  // namespace he
