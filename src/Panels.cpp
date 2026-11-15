// Horror Engine · Séance: top bar, voice tokens, side column, rail, chain, popovers, guide and toast.
// Horror Engine by Garyck Arntzen (https://x.com/_mintydoge). Plugin released under the GNU AGPLv3.
#include "Panels.h"
#include "PluginProcessor.h"
#include "he_presets.gen.h"

using namespace juce;
using namespace look;

static String nn(int n) { static const char* N[] = {"C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"}; return String(N[n % 12]) + String(n / 12 - 1); }
static String U(const char* s) { return String(CharPointer_UTF8(s)); }
static String dot() { return String::fromUTF8(" \xc2\xb7 "); }
static float dbn(float x) { return jlimit(0.f, 1.f, (20 * std::log10(x + 1e-6f) + 54) / 54); }

void drawSection(Graphics& g, Rectangle<float> r, const String& title, const String& note, float radius) {
  box(g, r, radius, panelBg(), line);
  auto f = font(FELL, 17, .04f); float tw = textWidth(f, title);
  g.setColour(gilt); g.setFont(f); g.drawSingleLineText(title, (int)(r.getX() + 12), (int)(r.getY() + 8 + 14));
  if (note.isNotEmpty()) { auto nf = font(SERIF_ITAL, 13); float nw = jmin(textWidth(nf, note), r.getWidth() - 24 - tw - 8); text(g, note, Rectangle<float>(r.getRight() - 12 - nw, r.getY() + 8 + 14 - 12, nw, 16), nf, dim, Justification::centredRight); }
}

/* ---------- top bar ---------- */
TopBar::TopBar(Controller& c) : ctl(c) {
  for (auto* p : {&prev, &next, &browse, &undo, &redo, &learn, &menu, &title, &star}) addAndMakeVisible(p);
  prev.setTooltip("Previous preset"); next.setTooltip("Next preset"); title.setTooltip("Browse presets");
  learn.setTooltip("MIDI learn: press, then click any knob, switch or selector and move a control on your controller"); menu.setTooltip("Menu");
  prev.onClick = [this] { ctl.step(-1); }; next.onClick = [this] { ctl.step(1); };
  browse.onClick = [this] { if (onBrowse) onBrowse(); }; title.onClick = [this] { if (onBrowse) onBrowse(); };
  star.onClick = [this] { ctl.star(ctl.presetName()); };
  undo.onClick = [this] { ctl.undo(); }; redo.onClick = [this] { ctl.redo(); };
  learn.onClick = [this] { if (ctl.learning() >= 0) { ctl.learnStop(); ctl.toast("MIDI learn cancelled."); } else ctl.pick(!ctl.picking); };
  menu.onClick = [this] { if (onMenu) onMenu(); };
}
void TopBar::resized() {
  int W = getWidth(), cy = 25;
  int x = W - 14 - 30; menu.setBounds(x, cy - 15, 30, 30);
  x -= 8 + 80; meter = Rectangle<float>((float)x, cy - 9.5f, 80, 19);
  int lw = (int)learn.preferredWidth(); x -= 8 + lw; learn.setBounds(x, cy - 15, lw, 30);
  x -= 8 + 30; redo.setBounds(x, cy - 15, 30, 30); x -= 8 + 30; undo.setBounds(x, cy - 15, 30, 30);
  int toolsL = x - 16, brandR = 14 + 260 + 16, bw = (int)browse.preferredWidth();
  int gw = 30 + 6 + 340 + 6 + 30 + 6 + bw, gx = brandR + jmax(0, (toolsL - brandR - gw) / 2);
  prev.setBounds(gx, cy - 15, 30, 30); pname = Rectangle<float>((float)gx + 36, cy - 17.f, 340, 34);
  next.setBounds(gx + 36 + 340 + 6, cy - 15, 30, 30); browse.setBounds(gx + 36 + 340 + 6 + 36, cy - 15, bw, 30);
  star.setBounds((int)pname.getRight() - 12 - 22, cy - 11, 22, 22);
  auto tf = font(SERIF_SEMI, 17); float numW = textWidth(font(MONO, 12), "00/00");
  int tx = (int)(pname.getX() + 16 + numW + 9), tw = (int)jmin(textWidth(tf, ctl.presetName()) + 2, pname.getWidth() - 16 - numW - 9 - 12 - 22 - 9 - 60);
  title.setBounds(tx, cy - 12, tw, 24);
}
void TopBar::paint(Graphics& g) {
  g.setColour(line); g.fillRect(0, getHeight() - 1, getWidth(), 1);
  auto bf = font(FELL, 23, .06f); g.setColour(bone); g.setFont(bf); g.drawSingleLineText("Horror Engine", 14, 33);
  g.setColour(gilt); g.setFont(font(SERIF_ITAL, 15)); g.drawSingleLineText(String::fromUTF8("S\xc3\xa9" "ance"), 14 + (int)textWidth(bf, "Horror Engine") + 10, 33);
  box(g, pname, 17, Colours::transparentBlack, giltLo);
  auto mf = font(MONO, 12); float numW = textWidth(mf, "00/00");
  text(g, shownNum, Rectangle<float>(pname.getX() + 16, pname.getY(), numW + 2, pname.getHeight()), mf, dim);
  auto tf = font(SERIF_SEMI, 17); text(g, shownTitle, title.getBounds().toFloat(), tf, live);
  if (shownEdit.isNotEmpty()) text(g, shownEdit, Rectangle<float>((float)title.getRight() + 9, pname.getY(), star.getX() - title.getRight() - 18.f, pname.getHeight()), font(SERIF_ITAL, 14), dim);
  icon(g, 0x2605, star.getBounds().toFloat(), shownStar ? gilt : dim);
  // the meter: L, R and the limiter's gain reduction (ember, from the right)
  for (int i = 0; i < 2; i++) {
    auto b = Rectangle<float>(meter.getX(), meter.getY() + i * 8, 80, 5); g.setColour(Colours::black); g.fillRoundedRectangle(b, 2.5f);
    float v = i ? mR : mL; if (v > 0) { ColourGradient cg(giltLo, b.getX(), 0, live, b.getRight(), 0, false); g.setGradientFill(cg); Graphics::ScopedSaveState s(g); g.reduceClipRegion(b.withWidth(80 * v).toNearestInt()); g.fillRoundedRectangle(b, 2.5f); }
  }
  if (mG > 0) { g.setColour(ember); g.fillRect(Rectangle<float>(meter.getRight() - 80 * mG, meter.getY() + 16, 80 * mG, 3)); }
}
void TopBar::refresh() {
  int i = ctl.presetIndex(); auto pad2 = [](int n) { return String(n).paddedLeft('0', 2); };
  String num = pad2(i + 1) + "/" + pad2(he::NPRESET), t = ctl.presetName(), ed = ctl.edited() ? "edited" : ""; bool st = ctl.isFav(t);
  float l = dbn(ctl.pkL), r = dbn(ctl.pkR), gr = jmin(1.f, (1 - ctl.gr) * 2);
  if (t != shownTitle) { shownTitle = t; resized(); }
  if (num != shownNum || ed != shownEdit || st != shownStar || std::abs(l - mL) > .004f || std::abs(r - mR) > .004f || std::abs(gr - mG) > .004f) {
    shownNum = num; shownEdit = ed; shownStar = st; mL = l; mR = r; mG = gr; repaint();
  }
  star.setTooltip((st ? "Unstar " : "Star ") + t);
  undo.enabled = ctl.canUndo(); redo.enabled = ctl.canRedo(); undo.setTooltip(ctl.undoTitle()); redo.setTooltip(ctl.redoTitle()); undo.repaint(); redo.repaint();
  learn.set(ctl.picking || ctl.learning() >= 0);
}

