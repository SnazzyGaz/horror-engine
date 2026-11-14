// Horror Engine · Séance: the spirit board (the playing surface), a port of HK.art in seance.js and the pad in ui.js.
// Horror Engine by Garyck Arntzen (https://x.com/_mintydoge). Plugin released under the GNU AGPLv3.
#pragma once
#include "Widgets.h"

class HorrorProcessor;

// Yes, No and Goodbye
class Plaque : public juce::Component, public juce::SettableTooltipClient {
 public:
  Plaque(const juce::String& word, const juce::String& sub, bool bye) : word(word), sub(sub), bye(bye) { setRepaintsOnMouseActivity(true); }
  juce::String word, sub; bool bye; bool pressed = false; float progress = -1;
  std::function<void()> onClick;
  void paint(juce::Graphics&) override;
  void mouseUp(const juce::MouseEvent& e) override { if (getLocalBounds().contains(e.getPosition()) && !e.mods.isPopupMenu() && onClick) onClick(); }
  juce::Rectangle<int> preferredSize() const;
};

struct BoardRuler { int lo, hi; double r; int kind; bool q; };

class Board : public juce::Component, private juce::Timer {
 public:
  Board(HorrorProcessor& p, Controller& c);
  void paint(juce::Graphics&) override;
  void paintOverChildren(juce::Graphics&) override;
  void resized() override;
  void mouseDown(const juce::MouseEvent&) override;
  void mouseDrag(const juce::MouseEvent&) override;
  void mouseUp(const juce::MouseEvent&) override;
  void mouseMove(const juce::MouseEvent&) override;
  void mouseExit(const juce::MouseEvent&) override;
  void mouseWheelMove(const juce::MouseEvent&, const juce::MouseWheelDetails&) override;
  void refresh();
  void testDrag(float x, float y, bool d) { curX = x; curY = y; curP = .6f; down = d; for (int i = 0; i < 40; i++) trail.push_back({x - .3f + i * .0075f, y + .05f * std::sin(i * .3f), juce::Time::getMillisecondCounterHiRes() - (40 - i) * 20}); }
  Plaque yes, no, bye;
 private:
  void timerCallback() override { repaint(); }
  void paintBg(int W, int H, float scale);
  void layoutLetters(float w, float h);
  float pressure(const juce::MouseEvent& e) const;
  void point(const juce::MouseEvent& e);
  bool ruler(struct BoardRuler& R) const;
  HorrorProcessor& proc; Controller& ctl;
  juce::Image bg; float bgScale = 0;
  struct Letter { juce::juce_wchar ch; float x, y, r; int row; };
  std::vector<Letter> L; float lw = 0, lh = 0, fs = 20, sp = 1;
  struct Pt { float x, y; double t; };
  std::vector<Pt> trail;
  float curX = .5f, curY = .5f, curP = .6f, hoverX = .5f, hoverY = .45f, restX = .5f, restY = .45f; bool hover = false, down = false;
  double lastSend = 0;
  juce::String reading;
};
