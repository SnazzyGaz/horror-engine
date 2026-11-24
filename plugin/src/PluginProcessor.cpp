// Horror Engine · Séance plugin processor. Horror Engine by Garyck Arntzen (https://x.com/_mintydoge). GNU AGPLv3.
#include "PluginProcessor.h"
#include "Controller.h"
#include "PluginEditor.h"
#include "he_presets.gen.h"

using namespace juce;

static String groupName(const String& g) {
  static const char* const K[] = {"ebow", "hurdy", "bowed", "glass", "struck", "spring", "junk", "aura", "moan", "macro", "water", "harm", "body", "rev", "master", "input"};
  static const char* const N[] = {"E-bow String", "Hurdy-Gurdy", "Bowed Metal", "Glass", "Struck Metal", "Spring Tank", "Junk Tray", "Aura", "Superball", "Macro", "Water", "Harmonizer", "Body", "Hall", "Master", "Your sound in"};
  for (int i = 0; i < 16; i++) if (g == K[i]) return N[i];
  return g;
}

// every engine parameter is a host parameter (automatable), with the web app's ranges, curves and names
AudioProcessorValueTreeState::ParameterLayout HorrorProcessor::layout() {
  AudioProcessorValueTreeState::ParameterLayout L;
  for (int i = 0; i < he::NPARAM; i++) {
    const he::ParamInfo& d = he::PARAMS[i];
    String id(d.id), name = groupName(id.upToFirstOccurrenceOf(".", false, false)) + " " + d.label;
    ParameterID pid(id, 1);
    if (d.nEnum > 0) { StringArray en; for (int k = 0; k < d.nEnum; k++) en.add(d.enums[k]); L.add(std::make_unique<AudioParameterChoice>(pid, name, en, (int)d.def)); }
    // switches are two-state choices: a bool parameter does not restore in-between values a host may have set
    else if (d.sw) L.add(std::make_unique<AudioParameterChoice>(pid, name, StringArray{"Off", "On"}, d.def > .5 ? 1 : 0));
    else if (d.isInt) L.add(std::make_unique<AudioParameterInt>(pid, name, (int)d.min, (int)d.max, (int)d.def, AudioParameterIntAttributes().withLabel(d.unit)));
    else {
      NormalisableRange<float> r((float)d.min, (float)d.max);
      if (d.exp) {   // exponential knobs move in equal ratios, as in the web app
        double mn = d.min, mx = d.max;
        r = NormalisableRange<float>((float)mn, (float)mx,
          [mn, mx](float, float, float n) { return (float)(mn * std::pow(mx / mn, (double)n)); },
          [mn, mx](float, float, float v) { return (float)(std::log(v / mn) / std::log(mx / mn)); });
      }
      // text <-> value round-trips exactly (fixed decimals), as CLAP and VST3 hosts expect
      int dec = std::abs(d.max - d.min) >= 100 ? 1 : std::abs(d.max - d.min) >= 10 ? 2 : 4;
      auto attrs = AudioParameterFloatAttributes().withLabel(d.unit)
        .withStringFromValueFunction([dec](float v, int) { if (std::abs(v) < .5f * std::pow(10.f, (float)-dec)) v = 0; return String(v, dec); })
        .withValueFromStringFunction([](const String& t) { return t.retainCharacters("-+.0123456789eE").getFloatValue(); });
      L.add(std::make_unique<AudioParameterFloat>(pid, name, r, (float)d.def, attrs));
    }
  }
  // Plugin-only host automation parameters for the Spirit Board surface (does not alter he::NPARAM or preset schemas)
  auto mkBoardFloat = [](const char* id, const char* nm, float mn, float mx, float df) {
    auto attrs = AudioParameterFloatAttributes()
      .withStringFromValueFunction([](float v, int) { return String(v, 4); })
      .withValueFromStringFunction([](const String& t) { return t.retainCharacters("-+.0123456789eE").getFloatValue(); });
    return std::make_unique<AudioParameterFloat>(ParameterID(id, 1), nm, NormalisableRange<float>(mn, mx), df, attrs);
  };
  L.add(std::make_unique<AudioParameterChoice>(ParameterID("board.touch", 1), "Board Touch", StringArray{"Off", "On"}, 0));
  L.add(mkBoardFloat("board.x", "Board X", 0.0f, 1.0f, 0.5f));
  L.add(mkBoardFloat("board.y", "Board Y", 0.0f, 1.0f, 0.5f));
  L.add(mkBoardFloat("board.pressure", "Board Pressure", 0.05f, 1.0f, 0.6f));
  return L;
}

