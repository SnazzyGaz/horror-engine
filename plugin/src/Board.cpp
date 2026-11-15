// Horror Engine · Séance: the spirit board. Horror Engine by Garyck Arntzen (https://x.com/_mintydoge). GNU AGPLv3.
#include "Board.h"
#include "PluginProcessor.h"

using namespace juce;
using namespace look;

static const float PI_F = MathConstants<float>::pi;
static String nn(int n) { static const char* N[] = {"C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"}; return String(N[n % 12]) + String(n / 12 - 1); }

/* ---------- plaques ---------- */
Rectangle<int> Plaque::preferredSize() const {
  auto fw = font(FELL, bye ? 26.f : 30.f, bye ? .12f : 0.f); float w1 = textWidth(fw, word), w2 = textWidth(font(MONO, 12), sub);
  float pad = bye ? 26 : 18; int w = (int)std::ceil(jmax(118.f, jmax(w1, w2) + 2 * pad));
  return {0, 0, w, bye ? (5 + 26 + 4 + 16 + 7) : (6 + 30 + 4 + 16 + 8)};
}
void Plaque::paint(Graphics& g) {
  auto r = getLocalBounds().toFloat(); bool over = isMouseOver(true);
  if (pressed) { g.setColour(rgba(201, 168, 101, .14f)); g.fillRoundedRectangle(r, 8); }
  box(g, r.reduced(pressed ? 3.f : 0.f), 8, pressed ? rgba(201, 168, 101, .18f) : rgba(14, 11, 10, .6f), pressed ? gilt : over ? gilt : giltLo);
  if (bye && isMouseButtonDown()) { g.setColour(rgba(224, 118, 74, .18f)); g.fillRoundedRectangle(r.reduced(1), 8); }
  float top = bye ? 5.f : 6.f, wh = bye ? 26.f : 30.f;
  text(g, word, Rectangle<float>(0, top, r.getWidth(), wh + 2), font(FELL, wh, bye ? .12f : 0.f), pressed ? live : bone, Justification::centred);
  text(g, sub, Rectangle<float>(0, top + wh + 3, r.getWidth(), 16), font(MONO, 12), giltTxt, Justification::centred);
  if (progress > 0) { g.setColour(live); g.fillRect(Rectangle<float>(0, r.getBottom() - 3, r.getWidth() * jmin(1.f, progress), 3)); }
}

/* ---------- the board ---------- */
Board::Board(HorrorProcessor& p, Controller& c) : yes("Yes", "Stinger " + String::fromUTF8("\xc2\xb7 ") + nn(37), false), no("No", "Riser " + String::fromUTF8("\xc2\xb7 ") + nn(36), false), bye("Goodbye", String::fromUTF8("Silence \xc2\xb7 Esc"), true), proc(p), ctl(c) {
  auto title = [](int i) { return String(MOMENTS[i].name) + ": " + MOMENTS[i].desc + ". Key F" + String(i + 1) + ", MIDI channel 16 note " + String(36 + i) + " (" + nn(36 + i) + ") or CC " + String(24 + i) + ". Press again to stop."; };
  yes.setTooltip(title(1)); no.setTooltip(title(0)); bye.setTooltip("Silence: stop every voice, your sound in, and clear the hall (Esc)");
  yes.onClick = [this] { ctl.momentToggle(1); }; no.onClick = [this] { ctl.momentToggle(0); }; bye.onClick = [this] { ctl.panic(); down = false; };
  addAndMakeVisible(yes); addAndMakeVisible(no); addAndMakeVisible(bye);
  setMouseCursor(MouseCursor::NoCursor); setWantsKeyboardFocus(false);
  startTimerHz(60);
}
void Board::resized() {
  auto ys = yes.preferredSize(), ns = no.preferredSize(), bs = bye.preferredSize();
  yes.setBounds(24, 22, ys.getWidth(), ys.getHeight()); no.setBounds(getWidth() - 24 - ns.getWidth(), 22, ns.getWidth(), ns.getHeight());
  bye.setBounds((getWidth() - bs.getWidth()) / 2, getHeight() - 20 - bs.getHeight(), bs.getWidth(), bs.getHeight());
  bg = Image(); L.clear();
}
void Board::refresh() {
  bool y = ctl.momentOn(1), n = ctl.momentOn(0); float pr = ctl.riserProgress();
  if (y != yes.pressed) { yes.pressed = y; yes.repaint(); }
  if (n != no.pressed || pr != no.progress) { no.pressed = n; no.progress = pr; no.repaint(); }
}

