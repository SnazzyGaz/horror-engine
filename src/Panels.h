// Horror Engine · Séance: the panels around the board (top bar, voice tokens, side column, rail, chain, drawers,
// popovers, guide, toast), laid out as src/seance/body.html and style.css lay them out.
// Horror Engine by Garyck Arntzen (https://x.com/_mintydoge). Plugin released under the GNU AGPLv3.
#pragma once
#include "Widgets.h"

class HorrorProcessor;

// a section with the side column's look: border, fill, a Fell heading and a small italic note
void drawSection(juce::Graphics& g, juce::Rectangle<float> r, const juce::String& title, const juce::String& note, float radius = 12);

class TopBar : public juce::Component {
 public:
  TopBar(Controller& c);
  void paint(juce::Graphics&) override;
  void resized() override;
  void refresh();
  Pill prev{juce::String::fromUTF8("\xe2\x80\xb9"), Pill::IB}, next{juce::String::fromUTF8("\xe2\x80\xba"), Pill::IB}, browse{"Browse", Pill::TB};
  Pill undo{juce::String::fromUTF8("\xe2\x86\xb6"), Pill::IB}, redo{juce::String::fromUTF8("\xe2\x86\xb7"), Pill::IB}, learn{"MIDI learn", Pill::TB}, menu{juce::String::fromUTF8("\xe2\x89\xa1"), Pill::IB};
  Pill title{"", Pill::PAD}, star{"", Pill::PAD};
  std::function<void()> onBrowse, onMenu;
 private:
  Controller& ctl; juce::Rectangle<float> pname, meter; juce::String shownTitle, shownNum, shownEdit; bool shownStar = false; float mL = 0, mR = 0, mG = 0;
};

class Tokens : public juce::Component, public juce::TooltipClient {
 public:
  explicit Tokens(Controller& c) : ctl(c) { setRepaintsOnMouseActivity(true); }
  void paint(juce::Graphics&) override;
  void mouseUp(const juce::MouseEvent&) override;
  void refresh() { repaint(); }
  bool hitTest(int, int y) override { return y < getHeight() - 8; }
  juce::String getTooltip() override;
 private:
  Controller& ctl; int at(juce::Point<int> p) const;
};

class MomentsPanel;
class SideColumn : public juce::Component {
 public:
  SideColumn(Controller& c);
  ~SideColumn() override;
  void paint(juce::Graphics&) override;
  void resized() override;
  void refresh();
  void select();
 private:
  Controller& ctl;
  juce::OwnedArray<Knob> macros, pins;
  std::unique_ptr<MomentsPanel> moments;
  juce::Rectangle<float> rMac, rMom, rPin; int pinVoice = -1;
};

class Rail : public juce::Component {
 public:
  Rail(Controller& c);
  void paint(juce::Graphics&) override;
  void resized() override;
  void refresh();
  Pill tabs[4]; Pill octDn{juce::String::fromUTF8("Oct \xe2\x88\x92"), Pill::PAD}, octUp{"+", Pill::PAD}, hold{"Hold", Pill::TB}, freeze{"Freeze Aura", Pill::TB};
  std::function<void(int)> onTab;
  int open = -1;
 private:
  Controller& ctl; juce::Rectangle<float> seg; juce::String oct;
};

class Chain : public juce::Component {
 public:
  Chain(Controller& c);
  void paint(juce::Graphics&) override;
  void resized() override;
  void refresh();
  std::function<void(int)> onOpen;   // 0 voice, 1 effects
 private:
  Controller& ctl; Pill v{"Voices", Pill::CH}, s{"", Pill::CH}, spr{"Spring", Pill::CH}, harm{"Harmonizer", Pill::CH}, hall{"Hall", Pill::CH}, body{"Body", Pill::CH}, m{"Master", Pill::CH};
  juce::Rectangle<float> grp; std::vector<juce::Point<float>> arrows; float outX = 0;
};

class Drawer : public juce::Component {
 public:
  Drawer(Controller& c, const juce::String& title, const juce::String& blurb);
  void paint(juce::Graphics&) override;
  void resized() override;
  virtual void refresh() {}
  virtual int contentHeight(int width) = 0;   // lay the body out at this width, return its height
  int preferredHeight(int width);
  juce::String title, blurb; Pill close{juce::String::fromUTF8("\xe2\x8c\x84"), Pill::IB};
  std::function<void()> onClose;
 protected:
  Controller& ctl; juce::Viewport view; juce::Component body; juce::Component* extraHead = nullptr; float headH = 0;
};