HorrorProcessor::HorrorProcessor()
    : AudioProcessor(BusesProperties().withInput("Your sound in", AudioChannelSet::stereo(), true).withOutput("Output", AudioChannelSet::stereo(), true)),
      apvts(*this, nullptr, "HorrorEngine", layout()) {
  for (int i = 0; i < he::NPARAM; i++) { raw_[i] = apvts.getRawParameterValue(he::PARAMS[i].id); params_[i] = apvts.getParameter(he::PARAMS[i].id); }
  boardRaw_[0] = apvts.getRawParameterValue("board.touch");
  boardRaw_[1] = apvts.getRawParameterValue("board.x");
  boardRaw_[2] = apvts.getRawParameterValue("board.y");
  boardRaw_[3] = apvts.getRawParameterValue("board.pressure");
  for (auto& row : mmap) for (auto& c : row) c = -1;
  for (auto& c : cmOrder) c = 0;
  ctl_ = std::make_unique<Controller>(*this);
}

// the controller is a Timer: it must stop while no timer callback can run (hosts and validators may delete plugins on
// other threads), so lock the message manager for that
HorrorProcessor::~HorrorProcessor() {
  alive_->store(false);
  auto* mm = MessageManager::getInstanceWithoutCreating();
  if (mm == nullptr || mm->isThisTheMessageThread()) ctl_.reset();
  else { const MessageManagerLock mml; ctl_.reset(); }
}

bool HorrorProcessor::isBusesLayoutSupported(const BusesLayout& l) const {
  auto out = l.getMainOutputChannelSet();
  if (out != AudioChannelSet::stereo() && out != AudioChannelSet::mono()) return false;
  auto in = l.getMainInputChannelSet();
  return in.isDisabled() || in == AudioChannelSet::stereo() || in == AudioChannelSet::mono();
}

void HorrorProcessor::prepareToPlay(double sr, int maxBlock) {
  sr_ = sr > 0 ? sr : 48000;
  host_ = std::make_unique<he::Host>(sr_);
  host_->setStemsMode(false);   // plugin renders stereo output only; skip the 13 unused stem chains
  double P[he::NPARAM]; for (int i = 0; i < he::NPARAM; i++) P[i] = last_[i] = *raw_[i];
  host_->init(P, 1337);
  setLatencySamples(host_->latencySamples());
  // your own moments survive a sample-rate change: the controller hands their definitions over again
  for (auto& d : ctl_->engineDefinitions()) { he::Msg m; m.t = he::Msg::CMDEF; m.id = d.first; m.def = d.second; host_->msg(m); }
  int pre = jmax(4096, maxBlock);
  inBuf_.setSize(2, pre); outTmp_.setSize(2, pre);
  int rs = (int)std::ceil(62 * sr_ / he::BL) * he::BL;
  {
    SpinLock::ScopedLockType rl(ringLock_);
    if (ring_.getNumSamples() != rs) ring_.setSize(2, rs);
    ring_.clear(); ringW_ = 0; ringFill_ = 0;
  }
  held_.clear(); held_.reserve(128); inputOn_ = false; blocks_ = 0; for (auto& h : hold_) h = ParamHold();
  boardWasDown_ = false; boardVoice_ = selVoice.load();
  pbMul_ = 1.0; atMod_ = -1.0; mwMod_ = -1.0; sustain_ = false;
  if (inputSource.load() != IN_NONE) { host_->inputOn(true); inputOn_ = true; }
}

