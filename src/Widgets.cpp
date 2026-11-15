// Horror Engine · Séance: knobs, pills and selectors. Horror Engine by Garyck Arntzen. GNU AGPLv3.
#include "Widgets.h"

using namespace juce;
using namespace look;

/* ---------- MIDI learn on any control ---------- */
void Learnable::contextMenu(Controller& c, int k, Component* target) {
  PopupMenu m; const auto& d = he::PARAMS[k]; String key = c.mmKeyOf(k);
  m.addSectionHeader(String(CharPointer_UTF8(d.label)) + (key.isNotEmpty() ? String::fromUTF8(" \xc2\xb7 ") + Controller::mmDesc(key) : String()));
  if (c.learning() == k) m.addItem("Cancel MIDI learn", [&c] { c.learnStop(); });
  else m.addItem(String::fromUTF8("MIDI learn\xe2\x80\xa6"), [&c, k] { c.learnStart(k); });
  if (key.isNotEmpty()) m.addItem("Forget " + Controller::mmDesc(key), [&c, k] { c.mmForget(k); });
  m.addItem("Reset to default (" + (d.nEnum ? String(CharPointer_UTF8(d.enums[(int)d.def])) : d.sw ? String(d.def > .5 ? "On" : "Off") : Controller::fmt(k, d.def)) + ")", c.P(k) != d.def, false, [&c, k] { c.setParam(k, he::PARAMS[k].def); });
  if (int n = c.mmCount()) m.addItem("Forget all MIDI learn (" + String(n) + ")", [&c] { c.mmForgetAll(); });
  m.showMenuAsync(PopupMenu::Options().withTargetComponent(target).withMousePosition());
}
bool Learnable::pickOrMenu(const MouseEvent& e, Component* self) {
  if (e.mods.isPopupMenu()) { if (ctl.hGrpOpen()) ctl.hEnd(); contextMenu(ctl, k, self); return true; }
  if (ctl.picking) { ctl.pick(false); ctl.learnStart(k); return true; }
  return false;
}
// the ember dot of a learned control, and the blinking outline while it waits for a CC
void Learnable::drawLearn(Graphics& g, Rectangle<float> r, Point<float> dot) {
  if (ctl.mmKeyOf(k).isNotEmpty()) { g.setColour(ember.withAlpha(.35f)); g.fillEllipse(dot.x - 5, dot.y - 5, 10, 10); g.setColour(ember); g.fillEllipse(dot.x - 3.5f, dot.y - 3.5f, 7, 7); }
  if (ctl.learning() == k && (Time::getMillisecondCounter() / 500) % 2 == 0) { Path p; p.addRectangle(r.expanded(3)); Path d; float dash[] = {3, 3}; PathStrokeType(1).createDashedStroke(d, p, dash, 2); g.setColour(live); g.fillPath(d); }
  if (ctl.picking) { Path p; p.addRectangle(r.expanded(2)); Path d; float dash[] = {3, 3}; PathStrokeType(1).createDashedStroke(d, p, dash, 2); g.setColour(rgba(233, 211, 154, .45f)); g.fillPath(d); }
}

