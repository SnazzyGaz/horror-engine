// Horror Engine · Séance plugin controller (see Controller.h). Horror Engine by Garyck Arntzen. GNU AGPLv3.
#include "Controller.h"
#include "PluginProcessor.h"
#include "Json.h"
#include "he_presets.gen.h"

using namespace juce;

const VoiceInfo SRC[he::NS] = {
  {"E-bow String", "A slack string held in endless sustain by a magnetic driver: wails, harmonic flips, distorted screams. Press harder and the slack string bends sharp. Switch Excite to Strike or Pluck and it becomes a Blaster Beam: hit it, then slide the bar.", "Slide (Slide range octaves either side)", "Driver position", "Press harder to drive harder and bend it up"},
  {"Hurdy-Gurdy", "Three strings on a rosined wheel. The drone bed; Dread bends the fifth to a tritone.", "Melody, when switched on", "", "Move faster to crank harder. Jerk it for the buzz."},
  {"Bowed Metal", "Rulers, rods, saw blades and clock springs under a bow. Whoops, whines and screeches. A ruler is pitched by how far it hangs over the edge; changing bow pressure makes the note jump between modes. Add Water for a waterphone.", "Bow position", "Bend / overhang", "The bow is your speed: no motion, no sound. Change pressure to jump modes."},
  {"Glass", "Stick-slip friction on glass. From a singing wine glass (wet finger, with its slow circling beat) to nails on a pane.", "Contact point", "Dull to shrill", "Scrape speed sets the judder; a finger circles faster with speed"},
  {"Struck Metal", "Ruler twangs, rod pings, bells and knocks on the cabinet. Polyphonic. A ruler's pitch comes from its length; Water makes rods and bells wobble.", "Pitch: 1\xc2\xbd octaves either side (ruler: overhang)", "Strike position", "Tap. Pressure is velocity."},
  {"Spring Tank", "A reverb tank you can hit, shake, scrape or hold in sustain with an e-bow. Each echo drips downward: highs first, lows last. Also the Spring send for every other voice.", "", "", "Tap to hit, scrub to shake or scrape; E-bow mode sustains while you hold"},
  {"Junk Tray", "Nuts and bolts dragged over a tray by a magnet underneath. Rattles, ticks, skittering.", "Magnet", "Magnet", "Drag the magnet; the pieces chase it"},
  {"Aura", "A granular pad made from the last few seconds of the machine itself. Freeze holds it forever.", "Scrub back through the last 8 s", "Blur", "Silent until another voice has played"},
  {"Superball", "A rubber ball on a flexible stick dragged over a drumhead, a steel sheet or the wooden cabinet. It sticks and slips: moans, groans and whale calls that rise as you press.", "Contact point", "Handle angle: bends the moan", "Drag to moan. Press harder to raise it."}};
const char* const ROMAN[he::NS] = {"I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"};
const char* const HE_S[he::NS] = {"ebow", "hurdy", "bowed", "glass", "struck", "spring", "junk", "aura", "moan"};
const MomentInfo MOMENTS[5] = {{"riser", "Riser", "8 s climb, hard cut"}, {"stinger", "Stinger", "Swell into a hit"}, {"drone", "Drone bed", "Wheel, string, freeze"}, {"heart", "Heartbeat", "Follows Dread"}, {"walls", "In the walls", "Skitters, scrapes and drips"}};
const char* const Controller::OFF_KEYS[4] = {"tune", "cents", "matOff", "distOff"};
static const char* const SRC_IDS[he::NS] = {"ebow", "hurdy", "bowedMetal", "glass", "struckMetal", "springTank", "junkTray", "aura", "superball"};
static const char* VERSION = "1.4.0";
static const char* AUTHOR = "Garyck Arntzen";
static const char* CREDIT = "https://x.com/_mintydoge";
static const char* SHARE_BASE = "https://snazzygaz.github.io/horror-engine/";

static String U(const char* s) { return String(CharPointer_UTF8(s)); }
static String label(int k) { return U(he::PARAMS[k].label); }

Controller::Controller(HorrorProcessor& p) : p_(p) {
  StringArray f; auto v = JSON::parse(settings().getValue("fav", "[]")); if (auto* a = v.getArray()) for (auto& x : *a) f.add(x.toString());
  favs_ = f;
  startTimerHz(30);
}
Controller::~Controller() { stopTimer(); }

PropertiesFile& Controller::settings() {
  if (!settings_) { PropertiesFile::Options o; o.applicationName = "HorrorEngineSeance"; o.filenameSuffix = ".settings"; o.osxLibrarySubFolder = "Application Support"; o.folderName = "Horror Engine"; settings_ = std::make_unique<PropertiesFile>(o); }
  return *settings_;
}

void Controller::send(const UiEvent& e) { p_.push(e); }
void Controller::toast(const String& t) { toastText = t; toastAt = Time::getMillisecondCounter(); toastSeq++; }

/* ---------- parameters ---------- */
int Controller::indexOf(const String& id) { for (int i = 0; i < he::NPARAM; i++) if (id == he::PARAMS[i].id) return i; return -1; }
double Controller::norm(int k, double v) { const auto& d = he::PARAMS[k]; return d.exp ? std::log(v / d.min) / std::log(d.max / d.min) : (v - d.min) / (d.max - d.min); }
double Controller::denorm(int k, double n) {
  const auto& d = he::PARAMS[k]; n = jlimit(0.0, 1.0, n);
  double v = d.exp ? d.min * std::pow(d.max / d.min, n) : d.min + (d.max - d.min) * n;
  return d.isInt ? std::floor(v + .5) : v;
}
double Controller::midiValue(int k, int v7) {
  const auto& d = he::PARAMS[k]; double n = v7 / 127.0;
  if (d.nEnum) return std::floor(n * (d.nEnum - 1) + .5);
  if (d.sw) return n >= .5 ? 1 : 0;
  return denorm(k, n);
}
static String fixed(double v, int dec) { return String(v, dec); }
static String jsRound(double v) { return String((int64)std::floor(v + .5)); }
String Controller::fmt(int k, double v) {
  const auto& d = he::PARAMS[k]; String u(d.unit);
  if (d.isInt) return String((int64)std::floor(v + .5));
  if (u == "dB") return (v <= -59.5 ? U("-\xe2\x88\x9e") : (v > 0 ? "+" : "") + fixed(v, 1)) + " dB";
  if (u == "Hz") return (v < 100 ? fixed(v, 1) : jsRound(v)) + " Hz";
  if (u == "ms") return jsRound(v) + " ms";
  if (u == "s") return fixed(v, v < 10 ? 2 : 1) + " s";
  if (u == "st") return (v > 0 ? "+" : "") + fixed(v, 1) + " st";
  if (u == "x") return fixed(v, 2) + U("\xc3\x97");
  if (u == "oct") return fixed(v, 1) + " oct";
  if (u == "cm") return fixed(v, 1) + " cm";
  if (u == "c") return (v > 0 ? "+" : "") + jsRound(v) + " c";
  if (u == "%") return (v > 0 ? "+" : "") + jsRound(v * 100) + "%";
  if (u == "rev/s") return fixed(v, 2) + " /s";
  if (d.bi) return (v > 0 ? "+" : "") + fixed(v, 2);
  return jsRound(v * 100) + "%";
}
double Controller::P(int k) const { return p_.value(k); }