void HorrorProcessor::applyParams(bool force, int numSamples) {
  for (int i = 0; i < he::NPARAM; i++) {
    double v = *raw_[i];
    if (!force && hold_[i].holding() && !hold_[i].follow(params_[i]->convertTo0to1((float)v), numSamples)) continue;   // a CC's value is still on its way to the host
    if (force || v != last_[i]) { last_[i] = v; host_->setParam(i, v); }
  }
  // Host-automated Spirit Board surface (only touches slot 0 while board.touch is On or releasing)
  if (boardRaw_[0] != nullptr) {
    bool bt = *boardRaw_[0] > .5f;
    float bx = *boardRaw_[1], by = *boardRaw_[2], bp = *boardRaw_[3];
    int sv = selVoice.load();
    if (bt && !boardWasDown_) {
      boardWasDown_ = true; boardVoice_ = sv; boardLastX_ = bx; boardLastY_ = by; boardLastP_ = bp;
      host_->gesture(sv, 'd', bx, by, bp, 0, 0);
    } else if (!bt && boardWasDown_) {
      boardWasDown_ = false;
      host_->gesture(boardVoice_, 'u', 0, 0, 0, 0, 0);
    } else if (bt) {
      if (sv != boardVoice_) {
        host_->gesture(boardVoice_, 'u', 0, 0, 0, 0, 0);
        boardVoice_ = sv; boardLastX_ = bx; boardLastY_ = by; boardLastP_ = bp;
        host_->gesture(sv, 'd', bx, by, bp, 0, 0);
      } else if (bx != boardLastX_ || by != boardLastY_ || bp != boardLastP_) {
        boardLastX_ = bx; boardLastY_ = by; boardLastP_ = bp;
        host_->gesture(sv, 'n', bx, by, bp, 0, 0);
      }
    }
  }
}
// a CC set parameter k: the engine takes it now, the host parameter follows from the controller's timer
void HorrorProcessor::midiParam(int k, double v) {
  host_->setParam(k, v); last_[k] = v; hold_[k].midi(params_[k]->convertTo0to1((float)v), (int64_t)(sr_ * .5));
  AudioNote n; n.k = k; n.v = (float)v; pushNote(n);
}

void HorrorProcessor::pushNote(const AudioNote& n) {
  int s1, n1, s2, n2; noteFifo_.prepareToWrite(1, s1, n1, s2, n2);
  if (n1) notes_[s1] = n; else if (n2) notes_[s2] = n; noteFifo_.finishedWrite(n1 + n2);
}
bool HorrorProcessor::popNote(AudioNote& n) {
  int s1, n1, s2, n2; noteFifo_.prepareToRead(1, s1, n1, s2, n2);
  if (n1) n = notes_[s1]; else if (n2) n = notes_[s2]; noteFifo_.finishedRead(n1 + n2); return n1 + n2 > 0;
}
bool HorrorProcessor::popTelemetry(he::Telemetry& t) {
  int s1, n1, s2, n2; tmFifo_.prepareToRead(1, s1, n1, s2, n2);
  if (n1) t = tms_[s1]; else if (n2) t = tms_[s2]; tmFifo_.finishedRead(n1 + n2); return n1 + n2 > 0;
}
bool HorrorProcessor::takeCapture(he::CmCapture& c) { SpinLock::ScopedLockType l(capLock_); if (!capReady_) return false; capReady_ = false; std::swap(c, cap_); return true; }

void HorrorProcessor::push(const UiEvent& e) {
  SpinLock::ScopedLockType l(fifoWriteLock_);
  int s1, n1, s2, n2; fifo_.prepareToWrite(1, s1, n1, s2, n2);
  if (n1) events_[s1] = e; else if (n2) events_[s2] = e; fifo_.finishedWrite(n1 + n2);
}

static int voicePolySlots(int voice) {
  if (voice == he::EBOW) return 2;
  if (voice == he::BOWED || voice == he::GLASS) return 3;
  if (voice == he::STRUCK) return 0;
  return 1;
}

double HorrorProcessor::effPressure(double vel) const {
  if (atMod_ >= 0.0) return jlimit(0.05, 1.0, atMod_);
  if (mwMod_ >= 0.0) return jlimit(0.05, 1.0, mwMod_);
  return jlimit(0.05, 1.0, vel);
}

