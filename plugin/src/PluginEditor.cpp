// Horror Engine · Séance: the plugin window. Horror Engine by Garyck Arntzen (https://x.com/_mintydoge). GNU AGPLv3.
#include "PluginEditor.h"

using namespace juce;
using namespace look;

static bool seanceWantGL() {
  auto env = SystemStats::getEnvironmentVariable("HE_SEANCE_OPENGL", {});
  if (env == "0" || env.equalsIgnoreCase("off") || env.equalsIgnoreCase("false") || env.equalsIgnoreCase("software")) return false;
  if (env == "1" || env.equalsIgnoreCase("on") || env.equalsIgnoreCase("true") || env.equalsIgnoreCase("force")) return true;
  PropertiesFile::Options o;
  o.applicationName = "HorrorEngine";
  o.filenameSuffix = "ini";
  o.folderName = "HorrorEngine";
  o.osxLibrarySubFolder = "Application Support";
  PropertiesFile pf(o);
  if (pf.containsKey("opengl")) return pf.getBoolValue("opengl", true);
  return true;   // try OpenGL; fall back to software if the context never attaches
}

void HorrorEditor::attachGL() {
  if (glTried) return;
  glTried = true;
  if (!seanceWantGL()) return;
  gl_ = std::make_unique<OpenGLContext>();
  gl_->setComponentPaintingEnabled(true);
  gl_->setContinuousRepainting(false);
  gl_->setMultisamplingEnabled(false);
  gl_->attachTo(*this);
}

void HorrorEditor::detachGL() {
  if (gl_) { gl_->detach(); gl_.reset(); }
  glOk = false;
}


HorrorEditor::HorrorEditor(HorrorProcessor& p)
    : AudioProcessorEditor(p), proc(p), ctl(p.controller()), top(ctl), tokens(ctl), board(p, ctl), side(ctl), rail(ctl), chain(ctl),
      dVoice(ctl), dFx(ctl), dLoop(ctl), dIn(ctl), browse(ctl), menu(ctl), toast(ctl) {
  setLookAndFeel(&laf);
  drawers[0] = &dVoice; drawers[1] = &dFx; drawers[2] = &dLoop; drawers[3] = &dIn;
  for (Component* c : std::initializer_list<Component*>{&top, &board, &tokens, &side, &rail, &chain}) addAndMakeVisible(c);
  tokens.setInterceptsMouseClicks(true, false);
  for (auto* d : drawers) { addChildComponent(d); d->onClose = [this] { drawer(open, 0); }; }
  addChildComponent(browse); addChildComponent(menu); addChildComponent(guide); addChildComponent(toast);
  top.onBrowse = [this] { pop(popOpen == 1 ? 0 : 1); }; top.onMenu = [this] { pop(popOpen == 2 ? 0 : 2); };
  browse.onDone = [this] { pop(0); }; menu.onDone = [this] { pop(0); };
  menu.onGuide = [this] { guide.setVisible(true); guide.setBounds(getLocalBounds()); guide.toFront(true); };
  guide.onClose = [this] { guide.setVisible(false); };
  rail.onTab = [this](int i) { drawer(i); };
  chain.onOpen = [this](int i) { drawer(i, 1); };
  menu.onKeys = [this] { ctl.keysOn = !ctl.keysOn; syncKeys(); ctl.toast(ctl.keysOn ? "Computer keyboard on: the plugin takes Space, letters and digits while its window has focus." : "Computer keyboard off: keys go to the host."); };
  syncKeys(); addMouseListener(this, true);
  setResizable(true, true); setResizeLimits(1100, 680, 2560, 1600);
  setSize(1280, 760);
  startTimerHz(30);
  attachGL();
}
HorrorEditor::~HorrorEditor() { removeMouseListener(this); detachGL(); setLookAndFeel(nullptr); }
void HorrorEditor::parentHierarchyChanged() { takeKeys(); if (gl_ && isShowing()) glOk = gl_->isAttached(); }
void HorrorEditor::visibilityChanged() { if (gl_ && isShowing()) glOk = gl_->isAttached(); }
// the editor only asks for keyboard focus while computer-keyboard playing is on; otherwise keys go to the host
void HorrorEditor::takeKeys() { if (ctl.keysOn && isShowing()) grabKeyboardFocus(); }
void HorrorEditor::syncKeys() {
  keysShown = ctl.keysOn; setWantsKeyboardFocus(keysShown); menu.showKeys(keysShown);
  if (keysShown) takeKeys();
  else { for (auto& k : keysDown) ctl.noteOff(k.tag); keysDown.clear(); if (hasKeyboardFocus(true)) giveAwayKeyboardFocus(); }
}