static double rng(int& seed) { seed = (int)(((int64)seed * 16807) % 2147483647); return (seed - 1) / 2147483646.0; }

void Board::paintBg(int W, int H, float scale) {
  bg = Image(Image::ARGB, jmax(1, (int)std::round(W * scale)), jmax(1, (int)std::round(H * scale)), true); bgScale = scale;
  Graphics c(bg); c.addTransform(AffineTransform::scale(scale)); float w = (float)W, h = (float)H;
  ColourGradient g(Colour(0xff2b2019), w * .5f, h * .42f, Colour(0xff0f0b09), w * .5f + jmax(w, h) * .75f, h * .42f, true); g.addColour(.55, Colour(0xff1b1411));
  c.setGradientFill(g); c.fillRect(0.f, 0.f, w, h);
  // grain: long, slightly wandering strokes, like the figure in a lacquered board
  int seed = 9137; int n = (int)std::round(h / 2.6f);
  for (int i = 0; i < n; i++) {
    double y = rng(seed) * h, a = 1 + rng(seed) * 5, f = .002 + rng(seed) * .006, ph = rng(seed) * 6.28; bool dark = rng(seed) < .35;
    Colour col = dark ? Colours::black.withAlpha((float)(.06 + rng(seed) * .08)) : rgba(255, 232, 196, (float)(.010 + rng(seed) * .022));
    float lwid = (float)(.5 + rng(seed) * 1.3);
    Path p; for (double x = -10; x <= w + 10; x += 14) { double yy = y + a * std::sin(x * f + ph) + 2 * std::sin(x * f * 3.1 + ph * 2); if (x < 0) p.startNewSubPath((float)x, (float)yy); else p.lineTo((float)x, (float)yy); }
    c.setColour(col); c.strokePath(p, PathStrokeType(lwid));
  }
  // lacquer sheen and a faint sunburst rising behind Goodbye
  ColourGradient sh(rgba(255, 240, 210, .035f), 0, 0, Colours::black.withAlpha(.12f), w, h, false); sh.addColour(.45, rgba(255, 240, 210, 0));
  c.setGradientFill(sh); c.fillRect(0.f, 0.f, w, h);
  c.setColour(rgba(201, 168, 101, .07f));
  for (int i = 0; i <= 18; i++) {
    float t = PI_F + i * PI_F / 18, r1 = h * .14f, r2 = h * (i % 3 ? .26f : .32f);
    c.drawLine(w / 2 + std::cos(t) * r1, h + 4 + std::sin(t) * r1, w / 2 + std::cos(t) * r2, h + 4 + std::sin(t) * r2, 1.f);
  }
  Path arc; arc.addCentredArc(w / 2, h + 4, h * .14f, h * .14f, 0, -PI_F * .5f, PI_F * .5f, true); c.strokePath(arc, PathStrokeType(1.f));
  // inlay rule and corner stars
  c.setColour(rgba(201, 168, 101, .16f)); c.drawRect(Rectangle<float>(16.5f, 16.5f, w - 33, h - 33).expanded(.5f), 1.f);
  for (auto p : {Point<float>(16.5f, 16.5f), Point<float>(w - 16.5f, 16.5f), Point<float>(16.5f, h - 16.5f), Point<float>(w - 16.5f, h - 16.5f)}) {
    Path d; d.addRectangle(-2.5f, -2.5f, 5, 5); d.applyTransform(AffineTransform::rotation(PI_F / 4).translated(p)); c.setColour(rgba(201, 168, 101, .4f)); c.fillPath(d);
  }
  ColourGradient v(Colours::transparentBlack, w / 2, h / 2, Colours::black.withAlpha(.5f), w / 2 + jmax(w, h) * .72f, h / 2, true);
  float in = jmin(w, h) * .35f / (jmax(w, h) * .72f); v.clearColours(); v.addColour(0, Colours::transparentBlack); v.addColour(in, Colours::transparentBlack); v.addColour(1, Colours::black.withAlpha(.5f));
  c.setGradientFill(v); c.fillRect(0.f, 0.f, w, h);
}
void Board::layoutLetters(float w, float h) {
  fs = jmax(20.f, jmin(52.f, jmin(w / 28, h / 15.8f))); L.clear(); lw = w; lh = h;
  auto arc = [&](const char* s, float rx, float ry, float cy, float c0, int row) {
    float t0 = std::acos(c0); int n = (int)std::strlen(s);
    for (int i = 0; i < n; i++) {
      float th = PI_F - t0 - (PI_F - 2 * t0) * i / (n - 1), x = w / 2 + rx * w * std::cos(th), y = cy * h - ry * h * std::sin(th);
      L.push_back({(juce_wchar)s[i], x, y, std::atan2(ry * h * std::cos(th), rx * w * std::sin(th)), row});
    }
  };
  arc("ABCDEFGHIJKLM", .5f, .678f, 1.068f, .82f, 0); arc("NOPQRSTUVWXYZ", .46f, .591f, 1.171f, .804f, 1);
  sp = std::hypot(L[1].x - L[0].x, L[1].y - L[0].y);
}
static float rulerY(float x, float h) { float u = (x - .5f) / .5f; return h * (.255f + .075f * u * u); }
// the voice's own x-to-pitch mapping (engine.js), so the rule marks real semitones
bool Board::ruler(BoardRuler& R) const {
  int s = ctl.sel();
  if (s == he::EBOW) { double r = ctl.P(he::P_EBOW_SLIDE); if (r == 0) r = 1; R = {-12 * (int)std::floor(r + .5), 12 * (int)std::floor(r + .5), r, 0, false}; return true; }
  if (s == he::STRUCK && (int)ctl.P(he::P_STRUCK_OBJECT) != 0) { R = {-18, 18, 0, 1, false}; return true; }
  if (s == he::HURDY && ctl.P(he::P_HURDY_MELODY) > .5) { R = {0, 12, 0, 2, true}; return true; }
  return false;
}
static double rX(const BoardRuler& R, double st) { return R.kind == 0 ? .5 + st / (24 * R.r) : R.kind == 1 ? .5 + st / 36 : st / 12; }
static double rSt(const BoardRuler& R, double x) { return R.kind == 0 ? (x - .5) * 24 * R.r : R.kind == 1 ? (x - .5) * 36 : std::floor(x * 12 + .5); }