// held notes: polyphonic on E-bow (2), Bowed (3), Glass (3); mono last-note priority on others; one-shot on Struck
void HorrorProcessor::noteOn(int tag, double hz, double vel) {
  int s = selVoice.load(), maxSlots = voicePolySlots(s);
  double effHz = hz * pbMul_, effP = effPressure(vel);
  if (maxSlots >= 2) {
    for (auto& h : held_) {
      if (h.tag == tag && h.voice == s) {
        h.baseHz = hz; h.vel = vel; h.sustained = false;
        host_->gesture(s, 'd', .5, .5, effP, effHz, h.slot);
        return;
      }
    }
    bool used[4] = {};
    for (auto& h : held_) if (h.voice == s && h.slot >= 1 && h.slot <= 3) used[h.slot] = true;
    int slot = 0;
    for (int k = 1; k <= maxSlots; k++) if (!used[k]) { slot = k; break; }
    if (slot == 0) {
      // Steal oldest sustained note on this voice first, otherwise oldest held note
      size_t victim = held_.size();
      for (size_t i = 0; i < held_.size(); i++) if (held_[i].voice == s && held_[i].sustained) { victim = i; break; }
      if (victim == held_.size()) for (size_t i = 0; i < held_.size(); i++) if (held_[i].voice == s) { victim = i; break; }
      if (victim < held_.size()) { slot = held_[victim].slot; held_.erase(held_.begin() + (long)victim); }
      else slot = 1;
    }
    held_.push_back({tag, s, slot, hz, vel, false});
    host_->gesture(s, 'd', .5, .5, effP, effHz, slot);
    return;
  }
  held_.erase(std::remove_if(held_.begin(), held_.end(), [&](const Held& h) { return h.tag == tag; }), held_.end());
  held_.push_back({tag, s, 1, hz, vel, false});
  host_->gesture(s, 'd', .5, .5, effP, effHz, 1);
}

void HorrorProcessor::releaseHeldAt(size_t idx) {
  if (idx >= held_.size()) return;
  int v = held_[idx].voice, sl = held_[idx].slot;
  held_.erase(held_.begin() + (long)idx);
  if (voicePolySlots(v) >= 2) {
    bool still = false;
    for (auto& h : held_) if (h.voice == v && h.slot == sl) { still = true; break; }
    if (!still) host_->gesture(v, 'u', 0, 0, 0, 0, sl);
    return;
  }
  const Held* last = nullptr;
  for (auto& h : held_) if (h.voice == v) last = &h;
  if (!last) host_->gesture(v, 'u', 0, 0, 0, 0, 1);
  else if (v != he::STRUCK) host_->gesture(v, 'd', .5, .5, effPressure(last->vel), last->baseHz * pbMul_, 1);
}

void HorrorProcessor::noteOff(int tag) {
  for (size_t i = 0; i < held_.size(); i++) {
    if (held_[i].tag == tag) {
      if (sustain_) { held_[i].sustained = true; return; }
      releaseHeldAt(i);
      return;
    }
  }
}

void HorrorProcessor::releaseSustained() {
  for (size_t i = 0; i < held_.size();) {
    if (held_[i].sustained) releaseHeldAt(i);
    else i++;
  }
}

void HorrorProcessor::updateActivePitchAndPressure() {
  int monoLast[he::NS]; for (int i = 0; i < he::NS; i++) monoLast[i] = -1;
  for (size_t i = 0; i < held_.size(); i++) {
    const auto& h = held_[i];
    int ms = voicePolySlots(h.voice);
    if (ms >= 2) host_->gesture(h.voice, 'm', .5, .5, effPressure(h.vel), h.baseHz * pbMul_, h.slot);
    else if (ms == 1) monoLast[h.voice] = (int)i;
  }
  for (int v = 0; v < he::NS; v++) if (monoLast[v] >= 0) {
    const auto& h = held_[(size_t)monoLast[v]];
    host_->gesture(v, 'm', .5, .5, effPressure(h.vel), h.baseHz * pbMul_, 1);
  }
}

