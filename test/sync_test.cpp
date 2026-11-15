// Sync to host: drive the engine with a fake host playhead (random buffer sizes, tempo change, a loop jump, stop) and check
// that looper layers are whole bars, start on bar lines and stay locked to the host position. Struck Metal taps are used
// as markers: every onset in the output must sit on the recorded beats of the host's bar grid.
//   sync_test            (exit code 0 = pass)
#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <vector>
#include "../core/he_core.h"

static int fails = 0;
static void ok(bool c, const char* m) { std::printf("%s %s\n", c ? "PASS" : "FAIL", m); if (!c) fails++; }

struct Out { std::vector<float> x; std::vector<double> ppq; std::vector<bool> playing; };

int main() {
  const double sr = 48000; he::Host h(sr);
  std::vector<double> P(he::NPARAM); for (int k = 0; k < he::NPARAM; k++) P[k] = he::PARAMS[k].def;
  auto set = [&](const char* id, double v) { int k = he::Host::paramIndex(id); if (k < 0) { std::printf("no param %s\n", id); std::exit(2); } P[k] = v; };
  set("rev.mix", 0); set("harm.mix", 0); set("body.amt", 0); set("struck.decay", .05); set("struck.rev", 0); set("struck.spr", 0); set("struck.hsend", 0); set("macro.distance", 0);
  for (const char* v : {"ebow", "hurdy", "bowed", "glass", "spring", "junk", "aura", "moan"}) { char id[32]; std::snprintf(id, sizeof id, "%s.mute", v); set(id, 1); }
  h.init(P.data(), 1337);

  // the fake host: position in quarters, tempo, playing; changes are applied at buffer starts as a real host does
  double ppq = 0.37, bpm = 120; bool playing = true, sync = !std::getenv("SYNC_OFF");
  Out o; std::vector<float> L(2048), R(2048); unsigned rs = 12345; long long s = 0;
  auto rnd = [&]() { rs = rs * 1103515245u + 12345u; return (rs >> 8) & 0xffff; };
  const int sizes[] = {64, 100, 256, 441, 512, 1000, 1024};
  // one host buffer: transport, then the audio
  auto buffer = [&](int n) {
    he::Transport t; t.valid = true; t.playing = playing; t.bpm = bpm; t.ppq = ppq; t.num = 4; t.den = 4; t.barPpq = std::floor(ppq / 4) * 4;
    h.transport(t, sync); h.render(L.data(), R.data(), n);
    for (int i = 0; i < n; i++) { o.x.push_back(std::fabs(L[i]) > std::fabs(R[i]) ? std::fabs(L[i]) : std::fabs(R[i])); o.ppq.push_back(ppq + (playing ? i * bpm / 60 / sr : 0)); o.playing.push_back(playing); }
    if (playing) ppq += n * bpm / 60 / sr; s += n;
  };
  auto runTo = [&](double q) { while (ppq < q) buffer(sizes[rnd() % 7]); };
  auto runSamples = [&](long long n) { long long e = s + n; while (s < e) buffer((int)std::min<long long>(sizes[rnd() % 7], e - s)); };
  auto tap = [&](double q) { runTo(q); h.gesture(4, 'd', .5, .5, .9); runTo(q + .1); h.gesture(4, 'u', 0, 0, 0); };

  // 1. record two taps (beat 1 and beat 3 of a bar) while the host plays; Loop pressed mid-bar 0, stopped at 1.85 bars
  runTo(1.57); h.loop("rec"); he::Telemetry t; h.telemetry(t);
  ok(t.synced, "engine reports Sync to host while the host plays at 120 BPM");
  tap(4.05); tap(6.05);
  runTo(11.4); h.loop("stop"); runTo(11.5); h.telemetry(t);
  ok(t.nLayers == 1 && t.laneBars == 2, "first layer rounds to whole bars (1.85 bars -> 2)");
  ok(t.nLayers == 1 && std::fabs(t.layers[0].len * sr - 8 * 24000) < 1, "layer length is exactly 2 bars of samples at 120 BPM");
  size_t stopAt = o.x.size();
  if (std::getenv("SYNC_DEBUG")) { float mx = 0, pre = 0; for (size_t i = 0; i < o.x.size(); i++) { mx = std::fmax(mx, o.x[i]); if (o.ppq[i] < 4) pre = std::fmax(pre, o.x[i]); } std::printf("   max %.3f, before taps %.4f\n", mx, pre); }
  runTo(26);                                   // plays from the bar line at 12: onsets expected at 12.05, 14.05, 20.05, 22.05
  size_t jumpAt = o.x.size(); ppq = 13.0;      // 2. the host loops back (as an FL loop region or a click on the timeline)
  runTo(30);
  size_t tempoAt = o.x.size(); bpm = 90;       // 3. tempo change: the layer follows the bar grid, not the clock
  runTo(46);
  size_t stopHostAt = o.x.size();

  // onsets: first sample above the threshold after 80 ms of quiet
  auto onsets = [&](size_t a, size_t b) { std::vector<size_t> r; size_t quiet = 0; for (size_t i = a; i < b; i++) { if (o.x[i] > .02) { if (quiet > 3840) r.push_back(i); quiet = 0; } else quiet++; } return r; };
  auto onBeat = [&](double q) { double ph = std::fmod(q - 4.05, 8); if (ph < 0) ph += 8; double d0 = std::fabs(ph), d2 = std::fabs(ph - 2), d8 = std::fabs(ph - 8); return std::fmin(d0, std::fmin(d2, d8)); };
  auto check = [&](size_t a, size_t b, int expectMin, const char* what) {
    auto on = onsets(a, b); double worst = 0; for (auto i : on) worst = std::fmax(worst, onBeat(o.ppq[i]));
    char m[256]; std::snprintf(m, sizeof m, "%s: %zu onsets, worst distance from the recorded beats %.4f quarters (%.1f ms at 120 BPM)", what, on.size(), worst, worst * 500);
    if (std::getenv("SYNC_DEBUG")) for (auto i : on) { float pk = 0; for (size_t j = i; j < i + 2400 && j < o.x.size(); j++) pk = std::fmax(pk, o.x[j]); std::printf("   onset at ppq %.3f peak %.3f\n", o.ppq[i], pk); }
    ok((int)on.size() >= expectMin && worst < .02, m);   // 0.02 q = 10 ms at 120 BPM (engine blocks are 2.7 ms)
    return on;
  };
  if (std::getenv("SYNC_DEBUG")) check(0, stopAt, 0, "recording region (debug)");
  auto first = onsets(stopAt, jumpAt);
  ok(!first.empty() && o.ppq[first[0]] > 11.99, "after Stop, playback waits for the next bar line (first onset at or after bar 12)");
  check(stopAt, jumpAt, 4, "locked to the bar grid after recording");
  check(jumpAt, tempoAt, 3, "re-aligned after the host jumped back to 13.0");
  check(tempoAt, stopHostAt, 3, "still on the grid after a tempo change to 90 BPM");

  // 4. the host stops: the looper runs free from where it was, like the web app (2 and 6 quarters apart at the lane's tempo)
  playing = false; runSamples((long long)(8 * sr));
  auto fr = onsets(stopHostAt, o.x.size()); bool spacing = fr.size() >= 3;
  for (size_t i = 1; i < fr.size(); i++) { double d = (double)(fr[i] - fr[i - 1]) / 24000; double e = std::fmin(std::fabs(d - 2), std::fabs(d - 6)); if (e > .02) spacing = false; }
  h.telemetry(t); ok(!t.synced, "host stopped: engine runs free");
  ok(spacing, "host stopped: layer keeps playing free with its own 2/6-quarter spacing");

  // 5. Sync to host switched off while the host plays: free-running too
  playing = true; sync = false; size_t offAt = o.x.size(); runSamples((long long)(9 * sr)); h.telemetry(t);
  ok(!t.synced && onsets(offAt, o.x.size()).size() >= 2, "Sync off: free-running while the host plays");

  // 6. a new recording with the host stopped keeps its own length (no bar rounding)
  h.loop("clear"); playing = false; sync = true; runSamples(4800); h.loop("rec"); runSamples(4800); h.gesture(4, 'd', .5, .5, .9); runSamples(4800); h.gesture(4, 'u', 0, 0, 0);
  runSamples((long long)(1.3 * sr)); h.loop("stop"); runSamples(256); h.telemetry(t);
  ok(t.nLayers == 1 && std::fabs(t.layers[0].len - 1.5) < .01, "host stopped: a new layer keeps its own free length (1.5 s, not rounded to bars)");
  std::printf(fails ? "%d failed\n" : "all passed\n", fails);
  return fails ? 1 : 0;
}