class VoiceDrawer : public Drawer {
 public:
  explicit VoiceDrawer(Controller& c);
  void build();
  void refresh() override;
  int contentHeight(int width) override;
  void paintBody(juce::Graphics& g);
 private:
  int built = -1; Pill defaults{"Defaults", Pill::TB_SM}, reset{"Reset", Pill::BTN_SM};
  juce::OwnedArray<Knob> model, water, channel, offs; juce::OwnedArray<Segment> segs; juce::OwnedArray<ParamToggle> toggles, subs;
  struct Lab { juce::String t, s; juce::Rectangle<float> r; int kind; };
  std::vector<Lab> labs;
  struct Painter : juce::Component { VoiceDrawer* d = nullptr; void paint(juce::Graphics& g) override { d->paintBody(g); } } painter;
};

class FxDrawer : public Drawer {
 public:
  explicit FxDrawer(Controller& c);
  void refresh() override;
  int contentHeight(int width) override;
  void paintBody(juce::Graphics& g);
 private:
  int built = -1; juce::OwnedArray<Knob> sends, hall, spring, harm, bodyk, master;
  juce::Rectangle<float> src, ret[4], mst; juce::String limit;
  struct Painter : juce::Component { FxDrawer* d = nullptr; void paint(juce::Graphics& g) override { d->paintBody(g); } } painter;
};

class LoopDrawer : public Drawer {
 public:
  explicit LoopDrawer(Controller& c);
  void refresh() override;
  int contentHeight(int width) override;
  void paintBody(juce::Graphics& g);
 private:
  Pill rec{juce::String::fromUTF8("\xe2\x97\x8f Loop a gesture"), Pill::TB}, clear{"Clear all", Pill::TB_SM}; juce::ToggleButton freeLen{"Free length"}, syncBox{"Sync to host"};
  struct Row { int id; juce::ComboBox voice; Pill ghost{"Ghost", Pill::BTN_SM}, mute{"Mute", Pill::BTN_SM}, del{"Remove", Pill::BTN_SM}; juce::Rectangle<float> r, prog; float pos = 0, len = 0; };
  juce::OwnedArray<Row> rows; juce::String ids; int width = 600;
  struct Painter : juce::Component { LoopDrawer* d = nullptr; void paint(juce::Graphics& g) override { d->paintBody(g); } } painter;
};

class InDrawer : public Drawer {
 public:
  explicit InDrawer(Controller& c);
  void refresh() override;
  int contentHeight(int width) override;
  void paintBody(juce::Graphics& g);
 private:
  Pill track{"Track input", Pill::TB_SM}, file{"File", Pill::TB_SM}, stop{"Stop", Pill::TB_SM}; juce::ToggleButton loop{"Loop"};
  juce::OwnedArray<Knob> knobs; juce::Rectangle<float> meter, state; float shownPk = -1; juce::String shownState;
  struct Painter : juce::Component { InDrawer* d = nullptr; void paint(juce::Graphics& g) override { d->paintBody(g); } } painter;
};

class Popover : public juce::Component {
 public:
  void paint(juce::Graphics&) override;
  juce::Component* anchor = nullptr;
};

class BrowsePop : public Popover, private juce::TextEditor::Listener {
 public:
  explicit BrowsePop(Controller& c);
  void resized() override;
  void paintOverChildren(juce::Graphics&) override;
  void rebuild();
  void focus();
  std::function<void()> onDone;
 private:
  void textEditorTextChanged(juce::TextEditor&) override { rebuild(); }
  Controller& ctl; juce::TextEditor find; Pill starred{"Starred", Pill::TB_SM}, save{juce::String::fromUTF8("Save file\xe2\x80\xa6"), Pill::TB_SM}, load{juce::String::fromUTF8("Load file\xe2\x80\xa6"), Pill::TB_SM};
  bool onlyFav = false; juce::Viewport view; juce::Component list; juce::OwnedArray<juce::Component> items; float footY = 0;
};

class MenuPop : public Popover {
 public:
  explicit MenuPop(Controller& c);
  void resized() override;
  void paintOverChildren(juce::Graphics&) override;
  std::function<void()> onGuide, onDone, onKeys;
  void showKeys(bool on);
 private:
  Controller& ctl; Pill retro{"Save the last minute", Pill::MI}, share{"Copy share link", Pill::MI}, keys{"Computer keyboard: off", Pill::MI}, guide{"Guide & keys", Pill::MI};
};

class Guide : public juce::Component {
 public:
  Guide();
  void paint(juce::Graphics&) override;
  void resized() override;
  void mouseUp(const juce::MouseEvent& e) override;
  std::function<void()> onClose;
 private:
  juce::Viewport view; struct Body : juce::Component { void paint(juce::Graphics&) override; int layout(int w); } body; Pill close{"Close", Pill::TB};
  juce::Rectangle<int> card;
};

class Toast : public juce::Component, private juce::Timer {
 public:
  explicit Toast(Controller& c) : ctl(c) { setInterceptsMouseClicks(false, false); startTimerHz(10); }
  void paint(juce::Graphics&) override;
  void place();
 private:
  void timerCallback() override;
  Controller& ctl; int seq = 0; juce::String t;
};
