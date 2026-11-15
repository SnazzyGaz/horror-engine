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
    if (a[0] == "--bench") { benchMode(a); return; }
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
    out = File(a[1].isNotEmpty() ? a[1].unquoted() : "/workspace/planchette-preview/final/plugin"); out.createDirectory();
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
    for (int i = 0; i < 8; i++) c.poll();
  }
  void dreadGo() {
    auto* e = dynamic_cast<HorrorEditor*>(ed.get());
    auto& c = p->controller();
    c.setParam(he::P_MACRO_DREAD, 0); c.select(he::EBOW); run(.3); c.poll();
    if (e) e->testBoardObj().testSet(.50f, .48f, false);
    dreadShot("01_rest_dread0");
    dreadHold(.5f, 1.2);
    if (e) { if (!e->testBoardObj().testOnLetter('S', true, .75f)) e->testBoardObj().testSet(.50f, .48f, true, .75f); }
    dreadShot("02_playing_mid_dread");
    dreadHold(1.f, 1.2);
    if (e) { if (!e->testBoardObj().testOnLetter('S', true, .80f)) e->testBoardObj().testSet(.50f, .48f, true, .80f); }
    dreadShot("03_full_dread");
    quit();
  }

  void benchMode(const StringArray& a) {
    File dest(a.size() > 1 && a[1].isNotEmpty() ? a[1] : "/tmp/he-paint-bench");
    dest.createDirectory();
    out = dest;
    p = std::make_unique<HorrorProcessor>(); p->setRateAndBufferSizeDetails(48000, 512); p->prepareToPlay(48000, 512);
    ed.reset(p->createEditor());
    win = std::make_unique<DocumentWindow>("snap-bench", Colours::black, 0); win->setUsingNativeTitleBar(false); win->setTitleBarHeight(0);
    win->setContentNonOwned(ed.get(), true); win->setTopLeftPosition(-4000, -4000); win->setVisible(true);
    Timer::callAfterDelay(400, [this] { benchGo(); });
  }
  void benchAudio(double sec) {
    auto& c = p->controller();
    c.select(he::EBOW);
    c.setParam(he::P_EBOW_HOLD, 1);
    c.gesture('d', .55f, .55f, .7f);
    run(.12); c.gesture('u', 0, 0, 0);
    run(sec);
    c.poll();
  }
  static const char* slotName(int i) {
    static const char* n[] = {"bg","dread","candle","scope","ruler","trail","letters","junk","planchette","inset","over","plaque","paint_total"};
    return (i >= 0 && i < he_paint::NSlots) ? n[i] : "?";
  }
  void benchCase(const char* label, int ew, int eh, float px, float dread, bool moving) {
    auto* e = dynamic_cast<HorrorEditor*>(ed.get());
    auto& c = p->controller();
    ed->setSize(ew, eh);
    c.setParam(he::P_MACRO_DREAD, dread);
    c.select(he::EBOW);
    if (dread > 0 || moving) benchAudio(.4);
    else { run(.05); c.poll(); }
    e->testClearTrail();
    if (moving) e->testDrag(.45f, .52f, true);
    else e->testSet(.5f, .5f, false);
    auto& board = e->testBoardObj();
    int bw = board.getWidth(), bh = board.getHeight();
    int iw = jmax(1, (int)std::round(bw * px)), ih = jmax(1, (int)std::round(bh * px));
    Image img(Image::ARGB, iw, ih, true);
    {
      Graphics g(img); if (px != 1.f) g.addTransform(AffineTransform::scale(px));
      board.paintEntireComponent(g, true);
    }
    const int N = 60;
    he_paint::reset(); he_paint::on = true;
    double t0 = Time::getMillisecondCounterHiRes();
    for (int i = 0; i < N; i++) {
      if (moving) {
        float x = .40f + .22f * std::sin(i * .21f), y = .48f + .12f * std::cos(i * .17f);
        e->testSet(x, y, true, .6f);
        AudioBuffer<float> b(2, 64); MidiBuffer m; b.clear(); p->processBlock(b, m);
      }
      img.clear(img.getBounds());
      Graphics g(img); if (px != 1.f) g.addTransform(AffineTransform::scale(px));
      board.paintEntireComponent(g, true);
      he_paint::frames++;
    }
    double wall = Time::getMillisecondCounterHiRes() - t0;
    he_paint::on = false;
    double ms = wall / N;
    int denom = he_paint::frames > 0 ? he_paint::frames : N;
    double secAcc[he_paint::NSlots];
    for (int i = 0; i < he_paint::NSlots; ++i) secAcc[i] = he_paint::acc[i] / denom;
    auto plaqueMs = [&](Plaque& pl) {
      int pw = jmax(1, pl.getWidth()), ph = jmax(1, pl.getHeight());
      Image pi(Image::ARGB, jmax(1, (int)std::round(pw * px)), jmax(1, (int)std::round(ph * px)), true);
      { Graphics g(pi); if (px != 1.f) g.addTransform(AffineTransform::scale(px)); pl.paint(g); }
      double u0 = Time::getMillisecondCounterHiRes();
      for (int i = 0; i < N; i++) {
        pi.clear(pi.getBounds());
        Graphics g(pi); if (px != 1.f) g.addTransform(AffineTransform::scale(px));
        pl.paint(g);
      }
      return (Time::getMillisecondCounterHiRes() - u0) / N;
    };
    double pYes = plaqueMs(board.yes), pNo = plaqueMs(board.no), pBye = plaqueMs(board.bye);
    std::printf("CASE %s  editor=%dx%d  board=%dx%d  scale=%.2f  dread=%.1f  %s\n",
                label, ew, eh, bw, bh, px, dread, moving ? "moving+scope" : "still");
    std::printf("  paintEntireComponent  %.3f ms/frame  (wall %.1f ms / %d)\n", ms, wall, N);
    std::printf("  est. one-core CPU at 60 Hz: %.0f%%   (frame budget 16.7 ms)\n", ms / (1000.0 / 60.0) * 100.0);
    std::printf("  sections (ms/frame):\n");
    for (int i = 0; i < he_paint::NSlots; ++i)
      std::printf("    %-12s %7.3f  (%5.1f%% of paint_total)\n", slotName(i), secAcc[i],
                  secAcc[he_paint::Total] > 0 ? secAcc[i] / secAcc[he_paint::Total] * 100.0 : 0.0);
    std::printf("  plaques isolated: yes %.3f  no %.3f  goodbye %.3f ms/paint\n", pYes, pNo, pBye);
    std::fflush(stdout);
  }
  void benchGo() {
    std::printf("\n==== Horror Engine Seance editor paint bench ====\n");
    std::printf("host: %s  %d CPUs  %s\n", SystemStats::getCpuModel().toRawUTF8(), SystemStats::getNumCpus(), SystemStats::getOperatingSystemName().toRawUTF8());
    struct C { const char* name; int w, h; float px; };
    const C cs[] = {
      {"default", 1280, 760, 1.f},
      {"1.5x-window", 1920, 1140, 1.f},
      {"2x-window", 2560, 1520, 1.f},
      {"1.5x-dpi", 1280, 760, 1.5f},
      {"2x-dpi", 1280, 760, 2.f},
    };
    for (auto& c0 : cs)
      for (float d : {0.f, 1.f})
        benchCase(c0.name, c0.w, c0.h, c0.px, d, true);
    benchCase("default", 1280, 760, 1.f, 0.f, false);
    std::printf("==== bench done ====\n");
    std::fflush(stdout);
    quit();
  }

  void shutdown() override { if (win) win->clearContentComponent(); ed.reset(); win.reset(); hosted.reset(); p.reset(); }
};
START_JUCE_APPLICATION(SnapApp)
