// Horror Engine · Séance: the four drawers (Voice, Effects, Looper, Your sound in).
// Horror Engine by Garyck Arntzen (https://x.com/_mintydoge). Plugin released under the GNU AGPLv3.
#include "Panels.h"
#include "PluginProcessor.h"

using namespace juce;
using namespace look;

static String U(const char* s) { return String(CharPointer_UTF8(s)); }

/* ---------- the drawer frame ---------- */
Drawer::Drawer(Controller& c, const String& t, const String& b) : title(t), blurb(b), ctl(c) {
  addAndMakeVisible(close); close.onClick = [this] { if (onClose) onClose(); }; close.setTooltip("Close");
  addAndMakeVisible(view); view.setViewedComponent(&body, false); view.setScrollBarsShown(true, false); view.setScrollBarThickness(6);
}
int Drawer::preferredHeight(int width) {
  float tw = textWidth(font(FELL, 20), title), extra = extraHead ? (float)extraHead->getWidth() + 16 : 0;
  float pw = width - 32 - tw - 16 - extra - 16 - 30;
  headH = jmax(30.f, paraHeight(blurb, pw, font(SERIF_ITAL, 14), 18.2f));
  return (int)(12 + headH + 10 + contentHeight(width - 32) + 12 + 2);
}
void Drawer::resized() {
  int W = getWidth(); float tw = textWidth(font(FELL, 20), title);
  float extra = extraHead ? (float)extraHead->getWidth() + 16 : 0, pw = W - 32 - tw - 16 - extra - 16 - 30;
  headH = jmax(30.f, paraHeight(blurb, pw, font(SERIF_ITAL, 14), 18.2f));
  close.setBounds(W - 16 - 30, 12 + (int)(headH - 30) / 2, 30, 30);
  if (extraHead) extraHead->setTopLeftPosition(close.getX() - 16 - extraHead->getWidth(), 12 + (int)(headH - extraHead->getHeight()) / 2);
  int top = 12 + (int)headH + 10, bw = W - 32;
  int ch = contentHeight(bw); bool scroll = ch > getHeight() - top - 12;
  if (scroll) ch = contentHeight(bw - 8);
  body.setSize(scroll ? bw - 8 : bw, ch);
  view.setBounds(16, top, bw, getHeight() - top - 12);
}
void Drawer::paint(Graphics& g) {
  auto r = getLocalBounds().toFloat();
  for (int i = 0; i < 10; i++) { g.setColour(Colours::black.withAlpha(.05f)); g.fillRoundedRectangle(r.translated(0, -2.f * i).expanded((float)i), 14); }
  ColourGradient bg(Colour(0xff1c1511), 0, 0, Colour(0xff120e0c), 0, r.getHeight(), false); g.setGradientFill(bg); g.fillRoundedRectangle(r, 14);
  g.setColour(giltLo); g.drawRoundedRectangle(r.reduced(.5f), 14, 1);
  auto tf = font(FELL, 20); float tw = textWidth(tf, title);
  g.setColour(gilt); g.setFont(tf); g.drawSingleLineText(title, 16, (int)(12 + headH / 2 + 6));
  float extra = extraHead ? (float)extraHead->getWidth() + 16 : 0, pw = getWidth() - 32 - tw - 16 - extra - 16 - 30;
  float ph = paraHeight(blurb, pw, font(SERIF_ITAL, 14), 18.2f);
  para(g, blurb, Rectangle<float>(16 + tw + 16, 12 + (headH - ph) / 2, pw, 100), font(SERIF_ITAL, 14), dim, 18.2f);
}

// lay a row of fixed-width items out left to right, wrapping; returns the bottom
template <typename T> static int flow(const OwnedArray<T>& items, int x0, int y, int width, int itemW, int gapX, int gapY, int& rowH) {
  int x = x0; rowH = 0; int bottom = y;
  for (auto* it : items) {
    int h = it->preferredHeight(itemW);
    if (x > x0 && x + itemW > x0 + width) { x = x0; y = bottom + gapY; }
    it->setBounds(x, y, itemW, h); x += itemW + gapX; bottom = jmax(bottom, y + h); rowH = jmax(rowH, h);
  }
  return bottom;
}