/* ---------- voice tokens (the rack) ---------- */
int Tokens::at(Point<int> p) const { float w = (getWidth() - 8 * 4) / 9.f; int i = (int)(p.x / (w + 4)); return jlimit(0, 8, i); }
void Tokens::mouseUp(const MouseEvent& e) { if (getLocalBounds().contains(e.getPosition()) && e.y < getHeight() - 8 && !e.mods.isPopupMenu()) ctl.select(at(e.getPosition())); }
String Tokens::getTooltip() { int i = at(getMouseXYRelative()); return U(SRC[i].n) + " (key " + String(i + 1) + "). " + U(SRC[i].d); }
void Tokens::paint(Graphics& g) {
  float w = (getWidth() - 8 * 4) / 9.f, h = (float)getHeight() - 8; int s = ctl.sel();
  Point<int> mp = getMouseXYRelative(); int hov = isMouseOver() ? at(mp) : -1;
  for (int i = 0; i < he::NS; i++) {
    auto r = Rectangle<float>(i * (w + 4), 0, w, h); String k(HE_S[i]);
    bool m = ctl.P(k + ".mute") > .5, hd = ctl.P(k + ".hold") > .5, fz = i == he::AURA && ctl.P(he::P_AURA_FREEZE) > .5, cur = i == s, held = hd && !m;
    if (cur) { ColourGradient cg(rgba(201, 168, 101, .22f), 0, r.getY(), rgba(201, 168, 101, .06f), 0, r.getBottom(), false); g.setGradientFill(cg); g.fillRoundedRectangle(r, 8); box(g, r, 8, Colours::transparentBlack, gilt); }
    else box(g, r, 8, rgba(23, 17, 14, .7f), held ? giltLo : hov == i ? line2 : line, 1, held);
    float y = r.getY() + 8;
    text(g, ROMAN[i], Rectangle<float>(r.getX(), y, w, 15), font(FELL, 14), cur ? live : giltTxt, Justification::centred); y += 14 + 3;
    auto nf = font(SERIF_SEMI, 14); String name(CharPointer_UTF8(SRC[i].n));
    text(g, name, Rectangle<float>(r.getX() + 2, y, w - 4, 17), nf, cur ? live : m ? dim : bone, Justification::centred);
    if (m) { float tw = jmin(w - 4, textWidth(nf, name)); g.setColour(ember); g.fillRect(r.getCentreX() - tw / 2, y + 9.5f, tw, 1.f); }
    y += 17;
    String sm = m ? "muted" : fz ? "frozen" : hd ? "holding" : cur ? "plays the board" : "";
    text(g, sm, Rectangle<float>(r.getX() + 2, y, w - 4, 16), font(SERIF_ITAL, 13), dim, Justification::centred);
    // the activity line
    float a = dbn(ctl.srcPk[i]); auto u = Rectangle<float>(r.getX() + 14, r.getBottom() - 4 - 2, w - 28, 2);
    g.setColour(a > .05f ? rgba(239, 220, 166, .25f + a * .75f) : Colour(0xff2a211b)); g.fillRoundedRectangle(u, 1);
    if (ctl.offDirty(i)) { g.setColour(gilt.withAlpha(.35f)); g.fillEllipse(r.getRight() - 6 - 6 - 3, r.getY() + 6 - 3, 12, 12); g.setColour(gilt); g.fillEllipse(r.getRight() - 6 - 6, r.getY() + 6, 6, 6); }
    if (cur) { Path p; p.addTriangle(r.getCentreX() - 6, r.getBottom() + 1, r.getCentreX() + 6, r.getBottom() + 1, r.getCentreX(), r.getBottom() + 7); g.setColour(gilt); g.fillPath(p); }
  }
}

