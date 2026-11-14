// Headless checks for v1.4: schema version and old files, share links, "Save what I just played" (exact window and
// checkpoint), audio input (off = untouched, bit for bit), the Bowed Cymbal. No browser. Run: node test/v14.js
var IO = require('../src/io.js'), M = require('../src/engine.js');
function ok(c, msg) { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) process.exitCode = 1; }
var core = M.HECoreFactory(), BL = core.BL, SR = 48000;
function defs() { var P = {}; M.HE_PARAMS.forEach(function (p) { P[p.id] = p.def; }); return P; }
function same(a, b) { if (a.length !== b.length) return false; for (var i = 0; i < a.length; i++) if (a[i] !== b[i] && !(a[i] !== a[i] && b[i] !== b[i])) return false; return true; }

/* ---------- schema ---------- */
ok(IO.VERSION === '1.4.0', 'schema version 1.4.0');
var P0 = defs();
var perf = IO.toPerformance({ log: [{ fn: 0, m: { t: 'init', params: P0, seed: 1337 } }, { fn: 4800, m: { t: 'input', on: true } }, { fn: 9600, m: { t: 'input', on: false } }], sr: SR, title: 't', endFrame: 19200 });
ok(perf.meta.usedInput === true && perf.liveEvents.some(function (e) { return e.value === 'input.on'; }), 'input on/off logged as triggers, meta.usedInput set');
ok(IO.check(perf).length === 0, 'a 1.4 performance with usedInput validates: ' + IO.check(perf).slice(0, 2).join('; '));
['1.1.0', '1.2.0', '1.3.0'].forEach(function (v) { var o = JSON.parse(JSON.stringify(perf)); o.version = v; o.engine.version = v; delete o.meta.usedInput; ok(IO.check(o).length === 0, 'a ' + v + ' file still validates'); });
var bad = JSON.parse(JSON.stringify(perf)); bad.meta.retro = { startFrame: -1 };
ok(IO.check(bad).length > 0, 'a broken meta.retro is caught by the validator');
var pre = IO.toPreset(P0, 'x', []); ok(IO.check(pre).length === 0 && pre.version === '1.4.0', 'preset 1.4.0 validates');
ok(IO.STEM_NAMES.length === 14 && IO.STEM_NAMES[13] === 'input', 'stem 14 is "input"');

/* ---------- bowed cymbal ---------- */
var bo = M.HE_PARAMS.filter(function (p) { return p.id === 'bowed.object'; })[0];
ok(bo.max === 4 && bo.en[4] === 'Cymbal', 'Bowed Metal has a Cymbal object');
(function () {
  var h = new core.Host(SR, function () { }), P = defs(); P['bowed.object'] = 4; P['bowed.size'] = 520; h.msg({ t: 'init', params: P, seed: 1337 });
  var L = new Float32Array(BL), R = new Float32Array(BL), pk = 0, bad = false;
  h.msg({ t: 'g', s: 2, k: 'd', x: .4, y: .5, p: .7, hz: 0 });
  for (var b = 0; b < 1500; b++) { if (b % 8 === 0) h.msg({ t: 'g', s: 2, k: 'm', x: .4 + .2 * Math.sin(b / 40), y: .5, p: .7, hz: 0 }); h.block(L, R, 0); for (var i = 0; i < BL; i++) { if (!isFinite(L[i])) bad = true; pk = Math.max(pk, Math.abs(L[i])); } }
  ok(!bad && pk > 1e-3 && pk < 1.5, 'the bowed cymbal sings (peak ' + pk.toFixed(3) + ') and stays finite');
})();