void Controller::beginGesture(int k) { if (gestureDepth_[k]++ == 0) p_.param(k)->beginChangeGesture(); }
void Controller::endGesture(int k) { if (gestureDepth_[k] > 0 && --gestureDepth_[k] == 0) p_.param(k)->endChangeGesture(); }

void Controller::setParam(int k, double v, bool quiet) {
  if (k < 0 || k >= he::NPARAM) return;
  double from = P(k);
  auto* prm = p_.param(k); float n = prm->convertTo0to1((float)v);
  bool own = gestureDepth_[k] == 0; if (own) prm->beginChangeGesture();
  prm->setValueNotifyingHost(n);
  if (own) prm->endChangeGesture();
  double to = P(k);
  hNote(k, from, to);
  if (k == he::P_GLASS_GUARD && v < .5 && !quiet) toast("Ear guard off: nail and chalk on glass can get painfully loud between 2 and 5 kHz. Keep headphone volume down.");
  String id(he::PARAMS[k].id);
  if (id.endsWith(".mute") || id.endsWith(".hold")) offSure = false;
  for (int s = 0; s < he::NS; s++) for (auto q : OFF_KEYS) if (id == String(HE_S[s]) + "." + q) offSure = false;
  paramVersion++;
}

/* ---------- undo / redo: one timeline for knob, switch and preset changes and the looper ----------
   Knob drags, Defaults, Reset, presets, loaded files are one step each; wheel, key and MIDI moves on the same control
   within 0.8 s merge. Looper changes are steps too: the audio thread counts its own undo points. */
void Controller::hNote(int k, double from, double to) {
  if (hMute_ || from == to) return;
  if (hGrp_) { for (auto& c : hGrp_->ch) if (c.first == k) { c.second.second = to; return; } hGrp_->ch.push_back({k, {from, to}}); return; }
  int64 now = Time::currentTimeMillis();
  if (hpos_ > 0) {
    HEntry& e = hist_[(size_t)hpos_ - 1];
    if (e.autoId == k && hpos_ == (int)hist_.size() && now - e.t < 800) {
      e.ch[0].second.second = to; e.t = now;
      if (e.ch[0].second.first == to) { hist_.erase(hist_.begin() + (hpos_ - 1)); hpos_--; }
      return;
    }
  }
  HEntry e; e.ch.push_back({k, {from, to}}); e.autoId = k; e.t = now; e.label = label(k); histPush(e);
}
void Controller::histPush(const HEntry& e) { hist_.resize((size_t)hpos_); hist_.push_back(e); if (hist_.size() > 200) hist_.erase(hist_.begin()); hpos_ = (int)hist_.size(); }
void Controller::hBegin(const String& lab) { if (hGrp_) hEnd(); hGrp_ = std::make_unique<HEntry>(); hGrp_->label = lab; hGrp_->t = Time::currentTimeMillis(); }
void Controller::hEnd() {
  if (!hGrp_) return; auto g = std::move(hGrp_);
  g->ch.erase(std::remove_if(g->ch.begin(), g->ch.end(), [](auto& c) { return c.second.first == c.second.second; }), g->ch.end());
  if (g->ch.empty()) return; histPush(*g);
}
String Controller::hName(const HEntry& e) const { if (e.k == 'l') return "a looper change"; return e.label + (e.autoId >= 0 || e.ch.size() < 2 ? String() : " (" + String((int)e.ch.size()) + " settings)"); }
void Controller::hApply(const HEntry& e, bool back) {
  if (e.k == 'l') { loopCmd(back ? LA_UNDO : LA_REDO); return; }
  hMute_++; for (auto& c : e.ch) setParam(c.first, back ? c.second.first : c.second.second); hMute_--;
  if (e.offDef) { offUndo_.clear(); }
}
void Controller::undo() { if (hGrp_) hEnd(); if (!hpos_) { toast("Nothing to undo."); return; } const HEntry e = hist_[(size_t)--hpos_]; hApply(e, true); toast("Undo: " + hName(e)); }
void Controller::redo() { if (hGrp_) hEnd(); if (hpos_ >= (int)hist_.size()) { toast("Nothing to redo."); return; } const HEntry e = hist_[(size_t)hpos_++]; hApply(e, false); toast("Redo: " + hName(e)); }
String Controller::undoTitle() const { return hpos_ ? "Undo " + hName(hist_[(size_t)hpos_ - 1]) + " (Ctrl+Z)" : "Nothing to undo (Ctrl+Z)"; }
String Controller::redoTitle() const { return hpos_ < (int)hist_.size() ? "Redo " + hName(hist_[(size_t)hpos_]) + " (Ctrl+Y)" : "Nothing to redo (Ctrl+Y)"; }
void Controller::hLoop(int uc) { if (ucSeen_ < 0 || uc < ucSeen_) { ucSeen_ = uc; return; } while (ucSeen_ < uc) { ucSeen_++; HEntry e; e.k = 'l'; histPush(e); } }

/* ---------- voices ---------- */
void Controller::releaseAll() { UiEvent e; e.type = UiEvent::RELEASE_ALL; e.voice = sel_; e.on = padDown; send(e); padDown = false; }
void Controller::select(int i) {
  if (i < 0 || i >= he::NS) return;
  if (i != sel_) releaseAll();
  sel_ = i; p_.selVoice = i; p_.wantJunk = i == he::JUNK; offSure = false; version++;
}
int Controller::setOct(int n) { octave_ = jlimit(-2, 4, n); return octave_; }
void Controller::noteOn(int tag, double hz, double vel) { UiEvent e; e.type = UiEvent::NOTE_ON; e.tag = tag; e.hz = (float)hz; e.p = (float)vel; send(e); }
void Controller::noteOff(int tag) { UiEvent e; e.type = UiEvent::NOTE_OFF; e.tag = tag; send(e); }
void Controller::gesture(char k, double x, double y, double p) { UiEvent e; e.type = UiEvent::GESTURE; e.voice = sel_; e.kind = k; e.x = (float)x; e.y = (float)y; e.p = (float)p; send(e); }
void Controller::toggleHold() { int k = indexOf(String(HE_S[sel_]) + ".hold"); setParam(k, P(k) > .5 ? 0 : 1); }
void Controller::toggleFreeze() { setParam(he::P_AURA_FREEZE, P(he::P_AURA_FREEZE) > .5 ? 0 : 1); }
void Controller::panic() {
  inputStop(); releaseAll();
  for (int s = 0; s < he::NS; s++) { int k = indexOf(String(HE_S[s]) + ".hold"); if (P(k) > .5 && s != he::AURA) setParam(k, 0); }
  if (P(he::P_AURA_FREEZE) > .5) setParam(he::P_AURA_FREEZE, 0);
  UiEvent e; e.type = UiEvent::PANIC; send(e);
}

