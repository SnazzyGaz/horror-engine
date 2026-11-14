// Proof that the Seance layout leaves the audio alone: render every preset offline (mix and stems) with the engine,
// io and preset table from two source trees and compare the samples bit for bit.
// node test/seance-bitid.js <treeA> <treeB>     e.g. a checkout of main 40dc75b and this branch
'use strict';
const path = require('path'), fs = require('fs'), crypto = require('crypto');
function presets(root) { const s = fs.readFileSync(path.join(root, 'src/ui.js'), 'utf8'); const m = /var PRESETS = (\{[\s\S]*?\n  \});/.exec(s); return Function('return ' + m[1])(); }
function renderAll(root) {
  const M = require(path.join(root, 'src/engine.js')), IO = require(path.join(root, 'src/io.js')), PR = presets(root), out = {};
  for (const name of Object.keys(PR)) {
    const P = {}; M.HE_PARAMS.forEach(p => P[p.id] = p.def); Object.assign(P, PR[name]);
    const SR = 48000, log = [], at = (s, m) => log.push({ fn: Math.round(s * SR), m });
    at(0, { t: 'init', params: P, seed: 1337 });
    // every voice gets a drag (the same x/y/pressure messages the board sends), then a stinger and a riser
    for (let v = 0; v < 9; v++) {
      const t0 = .05 + v * .42; at(t0, { t: 'g', s: v, k: 'd', x: .3, y: .4, p: .7, hz: 0 });
      for (let i = 1; i <= 12; i++) at(t0 + i * .025, { t: 'g', s: v, k: 'm', x: .3 + i * .03, y: .4 + i * .02, p: .5 + i * .03, hz: 0 });
      at(t0 + .36, { t: 'g', s: v, k: 'u' });
    }
    at(1.2, { t: 'moment', id: 'stinger', on: true }); at(2.5, { t: 'moment', id: 'riser', on: true }); at(4.2, { t: 'panic' });
    log.sort((a, b) => a.fn - b.fn);
    const perf = IO.toPerformance({ log, sr: SR, title: name, endFrame: Math.round(4.6 * SR) });
    const r = IO.renderSync(JSON.parse(JSON.stringify(perf)), { stems: true }), h = crypto.createHash('sha256');
    r.mix.forEach(c => h.update(Buffer.from(c.buffer, c.byteOffset, c.byteLength)));
    (r.stems || []).forEach(s => s && s.forEach(c => h.update(Buffer.from(c.buffer, c.byteOffset, c.byteLength))));
    let pk = 0; r.mix.forEach(c => { for (let i = 0; i < c.length; i++) pk = Math.max(pk, Math.abs(c[i])); });
    out[name] = { sha: h.digest('hex'), frames: r.frames, stems: (r.stems || []).length, peak: +pk.toFixed(4) };
    delete require.cache[require.resolve(path.join(root, 'src/engine.js'))]; delete require.cache[require.resolve(path.join(root, 'src/io.js'))];
  }
  return out;
}
const [A, B] = process.argv.slice(2).map(p => path.resolve(p));
const a = renderAll(A), b = renderAll(B); let bad = 0;
for (const n of Object.keys(a)) {
  const same = b[n] && a[n].sha === b[n].sha && a[n].frames === b[n].frames;
  if (!same || !(a[n].peak > 1e-4)) bad++;
  console.log((same ? 'SAME ' : 'DIFF ') + n.padEnd(15) + ' ' + a[n].sha.slice(0, 16) + ' frames ' + a[n].frames + ' stems ' + a[n].stems + ' peak ' + a[n].peak);
}
if (Object.keys(a).length !== Object.keys(b).length) { bad++; console.log('DIFF preset lists differ'); }
console.log(bad ? 'FAIL: renders differ' : 'PASS: all ' + Object.keys(a).length + ' presets render bit-identical (mix and stems)');
process.exitCode = bad ? 1 : 0;