/* ---------- Voice: every knob of the selected voice ---------- */
VoiceDrawer::VoiceDrawer(Controller& c) : Drawer(c, "Voice", "Every knob of the selected voice: the model, its channel strip, and Tune & place on top of the Macros.") {
  defaults.setSize((int)defaults.preferredWidth() + 10, 26); addAndMakeVisible(defaults); extraHead = &defaults;
  defaults.onClick = [this] { ctl.offDefaults(); refresh(); };
  painter.d = this; body.addAndMakeVisible(painter); painter.setInterceptsMouseClicks(false, false);
  reset.setTooltip("Set this instrument's tune, material and distance back to zero"); reset.onClick = [this] { ctl.resetOff(ctl.sel()); };
}
void VoiceDrawer::build() {
  int s = ctl.sel(); if (s == built) return; built = s;
  model.clear(); water.clear(); channel.clear(); offs.clear(); segs.clear(); toggles.clear(); subs.clear();
  String k(HE_S[s]);
  if (s == he::AURA) body.addAndMakeVisible(toggles.add(new ParamToggle(ctl, he::P_AURA_FREEZE, "Freeze")));
  body.addAndMakeVisible(toggles.add(new ParamToggle(ctl, Controller::indexOf(k + ".hold"), "Hold")));
  body.addAndMakeVisible(toggles.add(new ParamToggle(ctl, Controller::indexOf(k + ".mute"), "Mute")));
  for (int i = 0; i < he::NPARAM; i++) {
    const auto& d = he::PARAMS[i]; String id(d.id); if (!id.startsWith(k + ".") || d.channel || d.off) continue;
    String lab(CharPointer_UTF8(d.label)); if (d.sw && (lab == "Hold" || lab == "Mute" || lab == "Freeze")) continue;
    if (d.nEnum) body.addAndMakeVisible(segs.add(new Segment(ctl, i)));
    else if (d.sw) body.addAndMakeVisible(subs.add(new ParamToggle(ctl, i, lab)));
    else body.addAndMakeVisible(model.add(new Knob(ctl, i)));
  }
  // bowed and struck metal and the superball's steel sheet can sit in water (the waterphone)
  if (s == he::BOWED || s == he::STRUCK || s == he::MOAN) for (auto id : {"water.level", "water.tilt", "water.amt", "water.slosh"}) body.addAndMakeVisible(water.add(new Knob(ctl, Controller::indexOf(id))));
  for (int i = 0; i < he::NPARAM; i++) { String id(he::PARAMS[i].id); if (id.startsWith(k + ".") && he::PARAMS[i].channel) body.addAndMakeVisible(channel.add(new Knob(ctl, i))); }
  for (auto q : Controller::OFF_KEYS) body.addAndMakeVisible(offs.add(new Knob(ctl, Controller::indexOf(k + "." + q))));
  body.addAndMakeVisible(reset); painter.toFront(false);
  title = "Voice " + String(ROMAN[s]);
  resized(); repaint();
}
int VoiceDrawer::contentHeight(int W) {
  build(); labs.clear();
  int s = ctl.sel(); float y = 0;
  // voicehead: name | description | Freeze Hold Mute
  auto nf = font(FELL, 22); float nw = textWidth(nf, U(SRC[s].n)); int tgw = 0; for (auto* t : toggles) tgw += (int)t->preferredWidth() + 6;
  float pw = W - nw - 14 - 14 - tgw; float ph = paraHeight(U(SRC[s].d), pw, font(SERIF_ITAL, 14), 18.2f);
  float hh = jmax(28.f, ph); labs.push_back({U(SRC[s].n), {}, {0, y, nw + 2, 28}, 0}); labs.push_back({U(SRC[s].d), {}, {nw + 14, y + 2, pw, ph}, 1});
  int tx = W - tgw + 6; for (auto* t : toggles) { int bw = (int)t->preferredWidth(); t->setBounds(tx, (int)y, bw, 28); tx += bw + 6; t->refresh(); }
  y += hh + 10;
  // two columns: the model; the channel and Tune & place
  int gap = 18, lw = (int)((W - gap) * 1.25f / 2.25f), rx = lw + gap, rw = W - rx;
  float ly = y; labs.push_back({"The model", {}, {0, ly, (float)lw, 18}, 2}); ly += 21;
  int sx = 0, sy = (int)ly, srow = 0;
  for (auto* sg : segs) { int sw = sg->preferredWidth(); if (sx > 0 && sx + sw > lw) { sx = 0; sy += 26 + 6; } sg->setBounds(sx, sy, sw, 26); sx += sw + 16; srow = 1; sg->refresh(); }
  if (srow) ly = (float)sy + 26 + 8;
  int rh = 0; int bottom = flow(model, 0, (int)ly, lw, 70, 2, 8, rh); ly = (float)bottom;
  if (water.size()) { ly += 10; labs.push_back({"Water (shared)", {}, {0, ly, (float)lw, 18}, 2}); ly += 21; ly = (float)flow(water, 0, (int)ly, lw, 70, 2, 8, rh); }
  for (auto* t : subs) { ly += 8; t->setBounds(0, (int)ly, (int)t->preferredWidth(), 28); ly += 28; t->refresh(); }
  float ry = y; labs.push_back({"Channel", {}, {(float)rx, ry, (float)rw, 18}, 2}); ry += 21;
  int cx = rx; float chh = 0; for (auto* k : channel) { int h = k->preferredHeight(62); k->setBounds(cx, (int)ry, 62, h); cx += 62; chh = jmax(chh, (float)h); }
  ry += chh + 10; labs.push_back({"Tune & place", "on top of the Macros, this voice only", {(float)rx, ry, (float)rw, 18}, 3}); ry += 21;
  cx = rx; float oh = 0; for (auto* k : offs) { int h = k->preferredHeight(62); k->setBounds(cx, (int)ry, 62, h); cx += 62; oh = jmax(oh, (float)h); }
  int rbw = (int)reset.preferredWidth(); reset.setBounds(cx + 6, (int)(ry + oh / 2 - 14), rbw, 28);
  ry += oh;
  float total = jmax(ly, ry) + 4; painter.setBounds(0, 0, W, (int)total);
  return (int)total;
}
void VoiceDrawer::paintBody(Graphics& g) {
  for (auto& L : labs) {
    if (L.kind == 0) text(g, L.t, L.r, font(FELL, 22), live);
    else if (L.kind == 1) para(g, L.t, L.r, font(SERIF_ITAL, 14), dim, 18.2f);
    else { auto f = font(FELL, 15, .06f); text(g, L.t, L.r, f, gilt); if (L.s.isNotEmpty()) text(g, L.s, L.r.withTrimmedLeft(textWidth(f, L.t) + 6), font(SERIF_ITAL, 13), dim); }
  }
}
void VoiceDrawer::refresh() {
  if (ctl.sel() != built) { build(); resized(); }
  for (auto* k : model) k->refresh(); for (auto* k : water) k->refresh(); for (auto* k : channel) k->refresh(); for (auto* k : offs) k->refresh();
  for (auto* s : segs) s->refresh(); for (auto* t : toggles) t->refresh(); for (auto* t : subs) t->refresh();
  // Defaults: Defaults / Sure? / Undo
  String dt = ctl.offUndoActive() ? "Undo" : ctl.offSure ? "Sure?" : "Defaults";
  bool en = ctl.offUndoActive() || ctl.anyOffDirty();
  if (dt != defaults.text || en != defaults.enabled) { defaults.text = dt; defaults.enabled = en; defaults.repaint(); }
  defaults.setTooltip(ctl.offUndoActive() ? "Restore the instrument offsets from just before Defaults" : ctl.offSure ? "Click again to reset every instrument's tune, material and distance" : en ? "Reset every instrument's tune, material and distance to zero" : "Every instrument is already at its default tune, material and distance");
}

