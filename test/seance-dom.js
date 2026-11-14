// Wiring checks for the Seance layout in a fake DOM (jsdom; no browser, no GPU). npm i jsdom@24, then: node test/seance-dom.js
const { JSDOM } = require('jsdom'); const fs = require('fs'), path = require('path'); const S = path.join(__dirname, '../src/');
const dom = new JSDOM('<!DOCTYPE html><body>' + fs.readFileSync(S + 'seance/body.html', 'utf8') + '</body>', { url: 'http://localhost/seance/index.html', runScripts: 'outside-only', pretendToBeVisual: true });
const w = dom.window; w.TextEncoder = TextEncoder; w.TextDecoder = TextDecoder; let sp = null;
w.HTMLCanvasElement.prototype.getContext = function () { return null; };
w.Element.prototype.setPointerCapture = function (id) { this.__pc = id; }; w.Element.prototype.hasPointerCapture = function (id) { return this.__pc === id; };
w.Element.prototype.releasePointerCapture = function () { this.__pc = null; this.dispatchEvent(new w.Event('lostpointercapture')); };
w.URL.createObjectURL = function () { return 'blob:x'; }; w.URL.revokeObjectURL = function () { };
w.AudioContext = function () { return { sampleRate: 48000, state: 'running', destination: {}, baseLatency: 0, outputLatency: 0, resume() { }, createGain() { return { connect() { } }; }, createAnalyser() { return { connect() { }, getFloatTimeDomainData() { } }; }, audioWorklet: { addModule() { return Promise.reject(new Error('no')); } }, createScriptProcessor() { sp = { connect() { } }; return sp; } }; };
const inp = {}; Object.defineProperty(w.navigator, 'requestMIDIAccess', { value: () => Promise.resolve({ inputs: new Map([[1, inp]]) }) });
w.eval(fs.readFileSync(S + 'engine.js', 'utf8').replace(/if \(typeof module[^\n]*/, ''));
w.eval(fs.readFileSync(S + 'io.js', 'utf8').replace(/if \(typeof module[^\n]*/, ''));
w.eval(fs.readFileSync(S + 'ui.js', 'utf8'));
w.eval(fs.readFileSync(S + 'seance/seance.js', 'utf8'));
const $ = id => w.document.getElementById(id), H = w.__he, P = H.P, DEF = H.DEF;
function ok(c, m) { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; }
const L = new w.Float32Array(2048), R = new w.Float32Array(2048);
function pump(sec) { for (let i = 0; i < sec * 48000 / 2048; i++) sp.onaudioprocess({ outputBuffer: { getChannelData: c => c ? R : L } }); }
const sleep = ms => new Promise(r => setTimeout(r, ms)), frame = () => new Promise(r => w.requestAnimationFrame(() => r()));
function key(k, o) { w.document.dispatchEvent(new w.KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true }, o || {}))); }
const toks = () => [...w.document.querySelectorAll('#rack .src')];
(async () => {
  /* layout */
  ok(toks().length === 9, 'nine voice tokens');
  ok($('mo_stinger').parentNode === $('board') && /Yes/.test($('mo_stinger').textContent) && $('mo_riser').parentNode === $('board') && /No/.test($('mo_riser').textContent), 'Yes (Stinger) and No (Riser) sit on the board');
  ok($('panic').parentNode === $('board') && /Goodbye/.test($('panic').textContent), 'Goodbye (Silence) sits on the board');
  ok(w.document.querySelectorAll('#moments button').length === 3, 'three moment pads in the column (Drone bed, Heartbeat, In the walls)');
  ok($('macros').querySelectorAll('.knob.big').length === 4, 'four macros');
  ok($('pins').querySelectorAll('.knob').length === 4 && /E-bow String/.test($('pinT').textContent), 'four pinned knobs for E-bow String');
  ok($('hallk').children.length === 5 && $('sprk').children.length === 3 && $('harmk').children.length === 4 && $('bodyk').children.length === 4 && $('masterk').children.length === 2 && $('sendk').children.length === 3, 'Effects drawer: hall 5, spring 3, harmonizer 4, body 4, master 2, sends 3');
  ok(!w.document.querySelector('.keys') && !w.document.querySelector('#machine') && typeof w.THREE === 'undefined', 'no key-hint line, no Machine, no three.js');
  ok(!w.document.getElementById('rec').offsetParent && $('rec').closest('[hidden]'), 'Record, Render and Stems are not on screen');
  /* audio starts from the wake button */
  $('wakeBtn').click(); await sleep(10); ok(!!sp, 'audio started (compat host)'); pump(.3);
  /* tokens select the voice the board plays */
  toks()[2].click(); await frame();
  ok(H.sel() === 2 && toks()[2].getAttribute('aria-current') === 'true' && /plays the board/.test(toks()[2].textContent), 'clicking token III selects Bowed Metal and marks it');
  ok(/Bowed Metal/.test($('whoName').textContent) && /Bowed Metal/.test($('pinT').textContent) && $('pins').querySelectorAll('.knob').length === 4, 'board title and pinned knobs follow the selection');
  key('5'); await frame(); ok(H.sel() === 4 && /Struck Metal/.test($('pinT').textContent), 'key 5 still selects Struck Metal');
  key('1'); await frame();
  /* a pinned knob and its twin in the Voice drawer show the same value */
  H.setParam('ebow.slack', .2); const outs = [...w.document.querySelectorAll('.knob[aria-label="Slack"] output')].map(o => o.textContent);
  ok(outs.length === 2 && outs[0] === outs[1] && outs[0] === '20%', 'Slack shows 20% in both the pinned panel and the Voice drawer (' + outs.join(', ') + ')');
  const pk = $('pins').querySelector('.knob'), id0 = 'ebow.sustain', v0 = P[id0];
  const pe = (t, y) => { const e = new w.MouseEvent(t, { clientY: y, bubbles: true, button: 0 }); e.pointerId = 3; pk.dispatchEvent(e); };
  pe('pointerdown', 200); for (let y = 196; y > 150; y -= 5) pe('pointermove', y); pk.releasePointerCapture(3);
  ok(P[id0] > v0, 'dragging a pinned knob moves the real parameter');
  ok(H.hist().pos >= 1, 'and it is an undo step');
  /* Yes, No, Goodbye */
  $('mo_stinger').click(); pump(.1); ok($('mo_stinger').getAttribute('aria-pressed') === 'true', 'Yes fires the Stinger');
  $('mo_riser').click(); pump(.1); ok($('mo_riser').getAttribute('aria-pressed') === 'true', 'No fires the Riser');
  H.setParam('ebow.hold', 1); H.setParam('aura.freeze', 1); await frame();
  ok(/frozen/.test(toks()[7].textContent) && /holding/.test(toks()[0].textContent) && toks()[0].classList.contains('held'), 'tokens show frozen and holding');
  $('panic').click(); pump(.2);
  ok(P['ebow.hold'] === 0 && P['aura.freeze'] === 0 && $('mo_riser').getAttribute('aria-pressed') === 'false', 'Goodbye silences: holds, freeze and the Riser stop');
  /* rail: Hold, Freeze, octave */
  $('holdBtn').click(); await frame(); ok(P['ebow.hold'] === 1 && $('holdBtn').getAttribute('aria-pressed') === 'true', 'Hold holds the selected voice');
  key('h'); await frame(); ok(P['ebow.hold'] === 0 && $('holdBtn').getAttribute('aria-pressed') === 'false', 'H key releases it and the button follows');
  $('frzBtn').click(); await frame(); ok(P['aura.freeze'] === 1 && $('frzBtn').getAttribute('aria-pressed') === 'true', 'Freeze Aura');
  key('f'); await frame(); ok(P['aura.freeze'] === 0, 'F key unfreezes');
  $('octUp').click(); ok(H.oct() === 1 && $('octV').textContent === '+1', 'Oct + raises the keyboard octave');
  key('['); key('['); ok(H.oct() === -1 && $('octV').textContent === '-1', '[ lowers it and the display follows');
  $('octUp').click();
  /* presets */
  await frame(); const pv = $('preset').selectedIndex;
  $('pNext').click(); await frame();
  ok($('preset').selectedIndex === pv + 1 && $('pTitle').textContent === $('preset').value, 'next preset (' + $('preset').value + ')');
  ok($('pEdit').textContent === '', 'a fresh preset is not marked edited');
  H.setParam('macro.dread', .77); await frame(); ok($('pEdit').textContent === 'edited', 'moving a knob marks it edited');
  key('z', { ctrlKey: true }); await frame(); ok($('pEdit').textContent === '', 'undo clears the mark');
  $('pPrev').click(); await frame(); ok($('preset').selectedIndex === pv, 'previous preset');
  $('pStar').click(); ok($('pStar').getAttribute('aria-pressed') === 'true' && JSON.parse(w.localStorage.getItem('horror-engine.seance.fav')).length === 1, 'star a preset');
  $('pBrowse').click(); ok(!$('browse').hidden && $('bList').children.length === 9, 'Browse lists the nine presets');
  $('bStarred').click(); ok($('bList').children.length === 1, 'Starred filter');
  [...$('bList').querySelectorAll('.go')][0].click(); ok($('browse').hidden, 'choosing a preset closes Browse');
  /* drawers and the chain */
  const tab = n => w.document.querySelector('.rt[data-dr="' + n + '"]');
  tab('drFx').click(); ok(!$('drFx').hidden && $('drVoice').hidden && tab('drFx').getAttribute('aria-expanded') === 'true', 'Effects tab opens its drawer');
  tab('drLoop').click(); ok(!$('drLoop').hidden && $('drFx').hidden, 'Looper tab swaps drawers');
  tab('drLoop').click(); ok($('drLoop').hidden, 'clicking it again closes it');
  $('chHall').click(); ok(!$('drFx').hidden, 'the Hall chip in the chain opens Effects');
  $('drFx').querySelector('.dclose').click(); ok($('drFx').hidden, 'close button');
  tab('drIn').click(); ok(!$('drIn').hidden && !$('inPanel').closest('[hidden]') && $('inputk').children.length === 6, 'Your sound in drawer with its six knobs');
  H.setParam('rev.decay', 14); await frame(); ok(/14\.0 s/.test($('chHall').textContent) && /14\.0 s/.test($('sumFx').textContent), 'chain and tab summary follow the hall decay');
  /* looper over the rail summary */
  key(' '); H.send({ t: 'g', s: 0, k: 'd', x: .5, y: .5, p: .7, hz: 0 }); pump(.4); H.send({ t: 'g', s: 0, k: 'u' }); pump(.3); key(' '); pump(.3);
  ok(/1 layer/.test($('sumLoop').textContent), 'looper summary shows the layer (' + $('sumLoop').textContent + ')');
  /* MIDI learn from the top bar */
  $('mlBtn').click(); ok(w.document.body.classList.contains('picking'), 'MIDI learn: pick mode');
  const kn = $('hallk').querySelector('.knob'); kn.dispatchEvent(new w.MouseEvent('pointerdown', { bubbles: true, button: 0 }));
  await sleep(10); ok(H.learning() === 'rev.size' && !w.document.body.classList.contains('picking'), 'clicking a knob starts learning it');
  H.onMidi({ data: [176, 74, 100] }); ok(H.midiMap()['cc:0:74'] === 'rev.size', 'moving CC 74 maps it');
  ok(kn.classList.contains('mmapped'), 'the knob shows the MIDI dot');
  /* moments: F keys, MIDI channel 16 notes */
  key('F3'); pump(.1); ok($('mo_drone').getAttribute('aria-pressed') === 'true', 'F3 plays Drone bed');
  H.onMidi({ data: [159, 37, 100] }); pump(.1); ok($('mo_stinger').getAttribute('aria-pressed') === 'true', 'channel 16 note 37 fires the Stinger (Yes)');
  key('Escape'); pump(.2); ok($('mo_drone').getAttribute('aria-pressed') === 'false', 'Esc is still Silence');
  console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'all seance checks passed');
  setTimeout(() => process.exit(), 50);
})();