bool Controller::offDirty(int s) const { for (auto q : OFF_KEYS) { int k = indexOf(String(HE_S[s]) + "." + q); if (P(k) != he::PARAMS[k].def) return true; } return false; }
bool Controller::anyOffDirty() const { for (int s = 0; s < he::NS; s++) if (offDirty(s)) return true; return false; }
void Controller::resetOff(int s) {
  hBegin("Reset " + U(SRC[s].n) + " Tune & place");
  for (auto q : OFF_KEYS) { int k = indexOf(String(HE_S[s]) + "." + q); setParam(k, he::PARAMS[k].def); }
  hEnd();
  toast("Tune, material and distance for this instrument are back to zero (Ctrl+Z undoes it).");
}
void Controller::offDefaults() {
  if (!offUndo_.empty()) {
    auto snap = offUndo_; offUndo_.clear(); offUndoT_ = 0;
    // the Defaults step is still the newest one: step back through the timeline; otherwise put the offsets back as a new step
    if (hpos_ && hpos_ - 1 == offGrp_ && hist_[(size_t)hpos_ - 1].offDef) { undo(); return; }
    hBegin("Restore instrument offsets"); for (auto& kv : snap) setParam(kv.first, kv.second); hEnd(); toast("Instrument offsets restored."); return;
  }
  if (!anyOffDirty()) return;
  if (!offSure) { offSure = true; return; }
  offSure = false;
  for (int s = 0; s < he::NS; s++) for (auto q : OFF_KEYS) { int k = indexOf(String(HE_S[s]) + "." + q); offUndo_[k] = P(k); }
  hBegin("Defaults (every instrument's Tune & place)"); hGrp_->offDef = true;
  for (int s = 0; s < he::NS; s++) for (auto q : OFF_KEYS) { int k = indexOf(String(HE_S[s]) + "." + q); setParam(k, he::PARAMS[k].def); }
  size_t before = hist_.size(); hEnd(); offGrp_ = hist_.size() > before || (hpos_ > 0 && hist_[(size_t)hpos_ - 1].offDef) ? hpos_ - 1 : -1;
  toast("All instrument offsets are back to zero. Press Undo on Defaults (or Ctrl+Z) if that went too far.");
  offUndoT_ = Time::getMillisecondCounter() + 8000;
}

/* ---------- presets ---------- */
String Controller::presetName() const { return U(he::PRESETS[preset_].name); }
static std::vector<double> presetVals(int i) {
  std::vector<double> v(he::NPARAM); for (int k = 0; k < he::NPARAM; k++) v[(size_t)k] = he::PARAMS[k].def;
  for (int j = 0; j < he::PRESETS[i].n; j++) v[(size_t)he::PRESETS[i].values[j].param] = he::PRESETS[i].values[j].value;
  return v;
}
static bool isInputParam(int k) { return String(he::PARAMS[k].id).startsWith("input."); }
bool Controller::edited() const {
  auto v = presetVals(preset_);
  for (int k = 0; k < he::NPARAM; k++) { if (isInputParam(k)) continue; const auto& d = he::PARAMS[k]; if (std::abs(P(k) - v[(size_t)k]) > 1e-6 * (d.max - d.min) + 1e-9) return true; }
  return false;
}
void Controller::loadPreset(int i) {
  if (i < 0 || i >= he::NPRESET) return;
  preset_ = i; presetIndexAtomic = i;
  applyAll(presetVals(i), "Preset " + presetName()); toast("Preset: " + presetName());
  p_.updateHostDisplay(AudioProcessorListener::ChangeDetails().withProgramChanged(true));
}
// presets, loaded files and share links: one undo step; your sound-in settings belong to the session and stay
void Controller::applyAll(const std::vector<double>& vals, const String& lab) {
  HEntry h; h.label = lab.isEmpty() ? String("Load settings") : lab; h.t = Time::currentTimeMillis();
  hMute_++;
  for (int k = 0; k < he::NPARAM; k++) {
    if (isInputParam(k)) continue;
    const auto& d = he::PARAMS[k]; double v = k < (int)vals.size() && std::isfinite(vals[(size_t)k]) ? jlimit(d.min, d.max, vals[(size_t)k]) : d.def;
    double from = P(k); setParam(k, v, true); double to = P(k);
    if (from != to) h.ch.push_back({k, {from, to}});
  }
  hMute_--;
  if (!h.ch.empty() && !hMute_) histPush(h);
  offUndo_.clear(); offSure = false; version++;
}
void Controller::star(const String& n) { if (favs_.contains(n)) favs_.removeString(n); else favs_.add(n); saveFavs(); version++; }
void Controller::saveFavs() { var a; for (auto& f : favs_) a.append(f); settings().setValue("fav", hejson::stringify(a)); settings().saveIfNeeded(); }

String Controller::stamp() { return Time::getCurrentTime().formatted("%Y%m%d-%H%M%S"); }

void Controller::saveFile(const String& name, const String& filters, std::function<bool(const File&)> write, std::function<void(const File&)> ok) {
  chooser_ = std::make_unique<FileChooser>("Save " + name, File::getSpecialLocation(File::userDocumentsDirectory).getChildFile(name), filters);
  chooser_->launchAsync(FileBrowserComponent::saveMode | FileBrowserComponent::canSelectFiles | FileBrowserComponent::warnAboutOverwriting, [this, write, ok](const FileChooser& fc) {
    File f = fc.getResult(); if (f == File()) return;
    if (write(f)) ok(f); else toast("This view cannot save files.");
  });
}

static var paramsVar(const Controller& c) { var P = hejson::obj(); for (int k = 0; k < he::NPARAM; k++) hejson::set(P, he::PARAMS[k].id, c.P(k)); return P; }

void Controller::savePresetFile() {
  String t = "horror-engine-preset-" + stamp();
  var src = hejson::obj(), fx = hejson::obj(), rv = hejson::obj(), ms = hejson::obj();
  for (int k = 0; k < he::NPARAM; k++) {
    String id(he::PARAMS[k].id), g = id.upToFirstOccurrenceOf(".", false, false), key = id.fromFirstOccurrenceOf(".", false, false);
    int si = -1; for (int s = 0; s < he::NS; s++) if (g == HE_S[s]) si = s;
    if (si >= 0) {
      var o = src.getProperty(SRC_IDS[si], var());
      if (!o.isObject()) { o = hejson::obj(); hejson::set(o, "enabled", true); hejson::set(src, SRC_IDS[si], o); }
      hejson::set(o, key.toRawUTF8(), P(k)); if (key == "mute") hejson::set(o, "enabled", P(k) < .5);
    } else if (g == "rev") hejson::set(rv, key.toRawUTF8(), P(k)); else if (g == "master") hejson::set(ms, key.toRawUTF8(), P(k));
  }
  hejson::set(fx, "reverb", rv); hejson::set(fx, "master", ms);
  var mac = hejson::obj(); hejson::set(mac, "dread", P(he::P_MACRO_DREAD)); hejson::set(mac, "distance", P(he::P_MACRO_DISTANCE)); hejson::set(mac, "material", P(he::P_MACRO_MATERIAL)); hejson::set(mac, "pitchStretch", P(he::P_MACRO_PITCH));
  var out = hejson::obj();
  hejson::set(out, "format", "horror-engine.preset"); hejson::set(out, "version", VERSION); hejson::set(out, "name", t); hejson::set(out, "author", AUTHOR); hejson::set(out, "seed", 1337);
  hejson::set(out, "macros", mac); hejson::set(out, "sources", src); hejson::set(out, "fx", fx); hejson::set(out, "params", paramsVar(*this));
  if (!CMS.empty()) { var a; for (auto& c : CMS) a.append(c.toVar()); hejson::set(out, "customMoments", a); }
  hejson::set(out, "credit", CREDIT);
  String text = hejson::stringify(out, 1);
  saveFile(t + ".json", "*.json", [text](const File& f) { return f.replaceWithText(text); }, [this, t](const File&) { toast("Preset saved as " + t + ".json"); });
}