/* ---------- the side column: Macros, Moments, Pinned ---------- */
class MomentsPanel : public Component {
 public:
  explicit MomentsPanel(Controller& c) : ctl(c) {
    addAndMakeVisible(view); view.setViewedComponent(&inner, false); view.setScrollBarsShown(true, false); view.setScrollBarThickness(6);
    for (int i = 2; i < 5; i++) { auto* p = pads.add(new Pill("", Pill::PAD)); inner.addAndMakeVisible(p); p->onClick = [this, i] { ctl.momentToggle(i); }; p->setTooltip(String(MOMENTS[i].name) + ": " + MOMENTS[i].desc + ". Key F" + String(i + 1) + ", MIDI channel 16 note " + String(36 + i) + " (" + nn(36 + i) + ") or CC " + String(24 + i) + ". Press again to stop."); }
    inner.paintFn = [this](Graphics& g) { paintInner(g); };
    addAndMakeVisible(rec); addAndMakeVisible(imp); rec.setTooltip("Capture a moment: every gesture on any voice plus knob and macro moves from now until you press it again");
    imp.setTooltip("Import a .horror-moment.json file");
    rec.onClick = [this] { ctl.cmRecToggle(); }; imp.onClick = [this] { ctl.cmImportFile(); };
    addChildComponent(name); addChildComponent(keep); addChildComponent(drop);
    name.setFont(font(SERIF, 14)); name.setInputRestrictions(40); name.setIndents(8, 4); name.setTitle("Name for the new moment");
    keep.onClick = [this] { ctl.cmNameDone(true, name.getText()); }; drop.onClick = [this] { ctl.cmNameDone(false, {}); };
    name.onReturnKey = [this] { ctl.cmNameDone(true, name.getText()); }; name.onEscapeKey = [this] { ctl.cmNameDone(false, {}); };
    name.onTextChange = [this] { ctl.cmPend.name = name.getText(); };
  }
  void resized() override {
    int W = getWidth(), y = getHeight();
    y -= 28; rec.setBounds(0, y, W - 6 - (int)imp.preferredWidth(), 28); imp.setBounds(W - (int)imp.preferredWidth(), y + 1, (int)imp.preferredWidth(), 26);
    if (ctl.cmPending) { y -= 6 + 26; int bw1 = (int)keep.preferredWidth(), bw2 = (int)drop.preferredWidth(); name.setBounds(0, y, W - bw1 - bw2 - 8, 26); keep.setBounds(W - bw1 - bw2 - 4, y, bw1, 26); drop.setBounds(W - bw2, y, bw2, 26); }
    view.setBounds(0, 0, W, y - 6);
    layoutInner();
  }
  struct Inner : Component { std::function<void(Graphics&)> paintFn; void paint(Graphics& g) override { if (paintFn) paintFn(g); } } inner;
  void layoutInner() {
    int W = view.getWidth() - (needScroll ? 8 : 0), half = (W - 6) / 2, y = 0;
    auto padH = [&](const String& d, int w) { int lines = textWidth(font(SERIF_ITAL, 13), d) > w - 18 ? 2 : 1; return jmax(56, (int)std::ceil(6 + 17.25f + 2 + lines * 15.6f + 6)); };
    int h1 = jmax(padH(MOMENTS[2].desc, half), padH(MOMENTS[3].desc, half)), h2 = padH(MOMENTS[4].desc, half);
    pads[0]->setBounds(0, 0, half, h1); pads[1]->setBounds(half + 6, 0, half, h1); pads[2]->setBounds(0, h1 + 6, half, h2);
    y = h1 + 6 + h2 + 6;
    // your own moments (dashed), two per row; an open one spans the row with its options
    for (auto* c : cmItems) c->setVisible(false);
    int col = 0, rowH = 0; emptyBox = {};
    if (ctl.CMS.empty()) { int eh = (int)std::ceil(paraHeight("Your own moments land here: press Record moment, play anything, then press it again.", (float)W - 20, font(SERIF_ITAL, 13), 16.9f)) + 16; emptyBox = Rectangle<float>(0, (float)y, (float)W, (float)eh); y += eh; }
    for (size_t i = 0; i < ctl.CMS.size(); i++) {
      auto& c = ctl.CMS[i]; auto* it = item(c.id); bool open = ctl.cmOpen == c.id;
      String sub = String(c.len, 1) + " s, " + (c.voice >= 0 ? U(SRC[c.voice].n) : String("as played")); int n = 5 + (int)i + 1; if (n <= 12) sub += String::fromUTF8(" \xc2\xb7 F") + String(n);
      it->pad.text = c.name; it->pad.text2 = sub; it->num = n;
      if (open) { if (col) { y += rowH + 6; col = 0; } int ph = padH(sub, W); it->setBounds(0, y, W, ph + 70); it->open = true; y += ph + 70 + 6; rowH = 0; }
      else { int ph = padH(sub, half); it->open = false; it->setBounds(col ? half + 6 : 0, y, half, ph); rowH = jmax(rowH, ph); if (col) { y += rowH + 6; rowH = 0; col = 0; } else col = 1; }
      it->setVisible(true); it->layout();
    }
    if (col) y += rowH + 6;
    for (int i = cmItems.size() - 1; i >= 0; i--) { bool used = false; for (auto& c : ctl.CMS) if (c.id == cmItems[i]->id) used = true; if (!used) cmItems.remove(i); }
    inner.setBounds(0, 0, W, jmax(y, 10));
    bool ns = y > view.getHeight(); if (ns != needScroll) { needScroll = ns; layoutInner(); }
  }
  void refresh() {
    for (int i = 0; i < 3; i++) { auto* p = pads[i]; bool on = ctl.momentOn(i + 2); if (on != p->pressed) { p->pressed = on; inner.repaint(); } }
    for (auto* it : cmItems) { float pr = -1; for (auto& c : ctl.CMS) if (c.id == it->id) pr = ctl.cmPlaying(c); if (pr != it->pad.progress) { it->pad.progress = pr; it->pad.pressed = pr >= 0; it->repaint(); } }
    String rt = ctl.cmArmed ? String::fromUTF8("\xe2\x96\xa0 Stop moment") + (ctl.tm.cmRec >= 0 ? " " + String(ctl.tm.cmRec, 1) + " s" : String()) : String::fromUTF8("\xe2\x97\x8f Record moment");
    rec.setText(rt); rec.set(ctl.cmArmed);
    if (ctl.version != ver) {
      ver = ctl.version;
      bool pending = ctl.cmPending; if (pending && !name.isVisible()) { name.setText(ctl.cmPend.name, false); name.grabKeyboardFocus(); name.selectAll(); }
      name.setVisible(pending); keep.setVisible(pending); drop.setVisible(pending);
      resized(); inner.repaint();
    }
  }
  void paintInner(Graphics& g) {
    for (int i = 0; i < 3; i++) {
      auto* p = pads[i]; auto r = p->getBounds().toFloat(); bool on = p->pressed, over = p->isMouseOver();
      box(g, r, 8, on ? rgba(201, 168, 101, .16f) : inkBg(), on ? gilt : over ? giltLo : line2);
      padText(g, r, MOMENTS[i + 2].name, MOMENTS[i + 2].desc, nn(36 + i + 2), on);
    }
    if (!emptyBox.isEmpty()) { box(g, emptyBox, 8, Colours::transparentBlack, line2, 1, true); para(g, "Your own moments land here: press Record moment, play anything, then press it again.", emptyBox.reduced(10, 8), font(SERIF_ITAL, 13), dim, 16.9f); }
  }
  static void padText(Graphics& g, Rectangle<float> r, const String& n, const String& d, const String& k, bool on) {
    text(g, n, Rectangle<float>(r.getX() + 9, r.getY() + 6, r.getWidth() - 18 - 30, 18), font(SERIF_SEMI, 15), on ? live : bone);
    AttributedString a; a.append(d, font(SERIF_ITAL, 13), dim); a.setWordWrap(AttributedString::byWord); TextLayout tl; tl.createLayout(a, r.getWidth() - 18); tl.draw(g, Rectangle<float>(r.getX() + 9, r.getY() + 6 + 17.25f + 2, r.getWidth() - 18, 40));
    if (k.isNotEmpty()) text(g, k, Rectangle<float>(r.getRight() - 8 - 40, r.getY() + 7, 40, 14), font(MONO, 12), on ? live : giltTxt, Justification::centredRight);
  }
  struct Item : Component {
    Item(MomentsPanel& o, const String& id) : owner(o), id(id) {
      addAndMakeVisible(pad); addAndMakeVisible(more); pad.onClick = [this] { for (auto& c : owner.ctl.CMS) if (c.id == this->id) owner.ctl.cmToggle(c); };
      more.onClick = [this] { owner.ctl.cmOpen = owner.ctl.cmOpen == this->id ? String() : this->id; owner.ctl.version++; };
      addChildComponent(nameEd); addChildComponent(voice); addChildComponent(ex); addChildComponent(up); addChildComponent(del);
      nameEd.setFont(font(SERIF, 14)); nameEd.setInputRestrictions(40); nameEd.setIndents(8, 4);
      voice.addItem("Voices as played", 1); for (int i = 0; i < he::NS; i++) voice.addItem(U(SRC[i].n), i + 2);
      nameEd.onReturnKey = [this] { owner.ctl.cmRename(this->id, nameEd.getText()); }; nameEd.onFocusLost = [this] { owner.ctl.cmRename(this->id, nameEd.getText()); };
      nameEd.onEscapeKey = [this] { owner.ctl.cmOpen = {}; owner.ctl.version++; };
      voice.onChange = [this] { owner.ctl.cmSetVoice(this->id, voice.getSelectedId() - 2); };
      ex.onClick = [this] { owner.ctl.cmExport(this->id); }; up.onClick = [this] { owner.ctl.cmUp(this->id); };
      del.onClick = [this] { if (sure) owner.ctl.cmDelete(this->id); else { sure = true; del.setText("Sure?"); } };
      up.setTooltip("Move earlier (changes its F key)"); more.setTooltip("Rename, voice, export, delete");
    }
    void layout() {
      int W = getWidth(); auto* c = [&]() -> CustomMoment* { for (auto& x : owner.ctl.CMS) if (x.id == id) return &x; return nullptr; }(); if (!c) return;
      int ph = open ? getHeight() - 70 : getHeight(); pad.setBounds(0, 0, W, ph); more.setBounds(W - 4 - 22, 4, 22, 22);
      for (Component* x : std::initializer_list<Component*>{&nameEd, &voice, &ex, &up, &del}) x->setVisible(open);
      if (open) {
        if (!nameEd.hasKeyboardFocus(true)) nameEd.setText(c->name, false);
        voice.setSelectedId(c->voice + 2, dontSendNotification); up.enabled = owner.ctl.CMS.size() && owner.ctl.CMS[0].id != id;
        int y = ph + 6, x = 0; nameEd.setBounds(0, y, jmax(110, W - 160), 26); voice.setBounds(nameEd.getRight() + 4, y, W - nameEd.getRight() - 4, 26);
        y += 30; for (Pill* b : {&ex, &up, &del}) { int bw = (int)b->preferredWidth(); b->setBounds(x, y, bw, 26); x += bw + 4; }
      } else { sure = false; del.setText("Delete"); }
    }
    void paint(Graphics& g) override {
      auto r = pad.getBounds().toFloat(); bool on = pad.pressed, over = pad.isMouseOver();
      box(g, r, 8, on ? rgba(201, 168, 101, .16f) : inkBg(), on ? gilt : over ? giltLo : line2, 1, !on);
      text(g, pad.text, Rectangle<float>(r.getX() + 9, r.getY() + 6, r.getWidth() - 18 - 30, 18), font(SERIF_SEMI, 15), on ? live : bone);
      AttributedString a; a.append(pad.text2, font(SERIF_ITAL, 13), dim); a.setWordWrap(AttributedString::byWord); TextLayout tl; tl.createLayout(a, r.getWidth() - 18 - 26); tl.draw(g, Rectangle<float>(r.getX() + 9, r.getY() + 6 + 17.25f + 2, r.getWidth() - 18 - 26, 40));
      if (pad.progress > 0) { g.setColour(live); g.fillRect(Rectangle<float>(r.getX(), r.getBottom() - 3, r.getWidth() * jmin(1.f, pad.progress), 3)); }
    }
    void paintOverChildren(Graphics& g) override { auto r = more.getBounds().toFloat(); box(g, r, 11, rgba(14, 11, 10, .8f), line2); text(g, String::fromUTF8("\xe2\x80\xa6"), r.translated(0, -2), font(SERIF, 13), bone2, Justification::centred); }
    MomentsPanel& owner; String id; int num = 0; bool open = false, sure = false;
    Pill pad{"", Pill::PAD}, more{"", Pill::PAD}, ex{"Export", Pill::BTN_SM}, up{String::fromUTF8("\xe2\x86\x91"), Pill::BTN_SM}, del{"Delete", Pill::BTN_SM};
    TextEditor nameEd; ComboBox voice;
  };
  Item* item(const String& id) { for (auto* i : cmItems) if (i->id == id) return i; auto* it = cmItems.add(new Item(*this, id)); inner.addAndMakeVisible(it); return it; }
  Controller& ctl; Viewport view; OwnedArray<Pill> pads; OwnedArray<Item> cmItems; Rectangle<float> emptyBox; bool needScroll = false; int ver = -1;
  Pill rec{"", Pill::CAP}, imp{"Import", Pill::TB_SM}, keep{"Save", Pill::TB_SM}, drop{"Discard", Pill::TB_SM}; TextEditor name;
};

