// Horror Engine DSP core: the engine and the host. Line-for-line port of src/engine.js (seance-ui).
// Horror Engine (c) 2026 Garyck Arntzen (https://x.com/_mintydoge). Plugin release: GNU AGPLv3.
#include "he_core.h"
#include <algorithm>
#include <map>
#include <cstring>
#include <memory>
#include <string>
#include <vector>
#include "he_state.h"
#include "he_voices1.h"
#include "he_voices2.h"

namespace he {

static const int ORDER[NS] = {0, 1, 2, 3, 4, 8, 6, 5, 7};

// ---------- the gesture looper's data (events are shared between undo snapshots, never mutated) ----------
struct LEv { double f; int j; char k; double x, y, p, hz; };
struct REv { double t; int s; char k; double x, y, p, hz; };
struct Stroke { double t0; std::vector<LEv> ev; double len; };
struct Ghost { std::vector<Stroke> st; std::vector<double> gaps; double wait = 0; int cur = -1; double pos = 0; size_t i = 0; double str = 1, xo = 0, pm = 1; bool mir = false; int lastK = -1; };
struct Layer { int id, src; Slot sl; double len, origin; std::shared_ptr<const std::vector<LEv>> ev; size_t i = 0; double pos = 0; bool mute = false, ghost = false; std::unique_ptr<Ghost> gs; uint32_t seed; Rng rng; double startAt = -1; };
struct LayerSnap { int id, src; double len, origin; std::shared_ptr<const std::vector<LEv>> ev; bool mute, ghost; uint32_t seed; };
struct Snap { double frame; bool hasLane; double laneStart, laneLen; std::vector<LayerSnap> L; };

struct Strip { double g = 0; int quiet = 999; double pk = 0; int choke = 0; double d1[2] = {}, d2[2] = {}, dl[2] = {}, am = 0, lo[2] = {}, md[4] = {}; };
struct MChain { double tl[2] = {}, hx[2] = {}, hy[2] = {}; float lk[2][256]; MChain() { std::memset(lk, 0, sizeof lk); } };

class Engine : public EState {
 public:
  // voices: src[] are the first instances; inst[s] lists every instance of voice s
  Ebow ebow0; Hurdy hurdy; Bowed bowed0; Glass glass0; Struck struck; Spring spring; Junk junk; Aura aura; Moan moan;
  std::vector<std::unique_ptr<Voice_>> extra;
  std::vector<Voice_*> inst[NS]; std::vector<Contact> Cv[NS]; std::vector<int> iq[NS];
  std::vector<Slot*> act; FB pbuf;
  Reverb rev; Slot slots[NS][2]; Contact* C[NS]; Strip strip[NS];
  FB tL, tR, dL, dR, rvIn, spIn, rL, rR, inL, inR; bool inOn = false, inAct = false; double inE = 0; int inTail = 0; double inPk = 0, inG = -1;
  int NST = NSTEM, LA; Body body; Harmz harm; FB bdIn, hmIn;
  double wph[32] = {}, wTilt0 = 0, sl = 0;
  FB kn; struct { double lp = 0, fe = 0, se = 0, cd = 0, n = 0; } kd; FB symA, symBb; float* symB; float* symInW; double symPk = 0;
  FB stemL[NSTEM], stemR[NSTEM]; MChain ms[NSTEM];
  FB dpL, dpR, uL, uR, sumL, sumR, lgB;
  struct Dist { double lc = 1, dg = 1, wd = 1, bass = 0, bc = 0, aS = 0, rg = 1; } dist;
  // per-voice Tune, Material and Distance offsets (vOff) and the global macro values (gMac)
  struct VOff { double pitchSt = 0, pitchMul = 1, material = .5, matT = 1, matSlope = .7, matStretch = .02, matBright = .7, distance = .15; Dist dist; } vOff[NS];
  struct GMac { double pitchSt = 0, pitchMul = 1, material = .5, matT = 1, matSlope = .7, matStretch = .02, matBright = .7; } gMac;
  // custom moments
  struct CmEvF { double f; int j; int s; char k; double x, y, p, hz; };
  struct CmLaneF { int k; double min, max; bool exp, isInt, abs; std::vector<std::pair<double, double>> pts; };
  struct CmDefF { int id; int v; std::vector<CmEvF> ev; std::vector<CmLaneF> lanes; double len; };
  struct CmInst { int id; std::shared_ptr<const CmDefF> d; double pos = 0; size_t i = 0; std::vector<int> li; std::map<int, std::unique_ptr<Slot>> sl; double str = 1, xo = 0, pm = 1, dm = 1; };
  struct CmBase { double v; int n; const CmLaneF* L; std::shared_ptr<const CmDefF> keep; };
  std::map<int, std::shared_ptr<const CmDefF>> cmDefs; std::vector<std::unique_ptr<CmInst>> cms; std::map<int, CmBase> cmBase; std::vector<Slot*> cmSl; uint32_t cmN = 0;
  bool recMOn = false; double recMStart = 0; CmCapture recM; std::vector<double> recMp0; bool capReady = false; CmCapture cap;
  int ucnt = 0;
  struct { double c[20] = {}, z[32] = {}, env = 0, rel = 0, ceil = .19, gr = 1; } eg;
  double revBoost = 0; std::vector<float> ring[2]; int rw = 0; std::vector<float> sw[2]; int swN = 0, swP = 0, swEnd = -1; double duckE = 0;
  int lkw = 0; double lh = 1, hw[256]; int hp2 = 0; double lg = 1, gr = 1, pkL = 0, pkR = 0;
  double frame = 0; std::vector<std::unique_ptr<Layer>> layers; bool recOn = false; double recStart = 0; std::vector<REv> recEv; int lid = 1; bool hasLane = false; double laneStart = 0, laneLen = 0; int lver = 0;
  std::vector<Snap> undo, redo;
  // looper clock: lc is the looper's time at the start of the next block (== frame while running free, as in the web app);
  // with Sync to host it is the host's position in quarter notes times spqRef (samples per quarter when the lane was made)
  double lc = 0, lcAdv = BL; bool syncAct = false, syncWant = false, recSync = false; double spqRef = 0, barLen = 0, barLc = 0, recOrigin = 0; Transport tr;
  struct Riser { bool on = false; double t = 0, dur = 0; } riser; struct Ret { bool on = false; double t = 0, dur = 0, p0 = 0, d0 = 0, a0 = 0; } ret;
  struct Sting { bool on = false; double t = 0; bool hit = false; double lead = .8; } sting; struct Drone { bool on = false; double t = 0, next = 0, tgt = 0; } drone;
  struct Heart { bool on = false; double next = 0, dub = -1, drift = 0; } heart;
  struct Walls { bool on = false; double next = 0, jk = 0, gl = 0, jx = .5, jy = .5, jvx = 0, jvy = 0, gx = .5, gdx = 0; } walls;
  struct HB { double t = -1, f0 = 0, f1 = 0, amp = 0, dec = 0; } hb[2]; double hbL1 = 0, hbL2 = 0, hbPh = 0; int hbK = 0; bool hbAct = false;
  double spInPk = 0;

  explicit Engine(double sampleRate, uint32_t seed)
      : EState(sampleRate), ebow0(this), hurdy(this), bowed0(this), glass0(this), struck(this), spring(this), junk(this), aura(this), moan(this), rev(this), body(this), harm(this) {
    sr = sampleRate; rng = Rng(seed ? seed : 1337);
    src0 = &ebow0;
    Voice_* first[NS] = {&ebow0, &hurdy, &bowed0, &glass0, &struck, nullptr, &junk, &aura, &moan};
    int NV[NS] = {2, 1, 3, 3, 1, 1, 1, 1, 1};
    for (int s = 0; s < NS; s++) {
      inst[s].push_back(first[s]);
      for (int k = 1; k < NV[s]; k++) {
        Voice_* v = s == 0 ? (Voice_*)new Ebow(this) : s == 2 ? (Voice_*)new Bowed(this) : (Voice_*)new Glass(this);
        extra.emplace_back(v); inst[s].push_back(v);
      }
      Cv[s].resize(NV[s]); iq[s].assign(NV[s], 999);
      slots[s][0] = Slot(s); slots[s][1] = Slot(s); C[s] = &Cv[s][0];
    }
    LA = (int)jsround(.002 * sr);
    symB = symA.d; symInW = symBb.d; symIn = symInW;
    auto bq = [&](int j, int type, double f, double Q) {
      double w = TAU * fmin2(f, sr * .45) / sr, al = std::sin(w) / (2 * Q), c = std::cos(w), a0 = 1 + al, b0 = (type ? 1 - c : 1 + c) / 2 / a0;
      eg.c[j * 5] = b0; eg.c[j * 5 + 1] = (type ? 2 : -2) * b0; eg.c[j * 5 + 2] = b0; eg.c[j * 5 + 3] = -2 * c / a0; eg.c[j * 5 + 4] = (1 - al) / a0;
    };
    bq(0, 0, 2000, .5412); bq(1, 0, 2000, 1.3066); bq(2, 1, 5000, .5412); bq(3, 1, 5000, 1.3066);
    eg.rel = std::exp(-1 / (.1 * sr));
    ring[0].assign(65536, 0.f); ring[1].assign(65536, 0.f); sw[0].assign(60000, 0.f); sw[1].assign(60000, 0.f);
    for (int i = 0; i < 256; i++) hw[i] = 1;
    macros(true); voiceMacros(true);
    recM.ev.reserve(8192); recM.pv.reserve(8192);
  }