// flat registry values from a preset (ours carries "params"; a spec-style preset is mapped by key name)
static std::vector<double> fromPreset(const var& j) {
  std::vector<double> P(he::NPARAM); for (int k = 0; k < he::NPARAM; k++) P[(size_t)k] = he::PARAMS[k].def;
  auto put = [&](const String& id, const var& v) {
    int k = Controller::indexOf(id); if (k < 0) return; const auto& d = he::PARAMS[k];
    if ((v.isDouble() || v.isInt() || v.isInt64()) && std::isfinite((double)v)) P[(size_t)k] = jlimit(d.min, d.max, (double)v);
    else if (v.isBool() && d.sw) P[(size_t)k] = (bool)v ? 1 : 0;
  };
  if (auto* o = j.getProperty("params", var()).getDynamicObject()) { for (auto& p : o->getProperties()) put(p.name.toString(), p.value); return P; }
  var m = j.getProperty("macros", var()); put("macro.dread", m.getProperty("dread", var())); put("macro.distance", m.getProperty("distance", var())); put("macro.material", m.getProperty("material", var())); put("macro.pitch", m.getProperty("pitchStretch", var()));
  if (auto* s = j.getProperty("sources", var()).getDynamicObject())
    for (auto& sp : s->getProperties()) {
      int g = -1; for (int i = 0; i < he::NS; i++) if (sp.name.toString() == SRC_IDS[i]) g = i; if (g < 0) continue;
      if (auto* so = sp.value.getDynamicObject()) for (auto& kv : so->getProperties()) put(String(HE_S[g]) + "." + kv.name.toString(), kv.value);
      if (sp.value.getProperty("enabled", var()).isBool() && !(bool)sp.value.getProperty("enabled", var())) P[(size_t)Controller::indexOf(String(HE_S[g]) + ".mute")] = 1;
    }
  var f = j.getProperty("fx", var());
  if (auto* r = f.getProperty("reverb", var()).getDynamicObject()) for (auto& kv : r->getProperties()) put("rev." + kv.name.toString(), kv.value);
  if (auto* r = f.getProperty("master", var()).getDynamicObject()) for (auto& kv : r->getProperties()) put("master." + kv.name.toString(), kv.value);
  return P;
}
static bool isNum(const var& v) { return v.isDouble() || v.isInt() || v.isInt64(); }
static bool versionOk(const var& v) { String s = v.toString(); if (!v.isString() || !s.startsWith("1.")) return false; auto parts = StringArray::fromTokens(s, ".", ""); if (parts.size() != 3) return false; for (auto& p : parts) if (p.isEmpty() || !p.containsOnly("0123456789")) return false; return true; }
// the checks of io.js's schemas that matter for loading (format, version, value types, custom moments)
static StringArray checkFile(const var& j, const std::function<bool(const var&)>& cmValid) {
  StringArray e;
  if (!j.isObject()) { e.add("not a JSON object"); return e; }
  String f = j.getProperty("format", var()).toString();
  if (f != "horror-engine.preset" && f != "horror-engine.performance" && f != "horror-engine.moment") { e.add("format must be horror-engine.performance, horror-engine.preset or horror-engine.moment"); return e; }
  if (!versionOk(j.getProperty("version", var()))) e.add("$.version: does not match ^1\\.\\d+\\.\\d+$");
  auto cms = [&](const var& list, const String& path) { if (list.isVoid()) return; if (!list.isArray()) { e.add(path + ": expected array"); return; } for (int i = 0; i < list.size(); i++) if (!cmValid(list[i])) e.add(path + "[" + String(i) + "]: not a valid custom moment"); };
  if (f == "horror-engine.moment") {
    var m = j.getProperty("moment", var()), ms = j.getProperty("moments", var());
    if (!m.isVoid() && !cmValid(m)) e.add("$.moment: not a valid custom moment");
    cms(ms, "$.moments");
    return e;
  }
  var pr = f == "horror-engine.performance" ? j.getProperty("preset", var()) : j;
  if (f == "horror-engine.performance" && !pr.isObject()) e.add("$: missing \"preset\"");
  if (auto* o = pr.getProperty("params", var()).getDynamicObject()) for (auto& p : o->getProperties()) if (!isNum(p.value) && !p.value.isBool()) e.add("$.params." + p.name.toString() + ": expected number");
  cms(j.getProperty("customMoments", var()), "$.customMoments");
  return e;
}

void Controller::loadPresetFile() {
  chooser_ = std::make_unique<FileChooser>("Load a preset or performance file", File::getSpecialLocation(File::userDocumentsDirectory), "*.json");
  chooser_->launchAsync(FileBrowserComponent::openMode | FileBrowserComponent::canSelectFiles, [this](const FileChooser& fc) {
    File file = fc.getResult(); if (!file.existsAsFile()) return;
    var j = JSON::parse(file.loadFileAsString());
    auto errs = checkFile(j, [this](const var& c) { return cmValid(c); });
    String f = j.getProperty("format", var()).toString();
    if (f == "horror-engine.moment") { if (errs.size()) toast("Not loaded: " + errs[0]); else cmImport(j); return; }
    if (errs.size()) { toast("Not loaded: " + errs[0] + (errs.size() > 1 ? " (+" + String(errs.size() - 1) + " more)" : String())); return; }
    auto v = fromPreset(f == "horror-engine.performance" ? j.getProperty("preset", var()) : j);
    if (f == "horror-engine.performance") if (auto* a = j.getProperty("liveEvents", var()).getArray())
      for (auto& e : *a) if (e.getProperty("type", var()).toString() == "param") { int k = indexOf(e.getProperty("param", var()).toString()); if (k >= 0 && isNum(e.getProperty("value", var()))) v[(size_t)k] = e.getProperty("value", var()); }
    int nm = j.hasProperty("customMoments") ? cmMerge(j.getProperty("customMoments", var())) : 0;
    applyAll(v, "Load " + file.getFileName());
    toast((nm ? String(nm) + " moment" + (nm > 1 ? "s" : "") + " added. " : String()) + (f == "horror-engine.performance" ? "Loaded the sound of " + file.getFileName() + "." : "Loaded " + file.getFileName()));
  });
}

