/* Horror Engine - (c) 2026 Garyck Arntzen (https://x.com/_mintydoge) - MIT licence.
   The bowed-string "bow table" follows the idea published in STK (Perry R. Cook & Gary P. Scavone, MIT-style licence). */
var HE_SOURCES = ['ebow', 'hurdy', 'bowed', 'glass', 'struck', 'spring', 'junk', 'aura', 'moan'];
var HE_PARAMS = (function () {
  var L = [];
  function p(id, label, min, max, def, o) { o = o || {}; o.id = id; o.label = label; o.min = min; o.max = max; o.def = def; L.push(o); }
  // default faders, balanced so every voice sits near -18 dB RMS at a normal gesture (impulsive voices: peaks near -6 dBFS)
  var strip = { ebow: [-11, .3, 0, .45, 0], hurdy: [-8, .25, 0, 0, 0], bowed: [-3, .4, .1, 0, 0], glass: [-5, .35, 0, 0, 0], struck: [-6, .35, .15, 0, 0], spring: [-8, .15, 0, 0, 0], junk: [-8, .3, 0, 0, 0], aura: [-4, .4, 0, 0, 1], moan: [-6, .3, 0, 0, 0] };
  HE_SOURCES.forEach(function (s) {
    var d = strip[s];
    p(s + '.level', 'Level', -60, 6, d[0], { unit: 'dB', grp: 'ch' });
    p(s + '.pan', 'Pan', -1, 1, 0, { grp: 'ch', bi: 1 });
    p(s + '.rev', 'Hall', 0, 1, d[1], { grp: 'ch' });
    if (s !== 'spring') p(s + '.spr', 'Spring', 0, 1, d[2], { grp: 'ch' });
    p(s + '.hsend', 'Harmonizer', 0, 1, 0, { grp: 'ch' });
    p(s + '.drive', 'Grit', 0, 1, d[3], { grp: 'ch' });
    p(s + '.hold', 'Hold', 0, 1, d[4], { sw: 1 });
    p(s + '.mute', 'Mute', 0, 1, 0, { sw: 1 });
    p(s + '.tune', 'Tune', -24, 24, 0, { unit: 'st', int: 1, bi: 1, off: 1 });
    p(s + '.cents', 'Fine', -100, 100, 0, { unit: 'c', int: 1, bi: 1, off: 1 });
    p(s + '.matOff', 'Material', -1, 1, 0, { unit: '%', bi: 1, off: 1 });
    p(s + '.distOff', 'Distance', -1, 1, 0, { unit: '%', bi: 1, off: 1 });
  });
  p('ebow.pitch', 'Pitch', 30, 400, 55, { unit: 'Hz', exp: 1 });
  p('ebow.sustain', 'Drive', 0, 1, .55);
  p('ebow.slack', 'Slack', 0, 1, .6);
  p('ebow.pos', 'Driver', .03, .5, .12);
  p('ebow.harm', 'Harmonic', 0, 3, 0, { en: ['Fund', '2nd', '3rd', 'Auto'] });
  p('ebow.buzz', 'Buzz', 0, 1, .2, { adv: 1 });
  p('ebow.damp', 'Damping', 0, 1, .3, { adv: 1 });
  p('ebow.pickup', 'Piezo', 0, 1, .5, { adv: 1 });
  p('ebow.excite', 'Excite', 0, 2, 0, { en: ['E-bow', 'Strike', 'Pluck'] });
  p('ebow.slide', 'Slide range', 1, 3, 1, { unit: 'oct' });
  p('ebow.sym', 'Sympathy', 0, 1, 0, { adv: 1 });
  p('hurdy.crank', 'Crank', 0, 4, 1, { unit: 'rev/s' });
  p('hurdy.press', 'Wheel', 0, 1, .5);
  p('hurdy.root', 'Root', 30, 220, 49, { unit: 'Hz', exp: 1 });
  p('hurdy.buzz', 'Dog buzz', 0, 1, .3);
  p('hurdy.rosin', 'Rosin', 0, 1, .4, { adv: 1 });
  p('hurdy.melody', 'Melody on X', 0, 1, 0, { sw: 1, adv: 1 });
  p('bowed.object', 'Object', 0, 4, 0, { en: ['Ruler', 'Rod', 'Saw', 'Clock spring', 'Cymbal'] });
  p('bowed.size', 'Size', 40, 4000, 330, { unit: 'Hz', exp: 1 });
  p('bowed.press', 'Pressure', 0, 1, .5);
  p('bowed.speed', 'Bow speed', 0, 1, .4);
  p('bowed.bend', 'Bend', 0, 1, .5);
  p('bowed.damp', 'Damping', 0, 1, .2, { adv: 1 });
  p('bowed.length', 'Ruler length', 6, 30, 14, { unit: 'cm' });
  p('glass.surface', 'Surface', 0, 3, 0, { en: ['Pane', 'Wine glass', 'Bottle', 'Chalkboard'] });
  p('glass.contact', 'Contact', 0, 2, 0, { en: ['Nail', 'Finger', 'Chalk'] });
  p('glass.press', 'Pressure', 0, 1, .5);
  p('glass.judder', 'Judder', 0, 1, .5);
  p('glass.wet', 'Wetness', 0, 1, 0);
  p('glass.size', 'Size', .25, 4, 1, { unit: 'x', exp: 1, adv: 1 });
  p('glass.fill', 'Water in glass', 0, 1, 0);
  p('glass.guard', 'Ear guard', 0, 1, 1, { sw: 1, adv: 1 });
  p('glass.beat', 'Circling beat', 0, 1, 1, { adv: 1 });
  p('glass.harm', 'Finger harmonics', 0, 1, 1, { adv: 1 });
  p('struck.object', 'Object', 0, 4, 2, { en: ['Ruler', 'Rod', 'Bell', 'Clock spring', 'Body'] });
  p('struck.pitch', 'Pitch', 30, 5000, 180, { unit: 'Hz', exp: 1 });
  p('struck.hard', 'Hardness', 0, 1, .6);
  p('struck.decay', 'Decay', .05, 20, 3, { unit: 's', exp: 1 });
  p('struck.slap', 'Slap', 0, 1, .5, { adv: 1 });
  p('struck.length', 'Ruler length', 6, 30, 12, { unit: 'cm' });
  p('spring.mode', 'Excite', 0, 3, 0, { en: ['Hit', 'Shake', 'Scrape', 'E-bow'] });
  p('spring.decay', 'Decay', .3, 8, 3, { unit: 's', exp: 1 });
  p('spring.tension', 'Tension', 0, 1, .5);
  p('spring.disp', 'Dispersion', 0, 1, .6);
  p('junk.count', 'Count', 4, 80, 40, { int: 1 });
  p('junk.magnet', 'Magnet', 0, 1, .5);
  p('junk.agit', 'Agitation', 0, 1, .2);
  p('junk.mat', 'Junk', 0, 2, 2, { en: ['Steel', 'Brass', 'Mixed'] });
  p('junk.tray', 'Tray ring', 0, 1, .4, { adv: 1 });
  p('aura.size', 'Grain', 40, 1000, 300, { unit: 'ms', exp: 1 });
  p('aura.density', 'Density', 1, 32, 16, { int: 1 });
  p('aura.blur', 'Blur', 0, 1, .6);
  p('aura.freeze', 'Freeze', 0, 1, 0, { sw: 1 });
  p('aura.shimmer', 'Shimmer', 0, .7, .1, { adv: 1 });
  p('aura.dark', 'Darkness', 0, 1, .5, { adv: 1 });
  p('aura.breathe', 'Breathe', 0, 1, .4, { adv: 1 });
  p('moan.surface', 'Surface', 0, 3, 1, { en: ['Wood body', 'Drumhead', 'Metal sheet', 'Rods'] });
  p('moan.pitch', 'Pitch', 30, 400, 75, { unit: 'Hz', exp: 1 });
  p('moan.press', 'Pressure', 0, 1, .5);
  p('moan.grip', 'Grip', 0, 1, .5);
  p('moan.size', 'Size', .5, 2, 1, { unit: 'x', exp: 1, adv: 1 });
  p('water.amt', 'Water', 0, 1, 0);
  p('water.slosh', 'Slosh', 0, 1, 0, { adv: 1 });
  p('water.level', 'Level', 0, 1, 0);
  p('water.tilt', 'Tilt', -1, 1, 0, { bi: 1 });
  p('harm.shift', 'Shift', -24, 12, -12, { unit: 'st', int: 1 });
  p('harm.detune', 'Detune', 0, 50, 12, { unit: 'c' });
  p('harm.fb', 'Feedback', 0, .9, .25);
  p('harm.mix', 'Return', 0, 1, .8);
  p('body.amt', 'Body', 0, 1, .25);
  p('body.piezo', 'Piezo', 0, 1, .4);
  p('body.size', 'Box size', .5, 2, 1, { unit: 'x', exp: 1 });
  p('body.spring', 'Knock to spring', 0, 1, 0);
  p('macro.dread', 'Dread', 0, 1, .2);
  p('macro.distance', 'Distance', 0, 1, .15);
  p('macro.material', 'Material', 0, 1, .5);
  p('macro.pitch', 'Pitch', -36, 24, 0, { unit: 'st', bi: 1 });
  p('rev.size', 'Size', 0, 1, .7);
  p('rev.decay', 'Decay', .5, 30, 6, { unit: 's', exp: 1 });
  p('rev.damp', 'Damping', 0, 1, .5);
  p('rev.pre', 'Pre-delay', 0, 200, 20, { unit: 'ms' });
  p('rev.mix', 'Return', 0, 1, .8);
  p('master.tone', 'Tilt', -1, 1, 0, { bi: 1 });
  p('master.vol', 'Volume', -30, 6, 0, { unit: 'dB' });
  // your own sound in (mic, line or a file): dry level and sends into the spring, the body, the hall, the harmonizer and
  // the Aura. Session settings: presets and share links leave them alone. With the input off they do nothing at all.
  p('input.level', 'Dry', -60, 6, -12, { unit: 'dB' });
  p('input.spr', 'Spring', 0, 1, .35);
  p('input.body', 'Body', 0, 1, .4);
  p('input.rev', 'Hall', 0, 1, .35);
  p('input.hsend', 'Harmonizer', 0, 1, 0);
  p('input.aura', 'Aura', 0, 1, .6);
  return L;
})();

