// Headless DSP and file-I/O checks for Horror Engine. No browser or GPU.
// Run from the repo root: node test/engine.js
'use strict';

var path = require('path');
var root = path.join(__dirname, '..');
var M = require(path.join(root, 'src', 'engine.js'));
var IO = require(path.join(root, 'src', 'io.js'));

var failed = 0, passed = 0, t0 = Date.now();
function ok(cond, msg) {
  console.log((cond ? 'PASS ' : 'FAIL ') + msg);
  if (cond) passed++; else { failed++; process.exitCode = 1; }
}

ok(typeof M.HECoreFactory === 'function' && typeof M.HE_PARAMS !== 'undefined', 'engine.js loads in Node and exports HECoreFactory');
ok(IO && IO.VERSION && typeof IO.renderSync === 'function' && typeof IO.toPreset === 'function', 'io.js loads in Node with preset, performance and render APIs');
ok(IO.CREDIT === 'https://x.com/_mintydoge' && IO.AUTHOR === 'Garyck Arntzen', 'credit is Garyck Arntzen (https://x.com/_mintydoge)');

var P = {};
M.HE_PARAMS.forEach(function (p) { P[p.id] = p.def; });
P['macro.dread'] = 0.4;
P['macro.distance'] = 0.6;
P['macro.material'] = 0.5;
P['glass.judder'] = 0.8;
P['master.vol'] = 6;           // push the look-ahead limiter
P['ebow.hold'] = 1;

var pre = IO.toPreset(P, 'round trip');
ok(pre.format === 'horror-engine.preset' && pre.author === 'Garyck Arntzen', 'toPreset writes a named preset with the author');
ok(IO.check(pre).length === 0, 'preset validates: ' + JSON.stringify(IO.check(pre).slice(0, 3)));
var preFile = JSON.parse(JSON.stringify(pre));
ok(IO.check(preFile).length === 0, 'preset still validates after a JSON file round-trip');
var back = IO.fromPreset(preFile);
var keysOk = M.HE_PARAMS.every(function (p) { return back[p.id] === P[p.id]; });
ok(keysOk, 'fromPreset restores every registry key (dread ' + back['macro.dread'] + ', glass.judder ' + back['glass.judder'] + ', vol ' + back['master.vol'] + ')');

var badFmt = JSON.parse(JSON.stringify(preFile)); badFmt.format = 'nope';
ok(IO.check(badFmt).length > 0, 'preset with a bad format is rejected');
var badReq = JSON.parse(JSON.stringify(preFile)); delete badReq.macros;
ok(IO.check(badReq).length > 0, 'preset missing macros is rejected');

// A short live take, recorded the same way the app writes a .horror.json
var core = M.HECoreFactory(), BL = core.BL, SR = 48000;
ok(BL > 0 && typeof core.Host === 'function', 'HECoreFactory returns a Host and a block length (' + BL + ')');

var log = [], sched = [];
function at(sec, m) { sched.push({ f: Math.round(sec * SR), m: m }); }
at(0, { t: 'init', params: P, seed: 1337 });
// e-bow already on hold; add a bowed scrape, a struck hit, a glass nail, a stinger, then panic
at(0.05, { t: 'g', s: 2, k: 'd', x: 0.2, y: 0.4, p: 0.7, hz: 0 });
for (var i = 1; i <= 40; i++) at(0.05 + i * 0.03, { t: 'g', s: 2, k: 'm', x: 0.2 + i * 0.015, y: 0.4, p: 0.7, hz: 0 });
at(1.3, { t: 'g', s: 2, k: 'u' });
at(0.4, { t: 'g', s: 4, k: 'd', x: 0.5, y: 0.5, p: 1, hz: 0 });
at(0.48, { t: 'g', s: 4, k: 'u' });
at(0.7, { t: 'p', k: 'macro.dread', v: 0.85 });
at(1.0, { t: 'moment', id: 'stinger', on: true });
at(1.5, { t: 'g', s: 3, k: 'd', x: 0.15, y: 0.5, p: 0.9, hz: 0 });
for (i = 1; i <= 20; i++) at(1.5 + i * 0.03, { t: 'g', s: 3, k: 'm', x: 0.15 + i * 0.03, y: 0.5, p: 0.9, hz: 0 });
at(2.15, { t: 'g', s: 3, k: 'u' });
at(2.3, { t: 'panic' });
sched.sort(function (a, b) { return a.f - b.f; });

