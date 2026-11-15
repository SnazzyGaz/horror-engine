// GOODBYE is a hard stop: with the Aura holding, Freeze on, a Ghost layer playing, a drone bed and a 30 s hall,
// the output is below -90 dBFS 50 ms after GOODBYE, the fade is click-free, nothing restarts by itself, the looper keeps
// its (muted) layers, and the next touch plays normally. At 44.1, 48 and 96 kHz.
// node test/goodbye.js [path/to/engine.js]
'use strict';
var path = require('path');
var M = require(path.resolve(process.argv[2] || path.join(__dirname, '../src/engine.js'))), failed = 0, passed = 0;
function ok(c, m) { console.log((c ? 'PASS ' : 'FAIL ') + m); if (c) passed++; else { failed++; process.exitCode = 1; } }
function dB(x) { return (20 * Math.log10(x + 1e-30)).toFixed(1); }
var SRC = M.HE_SOURCES;

function scene(SR, opt) {
  var core = M.HECoreFactory(), BL = core.BL, P = {}; M.HE_PARAMS.forEach(function (p) { P[p.id] = p.def; });
  P['aura.hold'] = 1; P['rev.decay'] = 30; P['rev.mix'] = 1; P['rev.size'] = 1;
  var h = new core.Host(SR, function () { }), ev = [], F = function (t) { return Math.round(t * SR / BL) * BL; };
  function at(t, m) { ev.push([F(t), m]); }
  function stroke(t0, t1, s) { at(t0, { t: 'g', s: s, k: 'd', x: .2, y: .5, p: .8, hz: 0 }); for (var t = t0 + .02; t < t1; t += .02) at(t, { t: 'g', s: s, k: 'm', x: .2 + .6 * (t - t0) / (t1 - t0), y: .5 + .2 * Math.sin(t * 9), p: .8, hz: 0 }); at(t1, { t: 'g', s: s, k: 'u' }); }
  // a looped bowed-metal phrase, handed to a Ghost; an e-bow line; a drone bed; Freeze; a stinger; then GOODBYE at 4 s
  at(.1, { t: 'loop', a: 'rec' }); stroke(.15, .9, 2); stroke(1.0, 1.8, 2); at(1.9, { t: 'loop', a: 'stop' });
  at(2.0, { t: 'loop', a: 'ghost', id: 1, v: true });
  stroke(2.1, 3.4, 0); at(2.4, { t: 'moment', id: 'drone', on: true }); at(3.0, { t: 'p', k: 'aura.freeze', v: 1 }); at(3.5, { t: 'moment', id: 'stinger', on: true });
  var bye = F(4);
  if (!opt.noBye) at(4, { t: 'panic' });
  (opt.extra || []).forEach(function (e) { at(e[0], e[1]); });
  ev.sort(function (a, b) { return a[0] - b[0]; });
  h.msg({ t: 'init', params: P, seed: 1337 });
  var end = F(opt.end || 7), L = new Float32Array(BL), R = new Float32Array(BL), out = new Float32Array(end), k = 0, f;
  for (f = 0; f < end; f += BL) {
    while (k < ev.length && ev[k][0] <= f) h.msg(ev[k++][1]);
    h.block(L, R, 0);
    out.set(L, f);
  }
  return { out: out, bye: bye, h: h, SR: SR, BL: BL };
}
function peak(a, f0, f1) { var m = 0; for (var i = f0; i < f1; i++) { var v = a[i] < 0 ? -a[i] : a[i]; if (v > m) m = v; } return m; }
function step(a, f0, f1) { var m = 0; for (var i = Math.max(1, f0); i < f1; i++) { var d = Math.abs(a[i] - a[i - 1]); if (d > m) m = d; } return m; }
function hf(a, f0, f1) { var q = 0; for (var i = Math.max(2, f0); i < f1; i++) { var d = a[i] - 2 * a[i - 1] + a[i - 2]; q += d * d; } return Math.sqrt(q / (f1 - f0)); }
function curve(a, f0, f1) { var m = 0; for (var i = Math.max(2, f0); i < f1; i++) { var d = Math.abs(a[i] - 2 * a[i - 1] + a[i - 2]); if (d > m) m = d; } return m; }

[44100, 48000, 96000].forEach(function (SR) {
  var r = scene(SR, {}), a = r.out, b = r.bye, ms = function (x) { return Math.round(x * SR / 1000); }, e = r.h.e;
  var before = peak(a, b - ms(500), b), after = peak(a, b + ms(50), a.length);
  // clicks: the same scene without GOODBYE is the reference; over the fade the output must carry no more high-frequency
  // energy (rms of the second difference) than the reference, and the fade must land on zero without a step
  var x = scene(SR, { noBye: true }).out, W = ms(30), hy = hf(a, b, b + W), hx = hf(x, b, b + W), endPk = peak(a, b + ms(24), b + ms(25));
  ok(before > Math.pow(10, -30 / 20), SR + ' Hz: it is loud before GOODBYE (peak ' + dB(before) + ' dBFS: Aura hold, Freeze, Ghost, drone, stinger, 30 s hall)');
  ok(after < Math.pow(10, -90 / 20), SR + ' Hz: below -90 dBFS from 50 ms after GOODBYE to 3 s later (peak ' + dB(after) + ' dBFS)');
  ok(hy <= hx && endPk < before * .01, SR + ' Hz: no click: high-frequency energy over the fade ' + dB(hy) + ' dB vs ' + dB(hx) + ' dB without GOODBYE; last millisecond of the fade ' + dB(endPk) + ' dBFS');
  var P = e.P, holds = SRC.filter(function (s) { return P[s + '.hold'] > .5; });
  ok(!holds.length && !(P['aura.freeze'] > .5) && !e.autoFreeze, SR + ' Hz: Hold (every voice, Aura too) and Freeze are off' + (holds.length ? ': ' + holds : ''));
  ok(e.layers.length === 1 && e.layers.every(function (L) { return L.mute && L.ghost; }) && !e.recL, SR + ' Hz: the looper keeps its Ghost layer, muted');
  var Mo = e.mom; ok(!Mo.riser && !Mo.stinger && !Mo.drone && !Mo.heart && !Mo.walls && !e.cms.length, SR + ' Hz: every moment stopped');
});

