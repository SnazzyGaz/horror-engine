// Horror Engine · Séance: the spirit board (the playing surface), a port of HK.art in seance.js and the pad in ui.js.
// Horror Engine by Garyck Arntzen (https://x.com/_mintydoge). Plugin released under the GNU AGPLv3.
#pragma once
#include "Widgets.h"

// Optional paint profiler, used by tools/snap.cpp --bench. Off by default (zero cost when he_paint::on is false).
namespace he_paint {
enum Slot { Bg = 0, Dread, Candle, Scope, Ruler, Trail, Letters, Junk, Planchette, Inset, Over, Plaque, Total, NSlots };
extern bool on;
extern double acc[NSlots];
extern int frames;
void reset();
struct ScopeT {
  int id; double t0;
  explicit ScopeT(int i) : id(i), t0(on ? juce::Time::getMillisecondCounterHiRes() : 0) {}
  ~ScopeT() { if (on) acc[id] += juce::Time::getMillisecondCounterHiRes() - t0; }
};
}


class HorrorProcessor;

// Yes, No and Goodbye
class Plaque : public juce::Component, public juce::SettableTooltipClient {
 public:
  Plaque(const juce::String& word, const juce::String& sub, bool bye) : word(word), sub(sub), bye(bye) { setRepaintsOnMouseActivity(true); }
  juce::String word, sub; bool bye; bool pressed = false; float progress = -1;
  float dread = 0, dreadGlow = 0;   // vis and glow*flick; 0 leaves the plaque unchanged
  std::function<void()> onClick;
  void paint(juce::Graphics&) override;
  void mouseUp(const juce::MouseEvent& e) override { if (getLocalBounds().contains(e.getPosition()) && !e.mods.isPopupMenu() && onClick) onClick(); }
  juce::Rectangle<int> preferredSize() const;
};

struct BoardRuler { int lo, hi; double r; int kind; bool q; };

class Board : public juce::Component, private juce::Timer {
 public:
  Board(HorrorProcessor& p, Controller& c);
  ~Board() override;
  void paint(juce::Graphics&) override;
  void paintOverChildren(juce::Graphics&) override;
  void resized() override;
  void visibilityChanged() override;
  void parentHierarchyChanged() override;
  void mouseDown(const juce::MouseEvent&) override;
  void mouseDrag(const juce::MouseEvent&) override;
  void mouseUp(const juce::MouseEvent&) override;
  void mouseMove(const juce::MouseEvent&) override;
  void mouseExit(const juce::MouseEvent&) override;
  void mouseWheelMove(const juce::MouseEvent&, const juce::MouseWheelDetails&) override;
  void refresh();
  void testDrag(float x, float y, bool d) { curX = x; curY = y; curP = .6f; down = d; for (int i = 0; i < 40; i++) trail.push_back({x - .3f + i * .0075f, y + .05f * std::sin(i * .3f), juce::Time::getMillisecondCounterHiRes() - (40 - i) * 20}); }
  void testSet(float x, float y, bool d, float pr = .6f) { curX = x; curY = y; curP = pr; down = d; hover = !d; if (!d) { hoverX = x; hoverY = y; } }
  void testClearTrail() { trail.clear(); }
  Plaque yes, no, bye;
 private:
  void timerCallback() override;
  void tickUi();
  void hookVBlank();
  void paintBg(int W, int H, float scale);
  void layoutLetters(float w, float h);
  void ensureCaches(float w, float h, float scale);
  void buildLetterGlyphs(float scale);
  void buildDreadLayer(float w, float h, float scale, float vis, float dark, float hole);
  void buildInsetLayer(float w, float h, float scale, float vis);
  void buildFrameLayer(float w, float h, float scale);
  float pressure(const juce::MouseEvent& e) const;
  void point(const juce::MouseEvent& e);
  bool ruler(struct BoardRuler& R) const;
  juce::Rectangle<int> planchetteDirty(float px, float py, float vis) const;
  HorrorProcessor& proc; Controller& ctl;
  juce::Image bg; float bgScale = 0;
  struct Letter {
    juce::juce_wchar ch; float x, y, r; int row;
    juce::Path path;              // rotated, centred on (0,0)
    juce::Image glow, glowLit;    // pre-baked ember (and stronger) sprites
    float glowOx = 0, glowOy = 0, glowW = 0, glowH = 0;
  };
  std::vector<Letter> L; float lw = 0, lh = 0, fs = 20, sp = 1, glyphScale = 0;
  struct Pt { float x, y; double t; };
  std::vector<Pt> trail;
  float curX = .5f, curY = .5f, curP = .6f, hoverX = .5f, hoverY = .45f, restX = .5f, restY = .45f; bool hover = false, down = false;
  double lastSend = 0;
  juce::String reading;
  // static / slowly-changing paint caches (rebuilt on size, scale, or Dread)
  juce::Image candleCream, candleEmber, ringHaloCream, ringHaloEmber, planchetteShadow;
  juce::Image dreadLayer, insetLayer, frameLayer;
  juce::Path rulerPath, planchetteBody;
  float dreadVis = -1, dreadDark = 0, dreadHole = 0, insetVis = -1, layerScale = 0, layerW = 0, layerH = 0;
  int lastVoice = -1;
  juce::Image whoLayer;
  float whoFade = -1;
  juce::VBlankAttachment vblank;
  // skip / dirty-rect state
  float lastPx = -1, lastPy = -1, lastP = -1, lastLvl = -1, lastGL = -1, lastVis = -1;
  int lastScopeW = -1, lastJunkN = -1, lastSel = -1;
  bool lastDown = false, lastHover = false, lastTrail = false;
  juce::Rectangle<int> lastPlanchetteRect;
};
