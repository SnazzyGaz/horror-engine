// Horror Engine · Séance: the plugin window (src/seance/body.html's .win).
// Horror Engine by Garyck Arntzen (https://x.com/_mintydoge). Plugin released under the GNU AGPLv3.
#pragma once
#include "PluginProcessor.h"
#include "Board.h"
#include "Panels.h"

class HorrorEditor : public juce::AudioProcessorEditor, private juce::Timer {
 public:
  explicit HorrorEditor(HorrorProcessor&);
  ~HorrorEditor() override;
  void paint(juce::Graphics&) override;
  void resized() override;
  bool keyPressed(const juce::KeyPress&) override;
  bool keyStateChanged(bool isKeyDown) override;
  void mouseDown(const juce::MouseEvent&) override;
  void parentHierarchyChanged() override;
  // test hooks (tools/snap.cpp)
  void testDrawer(int i) { if (i < 0) drawer(open, 0); else drawer(i, 1); }
  void testPop(int w) { pop(w); }
  void testGuide() { guide.setVisible(true); guide.setBounds(getLocalBounds()); guide.toFront(true); }
  void testDrag(float x, float y, bool down) { board.testDrag(x, y, down); }
 private:
  void timerCallback() override;
  void drawer(int i, int force = -1);   // force: -1 toggle, 0 close, 1 open
  void pop(int which);                  // 0 none, 1 browse, 2 menu
  void placeDrawer();
  void placePop();
  HorrorProcessor& proc; Controller& ctl;
  look::LAF laf;
  TopBar top; Tokens tokens; Board board; SideColumn side; Rail rail; Chain chain;
  VoiceDrawer dVoice; FxDrawer dFx; LoopDrawer dLoop; InDrawer dIn; Drawer* drawers[4];
  BrowsePop browse; MenuPop menu; Guide guide; Toast toast;
  juce::TooltipWindow tips{this, 600};
  int open = -1, popOpen = 0, lastVersion = -1; bool keysShown = false;
  void takeKeys(); void syncKeys();
  juce::Rectangle<int> grid;
  struct KeyNote { int code; int tag; };
  std::vector<KeyNote> keysDown;
};