  // first: the constructor's call, made before any parameter is set (the JavaScript reads undefined there)
  void macros(bool first = false) {
    double D = clamp((first ? 0 : P[P_MACRO_DREAD]) + mDread, 0, 1), M = first ? .5 : P[P_MACRO_MATERIAL];
    dread += (D - dread) * .2; D = dread; material += (M - material) * .2; M = material;
    distance += ((sting.on ? 0 : (first ? 0 : P[P_MACRO_DISTANCE])) - distance) * .1;
    pitchSt += ((first ? 0 : P[P_MACRO_PITCH]) + mPitch - pitchSt) * .25; pitchMul = std::pow(2.0, pitchSt / 12);
    detune = pw(D, 2, 15, 60); instab = pw(D, .5, 1, 2.5); rough = pw(D, 0, .15, .5); subAmt = pw(D, 0, .2, .6) + (pitchSt < -12 ? .3 : 0); driveOff = pw(D, 0, .15, .4);
    matT = pw(M, .3, 1, 1.6); matSlope = pw(M, 3, .7, .3); matStretch = pw(M, 0, .02, .05); matBright = pw(M, .15, .7, 1);
    GMac& g = gMac; g.pitchSt = pitchSt; g.pitchMul = pitchMul; g.material = material; g.matT = matT; g.matSlope = matSlope; g.matStretch = matStretch; g.matBright = matBright;
  }
  // per-voice Tune, Material and Distance offsets add on top of the macros (they never replace them)
  void voiceMacros(bool first = false) {
    for (int i = 0; i < NS; i++) {
      VOff& o = vOff[i];
      double pT = (first ? 0 : P[P_MACRO_PITCH]) + mPitch + (first ? 0 : P[SRC_TUNE[i]]) + (first ? 0 : P[SRC_CENTS[i]]) / 100;
      o.pitchSt += (pT - o.pitchSt) * .25; o.pitchMul = std::pow(2.0, o.pitchSt / 12);
      double Mt = first ? .5 : P[P_MACRO_MATERIAL];
      double M = clamp(Mt + (first ? 0 : P[SRC_MATOFF[i]]), 0, 1);
      o.material += (M - o.material) * .2; M = o.material;
      o.matT = pw(M, .3, 1, 1.6); o.matSlope = pw(M, 3, .7, .3); o.matStretch = pw(M, 0, .02, .05); o.matBright = pw(M, .15, .7, 1);
      double Dt = clamp((sting.on ? 0 : (first ? 0 : P[P_MACRO_DISTANCE])) + (first ? 0 : P[SRC_DISTOFF[i]]), 0, 1);
      o.distance += (Dt - o.distance) * .1;
      double D = o.distance; Dist& Dd = o.dist;
      Dd.lc = fmin2(1, 1 - std::exp(-TAU * 20000 * std::pow(.06, D) / sr)); Dd.dg = db(-15 * D); Dd.wd = 1 - .6 * D; Dd.bass = (db(4) - 1) * (1 - D); Dd.bc = 1 - std::exp(-TAU * 150 / sr); Dd.aS = D * .3; Dd.rg = db(-5 * D);
    }
  }
  void useVoice(int s) { VOff& o = vOff[s]; pitchSt = o.pitchSt; pitchMul = o.pitchMul; material = o.material; matT = o.matT; matSlope = o.matSlope; matStretch = o.matStretch; matBright = o.matBright; }
  void useGlobals() { GMac& g = gMac; pitchSt = g.pitchSt; pitchMul = g.pitchMul; material = g.material; matT = g.matT; matSlope = g.matSlope; matStretch = g.matStretch; matBright = g.matBright; }
  void gesture2(Slot& S, int s, char k, double x, double y, double p, double hz) {
    if (k == 'd') {
      S.on = true; S.tx = S.x = x; S.ty = S.y = y; S.p = p; S.spd = 0; S.hz = hz; S.autoSpd = hz > 0 ? .45 + .4 * p : -1;
      if (s == 4) strX = x;
      if (s == 4) struck.trigger(hz > 0 ? hz : (int)P[P_STRUCK_OBJECT] == 0 ? rulerHz(P[P_STRUCK_LENGTH] * std::pow(2.0, (.5 - x) * .75)) : P[P_STRUCK_PITCH] * std::pow(2.0, (x - .5) * 3), p, y);
      if (s == 0 && (int)P[P_EBOW_EXCITE] > 0) S.kick = .3 + .7 * p;
      if (s == 5 && (int)P[P_SPRING_MODE] == 0) spring.hit(p);
      strip[s].quiet = 0;
    } else if (k == 'm') { S.tx = x; S.ty = y; S.p = p; }
    else S.on = false;
  }
  void user(int s, char k, double x, double y, double p, double hz) {
    gesture2(slots[s][0], s, k, x, y, p, hz);
    if (recOn) recEv.push_back({lc, s, k, x, y, p, hz});
    if (recMOn) recM.ev.push_back({frame - recMStart, s, k, x, y, p, hz});
  }
  void smooth(Slot& S, double dt) {
    if (!S.on) { S.spd *= .8; return; }
    double nx = S.x + (S.tx - S.x) * .35, ny = S.y + (S.ty - S.y) * .35, d = std::sqrt((nx - S.x) * (nx - S.x) + (ny - S.y) * (ny - S.y));
    S.x = nx; S.y = ny; S.spd += (fmin2(1, d / dt / 2.5) - S.spd) * .1;
  }
  int actIndexOf(Slot* o) { for (size_t i = 0; i < act.size(); i++) if (act[i] == o) return (int)i; return -1; }
  void contacts() {
    double dt = BL / sr; int s, n; size_t j, k;
    for (s = 0; s < NS; s++) { smooth(slots[s][0], dt); smooth(slots[s][1], dt); }
    for (auto& Ly : layers) smooth(Ly->sl, dt);
    for (Slot* cs : cmSl) smooth(*cs, dt);
    for (s = 0; s < NS; s++) {
      std::vector<Contact>& cv = Cv[s]; size_t nv = cv.size(); n = 0;
      auto put = [&](Slot* S) { if ((size_t)n < act.size()) act[n] = S; else act.push_back(S); n++; };
      if (slots[s][0].on) put(&slots[s][0]);
      if (slots[s][1].on) put(&slots[s][1]);
      for (auto& Ly : layers) if (Ly->src == s && Ly->sl.on) put(&Ly->sl);
      for (Slot* cs : cmSl) if (cs->src == s && cs->on) put(cs);
      for (k = 0; k < nv; k++) { Slot* o = cv[k].own; if (o && (!o->on || o->src != s)) cv[k].own = nullptr; }
      for (j = 0; j < (size_t)n; j++) {
        Slot* S = act[j]; bool has = false;
        for (k = 0; k < nv; k++) if (cv[k].own == S) { has = true; break; }
        if (has) continue;
        int pick = -1, worst = -1;
        for (k = 0; k < nv; k++) if (!cv[k].own) { pick = (int)k; break; }
        if (pick < 0) for (k = 0; k < nv; k++) { int pi = actIndexOf(cv[k].own); if (pi > (int)j && pi > worst) { worst = pi; pick = (int)k; } }
        if (pick >= 0) cv[pick].own = S;
      }
      for (k = 0; k < nv; k++) {
        Contact& Cc = cv[k]; Slot* g = Cc.own;
        if (g) { Cc.on = true; Cc.x = g->x; Cc.y = g->y; Cc.p = g->p; Cc.hz = g->hz; Cc.autoOn = g->autoSpd >= 0; Cc.spd = g->autoSpd >= 0 ? g->autoSpd : g->spd; if (g->kick > 0) { Cc.kick = g->kick; g->kick = 0; } }
        else if (k == 0 && P[SRC_HOLD[s]] > .5) { Cc.on = true; Cc.p = .6; Cc.spd = .4; Cc.autoOn = true; Cc.hz = 0; }
        else { Cc.on = false; Cc.spd = 0; Cc.autoOn = false; }
      }
    }
  }

