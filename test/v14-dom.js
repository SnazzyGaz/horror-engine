// UI checks for v1.4 in a fake DOM (jsdom; no browser, no GPU): undo/redo, MIDI learn, share links, "Save what I just
// played", the Bowed Cymbal preset. npm i jsdom@24, then: node test/v14-dom.js
const { JSDOM } = require('jsdom'); const fs = require('fs'); const S = require('path').join(__dirname, '../src/');
const dom = new JSDOM('<!DOCTYPE html><body>' + fs.readFileSync(S + 'body.html', 'utf8') + '</body>', { url: 'http://localhost/he/index.html', runScripts: 'outside-only', pretendToBeVisual: true });
const w = dom.window; w.TextEncoder = TextEncoder; w.TextDecoder = TextDecoder; let sp = null, blobs = [], clip = null;
w.HTMLCanvasElement.prototype.getContext = function () { return null; };
w.Element.prototype.setPointerCapture = function (id) { this.__pc = id; }; w.Element.prototype.hasPointerCapture = function (id) { return this.__pc === id; };
w.Element.prototype.releasePointerCapture = function () { this.__pc = null; this.dispatchEvent(new w.Event('lostpointercapture')); };
w.URL.createObjectURL = function (b) { blobs.push(b); return 'blob:x'; }; w.URL.revokeObjectURL = function () { };
w.HTMLAnchorElement.prototype.click = function () { };
w.AudioContext = function () { return { sampleRate: 48000, state: 'running', destination: {}, baseLatency: 0, outputLatency: 0, resume() { }, createGain() { return { connect() { } }; }, createAnalyser() { return { connect() { }, getFloatTimeDomainData() { } }; }, audioWorklet: { addModule() { return Promise.reject(new Error('no')); } }, createScriptProcessor() { sp = { connect() { } }; return sp; } }; };
const inp = {}; Object.defineProperty(w.navigator, 'requestMIDIAccess', { value: () => Promise.resolve({ inputs: new Map([[1, inp]]) }) });
Object.defineProperty(w.navigator, 'clipboard', { value: { writeText: (t) => { clip = t; return Promise.resolve(); } } });
w.eval(fs.readFileSync(S + 'engine.js', 'utf8').replace(/if \(typeof module[^\n]*/, ''));
w.eval(fs.readFileSync(S + 'io.js', 'utf8').replace(/if \(typeof module[^\n]*/, ''));
w.eval(fs.readFileSync(S + 'ui.js', 'utf8'));
const $ = id => w.document.getElementById(id), H = w.__he, P = H.P, DEF = {}; w.HE_PARAMS.forEach(p => DEF[p.id] = p);
function ok(c, m) { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; }
const L = new w.Float32Array(2048), R = new w.Float32Array(2048);
function pump(sec) { for (let i = 0; i < sec * 48000 / 2048; i++) sp.onaudioprocess({ outputBuffer: { getChannelData: c => c ? R : L } }); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
const btext = b => new Promise(r => { const fr = new w.FileReader(); fr.onload = () => r(fr.result); fr.readAsText(b); });
function key(k, o) { w.document.dispatchEvent(new w.KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true }, o || {}))); }
const midi = d => inp.onmidimessage({ data: d });
(async () => {
  $('wakeBtn').click(); await sleep(10); ok(!!sp, 'audio started (compat host)'); pump(.3);
  ok([...$('preset').options].some(o => o.textContent === 'Bowed Cymbal'), 'Bowed Cymbal preset in the list');
  /* ---------- undo ---------- */
  ok($('undo').disabled && $('redo').disabled, 'undo and redo start disabled');
  H.setParam('rev.size', .3); H.setParam('rev.size', .35); H.setParam('rev.size', .4);
  ok(H.hist().n === 1, 'quick moves on one knob merge into one step');
  key('z', { ctrlKey: true }); ok(P['rev.size'] === DEF['rev.size'].def, 'Ctrl+Z puts the knob back');
  key('y', { ctrlKey: true }); ok(P['rev.size'] === .4, 'Ctrl+Y redoes it');
  // a knob drag is one step
  const kn = [...w.document.querySelectorAll('#hallk .knob')][1], id1 = 'rev.decay', v0 = P[id1];
  const pe = (t, y) => { const e = new w.MouseEvent(t, { clientY: y, bubbles: true, button: 0 }); e.pointerId = 1; kn.dispatchEvent(e); };
  pe('pointerdown', 200); for (let y = 198; y > 150; y -= 4) pe('pointermove', y); kn.releasePointerCapture(1);
  ok(P[id1] !== v0 && H.hist().n === 2, 'a knob drag is a single step (' + H.hist().n + ' steps)');
  $('undo').click(); ok(P[id1] === v0, 'the undo button undoes the whole drag');
  $('redo').click(); ok(P[id1] !== v0, 'the redo button redoes it');
  // preset: one step for every setting it changes
  const before = JSON.stringify(P); $('preset').value = 'Bowed Cymbal'; $('preset').dispatchEvent(new w.Event('change'));
  ok(P['bowed.object'] === 4 && P['bowed.size'] === 520, 'Bowed Cymbal preset: Bowed Metal on the Cymbal object, 520 Hz');
  key('z', { ctrlKey: true }); ok(JSON.stringify(P) === before, 'one undo puts every setting from before the preset back');
  key('y', { ctrlKey: true }); ok(P['bowed.object'] === 4, 'and redo brings the preset back');
  // Defaults and the per-voice offsets
  H.setParam('ebow.tune', 5); H.setParam('glass.distOff', -.5); await sleep(900);
  $('offReset').click(); $('offReset').click();
  ok(P['ebow.tune'] === 0 && P['glass.distOff'] === 0 && $('offReset').textContent === 'Undo', 'Defaults (Sure?) resets the offsets; the button offers Undo');
  key('z', { ctrlKey: true });
  ok(P['ebow.tune'] === 5 && P['glass.distOff'] === -.5 && $('offReset').textContent === 'Defaults', 'Ctrl+Z restores the offsets and the button goes back to Defaults');
  $('offReset').click(); $('offReset').click(); const n0 = H.hist().pos; $('offReset').click();
  ok(P['ebow.tune'] === 5 && H.hist().pos === n0 - 1, 'the Undo on Defaults is the same timeline step');
  key('y', { ctrlKey: true }); ok(P['ebow.tune'] === 0, 'redo after it resets again');
  key('z', { ctrlKey: true }); H.select(0);
  const rst = w.document.querySelector('.offrst'); rst.click(); ok(P['ebow.tune'] === 0, 'per-voice Reset');
  key('z', { ctrlKey: true }); ok(P['ebow.tune'] === 5, 'per-voice Reset is one undo step');
  // the looper is on the same timeline
  const ly = () => (H.live().tm && H.live().tm.ly.length) || 0;
  key(' '); H.send({ t: 'g', s: 0, k: 'd', x: .5, y: .5, p: .7, hz: 0 }); pump(.4); H.send({ t: 'g', s: 0, k: 'u' }); pump(.3); key(' '); pump(.2);
  ok(ly() === 1, 'a loop layer was recorded');
  const st0 = H.hist().pos; key('z', { ctrlKey: true }); pump(.1); ok(ly() === 0, 'Ctrl+Z after a loop layer undoes the layer (looper on the same timeline)');
  key('z', { ctrlKey: true }); pump(.1); ok(ly() === 0 && H.hist().pos === st0 - 2, 'the next Ctrl+Z steps back past it to the knob steps before');
  key('y', { ctrlKey: true }); key('y', { ctrlKey: true }); pump(.1); ok(ly() === 1 && H.hist().pos === st0, 'redo brings back the knob step and the layer');
  /* ---------- MIDI learn ---------- */
  const decay = [...w.document.querySelectorAll('#hallk .knob')][1];
  decay.dispatchEvent(new w.MouseEvent('contextmenu', { bubbles: true, clientX: 300, clientY: 300 }));
  const menu = w.document.querySelector('.ctxmenu'); ok(!!menu && /MIDI learn/.test(menu.textContent) && /Reset to default/.test(menu.textContent), 'right-click opens the menu with MIDI learn and Reset');
  [...menu.querySelectorAll('button')].find(b => /MIDI learn/.test(b.textContent)).click(); await sleep(5);
  ok(decay.classList.contains('mlearn'), 'the control blinks while learning');
  midi([0xB0, 121, 0]); ok(!H.midiMap()['cc:0:121'], 'CC 121 (a channel-mode message) is not learned');
  midi([0xB0, 21, 64]); ok(H.midiMap()['cc:0:21'] === 'rev.decay' && decay.classList.contains('mmapped'), 'moving CC 21 on channel 1 learns it; the knob shows a dot');
  const dist0 = P['macro.distance']; midi([0xB0, 21, 127]);
  ok(P['rev.decay'] === DEF['rev.decay'].max && P['macro.distance'] === dist0, 'learned CC 21 moves Hall decay and no longer the Distance macro on that channel');
  midi([0xB1, 21, 0]); ok(P['macro.distance'] === DEF['macro.distance'].min, 'CC 21 on channel 2 still moves Distance');
  H.select(7); H.learn('aura.freeze'); midi([0xB0, 24, 0]); midi([0xB0, 24, 127]); pump(.05);
  ok(P['aura.freeze'] === 1 && H.live().tm.mom.riser < 0, 'a learned CC 24 drives Freeze instead of firing the Riser on that channel');
  midi([0x9F, 36, 100]); pump(.05); ok(H.live().tm.mom.riser >= 0, 'channel 16 note 36 still fires the Riser');
  H.learn('bowed.object'); midi([0xB3, 30, 0]); midi([0xB3, 30, 127]); ok(P['bowed.object'] === 4, 'a learned selector (Bowed Metal object, hidden panel) takes the top value: Cymbal');
  H.learn('ebow.tune'); midi([0xB3, 30, 0]); ok(H.midiMap()['cc:3:30'] === 'ebow.tune' && !Object.values(H.midiMap()).includes('bowed.object'), 'one CC drives one control: CC 30 moved to Tune');
  midi([0xB3, 30, 127]); ok(P['ebow.tune'] === 24, 'the per-voice Tune knob is learnable (+24 st)');
  H.learn('rev.size'); key('Escape'); ok(!w.document.querySelector('.mlearn'), 'Esc cancels learning');
  ok(JSON.parse(w.localStorage.getItem('horror-engine.midimap'))['cc:0:21'] === 'rev.decay', 'mappings are kept in localStorage');
  /* ---------- share ---------- */
  H.setParam('glass.wet', .9); H.setParam('struck.object', 2);
  $('share').click(); await sleep(5);
  ok(clip && /^http:\/\/localhost\/he\/index\.html#s=[A-Za-z0-9_-]+$/.test(clip), 'Link copies the page address with #s=… (' + (clip || '').length + ' chars)');
  const want = JSON.stringify(Object.keys(P).filter(k => !/^input\./.test(k)).map(k => [k, +(+P[k]).toPrecision(6)]));
  $('preset').value = 'Cold Cellar'; $('preset').dispatchEvent(new w.Event('change'));
  ok(P['glass.wet'] !== .9, 'settings changed away');
  w.location.hash = clip.split('#')[1]; await sleep(30);
  const got = JSON.stringify(Object.keys(P).filter(k => !/^input\./.test(k)).map(k => [k, +(+P[k]).toPrecision(6)]));
  ok(got === want, 'opening the link rebuilds every setting');
  ok(w.location.hash === '', 'the address is tidied after loading the link');
  key('z', { ctrlKey: true }); ok(P['glass.wet'] !== .9, 'Ctrl+Z puts your settings back after a shared link');
  /* ---------- Save what I just played ---------- */
  pump(3); blobs = []; key('R', { shiftKey: true }); pump(.2); await sleep(1300);
  const z = blobs.length ? await btext(blobs[0]) : '';
  ok(/horror-engine-last-\d+s-.*\.wav/.test(z) && /\.horror\.json/.test(z), 'Shift+R saves a zip with the last stretch as a WAV and its performance file');
  ok(/"retro":\{"startFrame":\d+,"endFrame":\d+,"offsetFrames":0,"exact":true/.test(z.replace(/\s/g, '')), 'early in a session the file replays exactly');
  console.log('toast:', $('toast').textContent);
  process.exit();
})();