/* ---------- MIDI learn ---------- */
void Controller::pick(bool on) { picking = on; if (on) toast("MIDI learn: click the knob, switch or selector to control. Esc cancels."); }
void Controller::learnStart(int k) {
  learnId_ = k; learnT_ = Time::getMillisecondCounter() + 30000; p_.learnArmed = k + 1; version++;
  toast("MIDI learn: move a knob, fader or button on your controller for " + label(k) + ". Esc cancels.");
}
int Controller::learnStop() { int was = learnId_; learnId_ = -1; learnT_ = 0; p_.learnArmed = 0; version++; return was; }
String Controller::mmDesc(const String& key) { auto a = StringArray::fromTokens(key, ":", ""); return "CC " + a[2] + ", channel " + String(a[1].getIntValue() + 1); }
String Controller::mmKeyOf(int k) const { for (auto& kv : mmap_) if (kv.second == k) return kv.first; return {}; }
void Controller::learnGot(int ch, int cc) { const ScopedLock stateGuard(stateLock);
  int k = learnStop(); if (k < 0) return;
  String key = "cc:" + String(ch) + ":" + String(cc), old = mmKeyOf(k); if (old.isNotEmpty()) mmap_.erase(old);
  int prev = mmap_.count(key) ? mmap_[key] : -1; mmap_[key] = k; mmSync();
  String note = prev >= 0 && prev != k ? " (it no longer moves " + label(prev) + ")" : cc >= 20 && cc <= 23 ? String(" (instead of its macro on this channel)") : cc >= 24 && cc <= 43 ? " (instead of moment " + String(cc - 23) + " on this channel)" : String();
  toast(mmDesc(key) + " now moves " + label(k) + note + ".");
}
void Controller::mmForget(int k) { const ScopedLock stateGuard(stateLock); String key = mmKeyOf(k); if (key.isNotEmpty()) { mmap_.erase(key); mmSync(); toast("Forgot " + mmDesc(key) + " for " + label(k) + "."); } }
void Controller::mmForgetAll() { const ScopedLock stateGuard(stateLock); int n = (int)mmap_.size(); mmap_.clear(); mmSync(); toast("Forgot " + String(n) + " MIDI mapping" + (n == 1 ? "" : "s") + "."); }
void Controller::mmSync() {
  for (auto& row : p_.mmap) for (auto& c : row) c = -1;
  for (auto& kv : mmap_) { auto a = StringArray::fromTokens(kv.first, ":", ""); int ch = a[1].getIntValue(), cc = a[2].getIntValue(); if (ch >= 0 && ch < 16 && cc >= 0 && cc <= 119) p_.mmap[ch][cc] = kv.second; }
  version++;
}

/* ---------- moments ---------- */
bool Controller::momentOn(int i) const { switch (i) { case 0: return tm.riser >= 0; case 1: return tm.stinger; case 2: return tm.drone; case 3: return tm.heart; case 4: return tm.walls; } return false; }
void Controller::momentToggle(int i) { UiEvent e; e.type = UiEvent::MOMENT; e.id = i; send(e); }
void Controller::momentN(int n) { if (n < 5) momentToggle(n); else if (n - 5 < (int)CMS.size()) cmToggle(CMS[(size_t)n - 5]); }
float Controller::cmPlaying(const CustomMoment& c) const { for (int i = 0; i < tm.nCm; i++) if (tm.cmId[i] == c.handle) return tm.cmPos[i]; return -1; }
void Controller::cmToggle(const CustomMoment& c) { UiEvent e; e.type = UiEvent::CMOMENT; e.id = c.handle; send(e); }