var host = new core.Host(SR, function () {});
var L = new Float32Array(BL), R = new Float32Array(BL);
var si = 0, endFrame = Math.round(2.6 * SR), livePeak = 0, liveBad = 0, liveN = 0;
while (host.e.frame < endFrame) {
  var f = host.e.frame;
  while (si < sched.length && sched[si].f <= f) {
    var m = sched[si++].m;
    log.push({ fn: f, m: JSON.parse(JSON.stringify(m)) });
    host.msg(m);
  }
  host.block(L, R, 0);
  for (var j = 0; j < BL; j++) {
    var a = L[j], b = R[j];
    if (a !== a || b !== b || a === Infinity || b === Infinity || a === -Infinity || b === -Infinity) liveBad++;
    var pa = a < 0 ? -a : a, pb = b < 0 ? -b : b;
    if (pa > livePeak) livePeak = pa;
    if (pb > livePeak) livePeak = pb;
    liveN++;
  }
}
ok(liveBad === 0, 'live render is finite (' + liveN + ' samples, peak ' + livePeak.toFixed(4) + ')');
ok(livePeak > 1e-4, 'live take is audible (peak ' + livePeak.toFixed(4) + ')');

var perf = IO.toPerformance({ log: log, sr: SR, title: 'dsp test', endFrame: endFrame });
var errs = IO.check(perf);
ok(errs.length === 0, 'performance file validates' + (errs.length ? ': ' + JSON.stringify(errs.slice(0, 3)) : ''));
var loaded = JSON.parse(JSON.stringify(perf));
ok(IO.check(loaded).length === 0, 'performance still validates after a JSON file load');
ok(loaded.format === 'horror-engine.performance' && loaded.liveEvents.length > 0 && loaded.preset.format === 'horror-engine.preset',
  'loaded file has live events and an inline start-state preset (' + loaded.liveEvents.length + ' events)');

var badPerf = JSON.parse(JSON.stringify(loaded)); delete badPerf.lanes;
ok(IO.check(badPerf).length > 0, 'performance missing lanes is rejected');
var junk = { format: 'horror-engine.performance' };
ok(IO.check(junk).length > 0, 'empty performance object is rejected');

function stats(res) {
  var bad = 0, peak = 0, n = res.frames, A = res.mix[0], B = res.mix[1];
  for (var i = 0; i < n; i++) {
    var x = A[i], y = B[i];
    if (x !== x || y !== y || x === Infinity || y === Infinity || x === -Infinity || y === -Infinity) bad++;
    var px = x < 0 ? -x : x, py = y < 0 ? -y : y;
    if (px > peak) peak = px;
    if (py > peak) peak = py;
  }
  return { bad: bad, peak: peak, frames: n, sr: res.sr };
}

var off1 = IO.renderSync(loaded, {});
var off2 = IO.renderSync(JSON.parse(JSON.stringify(loaded)), {});
var s1 = stats(off1), s2 = stats(off2);
ok(s1.frames > 0 && s1.sr === SR && isFinite(s1.frames), 'offline render is finite in length (' + s1.frames + ' frames at ' + s1.sr + ' Hz)');
ok(s1.bad === 0 && s2.bad === 0, 'offline mix has no NaN or Inf (2 renders)');
ok(s1.peak > 1e-4, 'offline render is audible (peak ' + s1.peak.toFixed(4) + ')');
// Look-ahead limiter ceiling is 0.891 (-1 dBTP). Allow a tiny amount of overshoot, but never a full-scale clip.
ok(s1.peak <= 1 && s2.peak <= 1, 'offline mix never clips past full scale (peak ' + s1.peak.toFixed(4) + ')');
ok(s1.peak <= 0.91, 'offline mix stays at or under the limiter ceiling of 0.891, within a small margin (peak ' + s1.peak.toFixed(4) + ')');

var n = Math.min(off1.frames, off2.frames), md = 0;
for (var k = 0; k < n; k++) {
  var d0 = Math.abs(off1.mix[0][k] - off2.mix[0][k]);
  var d1 = Math.abs(off1.mix[1][k] - off2.mix[1][k]);
  if (d0 > md) md = d0;
  if (d1 > md) md = d1;
}
ok(off1.frames === off2.frames && md === 0, 'two offline renders of the same file are bit-identical (max diff ' + md + ', ' + n + ' frames)');

// Same seed, same file: a third render still matches. A different seed must not be required for this check.
var off3 = IO.renderSync(JSON.parse(JSON.stringify(loaded)), {});
var md3 = 0;
for (k = 0; k < n; k++) {
  d0 = Math.abs(off1.mix[0][k] - off3.mix[0][k]);
  d1 = Math.abs(off1.mix[1][k] - off3.mix[1][k]);
  if (d0 > md3) md3 = d0;
  if (d1 > md3) md3 = d1;
}
ok(md3 === 0, 'a third render is also bit-identical (max diff ' + md3 + ')');

var ms = Date.now() - t0;
console.log((failed ? failed + ' failed, ' : '') + passed + ' passed in ' + (ms / 1000).toFixed(2) + ' s');
if (failed) process.exitCode = 1;