function HECoreFactory() {
  'use strict';
  var TAU = 6.283185307179586, NS = 9, BL = 128;
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function db(x) { return Math.pow(10, x / 20); }
  function pw(d, a, b, c) { return d < .5 ? a + (b - a) * d * 2 : b + (c - b) * (d - .5) * 2; }
  function nextPow2(n) { var p = 1; while (p < n) p <<= 1; return p; }
  function srAlpha(a48, sr) { return sr === 48000 ? a48 : 1 - Math.pow(1 - a48, 48000 / sr); }
  function softClip(x, ceil) {
    var a = x < 0 ? -x : x, k0 = ceil * .95;
    if (a <= k0) return x;
    var span = ceil - k0, u = (a - k0) / span, y = k0 + span * (u / (1 + u));
    return x < 0 ? -y : y;
  }
  function Rng(seed) { this.s = (seed >>> 0) || 1; }
  Rng.prototype.u = function () { var s = this.s; s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; this.s = s; return s / 4294967296; };
  Rng.prototype.b = function () { return this.u() * 2 - 1; };

  // harmonic generator: Chebyshev terms on the level-normalised signal add 2nd-5th harmonics at fixed levels relative
  // to the fundamental (c2 = 0.1 puts the 2nd harmonic about 20 dB down); the even part is DC-blocked
  // rm: normalise by RMS (for near-sinusoids such as a singing glass) instead of by the peak (for spiky waveforms)
  function HG() { this.pk = 0; this.ms = 0; this.d1 = 0; this.d2 = 0; this.ulp = 0; }
  HG.prototype.run = function (x, n, c2, c3, c4, c5, k, sr, rm) {
    var pk = this.pk, ms = this.ms, d1 = this.d1, d2 = this.d2, rel = 1 - k, ul = this.ulp;
    var dcR = Math.pow(.995, 48000 / sr);
    for (var i = 0; i < n; i++) {
      var v = x[i], av = v < 0 ? -v : v, a; pk = av > pk ? av : pk * rel;
      if (rm) { ms += k * (v * v - ms); a = Math.sqrt(2 * ms) + 1e-9; } else a = pk + 1e-9;
      var u = v / a; if (u > 1.3) u = 1.3; else if (u < -1.3) u = -1.3;
      ul = u;
      var u2 = ul * ul, ev = a * (c2 * (2 * u2 - 1) + c4 * (8 * u2 * u2 - 8 * u2 + 1)), od = a * ul * (c3 * (4 * u2 - 3) + c5 * (16 * u2 * u2 - 20 * u2 + 5));
      d2 = ev - d1 + dcR * d2; d1 = ev; x[i] = v + d2 + od;
    }
    this.pk = pk + 1e-18; this.ms = ms + 1e-18; this.d1 = d1; this.d2 = d2 + 1e-18; this.ulp = ul + 1e-18;
  };
  // first (clamped-free) mode of a 0.8 mm steel ruler with overhang Lcm: f1 = 0.652 / L^2 (L in metres); 10 cm -> 65 Hz, 20 cm -> 16 Hz
  function rulerHz(Lcm) { var L = Lcm / 100; return .652 / (L * L); }
  // waterphone tray: a rod at x (0 left .. 1 right) sits deeper when the tray tilts toward its end (tilt +1 = right end down);
  // the water's added mass lowers its partials by up to 6% at full immersion (an approximation of mass loading)
  function immerse(E, x) { var d = E.wLevel + .8 * E.wTilt * (2 * x - 1); return 1 - .06 * (d < 0 ? 0 : d > 1 ? 1 : d); }
  // E-bow tuning table: extra loop delay in samples, rows = loss-filter coefficient c, columns = log2(loop length) 5..12 in half octaves
  var ORDER = [0, 1, 2, 3, 4, 8, 6, 5, 7];
  var EB_C = [.5, .558, .615, .692, .769, .884, .98], EB_T = [[-1.036,-1.023,-0.979,-0.875,-0.64,-0.236,0.579,2.107,5.513,11.487,22.485,44.995,85.469,152.93,266.53],[-1.096,-1.074,-1.023,-0.939,-0.754,-0.45,0.163,1.264,3.783,8.077,16.246,34.518,66.395,126.115,223.202],[-1.135,-1.109,-1.062,-0.994,-0.861,-0.66,-0.267,0.387,1.723,4.393,9.334,19.768,40.528,78.795,147.219],[-1.166,-1.139,-1.094,-1.032,-0.932,-0.782,-0.513,-0.098,0.661,2.12,4.551,10.41,20.906,43.85,85.368],[-1.187,-1.149,-1.117,-1.053,-0.967,-0.832,-0.609,-0.283,0.268,1.307,2.901,6.471,13.562,27.882,52.706],[-1.214,-1.163,-1.146,-1.075,-0.988,-0.867,-0.671,-0.397,0.037,0.84,1.971,4.291,8.922,17.204,36.116],[-1.226,-1.174,-1.15,-1.091,-0.996,-0.881,-0.689,-0.433,-0.02,0.73,1.743,3.693,7.794,15.15,31.371]];
  function ebowTune(P, c) {
    var x = (Math.log(P) / Math.LN2 - 5) * 2; if (x < 0) x = 0; else if (x > 13.999) x = 13.999;
    if (c < .5) c = .5; else if (c > .98) c = .98;
    var j = 0; while (j < 5 && c > EB_C[j + 1]) j++;
    var u = (c - EB_C[j]) / (EB_C[j + 1] - EB_C[j]), i = x | 0, v = x - i, A = EB_T[j], B = EB_T[j + 1];
    return (A[i] * (1 - v) + A[i + 1] * v) * (1 - u) + (B[i] * (1 - v) + B[i + 1] * v) * u;
  }
  /* ---------- 1. E-bow string: waveguide loop with a self-oscillating electromagnetic driver ---------- */
  function Ebow(E) {
    this.E = E; this.N = 16384; this.mask = this.N - 1;
    this.b = [new Float32Array(this.N), new Float32Array(this.N)];
    this.ih = [new Float32Array(this.N), new Float32Array(this.N)];
    this.w = 0; this.lp = [0, 0]; this.env = [0, 0]; this.agc = [0, 0];
    this.bx1 = [0, 0]; this.bx2 = [0, 0]; this.by1 = [0, 0]; this.by2 = [0, 0]; this.apX = [0, 0]; this.apY = [0, 0];
    this.f = 0; this.dr = 0; this.drift = 0; this.h = 1; this.hT = 0; this.sph = 0; this.dc1 = 0; this.dc2 = 0; this.hg = new HG(); this.hm = 1;
    var w0 = TAU * 250 / E.sr, al = Math.sin(w0) / (2 * .8), a0 = 1 + al;
    this.pz = { b0: (1 + Math.cos(w0)) / 2 / a0, a1: -2 * Math.cos(w0) / a0, a2: (1 - al) / a0, x1: 0, x2: 0, y1: 0, y2: 0, env: 0 };
  }
  Ebow.prototype.reset = function () { this.b[0].fill(0); this.b[1].fill(0); this.ih[0].fill(0); this.ih[1].fill(0); this.lp = [0, 0]; this.env = [0, 0]; this.agc = [0, 0]; this.bx1 = [0, 0]; this.bx2 = [0, 0]; this.by1 = [0, 0]; this.by2 = [0, 0]; this.apX = [0, 0]; this.apY = [0, 0]; this.dr = 0; this.pz.x1 = this.pz.x2 = this.pz.y1 = this.pz.y2 = this.pz.env = 0; };
  Ebow.prototype.render = function (L, R, n, C, P) {
    // sympathy: the first string instance picks up the hurdy and the body (never itself) when the driver is off
    var sym = this === this.E.src[0] && this.E.symG > 0 ? this.E.symIn : null, symG = this.E.symG;
    var E = this.E, sr = E.sr, D = E.dread, rng = E.rng, slack = P['ebow.slack'], damp = P['ebow.damp'];
    // Excite: E-bow (magnetic sustain), Strike or Pluck (the driver is off; a hit is injected into the string and x slides
    // a bar along it, the Blaster Beam boom). Slide range sets how far x reaches either side.
    var exm = P['ebow.excite'] | 0, slideR = P['ebow.slide'] || 1;
    var base = C.hz > 0 ? C.hz : P['ebow.pitch'] * Math.pow(2, (C.x - .5) * 2 * slideR);
    this.drift = this.drift * Math.pow(.995, 48000 / sr) + rng.b() * .1 * Math.sqrt(48000 / sr);
    var fT = clamp(base * E.pitchMul * Math.pow(2, this.drift * slack * 4 * E.instab / 1200), sr / 7000, 2500);
    if (this.f === 0) this.f = fT;
    this.f += (fT - this.f) * srAlpha(.3, sr);
    var f = this.f;
    var dT = C.on && !exm ? clamp(P['ebow.sustain'] * (.3 + .7 * C.p) + C.spd * .5, 0, 1.3) : 0;
    var hp = P['ebow.harm'] | 0, h = hp + 1;
    if (hp === 3) {
      this.hT -= n;
      if (this.hT <= 0) { var q = dT + D; this.h = q > .9 && rng.u() < (q - .8) ? (rng.u() < .5 ? 2 : 3) : 1; this.hT = sr * (.3 + rng.u() * 1.5); }
      h = this.h;
    }
    var T60 = .5 + 9 * (1 - damp) * (1 - damp) * (.5 + E.matT * .5);
    var g = Math.pow(10, -3 / (T60 * f));
    var c48 = clamp(.5 + .48 * (1 - damp) * (.6 + .4 * E.material), .05, .98);
    var c = srAlpha(c48, sr);
    // tension modulation: a slack string goes sharp as it swings wider (pitch rise ~ amplitude squared), so pressing
    // harder bends it up steadily, up to about a semitone at slack 1. Tuned so a medium drive sits on the written pitch.
    var kT = slack * .06, eR = 1 / .25, kN = 1 + kT * .6, buzz = P['ebow.buzz'], thr = 1.1 - buzz * .9;
    var pos = clamp(P['ebow.pos'] + (C.on && C.hz <= 0 ? (C.y - .5) * .2 : 0), .03, .5);
    var det = Math.pow(2, (3 + E.detune) / 1200), sub = E.subAmt;
    var fh = Math.min(f * h, sr * .4), w0 = TAU * fh / sr, al = Math.sin(w0) / 8, a0 = 1 / (1 + al), b0 = al * a0, a1 = -2 * Math.cos(w0) * a0, a2 = (1 - al) * a0;
    var drUp = srAlpha(.0008, sr), drDn = srAlpha(.001, sr), envC = srAlpha(.0006, sr), agcC = srAlpha(.003, sr);
    var mask = this.mask, w = this.w, dr = this.dr, dinc = TAU * f * .5 / sr;
    for (var i = 0; i < n; i++) L[i] = 0;
    for (var k = 0; k < 2; k++) {
      var b = this.b[k], ih = this.ih[k], lp = this.lp[k], env = this.env[k], agc = this.agc[k];
      var x1 = this.bx1[k], x2 = this.bx2[k], y1 = this.by1[k], y2 = this.by2[k], ax = this.apX[k], ay0 = this.apY[k];
      // loop length: period minus the loss filter's delay, plus a measured correction table for the driver phase
      // (calibrated at slack 0 over loop lengths 32-4096 samples and the whole damping/material range)
      var Pp = sr / (k ? f * det : f), t0 = ebowTune(32, c48), Lb = Pp - (1 - c) / c + 1.3 + t0 + (ebowTune(Pp * 48000 / sr, c48) - t0) * sr / 48000, amp = k ? .6 : 1;
      w = this.w; dr = this.dr;
      if (C.kick > 0) {
        // strike: a narrow bump near the end of the string (bright boom); pluck: a triangle peaked at 1/5 (rounder)
        var Lk = Math.min(Lb, this.N - 2), ka = C.kick * (exm === 2 ? .9 : 1.4) * amp;
        for (var j = 0; j < Lk; j++) { var u = j / Lk, sh = exm === 2 ? (u < .2 ? u / .2 : (1 - u) / .8) : (u > .06 && u < .2 ? Math.sin(Math.PI * (u - .06) / .14) : 0); b[(w - 1 - j) & mask] += ka * sh; }
        env = Math.max(env, .02);
      }
      for (i = 0; i < n; i++) {
        dr += (dT - dr) * (dT > dr ? drUp : drDn);
        var A = env * eR, Le = Math.max(2, Lb * kN / (1 + kT * Math.min(A * A, 4)));
        var rp = w - Le, i0 = Math.floor(rp), fr = rp - i0;
        var y = b[i0 & mask] * (1 - fr) + b[(i0 + 1) & mask] * fr;
        lp += c * (y - lp);
        var ay = y < 0 ? -y : y; env += envC * (ay - env);
        var bp = b0 * (y - x2) - a1 * y1 - a2 * y2; x2 = x1; x1 = y; y2 = y1; y1 = bp;
        var ab = bp < 0 ? -bp : bp; agc += agcC * (ab - agc);
        var q2 = 1.5 * bp / (agc + .01); q2 = q2 / (1 + (q2 < 0 ? -q2 : q2));
        var inj = dr * (.05 * q2 + .004 * rng.b());
        ih[w & mask] = inj;
        var v = lp * g + inj - .5 * ih[(w - ((Le * pos) | 0)) & mask] + (sym ? sym[i] * symG * (1 - dr) : 0);
        if (v > thr) v = thr + (v - thr) * .2;
        v = v / (1 + .15 * v * v) + 1e-18;
        b[w & mask] = v;
        L[i] += amp * (y - .6 * b[(w - ((Le * .13) | 0)) & mask]);
        w++;
      }
      this.lp[k] = lp; this.env[k] = env; this.agc[k] = agc; this.bx1[k] = x1; this.bx2[k] = x2; this.by1[k] = y1; this.by2[k] = y2; this.apX[k] = ax; this.apY[k] = ay0;
    }
    this.w = w & mask; this.dr = dr; C.kick = 0;
    // harmonic modes come out of the loop hotter than the fundamental: level-match them
    var hmT = h > 1 ? .55 : 1; this.hm += (hmT - this.hm) * srAlpha(.05, sr); if (this.hm !== 1) for (i = 0; i < n; i++) L[i] *= this.hm;
    // the string sits off-centre over the pickup: an asymmetric (even-order) term, 2nd harmonic about 20 dB down
    this.hg.run(L, n, .16, 0, .03, 0, 1 - Math.exp(-1 / (.03 * sr)), sr);
    // piezo pickup blend: a level-normalised soft clip of the string (rich in harmonics), high-passed at 250 Hz, adds the
    // upper harmonics that let a 50 Hz drone read on laptop and phone speakers without adding more sub
    var e0 = this.env[0], sph = this.sph, d1 = this.dc1, d2 = this.dc2, og = 1.3, pz = P['ebow.pickup'] * 8, Z = this.pz, dcR = Math.pow(.998, 48000 / sr), pzEnvC = srAlpha(.002, sr);
    for (i = 0; i < n; i++) {
      sph += dinc; if (sph > TAU) sph -= TAU;
      var o = L[i] * og + Math.sin(sph) * sub * e0 * 3;
      if (pz > 0) { var aL = L[i] < 0 ? -L[i] : L[i]; Z.env += pzEnvC * (aL - Z.env); var en = Z.env * 1.5 + 1e-6, qz = L[i] * 6 / en; qz = qz / (1 + (qz < 0 ? -qz : qz)) * en * .5; var hpv = Z.b0 * (qz - 2 * Z.x1 + Z.x2) - Z.a1 * Z.y1 - Z.a2 * Z.y2; Z.x2 = Z.x1; Z.x1 = qz; Z.y2 = Z.y1; Z.y1 = hpv + 1e-18; o += hpv * pz; }
      d2 = o - d1 + dcR * d2; d1 = o; L[i] = d2;
    }
    this.sph = sph; this.dc1 = d1; this.dc2 = d2;
  };

  /* ---------- 2. Hurdy-gurdy: three bowed waveguide strings on a rosined wheel ---------- */
  function Hurdy(E) {
    this.E = E; this.N = 8192; this.mask = this.N - 1; this.st = [];
    for (var i = 0; i < 3; i++) this.st.push({ nd: new Float32Array(this.N), bd: new Float32Array(this.N), sf: 0, f: 0, apBx: 0, apBy: 0, apNx: 0, apNy: 0 });
    this.w = 0; this.bv = 0; this.nz = 0; this.crank = 0; this.pc = 0; this.bz = 0; this.bzl = 0;
    this.mf = [182, 287, 405, 540, 790, 1210]; this.mq = [.07, .06, .05, .05, .04, .03];
    this.y1 = new Float64Array(6); this.y2 = new Float64Array(6); this.x1 = 0; this.x2 = 0; this.sph = 0; this.env = 0;
    this.ma1 = new Float64Array(6); this.ma2 = new Float64Array(6); this.mb = new Float64Array(6); this.lens = new Float64Array(3); this.fr = new Float64Array(3); this.gains = [1, .75, .65];
  }
  Hurdy.prototype.reset = function () { for (var i = 0; i < 3; i++) { this.st[i].nd.fill(0); this.st[i].bd.fill(0); this.st[i].sf = this.st[i].apBx = this.st[i].apBy = this.st[i].apNx = this.st[i].apNy = 0; } this.bv = 0; this.y1.fill(0); this.y2.fill(0); };
  Hurdy.prototype.render = function (L, R, n, C, P) {
    var E = this.E, sr = E.sr, D = E.dread, rng = E.rng, mask = this.mask;
    var crT = C.on ? P['hurdy.crank'] * (C.auto ? Math.min(1, C.spd / .4) : .45 + 1.6 * C.spd) : 0;
    this.crank += (crT - this.crank) * srAlpha(.04, sr);
    var cr = this.crank, acc = (cr - this.pc) / (n / sr); this.pc = cr;
    var buzzP = P['hurdy.buzz'];
    if (acc > 6 - buzzP * 4.5) this.bz = Math.min(1, this.bz + .5);
    this.bz *= Math.pow(.93, 48000 / sr);
    var bzAmt = buzzP * Math.min(1, this.bz + Math.max(0, cr - (3.6 - buzzP * 2.4)) * .6);
    var pr = clamp(P['hurdy.press'] * (C.on ? .55 + .75 * C.p : 1), 0, 1), cn = Math.min(1, cr / 3);
    var bvT = cr > .02 ? .035 * Math.min(1, cn * 10) + .19 * cn : 0, slope = 5 - 4 * pr, rosin = P['hurdy.rosin'] * E.instab;
    var root = P['hurdy.root'] * E.pitchMul;
    var r2 = E.dr2 || 1.5 + (1.41421 - 1.5) * clamp((D - .3) * 2, 0, 1), r3 = 2 + .1189 * clamp((D - .5) * 2, 0, 1);
    var mel = P['hurdy.melody'] > .5 && C.on ? Math.pow(2, Math.round(C.x * 12) / 12) : 1;
    var fr = this.fr; fr[0] = root * Math.pow(2, -E.detune / 2400); fr[1] = root * r2; fr[2] = C.hz > 0 ? C.hz * E.pitchMul : root * r3 * mel;
    var pole = clamp(.75 - .2 * 22050 / sr - (E.material - .5) * .2, .2, .9), fg = .95;
    var gains = this.gains, bv = this.bv, nz = this.nz, w = this.w;
    var ma1 = this.ma1, ma2 = this.ma2, mb = this.mb;
    for (var k = 0; k < 6; k++) { var Rr = Math.exp(-6.91 / (this.mq[k] * (.5 + E.matT) * sr)), th = TAU * this.mf[k] / sr; ma1[k] = 2 * Rr * Math.cos(th); ma2[k] = Rr * Rr; mb[k] = (1 - Rr * Rr) / 2; }
    var fC = srAlpha(.2, sr), nzC = srAlpha(.02, sr), bvC = srAlpha(.0008, sr), bzlC = srAlpha(.25, sr), envC = srAlpha(.0005, sr);
    var lens = this.lens;
    for (k = 0; k < 3; k++) { var s = this.st[k]; if (s.f === 0) s.f = fr[k]; s.f += (fr[k] - s.f) * fC; lens[k] = clamp(sr / s.f - 3.3, 8, 8000); }
    var st = this.st, bzl = this.bzl, x1 = this.x1, x2 = this.x2, y1 = this.y1, y2 = this.y2, sph = this.sph, env = this.env, sub = E.subAmt, dinc = TAU * st[0].f * .5 / sr;
    for (var i = 0; i < n; i++) {
      nz += nzC * (rng.b() - nz);
      bv += (bvT - bv) * bvC;
      var vb = bv * (1 + rosin * 6 * nz), sum = 0, z2 = 0;
      for (k = 0; k < 3; k++) {
        s = st[k];
        var lb = Math.max(1, lens[k] * .127), ln = Math.max(1, lens[k] - lb);
        var rp = w - lb, i0 = Math.floor(rp), f0 = rp - i0, rb = s.bd[i0 & mask] * (1 - f0) + s.bd[(i0 + 1) & mask] * f0;
        rp = w - ln; i0 = Math.floor(rp); f0 = rp - i0; var rn = s.nd[i0 & mask] * (1 - f0) + s.nd[(i0 + 1) & mask] * f0;
        s.sf = fg * ((1 - pole) * rb + pole * s.sf) + 1e-18;
        var br = -s.sf, nr = -rn, dv = vb - (br + nr), q = dv * slope; if (q < 0) q = -q; q += .75; q = 1 / (q * q); q *= q; if (q > 1) q = 1;
        var nv = dv * q;
        s.nd[w & mask] = br + nv; s.bd[w & mask] = nr + nv;
        sum += rb * gains[k]; if (k === 1) z2 = rb;
      }
      w++;
      var bzs = clamp(z2 * 14, -1, 1); bzl += bzlC * (bzs - bzl);
      var x = sum + (bzs - bzl) * bzAmt * .22, body = 0;
      for (k = 0; k < 6; k++) { var y = ma1[k] * y1[k] - ma2[k] * y2[k] + mb[k] * (x - x2); y2[k] = y1[k]; y1[k] = y; body += y; }
      x2 = x1; x1 = x;
      var ax = x < 0 ? -x : x; env += envC * (ax - env);
      sph += dinc; if (sph > TAU) sph -= TAU;
      L[i] = x * 1.1 + body * 2.2 + Math.sin(sph) * sub * env * 3;
    }
    this.w = w & mask; this.bv = bv; this.nz = nz; this.bzl = bzl; this.x1 = x1; this.x2 = x2; this.sph = sph; this.env = env;
  };

  /* ---------- modal bank driven through a friction (velocity-weakening) contact ---------- */
  function Fric(n) { this.n = n; this.a1 = new Float64Array(n); this.a2 = new Float64Array(n); this.bb = new Float64Array(n); this.wi = new Float64Array(n); this.wo = new Float64Array(n); this.y1 = new Float64Array(n); this.y2 = new Float64Array(n); this.x1 = 0; this.x2 = 0; this.fl = 0; this.cnt = 0; }
  Fric.prototype.reset = function () { this.y1.fill(0); this.y2.fill(0); this.x1 = this.x2 = this.fl = 0; };
  Fric.prototype.set = function (k, f, t60, wi, wo, sr) {
    if (f > sr * .45 || f < 15) { this.bb[k] = 0; this.wi[k] = 0; this.wo[k] = 0; this.a1[k] = 0; this.a2[k] = 0; return; }
    var R = Math.exp(-6.91 / (Math.max(t60, .004) * sr)); this.a1[k] = 2 * R * Math.cos(TAU * f / sr); this.a2[k] = R * R; this.bb[k] = (1 - R * R) / 2; this.wi[k] = wi; this.wo[k] = wo;
  };
  // vb: per-sample bow velocity, pr: normal force, sa: sharpness of the friction curve, nzA: per-sample noise gain, lpc: force low-pass
  Fric.prototype.run = function (out, n, vb, pg, sa, nzA, lpc, rng) {
    var N = this.cnt, a1 = this.a1, a2 = this.a2, bb = this.bb, wi = this.wi, wo = this.wo, y1 = this.y1, y2 = this.y2, x1 = this.x1, x2 = this.x2, fl = this.fl;
    for (var i = 0; i < n; i++) {
      var v = 0, k;
      for (k = 0; k < N; k++) v += wi[k] * y1[k];
      var u = (vb[i] - v) * sa, x = pg[i] * u * Math.exp(.5 - .5 * u * u) + nzA[i];
      fl += lpc * (x - fl); x = fl;
      var o = 0, xd = x - x2;
      for (k = 0; k < N; k++) { var y = a1[k] * y1[k] - a2[k] * y2[k] + bb[k] * xd + 1e-18; y2[k] = y1[k]; y1[k] = y; o += y * wo[k]; }
      x2 = x1; x1 = x; out[i] = o;
    }
    this.x1 = x1; this.x2 = x2; this.fl = fl;
  };

  /* ---------- 3. Bowed metal ---------- */
  var BOW_SETS = [
    { r: [1, 6.267, 17.55, 34.39, 56.84, 84.91, 2.89, 11.3, 25.2], g: [1, .8, .6, .45, .3, .2, .25, .2, .15], t: 2.2 },
    { r: [1, 2.756, 5.404, 8.933, 13.34, 18.64, 24.81, 31.87], g: [1, .85, .7, .6, .5, .4, .3, .25], t: 3 },
    { r: [1, 2.02, 3.01, 4.08, 5.03, 6.1, 7.2, 8.15, 9.3, 10.4], g: [1, .8, .7, .6, .5, .45, .4, .35, .3, .25], t: 3.5 },
    { r: [1, 1.47, 2.09, 2.56, 3.19, 3.86, 4.31, 5.12, 5.87, 6.73, 7.61, 8.44, 9.6, 11.1], g: [1, .9, .8, .8, .7, .7, .6, .6, .5, .5, .4, .4, .3, .3], t: 1.6 },
    // cymbal: a thin circular plate (Bessel-like ratios, crowded and inharmonic); bowed at the edge it screams and shimmers
    { r: [1, 1.59, 2.14, 2.3, 2.65, 2.92, 3.16, 3.5, 3.6, 4.06, 4.6, 5.13, 5.65, 6.25], g: [.8, 1, .9, .7, .8, .6, .7, .55, .5, .5, .45, .4, .35, .3], t: 4.5 }
  ];
  function Bowed(E) { this.E = E; this.m = new Fric(14); this.vb = new Float32Array(BL); this.nz = new Float32Array(BL); this.pg = new Float32Array(BL); this.v = 0; this.bend = .5; this.wob = 0; this.hg = new HG(); this.lpr = -1; this.kk = 0; this.jmp = 0; }
  Bowed.prototype.reset = function () { this.m.reset(); this.v = 0; this.lpr = -1; this.kk = 0; this.jmp = 0; };
  Bowed.prototype.render = function (L, R, n, C, P) {
    var E = this.E, sr = E.sr, m = this.m, ob = clamp(P['bowed.object'] | 0, 0, 4), S = BOW_SETS[ob], N = S.r.length; m.cnt = N;
    var pr = clamp(P['bowed.press'] * (C.on ? .4 + C.p : 1), 0, 1.4);
    var bT = clamp(P['bowed.bend'] + (C.on && C.hz <= 0 ? (C.y - .5) * .7 : 0), 0, 1); this.bend += (bT - this.bend) * srAlpha(.15, sr);
    // a ruler's pitch is set by how far it hangs over the edge: Ruler length (cm), with Bend / overhang moving it +/-30%
    var bend = this.bend, Lr = P['bowed.length'] * (.7 + .6 * bend), damp = P['bowed.damp'];
    var f0 = (C.hz > 0 ? C.hz : ob === 0 ? rulerHz(Lr) : P['bowed.size']) * E.pitchMul;
    // pressure picks the mode: light bow pressure favours high modes, heavy pressure the low ones. A pressure change of
    // more than 0.15 triggers a smooth damping burst + bow-hair noise so the bow can jump modes without clicking.
    if (C.on) { if (this.lpr < 0) this.lpr = pr; if (Math.abs(pr - this.lpr) > .15) { this.lpr = pr; this.kk = 1; for (var q = 0; q < N; q++) { m.y1[q] *= .2; m.y2[q] *= .2; } } } else this.lpr = -1;
    var prf = clamp(pr / 1.1, 0, 1), rt = Math.pow(ob === 0 ? 30 : 10, .85 * (1 - prf)), wd = E.water * .04, wv = E.wv;
    this.wob += n / sr * 5.3; var vib = 1 + Math.sin(this.wob) * .002 * E.instab;
    var pos = C.on ? .04 + C.x * .4 : .1, T = S.t * (1 - damp * .9) * E.matT, st = 1 + E.matStretch;
    if (ob === 1) { if (C.on) this.rx = C.x; } var imm = ob === 1 ? immerse(E, this.rx === undefined ? .5 : this.rx) : 1;
    for (var k = 0; k < N; k++) {
      var r = S.r[k], f;
      if (ob === 0) f = f0 * r;
      else if (ob === 2) f = f0 * Math.pow(r, .78 + .44 * bend) * (.75 + .5 * bend);
      else f = f0 * Math.pow(r, .9 + .2 * bend);
      f = f0 * Math.pow(f / f0, st) * vib;
      if (ob !== 0 && wd > 0) f *= 1 + wd * wv[k];   // water in the waterphone: each mode wobbles on its own
      if (ob === 1) f *= imm;
      var t60 = T * 1000 / (1000 + E.matSlope * f) * (.6 + .4 / (1 + k * .3));
      var lr = Math.log(r / rt), wi = S.g[k] * (.3 + .7 * Math.abs(Math.sin((k + 1) * 2.9 * (pos + .06)))) * (.06 + 2 * Math.exp(-1.5 * lr * lr));
      m.set(k, f, t60, wi, S.g[k] * (.6 + .4 * E.matBright), sr);
    }
    var vT = C.on ? (C.auto ? P['bowed.speed'] * (.5 + C.p * .7) : C.spd * (.4 + 1.6 * P['bowed.speed'])) : 0;
    vT = Math.min(vT, 1.2) * .5;
    var v = this.v, vC = srAlpha(.0015, sr), vb = this.vb, nz = this.nz, sa = (1.6 + .5 * Math.min(pr, 1)) / Math.max(vT, .04), pg = this.pg, pgv = (1 + 4 * pr) * Math.max(vT, .04), rng = E.rng, nzG = (.02 + .1 * pr * pr) * (.5 + E.matBright);
    for (var i = 0; i < n; i++) { v += (vT - v) * vC; vb[i] = v; nz[i] = v * nzG * rng.b(); pg[i] = pgv; }
    this.v = v;
    if (this.kk > 0) { for (i = 0; i < n; i++) nz[i] += this.kk * .02 * rng.b(); this.kk *= Math.pow(.5, 48000 / sr); if (this.kk < .01) this.kk = 0; }
    m.run(L, n, vb, pg, sa, nz, srAlpha(.5 + .4 * E.matBright, sr), E.rng);
    for (i = 0; i < n; i++) L[i] *= 2.6;
    // stick-slip is not sinusoidal: the bow's sawtooth-like contact force puts harmonics on whichever mode is singing
    var hq = .5 + .5 * Math.min(pr, 1); this.hg.run(L, n, .06 * hq, .1 * hq, .03 * hq, .04 * hq, 1 - Math.exp(-1 / (.02 * sr)), sr);
  };

  /* ---------- 4. Glass & friction ---------- */
  var GLASS_SETS = [
    { f: 870, r: [1, 1.58, 2.24, 2.92, 3.46, 4.1, 5.3, 6.1, 7.9, 9.4, 11.2, 13.1], t: .35 },
    { f: 640, r: [1, 2.32, 4.25, 6.63, 9.38, 12.5, 1.004, 2.33], t: 2.6 },
    { f: 1150, r: [.28, 1, 1.9, 2.6, 4.1, 5.8, 7.7], t: .5 },
    { f: 520, r: [1, 1.7, 2.9, 3.6, 4.3, 5.1, 5.8, 6.6, 7.3, 8.1, 9.2, 10.4], t: .045 }
  ];
  function Glass(E) { this.E = E; this.hg = new HG(); this.fp = 0; this.fa = 0; this.m = new Fric(12); this.vb = new Float32Array(BL); this.nz = new Float32Array(BL); this.pg = new Float32Array(BL); this.pu = 0; this.pa = 0; this.v = 0; this.stuck = true; this.cnt = 0; this.sp = 0; this.pv = 0; this.sq = 0; }
  Glass.prototype.reset = function () { this.m.reset(); this.v = 0; };
  Glass.prototype.render = function (L, R, n, C, P) {
    var E = this.E, sr = E.sr, m = this.m, S = GLASS_SETS[P['glass.surface'] | 0], N = S.r.length, ct = P['glass.contact'] | 0, rng = E.rng; m.cnt = N;
    var pr = clamp(P['glass.press'] * (C.on ? .4 + C.p : 1), 0, 1.4), wet = P['glass.wet'], jud = P['glass.judder'] * E.instab;
    var f0 = (C.hz > 0 ? C.hz * 4 : S.f * P['glass.size']) * E.pitchMul * ((P['glass.surface'] | 0) === 1 ? 1 - .2 * (P['glass.fill'] || 0) : 1), pos = C.x, tilt = C.on && C.hz <= 0 ? C.y : .5, st = 1 + E.matStretch;
    for (var k = 0; k < N; k++) {
      var f = f0 * Math.pow(S.r[k], st), t60 = S.t * (.4 + E.matT * .6) * 1400 / (1400 + E.matSlope * f);
      var wi = (.35 + .65 * Math.abs(Math.sin((k + 1.3) * 2.3 * (pos + .11)))) * Math.pow((k + 1) / N * 2, (tilt - .5) * 2.4) / (1 + k * .08);
      if (ct === 1) wi /= (1 + k * .5); else wi *= 1 + k * .22;
      m.set(k, f, t60, wi, 1 / (1 + k * (ct === 1 ? .35 : .1)), sr);
    }
    var spd = C.on ? (C.auto ? .45 : C.spd) : 0;
    // squeak tail on a sudden stop
    if (this.pv - spd > .12) this.sq = Math.min(1, (this.pv - spd) * 3);
    this.pv = spd; this.sq *= .9;
    spd = Math.min(1, spd + this.sq * .5);
    this.sp += (spd - this.sp) * srAlpha(.2, sr); spd = this.sp;
    var vSlip = spd > .004 ? .06 + .5 * spd : 0, duty = clamp(.22 + .8 * wet, 0, 1), fS = 3 + 42 * spd * (1.2 - pr * .5);
    var nzG = ct === 2 ? .5 : ct === 1 ? .04 : .14, sa = (ct === 1 ? 1.6 : 1.7 + .4 * pr) / Math.max(vSlip, .06), lpc = srAlpha(ct === 1 ? .28 : ct === 2 ? .6 : .95, sr);
    // finger contact: once the finger is lifted (and any squeak tail has run out) the friction no longer touches the glass.
    // Left coupled, the idle contact could pump the modes and the glass would sing on by itself (heard after the Walls moment).
    this.cg = (this.cg === undefined ? 1 : this.cg) + ((C.on || vSlip > 0 ? 1 : 0) - (this.cg === undefined ? 1 : this.cg)) * srAlpha(.05, sr);
    var v = this.v, vb = this.vb, nz = this.nz, pg = this.pg, cnt = this.cnt, stuck = this.stuck, sm = srAlpha(ct === 1 ? .01 : .12, sr);
    var pgv = (1 + 4 * pr) * Math.max(vSlip, .06) * this.cg, bs = 0, pu = this.pu, pa = this.pa, PL = Math.max(4, (sr * (ct === 1 ? .0025 : .00018)) | 0);
    for (var k2 = 0; k2 < N; k2++) bs += m.bb[k2] * m.wi[k2];
    var kx = .02 * N / (bs + 1e-9) * (ct === 1 ? .5 : 1);
    for (var i = 0; i < n; i++) {
      if (duty < .98 && vSlip > 0) {
        if (--cnt <= 0) {
          var per = sr / fS * Math.exp(jud * 1.1 * rng.b());
          stuck = !stuck; cnt = Math.max(8, per * (stuck ? 1 - duty : duty));
          if (!stuck) { pu = PL; pa = pr * (.25 + spd) * (.5 + rng.u()) * kx / PL * (rng.u() < .5 ? -1 : 1); }
        }
      } else stuck = false;
      v += ((stuck ? 0 : vSlip) - v) * sm; vb[i] = v; pg[i] = stuck ? pgv * .04 : pgv;
      var ex = v * nzG * pr * rng.b() * kx * .02;
      if (pu > 0) { ex += pa * (.5 - .5 * Math.cos(TAU * pu / PL)); pu--; }
      nz[i] = ex;
    }
    this.v = v; this.cnt = cnt; this.stuck = stuck; this.pu = pu; this.pa = pa;
    m.run(L, n, vb, pg, sa, nz, lpc, rng);
    var gG = (ct === 1 ? .62 : 5) * ((P['glass.surface'] | 0) === 3 ? .5 : 1);
    for (i = 0; i < n; i++) L[i] *= gG;
    if (ct === 1) {
      // a wet finger: the (2,0) mode with its harmonics 20-40 dB down (the rubbing force is not a sine), and the
      // 4-8 Hz beat of the finger circling the rim past the vibration's nodes, faster as the finger speeds up
      var hm = P['glass.harm'] === undefined ? 1 : P['glass.harm']; if (hm > 0) this.hg.run(L, n, .05 * hm, .06 * hm, .02 * hm, 0, 1 - Math.exp(-1 / (.03 * sr)), sr, true);
      var fr = TAU * (4 + 4 * Math.min(1, spd * 1.6)) / sr, fp = this.fp, fa = this.fa, faT = spd > .01 ? .42 * (P['glass.beat'] === undefined ? 1 : P['glass.beat']) : 0, faC = srAlpha(.0005, sr);
      for (i = 0; i < n; i++) { fp += fr; if (fp > TAU) fp -= TAU; fa += (faT - fa) * faC; L[i] *= 1 - fa * .5 * Math.cos(fp); }
      this.fp = fp; this.fa = fa;
    }
  };

  /* ---------- 5. Struck & plucked metal (polyphonic modal) ---------- */
  var STR_SETS = [
    { r: [1, 6.267, 17.55, 34.39, 56.84, 2.9, 11.4], g: [1, .5, .3, .2, .1, .12, .1], t: [1, .5, .3, .2, .15, .3, .2] },
    { r: [1, 2.756, 5.404, 8.933, 13.34, 18.64, 24.81, 31.87], g: [1, .8, .64, .5, .4, .32, .25, .2], t: [1, .8, .6, .45, .35, .25, .2, .15] },
    { r: [.5, 1, 1.2, 1.5, 2, 2.5, 2.67, 3, 4, 5.33, 6.67, 8.2, .5017, 1.004], g: [.6, 1, .7, .5, .8, .3, .3, .4, .35, .2, .15, .1, .4, .6], t: [1.6, 1, .8, .7, .6, .45, .4, .35, .3, .2, .15, .1, 1.5, .95] },
    { r: [1, 1.47, 2.09, 2.56, 3.19, 3.86, 4.31, 5.12, 5.87, 6.73, 7.61, 8.44, 9.6, 11.1], g: [1, .9, .8, .8, .7, .7, .6, .6, .5, .5, .4, .4, .3, .3], t: [1, .9, .8, .75, .7, .6, .55, .5, .45, .4, .35, .3, .25, .2] },
    { r: [1, 1.58, 2.21, 2.95, 3.6, 4.8, 6.3], g: [1, .6, .4, .3, .2, .12, .08], t: [1, .7, .5, .4, .3, .2, .15] }
  ];
  // 12 voices; stealing takes the oldest voice and hands its sound to a fade voice that ramps out over 5 ms (no click)
  var SV = 12;
  function SVoice() { return { on: false, n: 0, obj: 0, R: new Float64Array(14), th: new Float64Array(14), a1: new Float64Array(14), a2: new Float64Array(14), g: new Float64Array(14), y1: new Float64Array(14), y2: new Float64Array(14), pl: 0, pp: 0, vel: 0, nzm: 0, life: 0, slap: 0, gs: 0, age: 0, wait: 0, clk: 0, cn: 0, cb1: 0, cb2: 0, fade: 0 }; }
  function Struck(E) {
    this.E = E; this.v = [];
    for (var i = 0; i < SV; i++) this.v.push(SVoice());
    this.fv = SVoice(); this.FADE = Math.max(16, Math.round(E.sr * .005));
    var w0 = TAU * 1800 / E.sr, al = Math.sin(w0) / (2 * 1.5), a0 = 1 + al; this.cbp = { b0: al / a0, a1: -2 * Math.cos(w0) / a0, a2: (1 - al) / a0 };
  }
  Struck.prototype.reset = function () { for (var i = 0; i < SV; i++) this.v[i].on = false; this.fv.on = false; };
  // clk: beater click level (4 ms of band-limited noise around 1.8 kHz); dly: start offset in samples inside the next block
  Struck.prototype.trigger = function (hz, vel, pos, obj, hard, decay, clk, dly) {
    var E = this.E, sr = E.sr, P = E.P, v = null, i, vi = -1;
    for (i = 0; i < SV; i++) if (!this.v[i].on) { vi = i; break; }
    if (vi < 0) {
      for (i = 0, vi = 0; i < SV; i++) if (this.v[i].age > this.v[vi].age) vi = i;
      var old = this.v[vi], spare = this.fv; this.fv = old; old.fade = this.FADE; this.v[vi] = spare;
    }
    v = this.v[vi];
    if (obj === undefined || obj < 0) obj = P['struck.object'] | 0;
    if (hard === undefined) hard = P['struck.hard'];
    if (decay === undefined) decay = P['struck.decay'];
    var S = STR_SETS[obj], N = S.r.length, wood = obj === 4;
    var matT = wood ? .5 : E.matT, slope = wood ? 2.5 : E.matSlope, st = 1 + (wood ? 0 : E.matStretch), maxT = 0, gs = 0;
    if (wood) decay = Math.min(decay, 1.2) * .25;
    hz *= E.pitchMul; if (obj === 1) hz *= immerse(E, E.strX);
    for (var k = 0; k < N; k++) {
      var f = hz * Math.pow(S.r[k], st) * (1 + E.detune * .00006 * E.rng.b()), t60 = decay * S.t[k] * matT * 1000 / (1000 + slope * f * .5);
      if (f > sr * .45) { v.g[k] = 0; v.a1[k] = 0; v.a2[k] = 0; continue; }
      var R = Math.exp(-6.91 / (Math.max(t60, .005) * sr)), th = TAU * f / sr;
      v.a1[k] = 2 * R * Math.cos(th); v.a2[k] = R * R; v.R[k] = R; v.th[k] = th;
      v.g[k] = Math.sin(th) * S.g[k] * (.25 + .75 * Math.abs(Math.sin((k + 1) * 2.7 * (pos * .8 + .12))));
      gs += v.g[k]; if (t60 > maxT) maxT = t60;
      v.y1[k] = 0; v.y2[k] = 0;
    }
    // the resonator gain falls with frequency (sin th), so a ruler down at 16-65 Hz gets its level back here
    v.n = N; v.on = true; v.obj = obj; v.vel = (vel * vel * .9 + vel * .1) * [9, 1.2, 1, 1.2, 2][obj] * (obj === 0 ? clamp(150 / hz, 1, 6) : 1);
    v.pl = Math.max(3, Math.round(sr * (.0085 - .0082 * Math.sqrt(clamp(hard * (.6 + .5 * E.matBright) * (.6 + .4 * vel), 0, 1)))));
    v.pp = 0; v.nzm = .15 * hard; v.wait = dly > 0 ? dly | 0 : 0; v.life = Math.round(sr * maxT * 1.3) + v.pl + v.wait; v.age = 0; v.fade = 0;
    v.clk = clk > 0 ? clk * vel : 0; v.cn = Math.round(sr * .004); v.cb1 = v.cb2 = 0;
    v.slap = obj === 0 ? P['struck.slap'] : 0; v.gs = gs;
  };
  Struck.prototype.voice = function (v, L, n, rng) {
    var N = v.n, a1 = v.a1, a2 = v.a2, g = v.g, y1 = v.y1, y2 = v.y2, pl = v.pl, pp = v.pp, sc = v.vel * 2 / pl * 28, slap = v.slap, thr = 2.2 * v.vel * (1.05 - slap), sk = slap > 0 ? .5 / (v.gs + 1e-9) : 0, d = 0;
    var fade = v.fade, fs = this.FADE, wait = v.wait, cb = this.cbp, i;
    for (i = 0; i < n; i++) {
      if (wait > 0) { wait--; continue; }
      var x = 0, k;
      if (pp < pl) { x = sc * (.5 - .5 * Math.cos(TAU * pp / pl)) * (1 + v.nzm * rng.b() * 3); pp++; }
      if (sk > 0 && d > thr) x -= (d - thr) * sk * 1.6;
      d = 0;
      for (k = 0; k < N; k++) { var y = a1[k] * y1[k] - a2[k] * y2[k] + g[k] * x + 1e-18; y2[k] = y1[k]; y1[k] = y; d += y; }
      if (v.clk > 0 && v.cn > 0) { var nz = rng.b(), c = cb.b0 * nz - cb.a1 * v.cb1 - cb.a2 * v.cb2; v.cb2 = v.cb1; v.cb1 = c; d += c * v.clk * 160 * (v.cn / (this.E.sr * .004)); v.cn--; }
      if (fade > 0) { d *= fade / fs; if (--fade === 0) { v.on = false; break; } }
      L[i] += d;
    }
    v.pp = pp; v.wait = wait; v.age += n; if (v.fade > 0) v.fade = fade; if (v.age > v.life) v.on = false;
  };
  Struck.prototype.render = function (L, R, n) {
    var rng = this.E.rng, any = false, i, wd = this.E.water * .04, wv = this.E.wv;
    // water: rods, bells and clock springs wobble in pitch as if half sunk in a waterphone's bowl
    if (wd > 0) for (var j0 = 0; j0 < SV; j0++) { var v0 = this.v[j0]; if (!v0.on || v0.obj === 0 || v0.obj === 4) continue; for (var k0 = 0; k0 < v0.n; k0++) if (v0.g[k0]) v0.a1[k0] = 2 * v0.R[k0] * Math.cos(v0.th[k0] * (1 + wd * wv[(k0 + j0) & 15])); }
    for (i = 0; i < n; i++) L[i] = 0;
    for (var j = 0; j < SV; j++) { var v = this.v[j]; if (!v.on) continue; any = true; this.voice(v, L, n, rng); }
    if (this.fv.on) { any = true; this.voice(this.fv, L, n, rng); }
    for (i = 0; i < n; i++) L[i] *= .022;
    return any;
  };

  /* ---------- 6. Spring tank: dispersive allpass chains in a feedback loop (source and send) ----------
     A real spring is a dispersive waveguide: low frequencies travel slowest, so every echo is a falling "drip"
     (high partials arrive first, the low end last), and nothing above the transition frequency Fc (3-5 kHz) gets through
     cleanly. Each spring is a chain of M stretched first-order allpasses (z^-K) with a NEGATIVE coefficient, which gives
     more group delay at low frequencies, plus a plain delay that sets the round trip Td (about 50-60 ms, after the
     calibrated model of Valimaki, Parker and Abel 2010). Mode "E-bow" holds the tank in sustain with a magnetic driver. */
  function Spring(E) {
    // three springs of different length and dispersion (a real tank has two or three), so no single falling tone dominates
    this.E = E; this.s = [];
    this.bufN = nextPow2(Math.max(16384, Math.ceil(.1 * E.sr))); this.bufMask = this.bufN - 1;
    var M = [64, 52, 44], td = [.0546, .0631, .0712], AP = [347, 419, 491];
    for (var i = 0; i < 3; i++) {
      var apLen = Math.max(16, Math.round(AP[i] * E.sr / 48000));
      this.s.push({ M: M[i], d: new Float32Array(M[i] * 16), buf: new Float32Array(this.bufN), w: 0, td: td[i], am: [1, .86, .74][i], lp1: 0, lp2: 0, hp: 0, hx: 0, eq1: 0, eq2: 0, ex1: 0, ex2: 0,
        ap: new Float32Array(apLen), apN: apLen, apw: 0, t1: 0, t2: 0 });
    }
    this.p = 0; this.K = 6; this.exc = 0; this.exAt = 0; this.bWait = 0; this.burst = 0; this.bLen = 1; this.bAmp = 0; this.bLc = .1; this.bz = 0; this.bz2 = 0; this.pd = 0; this.shT = 0; this.nl = 0; this.quiet = 0;
    this.eb = 0; this.last = 0; this.ebe = 0; this.dr = 0; this.rat = 0;
  }
  Spring.prototype.reset = function () { for (var i = 0; i < 3; i++) { var s = this.s[i]; s.d.fill(0); s.buf.fill(0); s.ap.fill(0); s.apw = 0; s.lp1 = s.lp2 = s.hp = s.hx = s.eq1 = s.eq2 = s.ex1 = s.ex2 = s.t1 = s.t2 = 0; } this.eb = 0; this.last = 0; this.ebe = 0; this.rat = 0; this.bz = this.bz2 = 0; };
  // a hit is not a clean impulse (that rings out as a pitched "pew"): it is a short scrape of low-passed noise, darker and
  // longer for a soft touch, brighter and shorter for a hard knock, which sets how bright the tank rings (dr)
  Spring.prototype.hit = function (vel, dly) {
    var sr = this.E.sr; this.exc += vel; this.exAt = dly > 0 ? dly | 0 : 0; this.bWait = this.exAt;
    this.bLen = this.burst = Math.round(sr * (.016 - .008 * vel)); this.bAmp = vel * (1.2 + 2.2 * vel); this.bLc = 1 - Math.exp(-TAU * (500 + 2800 * vel * vel) / sr);
    this.dr = Math.max(this.dr, vel); this.rat = Math.max(this.rat, vel > .4 ? (vel - .4) * 1.4 : 0);
  };
  Spring.prototype.render = function (L, R, n, C, P, inp) {
    var E = this.E, sr = E.sr, rng = E.rng, mode = P['spring.mode'] | 0;
    // transition frequency from tension: 2.2 kHz (slack) to 4.2 kHz (tight); K is the stretch of each allpass
    var Fc = 2200 + 2000 * P['spring.tension'], K = clamp(Math.round(sr / (2 * Fc)), 2, 16);
    if (K !== this.K) { this.K = K; this.p = 0; }
    var a = -(.15 + .32 * P['spring.disp']), T60 = P['spring.decay'] * (.6 + .4 * E.matT), aa = -a;
    var spd = C.on ? C.spd : 0, shake = mode === 1 && C.on ? spd : 0, scr = mode === 2 && C.on ? spd * (.3 + C.p) : 0;
    // brightness follows how hard the tank was last driven: a touch rings dull (about 1.1 kHz), a knock splashes (4 kHz)
    this.dr = Math.max(this.dr * Math.exp(-n / (.55 * sr)), Math.min(1, scr * .45 + shake * .7));
    var fT = Math.min(sr / (2 * K) * .9, 900 + 1900 * Math.pow(this.dr, 1.5), sr * .45), lc = 1 - Math.exp(-TAU * fT / sr), p = this.p;
    // e-bow driver: senses the tank output, band-limits and soft-clips it, and feeds it back in (sustain without a bow)
    var ebT = mode === 3 && C.on ? (.35 + .65 * C.p) * (C.auto ? 1 : .6 + .8 * Math.min(1, C.spd * 3 + .3)) : 0;
    this.eb += (ebT - this.eb) * srAlpha(.02, sr); var eb = this.eb, ebe = this.ebe, last = this.last, rat = this.rat, rD = Math.exp(-1 / (.07 * sr));
    var ebeC = srAlpha(.001, sr), nlC = srAlpha(.3, sr), hpR = Math.pow(.995, 48000 / sr), bufN = this.bufN, bufMask = this.bufMask;
    this.exc = 0;
    // low-mid body around 180 Hz (the tank's measured low chirp peak): one resonant band-pass added back in
    var w0 = TAU * 180 / sr, al = Math.sin(w0) / (2 * 1.2), a0 = 1 + al, eb0 = al / a0, ea1 = -2 * Math.cos(w0) / a0, ea2 = (1 - al) / a0;
    var bLc = this.bLc, bz = this.bz, bz2 = this.bz2;
    for (var i = 0; i < n; i++) {
      var x = inp ? inp[i] : 0;
      if (this.bWait > 0) this.bWait--; else if (this.burst > 0) { var bu = this.burst / this.bLen; bz += bLc * (rng.b() - bz); bz2 += bLc * (bz - bz2); x += this.bAmp * bz2 * 6 * bu * Math.sqrt(1 - bu + .02); this.burst--; }
      if (shake > .02) { if (--this.shT <= 0) { this.shT = sr / (4 + 60 * shake) * (.3 + rng.u() * 1.4); x += shake * (shake > .6 ? 1.6 : 1) * rng.b() * 40; } }
      if (scr > 0) { this.nl += nlC * (rng.b() - this.nl); x += this.nl * scr * 4.5; }   // was 48: a scrape ran 20 dB over every other voice (peaks above 0 dBFS)
      if (eb > .001) { var av = last < 0 ? -last : last; ebe += ebeC * (av - ebe); var qd = last * 3 / (ebe + .02); qd = qd / (1 + (qd < 0 ? -qd : qd)); x += eb * (qd * .09 + .002 * rng.b()); }
      // coil rattle: after a hard knock the coils clash against each other for a moment (sparse ticks, dying away)
      if (rat > .002) { rat *= rD; if (rng.u() < .08) x += rat * rng.b(); }
      var o3 = 0, oL = 0, oR = 0, pk = 0;
      for (var j = 0; j < 3; j++) {
        var s = this.s[j], M = s.M, d = s.d, aj = a * s.am, aaj = aa * s.am;
        var dcj = K * (1 + aaj) / (1 - aaj), D = Math.min(bufN - 4, Math.max(sr * .003, s.td * sr - M * dcj));
        var g = Math.pow(10, -3 * s.td / T60);
        var rp = s.w - D, i0 = Math.floor(rp), fr = rp - i0, fb = s.buf[i0 & bufMask] * (1 - fr) + s.buf[(i0 + 1) & bufMask] * fr;
        var v = x * (j === 2 ? .7 : 1) + fb * g;
        for (var k = 0, q = p; k < M; k++, q += 16) { var z = d[q], t = v - aj * z; d[q] = t; v = aj * t + z; }
        // diffusion inside the loop (a Schroeder allpass): the echoes smear into a splash instead of a clean repeat
        var apz = s.ap[s.apw], apw0 = v + apz * .55, apy = apz - .55 * apw0; s.ap[s.apw] = apw0; s.apw = s.apw + 1 === s.apN ? 0 : s.apw + 1; v = apy;
        s.lp1 += lc * (v - s.lp1); s.lp2 += lc * (s.lp1 - s.lp2) + 1e-18;
        var o = s.lp2; s.hp = o - s.hx + hpR * s.hp; s.hx = o; o = s.hp;
        s.buf[s.w & bufMask] = -o; s.w = (s.w + 1) & bufMask;
        var bp = eb0 * (o - s.ex2) - ea1 * s.eq1 - ea2 * s.eq2; s.ex2 = s.ex1; s.ex1 = o; s.eq2 = s.eq1; s.eq1 = bp + 1e-18; o += bp * .8;
        var ao = o < 0 ? -o : o; if (ao > pk) pk = ao;
        if (j === 0) oL = o; else if (j === 1) oR = o; else o3 = o;
      }
      p++; if (p >= K) p = 0;
      var l = (oL + .55 * o3) * 1.25, r = (oR + .55 * o3) * 1.25; last = l; L[i] = (l + .3 * r) * .6; R[i] = (r + .3 * l) * .6;
    }
    this.p = p; this.exAt = 0; this.ebe = ebe; this.last = last; this.rat = rat; this.bz = bz; this.bz2 = bz2;
  };

  /* ---------- 7. Junk drawer + magnet: particle simulation driving modal impacts ----------
     Loose junk in a wooden drawer. Each item has a material (steel nut or washer, steel screw, brass, glass, wood) and a
     size; every impact rings four inharmonic modes of that item, re-drawn a little on every hit (where it was struck and
     how it landed), with higher modes dying faster, excited by a short contact pulse with a little grit (harder hits:
     shorter contact, brighter). Impacts land at their own sample inside the 128-sample block, glancing hits set off
     neighbours, scraping makes faint Poisson-timed micro-collisions, and items rattle as they come to rest. Everything
     also knocks the drawer's own wooden box (Tray ring = how open it is: shut, it rings shorter and the junk is muffled).
     Steel items cling to the magnet instead of buzzing against each other under it. */
  var JUNK_R = [[1, 1.71, 2.63, 3.82], [1, 2.76, 5.40, 8.93], [1, 2.32, 4.25, 6.63], [1, 2.09, 3.66, 5.51], [1, 2.57, 4.13, 6.29]];
  var JUNK_F = [[1500, 2300], [2000, 2800], [950, 1600], [2300, 3000], [520, 850]];   // first mode: lo + span * size draw
  var JUNK_T = [.075, .06, .17, .13, .028];        // T60 of the first mode (s)
  var JUNK_D = [5000, 7000, 3500, 9000, 1300];     // frequency-dependent damping: T60 = T / (1 + f / D)
  var JUNK_C = [.18, .15, .25, .12, .7];           // contact time (ms) at a medium hit
  var JUNK_B = [.3, .25, .3, .2, .9];              // how much of the hit goes into the drawer's wooden box
  var JUNK_A = [1, .9, 1, .8, 1.3];                // level trim per material
  var DRAWER_F = [143, 209, 291, 377, 503, 662, 874, 1163, 1530], DRAWER_WL = [1, .6, .9, .4, .8, .5, .6, .35, .3], DRAWER_WR = [.7, 1, .4, .9, .5, .8, .35, .6, .25];
  function Junk(E) {
    this.E = E; var M = 80, r = new Rng(9001), i;
    this.px = new Float32Array(M); this.py = new Float32Array(M); this.vx = new Float32Array(M); this.vy = new Float32Array(M); this.r = new Float32Array(M); this.cool = new Float32Array(M); this.h = new Float32Array(M);
    this.cS = new Uint8Array(M); this.cM = new Uint8Array(M); this.ps = new Float32Array(M); this.cl = new Uint8Array(M);
    for (i = 0; i < M; i++) { this.px[i] = .08 + r.u() * .84; this.py[i] = .08 + r.u() * .84; this.r[i] = .012 + r.u() * .02; this.h[i] = r.u(); }
    // materials: the steel bin holds nuts, washers and screws; the mixed bin also brass, glass (marbles, shards) and wood (pegs, dice)
    for (i = 0; i < M; i++) { var u = r.u(); this.cS[i] = u < .6 ? 0 : 1; this.cM[i] = u < .3 ? 0 : u < .45 ? 1 : u < .68 ? 2 : u < .83 ? 3 : 4; }
    // how far each item slides or rolls once let go (per 2.67 ms): flat washers stop short, round glass rolls on
    this.fq = new Float32Array(M); for (i = 0; i < M; i++) this.fq[i] = this.cM[i] === 3 ? .955 + .02 * r.u() : .84 + .1 * r.u(); this.fqD = 0; this.frq = new Float32Array(M);
    var V = this.V = 32; this.a1 = new Float64Array(V * 4); this.a2 = new Float64Array(V * 4); this.b = new Float64Array(V * 4); this.y1 = new Float64Array(V * 4); this.y2 = new Float64Array(V * 4);
    this.del = new Int32Array(V); this.con = new Int32Array(V); this.cn = new Int32Array(V); this.life = new Int32Array(V); this.lv = new Float32Array(V); this.lk = new Float32Array(V);
    this.ca = new Float32Array(V); this.gz = new Float32Array(V); this.gl = new Float32Array(V); this.gr = new Float32Array(V); this.bs = new Float32Array(V); this.dg = new Float32Array(V); this.act = new Int32Array(V);
    // pending impacts (secondary hits, rest rattles, scrape grit): absolute frame, item, energy, kind
    var Q = this.QN = 96; this.qt = new Float64Array(Q); this.qi = new Int32Array(Q); this.qe = new Float32Array(Q); this.qk = new Uint8Array(Q); this.qn = 0;
    this.da1 = new Float64Array(9); this.da2 = new Float64Array(9); this.db = new Float64Array(9); this.dy1 = new Float64Array(9); this.dy2 = new Float64Array(9);
    this.rng = new Rng(4242); this.count = 40; this.mx = .5; this.my = .5; this.mon = false; this.fc = 0; this.mvx = 0; this.mvy = 0; this.n = BL;
    this.reset();
  }
  Junk.prototype.reset = function () {
    this.y1.fill(0); this.y2.fill(0); this.del.fill(0); this.con.fill(0); this.life.fill(0); this.lv.fill(0); this.vx.fill(0); this.vy.fill(0); this.ps.fill(0); this.cl.fill(0); this.qn = 0;
    this.dy1.fill(0); this.dy2.fill(0); this.bx1 = this.bx2 = 0; this.sl = this.slT = this.b1 = this.b2 = 0; this.lpL = this.lpR = this.lpL2 = this.lpR2 = this.cL = this.cR = 0; this.mu = -1;
  };
  Junk.prototype.queue = function (t, i, e, k) { if (this.qn < this.QN) { var q = this.qn++; this.qt[q] = t; this.qi[q] = i; this.qe[q] = e; this.qk[q] = k; } };
  // an impact of item i with energy e (about 0..2); wall: against the drawer's wood; off: sample offset inside the block
  Junk.prototype.tick = function (i, e, wall, off) {
    var E = this.E, sr = E.sr, rng = this.rng, V = this.V, lv = this.lv, j = 0, k, best = 1e9;
    for (k = 0; k < V; k++) { if (this.life[k] <= 0) { j = k; best = -1; break; } if (lv[k] < best) { best = lv[k]; j = k; } }   // a free voice, else the quietest
    var mat = E.P['junk.mat'] | 0, c = mat === 0 ? this.cS[i] : mat === 1 ? 2 : this.cM[i], R = JUNK_R[c], F = JUNK_F[c];
    var hard = e / (1 + e), size = .022 / this.r[i];
    // where it was struck and how it landed: the whole object shifts up to +-2.5 %, each mode another +-1.2 %
    var f1 = (F[0] + F[1] * this.h[i]) * Math.pow(size, .7) * (.85 + .3 * E.material) * Math.min(4, Math.sqrt(E.pitchMul)) * (1 + .025 * rng.b());
    var T = JUNK_T[c] * (.4 + E.matT * .6) * (wall ? .8 : 1) * (.8 + .4 * rng.u()), D = JUNK_D[c], o = j * 4, maxT = 0;
    var amp = hard * (wall ? 1.1 : .8) * (.7 + .45 * rng.u()) * JUNK_A[c];
    for (var m = 0; m < 4; m++) {
      var f = f1 * R[m] * (1 + (m ? .012 * rng.b() : 0)), am = m ? (.15 + .85 * rng.u()) * (m === 1 ? .8 : m === 2 ? .55 : .4) : .6 + .4 * rng.u();
      if (f > Math.min(16000, sr * .4)) { am = 0; f = 1000; }
      var t = T / (1 + f / D) * (m ? 1 : 1), Rr = Math.exp(-6.91 / (t * sr)), th = TAU * f / sr;
      this.a1[o + m] = 2 * Rr * Math.cos(th); this.a2[o + m] = Rr * Rr; this.b[o + m] = amp * am * Math.sin(th);
      if (am > 0 && t > maxT) maxT = t;
    }
    // contact: harder and smaller = shorter (brighter); a raised half-sine with a little grit
    var cms = JUNK_C[c] * (1.25 - .6 * hard) * (.8 + .4 * rng.u()) * (wall ? 1.3 : 1), cn = Math.max(4, Math.round(cms * .001 * sr));
    this.cn[j] = cn; this.con[j] = cn; this.ca[j] = Math.PI / (2 * cn); this.gz[j] = c === 4 ? .9 : .45;
    this.del[j] = off > 0 ? off | 0 : 0; this.dg[j] = amp * .9;       // the direct contact click (band-limited by the pulse)
    var pn = clamp(this.px[i] + .08 * rng.b(), 0, 1) * 1.5708; this.gl[j] = Math.cos(pn); this.gr[j] = Math.sin(pn);
    this.bs[j] = (wall ? 1.4 : JUNK_B[c]) * (.5 + .5 * rng.u());
    this.life[j] = (this.del[j] + cn + maxT * 1.4 * sr) | 0; this.lv[j] = amp; this.lk[j] = Math.exp(-6.91 * BL / (maxT * sr));
    // a glancing hit sets a neighbour going a few ms later (no further chains)
    if (!wall && off >= 0 && e > .25 && rng.u() < .3) this.queue(this.fc + (off > 0 ? off : 0) + (2 + 10 * rng.u()) * .001 * sr, (rng.u() * this.count) | 0, e * (.25 + .3 * rng.u()), 1);
  };
  Junk.prototype.sim = function (C, P, dt) {
    var E = this.E, rng = this.rng, N = this.count = clamp(P['junk.count'] | 0, 4, 80), px = this.px, py = this.py, vx = this.vx, vy = this.vy, rr = this.r, ps = this.ps, cl = this.cl, n = this.n;
    // agitation only while the magnet is down (touched, looped or held); released items glide, knock and rattle to rest
    var on = C.on, str = P['junk.magnet'] * (on ? .5 + C.p : 0), ag = on ? P['junk.agit'] + C.spd * .5 : 0, S = 0, i, j;
    if (on && this.mon) { this.mvx = (C.x - this.mx) / dt; this.mvy = (C.y - this.my) / dt; } else { this.mvx = this.mvy = 0; }
    this.mon = on; if (on) { this.mx = C.x; this.my = C.y; }
    // the clump under the magnet: about the radius that N items pack into; inside it things press together instead of buzzing
    if (this.fqD !== dt) { this.fqD = dt; for (i = 0; i < 80; i++) this.frq[i] = Math.pow(this.fq[i], dt / .00267); }
    var mx = this.mx, my = this.my, frq = this.frq, ckR = .035 + .021 * Math.sqrt(N), ck = 1 - Math.pow(.45, dt / .00267), ck2 = 1 - Math.pow(.7, dt / .00267), mat = P['junk.mat'] | 0;
    for (i = 0; i < N; i++) {
      cl[i] = 0;
      if (on) {
        var dx = mx - px[i], dy = my - py[i], d2 = dx * dx + dy * dy + .003, d = Math.sqrt(d2), F = Math.min(60, str * 1.1 / d2);
        // steel in the clump clings and rides with the magnet; brass, glass and wood in it are only jammed in among the rest
        if (d < ckR) { var mg = mat === 0 || (mat === 2 && this.cM[i] < 2), kk = mg ? ck : ck2; cl[i] = 1; F *= .12; vx[i] += (this.mvx - vx[i]) * kk; vy[i] += (this.mvy - vy[i]) * kk; }
        vx[i] += dx / d * F * dt; vy[i] += dy / d * F * dt;
      }
      if (rng.u() < ag * .012) { vx[i] += rng.b() * .9; vy[i] += rng.b() * .9; }
      var fr = frq[i]; vx[i] *= fr; vy[i] *= fr;
      var sp = Math.sqrt(vx[i] * vx[i] + vy[i] * vy[i]);
      if (sp > 3) { vx[i] *= 3 / sp; vy[i] *= 3 / sp; sp = 3; }
      if (sp < .012) { vx[i] = 0; vy[i] = 0; sp = 0; }
      // coming to rest: a few settling rattles, closer and quieter each time (a nut rocking, a washer spinning down)
      if (sp === 0 && ps[i] > .08 && !cl[i] && rng.u() < .7) {
        var k = 1 + ((rng.u() * 3.2) | 0), tt = this.fc + n + rng.u() * .06 * E.sr, gap = (.012 + .035 * rng.u()) * E.sr, ee = Math.min(.5, ps[i] * .35) * (.6 + .6 * rng.u());
        for (var q = 0; q < k; q++) { tt += gap; this.queue(tt, i, ee, 2); gap *= .5 + .25 * rng.u(); ee *= .45 + .25 * rng.u(); }
      }
      ps[i] = sp > ps[i] ? sp : sp === 0 && ps[i] > .08 ? 0 : ps[i] * .97; if (!cl[i]) S += sp;   // recent peak speed (cleared once it has rattled)
      px[i] += vx[i] * dt; py[i] += vy[i] * dt;
      if (this.cool[i] > 0) this.cool[i] -= dt;
      var r = rr[i], e = 0, pen = 0;
      if (px[i] < r) { pen = r - px[i]; px[i] = r; e = -vx[i]; vx[i] *= -.4; } else if (px[i] > 1 - r) { pen = px[i] - 1 + r; px[i] = 1 - r; e = vx[i]; vx[i] *= -.4; }
      if (py[i] < r) { pen = Math.max(pen, r - py[i]); py[i] = r; e = Math.max(e, -vy[i]); vy[i] *= -.4; } else if (py[i] > 1 - r) { pen = Math.max(pen, py[i] - 1 + r); py[i] = 1 - r; e = Math.max(e, vy[i]); vy[i] *= -.4; }
      if (e > .15 && this.cool[i] <= 0) { this.tick(i, e * .8, true, this.when(pen, e, dt)); this.cool[i] = .03 + .02 * rng.u(); }
    }
    for (i = 0; i < N; i++) for (j = i + 1; j < N; j++) {
      var ax = px[j] - px[i]; var rs = rr[i] + rr[j]; if (ax > rs || ax < -rs) continue;
      var ay = py[j] - py[i]; var dd = ax * ax + ay * ay; if (dd >= rs * rs || dd < 1e-9) continue;
      var di = Math.sqrt(dd), nx = ax / di, ny = ay / di, ov = (rs - di) * .5;
      px[i] -= nx * ov; py[i] -= ny * ov; px[j] += nx * ov; py[j] += ny * ov;
      var rel = (vx[j] - vx[i]) * nx + (vy[j] - vy[i]) * ny;
      if (rel < 0) {
        var J = -rel * .7; vx[i] -= nx * J; vy[i] -= ny * J; vx[j] += nx * J; vy[j] += ny * J;
        var a = rr[i] < rr[j] ? i : j;
        if (-rel > .07 && this.cool[a] <= 0 && !(cl[i] && cl[j])) { this.tick(a, -rel * 1.3, false, this.when(ov * 2, -rel, dt)); this.cool[a] = .02 + rng.u() * .035; }
      }
    }
    this.slT = Math.min(1, S * .035);
    // scraping: faint micro-collisions at a Poisson rate that follows how much is sliding
    var lam = 90 * this.slT * dt; while (lam > 0) { if (rng.u() < Math.min(1, lam)) this.queue(this.fc + rng.u() * n, (rng.u() * N) | 0, .03 + .1 * rng.u() * this.slT, 3); lam -= 1; }
    // pending impacts that fall inside this block
    var qn = this.qn, end = this.fc + n;
    for (q = 0; q < qn; q++) if (this.qt[q] < end) {
      var it = this.qi[q] < N ? this.qi[q] : (rng.u() * N) | 0; this.tick(it, this.qe[q], this.qk[q] === 2 && rng.u() < .3, Math.max(0, this.qt[q] - this.fc) | 0 || -1);
      qn--; this.qt[q] = this.qt[qn]; this.qi[q] = this.qi[qn]; this.qe[q] = this.qe[qn]; this.qk[q] = this.qk[qn]; q--;
    }
    this.qn = qn;
  };
  // when inside the block a contact began, from how deep it went and how fast it closed (plus a fraction of a ms of jitter)
  Junk.prototype.when = function (pen, v, dt) { var f = 1 - pen / Math.max(1e-4, v * dt); f = clamp(f, 0, 1) * .85 + .15 * this.rng.u(); return Math.min(this.n - 1, Math.max(1, (f * this.n) | 0)); };
  Junk.prototype.render = function (L, R, n, C, P) {
    var E = this.E, sr = E.sr, rng = this.rng; this.n = n; this.sim(C, P, n / sr);
    var V = this.V, a1 = this.a1, a2 = this.a2, bb = this.b, y1 = this.y1, y2 = this.y2, del = this.del, con = this.con, cnA = this.cn, ca = this.ca, gz = this.gz, gl = this.gl, gr = this.gr, bs = this.bs, dg = this.dg;
    var tray = P['junk.tray'], k, act = this.act, na = 0, life = this.life;
    for (k = 0; k < V; k++) if (life[k] > 0) { act[na++] = k; life[k] -= n; this.lv[k] *= this.lk[k]; if (life[k] <= 0) { var o0 = k * 4; y1[o0] = y1[o0 + 1] = y1[o0 + 2] = y1[o0 + 3] = y2[o0] = y2[o0 + 1] = y2[o0 + 2] = y2[o0 + 3] = 0; } }
    // the drawer's wooden box: longer ring the further it is open; shut, it is a smaller, duller box
    var mT = clamp(tray / .3, 0, 1); mT = mT * mT * (3 - 2 * mT); var muT = 1 - mT;
    if (this.mu < 0) this.mu = muT;
    var mu0 = this.mu, mu1 = mu0 + (muT - mu0) * .15; this.mu = mu1;
    var da1 = this.da1, da2 = this.da2, dbb = this.db, dy1 = this.dy1, dy2 = this.dy2;
    for (k = 0; k < 9; k++) { var t60 = (.05 + .13 * tray) / (1 + k * .15) * (.6 + .4 * E.matT), Rr = Math.exp(-6.91 / (t60 * sr)), th = TAU * DRAWER_F[k] * (1 + .15 * mu1) / sr; da1[k] = 2 * Rr * Math.cos(th); da2[k] = Rr * Rr; dbb[k] = (1 - Rr * Rr) * .5; }
    var muff = mu0 > .002 || mu1 > .002, fcA = 16000 * Math.pow(800 / 16000, mu0), fcB = 16000 * Math.pow(800 / 16000, mu1), lcA = 1 - Math.exp(-TAU * fcA / sr), lcB = 1 - Math.exp(-TAU * fcB / sr);
    var cLc = 1 - Math.exp(-TAU * 7000 / sr), cL = this.cL, cR = this.cR, lpL = this.lpL, lpR = this.lpR, lpL2 = this.lpL2, lpR2 = this.lpR2;
    var sl = this.sl, slT = this.slT, b1 = this.b1, b2 = this.b2, bx1 = this.bx1, bx2 = this.bx2, any = slT > .001 || sl > .001 || na > 0, bodyG = 2.2 * (.4 + .6 * tray + .8 * mu1);
    for (var i = 0; i < n; i++) {
      var l = 0, r = 0, cx = 0, bx = 0;
      for (var q = 0; q < na; q++) {
        var v = act[q], o = v * 4, x = 0;
        if (del[v] > 0) del[v]--;
        else if (con[v] > 0) { var c0 = cnA[v] - con[v]; x = Math.sin((c0 + .5) * ca[v] * 2) * ca[v] * (1 + gz[v] * rng.b()); con[v]--; var xc = x * dg[v] * cnA[v] * .35; cx += xc * (gl[v] + gr[v]) * .5; bx += x * bs[v]; }
        var y = a1[o] * y1[o] - a2[o] * y2[o] + bb[o] * x; y2[o] = y1[o]; y1[o] = y; var s = y;
        y = a1[o + 1] * y1[o + 1] - a2[o + 1] * y2[o + 1] + bb[o + 1] * x; y2[o + 1] = y1[o + 1]; y1[o + 1] = y; s += y;
        y = a1[o + 2] * y1[o + 2] - a2[o + 2] * y2[o + 2] + bb[o + 2] * x; y2[o + 2] = y1[o + 2]; y1[o + 2] = y; s += y;
        y = a1[o + 3] * y1[o + 3] - a2[o + 3] * y2[o + 3] + bb[o + 3] * x; y2[o + 3] = y1[o + 3]; y1[o + 3] = y; s += y;
        l += s * gl[v]; r += s * gr[v];
      }
      // sliding over wood: band-passed noise with a little grit, also scraping the box
      sl += .002 * (slT - sl);
      var nzz = rng.b() * sl * (rng.u() < .08 ? 2.5 : 1); b1 += .35 * (nzz - b1); b2 += .12 * (b1 - b2); var sn = (b1 - b2) * .35;
      bx += sn * .02;
      cL += cLc * (cx - cL);
      var dx = bx - bx2, dL = 0, dR = 0; bx2 = bx1; bx1 = bx;
      for (k = 0; k < 9; k++) { var yd = da1[k] * dy1[k] - da2[k] * dy2[k] + dbb[k] * dx + 1e-18; dy2[k] = dy1[k]; dy1[k] = yd; dL += yd * DRAWER_WL[k]; dR += yd * DRAWER_WR[k]; }
      var jl = (l + cL + sn * .045 + dL * bodyG) * 3.2, jr = (r + cL + sn * .045 + dR * bodyG) * 3.2;
      if (muff) { var u = i / n, lc = lcA + (lcB - lcA) * u, mg = 1 - .5 * (mu0 + (mu1 - mu0) * u); lpL += lc * (jl - lpL); lpL2 += lc * (lpL - lpL2); lpR += lc * (jr - lpR); lpR2 += lc * (lpR - lpR2); jl = lpL2 * mg; jr = lpR2 * mg; }
      // a gentle soft knee keeps pile-ups of ticks from slamming the master limiter
      L[i] = jl / (1 + .5 * (jl < 0 ? -jl : jl)); R[i] = jr / (1 + .5 * (jr < 0 ? -jr : jr));
    }
    if (!muff) { lpL = lpL2 = lpR = lpR2 = 0; }
    this.sl = sl; this.b1 = b1; this.b2 = b2; this.bx1 = bx1; this.bx2 = bx2; this.cL = cL + 1e-18; this.lpL = lpL; this.lpR = lpR; this.lpL2 = lpL2; this.lpR2 = lpR2; this.fc += n;
    return any;
  };

  /* ---------- 8. Aura pad: granular cloud over a capture of the instrument's own dry bus ---------- */
  function Aura(E) {
    this.E = E; this.N = nextPow2(Math.max(1 << 19, Math.ceil(11 * E.sr))); this.mask = this.N - 1; this.buf = new Float32Array(this.N); this.w = 0;
    var G = this.G = 32; this.pos = new Float64Array(G); this.rate = new Float32Array(G); this.len = new Int32Array(G); this.age = new Int32Array(G); this.gl = new Float32Array(G); this.gr = new Float32Array(G); this.act = new Uint8Array(G);
    this.hann = new Float32Array(2050); for (var i = 0; i < 2050; i++) this.hann[i] = .5 - .5 * Math.cos(TAU * i / 2048);
    this.acc = 0; this.lpL = 0; this.lpR = 0; this.ph = 0; this.lv = 0; this.frozen = false; this.n = 0; this.e1 = 0; this.ref = 0; this.ag = 1;
  }
  Aura.prototype.reset = function () { this.act.fill(0); };
  Aura.prototype.capture = function (dL, dR, n) {
    if (this.frozen) return;
    var b = this.buf, w = this.w, m = this.mask;
    for (var i = 0; i < n; i++) { b[w] = (dL[i] + dR[i]) * .5; w = (w + 1) & m; }
    this.w = w;
  };
  Aura.prototype.render = function (L, R, n, C, P) {
    var E = this.E, sr = E.sr, rng = E.rng, G = this.G, mask = this.mask, buf = this.buf, hann = this.hann;
    this.frozen = P['aura.freeze'] > .5 || E.autoFreeze;
    var size = P['aura.size'] * .001 * sr * (E.pitchSt < -12 ? 1.6 : 1), dens = P['aura.density'] * (1 + 1.5 * E.mAura), blur = C.on && !C.auto ? clamp(P['aura.blur'] * .5 + C.y * .7, 0, 1) : P['aura.blur'];
    var on = C.on, lvT = on ? (C.auto ? 1 : .5 + C.p * .8) : 0;
    if (on) {
      this.acc += n;
      var iv = size / dens;
      while (this.acc >= iv) {
        this.acc -= iv * (.7 + .6 * rng.u());
        for (var g = 0; g < G; g++) if (!this.act[g]) break;
        if (g >= G) break;
        var u = rng.u(), rate = 1, sh = Math.min(.7, P['aura.shimmer'] + .35 * E.mAura), lo = .3 + E.subAmt * .4;
        if (u < lo) rate = E.pitchSt < -12 && rng.u() < .5 ? .25 : .5; else if (u < lo + sh) rate = 2;
        rate *= Math.pow(2, rng.b() * E.detune * 1.5 / 1200);
        var len = Math.max(256, (size * (.6 + .8 * rng.u())) | 0);
        var back = (C.auto ? .05 + rng.u() * (.15 + blur * 4) : C.x * 8 + rng.u() * (.05 + blur * 1.5)) * sr + len * Math.max(1, rate) + 64;
        var maxBack = this.N - Math.max(4096, len * Math.max(0, 1 - rate) + 2048);
        if (back > maxBack) back = maxBack;
        this.pos[g] = this.w - back; this.rate[g] = rate; this.len[g] = len; this.age[g] = 0; this.act[g] = 1;
        var pan = .5 + rng.b() * .45; this.gl[g] = Math.cos(pan * 1.5708); this.gr[g] = Math.sin(pan * 1.5708);
      }
    }
    for (var i = 0; i < n; i++) { L[i] = 0; R[i] = 0; }
    var any = false;
    for (g = 0; g < G; g++) {
      if (!this.act[g]) continue; any = true;
      var pos = this.pos[g], rt = this.rate[g], ln = this.len[g], age = this.age[g], gl = this.gl[g], gr = this.gr[g], hs = 2048 / ln;
      for (i = 0; i < n && age < ln; i++) {
        var i0 = Math.floor(pos), f = pos - i0, s = (buf[i0 & mask] * (1 - f) + buf[(i0 + 1) & mask] * f) * hann[(age * hs) | 0];
        L[i] += s * gl; R[i] += s * gr; pos += rt; age++;
      }
      this.pos[g] = pos; this.age[g] = age; if (age >= ln) this.act[g] = 0;
    }
    this.ph += n / sr * TAU * (.05 + .1 * E.instab * .4); if (this.ph > TAU) this.ph -= TAU;
    var br = 1 - P['aura.breathe'] * .35 * (1 + Math.sin(this.ph)), norm = 2.6 / Math.sqrt(Math.max(1, dens * .5));
    // Frozen leveller: random grain overlap makes a frozen cloud swell and sag by several dB. While frozen, a slow gain
    // (150 ms detector, about 100 ms glide) rides the filtered cloud back to the level it had before the freeze;
    // the intended "breathe" movement is applied after it, so it survives.
    var e1 = this.e1, ref = this.ref, ag = this.ag, k1 = 1 - Math.exp(-1 / (.15 * sr)), k2 = 1 - Math.exp(-1 / (2 * sr)), fz = this.frozen;
    var lc = 1 - Math.exp(-TAU * 500 * Math.pow(36, 1 - P['aura.dark']) / sr), lpL = this.lpL, lpR = this.lpR, lv = this.lv;
    var lvC = srAlpha(.0003, sr), agC = srAlpha(.0002, sr);
    for (i = 0; i < n; i++) {
      lv += (lvT - lv) * lvC; var gg = norm * lv;
      lpL += lc * (L[i] * gg - lpL); lpR += lc * (R[i] * gg - lpR);
      var pw = lpL * lpL + lpR * lpR;
      e1 += k1 * (pw - e1);
      if (!fz) ref += k2 * (pw - ref);
      var gt = fz && e1 > 1e-12 && ref > 1e-12 ? clamp(Math.sqrt(ref / e1), .5, 2) : 1;
      ag += (gt - ag) * agC;
      L[i] = lpL * ag * br; R[i] = lpR * ag * br;
    }
    this.e1 = e1 + 1e-30; this.ref = ref + 1e-30; this.ag = ag;
    this.lpL = lpL + 1e-18; this.lpR = lpR + 1e-18; this.lv = lv;
    return any || on;
  };

  /* ---------- Huge reverb: 8-line Householder FDN with modulated lines ---------- */
  function Reverb(E) {
    this.E = E;
    this.N = nextPow2(Math.max(16384, Math.ceil(.2 * E.sr))); this.mask = this.N - 1;
    this.preN = nextPow2(Math.max(32768, Math.ceil(.3 * E.sr))); this.preMask = this.preN - 1;
    this.apN = nextPow2(Math.max(2048, Math.ceil(.015 * E.sr))); this.apMask = this.apN - 1;
    this.b = []; this.lp = new Float64Array(8); this.d = new Float64Array(8);
    for (var i = 0; i < 8; i++) this.b.push(new Float32Array(this.N));
    this.ms = [31.7, 37.1, 41.3, 47.9, 53.3, 61.1, 67.3, 73.9]; this.w = 0; this.ph = new Float64Array(8);
    this.ap = []; var am = [5.1, 7.7, 11.3];
    for (i = 0; i < 3; i++) this.ap.push({ b: new Float32Array(this.apN), n: Math.min(this.apN - 2, Math.max(1, Math.round(am[i] * E.sr / 1000))), w: 0 });
    this.pre = new Float32Array(this.preN); this.pw = 0; this.hp = 0; this.x = new Float64Array(8); this.g = new Float64Array(8);
  }
  Reverb.prototype.render = function (inp, L, R, n, P) {
    var E = this.E, sr = E.sr, mask = this.mask, preMask = this.preMask, apMask = this.apMask, x = this.x, lp = this.lp, d = this.d, b = this.b;
    var sz = .45 + P['rev.size'] * 1.5, rt = P['rev.decay'];
    var dc48 = 1 - .85 * P['rev.damp'] * (.6 + .4 * (1 - E.matBright * .3));
    var dc = srAlpha(dc48, sr), hpC = srAlpha(.008, sr), modD = 14 * sr / 48000, dC = srAlpha(.05, sr);
    var pre = Math.min(this.preN - 64, ((P['rev.pre'] + 60 * E.distance) * .001 * sr) | 0), g = this.g, k;
    for (k = 0; k < 8; k++) { var dt = Math.min(this.ms[k] * sz * .001 * sr, this.N - 64 - 2 * modD); if (d[k] === 0) d[k] = dt; d[k] += (dt - d[k]) * dC; g[k] = Math.pow(10, -3 * d[k] / (sr * rt)); }
    // each modulated line keeps its own LFO phase and wraps it on its own: one shared phase scaled by (1 + k * .13) jumped
    // when it wrapped, so every 3.2 s the read taps leapt up to 28 samples and the hall ticked
    var w = this.w, ph = this.ph, pinc = TAU * .31 / sr;
    for (var i = 0; i < n; i++) {
      this.hp += hpC * (inp[i] - this.hp);
      var s = inp[i] - this.hp;
      this.pre[this.pw] = s; s = this.pre[(this.pw - pre) & preMask]; this.pw = (this.pw + 1) & preMask;
      for (k = 0; k < 3; k++) { var a = this.ap[k], z = a.b[(a.w - a.n) & apMask], t = s + .6 * z; a.b[a.w] = t; a.w = (a.w + 1) & apMask; s = z - .6 * t; }
      var sum = 0;
      for (k = 0; k < 8; k++) {
        if (!(k & 1)) { ph[k] += pinc * (1 + k * .13); if (ph[k] > TAU) ph[k] -= TAU; }
        var rp = w - d[k] - (k & 1 ? 0 : modD * (1 + Math.sin(ph[k] + k))), i0 = Math.floor(rp), f = rp - i0, bk = b[k];
        var v = bk[i0 & mask] * (1 - f) + bk[(i0 + 1) & mask] * f;
        lp[k] += dc * (v - lp[k]); v = lp[k] * g[k] + 1e-18; x[k] = v; sum += v;
      }
      sum *= .25;
      for (k = 0; k < 8; k++) b[k][w & mask] = x[k] - sum + (k & 2 ? -s : s);
      w++;
      L[i] = (x[0] - x[2] + x[4] - x[6]) * .32; R[i] = (x[1] - x[3] + x[5] - x[7]) * .32;
    }
    this.w = w & mask;
  };

  /* ---------- 9. Superball mallet: a rubber ball on a flexible handle dragged over a membrane, plate or wood ----------
     The ball sticks and slips against the surface (stick-slip). Each slip is a soft rubber pulse; their rate is the moan's
     pitch, which rises with pressure and drag speed and gets pulled onto a nearby mode of the surface. The surface's
     modes colour it: a drumhead (circular membrane ratios), a thin steel sheet, or the wooden cabinet itself. */
  var MOAN_SETS = [
    { b: 150, r: [1, 1.42, 1.93, 2.37, 2.96, 3.61, 4.27, 5.2, 6.2, 7.6, 9.1, 11], t: .22, g: .29 },
    { b: 82, r: [1, 1.594, 2.136, 2.296, 2.653, 2.918, 3.156, 3.501, 3.6, 4.06, 4.6, 5.1], t: .9, g: .67 },
    { b: 46, r: [1, 1.62, 2.31, 2.66, 3.4, 4.1, 4.6, 5.5, 6.3, 7.2, 8.4, 9.7], t: 4, g: .82 },
    // the waterphone's bronze rods (free-free bar ratios, two rod lengths interleaved), standing in the tray's water
    { b: 118, r: [1, 1.33, 2.756, 3.67, 5.404, 7.19, 8.933, 11.9, 13.34, 17.7, 18.64, 24.8], t: 1.1, g: 1.6 }
  ];
  function Moan(E) {
    this.E = E; this.n = 12; this.a1 = new Float64Array(12); this.a2 = new Float64Array(12); this.b = new Float64Array(12); this.g = new Float64Array(12); this.y1 = new Float64Array(12); this.y2 = new Float64Array(12); this.fk = new Float64Array(12);
    this.f = 0; this.ph = 0; this.pu = 0; this.pl = 4; this.pa = 0; this.amp = 0; this.x1 = 0; this.x2 = 0; this.nz = 0; this.dl = 0; this.jit = 0; this.sp = 0;
  }
  Moan.prototype.reset = function () { this.y1.fill(0); this.y2.fill(0); this.amp = 0; this.pu = 0; this.x1 = this.x2 = this.dl = 0; };
  Moan.prototype.render = function (L, R, n, C, P) {
    var E = this.E, sr = E.sr, rng = E.rng, sf = clamp(P['moan.surface'] | 0, 0, 3), S = MOAN_SETS[sf], sz = P['moan.size'], grip = P['moan.grip'], i, k;
    var pr = clamp(P['moan.press'] * (C.on ? .4 + 1.2 * C.p : 1), 0, 1.3), spd = C.on ? (C.auto ? .4 : C.spd) : 0;
    this.sp += (spd - this.sp) * srAlpha(.15, sr); spd = this.sp;
    // surface modes (water wobbles the metal sheet)
    var wd = sf >= 2 ? E.water * .04 : 0, wv = E.wv, pos = C.x, st = 1 + (sf === 0 ? 0 : E.matStretch), mt = sf === 0 ? 1 : E.matT, im = sf === 3 ? immerse(E, pos) : 1;
    for (k = 0; k < 12; k++) {
      var f = S.b / sz * Math.pow(S.r[k], st) * E.pitchMul * (1 + wd * wv[k]) * im; this.fk[k] = f;
      if (f > sr * .45) { this.g[k] = 0; this.a1[k] = this.a2[k] = this.b[k] = 0; continue; }
      var t60 = S.t * mt * 900 / (900 + f * (sf >= 2 ? .3 : 1)), Rr = Math.exp(-6.91 / (t60 * sr)), th = TAU * f / sr;
      this.a1[k] = 2 * Rr * Math.cos(th); this.a2[k] = Rr * Rr; this.b[k] = (1 - Rr * Rr) * .5;
      this.g[k] = (.3 + .7 * Math.abs(Math.sin((k + 1) * 2.4 * (pos + .1)))) / (1 + k * .12);
    }
    // stick-slip rate: pressure and speed raise it, the handle angle (y) bends it, grip makes it lower and rougher
    var fT = C.hz > 0 ? C.hz : P['moan.pitch'] * (.55 + .75 * pr) * (.75 + .5 * Math.min(spd * 1.5, 1)) * (1 + (C.on && C.hz <= 0 ? (C.y - .5) * .6 : 0)) * (1.15 - .3 * grip);
    fT *= E.pitchMul;
    // mode lock: within 7% of a surface mode the slip rate is pulled onto it (the moan "catches" and swells)
    var best = 1, lk = 0; for (k = 0; k < 12; k++) { var d = Math.log(this.fk[k] / fT); if (d < 0) d = -d; if (d < best) { best = d; lk = k; } }
    var lock = best < .07 ? (1 - best / .07) * (.3 + .5 * grip) : 0; if (lock > 0) fT += (this.fk[lk] - fT) * lock;
    if (this.f === 0) this.f = fT; this.f += (fT - this.f) * srAlpha(.08, sr);
    var aT = spd > .01 ? Math.min(1, spd * 2.5) * (.25 + .75 * Math.min(pr, 1)) * (1 + lock * .6) : 0;
    var f0 = this.f, ph = this.ph, pu = this.pu, pl = this.pl, pa = this.pa, amp = this.amp, x1 = this.x1, x2 = this.x2, nz = this.nz, dl = this.dl, jit = this.jit;
    var a1 = this.a1, a2 = this.a2, bb = this.b, g = this.g, y1 = this.y1, y2 = this.y2, rough = (.004 + .025 * grip) * E.instab, out = S.g * 1.5;
    var amUp = srAlpha(.002, sr), amDn = srAlpha(.0008, sr), nzC = srAlpha(.2, sr), dlC = srAlpha(.15, sr);
    for (i = 0; i < n; i++) {
      amp += (aT - amp) * (aT > amp ? amUp : amDn);
      ph += f0 / sr * (1 + jit);
      if (ph >= 1) { ph -= 1; jit = rng.b() * rough; pl = Math.max(3, Math.round(sr / (f0 * 2.8))); pu = pl; pa = amp * (1 + rng.b() * .15 * grip); }
      var x = 0; if (pu > 0) { x = pa * (.5 - .5 * Math.cos(TAU * pu / pl)); pu--; }
      nz += nzC * (rng.b() - nz); x += nz * amp * .06;
      var xd = x - x2, o = 0; x2 = x1; x1 = x;
      for (k = 0; k < 12; k++) { var y = a1[k] * y1[k] - a2[k] * y2[k] + bb[k] * xd + 1e-18; y2[k] = y1[k]; y1[k] = y; o += y * g[k]; }
      // the ball and handle themselves radiate a little of the raw squeal
      dl += dlC * (x - dl);
      L[i] = (o * 6 + (x - dl) * .5) * out; R[i] = L[i];
    }
    this.ph = ph; this.pu = pu; this.pl = pl; this.pa = pa; this.amp = amp; this.x1 = x1; this.x2 = x2; this.nz = nz; this.dl = dl + 1e-18; this.jit = jit;
  };

  /* ---------- shared wooden body with a contact-mic (piezo) character ----------
     In the real machine every string, rod and spring is bolted to one resonant wooden box and heard through piezo
     pickups. Every voice sends its post-distance output here (amount per voice: struck, junk and mallet hardest), the
     box's modes ring, and Piezo moves from the warm box sound to the quacky, bass-light contact-mic sound. */
  var BODY_F = [98, 131, 176, 219, 268, 337, 402, 486, 590, 712, 868, 1050], BODY_W = [.6, .5, .8, .35, 1, .5, 1, 0, 1];
  function Body(E) {
    this.E = E; var n = 12; this.a1 = new Float64Array(n); this.a2 = new Float64Array(n); this.b = new Float64Array(n); this.y1 = new Float64Array(n); this.y2 = new Float64Array(n);
    this.x1 = 0; this.x2 = 0; this.h1 = 0; this.h2 = 0; this.hy1 = 0; this.hy2 = 0; this.p1 = 0; this.p2 = 0; this.py1 = 0; this.py2 = 0; this.sz = 0; this.q = 999; this.pk = 0;
  }
  Body.prototype.reset = function () { this.y1.fill(0); this.y2.fill(0); this.x1 = this.x2 = this.h1 = this.h2 = this.hy1 = this.hy2 = this.p1 = this.p2 = this.py1 = this.py2 = 0; };
  Body.prototype.render = function (inp, L, R, n, P) {
    var sr = this.E.sr, i, k, mx = 0;
    for (i = 0; i < n; i++) { var a = inp[i] < 0 ? -inp[i] : inp[i]; if (a > mx) mx = a; }
    if (mx < 1e-7) { if (++this.q > 300) { if (this.q === 301) this.reset(); L.fill(0); R.fill(0); return; } } else this.q = 0;
    var sz = P['body.size'];
    if (sz !== this.sz) { this.sz = sz; for (k = 0; k < 12; k++) { var f = BODY_F[k] / sz, t60 = .32 / (1 + k * .18), Rr = Math.exp(-6.91 / (t60 * sr)), th = TAU * f / sr; this.a1[k] = 2 * Rr * Math.cos(th); this.a2[k] = Rr * Rr; this.b[k] = (1 - Rr * Rr) * .5; } }
    var pz = P['body.piezo'], a1 = this.a1, a2 = this.a2, b = this.b, y1 = this.y1, y2 = this.y2, x1 = this.x1, x2 = this.x2;
    // piezo: 2nd-order high-pass at 300 Hz and a 2.6 kHz presence peak
    var w0 = TAU * 300 / sr, al = Math.sin(w0) / 1.4, c0 = Math.cos(w0), a0 = 1 + al, hb0 = (1 + c0) / 2 / a0, ha1 = -2 * c0 / a0, ha2 = (1 - al) / a0;
    var w1 = TAU * Math.min(2600, .45 * sr) / sr, al1 = Math.sin(w1) / 3, a01 = 1 + al1, pb0 = al1 / a01, pa1 = -2 * Math.cos(w1) / a01, pa2 = (1 - al1) / a01, pk = 0;
    for (i = 0; i < n; i++) {
      var x = inp[i], xd = x - x2, o = 0, od = 0; x2 = x1; x1 = x;
      for (k = 0; k < 12; k++) { var y = a1[k] * y1[k] - a2[k] * y2[k] + b[k] * xd + 1e-18; y2[k] = y1[k]; y1[k] = y; o += y; if (k & 1) od += y; }
      o *= 3; od *= 3;
      var hx = o + x * .7, hp = hb0 * (hx - 2 * this.h1 + this.h2) - ha1 * this.hy1 - ha2 * this.hy2; this.h2 = this.h1; this.h1 = hx; this.hy2 = this.hy1; this.hy1 = hp + 1e-18;
      var pp = pb0 * (hp - this.p2) - pa1 * this.py1 - pa2 * this.py2; this.p2 = this.p1; this.p1 = hp; this.py2 = this.py1; this.py1 = pp + 1e-18;
      var pzo = (hp + pp * 1.6) * 1.4, l = o * (1 - pz) + pzo * pz, r = (o - od * .6) * (1 - pz) + pzo * pz * .9;
      L[i] = l; R[i] = r; var al2 = l < 0 ? -l : l; if (al2 > pk) pk = al2;
    }
    this.x1 = x1; this.x2 = x2; if (pk > this.pk) this.pk = pk;
  };

  /* ---------- harmonizer: two-voice granular pitch shifter (octave down by default), detuned left/right, with feedback ----------
     Korven runs the machine through pitch shifters; an octave down turns a string into a sub drone, feedback stacks the
     shifts into a falling spiral. Each voice is a pair of 70 ms read heads crossfaded with a sin^2 window. */
  function Harmz(E) { this.E = E; this.N = nextPow2(Math.max(16384, Math.ceil(.1 * E.sr))); this.mask = this.N - 1; this.buf = new Float32Array(this.N); this.w = 0; this.ph = [0, .5, 0, .5]; this.fbv = 0; this.lp = 0; this.dc1 = 0; this.dc2 = 0; this.q = 999; this.pk = 0; this.lpL = 0; this.lpR = 0; }
  Harmz.prototype.reset = function () { this.buf.fill(0); this.fbv = this.lp = this.dc1 = this.dc2 = this.lpL = this.lpR = 0; };
  Harmz.prototype.render = function (inp, L, R, n, P) {
    var sr = this.E.sr, i, mx = 0;
    for (i = 0; i < n; i++) { var a = inp[i] < 0 ? -inp[i] : inp[i]; if (a > mx) mx = a; }
    if (mx < 1e-7 && this.fbv * this.fbv < 1e-14) { if (++this.q > 200) { if (this.q === 201) this.reset(); L.fill(0); R.fill(0); return; } } else this.q = 0;
    var W = Math.min(this.N - 8, Math.max(16, Math.round(sr * .07))), sh = P['harm.shift'], dt = P['harm.detune'] / 100, fb = P['harm.fb'], mix = P['harm.mix'] * 1.4, mask = this.mask;
    var rA = Math.pow(2, (sh - dt / 2) / 12), rB = Math.pow(2, (sh + dt / 2) / 12), dA = (1 - rA) / W, dB = (1 - rB) / W;
    var buf = this.buf, w = this.w, ph = this.ph, fbv = this.fbv, lp = this.lp, lc = 1 - Math.exp(-TAU * 3500 / sr), dcR = Math.pow(.995, 48000 / sr), pk = 0, d1 = this.dc1, d2 = this.dc2;
    for (i = 0; i < n; i++) {
      lp += lc * (fbv - lp);
      buf[w & mask] = inp[i] + lp * fb;
      var o0 = 0, o1 = 0;
      for (var v = 0; v < 4; v++) {
        var p = ph[v] + (v < 2 ? dA : dB); if (p >= 1) p -= 1; else if (p < 0) p += 1; ph[v] = p;
        var rp = w - 2 - p * W, i0 = Math.floor(rp), fr = rp - i0, x = buf[i0 & mask] * (1 - fr) + buf[(i0 + 1) & mask] * fr, s = Math.sin(Math.PI * p);
        if (v < 2) o0 += x * s * s; else o1 += x * s * s;
      }
      var l = o0, r = o1; fbv = (l + r) * .5; d2 = fbv - d1 + dcR * d2; d1 = fbv; fbv = d2;
      l *= mix; r *= mix; L[i] = l; R[i] = r; var al = l < 0 ? -l : l; if (al > pk) pk = al;
      w++;
    }
    this.w = w & mask; this.fbv = fbv + 1e-18; this.lp = lp + 1e-18; this.dc1 = d1; this.dc2 = d2; if (pk > this.pk) this.pk = pk;
  };

  /* ---------- the engine ---------- */
  function Slot(src) { this.src = src === undefined ? -1 : src; this.on = false; this.tx = .5; this.ty = .5; this.x = .5; this.y = .5; this.p = .6; this.spd = 0; this.hz = 0; this.auto = -1; this.lm = 0; this.gi = 0; this.ra = 0; this.rk = 0; this.rsx = .5; this.rsy = .5; this.rsp = .6; this.rx = .5; this.ry = .5; this.rp = .6; }
  function Engine(sr, seed) {
    this.sr = sr; this.rng = new Rng(seed || 1337); this.P = {};
    this.src = [new Ebow(this), new Hurdy(this), new Bowed(this), new Glass(this), new Struck(this), new Spring(this), new Junk(this), new Aura(this), new Moan(this)];
    // continuous sources get extra instances so a loop layer and live play (or two layers) sound together instead of cutting each other
    var NV = [2, 1, 3, 3, 1, 1, 1, 1, 1], mk = [Ebow, null, Bowed, Glass];
    this.inst = []; this.Cv = []; this.iq = [];
    for (var s0 = 0; s0 < NS; s0++) {
      var arr = [this.src[s0]], cv = [], qq = [];
      for (var k0 = 1; k0 < NV[s0]; k0++) arr.push(new mk[s0](this));
      for (k0 = 0; k0 < NV[s0]; k0++) { cv.push({ on: false, x: .5, y: .5, p: .6, spd: 0, hz: 0, auto: false, own: null }); qq.push(999); }
      this.inst.push(arr); this.Cv.push(cv); this.iq.push(qq);
    }
    this.act = []; this.pbuf = new Float32Array(BL);
    this.rev = new Reverb(this);
    this.slots = []; this.midiSlots = []; this.C = []; this.strip = [];
    for (var i = 0; i < NS; i++) {
      this.slots.push([new Slot(i), new Slot(i)]);
      this.midiSlots.push([new Slot(i), new Slot(i), new Slot(i)]);
      this.C.push(this.Cv[i][0]);
      this.strip.push({ g: 0, quiet: 999, pk: 0, choke: 0, d1: [0, 0], d2: [0, 0], dl: [0, 0], prevX: [0, 0], am: 0, lo: [0, 0], md: [0, 0, 0, 0] });
    }
    function fa() { return new Float32Array(BL); }
    this.tL = fa(); this.tR = fa(); this.dL = fa(); this.dR = fa(); this.rvIn = fa(); this.spIn = fa(); this.rL = fa(); this.rR = fa();
    // stems: 9 voices, hall return, reverse swell, harmonizer return, body. Each runs through its own copy of the linear master chain (tilt, volume,
    // HPF) and the limiter look-ahead delay, so the stems sum to the pre-limiter mix sample for sample and line up with it.
    // stem NS + 4 is the audio input (mic, line or a file). While the input is off it is skipped entirely (no master
    // chain, no denormal guard), so a session or render without input is bit-identical to an engine without one.
    this.NST = NS + 5; this.LA = Math.min(248, Math.round(.002 * sr));
    this.inL = fa(); this.inR = fa(); this.inOn = false; this.inAct = false; this.inE = 0; this.inTail = 0; this.inPk = 0; this.inG = -1;
    this.body = new Body(this); this.harm = new Harmz(this); this.bdIn = fa(); this.hmIn = fa();
    // water: 16 slow wobble signals (two incommensurate sines each), one per mode, shared by everything in the "bowl"
    this.wv = new Float64Array(16); this.wph = new Float64Array(32); this.water = 0;
    // waterphone tray: level, tilt (smoothed) and the slosh that tilting stirs up; knock bus (body input from every voice
    // but the spring) and its transient detector; sympathetic bus (hurdy plus the body input of everything but the string)
    this.wLevel = 0; this.wTilt = 0; this.wTilt0 = 0; this.sl = 0; this.strX = .5;
    this.kn = new Float32Array(BL); this.kd = { lp: 0, fe: 0, se: 0, cd: 0, n: 0 }; this.symB = new Float32Array(BL); this.symIn = new Float32Array(BL); this.symPk = 0; this.symG = 0;
    this.stemL = []; this.stemR = []; this.ms = [];
    for (i = 0; i < this.NST; i++) { this.stemL.push(fa()); this.stemR.push(fa()); this.ms.push({ tl: [0, 0], hx: [0, 0], hy: [0, 0], lk: [new Float32Array(256), new Float32Array(256)] }); }
    this.dpL = fa(); this.dpR = fa(); this.uL = fa(); this.uR = fa(); this.sumL = fa(); this.sumR = fa(); this.lgB = fa();
    this.dist = { lc: 1, dg: 1, wd: 1, bass: 0, bc: 0, aS: 0, rg: 1 };
    // glass ear guard: split off the 2-5 kHz band (4th-order Butterworth high-pass at 2 kHz into a 4th-order low-pass at 5 kHz)
    // as a detector; when that band would pass -12 dBFS the glass voice is turned down just enough (fast attack, 100 ms release)
    var egc = new Float64Array(20), bq = function (j, type, f, Q) {
      var w = TAU * Math.min(f, sr * .45) / sr, al = Math.sin(w) / (2 * Q), c = Math.cos(w), a0 = 1 + al, b0 = (type ? 1 - c : 1 + c) / 2 / a0;
      egc[j * 5] = b0; egc[j * 5 + 1] = (type ? 2 : -2) * b0; egc[j * 5 + 2] = b0; egc[j * 5 + 3] = -2 * c / a0; egc[j * 5 + 4] = (1 - al) / a0;
    };
    bq(0, 0, 2000, .5412); bq(1, 0, 2000, 1.3066); bq(2, 1, 5000, .5412); bq(3, 1, 5000, 1.3066);
    this.eg = { c: egc, z: new Float64Array(32), env: 0, rel: Math.exp(-1 / (.1 * sr)), ceil: .19, gr: 1 };
    this.dread = .2; this.distance = .15; this.material = .5; this.pitchSt = 0; this.pitchMul = 1; this.mPitch = 0; this.mDread = 0; this.autoFreeze = false; this.revBoost = 0;
    this.vOff = [];
    for (i = 0; i < NS; i++) this.vOff.push({ pitchSt: 0, pitchMul: 1, material: .5, matT: 1, matSlope: .7, matStretch: .02, matBright: .7, distance: .15, dist: { lc: 1, dg: 1, wd: 1, bass: 0, bc: 0, aS: 0, rg: 1 } });
    this.gMac = { pitchSt: 0, pitchMul: 1, material: .5, matT: 1, matSlope: .7, matStretch: .02, matBright: .7 };
    this.ring = [new Float32Array(65536), new Float32Array(65536)]; this.rw = 0; this.sw = [new Float32Array(60000), new Float32Array(60000)]; this.swN = 0; this.swP = 0; this.swEnd = -1; this.mAura = 0; this.duckE = 0; this.dr2 = 0;
    this.lkw = 0; this.dqVal = new Float64Array(512); this.dqIdx = new Float64Array(512); this.dqHead = 0; this.dqTail = 0; this.dqPos = 0; this.lg = 1; this.gr = 1; this.pkL = 0; this.pkR = 0;
    this.frame = 0; this.layers = []; this.recL = null; this.lid = 1; this.lane = null; this.lver = 0; this.undo = []; this.redo = []; this.mom = { riser: null, stinger: null, drone: null, heart: null, walls: null, ret: null };
    // custom moments: definitions, the ones playing, the live knob values they ride on, and the capture in progress
    this.cmDefs = {}; this.cms = []; this.cmBase = {}; this.cmSl = []; this.recM = null; this.cmN = 0;
    this.macros(); this.voiceMacros();
  }
  Engine.prototype.macros = function () {
    var P = this.P, sr = this.sr, a20 = srAlpha(.2, sr), a10 = srAlpha(.1, sr), a25 = srAlpha(.25, sr);
    var D = clamp((P['macro.dread'] || 0) + this.mDread, 0, 1), M = P['macro.material']; if (M === undefined) M = .5;
    this.dread += (D - this.dread) * a20; D = this.dread; this.material += (M - this.material) * a20; M = this.material;
    this.distance += ((this.mom.stinger ? 0 : P['macro.distance'] || 0) - this.distance) * a10;
    this.pitchSt += ((P['macro.pitch'] || 0) + this.mPitch - this.pitchSt) * a25; this.pitchMul = Math.pow(2, this.pitchSt / 12);
    this.detune = pw(D, 2, 15, 60); this.instab = pw(D, .5, 1, 2.5); this.rough = pw(D, 0, .15, .5); this.subAmt = pw(D, 0, .2, .6) + (this.pitchSt < -12 ? .3 : 0); this.driveOff = pw(D, 0, .15, .4);
    this.matT = pw(M, .3, 1, 1.6); this.matSlope = pw(M, 3, .7, .3); this.matStretch = pw(M, 0, .02, .05); this.matBright = pw(M, .15, .7, 1);
    var g = this.gMac; g.pitchSt = this.pitchSt; g.pitchMul = this.pitchMul; g.material = this.material; g.matT = this.matT; g.matSlope = this.matSlope; g.matStretch = this.matStretch; g.matBright = this.matBright;
  };
  // per-voice Tune, Material and Distance offsets add on top of the macros (they never replace them)
  Engine.prototype.voiceMacros = function () {
    var P = this.P, sr = this.sr, a20 = srAlpha(.2, sr), a10 = srAlpha(.1, sr), a25 = srAlpha(.25, sr), i;
    for (i = 0; i < NS; i++) {
      var nm = HE_S[i], o = this.vOff[i];
      var pT = (P['macro.pitch'] || 0) + this.mPitch + (P[nm + '.tune'] || 0) + (P[nm + '.cents'] || 0) / 100;
      o.pitchSt += (pT - o.pitchSt) * a25; o.pitchMul = Math.pow(2, o.pitchSt / 12);
      var Mt = P['macro.material']; if (Mt === undefined) Mt = .5;
      var M = clamp(Mt + (P[nm + '.matOff'] || 0), 0, 1);
      o.material += (M - o.material) * a20; M = o.material;
      o.matT = pw(M, .3, 1, 1.6); o.matSlope = pw(M, 3, .7, .3); o.matStretch = pw(M, 0, .02, .05); o.matBright = pw(M, .15, .7, 1);
      var Dt = clamp((this.mom.stinger ? 0 : (P['macro.distance'] || 0)) + (P[nm + '.distOff'] || 0), 0, 1);
      o.distance += (Dt - o.distance) * a10;
      var D = o.distance, Dd = o.dist;
      Dd.lc = Math.min(1, 1 - Math.exp(-TAU * 20000 * Math.pow(.06, D) / sr)); Dd.dg = db(-15 * D); Dd.wd = 1 - .6 * D; Dd.bass = (db(4) - 1) * (1 - D); Dd.bc = 1 - Math.exp(-TAU * 150 / sr); Dd.aS = D * .3; Dd.rg = db(-5 * D);
    }
  };
  Engine.prototype.useVoice = function (s) {
    var o = this.vOff[s];
    this.pitchSt = o.pitchSt; this.pitchMul = o.pitchMul; this.material = o.material; this.matT = o.matT; this.matSlope = o.matSlope; this.matStretch = o.matStretch; this.matBright = o.matBright;
  };
  Engine.prototype.useGlobals = function () {
    var g = this.gMac;
    this.pitchSt = g.pitchSt; this.pitchMul = g.pitchMul; this.material = g.material; this.matT = g.matT; this.matSlope = g.matSlope; this.matStretch = g.matStretch; this.matBright = g.matBright;
  };
  Engine.prototype.gesture = function (slot, s, k, x, y, p, hz) { return this.gesture2(this.slots[s][slot], s, k, x, y, p, hz); };
  Engine.prototype.gesture2 = function (S, s, k, x, y, p, hz) {
    if (k === 'd') {
      S.on = true; S.tx = S.x = x; S.ty = S.y = y; S.p = p; S.spd = 0; S.hz = hz || 0; S.auto = hz > 0 ? .45 + .4 * p : -1;
      // a struck ruler is pitched by its overhang: x shortens (right) or lengthens (left) the length set by Ruler length
      if (s === 4) this.strX = x;
      if (s === 4) this.src[4].trigger(hz > 0 ? hz : (this.P['struck.object'] | 0) === 0 ? rulerHz(this.P['struck.length'] * Math.pow(2, (.5 - x) * .75)) : this.P['struck.pitch'] * Math.pow(2, (x - .5) * 3), p, y);
      if (s === 0 && (this.P['ebow.excite'] | 0) > 0) S.kick = .3 + .7 * p;
      if (s === 5 && (this.P['spring.mode'] | 0) === 0) this.src[5].hit(p);
      this.strip[s].quiet = 0;
      S.lm = this.frame; S.ra = S.rk = 0; S.gi = 0;
    } else if (k === 'm') { S.tx = x; S.ty = y; S.p = p; if (hz > 0) S.hz = hz; S.ra = S.rk = 0; }
    // 'n': a move that glides. The hand travelled here since the last move; the engine sees moves only at block
    // boundaries and in clumps (one browser frame, one audio callback or one host buffer at a time), so a plain move
    // jumps and then stops, and the speed the bow and glass voices hear pulses. A glide walks the target there in
    // straight steps over 1.5 times the usual gap between moves (a running average, one block to 120 ms), so a move
    // that comes a little late finds the hand still travelling and the pull stays steady.
    else if (k === 'n') {
      var nb = Math.round((this.frame - S.lm) / BL), mx = Math.max(1, Math.round(.12 * this.sr / BL));
      S.lm = this.frame;
      if (hz > 0) S.hz = hz;
      if (S.rk > 0 && nb < 1) { S.rx = x; S.ry = y; S.rp = p; }   // another move in the same block: same glide, new end
      else { S.gi = S.gi > 0 ? S.gi + (nb - S.gi) * .3 : nb; S.ra = S.rk = Math.min(mx, Math.max(1, Math.round(S.gi * 1.5))); S.rsx = S.tx; S.rsy = S.ty; S.rsp = S.p; S.rx = x; S.ry = y; S.rp = p; }
    }
    else S.on = false;
  };
  Engine.prototype.user = function (s, k, x, y, p, hz, slot) {
    var S = slot >= 1 && slot <= 3 ? this.midiSlots[s][slot - 1] : this.slots[s][0];
    this.gesture2(S, s, k, x, y, p, hz);
    if (this.recL) this.recL.ev.push({ t: this.frame, s: s, k: k, x: x, y: y, p: p, hz: hz || 0 });
    if (this.recM) this.recM.ev.push({ t: this.frame - this.recM.start, s: s, k: k, x: x, y: y, p: p, hz: hz || 0 });
  };
  // contact priority per source: live touch, then moments/auto, then loop layers (oldest first), then hold.
  // Each active contact keeps the instance it got (sticky); a new contact takes a free instance or steals the lowest-priority one.
  Engine.prototype.smooth = function (S, dt) {
    if (!S.on) { S.spd *= Math.pow(.8, 48000 / this.sr); return; }
    if (S.rk > 0) { S.rk--; var gf = 1 - S.rk / S.ra; S.tx = S.rsx + (S.rx - S.rsx) * gf; S.ty = S.rsy + (S.ry - S.rsy) * gf; S.p = S.rsp + (S.rp - S.rsp) * gf; }
    var a35 = srAlpha(.35, this.sr), a10 = srAlpha(.1, this.sr);
    var nx = S.x + (S.tx - S.x) * a35, ny = S.y + (S.ty - S.y) * a35, d = Math.sqrt((nx - S.x) * (nx - S.x) + (ny - S.y) * (ny - S.y));
    S.x = nx; S.y = ny; S.spd += (Math.min(1, d / dt / 2.5) - S.spd) * a10;
  };
  Engine.prototype.contacts = function () {
    var dt = BL / this.sr, act = this.act, s, j, k;
    for (s = 0; s < NS; s++) { this.smooth(this.slots[s][0], dt); this.smooth(this.slots[s][1], dt); for (j = 0; j < 3; j++) this.smooth(this.midiSlots[s][j], dt); }
    for (j = 0; j < this.layers.length; j++) this.smooth(this.layers[j].sl, dt);
    for (j = 0; j < this.cmSl.length; j++) this.smooth(this.cmSl[j], dt);
    for (s = 0; s < NS; s++) {
      var sl = this.slots[s], ms = this.midiSlots[s], cv = this.Cv[s], nv = cv.length, n = 0;
      if (sl[0].on) act[n++] = sl[0];
      for (j = 0; j < 3; j++) if (ms[j].on) act[n++] = ms[j];
      if (sl[1].on) act[n++] = sl[1];
      for (j = 0; j < this.layers.length; j++) { var Ly = this.layers[j]; if (Ly.src === s && Ly.sl.on) act[n++] = Ly.sl; }
      for (j = 0; j < this.cmSl.length; j++) { var Cs = this.cmSl[j]; if (Cs.src === s && Cs.on) act[n++] = Cs; }
      // release instances whose contact ended
      for (k = 0; k < nv; k++) { var o = cv[k].own; if (o && (!o.on || o.src !== s)) cv[k].own = null; }
      for (j = 0; j < n; j++) {
        var S = act[j], has = false;
        for (k = 0; k < nv; k++) if (cv[k].own === S) { has = true; break; }
        if (has) continue;
        var pick = -1, worst = -1;
        for (k = 0; k < nv; k++) if (!cv[k].own) { pick = k; break; }
        if (pick < 0) for (k = 0; k < nv; k++) { var pi = act.indexOf(cv[k].own); if (pi > j && pi > worst) { worst = pi; pick = k; } }
        if (pick >= 0) cv[pick].own = S;
      }
      for (k = 0; k < nv; k++) {
        var C = cv[k], g = C.own;
        if (g) { C.on = true; C.x = g.x; C.y = g.y; C.p = g.p; C.hz = g.hz; C.auto = g.auto >= 0; C.spd = g.auto >= 0 ? g.auto : g.spd; if (g.kick) { C.kick = g.kick; g.kick = 0; } }
        else if (k === 0 && this.P[HE_S[s] + '.hold'] > .5) { C.on = true; C.p = .6; C.spd = .4; C.auto = true; C.hz = 0; }
        else { C.on = false; C.spd = 0; C.auto = false; }
      }
    }
  };
  var HE_S = ['ebow', 'hurdy', 'bowed', 'glass', 'struck', 'spring', 'junk', 'aura', 'moan'];

  /* looper: gestures are re-performed, not replayed audio.
     One lane clock: the first layer sets lane.start and lane.len. Overdubs keep the phase at which they were played:
     each layer has an origin frame and a length; its events are stored as phase = (frame - origin) mod len, and it plays
     whenever (now - origin) mod len reaches that phase. Aligned overdubs use origin = lane.start and a whole number of
     lane cycles; "free" overdubs (polymetric) use their own start and length. */
  Engine.prototype.layerSlot = function (L) { return L.sl; };
  Engine.prototype.phaseOf = function (L, f) { var d = (f - L.origin) % L.len; return d < 0 ? d + L.len : d; };
  Engine.prototype.seekLayer = function (L) { var ph = this.phaseOf(L, this.frame), i = 0; while (i < L.ev.length && L.ev[i].f < ph) i++; L.i = i; L.pos = ph; };
  // undo/redo: snapshots of the layer list and the lane (event arrays are never mutated, so they are shared)
  Engine.prototype.snap = function () {
    return { frame: this.frame, lane: this.lane ? { start: this.lane.start, len: this.lane.len } : null, L: this.layers.map(function (L) { return { id: L.id, src: L.src, len: L.len, origin: L.origin, ev: L.ev, mute: L.mute, ghost: L.ghost, seed: L.seed }; }) };
  };
  Engine.prototype.pushUndo = function () { this.ucnt = (this.ucnt || 0) + 1; this.undo.push(this.snap()); if (this.undo.length > 50) this.undo.shift(); this.redo.length = 0; };
  Engine.prototype.restore = function (S) {
    for (var i = 0; i < this.layers.length; i++) this.layers[i].sl.on = false;
    this.lane = S.lane ? { start: S.lane.start, len: S.lane.len } : null;
    this.layers = S.L.map(function (q) {
      var L = { id: q.id, src: q.src, sl: new Slot(q.src), len: q.len, origin: q.origin, ev: q.ev, i: 0, pos: 0, mute: q.mute, ghost: q.ghost, gs: null, seed: q.seed, rng: new Rng(q.seed) };
      if (L.ghost) this.ghostPrep(L); else this.seekLayer(L); return L;
    }, this);
    this.lver++;
  };
  Engine.prototype.loopCmd = function (m) {
    var a = m.a, L, i;
    if (a === 'load' && m.snap) { this.pushUndo(); var d = this.frame - (m.snap.frame || 0), S = JSON.parse(JSON.stringify(m.snap)); if (S.lane) S.lane.start += d; S.L.forEach(function (q) { q.origin += d; this.lid = Math.max(this.lid, q.id + 1); }, this); this.restore(S); return; }
    if (a === 'undo' || a === 'redo') { var from = a === 'undo' ? this.undo : this.redo, to = a === 'undo' ? this.redo : this.undo; if (!from.length) return; to.push(this.snap()); this.restore(from.pop()); return; }
    if (a === 'rec') { if (this.recL) return this.loopCmd({ a: 'stop', free: m.free }); this.recL = { start: this.frame, ev: [] }; }
    else if (a === 'stop' && this.recL) {
      var R = this.recL, dur = this.frame - R.start, ev = R.ev; this.recL = null;
      if (dur < this.sr * .25 || !ev.length) return;
      var cnt = {}, best = ev[0].s; ev.forEach(function (e) { cnt[e.s] = (cnt[e.s] || 0) + 1; if (cnt[e.s] > cnt[best]) best = e.s; });
      ev = ev.filter(function (e) { return e.s === best; });
      var origin, len;
      if (!this.lane) { this.lane = { start: R.start, len: dur }; origin = R.start; len = dur; }
      else if (m.free) { origin = R.start; len = dur; }
      else { len = Math.max(1, Math.round(dur / this.lane.len)) * this.lane.len; origin = this.lane.start; }
      // close a gesture still held when recording stopped, one block before the stop point
      var down = false; ev.forEach(function (e) { if (e.k === 'd') down = true; else if (e.k === 'u') down = false; });
      if (down) ev.push({ t: this.frame - BL, s: best, k: 'u', x: 0, y: 0, p: 0, hz: 0 });
      var out = ev.map(function (e, j) { var d = (e.t - origin) % len; if (d < 0) d += len; return { f: d, j: j, k: e.k, x: e.x, y: e.y, p: e.p, hz: e.hz }; });
      out.sort(function (p, q) { return p.f - q.f || p.j - q.j; });
      this.pushUndo();
      var seed = (this.rng.s ^ (this.lid * 2654435761)) >>> 0;
      L = { id: this.lid++, src: best, sl: new Slot(best), len: len, origin: origin, ev: out, i: 0, pos: 0, mute: false, ghost: false, gs: null, seed: seed, rng: new Rng(seed) };
      this.seekLayer(L); this.layers.push(L); this.lver++;
    }
    else if (a === 'clear') { if (!this.layers.length) return; this.pushUndo(); for (i = 0; i < this.layers.length; i++) this.layerSlot(this.layers[i]).on = false; this.layers = []; this.lane = null; this.lver++; }
    else {
      for (i = 0; i < this.layers.length; i++) if (this.layers[i].id === m.id) break;
      L = this.layers[i]; if (!L) return;
      this.pushUndo();
      this.layerSlot(L).on = false;
      if (a === 'del') { this.layers.splice(i, 1); if (!this.layers.length) this.lane = null; }
      else if (a === 'mute') L.mute = !!m.v;
      else if (a === 'src') { L.src = m.v | 0; L.sl.src = L.src; }
      else if (a === 'ghost') { L.ghost = !!m.v; if (L.ghost) this.ghostPrep(L); else this.seekLayer(L); }
      this.lver++;
    }
  };
  Engine.prototype.ghostPrep = function (L) {
    // strokes in playing order, starting from phase 0
    var st = [], gaps = [], cur = null, last = 0;
    L.ev.forEach(function (e) {
      if (e.k === 'd') { if (cur) st.push(cur); gaps.push(e.f - last); cur = { t0: e.f, ev: [e], len: 0 }; }
      else if (cur) { cur.ev.push(e); if (e.k === 'u') { cur.len = e.f - cur.t0; last = e.f; st.push(cur); cur = null; } }
    });
    if (cur) { cur.len = L.len - cur.t0; st.push(cur); }
    gaps.push(Math.max(0, L.len - last));
    L.gs = { st: st, gaps: gaps, wait: 0, cur: null, pos: 0, i: 0, str: 1, xo: 0, pm: 1, mir: false, lastK: -1 };
  };
  Engine.prototype.fireLayer = function (L, upTo) {
    var ev = L.ev, S = this.layerSlot(L);
    while (L.i < ev.length && ev[L.i].f < upTo) { var e = ev[L.i++]; if (!L.mute) this.gesture2(S, L.src, e.k, e.x, e.y, e.p, e.hz); }
  };
  Engine.prototype.loopRun = function () {
    for (var q = 0; q < this.layers.length; q++) {
      var L = this.layers[q], e;
      if (L.ghost && L.gs && L.gs.st.length) {
        var G = L.gs, r = L.rng, S = this.layerSlot(L);
        if (!G.cur) {
          G.wait -= BL;
          if (G.wait <= 0 && !L.mute) {
            var k = (r.u() * G.st.length) | 0; if (k === G.lastK && G.st.length > 1) k = (k + 1) % G.st.length;
            G.lastK = k; G.cur = G.st[k]; G.pos = 0; G.i = 0; G.str = .7 + r.u() * .7; G.xo = r.b() * .12 * this.instab; G.pm = .75 + r.u() * .45; G.mir = r.u() < .25;
          }
        }
        if (G.cur) {
          G.pos += BL / G.str;
          while (G.i < G.cur.ev.length && G.cur.ev[G.i].f - G.cur.t0 <= G.pos) {
            e = G.cur.ev[G.i++];
            this.gesture2(S, L.src, e.k, clamp((G.mir ? 1 - e.x : e.x) + G.xo, 0, 1), e.y, clamp(e.p * G.pm, 0, 1), e.hz);
          }
          if (G.pos >= G.cur.len && G.i >= G.cur.ev.length) {
            S.on = false; G.cur = null;
            G.wait = G.gaps[(r.u() * G.gaps.length) | 0] * (.4 + r.u() * 1.5) / (.7 + .9 * this.dread) + this.sr * .05;
          }
        }
        L.pos = this.phaseOf(L, this.frame + BL);
        continue;
      }
      var ph = this.phaseOf(L, this.frame), end = ph + BL;
      if (end < L.len) this.fireLayer(L, end);
      else { this.fireLayer(L, L.len); L.i = 0; this.fireLayer(L, end - L.len); }
      L.pos = end >= L.len ? end - L.len : end;
    }
  };

  /* moments: scripted gestures */
  Engine.prototype.auto = function (s, on, x, y, p, spd, hz) {
    var S = this.slots[s][1];
    if (on) { if (!S.on) { S.x = x; S.y = y; this.strip[s].quiet = 0; } S.on = true; S.tx = x; S.ty = y; S.p = p; S.auto = spd; S.hz = hz || 0; }
    else S.on = false;
  };
  Engine.prototype.moment = function (id, on, arg) {
    var M = this.mom, sr = this.sr;
    if (typeof id === 'string' && id.indexOf('c:') === 0) return this.cmToggle(id.slice(2), on);
    if (id === 'riser') { if (on && !M.riser) { M.riser = { t: 0, dur: (arg || 8) * sr }; M.ret = null; } else if (!on && M.riser) this.riserEnd(false); }
    else if (id === 'stinger') { if (!M.stinger) { M.stinger = { t: 0, hit: false }; this.swell(.8); } }
    else if (id === 'drone') { if (on) M.drone = { t: 0, next: 20 * sr, tgt: 0 }; else if (M.drone) { M.drone = null; this.auto(1, false); this.auto(0, false); this.autoFreeze = false; } }
    else if (id === 'heart') { if (on) M.heart = { next: 0, dub: -1, drift: 0 }; else M.heart = null; }
    else if (id === 'walls') { if (on) M.walls = { next: sr * .3, jk: 0, gl: 0, jx: .5, jy: .5, jvx: 0, jvy: 0, gx: .5, gdx: 0 }; else if (M.walls) { M.walls = null; this.auto(6, false); this.auto(3, false); } }
  };

  /* custom moments: a captured phrase (gestures on any voice plus knob and macro moves) played once through the models.
     Times arrive in seconds and become frames here. Each firing gets its own seeded variation (tempo, position, pressure,
     depth of the knob moves), like a ghost but gentler. Continuous knobs ride on top of where the live knob is (relative,
     in normalised knob travel); switches and choices are set outright. While a moment holds a knob, live moves of that knob
     update the base it rides on, and the knob returns to that live value when the last moment using it ends. */
  function cmN(L, v) { return L.exp ? Math.log(Math.max(1e-9, v) / L.min) / Math.log(L.max / L.min) : (v - L.min) / (L.max - L.min); }
  function cmD(L, n) { n = clamp(n, 0, 1); var v = L.exp ? L.min * Math.pow(L.max / L.min, n) : L.min + (L.max - L.min) * n; return L.int ? Math.round(v) : v; }
  Engine.prototype.cmDefine = function (id, d) {
    for (var i = this.cms.length - 1; i >= 0; i--) if (this.cms[i].id === id) this.cmStop(this.cms[i]);
    if (!d || !d.ev) { delete this.cmDefs[id]; return; }
    var sr = this.sr, ev = [], lanes = [];
    d.ev.forEach(function (e, j) { if (e && e.length >= 3) ev.push({ f: Math.round(e[0] * sr), j: j, s: e[1] | 0, k: e[2], x: +e[3] || 0, y: +e[4] || 0, p: +e[5] || 0, hz: +e[6] || 0 }); });
    ev.sort(function (a, b) { return a.f - b.f || a.j - b.j; });
    (d.lanes || []).forEach(function (L) {
      if (!L || !L.k || !L.pts || !L.pts.length || !(L.max > L.min)) return;
      lanes.push({ k: L.k, min: L.min, max: L.max, exp: !!L.exp && L.min > 0, int: !!L.int, abs: !!L.abs, pts: L.pts.map(function (q) { return [Math.round(q[0] * sr), +q[1]]; }) });
    });
    var len = Math.round((+d.len || 0) * sr); ev.forEach(function (e) { if (e.f > len) len = e.f; }); lanes.forEach(function (L) { var t = L.pts[L.pts.length - 1][0]; if (t > len) len = t; });
    this.cmDefs[id] = { id: id, v: typeof d.voice === 'number' && d.voice >= 0 && d.voice < NS ? d.voice | 0 : -1, ev: ev, lanes: lanes, len: len };
  };
  Engine.prototype.cmToggle = function (id, on) {
    var I = null; for (var i = 0; i < this.cms.length; i++) if (this.cms[i].id === id) I = this.cms[i];
    if (I && !on) this.cmStop(I); else if (!I && on) this.cmStart(id);
  };
  Engine.prototype.cmStart = function (id) {
    var d = this.cmDefs[id]; if (!d) return;
    var seed = (this.rng.s ^ Math.imul(++this.cmN, 2654435761) ^ this.frame) >>> 0, r = new Rng(seed || 1), ins = this.instab || 1;
    var I = { id: id, d: d, pos: 0, i: 0, li: d.lanes.map(function () { return -1; }), sl: {}, str: 1 + r.b() * .05, xo: r.b() * .03 * ins, pm: .9 + r.u() * .2, dm: .9 + r.u() * .2 };
    d.lanes.forEach(function (L) { var B = this.cmBase[L.k]; if (!B) B = this.cmBase[L.k] = { v: this.P[L.k], n: 0, L: L }; B.n++; }, this);
    this.cms.push(I); this.cmSlots();
  };
  Engine.prototype.cmStop = function (I) {
    for (var s in I.sl) I.sl[s].on = false;
    I.d.lanes.forEach(function (L) { var B = this.cmBase[L.k]; if (B && --B.n <= 0) { this.P[L.k] = B.v; delete this.cmBase[L.k]; } }, this);
    var k = this.cms.indexOf(I); if (k >= 0) this.cms.splice(k, 1);
    this.cmSlots();
  };
  Engine.prototype.cmSlots = function () { var a = []; this.cms.forEach(function (I) { for (var s in I.sl) a.push(I.sl[s]); }); this.cmSl = a; };
  // a live knob move: while a custom moment holds that knob it moves the base the moment rides on
  Engine.prototype.setP = function (k, v) {
    var B = this.cmBase[k]; if (B) B.v = v; else this.P[k] = v;
    if (this.recM) this.recM.pv.push({ t: this.frame - this.recM.start, k: k, v: v });
  };
  Engine.prototype.cmRun = function () {
    if (!this.cms.length) return;
    var sum = {}, ab = {}, done = [], grew = false;
    for (var q = 0; q < this.cms.length; q++) {
      var I = this.cms[q], d = I.d, ev = d.ev;
      I.pos += BL / I.str;
      while (I.i < ev.length && ev[I.i].f <= I.pos) {
        var e = ev[I.i++], s = d.v >= 0 ? d.v : e.s, S = I.sl[s];
        if (!S) { S = I.sl[s] = new Slot(s); grew = true; }
        this.gesture2(S, s, e.k, clamp(e.x + I.xo, 0, 1), e.y, clamp(e.p * I.pm, 0, 1), e.hz);
      }
      for (var l = 0; l < d.lanes.length; l++) {
        var L = d.lanes[l], j = I.li[l];
        while (j + 1 < L.pts.length && L.pts[j + 1][0] <= I.pos) j++;
        I.li[l] = j; if (j < 0) continue;
        if (L.abs) ab[L.k] = L.pts[j][1]; else sum[L.k] = (sum[L.k] || 0) + L.pts[j][1] * I.dm;
      }
      if (I.pos >= d.len && I.i >= ev.length) done.push(I);
    }
    if (grew) this.cmSlots();
    for (var k in this.cmBase) { var B = this.cmBase[k]; if (k in ab) this.P[k] = ab[k]; else if (k in sum) this.P[k] = cmD(B.L, cmN(B.L, B.v) + sum[k]); }
    for (q = 0; q < done.length; q++) this.cmStop(done[q]);
  };
  Engine.prototype.swell = function (sec) {
    var n = Math.min(60000, (sec * this.sr) | 0); if (!this.sw) this.sw = [new Float32Array(60000), new Float32Array(60000)];
    for (var i = 0; i < n; i++) { var j = (this.rw - 1 - i) & 65535; this.sw[0][i] = this.ring[0][j]; this.sw[1][i] = this.ring[1][j]; }
    this.swN = n; this.swP = 0;
  };
  // the cut chokes the e-bow and bowed metal; pitch, Dread and the aura lift glide back over 500 ms (no tape-stop drop)
  Engine.prototype.riserEnd = function (hard) {
    this.mom.riser = null; this.auto(2, false); this.auto(0, false);
    this.mom.ret = { t: 0, dur: Math.round(.5 * this.sr), p0: this.mPitch, d0: this.mDread, a0: this.mAura };
    if (hard) { this.strip[0].choke = 3; this.strip[2].choke = 3; }
  };
  // Heartbeat voice (the Heart moment): two low, muffled thumps, lub then dub. Each is a sine gliding down
  // (no noise, no click), raised-cosine attack ~14 ms, exponential decay, a touch of tanh "through the chest"
  // saturation and a 2x one-pole low-pass at ~160 Hz. Deterministic, mixed into the body stem.
  Engine.prototype.hbOn = function (k, f0, f1, amp, dec) {
    if (!this.hb) this.hb = [{ t: -1 }, { t: -1 }], this.hbL1 = 0, this.hbL2 = 0, this.hbPh = 0, this.hbK = 0;
    var v = this.hb[k]; v.t = 0; v.f0 = f0; v.f1 = f1; v.amp = amp; v.dec = dec; this.hbK = k; this.hbAct = 1;
  };
  Engine.prototype.hbRender = function (oL, oR, n) {
    // one oscillator (pitch from the latest thump) under two summed envelopes, so lub and dub never beat
    var sr = this.sr, hb = this.hb, att = .014 * sr, gl = .06 * sr, a = 1 - Math.exp(-2 * Math.PI * 160 / sr);
    var l1 = this.hbL1, l2 = this.hbL2, ph = this.hbPh, cur = hb[this.hbK], g = .3;
    for (var i = 0; i < n; i++) {
      var env = 0;
      for (var k = 0; k < 2; k++) {
        var v = hb[k]; if (v.t < 0) continue;
        var t = v.t, e = t < att ? .5 - .5 * Math.cos(Math.PI * t / att) : Math.exp(-(t - att) / (v.dec * sr));
        env += e * v.amp; v.t++; if (t > att && e < 1e-4) v.t = -1;
      }
      var f = cur.t >= 0 ? cur.f1 + (cur.f0 - cur.f1) * Math.exp(-cur.t / gl) : cur.f1;
      ph += 6.283185307 * f / sr; if (ph > 6.283185307) ph -= 6.283185307;
      var x = Math.tanh(Math.sin(ph) * env * 1.6) * .7;
      l1 += a * (x - l1); l2 += a * (l1 - l2);
      oL[i] += l2 * g; oR[i] += l2 * g;
    }
    this.hbL1 = l1; this.hbL2 = l2; this.hbPh = ph;
    if (hb[0].t < 0 && hb[1].t < 0 && Math.abs(l2) < 1e-6) this.hbAct = 0;
  };
  Engine.prototype.momRun = function () {
    var M = this.mom, sr = this.sr, r = this.rng, m, pm = 1;
    if ((m = M.riser)) {
      m.t += BL; var t = m.t / m.dur, e = (Math.exp(3 * t) - 1) / 19.086;
      this.mPitch = 11 * e; this.mDread = .6 * e; this.mAura = e;
      this.auto(2, true, .3 + .25 * Math.sin(t * 37), .25 + .6 * e, .45 + .45 * e, .2 + .8 * e);
      this.auto(0, true, .5, .3, .3 + .7 * e, e * .5);
      if (t >= 1) this.riserEnd(true);
    }
    if ((m = M.ret)) {
      m.t += BL; var k = m.t >= m.dur ? 0 : .5 + .5 * Math.cos(Math.PI * m.t / m.dur);
      this.mPitch = m.p0 * k; this.mDread = m.d0 * k; this.mAura = m.a0 * k; if (!k) M.ret = null;
    }
    if ((m = M.stinger)) {
      // the hit lands exactly 800 ms after the press: scheduled at its frame inside the block
      if (!m.hit) this.auto(0, true, .5, .2, 1, 1, this.P['ebow.pitch'] * 4);
      var hitAt = Math.round(.8 * sr);
      if (!m.hit && m.t + BL > hitAt) {
        m.hit = true; var S = this.src[4], dl = hitAt - m.t;
        S.trigger(55, 1, .3, 2, .85, 9, 0, dl); S.trigger(41, 1, .4, 4, .3, 1.2, 0, dl); S.trigger(55 * 1.4142 * 2, .8, .6, 2, .9, 7, 0, dl); S.trigger(110 * 1.0595, .7, .2, 1, .9, 6, 0, dl);
        this.src[5].hit(1, dl); this.strip[4].quiet = 0; this.strip[5].quiet = 0; this.revBoost = 1; this.swEnd = dl;
      }
      m.t += BL;
      if (m.t > 2.1 * sr) { this.auto(0, false); M.stinger = null; }
    }
    if ((m = M.drone)) {
      // hurdy crank at 0.8, e-bow on the hurdy root; every 20-40 s (seeded) the hurdy's second string moves to a new
      // interval chosen by Dread: fifth/fourth/octave when calm, tritone and minor second as Dread rises
      m.t += BL;
      this.auto(1, true, .5, .5, .55, .32); this.auto(0, true, .5, .5, .4, 0, this.P['hurdy.root']);
      if (m.t > 2 * sr) this.autoFreeze = true;
      m.next -= BL;
      if (m.next <= 0) {
        var D2 = this.dread, opts = D2 < .3 ? [1.5, 4 / 3, 2, 1.5] : D2 < .7 ? [1.5, 1.41421, 4 / 3, 1.6818] : [1.41421, 1.05946, 1.49831, 1.41421 * 1.05946];
        m.tgt = opts[(r.u() * opts.length) | 0]; m.next = (20 + r.u() * 20) * sr;
      }
      if (m.tgt) { if (!this.dr2) this.dr2 = 1.5; this.dr2 += (m.tgt - this.dr2) * .0015; }
    } else this.dr2 = 0;
    if ((m = M.heart)) {
      m.next -= BL;
      if (m.next <= 0) {
        m.drift = m.drift * .9 + r.b() * 1.2 * this.instab;
        // slow and steady: 54 bpm at rest, up to ~70 as Dread rises (only when the score/Dread pushes it)
        var bpm = Math.max(46, Math.min(76, 54 + this.dread * 16 + m.drift)), per = 60 / bpm * sr;
        m.next += per * (1 + r.b() * .02 * this.instab); m.dub = (.155 - .03 * this.dread) * sr;
        // lub: a low chesty thump (sine glide ~68 -> 46 Hz, soft attack, no click) in the body stem,
        // and a Dread-scaled duck (3-9 dB) of the e-bow, hurdy and aura
        this.hbOn(0, 68 / this.pitchMul, 46 / this.pitchMul, 1, .09); this.duckE = 1;
      }
      // dub: ~0.12-0.16 s later, softer and a little higher
      if (m.dub > 0) { m.dub -= BL; if (m.dub <= 0) { this.hbOn(1, 76 / this.pitchMul, 54 / this.pitchMul, .42, .1); this.duckE = Math.max(this.duckE, .7); m.dub = -1; } }
    }
    if ((m = M.walls)) {
      m.next -= BL;
      if (m.next <= 0) {
        m.next = -Math.log(1 - r.u() * .98) * sr / (.35 + 1.5 * this.dread);
        var u = r.u();
        if (u < .5) { m.jk = sr * (.25 + r.u() * .9); m.jx = r.u(); m.jy = r.u(); m.jvx = r.b() * 1.5; m.jvy = r.b() * 1.5; }
        else if (u < .8) { m.gl = sr * (.06 + r.u() * .3); m.gx = r.u(); m.gdx = r.b() * 2.5; }
        else if (u < .93) { this.src[5].hit(.1 + r.u() * .25); this.strip[5].quiet = 0; }
        else { this.src[4].trigger(70 + r.u() * 60, .3 + r.u() * .4, r.u(), 4, .5, 1); this.strip[4].quiet = 0; }
      }
      var dt = BL / sr;
      if (m.jk > 0) { m.jk -= BL; m.jx = clamp(m.jx + m.jvx * dt, .05, .95); m.jy = clamp(m.jy + m.jvy * dt, .05, .95); if (r.u() < .05) { m.jvx = r.b() * 2; m.jvy = r.b() * 2; } this.auto(6, true, m.jx, m.jy, .9, -1); } else this.auto(6, false);
      if (m.gl > 0) { m.gl -= BL; m.gx = clamp(m.gx + m.gdx * dt, 0, 1); this.auto(3, true, m.gx, .5 + .3 * Math.sin(m.gl * .001), .22, -1); } else this.auto(3, false);
    }
  };

  // ear-guard band filter: 4 cascaded biquads, state z[o + j*4 + (x1, x2, y1, y2)]
  function egBand(eg, o, x) {
    var c = eg.c, z = eg.z;
    for (var j = 0; j < 4; j++) {
      var k = j * 5, q = o + j * 4, y = c[k] * x + c[k + 1] * z[q] + c[k + 2] * z[q + 1] - c[k + 3] * z[q + 2] - c[k + 4] * z[q + 3];
      z[q + 1] = z[q]; z[q] = x; z[q + 3] = z[q + 2]; z[q + 2] = y; x = y;
    }
    return x;
  }
  // body knock -> spring tank: the transient part of the knock bus (high-passed, fast envelope well above its own slow
  // average and an absolute floor) hits the tank, at most every 90 ms. The spring is not on the bus, so it cannot loop.
  Engine.prototype.knock = function (amt) {
    var x = this.kn, K = this.kd, sr = this.sr, lc = 1 - Math.exp(-TAU * 150 / sr), rf = Math.exp(-1 / (.01 * sr)), ks = 1 - Math.exp(-1 / (.25 * sr)), thr = .004;
    for (var i = 0; i < BL; i++) {
      K.lp += lc * (x[i] - K.lp); var h = x[i] - K.lp, a = h < 0 ? -h : h; K.fe = a > K.fe ? a : K.fe * rf; K.se += ks * (K.fe - K.se);
      if (K.cd > 0) K.cd--;
      else if (K.fe > thr && K.fe > 4 * K.se + thr) { this.src[5].hit(Math.min(1, K.fe * 8) * amt, i); K.cd = (.09 * sr) | 0; K.n++; this.sl = Math.min(1, this.sl + K.fe * 2 * amt); }
    }
    K.lp += 1e-18; K.se += 1e-18;
  };
  Engine.prototype.stripRun = function (s, stereo, sustained) {
    var P = this.P, nm = HE_S[s], st = this.strip[s], tL = this.tL, tR = this.tR, sL = this.stemL[s], sR = this.stemR[s], dL = this.dL, dR = this.dR, rv = this.rvIn, sp = this.spIn;
    var gT = P[nm + '.mute'] > .5 ? 0 : db(P[nm + '.level']);
    if (st.choke > 0) { gT = 0; if (--st.choke === 0) { for (var ci = 0; ci < this.inst[s].length; ci++) this.inst[s][ci].reset(); } }
    var pan = (P[nm + '.pan'] + 1) * .7854, pl = Math.cos(pan) * 1.4142, prr = Math.sin(pan) * 1.4142;
    var drv = clamp(P[nm + '.drive'] + (P[nm + '.drive'] > .01 ? this.driveOff : 0), 0, 1), rs = P[nm + '.rev'] * (s === 4 ? 1 + this.revBoost : 1), ss = s === 5 ? 0 : P[nm + '.spr'];
    // Dread detunes and destabilises the e-bow string (and the drive offset compresses it), which costs level;
    // a measured make-up after the drive keeps it loudness-neutral
    if (s === 0) gT *= db(pw(this.dread, 0, 1.2, 3.8));
    if (this.duckE > .001 && (s === 0 || s === 1 || s === 7)) gT *= 1 - (1 - db(-(3 + 6 * this.dread))) * this.duckE;
    var rough = sustained ? this.rough : 0, g = st.g, gi = (gT - g) / BL, pk = 0, i;
    var eg = this.eg, guard = s === 3 && P['glass.guard'] > .5;
    if (s === 3 && !guard) { eg.env = 0; }
    var hs = P[nm + '.hsend'] || 0, bw = BODY_W[s] * (P['body.amt'] || 0), hb = this.hmIn, bb = this.bdIn, kn = this.kn, kw = s === 5 ? 0 : bw, sy = this.symB, sw = s === 1 ? 1 + bw : s === 0 || s === 5 ? 0 : bw;
    var Dd = this.vOff[s].dist, lc = Dd.lc, dg = Dd.dg, wd = Dd.wd, bass = Dd.bass, bc = Dd.bc, aS = Dd.aS, rg = Dd.rg, lo = st.lo, md = st.md, dpL = this.dpL, dpR = this.dpR;
    if (drv > .005) {
      var pre = 1 + drv * drv * 40, mk = 1 / Math.pow(pre, .55), tc = 1 - Math.exp(-TAU * (2200 + 7000 * (1 - drv * .6)) / this.sr), dcR = Math.pow(.997, 48000 / this.sr);
      for (var c = 0; c < (stereo ? 2 : 1); c++) {
        var b = c ? tR : tL, d1 = st.d1[c], d2 = st.d2[c], dl = st.dl[c], px = st.prevX[c];
        for (i = 0; i < BL; i++) {
          var xc = b[i]; px = xc;
          var x = xc * pre + .08, y = x / (1 + (x < 0 ? -x * .8 : x)); y = y > 1 ? 1 : y;
          d2 = y - d1 + dcR * d2; d1 = y; dl += tc * (d2 - dl); b[i] = xc * (1 - drv) * (1 - drv) + dl * mk * 2.2 * Math.min(1, drv * 3);
        }
        st.d1[c] = d1; st.d2[c] = d2; st.dl[c] = dl + 1e-18; st.prevX[c] = px;
      }
    }
    var am = st.am, ainc = TAU * (22 + 45 * this.dread) / this.sr, rnorm = 1 / (1 - rough * .5);
    for (i = 0; i < BL; i++) {
      g += gi;
      // roughness AM, normalised so its average gain stays 1 (Dread must not make the piece quieter)
      var a = 1; if (rough > 0) { am += ainc; if (am > TAU) am -= TAU; a = (1 - rough * (.5 + .5 * Math.sin(am))) * rnorm; }
      var l = tL[i] * g * a, r = stereo ? tR[i] * g * a : l;
      l *= pl; r *= prr;
      if (l !== l || r !== r) { l = 0; r = 0; this.src[s].reset(); }
      if (guard) {
        var bl = egBand(eg, 0, l), br = egBand(eg, 16, r);
        var ab = bl < 0 ? -bl : bl, ab2 = br < 0 ? -br : br; if (ab2 > ab) ab = ab2;
        var env = eg.env * eg.rel; if (ab > env) env = ab; eg.env = env;
        var gg = env > eg.ceil ? eg.ceil / env : 1; if (gg < eg.gr) eg.gr = gg;
        l *= gg; r *= gg;   // broadband: subtracting a phase-shifted band does not remove it, scaling the voice does
      }
      var m = (l + r) * .5; rv[i] += m * (rs + aS) * rg; sp[i] += m * ss; dpL[i] += l; dpR[i] += r;
      var al = l < 0 ? -l : l; if (al > pk) pk = al;
      // distance stage, per strip: low-shelf loss, two-pole low-pass, narrower image, level drop
      lo[0] += bc * (l - lo[0]); lo[1] += bc * (r - lo[1]); l += lo[0] * bass; r += lo[1] * bass;
      md[0] += lc * (l - md[0]); md[1] += lc * (md[0] - md[1]); md[2] += lc * (r - md[2]); md[3] += lc * (md[2] - md[3]);
      var mid = (md[1] + md[3]) * .5, sd = (md[1] - md[3]) * .5 * wd; l = (mid + sd) * dg; r = (mid - sd) * dg;
      sL[i] = l; sR[i] = r; dL[i] += l; dR[i] += r;
      var mm = (l + r) * .5; hb[i] += mm * hs; bb[i] += mm * bw; kn[i] += mm * kw; sy[i] += mm * sw;
    }
    lo[0] += 1e-18; lo[1] += 1e-18; md[0] += 1e-18; md[2] += 1e-18;
    if (guard) for (i = 0; i < 32; i += 4) eg.z[i + 2] += 1e-18;
    st.g = gT; st.am = am; if (pk > st.pk) st.pk = pk;
    return pk;
  };
  // sum the instances of a polyphonic continuous source; an instance that is off and has rung out is skipped
  Engine.prototype.renderPoly = function (s, P) {
    var ins = this.inst[s], cv = this.Cv[s], iq = this.iq[s], tL = this.tL, tR = this.tR, pb = this.pbuf, i, k, first = true;
    for (k = 0; k < ins.length; k++) {
      if (cv[k].on || s === 0 && k === 0 && this.symG > 0 && this.symPk > 1e-5) iq[k] = 0; else if (iq[k] > 200) continue;
      var dst = first ? tL : pb;
      ins[k].render(dst, tR, BL, cv[k], P);
      var raw = 0; for (i = 0; i < BL; i += 4) { var a = dst[i] < 0 ? -dst[i] : dst[i]; if (a > raw) raw = a; }
      if (!cv[k].on && raw < 2e-5) { if (++iq[k] > 200) ins[k].reset(); } else iq[k] = 0;
      if (!first) for (i = 0; i < BL; i++) tL[i] += pb[i];
      first = false;
    }
    if (first) tL.fill(0);
  };
  Engine.prototype.process = function (oL, oR) {
    var P = this.P, sr = this.sr, i, s, C = this.C, st, tL = this.tL, tR = this.tR;
    this.momRun(); this.cmRun(); this.loopRun(); this.contacts(); this.macros(); this.voiceMacros();
    this.dL.fill(0); this.dR.fill(0); this.dpL.fill(0); this.dpR.fill(0); this.rvIn.fill(0); this.spIn.fill(0); this.bdIn.fill(0); this.hmIn.fill(0);
    // water wobble: rate follows Slosh (and the amount), 0.3-3 Hz
    var wl = P['water.level'] || 0, wt = P['water.tilt'] || 0; this.wLevel += (wl - this.wLevel) * .2; this.wTilt += (wt - this.wTilt) * .2;
    // slosh: a follower of how fast the tray is tilted (and of knocks), dying away over about 1.5 s (T60)
    var tv = Math.abs(this.wTilt - this.wTilt0) * sr / BL; this.wTilt0 = this.wTilt; this.sl = Math.max(this.sl * Math.exp(-6.91 * BL / (1.5 * sr)), Math.min(1, tv * .35)); if (this.sl < 1e-6) this.sl = 0;
    var wet = Math.min(1, wl * 2 + (P['water.amt'] || 0)), wa = Math.min(1, (P['water.amt'] || 0) + this.sl * .8 * wet); this.water = wa;
    var t0 = this.symIn; this.symIn = this.symB; this.symB = t0; t0.fill(0); this.kn.fill(0); this.symG = (P['ebow.sym'] || 0) * .0009;
    if (this.inAct) this.inputRun(P);
    var sp0 = 0; for (i = 0; i < BL; i += 4) { var sa0 = this.symIn[i] < 0 ? -this.symIn[i] : this.symIn[i]; if (sa0 > sp0) sp0 = sa0; } this.symPk = sp0;
    if (wa > 0) { var wr = TAU * (.3 + 2.7 * Math.max(P['water.slosh'] || 0, this.sl) + .4 * wa) * BL / sr, wph = this.wph; for (var wk = 0; wk < 16; wk++) { wph[wk] += wr * (.55 + .9 * ((wk * .618034) % 1)); wph[wk + 16] += wr * (.31 + .7 * ((wk * .414214) % 1)); this.wv[wk] = .65 * Math.sin(wph[wk]) + .35 * Math.sin(wph[wk + 16] + wk); } }
    var D = this.distance, Dd = this.dist;
    Dd.lc = Math.min(1, 1 - Math.exp(-TAU * 20000 * Math.pow(.06, D) / sr)); Dd.dg = db(-15 * D); Dd.wd = 1 - .6 * D; Dd.bass = (db(4) - 1) * (1 - D); Dd.bc = 1 - Math.exp(-TAU * 150 / sr); Dd.aS = D * .3; Dd.rg = db(-5 * D);
    var order = ORDER;
    for (var q = 0; q < NS; q++) {
      s = order[q]; st = this.strip[s];
      this.useVoice(s);
      if (s === 7) this.src[7].capture(this.dpL, this.dpR, BL);
      if (s === 5 && P['body.spring'] > 0) this.knock(P['body.spring']);
      var cv = this.Cv[s], wake = s === 5 && (this.spInPk > 1e-5 || this.src[5].exc > 0) || s === 0 && this.symG > 0 && this.symPk > 1e-5, k;
      for (k = 0; k < cv.length; k++) if (cv[k].on) wake = true;
      if (wake) st.quiet = 0;
      if (st.quiet > 400) { this.stemL[s].fill(0); this.stemR[s].fill(0); continue; }
      tL.fill(0); tR.fill(0);
      var stereo = s >= 5;
      if (s === 5) this.src[5].render(tL, tR, BL, C[5], P, this.spIn);
      else if (cv.length === 1) this.src[s].render(tL, tR, BL, C[s], P);
      else this.renderPoly(s, P);
      var raw = 0; for (i = 0; i < BL; i += 8) { var a = tL[i] < 0 ? -tL[i] : tL[i]; if (a > raw) raw = a; }
      if (s === 5) { var m5 = 0; for (i = 0; i < BL; i += 4) { var a5 = this.spIn[i] < 0 ? -this.spIn[i] : this.spIn[i]; if (a5 > m5) m5 = a5; } this.spInPk = m5; }
      if (raw < 2e-5 && !wake) st.quiet++; else st.quiet = 0;
      this.stripRun(s, stereo, s < 3 || s === 7);
    }
    this.useGlobals();
    // harmonizer and body returns: their own stems, into the dry sum, and a little into the hall
    var hmL = this.stemL[NS + 2], hmR = this.stemR[NS + 2], bdL = this.stemL[NS + 3], bdR = this.stemR[NS + 3], rvI = this.rvIn;
    this.harm.render(this.hmIn, hmL, hmR, BL, P); this.body.render(this.bdIn, bdL, bdR, BL, P);
    if (this.hbAct) this.hbRender(bdL, bdR, BL);
    for (i = 0; i < BL; i++) { this.dL[i] += hmL[i] + bdL[i]; this.dR[i] += hmR[i] + bdR[i]; rvI[i] += (hmL[i] + hmR[i]) * .18 + (bdL[i] + bdR[i]) * .08; }
    this.rev.render(this.rvIn, this.rL, this.rR, BL, P);
    this.revBoost *= Math.pow(.995, 48000 / sr); this.duckE *= Math.exp(-BL / (.22 * sr));
    var rm = P['rev.mix'], rL = this.rL, rR = this.rR, ring = this.ring, NST = this.NST;
    var hL = this.stemL[NS], hR = this.stemR[NS], wL = this.stemL[NS + 1], wR = this.stemR[NS + 1], dL = this.dL, dR = this.dR;
    // hall return and reverse swell become stems 8 and 9; the swell ring keeps the full dry+hall signal as before
    for (i = 0; i < BL; i++) {
      var l = rL[i] * rm, r = rR[i] * rm; hL[i] = l; hR[i] = r; l += dL[i]; r += dR[i];
      var wl = 0, wr = 0;
      if (this.swEnd >= 0 && i >= this.swEnd) { this.swN = 0; this.swEnd = -1; }
      if (this.swN > 0) { if (this.swP < this.swN) { var e = this.swP / this.swN; e = e * e * 1.6; wl = this.sw[0][this.swP] * e; wr = this.sw[1][this.swP] * e; this.swP++; } else this.swN = 0; }
      wL[i] = wl; wR[i] = wr;
      ring[0][this.rw] = l + wl; ring[1][this.rw] = r + wr; this.rw = (this.rw + 1) & 65535;
    }
    // linear master chain per stem, then the look-ahead delay; sum undelayed (for detection) and delayed (for output)
    var tone = P['master.tone'], gl = db(-5 * tone), gh = db(5 * tone), tc = 1 - Math.exp(-TAU * 700 / sr), vol = db(P['master.vol']), dcR = Math.pow(.9975, 48000 / sr);
    var uL = this.uL, uR = this.uR, sumL = this.sumL, sumR = this.sumR, w0 = this.lkw, LA = this.LA;
    uL.fill(0); uR.fill(0); sumL.fill(0); sumR.fill(0);
    for (s = 0; s < NST; s++) {
      if (s === NS + 4 && !this.inAct) continue;
      var M = this.ms[s], c;
      for (c = 0; c < 2; c++) {
        var b = c ? this.stemR[s] : this.stemL[s], u = c ? uR : uL, sm = c ? sumR : sumL, lk = M.lk[c], tl = M.tl[c], hx = M.hx[c], hy = M.hy[c], w = w0;
        for (i = 0; i < BL; i++) {
          var x = b[i];
          tl += tc * (x - tl); x = (tl * gl + (x - tl) * gh) * vol;
          hy = x - hx + dcR * hy; hx = x; x = hy;
          u[i] += x; lk[w] = x; var dly = lk[(w - LA) & 255]; b[i] = dly; sm[i] += dly; w = (w + 1) & 255;
        }
        M.tl[c] = tl + 1e-18; M.hx[c] = hx; M.hy[c] = hy + 1e-18;
      }
    }
    this.lkw = (w0 + BL) & 255;
    var lg = this.lg, ceil = .891, mgr = 1, pL = 0, pR = 0, lgB = this.lgB, attC = srAlpha(.09, sr), relC = srAlpha(.0004, sr);
    var dqVal = this.dqVal, dqIdx = this.dqIdx, dqHead = this.dqHead, dqTail = this.dqTail, dqPos = this.dqPos, hn = LA + 8;
    for (i = 0; i < BL; i++) {
      var ul = uL[i] < 0 ? -uL[i] : uL[i], ur = uR[i] < 0 ? -uR[i] : uR[i], pkk = ul > ur ? ul : ur, gt = pkk > ceil ? ceil / pkk : 1;
      var pos = dqPos++;
      while (dqHead !== dqTail && dqVal[(dqTail - 1) & 511] >= gt) dqTail = (dqTail - 1) & 511;
      dqVal[dqTail] = gt; dqIdx[dqTail] = pos; dqTail = (dqTail + 1) & 511;
      while (dqHead !== dqTail && dqIdx[dqHead] <= pos - hn) dqHead = (dqHead + 1) & 511;
      gt = dqVal[dqHead];
      // the attack aims 0.004 dB under the target so its exponential approach never leaves an over
      lg += gt < lg ? (gt * .9995 - lg) * attC : (gt - lg) * relC; if (lg < mgr) mgr = lg; lgB[i] = lg;
      l = sumL[i] * lg; r = sumR[i] * lg; l = l > ceil ? ceil : l < -ceil ? -ceil : l; r = r > ceil ? ceil : r < -ceil ? -ceil : r;
      oL[i] = l; oR[i] = r;
      if (l < 0) l = -l; if (r < 0) r = -r; if (l > pL) pL = l; if (r > pR) pR = r;
    }
    this.dqHead = dqHead; this.dqTail = dqTail; this.dqPos = dqPos;
    this.lg = lg; if (mgr < this.gr) this.gr = mgr; if (pL > this.pkL) this.pkL = pL; if (pR > this.pkR) this.pkR = pR;
    if (this.byeN || this.gate) this.byeRun(oL, oR);
    this.frame += BL;
  };
  // your own sound through the machine: dry (its own stem), plus sends into the spring tank, the wooden body, the hall,
  // the harmonizer and the Aura's capture bus. Switching on or off fades over one block; after an off the stem runs a few
  // more blocks (the look-ahead delay empties), then its chain state is cleared and it is skipped again.
  Engine.prototype.inputRun = function (P) {
    var iL = this.inL, iR = this.inR, sL = this.stemL[NS + 4], sR = this.stemR[NS + 4], i;
    if (!this.inOn && this.inE <= 0) {
      if (--this.inTail > 0) { sL.fill(0); sR.fill(0); this.inPk = 0; return; }
      this.inAct = false; this.inG = -1; this.inPk = 0; sL.fill(0); sR.fill(0);
      var M = this.ms[NS + 4]; for (var c = 0; c < 2; c++) { M.tl[c] = 0; M.hx[c] = 0; M.hy[c] = 0; M.lk[c].fill(0); }
      return;
    }
    var gT = db(P['input.level']), g = this.inG < 0 ? gT : this.inG, gi = (gT - g) / BL, e = this.inE, eT = this.inOn ? 1 : 0, ei = (eT - e) / BL;
    var sp = P['input.spr'], bd = P['input.body'] * .5, rv = P['input.rev'], hs = P['input.hsend'], au = P['input.aura'], pk = 0;
    for (i = 0; i < BL; i++) {
      g += gi; e += ei;
      var l = iL[i] * e, r = iR[i] * e, m = (l + r) * .5;
      this.spIn[i] += m * sp; this.bdIn[i] += m * bd; this.rvIn[i] += m * rv; this.hmIn[i] += m * hs; this.dpL[i] += l * au; this.dpR[i] += r * au;
      l *= g; r *= g; sL[i] = l; sR[i] = r; this.dL[i] += l; this.dR[i] += r;
      var a = m < 0 ? -m : m; if (a > pk) pk = a;
    }
    this.inG = gT; this.inE = eT; this.inPk = pk > 1e-9 ? pk : 0; if (pk > 1e-9) this.strip[5].quiet = 0;
    if (!this.inOn) { this.inTail = Math.ceil(this.LA / BL) + 2; iL.fill(0); iR.fill(0); }
  };
  Engine.prototype.input = function (on) {
    on = !!on; if (on === this.inOn) return;
    this.inOn = on; if (on) { this.inAct = true; this.inTail = 0; }
  };
  // GOODBYE (and Esc): a hard stop. The master output (and every stem) fades out over 25 ms (a raised cosine, so no
  // click), then everything is cleared: voices, Hold on every voice (Aura too), Freeze, moments, custom moments, the
  // looper's playback, your sound in, the hall, spring, body and harmonizer tails. From then the output is true zero
  // until something is played again (a gesture, note, moment, looper or input command, or Hold/Freeze switched on),
  // so nothing can restart by itself. The looper keeps its layers: they are muted (their Mute buttons light) and play
  // again only when unmuted; a take being recorded is dropped. Messages that arrive during the 25 ms fade wait for it
  // (Host.msg) and are applied, in order, as soon as it is over.
  Engine.prototype.panic = function () {
    if (!this.byeN) { this.byeN = Math.max(1, Math.round(.025 * this.sr)); this.byeK = 0; }
  };
  Engine.prototype.byeRun = function (oL, oR) {
    var i = 0, s, NST = this.NST, sL = this.stemL, sR = this.stemR;
    if (this.byeN) {
      var N = this.byeN, k = this.byeK;
      for (; i < BL && k < N; i++) {
        k++; var g = .5 + .5 * Math.cos(Math.PI * k / N);
        oL[i] *= g; oR[i] *= g; for (s = 0; s < NST; s++) { sL[s][i] *= g; sR[s][i] *= g; }
      }
      this.byeK = k;
      if (k < N) return;
      this.byeN = 0; this.byeEnd();
    }
    for (; i < BL; i++) { oL[i] = 0; oR[i] = 0; for (s = 0; s < NST; s++) { sL[s][i] = 0; sR[s][i] = 0; } }
  };
  var BYE_NEW = null;   // the voice constructors, in voice order (set below, once they are all defined)
  Engine.prototype.byeEnd = function () {
    var s, j, k, c, P = this.P;
    // every voice instance starts over exactly as built (each voice's own reset() is also its choke and NaN path, so
    // it stays as it is); contacts, slots and channel strips go back to rest
    for (s = 0; s < NS; s++) {
      for (j = 0; j < this.inst[s].length; j++) {
        var v = new BYE_NEW[s](this); this.inst[s][j] = v; if (!j) this.src[s] = v;
        var C = this.Cv[s][j]; C.on = false; C.x = .5; C.y = .5; C.p = .6; C.spd = 0; C.hz = 0; C.auto = false; C.own = null; C.kick = 0; this.iq[s][j] = 999;
      }
      for (j = 0; j < 2; j++) { var S = this.slots[s][j]; S.on = false; S.tx = S.ty = S.x = S.y = .5; S.p = .6; S.spd = 0; S.hz = 0; S.auto = -1; S.kick = 0; }
      for (j = 0; j < 3; j++) { var Sm = this.midiSlots[s][j]; Sm.on = false; Sm.tx = Sm.ty = Sm.x = Sm.y = .5; Sm.p = .6; Sm.spd = 0; Sm.hz = 0; Sm.auto = -1; Sm.kick = 0; }
      var st = this.strip[s]; st.g = 0; st.quiet = 999; st.pk = 0; st.choke = 0; st.am = 0;
      for (c = 0; c < 2; c++) { st.d1[c] = st.d2[c] = st.dl[c] = st.prevX[c] = st.lo[c] = 0; } st.md[0] = st.md[1] = st.md[2] = st.md[3] = 0;
    }
    // the looper keeps its layers, muted; a take in progress is dropped
    for (j = 0; j < this.layers.length; j++) { var L = this.layers[j]; L.sl.on = false; L.mute = true; if (L.gs) L.gs.cur = null; }
    if (this.layers.length) this.lver++;
    this.recL = null;
    while (this.cms.length) this.cmStop(this.cms[0]);
    this.mom = { riser: null, stinger: null, drone: null, heart: null, walls: null, ret: null }; this.mPitch = 0; this.mDread = 0; this.mAura = 0; this.duckE = 0; this.dr2 = 0; this.swN = 0; this.swEnd = -1; this.autoFreeze = false; this.revBoost = 0;
    for (s = 0; s < NS; s++) P[HE_S[s] + '.hold'] = 0;
    P['aura.freeze'] = 0;
    // your sound in: off at once, its chain cleared (as after its own off tail)
    this.inOn = false; this.inAct = false; this.inE = 0; this.inG = -1; this.inTail = 0; this.inPk = 0; this.inL.fill(0); this.inR.fill(0);
    // tails: hall (lines, pre-delay, diffusers), harmonizer, body, heartbeat thump, swell ring, master chains and limiter
    var R = this.rev; for (k = 0; k < 8; k++) { R.b[k].fill(0); R.lp[k] = 0; R.x[k] = 0; } R.pre.fill(0); R.hp = 0; for (k = 0; k < 3; k++) R.ap[k].b.fill(0);
    this.body.reset(); this.harm.reset();
    if (this.hb) { this.hb[0].t = this.hb[1].t = -1; this.hbL1 = this.hbL2 = 0; } this.hbAct = 0;
    this.ring[0].fill(0); this.ring[1].fill(0);
    for (s = 0; s < this.NST; s++) { var M = this.ms[s]; for (c = 0; c < 2; c++) { M.tl[c] = 0; M.hx[c] = 0; M.hy[c] = 0; M.lk[c].fill(0); } }
    this.dqHead = this.dqTail = this.dqPos = 0; this.lg = 1;
    this.eg.z.fill(0); this.eg.env = 0; this.eg.gr = 1;
    this.kd.lp = this.kd.fe = this.kd.se = this.kd.cd = 0; this.symB.fill(0); this.symIn.fill(0); this.symPk = 0; this.spInPk = 0; this.sl = 0;
    this.gate = true;
  };

  /* host: message handling, telemetry and record taps; shared by the AudioWorklet and the fallback node */
  // opt.retro: seconds of rolling master-mix history kept for "Save what I just played" (absent: none, as offline)
  BYE_NEW = [Ebow, Hurdy, Bowed, Glass, Struck, Spring, Junk, Aura, Moan];
  function Host(sr, post, opt) {
    this.e = new Engine(sr); this.post = post; this.tc = 0; this.rec = null; this.CH = 4096;
    var rs = opt && opt.retro > 0 ? Math.ceil(opt.retro * sr / BL) * BL : 0;
    this.rt = rs ? { N: rs, L: new Float32Array(rs), R: new Float32Array(rs), w: 0, fill: 0, job: null } : null;
    // every message carries a sequence number q; the host reports the frame it was applied at, so the main thread can
    // write a performance log that replays bit-exactly offline
    this.ap = new Float64Array(1024); this.apn = 0; this.pool = []; this.tsp = new Float32Array(NS); this.tly = []; this.tjp = new Float32Array(81 * 3 + 3);
    this.oL = new Float32Array(BL); this.oR = new Float32Array(BL);
  }
  // engine messages wait while GOODBYE fades out; these (and Hold or Freeze switched on) end its silence
  var BYEQ = { p: 1, cmdef: 1, cmrec: 1, g: 1, moment: 1, loop: 1, panic: 1, input: 1 }, WAKE = { g: 1, moment: 1, loop: 1, input: 1, cmrec: 1 };
  Host.prototype.msg = function (m) {
    var e = this.e;
    if (e.byeN && BYEQ[m.t]) { (this.byeQ || (this.byeQ = [])).push(m); return; }
    if (e.gate && (WAKE[m.t] || m.t === 'p' && m.v > .5 && (m.k === 'aura.freeze' || /\.hold$/.test(m.k)))) e.gate = false;
    if (m.q !== undefined) { this.ap[this.apn++] = m.q; this.ap[this.apn++] = e.frame; if (this.apn >= 1022) { this.post({ t: 'ap', ap: this.ap.slice(0, this.apn) }); this.apn = 0; } }
    switch (m.t) {
      case 'init': for (var k in m.params) e.P[k] = m.params[k]; if (m.seed) e.rng = new Rng(m.seed); this.ready = true; break;
      case 'p': e.setP(m.k, m.v); break;
      case 'cmdef': e.cmDefine(String(m.id), m.def); break;
      case 'cmrec':
        if (m.on) { if (!e.recM) { var p0 = {}; for (var pk in e.P) p0[pk] = e.cmBase[pk] ? e.cmBase[pk].v : e.P[pk]; e.recM = { start: e.frame, ev: [], pv: [], p0: p0 }; } }
        else if (e.recM) {
          var RM = e.recM, held = {}; e.recM = null;
          RM.ev.forEach(function (x) { if (x.k === 'd') held[x.s] = 1; else if (x.k === 'u') delete held[x.s]; });
          for (var hs in held) RM.ev.push({ t: e.frame - RM.start, s: +hs, k: 'u', x: 0, y: 0, p: 0, hz: 0 });
          var used = {}; RM.pv.forEach(function (x) { used[x.k] = RM.p0[x.k]; });
          this.post({ t: 'cmrec', sr: e.sr, dur: e.frame - RM.start, ev: RM.ev, pv: RM.pv, p0: used });
        }
        break;
      case 'g': e.user(m.s, m.k, m.x, m.y, m.p, m.hz, m.slot || 0); break;
      case 'moment': e.moment(m.id, m.on, m.arg); break;
      case 'loop': e.loopCmd(m); break;
      case 'panic': e.panic(); break;
      case 'rec': if (m.on) { this.rec = { stems: !!m.stems, fill: 0, mix: this.buf(), st: null, pk: new Float32Array(this.e.NST) }; if (m.stems) this.newStems(); } else { this.flush(true); this.rec = null; } break;
      case 'ret': this.ret(m.b); break;
      case 'input': e.input(m.on); if (!m.on) { e.inL.fill(0); e.inR.fill(0); } break;
      case 'retro': this.retro(m.sec || 60); break;
      // the looper's layers at this frame, for the main thread's log checkpoints ("Save what I just played")
      case 'lsnap': this.post({ t: 'lsnap', q: m.q, f: e.frame, snap: e.snap() }); break;
    }
  };
  // "Save what I just played": copy the last sec seconds (whole blocks) of the master mix out of the ring, a slice per
  // block so the audio thread never stalls; the ring is half a second longer than the longest grab, so nothing is
  // overwritten meanwhile. start/end are engine frames: the performance log knows exactly what was played between them.
  Host.prototype.retro = function (sec) {
    var T = this.rt, e = this.e; if (!T) { this.post({ t: 'retro', n: 0, total: 0, start: e.frame, end: e.frame, last: true, d: new Float32Array(0) }); return; }
    if (T.job) return;
    var n = Math.min(T.fill, Math.round(sec * e.sr), T.N - Math.round(.5 * e.sr)); n = Math.max(0, Math.floor(n / BL) * BL);
    T.job = { n: n, pos: 0, start: (T.w - n + T.N) % T.N, end: e.frame };
    if (n <= 0) { this.post({ t: 'retro', n: 0, total: 0, start: e.frame, end: e.frame, last: true, d: new Float32Array(0) }); T.job = null; }
  };
  Host.prototype.retroStep = function () {
    var T = this.rt, J = T.job, k = Math.min(16384, J.n - J.pos), d = new Float32Array(k * 2), j = (J.start + J.pos) % T.N;
    for (var i = 0; i < k; i++) { d[i * 2] = T.L[j]; d[i * 2 + 1] = T.R[j]; if (++j === T.N) j = 0; }
    J.pos += k; var last = J.pos >= J.n;
    this.post({ t: 'retro', n: k, total: J.n, start: J.end - J.n, end: J.end, last: last, d: d }, [d.buffer]);
    if (last) T.job = null;
  };
  // recorder buffers come back from the main thread after use, so a long take does not allocate on the audio thread
  Host.prototype.buf = function () { return this.pool.length ? this.pool.pop() : new Float32Array(this.CH * 2); };
  Host.prototype.ret = function (b) { for (var i = 0; i < b.length; i++) if (b[i].byteLength === this.CH * 8 && this.pool.length < 64) this.pool.push(new Float32Array(b[i])); };
  Host.prototype.newStems = function () { var r = this.rec; r.st = []; for (var i = 0; i < this.e.NST; i++) { r.st.push(this.buf()); r.pk[i] = 0; } };
  Host.prototype.flush = function (last) {
    var r = this.rec; if (!r) return;
    var n = r.fill, msg = { t: 'chunk', n: n, mix: r.mix, st: null, last: !!last }, tr = [r.mix.buffer];
    if (r.stems) { msg.st = []; for (var i = 0; i < this.e.NST; i++) { if (r.pk[i] > 1e-6) { msg.st.push(r.st[i]); tr.push(r.st[i].buffer); } else { msg.st.push(null); if (this.pool.length < 64) this.pool.push(r.st[i]); } } }
    this.post(msg, tr);
    if (!last) { r.mix = this.buf(); r.fill = 0; if (r.stems) this.newStems(); }
  };
  // IL, IR: optional audio input for this block (same offset), read only while the input is on
  Host.prototype.block = function (L, R, off, IL, IR) {
    var e = this.e, oL = this.oL, oR = this.oR, i;
    if (!this.ready) { for (i = 0; i < BL; i++) { L[off + i] = 0; R[off + i] = 0; } return; }
    if (e.inOn && IL) { var iR = IR || IL; for (i = 0; i < BL; i++) { e.inL[i] = IL[off + i]; e.inR[i] = iR[off + i]; } }
    e.process(oL, oR);
    for (i = 0; i < BL; i++) { L[off + i] = oL[i]; R[off + i] = oR[i]; }
    if (this.byeQ && this.byeQ.length && !e.byeN) { var Q = this.byeQ; this.byeQ = []; for (i = 0; i < Q.length; i++) this.msg(Q[i]); }
    var T = this.rt;
    if (T) { var w = T.w, N = T.N; for (i = 0; i < BL; i++) { T.L[w] = oL[i]; T.R[w] = oR[i]; if (++w === N) w = 0; } T.w = w; if (T.fill < N) T.fill = Math.min(N, T.fill + BL); if (T.job) this.retroStep(); }
    var r = this.rec;
    if (r) {
      var f = r.fill * 2;
      for (i = 0; i < BL; i++) { r.mix[f + i * 2] = oL[i]; r.mix[f + i * 2 + 1] = oR[i]; }
      if (r.stems) for (var s = 0; s < e.NST; s++) {
        var a = e.stemL[s], b = e.stemR[s], d = r.st[s], pk = r.pk[s];
        for (i = 0; i < BL; i++) { var x = a[i], y = b[i]; d[f + i * 2] = x; d[f + i * 2 + 1] = y; if (x > pk) pk = x; else if (-x > pk) pk = -x; }
        r.pk[s] = pk;
      }
      r.fill += BL; if (r.fill >= this.CH) this.flush(false);
    }
    if (++this.tc >= 8) {
      this.tc = 0;
      var sp = this.tsp, ly = this.tly, M = e.mom, J = e.src[6], jn = J.count, jp = null; ly.length = 0;
      for (i = 0; i < NS; i++) { sp[i] = e.strip[i].pk; e.strip[i].pk = 0; }
      for (i = 0; i < e.layers.length; i++) { var Ly = e.layers[i]; ly.push({ id: Ly.id, src: Ly.src, len: Ly.len / e.sr, pos: Ly.pos / Ly.len, mute: Ly.mute, ghost: Ly.ghost }); }
      if (this.wantJunk) { jp = this.tjp.subarray(0, jn * 3 + 3); for (i = 0; i < jn; i++) { jp[i * 3] = J.px[i]; jp[i * 3 + 1] = J.py[i]; jp[i * 3 + 2] = J.r[i]; } jp[jn * 3] = J.mx; jp[jn * 3 + 1] = J.my; jp[jn * 3 + 2] = J.mon ? 1 : 0; }
      var ap = null; if (this.apn) { ap = this.ap.slice(0, this.apn); this.apn = 0; }
      this.post({ t: 'tm', ap: ap, f: e.frame, inp: e.inPk, uc: e.ucnt || 0, ly: ly, pk: [e.pkL, e.pkR], gr: e.gr, sp: sp, rec: !!e.recL, lane: e.lane ? e.lane.len / e.sr : 0, nu: e.undo.length, nr: e.redo.length, mom: { riser: M.riser ? M.riser.t / M.riser.dur : -1, stinger: !!M.stinger, drone: !!M.drone, heart: !!M.heart, walls: !!M.walls, c: e.cms.map(function (I) { return [I.id, Math.min(1, I.pos / Math.max(1, I.d.len))]; }), cr: e.recM ? (e.frame - e.recM.start) / e.sr : -1 }, jp: jp, frz: e.src[7].frozen, bp: e.body.pk, hp: e.harm.pk });
      e.body.pk = 0; e.harm.pk = 0;
      e.pkL = 0; e.pkR = 0; e.gr = 1;
    }
  };
  return { Engine: Engine, Host: Host, BL: BL };
}
if (typeof module !== 'undefined') module.exports = { HE_SOURCES: HE_SOURCES, HE_PARAMS: HE_PARAMS, HECoreFactory: HECoreFactory };
