// Horror Engine · Séance: knobs, pill buttons and selectors, drawn as style.css draws them.
// Horror Engine by Garyck Arntzen (https://x.com/_mintydoge). Plugin released under the GNU AGPLv3.
#pragma once
#include "Look.h"
#include "Controller.h"

// a parameter control that can be MIDI-learned (right-click menu, or the top bar's MIDI learn then a click)
class Learnable {
 public:
  Learnable(Controller& c, int k) : ctl(c), k(k) {}
  virtual ~Learnable() = default;
  Controller& ctl; int k;
  // true when the click was taken by MIDI learn picking
  bool pickOrMenu(const juce::MouseEvent& e, juce::Component* self);
  void drawLearn(juce::Graphics& g, juce::Rectangle<float> r, juce::Point<float> dot);
  static void contextMenu(Controller& c, int k, juce::Component* target);
};

class Knob : public juce::Component, public juce::SettableTooltipClient, public Learnable {
 public:
  Knob(Controller& c, int k, bool big = false, const juce::String& sub = {});
  void paint(juce::Graphics&) override;
  void mouseDown(const juce::MouseEvent&) override;
  void mouseDrag(const juce::MouseEvent&) override;
  void mouseUp(const juce::MouseEvent&) override;
  void mouseDoubleClick(const juce::MouseEvent&) override;
  void mouseWheelMove(const juce::MouseEvent&, const juce::MouseWheelDetails&) override;
  bool keyPressed(const juce::KeyPress&) override;
  void refresh();            // repaint when the value or the learn state changed
  int preferredHeight(int width) const;
  bool big; juce::String sub; int labelLines = 1;
 private:
  double shown = -1e300; juce::String learnKey; bool learnOn = false; bool pickOn = false;
  float sy = 0; double sn = 0; bool dragging = false;
};

// a pill: a toggle bound to a switch parameter, or an action button
class Pill : public juce::Component, public juce::SettableTooltipClient {
 public:
  enum Style { TB, TB_SM, BTN_SM, IB, RT, CH, CAP, MI, PLAQUE, PAD };
  explicit Pill(const juce::String& text = {}, Style s = TB_SM) : text(text), style(s) { setRepaintsOnMouseActivity(true); }
  std::function<void()> onClick;
  std::function<void(const juce::MouseEvent&)> onRightClick;
  juce::String text, text2, kbd; Style style; juce::juce_wchar prefixIcon = 0; bool pressed = false, enabled = true, dashed = false, hot = false, off = false, compact = false;
  float progress = -1;   // the live bar along the bottom (moments)
  void paint(juce::Graphics&) override;
  void mouseUp(const juce::MouseEvent&) override;
  void mouseDown(const juce::MouseEvent&) override;
  float preferredWidth() const;
  void set(bool p) { if (p != pressed) { pressed = p; repaint(); } }
  void setText(const juce::String& t) { if (t != text) { text = t; repaint(); } }
  void setText2(const juce::String& t) { if (t != text2) { text2 = t; repaint(); } }
};

// a switch parameter as a pill (Hold, Mute, Freeze...)
class ParamToggle : public Pill, public Learnable {
 public:
  ParamToggle(Controller& c, int k, const juce::String& label);
  void mouseDown(const juce::MouseEvent&) override;
  void mouseUp(const juce::MouseEvent&) override;
  void paint(juce::Graphics&) override;
  void refresh();
  bool pickedHere = false;
};

// a choice parameter: its label, then one pill per choice
class Segment : public juce::Component, public Learnable {
 public:
  Segment(Controller& c, int k);
  void paint(juce::Graphics&) override;
  void mouseDown(const juce::MouseEvent&) override;
  void mouseUp(const juce::MouseEvent&) override;
  void resized() override;
  void refresh();
  int preferredWidth() const;
 private:
  juce::OwnedArray<Pill> pills; int cur = -1; float labW = 0; bool swallow = false;
};