  /* looper: gestures are re-performed, not replayed audio (see engine.js for the lane clock) */
  double phaseOf(const Layer& L, double f) { double d = std::fmod(f - L.origin, L.len); return d < 0 ? d + L.len : d; }
  void seekLayer(Layer& L) { double ph = phaseOf(L, lc); size_t i = 0; while (i < L.ev->size() && (*L.ev)[i].f < ph) i++; L.i = i; L.pos = ph; }
  Snap snap() { Snap S{frame, hasLane, laneStart, laneLen, {}}; for (auto& L : layers) S.L.push_back({L->id, L->src, L->len, L->origin, L->ev, L->mute, L->ghost, L->seed}); return S; }
  // a layer is going away: nothing may keep pointing at its slot (in the JavaScript the old object simply goes quiet)
  void forget(Layer& L) { L.sl.on = false; for (int s = 0; s < NS; s++) for (auto& c : Cv[s]) if (c.own == &L.sl) c.own = nullptr; for (auto& a : act) if (a == &L.sl) a = nullptr; }
  void pushUndo() { ucnt++; undo.push_back(snap()); if (undo.size() > 50) undo.erase(undo.begin()); redo.clear(); }
  void restore(const Snap& S) {
    for (auto& L : layers) forget(*L);
    hasLane = S.hasLane; laneStart = S.laneStart; laneLen = S.laneLen;
    layers.clear();
    for (auto& q : S.L) {
      std::unique_ptr<Layer> L(new Layer{q.id, q.src, Slot(q.src), q.len, q.origin, q.ev, 0, 0, q.mute, q.ghost, nullptr, q.seed, Rng(q.seed)});
      if (L->ghost) ghostPrep(*L); else seekLayer(*L);
      layers.push_back(std::move(L));
    }
    lver++;
  }
  void loopCmd(const Msg& m) {
    const std::string& a = m.a;
    if (a == "undo" || a == "redo") { auto& from = a == "undo" ? undo : redo; auto& to = a == "undo" ? redo : undo; if (from.empty()) return; to.push_back(snap()); Snap S = from.back(); from.pop_back(); restore(S); return; }
    if (a == "rec") {
      if (recOn) { Msg s2 = m; s2.a = "stop"; return loopCmd(s2); }
      recOn = true; recStart = lc; recEv.clear(); recSync = syncAct && barLen > 0;
      // synced: the layer starts on a bar line (the one just passed if we are less than an eighth of a bar late, else the next)
      if (recSync) { double pb = prevBar(lc); recOrigin = lc - pb < .125 * barLen ? pb : pb + barLen; }
    }
    else if (a == "stop" && recOn) {
      double R0 = recStart, dur = lc - R0; std::vector<REv> ev = recEv; recOn = false; recEv.clear();
      bool synced = recSync && syncAct && barLen > 0; recSync = false;
      if (synced) { if (ev.empty()) return; }
      else if (dur < sr * .25 || ev.empty()) return;
      int cnt[NS] = {}; int best = ev[0].s; for (auto& e : ev) { cnt[e.s]++; if (cnt[e.s] > cnt[best]) best = e.s; }
      std::vector<REv> evb; for (auto& e : ev) if (e.s == best) evb.push_back(e);
      double origin, len;
      if (synced) {   // whole bars from the bar line the recording started on
        origin = recOrigin; double bars = fmax2(1, jsround((lc - origin) / barLen));
        if (!hasLane) { hasLane = true; laneStart = origin; laneLen = len = bars * barLen; }
        else if (m.free) len = bars * barLen;
        else { len = fmax2(1, jsround((lc - origin) / laneLen)) * laneLen; origin = laneStart; }
      }
      else if (!hasLane) { hasLane = true; laneStart = R0; laneLen = dur; origin = R0; len = dur; }
      else if (m.free) { origin = R0; len = dur; }
      else { len = fmax2(1, jsround(dur / laneLen)) * laneLen; origin = laneStart; }
      bool down = false; for (auto& e : evb) { if (e.k == 'd') down = true; else if (e.k == 'u') down = false; }
      if (down) evb.push_back({lc - lcAdv, best, 'u', 0, 0, 0, 0});
      auto out = std::make_shared<std::vector<LEv>>(); int j = 0;
      for (auto& e : evb) { double d = std::fmod(e.t - origin, len); if (d < 0) d += len; out->push_back({d, j++, e.k, e.x, e.y, e.p, e.hz}); }
      std::stable_sort(out->begin(), out->end(), [](const LEv& p, const LEv& q) { return p.f < q.f || (p.f == q.f && p.j < q.j); });
      pushUndo();
      uint32_t seed = rng.s ^ (uint32_t)((uint64_t)lid * 2654435761ULL);
      std::unique_ptr<Layer> L(new Layer{lid++, best, Slot(best), len, origin, out, 0, 0, false, false, nullptr, seed, Rng(seed)});
      seekLayer(*L); if (synced) L->startAt = nextBar(lc);   // playback starts on the next bar line
      layers.push_back(std::move(L)); lver++;
    }
    else if (a == "clear") { if (layers.empty()) return; pushUndo(); for (auto& L : layers) forget(*L); layers.clear(); hasLane = false; lver++; }
    else {
      size_t i; for (i = 0; i < layers.size(); i++) if (layers[i]->id == m.layer) break;
      if (i >= layers.size()) return;
      pushUndo(); Layer& L = *layers[i]; L.sl.on = false;
      if (a == "del") { forget(L); layers.erase(layers.begin() + i); if (layers.empty()) hasLane = false; }
      else if (a == "mute") L.mute = m.lv != 0;
      else if (a == "src") { L.src = (int)m.lv; L.sl.src = L.src; }
      else if (a == "ghost") { L.ghost = m.lv != 0; if (L.ghost) ghostPrep(L); else seekLayer(L); }
      lver++;
    }
  }
  void ghostPrep(Layer& L) {
    auto G = std::make_unique<Ghost>(); bool hasCur = false; Stroke cur; double last = 0;
    for (auto& e : *L.ev) {
      if (e.k == 'd') { if (hasCur) G->st.push_back(cur); G->gaps.push_back(e.f - last); cur = Stroke{e.f, {e}, 0}; hasCur = true; }
      else if (hasCur) { cur.ev.push_back(e); if (e.k == 'u') { cur.len = e.f - cur.t0; last = e.f; G->st.push_back(cur); hasCur = false; } }
    }
    if (hasCur) { cur.len = L.len - cur.t0; G->st.push_back(cur); }
    G->gaps.push_back(fmax2(0, L.len - last));
    L.gs = std::move(G);
  }
  void fireLayer(Layer& L, double upTo) {
    const auto& ev = *L.ev;
    while (L.i < ev.size() && ev[L.i].f < upTo) { const LEv& e = ev[L.i++]; if (!L.mute) gesture2(L.sl, L.src, e.k, e.x, e.y, e.p, e.hz); }
  }
  double prevBar(double x) const { return barLc + std::floor((x - barLc) / barLen + 1e-9) * barLen; }
  double nextBar(double x) const { return barLc + std::ceil((x - barLc) / barLen - 1e-9) * barLen; }
  // once per block, before the looper runs: follow the host when synced, else keep counting like the web app
  void clockStep() {
    bool act = syncWant && tr.valid && tr.playing && tr.bpm > 0 && tr.num > 0 && tr.den > 0;
    if (!act) { syncAct = false; lcAdv = BL; return; }
    double spq = 60.0 / tr.bpm * sr;
    if (spqRef <= 0 || (!hasLane && !recOn)) spqRef = spq;   // the lane keeps the tempo it was made at; host tempo changes scale it
    double qpb = tr.num * 4.0 / tr.den, ppq = tr.ppq;
    double bp = tr.barPpq >= 0 && tr.barPpq <= ppq + 1e-9 ? tr.barPpq : std::floor(ppq / qpb + 1e-9) * qpb;
    while (bp + qpb <= ppq + 1e-9) bp += qpb;
    barLen = qpb * spqRef; barLc = bp * spqRef;
    double target = ppq * spqRef; bool jump = !syncAct || std::fabs(target - lc) > BL;
    double delta = target - lc; lc = target; lcAdv = BL * spqRef / spq; syncAct = true;
    if (jump) relock(delta);
  }
  // the host started, looped or jumped: every layer picks up at the host's position
  void relock(double delta) {
    for (auto& L : layers) { L->sl.on = false; L->startAt = -1; if (L->gs) L->gs->cur = -1; else seekLayer(*L); }
    if (recOn) { recStart += delta; recOrigin += delta; for (auto& e : recEv) e.t += delta; }
  }
  void loopRun() {
    for (auto& LP : layers) {
      Layer& L = *LP;
      if (L.ghost && L.gs && !L.gs->st.empty()) {
        Ghost& G = *L.gs; Rng& r = L.rng; Slot& S = L.sl;
        if (G.cur < 0) {
          G.wait -= BL;
          if (G.wait <= 0 && !L.mute) {
            int k = (int)(r.u() * G.st.size()); if (k == G.lastK && G.st.size() > 1) k = (k + 1) % (int)G.st.size();
            G.lastK = k; G.cur = k; G.pos = 0; G.i = 0; G.str = .7 + r.u() * .7; G.xo = r.b() * .12 * instab; G.pm = .75 + r.u() * .45; G.mir = r.u() < .25;
          }
        }
        if (G.cur >= 0) {
          Stroke& cs = G.st[G.cur];
          G.pos += BL / G.str;
          while (G.i < cs.ev.size() && cs.ev[G.i].f - cs.t0 <= G.pos) {
            const LEv& e = cs.ev[G.i++];
            gesture2(S, L.src, e.k, clamp((G.mir ? 1 - e.x : e.x) + G.xo, 0, 1), e.y, clamp(e.p * G.pm, 0, 1), e.hz);
          }
          if (G.pos >= cs.len && G.i >= cs.ev.size()) {
            S.on = false; G.cur = -1;
            double gi = r.u(); double gw = r.u();
            G.wait = G.gaps[(size_t)(gi * G.gaps.size())] * (.4 + gw * 1.5) / (.7 + .9 * dread) + sr * .05;
          }
        }
        L.pos = phaseOf(L, lc + lcAdv);
        continue;
      }
      if (L.startAt >= 0) {   // synced layer waiting for its first bar line
        double e0 = lc + lcAdv;
        if (e0 <= L.startAt) { L.pos = phaseOf(L, e0); continue; }
        double ps = phaseOf(L, fmax2(L.startAt, lc)), pe = phaseOf(L, e0); const auto& ev = *L.ev;
        size_t i = 0; while (i < ev.size() && ev[i].f < ps) i++; L.i = i;
        if (ps <= pe) fireLayer(L, pe); else { fireLayer(L, L.len); L.i = 0; fireLayer(L, pe); }
        L.pos = pe; L.startAt = -1; continue;
      }
      double ph = phaseOf(L, lc), end = ph + lcAdv;
      // synced: the host clock is not an exact sum of block lengths, so notice a wrap that fell between two blocks
      if (syncAct && ph < L.pos - .5 * L.len) { fireLayer(L, L.len); L.i = 0; }
      if (end < L.len) fireLayer(L, end);
      else { fireLayer(L, L.len); L.i = 0; fireLayer(L, end - L.len); }
      L.pos = end >= L.len ? end - L.len : end;
    }
  }