void HorrorProcessor::releaseAll(int voice) {
  bool released[he::NS][4] = {};
  for (const auto& h : held_) {
    if (h.voice >= 0 && h.voice < he::NS && h.slot >= 1 && h.slot <= 3 && !released[h.voice][h.slot]) {
      released[h.voice][h.slot] = true;
      host_->gesture(h.voice, 'u', 0, 0, 0, 0, h.slot);
    }
  }
  if (voice >= 0 && voice < he::NS) {
    for (int sl = 1; sl <= 3; sl++) if (!released[voice][sl]) host_->gesture(voice, 'u', 0, 0, 0, 0, sl);
  }
  held_.clear(); sustain_ = false;
}
void HorrorProcessor::momentToggle(int id) { host_->moment(id, !host_->momentActive(id)); }
// moment n (0-based): the five built-in ones, then your own in panel order
void HorrorProcessor::momentN(int n) {
  if (n < 5) { momentToggle(n); return; }
  int k = n - 5; if (k >= cmCount.load()) return;
  int h = cmOrder[k].load(); he::Msg m; m.t = he::Msg::CMOMENT; m.id = h; m.on = !host_->cmActive(h); host_->msg(m);
}

void HorrorProcessor::runEvent(const UiEvent& e) {
  he::Msg m;
  switch (e.type) {
    case UiEvent::GESTURE: host_->gesture(e.voice, e.kind, e.x, e.y, e.p, e.hz, 0); break;
    case UiEvent::NOTE_ON: noteOn(e.tag, e.hz, e.p); break;
    case UiEvent::NOTE_OFF: noteOff(e.tag); break;
    case UiEvent::RELEASE_ALL:
      if (e.on) host_->gesture(e.voice, 'u', 0, 0, 0, 0, 0);
      releaseAll(e.voice);
      break;
    case UiEvent::MOMENT: momentToggle(e.id); break;
    case UiEvent::MOMENT_N: momentN(e.id); break;
    case UiEvent::CMOMENT: m.t = he::Msg::CMOMENT; m.id = e.id; m.on = !host_->cmActive(e.id); host_->msg(m); break;
    case UiEvent::CMDEF: m.t = he::Msg::CMDEF; m.id = e.id; m.def = e.def; host_->msg(m); break;
    case UiEvent::CMREC: m.t = he::Msg::CMREC; m.on = e.on; host_->msg(m); break;
    case UiEvent::PANIC: releaseAll(selVoice.load()); boardWasDown_ = false; pbMul_ = 1.0; atMod_ = -1.0; mwMod_ = -1.0; host_->panic(); break;
    case UiEvent::INPUT: if (e.on != inputOn_) { inputOn_ = e.on; host_->inputOn(e.on); } break;
    case UiEvent::LOOP: {
      static const char* const A[] = {"rec", "stop", "clear", "undo", "redo", "del", "mute", "src", "ghost"};   // "rec" while recording stops it, as in engine.js
      host_->loop(A[e.loopAction], e.layer, e.lv, e.free); break;
    }
  }
}