void HorrorEditor::paint(Graphics& g) {
  ColourGradient bg(Colour(0xff1a1310), getWidth() * .4f, getHeight() * .45f, ground, getWidth() * .4f + jmax(getWidth(), getHeight()) * .7f * .9f, getHeight() * .45f, true);
  g.setGradientFill(bg); g.fillAll();
}

// the grid of style.css: tokens / board / rail / chain on the left, the side column on the right
void HorrorEditor::resized() {
  int W = getWidth(), H = getHeight();
  top.setBounds(0, 0, W, 50);
  grid = Rectangle<int>(0, 50, W, H - 50).reduced(8);
  int sideW = W >= 1600 ? 300 : 284, r1 = H >= 900 ? 72 : 64, r3 = H >= 900 ? 42 : 40, r4 = 32;
  int lw = grid.getWidth() - 8 - sideW;
  side.setBounds(grid.getRight() - sideW, grid.getY(), sideW, grid.getHeight());
  tokens.setBounds(grid.getX(), grid.getY(), lw, r1 + 8);
  int boardY = grid.getY() + r1 + 8, chainY = grid.getBottom() - r4, railY = chainY - 8 - r3;
  board.setBounds(grid.getX(), boardY, lw, railY - 8 - boardY);
  rail.setBounds(grid.getX(), railY, lw, r3); chain.setBounds(grid.getX(), chainY, lw, r4);
  placeDrawer(); placePop(); toast.place();
  if (guide.isVisible()) guide.setBounds(getLocalBounds());
}
void HorrorEditor::placeDrawer() {
  if (open < 0) return;
  auto* d = drawers[open]; int W = getWidth(), H = getHeight();
  int sideW = W >= 1600 ? 316 : 300, left = 8, right = W - sideW, bottom = grid.getBottom() + 8 - 96;
  int maxH = H >= 900 ? 440 : jmax(200, (H - 50) - 96 - 64 - 8 - 8 - 96);
  int h = jmin(maxH, d->preferredHeight(right - left));
  d->setBounds(left, bottom - h, right - left, h);
}
void HorrorEditor::drawer(int i, int force) {
  bool want = force == 1 ? true : force == 0 ? false : open != i;
  if (open >= 0) drawers[open]->setVisible(false);
  open = want && i >= 0 ? i : -1; rail.open = open;
  if (open >= 0) { drawers[open]->refresh(); placeDrawer(); drawers[open]->setVisible(true); drawers[open]->toFront(false); toast.toFront(false); }
  rail.refresh(); takeKeys();
}
void HorrorEditor::pop(int which) {
  popOpen = which; browse.setVisible(which == 1); menu.setVisible(which == 2);
  top.browse.set(which == 1); top.menu.set(which == 2);
  if (which == 1) { browse.focus(); }
  placePop();
  if (which == 1) browse.toFront(true); else if (which == 2) menu.toFront(true); else takeKeys();
}
void HorrorEditor::placePop() {
  if (popOpen == 1) { auto a = top.browse.getBounds(); int w = browse.getWidth(), x = jlimit(0, getWidth() - w, a.getCentreX() - w / 2); browse.setTopLeftPosition(x, a.getBottom()); }
  if (popOpen == 2) { auto a = top.menu.getBounds(); int w = menu.getWidth(); menu.setTopLeftPosition(jmax(0, a.getRight() - w + 6), a.getBottom()); }
}
// a click outside an open popover closes it
void HorrorEditor::mouseDown(const MouseEvent& e) {
  if (!popOpen) return;
  Component* c = e.eventComponent; Component* p = popOpen == 1 ? (Component*)&browse : (Component*)&menu; Component* a = popOpen == 1 ? (Component*)&top.browse : (Component*)&top.menu;
  for (Component* x = c; x; x = x->getParentComponent()) if (x == p || x == a || (popOpen == 1 && x == &top.title)) return;
  if (dynamic_cast<PopupMenu*>(c)) return;
  pop(0);
}

void HorrorEditor::timerCallback() {
  top.refresh(); tokens.refresh(); board.refresh(); side.refresh(); rail.refresh(); chain.refresh();
  if (open >= 0) {
    drawers[open]->refresh();
    if (ctl.version != lastVersion) placeDrawer();
  }
  if (ctl.version != lastVersion) { lastVersion = ctl.version; if (popOpen == 1) browse.rebuild(); placePop(); }
  if (ctl.picking || ctl.learning() >= 0) repaint();
  if (ctl.keysOn != keysShown) syncKeys();   // a project load can change it
}