static const char* const PIN[he::NS][4] = {{"sustain", "slack", "drive", "level"}, {"crank", "buzz", "drive", "level"}, {"press", "speed", "drive", "level"},
  {"press", "judder", "drive", "level"}, {"hard", "decay", "drive", "level"}, {"decay", "tension", "drive", "level"},
  {"count", "agit", "drive", "level"}, {"density", "blur", "shimmer", "level"}, {"press", "grip", "drive", "level"}};

SideColumn::SideColumn(Controller& c) : ctl(c) {
  const char* subs[4] = {"Off-key to chaos", "Close to down the corridor", "Wood, steel, glass", "Sub rumble to whine"};
  int ids[4] = {he::P_MACRO_DREAD, he::P_MACRO_DISTANCE, he::P_MACRO_MATERIAL, he::P_MACRO_PITCH};
  for (int i = 0; i < 4; i++) addAndMakeVisible(macros.add(new Knob(c, ids[i], true, subs[i])));
  moments = std::make_unique<MomentsPanel>(c); addAndMakeVisible(*moments);
  select();
}
SideColumn::~SideColumn() = default;
void SideColumn::select() {
  int s = ctl.sel(); if (s == pinVoice) return; pinVoice = s; pins.clear();
  for (auto q : PIN[s]) { int k = Controller::indexOf(String(HE_S[s]) + "." + q); if (k >= 0) addAndMakeVisible(pins.add(new Knob(ctl, k))); }
  resized(); repaint();
}
void SideColumn::resized() {
  float W = (float)getWidth(); int kh = macros[0]->preferredHeight(118);
  rMac = Rectangle<float>(0, 0, W, 8 + 23 + 2 * kh + 2 + 8);
  float colW = (W - 24 - 4) / 2;
  for (int i = 0; i < 4; i++) { int col = i % 2, row = i / 2; float cx = 12 + col * (colW + 4) + colW / 2; macros[i]->setBounds((int)(cx - 59), (int)(8 + 23 + row * (kh + 2)), 118, kh); }
  int ph = pins.size() ? pins[0]->preferredHeight(64) : 72; float pinH = 8 + 23 + (float)ph + 8;
  rPin = Rectangle<float>(0, getHeight() - pinH, W, pinH);
  rMom = Rectangle<float>(0, rMac.getBottom() + 8, W, rPin.getY() - 8 - rMac.getBottom() - 8);
  moments->setBounds(rMom.reduced(12, 8).withTrimmedTop(23).toNearestInt());
  int n = pins.size(); float gap = n > 1 ? (W - 24 - n * 64.f) / (n - 1) : 0;
  for (int i = 0; i < n; i++) pins[i]->setBounds((int)(12 + i * (64 + gap)), (int)(rPin.getY() + 8 + 23), 64, ph);
}
void SideColumn::paint(Graphics& g) {
  drawSection(g, rMac, "Macros", String::fromUTF8("CC 20\xe2\x80\x93" "23"));
  drawSection(g, rMom, "Moments", "Yes & No are on the board");
  drawSection(g, rPin, String::fromUTF8("Pinned \xc2\xb7 ") + U(SRC[ctl.sel()].n), "this voice");
}
void SideColumn::refresh() { select(); for (auto* k : macros) k->refresh(); for (auto* k : pins) k->refresh(); moments->refresh(); }