// the next touch plays normally: the same e-bow stroke after GOODBYE and on a fresh engine with the same settings
(function () {
  var SR = 48000, r = scene(SR, { end: 7.5, extra: [] }), r2 = scene(SR, { end: 7.5, extra: [[5, { t: 'g', s: 0, k: 'd', x: .3, y: .5, p: .8, hz: 0 }], [5.6, { t: 'g', s: 0, k: 'm', x: .6, y: .5, p: .8, hz: 0 }], [6.2, { t: 'g', s: 0, k: 'u' }]] });
  var core = M.HECoreFactory(), BL = core.BL, P = {}; M.HE_PARAMS.forEach(function (p) { P[p.id] = p.def; }); P['aura.hold'] = 0; P['rev.decay'] = 30; P['rev.mix'] = 1; P['rev.size'] = 1;
  var h = new core.Host(SR, function () { }), L = new Float32Array(BL), R = new Float32Array(BL), ref = new Float32Array(Math.round(2.5 * SR / BL) * BL);
  h.msg({ t: 'init', params: P, seed: 1337 });
  for (var f = 0; f < ref.length; f += BL) { if (f === 0) h.msg({ t: 'g', s: 0, k: 'd', x: .3, y: .5, p: .8, hz: 0 }); if (f === Math.round(.6 * SR / BL) * BL) h.msg({ t: 'g', s: 0, k: 'm', x: .6, y: .5, p: .8, hz: 0 }); if (f === Math.round(1.2 * SR / BL) * BL) h.msg({ t: 'g', s: 0, k: 'u' }); h.block(L, R, 0); ref.set(L, f); }
  function rms(a, f0, f1) { var s = 0; for (var i = f0; i < f1; i++) s += a[i] * a[i]; return Math.sqrt(s / (f1 - f0)); }
  var b5 = Math.round(5 * SR / BL) * BL, quiet = peak(r.out, Math.round(4.05 * SR), r.out.length), got = rms(r2.out, b5, b5 + SR), want = rms(ref, 0, SR);
  ok(quiet < Math.pow(10, -90 / 20), 'nothing restarts by itself: 3.5 s after GOODBYE untouched, peak ' + dB(quiet) + ' dBFS');
  ok(Math.abs(20 * Math.log10(got / want)) < 3, 'the next touch plays normally: e-bow stroke after GOODBYE ' + dB(got) + ' dB rms vs ' + dB(want) + ' dB on a fresh engine');
  // a touch during the 25 ms fade waits for it, then plays
  var r3 = scene(SR, { end: 5, extra: [[4.006, { t: 'g', s: 0, k: 'd', x: .3, y: .5, p: .8, hz: 0 }], [4.6, { t: 'g', s: 0, k: 'u' }]] }), b = r3.bye, ms = Math.round(SR / 1000);
  var x3 = scene(SR, { end: 5, noBye: true }).out, late = peak(r3.out, b + 100 * ms, b + 500 * ms);
  ok(late > Math.pow(10, -40 / 20) && hf(r3.out, b, b + 30 * ms) <= hf(x3, b, b + 30 * ms), 'a touch during the fade waits for it (no click) and then sounds (peak ' + dB(late) + ' dBFS)');
  // the engine itself is clear, not just gated: lift the silence with a stray release and nothing is left ringing
  var r6 = scene(SR, { end: 6, extra: [[4.2, { t: 'g', s: 0, k: 'u' }]] }), lifted = peak(r6.out, Math.round(4.2 * SR), r6.out.length);
  ok(lifted < Math.pow(10, -90 / 20) && !r6.h.e.gate, 'with the silence lifted by a stray release nothing is left ringing (peak ' + dB(lifted) + ' dBFS)');
  // unmuting the kept layer plays it again
  var r4 = scene(SR, { end: 6, extra: [[4.5, { t: 'loop', a: 'mute', id: 1, v: false }]] });
  ok(peak(r4.out, Math.round(4.6 * SR), r4.out.length) > Math.pow(10, -50 / 20), 'unmuting the kept Ghost layer plays it again (peak ' + dB(peak(r4.out, Math.round(4.6 * SR), r4.out.length)) + ' dBFS)');
  // Hold switched back on after GOODBYE brings the Aura back (it is not stuck off)
  var r5 = scene(SR, { end: 6, extra: [[4.5, { t: 'p', k: 'aura.hold', v: 1 }], [4.5, { t: 'g', s: 0, k: 'd', x: .3, y: .5, p: .8, hz: 0 }], [5, { t: 'g', s: 0, k: 'u' }]] });
  ok(peak(r5.out, Math.round(5.2 * SR), r5.out.length) > Math.pow(10, -60 / 20), 'Hold switched on again after GOODBYE works (Aura peak ' + dB(peak(r5.out, Math.round(5.2 * SR), r5.out.length)) + ' dBFS)');
})();
console.log((failed ? failed + ' failed, ' : '') + passed + ' passed');