  /* moments: scripted gestures */
  void autoG(int s, bool on, double x = .5, double y = .5, double p = .6, double spd = -1, double hz = 0) {
    Slot& S = slots[s][1];
    if (on) { if (!S.on) { S.x = x; S.y = y; strip[s].quiet = 0; } S.on = true; S.tx = x; S.ty = y; S.p = p; S.autoSpd = spd; S.hz = hz; }
    else S.on = false;
  }
  void moment(int id, bool on, double arg) {
    if (id == M_RISER) { if (on && !riser.on) { riser = {true, 0, (arg > 0 ? arg : 8) * sr}; ret.on = false; } else if (!on && riser.on) riserEnd(false); }
    else if (id == M_STINGER) { if (!sting.on) { sting = {true, 0, false, .8}; swell(.8); } }
    else if (id == M_DRONE) { if (on) drone = {true, 0, 20 * sr, 0}; else if (drone.on) { drone.on = false; autoG(1, false); autoG(0, false); autoFreeze = false; } }
    else if (id == M_HEART) { if (on) heart = {true, 0, -1, 0}; else heart.on = false; }
    else if (id == M_WALLS) { if (on) { walls = Walls(); walls.on = true; walls.next = sr * .3; } else if (walls.on) { walls.on = false; autoG(6, false); autoG(3, false); } }
  }

