// Horror Engine · Séance: colours, fonts and drawing helpers (src/seance/style.css in C++).
// Horror Engine by Garyck Arntzen (https://x.com/_mintydoge). Plugin released under the GNU AGPLv3.
#pragma once
#include <juce_gui_extra/juce_gui_extra.h>

namespace look {
using juce::Colour;
// :root in style.css
inline const Colour ground{0xff0e0b0a}, wood{0xff17110e}, wood2{0xff1f1713}, line{0xff3a2e26}, line2{0xff54443a};
inline const Colour bone{0xffece1c8}, bone2{0xffcbbd9f}, dim{0xffa8998a}, gilt{0xffc9a865}, giltLo{0xff8c7444}, giltTxt{0xffb9a06c}, ember{0xffe0764a}, live{0xffe9d39a};
inline Colour rgba(int r, int g, int b, float a) { return Colour((juce::uint8)r, (juce::uint8)g, (juce::uint8)b, a); }
inline Colour panelBg() { return rgba(23, 17, 14, .75f); }        // .side section, .rail
inline Colour pressBg() { return rgba(201, 168, 101, .14f); }     // [aria-pressed=true]
inline Colour inkBg() { return rgba(14, 11, 10, .6f); }

enum Face { FELL, SERIF, SERIF_MED, SERIF_SEMI, SERIF_ITAL, MONO };
juce::Font font(Face f, float px, float tracking = 0);
float textWidth(const juce::Font& f, const juce::String& s);

// a pill or rounded rectangle with an optional fill and border
void box(juce::Graphics& g, juce::Rectangle<float> r, float radius, Colour fill, Colour border, float bw = 1.f, bool dashed = false);
// text with ellipsis on one line
void text(juce::Graphics& g, const juce::String& s, juce::Rectangle<float> r, const juce::Font& f, Colour c, juce::Justification j = juce::Justification::centredLeft);
// symbols drawn as shapes, so they look the same whatever fonts the system has: \u2605 \u21b6 \u21b7 \u2261 \u2304 \u2191 \u2713
bool icon(juce::Graphics& g, juce::juce_wchar c, juce::Rectangle<float> r, Colour col);
// a centred label that may start with a record dot or a stop square (drawn as shapes)
void label(juce::Graphics& g, const juce::String& s, juce::Rectangle<float> r, const juce::Font& f, Colour c);
// a word-wrapped paragraph; returns its height
float para(juce::Graphics& g, const juce::String& s, juce::Rectangle<float> r, const juce::Font& f, Colour c, float lineHeight, bool draw = true);
float paraHeight(const juce::String& s, float width, const juce::Font& f, float lineHeight);

class LAF : public juce::LookAndFeel_V4 {
 public:
  LAF();
  void drawPopupMenuBackground(juce::Graphics&, int w, int h) override;
  void drawPopupMenuItem(juce::Graphics&, const juce::Rectangle<int>& area, bool isSeparator, bool isActive, bool isHighlighted, bool isTicked, bool hasSubMenu,
                         const juce::String& text, const juce::String& shortcutKeyText, const juce::Drawable* icon, const juce::Colour* textColour) override;
  void drawPopupMenuSectionHeader(juce::Graphics&, const juce::Rectangle<int>& area, const juce::String& sectionName) override;
  juce::Font getPopupMenuFont() override;
  void drawComboBox(juce::Graphics&, int w, int h, bool down, int bx, int by, int bw, int bh, juce::ComboBox&) override;
  juce::Font getComboBoxFont(juce::ComboBox&) override;
  void positionComboBoxText(juce::ComboBox&, juce::Label&) override;
  void fillTextEditorBackground(juce::Graphics&, int w, int h, juce::TextEditor&) override;
  void drawTextEditorOutline(juce::Graphics&, int w, int h, juce::TextEditor&) override;
  void drawScrollbar(juce::Graphics&, juce::ScrollBar&, int x, int y, int w, int h, bool vertical, int thumbStart, int thumbSize, bool over, bool down) override;
  int getDefaultScrollbarWidth() override { return 8; }
  void drawTickBox(juce::Graphics&, juce::Component&, float x, float y, float w, float h, bool ticked, bool enabled, bool over, bool down) override;
  void drawToggleButton(juce::Graphics&, juce::ToggleButton&, bool over, bool down) override;
  void drawTooltip(juce::Graphics&, const juce::String& text, int w, int h) override;
  juce::Rectangle<int> getTooltipBounds(const juce::String& tipText, juce::Point<int> screenPos, juce::Rectangle<int> parentArea) override;
};
}  // namespace look