/* ---------- share links ---------- */
(function () {
  var r = IO.decodeShare(IO.encodeShare(defs()));
  ok(r && M.HE_PARAMS.every(function (p) { return /^input\./.test(p.id) || r.params[p.id] === p.def; }), 'all defaults round-trip');
  ok(IO.encodeShare(defs()).length < 20, 'an all-defaults link is tiny: ' + IO.encodeShare(defs()).length + ' chars');
  var seed = 7, rnd = function () { seed = (seed * 1103515245 + 12345) >>> 0; return seed / 4294967296; }, worst = 0, n = 0, P = defs();
  M.HE_PARAMS.forEach(function (p) { if (rnd() < .5) { var v = p.min + (p.max - p.min) * rnd(); P[p.id] = p.int || p.en || p.sw ? Math.round(v) : v; } });
  var code = IO.encodeShare(P, { n: 'Glass Asylum', sel: 3 }), d = IO.decodeShare(code);
  M.HE_PARAMS.forEach(function (p) {
    if (/^input\./.test(p.id)) return; var a = P[p.id], b = d.params[p.id];
    if (p.int || p.en || p.sw) { if (a !== b) worst = 1; } else worst = Math.max(worst, Math.abs(a - b) / Math.max(1e-9, Math.abs(a))); n++;
  });
  ok(worst < 1e-5, 'random settings round-trip (' + n + ' params, worst relative error ' + worst.toExponential(1) + ')');
  ok(d.n === 'Glass Asylum' && d.sel === 3, 'preset name and selected voice ride along');
  ok(/^[A-Za-z0-9_-]+$/.test(code), 'the code is URL-safe base64 (' + code.length + ' chars for ' + Object.keys(JSON.parse(Buffer.from(code.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()).p).length + ' changed settings)');
  var Q = defs(); Q['input.level'] = 3; ok(IO.encodeShare(Q) === IO.encodeShare(defs()), 'your sound-in settings are not shared');
  var evil = Buffer.from(JSON.stringify({ v: 1, p: { 'rev.decay': 1e9, 'bowed.object': 99, 'nope': 1, 'macro.dread': 'x' } })).toString('base64').replace(/=+$/, '');
  var e = IO.decodeShare(evil), dd = M.HE_PARAMS.filter(function (p) { return p.id === 'rev.decay'; })[0];
  ok(e && e.params['rev.decay'] === dd.max && e.params['bowed.object'] === 4 && !('nope' in e.params) && e.params['macro.dread'] === P0['macro.dread'], 'out-of-range values are clamped, unknown ids and junk ignored');
  ok(IO.decodeShare('%%%') === null && IO.decodeShare('eyJ2IjoyfQ') === null, 'damaged or unknown-version links give null');
})();

/* ---------- a live session, as the page runs it: messages with sequence numbers, acks into a log ---------- */
function session(opt) {
  var log = [], pend = {}, q = 0, rt = [], snaps = {}, cps = [];
  var h = new core.Host(SR, function (m) {
    if (m.ap) for (var i = 0; i + 1 < m.ap.length; i += 2) { var x = pend[m.ap[i]]; if (!x) continue; delete pend[m.ap[i]]; if (x.t === 'retro') continue; if (x.t === 'lsnap') { cps.push({ fn: m.ap[i + 1], idx: log.length, q: m.ap[i] }); continue; } log.push({ fn: m.ap[i + 1], m: x }); }
    if (m.t === 'retro') rt.push(m); if (m.t === 'lsnap') snaps[m.q] = m.snap;
  }, { retro: 62 });
  var send = function (m) { m.q = ++q; pend[m.q] = JSON.parse(JSON.stringify(m)); delete pend[m.q].q; h.msg(m); };
  var L = new Float32Array(BL), R = new Float32Array(BL), mixL = [], mixR = [];
  return { h: h, send: send, log: log, rt: rt, cps: cps, snaps: snaps, run: function (blocks, fn) { for (var b = 0; b < blocks; b++) { if (fn) fn(b); h.block(L, R, 0, opt && opt.IL, opt && opt.IR); mixL.push(Float32Array.from(L)); } },
    drain: function () { for (var i = 0; i < 40; i++) h.block(L, R, 0); } };
}
function play(S, sec, base) {
  var P = defs(); for (var k in base) P[k] = base[k]; S.send({ t: 'init', params: P, seed: 1337 });
  var nb = Math.round(sec * SR / BL);
  S.run(nb, function (b) {
    var t = b * BL / SR;
    if (b % 300 === 10) S.send({ t: 'g', s: (b / 300 | 0) % 4, k: 'd', x: .3, y: .5, p: .7, hz: 0 });
    else if (b % 300 > 10 && b % 300 < 200 && b % 6 === 0) S.send({ t: 'g', s: (b / 300 | 0) % 4, k: 'm', x: .5 + .4 * Math.sin(t * 3), y: .5 + .2 * Math.cos(t * 2), p: .7, hz: 0 });
    else if (b % 300 === 200) S.send({ t: 'g', s: (b / 300 | 0) % 4, k: 'u' });
    if (b % 500 === 250) S.send({ t: 'p', k: 'macro.dread', v: .2 + .5 * Math.abs(Math.sin(t)) });
    if (b === 700) S.send({ t: 'moment', id: 'drone', on: true });
    if (b === 1200) S.send({ t: 'loop', a: 'rec' }); if (b === 1800) S.send({ t: 'loop', a: 'stop' });
    if (b % 1400 === 1000) S.send({ t: 'lsnap' });
  });
}
function grab(S, sec) {
  S.rt.length = 0; S.send({ t: 'retro', sec: sec }); S.drain();
  var J = S.rt, n = J.reduce(function (a, m) { return a + m.n; }, 0), L = new Float32Array(n), R = new Float32Array(n), o = 0;
  J.forEach(function (m) { for (var i = 0; i < m.n; i++) { L[o + i] = m.d[i * 2]; R[o + i] = m.d[i * 2 + 1]; } o += m.n; });
  return { n: n, start: J[0].start, end: J[0].end, L: L, R: R, last: J[J.length - 1].last };
}
function render(p, stems) { var j = IO.renderJob(p, { stems: !!stems }); while (!j.step(4096)); return j.result; }
(function () {
  var S = session(); play(S, 30, { 'hurdy.hold': 1 });
  var g = grab(S, 10);
  ok(g.last && g.n === Math.floor(10 * SR / BL) * BL && g.end - g.start === g.n, 'Shift+R grabs whole blocks: ' + g.n + ' frames ending at frame ' + g.end);
  var p = IO.windowPerf(S.log, g.start, g.end, SR, 'retro', { exact: true });
  ok(IO.check(p).length === 0 && p.meta.retro.exact === true && p.meta.retro.startFrame === g.start, 'the window performance validates and says exact ' + IO.check(p).slice(0, 2).join('; '));
  var r = render(p, true);
  ok(r.frames === g.n && same(r.mix[0], g.L) && same(r.mix[1], g.R), 'exact: the re-render of the window is the saved mix, bit for bit');
  var sum = 0, worst = 0; for (var i = 0; i < r.frames; i += 7) { sum = 0; r.stems.forEach(function (s) { if (s) sum += s[0][i]; }); worst = Math.max(worst, Math.abs(sum - r.mix[0][i])); }
  ok(r.stems && r.stems.length === 14 && worst < .5, 'its stems are there (14 slots; pre-limiter sum within the limiter\'s reach)');
  // checkpoint: rebuild state 20 s in and replay from there
  var cp = S.cps.filter(function (c) { return c.fn <= g.start - 2 * SR; }).pop();
  ok(!!cp && !!S.snaps[cp.q], 'a log checkpoint with a looper snapshot exists');
  var st = IO.foldState(S.log, cp.idx), head = IO.checkpoint(st, cp.fn, S.snaps[cp.q]), log2 = head.concat(S.log.slice(cp.idx));
  ok(st.moms.drone === 1 && head[0].m.t === 'init' && head.some(function (x) { return x.m.t === 'loop' && x.m.a === 'load'; }), 'the fold keeps the drone, the knobs and the looper layer');
  var p2 = IO.windowPerf(log2, g.start, g.end, SR, 'retro-cp', {});
  ok(IO.check(p2).length === 0 && p2.meta.retro.exact === false && p2.meta.retro.offsetFrames === cp.fn, 'the checkpoint performance validates and says not exact ' + IO.check(p2).slice(0, 2).join('; '));
  var r2 = render(p2, false), e2 = 0, e0 = 0; for (var i = 0; i < r2.frames; i++) { e2 += (r2.mix[0][i] - g.L[i]) * (r2.mix[0][i] - g.L[i]); e0 += g.L[i] * g.L[i]; }
  ok(r2.frames === g.n && e0 > 0, 'the checkpoint re-render covers the same window (' + r2.frames + ' frames)');
  console.log('     checkpoint re-render vs the saved mix: ' + (10 * Math.log10(e2 / e0)).toFixed(1) + ' dB difference energy (performed again, not sample-identical)');
  ok(log2.length < S.log.length, 'the folded log is shorter (' + log2.length + ' vs ' + S.log.length + ' entries)');
})();

/* ---------- audio input ---------- */
(function () {
  var noise = new Float32Array(BL * 8); var s = 3; for (var i = 0; i < noise.length; i++) { s = (s * 1664525 + 1013904223) >>> 0; noise[i] = (s / 4294967296 - .5) * .5; }
  var IL = noise, IR = noise;
  // the same session with and without input buffers fed while the input is off: identical
  var A = session(), B = session({ IL: IL, IR: IR }); play(A, 6, {}); play(B, 6, {});
  var ga = grab(A, 5), gb = grab(B, 5);
  ok(same(ga.L, gb.L) && same(ga.R, gb.R), 'input off: audio arriving at the input changes nothing, bit for bit');
  ok(!A.h.e.inAct, 'input off: the input stem is skipped entirely');
  // on, then off: it sounds, then the stem drains and is switched off again
  var C = session({ IL: IL, IR: IR }); var P = defs(); P['input.rev'] = .6; C.send({ t: 'init', params: P, seed: 1337 }); C.send({ t: 'rec', on: true, stems: true });
  var chunks = []; var old = C.h.post; C.h.post = function (m, t) { if (m.t === 'chunk') chunks.push(m); old(m, t); };
  C.run(50); C.send({ t: 'input', on: true }); C.run(400); var act = C.h.e.inAct;
  C.send({ t: 'input', on: false }); C.run(Math.ceil(SR / BL) * 2 + 200); C.send({ t: 'rec', on: false }); C.run(2);
  var res = IO.collect(chunks, SR);
  ok(act && res.stems && res.stems[13] && res.stems[13][0].reduce(function (a, x) { return Math.max(a, Math.abs(x)); }, 0) > 1e-3, 'input on: the input stem carries your sound');
  ok(!C.h.e.inAct && C.h.e.inE === 0, 'input off: after its tail the stem is skipped again');
  var mx = 0, a = res.mix[0]; for (var i = a.length - 4800; i < a.length; i++) mx = Math.max(mx, Math.abs(a[i]));
  ok(isFinite(mx), 'mix stays finite');
  // an engine that never had input equals the 1.3 render path: render the same performance twice, input messages stripped
  var p = IO.toPerformance({ log: A.log.slice(), sr: SR, title: 'a' }), r1 = render(p, true);
  var lg = A.log.slice(); lg.splice(5, 0, { fn: lg[5].fn, m: { t: 'input', on: true } }); var pIn = IO.toPerformance({ log: lg, sr: SR, title: 'b' }), r2 = render(pIn, true);
  ok(same(r1.mix[0], r2.mix[0]) && r2.stems[13] === null, 'Render ignores input triggers (the input audio is not in the file): bit-identical, no input stem');
})();
