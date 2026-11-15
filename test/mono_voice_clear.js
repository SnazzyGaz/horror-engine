// Superball (Moan) is mixed as stereo but used to write only the left work buffer, so a leftover 128-sample right
// buffer was replayed every block as a constant tone at sr/128 (and its harmonics) after the voice went silent.
// After the fix it writes R = L, and both work buffers are cleared before each voice is rendered.
// node test/mono_voice_clear.js [path/to/engine.js]
// Horror Engine by Garyck Arntzen (https://x.com/_mintydoge).
'use strict';
var path = require('path');
var M = require(path.resolve(process.argv[2] || path.join(__dirname, '../src/engine.js'))), failed = 0, passed = 0;
function ok(c, m) { console.log((c ? 'PASS ' : 'FAIL ') + m); if (c) passed++; else { failed++; process.exitCode = 1; } }
function dB(x) { return (20 * Math.log10(x + 1e-30)).toFixed(1); }
function peak(a, f0, f1) { var m = 0; for (var i = f0; i < f1 && i < a.length; i++) { var v = a[i] < 0 ? -a[i] : a[i]; if (v > m) m = v; } return m; }
function goertzel(a, f0, f1, freq, sr) {
  var w = 2 * Math.PI * freq / sr, coeff = 2 * Math.cos(w), s0 = 0, s1 = 0, s2 = 0, i;
  for (i = f0; i < f1 && i < a.length; i++) { s0 = a[i] + coeff * s1 - s2; s2 = s1; s1 = s0; }
  var n = Math.max(1, Math.min(f1, a.length) - f0);
  return Math.sqrt(s1 * s1 + s2 * s2 - coeff * s1 * s2) / n * 2;
}

function dryParams() {
  var P = {}; M.HE_PARAMS.forEach(function (p) { P[p.id] = p.def; });
  ['rev.mix', 'body.amt', 'harm.mix', 'moan.rev', 'moan.spr', 'moan.hsend',
    'spring.rev', 'spring.hsend', 'junk.rev', 'junk.hsend', 'aura.rev', 'aura.hsend'].forEach(function (k) { if (k in P) P[k] = 0; });
  P['aura.hold'] = 0; P['aura.freeze'] = 0; P['moan.hold'] = 0;
  return P;
}

function reportBand(name, L, R, a, b, SR) {
  var fund = SR / 128, out = [], h, i, mid = new Float32Array(b - a);
  for (i = 0; i < mid.length; i++) mid[i] = 0.5 * (L[a + i] + R[a + i]);
  for (h = 1; h <= 4; h++) {
    var eL = goertzel(L, a, b, fund * h, SR), eR = goertzel(R, a, b, fund * h, SR), eM = goertzel(mid, 0, mid.length, fund * h, SR);
    out.push({ h: h, hz: fund * h, L: eL, R: eR, M: eM });
    console.log('  ' + name + '  ' + (fund * h).toFixed(2) + ' Hz  L ' + dB(eL) + '  R ' + dB(eR) + '  mid ' + dB(eM) + ' dBFS');
  }
  return out;
}
function worstOf(bands) { var w = 0; bands.forEach(function (b) { w = Math.max(w, b.L, b.R, b.M); }); return w; }

function render(SR) {
  var core = M.HECoreFactory(), BL = core.BL, P = dryParams();
  var F = function (t) { return Math.round(t * SR / BL) * BL; };
  function hostWith(evBuild, plant) {
    var h = new core.Host(SR, function () { }), ev = [];
    function at(t, m) { ev.push([F(t), m]); }
    evBuild(at);
    ev.sort(function (a, b) { return a[0] - b[0]; });
    h.msg({ t: 'init', params: P, seed: 1337 });
    var end = F(4.5), L = new Float32Array(BL), R = new Float32Array(BL);
    var outL = new Float32Array(end), outR = new Float32Array(end), k = 0, f, planted = false;
    for (f = 0; f < end; f += BL) {
      while (k < ev.length && ev[k][0] <= f) h.msg(ev[k++][1]);
      if (plant && !planted && f === F(plant.at)) {
        var i; for (i = 0; i < BL; i++) h.e.tR[i] = Math.sin(2 * Math.PI * i / BL);
        planted = true;
      }
      h.block(L, R, 0);
      outL.set(L, f); outR.set(R, f);
    }
    return { L: outL, R: outR, end: end };
  }
  function stroke(at, t0, t1, s) {
    at(t0, { t: 'g', s: s, k: 'd', x: .2, y: .5, p: .9, hz: 0 });
    for (var t = t0 + .02; t < t1; t += .02) at(t, { t: 'g', s: s, k: 'm', x: .2 + .5 * (t - t0) / (t1 - t0), y: .5, p: .9, hz: 0 });
    at(t1, { t: 'g', s: s, k: 'u' });
  }
  // a loud Spring, then GOODBYE (which used not to clear tR); Superball follows and lifts off
  var pub = hostWith(function (at) { stroke(at, .05, .35, 5); at(.40, { t: 'panic' }); stroke(at, .70, 1.30, 8); });
  // a 0 dBFS one-cycle-per-block sine planted in tR just as Superball starts (no other stereo voice)
  var plt = hostWith(function (at) { stroke(at, .05, .55, 8); }, { at: .05 });
  return { pub: pub, plt: plt, F: F, BL: BL };
}

[44100, 48000].forEach(function (SR) {
  var r = render(SR), F = r.F, fund = SR / 128, lim = Math.pow(10, -90 / 20);
  // windows start 1.2 s after lift-off, long enough for the moan to die, still inside the period a stale
  // right buffer would keep singing (the strip has not been quiet-skipped yet)
  var pubA = F(1.30 + 1.20), pubB = F(1.30 + 2.00);
  ok(peak(r.pub.L, F(.80), F(1.20)) > Math.pow(10, -40 / 20),
    SR + ' Hz: Superball itself sounds (peak ' + dB(peak(r.pub.L, F(.80), F(1.20))) + ' dBFS)');
  console.log(SR + ' Hz: Spring+GOODBYE+Superball, after lift-off (from ' + (pubA / SR).toFixed(2) + ' s):');
  var pb = reportBand('public', r.pub.L, r.pub.R, pubA, pubB, SR), pw = worstOf(pb);
  ok(pw < lim, SR + ' Hz: no block-rate energy (sr/128 and harmonics) after Superball is silent (worst ' + dB(pw) + ' dBFS, fund ' + fund.toFixed(2) + ' Hz)');

  var pA = F(.55 + 1.20), pB = F(.55 + 2.00);
  ok(peak(r.plt.L, F(.10), F(.50)) > Math.pow(10, -40 / 20),
    SR + ' Hz: planted-buffer Superball itself sounds (peak ' + dB(peak(r.plt.L, F(.10), F(.50))) + ' dBFS)');
  console.log(SR + ' Hz: planted 0 dBFS block-rate sine in tR, after lift-off (from ' + (pA / SR).toFixed(2) + ' s):');
  var qb = reportBand('planted', r.plt.L, r.plt.R, pA, pB, SR), qw = worstOf(qb);
  ok(qw < lim, SR + ' Hz: planted block-rate sine does not remain after Superball is silent (worst ' + dB(qw) + ' dBFS)');
});
console.log((failed ? failed + ' failed, ' : '') + passed + ' passed');