var CustomMoment::toVar() const {
  var o = hejson::obj(); hejson::set(o, "id", id); hejson::set(o, "name", name); hejson::set(o, "voice", voice); hejson::set(o, "len", len);
  if (created.isNotEmpty()) hejson::set(o, "created", created);
  hejson::set(o, "ev", ev.isArray() ? ev : var(Array<var>())); if (lanes.isArray()) hejson::set(o, "lanes", lanes);
  return o;
}
bool Controller::cmValid(const var& c) const {
  if (!c.isObject()) return false;
  var id = c.getProperty("id", var()), nm = c.getProperty("name", var()), len = c.getProperty("len", var()), ev = c.getProperty("ev", var()), vo = c.getProperty("voice", var()), ln = c.getProperty("lanes", var());
  if (!id.isString() || id.toString().isEmpty() || !nm.isString() || nm.toString().isEmpty()) return false;
  if (!isNum(len) || (double)len < 0 || (double)len > 600) return false;
  if (!vo.isVoid() && (!isNum(vo) || (double)vo != std::floor((double)vo) || (int)vo < -1 || (int)vo > 8)) return false;
  if (!ev.isArray()) return false;
  for (auto& e : *ev.getArray()) {
    if (!e.isArray() || e.size() < 3 || e.size() > 7) return false;
    if (!isNum(e[0]) || (double)e[0] < 0 || !isNum(e[1]) || (double)e[1] != std::floor((double)e[1]) || (int)e[1] < 0 || (int)e[1] > 8) return false;
    String k = e[2].toString(); if (!e[2].isString() || (k != "d" && k != "m" && k != "u")) return false;
    for (int i = 3; i < e.size(); i++) if (!isNum(e[i])) return false;
  }
  if (!ln.isVoid()) {
    if (!ln.isArray()) return false;
    for (auto& L : *ln.getArray()) {
      if (!L.isObject() || !L.getProperty("k", var()).isString() || !isNum(L.getProperty("min", var())) || !isNum(L.getProperty("max", var())) || !L.getProperty("pts", var()).isArray()) return false;
      for (auto q : { "exp", "int", "abs" }) if (!L.getProperty(q, var()).isVoid() && !L.getProperty(q, var()).isBool()) return false;
      for (auto& q : *L.getProperty("pts", var()).getArray()) if (!q.isArray() || q.size() != 2 || !isNum(q[0]) || (double)q[0] < 0 || !isNum(q[1])) return false;
    }
  }
  return true;
}
CustomMoment Controller::fromVar(const var& c) const {
  CustomMoment m; m.id = c.getProperty("id", var()).toString(); m.name = c.getProperty("name", var()).toString(); m.created = c.getProperty("created", var()).toString();
  m.voice = c.hasProperty("voice") ? (int)c.getProperty("voice", var()) : -1; m.len = c.getProperty("len", var()); m.ev = c.getProperty("ev", var()); m.lanes = c.getProperty("lanes", var());
  return m;
}
static std::shared_ptr<const he::CmDefinition> toDefinition(const CustomMoment& c) {
  auto d = std::make_shared<he::CmDefinition>(); d->voice = c.voice; d->len = c.len;
  if (auto* a = c.ev.getArray()) for (auto& e : *a) {
    if (!e.isArray() || e.size() < 3) continue;
    auto n = [&](int i) { return i < e.size() && isNum(e[i]) ? (double)e[i] : 0.0; };
    he::CmEvent x; x.t = n(0); x.s = (int)n(1); x.k = e[2].toString()[0] ? (char)e[2].toString()[0] : 'm'; x.x = n(3); x.y = n(4); x.p = n(5); x.hz = n(6); d->ev.push_back(x);
  }
  if (auto* a = c.lanes.getArray()) for (auto& L : *a) {
    he::CmLaneDef l; l.k = Controller::indexOf(L.getProperty("k", var()).toString()); if (l.k < 0) continue;
    l.min = L.getProperty("min", var()); l.max = L.getProperty("max", var()); l.exp = L.getProperty("exp", false); l.isInt = L.getProperty("int", false); l.abs = L.getProperty("abs", false);
    if (auto* pts = L.getProperty("pts", var()).getArray()) for (auto& q : *pts) l.pts.push_back({(double)q[0], (double)q[1]});
    d->lanes.push_back(l);
  }
  return d;
}
std::vector<std::pair<int, std::shared_ptr<const he::CmDefinition>>> Controller::engineDefinitions() const {
  std::vector<std::pair<int, std::shared_ptr<const he::CmDefinition>>> out; for (auto& c : CMS) out.push_back({c.handle, toDefinition(c)}); return out;
}
void Controller::cmSend(const CustomMoment& c) { UiEvent e; e.type = UiEvent::CMDEF; e.id = c.handle; e.def = toDefinition(c); send(e); }
void Controller::cmSync() { int n = jmin(64, (int)CMS.size()); for (int i = 0; i < n; i++) p_.cmOrder[i] = CMS[(size_t)i].handle; p_.cmCount = n; version++; }
String Controller::cmFreeName() const { for (int n = 5 + (int)CMS.size() + 1;; n++) { String nm = "Moment " + String(n); bool used = false; for (auto& c : CMS) if (c.name == nm) used = true; if (!used) return nm; } }
static String cmId() {
  auto b36 = [](int64 v) { String s; const char* d = "0123456789abcdefghijklmnopqrstuvwxyz"; if (v == 0) return String("0"); while (v > 0) { s = String::charToString(d[v % 36]) + s; v /= 36; } return s; };
  String t = b36(Time::currentTimeMillis()); return "m" + t.substring(jmax(0, t.length() - 5)) + b36(Random::getSystemRandom().nextInt(1296));
}
void Controller::cmRecToggle() {
  if (cmPending) cmNameDone(true, cmPend.name);
  cmArmed = !cmArmed; UiEvent e; e.type = UiEvent::CMREC; e.on = cmArmed; send(e); version++;
  if (cmArmed) toast("Recording a moment: play any voice, move any knob, then press Record moment again.");
}
// the host's capture: frames from arm. Trim the silence before the first touch or knob move, drop strokes that began
// before arming, and turn knob moves into lanes (continuous knobs relative to where they were at arm, switches absolute)
void Controller::cmCaptured(const he::CmCapture& m) {
  cmArmed = false; version++;
  std::vector<he::CmCapture::Ev> ev; bool open[he::NS] = {};
  for (auto& e : m.ev) { if (e.k == 'd') open[e.s] = true; else if (!open[e.s]) continue; else if (e.k == 'u') open[e.s] = false; ev.push_back(e); }
  auto p0 = [&](int k, double& v) { for (auto& q : m.p0) if (q.first == k) { v = q.second; return true; } return false; };
  std::vector<he::CmCapture::Pv> pv; for (auto& x : m.pv) { double v0; if (x.k >= 0 && x.k < he::NPARAM && std::isfinite(x.v) && p0(x.k, v0)) pv.push_back(x); }
  if (ev.empty() && pv.empty()) { toast("Nothing was played, so no moment was made."); return; }
  double off = 1e300; if (!ev.empty()) off = ev[0].t; if (!pv.empty()) off = jmin(off, pv[0].t);
  auto r4 = [](double x) { return std::floor(x * 1e4 + .5) / 1e4; }; double sr = m.sr; auto sec = [&](double f) { return r4(jmax(0.0, f - off) / sr); };
  var out;
  for (auto& e : ev) { var a; a.append(sec(e.t)); a.append(e.s); a.append(String::charToString(e.k)); if (e.k != 'u') { a.append(r4(e.x)); a.append(r4(e.y)); a.append(r4(e.p)); a.append(r4(e.hz)); } out.append(a); }
  if (!out.isArray()) out = Array<var>();
  std::vector<int> keys; for (auto& x : pv) if (std::find(keys.begin(), keys.end(), x.k) == keys.end()) keys.push_back(x.k);
  var lanes = Array<var>();
  for (int k : keys) {
    const auto& d = he::PARAMS[k]; bool abs = d.sw || d.nEnum > 0 || d.isInt; double v0 = 0; p0(k, v0);
    auto nrm = [&](double v) { return d.exp ? std::log(v / d.min) / std::log(d.max / d.min) : (v - d.min) / (d.max - d.min); };
    var pts = Array<var>(); bool has = false; double last = 0; bool allZero = true;
    for (auto& x : pv) {
      if (x.k != k) continue;
      double v = abs ? x.v : r4(nrm(x.v) - nrm(v0)); if (has && v == last) continue; has = true; last = v;
      var q; q.append(sec(x.t)); q.append(v); pts.append(q); if (std::abs(v) >= 1e-4) allZero = false;
    }
    if (!abs && allZero) continue;
    var L = hejson::obj(); hejson::set(L, "k", d.id); hejson::set(L, "min", d.min); hejson::set(L, "max", d.max); hejson::set(L, "exp", d.exp); hejson::set(L, "int", d.isInt); hejson::set(L, "abs", abs); hejson::set(L, "pts", pts);
    lanes.append(L);
  }
  CustomMoment c; c.id = cmId(); c.name = "Moment"; c.voice = -1; c.len = sec(m.dur); c.created = Time::getCurrentTime().toISO8601(true); c.ev = out; c.lanes = lanes;
  cmPend = c; cmPend.name = cmFreeName(); cmPending = true; version++;
}
void Controller::cmNameDone(bool keep, const String& name) { const ScopedLock stateGuard(stateLock);
  if (!cmPending) return; CustomMoment c = cmPend; cmPending = false; version++;
  if (!keep) { toast("Moment discarded."); return; }
  c.name = name.trim().isNotEmpty() ? name.trim().substring(0, 40) : cmFreeName(); c.handle = nextHandle_++;
  CMS.push_back(c); cmSend(c); cmSync();
  int n = 5 + (int)CMS.size(); toast("Saved \"" + c.name + "\" (" + String(c.len, 1) + " s)" + (n <= 12 ? " on F" + String(n) : String()) + ".");
}
static CustomMoment* findCm(std::vector<CustomMoment>& L, const String& id) { for (auto& c : L) if (c.id == id) return &c; return nullptr; }
void Controller::cmRename(const String& id, const String& name) { const ScopedLock stateGuard(stateLock); if (auto* c = findCm(CMS, id)) { String v = name.trim(); if (v.isNotEmpty() && v != c->name) { c->name = v.substring(0, 40); cmSend(*c); version++; } } }
void Controller::cmSetVoice(const String& id, int v) { const ScopedLock stateGuard(stateLock); if (auto* c = findCm(CMS, id)) { c->voice = v; cmSend(*c); version++; } }
void Controller::cmUp(const String& id) { const ScopedLock stateGuard(stateLock); for (size_t i = 1; i < CMS.size(); i++) if (CMS[i].id == id) { std::swap(CMS[i], CMS[i - 1]); cmSync(); return; } }
void Controller::cmDelete(const String& id) { const ScopedLock stateGuard(stateLock);
  for (size_t i = 0; i < CMS.size(); i++) if (CMS[i].id == id) {
    CustomMoment c = CMS[i]; CMS.erase(CMS.begin() + (long)i);
    UiEvent e; e.type = UiEvent::CMDEF; e.id = c.handle; send(e); cmOpen = {}; cmSync(); toast("Deleted \"" + c.name + "\"."); return;
  }
}
static var momentFile(const std::vector<CustomMoment>& cms) {
  var o = hejson::obj(); hejson::set(o, "format", "horror-engine.moment"); hejson::set(o, "version", VERSION); hejson::set(o, "author", AUTHOR); hejson::set(o, "credit", CREDIT);
  if (cms.size() == 1) hejson::set(o, "moment", cms[0].toVar()); else { var a = Array<var>(); for (auto& c : cms) a.append(c.toVar()); hejson::set(o, "moments", a); }
  return o;
}
void Controller::cmExport(const String& id) {
  auto* c = findCm(CMS, id); if (!c) return;
  String slug = c->name.toLowerCase().retainCharacters("abcdefghijklmnopqrstuvwxyz0123456789 -_"), s2; bool dash = false;
  for (auto ch : slug) { bool ok = CharacterFunctions::isLetterOrDigit(ch); if (ok) { if (dash && s2.isNotEmpty()) s2 << "-"; s2 << String::charToString(ch); dash = false; } else dash = true; }
  if (s2.isEmpty()) s2 = "moment";
  String text = hejson::stringify(momentFile({*c}), 1), fn = s2 + ".horror-moment.json";
  saveFile(fn, "*.json", [text](const File& f) { return f.replaceWithText(text); }, [this, fn](const File&) { toast("Exported " + fn); });
}
// add moments from a file, preset or performance: same id and same content is skipped, a clash gets a new id
int Controller::cmMerge(const var& list) { const ScopedLock stateGuard(stateLock);
  int n = 0;
  if (auto* a = list.getArray()) for (auto& v : *a) {
    if (!cmValid(v)) continue; CustomMoment c = fromVar(JSON::parse(hejson::stringify(v)));
    if (auto* same = findCm(CMS, c.id)) { if (hejson::stringify(same->toVar()) == hejson::stringify(c.toVar())) continue; c.id = cmId(); }
    c.handle = nextHandle_++; CMS.push_back(c); cmSend(c); n++;
  }
  if (n) cmSync();
  return n;
}
void Controller::cmImport(const var& j) {
  var list = j.hasProperty("moments") ? j.getProperty("moments", var()) : j.hasProperty("moment") ? var(Array<var>{j.getProperty("moment", var())}) : var(Array<var>());
  int n = cmMerge(list); toast(n ? "Imported " + String(n) + " moment" + (n > 1 ? "s" : "") : String("Those moments are already here."));
}
void Controller::cmImportFile() {
  chooser_ = std::make_unique<FileChooser>("Import a .horror-moment.json file", File::getSpecialLocation(File::userDocumentsDirectory), "*.json");
  chooser_->launchAsync(FileBrowserComponent::openMode | FileBrowserComponent::canSelectFiles, [this](const FileChooser& fc) {
    File f = fc.getResult(); if (!f.existsAsFile()) return;
    var j = JSON::parse(f.loadFileAsString());
    if (!j.isObject()) { toast("That file is not JSON."); return; }
    String fmt = j.getProperty("format", var()).toString();
    if (fmt == "horror-engine.moment") { auto er = checkFile(j, [this](const var& c) { return cmValid(c); }); if (er.size()) toast("Not imported: " + er[0]); else cmImport(j); }
    else if (j.hasProperty("customMoments")) { int n = cmMerge(j.getProperty("customMoments", var())); toast(n ? "Imported " + String(n) + " moment" + (n > 1 ? "s" : "") + " from " + f.getFileName() : "No new moments in " + f.getFileName()); }
    else toast("Choose a .horror-moment.json file (or a preset or performance with moments in it).");
  });
}