/* ---------- knobs (ui.js knob(): drag up and down, Shift for fine, wheel, double-click resets) ---------- */
Knob::Knob(Controller& c, int k, bool big, const String& sub) : Learnable(c, k), big(big), sub(sub) {
  setWantsKeyboardFocus(true); setMouseClickGrabsKeyboardFocus(false); setMouseCursor(MouseCursor::UpDownResizeCursor);
  const auto& d = he::PARAMS[k];
  setTooltip(String(CharPointer_UTF8(d.label)) + ": " + Controller::fmt(k, d.min) + " to " + Controller::fmt(k, d.max) + ", default " + Controller::fmt(k, d.def) + ". Double-click to reset. Right-click for MIDI learn.");
}
int Knob::preferredHeight(int w) const {
  String lab(CharPointer_UTF8(he::PARAMS[k].label));
  if (big) { float h = 6 + 52 + 4 + 2 + 19 + 16 + 1; if (sub.isNotEmpty()) h += jmax(30.f, paraHeight(sub, 112, font(SERIF_ITAL, 13), 15)); return (int)h; }
  int lines = textWidth(font(SERIF_SEMI, 14), lab) > w && lab.containsChar(' ') ? 2 : 1;
  return 4 + 34 + 3 + lines * 16 + 15 + 2;
}
void Knob::paint(Graphics& g) {
  const auto& d = he::PARAMS[k]; double v = ctl.P(k), n = jlimit(0.0, 1.0, Controller::norm(k, v));
  float W = (float)getWidth(), ds = big ? 52.f : 34.f, top = big ? 6.f : 4.f;
  auto dial = Rectangle<float>((W - ds) * .5f, top, ds, ds);
  // ring: track and value (conic from 225 deg, 270 deg of travel), 3 px wide 5 px outside the dial (4 and 6 for big)
  float out = big ? 6.f : 5.f, th = big ? 3.5f : 2.5f; auto ringR = dial.expanded(out - th * .5f);
  float a0 = MathConstants<float>::pi * 1.25f;
  Path track; track.addCentredArc(ringR.getCentreX(), ringR.getCentreY(), ringR.getWidth() * .5f, ringR.getHeight() * .5f, 0, -MathConstants<float>::pi * .75f, MathConstants<float>::pi * .75f, true);
  g.setColour(Colour(0xff33281f)); g.strokePath(track, PathStrokeType(th));
  if (n > 0) { Path val; val.addCentredArc(ringR.getCentreX(), ringR.getCentreY(), ringR.getWidth() * .5f, ringR.getHeight() * .5f, 0, -MathConstants<float>::pi * .75f, -MathConstants<float>::pi * .75f + (float)n * MathConstants<float>::pi * 1.5f, true); g.setColour(gilt); g.strokePath(val, PathStrokeType(th)); }
  (void)a0;
  // the dial: radial gradient, 1 px edge and a soft drop shadow
  g.setColour(Colours::black.withAlpha(.6f)); g.fillEllipse(dial.translated(0, 2).expanded(1));
  ColourGradient cg(Colour(0xff2e241d), dial.getX() + ds * .45f, dial.getY() + ds * .35f, Colour(0xff120d0b), dial.getX() + ds * .45f + ds * .72f * .5f, dial.getY() + ds * .35f, true);
  g.setGradientFill(cg); g.fillEllipse(dial); g.setColour(Colour(0xff5a4838)); g.drawEllipse(dial.expanded(.5f), 1.f);
  // the pointer
  float ang = -MathConstants<float>::pi * .75f + (float)n * MathConstants<float>::pi * 1.5f, cx = dial.getCentreX(), cy = dial.getCentreY(), r = ds * .5f;
  Point<float> p0(cx + std::sin(ang) * r * .0f, cy - std::cos(ang) * r * .0f), p1(cx + std::sin(ang) * r * .72f, cy - std::cos(ang) * r * .72f);
  g.setColour(live); g.drawLine(Line<float>(p0, p1), big ? 3.f : 2.f);
  if (hasKeyboardFocus(false)) { g.setColour(live); g.drawEllipse(dial.expanded(2), 2.f); }
  // label, value, note
  float y = dial.getBottom() + (big ? 4.f : 3.f);
  String lab(CharPointer_UTF8(d.label));
  if (big) { text(g, lab, Rectangle<float>(0, y, W, 19), font(FELL, 18, .02f), live, Justification::centred); y += 19; }
  else {
    auto f = font(SERIF_SEMI, 14);
    if (textWidth(f, lab) > W && !lab.containsChar(' ')) { g.setColour(bone); g.setFont(f); g.drawFittedText(lab, Rectangle<int>(0, (int)y, (int)W, 16), Justification::centred, 1, .7f); y += 15.4f; }
    else if (textWidth(f, lab) > W) { float h = para(g, lab, Rectangle<float>(0, y, W, 40), f, bone, 15.4f, false); AttributedString a; a.append(lab, f, bone); a.setJustification(Justification::centredTop); a.setWordWrap(AttributedString::byWord); a.setLineSpacing(0); TextLayout tl; tl.createLayout(a, W); tl.draw(g, Rectangle<float>(0, y, W, h + 2)); y += h; }
    else { text(g, lab, Rectangle<float>(0, y, W, 16), f, bone, Justification::centred); y += 15.4f; }
  }
  text(g, Controller::fmt(k, v), Rectangle<float>(0, y, W, big ? 16.f : 15.f), font(MONO, big ? 13.f : 12.f), live, Justification::centred); y += big ? 16.f : 14.4f;
  if (sub.isNotEmpty()) { AttributedString a; a.append(sub, font(SERIF_ITAL, 13), dim); a.setJustification(Justification::centredTop); a.setWordWrap(AttributedString::byWord); TextLayout tl; tl.createLayout(a, jmin(W, 112.f)); tl.draw(g, Rectangle<float>((W - jmin(W, 112.f)) * .5f, y, jmin(W, 112.f), 40)); }
  drawLearn(g, Rectangle<float>(0, 0, W, (float)getHeight()), {W - 8 - 3.5f, 2 + 3.5f});
}
void Knob::refresh() {
  double v = ctl.P(k); String lk = ctl.mmKeyOf(k); bool lo = ctl.learning() == k, po = ctl.picking;
  if (v != shown || lk != learnKey || lo || lo != learnOn || po != pickOn) { shown = v; learnKey = lk; learnOn = lo; pickOn = po; repaint(); }
}
void Knob::mouseDown(const MouseEvent& e) {
  if (pickOrMenu(e, this)) return;
  sy = e.position.y; sn = Controller::norm(k, ctl.P(k)); if (ctl.keysOn) grabKeyboardFocus(); dragging = true;   // arrow keys only with the computer keyboard on
  ctl.hBegin(String(CharPointer_UTF8(he::PARAMS[k].label))); ctl.beginGesture(k);
}
void Knob::mouseDrag(const MouseEvent& e) {
  if (!dragging) return;
  double n = sn + (sy - e.position.y) / (e.mods.isShiftDown() ? 900.0 : 170.0);
  ctl.setParam(k, Controller::denorm(k, n)); refresh();
}
void Knob::mouseUp(const MouseEvent&) { if (!dragging) return; dragging = false; ctl.endGesture(k); ctl.hEnd(); }
void Knob::mouseDoubleClick(const MouseEvent& e) { if (e.mods.isPopupMenu() || ctl.picking) return; ctl.setParam(k, he::PARAMS[k].def); refresh(); }
void Knob::mouseWheelMove(const MouseEvent& e, const MouseWheelDetails& w) {
  if (w.deltaY == 0) return;
  ctl.setParam(k, Controller::denorm(k, Controller::norm(k, ctl.P(k)) + (w.deltaY > 0 ? 1 : -1) * (e.mods.isShiftDown() ? .005 : .025))); refresh();
}
bool Knob::keyPressed(const KeyPress& key) {
  double st = key.getModifiers().isShiftDown() ? .005 : .025, n = Controller::norm(k, ctl.P(k));
  int c = key.getKeyCode();
  if (c == KeyPress::upKey || c == KeyPress::rightKey) n += st; else if (c == KeyPress::downKey || c == KeyPress::leftKey) n -= st;
  else if (c == KeyPress::homeKey) n = 0; else if (c == KeyPress::endKey) n = 1;
  else if (c == KeyPress::deleteKey) { ctl.setParam(k, he::PARAMS[k].def); refresh(); return true; }
  else return false;
  ctl.setParam(k, Controller::denorm(k, n)); refresh(); return true;
}

