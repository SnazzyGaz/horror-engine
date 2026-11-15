(function () {
  'use strict';
  var VERSION = '1.2.1', AUTHOR = 'Garyck Arntzen', CREDIT = 'https://x.com/_mintydoge';
  var $ = function (id) { return document.getElementById(id); };
  var DEF = {}; HE_PARAMS.forEach(function (p) { DEF[p.id] = p; });
  var P = {}; HE_PARAMS.forEach(function (p) { P[p.id] = p.def; });
  var SRC = [
    { n: 'E-bow String', d: 'A slack string held in endless sustain by a magnetic driver: wails, harmonic flips, distorted screams. Press harder and the slack string bends sharp. Switch Excite to Strike or Pluck and it becomes a Blaster Beam: hit it, then slide the bar.', x: 'Slide (Slide range octaves either side)', y: 'Driver position', h: 'Press harder to drive harder and bend it up' },
    { n: 'Hurdy-Gurdy', d: 'Three strings on a rosined wheel. The drone bed; Dread bends the fifth to a tritone.', x: 'Melody, when switched on', y: '', h: 'Move faster to crank harder. Jerk it for the buzz.' },
    { n: 'Bowed Metal', d: 'Rulers, rods, saw blades and clock springs under a bow. Whoops, whines and screeches. A ruler is pitched by how far it hangs over the edge; changing bow pressure makes the note jump between modes. Add Water for a waterphone.', x: 'Bow position', y: 'Bend / overhang', h: 'The bow is your speed: no motion, no sound. Change pressure to jump modes.' },
    { n: 'Glass', d: 'Stick-slip friction on glass. From a singing wine glass (wet finger, with its slow circling beat) to nails on a pane.', x: 'Contact point', y: 'Dull to shrill', h: 'Scrape speed sets the judder; a finger circles faster with speed' },
    { n: 'Struck Metal', d: 'Ruler twangs, rod pings, bells and knocks on the cabinet. Polyphonic. A ruler\'s pitch comes from its length; Water makes rods and bells wobble.', x: 'Pitch: 1½ octaves either side (ruler: overhang)', y: 'Strike position', h: 'Tap. Pressure is velocity.' },
    { n: 'Spring Tank', d: 'A reverb tank you can hit, shake, scrape or hold in sustain with an e-bow. Each echo drips downward: highs first, lows last. Also the Spring send for every other voice.', x: '', y: '', h: 'Tap to hit, scrub to shake or scrape; E-bow mode sustains while you hold' },
    { n: 'Junk Tray', d: 'Nuts and bolts dragged over a tray by a magnet underneath. Rattles, ticks, skittering.', x: 'Magnet', y: 'Magnet', h: 'Drag the magnet; the pieces chase it' },
    { n: 'Aura', d: 'A granular pad made from the last few seconds of the machine itself. Freeze holds it forever.', x: 'Scrub back through the last 8 s', y: 'Blur', h: 'Silent until another voice has played' },
    { n: 'Superball', d: 'A rubber ball on a flexible stick dragged over a drumhead, a steel sheet or the wooden cabinet. It sticks and slips: moans, groans and whale calls that rise as you press.', x: 'Contact point', y: 'Handle angle: bends the moan', h: 'Drag to moan. Press harder to raise it.' }
  ];
  var ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
  var PRESETS = {
    'Cold Cellar': {},
    'The Lighthouse': { 'hurdy.hold': 1, 'hurdy.root': 41, 'hurdy.buzz': .5, 'macro.dread': .45, 'macro.distance': .35, 'ebow.harm': 3, 'ebow.pitch': 41, 'rev.decay': 12, 'rev.size': .85, 'aura.dark': .65 },
    'Glass Asylum': { 'glass.surface': 1, 'glass.contact': 1, 'glass.wet': .8, 'glass.rev': .6, 'glass.level': -8, 'macro.material': .9, 'macro.distance': .25, 'aura.shimmer': .4, 'aura.dark': .3, 'rev.decay': 9, 'struck.object': 2, 'struck.pitch': 440 },
    'Clock Tower': { 'struck.object': 2, 'struck.pitch': 110, 'struck.decay': 9, 'struck.spr': .35, 'bowed.object': 3, 'bowed.size': 160, 'macro.material': .6, 'rev.size': .95, 'rev.decay': 14, 'spring.decay': 4, 'macro.distance': .3 },
    'Rust Works': { 'macro.material': .3, 'macro.dread': .7, 'ebow.drive': .8, 'ebow.buzz': .7, 'bowed.object': 1, 'bowed.size': 140, 'bowed.drive': .4, 'junk.count': 70, 'junk.agit': .5, 'junk.mat': 0, 'struck.object': 1, 'struck.pitch': 90, 'spring.mode': 1 },
    'Drowned Choir': { 'bowed.object': 1, 'bowed.size': 260, 'water.amt': .7, 'water.slosh': .3, 'bowed.hsend': .5, 'moan.surface': 2, 'moan.hsend': .4, 'harm.shift': -12, 'harm.fb': .45, 'rev.decay': 14, 'rev.size': .9, 'macro.distance': .3, 'body.amt': .4 },
    'Blaster Beam': { 'ebow.excite': 1, 'ebow.pitch': 41, 'ebow.slide': 2, 'ebow.damp': .1, 'ebow.hsend': .35, 'harm.shift': -12, 'body.amt': .5, 'body.piezo': .6, 'rev.decay': 10, 'spring.decay': 4, 'ebow.spr': .25 },
    'Sub Basement': { 'macro.pitch': -14, 'macro.distance': .5, 'macro.dread': .5, 'rev.decay': 20, 'rev.size': 1, 'master.tone': -.4, 'hurdy.hold': 1, 'hurdy.level': -14, 'struck.object': 4 },
    'Bowed Cymbal': { 'bowed.object': 4, 'bowed.size': 520, 'bowed.press': .55, 'bowed.speed': .5, 'bowed.rev': .55, 'rev.decay': 9, 'rev.size': .8, 'macro.material': .65 }
  };
  var MOMENTS = [['riser', 'Riser', '8 s climb, hard cut'], ['stinger', 'Stinger', 'Swell into a hit'], ['drone', 'Drone bed', 'Wheel, string, freeze'], ['heart', 'Heartbeat', 'Follows Dread'], ['walls', 'In the walls', 'Skitters, scrapes and drips']];

  var sel = 0, ctx = null, node = null, host = null, analyser = null, scope = new Float32Array(1024), started = false, ctl = {}, octave = 0, basePr = .6;
  var core = null;

  /* ---------- messaging ---------- */
  // every audio message gets a sequence number; the host reports the frame it applied it at (telemetry "ap"),
  // and the pair goes into perfLog, the replayable record of this session
  var seq = 0, pending = {}, perfLog = [], lastFn = 0;
  var NOLOG = { retro: 1, lsnap: 1 };
  function send(m) {
    if (!node && !host) return;
    if (m.t !== 'junk') { m.q = ++seq; pending[m.q] = JSON.parse(JSON.stringify(m)); delete pending[m.q].q; }
    if (node) node.port.postMessage(m); else if (m.t === 'junk') host.wantJunk = m.v; else host.msg(m);
  }
  function acks(ap) {
    for (var i = 0; i + 1 < ap.length; i += 2) {
      var q = ap[i], m = pending[q]; if (!m) continue; delete pending[q];
      if (m.t === 'lsnap') { cpAck(q, ap[i + 1]); continue; }
      if (NOLOG[m.t]) continue;
      perfLog.push({ fn: ap[i + 1], m: m }); lastFn = ap[i + 1];
    }
  }
  function whenAcked(q, cb, tries) { if (!pending[q] || (tries || 0) > 40) return cb(); setTimeout(function () { whenAcked(q, cb, (tries || 0) + 1); }, 25); }
  function toast(t) { var el = $('toast'); el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { el.hidden = true; }, 3600); }
  var saveT = 0;
  function setParam(id, v, quiet) {
    var from = P[id]; P[id] = v; send({ t: 'p', k: id, v: v }); hNote(id, from, v);
    if (id === 'glass.guard' && v < .5 && !quiet) toast('Ear guard off: nail and chalk on glass can get painfully loud between 2 and 5 kHz. Keep headphone volume down.');
    if (ctl[id]) ctl[id](v);
    if (!quiet) { clearTimeout(saveT); saveT = setTimeout(function () { try { localStorage.setItem('horror-engine.params', JSON.stringify(P)); } catch (e) { } }, 500); }
    if (id.slice(-5) === '.mute' || id.slice(-5) === '.hold' || isOffId(id)) { rackState(); offBtn(); }
  }

  /* ---------- undo / redo: one timeline for knob, switch and preset changes and the looper ----------
     Knob drags, Defaults, Reset, presets, loaded files and share links are one step each; wheel, key and MIDI moves on
     the same control within 0.8 s merge. Looper changes are steps too: the audio thread counts its own undo points
     (telemetry "uc") and undoing one of those asks the looper to step back. */
  var hist = [], hpos = 0, hGrp = null, hMute = 0, ucSeen = -1;
  function hNote(id, from, to) {
    if (hMute || from === to || from === undefined) return;
    if (hGrp) { var c = hGrp.ch[id]; if (c) c[1] = to; else hGrp.ch[id] = [from, to]; return; }
    var now = Date.now(), e = hpos ? hist[hpos - 1] : null;
    if (e && e.auto === id && hpos === hist.length && now - e.t < 800) { e.ch[id][1] = to; e.t = now; if (e.ch[id][0] === to) { hist.splice(hpos - 1, 1); hpos--; } histBtns(); return; }
    var o = {}; o[id] = [from, to]; histPush({ k: 'p', ch: o, auto: id, t: now, label: DEF[id] ? DEF[id].label : id });
  }
  function histPush(e) { hist.length = hpos; hist.push(e); if (hist.length > 200) hist.shift(); hpos = hist.length; histBtns(); }
  function hBegin(label, extra) { if (hGrp) hEnd(); hGrp = { k: 'p', ch: {}, label: label, t: Date.now() }; if (extra) for (var k in extra) hGrp[k] = extra[k]; }
  function hEnd() {
    var g = hGrp; hGrp = null; if (!g) return null;
    for (var id in g.ch) if (g.ch[id][0] === g.ch[id][1]) delete g.ch[id];
    if (!Object.keys(g.ch).length) return null; histPush(g); return g;
  }
  function hName(e) { if (e.k === 'l') return 'a looper change'; var n = Object.keys(e.ch).length; return e.label + (e.auto || n < 2 ? '' : ' (' + n + ' settings)'); }
  function hApply(e, back) {
    if (e.k === 'l') { send({ t: 'loop', a: back ? 'undo' : 'redo' }); return; }
    hMute++; try { for (var id in e.ch) setParam(id, e.ch[id][back ? 0 : 1]); } finally { hMute--; }
    if (e.offDef) { offUndo = null; clearTimeout(offUndoT); offBtn(); }
  }
  function undo() { if (hGrp) hEnd(); if (!hpos) { toast('Nothing to undo.'); return; } var e = hist[--hpos]; hApply(e, true); histBtns(); toast('Undo: ' + hName(e)); }
  function redo() { if (hGrp) hEnd(); if (hpos >= hist.length) { toast('Nothing to redo.'); return; } var e = hist[hpos++]; hApply(e, false); histBtns(); toast('Redo: ' + hName(e)); }
  function histBtns() {
    var u = $('undo'), r = $('redo'); if (!u) return;
    u.disabled = !hpos; r.disabled = hpos >= hist.length;
    u.title = hpos ? 'Undo ' + hName(hist[hpos - 1]) + ' (Ctrl+Z)' : 'Nothing to undo (Ctrl+Z)';
    r.title = hpos < hist.length ? 'Redo ' + hName(hist[hpos]) + ' (Ctrl+Y)' : 'Nothing to redo (Ctrl+Y)';
  }
  // the looper's own undo points, counted by the audio thread
  function hLoop(uc) { if (typeof uc !== 'number') return; if (ucSeen < 0 || uc < ucSeen) { ucSeen = uc; return; } while (ucSeen < uc) { ucSeen++; histPush({ k: 'l' }); } }

  /* ---------- MIDI learn: right-click (or long-press) any knob, switch or selector ----------
     A learned CC (0-119, per channel) moves that control and wins over the fixed CC 20-23 macros and the CC 24-43
     moments on that channel. Channel 16 notes stay the moment keys: learning takes CCs only. One CC drives one control. */
  var MMAP = {}, learnId = null, learnT = 0, ctlEls = {};
  function mmLoad() { try { var o = JSON.parse(localStorage.getItem('horror-engine.midimap') || '{}'); for (var k in o) { var a = /^cc:(\d+):(\d+)$/.exec(k); if (a && +a[1] < 16 && +a[2] <= 119 && DEF[o[k]]) MMAP[k] = o[k]; } } catch (e) { MMAP = {}; } }
  function mmSave() { try { localStorage.setItem('horror-engine.midimap', JSON.stringify(MMAP)); } catch (e) { } }
  function mmKeyOf(id) { for (var k in MMAP) if (MMAP[k] === id) return k; return null; }
  function mmDesc(k) { var a = k.split(':'); return 'CC ' + a[2] + ', channel ' + (+a[1] + 1); }
  function mmMark() {
    for (var id in ctlEls) {
      var el = ctlEls[id]; if (!el.isConnected) { delete ctlEls[id]; continue; }
      var k = mmKeyOf(id); el.classList.toggle('mmapped', !!k); el.classList.toggle('mlearn', learnId === id);
      if (k) el.setAttribute('data-midi', mmDesc(k)); else el.removeAttribute('data-midi');
    }
  }
  function mmValue(id, v7) { var d = DEF[id], n = v7 / 127; if (d.en) return Math.round(n * (d.en.length - 1)); if (d.sw) return n >= .5 ? 1 : 0; return denorm(d, n); }
  function learnStart(id) {
    if (!navigator.requestMIDIAccess) { toast('This browser has no Web MIDI, so MIDI learn is not available here.'); return; }
    learnId = id; clearTimeout(learnT); learnT = setTimeout(learnStop, 30000); mmMark();
    var go = function () { midi(); toast('MIDI learn: move a knob, fader or button on your controller for ' + DEF[id].label + '. Esc cancels.'); };
    if (!started) start().then(go); else go();
  }
  function learnStop() { clearTimeout(learnT); var was = learnId; learnId = null; mmMark(); return was; }
  function learnGot(ch, cc) {
    var id = learnStop(); if (!id) return;
    var key = 'cc:' + ch + ':' + cc, old = mmKeyOf(id); if (old) delete MMAP[old];
    var prev = MMAP[key]; MMAP[key] = id; mmSave(); mmMark();
    var note = prev && prev !== id ? ' (it no longer moves ' + DEF[prev].label + ')' : cc >= 20 && cc <= 23 ? ' (instead of its macro on this channel)' : cc >= 24 && cc <= 43 ? ' (instead of moment ' + (cc - 23) + ' on this channel)' : '';
    toast(mmDesc(key) + ' now moves ' + DEF[id].label + note + '.');
  }
  function mmForget(id) { var k = mmKeyOf(id); if (k) { delete MMAP[k]; mmSave(); mmMark(); toast('Forgot ' + mmDesc(k) + ' for ' + DEF[id].label + '.'); } }
  function mmForgetAll() { var n = Object.keys(MMAP).length; MMAP = {}; mmSave(); mmMark(); toast('Forgot ' + n + ' MIDI mapping' + (n === 1 ? '' : 's') + '.'); }
  var cmenu = null;
  function menuClose() { if (cmenu) { cmenu.remove(); cmenu = null; } }
  function menuOpen(id, x, y) {
    menuClose(); var d = DEF[id], k = mmKeyOf(id), n = Object.keys(MMAP).length;
    var m = document.createElement('div'); m.className = 'ctxmenu'; m.setAttribute('role', 'menu'); m.setAttribute('aria-label', d.label);
    var h = document.createElement('p'); h.textContent = d.label + (k ? ' \u00B7 ' + mmDesc(k) : ''); m.appendChild(h);
    var item = function (t, fn, dis) { var b = document.createElement('button'); b.className = 'btn sm'; b.setAttribute('role', 'menuitem'); b.textContent = t; b.disabled = !!dis; b.addEventListener('click', function () { menuClose(); fn(); }); m.appendChild(b); return b; };
    if (learnId === id) item('Cancel MIDI learn', learnStop); else item('MIDI learn\u2026', function () { learnStart(id); }, !navigator.requestMIDIAccess);
    if (k) item('Forget ' + mmDesc(k), function () { mmForget(id); });
    item('Reset to default (' + fmt(d, d.def) + ')', function () { setParam(id, d.def); }, P[id] === d.def);
    if (n) item('Forget all MIDI learn (' + n + ')', mmForgetAll);
    document.body.appendChild(m); cmenu = m;
    var r = m.getBoundingClientRect(); m.style.left = Math.max(4, Math.min(x, innerWidth - r.width - 4)) + 'px'; m.style.top = Math.max(4, Math.min(y, innerHeight - r.height - 4)) + 'px';
    var f = m.querySelector('button:not(:disabled)'); if (f) f.focus();
  }
  document.addEventListener('pointerdown', function (e) { if (cmenu && !cmenu.contains(e.target)) menuClose(); }, true);
  window.addEventListener('blur', menuClose); window.addEventListener('resize', menuClose); document.addEventListener('scroll', menuClose, true);
  function learnable(el, id) {
    ctlEls[id] = el;
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); e.stopPropagation(); menuOpen(id, e.clientX, e.clientY); });
    var lp = 0, lx = 0, ly = 0;
    el.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'touch') return; lx = e.clientX; ly = e.clientY; clearTimeout(lp); lp = setTimeout(function () { try { el.releasePointerCapture(e.pointerId); } catch (x) { } if (hGrp) hEnd(); menuOpen(id, lx, ly); }, 650); });
    el.addEventListener('pointermove', function (e) { if (lp && Math.hypot(e.clientX - lx, e.clientY - ly) > 10) { clearTimeout(lp); lp = 0; } });
    ['pointerup', 'pointercancel'].forEach(function (t) { el.addEventListener(t, function () { clearTimeout(lp); lp = 0; }); });
    var k = mmKeyOf(id); if (k) { el.classList.add('mmapped'); el.setAttribute('data-midi', mmDesc(k)); }
  }

  /* ---------- controls ---------- */
  function norm(d, v) { return d.exp ? Math.log(v / d.min) / Math.log(d.max / d.min) : (v - d.min) / (d.max - d.min); }
  function denorm(d, n) { n = Math.min(1, Math.max(0, n)); var v = d.exp ? d.min * Math.pow(d.max / d.min, n) : d.min + (d.max - d.min) * n; return d.int ? Math.round(v) : v; }
  function fmt(d, v) {
    var u = d.unit || '';
    if (d.int) return String(v);
    if (u === 'dB') return (v <= -59.5 ? '-∞' : (v > 0 ? '+' : '') + v.toFixed(1)) + ' dB';
    if (u === 'Hz') return (v < 100 ? v.toFixed(1) : Math.round(v)) + ' Hz';
    if (u === 'ms') return Math.round(v) + ' ms';
    if (u === 's') return v.toFixed(v < 10 ? 2 : 1) + ' s';
    if (u === 'st') return (v > 0 ? '+' : '') + (d.int ? String(v) : v.toFixed(1)) + ' st';
    if (u === 'x') return v.toFixed(2) + '×';
    if (u === 'oct') return v.toFixed(1) + ' oct';
    if (u === 'cm') return v.toFixed(1) + ' cm';
    if (u === 'c') return (v > 0 ? '+' : '') + Math.round(v) + ' c';
    if (u === '%') return (v > 0 ? '+' : '') + Math.round(v * 100) + '%';
    if (u === 'rev/s') return v.toFixed(2) + ' /s';
    if (d.bi) return (v > 0 ? '+' : '') + v.toFixed(2);
    return Math.round(v * 100) + '%';
  }
  function knob(id, big, sub) {
    var d = DEF[id], el = document.createElement('div');
    el.className = 'knob' + (big ? ' big' : ''); el.tabIndex = 0; el.setAttribute('role', 'slider'); el.setAttribute('aria-label', d.label);
    el.title = d.label + ': ' + fmt(d, d.min) + ' to ' + fmt(d, d.max) + ', default ' + fmt(d, d.def) + '. Double-click to reset.';
    el.innerHTML = '<div class="dial"><i></i></div><span></span><output></output>' + (sub ? '<small></small>' : '');
    el.children[1].textContent = d.label; if (sub) el.children[3].textContent = sub;
    var dial = el.firstChild, out = el.children[2];
    function show(v) { var n = norm(d, v); dial.style.setProperty('--v', n.toFixed(4)); out.textContent = fmt(d, v); el.setAttribute('aria-valuenow', v.toFixed(3)); el.setAttribute('aria-valuetext', fmt(d, v)); }
    el.setAttribute('aria-valuemin', d.min); el.setAttribute('aria-valuemax', d.max);
    ctl[id] = show; show(P[id]);
    var sy = 0, sn = 0;
    el.addEventListener('pointerdown', function (e) { if (e.button > 0) return; el.setPointerCapture(e.pointerId); sy = e.clientY; sn = norm(d, P[id]); el.focus(); e.preventDefault(); hBegin(d.label); });
    el.addEventListener('pointermove', function (e) { if (!el.hasPointerCapture(e.pointerId)) return; var n = sn + (sy - e.clientY) / (e.shiftKey ? 900 : 170); setParam(id, denorm(d, n)); });
    el.addEventListener('lostpointercapture', function () { if (hGrp) hEnd(); });
    el.addEventListener('dblclick', function () { setParam(id, d.def); });
    el.addEventListener('wheel', function (e) { e.preventDefault(); setParam(id, denorm(d, norm(d, P[id]) - Math.sign(e.deltaY) * (e.shiftKey ? .005 : .025))); }, { passive: false });
    el.addEventListener('keydown', function (e) {
      var st = e.shiftKey ? .005 : .025, n = norm(d, P[id]);
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') n += st; else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') n -= st; else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = 1; else if (e.key === 'Delete') { setParam(id, d.def); return; } else return;
      e.preventDefault(); e.stopPropagation(); setParam(id, denorm(d, n));
    });
    el.title += ' Right-click for MIDI learn.';
    learnable(el, id);
    return el;
  }
  function toggle(id, label, cls) {
    var b = document.createElement('button'); b.className = 'btn sm ' + (cls || ''); b.textContent = label || DEF[id].label;
    ctl[id] = function (v) { b.setAttribute('aria-pressed', v > .5 ? 'true' : 'false'); }; ctl[id](P[id]);
    b.addEventListener('click', function () { setParam(id, P[id] > .5 ? 0 : 1); });
    learnable(b, id);
    return b;
  }
  function segment(id) {
    var d = DEF[id], f = document.createElement('div'); f.className = 'seg'; f.setAttribute('role', 'group'); f.setAttribute('aria-label', d.label);
    var l = document.createElement('span'); l.className = 'seglab'; l.textContent = d.label; f.appendChild(l);
    var bs = d.en.map(function (name, i) { var b = document.createElement('button'); b.className = 'btn sm'; b.textContent = name; b.addEventListener('click', function () { setParam(id, i); }); f.appendChild(b); return b; });
    ctl[id] = function (v) { bs.forEach(function (b, i) { b.setAttribute('aria-pressed', i === (v | 0) ? 'true' : 'false'); }); }; ctl[id](P[id]);
    learnable(f, id);
    return f;
  }
  function knobRow(ids) { var r = document.createElement('div'); r.className = 'knobs'; ids.forEach(function (id) { r.appendChild(knob(id)); }); return r; }

  /* ---------- rack & voice panel ---------- */
  var rackEls = [];
  var OFF_KEYS = ['tune', 'cents', 'matOff', 'distOff'];
  function isOffId(id) { var d = id.indexOf('.'), s = id.slice(0, d), k = id.slice(d + 1); return HE_SOURCES.indexOf(s) >= 0 && OFF_KEYS.indexOf(k) >= 0; }
  function offDirty(k) { return OFF_KEYS.some(function (q) { return P[k + '.' + q] !== DEF[k + '.' + q].def; }); }
  function offSnap() { var o = {}; HE_SOURCES.forEach(function (k) { OFF_KEYS.forEach(function (q) { o[k + '.' + q] = P[k + '.' + q]; }); }); return o; }
  var offUndo = null, offUndoT = 0, offGrp = null;
  function offBtn() {
    var b = $('offReset'); if (!b) return;
    if (offUndo) { b.textContent = 'Undo'; b.disabled = false; b.removeAttribute('data-sure'); b.title = 'Restore the instrument offsets from just before Defaults'; return; }
    b.textContent = 'Defaults'; b.removeAttribute('data-sure');
    var any = HE_SOURCES.some(offDirty);
    b.disabled = !any;
    b.title = any ? 'Reset every instrument\'s tune, material and distance to zero' : 'Every instrument is already at its default tune, material and distance';
  }
  function resetOff(k) {
    hBegin('Reset ' + SRC[HE_SOURCES.indexOf(k)].n + ' Tune & place');
    OFF_KEYS.forEach(function (q) { setParam(k + '.' + q, DEF[k + '.' + q].def); });
    hEnd();
    toast('Tune, material and distance for this instrument are back to zero (Ctrl+Z undoes it).');
  }
  function offDefaults() {
    var b = $('offReset');
    if (offUndo) {
      clearTimeout(offUndoT); var snap = offUndo; offUndo = null;
      // the Defaults step is still the newest one: step back through the timeline; otherwise put the offsets back as a new step
      if (hpos && hist[hpos - 1] === offGrp) { undo(); offBtn(); return; }
      hBegin('Restore instrument offsets'); for (var id in snap) setParam(id, snap[id]); hEnd(); toast('Instrument offsets restored.'); offBtn(); return;
    }
    if (!HE_SOURCES.some(offDirty)) return;
    if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = 'Sure?'; b.title = 'Click again to reset every instrument\'s tune, material and distance'; return; }
    offUndo = offSnap();
    hBegin('Defaults (every instrument\'s Tune & place)', { offDef: true });
    HE_SOURCES.forEach(function (k) { OFF_KEYS.forEach(function (q) { setParam(k + '.' + q, DEF[k + '.' + q].def); }); });
    offGrp = hEnd();
    toast('All instrument offsets are back to zero. Press Undo on Defaults (or Ctrl+Z) if that went too far.');
    offUndoT = setTimeout(function () { offUndo = null; offBtn(); }, 8000);
  }
  function buildRack() {
    var ol = $('rack');
    SRC.forEach(function (s, i) {
      var li = document.createElement('li'), b = document.createElement('button'); b.className = 'src';
      b.innerHTML = '<em></em><span><strong></strong><small></small></span><i class="odot" title=""></i><u></u>';
      b.querySelector('em').textContent = ROMAN[i]; b.querySelector('strong').textContent = s.n;
      b.addEventListener('click', function () { select(i); });
      li.appendChild(b); ol.appendChild(li); rackEls.push(b);
    });
  }
  function rackState() {
    rackEls.forEach(function (b, i) {
      var k = HE_SOURCES[i], m = P[k + '.mute'] > .5, h = P[k + '.hold'] > .5, dirty = offDirty(k);
      b.classList.toggle('muted', m); b.classList.toggle('offset', dirty);
      b.querySelector('small').textContent = m ? 'Muted' : h ? 'Holding' : '';
      var dot = b.querySelector('.odot'); if (dot) dot.title = dirty ? 'This instrument has a tune, material or distance offset' : '';
    });
    offBtn();
  }
  function select(i) {
    if (i !== sel) releaseAll();
    sel = i; var k = HE_SOURCES[i], s = SRC[i], v = $('voice');
    rackEls.forEach(function (b, j) { b.setAttribute('aria-current', j === i ? 'true' : 'false'); });
    HE_PARAMS.forEach(function (p) { if (HE_SOURCES.indexOf(p.id.split('.')[0]) >= 0) delete ctl[p.id]; });
    v.textContent = '';
    var h2 = document.createElement('h2'); h2.innerHTML = '<span></span>'; h2.firstChild.textContent = 'Voice ' + ROMAN[i]; v.appendChild(h2);
    var head = document.createElement('div'); head.className = 'voicehead';
    var h3 = document.createElement('h3'); h3.textContent = s.n; var p = document.createElement('p'); p.textContent = s.d;
    var tg = document.createElement('div'); tg.className = 'tg';
    if (i === 7) tg.appendChild(toggle('aura.freeze', 'Freeze'));
    tg.appendChild(toggle(k + '.hold', 'Hold')); tg.appendChild(toggle(k + '.mute', 'Mute'));
    head.appendChild(h3); head.appendChild(p); head.appendChild(tg); v.appendChild(head);
    var g = document.createElement('div'); g.className = 'vgrid'; var a = document.createElement('div'), c = document.createElement('div');
    var own = HE_PARAMS.filter(function (q) { return q.id.indexOf(k + '.') === 0 && !q.grp && !q.off && !(q.sw && (q.label === 'Hold' || q.label === 'Mute' || q.label === 'Freeze')); });
    var h4 = document.createElement('h4'); h4.textContent = 'The model'; a.appendChild(h4);
    // selectors on one line, then the model's knobs with the shared water beside them when there is room
    var segs = document.createElement('div'); segs.className = 'segs'; a.appendChild(segs);
    own.filter(function (q) { return q.en; }).forEach(function (q) { segs.appendChild(segment(q.id)); });
    var mrow = document.createElement('div'); mrow.className = 'mrow'; a.appendChild(mrow);
    mrow.appendChild(knobRow(own.filter(function (q) { return !q.en && !q.sw; }).map(function (q) { return q.id; })));
    own.filter(function (q) { return q.sw; }).forEach(function (q) { var w = document.createElement('div'); w.className = 'sub'; w.appendChild(toggle(q.id)); a.appendChild(w); });
    // bowed and struck metal and the superball's steel sheet can sit in water (the waterphone)
    if (i === 2 || i === 4 || i === 8) { var wd = document.createElement('div'); wd.className = 'water'; var wh = document.createElement('h4'); wh.className = 'sub'; wh.textContent = 'Water (shared)'; wd.appendChild(wh); wd.appendChild(knobRow(['water.level', 'water.tilt', 'water.amt', 'water.slosh'])); mrow.appendChild(wd); }
    h4 = document.createElement('h4'); h4.textContent = 'Channel'; c.appendChild(h4);
    c.appendChild(knobRow(HE_PARAMS.filter(function (q) { return q.id.indexOf(k + '.') === 0 && q.grp; }).map(function (q) { return q.id; })));
    // Tune & place sits under Channel, in the right-hand column, so the panel is only as tall as its knobs
    var off = document.createElement('div'); off.className = 'offsets';
    off.title = 'Adds on top of the Macros, for this instrument only. Tune it, or sit it closer, further, woodier or glassier, without moving the whole machine.';
    var oh = document.createElement('h4'); oh.className = 'sub'; oh.innerHTML = 'Tune &amp; place <small>on top of the Macros, this voice only</small>';
    off.appendChild(oh);
    var orow = knobRow([k + '.tune', k + '.cents', k + '.matOff', k + '.distOff']);
    var rb = document.createElement('button'); rb.className = 'btn sm offrst'; rb.textContent = 'Reset';
    rb.title = 'Set this instrument\'s tune, material and distance back to zero';
    rb.addEventListener('click', function () { resetOff(k); });
    orow.appendChild(rb); off.appendChild(orow); c.appendChild(off);
    g.appendChild(a); g.appendChild(c); v.appendChild(g);
    $('hn').textContent = s.h; $('hx').textContent = s.x ? '↔ ' + s.x : ''; $('hy').textContent = s.y ? '↕ ' + s.y : '';
    junkFlag();
    rackState();
  }

  /* ---------- audio ---------- */
  function start() {
    if (started) { if (ctx.state === 'suspended') ctx.resume(); return Promise.resolve(); }
    started = true;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { toast('This browser has no Web Audio.'); return Promise.resolve(); }
    ctx = new AC({ latencyHint: 'interactive' });
    analyser = ctx.createAnalyser(); analyser.fftSize = 2048; analyser.connect(ctx.destination);
    // your own sound in (mic, line or a file): one stereo bus into the engine; nothing is connected until you choose a source
    inBus = ctx.createGain ? ctx.createGain() : { connect: function () { } }; inBus.channelCount = 2; inBus.channelCountMode = 'explicit';
    var code = 'var HE_CORE=(' + HECoreFactory.toString() + ')();class HEProc extends AudioWorkletProcessor{constructor(){super();var s=this;this.h=new HE_CORE.Host(sampleRate,function(m,t){s.port.postMessage(m,t||[])},{retro:' + RETRO_RING + '});this.port.onmessage=function(e){if(e.data.t==="junk")s.h.wantJunk=e.data.v;else s.h.msg(e.data)}}process(i,o){var c=o[0],L=c[0],R=c[1]||c[0],a=i[0],IL=a&&a[0],IR=a&&(a[1]||a[0]);for(var f=0;f+128<=L.length;f+=128)this.h.block(L,R,f,IL,IR);return true}}registerProcessor("horror-engine",HEProc)';
    var ready, mk = function () {
      node = new AudioWorkletNode(ctx, 'horror-engine', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2], channelCount: 2, channelCountMode: 'explicit', channelInterpretation: 'speakers' });
      node.port.onmessage = function (e) { onMsg(e.data); }; node.connect(analyser); inBus.connect(node);
    };
    try {
      // Chrome/Edge refuse Blob-URL worklets on file:// (the page origin is opaque, so blob:null is cross-origin),
      // but accept a data: URL. Over http(s) a Blob URL is the normal path. Each path falls back to the other.
      var blobU = function () { return ctx.audioWorklet.addModule(URL.createObjectURL(new Blob([code], { type: 'text/javascript' }))); };
      var dataU = function () { return ctx.audioWorklet.addModule('data:text/javascript;charset=utf-8,' + encodeURIComponent(code)); };
      var first = location.protocol === 'file:' ? dataU : blobU, second = first === dataU ? blobU : dataU;
      ready = first().catch(second).then(mk);
    } catch (e) { ready = Promise.reject(e); }
    return ready.catch(function () {
      // fallback: run the same engine on the main thread
      core = HECoreFactory(); host = new core.Host(ctx.sampleRate, function (m) { onMsg(m); }, { retro: RETRO_RING });
      var sp = ctx.createScriptProcessor(2048, 2, 2);
      sp.onaudioprocess = function (e) { var L = e.outputBuffer.getChannelData(0), R = e.outputBuffer.getChannelData(1), ib = e.inputBuffer, IL = ib && ib.numberOfChannels ? ib.getChannelData(0) : null, IR = IL && ib.numberOfChannels > 1 ? ib.getChannelData(1) : IL; for (var f = 0; f + 128 <= L.length; f += 128) host.block(L, R, f, IL, IR); };
      sp.connect(analyser); inBus.connect(sp); node = null; host._sp = sp;
    }).then(function () {
      send({ t: 'init', params: P, seed: 1337 }); junkFlag(); CMS.forEach(cmSend);
      $('wake').hidden = true; $('power').textContent = 'Audio on'; $('power').classList.add('live');
      $('status').textContent = 'Running at ' + ctx.sampleRate + ' Hz' + (host ? ' (compatibility mode)' : '') + ', about ' + Math.round(((ctx.baseLatency || 0) + (ctx.outputLatency || 0)) * 1000) + ' ms output latency';
      if (ctx.state === 'suspended') ctx.resume();
      midi(); cpTimer = setInterval(cpTake, CP_EVERY * 1000);
    });
  }

  /* ---------- telemetry ---------- */
  var layerIds = '', tm = null, junk = null, srcPk = HE_SOURCES.map(function () { return 0; });
  function dbn(x) { return Math.min(1, Math.max(0, (20 * Math.log10(x + 1e-6) + 54) / 54)); }
  function onMsg(m) {
    if (m.ap) acks(m.ap);
    if (m.t === 'chunk') return recChunk(m);
    if (m.t === 'cmrec') return cmCaptured(m);
    if (m.t === 'retro') return retroChunk(m);
    if (m.t === 'lsnap') return cpReply(m);
    if (m.t !== 'tm') return;
    tm = m; if (m.jp) junk = m.jp;
    hLoop(m.uc);
    if (inp.on) { inPk = Math.max(m.inp || 0, inPk * .8); var im = $('inMeter'); if (im) sty(im, 'transform', 'scaleX(' + dbn(inPk).toFixed(2) + ')'); }
    // DOM writes only when a value really changes (each write costs a style pass on a big page)
    sty($('mL'), 'transform', 'scaleX(' + dbn(m.pk[0]).toFixed(2) + ')'); sty($('mR'), 'transform', 'scaleX(' + dbn(m.pk[1]).toFixed(2) + ')');
    sty($('mG'), 'transform', 'scaleX(' + Math.min(1, (1 - m.gr) * 2).toFixed(2) + ')');
    for (var i = 0; i < HE_SOURCES.length; i++) { srcPk[i] = Math.max(m.sp[i], srcPk[i] * .8); var u = rackEls[i].lastChild, a = dbn(srcPk[i]); sty(u, 'background', a > .05 ? 'rgba(239,220,166,' + (.25 + a * .75).toFixed(2) + ')' : ''); }
    var ids = m.ly.map(function (l) { return l.id + ':' + l.src + ':' + (l.mute ? 1 : 0) + (l.ghost ? 1 : 0); }).join(',');
    if (ids !== layerIds) { layerIds = ids; drawLayers(m.ly); }
    m.ly.forEach(function (l) { var el = document.getElementById('lp' + l.id); if (el) sty(el, 'transform', 'scaleX(' + l.pos.toFixed(3) + ')'); });
    if (recShown !== !!m.rec) { recShown = !!m.rec; $('loopRec').setAttribute('aria-pressed', m.rec ? 'true' : 'false'); $('loopRec').innerHTML = m.rec ? '&#9632; Close the loop' : '&#9679; Loop a gesture'; }
    MOMENTS.forEach(function (mo) { var b = $('mo_' + mo[0]), v = m.mom[mo[0]], on = mo[0] === 'riser' ? v >= 0 : !!v; att(b, 'aria-pressed', on ? 'true' : 'false'); if (mo[0] === 'riser') sty(b.lastChild, 'width', (v >= 0 ? (v * 100).toFixed(1) : 0) + '%'); });
    cmTele(m.mom);
  }
  var recShown = null;
  function sty(el, k, v) { var c = el.__hs || (el.__hs = {}); if (c[k] !== v) { c[k] = v; el.style[k] = v; } }
  function att(el, k, v) { var c = el.__ha || (el.__ha = {}); if (c[k] !== v) { c[k] = v; el.setAttribute(k, v); } }
  function drawLayers(ly) {
    var ul = $('layers'); ul.textContent = '';
    if (!ly.length) { var e = document.createElement('li'); e.className = 'empty'; e.textContent = 'No layers yet. Press Space, play a phrase on the surface, press Space again.'; ul.appendChild(e); return; }
    ly.forEach(function (l, i) {
      var li = document.createElement('li'), em = document.createElement('em'); em.textContent = ROMAN[i] || i + 1;
      var s = document.createElement('select'); s.setAttribute('aria-label', 'Voice for this layer'); s.id = 'ls' + l.id;
      SRC.forEach(function (sr, j) { var o = document.createElement('option'); o.value = j; o.textContent = sr.n; s.appendChild(o); }); s.value = l.src;
      s.addEventListener('change', function () { send({ t: 'loop', a: 'src', id: l.id, v: +s.value }); });
      var pr = document.createElement('div'); pr.className = 'prog'; pr.innerHTML = '<i id="lp' + l.id + '"></i>';
      var ac = document.createElement('div'); ac.className = 'acts';
      var len = document.createElement('span'); len.className = 'len'; len.textContent = l.len.toFixed(1) + ' s';
      function tb(label, key, on, title) { var b = document.createElement('button'); b.className = 'btn sm'; b.textContent = label; b.title = title; b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.addEventListener('click', function () { send({ t: 'loop', a: key, id: l.id, v: !on }); }); return b; }
      var del = document.createElement('button'); del.className = 'btn sm'; del.textContent = 'Remove'; del.addEventListener('click', function () { send({ t: 'loop', a: 'del', id: l.id }); });
      ac.appendChild(len); ac.appendChild(tb('Ghost', 'ghost', l.ghost, 'Let a ghost player improvise with the strokes in this layer')); ac.appendChild(tb('Mute', 'mute', l.mute, 'Mute this layer')); ac.appendChild(del);
      li.appendChild(em); li.appendChild(s); li.appendChild(pr); li.appendChild(ac); ul.appendChild(li);
    });
  }

  /* ---------- gesture pad ---------- */
  var pad = $('pad'), g2 = pad.getContext('2d'), pw = 0, ph = 0, dpr = 1, down = false, pid = -1, cur = { x: .5, y: .5, p: .6 }, trail = [], lastSend = 0;
  function resize() { dpr = Math.min(2, window.devicePixelRatio || 1); var r = pad.getBoundingClientRect(); pw = r.width; ph = r.height; pad.width = Math.round(pw * dpr); pad.height = Math.round(ph * dpr); }
  function pressure(e) { if (e.pointerType === 'pen' && e.pressure > 0) return e.pressure; if (e.pointerType === 'touch' && e.pressure > 0 && e.pressure !== .5) return e.pressure; return e.shiftKey ? 1 : e.altKey ? .3 : basePr; }
  function pt(e) { var r = pad.getBoundingClientRect(); cur.x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)); cur.y = Math.min(1, Math.max(0, 1 - (e.clientY - r.top) / r.height)); cur.p = pressure(e); }
  var machineOn = false;
  function junkFlag() { send({ t: 'junk', v: sel === 6 || machineOn }); }
  function showPr() { $('hp').textContent = 'Pressure ' + Math.round((down ? cur.p : basePr) * 100) + '%'; }
  pad.addEventListener('pointerdown', function (e) {
    if (down) return; e.preventDefault();
    var go = function () { pad.setPointerCapture(e.pointerId); pid = e.pointerId; down = true; pt(e); trail.length = 0; send({ t: 'g', s: sel, k: 'd', x: cur.x, y: cur.y, p: cur.p, hz: 0 }); showPr(); };
    if (!started || !node && !host) start().then(go); else go();
  });
  pad.addEventListener('pointermove', function (e) {
    if (!down || e.pointerId !== pid) return; pt(e);
    var now = performance.now(); trail.push({ x: cur.x, y: cur.y, t: now }); if (trail.length > 90) trail.shift();
    if (now - lastSend > 6) { lastSend = now; send({ t: 'g', s: sel, k: 'n', x: cur.x, y: cur.y, p: cur.p, hz: 0 }); showPr(); }
  });
  function padUp(e) { if (!down || e.pointerId !== pid) return; down = false; send({ t: 'g', s: sel, k: 'u' }); showPr(); }
  pad.addEventListener('pointerup', padUp); pad.addEventListener('pointercancel', padUp); pad.addEventListener('lostpointercapture', padUp);
  pad.addEventListener('wheel', function (e) { e.preventDefault(); basePr = Math.min(1, Math.max(.05, basePr - Math.sign(e.deltaY) * .05)); if (down) { cur.p = basePr; send({ t: 'g', s: sel, k: 'n', x: cur.x, y: cur.y, p: cur.p, hz: 0 }); } showPr(); }, { passive: false });
  pad.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function draw() {
    requestAnimationFrame(draw);
    if (!pw || machineOn) return;   // the pad is hidden while the Machine shows
    var W = pad.width, H = pad.height, c = g2, cx = W / 2, cy = H * 1.02, i;
    c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#0d1312'; c.fillRect(0, 0, W, H);
    // sunburst
    var lvl = tm ? Math.max(tm.pk[0], tm.pk[1]) : 0, glow = still ? .12 : .08 + Math.min(.3, lvl * .5);
    c.lineWidth = dpr; var R = Math.hypot(W, H);
    for (i = 0; i <= 24; i++) { var a = Math.PI + i * Math.PI / 24; c.strokeStyle = 'rgba(200,163,90,' + (i % 4 === 0 ? glow * 1.6 : glow * .7).toFixed(3) + ')'; c.beginPath(); c.moveTo(cx + Math.cos(a) * H * .16, cy + Math.sin(a) * H * .16); c.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); c.stroke(); }
    for (i = 1; i <= 5; i++) { c.strokeStyle = 'rgba(200,163,90,' + (glow * (i === 1 ? 2.2 : .8)).toFixed(3) + ')'; c.beginPath(); c.arc(cx, cy, H * (.16 + (i - 1) * .22), Math.PI, 2 * Math.PI); c.stroke(); }
    // scope
    if (analyser && !still) {
      analyser.getFloatTimeDomainData(scope); c.strokeStyle = 'rgba(79,164,141,.75)'; c.lineWidth = 1.5 * dpr; c.beginPath();
      for (i = 0; i < 1024; i += 2) { var x = i / 1022 * W, y = H * .5 - scope[i] * H * .42; if (i) c.lineTo(x, y); else c.moveTo(x, y); }
      c.stroke();
    }
    // junk tray pieces
    if (sel === 6 && junk) {
      var n = (junk.length - 3) / 3;
      for (i = 0; i < n; i++) { c.strokeStyle = i % 3 ? 'rgba(238,229,207,.75)' : 'rgba(200,163,90,.9)'; c.lineWidth = 1.5 * dpr; c.beginPath(); c.arc(junk[i * 3] * W, (1 - junk[i * 3 + 1]) * H, Math.max(2.5 * dpr, junk[i * 3 + 2] * Math.min(W, H) * .8), 0, 6.283); c.stroke(); }
    }
    // gesture trail and contact
    var now = performance.now();
    if (trail.length > 1) {
      c.lineCap = 'round';
      for (i = 1; i < trail.length; i++) { var age = (now - trail[i].t) / 700; if (age > 1) continue; c.strokeStyle = 'rgba(239,220,166,' + (1 - age).toFixed(2) + ')'; c.lineWidth = (1 + 5 * (1 - age)) * dpr; c.beginPath(); c.moveTo(trail[i - 1].x * W, (1 - trail[i - 1].y) * H); c.lineTo(trail[i].x * W, (1 - trail[i].y) * H); c.stroke(); }
    }
    if (down) { var px = cur.x * W, py = (1 - cur.y) * H; c.strokeStyle = '#efdca6'; c.lineWidth = 2 * dpr; c.beginPath(); c.arc(px, py, (8 + cur.p * 22) * dpr, 0, 6.283); c.stroke(); c.fillStyle = '#c8a35a'; c.beginPath(); c.moveTo(px, py - 5 * dpr); c.lineTo(px + 5 * dpr, py); c.lineTo(px, py + 5 * dpr); c.lineTo(px - 5 * dpr, py); c.fill(); }
  }

  /* ---------- keyboard & MIDI ---------- */
  // R is Record, so the upper row is q w e t y u i o p (chromatic, one note shorter than the lower row)
  var ROW1 = 'zxcvbnm,./', ROW2 = 'qwetyuiop', held = [];
  function noteHz(semi) { return 55 * Math.pow(2, octave + semi / 12); }
  function noteOn(tag, hz, vel) {
    var go = function () { held = held.filter(function (h) { return h.tag !== tag; }); held.push({ tag: tag, hz: hz }); send({ t: 'g', s: sel, k: 'd', x: .5, y: .5, p: vel, hz: hz }); };
    if (!started) start().then(go); else go();
  }
  function noteOff(tag) {
    var was = held.length; held = held.filter(function (h) { return h.tag !== tag; });
    if (was && !held.length) send({ t: 'g', s: sel, k: 'u' });
    else if (held.length && was !== held.length && sel !== 4) { var h = held[held.length - 1]; send({ t: 'g', s: sel, k: 'd', x: .5, y: .5, p: .7, hz: h.hz }); }
  }
  function releaseAll() { if (held.length || down) send({ t: 'g', s: sel, k: 'u' }); held = []; down = false; }
  // text fields keep their keys; checkboxes, sliders and buttons do not (Space must never toggle a focused control)
  function typing(e) { var t = e.target, n = t && t.tagName, ty = t && t.type; return (n === 'INPUT' && ty !== 'checkbox' && ty !== 'range' && ty !== 'button') || n === 'SELECT' || n === 'TEXTAREA'; }
  function cmPlaying(id) { return !!(tm && tm.mom && tm.mom.c && tm.mom.c.some(function (c) { return c[0] === id; })); }
  function momentToggle(id) { var go = function () { var on = id.indexOf('c:') === 0 ? cmPlaying(id.slice(2)) : tm && tm.mom && (id === 'riser' ? tm.mom.riser >= 0 : tm.mom[id]); send({ t: 'moment', id: id, on: !on }); }; if (!started) start().then(go); else go(); }
  // moment n (0-based): the five built-in ones, then your own in panel order
  function momentN(n) { if (n < MOMENTS.length) momentToggle(MOMENTS[n][0]); else if (CMS[n - MOMENTS.length]) momentToggle('c:' + CMS[n - MOMENTS.length].id); }
  document.addEventListener('keydown', function (e) {
    if (typing(e) || $('about').open) return;
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === 'Escape' && (learnId || cmenu)) { e.preventDefault(); if (cmenu) menuClose(); else { learnStop(); toast('MIDI learn cancelled.'); } return; }
    if ((e.ctrlKey || e.metaKey) && !e.altKey) {
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); redo(); }
      return;
    }
    if (k === 'r' && e.shiftKey && !e.altKey) { e.preventDefault(); if (!e.repeat) retroSave(); return; }
    if (k === ' ') { e.preventDefault(); var ae = document.activeElement; if (ae && ae !== document.body && ae.blur) ae.blur(); if (!e.repeat) loopToggle(); return; }
    var fm = /^F([1-9]|1[0-2])$/.exec(e.key);
    if (fm && !e.shiftKey && !e.altKey) { e.preventDefault(); if (!e.repeat) momentN(+fm[1] - 1); return; }
    if (e.repeat) return;
    if (k >= '1' && k <= '9') return select(+k - 1);
    var i = ROW1.indexOf(k), j = ROW2.indexOf(k);
    if (i >= 0 || j >= 0) { e.preventDefault(); return noteOn('k' + k, noteHz(i >= 0 ? i : 12 + j), e.shiftKey ? 1 : e.altKey ? .35 : .75); }
    if (k === '[') { octave = Math.max(-2, octave - 1); toast('Octave ' + octave); }
    else if (k === ']') { octave = Math.min(4, octave + 1); toast('Octave +' + octave); }
    else if (k === 'h') setParam(HE_SOURCES[sel] + '.hold', P[HE_SOURCES[sel] + '.hold'] > .5 ? 0 : 1);
    else if (k === 'f') setParam('aura.freeze', P['aura.freeze'] > .5 ? 0 : 1);
    else if (k === 'r') recToggle();
    else if (k === 'Escape') panic();
    else if (k === 'g' && tm && tm.ly.length) { var nl = tm.ly[tm.ly.length - 1]; send({ t: 'loop', a: 'ghost', id: nl.id, v: !nl.ghost }); toast(nl.ghost ? 'Ghost off: layer plays as recorded' : 'Ghost on: the newest layer improvises from its own strokes'); }
    else if (k === 'Backspace' && tm && tm.ly.length) { e.preventDefault(); send({ t: 'loop', a: 'del', id: tm.ly[tm.ly.length - 1].id }); }
  });
  // a focused button fires on Space keyup; swallow it so Space only ever means "loop"
  document.addEventListener('keyup', function (e) { var k = e.key.length === 1 ? e.key.toLowerCase() : e.key; if (k === ' ' && !typing(e)) e.preventDefault(); noteOff('k' + k); });
  // mouse clicks should not leave buttons focused (keyboard users keep focus: detail is 0 for keyboard activation)
  document.addEventListener('click', function (e) { var b = e.target && e.target.closest && e.target.closest('button'); if (b && e.detail > 0) b.blur(); });
  window.addEventListener('blur', releaseAll);
  function midi() {
    if (!navigator.requestMIDIAccess) return;
    try {
      navigator.requestMIDIAccess().then(function (acc) {
        var hook = function () { acc.inputs.forEach(function (inp) { inp.onmidimessage = onMidi; }); }; hook(); acc.onstatechange = hook;
      }, function () { });
    } catch (e) { }
  }
  var MCC = { 20: 'macro.dread', 21: 'macro.distance', 22: 'macro.material', 23: 'macro.pitch' };
  // moments over MIDI: notes on channel 16 from C2 (36) fire moment 1, 2, 3...; CC 24-43 on any channel fire them on a rise past 64
  var midiCC = {};
  function onMidi(e) {
    var d = e.data, st = d[0] & 240;
    // MIDI learn and learned CCs come first (CC 120-127 are channel-mode messages, never learned)
    if (st === 176 && d[1] <= 119) {
      if (learnId) { learnGot(d[0] & 15, d[1]); return; }
      var mid = MMAP['cc:' + (d[0] & 15) + ':' + d[1]]; if (mid) { setParam(mid, mmValue(mid, d[2])); return; }
    }
    if ((d[0] & 15) === 15 && (st === 144 || st === 128)) { if (st === 144 && d[2] > 0 && d[1] >= 36) momentN(d[1] - 36); return; }
    if (st === 176 && d[1] >= 24 && d[1] <= 43) { var was = midiCC[d[1]] || 0; midiCC[d[1]] = d[2]; if (was < 64 && d[2] >= 64) momentN(d[1] - 24); return; }
    if (st === 144 && d[2] > 0) noteOn('m' + d[1], 440 * Math.pow(2, (d[1] - 69) / 12), d[2] / 127);
    else if (st === 128 || st === 144) noteOff('m' + d[1]);
    else if (st === 176 && MCC[d[1]]) setParam(MCC[d[1]], denorm(DEF[MCC[d[1]]], d[2] / 127));
  }

  /* ---------- transport ---------- */
  function panic() { inputStop(); releaseAll(); HE_SOURCES.forEach(function (s) { if (P[s + '.hold'] > .5) setParam(s + '.hold', 0); }); if (P['aura.freeze'] > .5) setParam('aura.freeze', 0); send({ t: 'panic' }); }
  function loopToggle() { if (!started) return start().then(loopToggle); send({ t: 'loop', a: tm && tm.rec ? 'stop' : 'rec', free: $('free').checked }); }

  /* ---------- recording: WAV + zip, all in the browser ---------- */
  // chunks are copied into planar blocks on arrival and their buffers handed back to the audio thread for reuse
  var rec = null;
  function recToggle() {
    if (!started) return start().then(recToggle);
    if (rec) { if (!rec.stopping) { rec.stopping = true; send({ t: 'rec', on: false }); rec.stopQ = seq; } return; }
    rec = { parts: [], st: [], frames: 0, stems: $('stems').checked, sr: ctx.sampleRate, max: ($('stems').checked ? 240 : 600) * ctx.sampleRate };
    send({ t: 'rec', on: true, stems: rec.stems }); $('rec').setAttribute('aria-pressed', 'true'); $('rec').innerHTML = '&#9632; Stop'; $('stems').disabled = true;
  }
  function planar(d, n) { var L = new Float32Array(n), R = new Float32Array(n); for (var i = 0; i < n; i++) { L[i] = d[i * 2]; R[i] = d[i * 2 + 1]; } return [L, R]; }
  function recChunk(m) {
    var give = [m.mix.buffer]; if (m.st) m.st.forEach(function (x) { if (x) give.push(x.buffer); });
    if (rec && m.n > 0) {
      rec.parts.push(planar(m.mix, m.n));
      if (m.st) m.st.forEach(function (x, i) { if (!rec.st[i]) rec.st[i] = []; rec.st[i].push(x ? planar(x, m.n) : m.n); });
      rec.frames += m.n;
    }
    if (node) node.port.postMessage({ t: 'ret', b: give }, give); else if (host) host.ret(give);
    if (!rec) return;
    var s = Math.floor(rec.frames / rec.sr); $('rectime').textContent = ('0' + Math.floor(s / 60)).slice(-2) + ':' + ('0' + s % 60).slice(-2);
    if (m.last) { var r = rec; whenAcked(r.stopQ || seq, function () { recFinish(r); }); rec = null; $('rec').setAttribute('aria-pressed', 'false'); $('rec').innerHTML = '&#9679; Record'; $('stems').disabled = false; return; }
    if (rec.frames >= rec.max && !rec.stopping) { recToggle(); toast('Take length limit reached. Saving.'); }
  }
  function join(list, n) {
    var L = new Float32Array(n), R = new Float32Array(n), o = 0, any = false;
    list.forEach(function (p) { if (typeof p === 'number') { o += p; return; } L.set(p[0], o); R.set(p[1], o); o += p[0].length; any = true; });
    return any ? [L, R] : null;
  }
  function stamp() { var d = new Date(), z = function (n) { return ('0' + n).slice(-2); }; return d.getFullYear() + z(d.getMonth() + 1) + z(d.getDate()) + '-' + z(d.getHours()) + z(d.getMinutes()) + z(d.getSeconds()); }
  // the log starts at the session start, or at the checkpoint it was last folded to (then frame 0 of the file is that point)
  function perfNow(title) { var L = perfLog.slice(), o0 = L.length ? L[0].fn : 0; if (o0) L = L.map(function (x) { return { fn: x.fn - o0, m: x.m }; }); return HE_IO.toPerformance({ log: L, sr: ctx ? ctx.sampleRate : 48000, title: title, customMoments: CMS.slice() }); }
  function recFinish(r) {
    if (r.frames < r.sr * .2) { toast('Nothing recorded.'); return; }
    toast('Writing WAV files…');
    setTimeout(function () {
      var title = 'horror-engine-' + stamp(), bits = +$('bits').value;
      var res = { sr: r.sr, frames: r.frames, mix: join(r.parts, r.frames), stems: r.stems ? r.st.map(function (l) { return join(l, r.frames); }) : null };
      var files = HE_IO.takeFiles(res, title, bits, perfNow(title));
      if (files.clips) toast(files.clips + ' stem samples clipped even after the 24-bit pad. Use 32-bit float for this take.');
      var nw = files.length - 1;
      save(title + '.zip', new Blob(HE_IO.zipParts(files), { type: 'application/zip' }), nw + ' WAV file' + (nw > 1 ? 's' : '') + ' and the performance file saved in ' + title + '.zip');
    }, 30);
  }

  /* ---------- "Save what I just played" (Shift+R) ----------
     The audio thread keeps the last minute of the mix in a ring. Shift+R copies it out (exactly what you heard) and
     writes the matching performance file: render that file with Stems on for the stems of the same minute. Early in a
     session the file replays the whole session from its start, so its stems sum to the saved mix exactly; later it
     starts from a checkpoint shortly before the minute (the looper's layers, knobs, held notes and running moments are
     rebuilt there), so the log stays short and stem renders stay quick. */
  var RETRO_SEC = 60, RETRO_RING = 62, EXACT_MAX = 300, PREROLL = 20, CP_EVERY = 30, FOLD_AT = 600, FOLD_KEEP = 180;
  var retro = null, cps = [], cpWait = {}, cpTimer = 0;
  function retroSave() {
    if (!started || (!node && !host)) { toast('Nothing has played yet.'); return; }
    if (retro) return;
    retro = { parts: [], n: 0 }; send({ t: 'retro', sec: RETRO_SEC }); retro.q = seq; toast('Saving the last minute\u2026');
  }
  function retroChunk(m) {
    var r = retro; if (!r) return;
    if (m.n > 0) { r.parts.push(planar(m.d, m.n)); r.n += m.n; }
    if (!m.last) return;
    retro = null;
    if (r.n < ctx.sampleRate * .2) { toast('Nothing has played yet.'); return; }
    r.start = m.start; r.end = m.end;
    whenAcked(r.q, function () { retroFinish(r); });
  }
  function retroPerf(start, end, title) {
    var sr = ctx ? ctx.sampleRate : 48000, L = perfLog, o = { customMoments: CMS.slice() };
    if (!L.length) return null;
    if (L[0].fn === 0 && end <= EXACT_MAX * sr) { o.exact = true; return HE_IO.windowPerf(L, start, end, sr, title, o); }
    var want = start - PREROLL * sr, cp = null;
    cps.forEach(function (c) { if (c.fn <= want && c.ok && (!cp || c.fn > cp.fn)) cp = c; });
    if (!cp) cps.forEach(function (c) { if (c.fn <= want && (!cp || c.fn > cp.fn)) cp = c; });
    if (!cp || cp.idx <= 1) { o.exact = L[0].fn === 0; return HE_IO.windowPerf(L, start, end, sr, title, o); }
    var log = HE_IO.checkpoint(HE_IO.foldState(L, cp.idx), cp.fn, cp.snap).concat(L.slice(cp.idx));
    return HE_IO.windowPerf(log, start, end, sr, title, o);
  }
  function retroFinish(r) {
    var sr = ctx.sampleRate, secs = Math.round(r.n / sr), title = 'horror-engine-last-' + secs + 's-' + stamp(), bits = +$('bits').value;
    var perf = retroPerf(r.start, r.end, title);
    var files = HE_IO.takeFiles({ sr: sr, frames: r.n, mix: join(r.parts, r.n), stems: null }, title, bits, perf);
    var how = perf && perf.meta.retro && perf.meta.retro.exact ? 'its stems add up to this mix exactly' : 'it replays from a checkpoint just before, so the stems are performed again';
    save(title + '.zip', new Blob(HE_IO.zipParts(files), { type: 'application/zip' }), 'Saved the last ' + secs + ' s in ' + title + '.zip. For stems, Render its .horror.json with Stems on (' + how + ').');
  }
  // checkpoints: every 30 s the audio thread snapshots the looper; the log position of that moment is where the ack lands
  function cpOk() { var M = tm && tm.mom; return !(tm && tm.rec) && !(M && (M.riser >= 0 || M.stinger || (M.c && M.c.length))); }
  function cpTake() { if (!ctx || ctx.state !== 'running' || (!node && !host)) return; var ok = cpOk(); send({ t: 'lsnap' }); var w = cpWait[seq] || (cpWait[seq] = {}); w.ok = ok; }
  function cpReply(m) { var w = cpWait[m.q] || (cpWait[m.q] = {}); w.snap = m.snap; cpJoin(m.q); }
  function cpAck(q, fn) { var w = cpWait[q] || (cpWait[q] = {}); w.fn = fn; w.idx = perfLog.length; cpJoin(q); }
  function cpJoin(q) {
    var w = cpWait[q]; if (!w || w.snap === undefined || w.fn === undefined) return; delete cpWait[q];
    cps.push({ fn: w.fn, idx: w.idx, snap: w.snap, ok: w.ok !== false }); if (cps.length > 48) cps.shift();
    logFold();
  }
  // keep the log to the last 3 to 10 minutes: fold everything before a checkpoint into the state it built up
  function logFold() {
    if (rec || retro || perfLog.length < 2 || !ctx) return;
    var sr = ctx.sampleRate; if (lastFn - perfLog[0].fn < FOLD_AT * sr) return;
    var keep = lastFn - FOLD_KEEP * sr, cp = null;
    cps.forEach(function (c) { if (c.ok && c.fn <= keep && c.idx > 1 && (!cp || c.fn > cp.fn)) cp = c; });
    if (!cp) return;
    var head = HE_IO.checkpoint(HE_IO.foldState(perfLog, cp.idx), cp.fn, cp.snap), cut = cp.idx;
    perfLog = head.concat(perfLog.slice(cut));
    cps = cps.filter(function (c) { return c.idx >= cut; }).map(function (c) { c.idx = c.idx - cut + head.length; return c; });
  }

  /* ---------- your own sound in: mic, line or a file through the spring, body, hall, harmonizer and Aura ---------- */
  var inBus = null, inp = { on: false }, inPk = 0;
  function inputGo(src, kind, name, extra) {
    inputStop(true);
    inp = { on: true, kind: kind, name: name, src: src }; if (extra) for (var k in extra) inp[k] = extra[k];
    src.connect(inBus); send({ t: 'input', on: true }); inputUI();
    toast('Your sound in: ' + name + '. Set the level with Dry and the sends; Silence (Esc) stops it.');
  }
  function inputMic() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { toast('This browser cannot open a microphone on this page' + (location.protocol === 'file:' ? ' (some browsers need it served over http).' : '.')); return; }
    start().then(function () { return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: { ideal: 2 } } }); })
      .then(function (st) { var t = st.getAudioTracks()[0]; inputGo(ctx.createMediaStreamSource(st), 'mic', (t && t.label) || 'microphone', { stream: st }); if (t) t.onended = function () { if (inp.stream === st) inputStop(); }; },
        function (e) { toast('No microphone: ' + (e && e.name === 'NotAllowedError' ? 'permission was refused.' : (e && e.message) || 'it could not be opened.')); });
  }
  function inputFile(f) {
    start().then(function () { return new Promise(function (ok, no) { var rd = new FileReader(); rd.onload = function () { ok(rd.result); }; rd.onerror = no; rd.readAsArrayBuffer(f); }); })
      .then(function (ab) { return new Promise(function (ok, no) { var pr = ctx.decodeAudioData(ab, ok, no); if (pr && pr.then) pr.then(ok, no); }); })
      .then(function (b) {
        var s = ctx.createBufferSource(); s.buffer = b; s.loop = $('inLoop').checked;
        s.onended = function () { if (inp.src === s) { inputStop(true); toast('The file finished.'); } };
        inputGo(s, 'file', f.name); s.start();
      }, function () { toast('That file could not be decoded as audio.'); });
  }
  function inputStop(quiet) {
    var was = inp.on;
    if (inp.src) { try { inp.src.onended = null; if (inp.kind === 'file') inp.src.stop(); } catch (e) { } try { inp.src.disconnect(); } catch (e) { } }
    if (inp.stream) inp.stream.getTracks().forEach(function (t) { t.stop(); });
    inp = { on: false }; inPk = 0;
    if (was) { send({ t: 'input', on: false }); if (!quiet) toast('Your sound in: stopped.'); }
    inputUI();
  }
  function inputUI() {
    var st = $('inState'); if (!st) return;
    st.textContent = inp.on ? (inp.kind === 'mic' ? 'Mic: ' : 'File: ') + inp.name : 'Off';
    $('inStop').disabled = !inp.on; $('inMic').setAttribute('aria-pressed', inp.kind === 'mic' ? 'true' : 'false'); $('inFileBtn').setAttribute('aria-pressed', inp.kind === 'file' ? 'true' : 'false');
    var tg = $('inToggle'); if (tg) tg.classList.toggle('live', inp.on);
    if (!inp.on) sty($('inMeter'), 'transform', 'scaleX(0)');
  }

  /* ---------- share by link ---------- */
  function shareBase() { return location.href.split('#')[0]; }
  function shareLink() {
    var url = shareBase() + '#s=' + HE_IO.encodeShare(P, { n: $('preset').value, sel: sel });
    var done = function () { toast('Link copied (' + url.length + ' characters). Opening it rebuilds these settings' + (location.protocol === 'file:' ? '; it points at this file on this computer, so send the page along with it.' : '.')); };
    var ask = function () { try { window.prompt('Copy this link', url); } catch (e) { toast('Could not copy the link.'); } };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, ask); else ask();
  }
  function shareOpen() {
    var mm = /[#&]s=([A-Za-z0-9_-]+)/.exec(location.hash); if (!mm) return false;
    var r = HE_IO.decodeShare(mm[1]);
    try { history.replaceState(null, '', shareBase()); } catch (e) { }
    if (!r) { toast('That share link is damaged, so nothing was changed.'); return true; }
    applyAll(r.params, 'Shared link');
    if (r.sel >= 0) select(r.sel);
    toast('Settings from a shared link' + (r.n ? ' (started from ' + r.n + ')' : '') + '. Ctrl+Z puts yours back.');
    return true;
  }

  /* ---------- offline re-render of a performance file (Web Worker from a Blob URL; main thread if that fails) ---------- */
  var rendering = null;
  function renderPerf(perf, name) {
    if (rendering) { rendering.cancel(); return; }
    var opt = { stems: $('stems').checked }, bits = +$('bits').value, title = name.replace(/\.horror\.json$|\.json$/i, '') + '-render';
    var done = function (res) {
      rendering = null; $('render').textContent = 'Render…'; $('rprog').hidden = true;
      if (!res || !res.frames) { toast('Nothing to render in that file.'); return; }
      var files = HE_IO.takeFiles(res, title, bits, perf);
      save(title + '.zip', new Blob(HE_IO.zipParts(files), { type: 'application/zip' }), 'Rendered ' + (res.frames / res.sr).toFixed(1) + ' s offline at ' + res.sr + ' Hz: ' + title + '.zip');
    };
    var prog = function (p) { $('rprog').hidden = false; $('rprog').value = p; };
    $('render').textContent = 'Cancel render';
    var w = null;
    try {
      var code = 'var HE_SOURCES=' + JSON.stringify(HE_SOURCES) + ';var HE_PARAMS=' + JSON.stringify(HE_PARAMS) + ';var HECoreFactory=' + HECoreFactory.toString() + ';var HE_IO=(' + HEIOFactory.toString() + ')();' +
        'onmessage=function(e){var j=HE_IO.renderJob(e.data.perf,e.data.opt);while(!j.step(2048))postMessage({p:j.progress});var r=j.result,t=[];r.mix.forEach(function(c){t.push(c.buffer)});if(r.stems)r.stems.forEach(function(s){if(s)s.forEach(function(c){t.push(c.buffer)})});postMessage({r:r},t)}';
      w = new Worker(URL.createObjectURL(new Blob([code], { type: 'text/javascript' })));
      w.onmessage = function (e) { if (e.data.r) { w.terminate(); done(e.data.r); } else prog(e.data.p); };
      w.onerror = function (e) { e.preventDefault(); w.terminate(); main(); };
      w.postMessage({ perf: perf, opt: opt });
      rendering = { cancel: function () { w.terminate(); rendering = null; $('render').textContent = 'Render…'; $('rprog').hidden = true; toast('Render cancelled.'); } };
    } catch (e) { main(); }
    function main() {
      var j = HE_IO.renderJob(perf, opt), stop = false;
      rendering = { cancel: function () { stop = true; rendering = null; $('render').textContent = 'Render…'; $('rprog').hidden = true; toast('Render cancelled.'); } };
      (function tick() { if (stop) return; if (j.step(256)) done(j.result); else { prog(j.progress); setTimeout(tick, 0); } })();
    }
  }
  function readJson(f, cb) { var rd = new FileReader(); rd.onload = function () { var j = null; try { j = JSON.parse(rd.result); } catch (e) { } cb(j); }; rd.readAsText(f); }
  function save(name, blob, okMsg) {
    try { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 60000); toast(okMsg); }
    catch (e) { toast('This view cannot save files.'); }
  }

  /* ---------- presets ---------- */
  // presets, loaded files and share links: one undo step; your sound-in settings belong to the session and stay
  var KEEP = /^input\./;
  function applyAll(vals, label) {
    var ch = {}, n = 0;
    HE_PARAMS.forEach(function (p) {
      if (KEEP.test(p.id)) return;
      var v = vals && typeof vals[p.id] === 'number' && isFinite(vals[p.id]) ? Math.min(p.max, Math.max(p.min, vals[p.id])) : p.def;
      if (P[p.id] !== v) { ch[p.id] = [P[p.id], v]; n++; }
      P[p.id] = v; send({ t: 'p', k: p.id, v: v }); if (ctl[p.id]) ctl[p.id](v);
    });
    if (n && !hMute) histPush({ k: 'p', ch: ch, label: label || 'Load settings', t: Date.now() });
    offUndo = null; clearTimeout(offUndoT); rackState(); try { localStorage.setItem('horror-engine.params', JSON.stringify(P)); } catch (e) { }
  }

  /* ---------- custom moments ---------- */
  // CMS: your own moments, in panel order (F6 onwards). Each is kept in localStorage, sent to the audio host as a
  // definition, and saved inside presets and performances. The host captures and plays them; see Engine.cmRun.
  var CMS = [], cmArmed = false, cmPend = null, cmOpen = null;
  function cmStore() { try { localStorage.setItem('horror-engine.moments', JSON.stringify(CMS)); } catch (e) { } }
  function cmSend(c) { send({ t: 'cmdef', id: c.id, def: c }); }
  function cmValid(c) { return HE_IO.validate(HE_IO.SCHEMAS.moment, { format: 'horror-engine.moment', version: HE_IO.VERSION, moment: c }).length === 0; }
  function cmId() { var id; do { id = 'm' + Date.now().toString(36).slice(-5) + Math.floor(Math.random() * 1296).toString(36); } while (CMS.some(function (c) { return c.id === id; })); return id; }
  function cmFreeName() { for (var n = MOMENTS.length + CMS.length + 1; ; n++) { var nm = 'Moment ' + n; if (!CMS.some(function (c) { return c.name === nm; })) return nm; } }
  function cmLoad() { try { var a = JSON.parse(localStorage.getItem('horror-engine.moments') || '[]'); if (Array.isArray(a)) CMS = a.filter(cmValid); } catch (e) { CMS = []; } }
  // add moments from a file, preset or performance: same id and same content is skipped, a clash gets a new id
  function cmMerge(list) {
    var n = 0;
    (list || []).forEach(function (c) {
      if (!cmValid(c)) return; c = JSON.parse(JSON.stringify(c));
      var same = CMS.filter(function (x) { return x.id === c.id; })[0];
      if (same) { if (JSON.stringify(same) === JSON.stringify(c)) return; c.id = cmId(); }
      CMS.push(c); cmSend(c); n++;
    });
    if (n) { cmStore(); cmDraw(); }
    return n;
  }
  function cmImport(j) { var n = cmMerge(HE_IO.fromMomentFile(j)); toast(n ? 'Imported ' + n + ' moment' + (n > 1 ? 's' : '') : 'Those moments are already here.'); }
  function cmExport(c) { var slug = c.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'moment'; save(slug + '.horror-moment.json', new Blob([JSON.stringify(HE_IO.toMomentFile([c]), null, 1)], { type: 'application/json' }), 'Exported ' + slug + '.horror-moment.json'); }
  function cmRecToggle() {
    if (!started || !node && !host) return start().then(cmRecToggle);
    if (cmPend) cmNameDone(true);
    cmArmed = !cmArmed; send({ t: 'cmrec', on: cmArmed }); cmRecBtn();
    if (cmArmed) toast('Recording a moment: play any voice, move any knob, then press Record moment again.');
  }
  function cmRecBtn(sec) { var b = $('cmRec'); att(b, 'aria-pressed', cmArmed ? 'true' : 'false'); var t = cmArmed ? '\u25A0 Stop moment' + (sec >= 0 ? ' ' + sec.toFixed(1) + ' s' : '') : '\u25CF Record moment'; if (b.textContent !== t) b.textContent = t; }
  // the host's capture: frames from arm. Trim the silence before the first touch or knob move, drop strokes that began
  // before arming, and turn knob moves into lanes (continuous knobs relative to where they were at arm, switches absolute)
  function cmCaptured(m) {
    cmArmed = false; cmRecBtn();
    var c = HE_IO.momentFromCapture(m, cmId());
    if (!c) { toast('Nothing was played, so no moment was made.'); return; }
    cmPend = c;
    var row = $('cmNameRow'), inp = $('cmName'); row.hidden = false; inp.value = cmFreeName(); inp.focus(); inp.select();
  }
  function cmNameDone(keep) {
    var c = cmPend; cmPend = null; $('cmNameRow').hidden = true; if (!c) return;
    if (!keep) { toast('Moment discarded.'); return; }
    c.name = $('cmName').value.trim() || cmFreeName(); CMS.push(c); cmStore(); cmSend(c); cmDraw();
    var n = MOMENTS.length + CMS.length; toast('Saved "' + c.name + '" (' + c.len.toFixed(1) + ' s)' + (n <= 12 ? ' on F' + n : '') + '.');
  }
  function cmDraw() {
    var box = $('cmoments'); box.textContent = '';
    CMS.forEach(function (c, i) {
      var w = document.createElement('div'); w.className = 'cm' + (cmOpen === c.id ? ' open' : '');
      var b = document.createElement('button'); b.className = 'btn'; b.id = 'cm_' + c.id; b.setAttribute('aria-pressed', 'false');
      b.innerHTML = '<span></span><small></small><b></b>'; b.children[0].textContent = c.name;
      var n = MOMENTS.length + i + 1, vs = c.voice >= 0 ? SRC[c.voice].n : 'as played';
      b.children[1].textContent = c.len.toFixed(1) + ' s, ' + vs + (n <= 12 ? ' \u00B7 F' + n : '');
      b.title = 'Play "' + c.name + '" once (press again to stop)' + (n <= 12 ? ', key F' + n : '') + ', MIDI ch 16 note ' + (35 + n) + ' or CC ' + (23 + n);
      b.addEventListener('click', function () { momentToggle('c:' + c.id); });
      var mb = document.createElement('button'); mb.className = 'btn sm cmmenu'; mb.textContent = '\u2026'; mb.title = 'Rename, voice, export, delete'; mb.setAttribute('aria-expanded', cmOpen === c.id ? 'true' : 'false'); mb.setAttribute('aria-label', 'Options for ' + c.name);
      mb.addEventListener('click', function () { cmOpen = cmOpen === c.id ? null : c.id; cmDraw(); });
      w.appendChild(b); w.appendChild(mb);
      if (cmOpen === c.id) {
        var mn = document.createElement('div'); mn.className = 'cmopts';
        var nm = document.createElement('input'); nm.type = 'text'; nm.maxLength = 40; nm.value = c.name; nm.setAttribute('aria-label', 'Rename');
        var ren = function () { var v = nm.value.trim(); if (v && v !== c.name) { c.name = v; cmStore(); cmSend(c); cmDraw(); } };
        nm.addEventListener('change', ren); nm.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); ren(); } else if (e.key === 'Escape') { cmOpen = null; cmDraw(); } });
        var sv = document.createElement('select'); sv.setAttribute('aria-label', 'Voice for this moment');
        var o0 = document.createElement('option'); o0.value = -1; o0.textContent = 'Voices as played'; sv.appendChild(o0);
        SRC.forEach(function (sr, j) { var o = document.createElement('option'); o.value = j; o.textContent = sr.n; sv.appendChild(o); }); sv.value = c.voice;
        sv.addEventListener('change', function () { c.voice = +sv.value; cmStore(); cmSend(c); cmDraw(); });
        var ex = document.createElement('button'); ex.className = 'btn sm'; ex.textContent = 'Export'; ex.addEventListener('click', function () { cmExport(c); });
        var up = document.createElement('button'); up.className = 'btn sm'; up.textContent = '\u2191'; up.title = 'Move earlier (changes its F key)'; up.disabled = i === 0;
        up.addEventListener('click', function () { CMS.splice(i, 1); CMS.splice(i - 1, 0, c); cmStore(); cmDraw(); });
        var del = document.createElement('button'); del.className = 'btn sm'; del.textContent = 'Delete';
        del.addEventListener('click', function () { if (del.dataset.sure) { CMS.splice(i, 1); send({ t: 'cmdef', id: c.id, def: null }); cmOpen = null; cmStore(); cmDraw(); toast('Deleted "' + c.name + '".'); } else { del.dataset.sure = 1; del.textContent = 'Sure?'; } });
        mn.appendChild(nm); mn.appendChild(sv); mn.appendChild(ex); mn.appendChild(up); mn.appendChild(del); w.appendChild(mn);
      }
      box.appendChild(w);
    });
  }
  function cmTele(M) {
    var playing = {}; (M.c || []).forEach(function (c) { playing[c[0]] = c[1]; });
    CMS.forEach(function (c) { var b = document.getElementById('cm_' + c.id); if (!b) return; var on = c.id in playing; att(b, 'aria-pressed', on ? 'true' : 'false'); sty(b.lastChild, 'width', on ? (playing[c.id] * 100).toFixed(1) + '%' : '0%'); });
    if (cmArmed) { cmRecBtn(M.cr); if (M.cr >= 600) cmRecToggle(); }
  }
  function cmBoot() {
    cmLoad(); cmDraw();
    $('cmRec').addEventListener('click', cmRecToggle);
    $('cmKeep').addEventListener('click', function () { cmNameDone(true); });
    $('cmDrop').addEventListener('click', function () { cmNameDone(false); });
    $('cmName').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); cmNameDone(true); } else if (e.key === 'Escape') { e.preventDefault(); cmNameDone(false); } });
    $('cmImp').addEventListener('click', function () { $('cmFile').click(); });
    $('cmFile').addEventListener('change', function () {
      var f = this.files[0]; if (!f) return; this.value = '';
      readJson(f, function (j) {
        if (!j) { toast('That file is not JSON.'); return; }
        if (j.format === 'horror-engine.moment') { var er = HE_IO.check(j); if (er.length) toast('Not imported: ' + er[0]); else cmImport(j); }
        else if (j.customMoments) { var n = cmMerge(j.customMoments); toast(n ? 'Imported ' + n + ' moment' + (n > 1 ? 's' : '') + ' from ' + f.name : 'No new moments in ' + f.name); }
        else toast('Choose a .horror-moment.json file (or a preset or performance with moments in it).');
      });
    });
  }

  /* ---------- boot ---------- */
  function boot() {
    mmLoad();
    try { var sv = JSON.parse(localStorage.getItem('horror-engine.params') || 'null'); if (sv) HE_PARAMS.forEach(function (p) { if (typeof sv[p.id] === 'number' && isFinite(sv[p.id])) P[p.id] = Math.min(p.max, Math.max(p.min, sv[p.id])); }); } catch (e) { }
    buildRack();
    [['macro.dread', 'Off-key to chaos'], ['macro.distance', 'Close to down the corridor'], ['macro.material', 'Wood, steel, glass'], ['macro.pitch', 'Sub rumble to whine']].forEach(function (m) { $('macros').appendChild(knob(m[0], true, m[1])); });
    ['rev.size', 'rev.decay', 'rev.damp', 'rev.pre', 'rev.mix'].forEach(function (id) { $('hallk').appendChild(knob(id)); });
    ['master.tone', 'master.vol'].forEach(function (id) { $('masterk').appendChild(knob(id)); });
    ['harm.shift', 'harm.detune', 'harm.fb', 'harm.mix'].forEach(function (id) { $('harmk').appendChild(knob(id)); });
    ['body.amt', 'body.piezo', 'body.size', 'body.spring'].forEach(function (id) { $('bodyk').appendChild(knob(id)); });
    ['input.level', 'input.spr', 'input.body', 'input.rev', 'input.hsend', 'input.aura'].forEach(function (id) { $('inputk').appendChild(knob(id)); });
    $('inToggle').addEventListener('click', function () { var on = $('inPanel').hidden; $('inPanel').hidden = !on; $('inToggle').setAttribute('aria-expanded', on ? 'true' : 'false'); });
    $('inMic').addEventListener('click', inputMic);
    $('inFileBtn').addEventListener('click', function () { $('inFile').click(); });
    $('inFile').addEventListener('change', function () { var f = this.files[0]; this.value = ''; if (f) inputFile(f); });
    $('inStop').addEventListener('click', function () { inputStop(); });
    $('inLoop').addEventListener('change', function () { if (inp.kind === 'file' && inp.src) inp.src.loop = $('inLoop').checked; });
    inputUI();
    $('undo').addEventListener('click', undo); $('redo').addEventListener('click', redo); histBtns();
    $('share').addEventListener('click', shareLink);
    $('retro').addEventListener('click', retroSave);
    window.addEventListener('hashchange', shareOpen);
    MOMENTS.forEach(function (m) {
      var b = document.createElement('button'); b.className = 'btn'; b.id = 'mo_' + m[0]; b.setAttribute('aria-pressed', 'false'); b.innerHTML = '<span></span><small></small><b></b>'; b.children[0].textContent = m[1]; b.children[1].textContent = m[2];
      b.addEventListener('click', function () { momentToggle(m[0]); });
      $('moments').appendChild(b);
    });
    cmBoot();
    $('offReset').addEventListener('click', offDefaults);
    var ps = $('preset'); Object.keys(PRESETS).forEach(function (n) { var o = document.createElement('option'); o.textContent = n; ps.appendChild(o); });
    ps.addEventListener('change', function () { var v = {}; HE_PARAMS.forEach(function (p) { v[p.id] = p.def; }); var o = PRESETS[ps.value]; for (var k in o) v[k] = o[k]; applyAll(v, 'Preset ' + ps.value); toast('Preset: ' + ps.value); });
    $('psave').addEventListener('click', function () { var t = 'horror-engine-preset-' + stamp(); save(t + '.json', new Blob([JSON.stringify(HE_IO.toPreset(P, t, CMS), null, 1)], { type: 'application/json' }), 'Preset saved as ' + t + '.json'); });
    $('pload').addEventListener('click', function () { $('pfile').click(); });
    // Load takes a preset or a performance file (its starting sound plus every knob move in it); both are schema-checked
    $('pfile').addEventListener('change', function () {
      var f = this.files[0]; if (!f) return; this.value = '';
      readJson(f, function (j) {
        var errs = HE_IO.check(j);
        if (j && j.format === 'horror-engine.preset' && j.params && !errs.some(function (x) { return x.indexOf('customMoments') >= 0; })) errs = [];   // presets saved by earlier builds
        if (j && j.format === 'horror-engine.moment') { if (errs.length) toast('Not loaded: ' + errs[0]); else cmImport(j); return; }
        if (errs.length) { toast('Not loaded: ' + errs[0] + (errs.length > 1 ? ' (+' + (errs.length - 1) + ' more)' : '')); return; }
        var v = HE_IO.fromPreset(j.format === 'horror-engine.performance' ? j.preset : j);
        if (j.format === 'horror-engine.performance') (j.liveEvents || []).forEach(function (e) { if (e.type === 'param' && e.param in v) v[e.param] = e.value; });
        var nm = j.customMoments ? cmMerge(j.customMoments) : 0;
        applyAll(v, 'Load ' + f.name); toast((nm ? nm + ' moment' + (nm > 1 ? 's' : '') + ' added. ' : '') + (j.format === 'horror-engine.performance' ? 'Loaded the sound of ' + f.name + '. Use Render to re-render the take.' : 'Loaded ' + f.name));
      });
    });
    $('render').addEventListener('click', function () { if (rendering) rendering.cancel(); else $('rfile').click(); });
    $('rfile').addEventListener('change', function () {
      var f = this.files[0]; if (!f) return; this.value = '';
      readJson(f, function (j) {
        var errs = j && j.format === 'horror-engine.performance' ? HE_IO.check(j) : ['choose a .horror.json performance file'];
        if (errs.length) { toast('Cannot render: ' + errs[0]); return; }
        if (j.engine.codeHash !== HE_IO.codeHash()) toast('This take was made with a different engine build; the render may differ slightly.');
        renderPerf(j, f.name);
      });
    });
    $('power').addEventListener('click', function () { if (started && ctx && ctx.state === 'running') { ctx.suspend(); $('power').textContent = 'Audio paused'; $('power').classList.remove('live'); } else if (started && ctx) { ctx.resume(); $('power').textContent = 'Audio on'; $('power').classList.add('live'); } else start(); });
    $('wakeBtn').addEventListener('click', function () { start(); });
    $('rec').addEventListener('click', function () { recToggle(); });
    $('panic').addEventListener('click', panic);
    $('loopRec').addEventListener('click', loopToggle);
    $('loopClear').addEventListener('click', function () { send({ t: 'loop', a: 'clear' }); });
    $('aboutBtn').addEventListener('click', function () { var d = $('about'); if (d.showModal) d.showModal(); else d.setAttribute('open', ''); });
    $('aboutClose').addEventListener('click', function () { var d = $('about'); if (d.close) d.close(); else d.removeAttribute('open'); });
    select(0); drawLayers([]); showPr(); shareOpen();
    resize(); if (window.ResizeObserver) new ResizeObserver(resize).observe(pad); else window.addEventListener('resize', resize);
    requestAnimationFrame(draw);
    window.__he = { start: start, send: send, state: function () { return { tm: tm, started: started, worklet: !!node, P: P }; }, wav: HE_IO.wav, zip: HE_IO.zipParts,
      select: select, pressure: pressure, P: P, setParam: setParam, toast: toast, SRC: SRC, ROMAN: ROMAN,
      live: function () { return { tm: tm, junk: junk, pk: srcPk, started: started && (node || host), sel: sel, basePr: basePr }; },
      level: dbn, nudgePr: function (d) { basePr = Math.min(1, Math.max(.05, basePr + d)); showPr(); return basePr; },
      machine: function (on) { machineOn = on; junkFlag(); setTimeout(resize, 0); },
      moments: function () { return CMS; }, momentN: momentN, cmRec: cmRecToggle,
      undo: undo, redo: redo, hist: function () { return { n: hist.length, pos: hpos }; }, retroSave: retroSave, retroPerf: retroPerf, log: function () { return perfLog; }, cps: function () { return cps; },
      midiMap: function () { return MMAP; }, learn: learnStart, onMidi: onMidi, applyAll: applyAll, shareOpen: shareOpen };
  }
  boot();
})();
