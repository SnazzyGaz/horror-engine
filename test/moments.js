// Headless DSP/IO regression checks. No browser or GPU required. Run: node test/moments.js
var IO = require('../src/io.js'), M = require('../src/engine.js');
var core = M.HECoreFactory(), BL = core.BL, SR = 48000, posted = [];
var host = new core.Host(SR, function (m) { if (m.t !== 'tm' && m.t !== 'chunk' && m.t !== 'ap') posted.push(m); });
var P = {}; M.HE_PARAMS.forEach(function (p) { P[p.id] = p.def; });
var log = [], out = [], L = new Float32Array(BL), R = new Float32Array(BL), sched = [];
function at(sec, m) { sched.push({ f: Math.round(sec * SR), m: m }); }
function ok(c, msg) { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) process.exitCode = 1; }
at(0, { t: 'init', params: P, seed: 1337 });
// capture: armed at 0.5 s, first touch at 1.0 s (0.5 s of silence to trim)
at(0.5, { t: 'cmrec', on: true });
at(0.7, { t: 'g', s: 2, k: 'm', x: .3, y: .3, p: .5, hz: 0 });   // orphan move: no down since arming
at(1.0, { t: 'g', s: 2, k: 'd', x: .2, y: .4, p: .6, hz: 0 });
for (var i = 1; i <= 60; i++) at(1.0 + i * .02, { t: 'g', s: 2, k: 'm', x: .2 + i * .01, y: .4 + .2 * Math.sin(i / 6), p: .6 + .3 * Math.sin(i / 9), hz: 0 });
at(2.25, { t: 'g', s: 2, k: 'u' });
for (i = 0; i <= 20; i++) at(1.2 + i * .05, { t: 'p', k: 'macro.dread', v: .2 + i * .02 });     // Dread 0.2 -> 0.6
at(2.4, { t: 'p', k: 'struck.object', v: 2 });
at(2.5, { t: 'g', s: 4, k: 'd', x: .5, y: .5, p: .9, hz: 0 }); at(2.6, { t: 'g', s: 4, k: 'u' });
at(2.7, { t: 'p', k: 'struck.object', v: 0 });
at(2.9, { t: 'g', s: 3, k: 'd', x: .5, y: .5, p: .5, hz: 0 });                                  // still held at stop
at(3.0, { t: 'cmrec', on: false });
at(3.1, { t: 'p', k: 'macro.dread', v: .2 });
var f = 0, si = 0;
function runTo(sec, each) { var end = Math.round(sec * SR); while (f < end) { while (si < sched.length && sched[si].f <= f) { var m = sched[si++].m; log.push({ fn: f, m: JSON.parse(JSON.stringify(m)) }); host.msg(m); } host.block(L, R, 0); out.push(Float32Array.from(L)); if (each) each(); f += BL; } }
sched.sort(function (a, b) { return a.f - b.f; });
runTo(3.2);
var cap = posted.filter(function (m) { return m.t === 'cmrec'; })[0];
ok(!!cap, 'host posted the capture');
var def = IO.momentFromCapture(cap, 'mTest', 'Moment 6');
ok(def && def.ev.length > 0, 'moment built: ' + def.ev.length + ' events, ' + def.lanes.length + ' lanes, len ' + def.len + ' s');
ok(def.ev[0][0] === 0 && def.ev[0][2] === 'd', 'leading silence trimmed (first event at 0 is a down)');
ok(!def.ev.some(function (e) { return e[3] === .3 && e[2] === 'm' && e[1] === 2 && e[0] === 0; }), 'orphan move before the first down dropped');
ok(Math.abs(def.len - 2.0) < .01, 'length runs from the first touch to stop (2.0 s): ' + def.len);
var dl = def.lanes.filter(function (l) { return l.k === 'macro.dread'; })[0], ol = def.lanes.filter(function (l) { return l.k === 'struck.object'; })[0];
ok(dl && !dl.abs && Math.abs(dl.pts[dl.pts.length - 1][1] - .4) < 1e-3, 'Dread lane is relative, +0.40 at the end');
ok(ol && ol.abs && ol.pts.length === 2, 'struck.object lane is absolute (2 then 0)');
ok(def.ev.filter(function (e) { return e[1] === 3 && e[2] === 'u'; }).length === 1, 'stroke held at stop gets closed');
var file = IO.toMomentFile([def]);
ok(IO.check(file).length === 0, 'moment file validates ' + JSON.stringify(IO.check(file)));
var back = IO.fromMomentFile(JSON.parse(JSON.stringify(file)))[0];
ok(JSON.stringify(back) === JSON.stringify(def), 'export/import round trip is identical');
var bad = JSON.parse(JSON.stringify(file)); bad.moment.ev[0][1] = 12; ok(IO.check(bad).length > 0, 'bad moment file rejected');
var pre = IO.toPreset(P, 'with moments', [def]); pre = JSON.parse(JSON.stringify(pre));
ok(IO.check(pre).length === 0 && JSON.stringify(pre.customMoments[0]) === JSON.stringify(def), 'preset save/load carries the moment');
var pre0 = JSON.parse(JSON.stringify(IO.toPreset(P, 'none'))); ok(!('customMoments' in pre0) && IO.check(pre0).length === 0, 'preset without moments unchanged and valid');
// define and fire it twice, with a live Dread move in the middle of the second firing
at(3.3, { t: 'cmdef', id: 'mTest', def: def });
at(3.5, { t: 'p', k: 'macro.dread', v: .3 });
at(4.0, { t: 'moment', id: 'c:mTest', on: true });
at(7.0, { t: 'moment', id: 'c:mTest', on: true });
at(7.8, { t: 'p', k: 'macro.dread', v: .25 });
at(10.5, { t: 'moment', id: 'c:mTest', on: true });
at(11.0, { t: 'moment', id: 'c:mTest', on: false });   // stop while playing
sched.sort(function (a, b) { return a.f - b.f; }); si = sched.findIndex(function (x) { return x.f > Math.round(3.2 * SR) - 1; });
var maxD = 0, objSeen = 0, P_ = host.e.P;
runTo(13, function () { var t = f / SR; if (t > 4 && t < 6.5) { maxD = Math.max(maxD, P_['macro.dread']); if (P_['struck.object'] === 2) objSeen = 1; } });
ok(maxD > .69 && maxD < .71, 'Dread rides on the live knob: 0.3 + ~0.4 (x0.9-1.1) = ' + maxD.toFixed(3));
ok(objSeen === 1, 'switch lane applied absolutely during the moment');
ok(P_['macro.dread'] === .25 && P_['struck.object'] === 0, 'after it ends the knobs are where the live hand left them (0.25)');
ok(Object.keys(host.e.cmBase).length === 0 && host.e.cms.length === 0, 'nothing left holding knobs; stop-while-playing worked');
function rms(a, b) { var s = 0, n = 0; for (var k = Math.round(a * SR / BL); k < Math.round(b * SR / BL); k++) for (var j = 0; j < BL; j++) { s += out[k][j] * out[k][j]; n++; } return Math.sqrt(s / n); }
var r1 = rms(4, 6), r2 = rms(7, 9), r0 = rms(3.3, 3.9);
ok(r1 > 1e-3 && r2 > 1e-3, 'moment is audible: rms ' + r1.toExponential(2) + ', ' + r2.toExponential(2) + ' (before ' + r0.toExponential(2) + ')');
var diff = 0; for (var k = 0; k < Math.round(2 * SR / BL); k++) for (var j = 0; j < BL; j++) diff += Math.abs(out[Math.round(4 * SR / BL) + k][j] - out[Math.round(7 * SR / BL) + k][j]);
ok(diff > 1, 'two firings differ (humanised): sum|d| = ' + diff.toFixed(2));
// performance file: the take's log, with the library, JSON round trip, then offline Render must match the live output
var perf = JSON.parse(JSON.stringify(IO.toPerformance({ log: log, sr: SR, title: 'moment test', customMoments: [def], endFrame: f })));
ok(IO.check(perf).length === 0, 'performance with customMoments validates ' + JSON.stringify(IO.check(perf).slice(0, 3)));
ok(perf.liveEvents.some(function (e) { return e.value === 'moment.define'; }) && perf.liveEvents.some(function (e) { return e.value === 'moment.c:mTest'; }), 'define + trigger events in liveEvents');
var res = IO.renderSync(perf, {}), md = 0, N = Math.min(res.frames, out.length * BL);
for (var n = 0; n < N; n++) { var d = Math.abs(res.mix[0][n] - out[(n / BL) | 0][n % BL]); if (d > md) md = d; }
ok(md === 0, 'offline Render of the take matches live sample for sample (max diff ' + md + ', ' + N + ' frames)');
// a performance carrying only the top-level library (no define events) still renders the triggers
var p2 = JSON.parse(JSON.stringify(perf)); p2.liveEvents = p2.liveEvents.filter(function (e) { return e.value !== 'moment.define'; });
var res2 = IO.renderSync(p2, {}), md2 = 0; for (n = 0; n < N; n++) { d = Math.abs(res2.mix[0][n] - res.mix[0][n]); if (d > md2) md2 = d; }
ok(md2 === 0, 'top-level customMoments alone render the same (max diff ' + md2 + ')');
// old files stay valid
var old = JSON.parse(JSON.stringify(perf)); delete old.customMoments; old.liveEvents = old.liveEvents.filter(function (e) { return String(e.value).indexOf('moment.') !== 0; }); old.version = '1.1.0';
ok(IO.check(old).length === 0, 'a v1.1.0 performance without moments still validates');