/* ---------- pills ---------- */
float Pill::preferredWidth() const {
  switch (style) {
    case TB: return textWidth(font(SERIF_MED, 14), text) + 28;
    case TB_SM: return textWidth(font(SERIF_MED, 14), text) + 22 + (prefixIcon ? 18 : 0);
    case BTN_SM: return textWidth(font(SERIF_MED, 14), text) + 26;
    case IB: return 30;
    case RT: return textWidth(font(SERIF_SEMI, 15), text) + (text2.isNotEmpty() ? 6 + textWidth(font(SERIF, 14), text2) : 0) + 28;
    case CH: {
      float w = textWidth(font(SERIF_SEMI, 13), text) + 18;
      auto parts = juce::StringArray::fromTokens(text2, "|", "");
      for (int i = 0; i < parts.size(); i++) w += 5 + (parts.size() > 1 && i % 2 == 0 ? textWidth(font(SERIF, 13), parts[i]) : textWidth(font(MONO, 12), parts[i]));
      if (text.isEmpty()) w -= 5;
      return w;
    }
    case CAP: case MI: case PLAQUE: case PAD: return 100;
  }
  return 60;
}
void Pill::paint(Graphics& g) {
  auto r = getLocalBounds().toFloat(); bool over = isMouseOver(true) && enabled, down = isMouseButtonDown() && enabled;
  float alpha = enabled ? 1.f : .62f;
  auto border = [&](Colour normal) { return pressed ? gilt : (over ? giltLo : normal); };
  switch (style) {
    case TB: case TB_SM: case BTN_SM: {
      box(g, r, r.getHeight() * .5f, pressed ? pressBg() : Colours::transparentBlack, border(line2).withMultipliedAlpha(alpha), 1, dashed);
      auto col = (pressed ? live : over ? bone : bone2).withMultipliedAlpha(alpha);
      if (prefixIcon) { float tw = textWidth(font(SERIF_MED, 14), text), x = r.getCentreX() - (14 + 4 + tw) / 2; look::icon(g, prefixIcon, Rectangle<float>(x, r.getCentreY() - 8, 14, 16), col); look::text(g, text, Rectangle<float>(x + 18, r.getY(), tw + 2, r.getHeight()), font(SERIF_MED, 14), col); }
      else if (text.length() != 1 || !look::icon(g, text[0], r, col)) look::label(g, text, r, font(SERIF_MED, 14), col);
      break;
    }
    case IB: {
      box(g, r.reduced(.5f), r.getHeight() * .5f, Colours::transparentBlack, (over ? giltLo : line2).withMultipliedAlpha(alpha));
      if (text.length() != 1 || !look::icon(g, text[0], r, (over ? bone : bone2).withMultipliedAlpha(alpha))) look::text(g, text, r.translated(0, -1), font(SERIF, 16), (over ? bone : bone2).withMultipliedAlpha(alpha), Justification::centred);
      break;
    }
    case RT: {
      if (pressed) box(g, r, 15, rgba(201, 168, 101, .16f), gilt); else if (over) box(g, r, 15, rgba(255, 255, 255, .04f), Colours::transparentBlack);
      auto fb = font(SERIF_SEMI, 15), fs = font(SERIF, 14); float wb = textWidth(fb, text), base = r.getCentreY() + 5;
      g.setColour(pressed ? live : bone); g.setFont(fb); g.drawSingleLineText(text, (int)(r.getX() + 14), (int)base);
      if (!compact) { g.setColour(pressed ? live : dim); g.setFont(fs); } else g.setColour(Colours::transparentBlack); g.drawSingleLineText(compact ? String() : text2, (int)(r.getX() + 14 + wb + 6), (int)base);
      break;
    }
    case CH: {
      box(g, r, 6, panelBg(), pressed ? gilt : (hot || over) ? giltLo : line); if (pressed) box(g, r, 6, rgba(201, 168, 101, .12f), Colours::transparentBlack);
      float a = off ? .62f : 1.f; auto fb = font(SERIF_SEMI, 13), fm = font(MONO, 12); float wb = textWidth(fb, text), base = r.getCentreY() + 4.5f;
      g.setColour(bone.withMultipliedAlpha(a)); g.setFont(fb); g.drawSingleLineText(text, (int)(r.getX() + 9), (int)base);
      auto parts = StringArray::fromTokens(text2, "|", ""); float x = r.getX() + 9 + wb + (text.isNotEmpty() ? 5 : 0);
      for (int i = 0; i < parts.size(); i++) {
        bool lab = parts.size() > 1 && i % 2 == 0; auto f = lab ? font(SERIF, 13) : fm;
        g.setColour((lab ? dim : live).withMultipliedAlpha(a)); g.setFont(f); g.drawSingleLineText(parts[i], (int)x, (int)base); x += textWidth(f, parts[i]) + 5;
      }
      break;
    }
    case CAP: {
      box(g, r, 8, pressed ? rgba(224, 118, 74, .16f) : Colours::transparentBlack, Colour(0xff8a4a32), 1, !pressed);
      look::label(g, text, r, font(SERIF_MED, 14), pressed ? Colour(0xffffd2bd) : Colour(0xffefb399));
      break;
    }
    case MI: {
      if (over) box(g, r, 6, rgba(201, 168, 101, .12f), Colours::transparentBlack);
      look::text(g, text, r.reduced(10, 0), font(SERIF_MED, 15), over ? live : bone);
      if (kbd.isNotEmpty()) look::text(g, kbd, r.reduced(10, 0), font(MONO, 12), giltTxt, Justification::centredRight);
      break;
    }
    case PLAQUE: case PAD: break;   // drawn by their owners
  }
  if (down && style != CH) { g.setColour(Colours::white.withAlpha(.03f)); g.fillRoundedRectangle(r, 8); }
}
void Pill::mouseDown(const MouseEvent& e) { if (e.mods.isPopupMenu() && onRightClick) onRightClick(e); }
void Pill::mouseUp(const MouseEvent& e) {
  if (!enabled || e.mods.isPopupMenu()) return;
  if (getLocalBounds().contains(e.getPosition()) && onClick) onClick();
}