static Path planchettePath() {
  Path p; p.startNewSubPath(0, -46); p.cubicTo(27, -46, 43, -18, 41, 4); p.cubicTo(39, 25, 17, 48, 0, 49); p.cubicTo(-17, 48, -39, 25, -41, 4); p.cubicTo(-43, -18, -27, -46, 0, -46); p.closeSubPath(); return p;
}

void Board::paint(Graphics& g) {
  float w = (float)getWidth(), h = (float)getHeight();
  // rounded board, its own background
  Path clip; clip.addRoundedRectangle(getLocalBounds().toFloat(), 14); g.reduceClipRegion(clip);
  float scale = jmin(2.f, (float)g.getInternalContext().getPhysicalPixelScaleFactor());
  if (!bg.isValid() || bgScale != scale) paintBg(getWidth(), getHeight(), scale);
  g.drawImage(bg, Rectangle<float>(0, 0, w, h));
  if (L.empty() || lw != w || lh != h) layoutLetters(w, h);
  const auto& tm = ctl.tm; float lvl = jmax(ctl.pkL, ctl.pkR);
  float px, py; bool live = down;
  if (down) { px = curX; py = curY; } else if (hover) { px = hoverX; py = hoverY; } else { px = restX; py = restY; }
  if (down || hover) { restX = px; restY = py; }
  float X = px * w, Y = (1 - py) * h;
  // candlelight pooling under the planchette, brighter as it sounds
  float ca = live ? .08f + jmin(.22f, lvl * .6f) : .035f;
  ColourGradient cg(rgba(255, 196, 120, ca), X, Y, rgba(255, 196, 120, 0), X + jmax(w, h) * .32f, Y, true); g.setGradientFill(cg); g.fillRect(0.f, 0.f, w, h);
  // the machine's own voice as a faint smoke line
  {
    int wpos = proc.scopeW.load(); Path p;
    for (int i = 0; i < 1024; i += 4) { float s = proc.scope[(wpos - 1024 + i) & 2047]; float sx = i / 1020.f * w, sy = h * .53f - s * h * .2f; if (i) p.lineTo(sx, sy); else p.startNewSubPath(sx, sy); }
    g.setColour(rgba(201, 168, 101, jmin(.32f, .08f + lvl * .6f))); g.strokePath(p, PathStrokeType(1.2f));
  }
  // the brass rule
  BoardRuler R; bool hasR = ruler(R);
  { Path p; for (int j = 0; j <= 60; j++) { float rx = j / 60.f * w, ry = rulerY(j / 60.f, h); if (j) p.lineTo(rx, ry); else p.startNewSubPath(rx, ry); } g.setColour(rgba(201, 168, 101, .30f)); g.strokePath(p, PathStrokeType(1.f)); }
  double stNow = hasR ? rSt(R, px) : 0;
  if (hasR) {
    int span = R.hi - R.lo, every = w / span < 6 ? 2 : 1; auto mf = font(MONO, 12);
    for (int s = R.lo; s <= R.hi; s++) {
      bool oc = s % 12 == 0; if (!oc && s % every) continue;
      double tx = rX(R, s); if (tx < -.001 || tx > 1.001) continue;
      float Xs = (float)tx * w, Ys = rulerY((float)tx, h); bool nearNow = live && std::abs((R.q ? stNow : std::floor(stNow + .5)) - s) < .5;
      g.setColour(nearNow ? rgba(246, 231, 191, .95f) : oc ? rgba(201, 168, 101, .7f) : rgba(201, 168, 101, .48f));
      g.drawLine(Xs, Ys, Xs, Ys + (oc ? 14.f : 8.f), nearNow ? 2.f : 1.f);
      if (oc) {
        String t = s == 0 ? "0" : (s > 0 ? "+" : String::fromUTF8("\xe2\x88\x92")) + String(std::abs(s));
        float tw = textWidth(mf, t), tx2 = Xs < 24 ? Xs + 22 : Xs > w - 24 ? Xs - 22 - tw : Xs - tw / 2;
        if (Xs < 24) tx2 = Xs + 22; g.setColour(rgba(203, 189, 159, .8f)); g.setFont(mf); g.drawSingleLineText(t, (int)std::round(tx2), (int)std::round(Ys - 3 - mf.getDescent()));
      }
    }
  } else { Path d; d.addRectangle(-3.f, -3.f, 6.f, 6.f); d.applyTransform(AffineTransform::rotation(PI_F / 4).translated(w / 2, rulerY(.5f, h))); g.setColour(rgba(201, 168, 101, .45f)); g.fillPath(d); }
  // dotted trail of the last strokes
  double now = Time::getMillisecondCounterHiRes();
  if (trail.size() > 1) {
    float acc = 0;
    for (size_t i = trail.size() - 1; i > 0; i--) {
      double age = (now - trail[i].t) / 1600; if (age > 1) break;
      float ax = trail[i].x * w, ay = (1 - trail[i].y) * h, bx = trail[i - 1].x * w, by = (1 - trail[i - 1].y) * h; acc += std::hypot(bx - ax, by - ay);
      if (acc < 8) continue; acc = 0;
      g.setColour(rgba(233, 211, 154, (float)(.55 * (1 - age)))); g.fillEllipse(ax - 1.4f, ay - 1.4f, 2.8f, 2.8f);
    }
  }
  // the letters: faint, lit by the planchette
  auto lf = font(FELL, fs); int best = -1; float bd = 1e9f;
  for (size_t i = 0; i < L.size(); i++) { float dd = std::hypot(L[i].x - X, L[i].y - Y); if (dd < bd) { bd = dd; best = (int)i; } }
  float reach = sp * 2.2f; int lit = bd < sp * .75f ? best : -1;
  for (size_t i = 0; i < L.size(); i++) {
    auto& q = L[i]; float dq = std::hypot(q.x - X, q.y - Y), a0 = (q.row ? .20f : .26f) + jmin(.08f, lvl * .2f), a = a0;
    if (dq < reach) a = a0 + (live ? .42f : .14f) * (1 - dq / reach);
    GlyphArrangement ga; ga.addFittedText(lf, String::charToString(q.ch), -fs, -fs, 2 * fs, 2 * fs, Justification::centred, 1);
    Path gp; ga.createPath(gp); gp.applyTransform(AffineTransform::rotation(q.r).translated(q.x, q.y));
    if ((int)i == lit && live) { DropShadow(rgba(233, 211, 154, .9f), 14, {}).drawForPath(g, gp); g.setColour(Colour(0xfff6e7bf)); }
    else g.setColour(rgba(236, 225, 200, a));
    g.fillPath(gp);
  }
  // Junk Tray: the pieces chasing the magnet
  if (ctl.sel() == he::JUNK && tm.junkN > 0) {
    for (int i = 0; i < tm.junkN; i++) {
      g.setColour(i % 3 ? rgba(236, 225, 200, .6f) : rgba(201, 168, 101, .85f));
      float r = jmax(2.5f, tm.junk[i * 3 + 2] * jmin(w, h) * .8f); g.drawEllipse(tm.junk[i * 3] * w - r, (1 - tm.junk[i * 3 + 1]) * h - r, 2 * r, 2 * r, 1.4f);
    }
  }
  // the planchette: a glass eye over the letter
  {
    float s = jmax(.75f, jmin(1.4f, h / 540)) * (1 + (live ? .06f * curP : 0)), pr = live ? curP : 0;
    auto T = AffineTransform::scale(s).translated(X, Y);
    Path body = planchettePath(); body.applyTransform(T);
    DropShadow(Colours::black.withAlpha(.6f), (int)(14 * s), {0, (int)(6 * s)}).drawForPath(g, body);
    ColourGradient bgr(rgba(233, 211, 154, 0), X, Y - 2 * s, rgba(120, 96, 60, .16f), X + 52 * s, Y, true);
    bgr.clearColours(); bgr.addColour(0, rgba(233, 211, 154, 0)); bgr.addColour(.3, rgba(201, 168, 101, live ? .20f : .12f)); bgr.addColour(.75, rgba(201, 168, 101, live ? .13f : .08f)); bgr.addColour(1, rgba(120, 96, 60, .16f));
    g.setGradientFill(bgr); g.fillPath(body);
    g.setColour(rgba(233, 211, 154, live ? .85f : .5f)); g.strokePath(body, PathStrokeType(1.5f * s));
    Path inner = planchettePath(); inner.applyTransform(AffineTransform::scale(.88f * s).translated(X, Y)); g.setColour(rgba(233, 211, 154, .22f)); g.strokePath(inner, PathStrokeType(.8f * .88f * s));
    g.setColour(rgba(10, 7, 5, .55f)); for (auto f : {Point<float>(0, -36), Point<float>(-27, 30), Point<float>(27, 30)}) { auto c = f.transformedBy(T); g.fillEllipse(c.x - 2.6f * s, c.y - 2.6f * s, 5.2f * s, 5.2f * s); }
    float gl = live ? .55f + .45f * pr + jmin(.4f, lvl) : .25f;
    Path ring; ring.addEllipse(X - 15 * s, Y - 15 * s, 30 * s, 30 * s);
    Path ringS; PathStrokeType(1.6f * s).createStrokedPath(ringS, ring);
    DropShadow(rgba(233, 211, 154, jmin(1.f, gl)), (int)((live ? 10 + 18 * pr : 4) * s), {}).drawForPath(g, ringS);
    g.setColour(live ? Colour(0xfff1dfae) : rgba(233, 211, 154, .6f)); g.fillPath(ringS);
    ColourGradient lg(rgba(255, 246, 220, live ? .22f : .1f), X - 4 * s, Y - 5 * s, rgba(255, 246, 220, .02f), X - 4 * s + 15 * s, Y - 5 * s, true); g.setGradientFill(lg); g.fillPath(ring);
    Path hl; hl.addCentredArc(X, Y, 11 * s, 11 * s, 0, PI_F * 1.1f + PI_F * .5f, PI_F * 1.45f + PI_F * .5f, true); g.setColour(rgba(255, 250, 235, .45f)); g.strokePath(hl, PathStrokeType(1.2f * s));
  }
  // the reading in the corner
  String hlt;
  if (live) {
    hlt = (lit >= 0 ? String::charToString(L[(size_t)lit].ch) : String::fromUTF8("\xc2\xb7"));
    if (hasR) { String sign = stNow > 0 ? "+" : stNow < 0 ? String::fromUTF8("\xe2\x88\x92") : String(); hlt += String::fromUTF8("  \xc2\xb7  ") + sign + (R.q ? String((int)std::abs(stNow)) : String(std::abs(stNow), 1)) + " st"; }
    else hlt += String::fromUTF8("  \xc2\xb7  x ") + String((int)std::floor(px * 100 + .5)) + "  y " + String((int)std::floor(py * 100 + .5));
  }
  reading = hlt;
}

