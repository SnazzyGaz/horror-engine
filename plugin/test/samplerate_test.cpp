// Horror Engine · Séance: every preset at sample rates from 1 kHz to 768 kHz (as clap-validator's
// process-varying-sample-rates test does) must render finite audio without touching memory it does not own.
// Horror Engine by Garyck Arntzen (https://x.com/_mintydoge). GNU AGPLv3.
// Build with -fsanitize=address to catch overruns (1.0.0 overran the limiter's 256-sample window above 124 kHz).
#include "he_core.h"
#include "he_presets.gen.h"
#include <cmath>
#include <cstdio>
#include <vector>

int main() {
  int fails = 0;
  for (double sr : {1000.0, 4000.0, 8000.0, 11025.0, 22050.0, 44100.0, 48000.0, 96000.0, 176400.0, 192000.0, 384000.0, 768000.0, 12345.6}) {
    int bad = 0; double peak = 0;
    for (int pr = 0; pr < he::NPRESET; pr++) {
      std::vector<double> P(he::NPARAM);
      for (int k = 0; k < he::NPARAM; k++) P[k] = he::PARAMS[k].def;
      for (int j = 0; j < he::PRESETS[pr].n; j++) P[he::PRESETS[pr].values[j].param] = he::PRESETS[pr].values[j].value;
      he::Host h(sr); h.init(P.data(), 1337);
      std::vector<float> L(512), R(512);
      int blocks = (int)(sr * 1.5 / 512) + 8;
      for (int b = 0; b < blocks; b++) {
        if (b % 24 == 1) for (int v = 0; v < 9; v++) h.gesture(v, 'd', .3 + .05 * v, .6, .8);
        if (b % 24 == 12) for (int v = 0; v < 9; v++) h.gesture(v, 'u', 0, 0, 0);
        h.render(L.data(), R.data(), 512);
        for (int i = 0; i < 512; i++) { if (!std::isfinite(L[i]) || !std::isfinite(R[i])) bad++; else peak = std::fmax(peak, std::fabs(L[i])); }
      }
    }
    std::printf("%s %9.1f Hz: all %d presets, %d non-finite samples, peak %.3f\n", bad ? "FAIL" : "PASS", sr, he::NPRESET, bad, peak);
    if (bad) fails++;
  }
  std::printf(fails ? "%d failed\n" : "all passed\n", fails);
  return fails ? 1 : 0;
}