  /* custom moments: a captured phrase (gestures on any voice plus knob and macro moves) played once through the models.
     Times arrive in seconds and become frames here. Each firing gets its own seeded variation (tempo, position, pressure,
     depth of the knob moves), like a ghost but gentler. Continuous knobs ride on top of where the live knob is (relative,
     in normalised knob travel); switches and choices are set outright. While a moment holds a knob, live moves of that knob
     update the base it rides on, and the knob returns to that live value when the last moment using it ends. */
  static double cmNorm(const CmLaneF& L, double v) { return L.exp ? std::log(fmax2(1e-9, v) / L.min) / std::log(L.max / L.min) : (v - L.min) / (L.max - L.min); }
  static double cmDenorm(const CmLaneF& L, double n) { n = clamp(n, 0, 1); double v = L.exp ? L.min * std::pow(L.max / L.min, n) : L.min + (L.max - L.min) * n; return L.isInt ? jsround(v) : v; }
  void cmDefine(int id, const CmDefinition* d) {
    for (int i = (int)cms.size() - 1; i >= 0; i--) if (cms[i]->id == id) cmStop(i);
    if (!d) { cmDefs.erase(id); return; }
    auto D = std::make_shared<CmDefF>(); D->id = id; int j = 0;
    for (auto& e : d->ev) { D->ev.push_back({jsround(e.t * sr), j, e.s, e.k, e.x, e.y, e.p, e.hz}); j++; }
    std::stable_sort(D->ev.begin(), D->ev.end(), [](const CmEvF& a, const CmEvF& b) { return a.f < b.f || (a.f == b.f && a.j < b.j); });
    for (auto& L : d->lanes) {
      if (L.k < 0 || L.k >= NPARAM || L.pts.empty() || !(L.max > L.min)) continue;
      CmLaneF F{L.k, L.min, L.max, L.exp && L.min > 0, L.isInt, L.abs, {}};
      for (auto& q : L.pts) F.pts.push_back({jsround(q.first * sr), q.second});
      D->lanes.push_back(std::move(F));
    }
    double len = jsround(d->len * sr); for (auto& e : D->ev) if (e.f > len) len = e.f; for (auto& L : D->lanes) { double t = L.pts.back().first; if (t > len) len = t; }
    D->len = len; D->v = d->voice >= 0 && d->voice < NS ? d->voice : -1;
    cmDefs[id] = D;
  }
  void cmToggle(int id, bool on) {
    int I = -1; for (size_t i = 0; i < cms.size(); i++) if (cms[i]->id == id) I = (int)i;
    if (I >= 0 && !on) cmStop(I); else if (I < 0 && on) cmStart(id);
  }
  void cmStart(int id) {
    auto it = cmDefs.find(id); if (it == cmDefs.end()) return;
    auto d = it->second; cmN++;
    uint32_t seed = rng.s ^ (uint32_t)(cmN * 2654435761u) ^ (uint32_t)(int64_t)frame; Rng r(seed ? seed : 1); double ins = instab != 0 ? instab : 1;
    std::unique_ptr<CmInst> I(new CmInst()); I->id = id; I->d = d; I->li.assign(d->lanes.size(), -1);
    I->str = 1 + r.b() * .05; I->xo = r.b() * .03 * ins; I->pm = .9 + r.u() * .2; I->dm = .9 + r.u() * .2;
    for (auto& L : d->lanes) { auto b = cmBase.find(L.k); if (b == cmBase.end()) b = cmBase.emplace(L.k, CmBase{P[L.k], 0, &L, d}).first; b->second.n++; }
    cms.push_back(std::move(I)); cmSlots();
  }
  void cmStop(int idx) {
    CmInst& I = *cms[idx];
    for (auto& kv : I.sl) { kv.second->on = false; Slot* q = kv.second.get(); for (int s2 = 0; s2 < NS; s2++) for (auto& c : Cv[s2]) if (c.own == q) c.own = nullptr; for (auto& a2 : act) if (a2 == q) a2 = nullptr; }
    for (auto& L : I.d->lanes) { auto b = cmBase.find(L.k); if (b != cmBase.end() && --b->second.n <= 0) { P[L.k] = b->second.v; cmBase.erase(b); } }
    cms.erase(cms.begin() + idx);
    cmSlots();
  }
  void cmSlots() { cmSl.clear(); for (auto& I : cms) for (auto& kv : I->sl) cmSl.push_back(kv.second.get()); }
  // a live knob move: while a custom moment holds that knob it moves the base the moment rides on
  void setP(int k, double v) {
    auto b = cmBase.find(k); if (b != cmBase.end()) b->second.v = v; else P[k] = v;
    if (recMOn) recM.pv.push_back({frame - recMStart, k, v});
  }
  void cmRun() {
    if (cms.empty()) return;
    std::map<int, double> sum, ab; std::vector<int> done; bool grew = false;
    for (size_t q = 0; q < cms.size(); q++) {
      CmInst& I = *cms[q]; const CmDefF& d = *I.d; const auto& ev = d.ev;
      I.pos += BL / I.str;
      while (I.i < ev.size() && ev[I.i].f <= I.pos) {
        const CmEvF& e = ev[I.i++]; int s = d.v >= 0 ? d.v : e.s;
        auto it = I.sl.find(s); Slot* S;
        if (it == I.sl.end()) { S = new Slot(s); I.sl.emplace(s, std::unique_ptr<Slot>(S)); grew = true; } else S = it->second.get();
        gesture2(*S, s, e.k, clamp(e.x + I.xo, 0, 1), e.y, clamp(e.p * I.pm, 0, 1), e.hz);
      }
      for (size_t l = 0; l < d.lanes.size(); l++) {
        const CmLaneF& L = d.lanes[l]; int j = I.li[l];
        while (j + 1 < (int)L.pts.size() && L.pts[j + 1].first <= I.pos) j++;
        I.li[l] = j; if (j < 0) continue;
        if (L.abs) ab[L.k] = L.pts[j].second; else { auto sm = sum.find(L.k); double prev = sm == sum.end() ? 0 : sm->second; sum[L.k] = prev + L.pts[j].second * I.dm; }
      }
      if (I.pos >= d.len && I.i >= ev.size()) done.push_back(I.id);
    }
    if (grew) cmSlots();
    for (auto& kv : cmBase) { int k = kv.first; CmBase& B = kv.second; auto a = ab.find(k); if (a != ab.end()) P[k] = a->second; else { auto sm = sum.find(k); if (sm != sum.end()) P[k] = cmDenorm(*B.L, cmNorm(*B.L, B.v) + sm->second); } }
    for (int id : done) for (size_t i = 0; i < cms.size(); i++) if (cms[i]->id == id) { cmStop((int)i); break; }
  }
  void cmRec(bool on) {
    if (on) { if (!recMOn) { recMOn = true; recMStart = frame; recM.ev.clear(); recM.pv.clear(); recMp0.assign(P, P + NPARAM); for (auto& kv : cmBase) recMp0[kv.first] = kv.second.v; } }
    else if (recMOn) {
      recMOn = false; bool held[NS] = {};
      for (auto& x : recM.ev) { if (x.k == 'd') held[x.s] = true; else if (x.k == 'u') held[x.s] = false; }
      for (int hs = 0; hs < NS; hs++) if (held[hs]) recM.ev.push_back({frame - recMStart, hs, 'u', 0, 0, 0, 0});
      cap.sr = sr; cap.dur = frame - recMStart; cap.ev = recM.ev; cap.pv = recM.pv; cap.p0.clear();
      for (auto& x : recM.pv) { bool seen = false; for (auto& q : cap.p0) if (q.first == x.k) { seen = true; break; } if (!seen) cap.p0.push_back({x.k, recMp0[x.k]}); }
      capReady = true;
    }
  }
  void swell(double sec) {
    int n = (int)fmin2(60000, (double)(int)(sec * sr));
    for (int i = 0; i < n; i++) { int j = (rw - 1 - i) & 65535; sw[0][i] = ring[0][j]; sw[1][i] = ring[1][j]; }
    swN = n; swP = 0;
  }
  void riserEnd(bool hard) {
    riser.on = false; autoG(2, false); autoG(0, false);
    ret = {true, 0, jsround(.5 * sr), mPitch, mDread, mAura};
    if (hard) { strip[0].choke = 3; strip[2].choke = 3; }
  }
  void hbOn(int k, double f0, double f1, double amp, double dec) { HB& v = hb[k]; v.t = 0; v.f0 = f0; v.f1 = f1; v.amp = amp; v.dec = dec; hbK = k; hbAct = true; }
  void hbRender(float* oL, float* oR, int n) {
    double att = .014 * sr, gl = .06 * sr, a = 1 - std::exp(-2 * PI * 160 / sr), l1 = hbL1, l2 = hbL2, ph = hbPh, g = .3; HB& cur = hb[hbK];
    for (int i = 0; i < n; i++) {
      double env = 0;
      for (int k = 0; k < 2; k++) {
        HB& v = hb[k]; if (v.t < 0) continue;
        double t = v.t, e = t < att ? .5 - .5 * std::cos(PI * t / att) : std::exp(-(t - att) / (v.dec * sr));
        env += e * v.amp; v.t++; if (t > att && e < 1e-4) v.t = -1;
      }
      double f = cur.t >= 0 ? cur.f1 + (cur.f0 - cur.f1) * std::exp(-cur.t / gl) : cur.f1;
      ph += 6.283185307 * f / sr; if (ph > 6.283185307) ph -= 6.283185307;
      double x = std::tanh(std::sin(ph) * env * 1.6) * .7;
      l1 += a * (x - l1); l2 += a * (l1 - l2);
      oL[i] = (float)(oL[i] + l2 * g); oR[i] = (float)(oR[i] + l2 * g);
    }
    hbL1 = l1; hbL2 = l2; hbPh = ph;
    if (hb[0].t < 0 && hb[1].t < 0 && std::fabs(l2) < 1e-6) hbAct = false;
  }
  void momRun() {
    Rng& r = rng;
    if (riser.on) {
      riser.t += BL; double t = riser.t / riser.dur, e = (std::exp(3 * t) - 1) / 19.086;
      mPitch = 11 * e; mDread = .6 * e; mAura = e;
      autoG(2, true, .3 + .25 * std::sin(t * 37), .25 + .6 * e, .45 + .45 * e, .2 + .8 * e);
      autoG(0, true, .5, .3, .3 + .7 * e, e * .5);
      if (t >= 1) riserEnd(true);
    }
    if (ret.on) {
      ret.t += BL; double k = ret.t >= ret.dur ? 0 : .5 + .5 * std::cos(PI * ret.t / ret.dur);
      mPitch = ret.p0 * k; mDread = ret.d0 * k; mAura = ret.a0 * k; if (k == 0) ret.on = false;
    }
    if (sting.on) {
      if (!sting.hit) autoG(0, true, .5, .2, 1, 1, P[P_EBOW_PITCH] * 4);
      double hitAt = jsround(.8 * sr);
      if (!sting.hit && sting.t + BL > hitAt) {
        sting.hit = true; double dl = hitAt - sting.t;
        struck.trigger(55, 1, .3, 2, .85, 9, 0, dl); struck.trigger(41, 1, .4, 4, .3, 1.2, 0, dl); struck.trigger(55 * 1.4142 * 2, .8, .6, 2, .9, 7, 0, dl); struck.trigger(110 * 1.0595, .7, .2, 1, .9, 6, 0, dl);
        spring.hit(1, dl); strip[4].quiet = 0; strip[5].quiet = 0; revBoost = 1; swEnd = (int)dl;
      }
      sting.t += BL;
      if (sting.t > 2.1 * sr) { autoG(0, false); sting.on = false; }
    }
    if (drone.on) {
      drone.t += BL;
      autoG(1, true, .5, .5, .55, .32); autoG(0, true, .5, .5, .4, 0, P[P_HURDY_ROOT]);
      if (drone.t > 2 * sr) autoFreeze = true;
      drone.next -= BL;
      if (drone.next <= 0) {
        static const double O1[4] = {1.5, 4.0 / 3, 2, 1.5}, O2[4] = {1.5, 1.41421, 4.0 / 3, 1.6818}, O3[4] = {1.41421, 1.05946, 1.49831, 1.41421 * 1.05946};
        double D2 = dread; const double* opts = D2 < .3 ? O1 : D2 < .7 ? O2 : O3;
        drone.tgt = opts[(int)(r.u() * 4)]; drone.next = (20 + r.u() * 20) * sr;
      }
      if (drone.tgt != 0) { if (dr2 == 0) dr2 = 1.5; dr2 += (drone.tgt - dr2) * .0015; }
    } else dr2 = 0;
    if (heart.on) {
      heart.next -= BL;
      if (heart.next <= 0) {
        heart.drift = heart.drift * .9 + r.b() * 1.2 * instab;
        double bpm = fmax2(46, fmin2(76, 54 + dread * 16 + heart.drift)), per = 60 / bpm * sr;
        heart.next += per * (1 + r.b() * .02 * instab); heart.dub = (.155 - .03 * dread) * sr;
        hbOn(0, 68 / pitchMul, 46 / pitchMul, 1, .09); duckE = 1;
      }
      if (heart.dub > 0) { heart.dub -= BL; if (heart.dub <= 0) { hbOn(1, 76 / pitchMul, 54 / pitchMul, .42, .1); duckE = fmax2(duckE, .7); heart.dub = -1; } }
    }
    if (walls.on) {
      Walls& m = walls; m.next -= BL;
      if (m.next <= 0) {
        m.next = -std::log(1 - r.u() * .98) * sr / (.35 + 1.5 * dread);
        double u = r.u();
        if (u < .5) { m.jk = sr * (.25 + r.u() * .9); m.jx = r.u(); m.jy = r.u(); m.jvx = r.b() * 1.5; m.jvy = r.b() * 1.5; }
        else if (u < .8) { m.gl = sr * (.06 + r.u() * .3); m.gx = r.u(); m.gdx = r.b() * 2.5; }
        else if (u < .93) { spring.hit(.1 + r.u() * .25); strip[5].quiet = 0; }
        else { double a1 = 70 + r.u() * 60; double a2 = .3 + r.u() * .4; double a3 = r.u(); struck.trigger(a1, a2, a3, 4, .5, 1); strip[4].quiet = 0; }
      }
      double dt = BL / sr;
      if (m.jk > 0) { m.jk -= BL; m.jx = clamp(m.jx + m.jvx * dt, .05, .95); m.jy = clamp(m.jy + m.jvy * dt, .05, .95); if (r.u() < .05) { m.jvx = r.b() * 2; m.jvy = r.b() * 2; } autoG(6, true, m.jx, m.jy, .9, -1); } else autoG(6, false);
      if (m.gl > 0) { m.gl -= BL; m.gx = clamp(m.gx + m.gdx * dt, 0, 1); autoG(3, true, m.gx, .5 + .3 * std::sin(m.gl * .001), .22, -1); } else autoG(3, false);
    }
  }
  double egBand(int o, double x) {
    for (int j = 0; j < 4; j++) {
      int k = j * 5, q = o + j * 4; double y = eg.c[k] * x + eg.c[k + 1] * eg.z[q] + eg.c[k + 2] * eg.z[q + 1] - eg.c[k + 3] * eg.z[q + 2] - eg.c[k + 4] * eg.z[q + 3];
      eg.z[q + 1] = eg.z[q]; eg.z[q] = x; eg.z[q + 3] = eg.z[q + 2]; eg.z[q + 2] = y; x = y;
    }
    return x;
  }
  void knock(double amt) {
    float* x = kn.d; double lc = 1 - std::exp(-TAU * 150 / sr), rf = std::exp(-1 / (.01 * sr)), ks = 1 - std::exp(-1 / (.25 * sr)), thr = .004;
    for (int i = 0; i < BL; i++) {
      kd.lp += lc * (x[i] - kd.lp); double h = x[i] - kd.lp, a = h < 0 ? -h : h; kd.fe = a > kd.fe ? a : kd.fe * rf; kd.se += ks * (kd.fe - kd.se);
      if (kd.cd > 0) kd.cd--;
      else if (kd.fe > thr && kd.fe > 4 * kd.se + thr) { spring.hit(fmin2(1, kd.fe * 8) * amt, i); kd.cd = (double)(int)(.09 * sr); kd.n++; sl = fmin2(1, sl + kd.fe * 2 * amt); }
    }
    kd.lp += 1e-18; kd.se += 1e-18;
  }
  void resetVoice(int s) { if (s == 5) spring.reset(); else for (auto* v : inst[s]) v->reset(); }
  double stripRun(int s, bool stereo, bool sustained) {
    Strip& st = strip[s]; float* sL = stemL[s].d; float* sR = stemR[s].d; float* rv = rvIn.d; float* sp = spIn.d;
    double gT = P[SRC_MUTE[s]] > .5 ? 0 : db(P[SRC_LEVEL[s]]);
    if (st.choke > 0) { gT = 0; if (--st.choke == 0) resetVoice(s); }
    double pan = (P[SRC_PAN[s]] + 1) * .7854, pl = std::cos(pan) * 1.4142, prr = std::sin(pan) * 1.4142;
    double drvP = P[SRC_DRIVE[s]], drv = clamp(drvP + (drvP > .01 ? driveOff : 0), 0, 1), rs = P[SRC_REV[s]] * (s == 4 ? 1 + revBoost : 1), ss = s == 5 ? 0 : P[SRC_SPR[s]];
    if (s == 0) gT *= db(pw(dread, 0, 1.2, 3.8));
    if (duckE > .001 && (s == 0 || s == 1 || s == 7)) gT *= 1 - (1 - db(-(3 + 6 * dread))) * duckE;
    double rough0 = sustained ? rough : 0, g = st.g, gi = (gT - g) / BL, pk = 0; int i;
    bool guard = s == 3 && P[P_GLASS_GUARD] > .5;
    if (s == 3 && !guard) eg.env = 0;
    double hs = P[SRC_HSEND[s]], bw = BODY_W[s] * P[P_BODY_AMT], kw = s == 5 ? 0 : bw, swt = s == 1 ? 1 + bw : s == 0 || s == 5 ? 0 : bw;
    float* hb0 = hmIn.d; float* bb = bdIn.d; float* knn = kn.d; float* sy = symB;
    const Dist& Dv = vOff[s].dist; double lc = Dv.lc, dg = Dv.dg, wd = Dv.wd, bass = Dv.bass, bc = Dv.bc, aS = Dv.aS, rg = Dv.rg; double* lo = st.lo; double* md = st.md;
    if (drv > .005) {
      double pre = 1 + drv * drv * 40, mk = 1 / std::pow(pre, .55), tc = 1 - std::exp(-TAU * (2200 + 7000 * (1 - drv * .6)) / sr);
      for (int c = 0; c < (stereo ? 2 : 1); c++) {
        float* b = c ? tR.d : tL.d; double d1 = st.d1[c], d2 = st.d2[c], dl = st.dl[c];
        for (i = 0; i < BL; i++) {
          double x = b[i] * pre + .08, y = x / (1 + (x < 0 ? -x * .8 : x));
          y = y > 1 ? 1 : y; d2 = y - d1 + .997 * d2; d1 = y; dl += tc * (d2 - dl); b[i] = (float)(b[i] * (1 - drv) * (1 - drv) + dl * mk * 2.2 * fmin2(1, drv * 3));
        }
        st.d1[c] = d1; st.d2[c] = d2; st.dl[c] = dl + 1e-18;
      }
    }
    double am = st.am, ainc = TAU * (22 + 45 * dread) / sr, rnorm = 1 / (1 - rough0 * .5);
    for (i = 0; i < BL; i++) {
      g += gi;
      double a = 1; if (rough0 > 0) { am += ainc; if (am > TAU) am -= TAU; a = (1 - rough0 * (.5 + .5 * std::sin(am))) * rnorm; }
      double l = tL[i] * g * a, r = stereo ? tR[i] * g * a : l;
      l *= pl; r *= prr;
      if (l != l || r != r) { l = 0; r = 0; resetVoice(s); }
      if (guard) {
        double bl = egBand(0, l), br = egBand(16, r);
        double ab = bl < 0 ? -bl : bl, ab2 = br < 0 ? -br : br; if (ab2 > ab) ab = ab2;
        double env = eg.env * eg.rel; if (ab > env) env = ab; eg.env = env;
        double gg = env > eg.ceil ? eg.ceil / env : 1; if (gg < eg.gr) eg.gr = gg;
        l *= gg; r *= gg;
      }
      double m = (l + r) * .5; rv[i] = (float)(rv[i] + m * (rs + aS) * rg); sp[i] = (float)(sp[i] + m * ss); dpL[i] = (float)(dpL[i] + l); dpR[i] = (float)(dpR[i] + r);
      double al = l < 0 ? -l : l; if (al > pk) pk = al;
      lo[0] += bc * (l - lo[0]); lo[1] += bc * (r - lo[1]); l += lo[0] * bass; r += lo[1] * bass;
      md[0] += lc * (l - md[0]); md[1] += lc * (md[0] - md[1]); md[2] += lc * (r - md[2]); md[3] += lc * (md[2] - md[3]);
      double mid = (md[1] + md[3]) * .5, sd = (md[1] - md[3]) * .5 * wd; l = (mid + sd) * dg; r = (mid - sd) * dg;
      sL[i] = (float)l; sR[i] = (float)r; dL[i] = (float)(dL[i] + l); dR[i] = (float)(dR[i] + r);
      double mm = (l + r) * .5; hb0[i] = (float)(hb0[i] + mm * hs); bb[i] = (float)(bb[i] + mm * bw); knn[i] = (float)(knn[i] + mm * kw); sy[i] = (float)(sy[i] + mm * swt);
    }
    lo[0] += 1e-18; lo[1] += 1e-18; md[0] += 1e-18; md[2] += 1e-18;
    if (guard) for (i = 0; i < 32; i += 4) eg.z[i + 2] += 1e-18;
    st.g = gT; st.am = am; if (pk > st.pk) st.pk = pk;
    return pk;
  }
  void renderPoly(int s) {
    auto& ins = inst[s]; auto& cv = Cv[s]; auto& q = iq[s]; bool first = true; int i;
    for (size_t k = 0; k < ins.size(); k++) {
      if (cv[k].on || (s == 0 && k == 0 && symG > 0 && symPk > 1e-5)) q[k] = 0; else if (q[k] > 200) continue;
      float* dst = first ? tL.d : pbuf.d;
      ins[k]->render(dst, tR.d, BL, cv[k]);
      double raw = 0; for (i = 0; i < BL; i += 4) { double a = dst[i] < 0 ? -dst[i] : dst[i]; if (a > raw) raw = a; }
      if (!cv[k].on && raw < 2e-5) { if (++q[k] > 200) ins[k]->reset(); } else q[k] = 0;
      if (!first) for (i = 0; i < BL; i++) tL[i] = (float)((double)tL[i] + pbuf[i]);
      first = false;
    }
    if (first) tL.fill0();
  }
  // your own sound through the machine: dry (its own stem), plus sends into the spring tank, the wooden body, the hall,
  // the harmonizer and the Aura's capture bus. Switching on or off fades over one block; after an off the stem runs a few
  // more blocks (the look-ahead delay empties), then its chain state is cleared and it is skipped again.
  void inputRun() {
    float* sL = stemL[NS + 4].d; float* sR = stemR[NS + 4].d; int i;
    if (!inOn && inE <= 0) {
      if (--inTail > 0) { stemL[NS + 4].fill0(); stemR[NS + 4].fill0(); inPk = 0; return; }
      inAct = false; inG = -1; inPk = 0; stemL[NS + 4].fill0(); stemR[NS + 4].fill0();
      MChain& M = ms[NS + 4]; for (int c = 0; c < 2; c++) { M.tl[c] = 0; M.hx[c] = 0; M.hy[c] = 0; std::memset(M.lk[c], 0, sizeof M.lk[c]); }
      return;
    }
    double gT = db(P[P_INPUT_LEVEL]), g = inG < 0 ? gT : inG, gi = (gT - g) / BL, e = inE, eT = inOn ? 1 : 0, ei = (eT - e) / BL;
    double spv = P[P_INPUT_SPR], bd = P[P_INPUT_BODY] * .5, rvv = P[P_INPUT_REV], hs = P[P_INPUT_HSEND], au = P[P_INPUT_AURA], pk = 0;
    for (i = 0; i < BL; i++) {
      g += gi; e += ei;
      double l = inL[i] * e, r = inR[i] * e, m = (l + r) * .5;
      spIn[i] = (float)(spIn[i] + m * spv); bdIn[i] = (float)(bdIn[i] + m * bd); rvIn[i] = (float)(rvIn[i] + m * rvv); hmIn[i] = (float)(hmIn[i] + m * hs); dpL[i] = (float)(dpL[i] + l * au); dpR[i] = (float)(dpR[i] + r * au);
      l *= g; r *= g; sL[i] = (float)l; sR[i] = (float)r; dL[i] = (float)(dL[i] + l); dR[i] = (float)(dR[i] + r);
      double a = m < 0 ? -m : m; if (a > pk) pk = a;
    }
    inG = gT; inE = eT; inPk = pk > 1e-9 ? pk : 0; if (pk > 1e-9) strip[5].quiet = 0;
    if (!inOn) { inTail = (int)std::ceil((double)LA / BL) + 2; inL.fill0(); inR.fill0(); }
  }
  void input(bool on) { if (on == inOn) return; inOn = on; if (on) { inAct = true; inTail = 0; } }
  void process(float* oL, float* oR) {
    int i, s;
    clockStep(); momRun(); cmRun(); loopRun(); contacts(); macros(); voiceMacros();
    dL.fill0(); dR.fill0(); dpL.fill0(); dpR.fill0(); rvIn.fill0(); spIn.fill0(); bdIn.fill0(); hmIn.fill0();
    double wl = P[P_WATER_LEVEL], wt = P[P_WATER_TILT]; wLevel += (wl - wLevel) * .2; wTilt += (wt - wTilt) * .2;
    double tv = std::fabs(wTilt - wTilt0) * sr / BL; wTilt0 = wTilt; sl = fmax2(sl * std::exp(-6.91 * BL / (1.5 * sr)), fmin2(1, tv * .35)); if (sl < 1e-6) sl = 0;
    double wet = fmin2(1, wl * 2 + P[P_WATER_AMT]), wa = fmin2(1, P[P_WATER_AMT] + sl * .8 * wet); water = wa;
    float* t0 = symInW; symInW = symB; symB = t0; std::memset(t0, 0, sizeof(float) * BL); kn.fill0(); symG = P[P_EBOW_SYM] * .0009; symIn = symInW;
    if (inAct) inputRun();
    double sp0 = 0; for (i = 0; i < BL; i += 4) { double sa0 = symInW[i] < 0 ? -symInW[i] : symInW[i]; if (sa0 > sp0) sp0 = sa0; } symPk = sp0;
    if (wa > 0) { double wr = TAU * (.3 + 2.7 * fmax2(P[P_WATER_SLOSH], sl) + .4 * wa) * BL / sr; for (int wk = 0; wk < 16; wk++) { wph[wk] += wr * (.55 + .9 * std::fmod(wk * .618034, 1.0)); wph[wk + 16] += wr * (.31 + .7 * std::fmod(wk * .414214, 1.0)); wv[wk] = .65 * std::sin(wph[wk]) + .35 * std::sin(wph[wk + 16] + wk); } }
    double D = distance;
    dist.lc = fmin2(1, 1 - std::exp(-TAU * 20000 * std::pow(.06, D) / sr)); dist.dg = db(-15 * D); dist.wd = 1 - .6 * D; dist.bass = (db(4) - 1) * (1 - D); dist.bc = 1 - std::exp(-TAU * 150 / sr); dist.aS = D * .3; dist.rg = db(-5 * D);
    for (int q = 0; q < NS; q++) {
      s = ORDER[q]; Strip& st = strip[s];
      useVoice(s);
      if (s == 7) aura.capture(dpL.d, dpR.d, BL);
      if (s == 5 && P[P_BODY_SPRING] > 0) knock(P[P_BODY_SPRING]);
      auto& cv = Cv[s]; bool wake = (s == 5 && (spInPk > 1e-5 || spring.exc > 0)) || (s == 0 && symG > 0 && symPk > 1e-5);
      for (auto& c : cv) if (c.on) wake = true;
      if (wake) st.quiet = 0;
      if (st.quiet > 400) { stemL[s].fill0(); stemR[s].fill0(); continue; }
      bool stereo = s >= 5;
      if (s == 5) spring.render(tL.d, tR.d, BL, *C[5], spIn.d);
      else if (cv.size() == 1) inst[s][0]->render(tL.d, tR.d, BL, *C[s]);
      else renderPoly(s);
      double raw = 0; for (i = 0; i < BL; i += 8) { double a = tL[i] < 0 ? -tL[i] : tL[i]; if (a > raw) raw = a; }
      if (s == 5) { double m5 = 0; for (i = 0; i < BL; i += 4) { double a5 = spIn[i] < 0 ? -spIn[i] : spIn[i]; if (a5 > m5) m5 = a5; } spInPk = m5; }
      if (raw < 2e-5 && !wake) st.quiet++; else st.quiet = 0;
      stripRun(s, stereo, s < 3 || s == 7);
    }
    useGlobals();
    float* hmL = stemL[NS + 2].d; float* hmR = stemR[NS + 2].d; float* bdL = stemL[NS + 3].d; float* bdR = stemR[NS + 3].d;
    harm.render(hmIn.d, hmL, hmR, BL); body.render(bdIn.d, bdL, bdR, BL);
    if (hbAct) hbRender(bdL, bdR, BL);
    for (i = 0; i < BL; i++) { dL[i] = (float)((double)dL[i] + ((double)hmL[i] + bdL[i])); dR[i] = (float)((double)dR[i] + ((double)hmR[i] + bdR[i])); rvIn[i] = (float)(rvIn[i] + (((double)hmL[i] + hmR[i]) * .18 + ((double)bdL[i] + bdR[i]) * .08)); }
    rev.render(rvIn.d, rL.d, rR.d, BL);
    revBoost *= .995; duckE *= std::exp(-BL / (.22 * sr));
    double rm = P[P_REV_MIX]; float* hL = stemL[NS].d; float* hR = stemR[NS].d; float* wL = stemL[NS + 1].d; float* wR = stemR[NS + 1].d;
    for (i = 0; i < BL; i++) {
      double l = rL[i] * rm, r = rR[i] * rm; hL[i] = (float)l; hR[i] = (float)r; l += dL[i]; r += dR[i];
      double wl2 = 0, wr2 = 0;
      if (swEnd >= 0 && i >= swEnd) { swN = 0; swEnd = -1; }
      if (swN > 0) { if (swP < swN) { double e = (double)swP / swN; e = e * e * 1.6; wl2 = sw[0][swP] * e; wr2 = sw[1][swP] * e; swP++; } else swN = 0; }
      wL[i] = (float)wl2; wR[i] = (float)wr2;
      ring[0][rw] = (float)(l + wl2); ring[1][rw] = (float)(r + wr2); rw = (rw + 1) & 65535;
    }
    double tone = P[P_MASTER_TONE], gl = db(-5 * tone), gh = db(5 * tone), tc = 1 - std::exp(-TAU * 700 / sr), vol = db(P[P_MASTER_VOL]);
    int w0 = lkw; uL.fill0(); uR.fill0(); sumL.fill0(); sumR.fill0();
    for (s = 0; s < NST; s++) {
      if (s == NS + 4 && !inAct) continue;
      MChain& M = ms[s];
      for (int c = 0; c < 2; c++) {
        float* b = c ? stemR[s].d : stemL[s].d; float* u = c ? uR.d : uL.d; float* sm = c ? sumR.d : sumL.d; float* lk = M.lk[c]; double tl = M.tl[c], hx = M.hx[c], hy = M.hy[c]; int w = w0;
        for (i = 0; i < BL; i++) {
          double x = b[i];
          tl += tc * (x - tl); x = (tl * gl + (x - tl) * gh) * vol;
          hy = x - hx + .9975 * hy; hx = x; x = hy;
          u[i] = (float)(u[i] + x); lk[w] = (float)x; float dly = lk[(w - LA) & 255]; b[i] = dly; sm[i] = (float)(sm[i] + (double)dly); w = (w + 1) & 255;
        }
        M.tl[c] = tl + 1e-18; M.hx[c] = hx; M.hy[c] = hy + 1e-18;
      }
    }
    lkw = (w0 + BL) & 255;
    double lgv = lg, ceil = .891, mgr = 1, pL = 0, pR = 0;
    for (i = 0; i < BL; i++) {
      double ul = uL[i] < 0 ? -uL[i] : uL[i], ur = uR[i] < 0 ? -uR[i] : uR[i], pkk = ul > ur ? ul : ur, gt = pkk > ceil ? ceil / pkk : 1;
      int hn = LA + 8, hp = hp2; double old = hw[hp]; hw[hp] = gt; hp2 = (hp + 1) % hn;
      if (gt <= lh) lh = gt;
      else if (old <= lh) { double mn = 1; for (int q = 0; q < hn; q++) if (hw[q] < mn) mn = hw[q]; lh = mn; }
      gt = lh;
      lgv += gt < lgv ? (gt * .9995 - lgv) * .09 : (gt - lgv) * .0004; if (lgv < mgr) mgr = lgv; lgB[i] = (float)lgv;
      double l = sumL[i] * lgv, r = sumR[i] * lgv;
      l = l > ceil ? ceil : l < -ceil ? -ceil : l; r = r > ceil ? ceil : r < -ceil ? -ceil : r;
      oL[i] = (float)l; oR[i] = (float)r;
      if (l < 0) l = -l; if (r < 0) r = -r; if (l > pL) pL = l; if (r > pR) pR = r;
    }
    lg = lgv; if (mgr < gr) gr = mgr; if (pL > pkL) pkL = pL; if (pR > pkR) pkR = pR;
    frame += BL; lc += lcAdv;
  }
  void panic() {
    for (int s = 0; s < NS; s++) { slots[s][0].on = slots[s][1].on = false; for (size_t j = 0; j < inst[s].size(); j++) { if (inst[s][j]) inst[s][j]->reset(); Cv[s][j].own = nullptr; } }
    spring.reset();
    for (auto& L : layers) { L->sl.on = false; if (L->gs) L->gs->cur = -1; }
    while (!cms.empty()) cmStop(0);
    riser.on = ret.on = sting.on = drone.on = heart.on = walls.on = false; mPitch = 0; mDread = 0; mAura = 0; duckE = 0; dr2 = 0; swN = 0; autoFreeze = false;
    rev.clear(); body.reset(); harm.reset();
  }
};

/* ---------- host: message handling and buffering ---------- */
Host::Host(double sampleRate) : sr_(sampleRate), e_(new Engine(sampleRate, 1337)) {
  std::memset(bufL_, 0, sizeof bufL_); std::memset(bufR_, 0, sizeof bufR_); std::memset(inAccL_, 0, sizeof inAccL_); std::memset(inAccR_, 0, sizeof inAccR_);
}
Host::~Host() = default;

int Host::paramIndex(const char* id) { for (int i = 0; i < NPARAM; i++) if (std::strcmp(PARAMS[i].id, id) == 0) return i; return -1; }

void Host::msg(const Msg& m) {
  Engine& e = *e_;
  switch (m.t) {
    case Msg::INIT: if (m.params) for (int k = 0; k < NPARAM; k++) e.P[k] = m.params[k]; if (m.seed) e.rng = Rng(m.seed); ready_ = true; break;
    case Msg::PARAM: if (m.k >= 0 && m.k < NPARAM) e.setP(m.k, m.v); break;
    case Msg::GESTURE: if (m.s >= 0 && m.s < NS) e.user(m.s, m.g, m.x, m.y, m.p, m.hz); break;
    case Msg::MOMENT: e.moment(m.id, m.on, m.arg); break;
    case Msg::CMOMENT: e.cmToggle(m.id, m.on); break;
    case Msg::CMDEF: e.cmDefine(m.id, m.def.get()); break;
    case Msg::CMREC: e.cmRec(m.on); break;
    case Msg::LOOP: e.loopCmd(m); break;
    case Msg::PANIC: e.panic(); break;
    case Msg::INPUT: e.input(m.on); if (!m.on) { e.inL.fill0(); e.inR.fill0(); } break;
  }
}

void Host::block(float* L, float* R, const float* IL, const float* IR) {
  Engine& e = *e_; int i;
  if (!ready_) { for (i = 0; i < BL; i++) { L[i] = 0; R[i] = 0; } return; }
  if (e.inOn && IL) { const float* ir = IR ? IR : IL; for (i = 0; i < BL; i++) { e.inL[i] = IL[i]; e.inR[i] = ir[i]; } }
  e.process(L, R);
}

void Host::transport(const Transport& t, bool syncOn) { tr_ = t; trSync_ = syncOn; trSet_ = true; trOff_ = 0; }

void Host::render(float* L, float* R, int n, const float* IL, const float* IR) {
  for (int i = 0; i < n; i++) {
    if (bufPos_ >= BL) {
      if (trSet_) {   // the transport at this engine block's first sample
        Engine& e = *e_; e.syncWant = trSync_; e.tr = tr_;
        if (tr_.playing && tr_.bpm > 0) e.tr.ppq = tr_.ppq + trOff_ * tr_.bpm / (60.0 * sr_);
      }
      block(bufL_, bufR_, inAccL_, inAccR_); bufPos_ = 0;
    }
    trOff_++;
    if (IL) { inAccL_[inPos_] = IL[i]; inAccR_[inPos_] = IR ? IR[i] : IL[i]; inPos_ = (inPos_ + 1) % BL; }
    L[i] = bufL_[bufPos_]; R[i] = bufR_[bufPos_]; bufPos_++;
  }
}

void Host::init(const double* params, uint32_t seed) { Msg m; m.t = Msg::INIT; m.params = params; m.seed = seed; msg(m); }
void Host::setParam(int id, double v) { Msg m; m.t = Msg::PARAM; m.k = id; m.v = v; msg(m); }
double Host::param(int id) const { return id >= 0 && id < NPARAM ? e_->P[id] : 0; }
void Host::gesture(int voice, char kind, double x, double y, double pressure, double hz) { Msg m; m.t = Msg::GESTURE; m.s = voice; m.g = kind; m.x = x; m.y = y; m.p = pressure; m.hz = hz; msg(m); }
void Host::moment(int id, bool on, double arg) { Msg m; m.t = Msg::MOMENT; m.id = id; m.on = on; m.arg = arg; msg(m); }
void Host::loop(const char* action, int layer, double v, bool free) { Msg m; m.t = Msg::LOOP; m.a = action; m.layer = layer; m.lv = v; m.free = free; msg(m); }
void Host::panic() { Msg m; m.t = Msg::PANIC; msg(m); }
void Host::inputOn(bool on) { Msg m; m.t = Msg::INPUT; m.on = on; msg(m); }
int64_t Host::frame() const { return (int64_t)e_->frame; }
bool Host::takeCapture(CmCapture& out) { Engine& e = *e_; if (!e.capReady) return false; e.capReady = false; std::swap(out, e.cap); return true; }
bool Host::momentActive(int id) const { const Engine& e = *e_; return id == M_RISER ? e.riser.on : id == M_STINGER ? e.sting.on : id == M_DRONE ? e.drone.on : id == M_HEART ? e.heart.on : id == M_WALLS ? e.walls.on : false; }
bool Host::cmActive(int id) const { for (auto& I : e_->cms) if (I->id == id) return true; return false; }
void Host::telemetry(Telemetry& t) {
  Engine& e = *e_; t.peakL = (float)e.pkL; t.peakR = (float)e.pkR; t.gainReduction = (float)e.gr;
  for (int i = 0; i < NS; i++) { t.voicePeak[i] = (float)e.strip[i].pk; e.strip[i].pk = 0; }
  t.nLayers = 0;
  for (auto& L : e.layers) { if (t.nLayers >= MAXLAYERTM) break; LayerInfo& li = t.layers[t.nLayers++]; li.id = L->id; li.src = L->src; li.len = (float)(L->len / e.sr); li.pos = (float)(L->pos / L->len); li.mute = L->mute; li.ghost = L->ghost; }
  t.looping = e.recOn; t.lane = e.hasLane ? (float)(e.laneLen / e.sr) : 0; t.undoCount = e.ucnt; t.nUndo = (int)e.undo.size(); t.nRedo = (int)e.redo.size();
  t.riser = e.riser.on ? (float)(e.riser.t / e.riser.dur) : -1; t.stinger = e.sting.on; t.drone = e.drone.on; t.heart = e.heart.on; t.walls = e.walls.on;
  t.nCm = 0; for (auto& I : e.cms) { if (t.nCm >= MAXCMTM) break; t.cmId[t.nCm] = I->id; t.cmPos[t.nCm] = (float)fmin2(1, I->pos / fmax2(1, I->d->len)); t.nCm++; }
  t.cmRec = e.recMOn ? (float)((e.frame - e.recMStart) / e.sr) : -1;
  t.inPeak = (float)e.inPk; t.frozen = e.aura.frozen; t.bodyPeak = (float)e.body.pk; t.harmPeak = (float)e.harm.pk; e.body.pk = 0; e.harm.pk = 0;
  if (wantJunk) { Junk& J = e.junk; int jn = J.count; for (int i = 0; i < jn; i++) { t.junk[i * 3] = J.px[i]; t.junk[i * 3 + 1] = J.py[i]; t.junk[i * 3 + 2] = J.rr[i]; } t.junk[jn * 3] = (float)J.mx; t.junk[jn * 3 + 1] = (float)J.my; t.junk[jn * 3 + 2] = J.mon ? 1.f : 0.f; t.junkN = jn; } else t.junkN = -1;
  t.frame = (int64_t)e.frame;
  t.synced = e.syncAct; t.bpm = e.syncAct ? (float)e.tr.bpm : 0; t.recWaiting = e.recOn && e.recSync && e.lc < e.recOrigin;
  t.laneBars = e.hasLane && e.syncAct && e.barLen > 0 ? (int)jsround(e.laneLen / e.barLen) : 0;
  e.pkL = e.pkR = 0; e.gr = 1;
}

}  // namespace he
