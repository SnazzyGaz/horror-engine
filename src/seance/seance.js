/* Horror Engine · Séance: the plugin layout around the same ui.js. The Surface is a spirit board: ui.js still owns the
   pointer, pen and pressure handling and sends the same x/y/pressure; this file only draws the board (HK.art) and wires
   the new panels to the existing controls. Horror Engine (c) 2026 Garyck Arntzen (https://x.com/_mintydoge), MIT licence. */
(function () {
  'use strict';
  var H = window.__he, HK = H.hooks, P = H.P, DEF = H.DEF, SRC = H.SRC, ROMAN = H.ROMAN;
  var $ = function (id) { return document.getElementById(id); };
  var LS = 'horror-engine.seance.';
  function load(k, d) { try { var v = JSON.parse(localStorage.getItem(LS + k)); return v === null || v === undefined ? d : v; } catch (e) { return d; } }
  function store(k, v) { try { localStorage.setItem(LS + k, JSON.stringify(v)); } catch (e) { } }
  function txt(el, t) { if (el && el.textContent !== t) el.textContent = t; }
  function fmtId(id) { return H.fmt(DEF[id], P[id]); }
  var NN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  function nn(n) { return NN[n % 12] + (Math.floor(n / 12) - 1); }   // 60 = C4, so 36 = C2

  /* ---------- moments: Riser and Stinger become No and Yes on the board, the rest are pads ---------- */
  var MOM = H.MOMENTS;
  function momTitle(i) { return MOM[i][1] + ': ' + MOM[i][2] + '. Key F' + (i + 1) + ', MIDI channel 16 note ' + (36 + i) + ' (' + nn(36 + i) + ') or CC ' + (24 + i) + '. Press again to stop.'; }
  function plaque(id, cls, word, i) {
    var b = $(id); b.className = 'plaque ' + cls; b.children[0].textContent = word;
    b.children[1].textContent = MOM[i][1] + ' \u00B7 ' + nn(36 + i); b.title = momTitle(i);
    $('board').appendChild(b);
  }
  plaque('mo_stinger', 'yes', 'Yes', 1);
  plaque('mo_riser', 'no', 'No', 0);
  MOM.forEach(function (m, i) {
    if (i < 2) return;
    var b = $('mo_' + m[0]), k = document.createElement('kbd'); k.textContent = nn(36 + i);
    b.insertBefore(k, b.lastChild); b.title = momTitle(i);
  });

  /* ---------- voice tokens (ui.js's rack, restyled) ---------- */
  var toks = Array.prototype.slice.call(document.querySelectorAll('#rack .src'));
  function tokens() {
    var s = H.sel();
    toks.forEach(function (b, i) {
      var k = HE_SOURCES[i], m = P[k + '.mute'] > .5, h = P[k + '.hold'] > .5, fz = i === 7 && P['aura.freeze'] > .5;
      txt(b.querySelector('small'), m ? 'muted' : fz ? 'frozen' : h ? 'holding' : i === s ? 'plays the board' : '');
      b.classList.toggle('held', h && !m);
      b.title = SRC[i].n + ' (key ' + (i + 1) + '). ' + SRC[i].d;
    });
  }
  HK.rack = tokens;

  /* ---------- pinned knobs and the selected voice's sends ---------- */
  var PIN = { ebow: ['sustain', 'slack', 'drive', 'level'], hurdy: ['crank', 'buzz', 'drive', 'level'], bowed: ['press', 'speed', 'drive', 'level'],
    glass: ['press', 'judder', 'drive', 'level'], struck: ['hard', 'decay', 'drive', 'level'], spring: ['decay', 'tension', 'drive', 'level'],
    junk: ['count', 'agit', 'drive', 'level'], aura: ['density', 'blur', 'shimmer', 'level'], moan: ['press', 'grip', 'drive', 'level'] };
  function fill(box, ids) { box.textContent = ''; ids.forEach(function (id) { if (DEF[id]) box.appendChild(H.knob(id)); }); }
  function axes(i) {
    var s = SRC[i], k = HE_SOURCES[i], x = s.x;
    if (k === 'ebow') { var r = P['ebow.slide']; x = 'Slide, ' + (Math.round(r * 10) / 10) + ' oct either side'; }
    if (k === 'struck') x = (P['struck.object'] | 0) === 0 ? 'Ruler overhang (pitch)' : 'Pitch, 1\u00BD oct either side';
    if (k === 'hurdy') x = P['hurdy.melody'] > .5 ? 'Melody, one octave' : 'Melody (switch Melody on X on)';
    txt($('hx'), x ? 'x \u00B7 ' + x : ''); txt($('hy'), s.y ? 'y \u00B7 ' + s.y : '');
  }
  HK.select = function (i) {
    var k = HE_SOURCES[i], s = SRC[i];
    txt($('whoName'), ROMAN[i] + ' \u00B7 ' + s.n); txt($('sumVoice'), s.n); txt($('dvT'), 'Voice ' + ROMAN[i]);
    txt($('fxSrcT'), 'Voice ' + ROMAN[i] + ' sends'); txt($('pinT'), 'Pinned \u00B7 ' + s.n);
    fill($('pins'), PIN[k].map(function (q) { return k + '.' + q; }));
    fill($('sendk'), [k + '.rev', k + '.spr', k + '.hsend']);
    axes(i); tokens(); sync(); later();
  };

  /* ---------- rail: drawers, octave, Hold, Freeze ---------- */
  function drawer(id, force) {
    var open = force !== undefined ? force : $(id).hidden;
    ['drVoice', 'drFx', 'drLoop', 'drIn'].forEach(function (d) { $(d).hidden = !(open && d === id); });
    document.querySelectorAll('.rt[data-dr]').forEach(function (b) { b.setAttribute('aria-expanded', !$(b.dataset.dr).hidden ? 'true' : 'false'); });
  }
  document.querySelectorAll('[data-dr]').forEach(function (b) { b.addEventListener('click', function () { drawer(b.dataset.dr); }); });
  document.querySelectorAll('.dclose').forEach(function (b) { b.addEventListener('click', function () { drawer('drVoice', false); }); });
  HK.oct = function (n) { txt($('octV'), (n > 0 ? '+' : '') + n); };
  $('octDn').addEventListener('click', function () { H.oct(H.oct() - 1); });
  $('octUp').addEventListener('click', function () { H.oct(H.oct() + 1); });
  $('holdBtn').addEventListener('click', function () { var id = HE_SOURCES[H.sel()] + '.hold'; H.setParam(id, P[id] > .5 ? 0 : 1); });
  $('frzBtn').addEventListener('click', function () { H.setParam('aura.freeze', P['aura.freeze'] > .5 ? 0 : 1); });
  function sync() {
    var k = HE_SOURCES[H.sel()];
    $('holdBtn').setAttribute('aria-pressed', P[k + '.hold'] > .5 ? 'true' : 'false');
    $('holdBtn').title = 'Hold ' + SRC[H.sel()].n + ': keep it sounding hands-free (H)';
    $('frzBtn').setAttribute('aria-pressed', P['aura.freeze'] > .5 ? 'true' : 'false');
  }

  /* ---------- the chain strip: the signal flow, live ---------- */
  var chain = $('chain');
  chain.innerHTML = '<span class="lab">Chain</span>' +
    '<button class="ch" data-dr="drVoice" id="chV" title="Voices that are not muted"><b>Voices</b><em></em></button><i>\u2192</i>' +
    '<button class="ch" data-dr="drVoice" id="chS" title="The selected voice\'s channel strip: Grit, Level, Pan, then Distance"><b></b>Grit <em data-k="drive"></em>Level <em data-k="level"></em></button><i>\u2192</i>' +
    '<span class="chgrp" title="Shared returns: each voice sends into them">' +
    '<button class="ch" data-dr="drFx" id="chSpr"><b>Spring</b><em></em></button><button class="ch" data-dr="drFx" id="chHarm"><b>Harmonizer</b><em></em></button>' +
    '<button class="ch" data-dr="drFx" id="chHall"><b>Hall</b><em></em></button><button class="ch" data-dr="drFx" id="chBody"><b>Body</b><em></em></button></span><i>\u2192</i>' +
    '<button class="ch" data-dr="drFx" id="chM"><b>Master</b><em></em></button><i>\u2192 out</i>';
  chain.querySelectorAll('[data-dr]').forEach(function (b) { b.addEventListener('click', function () { drawer(b.dataset.dr, true); }); });
  function chainUI() {
    var i = H.sel(), k = HE_SOURCES[i];
    txt($('chV').lastChild, HE_SOURCES.filter(function (s) { return P[s + '.mute'] <= .5; }).length + ' on');
    txt($('chS').firstChild, ROMAN[i] + ' \u00B7');
    $('chS').querySelectorAll('em').forEach(function (e) { txt(e, fmtId(k + '.' + e.dataset.k)); });
    var hot = function (id, send, val) { var b = $(id), on = send === null || P[send] > 0; b.classList.toggle('hot', !!send && on); b.classList.toggle('off', !on); txt(b.lastChild, val); };
    hot('chSpr', DEF[k + '.spr'] ? k + '.spr' : null, fmtId('spring.decay'));
    hot('chHarm', k + '.hsend', (P['harm.shift'] > 0 ? '+' : '') + Math.round(P['harm.shift']) + ' st');
    hot('chHall', k + '.rev', fmtId('rev.decay'));
    hot('chBody', 'body.amt', fmtId('body.amt'));
    txt($('chM').lastChild, fmtId('master.vol'));
    txt($('sumFx'), 'hall ' + fmtId('rev.decay'));
    var sh = $('chSpr'); sh.title = k === 'spring' ? 'Spring tank: this is the selected voice' : 'Spring tank return (voice VI). Send from this voice: ' + (DEF[k + '.spr'] ? fmtId(k + '.spr') : 'none');
    $('chHarm').title = 'Harmonizer return. Send from this voice: ' + fmtId(k + '.hsend');
    $('chHall').title = 'Hall return. Send from this voice: ' + fmtId(k + '.rev');
    $('chBody').title = 'Body and piezo: the shared wooden box';
  }

  /* ---------- presets: prev / next, starred, browse ---------- */
  var ps = $('preset'), names = Object.keys(H.PRESETS), favs = load('fav', []);
  var last = load('preset', null); if (last && names.indexOf(last) >= 0) ps.value = last;
  function presetVals(n) { var v = {}; HE_PARAMS.forEach(function (p) { v[p.id] = p.def; }); var o = H.PRESETS[n] || {}; for (var k in o) v[k] = o[k]; return v; }
  function edited() { var v = presetVals(ps.value); return HE_PARAMS.some(function (p) { return !/^input\./.test(p.id) && Math.abs(P[p.id] - v[p.id]) > 1e-9; }); }
  function pad2(n) { return ('0' + n).slice(-2); }
  function presetUI() {
    txt($('pNum'), pad2(ps.selectedIndex + 1) + '/' + pad2(names.length)); txt($('pTitle'), ps.value);
    txt($('pEdit'), edited() ? 'edited' : '');
    var f = favs.indexOf(ps.value) >= 0; $('pStar').setAttribute('aria-pressed', f ? 'true' : 'false'); $('pStar').title = f ? 'Unstar ' + ps.value : 'Star ' + ps.value;
  }
  ps.addEventListener('change', function () { store('preset', ps.value); later(); });
  function step(d) { ps.selectedIndex = (ps.selectedIndex + d + names.length) % names.length; ps.dispatchEvent(new Event('change')); }
  $('pPrev').addEventListener('click', function () { step(-1); });
  $('pNext').addEventListener('click', function () { step(1); });
  function star(n) { var i = favs.indexOf(n); if (i >= 0) favs.splice(i, 1); else favs.push(n); store('fav', favs); presetUI(); if (!$('browse').hidden) bList(); }
  $('pStar').addEventListener('click', function () { star(ps.value); });
  var onlyFav = false;
  function bList() {
    var ul = $('bList'), q = $('bFind').value.trim().toLowerCase(); ul.textContent = '';
    var list = names.filter(function (n) { return (!q || n.toLowerCase().indexOf(q) >= 0) && (!onlyFav || favs.indexOf(n) >= 0); });
    if (!list.length) { var e = document.createElement('li'); e.className = 'none'; e.textContent = onlyFav ? 'No starred presets yet. Press the star beside a name.' : 'No preset matches.'; ul.appendChild(e); return; }
    list.forEach(function (n) {
      var li = document.createElement('li'); if (n === ps.value) li.className = 'cur';
      var s = document.createElement('button'); s.className = 'star'; s.textContent = '\u2605'; s.setAttribute('aria-pressed', favs.indexOf(n) >= 0 ? 'true' : 'false'); s.setAttribute('aria-label', 'Star ' + n);
      s.addEventListener('click', function () { star(n); });
      var g = document.createElement('button'); g.className = 'go'; g.textContent = n;
      var c = Object.keys(H.PRESETS[n]).length; var sm = document.createElement('small'); sm.textContent = n === ps.value ? (edited() ? 'loaded, edited' : 'loaded') : c ? c + ' settings' : 'every knob at its default'; g.appendChild(sm);
      g.addEventListener('click', function () { ps.value = n; ps.dispatchEvent(new Event('change')); pop(null); });
      li.appendChild(s); li.appendChild(g); ul.appendChild(li);
    });
  }
  $('bFind').addEventListener('input', bList);
  $('bStarred').addEventListener('click', function () { onlyFav = !onlyFav; this.setAttribute('aria-pressed', onlyFav ? 'true' : 'false'); bList(); });

  /* ---------- popovers: Browse and the menu ---------- */
  var popOpen = null;
  function pop(id, anchor, alignRight) {
    if (popOpen) { $(popOpen).hidden = true; var ob = document.querySelector('[aria-controls="' + popOpen + '"]'); if (ob) ob.setAttribute('aria-expanded', 'false'); }
    if (!id || id === popOpen) { popOpen = null; return; }
    var el = $(id); el.hidden = false; popOpen = id; anchor.setAttribute('aria-expanded', 'true');
    var r = anchor.getBoundingClientRect(), w = el.offsetWidth;
    var left = alignRight ? r.right - w : r.left + r.width / 2 - w / 2;
    el.style.left = Math.max(6, Math.min(innerWidth - w - 6, left)) + 'px'; el.style.top = (r.bottom + 6) + 'px';
    if (id === 'browse') { $('bFind').value = ''; bList(); $('bFind').focus(); }
  }
  $('pBrowse').addEventListener('click', function () { pop('browse', $('pBrowse')); });
  $('pTitle').addEventListener('click', function () { pop('browse', $('pBrowse')); });
  $('menuBtn').addEventListener('click', function () { pop('menu', $('menuBtn'), true); });
  ['retro', 'share', 'power', 'aboutBtn', 'psave', 'pload'].forEach(function (id) { $(id).addEventListener('click', function () { pop(null); }); });
  document.addEventListener('pointerdown', function (e) {
    if (popOpen && !$(popOpen).contains(e.target) && !e.target.closest('[aria-controls="' + popOpen + '"]') && e.target !== $('pTitle')) pop(null);
  }, true);

  /* ---------- MIDI learn from the top bar: press it, then click a control ---------- */
  var picking = false, swallow = false;
  function pick(on) { picking = on; document.body.classList.toggle('picking', on); learnBtn(); if (on) H.toast('MIDI learn: click the knob, switch or selector to control. Esc cancels.'); }
  function learnBtn() { $('mlBtn').setAttribute('aria-pressed', picking || H.learning() ? 'true' : 'false'); }
  $('mlBtn').addEventListener('click', function () { if (H.learning()) { H.learnStop(); H.toast('MIDI learn cancelled.'); learnBtn(); } else pick(!picking); });
  function ctlAt(t) { var m = H.ctlEls(); for (var id in m) if (m[id].some(function (el) { return el.contains(t); })) return id; return null; }
  window.addEventListener('pointerdown', function (e) {
    if (!picking || e.button > 0) return;
    if (e.target.closest && e.target.closest('#mlBtn')) return;
    var id = ctlAt(e.target); if (!id) return;
    e.preventDefault(); e.stopPropagation(); swallow = true; pick(false); H.learn(id); setTimeout(learnBtn, 50);
  }, true);
  window.addEventListener('click', function (e) { if (swallow) { swallow = false; e.preventDefault(); e.stopPropagation(); } }, true);
  window.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (popOpen) { e.preventDefault(); e.stopPropagation(); pop(null); return; }
    if (picking) { e.preventDefault(); e.stopPropagation(); pick(false); H.toast('MIDI learn cancelled.'); }
    setTimeout(learnBtn, 0);
  }, true);

  /* ---------- live state from the audio thread ---------- */
  var shown = {};
  HK.tele = function (m) {
    var ly = m.ly || [], gh = ly.filter(function (l) { return l.ghost; }).length;
    var lt = m.rec ? 'recording a layer' : ly.length ? ly.length + ' layer' + (ly.length > 1 ? 's' : '') + (gh ? ' \u00B7 ' + gh + ' ghost' : '') : 'empty';
    txt($('sumLoop'), lt);
    var gr = 20 * Math.log10(Math.max(1e-4, m.gr || 1)); txt($('limT'), 'Limiter ' + (gr < -.05 ? gr.toFixed(1) : '0.0') + ' dB');
  };
  // slower bits: the record badge, sound in, MIDI learn state
  setInterval(function () {
    var on = $('rec').getAttribute('aria-pressed') === 'true';
    if (shown.rec !== on) { shown.rec = on; $('recBadge').hidden = !on; }
    if (on) txt($('recT'), $('rectime').textContent);
    var st = $('inState').textContent, live = st !== 'Off';
    txt($('sumIn'), live ? (st.indexOf('Mic') === 0 ? 'mic' : 'file') : 'off');
    learnBtn();
  }, 250);

  /* ---------- changes from anywhere (knobs, MIDI, undo, presets, moments) ---------- */
  var laterQ = 0;
  function later() { if (laterQ) return; laterQ = requestAnimationFrame(function () { laterQ = 0; presetUI(); chainUI(); sync(); tokens(); axes(H.sel()); }); }
  HK.param = function () { later(); };

  /* ---------- the board ---------- */
  var pad = $('pad'), hover = { x: .5, y: .45, on: false }, rest = { x: .5, y: .45 };
  pad.addEventListener('pointermove', function (e) { var r = pad.getBoundingClientRect(); hover.x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)); hover.y = Math.min(1, Math.max(0, 1 - (e.clientY - r.top) / r.height)); hover.on = true; });
  pad.addEventListener('pointerleave', function () { hover.on = false; });
  var LET1 = 'ABCDEFGHIJKLM', LET2 = 'NOPQRSTUVWXYZ', FONT = '"HE Fell","IM FELL English SC",Georgia,serif';
  var bg = null, lay = null;
  function layout(w, h) {
    var fs = Math.max(20, Math.min(52, Math.min(w / 28, h / 15.8))), L = [];
    var arc = function (s, rx, ry, cy, c0, row) {
      var t0 = Math.acos(c0);
      for (var i = 0; i < s.length; i++) {
        var th = Math.PI - t0 - (Math.PI - 2 * t0) * i / (s.length - 1), x = w / 2 + rx * w * Math.cos(th), y = cy * h - ry * h * Math.sin(th);
        L.push({ ch: s[i], x: x, y: y, r: Math.atan2(ry * h * Math.cos(th), rx * w * Math.sin(th)), row: row });
      }
    };
    arc(LET1, .5, .678, 1.068, .82, 0); arc(LET2, .46, .591, 1.171, .804, 1);
    return { w: w, h: h, fs: fs, L: L, sp: Math.hypot(L[1].x - L[0].x, L[1].y - L[0].y) };
  }
  function rulerY(x, h) { var u = (x - .5) / .5; return h * (.255 + .075 * u * u); }
  // the voice's own x-to-pitch mapping (engine.js), so the rule marks real semitones
  function ruler() {
    var k = HE_SOURCES[H.sel()];
    if (k === 'ebow') { var r = P['ebow.slide'] || 1; return { lo: -12 * Math.round(r), hi: 12 * Math.round(r), x: function (s) { return .5 + s / (24 * r); }, st: function (x) { return (x - .5) * 24 * r; }, q: false, max: 12 * r }; }
    if (k === 'struck' && (P['struck.object'] | 0) !== 0) return { lo: -18, hi: 18, x: function (s) { return .5 + s / 36; }, st: function (x) { return (x - .5) * 36; }, q: false, max: 18 };
    if (k === 'hurdy' && P['hurdy.melody'] > .5) return { lo: 0, hi: 12, x: function (s) { return s / 12; }, st: function (x) { return Math.round(x * 12); }, q: true, max: 12 };
    return null;
  }
  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  function paintBg(W, H2, d) {
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H2; var c = cv.getContext('2d'); if (!c) return null;
    var w = W / d, h = H2 / d; c.scale(d, d);
    var g = c.createRadialGradient(w * .5, h * .42, 0, w * .5, h * .42, Math.max(w, h) * .75);
    g.addColorStop(0, '#2b2019'); g.addColorStop(.55, '#1b1411'); g.addColorStop(1, '#0f0b09'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    // grain: long, slightly wandering strokes, like the figure in a lacquered board
    var R = rng(9137), n = Math.round(h / 2.6);
    for (var i = 0; i < n; i++) {
      var y = R() * h, a = 1 + R() * 5, f = .002 + R() * .006, ph = R() * 6.28, dark = R() < .35;
      c.strokeStyle = dark ? 'rgba(0,0,0,' + (.06 + R() * .08).toFixed(3) + ')' : 'rgba(255,232,196,' + (.010 + R() * .022).toFixed(3) + ')';
      c.lineWidth = .5 + R() * 1.3; c.beginPath();
      for (var x = -10; x <= w + 10; x += 14) { var yy = y + a * Math.sin(x * f + ph) + 2 * Math.sin(x * f * 3.1 + ph * 2); if (x < 0) c.moveTo(x, yy); else c.lineTo(x, yy); }
      c.stroke();
    }
    // lacquer sheen and a faint sunburst rising behind Goodbye (the old Surface's emblem)
    var sh = c.createLinearGradient(0, 0, w, h); sh.addColorStop(0, 'rgba(255,240,210,.035)'); sh.addColorStop(.45, 'rgba(255,240,210,0)'); sh.addColorStop(1, 'rgba(0,0,0,.12)');
    c.fillStyle = sh; c.fillRect(0, 0, w, h);
    c.save(); c.translate(w / 2, h + 4); c.strokeStyle = 'rgba(201,168,101,.07)'; c.lineWidth = 1;
    for (i = 0; i <= 18; i++) { var t = Math.PI + i * Math.PI / 18; c.beginPath(); c.moveTo(Math.cos(t) * h * .14, Math.sin(t) * h * .14); c.lineTo(Math.cos(t) * h * (i % 3 ? .26 : .32), Math.sin(t) * h * (i % 3 ? .26 : .32)); c.stroke(); }
    c.beginPath(); c.arc(0, 0, h * .14, Math.PI, 2 * Math.PI); c.stroke(); c.restore();
    // inlay rule and corner stars
    c.strokeStyle = 'rgba(201,168,101,.16)'; c.lineWidth = 1; c.strokeRect(16.5, 16.5, w - 33, h - 33);
    [[16.5, 16.5], [w - 16.5, 16.5], [16.5, h - 16.5], [w - 16.5, h - 16.5]].forEach(function (p) { c.save(); c.translate(p[0], p[1]); c.rotate(Math.PI / 4); c.fillStyle = 'rgba(201,168,101,.4)'; c.fillRect(-2.5, -2.5, 5, 5); c.restore(); });
    var v = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .35, w / 2, h / 2, Math.max(w, h) * .72);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.5)'); c.fillStyle = v; c.fillRect(0, 0, w, h);
    return cv;
  }
  // Dread look: vis is 0 at Dread 0 (the board draws exactly as before). glow follows the
  // output level (starved when quiet). flick is a slight pulse; it stays 1 when motion is reduced.
  function dreadLook(D, lvl, still, t) {
    D = D < 0 ? 0 : D > 1 ? 1 : +D;
    if (!(D > 0)) return { vis: 0, dark: 0, hole: .62, glow: 0, flick: 1 };
    var tone = Math.min(1, (lvl < 0 ? 0 : lvl) * 4);
    var glow = D * (.22 + .78 * tone);
    var flick = 1;
    if (!still) flick = .88 + .12 * Math.sin((t || 0) * .069) * (.35 + .65 * tone);
    return { vis: D, dark: .15 * D + .55 * D * D, hole: .62 - .44 * D, glow: glow, flick: flick };
  }
  var lastDs = '', lastGs = '';
  function dreadCSS(vis, glow) {
    var b = $('board'), ds = vis.toFixed(3), gs = glow.toFixed(3);
    if (ds !== lastDs) { lastDs = ds; b.style.setProperty('--dread', ds); }
    if (gs !== lastGs) { lastGs = gs; b.style.setProperty('--dread-glow', gs); }
  }
  function planchette(c, x, y, s, live, pr, lvl, look) {
    c.save(); c.translate(x, y); c.scale(s, s);
    var body = new Path2D('M0 -46 C 27 -46, 43 -18, 41 4 C 39 25, 17 48, 0 49 C -17 48, -39 25, -41 4 C -43 -18, -27 -46, 0 -46 Z');
    var ember = look && look.vis, ev = ember ? look.vis : 0, eg = ember ? look.glow * look.flick : 0;
    c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 14; c.shadowOffsetY = 6;
    var g = c.createRadialGradient(0, -2, 6, 0, 0, 52);
    g.addColorStop(0, 'rgba(233,211,154,0)'); g.addColorStop(.3, 'rgba(201,168,101,' + (live ? .20 : .12) + ')'); g.addColorStop(.75, 'rgba(201,168,101,' + (live ? .13 : .08) + ')'); g.addColorStop(1, 'rgba(120,96,60,.16)');
    c.fillStyle = g; c.fill(body); c.shadowColor = 'transparent';
    c.lineWidth = 1.5; c.strokeStyle = 'rgba(233,211,154,' + (live ? .85 : .5) + ')'; c.stroke(body);
    c.save(); c.scale(.88, .88); c.lineWidth = .8; c.strokeStyle = 'rgba(233,211,154,.22)'; c.stroke(body); c.restore();
    // felt feet
    c.fillStyle = 'rgba(10,7,5,.55)'; [[0, -36], [-27, 30], [27, 30]].forEach(function (p) { c.beginPath(); c.arc(p[0], p[1], 2.6, 0, 6.283); c.fill(); });
    // the lens: a glowing glass eye over the letter (ember as Dread rises; it stays lit at full Dread)
    var gl = live ? .55 + .45 * pr + Math.min(.4, lvl) : .25;
    if (ember) gl = Math.max(gl, .35 + .65 * eg);
    var halo = ember ? 'rgba(255,80,28,' : 'rgba(233,211,154,';
    c.shadowColor = halo + Math.min(1, ember ? .4 + .7 * gl : gl).toFixed(2) + ')'; c.shadowBlur = (live ? 10 + 18 * pr : 4) + (ember ? 8 + 16 * eg : 0);
    c.beginPath(); c.arc(0, 0, 15, 0, 6.283); c.lineWidth = 1.6;
    c.strokeStyle = ember ? (live ? '#ffb08a' : 'rgba(255,140,80,' + (.45 + .4 * ev).toFixed(2) + ')') : (live ? '#f1dfae' : 'rgba(233,211,154,.6)');
    c.stroke();
    c.shadowBlur = 0; var lg = c.createRadialGradient(-4, -5, 1, 0, 0, 15);
    if (ember) { lg.addColorStop(0, 'rgba(255,170,110,' + ((live ? .22 : .1) + .28 * ev + .2 * eg).toFixed(2) + ')'); lg.addColorStop(1, 'rgba(255,90,30,.04)'); }
    else { lg.addColorStop(0, 'rgba(255,246,220,' + (live ? .22 : .1) + ')'); lg.addColorStop(1, 'rgba(255,246,220,.02)'); }
    c.fillStyle = lg; c.fill();
    c.beginPath(); c.arc(0, 0, 11, Math.PI * 1.1, Math.PI * 1.45); c.strokeStyle = ember ? 'rgba(255,200,160,.55)' : 'rgba(255,250,235,.45)'; c.lineWidth = 1.2; c.stroke();
    c.restore();
  }
  var lastHL = '';
  HK.art = function (c, S) {
    var d = S.dpr, W = S.W, Hh = S.H, w = W / d, h = Hh / d, i;
    if (!bg || bg.width !== W || bg.height !== Hh) { bg = paintBg(W, Hh, d); lay = null; }
    if (!lay || lay.w !== w || lay.h !== h) lay = layout(w, h);
    c.setTransform(1, 0, 0, 1, 0, 0); if (bg) c.drawImage(bg, 0, 0); else { c.fillStyle = '#1b1411'; c.fillRect(0, 0, W, Hh); }
    c.setTransform(d, 0, 0, d, 0, 0);
    var lvl = S.tm ? Math.max(S.tm.pk[0], S.tm.pk[1]) : 0;
    var now = performance.now();
    var look = dreadLook(P['macro.dread'] || 0, lvl, S.still, now);
    dreadCSS(look.vis, look.glow * look.flick);
    var p = S.down ? S.cur : hover.on ? hover : rest; if (S.down || hover.on) { rest.x = p.x; rest.y = p.y; }
    var px = p.x * w, py = (1 - p.y) * h, live = S.down;
    // Dread: the wood darkens and a vignette closes in (skipped entirely at Dread 0)
    if (look.vis) {
      c.fillStyle = 'rgba(4,1,1,' + look.dark.toFixed(3) + ')'; c.fillRect(0, 0, w, h);
      var vr = Math.max(w, h), vg = c.createRadialGradient(w * .5, h * .48, look.hole * vr, w * .5, h * .48, vr * (.72 - .1 * look.vis));
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(6,1,0,' + (.35 + .6 * look.vis).toFixed(3) + ')');
      c.fillStyle = vg; c.fillRect(0, 0, w, h);
    }
    // candlelight pooling under the planchette, brighter as it sounds (ember, and smaller, as Dread rises)
    var cg = c.createRadialGradient(px, py, 0, px, py, Math.max(w, h) * (.32 - (look.vis ? .1 * look.vis : 0))), ca = (live ? .08 + Math.min(.22, lvl * .6) : .035);
    if (look.vis) ca *= 1 - look.vis * .35;
    if (look.vis) { cg.addColorStop(0, 'rgba(255,110,50,' + (ca * (.8 + .7 * look.glow)).toFixed(3) + ')'); cg.addColorStop(1, 'rgba(255,80,30,0)'); }
    else { cg.addColorStop(0, 'rgba(255,196,120,' + ca.toFixed(3) + ')'); cg.addColorStop(1, 'rgba(255,196,120,0)'); }
    c.fillStyle = cg; c.fillRect(0, 0, w, h);
    // the machine's own voice as a faint smoke line
    if (S.analyser && !S.still) {
      var smo = Math.min(.32, .08 + lvl * .6) * (look.vis ? 1 - look.vis * .75 : 1);
      S.analyser.getFloatTimeDomainData(S.scope); c.strokeStyle = 'rgba(201,168,101,' + smo.toFixed(3) + ')'; c.lineWidth = 1.2; c.beginPath();
      for (i = 0; i < 1024; i += 4) { var sx = i / 1020 * w, sy = h * .53 - S.scope[i] * h * .2; if (i) c.lineTo(sx, sy); else c.moveTo(sx, sy); }
      c.stroke();
    }
    // the brass rule: semitones for voices with pitch on x
    var R = ruler(), j;
    var fade = look.vis ? 1 - look.vis * .82 : 1;
    c.lineWidth = 1; c.strokeStyle = 'rgba(201,168,101,' + (.30 * fade).toFixed(3) + ')'; c.beginPath();
    for (j = 0; j <= 60; j++) { var rx = j / 60 * w, ry = rulerY(j / 60, h); if (j) c.lineTo(rx, ry); else c.moveTo(rx, ry); }
    c.stroke();
    var stNow = R ? R.st(p.x) : null;
    if (R) {
      var span = R.hi - R.lo, every = w / span < 6 ? 2 : 1;
      c.font = '400 12px "HE Mono","IBM Plex Mono",Consolas,monospace'; c.textAlign = 'center'; c.textBaseline = 'bottom';
      for (var s = R.lo; s <= R.hi; s++) {
        var oc = s % 12 === 0; if (!oc && s % every) continue;
        var tx = R.x(s); if (tx < -.001 || tx > 1.001) continue;
        var X = tx * w, Y = rulerY(tx, h), near = live && Math.abs((R.q ? stNow : Math.round(stNow)) - s) < .5;
        if (look.vis && (near || oc)) {
          var gN = look.glow * look.flick;
          c.strokeStyle = near ? 'rgba(255,150,90,' + (.7 + .3 * gN).toFixed(3) + ')' : 'rgba(255,120,60,' + (.35 + .45 * gN).toFixed(3) + ')';
          c.shadowColor = 'rgba(255,70,20,' + (.25 + .55 * gN).toFixed(3) + ')'; c.shadowBlur = 8 + 10 * gN;
        } else c.strokeStyle = near ? 'rgba(246,231,191,.95)' : oc ? 'rgba(201,168,101,.7)' : 'rgba(201,168,101,.48)';
        c.lineWidth = near ? 2 : 1;
        c.beginPath(); c.moveTo(X, Y); c.lineTo(X, Y + (oc ? 14 : 8)); c.stroke();
        if (oc) {
          c.fillStyle = look.vis ? 'rgba(255,160,110,' + (.45 + .5 * look.glow * look.flick).toFixed(3) + ')' : 'rgba(203,189,159,.8)';
          c.textAlign = X < 24 ? 'left' : X > w - 24 ? 'right' : 'center'; c.fillText(s === 0 ? '0' : (s > 0 ? '+' : '\u2212') + Math.abs(s), X < 24 ? X + 22 : X > w - 24 ? X - 22 : X, Y - 3);
        }
        if (look.vis) c.shadowBlur = 0;
      }
    } else { c.fillStyle = 'rgba(201,168,101,' + (.45 * fade).toFixed(3) + ')'; c.save(); c.translate(w / 2, rulerY(.5, h)); c.rotate(Math.PI / 4); c.fillRect(-3, -3, 6, 6); c.restore(); }
    // dotted trail of the last strokes
    var T = S.trail;
    if (T.length > 1) {
      var acc = 0;
      for (i = T.length - 1; i > 0; i--) {
        var age = (now - T[i].t) / 1600; if (age > 1) break;
        var ax = T[i].x * w, ay = (1 - T[i].y) * h, bx = T[i - 1].x * w, by = (1 - T[i - 1].y) * h, seg = Math.hypot(bx - ax, by - ay);
        acc += seg; if (acc < 8) continue; acc = 0;
        c.fillStyle = 'rgba(233,211,154,' + (.55 * (1 - age) * fade).toFixed(3) + ')'; c.beginPath(); c.arc(ax, ay, 1.4, 0, 6.283); c.fill();
      }
    }
    // the letters: faint, lit by the planchette; ember-red as Dread rises, flaring with the sound
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '400 ' + lay.fs.toFixed(1) + 'px ' + FONT;
    var best = -1, bd = 1e9;
    for (i = 0; i < lay.L.length; i++) { var Lt = lay.L[i], dd = Math.hypot(Lt.x - px, Lt.y - py); if (dd < bd) { bd = dd; best = i; } }
    var reach = lay.sp * 2.2, lit = bd < lay.sp * .75 ? best : -1;
    var gL = look.vis ? look.glow * look.flick : 0;
    for (i = 0; i < lay.L.length; i++) {
      var q = lay.L[i], dq = Math.hypot(q.x - px, q.y - py), a0 = (q.row ? .20 : .26) + Math.min(.08, lvl * .2), a = a0;
      if (dq < reach) a = a0 + (live ? .42 : .14) * (1 - dq / reach);
      c.save(); c.translate(q.x, q.y); c.rotate(q.r);
      if (look.vis) {
        // as the wood goes dark the letters become the light, starved when quiet, flaring with the sound
        var nearL = dq < reach ? 1 - dq / reach : 0, aL = Math.min(1, a + look.vis * (.28 + .5 * gL) + nearL * .2);
        var er = Math.round(236 + (255 - 236) * look.vis), eg2 = Math.round(225 + (96 - 225) * look.vis), eb = Math.round(200 + (40 - 200) * look.vis);
        c.shadowColor = 'rgba(255,70,18,' + (.15 * look.vis + .7 * gL + .2 * nearL).toFixed(3) + ')';
        c.shadowBlur = 6 * look.vis + 18 * gL + (i === lit && live ? 10 : 0);
        c.fillStyle = (i === lit && live) ? 'rgb(' + er + ',' + Math.min(255, eg2 + 40) + ',' + Math.min(255, eb + 40) + ')' : 'rgba(' + er + ',' + eg2 + ',' + eb + ',' + aL.toFixed(3) + ')';
      } else if (i === lit && live) { c.shadowColor = 'rgba(233,211,154,.9)'; c.shadowBlur = 14; c.fillStyle = '#f6e7bf'; }
      else c.fillStyle = 'rgba(236,225,200,' + a.toFixed(3) + ')';
      c.fillText(q.ch, 0, 0); c.restore();
    }
    // Junk Tray: the pieces chasing the magnet
    if (S.sel === 6 && S.junk) {
      var J = S.junk, n = (J.length - 3) / 3;
      for (i = 0; i < n; i++) { c.strokeStyle = i % 3 ? 'rgba(236,225,200,' + (.6 * fade).toFixed(3) + ')' : 'rgba(201,168,101,' + (.85 * fade).toFixed(3) + ')'; c.lineWidth = 1.4; c.beginPath(); c.arc(J[i * 3] * w, (1 - J[i * 3 + 1]) * h, Math.max(2.5, J[i * 3 + 2] * Math.min(w, h) * .8), 0, 6.283); c.stroke(); }
    }
    planchette(c, px, py, Math.max(.75, Math.min(1.4, h / 540)) * (1 + (live ? .06 * S.cur.p : 0)), live, live ? S.cur.p : 0, lvl, look);
    // the reading in the corner
    var hl = live ? (lit >= 0 ? lay.L[lit].ch : '\u00B7') + (R ? '  \u00B7  ' + (stNow > 0 ? '+' : stNow < 0 ? '\u2212' : '') + (R.q ? Math.abs(stNow) : Math.abs(stNow).toFixed(1)) + ' st' : '  \u00B7  x ' + Math.round(p.x * 100) + '  y ' + Math.round(p.y * 100)) : '';
    if (hl !== lastHL) { lastHL = hl; $('hl').textContent = hl; }
  };

  /* ---------- once: the spring tank's knobs in the Effects drawer, first sync ---------- */
  fill($('sprk'), ['spring.decay', 'spring.tension', 'spring.disp']);
  HK.select(H.sel()); HK.oct(H.oct()); presetUI();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { lay = null; });
  window.__seance = { drawer: drawer, step: step, pick: pick, ruler: ruler, layout: function () { return lay; }, dreadLook: dreadLook };
})();
