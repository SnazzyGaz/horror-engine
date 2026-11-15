// Screenshots of the plugin window in several states (a test tool, not part of the plugin).
#include <juce_gui_extra/juce_gui_extra.h>
#include <juce_audio_processors/juce_audio_processors.h>
#include <cstdio>
#include "../src/PluginProcessor.h"
#include "../src/PluginEditor.h"
#include "../src/Controller.h"

using namespace juce;

struct SnapApp : public JUCEApplication {
  const String getApplicationName() override { return "snap"; }
  const String getApplicationVersion() override { return "1"; }
  std::unique_ptr<HorrorProcessor> p; std::unique_ptr<AudioProcessorEditor> ed; std::unique_ptr<DocumentWindow> win; File out; int step = 0;
  std::unique_ptr<AudioPluginInstance> hosted;
  // --vst3 <plugin.vst3> <out dir>: load the built plugin as a host would, play MIDI, screenshot its editor
  void hostTest(const StringArray& a) {
    out = File(a[2]); out.createDirectory();
    AudioPluginFormatManager fm; fm.addFormat(std::make_unique<VST3PluginFormat>());
    OwnedArray<PluginDescription> types; VST3PluginFormat vst3; vst3.findAllTypesForFile(types, a[1]);
    if (types.isEmpty()) { std::printf("FAIL: no plugin in %s\n", a[1].toRawUTF8()); quit(); return; }
    std::printf("found: %s by %s, %s, %d ins %d outs\n", types[0]->name.toRawUTF8(), types[0]->manufacturerName.toRawUTF8(), types[0]->pluginFormatName.toRawUTF8(), types[0]->numInputChannels, types[0]->numOutputChannels);
    String err; hosted = fm.createPluginInstance(*types[0], 48000, 512, err);
    if (!hosted) { std::printf("FAIL: %s\n", err.toRawUTF8()); quit(); return; }
    hosted->enableAllBuses(); hosted->prepareToPlay(48000, 512);
    std::printf("parameters: %d, programs: %d (%s)\n", (int)hosted->getParameters().size(), hosted->getNumPrograms(), hosted->getProgramName(1).toRawUTF8());
    AudioBuffer<float> b(jmax(2, hosted->getTotalNumInputChannels(), hosted->getTotalNumOutputChannels()), 512); double peak = 0;
    for (int i = 0; i < 300; i++) { MidiBuffer m; if (i % 40 == 0) m.addEvent(MidiMessage::noteOn(1, 40 + i / 40, (uint8)100), 0); if (i % 40 == 30) m.addEvent(MidiMessage::noteOff(1, 40 + i / 40), 0); b.clear(); hosted->processBlock(b, m); peak = jmax(peak, (double)b.getMagnitude(0, 512)); }
    std::printf("audio peak %.3f: %s\n", peak, peak > .01 && peak < 1 ? "PASS" : "FAIL");
    MemoryBlock st; hosted->getStateInformation(st); hosted->setStateInformation(st.getData(), (int)st.getSize()); std::printf("state: %d bytes, restored\n", (int)st.getSize());
    ed.reset(hosted->createEditorIfNeeded());
    if (!ed) { std::printf("FAIL: no editor\n"); quit(); return; }
    win = std::make_unique<DocumentWindow>("host", Colours::black, 0); win->setUsingNativeTitleBar(true); win->setContentNonOwned(ed.get(), true); win->setVisible(true);
    std::printf("editor %d x %d\n", ed->getWidth(), ed->getHeight());
    Timer::callAfterDelay(jmax(1500, SystemStats::getEnvironmentVariable("HE_HOLD_MS", "1500").getIntValue()), [this] {
      for (int i = 0; i < 100; i++) { MidiBuffer m; if (i == 0) m.addEvent(MidiMessage::noteOn(1, 45, (uint8)100), 0); AudioBuffer<float> b2(2, 512); b2.clear(); hosted->processBlock(b2, m); }
      Timer::callAfterDelay(800, [this] {
        auto img = ed->createComponentSnapshot(ed->getLocalBounds(), true, 1.0f);
        File f = out.getChildFile("hosted_editor.png"); f.deleteFile(); FileOutputStream os(f); PNGImageFormat().writeImageToStream(img, os);
        std::printf("snapshot written\n"); std::fflush(stdout);
        win->clearContentComponent(); ed.reset(); win.reset(); hosted->releaseResources(); hosted.reset(); quit();
      });
    });
  }
  void initialise(const String& cmd) override {
    auto a = StringArray::fromTokens(cmd, true); for (auto& x : a) x = x.unquoted();
    if (a[0] == "--vst3") { hostTest(a); return; }
    if (a[0] == "--dread") { dreadShots(a); return; }
    out = File(cmd.unquoted().isNotEmpty() ? cmd.unquoted() : "/tmp/snaps"); out.createDirectory();
    p = std::make_unique<HorrorProcessor>(); p->setRateAndBufferSizeDetails(48000, 512); p->prepareToPlay(48000, 512);
    ed.reset(p->createEditor());
    win = std::make_unique<DocumentWindow>("snap", Colours::black, 0); win->setUsingNativeTitleBar(false); win->setTitleBarHeight(0);
    win->setContentNonOwned(ed.get(), true); win->setVisible(true);
    Timer::callAfterDelay(300, [this] { next(); });
  }
  void run(double sec) {
    AudioBuffer<float> b(2, 512); MidiBuffer m; int n = (int)(sec * 48000 / 512);
    for (int i = 0; i < n; i++) { b.clear(); p->processBlock(b, m); if (i % 4 == 0) p->controller().poll(); }
  }
  void shot(const String& name) {
    auto img = ed->createComponentSnapshot(ed->getLocalBounds(), true, 1.0f);
    File f = out.getChildFile(name + ".png"); f.deleteFile(); FileOutputStream os(f); PNGImageFormat().writeImageToStream(img, os);
  }
  void next() {
    auto& c = p->controller(); auto* e = dynamic_cast<HorrorEditor*>(ed.get());
    auto later = [this](int ms) { Timer::callAfterDelay(ms, [this] { next(); }); };
    switch (step++) {
      case 0: run(1); later(200); return;
      case 1: shot("01_main"); c.gesture('d', .62, .52, .6); for (int i = 0; i < 30; i++) { c.gesture('m', .62 + i * .003, .52 + .1 * std::sin(i * .2), .6); run(.03); } later(100); return;
      case 2: run(.2); e->testDrag(.66, .5, true); later(300); return;
      case 3: shot("02_drag"); e->testDrag(.66, .5, false); c.gesture('u', 0, 0, 0); e->testDrawer(0); later(300); return;
      case 4: shot("03_voice"); e->testDrawer(1); later(300); return;
      case 5: shot("04_effects"); e->testDrawer(2); later(300); return;
      case 6: shot("05_looper"); e->testDrawer(3); later(300); return;
      case 7: shot("06_soundin"); e->testDrawer(-1); e->testPop(1); later(300); return;
      case 8: shot("07_browse"); e->testPop(2); later(300); return;
      case 9: shot("08_menu"); e->testPop(0); c.select(4); c.setParam(he::P_STRUCK_OBJECT, 2); e->testDrawer(0); later(300); return;
      case 10: shot("09_struck_voice"); e->testDrawer(-1); c.select(6); run(.5); later(300); return;
      case 11: shot("10_junk"); c.select(3); e->testDrawer(0); later(300); return;
      case 12: shot("11_glass_voice"); e->testDrawer(-1); c.select(0); c.momentToggle(2); c.momentToggle(0); c.cmRecToggle(); c.gesture('d', .3, .5, .7); run(.5); c.gesture('u', 0, 0, 0); c.cmRecToggle(); run(.5); later(400); return;
      case 13: shot("12_moments"); c.cmNameDone(true, "My moment"); c.loopToggle(); c.gesture('d', .3, .5, .7); run(.5); c.gesture('u', 0, 0, 0); run(.3); c.loopToggle(); run(.5); e->testDrawer(2); later(400); return;
      case 14: shot("13_looper_layer"); e->testDrawer(-1); ed->setSize(1600, 960); later(400); return;
      case 15: shot("14_large"); ed->setSize(1100, 680); later(400); return;
      case 16: shot("15_small"); e->testGuide(); later(300); return;
      case 17: shot("16_guide"); quit(); return;
    }
  }
  void dreadShots(const StringArray& a) {
    out = File(a[1].isNotEmpty() ? a[1].unquoted() : "/workspace/vst-review/renders/ui-1.0.6"); out.createDirectory();
    p = std::make_unique<HorrorProcessor>(); p->setRateAndBufferSizeDetails(48000, 512); p->prepareToPlay(48000, 512);
    ed.reset(p->createEditor());
    win = std::make_unique<DocumentWindow>("snap-dread", Colours::black, 0); win->setUsingNativeTitleBar(false); win->setTitleBarHeight(0);
    win->setContentNonOwned(ed.get(), true); win->setTopLeftPosition(-4000, -4000); win->setVisible(true);
    Timer::callAfterDelay(400, [this] { dreadGo(); });
  }
  void dreadShot(const String& name) {
    auto* e = dynamic_cast<HorrorEditor*>(ed.get());
    if (!e) return;
    e->repaint(); e->testBoard().repaint();
    auto full = ed->createComponentSnapshot(ed->getLocalBounds(), true, 1.0f);
    File f = out.getChildFile(name + ".png"); f.deleteFile(); FileOutputStream os(f); PNGImageFormat().writeImageToStream(full, os);
    auto& b = e->testBoard();
    auto board = b.createComponentSnapshot(b.getLocalBounds(), true, 1.0f);
    File fb = out.getChildFile(name + "-board.png"); fb.deleteFile(); FileOutputStream osb(fb); PNGImageFormat().writeImageToStream(board, osb);
    std::printf("wrote %s and %s-board\n", name.toRawUTF8(), name.toRawUTF8());
  }
  void dreadHold(float dread, double sec) {
    auto& c = p->controller();
    c.setParam(he::P_MACRO_DREAD, dread);
    c.select(he::EBOW);
    c.setParam(he::P_EBOW_HOLD, 1);
    // a short bow so the held string has something to sustain
    c.gesture('d', .55f, .55f, .7f);
    run(.15); c.gesture('u', 0, 0, 0);
    run(sec);
    for (int i = 0; i < 8; i++) { c.poll(); MessageManager::getInstance()->runDispatchLoopUntil(16); }
  }
  void dreadGo() {
    auto& c = p->controller();
    c.setParam(he::P_MACRO_DREAD, 0); c.select(he::EBOW); run(.3); c.poll();
    MessageManager::getInstance()->runDispatchLoopUntil(50);
    dreadShot("dread-0");
    dreadHold(.5f, 1.2); dreadShot("dread-0.5");
    dreadHold(1.f, 1.2); dreadShot("dread-1");
    quit();
  }
  void shutdown() override { if (win) win->clearContentComponent(); ed.reset(); win.reset(); hosted.reset(); p.reset(); }
};
START_JUCE_APPLICATION(SnapApp)