void HorrorProcessor::handleMidi(const MidiMessage& msg) {
  auto* d = msg.getRawData(); if (msg.getRawDataSize() < 2) return;
  int st = d[0] & 240, ch = d[0] & 15, d1 = d[1], d2 = msg.getRawDataSize() > 2 ? d[2] : 0;
  // MIDI learn and learned CCs come first (CC 120-127 are channel-mode messages, never learned)
  if (st == 176 && d1 <= 119) {
    if (learnArmed.load() > 0) { learnArmed = 0; AudioNote n; n.type = AudioNote::LEARN_GOT; n.ch = ch; n.cc = d1; pushNote(n); return; }
    int mid = mmap[ch][d1].load();
    if (mid >= 0) { midiParam(mid, Controller::midiValue(mid, d2)); return; }
  }
  // Channel mode messages: CC 120 All Sound Off, CC 123 All Notes Off
  if (st == 176 && d1 == 120) { releaseAll(selVoice.load()); host_->panic(); return; }
  if (st == 176 && d1 == 123) { releaseAll(selVoice.load()); return; }
  // moments over MIDI: notes on channel 16 from C2 (36) fire moment 1, 2, 3...; CC 24-43 on any channel fire them on a rise past 64
  if (ch == 15 && (st == 144 || st == 128)) { if (st == 144 && d2 > 0 && d1 >= 36) momentN(d1 - 36); return; }
  if (st == 176 && d1 >= 24 && d1 <= 43) { int was = midiCC_[d1]; midiCC_[d1] = d2; if (was < 64 && d2 >= 64) momentN(d1 - 24); return; }
  if (st == 144 && d2 > 0) noteOn(1000 + ch * 128 + d1, 440 * std::pow(2.0, (d1 - 69) / 12.0), d2 / 127.0);
  else if (st == 128 || st == 144) noteOff(1000 + ch * 128 + d1);
  else if (st == 224) {   // Pitch Bend (±2 semitones)
    int pb = (d2 << 7) | d1;
    pbMul_ = std::pow(2.0, (2.0 * (pb - 8192) / 8192.0) / 12.0);
    updateActivePitchAndPressure();
  } else if (st == 208) {   // Channel Pressure (Aftertouch) -> pressure
    atMod_ = d1 > 0 ? (d1 / 127.0) : -1.0;
    updateActivePitchAndPressure();
  } else if (st == 176 && d1 == 1) {   // Mod Wheel -> pressure
    mwMod_ = d2 > 0 ? (d2 / 127.0) : -1.0;
    updateActivePitchAndPressure();
  } else if (st == 176 && d1 == 64) {   // Sustain Pedal
    bool on = d2 >= 64;
    if (sustain_ && !on) { sustain_ = false; releaseSustained(); }
    else sustain_ = on;
  } else if (st == 176 && d1 >= 20 && d1 <= 23) {
    static const int macro[4] = {he::P_MACRO_DREAD, he::P_MACRO_DISTANCE, he::P_MACRO_MATERIAL, he::P_MACRO_PITCH};
    int k = macro[d1 - 20]; midiParam(k, Controller::denorm(k, d2 / 127.0));
  }
}

