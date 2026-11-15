// Horror Engine · Séance: colours, fonts and drawing helpers. Horror Engine by Garyck Arntzen. GNU AGPLv3.
#include "Look.h"
#include "BinaryData.h"

using namespace juce;

namespace look {

static Typeface::Ptr load(const void* d, size_t n) { return Typeface::createSystemTypefaceFor(d, n); }
struct Faces {
  Typeface::Ptr t[6];
  Faces() {
    t[FELL] = load(BinaryData::IMFellEnglishSCRegular_ttf, BinaryData::IMFellEnglishSCRegular_ttfSize);
    t[SERIF] = load(BinaryData::CrimsonProRegular_ttf, BinaryData::CrimsonProRegular_ttfSize);
    t[SERIF_MED] = load(BinaryData::CrimsonProMedium_ttf, BinaryData::CrimsonProMedium_ttfSize);
    t[SERIF_SEMI] = load(BinaryData::CrimsonProSemiBold_ttf, BinaryData::CrimsonProSemiBold_ttfSize);
    t[SERIF_ITAL] = load(BinaryData::CrimsonProItalic_ttf, BinaryData::CrimsonProItalic_ttfSize);
    t[MONO] = load(BinaryData::IBMPlexMonoRegular_ttf, BinaryData::IBMPlexMonoRegular_ttfSize);
  }
};
static Faces& faces() { static Faces f; return f; }

// CSS font-size is the em size: JUCE's point height
Font font(Face f, float px, float tracking) {
  auto o = FontOptions().withTypeface(faces().t[f]).withPointHeight(px);
  if (tracking != 0) o = o.withKerningFactor(tracking);
  return Font(o);
}
float textWidth(const Font& f, const String& s) { return GlyphArrangement::getStringWidth(f, s); }

void box(Graphics& g, Rectangle<float> r, float radius, Colour fill, Colour border, float bw, bool dashed) {
  if (!fill.isTransparent()) { g.setColour(fill); g.fillRoundedRectangle(r, radius); }
  if (!border.isTransparent()) {
    g.setColour(border);
    auto rr = r.reduced(bw * .5f);
    if (!dashed) g.drawRoundedRectangle(rr, jmax(0.f, radius - bw * .5f), bw);
    else { Path p; p.addRoundedRectangle(rr, jmax(0.f, radius - bw * .5f)); Path d; float dash[] = {4.f, 3.f}; PathStrokeType(bw).createDashedStroke(d, p, dash, 2); g.fillPath(d); }
  }
}
void text(Graphics& g, const String& s, Rectangle<float> r, const Font& f, Colour c, Justification j) {
  g.setColour(c); g.setFont(f); g.drawText(s, r, j, true);
}
bool icon(Graphics& g, juce_wchar c, Rectangle<float> r, Colour col) {
  float cx = r.getCentreX(), cy = r.getCentreY(), s = jmin(r.getWidth(), r.getHeight());
  g.setColour(col);
  if (c == 0x2605) {   // star
    Path p; float R = s * .36f, r2 = R * .42f;
    for (int i = 0; i < 10; i++) { float a = MathConstants<float>::pi * (i / 5.f) - MathConstants<float>::halfPi, rr = i % 2 ? r2 : R; if (i) p.lineTo(cx + rr * std::cos(a), cy + rr * std::sin(a)); else p.startNewSubPath(cx + rr * std::cos(a), cy + rr * std::sin(a)); }
    p.closeSubPath(); g.fillPath(p); return true;
  }
  if (c == 0x21b6 || c == 0x21b7) {   // undo, redo: a half circle over the top with the arrow head pointing down
    bool redo = c == 0x21b7; float R = s * .19f, ay = cy + R * .35f; Path p; float hp = MathConstants<float>::halfPi;
    p.addCentredArc(cx, ay, R, R, 0, redo ? -hp : hp, redo ? hp : -hp, true);
    g.strokePath(p, PathStrokeType(1.4f, PathStrokeType::curved, PathStrokeType::rounded));
    float ex = redo ? cx + R : cx - R; Path h; h.addTriangle(ex - 3.2f, ay - .5f, ex + 3.2f, ay - .5f, ex, ay + 4.f); g.fillPath(h); return true;
  }
  if (c == 0x2261) { for (int i = -1; i <= 1; i++) g.fillRect(cx - s * .17f, cy + i * s * .14f - .6f, s * .34f, 1.3f); return true; }   // menu
  if (c == 0x2304) { Path p; p.startNewSubPath(cx - s * .14f, cy - s * .06f); p.lineTo(cx, cy + s * .08f); p.lineTo(cx + s * .14f, cy - s * .06f); g.strokePath(p, PathStrokeType(1.4f)); return true; }   // close
  if (c == 0x2191) { Path p; p.startNewSubPath(cx, cy + s * .22f); p.lineTo(cx, cy - s * .2f); g.strokePath(p, PathStrokeType(1.3f)); Path h; h.addTriangle(cx - s * .13f, cy - s * .05f, cx + s * .13f, cy - s * .05f, cx, cy - s * .26f); g.fillPath(h); return true; }   // up
  if (c == 0x2713) { Path p; p.startNewSubPath(cx - s * .2f, cy); p.lineTo(cx - s * .05f, cy + s * .16f); p.lineTo(cx + s * .22f, cy - s * .18f); g.strokePath(p, PathStrokeType(1.5f)); return true; }   // tick
  return false;
}
void label(Graphics& g, const String& s, Rectangle<float> r, const Font& f, Colour c) {
  juce_wchar c0 = s[0]; bool dot = c0 == 0x25cf, sq = c0 == 0x25a0;
  if (!dot && !sq) { text(g, s, r, f, c, Justification::centred); return; }
  String rest = s.substring(1).trimStart(); float tw = textWidth(f, rest), sz = f.getHeight() * .42f, gap = 5, x = r.getCentreX() - (sz + gap + tw) / 2, cy = r.getCentreY();
  g.setColour(c); if (dot) g.fillEllipse(x, cy - sz / 2, sz, sz); else g.fillRect(x, cy - sz / 2, sz, sz);
  text(g, rest, Rectangle<float>(x + sz + gap, r.getY(), tw + 2, r.getHeight()), f, c);
}
float paraHeight(const String& s, float width, const Font& f, float lh) {
  if (s.isEmpty() || width <= 0) return 0;
  AttributedString a; a.append(s, f, Colours::white); a.setLineSpacing(0); a.setWordWrap(AttributedString::byWord);
  TextLayout tl; tl.createLayout(a, width);
  return tl.getNumLines() * lh;
}
float para(Graphics& g, const String& s, Rectangle<float> r, const Font& f, Colour c, float lh, bool draw) {
  if (s.isEmpty()) return 0;
  AttributedString a; a.append(s, f, c); a.setWordWrap(AttributedString::byWord);
  TextLayout tl; tl.createLayout(a, r.getWidth());
  float y = r.getY();
  if (draw) {
    g.setColour(c);
    for (int i = 0; i < tl.getNumLines(); i++) {
      auto& L = tl.getLine(i); float base = y + (lh - (L.ascent + L.descent)) * .5f + L.ascent;
      for (auto* run : L.runs) {
        String t = s.substring(run->stringRange.getStart(), run->stringRange.getEnd());
        if (run->glyphs.size() == 0) continue; g.setFont(f); g.drawSingleLineText(t, (int)std::round(r.getX() + L.lineOrigin.x + run->glyphs.getReference(0).anchor.x), (int)std::round(base));
      }
      y += lh;
    }
  }
  return tl.getNumLines() * lh;
}

LAF::LAF() {
  setColour(PopupMenu::backgroundColourId, Colour(0xff16110e)); setColour(PopupMenu::textColourId, bone);
  setColour(PopupMenu::highlightedBackgroundColourId, rgba(201, 168, 101, .12f)); setColour(PopupMenu::highlightedTextColourId, live);
  setColour(PopupMenu::headerTextColourId, gilt);
  setColour(ComboBox::backgroundColourId, rgba(0, 0, 0, .35f)); setColour(ComboBox::textColourId, bone); setColour(ComboBox::outlineColourId, line2); setColour(ComboBox::arrowColourId, bone2);
  setColour(TextEditor::backgroundColourId, rgba(0, 0, 0, .35f)); setColour(TextEditor::textColourId, bone); setColour(TextEditor::outlineColourId, giltLo);
  setColour(TextEditor::focusedOutlineColourId, live); setColour(TextEditor::highlightColourId, rgba(201, 168, 101, .35f)); setColour(CaretComponent::caretColourId, live);
  setColour(ScrollBar::thumbColourId, line2);
  setColour(TooltipWindow::backgroundColourId, Colour(0xff16110e)); setColour(TooltipWindow::textColourId, bone2); setColour(TooltipWindow::outlineColourId, giltLo);
}
void LAF::drawPopupMenuBackground(Graphics& g, int w, int h) { box(g, Rectangle<float>(0, 0, (float)w, (float)h), 10, Colour(0xff16110e), giltLo); }
void LAF::drawPopupMenuItem(Graphics& g, const Rectangle<int>& area, bool sep, bool active, bool hi, bool ticked, bool, const String& t, const String& sc, const Drawable*, const Colour*) {
  if (sep) { g.setColour(line); g.fillRect(area.reduced(6, 0).withHeight(1).withY(area.getCentreY())); return; }
  auto r = area.toFloat().reduced(4, 1);
  if (hi && active) box(g, r, 6, rgba(201, 168, 101, .12f), Colours::transparentBlack);
  g.setColour(active ? (hi ? live : bone) : bone.withAlpha(.45f)); g.setFont(font(SERIF_MED, 14));
  if (ticked) icon(g, 0x2713, r.withWidth(16).translated(4, 0), live);
  g.drawText(t, r.reduced(6, 0).withTrimmedLeft(ticked ? 18.f : 0.f), Justification::centredLeft, true);
  if (sc.isNotEmpty()) { g.setColour(giltTxt); g.setFont(font(MONO, 12)); g.drawText(sc, r.reduced(6, 0), Justification::centredRight); }
}
void LAF::drawPopupMenuSectionHeader(Graphics& g, const Rectangle<int>& area, const String& name) {
  g.setColour(gilt); g.setFont(font(FELL, 15)); g.drawText(name, area.reduced(10, 0), Justification::centredLeft, true);
  g.setColour(line); g.fillRect(area.getX() + 6, area.getBottom() - 1, area.getWidth() - 12, 1);
}
Font LAF::getPopupMenuFont() { return font(SERIF_MED, 14); }
void LAF::drawComboBox(Graphics& g, int w, int h, bool, int, int, int, int, ComboBox& c) {
  box(g, Rectangle<float>(0, 0, (float)w, (float)h), 6, rgba(0, 0, 0, .35f), c.hasKeyboardFocus(true) ? live : line2);
  Path p; float cx = w - 12.f, cy = h * .5f; p.addTriangle(cx - 4, cy - 2, cx + 4, cy - 2, cx, cy + 3); g.setColour(bone2); g.fillPath(p);
}
Font LAF::getComboBoxFont(ComboBox&) { return font(SERIF, 14); }
void LAF::positionComboBoxText(ComboBox& c, Label& l) { l.setBounds(4, 0, c.getWidth() - 24, c.getHeight()); l.setFont(getComboBoxFont(c)); }
void LAF::fillTextEditorBackground(Graphics& g, int w, int h, TextEditor&) { box(g, Rectangle<float>(0, 0, (float)w, (float)h), 6, rgba(0, 0, 0, .35f), Colours::transparentBlack); }
void LAF::drawTextEditorOutline(Graphics& g, int w, int h, TextEditor& t) { box(g, Rectangle<float>(0, 0, (float)w, (float)h), 6, Colours::transparentBlack, t.hasKeyboardFocus(true) ? live : giltLo, t.hasKeyboardFocus(true) ? 2.f : 1.f); }
void LAF::drawScrollbar(Graphics& g, ScrollBar&, int x, int y, int w, int h, bool vertical, int ts, int tsz, bool, bool) {
  Rectangle<float> r = vertical ? Rectangle<float>((float)x + 2, (float)ts, (float)w - 4, (float)tsz) : Rectangle<float>((float)ts, (float)y + 2, (float)tsz, (float)h - 4);
  g.setColour(line2); g.fillRoundedRectangle(r, 3);
}
void LAF::drawTickBox(Graphics& g, Component&, float x, float y, float w, float h, bool ticked, bool, bool, bool) {
  auto r = Rectangle<float>(x, y, w, h).reduced(1);
  box(g, r, 3, ticked ? gilt : rgba(0, 0, 0, .35f), ticked ? gilt : line2);
  if (ticked) { Path p; p.startNewSubPath(r.getX() + r.getWidth() * .22f, r.getCentreY()); p.lineTo(r.getX() + r.getWidth() * .42f, r.getBottom() - r.getHeight() * .25f); p.lineTo(r.getRight() - r.getWidth() * .2f, r.getY() + r.getHeight() * .25f); g.setColour(Colour(0xff1a120c)); g.strokePath(p, PathStrokeType(2.f)); }
}
void LAF::drawToggleButton(Graphics& g, ToggleButton& b, bool over, bool down) {
  float s = 14; drawTickBox(g, b, 0, (b.getHeight() - s) * .5f, s, s, b.getToggleState(), b.isEnabled(), over, down);
  g.setColour(bone2); g.setFont(font(SERIF_MED, 14)); g.drawText(b.getButtonText(), Rectangle<float>(s + 6, 0, b.getWidth() - s - 6.f, (float)b.getHeight()), Justification::centredLeft);
}
void LAF::drawTooltip(Graphics& g, const String& t, int w, int h) {
  box(g, Rectangle<float>(0, 0, (float)w, (float)h), 6, Colour(0xff16110e), giltLo);
  AttributedString a; a.append(t, font(SERIF, 14), bone2); a.setWordWrap(AttributedString::byWord);
  TextLayout tl; tl.createLayout(a, (float)w - 16); tl.draw(g, Rectangle<float>(8, 6, (float)w - 16, (float)h - 12));
}
Rectangle<int> LAF::getTooltipBounds(const String& t, Point<int> pos, Rectangle<int> parent) {
  AttributedString a; a.append(t, font(SERIF, 14), bone2); a.setWordWrap(AttributedString::byWord);
  TextLayout tl; tl.createLayout(a, 320); int w = (int)std::ceil(jmin(320.f, tl.getWidth())) + 18, h = (int)std::ceil(tl.getHeight()) + 14;
  return Rectangle<int>(pos.x > parent.getCentreX() ? pos.x - w - 6 : pos.x + 12, pos.y + 18, w, h).constrainedWithin(parent);
}

}  // namespace look