/* ---------- looper ---------- */
bool Controller::syncToHost() const { return p_.syncToHost.load(); }
void Controller::setSyncToHost(bool on) { p_.syncToHost = on; }
float Controller::hostTempo() const { return p_.hostTempo.load(); }
void Controller::loopToggle() { UiEvent e; e.type = UiEvent::LOOP; e.loopAction = LA_REC; e.free = freeLength; send(e); }
void Controller::loopCmd(int action, int layer, double v) { UiEvent e; e.type = UiEvent::LOOP; e.loopAction = action; e.layer = layer; e.lv = (float)v; e.free = freeLength; send(e); }

/* ---------- your sound in ---------- */
String Controller::inputState() const { return inKind_ ? (inKind_ == 1 ? "Track: " : "File: ") + inName_ : String("Off"); }
void Controller::inputGo(int kind, const String& name) {
  inKind_ = kind; inName_ = name; p_.inputSource = kind == 1 ? HorrorProcessor::IN_TRACK : HorrorProcessor::IN_FILE;
  UiEvent e; e.type = UiEvent::INPUT; e.on = true; send(e); version++;
  toast("Your sound in: " + name + ". Set the level with Dry and the sends; Silence (Esc) stops it.");
}
void Controller::inputTrack() {
  inputStop(true);
  if (p_.getTotalNumInputChannels() == 0) toast("This track sends no audio into the plugin: route a mic, a line or another track to its input.");
  inputGo(1, "the track's input");
}
void Controller::inputFile() {
  chooser_ = std::make_unique<FileChooser>("Play an audio file through the machine", File::getSpecialLocation(File::userMusicDirectory), "*.wav;*.aif;*.aiff;*.flac;*.ogg;*.mp3");
  chooser_->launchAsync(FileBrowserComponent::openMode | FileBrowserComponent::canSelectFiles, [this](const FileChooser& fc) {
    File f = fc.getResult(); if (!f.existsAsFile()) return;
    AudioFormatManager fm; fm.registerBasicFormats();
    std::unique_ptr<AudioFormatReader> r(fm.createReaderFor(f));
    if (!r || r->lengthInSamples <= 0) { toast("That file could not be decoded as audio."); return; }
    int len = (int)jmin<int64>(r->lengthInSamples, (int64)(r->sampleRate * 1800));
    AudioBuffer<float> src((int)jlimit(1u, 2u, r->numChannels), len); r->read(&src, 0, len, 0, true, src.getNumChannels() > 1);
    double ratio = r->sampleRate / p_.sessionRate(); int outLen = (int)std::ceil(len / ratio);
    auto buf = std::make_unique<AudioBuffer<float>>(2, jmax(1, outLen));
    for (int c = 0; c < 2; c++) { LagrangeInterpolator li; li.process(ratio, src.getReadPointer(jmin(c, src.getNumChannels() - 1)), buf->getWritePointer(c), outLen, len, 0); }
    inputStop(true);
    p_.fileLoop = inputLoop; p_.setInputFile(std::move(buf));
    inputGo(2, f.getFileName());
  });
}
void Controller::inputStop(bool quiet) {
  bool was = inKind_ != 0;
  inKind_ = 0; inName_ = {}; inPk = 0; p_.inputSource = HorrorProcessor::IN_NONE;
  if (was) { UiEvent e; e.type = UiEvent::INPUT; e.on = false; send(e); if (!quiet) toast("Your sound in: stopped."); }
  version++;
}