void Board::paintOverChildren(Graphics& g) {
  float w = (float)getWidth(), h = (float)getHeight(); auto r = getLocalBounds().toFloat();
  // who plays, and what the axes do
  int s = ctl.sel(); String who = String(ROMAN[s]) + String::fromUTF8(" \xc2\xb7 ") + SRC[s].n;
  float ww = jmin(480.f, w * .46f); auto wr = Rectangle<float>((w - ww) / 2, 26, ww, 22);
  text(g, who, wr, font(SERIF_SEMI, 17), live, Justification::centredTop);
  { AttributedString a; a.append(String(CharPointer_UTF8(SRC[s].h)), font(SERIF_ITAL, 14), dim); a.setJustification(Justification::centredTop); a.setWordWrap(AttributedString::byWord); TextLayout tl; tl.createLayout(a, ww); tl.draw(g, Rectangle<float>((w - ww) / 2, 26 + 22 + 4 - 2, ww, 40)); }
  String ax = SRC[s].x, ay = SRC[s].y;
  if (s == he::EBOW) { double rr = ctl.P(he::P_EBOW_SLIDE); ax = "Slide, " + String(std::floor(rr * 10 + .5) / 10, std::floor(rr * 10 + .5) / 10 == std::floor(rr) ? 0 : 1) + " oct either side"; }
  if (s == he::STRUCK) ax = (int)ctl.P(he::P_STRUCK_OBJECT) == 0 ? "Ruler overhang (pitch)" : String::fromUTF8("Pitch, 1\xc2\xbd oct either side");
  if (s == he::HURDY) ax = ctl.P(he::P_HURDY_MELODY) > .5 ? "Melody, one octave" : "Melody (switch Melody on X on)";
  auto mf = font(MONO, 13);
  if (ax.isNotEmpty()) text(g, String::fromUTF8("x \xc2\xb7 ") + ax, Rectangle<float>(28, h - 24 - 18, jmax(40.f, w * .5f - 150 - 28), 18), mf, bone2);
  if (ay.isNotEmpty()) {
    Graphics::ScopedSaveState st(g); g.addTransform(AffineTransform::rotation(-PI_F / 2).translated(22, h * .74f));
    g.setColour(bone2); g.setFont(mf); g.drawSingleLineText(String::fromUTF8("y \xc2\xb7 ") + ay, 0, (int)mf.getAscent());
  }
  String pr = "Pressure " + String((int)std::floor((down ? curP : (float)ctl.basePr) * 100 + .5f)) + "%";
  float pw = textWidth(mf, pr), rw = reading.isNotEmpty() ? textWidth(mf, reading) : 0;
  text(g, pr, Rectangle<float>(w - 28 - pw - 2, h - 24 - 18, pw + 2, 18), mf, live, Justification::centredRight);
  if (reading.isNotEmpty()) text(g, reading, Rectangle<float>(w - 28 - pw - 14 - rw - 2, h - 24 - 18, rw + 2, 18), mf, live, Justification::centredRight);
  // the frame: gilt hairline, dark band, gilt line, inner shadow
  Path clip; clip.addRoundedRectangle(r, 14); g.reduceClipRegion(clip);
  for (int i = 0; i < 18; i++) { g.setColour(Colours::black.withAlpha(.55f * (1 - i / 18.f) * .12f)); g.drawRoundedRectangle(r.reduced(i * 2.f + 7), 14 - jmin(13.f, i * 2.f), 2.5f); }
  g.setColour(Colour(0xff120d0b)); g.drawRoundedRectangle(r.reduced(3.5f), 11, 5.f);
  g.setColour(rgba(201, 168, 101, .35f)); g.drawRoundedRectangle(r.reduced(6.5f), 8, 1.f);
  g.setColour(giltLo); g.drawRoundedRectangle(r.reduced(.5f), 14, 1.f);
}