/* ---------- the rail: drawers, octave, Hold, Freeze ---------- */
Rail::Rail(Controller& c) : ctl(c) {
  const char* names[4] = {"Voice", "Effects", "Looper", "Your sound in"};
  for (int i = 0; i < 4; i++) { tabs[i].text = names[i]; tabs[i].style = Pill::RT; addAndMakeVisible(tabs[i]); tabs[i].onClick = [this, i] { if (onTab) onTab(i); }; }
  for (auto* p : {&octDn, &octUp, &hold, &freeze}) addAndMakeVisible(p);
  octDn.onClick = [this] { ctl.setOct(ctl.octave() - 1); }; octUp.onClick = [this] { ctl.setOct(ctl.octave() + 1); };
  octDn.setTooltip("Octave down"); octUp.setTooltip("Octave up");
  hold.onClick = [this] { ctl.toggleHold(); }; freeze.onClick = [this] { ctl.toggleFreeze(); };
  freeze.setTooltip("Freeze Aura: pin the granular pad (F)");
}
void Rail::resized() {
  int x = 8, H = getHeight();
  float need = 8; for (auto& t : tabs) need += t.preferredWidth() + 6;
  float right = textWidth(font(MONO, 13), String::fromUTF8("Oct \xe2\x88\x92")) + 20 + 13 * 2.4f + 8 + 30 + 6 + hold.preferredWidth() + 6 + freeze.preferredWidth() + 8 + 12;
  bool tight = need + right > getWidth();
  for (auto& t : tabs) { String keep = t.text2; if (tight) t.text2 = {}; int w = (int)t.preferredWidth(); t.text2 = keep; t.setBounds(x, (H - 30) / 2, w, 30); t.compact = tight; x += w + 6; }
  int r = getWidth() - 8; int fw = (int)freeze.preferredWidth(); r -= fw; freeze.setBounds(r, (H - 30) / 2, fw, 30); r -= 6;
  int hw = (int)hold.preferredWidth(); r -= hw; hold.setBounds(r, (H - 30) / 2, hw, 30); r -= 6;
  auto mf = font(MONO, 13); float a = textWidth(mf, String::fromUTF8("Oct \xe2\x88\x92")) + 20, b = jmax(textWidth(font(MONO, 13), "+0"), 13 * 2.4f) + 8, c = textWidth(mf, "+") + 20;
  seg = Rectangle<float>((float)r - (a + b + c), (H - 30) / 2.f, a + b + c, 30);
  octDn.setBounds(seg.withWidth(a).toNearestInt()); octUp.setBounds(Rectangle<float>(seg.getRight() - c, seg.getY(), c, 30).toNearestInt());
}
void Rail::paint(Graphics& g) {
  box(g, getLocalBounds().toFloat(), 12, panelBg(), line);
  box(g, seg, 15, Colours::transparentBlack, line2);
  auto mf = font(MONO, 13);
  text(g, octDn.text, octDn.getBounds().toFloat(), mf, octDn.isMouseOver() ? live : bone2, Justification::centred);
  text(g, octUp.text, octUp.getBounds().toFloat(), mf, octUp.isMouseOver() ? live : bone2, Justification::centred);
  text(g, oct, Rectangle<float>((float)octDn.getRight(), seg.getY(), (float)octUp.getX() - octDn.getRight(), 30), font(MONO, 13), live, Justification::centred);
}
void Rail::refresh() {
  int s = ctl.sel(); String k(HE_S[s]);
  String o = (ctl.octave() > 0 ? "+" : "") + String(ctl.octave()); if (o != oct) { oct = o; repaint(); }
  hold.set(ctl.P(k + ".hold") > .5); hold.setTooltip("Hold " + U(SRC[s].n) + ": keep it sounding hands-free (H)");
  freeze.set(ctl.P(he::P_AURA_FREEZE) > .5);
  const auto& t = ctl.tm; int gh = 0; for (int i = 0; i < t.nLayers; i++) if (t.layers[i].ghost) gh++;
  String lt = t.looping ? "recording a layer" : t.nLayers ? String(t.nLayers) + " layer" + (t.nLayers > 1 ? "s" : "") + (gh ? String::fromUTF8(" \xc2\xb7 ") + String(gh) + " ghost" : String()) : "empty";
  String sums[4] = {U(SRC[s].n), "hall " + Controller::fmt(he::P_REV_DECAY, ctl.P(he::P_REV_DECAY)), lt, ctl.inputOn() ? (ctl.inputKind() == 1 ? "track" : "file") : "off"};
  bool re = false; for (int i = 0; i < 4; i++) { if (tabs[i].text2 != sums[i]) { tabs[i].text2 = sums[i]; re = true; } tabs[i].set(open == i); }
  if (re) resized();
}