/* ---------- Effects: the signal flow ---------- */
FxDrawer::FxDrawer(Controller& c) : Drawer(c, String::fromUTF8("Effects \xc2\xb7 signal flow"), "Every voice sends into shared returns, then the Master. The sends on the left belong to the selected voice.") {
  painter.d = this; body.addAndMakeVisible(painter); painter.setInterceptsMouseClicks(false, false);
  for (auto id : {"rev.size", "rev.decay", "rev.damp", "rev.pre", "rev.mix"}) body.addAndMakeVisible(hall.add(new Knob(c, Controller::indexOf(id))));
  for (auto id : {"spring.decay", "spring.tension", "spring.disp"}) body.addAndMakeVisible(spring.add(new Knob(c, Controller::indexOf(id))));
  for (auto id : {"harm.shift", "harm.detune", "harm.fb", "harm.mix"}) body.addAndMakeVisible(harm.add(new Knob(c, Controller::indexOf(id))));
  for (auto id : {"body.amt", "body.piezo", "body.size", "body.spring"}) body.addAndMakeVisible(bodyk.add(new Knob(c, Controller::indexOf(id))));
  for (auto id : {"master.tone", "master.vol"}) body.addAndMakeVisible(master.add(new Knob(c, Controller::indexOf(id))));
}
int FxDrawer::contentHeight(int W) {
  int s = ctl.sel();
  if (s != built) { built = s; sends.clear(); String k(HE_S[s]); for (auto q : {".rev", ".spr", ".hsend"}) { int i = Controller::indexOf(k + q); if (i >= 0) body.addAndMakeVisible(sends.add(new Knob(ctl, i))); } painter.toBack(); }
  float c0 = 184, w1 = 46, w3 = 36, c4 = 158, c2 = W - c0 - w1 - w3 - c4;
  // returns: four rows, each a heading then its knobs
  float y = 0; OwnedArray<Knob>* rows[4] = {&hall, &spring, &harm, &bodyk};
  for (int i = 0; i < 4; i++) {
    int kh = (*rows[i])[0]->preferredHeight(68); for (auto* k : *rows[i]) kh = jmax(kh, k->preferredHeight(68));
    float h = (float)kh + 8; ret[i] = Rectangle<float>(c0 + w1, y, c2, h);
    float x = ret[i].getX() + 10 + 128 + 6; for (auto* k : *rows[i]) { k->setBounds((int)x, (int)(y + 4), 68, kh); x += 68 + 2; }
    y += h + 6;
  }
  float total = y - 6;
  // the selected voice's sends
  int skh = sends.size() ? sends[0]->preferredHeight(54) : 60; for (auto* k : sends) skh = jmax(skh, k->preferredHeight(54));
  float ph1 = 2 * 18.9f, ph2 = paraHeight("Body is shared: every voice is bolted to the box. Your sound in has its own sends.", c0 - 20, font(SERIF_ITAL, 13), 17.55f);
  float sh = 8 + 21 + ph1 + 8 + skh + 8 + ph2 + 8; src = Rectangle<float>(0, jmax(0.f, (total - sh) / 2), c0, sh);
  float gapS = sends.size() > 1 ? (c0 - 20 - sends.size() * 54.f) / (sends.size() - 1) : 0;
  for (int i = 0; i < sends.size(); i++) sends[i]->setBounds((int)(src.getX() + 10 + i * (54 + gapS)), (int)(src.getY() + 8 + 21 + ph1 + 8), 54, skh);
  // the master
  int mkh = master[0]->preferredHeight(66); float mh = 8 + 21 + mkh + 4 + 18 + 4 + 18 + 8; mst = Rectangle<float>(W - c4, (total - mh) / 2, c4, mh);
  master[0]->setBounds((int)(mst.getCentreX() - 66 - 1), (int)(mst.getY() + 8 + 21), 66, mkh); master[1]->setBounds((int)(mst.getCentreX() + 1), (int)(mst.getY() + 8 + 21), 66, mkh);
  painter.setBounds(0, 0, W, (int)total);
  return (int)total;
}
void FxDrawer::paintBody(Graphics& g) {
  auto node = [&](Rectangle<float> r) { box(g, r, 10, inkBg(), line2); };
  node(src); text(g, "Voice " + String(ROMAN[ctl.sel()]) + " sends", Rectangle<float>(src.getX() + 10, src.getY() + 8, src.getWidth() - 20, 20), font(SERIF_SEMI, 16), bone);
  para(g, String::fromUTF8("Grit \xe2\x86\x92 Level \xe2\x86\x92 Pan"), Rectangle<float>(src.getX() + 10, src.getY() + 8 + 21, src.getWidth() - 20, 40), font(SERIF, 14), bone2, 18.9f);
  para(g, String::fromUTF8("\xe2\x86\x92 Distance \xe2\x86\x92 dry"), Rectangle<float>(src.getX() + 10, src.getY() + 8 + 21 + 18.9f, src.getWidth() - 20, 40), font(SERIF, 14), bone2, 18.9f);
  float alsoY = sends.size() ? (float)sends[0]->getBottom() + 8 : src.getBottom() - 50;
  para(g, "Body is shared: every voice is bolted to the box. Your sound in has its own sends.", Rectangle<float>(src.getX() + 10, alsoY, src.getWidth() - 20, 80), font(SERIF_ITAL, 13), dim, 17.55f);
  const char* names[4][2] = {{"Hall", "the huge reverb"}, {"Spring tank", "voice VI's tank"}, {"Harmonizer", "pitch-shifted return"}, {"Body & piezo", "the wooden box"}};
  for (int i = 0; i < 4; i++) {
    node(ret[i]); float cy = ret[i].getCentreY();
    text(g, names[i][0], Rectangle<float>(ret[i].getX() + 10, cy - 19, 128, 20), font(SERIF_SEMI, 16), bone);
    text(g, names[i][1], Rectangle<float>(ret[i].getX() + 10, cy + 2, 128, 17), font(SERIF_ITAL, 13), dim);
  }
  node(mst); text(g, "Master", Rectangle<float>(mst.getX(), mst.getY() + 8, mst.getWidth(), 20), font(SERIF_SEMI, 16), bone, Justification::centredTop);
  float ly = (float)master[0]->getBottom() + 4;
  float gr = 20 * std::log10(jmax(1e-4f, ctl.tm.gainReduction > 0 ? ctl.gr : 1.f)); limit = "Limiter " + (gr < -.05f ? String(gr, 1) : String("0.0")) + " dB";
  text(g, limit, Rectangle<float>(mst.getX(), ly, mst.getWidth(), 18), font(SERIF, 13), bone2, Justification::centred);
  text(g, String::fromUTF8("\xe2\x86\x92 out"), Rectangle<float>(mst.getX(), ly + 22, mst.getWidth(), 18), font(SERIF, 13), live, Justification::centred);
  // wires: the sends fan out to the returns, the returns gather into the master
  g.setColour(giltLo); Point<float> a(src.getRight(), src.getCentreY());
  for (auto& r : ret) { Path p; p.startNewSubPath(a); p.cubicTo(a.x + 23, a.y, r.getX() - 23, r.getCentreY(), r.getX(), r.getCentreY()); g.strokePath(p, PathStrokeType(1.5f)); }
  Point<float> b(mst.getX(), mst.getCentreY());
  for (auto& r : ret) { Path p; p.startNewSubPath(r.getRight(), r.getCentreY()); p.cubicTo(r.getRight() + 18, r.getCentreY(), b.x - 18, b.y, b.x, b.y); g.strokePath(p, PathStrokeType(1.5f)); }
}
void FxDrawer::refresh() {
  if (ctl.sel() != built) resized();
  for (auto* arr : {&sends, &hall, &spring, &harm, &bodyk, &master}) for (auto* k : *arr) k->refresh();
  painter.repaint(mst.toNearestInt().translated(0, 0));
}