float Board::pressure(const MouseEvent& e) const {
  if (e.isPressureValid() && e.pressure > 0 && e.source.isPen()) return e.pressure;
  if (e.isPressureValid() && e.source.isTouch() && e.pressure > 0 && e.pressure != .5f) return e.pressure;
  return e.mods.isShiftDown() ? 1.f : e.mods.isAltDown() ? .3f : (float)ctl.basePr;
}
void Board::point(const MouseEvent& e) {
  curX = jlimit(0.f, 1.f, e.position.x / (float)getWidth()); curY = jlimit(0.f, 1.f, 1 - e.position.y / (float)getHeight()); curP = pressure(e);
}
void Board::mouseDown(const MouseEvent& e) {
  if (e.mods.isPopupMenu() || down) return;
  point(e); down = true; ctl.padDown = true; trail.clear(); ctl.gesture('d', curX, curY, curP);
}
void Board::mouseDrag(const MouseEvent& e) {
  if (!down) return; point(e); hoverX = curX; hoverY = curY;
  double now = Time::getMillisecondCounterHiRes(); trail.push_back({curX, curY, now}); if (trail.size() > 90) trail.erase(trail.begin());
  if (now - lastSend > 6) { lastSend = now; ctl.gesture('n', curX, curY, curP); }   // gliding moves (1.0.4)
}
void Board::mouseUp(const MouseEvent&) { if (!down) return; down = false; ctl.padDown = false; ctl.gesture('u', 0, 0, 0); }
void Board::mouseMove(const MouseEvent& e) { hoverX = jlimit(0.f, 1.f, e.position.x / (float)getWidth()); hoverY = jlimit(0.f, 1.f, 1 - e.position.y / (float)getHeight()); hover = true; }
void Board::mouseExit(const MouseEvent&) { hover = false; }
void Board::mouseWheelMove(const MouseEvent&, const MouseWheelDetails& w) {
  if (w.deltaY == 0) return;
  ctl.basePr = jlimit(.05, 1.0, ctl.basePr + (w.deltaY > 0 ? .05 : -.05));
  if (down) { curP = (float)ctl.basePr; ctl.gesture('n', curX, curY, curP); }
}