void HorrorProcessor::processBlock(AudioBuffer<float>& buffer, MidiBuffer& midi) {
  ScopedNoDenormals nd;
  int n = buffer.getNumSamples(), outs = getTotalNumOutputChannels(), ins = getTotalNumInputChannels();
  if (!host_) prepareToPlay(getSampleRate() > 0 ? getSampleRate() : 48000, n);
  applyParams(false, n);
  host_->wantJunk = wantJunk.load();
  // Sync to host: the host's tempo, position and play state for the looper (CLAP's transport arrives here too, through
  // clap-juce-extensions). Without a tempo or while stopped the looper runs free, as in the web app.
  { he::Transport tr;
    if (auto* ph = getPlayHead()) if (auto pos = ph->getPosition()) {
      auto bpm = pos->getBpm(); auto ppq = pos->getPpqPosition();
      if (bpm && ppq && *bpm > 0) {
        tr.valid = true; tr.bpm = *bpm; tr.ppq = *ppq; tr.playing = pos->getIsPlaying();
        if (auto bar = pos->getPpqPositionOfLastBarStart()) tr.barPpq = *bar;
        if (auto ts = pos->getTimeSignature()) { tr.num = ts->numerator; tr.den = ts->denominator; }
      }
    }
    hostTempo = tr.valid ? (float)tr.bpm : 0.f;
    host_->transport(tr, syncToHost.load()); }
  { int s1, n1, s2, n2; fifo_.prepareToRead(fifo_.getNumReady(), s1, n1, s2, n2);
    for (int i = 0; i < n1; i++) { runEvent(events_[s1 + i]); events_[s1 + i].def.reset(); }
    for (int i = 0; i < n2; i++) { runEvent(events_[s2 + i]); events_[s2 + i].def.reset(); }
    fifo_.finishedRead(n1 + n2); }
  // your sound in: process in chunks bounded by preallocated inBuf_/outTmp_ so processBlock never allocates
  const int cap = jmax(1, jmin(inBuf_.getNumSamples(), outTmp_.getNumSamples()));
  const int src = inputSource.load();
  auto midiIt = midi.cbegin();
  const auto midiEnd = midi.cend();
  float pk = 0;
  for (int base = 0; base < n; base += cap) {
    const int cn = jmin(cap, n - base);
    if (src == IN_TRACK) {
      for (int c = 0; c < 2; c++) {
        if (c < ins) inBuf_.copyFrom(c, 0, buffer, c, base, cn);
        else if (ins > 0) inBuf_.copyFrom(c, 0, buffer, 0, base, cn);
        else inBuf_.clear(c, 0, cn);
      }
    } else if (src == IN_FILE) {
      inBuf_.clear(0, 0, cn); inBuf_.clear(1, 0, cn);
      SpinLock::ScopedTryLockType l(fileLock_);
      if (l.isLocked() && file_ && file_->getNumSamples() > 0) {
        int len = file_->getNumSamples(), fc = file_->getNumChannels();
        for (int i = 0; i < cn; i++) {
          if (filePos_ >= len) { if (fileLoop.load()) filePos_ = 0; else { fileEnded = true; break; } }
          inBuf_.setSample(0, i, file_->getSample(0, filePos_)); inBuf_.setSample(1, i, file_->getSample(fc > 1 ? 1 : 0, filePos_)); filePos_++;
        }
      }
    } else { inBuf_.clear(0, 0, cn); inBuf_.clear(1, 0, cn); }
    float* L = outTmp_.getWritePointer(0); float* R = outTmp_.getWritePointer(1);
    int pos = 0;
    while (midiIt != midiEnd) {
      const auto meta = *midiIt;
      int at = jlimit(0, n, meta.samplePosition) - base;
      if (at >= cn && base + cn < n) break;
      at = jlimit(0, cn, at);
      if (at > pos) { host_->render(L + pos, R + pos, at - pos, inBuf_.getReadPointer(0) + pos, inBuf_.getReadPointer(1) + pos); pos = at; }
      handleMidi(meta.getMessage());
      ++midiIt;
    }
    if (pos < cn) host_->render(L + pos, R + pos, cn - pos, inBuf_.getReadPointer(0) + pos, inBuf_.getReadPointer(1) + pos);
    if (outs > 0) buffer.copyFrom(0, base, outTmp_, 0, 0, cn);
    if (outs > 1) buffer.copyFrom(1, base, outTmp_, 1, 0, cn);
    else if (outs == 1) { buffer.addFrom(0, base, outTmp_, 1, 0, cn); buffer.applyGain(0, base, cn, .5f); }
    for (int c = 2; c < outs; c++) buffer.clear(c, base, cn);
    // the scope, peak meter and the last minute
    int w = scopeW.load();
    for (int i = 0; i < cn; i++) {
      scope[w] = .5f * (L[i] + R[i]); w = (w + 1) & 2047;
      pk = jmax(pk, std::abs(L[i]), std::abs(R[i]));
    }
    scopeW = w;
    {
      SpinLock::ScopedTryLockType rl(ringLock_);
      if (rl.isLocked()) {
        int rw = ringW_.load(), RN = ring_.getNumSamples();
        if (RN > 0) {
          for (int i = 0; i < cn; i++) {
            ring_.setSample(0, rw, L[i]); ring_.setSample(1, rw, R[i]);
            if (++rw >= RN) rw = 0;
          }
          ringW_ = rw; ringFill_ = jmin(RN, ringFill_.load() + cn);
        }
      }
    }
  }
  // smoothed output level for the board's Dread glow (atomic; the message thread only reads it)
  {
    float s = outputLevel_.load(std::memory_order_relaxed);
    float tau = (float)sr_ * (pk > s ? 0.02f : 0.12f);
    float coeff = tau > 0 ? 1.f - std::exp(-(float)n / tau) : 1.f;
    outputLevel_.store(s + (pk - s) * coeff, std::memory_order_relaxed);
  }
  // telemetry every 8 engine blocks, as the web app's host posts it
  blocks_ += n;
  if (blocks_ >= 8 * he::BL) {
    blocks_ = 0;
    int s1, n1, s2, n2; tmFifo_.prepareToWrite(1, s1, n1, s2, n2);
    if (n1) host_->telemetry(tms_[s1]); else if (n2) host_->telemetry(tms_[s2]); tmFifo_.finishedWrite(n1 + n2);
  }
  { SpinLock::ScopedTryLockType l(capLock_); if (l.isLocked() && !capReady_) { if (host_->takeCapture(cap_)) capReady_ = true; } }
}