/* ---------- Looper ---------- */
LoopDrawer::LoopDrawer(Controller& c) : Drawer(c, "Gesture looper", "Loops store what your hand did, not audio, so each pass is performed again by the models. Hand a layer to a Ghost and it keeps improvising with your strokes.") {
  painter.d = this; body.addAndMakeVisible(painter); painter.setInterceptsMouseClicks(false, false);
  body.addAndMakeVisible(rec); body.addAndMakeVisible(freeLen); body.addAndMakeVisible(syncBox); body.addAndMakeVisible(clear);
  for (Component* c : std::initializer_list<Component*>{&freeLen, &syncBox}) c->setWantsKeyboardFocus(false);   // Space stays with the host
  rec.setTooltip("Start or stop a loop layer (Space)"); rec.onClick = [this] { ctl.loopToggle(); };
  clear.onClick = [this] { ctl.loopCmd(LA_CLEAR); };
  freeLen.setTooltip("Off (default): new layers lock to the first layer's cycle, so overdubs stay in time. On: the new layer keeps its own length and drifts against the others.");
  freeLen.onClick = [this] { ctl.freeLength = freeLen.getToggleState(); };
  syncBox.setTooltip("On (default): while the host plays at a known tempo, the first layer rounds to whole bars, layers start on the next bar line and stay locked to the host's bars, following tempo changes, jumps and loops. Off, or with the host stopped: loops run free, as in the web app.");
  syncBox.onClick = [this] { ctl.setSyncToHost(syncBox.getToggleState()); };
}
int LoopDrawer::contentHeight(int W) {
  width = W; int x = 0; int rw = (int)rec.preferredWidth() + 30; rec.setBounds(x, 0, rw, 30); x += rw + 10;
  freeLen.setBounds(x, 0, 110, 30); x += 110 + 6; syncBox.setBounds(x, 0, 120, 30); x += 120 + 10; int cw = (int)clear.preferredWidth(); clear.setBounds(x, 2, cw, 26);
  int y = 38;
  if (rows.isEmpty()) y += 40;
  for (auto* r : rows) {
    r->r = Rectangle<float>(0, (float)y, (float)W, 38);
    r->voice.setBounds(8 + 30 + 10, y + 6, 170, 26);
    int ax = W - 8; for (Pill* b : {&r->del, &r->mute, &r->ghost}) { int bw = (int)b->preferredWidth(); ax -= bw; b->setBounds(ax, y + 5, bw, 28); ax -= 6; }
    float lenW = 12 * 4.5f * .6f + 10; ax -= (int)lenW;
    r->prog = Rectangle<float>((float)r->voice.getRight() + 10, y + 16.f, (float)ax - 10 - (r->voice.getRight() + 10), 6);
    y += 38 + 6;
  }
  painter.setBounds(0, 0, W, y);
  return y;
}
void LoopDrawer::paintBody(Graphics& g) {
  const auto& t = ctl.tm; String status;
  if (t.synced) status = String(t.bpm, 1) + " BPM" + (t.laneBars > 0 ? String::fromUTF8(" \xc2\xb7 ") + String(t.laneBars) + (t.laneBars == 1 ? " bar" : " bars") : String()) + (t.recWaiting ? String::fromUTF8(" \xc2\xb7 starts on the next bar") : String());
  else if (ctl.syncToHost()) status = ctl.hostTempo() > 0 ? "Host stopped: running free" : "No host tempo: running free";
  else status = "Running free";
  para(g, status + String::fromUTF8(" \xc2\xb7 Space starts and stops a layer \xc2\xb7 G ghosts the newest \xc2\xb7 Backspace removes it"), Rectangle<float>((float)clear.getRight() + 10, 6, (float)width - clear.getRight() - 10, 40), font(SERIF_ITAL, 14), dim, 18);
  if (rows.isEmpty()) { auto r = Rectangle<float>(0, 38, (float)width, 34); box(g, r, 8, rgba(14, 11, 10, .5f), line, 1, true); text(g, "No layers yet. Press Space, play a phrase on the surface, press Space again.", r.reduced(12, 0), font(SERIF_ITAL, 15), dim); return; }
  for (int i = 0; i < rows.size(); i++) {
    auto* r = rows[i]; box(g, r->r, 8, rgba(14, 11, 10, .5f), line);
    text(g, i < 9 ? String(ROMAN[i]) : String(i + 1), Rectangle<float>(r->r.getX() + 8, r->r.getY(), 30, r->r.getHeight()), font(FELL, 15), gilt, Justification::centred);
    box(g, r->prog, 3, Colour(0xff0b0807), Colours::transparentBlack); g.setColour(gilt); g.fillRoundedRectangle(r->prog.withWidth(r->prog.getWidth() * jlimit(0.f, 1.f, r->pos)), 3);
    text(g, String(r->len, 1) + " s", Rectangle<float>(r->prog.getRight() + 4, r->r.getY(), 46, r->r.getHeight()), font(MONO, 12), dim, Justification::centredRight);
  }
}
void LoopDrawer::refresh() {
  const auto& t = ctl.tm; String id;
  for (int i = 0; i < t.nLayers; i++) id << t.layers[i].id << ":" << t.layers[i].src << ":" << (int)t.layers[i].mute << (int)t.layers[i].ghost << ",";
  if (id != ids) {
    ids = id; rows.clear();
    for (int i = 0; i < t.nLayers; i++) {
      auto L = t.layers[i]; auto* r = rows.add(new Row()); r->id = L.id; r->len = L.len;
      for (int j = 0; j < he::NS; j++) r->voice.addItem(U(SRC[j].n), j + 1);
      r->voice.setSelectedId(L.src + 1, dontSendNotification); r->voice.setTitle("Voice for this layer");
      int lid = L.id; r->voice.onChange = [this, r, lid] { ctl.loopCmd(LA_SRC, lid, r->voice.getSelectedId() - 1); };
      r->ghost.set(L.ghost); r->mute.set(L.mute); bool gh = L.ghost, mu = L.mute;
      r->ghost.setTooltip("Let a ghost player improvise with the strokes in this layer"); r->mute.setTooltip("Mute this layer");
      r->ghost.onClick = [this, lid, gh] { ctl.loopCmd(LA_GHOST, lid, gh ? 0 : 1); }; r->mute.onClick = [this, lid, mu] { ctl.loopCmd(LA_MUTE, lid, mu ? 0 : 1); };
      r->del.onClick = [this, lid] { ctl.loopCmd(LA_DEL, lid); };
      r->voice.setWantsKeyboardFocus(false);
      for (Component* c : std::initializer_list<Component*>{&r->voice, &r->ghost, &r->mute, &r->del}) body.addAndMakeVisible(c);
    }
    if (auto* p = getParentComponent()) p->resized();
    resized();
  }
  for (int i = 0; i < rows.size() && i < t.nLayers; i++) rows[i]->pos = t.layers[i].pos;
  rec.setText(t.looping ? String::fromUTF8("\xe2\x96\xa0 Close the loop") : String::fromUTF8("\xe2\x97\x8f Loop a gesture")); rec.set(t.looping);
  freeLen.setToggleState(ctl.freeLength, dontSendNotification); syncBox.setToggleState(ctl.syncToHost(), dontSendNotification);
  painter.repaint();
}

