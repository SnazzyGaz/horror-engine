// C++ port vs the seance-ui JavaScript engine: render the same message logs through both and compare.
// node test/parity.js <seance/src> <he_render>
'use strict';
var path = require('path'), fs = require('fs'), cp = require('child_process'), os = require('os');
var src = process.argv[2], bin = process.argv[3];
var M = require(path.join(src, 'engine.js')), core = M.HECoreFactory(), SR = 48000, BL = 128;
var ui = fs.readFileSync(path.join(src, 'ui.js'), 'utf8'), PRESETS = eval('(' + /var PRESETS = (\{[\s\S]*?\n  \});/.exec(ui)[1] + ')');
var IDX = {}; M.HE_PARAMS.forEach(function (p, i) { IDX[p.id] = i; });
var MOM = { riser: 0, stinger: 1, drone: 2, heart: 3, walls: 4 };
var tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hep-')), failed = 0, passed = 0;
function ok(c, m) { console.log((c ? 'PASS ' : 'FAIL ') + m); if (c) passed++; else { failed++; process.exitCode = 1; } }
function F(t) { return Math.round(t * SR); }
// a little performance on every voice
function tour(ev, t0, voices) {
  voices.forEach(function (s, n) {
    var t = t0 + n * 0.9, f = F(t), p = .4 + .07 * n;
    ev.push([f, { t: 'g', s: s, k: 'd', x: .3 + .05 * n, y: .4, p: p, hz: s === 4 && n % 2 ? 220 : 0 }]);
    for (var j = 1; j < 120; j++) ev.push([f + j * 300, { t: 'g', s: s, k: 'm', x: .3 + .05 * n + .3 * Math.sin(j * .07), y: .4 + .3 * Math.sin(j * .05 + n), p: Math.min(1, p + .3 * Math.sin(j * .03)), hz: 0 }]);
    ev.push([f + 120 * 300, { t: 'g', s: s, k: 'u' }]);
  });
}
function base(preset) { var P = {}; M.HE_PARAMS.forEach(function (p) { P[p.id] = p.def; }); var o = PRESETS[preset] || {}; for (var k in o) P[k] = o[k]; return P; }
var cases = [];
Object.keys(PRESETS).forEach(function (n) {
  var ev = []; tour(ev, .1, [0, 1, 2, 3, 4, 5, 6, 8]);
  ev.push([F(1), { t: 'moment', id: 'drone', on: true }]); ev.push([F(2.5), { t: 'moment', id: 'stinger', on: true }]);
  ev.push([F(3), { t: 'moment', id: 'heart', on: true }]); ev.push([F(4), { t: 'moment', id: 'walls', on: true }]); ev.push([F(5), { t: 'moment', id: 'riser', on: true }]);
  cases.push({ name: n, P: base(n), ev: ev, end: F(9) });
});
(function () { // Tune & place offsets on top of the macros
  var P = base('Cold Cellar'), ev = [];
  ['ebow', 'hurdy', 'bowed', 'glass', 'struck', 'moan'].forEach(function (k, i) { P[k + '.tune'] = [-7, 5, 12, -12, 3, -5][i]; P[k + '.cents'] = [20, -35, 0, 50, -10, 7][i]; P[k + '.matOff'] = [.3, -.4, .5, -.2, .6, -.5][i]; P[k + '.distOff'] = [.4, -.1, .2, .7, -.15, .3][i]; });
  P['macro.distance'] = .3; P['macro.pitch'] = 2;
  tour(ev, .1, [0, 1, 2, 3, 4, 8, 7]);
  ev.push([F(2), { t: 'p', k: 'ebow.tune', v: 4 }]); ev.push([F(3), { t: 'p', k: 'macro.material', v: .8 }]); ev.push([F(4), { t: 'p', k: 'bowed.distOff', v: -.3 }]);
  ev.push([F(5), { t: 'moment', id: 'stinger', on: true }]);
  cases.push({ name: 'offsets', P: P, ev: ev, end: F(8) });
})();
(function () { // custom moments: gestures on two voices, a relative knob lane, an absolute choice, an exponential knob
  var P = base('Clock Tower'), ev = [], def = { voice: -1, len: 3, ev: [], lanes: [] };
  for (var j = 0; j < 60; j++) def.ev.push([.1 + j * .03, j < 30 ? 0 : 2, j === 0 || j === 30 ? 'd' : j === 29 || j === 59 ? 'u' : 'm', .2 + j * .01, .5 + .3 * Math.sin(j * .2), .6, 0]);
  def.lanes.push({ k: 'macro.dread', min: 0, max: 1, pts: [[0, 0], [.5, .2], [1.5, .5], [2.5, .1]] });
  def.lanes.push({ k: 'bowed.object', min: 0, max: 4, int: 1, abs: 1, pts: [[0, 3], [1.2, 1]] });
  def.lanes.push({ k: 'rev.decay', min: .5, max: 30, exp: 1, pts: [[0, 0], [1, .3]] });
  var def2 = { voice: 8, len: 2, ev: [[.05, 0, 'd', .5, .5, .7, 0], [.6, 0, 'm', .8, .2, .9, 0], [1.4, 0, 'u', 0, 0, 0, 0]], lanes: [{ k: 'macro.pitch', min: -24, max: 24, pts: [[0, 0], [1, .2]] }] };
  ev.push([0, { t: 'cmdef', id: 'a', def: def }]); ev.push([0, { t: 'cmdef', id: 'b', def: def2 }]);
  ev.push([F(.5), { t: 'moment', id: 'c:a', on: true }]); ev.push([F(1.2), { t: 'p', k: 'macro.dread', v: .4 }]);
  ev.push([F(1.6), { t: 'moment', id: 'c:b', on: true }]); ev.push([F(4), { t: 'moment', id: 'c:a', on: true }]); ev.push([F(4.8), { t: 'moment', id: 'c:a', on: false }]);
  ev.push([F(5.2), { t: 'cmdef', id: 'b', def: null }]); ev.push([F(5.5), { t: 'moment', id: 'c:b', on: true }]);
  ev.push([F(6), { t: 'moment', id: 'c:a', on: true }]); ev.push([F(6.5), { t: 'panic' }]);
  ev.push([F(7), { t: 'cmrec', on: true }]); tour(ev, 7.1, [1]); ev.push([F(7.4), { t: 'p', k: 'hurdy.crank', v: .9 }]); ev.push([F(7.9), { t: 'cmrec', on: false }]);
  cases.push({ name: 'custom moments', P: P, ev: ev, end: F(9) });
})();
(function () { // the looper: two layers, free length, ghost, mute, undo, redo, delete
  var P = base('Rust Works'), ev = [];
  ev.push([F(.2), { t: 'loop', a: 'rec' }]); tour(ev, .25, [2, 2]); ev.push([F(2.2), { t: 'loop', a: 'stop' }]);
  ev.push([F(2.5), { t: 'loop', a: 'rec', free: true }]); tour(ev, 2.55, [6]); ev.push([F(3.9), { t: 'loop', a: 'stop', free: true }]);
  ev.push([F(5), { t: 'loop', a: 'ghost', id: 1, v: true }]); ev.push([F(6.5), { t: 'loop', a: 'mute', id: 2, v: true }]);
  ev.push([F(7), { t: 'loop', a: 'undo' }]); ev.push([F(7.5), { t: 'loop', a: 'redo' }]); ev.push([F(8), { t: 'loop', a: 'src', id: 1, v: 0 }]); ev.push([F(9), { t: 'loop', a: 'del', id: 2 }]);
  cases.push({ name: 'looper', P: P, ev: ev, end: F(11) });
})();
(function () { // your sound in, on, off and on again
  var P = base('Drowned Choir'), ev = [];
  P['input.level'] = -6; P['input.spr'] = .4; P['input.body'] = .5; P['input.rev'] = .4; P['input.hsend'] = .3; P['input.aura'] = .6;
  ev.push([F(.2), { t: 'input', on: true }]); ev.push([F(3), { t: 'input', on: false }]); ev.push([F(4.5), { t: 'input', on: true }]); ev.push([F(5), { t: 'p', k: 'input.level', v: -20 }]);
  tour(ev, 1, [7, 2]);
  cases.push({ name: 'sound in', P: P, ev: ev, end: F(7), sine: true });
})();
function line(f, m) {
  switch (m.t) {
    case 'p': return f + ' P ' + IDX[m.k] + ' ' + m.v;
    case 'g': return f + ' G ' + m.s + ' ' + m.k + ' ' + (m.x || 0) + ' ' + (m.y || 0) + ' ' + (m.p || 0) + ' ' + (m.hz || 0);
    case 'moment': if (m.id.indexOf('c:') === 0) return f + ' C ' + m.id.charCodeAt(2) + ' ' + (m.on ? 1 : 0); return f + ' M ' + MOM[m.id] + ' ' + (m.on ? 1 : 0) + ' ' + (m.arg || 0);
    case 'cmrec': return f + ' R ' + (m.on ? 1 : 0);
    case 'cmdef': {
      var d = m.def, s = f + ' D ' + m.id.charCodeAt(0) + ' ';
      if (!d) return null;   // removal: C++ uses an empty definition message below
      s += d.voice + ' ' + d.len + ' ' + d.ev.length; d.ev.forEach(function (e) { s += ' ' + e.join(' '); });
      s += ' ' + d.lanes.length; d.lanes.forEach(function (L) { s += ' ' + IDX[L.k] + ' ' + L.min + ' ' + L.max + ' ' + (L.exp ? 1 : 0) + ' ' + (L.int ? 1 : 0) + ' ' + (L.abs ? 1 : 0) + ' ' + L.pts.length; L.pts.forEach(function (q) { s += ' ' + q[0] + ' ' + q[1]; }); });
      return s;
    }
    case 'loop': return f + ' L ' + m.a + ' ' + (m.id || 0) + ' ' + (m.v === true ? 1 : m.v === false ? 0 : (m.v || 0)) + ' ' + (m.free ? 1 : 0);
    case 'panic': return f + ' X';
    case 'input': return f + ' N ' + (m.on ? 1 : 0);
  }
}
cases.forEach(function (c) {
  c.ev.sort(function (a, b) { return a[0] - b[0]; });
  // JavaScript
  var h = new core.Host(SR, function () { }, {}), L = new Float32Array(BL), R = new Float32Array(BL), IL = new Float32Array(BL), IR = new Float32Array(BL), out = new Float32Array(c.end * 2 + BL * 2), n = 0, k = 0;
  h.msg({ t: 'init', params: c.P, seed: 1337 });
  for (var f = 0; f < c.end; f += BL) {
    while (k < c.ev.length && c.ev[k][0] <= f) { h.msg(JSON.parse(JSON.stringify(c.ev[k][1]))); k++; }
    if (c.sine) for (var i = 0; i < BL; i++) { IL[i] = .3 * Math.sin(6.283185307179586 * 220 * (f + i) / SR); IR[i] = .2 * Math.sin(6.283185307179586 * 331 * (f + i) / SR); }
    h.block(L, R, 0, c.sine ? IL : null, c.sine ? IR : null);
    for (i = 0; i < BL; i++) { out[n++] = L[i]; out[n++] = R[i]; }
  }
  // C++
  var lines = ['SR ' + SR, 'END ' + c.end, 'I 1337 ' + M.HE_PARAMS.map(function (p) { return c.P[p.id]; }).join(' ')]; if (c.sine) lines.push('SINE');
  c.ev.forEach(function (e) { var l = line(e[0], e[1]); if (l) lines.push(l); else lines.push(e[0] + ' Z ' + e[1].id.charCodeAt(0)); });
  var logf = path.join(tmp, 'log.txt'), outf = path.join(tmp, 'out.f32'); fs.writeFileSync(logf, lines.join('\n') + '\n');
  cp.execFileSync(bin, [logf, outf], { stdio: ['ignore', 'ignore', 'inherit'] });
  var b = fs.readFileSync(outf), cc = new Float32Array(b.buffer, b.byteOffset, b.length / 4);
  var N = Math.min(n, cc.length), first = -1, exact = 0, ej = 0, ec = 0, maxd = 0;
  for (i = 0; i < N; i++) { var d = Math.abs(out[i] - cc[i]); if (first < 0 && d > 1e-6) first = i >> 1; if (out[i] === cc[i]) exact++; if (d > maxd) maxd = d; ej += out[i] * out[i]; ec += cc[i] * cc[i]; }
  var dr = Math.abs(10 * Math.log10((ej + 1e-20) / (ec + 1e-20)));
  ok(n === cc.length && dr < 1 && (first < 0 || first > SR * .5), (c.name + '                    ').slice(0, 18) + ' level diff ' + dr.toFixed(3) + ' dB, ' + (100 * exact / N).toFixed(2) + '% samples identical, max diff ' + maxd.toExponential(2) + ', first difference ' + (first < 0 ? 'none' : (first / SR).toFixed(3) + ' s') + ', rms ' + (10 * Math.log10(ej / N + 1e-20)).toFixed(1) + ' dB');
});
console.log((failed ? failed + ' failed, ' : '') + passed + ' passed');