/* ---------- the chain strip: the signal flow, live ---------- */
Chain::Chain(Controller& c) : ctl(c) {
  for (auto* p : {&v, &s, &spr, &harm, &hall, &body, &m}) addAndMakeVisible(p);
  v.onClick = [this] { if (onOpen) onOpen(0); }; s.onClick = [this] { if (onOpen) onOpen(0); };
  for (auto* p : {&spr, &harm, &hall, &body, &m}) p->onClick = [this] { if (onOpen) onOpen(1); };
  v.setTooltip("Voices that are not muted"); s.setTooltip("The selected voice's channel strip: Grit, Level, Pan, then Distance");
  body.setTooltip("Body and piezo: the shared wooden box");
}
void Chain::resized() {
  auto af = font(MONO, 13); float x = 4 + textWidth(font(FELL, 13, .12f), "Chain") + 4 + 5, H = (float)getHeight(), aw = textWidth(af, String::fromUTF8("\xe2\x86\x92")) + 10;
  arrows.clear();
  auto place = [&](Pill& p) { float w = p.preferredWidth(); p.setBounds((int)x, (int)((H - 26) / 2), (int)w, 26); x += w; };
  place(v); arrows.push_back({x + 5, H / 2}); x += aw; place(s); arrows.push_back({x + 5, H / 2}); x += aw;
  float g0 = x; x += 3; for (Pill* p : {&spr, &harm, &hall, &body}) { place(*p); x += 3; } grp = Rectangle<float>(g0, (H - 32) / 2, x - g0, 32); x += 2;
  arrows.push_back({x + 5, H / 2}); x += aw; place(m); outX = x + 5;
}
void Chain::paint(Graphics& g) {
  auto lf = font(FELL, 13, .12f); g.setColour(giltTxt); g.setFont(lf); g.drawSingleLineText("Chain", 4, (int)(getHeight() / 2 + 4.5f));
  box(g, grp, 8, Colours::transparentBlack, line2, 1, true);
  auto af = font(MONO, 13); g.setFont(af); g.setColour(giltTxt);
  for (auto a : arrows) g.drawSingleLineText(String::fromUTF8("\xe2\x86\x92"), (int)a.x, (int)(a.y + 4.5f));
  g.drawSingleLineText(String::fromUTF8("\xe2\x86\x92 out"), (int)outX, (int)(getHeight() / 2 + 4.5f));
}
void Chain::refresh() {
  int i = ctl.sel(); String k(HE_S[i]); int on = 0; for (int q = 0; q < he::NS; q++) if (ctl.P(String(HE_S[q]) + ".mute") <= .5) on++;
  auto F = [&](const String& id) { int kk = Controller::indexOf(id); return kk >= 0 ? Controller::fmt(kk, ctl.P(kk)) : String(); };
  bool re = false; auto setT = [&](Pill& p, const String& a, const String& b) { if (p.text != a || p.text2 != b) { p.text = a; p.text2 = b; re = true; p.repaint(); } };
  setT(v, "Voices", String(on) + " on");
  setT(s, String(ROMAN[i]) + String::fromUTF8(" \xc2\xb7"), "Grit|" + F(k + ".drive") + "|Level|" + F(k + ".level"));
  auto hot = [&](Pill& p, const String& send, const String& val) {
    int sk = Controller::indexOf(send); bool onS = send.isEmpty() || (sk >= 0 && ctl.P(sk) > 0);
    bool h = sk >= 0 && onS, o = sk >= 0 ? !onS : false; if (h != p.hot || o != p.off) { p.hot = h; p.off = o; p.repaint(); }
    if (p.text2 != val) { p.text2 = val; re = true; p.repaint(); }
  };
  hot(spr, Controller::indexOf(k + ".spr") >= 0 ? k + ".spr" : String(), F("spring.decay"));
  int hs = (int)std::floor(ctl.P(he::P_HARM_SHIFT) + .5); hot(harm, k + ".hsend", (ctl.P(he::P_HARM_SHIFT) > 0 ? "+" : "") + String(hs) + " st");
  hot(hall, k + ".rev", F("rev.decay")); hot(body, "body.amt", F("body.amt"));
  if (m.text2 != F("master.vol")) { m.text2 = F("master.vol"); re = true; m.repaint(); }
  spr.setTooltip(i == he::SPRING ? "Spring tank: this is the selected voice" : "Spring tank return (voice VI). Send from this voice: " + (Controller::indexOf(k + ".spr") >= 0 ? F(k + ".spr") : String("none")));
  harm.setTooltip("Harmonizer return. Send from this voice: " + F(k + ".hsend")); hall.setTooltip("Hall return. Send from this voice: " + F(k + ".rev"));
  if (re) { resized(); repaint(); }
}