/* ---------- the menu ---------- */
String Controller::status() const {
  String host = PluginHostType().getHostDescription();
  return "Running at " + String((int)std::round(p_.getSampleRate() > 0 ? p_.getSampleRate() : p_.sessionRate())) + " Hz" + (host.isNotEmpty() && host != "Unknown" ? " in " + host : String());
}
// "Save the last minute": the plugin keeps the last minute of its output; Shift+R writes it as a WAV
void Controller::retroSave() {
  auto buf = std::make_shared<AudioBuffer<float>>(); double sr = 48000;
  if (!p_.copyLastSeconds(60, *buf, sr) || buf->getNumSamples() < sr * .2) { toast("Nothing has played yet."); return; }
  int secs = (int)std::round(buf->getNumSamples() / sr); String title = "horror-engine-last-" + String(secs) + "s-" + stamp();
  saveFile(title + ".wav", "*.wav", [buf, sr](const File& f) {
    f.deleteFile(); std::unique_ptr<FileOutputStream> os(f.createOutputStream()); if (!os) return false;
    WavAudioFormat wav; StringPairArray meta; meta.set("IART", AUTHOR); meta.set("ISFT", "Horror Engine plugin");
    std::unique_ptr<AudioFormatWriter> w(wav.createWriterFor(os.get(), sr, 2, 32, meta, 0)); if (!w) return false; os.release();
    return w->writeFromAudioSampleBuffer(*buf, 0, buf->getNumSamples());
  }, [this, secs, title](const File&) { toast("Saved the last " + String(secs) + " s in " + title + ".wav."); });
}
void Controller::shareLink() {
  var d = hejson::obj();
  for (int k = 0; k < he::NPARAM; k++) {
    if (isInputParam(k)) continue; const auto& p = he::PARAMS[k]; double v = P(k);
    double q; if (p.isInt || p.nEnum || p.sw) q = std::floor(v + .5); else { char b[40]; std::snprintf(b, sizeof b, "%.6g", v); q = std::strtod(b, nullptr); }
    if (q != p.def) hejson::set(d, p.id, q);
  }
  var o = hejson::obj(); hejson::set(o, "v", 1); hejson::set(o, "p", d); hejson::set(o, "n", presetName()); hejson::set(o, "sel", sel_);
  String js = hejson::stringify(o); MemoryBlock mb(js.toRawUTF8(), js.getNumBytesAsUTF8());
  String b = Base64::toBase64(mb.getData(), mb.getSize()).replaceCharacter('+', '-').replaceCharacter('/', '_'); while (b.endsWithChar('=')) b = b.dropLastCharacters(1);
  String url = String(SHARE_BASE) + "#s=" + b;
  SystemClipboard::copyTextToClipboard(url);
  toast("Link copied (" + String(url.length()) + " characters). Opening it in a browser rebuilds these settings in the web app.");
}

/* ---------- state ---------- */
ValueTree Controller::saveState() const { const ScopedLock stateGuard(stateLock);
  ValueTree v("SEANCE");
  v.setProperty("sel", sel_, nullptr); v.setProperty("octave", octave_, nullptr); v.setProperty("preset", presetName(), nullptr); v.setProperty("basePr", basePr, nullptr);
  var a = Array<var>(); for (auto& c : CMS) a.append(c.toVar()); v.setProperty("moments", hejson::stringify(a), nullptr);
  var m = hejson::obj(); for (auto& kv : mmap_) hejson::set(m, kv.first.toRawUTF8(), he::PARAMS[kv.second].id); v.setProperty("midimap", hejson::stringify(m), nullptr);
  v.setProperty("sync", p_.syncToHost.load(), nullptr);
  return v;
}
void Controller::loadState(const ValueTree& v) { const ScopedLock stateGuard(stateLock);
  if (!v.isValid()) return;
  String pn = v.getProperty("preset", "").toString(); for (int i = 0; i < he::NPRESET; i++) if (pn == U(he::PRESETS[i].name)) { preset_ = i; presetIndexAtomic = i; }
  select((int)v.getProperty("sel", 0)); setOct((int)v.getProperty("octave", 0)); basePr = jlimit(.05, 1.0, (double)v.getProperty("basePr", .6));
  for (auto& c : CMS) { UiEvent e; e.type = UiEvent::CMDEF; e.id = c.handle; send(e); }
  CMS.clear(); var a = JSON::parse(v.getProperty("moments", "[]").toString());
  if (auto* arr = a.getArray()) for (auto& c : *arr) if (cmValid(c)) { CustomMoment m = fromVar(c); m.handle = nextHandle_++; CMS.push_back(m); cmSend(m); }
  cmSync();
  mmap_.clear(); var m = JSON::parse(v.getProperty("midimap", "{}").toString());
  if (auto* o = m.getDynamicObject()) for (auto& kv : o->getProperties()) { int k = indexOf(kv.value.toString()); if (k >= 0 && kv.name.toString().startsWith("cc:")) mmap_[kv.name.toString()] = k; }
  p_.syncToHost = (bool)v.getProperty("sync", true);
  mmSync(); hist_.clear(); hpos_ = 0; version++; paramVersion++;
}

/* ---------- the audio thread's news, 30 times a second ---------- */
void Controller::timerCallback() {
  he::Telemetry t; bool any = false;
  while (p_.popTelemetry(t)) {
    any = true; tm = t; started = true;
    for (int i = 0; i < he::NS; i++) srcPk[i] = jmax(t.voicePeak[i], srcPk[i] * .8f);
    pkL = t.peakL; pkR = t.peakR; gr = t.gainReduction;
    if (inKind_) inPk = jmax(t.inPeak, inPk * .8f);
    hLoop(t.undoCount);
    if (cmArmed && t.cmRec >= 600) cmRecToggle();
  }
  (void)any;
  AudioNote n;
  while (p_.popNote(n)) {
    if (n.type == AudioNote::SET_PARAM) setParam(n.k, n.v);
    else if (n.type == AudioNote::LEARN_GOT) learnGot(n.ch, n.cc);
  }
  he::CmCapture cap; if (p_.takeCapture(cap)) cmCaptured(cap);
  if (p_.fileEnded.exchange(false) && inKind_ == 2) { inputStop(true); toast("The file finished."); }
  uint32 now = Time::getMillisecondCounter();
  if (learnT_ && now > learnT_) learnStop();
  if (offUndoT_ && now > offUndoT_) { offUndo_.clear(); offUndoT_ = 0; }
}
