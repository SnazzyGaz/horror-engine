// Proof that the Seance layout leaves the audio alone: render every preset offline (mix and stems) with the engine,
// io and preset table from two source trees and compare the samples bit for bit.
// node test/seance-bitid.js <treeA> <treeB>     e.g. a checkout of main 40dc75b and this branch
// Each preset is rendered twice: without GOODBYE (must match bit for bit), and with GOODBYE at 4.2 s (must match bit for
// bit up to that point; seance-ui's GOODBYE is a hard stop, so after it tree B is only checked for silence and clicks).
// (src/io.js caches the engine in globalThis.HECoreFactory on first load; it is cleared between trees, or both trees
// would render with the first tree's engine.)
'use strict';
const path = require('path'), fs = require('fs'), crypto = require('crypto');
function presets(root) { const s = fs.readFileSync(path.join(root, 'src/ui.js'), 'utf8'); const m = /var PRESETS = (\{[\s\S]*?\n  \});/.exec(s); return Function('return ' + m[1])(); }
const SR = 48000, BYE = Math.round(4.2 * SR) - Math.round(4.2 * SR) % 128;
function renderAll(root, withBye) {
  delete globalThis.HECoreFactory; delete globalThis.HE_PARAMS; delete globalThis.HE_SOURCES;
  const M = require(path.join(root, 'src/engine.js')), IO = require(path.join(root, 'src/io.js')), PR = presets(root), out = {};
  for (const name of Object.keys(PR)) {
    const P = {}; M.HE_PARAMS.forEach(p => P[p.id] = p.def); Object.assign(P, PR[name]);
    const log = [], at = (s, m) => log.push({ fn: Math.round(s * SR), m });
    at(0, { t: 'init', params: P, seed: 1337 });
    // every voice gets a drag (the same x/y/pressure messages the board sends), then a stinger and a riser
    for (let v = 0; v < 9; v++) {
      const t0 = .05 + v * .42; at(t0, { t: 'g', s: v, k: 'd', x: .3, y: .4, p: .7, hz: 0 });
      for (let i = 1; i <= 12; i++) at(t0 + i * .025, { t: 'g', s: v, k: 'm', x: .3 + i * .03, y: .4 + i * .02, p: .5 + i * .03, hz: 0 });
      at(t0 + .36, { t: 'g', s: v, k: 'u' });
    }
    at(1.2, { t: 'moment', id: 'stinger', on: true }); at(2.5, { t: 'moment', id: 'riser', on: true });
    if (withBye) log.push({ fn: BYE, m: { t: 'panic' } });
    log.sort((a, b) => a.fn - b.fn);
    const perf = IO.toPerformance({ log, sr: SR, title: name, endFrame: Math.round(4.6 * SR) });
    const r = IO.renderSync(JSON.parse(JSON.stringify(perf)), { stems: true }), h = crypto.createHash('sha256'), hp = crypto.createHash('sha256');
    const cut = withBye ? BYE : Infinity;
    const feed = c => { h.update(Buffer.from(c.buffer, c.byteOffset, c.byteLength)); hp.update(Buffer.from(c.buffer, c.byteOffset, Math.min(c.length, cut) * 4)); };
    r.mix.forEach(feed); (r.stems || []).forEach(s => s && s.forEach(feed));
    let pk = 0, post = 0, jump = 0, pre = 0; r.mix.forEach(c => {
      for (let i = 0; i < c.length; i++) { pk = Math.max(pk, Math.abs(c[i])); if (i > 0 && i >= BYE - 2400 && i < BYE) pre = Math.max(pre, Math.abs(c[i] - c[i - 1])); if (i >= BYE && i > 0) jump = Math.max(jump, Math.abs(c[i] - c[i - 1])); if (i >= BYE + Math.round(.05 * SR)) post = Math.max(post, Math.abs(c[i])); }
    });
    out[name] = { sha: h.digest('hex'), pre: hp.digest('hex'), frames: r.frames, stems: (r.stems || []).length, peak: +pk.toFixed(4), post, jump, preJump: pre };
    delete require.cache[require.resolve(path.join(root, 'src/engine.js'))]; delete require.cache[require.resolve(path.join(root, 'src/io.js'))];
  }
  return out;
}
const [A, B] = process.argv.slice(2).map(p => path.resolve(p));
let bad = 0;
const a = renderAll(A, false), b = renderAll(B, false);
for (const n of Object.keys(a)) {
  const same = b[n] && a[n].sha === b[n].sha && a[n].frames === b[n].frames;
  if (!same || !(a[n].peak > 1e-4)) bad++;
  console.log((same ? 'SAME ' : 'DIFF ') + n.padEnd(15) + ' ' + a[n].sha.slice(0, 16) + ' frames ' + a[n].frames + ' stems ' + a[n].stems + ' peak ' + a[n].peak);
}
if (Object.keys(a).length !== Object.keys(b).length) { bad++; console.log('DIFF preset lists differ'); }
const a2 = renderAll(A, true), b2 = renderAll(B, true), db = x => (20 * Math.log10(x + 1e-30)).toFixed(1);
for (const n of Object.keys(a2)) {
  const same = b2[n] && a2[n].pre === b2[n].pre, fullSame = b2[n] && a2[n].sha === b2[n].sha, quiet = b2[n].post < Math.pow(10, -90 / 20), smooth = b2[n].jump <= Math.max(b2[n].preJump, 1e-3);
  if (!same || !quiet || !smooth) bad++;
  console.log((same ? 'SAME ' : 'DIFF ') + n.padEnd(15) + ' up to GOODBYE; after it ' + (fullSame ? 'unchanged' : 'B differs') + ', B from +50 ms peak ' + db(b2[n].post) + ' dBFS' + (quiet ? '' : ' (NOT SILENT)') + ', step size ' + b2[n].jump.toFixed(4) + ' vs ' + b2[n].preJump.toFixed(4) + ' before' + (smooth ? '' : ' (CLICK)'));
}
console.log(bad ? 'FAIL: renders differ' : 'PASS: all ' + Object.keys(a).length + ' presets render bit-identical (mix and stems) without GOODBYE, and up to GOODBYE with it');
process.exitCode = bad ? 1 : 0;