/* ---------- popovers ---------- */
void Popover::paint(Graphics& g) {
  auto r = getLocalBounds().toFloat();
  for (int i = 0; i < 6; i++) { g.setColour(Colours::black.withAlpha(.12f)); g.drawRoundedRectangle(r.reduced(6 - i), 12, 1); }
  box(g, r.reduced(6), 12, Colour(0xff16110e), giltLo);
}
BrowsePop::BrowsePop(Controller& c) : ctl(c) {
  addAndMakeVisible(find); addAndMakeVisible(starred); addAndMakeVisible(view); addAndMakeVisible(save); addAndMakeVisible(load);
  starred.prefixIcon = 0x2605; find.setTextToShowWhenEmpty("Find a preset", dim); find.setFont(font(SERIF, 14)); find.setIndents(8, 4); find.addListener(this);
  find.onEscapeKey = [this] { if (onDone) onDone(); };
  view.setViewedComponent(&list, false); view.setScrollBarsShown(true, false); view.setScrollBarThickness(6);
  starred.onClick = [this] { onlyFav = !onlyFav; starred.set(onlyFav); rebuild(); };
  save.setTooltip("Save every setting as a preset file"); load.setTooltip("Load a preset or performance file");
  save.onClick = [this] { if (onDone) onDone(); ctl.savePresetFile(); }; load.onClick = [this] { if (onDone) onDone(); ctl.loadPresetFile(); };
  setSize(360 + 12, 300);
}
void BrowsePop::focus() { find.setText({}, false); onlyFav = false; starred.set(false); rebuild(); find.grabKeyboardFocus(); }
struct BrowseItem : Component {
  BrowseItem(Controller& c, int i, std::function<void()> done) : ctl(c), idx(i), done(done) { setRepaintsOnMouseActivity(true); }
  void paint(Graphics& g) override {
    auto r = getLocalBounds().toFloat(); String n = U(he::PRESETS[idx].name); bool cur = idx == ctl.presetIndex();
    if (cur) box(g, r, 6, pressBg(), Colours::transparentBlack);
    icon(g, 0x2605, Rectangle<float>(4, (r.getHeight() - 22) / 2, 22, 22), ctl.isFav(n) ? gilt : dim);
    auto f = font(SERIF_MED, 15); bool over = isMouseOver() && getMouseXYRelative().x > 30;
    text(g, n, Rectangle<float>(38, 0, r.getWidth() - 40, r.getHeight()), f, cur || over ? live : bone);
    int c = he::PRESETS[idx].n; String sm = cur ? (ctl.edited() ? "loaded, edited" : "loaded") : c ? String(c) + " settings" : "every knob at its default";
    text(g, sm, Rectangle<float>(38 + textWidth(f, n) + 8, 0, r.getWidth(), r.getHeight()), font(SERIF_ITAL, 13), dim);
  }
  void mouseUp(const MouseEvent& e) override {
    if (!getLocalBounds().contains(e.getPosition())) return;
    if (e.x < 30) { ctl.star(U(he::PRESETS[idx].name)); repaint(); }
    else { ctl.loadPreset(idx); if (done) done(); }
  }
  Controller& ctl; int idx; std::function<void()> done;
};
void BrowsePop::rebuild() {
  items.clear(); String q = find.getText().trim().toLowerCase(); int y = 0;
  for (int i = 0; i < he::NPRESET; i++) {
    String n = U(he::PRESETS[i].name);
    if ((q.isNotEmpty() && !n.toLowerCase().contains(q)) || (onlyFav && !ctl.isFav(n))) continue;
    auto* it = items.add(new BrowseItem(ctl, i, [this] { if (onDone) onDone(); })); list.addAndMakeVisible(it); it->setBounds(0, y, 336, 28); y += 28;
  }
  if (items.isEmpty()) {
    struct None : Component { String t; void paint(Graphics& g) override { text(g, t, getLocalBounds().toFloat().reduced(8, 0), font(SERIF_ITAL, 15), dim); } };
    auto* n = new None(); n->t = onlyFav ? "No starred presets yet. Press the star beside a name." : "No preset matches."; items.add(n); list.addAndMakeVisible(n); n->setBounds(0, 0, 336, 34); y = 34;
  }
  list.setSize(336, y); int lh = jmin(360, y);
  setSize(372, 6 + 10 + 26 + 8 + lh + 8 + 1 + 8 + 26 + 10 + 6); resized(); repaint();
}
void BrowsePop::resized() {
  int x = 16, y = 16, W = getWidth() - 32; int sw = (int)starred.preferredWidth();
  find.setBounds(x, y, W - sw - 6, 26); starred.setBounds(x + W - sw, y, sw, 26); y += 26 + 8;
  int lh = jmin(360, list.getHeight()); view.setBounds(x, y, W, lh); y += lh + 8; footY = (float)y; y += 9;
  int s1 = (int)save.preferredWidth(); save.setBounds(x, y, s1, 26); load.setBounds(x + s1 + 6, y, (int)load.preferredWidth(), 26);
}
void BrowsePop::paintOverChildren(Graphics& g) { g.setColour(line); g.fillRect(16.f, footY, getWidth() - 32.f, 1.f); }

MenuPop::MenuPop(Controller& c) : ctl(c) {
  for (auto* p : {&retro, &share, &keys, &guide}) addAndMakeVisible(p);
  retro.kbd = "Shift+R"; retro.setTooltip("The last minute of the plugin's output as a WAV file");
  share.setTooltip("Copy a short link that rebuilds these settings in the web app");
  retro.onClick = [this] { if (onDone) onDone(); ctl.retroSave(); }; share.onClick = [this] { if (onDone) onDone(); ctl.shareLink(); };
  keys.setTooltip("Play the plugin from the computer keyboard (Space looper, letters notes, digits voices). Off by default so the host keeps its shortcuts. Saved with the project.");
  keys.onClick = [this] { if (onKeys) onKeys(); };
  guide.onClick = [this] { if (onDone) onDone(); if (onGuide) onGuide(); };
  setSize(280 + 12, 6 + 10 + 4 * 32 + 4 + 8 + 34 + 10 + 6);
}
void MenuPop::showKeys(bool on) { keys.setText(on ? "Computer keyboard: on" : "Computer keyboard: off"); keys.set(on); }
void MenuPop::resized() { int y = 16; for (auto* p : {&retro, &share, &keys, &guide}) { p->setBounds(16, y, getWidth() - 32, 30); y += 32; } }
void MenuPop::paintOverChildren(Graphics& g) {
  float y = 16 + 4 * 32 + 4; g.setColour(line); g.fillRect(16.f, y, getWidth() - 32.f, 1.f);
  para(g, ctl.status(), Rectangle<float>(26, y + 6, getWidth() - 52.f, 40), font(MONO, 12), dim, 16);
}