/* ---------- keys (ui.js): voices, notes, octave, looper, moments, Hold, Freeze, Silence, undo ---------- */
static const char* ROW1 = "zxcvbnm,./";
static const char* ROW2 = "qwetyuiop";
bool HorrorEditor::keyPressed(const KeyPress& key) {
  if (guide.isVisible()) { if (key == KeyPress::escapeKey) { guide.setVisible(false); return true; } return false; }
  int code = key.getKeyCode(); auto mods = key.getModifiers(); juce_wchar ch = CharacterFunctions::toLowerCase(key.getTextCharacter());
  if (!ctl.keysOn) {   // keys off: only Esc, to close what is open; everything else goes back to the host
    if (code != KeyPress::escapeKey) return false;
    if (popOpen) { pop(0); return true; }
    if (ctl.picking) { ctl.pick(false); ctl.toast("MIDI learn cancelled."); return true; }
    if (ctl.learning() >= 0) { ctl.learnStop(); ctl.toast("MIDI learn cancelled."); return true; }
    return false;
  }
  if (code == KeyPress::escapeKey) {
    if (popOpen) { pop(0); return true; }
    if (ctl.picking) { ctl.pick(false); ctl.toast("MIDI learn cancelled."); return true; }
    if (ctl.learning() >= 0) { ctl.learnStop(); ctl.toast("MIDI learn cancelled."); return true; }
    ctl.panic(); return true;
  }
  if (mods.isCommandDown() && !mods.isAltDown()) {
    if (code == 'Z' && !mods.isShiftDown()) { ctl.undo(); return true; }
    if (code == 'Y' || (code == 'Z' && mods.isShiftDown())) { ctl.redo(); return true; }
    return false;
  }
  if ((ch == 'r' || code == 'R') && mods.isShiftDown() && !mods.isAltDown()) { ctl.retroSave(); return true; }
  if (code == KeyPress::spaceKey) { ctl.loopToggle(); return true; }
  for (int f = 1; f <= 12; f++) if (code == KeyPress::F1Key + (f - 1) && !mods.isShiftDown() && !mods.isAltDown()) { ctl.momentN(f - 1); return true; }
  if (ch >= '1' && ch <= '9') { ctl.select(ch - '1'); return true; }
  const char* p1 = std::strchr(ROW1, (int)ch); const char* p2 = std::strchr(ROW2, (int)ch);
  if (ch && (p1 || p2)) {
    for (auto& k : keysDown) if (k.code == code) return true;   // auto-repeat
    int semi = p1 ? (int)(p1 - ROW1) : 12 + (int)(p2 - ROW2), tag = 2000 + (int)ch;
    keysDown.push_back({code, tag}); ctl.noteOn(tag, ctl.noteHz(semi), mods.isShiftDown() ? 1 : mods.isAltDown() ? .35 : .75); return true;
  }
  if (ch == '[') { ctl.setOct(ctl.octave() - 1); ctl.toast("Octave " + String(ctl.octave())); return true; }
  if (ch == ']') { ctl.setOct(ctl.octave() + 1); ctl.toast("Octave +" + String(ctl.octave())); return true; }
  if (ch == 'h') { ctl.toggleHold(); return true; }
  if (ch == 'f') { ctl.toggleFreeze(); return true; }
  if (ch == 'g' && ctl.tm.nLayers) { auto L = ctl.tm.layers[ctl.tm.nLayers - 1]; ctl.loopCmd(LA_GHOST, L.id, L.ghost ? 0 : 1); ctl.toast(L.ghost ? "Ghost off: layer plays as recorded" : "Ghost on: the newest layer improvises from its own strokes"); return true; }
  if (code == KeyPress::backspaceKey && ctl.tm.nLayers) { ctl.loopCmd(LA_DEL, ctl.tm.layers[ctl.tm.nLayers - 1].id); return true; }
  return false;
}
bool HorrorEditor::keyStateChanged(bool) {
  for (size_t i = 0; i < keysDown.size();) { if (!KeyPress::isKeyCurrentlyDown(keysDown[i].code)) { ctl.noteOff(keysDown[i].tag); keysDown.erase(keysDown.begin() + (long)i); } else i++; }
  return false;
}
