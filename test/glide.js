// Gliding moves ('n'): a drag pulls as smoothly however the moves reach the engine.
// A hand sweeping the board is sampled the way the UI really delivers it (one move per browser frame at 60 fps, a busy
// page dropping to 20-50 ms frames, or a plugin host taking 1024-sample buffers), and handed to the engine in clumps at
// audio callback boundaries. Plain moves ('m') jump and stop, so the hand speed the Bowed and Glass voices hear
// pulses; glides must stay close to a hand sampled every block.
// node test/glide.js [-v]
'use strict';
var path = require('path'), M = require(path.join(__dirname, '..', 'src', 'engine.js'));
var failed = 0, V = process.argv.indexOf('-v') > 0;
function ok(c, m) { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) { failed++; process.exitCode = 1; } }
function rng(s) { return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e6) / 1e6; }; }
var DUR = 3, T0 = .05;
function pos(t) { var s = t - T0; return [.5 + .32 * Math.sin(2 * Math.PI * .55 * s), .45 + .12 * Math.sin(2 * Math.PI * .21 * s + 1)]; }
// UI move times (s): every block (reference), browser frames at 60 fps, or a slow page (20-50 ms frames)
function times(kind, seed) {
  var r = rng(seed), t = T0, out = [];
  while (t < T0 + DUR) { t += kind === 'ref' ? 128 / 48000 : kind === '60fps' ? 1 / 60 : .02 + .03 * r(); out.push(t); }
  return out;
}
// run: moves made at `ts`, delivered at audio callbacks of `cb` frames; kind 'm' or 'n'
function run(SR, voice, ts, cb, k) {
  var core = M.HECoreFactory(), BL = core.BL, P = {}; M.HE_PARAMS.forEach(function (p) { P[p.id] = p.def; });
  var h = new core.Host(SR, function () { }); h.msg({ t: 'init', params: P, seed: 1337 });
  var L = new Float32Array(BL), R = new Float32Array(BL), spd = [], env = [], sq = 0, i = 0, end = Math.round((T0 + DUR + .1) * SR), a = pos(T0);
  h.msg({ t: 'g', s: voice, k: 'd', x: a[0], y: a[1], p: .6, hz: 0 });
  for (var f = 0; f < end; f += BL) {
    if (f % cb < BL) { var now = (f + cb) / SR; while (i < ts.length && ts[i] <= Math.min(now, f / SR + cb / SR)) { var q = pos(ts[i]); h.msg({ t: 'g', s: voice, k: k, x: q[0], y: q[1], p: .6, hz: 0 }); i++; } }
    h.block(L, R, 0);
    var e = 0; for (var j = 0; j < BL; j++) e += L[j] * L[j]; env.push(Math.sqrt(e / BL));
    spd.push(h.e.slots[voice][0].spd); if (voice === 3 && h.e.src[3].sq > .05) sq++;
  }
  var bps = SR / BL, a0 = Math.round((T0 + .4) * bps), b0 = Math.round((T0 + DUR - .2) * bps), w = Math.round(.03 * bps);
  function rip(v, db) { var s = 0, m = 0, c = 0; for (var n = a0; n < b0; n++) { var av = 0; for (var j = n - w; j <= n + w; j++) av += db ? 20 * Math.log10(v[j] + 1e-9) : v[j]; av /= 2 * w + 1; var x = db ? 20 * Math.log10(v[n] + 1e-9) : v[n]; s += (x - av) * (x - av); m += x; c++; } return { r: Math.sqrt(s / c), m: m / c }; }
  var S = rip(spd, false), E = rip(env, true);
  return { spd: S.r / S.m, mean: S.m, env: E.r, sq: sq / bps };
}
[44100, 48000].forEach(function (SR) {
  [[2, 'Bowed'], [3, 'Glass']].forEach(function (vv) {
    var ref = run(SR, vv[0], times('ref', 1), 128, 'm');
    if (V) console.log(vv[1] + ' ' + SR + ' Hz, hand sampled every block: speed ripple ' + ref.spd.toFixed(3) + ', envelope ripple ' + ref.env.toFixed(2) + ' dB, mean speed ' + ref.mean.toFixed(3));
    [['60fps', 512], ['slow', 512], ['60fps', 1024], ['slow', 1024], ['60fps', 256]].forEach(function (c) {
      var ts = times(c[0], 7), om = run(SR, vv[0], ts, c[1], 'm'), on = run(SR, vv[0], ts, c[1], 'n');
      var tag = vv[1] + ' ' + SR + ' Hz, ' + (c[0] === 'slow' ? '20-50 ms frames' : '60 fps') + ', ' + c[1] + '-frame callbacks';
      if (V) console.log('  ' + tag + ': move speed ripple ' + om.spd.toFixed(3) + ' env ' + om.env.toFixed(2) + ' dB squeak ' + om.sq.toFixed(2) + ' s | glide ' + on.spd.toFixed(3) + ' env ' + on.env.toFixed(2) + ' dB squeak ' + on.sq.toFixed(2) + ' s');
      ok(on.spd < om.spd * .5 && on.spd < .09, tag + ': glide speed ripple ' + on.spd.toFixed(3) + ' (plain moves ' + om.spd.toFixed(3) + ', every block ' + ref.spd.toFixed(3) + ')');
      ok(Math.abs(on.mean - ref.mean) < .06 * ref.mean, tag + ': glide keeps the mean speed (' + on.mean.toFixed(3) + ' vs ' + ref.mean.toFixed(3) + ')');
    });
  });
});
// a slow skate: a mouse dragged at 10-25 px/s across a 700 px board reports a move only when it reaches a new pixel
// (every one to five frames), so plain moves leave the hand standing still between them and the glass keeps letting go.
// Glides hold the hand's speed across those gaps (up to 120 ms), so the glass stays in touch.
function slow(SR, v, k) {
  var core = M.HECoreFactory(), BL = core.BL, P = {}; M.HE_PARAMS.forEach(function (p) { P[p.id] = p.def; });
  var h = new core.Host(SR, function () { }); h.msg({ t: 'init', params: P, seed: 1337 });
  var L = new Float32Array(BL), R = new Float32Array(BL), r = rng(5), last = -1, nf = 1, sp = [];
  h.msg({ t: 'g', s: 3, k: 'd', x: .15, y: .5, p: .6, hz: 0 });
  for (var f = 0; f < 4 * SR; f += BL) {
    if (f % 512 === 0) while (nf / 60 <= (f + 512) / SR) { var px = Math.floor(.15 * 700 + v * nf / 60 + (r() - .5) * .6); if (px !== last) { last = px; h.msg({ t: 'g', s: 3, k: k, x: px / 700, y: .5, p: .6, hz: 0 }); } nf++; }
    h.block(L, R, 0); if (f > .5 * SR) sp.push(h.e.slots[3][0].spd);
  }
  var m = sp.reduce(function (a, b) { return a + b; }, 0) / sp.length, sd = Math.sqrt(sp.reduce(function (a, b) { return a + (b - m) * (b - m); }, 0) / sp.length);
  return { off: sp.filter(function (x) { return x < .004; }).length / sp.length, cv: sd / m };
}
[44100, 48000].forEach(function (SR) {
  [10, 25].forEach(function (v) {
    var om = slow(SR, v, 'm'), on = slow(SR, v, 'n'), tag = 'Glass ' + SR + ' Hz, a slow skate at ' + v + ' px/s';
    if (V) console.log('  ' + tag + ': plain moves let go ' + (100 * om.off).toFixed(0) + '% of the time (speed cv ' + om.cv.toFixed(2) + ') | glides ' + (100 * on.off).toFixed(0) + '% (cv ' + on.cv.toFixed(2) + ')');
    ok(on.off < .1 && on.cv < .3 && on.cv < om.cv * .6, tag + ': glides keep the glass in touch (let go ' + (100 * on.off).toFixed(0) + '% vs ' + (100 * om.off).toFixed(0) + '%, speed cv ' + on.cv.toFixed(2) + ' vs ' + om.cv.toFixed(2) + ')');
  });
});
// glides survive the files: a custom moment with 'n' moves validates, and a performance file keeps them as glides
var IO = require(path.join(__dirname, '..', 'src', 'io.js'));
var mo = { id: 'g1', name: 'Glide', voice: -1, len: 1, ev: [[0, 3, 'd', .2, .5, .6, 0], [.1, 3, 'n', .4, .5, .6, 0], [.5, 3, 'u']], lanes: [] };
ok(IO.validate(IO.SCHEMAS.moment, { format: 'horror-engine.moment', version: IO.VERSION, moment: mo }).length === 0, "a custom moment with gliding moves ('n') validates");
var P0 = {}; M.HE_PARAMS.forEach(function (p) { P0[p.id] = p.def; });
var lg = IO.toLog({ preset: IO.toPreset(P0, 'g'), seed: 1, durationFrames: 48000, liveEvents: [{ f: 0, type: 'down', c: 3, x: .2, y: .5, p: .6 }, { f: 480, type: 'move', c: 3, x: .4, y: .5, p: .6, glide: true }, { f: 960, type: 'move', c: 3, x: .5, y: .5, p: .6 }, { f: 4800, type: 'up', c: 3 }] }, 48000).log;
ok(lg[2].m.k === 'n' && lg[3].m.k === 'm', 'a performance file replays glides as glides and plain moves as plain moves');
console.log(failed ? failed + ' failed' : 'all passed');