/* ---------- the guide (the about dialog) ---------- */
Guide::Guide() {
  addAndMakeVisible(view); view.setViewedComponent(&body, false); view.setScrollBarsShown(true, false); view.setScrollBarThickness(6);
  addAndMakeVisible(close); close.onClick = [this] { if (onClose) onClose(); };
}
static const char* GUIDE[] = {
  "#Horror Engine \xc2\xb7 S\xc3\xa9" "ance",
  "The plugin layout: the Surface is a spirit board. Same engine, same sound, same keys as the web app. Horror Engine by Garyck Arntzen (x.com/_mintydoge).",
  "=The board",
  "-Pick a voice from the row of tokens (or keys 1\xe2\x80\x93" "9), then drag on the board. The glass planchette follows your hand and the letter under it lights.",
  "-Across is x, up is y; the corners name what they do for this voice. For pitched voices the brass rule along the top marks semitones (0 is the centre).",
  "-Pressure: a pen uses its own; with a mouse hold Shift for hard, Alt for soft, or roll the wheel over the board.",
  "-Yes fires the Stinger, No the Riser, Goodbye is Silence.",
  "=Around it",
  "-Right column: the four Macros, the Moments (your own too: Record moment, play, Record moment again) and the Pinned knobs of the selected voice.",
  "-Bottom: Voice, Effects, Looper and Your sound in open a drawer over the board. The strip under them is the signal flow; click a part of it to open its drawer.",
  "-Knobs: drag up and down (Shift for fine), wheel, double-click to reset, right-click for MIDI learn. Or press MIDI learn at the top, then click a knob.",
  "-Presets: \xe2\x80\xb9 \xe2\x80\xba step through them, Browse lists and stars them. Undo and redo cover knobs, presets and the looper.",
  "-Looper, Sync to host (on by default): while the host plays at a known tempo, the first layer rounds to whole bars, layers start on the next bar line and stay locked to the host's bars through tempo changes, jumps and loops. With the host stopped, or the box off, loops run free as in the web app.",
  "-Your sound in: Track input runs the audio coming into the plugin on its track (a mic, a line, another track) through the machine; File plays an audio file through it.",
  "=Keys",
  "Off by default, so the host keeps Space, letters and digits. Turn them on in the menu: Computer keyboard (saved with the project); they work while the plugin window has keyboard focus.",
  "|1\xe2\x80\x93" "9|Select a voice",
  "|Z\xe2\x80\xa6/, Q W E T\xe2\x80\xa6P|Chromatic notes, two rows an octave apart",
  "|[ ]|Octave down, up",
  "|Space|Start or stop a loop layer",
  "|G, Backspace|Ghost, remove the newest layer",
  "|Ctrl+Z, Ctrl+Y|Undo, redo",
  "|F1\xe2\x80\x93" "F5|Riser, Stinger, Drone bed, Heartbeat, In the walls",
  "|F6\xe2\x80\x93" "F12|Your own moments, in order",
  "|H F Esc|Hold, Freeze Aura, Silence",
  "|Shift+R|Save the last minute",
  "=MIDI",
  "Notes play the selected voice; CC 20\xe2\x80\x93" "23 move Dread, Distance, Material and Pitch. Moments: notes on channel 16 from C2 (36) fire Riser, Stinger, Drone bed, Heartbeat, In the walls, then your own; CC 24\xe2\x80\x93" "43 fire them too. Learned CCs win over the fixed ones on their channel. Every knob is also a host parameter, so the DAW can automate it.",
  "=Notices",
  "Horror Engine \xc2\xa9 2026 Garyck Arntzen. This plugin is free software under the GNU Affero General Public License v3 (see LICENSE); it is built with JUCE (AGPLv3) and the CLAP and VST3 SDKs. The bowed-string friction curve follows the bow-table idea published in STK by Perry R. Cook and Gary P. Scavone. Fonts: IM FELL English SC (Igino Marini), Crimson Pro (The Crimson Pro Project Authors) and IBM Plex Mono (IBM), all under the SIL Open Font License 1.1 (see OFL.txt). VST is a registered trademark of Steinberg Media Technologies GmbH.",
  nullptr};
int Guide::Body::layout(int w) {
  float y = 0;
  for (int i = 0; GUIDE[i]; i++) {
    String s = U(GUIDE[i]);
    if (s.startsWithChar('#')) y += 26 + 6 + 4;
    else if (s.startsWithChar('=')) y += 16 + 17 + 6 + 4;
    else if (s.startsWithChar('-')) y += paraHeight(s.substring(1), w - 18.f, font(SERIF, 15), 21.75f) + 2;
    else if (s.startsWithChar('|')) { auto p = StringArray::fromTokens(s.substring(1), "|", ""); y += jmax(21.75f, paraHeight(p[1], w - 170.f, font(SERIF, 15), 21.75f)) + 4; }
    else y += paraHeight(s, (float)w, font(SERIF, 15), 21.75f) + 8;
  }
  return (int)y + 10;
}
void Guide::Body::paint(Graphics& g) {
  float y = 0, w = (float)getWidth();
  for (int i = 0; GUIDE[i]; i++) {
    String s = U(GUIDE[i]);
    if (s.startsWithChar('#')) { text(g, s.substring(1), Rectangle<float>(0, y, w, 30), font(FELL, 26), live); y += 26 + 6 + 4; }
    else if (s.startsWithChar('=')) { y += 16; text(g, s.substring(1), Rectangle<float>(0, y, w, 20), font(FELL, 17, .04f), gilt); y += 17 + 6 + 4; }
    else if (s.startsWithChar('-')) { g.setColour(bone2); g.fillEllipse(4, y + 9, 4, 4); y += para(g, s.substring(1), Rectangle<float>(18, y, w - 18, 400), font(SERIF, 15), bone2, 21.75f) + 2; }
    else if (s.startsWithChar('|')) { auto p = StringArray::fromTokens(s.substring(1), "|", ""); text(g, p[0], Rectangle<float>(0, y, 160, 21.75f), font(MONO, 13), live); y += jmax(21.75f, para(g, p[1], Rectangle<float>(170, y, w - 170, 400), font(SERIF, 15), bone2, 21.75f)) + 4; }
    else y += para(g, s, Rectangle<float>(0, y, w, 400), font(SERIF, 15), bone2, 21.75f) + 8;
  }
}
void Guide::resized() {
  int w = jmin(700, getWidth() - 32), h = (int)(getHeight() * .86f); card = Rectangle<int>((getWidth() - w) / 2, (getHeight() - h) / 2, w, h);
  int bh = body.layout(w - 52); body.setSize(w - 52 - 8, bh);
  view.setBounds(card.getX() + 26, card.getY() + 22, w - 52, h - 22 - 60); close.setBounds(card.getX() + 26, card.getBottom() - 22 - 30, (int)close.preferredWidth(), 30);
}
void Guide::paint(Graphics& g) { g.fillAll(Colours::black.withAlpha(.7f)); box(g, card.toFloat(), 14, Colour(0xff16110e), giltLo); }
void Guide::mouseUp(const MouseEvent& e) { if (!card.contains(e.getPosition()) && onClose) onClose(); }

/* ---------- toast ---------- */
void Toast::timerCallback() {
  if (ctl.toastSeq != seq) { seq = ctl.toastSeq; t = ctl.toastText; place(); setVisible(true); repaint(); }
  if (isVisible() && Time::getMillisecondCounter() - ctl.toastAt > 3600) setVisible(false);
}
void Toast::place() {
  auto* p = getParentComponent(); if (!p) return;
  float maxW = jmin(640.f, p->getWidth() - 340.f); auto f = font(SERIF_SEMI, 14);
  float tw = jmin(maxW - 32, textWidth(f, t)); float th = paraHeight(t, tw + 1, f, 18);
  int w = (int)std::ceil(tw + 32), h = (int)std::ceil(th + 16);
  int cx = p->getWidth() / 2 - 150; setBounds(cx - w / 2, p->getHeight() - 110 - h, w, h);
}
void Toast::paint(Graphics& g) {
  auto r = getLocalBounds().toFloat(); g.setColour(Colours::black.withAlpha(.3f)); g.fillRoundedRectangle(r.translated(0, 3), 8);
  g.setColour(Colour(0xffe2cd97)); g.fillRoundedRectangle(r, 8);
  AttributedString a; a.append(t, font(SERIF_SEMI, 14), Colour(0xff1a120c)); a.setJustification(Justification::centredTop); a.setWordWrap(AttributedString::byWord);
  TextLayout tl; tl.createLayout(a, r.getWidth() - 32); tl.draw(g, r.reduced(16, 8));
}