bool HorrorProcessor::copyLastSeconds(double seconds, AudioBuffer<float>& out, double& sampleRate) {
  int RN = 0, nFrames = 0;
  {
    SpinLock::ScopedLockType rl(ringLock_);
    sampleRate = sr_;
    RN = ring_.getNumSamples();
    int fill = ringFill_.load(), want = (int)std::round(seconds * sr_);
    nFrames = jmin(fill, want, RN - (int)std::round(.5 * sr_)); nFrames = jmax(0, nFrames / he::BL * he::BL);
  }
  if (nFrames <= 0 || RN <= 0) return false;
  out.setSize(2, nFrames);
  SpinLock::ScopedLockType rl(ringLock_);
  if (ring_.getNumSamples() != RN) return false;
  int w = ringW_.load(), start = (w - nFrames + RN) % RN;
  for (int c = 0; c < 2; c++) {
    int first = jmin(nFrames, RN - start);
    out.copyFrom(c, 0, ring_, c, start, first);
    if (first < nFrames) out.copyFrom(c, first, ring_, c, 0, nFrames - first);
  }
  return true;
}

void HorrorProcessor::setInputFile(std::unique_ptr<AudioBuffer<float>> buf) {
  std::unique_ptr<AudioBuffer<float>> old;
  { SpinLock::ScopedLockType l(fileLock_); old = std::move(file_); file_ = std::move(buf); filePos_ = 0; fileEnded = false; }
}

int HorrorProcessor::getNumPrograms() { return he::NPRESET; }
int HorrorProcessor::getCurrentProgram() { return ctl_->presetIndexAtomic.load(); }
const String HorrorProcessor::getProgramName(int i) { return i >= 0 && i < he::NPRESET ? String(CharPointer_UTF8(he::PRESETS[i].name)) : String(); }
void HorrorProcessor::setCurrentProgram(int index) {
  if (index < 0 || index >= he::NPRESET) return;
  if (MessageManager::getInstanceWithoutCreating() && MessageManager::getInstance()->isThisTheMessageThread()) ctl_->loadPreset(index);
  else {
    ctl_->presetIndexAtomic = index;
    auto alive = alive_;
    MessageManager::callAsync([this, alive, index] { if (alive->load()) ctl_->loadPreset(index); });
  }
}

void HorrorProcessor::getStateInformation(MemoryBlock& dest) {
  auto st = apvts.copyState();
  st.removeChild(st.getChildWithName("SEANCE"), nullptr);
  st.appendChild(ctl_->saveState(), nullptr);
  std::unique_ptr<XmlElement> x(st.createXml()); copyXmlToBinary(*x, dest);
}
void HorrorProcessor::setStateInformation(const void* data, int size) {
  std::unique_ptr<XmlElement> x(getXmlFromBinary(data, size));
  if (!x || !x->hasTagName(apvts.state.getType())) return;
  auto st = ValueTree::fromXml(*x); auto extra = st.getChildWithName("SEANCE").createCopy();
  st.removeChild(st.getChildWithName("SEANCE"), nullptr);
  apvts.replaceState(st);
  // Load synchronously under stateLock (push() is thread-safe) so offline bounces never race callAsync
  ctl_->loadState(extra);
}

AudioProcessorEditor* HorrorProcessor::createEditor() { return new HorrorEditor(*this); }
AudioProcessor* JUCE_CALLTYPE createPluginFilter() { return new HorrorProcessor(); }
