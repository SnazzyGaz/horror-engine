// Horror Engine · Séance: holding a MIDI-driven parameter value until the host parameter catches up.
// Horror Engine by Garyck Arntzen (https://x.com/_mintydoge). GNU AGPLv3.
//
// A CC (fixed CC 20-23 or a learned one) sets the engine on the audio thread at once, and the controller's timer
// passes the value on to the host parameter (setValueNotifyingHost) up to 1/30 s later. Until then the host still
// reports the old value, and applyParams used to put it back: the knob and the sound flickered between the two.
// ParamHold keeps the MIDI value until the host reports it (within a tolerance, in normalised units), or until a
// timeout (so host automation or a lost update still wins in the end). Plain C++, no JUCE, so it can be unit tested.
#pragma once
#include <cmath>
#include <cstdint>

struct ParamHold {
  double norm = 0;        // the MIDI value, normalised 0..1
  int64_t left = 0;       // samples still to hold it; 0 = not holding
  void midi(double normValue, int64_t holdSamples) { norm = normValue; left = holdSamples; }
  bool holding() const { return left > 0; }
  // the host reports hostNorm at the start of a block of n samples: true if the engine should follow the host now
  bool follow(double hostNorm, int n, double tol = 1e-3) {
    if (left <= 0) return true;
    if (std::fabs(hostNorm - norm) <= tol) { left = 0; return true; }   // caught up
    left -= n; if (left <= 0) { left = 0; return true; }                  // timed out: the host wins
    return false;
  }
};