/* ---------- switch parameters as pills ---------- */
ParamToggle::ParamToggle(Controller& c, int k, const String& label) : Pill(label, BTN_SM), Learnable(c, k) {
  onClick = [this] { ctl.setParam(this->k, ctl.P(this->k) > .5 ? 0 : 1); refresh(); };
}
void ParamToggle::mouseDown(const MouseEvent& e) { if (pickOrMenu(e, this)) { pickedHere = true; return; } pickedHere = false; }
void ParamToggle::mouseUp(const MouseEvent& e) { if (pickedHere) { pickedHere = false; return; } Pill::mouseUp(e); }
void ParamToggle::paint(Graphics& g) { Pill::paint(g); drawLearn(g, getLocalBounds().toFloat(), {getWidth() - 8 - 3.5f, 2 + 3.5f}); }
void ParamToggle::refresh() { bool p = ctl.P(k) > .5; if (p != pressed) { pressed = p; } repaint(); }

/* ---------- choices (ui.js segment()) ---------- */
Segment::Segment(Controller& c, int k) : Learnable(c, k) {
  const auto& d = he::PARAMS[k]; labW = textWidth(font(SERIF_SEMI, 14), String(CharPointer_UTF8(d.label)));
  for (int i = 0; i < d.nEnum; i++) {
    auto* p = pills.add(new Pill(String(CharPointer_UTF8(d.enums[i])), Pill::BTN_SM)); addAndMakeVisible(p);
    p->onClick = [this, i] { if (swallow) { swallow = false; return; } ctl.setParam(this->k, i); refresh(); };
    p->onRightClick = [this](const MouseEvent&) { contextMenu(ctl, this->k, this); };
    p->addMouseListener(this, false);
  }
  refresh();
}
int Segment::preferredWidth() const { float w = labW + 4 + 4; for (auto* p : pills) w += p->preferredWidth() + 4; return (int)std::ceil(w); }
void Segment::resized() { float x = labW + 8; for (auto* p : pills) { float w = p->preferredWidth(); p->setBounds((int)x, (getHeight() - 26) / 2, (int)w, 26); x += w + 4; } }
void Segment::paint(Graphics& g) {
  text(g, String(CharPointer_UTF8(he::PARAMS[k].label)), Rectangle<float>(0, 0, labW + 4, (float)getHeight()), font(SERIF_SEMI, 14), bone2);
  drawLearn(g, getLocalBounds().toFloat(), {getWidth() - 8 - 3.5f, 2 + 3.5f});
}
void Segment::mouseDown(const MouseEvent& e) { if (e.eventComponent != this && !e.mods.isPopupMenu() && ctl.picking) { swallow = true; ctl.pick(false); ctl.learnStart(k); } else if (e.eventComponent == this) pickOrMenu(e, this); }
void Segment::mouseUp(const MouseEvent&) {}
void Segment::refresh() { int v = (int)ctl.P(k); if (v != cur) { cur = v; for (int i = 0; i < pills.size(); i++) pills[i]->set(i == v); } repaint(); }
