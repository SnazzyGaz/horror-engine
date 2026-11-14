// UI smoke test for custom moments in a fake DOM (jsdom; no browser, no GPU). npm i jsdom@24, then: node test/moments-dom.js
const { JSDOM } = require('jsdom'); const fs = require('fs'); const S = require('path').join(__dirname, '../src/');
const dom = new JSDOM('<!DOCTYPE html><body>' + fs.readFileSync(S + 'body.html', 'utf8') + '</body>', { url: 'http://localhost/', runScripts: 'outside-only', pretendToBeVisual: true });
const w = dom.window; let sp = null, blobs = [];
w.HTMLCanvasElement.prototype.getContext = function () { return null; };
w.URL.createObjectURL = function (b) { blobs.push(b); return 'blob:x'; }; w.URL.revokeObjectURL = function () { };
w.HTMLAnchorElement.prototype.click = function () { };
w.AudioContext = function () { return { sampleRate: 48000, state: 'running', destination: {}, baseLatency: 0, outputLatency: 0, resume() { }, createGain() { return { connect() { } }; }, createAnalyser() { return { connect() { }, getFloatTimeDomainData() { } }; }, audioWorklet: { addModule() { return Promise.reject(new Error('no')); } }, createScriptProcessor() { sp = { connect() { } }; return sp; } }; };
const inp = {}; Object.defineProperty(w.navigator, 'requestMIDIAccess', { value: () => Promise.resolve({ inputs: new Map([[1, inp]]) }) });
w.eval(fs.readFileSync(S + 'engine.js', 'utf8').replace(/if \(typeof module[^\n]*/, ''));
w.eval(fs.readFileSync(S + 'io.js', 'utf8').replace(/if \(typeof module[^\n]*/, ''));
w.eval(fs.readFileSync(S + 'ui.js', 'utf8'));
const $ = id => w.document.getElementById(id), H = w.__he;
function ok(c, m) { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; }
const L = new w.Float32Array(2048), R = new w.Float32Array(2048);
function pump(sec) { for (let i = 0; i < sec * 48000 / 2048; i++) sp.onaudioprocess({ outputBuffer: { getChannelData: c => c ? R : L } }); }
const btext = b => new Promise(r => { const fr = new w.FileReader(); fr.onload = () => r(fr.result); fr.readAsText(b); });
const tick = () => new Promise(r => setTimeout(r, 0));
function key(k, o) { w.document.dispatchEvent(new w.KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true }, o || {}))); }
(async () => {
  $('cmRec').click(); await tick(); await tick(); await tick();
  ok(!!sp, 'audio started (compat host)'); pump(.3);
  ok($('cmRec').getAttribute('aria-pressed') === 'true', 'Record moment armed');
  pump(.5);
  H.send({ t: 'g', s: 4, k: 'd', x: .4, y: .5, p: .8, hz: 0 }); pump(.1); H.send({ t: 'g', s: 4, k: 'u' }); pump(.2);
  H.setParam('macro.dread', .6); pump(.2); H.setParam('macro.dread', .2); pump(.2);
  $('cmRec').click(); pump(.3); await tick();
  ok(!$('cmNameRow').hidden && $('cmName').value === 'Moment 6', 'inline name field shown with "Moment 6"');
  $('cmName').value = 'Knock swell'; $('cmKeep').click();
  ok(H.moments().length === 1 && $('cm_' + H.moments()[0].id), 'saved; button in the panel');
  const c = H.moments()[0];
  ok(c.len > .6 && c.len < .8, 'trimmed length ~0.7 s: ' + c.len);
  ok(JSON.parse(w.localStorage.getItem('horror-engine.moments')).length === 1, 'persisted in localStorage');
  key('F6'); pump(.1);
  ok($('cm_' + c.id).getAttribute('aria-pressed') === 'true', 'F6 plays it');
  key('F6'); pump(.1);
  ok($('cm_' + c.id).getAttribute('aria-pressed') === 'false', 'F6 again stops it');
  // MIDI: channel 16 note 41 = first custom moment (onMidi is internal; reach it through the keyboard-free path)
  H.momentN(5); pump(.1); ok($('cm_' + c.id).getAttribute('aria-pressed') === 'true', 'moment #6 (MIDI ch16 note 41 / CC 29 path) plays'); pump(1);
  ok($('cm_' + c.id).getAttribute('aria-pressed') === 'false', 'ends by itself after one pass');
  ok(Math.abs(H.state().P['macro.dread'] - .2) < 1e-9, 'UI knob untouched');
  // menu
  w.document.querySelector('.cmmenu').click();
  const opts = w.document.querySelector('.cmopts'); ok(!!opts, 'menu opens');
  const sel = opts.querySelector('select'); sel.value = '2'; sel.dispatchEvent(new w.Event('change'));
  ok(H.moments()[0].voice === 2 && /Bowed Metal/.test($('cm_' + c.id).textContent), 'voice changed to Bowed Metal');
  const nm = w.document.querySelector('.cmopts input'); nm.value = 'Renamed'; nm.dispatchEvent(new w.Event('change'));
  ok(H.moments()[0].name === 'Renamed', 'renamed');
  blobs = []; [...w.document.querySelectorAll('.cmopts button')].find(b => b.textContent === 'Export').click();
  const ex = JSON.parse(await btext(blobs[0])); ok(ex.format === 'horror-engine.moment' && ex.moment.name === 'Renamed', 'export writes a .horror-moment.json');
  blobs = []; $('psave').click(); const pr = JSON.parse(await btext(blobs[0])); ok(pr.customMoments && pr.customMoments.length === 1, 'preset save includes the moment');
  let del = [...w.document.querySelectorAll('.cmopts button')].find(b => b.textContent === 'Delete'); del.click();
  del = [...w.document.querySelectorAll('.cmopts button')].find(b => b.textContent === 'Sure?'); del.click();
  ok(H.moments().length === 0 && !$('cm_' + c.id), 'deleted');
  // import back through the Import button's file path
  const f = new w.File([JSON.stringify(ex)], 'x.horror-moment.json', { type: 'application/json' });
  Object.defineProperty($('cmFile'), 'files', { value: [f], configurable: true }); $('cmFile').dispatchEvent(new w.Event('change'));
  await new Promise(r => setTimeout(r, 50));
  ok(H.moments().length === 1 && H.moments()[0].name === 'Renamed', 'import restores it');
  // preset load path merges (no duplicate for identical content)
  const pf = new w.File([JSON.stringify(pr)], 'p.json'); Object.defineProperty($('pfile'), 'files', { value: [pf], configurable: true }); $('pfile').dispatchEvent(new w.Event('change'));
  await new Promise(r => setTimeout(r, 50));
  ok(H.moments().length === 1, 'preset load with the identical moment does not duplicate it: ' + H.moments().map(m => m.name).join(', '));
  const id2 = H.moments()[0].id, pr2 = () => $('cm_' + id2).getAttribute('aria-pressed');
  inp.onmidimessage({ data: [0x9F, 41, 100] }); pump(.1); ok(pr2() === 'true', 'MIDI ch16 note 41 fires custom moment 1');
  inp.onmidimessage({ data: [0x8F, 41, 0] }); pump(.1); ok(pr2() === 'true', 'note-off does not stop it');
  inp.onmidimessage({ data: [0x9F, 41, 100] }); pump(.1); ok(pr2() === 'false', 'second note-on stops it');
  inp.onmidimessage({ data: [0xB0, 29, 127] }); pump(.1); ok(pr2() === 'true', 'CC 29 rise fires it');
  inp.onmidimessage({ data: [0xB0, 29, 120] }); pump(.1); ok(pr2() === 'true', 'CC 29 staying high does not retrigger');
  inp.onmidimessage({ data: [0xB0, 29, 0] }); inp.onmidimessage({ data: [0xB0, 29, 127] }); pump(.1); ok(pr2() === 'false', 'CC 29 re-armed rise toggles it off');
  inp.onmidimessage({ data: [0x9F, 36, 100] }); pump(.1); ok($('mo_riser').getAttribute('aria-pressed') === 'true', 'ch16 note 36 fires the Riser');
  // per-voice Tune & place + Defaults
  ok(!!$('voice').querySelector('.offsets'), 'Tune & place section is on the selected voice');
  ok($('offReset') && $('offReset').disabled, 'Defaults under the voice list starts disabled');
  H.setParam('ebow.tune', -12); H.setParam('ebow.distOff', .3);
  ok(w.document.querySelectorAll('#rack .src.offset').length === 1 && w.document.querySelector('#rack .src.offset strong').textContent === 'E-bow String', 'brass-dot class on the e-bow when offset');
  ok(!$('offReset').disabled && $('offReset').textContent === 'Defaults', 'Defaults enables once any voice is offset');
  const reset = [...$('voice').querySelectorAll('button')].find(b => b.textContent === 'Reset');
  ok(!!reset, 'per-instrument Reset is in the voice panel');
  reset.click();
  ok(H.state().P['ebow.tune'] === 0 && H.state().P['ebow.distOff'] === 0 && !w.document.querySelector('#rack .src.offset'), 'Reset zeros that voice and clears the dot');
  H.setParam('ebow.tune', 7); H.setParam('glass.matOff', .4); H.setParam('spring.distOff', -.25);
  ok(w.document.querySelectorAll('#rack .src.offset').length === 3, 'three voices show the offset dot');
  $('offReset').click();
  ok($('offReset').textContent === 'Sure?', 'Defaults asks for confirmation');
  ok(H.state().P['ebow.tune'] === 7 && H.state().P['glass.matOff'] === .4, 'first Defaults click does not reset yet');
  $('offReset').click();
  ok(H.state().P['ebow.tune'] === 0 && H.state().P['glass.matOff'] === 0 && H.state().P['spring.distOff'] === 0, 'second click resets every voice');
  ok(!w.document.querySelector('#rack .src.offset') && $('offReset').textContent === 'Undo', 'dots cleared; Defaults becomes Undo');
  $('offReset').click();
  ok(H.state().P['ebow.tune'] === 7 && H.state().P['glass.matOff'] === .4 && H.state().P['spring.distOff'] === -.25, 'Undo restores the snapshot');
  ok(w.document.querySelectorAll('#rack .src.offset').length === 3 && $('offReset').textContent === 'Defaults', 'dots return; button is Defaults again');
  blobs = []; $('psave').click(); const prOff = JSON.parse(await btext(blobs[0]));
  ok(prOff.params['ebow.tune'] === 7 && prOff.params['glass.matOff'] === .4 && prOff.sources.springTank.distOff === -.25, 'preset save includes the offsets');
  console.log('toast:', $('toast').textContent);
  process.exit();
})();