/* ---------- Your sound in ---------- */
InDrawer::InDrawer(Controller& c) : Drawer(c, "Your sound in", "The audio coming into the plugin on its track (a mic, a line, another track) or a file, through the spring, body, hall, harmonizer and Aura. Dry is its own level in the mix.") {
  painter.d = this; body.addAndMakeVisible(painter); painter.setInterceptsMouseClicks(false, false);
  for (Component* x : std::initializer_list<Component*>{&track, &file, &loop, &stop}) body.addAndMakeVisible(x);
  track.setTooltip("Run the audio coming into this plugin on its track through the machine (route a mic, a line or another track to it in your DAW)");
  file.setTooltip("Play an audio file through the machine"); loop.setTooltip("Loop the file"); loop.setToggleState(true, dontSendNotification); loop.setWantsKeyboardFocus(false);
  track.onClick = [this] { ctl.inputTrack(); }; file.onClick = [this] { ctl.inputFile(); }; stop.onClick = [this] { ctl.inputStop(); };
  loop.onClick = [this] { ctl.inputLoop = loop.getToggleState(); };
  for (auto id : {"input.level", "input.spr", "input.body", "input.rev", "input.hsend", "input.aura"}) body.addAndMakeVisible(knobs.add(new Knob(c, Controller::indexOf(id))));
}
int InDrawer::contentHeight(int W) {
  int x = 0; for (Pill* p : {&track, &file}) { int w = (int)p->preferredWidth(); p->setBounds(x, 2, w, 26); x += w + 8; }
  loop.setBounds(x, 0, 64, 30); x += 64 + 8; int sw = (int)stop.preferredWidth(); stop.setBounds(x, 2, sw, 26); x += sw + 8;
  meter = Rectangle<float>((float)x, 12.5f, 80, 5); state = Rectangle<float>((float)x + 88, 0, (float)W - x - 88, 30);
  int rh = 0; int b = flow(knobs, 0, 30 + 12, W, 76, 4, 8, rh);
  painter.setBounds(0, 0, W, b);
  return b;
}
void InDrawer::paintBody(Graphics& g) {
  g.setColour(Colours::black); g.fillRoundedRectangle(meter, 2.5f);
  float v = jlimit(0.f, 1.f, (20 * std::log10(ctl.inPk + 1e-6f) + 54) / 54);
  if (ctl.inputOn() && v > 0) { ColourGradient cg(giltLo, meter.getX(), 0, live, meter.getRight(), 0, false); g.setGradientFill(cg); g.fillRoundedRectangle(meter.withWidth(80 * v), 2.5f); }
  text(g, ctl.inputState(), state, font(MONO, 13), bone2);
}
void InDrawer::refresh() {
  track.set(ctl.inputKind() == 1); file.set(ctl.inputKind() == 2); stop.enabled = ctl.inputOn(); stop.repaint();
  for (auto* k : knobs) k->refresh();
  if (ctl.inPk != shownPk || ctl.inputState() != shownState) { shownPk = ctl.inPk; shownState = ctl.inputState(); painter.repaint(); }
}
