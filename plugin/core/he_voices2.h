// Internal: voices VI-IX (spring tank, junk tray, Aura, superball), the hall, the body and the harmonizer.
// Line-for-line port of src/engine.js. Horror Engine (c) 2026 Garyck Arntzen (https://x.com/_mintydoge). GNU AGPLv3 (see LICENSE).
#pragma once
#include "he_state.h"

namespace he {

/* ---------- 6. Spring tank: dispersive allpass chains in a feedback loop (source and send) ---------- */
struct Spring {
  EState* E;
  struct S { int M; std::vector<float> d, buf, ap; int64_t w = 0; double td, am, lp1 = 0, lp2 = 0, hp = 0, hx = 0, eq1 = 0, eq2 = 0, ex1 = 0, ex2 = 0; int apN, apw = 0; double t1 = 0, t2 = 0; } s[3];
  int p = 0, K = 6; double exc = 0, exAt = 0, bWait = 0, burst = 0, bLen = 1, bAmp = 0, bLc = .1, bz = 0, bz2 = 0, pd = 0, shT = 0, nl = 0, eb = 0, last = 0, ebe = 0, dr = 0, rat = 0;
  explicit Spring(EState* e) : E(e) {
    int M[3] = {64, 52, 44}, AP[3] = {347, 419, 491}; double td[3] = {.0546, .0631, .0712}, am[3] = {1, .86, .74};
    for (int i = 0; i < 3; i++) { s[i].M = M[i]; s[i].d.assign(M[i] * 16, 0.f); s[i].buf.assign(16384, 0.f); s[i].td = td[i]; s[i].am = am[i]; s[i].ap.assign(AP[i], 0.f); s[i].apN = AP[i]; }
  }
  void reset() {
    for (auto& q : s) { std::fill(q.d.begin(), q.d.end(), 0.f); std::fill(q.buf.begin(), q.buf.end(), 0.f); std::fill(q.ap.begin(), q.ap.end(), 0.f); q.apw = 0; q.lp1 = q.lp2 = q.hp = q.hx = q.eq1 = q.eq2 = q.ex1 = q.ex2 = q.t1 = q.t2 = 0; }
    eb = 0; last = 0; ebe = 0; rat = 0; bz = bz2 = 0;
  }
  void hit(double vel, double dly = 0) {
    double sr = E->sr; exc += vel; exAt = dly > 0 ? (double)(int64_t)dly : 0; bWait = exAt;
    bLen = burst = jsround(sr * (.016 - .008 * vel)); bAmp = vel * (1.2 + 2.2 * vel); bLc = 1 - std::exp(-TAU * (500 + 2800 * vel * vel) / sr);
    dr = fmax2(dr, vel); rat = fmax2(rat, vel > .4 ? (vel - .4) * 1.4 : 0);
  }
  void render(float* L, float* R, int n, Contact& C, const float* inp) {
    const double* P = E->P; double sr = E->sr; Rng& rng = E->rng; int mode = (int)P[P_SPRING_MODE];
    double Fc = 2200 + 2000 * P[P_SPRING_TENSION]; int KK = (int)clamp(jsround(sr / (2 * Fc)), 2, 16);
    if (KK != K) { K = KK; p = 0; }
    double a = -(.15 + .32 * P[P_SPRING_DISP]), T60 = P[P_SPRING_DECAY] * (.6 + .4 * E->matT), aa = -a;
    double spd = C.on ? C.spd : 0, shake = mode == 1 && C.on ? spd : 0, scr = mode == 2 && C.on ? spd * (.3 + C.p) : 0;
    dr = fmax2(dr * std::exp(-n / (.55 * sr)), fmin2(1, scr * .45 + shake * .7));
    double fT = fmin2(fmin2(sr / (2 * K) * .9, 900 + 1900 * std::pow(dr, 1.5)), sr * .45), lc = 1 - std::exp(-TAU * fT / sr); int pp = p;
    double ebT = mode == 3 && C.on ? (.35 + .65 * C.p) * (C.autoOn ? 1 : .6 + .8 * fmin2(1, C.spd * 3 + .3)) : 0;
    eb += (ebT - eb) * .02; double ebv = eb, ebe0 = ebe, last0 = last, rat0 = rat, rD = std::exp(-1 / (.07 * sr));
    exc = 0;
    double w0 = TAU * 180 / sr, al = std::sin(w0) / (2 * 1.2), a0 = 1 + al, eb0 = al / a0, ea1 = -2 * std::cos(w0) / a0, ea2 = (1 - al) / a0;
    double bLcv = bLc, bzv = bz, bz2v = bz2;
    for (int i = 0; i < n; i++) {
      double x = inp ? inp[i] : 0;
      if (bWait > 0) bWait--; else if (burst > 0) { double bu = burst / bLen; bzv += bLcv * (rng.b() - bzv); bz2v += bLcv * (bzv - bz2v); x += bAmp * bz2v * 6 * bu * std::sqrt(1 - bu + .02); burst--; }
      if (shake > .02) { if (--shT <= 0) { shT = sr / (4 + 60 * shake) * (.3 + rng.u() * 1.4); x += shake * (shake > .6 ? 1.6 : 1) * rng.b() * 40; } }
      if (scr > 0) { nl += .3 * (rng.b() - nl); x += nl * scr * 4.5; }
      if (ebv > .001) { double av = last0 < 0 ? -last0 : last0; ebe0 += .001 * (av - ebe0); double qd = last0 * 3 / (ebe0 + .02); qd = qd / (1 + (qd < 0 ? -qd : qd)); x += ebv * (qd * .09 + .002 * rng.b()); }
      if (rat0 > .002) { rat0 *= rD; if (rng.u() < .08) x += rat0 * rng.b(); }
      double o3 = 0, oL = 0, oR = 0;
      for (int j = 0; j < 3; j++) {
        S& q = s[j]; int M = q.M; float* d = q.d.data(); double aj = a * q.am, aaj = aa * q.am;
        double dcj = K * (1 + aaj) / (1 - aaj), D = fmax2(sr * .003, q.td * sr - M * dcj);
        double g = std::pow(10.0, -3 * q.td / T60);
        double rp = (double)q.w - D, i0 = std::floor(rp), fr = rp - i0; int64_t ii = (int64_t)i0; double fb = q.buf[ii & 16383] * (1 - fr) + q.buf[(ii + 1) & 16383] * fr;
        double v = x * (j == 2 ? .7 : 1) + fb * g;
        for (int k = 0, qq = pp; k < M; k++, qq += 16) { double z = d[qq], t = v - aj * z; d[qq] = (float)t; v = aj * t + z; }
        double apz = q.ap[q.apw], apw0 = v + apz * .55, apy = apz - .55 * apw0; q.ap[q.apw] = (float)apw0; q.apw = q.apw + 1 == q.apN ? 0 : q.apw + 1; v = apy;
        q.lp1 += lc * (v - q.lp1); q.lp2 += lc * (q.lp1 - q.lp2) + 1e-18;
        double o = q.lp2; q.hp = o - q.hx + .995 * q.hp; q.hx = o; o = q.hp;
        q.buf[q.w & 16383] = (float)(-o); q.w = (q.w + 1) & 16383;
        double bp = eb0 * (o - q.ex2) - ea1 * q.eq1 - ea2 * q.eq2; q.ex2 = q.ex1; q.ex1 = o; q.eq2 = q.eq1; q.eq1 = bp + 1e-18; o += bp * .8;
        if (j == 0) oL = o; else if (j == 1) oR = o; else o3 = o;
      }
      pp++; if (pp >= K) pp = 0;
      double l = (oL + .55 * o3) * 1.25, r = (oR + .55 * o3) * 1.25; last0 = l; L[i] = (float)((l + .3 * r) * .6); R[i] = (float)((r + .3 * l) * .6);
    }
    p = pp; exAt = 0; ebe = ebe0; last = last0; rat = rat0; bz = bzv; bz2 = bz2v;
  }
};

/* ---------- 7. Junk drawer + magnet: particle simulation driving modal impacts ---------- */
static const double JUNK_R[5][4] = {{1, 1.71, 2.63, 3.82}, {1, 2.76, 5.40, 8.93}, {1, 2.32, 4.25, 6.63}, {1, 2.09, 3.66, 5.51}, {1, 2.57, 4.13, 6.29}};
static const double JUNK_F[5][2] = {{1500, 2300}, {2000, 2800}, {950, 1600}, {2300, 3000}, {520, 850}};
static const double JUNK_T[5] = {.075, .06, .17, .13, .028};
static const double JUNK_D[5] = {5000, 7000, 3500, 9000, 1300};
static const double JUNK_C[5] = {.18, .15, .25, .12, .7};
static const double JUNK_B[5] = {.3, .25, .3, .2, .9};
static const double JUNK_A[5] = {1, .9, 1, .8, 1.3};
static const double DRAWER_F[9] = {143, 209, 291, 377, 503, 662, 874, 1163, 1530}, DRAWER_WL[9] = {1, .6, .9, .4, .8, .5, .6, .35, .3}, DRAWER_WR[9] = {.7, 1, .4, .9, .5, .8, .35, .6, .25};
struct Junk : Voice_ {
  EState* E; static const int M = 80, V = 32, QN = 96;
  float px[M], py[M], vx[M], vy[M], rr[M], cool[M], h[M], ps[M], fq[M], frq[M]; uint8_t cS[M], cM[M], cl[M];
  double a1[V * 4], a2[V * 4], b[V * 4], y1[V * 4], y2[V * 4]; int32_t del[V], con[V], cn[V], life[V], act[V]; float lv[V], lk[V], ca[V], gz[V], gl[V], gr[V], bs[V], dg[V];
  double qt[QN]; int32_t qi[QN]; float qe[QN]; uint8_t qk[QN]; int qn = 0;
  double da1[9], da2[9], db[9], dy1[9], dy2[9];
  Rng rng{4242}; int count = 40; double mx = .5, my = .5; bool mon = false; double fc = 0, mvx = 0, mvy = 0; int n = BL; double fqD = 0;
  double bx1 = 0, bx2 = 0, sl = 0, slT = 0, b1 = 0, b2 = 0, lpL = 0, lpR = 0, lpL2 = 0, lpR2 = 0, cL = 0, cR = 0, mu = -1;
  explicit Junk(EState* e) : E(e) {
    Rng r(9001); int i;
    std::memset(cool, 0, sizeof cool); std::memset(frq, 0, sizeof frq); std::memset(cl, 0, sizeof cl); std::memset(act, 0, sizeof act);
    std::memset(lv, 0, sizeof lv); std::memset(lk, 0, sizeof lk); std::memset(ca, 0, sizeof ca); std::memset(gz, 0, sizeof gz); std::memset(gl, 0, sizeof gl); std::memset(gr, 0, sizeof gr); std::memset(bs, 0, sizeof bs); std::memset(dg, 0, sizeof dg);
    std::memset(a1, 0, sizeof a1); std::memset(a2, 0, sizeof a2); std::memset(b, 0, sizeof b); std::memset(qt, 0, sizeof qt); std::memset(qi, 0, sizeof qi); std::memset(qe, 0, sizeof qe); std::memset(qk, 0, sizeof qk);
    std::memset(da1, 0, sizeof da1); std::memset(da2, 0, sizeof da2); std::memset(db, 0, sizeof db);
    for (i = 0; i < M; i++) { px[i] = (float)(.08 + r.u() * .84); py[i] = (float)(.08 + r.u() * .84); rr[i] = (float)(.012 + r.u() * .02); h[i] = (float)r.u(); }
    for (i = 0; i < M; i++) { double u = r.u(); cS[i] = u < .6 ? 0 : 1; cM[i] = u < .3 ? 0 : u < .45 ? 1 : u < .68 ? 2 : u < .83 ? 3 : 4; }
    for (i = 0; i < M; i++) fq[i] = (float)(cM[i] == 3 ? .955 + .02 * r.u() : .84 + .1 * r.u());
    reset();
  }
  void reset() override {
    std::memset(y1, 0, sizeof y1); std::memset(y2, 0, sizeof y2); std::memset(del, 0, sizeof del); std::memset(con, 0, sizeof con); std::memset(life, 0, sizeof life); std::memset(lv, 0, sizeof lv);
    std::memset(vx, 0, sizeof vx); std::memset(vy, 0, sizeof vy); std::memset(ps, 0, sizeof ps); std::memset(cl, 0, sizeof cl); qn = 0;
    std::memset(dy1, 0, sizeof dy1); std::memset(dy2, 0, sizeof dy2); bx1 = bx2 = 0; sl = slT = b1 = b2 = 0; lpL = lpR = lpL2 = lpR2 = cL = cR = 0; mu = -1;
  }
  void queue(double t, int i, double e, int k) { if (qn < QN) { int q = qn++; qt[q] = t; qi[q] = i; qe[q] = (float)e; qk[q] = (uint8_t)k; } }
  void tick(int i, double e, bool wall, double off) {
    double sr = E->sr; int j = 0, k; double best = 1e9;
    for (k = 0; k < V; k++) { if (life[k] <= 0) { j = k; best = -1; break; } if (lv[k] < best) { best = lv[k]; j = k; } }
    int mat = (int)E->P[P_JUNK_MAT], c = mat == 0 ? cS[i] : mat == 1 ? 2 : cM[i]; const double* R = JUNK_R[c]; const double* F = JUNK_F[c];
    double hard = e / (1 + e), size = .022 / rr[i];
    double f1 = (F[0] + F[1] * h[i]) * std::pow(size, .7) * (.85 + .3 * E->material) * fmin2(4, std::sqrt(E->pitchMul)) * (1 + .025 * rng.b());
    double T = JUNK_T[c] * (.4 + E->matT * .6) * (wall ? .8 : 1) * (.8 + .4 * rng.u()), D = JUNK_D[c]; int o = j * 4; double maxT = 0;
    double amp = hard * (wall ? 1.1 : .8) * (.7 + .45 * rng.u()) * JUNK_A[c];
    for (int m = 0; m < 4; m++) {
      double f = f1 * R[m] * (1 + (m ? .012 * rng.b() : 0)), am;
      if (m) am = (.15 + .85 * rng.u()) * (m == 1 ? .8 : m == 2 ? .55 : .4); else am = .6 + .4 * rng.u();
      if (f > fmin2(16000, sr * .4)) { am = 0; f = 1000; }
      double t = T / (1 + f / D), Rr = std::exp(-6.91 / (t * sr)), th = TAU * f / sr;
      a1[o + m] = 2 * Rr * std::cos(th); a2[o + m] = Rr * Rr; b[o + m] = amp * am * std::sin(th);
      if (am > 0 && t > maxT) maxT = t;
    }
    double cms = JUNK_C[c] * (1.25 - .6 * hard) * (.8 + .4 * rng.u()) * (wall ? 1.3 : 1); int cnn = (int)fmax2(4, jsround(cms * .001 * sr));
    cn[j] = cnn; con[j] = cnn; ca[j] = (float)(PI / (2 * cnn)); gz[j] = (float)(c == 4 ? .9 : .45);
    del[j] = off > 0 ? (int32_t)off : 0; dg[j] = (float)(amp * .9);
    double pn = clamp(px[i] + .08 * rng.b(), 0, 1) * 1.5708; gl[j] = (float)std::cos(pn); gr[j] = (float)std::sin(pn);
    bs[j] = (float)((wall ? 1.4 : JUNK_B[c]) * (.5 + .5 * rng.u()));
    life[j] = (int32_t)(del[j] + cnn + maxT * 1.4 * sr); lv[j] = (float)amp; lk[j] = (float)std::exp(-6.91 * BL / (maxT * sr));
    if (!wall && off >= 0 && e > .25 && rng.u() < .3) { double t1 = fc + (off > 0 ? off : 0) + (2 + 10 * rng.u()) * .001 * sr; int i1 = (int)(rng.u() * count); double e1 = e * (.25 + .3 * rng.u()); queue(t1, i1, e1, 1); }
  }
  int when(double pen, double v, double dt) { double f = 1 - pen / fmax2(1e-4, v * dt); f = clamp(f, 0, 1) * .85 + .15 * rng.u(); return (int)fmin2(n - 1, fmax2(1, (double)(int)(f * n))); }
  void sim(Contact& C, double dt) {
    const double* P = E->P; int N = count = (int)clamp((int)P[P_JUNK_COUNT], 4, 80); int i, j;
    bool on = C.on; double str = P[P_JUNK_MAGNET] * (on ? .5 + C.p : 0), ag = on ? P[P_JUNK_AGIT] + C.spd * .5 : 0, S = 0;
    if (on && mon) { mvx = (C.x - mx) / dt; mvy = (C.y - my) / dt; } else { mvx = mvy = 0; }
    mon = on; if (on) { mx = C.x; my = C.y; }
    if (fqD != dt) { fqD = dt; for (i = 0; i < 80; i++) frq[i] = (float)std::pow((double)fq[i], dt / .00267); }
    double ckR = .035 + .021 * std::sqrt((double)N), ck = 1 - std::pow(.45, dt / .00267), ck2 = 1 - std::pow(.7, dt / .00267); int mat = (int)P[P_JUNK_MAT];
    for (i = 0; i < N; i++) {
      cl[i] = 0;
      if (on) {
        double dx = mx - px[i], dy = my - py[i], d2 = dx * dx + dy * dy + .003, d = std::sqrt(d2), Fm = fmin2(60, str * 1.1 / d2);
        if (d < ckR) { bool mg = mat == 0 || (mat == 2 && cM[i] < 2); double kk = mg ? ck : ck2; cl[i] = 1; Fm *= .12; vx[i] = (float)(vx[i] + (mvx - vx[i]) * kk); vy[i] = (float)(vy[i] + (mvy - vy[i]) * kk); }
        vx[i] = (float)(vx[i] + dx / d * Fm * dt); vy[i] = (float)(vy[i] + dy / d * Fm * dt);
      }
      if (rng.u() < ag * .012) { vx[i] = (float)(vx[i] + rng.b() * .9); vy[i] = (float)(vy[i] + rng.b() * .9); }
      double frr = frq[i]; vx[i] = (float)(vx[i] * frr); vy[i] = (float)(vy[i] * frr);
      double sp = std::sqrt((double)vx[i] * vx[i] + (double)vy[i] * vy[i]);
      if (sp > 3) { vx[i] = (float)(vx[i] * (3 / sp)); vy[i] = (float)(vy[i] * (3 / sp)); sp = 3; }
      if (sp < .012) { vx[i] = 0; vy[i] = 0; sp = 0; }
      if (sp == 0 && ps[i] > .08 && !cl[i] && rng.u() < .7) {
        int k = 1 + (int)(rng.u() * 3.2); double tt = fc + n + rng.u() * .06 * E->sr; double gap = (.012 + .035 * rng.u()) * E->sr; double ee = fmin2(.5, ps[i] * .35) * (.6 + .6 * rng.u());
        for (int q = 0; q < k; q++) { tt += gap; queue(tt, i, ee, 2); gap *= .5 + .25 * rng.u(); ee *= .45 + .25 * rng.u(); }
      }
      ps[i] = (float)(sp > ps[i] ? sp : sp == 0 && ps[i] > .08 ? 0 : ps[i] * .97); if (!cl[i]) S += sp;
      px[i] = (float)(px[i] + vx[i] * dt); py[i] = (float)(py[i] + vy[i] * dt);
      if (cool[i] > 0) cool[i] = (float)(cool[i] - dt);
      double r = rr[i], e = 0, pen = 0;
      if (px[i] < r) { pen = r - px[i]; px[i] = (float)r; e = -vx[i]; vx[i] = (float)(vx[i] * -.4); } else if (px[i] > 1 - r) { pen = px[i] - 1 + r; px[i] = (float)(1 - r); e = vx[i]; vx[i] = (float)(vx[i] * -.4); }
      if (py[i] < r) { pen = fmax2(pen, r - py[i]); py[i] = (float)r; e = fmax2(e, -vy[i]); vy[i] = (float)(vy[i] * -.4); } else if (py[i] > 1 - r) { pen = fmax2(pen, py[i] - 1 + r); py[i] = (float)(1 - r); e = fmax2(e, (double)vy[i]); vy[i] = (float)(vy[i] * -.4); }
      if (e > .15 && cool[i] <= 0) { int wn = when(pen, e, dt); tick(i, e * .8, true, wn); cool[i] = (float)(.03 + .02 * rng.u()); }
    }
    for (i = 0; i < N; i++) for (j = i + 1; j < N; j++) {
      double ax = (double)px[j] - px[i], rs = (double)rr[i] + rr[j]; if (ax > rs || ax < -rs) continue;
      double ay = (double)py[j] - py[i], dd = ax * ax + ay * ay; if (dd >= rs * rs || dd < 1e-9) continue;
      double di = std::sqrt(dd), nx = ax / di, ny = ay / di, ov = (rs - di) * .5;
      px[i] = (float)(px[i] - nx * ov); py[i] = (float)(py[i] - ny * ov); px[j] = (float)(px[j] + nx * ov); py[j] = (float)(py[j] + ny * ov);
      double rel = ((double)vx[j] - vx[i]) * nx + ((double)vy[j] - vy[i]) * ny;
      if (rel < 0) {
        double J = -rel * .7; vx[i] = (float)(vx[i] - nx * J); vy[i] = (float)(vy[i] - ny * J); vx[j] = (float)(vx[j] + nx * J); vy[j] = (float)(vy[j] + ny * J);
        int a = rr[i] < rr[j] ? i : j;
        if (-rel > .07 && cool[a] <= 0 && !(cl[i] && cl[j])) { int wn = when(ov * 2, -rel, dt); tick(a, -rel * 1.3, false, wn); cool[a] = (float)(.02 + rng.u() * .035); }
      }
    }
    slT = fmin2(1, S * .035);
    double lam = 90 * slT * dt; while (lam > 0) { if (rng.u() < fmin2(1, lam)) { double t1 = fc + rng.u() * n; int i1 = (int)(rng.u() * N); double e1 = .03 + .1 * rng.u() * slT; queue(t1, i1, e1, 3); } lam -= 1; }
    int qq = qn; double end = fc + n;
    for (int q = 0; q < qq; q++) if (qt[q] < end) {
      int it = qi[q] < N ? qi[q] : (int)(rng.u() * N); double ee = qe[q]; bool wall = qk[q] == 2 && rng.u() < .3; int off = (int)fmax2(0, qt[q] - fc); double offv = off ? off : -1;
      tick(it, ee, wall, offv);
      qq--; qt[q] = qt[qq]; qi[q] = qi[qq]; qe[q] = qe[qq]; qk[q] = qk[qq]; q--;
    }
    qn = qq;
  }
  void render(float* L, float* R, int nn, Contact& C) override {
    double sr = E->sr; n = nn; sim(C, nn / sr); const double* P = E->P;
    double tray = P[P_JUNK_TRAY]; int k, na = 0;
    for (k = 0; k < V; k++) if (life[k] > 0) { act[na++] = k; life[k] -= nn; lv[k] = (float)(lv[k] * lk[k]); if (life[k] <= 0) { int o0 = k * 4; y1[o0] = y1[o0 + 1] = y1[o0 + 2] = y1[o0 + 3] = y2[o0] = y2[o0 + 1] = y2[o0 + 2] = y2[o0 + 3] = 0; } }
    double mT = clamp(tray / .3, 0, 1); mT = mT * mT * (3 - 2 * mT); double muT = 1 - mT;
    if (mu < 0) mu = muT;
    double mu0 = mu, mu1 = mu0 + (muT - mu0) * .15; mu = mu1;
    for (k = 0; k < 9; k++) { double t60 = (.05 + .13 * tray) / (1 + k * .15) * (.6 + .4 * E->matT), Rr = std::exp(-6.91 / (t60 * sr)), th = TAU * DRAWER_F[k] * (1 + .15 * mu1) / sr; da1[k] = 2 * Rr * std::cos(th); da2[k] = Rr * Rr; db[k] = (1 - Rr * Rr) * .5; }
    bool muff = mu0 > .002 || mu1 > .002; double fcA = 16000 * std::pow(800.0 / 16000, mu0), fcB = 16000 * std::pow(800.0 / 16000, mu1), lcA = 1 - std::exp(-TAU * fcA / sr), lcB = 1 - std::exp(-TAU * fcB / sr);
    double cLc = 1 - std::exp(-TAU * 7000 / sr), cLv = cL, lL = lpL, lR = lpR, lL2 = lpL2, lR2 = lpR2;
    double slv = sl, slTv = slT, b1v = b1, b2v = b2, bx1v = bx1, bx2v = bx2, bodyG = 2.2 * (.4 + .6 * tray + .8 * mu1);
    for (int i = 0; i < nn; i++) {
      double l = 0, r = 0, cx = 0, bx = 0;
      for (int q = 0; q < na; q++) {
        int v = act[q], o = v * 4; double x = 0;
        if (del[v] > 0) del[v]--;
        else if (con[v] > 0) { int c0 = cn[v] - con[v]; x = std::sin((c0 + .5) * ca[v] * 2) * ca[v] * (1 + gz[v] * rng.b()); con[v]--; double xc = x * dg[v] * cn[v] * .35; cx += xc * ((double)gl[v] + gr[v]) * .5; bx += x * bs[v]; }
        double y = a1[o] * y1[o] - a2[o] * y2[o] + b[o] * x; y2[o] = y1[o]; y1[o] = y; double s = y;
        y = a1[o + 1] * y1[o + 1] - a2[o + 1] * y2[o + 1] + b[o + 1] * x; y2[o + 1] = y1[o + 1]; y1[o + 1] = y; s += y;
        y = a1[o + 2] * y1[o + 2] - a2[o + 2] * y2[o + 2] + b[o + 2] * x; y2[o + 2] = y1[o + 2]; y1[o + 2] = y; s += y;
        y = a1[o + 3] * y1[o + 3] - a2[o + 3] * y2[o + 3] + b[o + 3] * x; y2[o + 3] = y1[o + 3]; y1[o + 3] = y; s += y;
        l += s * gl[v]; r += s * gr[v];
      }
      slv += .002 * (slTv - slv);
      double rb = rng.b(); double nzz = rb * slv * (rng.u() < .08 ? 2.5 : 1); b1v += .35 * (nzz - b1v); b2v += .12 * (b1v - b2v); double sn = (b1v - b2v) * .35;
      bx += sn * .02;
      cLv += cLc * (cx - cLv);
      double dx = bx - bx2v, dL = 0, dR = 0; bx2v = bx1v; bx1v = bx;
      for (k = 0; k < 9; k++) { double yd = da1[k] * dy1[k] - da2[k] * dy2[k] + db[k] * dx + 1e-18; dy2[k] = dy1[k]; dy1[k] = yd; dL += yd * DRAWER_WL[k]; dR += yd * DRAWER_WR[k]; }
      double jl = (l + cLv + sn * .045 + dL * bodyG) * 3.2, jr = (r + cLv + sn * .045 + dR * bodyG) * 3.2;
      if (muff) { double u = (double)i / nn, lc = lcA + (lcB - lcA) * u, mg = 1 - .5 * (mu0 + (mu1 - mu0) * u); lL += lc * (jl - lL); lL2 += lc * (lL - lL2); lR += lc * (jr - lR); lR2 += lc * (lR - lR2); jl = lL2 * mg; jr = lR2 * mg; }
      L[i] = (float)(jl / (1 + .5 * (jl < 0 ? -jl : jl))); R[i] = (float)(jr / (1 + .5 * (jr < 0 ? -jr : jr)));
    }
    if (!muff) { lL = lL2 = lR = lR2 = 0; }
    sl = slv; b1 = b1v; b2 = b2v; bx1 = bx1v; bx2 = bx2v; cL = cLv + 1e-18; lpL = lL; lpR = lR; lpL2 = lL2; lpR2 = lR2; fc += nn;
  }
};

/* ---------- 8. Aura pad: granular cloud over a capture of the instrument's own dry bus ---------- */
struct Aura : Voice_ {
  EState* E; static const int N = 1 << 19, mask = N - 1, G = 32; std::vector<float> buf; int64_t w = 0;
  double pos[G]; float rate[G]; int32_t len[G], age[G]; float gl[G], gr[G]; uint8_t actv[G]; float hann[2050];
  double acc = 0, lpL = 0, lpR = 0, ph = 0, lv = 0; bool frozen = false; double e1 = 0, ref = 0, ag = 1;
  explicit Aura(EState* e) : E(e), buf(N, 0.f) { std::memset(pos, 0, sizeof pos); std::memset(rate, 0, sizeof rate); std::memset(len, 0, sizeof len); std::memset(age, 0, sizeof age); std::memset(gl, 0, sizeof gl); std::memset(gr, 0, sizeof gr); std::memset(actv, 0, sizeof actv); for (int i = 0; i < 2050; i++) hann[i] = (float)(.5 - .5 * std::cos(TAU * i / 2048)); }
  void reset() override { std::memset(actv, 0, sizeof actv); }
  void capture(const float* dL, const float* dR, int n) {
    if (frozen) return;
    int64_t ww = w; for (int i = 0; i < n; i++) { buf[ww] = (float)(((double)dL[i] + dR[i]) * .5); ww = (ww + 1) & mask; } w = ww;
  }
  void render(float* L, float* R, int n, Contact& C) override {
    const double* P = E->P; double sr = E->sr; Rng& rng = E->rng;
    frozen = P[P_AURA_FREEZE] > .5 || E->autoFreeze;
    double size = P[P_AURA_SIZE] * .001 * sr * (E->pitchSt < -12 ? 1.6 : 1), dens = P[P_AURA_DENSITY] * (1 + 1.5 * E->mAura), blur = C.on && !C.autoOn ? clamp(P[P_AURA_BLUR] * .5 + C.y * .7, 0, 1) : P[P_AURA_BLUR];
    bool on = C.on; double lvT = on ? (C.autoOn ? 1 : .5 + C.p * .8) : 0; int g;
    if (on) {
      acc += n;
      double iv = size / dens;
      while (acc >= iv) {
        acc -= iv * (.7 + .6 * rng.u());
        for (g = 0; g < G; g++) if (!actv[g]) break;
        if (g >= G) break;
        double u = rng.u(), rt = 1, sh = fmin2(.7, P[P_AURA_SHIMMER] + .35 * E->mAura), lo = .3 + E->subAmt * .4;
        if (u < lo) rt = E->pitchSt < -12 && rng.u() < .5 ? .25 : .5; else if (u < lo + sh) rt = 2;
        rt *= std::pow(2.0, rng.b() * E->detune * 1.5 / 1200);
        int ln = (int)fmax2(256, (double)(int)(size * (.6 + .8 * rng.u())));
        double back = (C.autoOn ? .05 + rng.u() * (.15 + blur * 4) : C.x * 8 + rng.u() * (.05 + blur * 1.5)) * sr + ln * fmax2(1, rt) + 64;
        if (back > N - 4096) back = N - 4096;
        pos[g] = (double)w - back; rate[g] = (float)rt; len[g] = ln; age[g] = 0; actv[g] = 1;
        double pan = .5 + rng.b() * .45; gl[g] = (float)std::cos(pan * 1.5708); gr[g] = (float)std::sin(pan * 1.5708);
      }
    }
    for (int i = 0; i < n; i++) { L[i] = 0; R[i] = 0; }
    for (g = 0; g < G; g++) {
      if (!actv[g]) continue;
      double ps = pos[g], rt = rate[g]; int ln = len[g], ag0 = age[g]; double gL = gl[g], gR = gr[g], hs = 2048.0 / ln;
      for (int i = 0; i < n && ag0 < ln; i++) {
        double i0 = std::floor(ps), f = ps - i0; int64_t ii = (int64_t)i0; double s = (buf[ii & mask] * (1 - f) + buf[(ii + 1) & mask] * f) * hann[(int)(ag0 * hs)];
        L[i] = (float)(L[i] + s * gL); R[i] = (float)(R[i] + s * gR); ps += rt; ag0++;
      }
      pos[g] = ps; age[g] = ag0; if (ag0 >= ln) actv[g] = 0;
    }
    ph += n / sr * TAU * (.05 + .1 * E->instab * .4); if (ph > TAU) ph -= TAU;
    double br = 1 - P[P_AURA_BREATHE] * .35 * (1 + std::sin(ph)), norm = 2.6 / std::sqrt(fmax2(1, dens * .5));
    double e1v = e1, refv = ref, agv = ag, k1 = 1 - std::exp(-1 / (.15 * sr)), k2 = 1 - std::exp(-1 / (2 * sr)); bool fz = frozen;
    double lc = 1 - std::exp(-TAU * 500 * std::pow(36.0, 1 - P[P_AURA_DARK]) / sr), lL = lpL, lR = lpR, lvv = lv;
    for (int i = 0; i < n; i++) {
      lvv += (lvT - lvv) * .0003; double gg = norm * lvv;
      lL += lc * (L[i] * gg - lL); lR += lc * (R[i] * gg - lR);
      double pwr = lL * lL + lR * lR;
      e1v += k1 * (pwr - e1v);
      if (!fz) refv += k2 * (pwr - refv);
      double gt = fz && e1v > 1e-12 && refv > 1e-12 ? clamp(std::sqrt(refv / e1v), .5, 2) : 1;
      agv += (gt - agv) * .0002;
      L[i] = (float)(lL * agv * br); R[i] = (float)(lR * agv * br);
    }
    e1 = e1v + 1e-30; ref = refv + 1e-30; ag = agv;
    lpL = lL + 1e-18; lpR = lR + 1e-18; lv = lvv;
  }
};

/* ---------- Huge reverb: 8-line Householder FDN with modulated lines ---------- */
struct Reverb {
  EState* E; static const int N = 16384, mask = N - 1; std::vector<float> b[8]; double lp[8] = {}, d[8] = {}, ms[8] = {31.7, 37.1, 41.3, 47.9, 53.3, 61.1, 67.3, 73.9}; int64_t w = 0; double ph[8] = {};
  struct AP { std::vector<float> b; int n; int w = 0; } ap[3]; std::vector<float> pre; int pw = 0; double hp = 0, x[8] = {}, g[8] = {};
  explicit Reverb(EState* e) : E(e), pre(32768, 0.f) { for (auto& q : b) q.assign(N, 0.f); double am[3] = {5.1, 7.7, 11.3}; for (int i = 0; i < 3; i++) { ap[i].b.assign(2048, 0.f); ap[i].n = (int)jsround(am[i] * E->sr / 1000) % 2048; } }
  void clear() { for (auto& q : b) std::fill(q.begin(), q.end(), 0.f); }
  // GOODBYE: every line, the pre-delay and the diffusers emptied (clear() above is the old partial clear)
  void wipe() { clear(); for (int k = 0; k < 8; k++) { lp[k] = 0; x[k] = 0; } std::fill(pre.begin(), pre.end(), 0.f); hp = 0; for (auto& a : ap) std::fill(a.b.begin(), a.b.end(), 0.f); }
  void render(const float* inp, float* L, float* R, int n) {
    const double* P = E->P; double sr = E->sr;
    double sz = .45 + P[P_REV_SIZE] * 1.5, rt = P[P_REV_DECAY], dc = 1 - .85 * P[P_REV_DAMP] * (.6 + .4 * (1 - E->matBright * .3));
    int prd = (int)fmin2(32000, (double)(int)((P[P_REV_PRE] + 60 * E->distance) * .001 * sr)); int k;
    for (k = 0; k < 8; k++) { double dt = fmin2(ms[k] * sz * .001 * sr, N - 64); if (d[k] == 0) d[k] = dt; d[k] += (dt - d[k]) * .05; g[k] = std::pow(10.0, -3 * d[k] / (sr * rt)); }
    int64_t ww = w; double pinc = TAU * .31 / sr;
    for (int i = 0; i < n; i++) {
      hp += .008 * (inp[i] - hp);
      double s = inp[i] - hp;
      pre[pw] = (float)s; s = pre[(pw - prd) & 32767]; pw = (pw + 1) & 32767;
      for (k = 0; k < 3; k++) { AP& a = ap[k]; double z = a.b[(a.w - a.n) & 2047], t = s + .6 * z; a.b[a.w] = (float)t; a.w = (a.w + 1) & 2047; s = z - .6 * t; }
      double sum = 0;
      for (k = 0; k < 8; k++) {
        if (!(k & 1)) { ph[k] += pinc * (1 + k * .13); if (ph[k] > TAU) ph[k] -= TAU; }
        double rp = (double)ww - d[k] - (k & 1 ? 0 : 14 * (1 + std::sin(ph[k] + k))), i0 = std::floor(rp), f = rp - i0; int64_t ii = (int64_t)i0; const float* bk = b[k].data();
        double v = bk[ii & mask] * (1 - f) + bk[(ii + 1) & mask] * f;
        lp[k] += dc * (v - lp[k]); v = lp[k] * g[k] + 1e-18; x[k] = v; sum += v;
      }
      sum *= .25;
      for (k = 0; k < 8; k++) b[k][ww & mask] = (float)(x[k] - sum + (k & 2 ? -s : s));
      ww++;
      L[i] = (float)((x[0] - x[2] + x[4] - x[6]) * .32); R[i] = (float)((x[1] - x[3] + x[5] - x[7]) * .32);
    }
    w = ww & mask;
  }
};

/* ---------- 9. Superball mallet ---------- */
struct MoanSet { double b; double r[12]; double t, g; };
static const MoanSet MOAN_SETS[4] = {
  {150, {1, 1.42, 1.93, 2.37, 2.96, 3.61, 4.27, 5.2, 6.2, 7.6, 9.1, 11}, .22, .29},
  {82, {1, 1.594, 2.136, 2.296, 2.653, 2.918, 3.156, 3.501, 3.6, 4.06, 4.6, 5.1}, .9, .67},
  {46, {1, 1.62, 2.31, 2.66, 3.4, 4.1, 4.6, 5.5, 6.3, 7.2, 8.4, 9.7}, 4, .82},
  {118, {1, 1.33, 2.756, 3.67, 5.404, 7.19, 8.933, 11.9, 13.34, 17.7, 18.64, 24.8}, 1.1, 1.6}};
struct Moan : Voice_ {
  EState* E; double a1[12] = {}, a2[12] = {}, b[12] = {}, g[12] = {}, y1[12] = {}, y2[12] = {}, fk[12] = {};
  double f = 0, ph = 0, pu = 0, pl = 4, pa = 0, amp = 0, x1 = 0, x2 = 0, nz = 0, dl = 0, jit = 0, sp = 0;
  explicit Moan(EState* e) : E(e) {}
  void reset() override { for (int k = 0; k < 12; k++) y1[k] = y2[k] = 0; amp = 0; pu = 0; x1 = x2 = dl = 0; }
  void render(float* L, float* R, int n, Contact& C) override {
    const double* P = E->P; double sr = E->sr; Rng& rng = E->rng; int sf = (int)P[P_MOAN_SURFACE]; double sz = P[P_MOAN_SIZE], grip = P[P_MOAN_GRIP]; int k;
    const MoanSet& S = MOAN_SETS[sf < 0 ? 0 : sf];
    double pr = clamp(P[P_MOAN_PRESS] * (C.on ? .4 + 1.2 * C.p : 1), 0, 1.3), spd = C.on ? (C.autoOn ? .4 : C.spd) : 0;
    sp += (spd - sp) * .15; spd = sp;
    double wd = sf >= 2 ? E->water * .04 : 0, pos = C.x, st = 1 + (sf == 0 ? 0 : E->matStretch), mt = sf == 0 ? 1 : E->matT, im = sf == 3 ? immerse(E, pos) : 1;
    for (k = 0; k < 12; k++) {
      double fq = S.b / sz * std::pow(S.r[k], st) * E->pitchMul * (1 + wd * E->wv[k]) * im; fk[k] = fq;
      if (fq > sr * .45) { g[k] = 0; a1[k] = a2[k] = b[k] = 0; continue; }
      double t60 = S.t * mt * 900 / (900 + fq * (sf >= 2 ? .3 : 1)), Rr = std::exp(-6.91 / (t60 * sr)), th = TAU * fq / sr;
      a1[k] = 2 * Rr * std::cos(th); a2[k] = Rr * Rr; b[k] = (1 - Rr * Rr) * .5;
      g[k] = (.3 + .7 * std::fabs(std::sin((k + 1) * 2.4 * (pos + .1)))) / (1 + k * .12);
    }
    double fT = C.hz > 0 ? C.hz : P[P_MOAN_PITCH] * (.55 + .75 * pr) * (.75 + .5 * fmin2(spd * 1.5, 1)) * (1 + (C.on && C.hz <= 0 ? (C.y - .5) * .6 : 0)) * (1.15 - .3 * grip);
    fT *= E->pitchMul;
    double best = 1; int lk = 0; for (k = 0; k < 12; k++) { double d = std::log(fk[k] / fT); if (d < 0) d = -d; if (d < best) { best = d; lk = k; } }
    double lock = best < .07 ? (1 - best / .07) * (.3 + .5 * grip) : 0; if (lock > 0) fT += (fk[lk] - fT) * lock;
    if (f == 0) f = fT; f += (fT - f) * .08;
    double aT = spd > .01 ? fmin2(1, spd * 2.5) * (.25 + .75 * fmin2(pr, 1)) * (1 + lock * .6) : 0;
    double f0 = f, p0 = ph, puu = pu, pll = pl, paa = pa, am = amp, X1 = x1, X2 = x2, nzv = nz, dlv = dl, jt = jit;
    double rough = (.004 + .025 * grip) * E->instab, out = S.g * 1.5;
    for (int i = 0; i < n; i++) {
      am += (aT - am) * (aT > am ? .002 : .0008);
      p0 += f0 / sr * (1 + jt);
      if (p0 >= 1) { p0 -= 1; jt = rng.b() * rough; pll = fmax2(3, jsround(sr / (f0 * 2.8))); puu = pll; paa = am * (1 + rng.b() * .15 * grip); }
      double x = 0; if (puu > 0) { x = paa * (.5 - .5 * std::cos(TAU * puu / pll)); puu--; }
      nzv += .2 * (rng.b() - nzv); x += nzv * am * .06;
      double xd = x - X2, o = 0; X2 = X1; X1 = x;
      for (k = 0; k < 12; k++) { double y = a1[k] * y1[k] - a2[k] * y2[k] + b[k] * xd + 1e-18; y2[k] = y1[k]; y1[k] = y; o += y * g[k]; }
      dlv += .15 * (x - dlv);
      L[i] = (float)((o * 6 + (x - dlv) * .5) * out); R[i] = L[i];
    }
    ph = p0; pu = puu; pl = pll; pa = paa; amp = am; x1 = X1; x2 = X2; nz = nzv; dl = dlv + 1e-18; jit = jt;
  }
};

/* ---------- shared wooden body with a contact-mic (piezo) character ---------- */
static const double BODY_F[12] = {98, 131, 176, 219, 268, 337, 402, 486, 590, 712, 868, 1050}, BODY_W[9] = {.6, .5, .8, .35, 1, .5, 1, 0, 1};
struct Body {
  EState* E; double a1[12] = {}, a2[12] = {}, b[12] = {}, y1[12] = {}, y2[12] = {}, x1 = 0, x2 = 0, h1 = 0, h2 = 0, hy1 = 0, hy2 = 0, p1 = 0, p2 = 0, py1 = 0, py2 = 0, sz = 0; int q = 999; double pk = 0;
  explicit Body(EState* e) : E(e) {}
  void reset() { for (int k = 0; k < 12; k++) y1[k] = y2[k] = 0; x1 = x2 = h1 = h2 = hy1 = hy2 = p1 = p2 = py1 = py2 = 0; }
  void render(const float* inp, float* L, float* R, int n) {
    const double* P = E->P; double sr = E->sr, mx = 0; int i, k;
    for (i = 0; i < n; i++) { double a = inp[i] < 0 ? -inp[i] : inp[i]; if (a > mx) mx = a; }
    if (mx < 1e-7) { if (++q > 300) { if (q == 301) reset(); for (i = 0; i < n; i++) { L[i] = 0; R[i] = 0; } return; } } else q = 0;
    double szv = P[P_BODY_SIZE];
    if (szv != sz) { sz = szv; for (k = 0; k < 12; k++) { double f = BODY_F[k] / sz, t60 = .32 / (1 + k * .18), Rr = std::exp(-6.91 / (t60 * sr)), th = TAU * f / sr; a1[k] = 2 * Rr * std::cos(th); a2[k] = Rr * Rr; b[k] = (1 - Rr * Rr) * .5; } }
    double pz = P[P_BODY_PIEZO], X1 = x1, X2 = x2;
    double w0 = TAU * 300 / sr, al = std::sin(w0) / 1.4, c0 = std::cos(w0), a0 = 1 + al, hb0 = (1 + c0) / 2 / a0, ha1 = -2 * c0 / a0, ha2 = (1 - al) / a0;
    double w1 = TAU * fmin2(2600, .45 * sr) / sr,   /* below 5.8 kHz sample rates the 2.6 kHz band-pass would sit past Nyquist and blow up */ al1 = std::sin(w1) / 3, a01 = 1 + al1, pb0 = al1 / a01, pa1 = -2 * std::cos(w1) / a01, pa2 = (1 - al1) / a01, pkv = 0;
    for (i = 0; i < n; i++) {
      double x = inp[i], xd = x - X2, o = 0, od = 0; X2 = X1; X1 = x;
      for (k = 0; k < 12; k++) { double y = a1[k] * y1[k] - a2[k] * y2[k] + b[k] * xd + 1e-18; y2[k] = y1[k]; y1[k] = y; o += y; if (k & 1) od += y; }
      o *= 3; od *= 3;
      double hx = o + x * .7, hpv = hb0 * (hx - 2 * h1 + h2) - ha1 * hy1 - ha2 * hy2; h2 = h1; h1 = hx; hy2 = hy1; hy1 = hpv + 1e-18;
      double pp = pb0 * (hpv - p2) - pa1 * py1 - pa2 * py2; p2 = p1; p1 = hpv; py2 = py1; py1 = pp + 1e-18;
      double pzo = (hpv + pp * 1.6) * 1.4, l = o * (1 - pz) + pzo * pz, r = (o - od * .6) * (1 - pz) + pzo * pz * .9;
      L[i] = (float)l; R[i] = (float)r; double al2 = l < 0 ? -l : l; if (al2 > pkv) pkv = al2;
    }
    x1 = X1; x2 = X2; if (pkv > pk) pk = pkv;
  }
};

/* ---------- harmonizer: two-voice granular pitch shifter, detuned left/right, with feedback ---------- */
struct Harmz {
  EState* E; std::vector<float> buf; int64_t w = 0; double ph[4] = {0, .5, 0, .5}, fbv = 0, lp = 0, dc1 = 0, dc2 = 0; int q = 999; double pk = 0;
  explicit Harmz(EState* e) : E(e), buf(16384, 0.f) {}
  void reset() { std::fill(buf.begin(), buf.end(), 0.f); fbv = lp = dc1 = dc2 = 0; }
  void render(const float* inp, float* L, float* R, int n) {
    const double* P = E->P; double sr = E->sr, mx = 0; int i;
    for (i = 0; i < n; i++) { double a = inp[i] < 0 ? -inp[i] : inp[i]; if (a > mx) mx = a; }
    if (mx < 1e-7 && fbv * fbv < 1e-14) { if (++q > 200) { if (q == 201) reset(); for (i = 0; i < n; i++) { L[i] = 0; R[i] = 0; } return; } } else q = 0;
    double W = jsround(sr * .07), sh = P[P_HARM_SHIFT], dt = P[P_HARM_DETUNE] / 100, fb = P[P_HARM_FB], mix = P[P_HARM_MIX] * 1.4;
    double rA = std::pow(2.0, (sh - dt / 2) / 12), rB = std::pow(2.0, (sh + dt / 2) / 12), dA = (1 - rA) / W, dB = (1 - rB) / W;
    int64_t ww = w; double fv = fbv, lpv = lp, lc = 1 - std::exp(-TAU * 3500 / sr), pkv = 0, d1 = dc1, d2 = dc2;
    for (i = 0; i < n; i++) {
      lpv += lc * (fv - lpv);
      buf[ww & 16383] = (float)(inp[i] + lpv * fb);
      double o[2] = {0, 0};
      for (int v = 0; v < 4; v++) {
        double p = ph[v] + (v < 2 ? dA : dB); if (p >= 1) p -= 1; else if (p < 0) p += 1; ph[v] = p;
        double rp = (double)ww - 2 - p * W, i0 = std::floor(rp), fr = rp - i0; int64_t ii = (int64_t)i0; double x = buf[ii & 16383] * (1 - fr) + buf[(ii + 1) & 16383] * fr, s = std::sin(PI * p);
        o[v >> 1] += x * s * s;
      }
      double l = o[0], r = o[1]; fv = (l + r) * .5; d2 = fv - d1 + .995 * d2; d1 = fv; fv = d2;
      l *= mix; r *= mix; L[i] = (float)l; R[i] = (float)r; double al = l < 0 ? -l : l; if (al > pkv) pkv = al;
      ww++;
    }
    w = ww & 16383; fbv = fv + 1e-18; lp = lpv + 1e-18; dc1 = d1; dc2 = d2; if (pkv > pk) pk = pkv;
  }
};

}  // namespace he
