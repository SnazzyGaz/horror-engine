(function () {
  'use strict';
  var VERSION = '1.0.0', AUTHOR = 'Garyck Arntzen', CREDIT = 'https://x.com/_mintydoge';
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
    'Sub Basement': { 'macro.pitch': -14, 'macro.distance': .5, 'macro.dread': .5, 'rev.decay': 20, 'rev.size': 1, 'master.tone': -.4, 'hurdy.hold': 1, 'hurdy.level': -14, 'struck.object': 4 }
  };
  var MOMENTS = [['riser', 'Riser', '8 s climb, hard cut'], ['stinger', 'Stinger', 'Swell into a hit'], ['drone', 'Drone bed', 'Wheel, string, freeze'], ['heart', 'Heartbeat', 'Follows Dread'], ['walls', 'In the walls', 'Skitters, scrapes and drips']];

  var sel = 0, ctx = null, node = null, host = null, analyser = null, scope = new Float32Array(1024), started = false, ctl = {}, octave = 0, basePr = .6;
  var core = null;

  /* ---------- messaging ---------- */
  // every audio message gets a sequence number; the host reports the frame it applied it at (telemetry "ap"),
  // and the pair goes into perfLog, the replayable record of this session
  var seq = 0, pending = {}, perfLog = [];
  function send(m) {
    if (!node && !host) return;
    if (m.t !== 'junk') { m.q = ++seq; pending[m.q] = JSON.parse(JSON.stringify(m)); delete pending[m.q].q; }
    if (node) node.port.postMessage(m); else if (m.t === 'junk') host.wantJunk = m.v; else host.msg(m);
  }
  function acks(ap) { for (var i = 0; i + 1 < ap.length; i += 2) { var m = pending[ap[i]]; if (m) { perfLog.push({ fn: ap[i + 1], m: m }); delete pending[ap[i]]; } } }
  function whenAcked(q, cb, tries) { if (!pending[q] || (tries || 0) > 40) return cb(); setTimeout(function () { whenAcked(q, cb, (tries || 0) + 1); }, 25); }
  function toast(t) { var el = $('toast'); el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { el.hidden = true; }, 3600); }
  var saveT = 0;
  function setParam(id, v, quiet) {
    P[id] = v; send({ t: 'p', k: id, v: v });
    if (id === 'glass.guard' && v < .5 && !quiet) toast('Ear guard off: nail and chalk on glass can get painfully loud between 2 and 5 kHz. Keep headphone volume down.');
    if (ctl[id]) ctl[id](v);
    if (!quiet) { clearTimeout(saveT); saveT = setTimeout(function () { try { localStorage.setItem('horror-engine.params', JSON.stringify(P)); } catch (e) { } }, 500); }
    if (id.slice(-5) === '.mute' || id.slice(-5) === '.hold') rackState();
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
    if (u === 'st') return (v > 0 ? '+' : '') + v.toFixed(1) + ' st';
    if (u === 'x') return v.toFixed(2) + '×';
    if (u === 'oct') return v.toFixed(1) + ' oct';
    if (u === 'cm') return v.toFixed(1) + ' cm';
    if (u === 'c') return Math.round(v) + ' c';
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
    el.addEventListener('pointerdown', function (e) { el.setPointerCapture(e.pointerId); sy = e.clientY; sn = norm(d, P[id]); el.focus(); e.preventDefault(); });
    el.addEventListener('pointermove', function (e) { if (!el.hasPointerCapture(e.pointerId)) return; var n = sn + (sy - e.clientY) / (e.shiftKey ? 900 : 170); setParam(id, denorm(d, n)); });
    el.addEventListener('dblclick', function () { setParam(id, d.def); });
    el.addEventListener('wheel', function (e) { e.preventDefault(); setParam(id, denorm(d, norm(d, P[id]) - Math.sign(e.deltaY) * (e.shiftKey ? .005 : .025))); }, { passive: false });
    el.addEventListener('keydown', function (e) {
      var st = e.shiftKey ? .005 : .025, n = norm(d, P[id]);
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') n += st; else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') n -= st; else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = 1; else if (e.key === 'Delete') { setParam(id, d.def); return; } else return;
      e.preventDefault(); e.stopPropagation(); setParam(id, denorm(d, n));
    });
    return el;
  }
  function toggle(id, label, cls) {
    var b = document.createElement('button'); b.className = 'btn sm ' + (cls || ''); b.textContent = label || DEF[id].label;
    ctl[id] = function (v) { b.setAttribute('aria-pressed', v > .5 ? 'true' : 'false'); }; ctl[id](P[id]);
    b.addEventListener('click', function () { setParam(id, P[id] > .5 ? 0 : 1); });
    return b;
  }
  function segment(id) {
    var d = DEF[id], f = document.createElement('div'); f.className = 'seg'; f.setAttribute('role', 'group'); f.setAttribute('aria-label', d.label);
    var l = document.createElement('span'); l.className = 'seglab'; l.textContent = d.label; f.appendChild(l);
    var bs = d.en.map(function (name, i) { var b = document.createElement('button'); b.className = 'btn sm'; b.textContent = name; b.addEventListener('click', function () { setParam(id, i); }); f.appendChild(b); return b; });
    ctl[id] = function (v) { bs.forEach(function (b, i) { b.setAttribute('aria-pressed', i === (v | 0) ? 'true' : 'false'); }); }; ctl[id](P[id]);
    return f;
  }
  function knobRow(ids) { var r = document.createElement('div'); r.className = 'knobs'; ids.forEach(function (id) { r.appendChild(knob(id)); }); return r; }

  /* ---------- rack & voice panel ---------- */
  var rackEls = [];
  function buildRack() {
    var ol = $('rack');
    SRC.forEach(function (s, i) {
      var li = document.createElement('li'), b = document.createElement('button'); b.className = 'src';
      b.innerHTML = '<em></em><span><strong></strong><small></small></span><u></u>';
      b.querySelector('em').textContent = ROMAN[i]; b.querySelector('strong').textContent = s.n;
      b.addEventListener('click', function () { select(i); });
      li.appendChild(b); ol.appendChild(li); rackEls.push(b);
    });
  }
  function rackState() {
    rackEls.forEach(function (b, i) {
      var k = HE_SOURCES[i], m = P[k + '.mute'] > .5, h = P[k + '.hold'] > .5;
      b.classList.toggle('muted', m); b.querySelector('small').textContent = m ? 'Muted' : h ? 'Holding' : '';
    });
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
    var own = HE_PARAMS.filter(function (q) { return q.id.indexOf(k + '.') === 0 && !q.grp && !(q.sw && (q.label === 'Hold' || q.label === 'Mute' || q.label === 'Freeze')); });
    var h4 = document.createElement('h4'); h4.textContent = 'The model'; a.appendChild(h4);
    own.filter(function (q) { return q.en; }).forEach(function (q) { a.appendChild(segment(q.id)); });
    a.appendChild(knobRow(own.filter(function (q) { return !q.en && !q.sw; }).map(function (q) { return q.id; })));
    own.filter(function (q) { return q.sw; }).forEach(function (q) { var w = document.createElement('div'); w.className = 'sub'; w.appendChild(toggle(q.id)); a.appendChild(w); });
    // bowed and struck metal and the superball's steel sheet can sit in water (the waterphone)
    if (i === 2 || i === 4 || i === 8) { var wh = document.createElement('h4'); wh.className = 'sub'; wh.textContent = 'Water (shared)'; a.appendChild(wh); a.appendChild(knobRow(['water.level', 'water.tilt', 'water.amt', 'water.slosh'])); }
    h4 = document.createElement('h4'); h4.textContent = 'Channel'; c.appendChild(h4);
    c.appendChild(knobRow(HE_PARAMS.filter(function (q) { return q.id.indexOf(k + '.') === 0 && q.grp; }).map(function (q) { return q.id; })));
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
    var code = 'var HE_CORE=(' + HECoreFactory.toString() + ')();class HEProc extends AudioWorkletProcessor{constructor(){super();var s=this;this.h=new HE_CORE.Host(sampleRate,function(m,t){s.port.postMessage(m,t||[])});this.port.onmessage=function(e){if(e.data.t==="junk")s.h.wantJunk=e.data.v;else s.h.msg(e.data)}}process(i,o){var c=o[0],L=c[0],R=c[1]||c[0];for(var f=0;f+128<=L.length;f+=128)this.h.block(L,R,f);return true}}registerProcessor("horror-engine",HEProc)';
    var ready, mk = function () {
      node = new AudioWorkletNode(ctx, 'horror-engine', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2] });
      node.port.onmessage = function (e) { onMsg(e.data); }; node.connect(analyser);
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
      core = HECoreFactory(); host = new core.Host(ctx.sampleRate, function (m) { onMsg(m); });
      var sp = ctx.createScriptProcessor(2048, 0, 2);
      sp.onaudioprocess = function (e) { var L = e.outputBuffer.getChannelData(0), R = e.outputBuffer.getChannelData(1); for (var f = 0; f + 128 <= L.length; f += 128) host.block(L, R, f); };
      sp.connect(analyser); node = null; host._sp = sp;
    }).then(function () {
      send({ t: 'init', params: P, seed: 1337 }); junkFlag();
      $('wake').hidden = true; $('power').textContent = 'Audio on'; $('power').classList.add('live');
      $('status').textContent = 'Running at ' + ctx.sampleRate + ' Hz' + (host ? ' (compatibility mode)' : '') + ', about ' + Math.round(((ctx.baseLatency || 0) + (ctx.outputLatency || 0)) * 1000) + ' ms output latency';
      if (ctx.state === 'suspended') ctx.resume();
      midi();
    });
  }

  /* ---------- telemetry ---------- */
  var layerIds = '', tm = null, junk = null, srcPk = HE_SOURCES.map(function () { return 0; });
  function dbn(x) { return Math.min(1, Math.max(0, (20 * Math.log10(x + 1e-6) + 54) / 54)); }
  function onMsg(m) {
    if (m.ap) acks(m.ap);
    if (m.t === 'chunk') return recChunk(m);
    if (m.t !== 'tm') return;
    tm = m; if (m.jp) junk = m.jp;
    // DOM writes only when a value really changes (each write costs a style pass on a big page)
    sty($('mL'), 'transform', 'scaleX(' + dbn(m.pk[0]).toFixed(2) + ')'); sty($('mR'), 'transform', 'scaleX(' + dbn(m.pk[1]).toFixed(2) + ')');
    sty($('mG'), 'transform', 'scaleX(' + Math.min(1, (1 - m.gr) * 2).toFixed(2) + ')');
    for (var i = 0; i < HE_SOURCES.length; i++) { srcPk[i] = Math.max(m.sp[i], srcPk[i] * .8); var u = rackEls[i].lastChild, a = dbn(srcPk[i]); sty(u, 'background', a > .05 ? 'rgba(239,220,166,' + (.25 + a * .75).toFixed(2) + ')' : ''); }
    var ids = m.ly.map(function (l) { return l.id + ':' + l.src + ':' + (l.mute ? 1 : 0) + (l.ghost ? 1 : 0); }).join(',');
    if (ids !== layerIds) { layerIds = ids; drawLayers(m.ly); }
    m.ly.forEach(function (l) { var el = document.getElementById('lp' + l.id); if (el) sty(el, 'transform', 'scaleX(' + l.pos.toFixed(3) + ')'); });
    if (recShown !== !!m.rec) { recShown = !!m.rec; $('loopRec').setAttribute('aria-pressed', m.rec ? 'true' : 'false'); $('loopRec').innerHTML = m.rec ? '&#9632; Close the loop' : '&#9679; Loop a gesture'; }
    MOMENTS.forEach(function (mo) { var b = $('mo_' + mo[0]), v = m.mom[mo[0]], on = mo[0] === 'riser' ? v >= 0 : !!v; att(b, 'aria-pressed', on ? 'true' : 'false'); if (mo[0] === 'riser') sty(b.lastChild, 'width', (v >= 0 ? (v * 100).toFixed(1) : 0) + '%'); });
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
    if (now - lastSend > 6) { lastSend = now; send({ t: 'g', s: sel, k: 'm', x: cur.x, y: cur.y, p: cur.p, hz: 0 }); showPr(); }
  });
  function padUp(e) { if (!down || e.pointerId !== pid) return; down = false; send({ t: 'g', s: sel, k: 'u' }); showPr(); }
  pad.addEventListener('pointerup', padUp); pad.addEventListener('pointercancel', padUp); pad.addEventListener('lostpointercapture', padUp);
  pad.addEventListener('wheel', function (e) { e.preventDefault(); basePr = Math.min(1, Math.max(.05, basePr - Math.sign(e.deltaY) * .05)); if (down) { cur.p = basePr; send({ t: 'g', s: sel, k: 'm', x: cur.x, y: cur.y, p: cur.p, hz: 0 }); } showPr(); }, { passive: false });
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
  function momentToggle(id) { var go = function () { var on = tm && tm.mom && (id === 'riser' ? tm.mom.riser >= 0 : tm.mom[id]); send({ t: 'moment', id: id, on: !on }); }; if (!started) start().then(go); else go(); }
  document.addEventListener('keydown', function (e) {
    if (typing(e) || $('about').open) return;
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if ((e.ctrlKey || e.metaKey) && !e.altKey) {
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); send({ t: 'loop', a: 'undo' }); }
      else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); send({ t: 'loop', a: 'redo' }); }
      return;
    }
    if (k === ' ') { e.preventDefault(); var ae = document.activeElement; if (ae && ae !== document.body && ae.blur) ae.blur(); if (!e.repeat) loopToggle(); return; }
    var fm = /^F([1-5])$/.exec(e.key);
    if (fm) { e.preventDefault(); if (!e.repeat) momentToggle(MOMENTS[+fm[1] - 1][0]); return; }
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
  function onMidi(e) {
    var d = e.data, st = d[0] & 240;
    if (st === 144 && d[2] > 0) noteOn('m' + d[1], 440 * Math.pow(2, (d[1] - 69) / 12), d[2] / 127);
    else if (st === 128 || st === 144) noteOff('m' + d[1]);
    else if (st === 176 && MCC[d[1]]) setParam(MCC[d[1]], denorm(DEF[MCC[d[1]]], d[2] / 127));
  }

  /* ---------- transport ---------- */
  function panic() { releaseAll(); HE_SOURCES.forEach(function (s) { if (P[s + '.hold'] > .5 && s !== 'aura') setParam(s + '.hold', 0); }); if (P['aura.freeze'] > .5) setParam('aura.freeze', 0); send({ t: 'panic' }); }
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
  function perfNow(title) { return HE_IO.toPerformance({ log: perfLog.slice(), sr: ctx ? ctx.sampleRate : 48000, title: title }); }
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
  function applyAll(vals) {
    HE_PARAMS.forEach(function (p) { var v = vals && typeof vals[p.id] === 'number' && isFinite(vals[p.id]) ? Math.min(p.max, Math.max(p.min, vals[p.id])) : p.def; P[p.id] = v; send({ t: 'p', k: p.id, v: v }); if (ctl[p.id]) ctl[p.id](v); });
    rackState(); try { localStorage.setItem('horror-engine.params', JSON.stringify(P)); } catch (e) { }
  }

  /* ---------- boot ---------- */
  function boot() {
    try { var sv = JSON.parse(localStorage.getItem('horror-engine.params') || 'null'); if (sv) HE_PARAMS.forEach(function (p) { if (typeof sv[p.id] === 'number' && isFinite(sv[p.id])) P[p.id] = Math.min(p.max, Math.max(p.min, sv[p.id])); }); } catch (e) { }
    buildRack();
    [['macro.dread', 'Off-key to chaos'], ['macro.distance', 'Close to down the corridor'], ['macro.material', 'Wood, steel, glass'], ['macro.pitch', 'Sub rumble to whine']].forEach(function (m) { $('macros').appendChild(knob(m[0], true, m[1])); });
    ['rev.size', 'rev.decay', 'rev.damp', 'rev.pre', 'rev.mix'].forEach(function (id) { $('hallk').appendChild(knob(id)); });
    ['master.tone', 'master.vol'].forEach(function (id) { $('masterk').appendChild(knob(id)); });
    ['harm.shift', 'harm.detune', 'harm.fb', 'harm.mix'].forEach(function (id) { $('harmk').appendChild(knob(id)); });
    ['body.amt', 'body.piezo', 'body.size', 'body.spring'].forEach(function (id) { $('bodyk').appendChild(knob(id)); });
    MOMENTS.forEach(function (m) {
      var b = document.createElement('button'); b.className = 'btn'; b.id = 'mo_' + m[0]; b.setAttribute('aria-pressed', 'false'); b.innerHTML = '<span></span><small></small><b></b>'; b.children[0].textContent = m[1]; b.children[1].textContent = m[2];
      b.addEventListener('click', function () { momentToggle(m[0]); });
      $('moments').appendChild(b);
    });
    var ps = $('preset'); Object.keys(PRESETS).forEach(function (n) { var o = document.createElement('option'); o.textContent = n; ps.appendChild(o); });
    ps.addEventListener('change', function () { var v = {}; HE_PARAMS.forEach(function (p) { v[p.id] = p.def; }); var o = PRESETS[ps.value]; for (var k in o) v[k] = o[k]; applyAll(v); toast('Preset: ' + ps.value); });
    $('psave').addEventListener('click', function () { var t = 'horror-engine-preset-' + stamp(); save(t + '.json', new Blob([JSON.stringify(HE_IO.toPreset(P, t), null, 1)], { type: 'application/json' }), 'Preset saved as ' + t + '.json'); });
    $('pload').addEventListener('click', function () { $('pfile').click(); });
    // Load takes a preset or a performance file (its starting sound plus every knob move in it); both are schema-checked
    $('pfile').addEventListener('change', function () {
      var f = this.files[0]; if (!f) return; this.value = '';
      readJson(f, function (j) {
        var errs = HE_IO.check(j);
        if (j && j.format === 'horror-engine.preset' && j.params) errs = [];   // presets saved by earlier builds
        if (errs.length) { toast('Not loaded: ' + errs[0] + (errs.length > 1 ? ' (+' + (errs.length - 1) + ' more)' : '')); return; }
        var v = HE_IO.fromPreset(j.format === 'horror-engine.performance' ? j.preset : j);
        if (j.format === 'horror-engine.performance') (j.liveEvents || []).forEach(function (e) { if (e.type === 'param' && e.param in v) v[e.param] = e.value; });
        applyAll(v); toast(j.format === 'horror-engine.performance' ? 'Loaded the sound of ' + f.name + '. Use Render to re-render the take.' : 'Loaded ' + f.name);
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
    select(0); drawLayers([]); showPr();
    resize(); if (window.ResizeObserver) new ResizeObserver(resize).observe(pad); else window.addEventListener('resize', resize);
    requestAnimationFrame(draw);
    window.__he = { start: start, send: send, state: function () { return { tm: tm, started: started, worklet: !!node, P: P }; }, wav: HE_IO.wav, zip: HE_IO.zipParts,
      select: select, pressure: pressure, P: P, setParam: setParam, toast: toast, SRC: SRC, ROMAN: ROMAN,
      live: function () { return { tm: tm, junk: junk, pk: srcPk, started: started && (node || host), sel: sel, basePr: basePr }; },
      level: dbn, nudgePr: function (d) { basePr = Math.min(1, Math.max(.05, basePr + d)); showPr(); return basePr; },
      machine: function (on) { machineOn = on; junkFlag(); setTimeout(resize, 0); } };
  }
  boot();
})();
