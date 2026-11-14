/* The Machine: one continuous instrument. Every part is bolted to one wooden
   spine and plays the same engine gestures as the Surface.
   Horror Engine (c) 2026 Garyck Arntzen (https://x.com/_mintydoge), MIT licence. */
(function () {
  'use strict';
  var Q = new URLSearchParams(location.search);
  window.__heMachine = 'v2';
  var H = window.__he, $ = function (id) { return document.getElementById(id); };
  var host = $('machine'), padEl = $('pad'), V = null, tab = 'surface', TAU = Math.PI * 2;
  var PR0 = 1;   // the renderer's base pixel ratio (before the cap and the dynamic scale)
  // the loading screen (#mload in body.html): stays over the view until the scene is built, every shader warmed, the
  // textures in at full size and the frames running smoothly again, then fades. Progress and status come from the real
  // load phases. All motion is CSS transform/opacity, so it keeps moving while the main thread is busy.
  var LMSG = /[?&]skin=altar/.test(location.search) || (!/[?&]skin=/.test(location.search) && (function () { try { return localStorage.getItem('horror-engine.skin') === 'altar'; } catch (e) { return false; } })())
    ? ['Laying out the altar', 'Carving the sigils', 'Letting the blood dry', 'Stringing the gut', 'Lighting the candles'] : ['Assembling the machine', 'Warming the valves', 'Staining the wood', 'Tuning the strings', 'Letting the lamp settle'];
  var LD = (function () {
    var el = $('mload'), on = !!el, t0 = performance.now(), loaded = 0, smooth = 0, last = 0, avg = 0, tm = null, shown = -1;
    if (!el) return { on: false, tick: function () { }, fail: function () { }, hide: function () { } };
    ['pointerdown', 'pointermove', 'pointerup', 'mousedown', 'wheel', 'touchstart', 'contextmenu', 'click'].forEach(function (ev) { el.addEventListener(ev, function (e) { if (LD.on) { e.stopPropagation(); if (ev === 'wheel' || ev === 'contextmenu') e.preventDefault(); } }, { passive: false }); });
    var bar = $('mlP'), st = $('mlS'), nn = $('mlN');
    function set(p, msg, n) { p = Math.max(shown, Math.min(1, p)); if (p !== shown) { shown = p; bar.style.transform = 'scaleX(' + p.toFixed(3) + ')'; } if (st.textContent !== msg) st.textContent = msg; if (nn.textContent !== (n || '')) nn.textContent = n || ''; }
    function hide() { if (!LD.on) return; LD.on = false; clearInterval(tm); set(1, st.textContent, nn.textContent); el.classList.add('out'); el.setAttribute('aria-busy', 'false');
      setTimeout(function () { el.hidden = true; }, 1000); }
    function fail(msg) { if (!LD.on) return; el.classList.add('err'); set(shown, msg, ''); setTimeout(hide, 6000); }
    // smoothness after the load: count frames that are on time against this machine's own frame rate, so a long task right
    // after the textures (the post-load stall) is still behind the curtain when it lifts
    function frameTick(now) { if (!LD.on) return; if (last) { var d = now - last; avg = avg ? avg * .9 + Math.min(d, 250) * .1 : d; smooth = d < Math.max(50, avg * 2.2) ? smooth + 1 : 0; } last = now; requestAnimationFrame(frameTick); }
    function tick() {
      if (!LD.on) return; var now = performance.now();
      if (now - t0 > 240000) return hide();   // never hang: after four minutes show whatever is there
      if (!V) return set(.04, LMSG[0]);
      if (!V.ready) {
        if (V.compileMs == null) { var w = V.warmN ? Math.min(1, V.warmSteps.length * V.warmB / V.warmN) : 0; return set(.1 + .42 * w, LMSG[1]); }
        return set(.54 + .08 * Math.min(1, V.halfQ.length / Math.max(1, V.nTex)), LMSG[2]);
      }
      var hiT = V.hiTotal || 0, hiD = Math.min(V.hiDone, hiT), texDone = !hiT || V.hiFail || (hiD >= hiT && !V.hiCur);
      if (!texDone) return set(.64 + .3 * hiD / hiT, LMSG[3], 'textures ' + hiD + '/' + hiT);
      if (!loaded) { loaded = now; smooth = 0; }
      set(.95 + .05 * Math.min(1, smooth / 20), LMSG[4], hiT ? 'textures ' + hiT + '/' + hiT : '');
      if ((smooth >= 20 && now - loaded > 300) || now - loaded > 8000) hide();
    }
    var LD = { on: on, tick: tick, fail: fail, hide: hide };
    tm = setInterval(tick, 100); requestAnimationFrame(frameTick); el.setAttribute('aria-busy', 'true');
    window.addEventListener('error', function (e) { if (LD.on) fail('The machine hit an error while loading: ' + (e.message || 'unknown') + '. Showing what is there.'); });
    window.addEventListener('unhandledrejection', function (e) { if (LD.on) fail('The machine hit an error while loading. Showing what is there.'); });
    return LD;
  })();
  var ZB = .62, ZT = .92;
  var LS = function (k, v) { try { if (v === undefined) return localStorage.getItem('horror-engine.' + k); localStorage.setItem('horror-engine.' + k, v); } catch (e) { return null; } };
  var QUAL = Q.get('quality') || LS('quality') || 'high';
  // the skin: the same parts, zones and voices in different clothes. 'workshop' is the walnut cabinet built below; 'altar'
  // (src/altar.js) swaps every part for a stand-in on a blood-stained altar. ?skin=altar, or the button over the view.
  var SKIN = (Q.get('skin') || LS('skin') || 'workshop').toLowerCase(), SK = SKIN === 'altar' && window.HEAltar && window.HESculpt ? window.HEAltar : null;
  var PDEF = {}; window.HE_PARAMS.forEach(function (p) { PDEF[p.id] = p; });

  // hints, one per part (the label at the top of the view)
  var HINT = {
    string: '\u2461 Slack string \u00B7 tap it to strike (Shift: pluck), keep dragging to slide the bar \u2014 the Blaster Beam.',
    puck: '\u2461 E-bow \u00B7 run it along the string. Nearer you: fundamental, then 2nd, 3rd, and at the far edge it flips harmonics on its own; Shift drives harder.',
    bar: '\u3233 Slide bar \u00B7 drag it along the groove after a strike to bend the boom.',
    crank: '\u2463 Hurdy crank \u00B7 circle it. Faster cranks harder; jerk it for the buzz.',
    drones: '\u2464 Drone strings \u00B7 drag along them while it cranks: the touch point picks the note.',
    rulers: '\u2465 Steel rulers \u00B7 stroke across a ruler to bow it, tap to strike it. Each ruler is its own note.',
    clamp: '\u2465 Ruler clamp \u00B7 drag toward you or away to slide all four rulers (longer is lower).',
    rods: '\u2467 Waterphone rods \u00B7 stroke across to bow, tap to strike. While bowing, push up or down to rock the tray: the water runs to the low end and bends those rods.',
    tray: '\u2466 Water tray \u00B7 grab the rim and push one end down to rock it; let go and it sways back (Shift as you let go holds the tilt).',
    saw: '\u3254 Bow saw \u00B7 stroke across the blade to bow it, tap to strike it. Drag up or down while bowing to bend the blade and the note.',
    slate: '\u2468 Slate \u00B7 drag the chalk across it (Alt: a fingernail).',
    bottle: '\u2469 Bottle \u00B7 rub its shoulder with a wet finger (Alt: a nail).',
    filltap: '\u2466 Tray tap \u00B7 drag up to fill the tray, down to drain it (the water level).',
    pane: '\u2468 Glass pane \u00B7 drag a fingernail over it (Alt: chalk).',
    wine: '\u2469 Wine glass \u00B7 circle the rim with a wet finger. More water in the glass, lower note.',
    gtap: '\u2469 Glass tap \u00B7 hold to run water into the glass, Shift-hold to drain it.',
    drum: '\u246A Drumhead \u00B7 tap for a thump. Grab the right-hand superball to make it moan.',
    drawer: '\u246B Junk drawer \u00B7 pull the handle toward you to open it.',
    junk: '\u246B Magnet \u00B7 drag over the junk to stir it: steel nuts on the left, mixed in the middle, brass on the right.',
    spring: '\u246C Spring tank \u00B7 tap for the drip, drag along to scrape, drag up and down to shake it (Alt: e-bow it). Knocks on the wood set it off too.',
    wandL: '\u246D Left superball \u00B7 pick it up and drag it over the thunder sheet, the rods or the left of the box.',
    wandR: '\u246D Right superball \u00B7 pick it up and drag it over the drumhead or the right of the box.',
    sheet: '\u246E Thunder sheet \u00B7 click to hit it; press and drag across it to rub it into a moan (faster is louder and higher). The left superball moans it too.',
    wood: '\u2460 The spine \u00B7 knock on the bare wood. Everything is bolted to it, so it rings along.',
    knob: '\u2470 Brain panel \u00B7 drag a knob up or down.',
    send: '\u2470 Harmonizer send \u00B7 drag sideways: how much of the selected voice goes into the harmonizer.',
    freeze: '\u2470 Freeze \u00B7 pins the aura pad.',
    loop: '\u2470 Loop \u00B7 start or close a gesture loop (also Space).',
    piezo: '\u2472 Piezo disc \u00B7 click to change the contact-mic character.',
    coil: '\u3251 Clock spring \u00B7 stroke across to bow it, tap to strike it.',
    lamp: '\u3252 Lamp \u00B7 rub it to swell the aura pad; double-click to freeze it.'
  };

  if (SK) Object.assign(HINT, SK.HINT);

  /* ---------- procedural textures: value noise, then colour, roughness and a normal map from a height field ---------- */
  var PERM = new Uint8Array(512);
  (function () { var p = [], s = 11, i; for (i = 0; i < 256; i++) p[i] = i; for (i = 255; i > 0; i--) { s = (s * 16807) % 2147483647; var j = s % (i + 1), t = p[i]; p[i] = p[j]; p[j] = t; } for (i = 0; i < 512; i++) PERM[i] = p[i & 255]; })();
  function vn(x, y) { var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; xi &= 255; yi &= 255; var a = PERM[PERM[xi] + yi], b = PERM[PERM[xi + 1] + yi], c = PERM[PERM[xi] + yi + 1], d = PERM[PERM[xi + 1] + yi + 1], u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) / 255; }
  function fbm(x, y, o) { var s = 0, a = .5, f = 1; for (var i = 0; i < (o || 4); i++) { s += a * vn(x * f, y * f); f *= 2.03; a *= .5; } return s / (1 - Math.pow(.5, o || 4)); }
  function smooth(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  var ANISO = 8, V_TEXMS = 0;
  /* ---------- photo-scanned PBR sets (CC0: Poly Haven, ambientCG; see CREDITS.md). The file:// / Release build
     embeds them as base64 WebP in window.HE_TEX = { key: { c, n, r, s, avg } } so it works offline. The hosted
     build sets c, n, r to file URLs and fetches only the sets for the skin you are on. Workers decode them
     (createImageBitmap + OffscreenCanvas), build the mip chain, and send pixel data back. ---------- */
  // tile: metres per repeat (UVs are in metres, see HELook.worldUV); rot: turn 90 degrees so the grain runs along u
  var TSPEC = {
    oak: { tile: 1.83, rot: 1 }, walnut: { tile: 1.8, rot: 1 }, ebony: { tile: 1, rot: 1 }, floor: { tile: 3 }, brick: { tile: 3 }, plaster: { tile: 2 },
    brass: { tile: .5 }, steel: { tile: .5 }, alu: { tile: .3 }, iron: { tile: .8 }, vellum: { tile: .4 }, cloth: { tile: .25 }, stone: { tile: .6 }, crinkle: { tile: .25 },
    aWall: { tile: 2.4 }, aFloor: { tile: 2.6 }, aSheet: { tile: 1 }
  };
  // the whole mip chain, built off the main thread so the GPU upload is a plain copy (no mip generation on upload). Colour
  // is averaged in linear light (sRGB in, sRGB out), normals are averaged and renormalised, roughness is a plain average.
  function mipChain(a, w, h, kind) {
    var L = [{ data: a, width: w, height: h }], lin = null, i;
    if (kind === 'c') { lin = new Float32Array(256); for (i = 0; i < 256; i++) { var u = i / 255; lin[i] = u <= .04045 ? u / 12.92 : Math.pow((u + .055) / 1.055, 2.4); } }
    while (w > 1 || h > 1) {
      var nw = Math.max(1, w >> 1), nh = Math.max(1, h >> 1), b = new Uint8ClampedArray(nw * nh * 4), x, y, c;
      for (y = 0; y < nh; y++) for (x = 0; x < nw; x++) {
        var x0 = Math.min(2 * x, w - 1), x1 = Math.min(2 * x + 1, w - 1), y0 = Math.min(2 * y, h - 1), y1 = Math.min(2 * y + 1, h - 1), q = [(y0 * w + x0) * 4, (y0 * w + x1) * 4, (y1 * w + x0) * 4, (y1 * w + x1) * 4], o = (y * nw + x) * 4;
        if (kind === 'c') for (c = 0; c < 3; c++) { var v = (lin[a[q[0] + c]] + lin[a[q[1] + c]] + lin[a[q[2] + c]] + lin[a[q[3] + c]]) / 4; b[o + c] = 255 * (v <= .0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - .055); }
        else if (kind === 'n') { var n0 = 0, n1 = 0, n2 = 0; for (c = 0; c < 4; c++) { n0 += a[q[c]] / 127.5 - 1; n1 += a[q[c] + 1] / 127.5 - 1; n2 += a[q[c] + 2] / 127.5 - 1; } var l = 1 / (Math.sqrt(n0 * n0 + n1 * n1 + n2 * n2) || 1); b[o] = (n0 * l + 1) * 127.5; b[o + 1] = (n1 * l + 1) * 127.5; b[o + 2] = (n2 * l + 1) * 127.5; }
        else for (c = 0; c < 3; c++) b[o + c] = (a[q[0] + c] + a[q[1] + c] + a[q[2] + c] + a[q[3] + c]) / 4;
        b[o + 3] = 255;
      }
      L.push({ data: b, width: nw, height: nh }); a = b; w = nw; h = nh;
    }
    return L;
  }
  // rows come out bottom-up (v = 0 first), the DataTexture convention used throughout
  function dtex(T, data, w, h, srgb, sp) { var mip = Array.isArray(data), q = new T.DataTexture(mip ? data[0].data : data, w, h, T.RGBAFormat, T.UnsignedByteType); if (mip) { q.mipmaps = data; q.generateMipmaps = false; } else q.generateMipmaps = true; q.minFilter = T.LinearMipmapLinearFilter; q.magFilter = T.LinearFilter; q.wrapS = q.wrapT = T.RepeatWrapping; q.anisotropy = ANISO; if (srgb) q.colorSpace = T.SRGBColorSpace; if (sp) { q.repeat.set(1 / sp.tile, 1 / sp.tile); if (sp.rot) q.rotation = Math.PI / 2; } q.userData.he = 1; q.needsUpdate = true; return q; }
  function texSet(T, key, p) { var sp = TSPEC[key]; return { map: dtex(T, p.c, p.w, p.h, true, sp), roughnessMap: dtex(T, p.r, p.w, p.h, false, sp), normalMap: dtex(T, p.n, p.w, p.h, false, sp), w: p.w, h: p.h }; }
  // decode one WebP (a base64 string, or a URL in the hosted build) at size w into bottom-up RGBA bytes
  function texIsPath(s) { return typeof s === 'string' && s.length < 2048 && (s.indexOf('/') >= 0 || /\.webp(\?|$)/i.test(s) || /^(https?:|blob:)/i.test(s)); }
  function texAbs(s) { if (!texIsPath(s)) return s; try { return new URL(s, (typeof location !== 'undefined' && location.href) || self.location.href).href; } catch (e) { return s; } }
  var _texBuf = {};
  function texBytes(src) {
    if (_texBuf[src]) return Promise.resolve(_texBuf[src]);
    var load;
    if (texIsPath(src)) load = fetch(src, { cache: 'force-cache' }).then(function (r) { if (!r.ok) throw new Error('tex ' + src + ' ' + r.status); return r.arrayBuffer(); }).then(function (b) { return new Uint8Array(b); });
    else { var bin = atob(src), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); load = Promise.resolve(u); }
    return load.then(function (u) { _texBuf[src] = u; return u; });
  }
  function texDecode(src, w) {
    return texBytes(src).then(function (u) {
      return createImageBitmap(new Blob([u], { type: 'image/webp' }), { resizeWidth: w, resizeHeight: w, resizeQuality: 'high', imageOrientation: 'flipY', colorSpaceConversion: 'none', premultiplyAlpha: 'none' }).then(function (bm) {
        var cv = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, w) : (function () { var c = document.createElement('canvas'); c.width = c.height = w; return c; })();
        var x = cv.getContext('2d', { willReadFrequently: true }); x.drawImage(bm, 0, 0); if (bm.close) bm.close(); return x.getImageData(0, 0, w, w).data;
      });
    });
  }
  function texJob(j) { var t0 = Date.now(); return Promise.all([texDecode(j.c, j.w), texDecode(j.n, j.w), texDecode(j.r, j.w)]).then(function (a) {
    return { key: j.key, phase: j.phase, w: j.w, h: j.w, c: mipChain(a[0], j.w, j.w, 'c'), n: mipChain(a[1], j.w, j.w, 'n'), r: mipChain(a[2], j.w, j.w, 'r'), ms: Date.now() - t0 }; }); }
  function texWorkers(jobs, onTex, onFail) {
    var src = 'var _texBuf = {};\n' + [texIsPath, texAbs, texBytes, mipChain, texDecode, texJob].map(function (f) { return f.toString(); }).join('\n') +
      '\nonmessage = function (e) { var q = e.data, k = 0; (function next() { if (k >= q.length) return; texJob(q[k++]).then(function (m) { var tr = [];\n' +
      '  ["c", "r", "n"].forEach(function (c) { m[c].forEach(function (l) { tr.push(l.data.buffer); }); }); postMessage(m, tr); next(); }, function (er) { postMessage({ err: String(er && er.message || er) }); }); })(); };';
    var url, ws = [], n = Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 4) - 1, jobs.length)), left = jobs.length;
    if (typeof OffscreenCanvas === 'undefined' || !window.createImageBitmap) { onFail('no OffscreenCanvas'); return null; }
    try { url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' })); for (var i = 0; i < n; i++) ws.push(new Worker(url)); } catch (e) { onFail(e); return null; }
    // half sets first; keep a key's half and full jobs on the same worker so a hosted fetch is reused
    var lists = ws.map(function () { return []; }), by = {};
    jobs.forEach(function (j) { (by[j.key] || (by[j.key] = [])).push(j); });
    Object.keys(by).sort(function (a, b) { return (by[b][0].cost || 0) - (by[a][0].cost || 0); }).forEach(function (k, i) {
      by[k].sort(function (a, b) { return (a.phase === 'half' ? 0 : 1) - (b.phase === 'half' ? 0 : 1); });
      by[k].forEach(function (j) { lists[i % n].push(j); });
    });
    ws.forEach(function (w, i) { w.onmessage = function (e) { if (e.data.err) { ws.forEach(function (x) { x.terminate(); }); return onFail(e.data.err); } onTex(e.data); if (--left === 0) { ws.forEach(function (x) { x.terminate(); }); URL.revokeObjectURL(url); } }; w.onerror = function (e) { ws.forEach(function (x) { x.terminate(); }); onFail(e.message || e); }; w.postMessage(lists[i]); });
    return ws;
  }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function P3(T, x, y, z) { return new T.Vector3(x - .8, z, .225 - y); }

  function build() {
    var T = window.THREE; if (!T) return false; var bt0 = performance.now();
    var r;
    var low = QUAL === 'low';
    // high detail renders the scene into an MSAA HDR buffer and finishes it in look.js (bloom, ACES, vignette); the canvas
    // itself then needs no multisampling. Low detail draws straight to the canvas with the renderer's own MSAA and ACES.
    try { r = new T.WebGLRenderer({ antialias: low, powerPreference: 'high-performance', stencil: false }); } catch (e) { return false; }
    r.setPixelRatio(low ? 1 : Math.min(2, window.devicePixelRatio || 1)); PR0 = r.getPixelRatio(); r.shadowMap.enabled = !low; r.shadowMap.type = T.PCFSoftShadowMap;
    ANISO = low ? 4 : Math.min(16, r.capabilities.getMaxAnisotropy());
    var post = !low && window.HELook && r.capabilities.isWebGL2 ? new window.HELook.Post(T, r, Q.get('msaa') ? { samples: Math.min(+Q.get('msaa'), r.capabilities.maxSamples || 4), fixedSamples: true } : { samples: Math.min(8, r.capabilities.maxSamples || 4) }) : null;
    r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.22; r.domElement.style.touchAction = 'none'; host.insertBefore(r.domElement, host.firstChild);
    var sc = new T.Scene(); sc.background = new T.Color(0x080706); sc.fog = new T.FogExp2(0x0d0b09, .16);
    var cam = new T.PerspectiveCamera(36, 1, .12, 14);
    var P = function (x, y, z) { return P3(T, x, y, z); };
    // environment for the metal: a dim workshop with one warm window, a teal bounce and a lamp, baked into a PMREM map
    // the same room as seen by the metal: brown brick and plaster, the cold window back right, the warm lamp overhead, the
    // floor's dull bounce, and a dim warm glow from the front where the camera stands
    // (the altar skin bakes its own crypt environment, so the workshop one is only baked for the workshop)
    if (!SK) {
    var es = new T.Scene(); es.background = new T.Color(0x0e0c0a);
    [[0x4a3628, 1, 0, 1.6, -1.6, 8, 3.4, .1], [0x2a2420, 1, -3, 1.6, 0, .1, 3.4, 8], [0x2a2420, 1, 3, 1.6, 0, .1, 3.4, 8], [0x1a1612, 1, 0, 3.3, 0, 8, .1, 8], [0x302418, 1, 0, -.05, 0, 8, .1, 8],
     [0x9db4d6, 3.2, 1.55, 1.75, -1.55, .9, 1.15, .05], [0xffc890, 14, .42, 1.5, -.2, .12, .06, .12], [0x6a5440, 1.5, 0, 1.4, 3, 6, 2.5, .1], [0xfff0d8, 1.4, -1.3, 2.6, 2.6, .8, .5, .1]].forEach(function (p) { var m = new T.Mesh(new T.BoxGeometry(p[5], p[6], p[7]), new T.MeshBasicMaterial({ color: new T.Color(p[0]).multiplyScalar(p[1]) })); m.position.set(p[2], p[3], p[4]); es.add(m); });
    var pm = new T.PMREMGenerator(r); sc.environment = pm.fromScene(es, .04).texture; pm.dispose();
    es.traverse(function (o) { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
    }

    // textures: the quick half-resolution set now (what Low uses), the full set from workers a moment later (High only)
    var tt0 = performance.now(), tx = {};
    // 1-texel stand-ins (each its own texture, so the swap can find it); the workers send the half-resolution set (what the
    // first frame shows) and on High the full set after it. If workers are unavailable, the half set is made here instead.
    var HT = window.HE_TEX || {}, one = function (c, srgb, sp) { return dtex(T, new Uint8ClampedArray([c[0], c[1], c[2], 255]), 1, 1, srgb, sp); };
    Object.keys(TSPEC).forEach(function (k) { var sp = TSPEC[k], av = (HT[k] && HT[k].avg) || [128, 110, 90]; tx[k] = { map: one(av, true, sp), roughnessMap: one([200, 200, 200], false, sp), normalMap: one([128, 128, 255], false, sp), w: 1, h: 1 }; });
    var halfQ = [], hiQ = [], hiFail = null, noHi = low || /[?&]hitex=0/.test(location.search), jobs = [];
    var SKIP = SK ? { brick: 1, plaster: 1, walnut: 1, ebony: 1, brass: 1, alu: 1, vellum: 1, cloth: 1, stone: 1 } : { aWall: 1, aFloor: 1, aSheet: 1 };
    Object.keys(TSPEC).forEach(function (k) { if (SKIP[k]) return; var d = HT[k]; if (!d) return; var hs = Math.max(16, d.s >> 1); jobs.push({ key: k, phase: 'half', w: hs, c: texAbs(d.c), n: texAbs(d.n), r: texAbs(d.r), cost: hs * hs }); if (!noHi) jobs.push({ key: k, phase: 'full', w: d.s, c: texAbs(d.c), n: texAbs(d.n), r: texAbs(d.r), cost: d.s * d.s }); });
    var nTex = jobs.filter(function (j) { return j.phase === 'half'; }).length;
    var genMs = [], ws = texWorkers(jobs, function (d) { genMs.push([d.key, d.phase, d.ms]); (d.phase === 'half' ? halfQ : hiQ).push(d); }, function (e) { hiFail = String(e && e.message || e); if (V) V.hiFail = hiFail; });
    // no workers: decode the half sets here (async, so the page still comes up), and stay on them
    var mainDec = function () { jobs.filter(function (j) { return j.phase === 'half'; }).forEach(function (j) { texJob(j).then(function (d) { halfQ.push(d); }, function () { halfQ.push(null); }); }); };
    if (!ws) mainDec();
    V_TEXMS = Math.round(performance.now() - tt0);
    var hiJobs = ws && !noHi ? jobs.filter(function (j) { return j.phase === 'full'; }).map(function (j) { return j.key; }) : [];
    function std(t, o) { return new T.MeshStandardMaterial(Object.assign({ map: t.map, roughnessMap: t.roughnessMap, normalMap: t.normalMap, roughness: 1, metalness: 0 }, o || {})); }
    // high detail: physical materials (varnish clearcoat on the wood, lacquer on the enamel, sheen on cloth and skin);
    // low detail keeps the standard model. ph(t, base, extra) adds 'extra' only when it is a physical material.
    function ph(t, o, x) { if (low) return t ? std(t, o) : new T.MeshStandardMaterial(o); return new T.MeshPhysicalMaterial(Object.assign(t ? { map: t.map, roughnessMap: t.roughnessMap, normalMap: t.normalMap, roughness: 1, metalness: 0 } : {}, o || {}, x || {})); }
    function fresnelA(m, k) { m.onBeforeCompile = function (sh) { sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', '#include <opaque_fragment>\n  { float heF = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewPosition))), 3.0); gl_FragColor.a = clamp(gl_FragColor.a + heF * ' + k.toFixed(2) + ', 0.0, 1.0); }'); }; m.customProgramCacheKey = function () { return 'heFres' + k; }; return m; }
    var glassThin = function (o) { var m = low ? new T.MeshStandardMaterial(Object.assign({ color: 0x0c0e0e, roughness: .03, metalness: 0, envMapIntensity: 2.2 }, o || {})) : new T.MeshPhysicalMaterial(Object.assign({ color: 0x0c0e0e, roughness: .02, metalness: 0, ior: 1.5, specularIntensity: 1, clearcoat: 1, clearcoatRoughness: .02, envMapIntensity: 2.4 }, o || {}));
      m.transparent = true; m.opacity = .12; m.depthWrite = false; m.side = T.FrontSide; return fresnelA(m, .75); };
    var glassHi = function (o) { return new T.MeshPhysicalMaterial(Object.assign({ color: 0xffffff, roughness: .02, metalness: 0, transmission: 1, thickness: .003, ior: 1.5, specularIntensity: 1, envMapIntensity: 1.4, side: T.DoubleSide }, o || {})); };
    // the scan's roughness is a polished/worn mask; under a single lamp in a dark room it reads as black-and-gold blotches, so brass keeps the scan's colour and dents but one even satin roughness
    var tB = { map: tx.brass.map, normalMap: tx.brass.normalMap, roughnessMap: null };
    var M = {
      // oiled oak top, walnut carcass, ebonised plates: photo scans, darkened and warmed to an old finish, satin coat on High
      spruce: ph(tx.oak, { roughness: 1, color: 0xc49a72 }, { clearcoat: .6, clearcoatRoughness: .5, clearcoatRoughnessMap: tx.oak.roughnessMap }), walnut: ph(tx.walnut, { roughness: 1, color: 0xa8826a }, { clearcoat: .45, clearcoatRoughness: .55, clearcoatRoughnessMap: tx.walnut.roughnessMap }),
      brass: ph(tB, { metalness: 1, roughness: .36, color: 0xe8d0a0, envMapIntensity: 1.3 }), drawerF: null, bronze: ph(tB, { metalness: 1, roughness: .44, color: 0xd0a47c }),
      steel: ph(tx.steel, { metalness: 1, roughness: 1.6, color: 0xb0b4b6 }), iron: ph(tx.iron, { metalness: .85, roughness: 1, color: 0x8a8580 }),
      skin: ph(tx.vellum, { roughness: 1, color: 0xecd2a4, normalScale: new T.Vector2(1.6, 1.6) }, { sheen: .5, sheenRoughness: .5, sheenColor: new T.Color(0xfff0d0) }), cloth: ph(tx.cloth, { roughness: 1, color: 0x6a5440 }, { sheen: 1, sheenRoughness: .6, sheenColor: new T.Color(0x6a5034) }),
      lac: ph(tx.ebony, { color: 0x3a3230, roughness: .9 }, { clearcoat: .7, clearcoatRoughness: .22 }),
      bone: ph(tx.vellum, { color: 0xe6d8b8, roughness: .7 }, { clearcoat: .45, clearcoatRoughness: .3, sheen: .2, sheenColor: new T.Color(0xfff4dc) }), rubber: ph(tx.crinkle, { color: 0xa84030, roughness: 1 }, { clearcoat: .15, clearcoatRoughness: .5, sheen: .3, sheenRoughness: .8, sheenColor: new T.Color(0xc06048) }),
      // thin glass is a clear, dark-bodied transparent surface whose edges and reflections carry it (Fresnel alpha below);
      // only the water (and the bottle) refract. Two transmissive layers sample the same opaque-only buffer, which is what
      // drew the old ghost double inside the wine glass.
      glass: glassThin(), water: low ? new T.MeshStandardMaterial({ color: 0x7a9a9a, roughness: .03, metalness: .1, transparent: true, opacity: .34, envMapIntensity: 1.6, depthWrite: false })
        : glassHi({ color: 0xffffff, side: T.FrontSide, ior: 1.333, thickness: .03, attenuationColor: new T.Color(0xc4dccf), attenuationDistance: .1, roughness: .015 }),
      alu: ph(tx.alu, { metalness: 1, roughness: .55, color: 0xe6e8ea, envMapIntensity: 2.6 }), aluFace: ph(tx.alu, { metalness: .2, roughness: .38, color: 0xe4e6e8, envMapIntensity: 2.2 }), bakelite: ph(null, { color: 0x2a1610, roughness: .28, metalness: 0 }, { clearcoat: 1, clearcoatRoughness: .08 }), knobLine: ph(null, { color: 0xe8e2d2, roughness: .4 }),
      wet: new T.MeshStandardMaterial({ color: 0x3a2a1a, metalness: 1, roughness: .2 })
    };
    M.drawerF = M.walnut.clone(); M.drawerF.color = new T.Color(0xcdb8a6);   // the drawer front: its own board, a shade darker
    var rig = new T.Group(); sc.add(rig);
    function mesh(g, m, par) { var o = new T.Mesh(g, m); o.castShadow = o.receiveShadow = true; (par || rig).add(o); return o; }
    function box(x0, y0, z0, x1, y1, z1, m, par) { var b = mesh(new T.BoxGeometry(x1 - x0, z1 - z0, y1 - y0), m, par); b.position.copy(P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)); return b; }
    function cyl(x, y, z0, z1, rad, m, par, seg, r2) { var c = mesh(new T.CylinderGeometry(rad, r2 === undefined ? rad : r2, z1 - z0, seg || 20), m, par); c.position.copy(P(x, y, (z0 + z1) / 2)); return c; }
    function rod(a, b, rad, m, par, seg) { var d = new T.Vector3().subVectors(b, a), c = mesh(new T.CylinderGeometry(rad, rad, d.length(), seg || 10), m, par); c.position.copy(a).addScaledVector(d, .5); c.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.clone().normalize()); return c; }
    function ball(p, rad, m, par) { var s = mesh(new T.SphereGeometry(rad, 20, 14), m, par); s.position.copy(p); return s; }
    // strings and wires are thin metal tubes, not 1-px lines: wire() is a straight one, xtube() one that moves (its centre line
    // runs along x; the ring of each point sits in the y-z plane, so it stays round as the wire swings sideways and up and down)
    var wireM = new T.MeshStandardMaterial({ color: 0xa8aaa4, metalness: 1, roughness: .38, envMapIntensity: 1.3 });
    var strM = new T.MeshStandardMaterial({ color: 0xcdb78a, metalness: 1, roughness: .32, envMapIntensity: 1.4 });
    function wire(a, b, rad, m, par) { var w = rod(a, b, rad || .0012, m || wireM, par, 6); w.castShadow = false; return w; }
    function xtube(n, rad, m, par) {
      var RS = 6, pos = new Float32Array(n * RS * 3), nor = new Float32Array(n * RS * 3), idx = [], k, j;
      for (k = 0; k < n; k++) for (j = 0; j < RS; j++) { var a = j / RS * TAU, o = (k * RS + j) * 3; nor[o + 1] = Math.cos(a); nor[o + 2] = Math.sin(a); if (k < n - 1) { var i0 = k * RS + j, i1 = k * RS + (j + 1) % RS; idx.push(i0, i0 + RS, i1, i1, i0 + RS, i1 + RS); } }
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('normal', new T.BufferAttribute(nor, 3)); g.setIndex(idx);
      var o2 = mesh(g, m, par); o2.castShadow = false; o2.frustumCulled = false; o2.c = new Float32Array(n * 3);
      o2.upd = function () { var c = o2.c; for (var k2 = 0; k2 < n; k2++) for (var j2 = 0; j2 < RS; j2++) { var q = (k2 * RS + j2) * 3; pos[q] = c[k2 * 3]; pos[q + 1] = c[k2 * 3 + 1] + nor[q + 1] * rad; pos[q + 2] = c[k2 * 3 + 2] + nor[q + 2] * rad; } g.attributes.position.needsUpdate = true; };
      return o2;
    }

    var zones = [], picks = [];
    // a zone is a part's invisible hit surface: face 'top' | 'front' | 'chamfer'; its kind picks the handler
    function zone(kind, w, h, at, face, o) {
      o = o || {}; var m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ visible: false, side: T.DoubleSide }));
      m.position.copy(at); if (face === 'top') m.rotation.x = -Math.PI / 2; else if (face === 'chamfer') m.rotation.y = -Math.PI / 4;
      m.userData = Object.assign({ kind: kind, w: w, h: h, part: o.part || kind, src: o.src === undefined ? -1 : o.src }, o); rig.add(m); zones.push(m); return m;
    }
    function tag(o, z) { o.traverse(function (c) { if (c.isMesh) c.userData.zone = z; }); return o; }
    // a skin builds its own room, lights and parts with the same helpers, and hands back the fields of V it fills
    var AV = SK ? SK.build({ T: T, r: r, sc: sc, cam: cam, rig: rig, P: P, low: low, tx: tx, std: std, ph: ph, M: M, mesh: mesh, box: box, cyl: cyl, rod: rod, ball: ball, wire: wire, zone: zone, tag: tag, zones: zones,
      H: H, ZB: ZB, ZT: ZT, PDEF: PDEF, post: post, LS: LS, tiltStep: tiltStep, G: G }) : null;
    if (!SK) {
    // the room: old floorboards, a brick back wall with a moonlit window, plaster side walls and a low ceiling, close enough
    // to the bench to catch its light (so the background reads as a workshop, not a void)
    var room = new T.Group(); sc.add(room);
    var fl = new T.Mesh(new T.PlaneGeometry(7, 7), ph(tx.floor, { roughness: 1, color: 0x9a8a7a }, { clearcoat: .15, clearcoatRoughness: .6 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; room.add(fl);
    var wlM = std(tx.brick, { roughness: 1, color: 0xa08c80 }), plM = std(tx.plaster, { roughness: 1, color: 0x5a5048 });
    var wl = new T.Mesh(new T.PlaneGeometry(7, 3.2), wlM); wl.position.set(0, 1.6, -1.45); wl.receiveShadow = true; room.add(wl);
    [-1, 1].forEach(function (sd) { var w2 = new T.Mesh(new T.PlaneGeometry(5, 3.2), plM); w2.position.set(sd * 2.9, 1.6, 1.05); w2.rotation.y = -sd * Math.PI / 2; w2.receiveShadow = true; room.add(w2); });
    var ceil = new T.Mesh(new T.PlaneGeometry(7, 5), plM); ceil.position.set(0, 3.2, 1.05); ceil.rotation.x = Math.PI / 2; room.add(ceil);
    // skirting and two ceiling beams in the cabinet walnut, darkened
    var dkW = std(tx.walnut, { roughness: 1, color: 0x4a3a30 }), rb = function (w, h, d, x, y, z) { var m = new T.Mesh(new T.BoxGeometry(w, h, d), dkW); m.position.set(x, y, z); m.receiveShadow = true; room.add(m); return m; };
    rb(7, .16, .03, 0, .08, -1.435); [-.9, 1.1].forEach(function (z) { rb(7, .18, .14, 0, 3.11, z); });
    // the window, back right: cold moonlight in four panes behind a painted frame
    var WX = 1.75, WY = 1.7, WW = .62, WH = .82, winM = new T.MeshBasicMaterial({ color: new T.Color(0x8aa2c8).multiplyScalar(.32), toneMapped: true }), frM = std(tx.walnut, { roughness: 1, color: 0x2e2620 });
    var pane2 = new T.Mesh(new T.PlaneGeometry(WW, WH), winM); pane2.position.set(WX, WY, -1.445); room.add(pane2);
    [[WW + .1, .07, 0, WH / 2 + .02], [WW + .1, .07, 0, -WH / 2 - .02], [.07, WH + .1, WW / 2 + .02, 0], [.07, WH + .1, -WW / 2 - .02, 0], [WW, .035, 0, 0], [.035, WH, 0, 0]].forEach(function (q) { var m = new T.Mesh(new T.BoxGeometry(q[0], q[1], .05), frM); m.position.set(WX + q[2], WY + q[3], -1.42); room.add(m); });
    var sill = new T.Mesh(new T.BoxGeometry(WW + .2, .04, .14), frM); sill.position.set(WX, WY - WH / 2 - .07, -1.39); room.add(sill);
    // the key is the bench's own lamp (a warm shadowed spot from the bulb), a soft front fill without the hard edge, cold
    // moonlight from the window as the rim, and a dim warm/cool ambient so nothing is a black hole
    var key = new T.SpotLight(0xffd8a8, 4.5, 4.5, 1.05, .85, 1.6); key.position.set(.42, 1.47, -.2); key.target.position.set(.05, .9, .1);
    key.castShadow = !low; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -.0002; key.shadow.normalBias = .015; key.shadow.camera.near = .2; key.shadow.camera.far = 3; key.shadow.radius = 4; sc.add(key); sc.add(key.target);
    var fill = new T.SpotLight(0xffe6c8, 11, 9, .85, 1, 1.6); fill.position.set(-1.3, 2.6, 2.6); fill.target.position.set(0, .8, 0);
    fill.castShadow = !low; fill.shadow.mapSize.set(2048, 2048); fill.shadow.bias = -.0002; fill.shadow.normalBias = .02; fill.shadow.camera.near = 2; fill.shadow.camera.far = 6; fill.shadow.radius = 8; sc.add(fill); sc.add(fill.target);
    var hemi = new T.HemisphereLight(0x8a96a8, 0x3a2a1c, .5); sc.add(hemi);
    // the lamp's spill on the brick behind the bench (no shadow), so the wall reads warm rather than as a void
    var wash = new T.SpotLight(0xffb070, 5, 4.5, .95, 1, 1.4); wash.position.set(.42, 1.6, -.35); wash.target.position.set(-.1, 1.1, -1.45); sc.add(wash); sc.add(wash.target);
    // a little of the lamp's light falls on the faceplate (no shadow), so the instrument reads as in the mock
    var pnl = new T.SpotLight(0xffd8b0, 7.5, 2.5, .33, .7, 1.5); pnl.position.set(.25, 1.62, .55); pnl.target.position.set(0, 1.25, -.2); sc.add(pnl); sc.add(pnl.target);
    // baked contact shadow: the soft dark footprint of the box and its four feet (what the shadow map is too coarse to give)
    if (window.HELook) { var cs0 = window.HELook.contact(T, 2.1, .9, [[-.66, .155], [.66, .155], [-.66, -.155], [.66, -.155]]); cs0.position.set(0, .0015, 0); sc.add(cs0); }
    var rim = new T.DirectionalLight(0xa8bce0, 1.1); rim.position.set(WX + .4, WY + .4, -2.6); rim.target.position.set(0, .9, .2); sc.add(rim); sc.add(rim.target);
    // a faint shaft of moonlight from the window down to the floor, and the lamp's warm cone in the haze (additive, no depth write)
    // haze volumes: additive, soft at the silhouette (facing ratio) and fading along their length, so they read as light in
    // dusty air rather than as geometry
    var haze = function (geo, col, op, fade) { var m = new T.Mesh(geo, new T.ShaderMaterial({ uniforms: { col: { value: new T.Color(col) }, op: { value: op } }, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
      vertexShader: 'varying vec3 vN; varying vec3 vV; varying float vY; void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vY = uv.y; gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform vec3 col; uniform float op; varying vec3 vN; varying vec3 vV; varying float vY; void main() { float f = abs(dot(normalize(vN), normalize(vV))); f = f * f * f; float g = ' + fade + '; gl_FragColor = vec4(col * op * f * g, 1.0); }' }));
      m.renderOrder = 5; m.castShadow = m.receiveShadow = false; sc.add(m); return m; };
    var cone = haze(new T.CylinderGeometry(.045, .42, .56, 40, 1, true), 0xffc890, .07, 'smoothstep(0.0, 0.35, vY) * smoothstep(0.0, 0.7, 1.0 - vY) + 0.0'); cone.position.set(.42, 1.19, -.2);
    var shaft = haze(new T.CylinderGeometry(.42, .55, 2.6, 24, 1, true), 0x9db4d6, .045, 'smoothstep(0.0, 0.6, vY) * smoothstep(0.0, 0.15, 1.0 - vY)'); shaft.position.set(WX - .35, 1.05, -.75); shaft.rotation.set(-.55, 0, .25);

    /* ---------- ① the spine: spruce top, walnut sides, coffin-cut corners ---------- */
    var BODY = [[0, .08], [.08, 0], [1.52, 0], [1.6, .06], [1.6, .42], [1.52, .45], [.08, .45], [0, .37]];
    var shp = new T.Shape(); BODY.forEach(function (q, i) { var sx = q[0] - .8, sy = q[1] - .225; if (i) shp.lineTo(sx, sy); else shp.moveTo(sx, sy); });
    var bg = new T.ExtrudeGeometry(shp, { depth: ZT - ZB - .012, bevelEnabled: true, bevelThickness: .006, bevelSize: .006, bevelSegments: 2, bevelOffset: -.006, steps: 1 }); bg.rotateX(-Math.PI / 2); bg.translate(0, ZB + .006, 0);
    var spine = mesh(bg, [M.spruce, M.walnut]);
    // sunburst inlay on the front, under the rulers; the rays glow with the body
    var rayM = M.brass.clone(); rayM.emissive = new T.Color(0x8a6a30); rayM.emissiveIntensity = 0; var rays = [], i;
    for (i = 0; i <= 10; i++) { var an = Math.PI * i / 10, a0 = P(.64 + .05 * Math.cos(an), -.002, ZB + .03 + .05 * Math.sin(an)), a1 = P(.64 + .2 * Math.cos(an), -.002, ZB + .03 + .2 * Math.sin(an) * (i % 2 ? .78 : 1)); rays.push(rod(a0, a1, .0025, rayM, null, 6)); }
    var hub = mesh(new T.CircleGeometry(.045, 28, 0, Math.PI), rayM); hub.position.copy(P(.64, -.0045, ZB + .03));
    // the stand: iron legs, a frame, the brass trunnion block
    [[.14, .07], [1.46, .07], [.14, .38], [1.46, .38]].forEach(function (p) { cyl(p[0], p[1], 0, ZB - .03, .02, M.iron, null, 14, .026); cyl(p[0], p[1], 0, .02, .045, M.iron, null, 20); });
    box(.12, .05, .30, 1.48, .40, .33, M.iron); box(.74, .18, ZB - .04, .86, .27, ZB, M.brass);

    /* ---------- ② slack string, ③ humbucker, ㉓ groove, E-bow puck and slide bar ---------- */
    var SY = .40, SZ = ZT + .06;
    cyl(.11, SY, ZT, ZT + .075, .014, M.brass); cyl(.11, SY, ZT + .075, ZT + .09, .02, M.bone);
    box(1.47, SY - .03, ZT, 1.53, SY + .03, ZT + .07, M.brass);
    var string = xtube(61, .0016, strM), sp = string.c;
    box(.93, .385, ZT, 1.0, .415, ZT + .02, M.lac); var poleM = new T.MeshStandardMaterial({ color: 0x777777, metalness: 1, roughness: .3, emissive: 0x6fd0b8, emissiveIntensity: 0 });
    for (i = 0; i < 6; i++) cyl(.94 + i * .011, .40, ZT + .02, ZT + .024, .003, poleM, null, 8);
    box(.30, .438, ZT - .004, 1.30, .45, ZT + .001, M.lac);   // the slide groove
    var strZ = zone('play', 1.38, .08, P(.80, SY, SZ), 'top', { src: 0, part: 'string' }); string.userData.zone = strZ;
    var puck = new T.Group(); rig.add(puck); mesh(new T.BoxGeometry(.06, .03, .036), M.lac, puck).position.set(0, .015, 0); var pkG = new T.MeshBasicMaterial({ color: 0x2a5048 }); mesh(new T.BoxGeometry(.04, .004, .02), pkG, puck).position.set(0, .032, 0);
    var PUCK0 = P(.56, .445, ZT + .003); puck.position.copy(PUCK0);
    var puckZ = zone('puck', .08, .06, P(.56, .44, ZT + .07), 'top', { part: 'puck' }); tag(puck, puckZ);
    var bar = mesh(new T.CylinderGeometry(.008, .008, .07, 14), M.steel); bar.rotation.x = Math.PI / 2; var barX = 1.05; bar.position.copy(P(barX, SY, SZ + .01));
    var barZ = zone('bar', .06, .09, P(barX, SY, SZ + .02), 'top', { part: 'bar' }); tag(bar, barZ);

    /* ---------- ④ hurdy wheel in its slot, crank on the right end, ⑤ drone pair ---------- */
    box(1.37, .30, ZT - .004, 1.53, .385, ZT + .001, M.lac);
    var wheel = new T.Group(); wheel.position.copy(P(1.45, .3425, ZT - .02)); rig.add(wheel);
    mesh(new T.CylinderGeometry(.136, .136, .03, 48), M.walnut, wheel).rotation.z = Math.PI / 2;
    mesh(new T.TorusGeometry(.14, .006, 8, 48), M.brass, wheel).rotation.y = Math.PI / 2;
    for (i = 0; i < 4; i++) mesh(new T.BoxGeometry(.034, .26, .012), M.brass, wheel).rotation.x = i * Math.PI / 4;
    rod(P(1.40, .3425, ZT - .02), P(1.66, .3425, ZT - .02), .008, M.steel);
    var crank = new T.Group(); crank.position.copy(P(1.66, .3425, ZT - .02)); rig.add(crank);
    mesh(new T.BoxGeometry(.014, .12, .02), M.brass, crank).position.set(0, .05, 0);
    var ch = mesh(new T.CylinderGeometry(.013, .015, .07, 14), M.walnut, crank); ch.rotation.z = Math.PI / 2; ch.position.set(.035, .1, 0);
    var crankZ = zone('play', .34, .34, P(1.70, .3425, ZT - .02).add(new T.Vector3(0, 0, .03)), 'front', { src: 1, part: 'crank' }); tag(crank, crankZ); tag(wheel, crankZ);
    var drones = [.33, .355].map(function (y) { var d = new T.Group(); rig.add(d); wire(P(.90, y, ZT + .05), P(1.56, y, ZT + .05), .0013, strM, d); return d; }); cyl(.90, .3425, ZT, ZT + .05, .006, M.bone, null, 8);
    box(1.55, .32, ZT, 1.58, .365, ZT + .052, M.walnut);
    var dronZ = zone('play', .46, .06, P(1.12, .3425, ZT + .05), 'top', { src: 1, part: 'drones', set: { 'hurdy.melody': 1 }, restore: ['hurdy.melody'] }); drones.forEach(function (d) { tag(d, dronZ); });

    /* ---------- ⑥ four steel rulers under a sliding brass clamp ---------- */
    var clamp = box(.50, 0, ZT, .82, .07, ZT + .04, M.brass), clampS = [.53, .66, .79].map(function (x) { return cyl(x, .035, ZT + .04, ZT + .05, .009, M.steel, null, 6); });
    var RX = [.535, .605, .675, .745], RF = [1, .75, .55, .4], rulers = RX.map(function (x) { var g = new T.Group(); g.position.copy(P(x, .06, ZT + .002)); rig.add(g); var b = mesh(new T.BoxGeometry(.034, .0016, 1), M.steel, g); b.position.z = .5; g.userData.b = b; return g; });
    var rulZ = zone('bowtap', .30, .32, P(.64, -.16, ZT + .004), 'top', { part: 'rulers', items: function () { return RX.map(function (x, k) { var L = Math.round(Math.max(6, V.clampL * RF[k]) * 10) / 10; return { u: (x - .49) / .30, bow: { 'bowed.object': 0, 'bowed.length': L }, tap: { 'struck.object': 0, 'struck.length': L } }; }); } });
    rulers.forEach(function (g) { tag(g, rulZ); });
    var clampZ = zone('clamp', .32, .06, P(.66, .035, ZT + .045), 'top', { part: 'clamp' }); tag(clamp, clampZ); clampS.forEach(function (m) { tag(m, clampZ); });

    /* ---------- ⑦ gimballed brass water tray (grab its rim to rock it), ⑧ rod ring, fill tap ---------- */
    box(.07, .03, ZT, .45, .31, ZT + .004, M.lac);   // the dark plate the tray swings over
    var tray = new T.Group(); tray.position.copy(P(.26, .17, ZT)); rig.add(tray);
    var tr = function (x0, y0, z0, x1, y1, z1, m) { var b = mesh(new T.BoxGeometry(x1 - x0, z1 - z0, y1 - y0), m, tray); b.position.set((x0 + x1) / 2 - .26, (z0 + z1) / 2 - ZT, .17 - (y0 + y1) / 2); return b; };
    var trM = [tr(.085, .065, ZT + .012, .435, .275, ZT + .017, M.brass), tr(.08, .06, ZT + .012, .44, .065, ZT + .068, M.brass), tr(.08, .275, ZT + .012, .44, .28, ZT + .068, M.brass), tr(.08, .065, ZT + .012, .085, .275, ZT + .068, M.brass), tr(.435, .065, ZT + .012, .44, .275, ZT + .068, M.brass)];
    var gimb = []; [.045, .295].forEach(function (y) { gimb.push(box(.25, y - .006, ZT, .27, y + .006, ZT + .05, M.bronze), cyl(.26, y + (y < .1 ? .006 : -.006), ZT + .035, ZT + .045, .007, M.brass)); });   // gimbal posts and pins front and back
    var rods = [];
    for (i = 0; i < 12; i++) {
      var ra = i / 12 * TAU, x = .26 + .135 * Math.cos(ra), y = .17 + .082 * Math.sin(ra), xr = (x - .08) / .36, hgt = .36 - .2 * xr;
      var rg = new T.Group(); rg.position.set(x - .26, .017, .17 - y); tray.add(rg);
      mesh(new T.CylinderGeometry(.0045, .0055, hgt, 8), M.bronze, rg).position.y = hgt / 2;
      var wt = mesh(new T.CylinderGeometry(.0058, .0058, 1, 8), M.wet, rg); wt.position.y = .5; wt.scale.y = .001;
      rods.push({ g: rg, xr: xr, h: hgt, wt: wt, sw: 0 });
    }
    var wg = new T.PlaneGeometry(.35, .21, 14, 8), water = new T.Mesh(wg, M.water.clone()); if (low) { water.material.color.setHex(0x40504a); water.material.opacity = .42; } else { water.material.dispose(); water.material = glassHi({ color: 0xffffff, side: T.FrontSide, ior: 1.333, thickness: .012, attenuationColor: new T.Color(0xb8c8a8), attenuationDistance: .06, roughness: .02, envMapIntensity: 1.3 }); }   // shallow clear water over the brass pan
    water.rotation.x = -Math.PI / 2; water.receiveShadow = true; rig.add(water); var w0 = Float32Array.from(wg.attributes.position.array);
    // a rod's note falls with its length squared (longer at the left)
    var ROD_HZ = function (xr) { var h = .36 - .2 * xr; return 170 * Math.pow(.36 / h, 2); };
    var rodsZ = zone('bowtap', .34, .34, P(.26, .17, ZT + .17), 'front', { part: 'rods', items: function () { return rods.slice(0, 7).map(function (q) { var hz = Math.round(ROD_HZ(q.xr)); return { u: (q.xr * .36 + .08 - .09) / .34, xr: q.xr, bow: { 'bowed.object': 1, 'bowed.size': hz }, tap: { 'struck.object': 1 }, hz: hz }; }); } });
    rods.forEach(function (q) { tag(q.g, rodsZ); });
    // the tray rim is the control: grab it and push one end down to rock it on its gimbal
    var trayZ = zone('tray', .37, .06, P(.26, .058, ZT + .04), 'front', { part: 'tray' }); trM.concat(gimb).forEach(function (m) { tag(m, trayZ); });   // the gimbal posts too: a hand on the pivot rocks it as well
    var ftap = new T.Group(); ftap.position.copy(P(.40, .045, ZT + .02)); rig.add(ftap); mesh(new T.CylinderGeometry(.007, .007, .04, 10), M.brass, ftap); mesh(new T.BoxGeometry(.05, .008, .012), M.brass, ftap).position.set(0, .03, 0);
    var ftapZ = zone('filltap', .07, .07, P(.40, .04, ZT + .04), 'front', { part: 'filltap' }); tag(ftap, ftapZ);

    /* ---------- ⑨ pane, ⑩ wine glass and its tap fed from the tray ---------- */
    box(.85, .05, ZT, 1.11, .25, ZT + .004, M.lac); box(.85, .05, ZT + .004, 1.11, .06, ZT + .012, M.brass); box(.85, .24, ZT + .004, 1.11, .25, ZT + .012, M.brass); box(.85, .06, ZT + .004, .86, .24, ZT + .012, M.brass); box(1.10, .06, ZT + .004, 1.11, .24, ZT + .012, M.brass);
    var pane = box(.86, .06, ZT + .005, 1.10, .24, ZT + .011, M.glass); pane.castShadow = false;
    var paneZ = zone('play', .24, .18, P(.98, .15, ZT + .012), 'top', { src: 3, part: 'pane', set: function (Pm, e) { return { 'glass.surface': 0, 'glass.contact': e && e.altKey ? 2 : 0 }; } }); tag(pane, paneZ);
    cyl(1.155, .20, ZT, ZT + .012, .04, M.brass, null, 28);
    var wpts = [[0, 0], [.035, 0], [.035, .004], [.006, .012], [.004, .07], [.02, .085], [.04, .12], [.045, .16], [.043, .17]].map(function (q) { return new T.Vector2(q[0], q[1]); });
    // the bowl wall is 1.2 mm: the outer profile, a rounded lip, then back down the inside to a thick bowl floor
    var WALL = .0012, bowl = wpts.slice(5), rIn = function (y) { for (var k = 1; k < bowl.length; k++) if (y <= bowl[k].y) { var a = bowl[k - 1], b = bowl[k], t = (y - a.y) / (b.y - a.y); return Math.max(0, a.x + (b.x - a.x) * t - WALL); } return bowl[bowl.length - 1].x - WALL; };
    var gp2 = wpts.slice(0, -1).concat([new T.Vector2(.0436, .1688), new T.Vector2(.0434, .1698), new T.Vector2(.0428, .1700), new T.Vector2(.0422, .1696), new T.Vector2(.0420, .1688)]);
    for (var gy = .166; gy > .089; gy -= .006) gp2.push(new T.Vector2(rIn(gy), gy)); gp2.push(new T.Vector2(.012, .0885), new T.Vector2(0, .0885));
    var wgG = new T.LatheGeometry(gp2, 64), wglass = mesh(wgG, M.glass); wglass.position.copy(P(1.155, .20, ZT + .0125)); wglass.castShadow = false; wglass.renderOrder = 3;
    // crystal reads by its edges: a light catch on every silhouette (rim, bowl sides, stem, foot) and one vertical lamp streak
    // on the bowl, added on top; the far wall is drawn faintly from inside so the bowl has depth (none of these are pickable)
    var edgeM = function (k, streak) { return new T.ShaderMaterial({ uniforms: { k: { value: k }, st: { value: streak } }, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      vertexShader: 'varying vec3 vN, vV; void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform float k, st; varying vec3 vN, vV; void main() { vec3 n = normalize(vN); float f = 1.0 - abs(dot(n, normalize(vV))); float e = pow(f, 3.0) * k + st * smoothstep(.07, .0, abs(n.x - .62)) * smoothstep(.5, .9, f) + st * .6 * smoothstep(.05, .0, abs(n.x + .7)) * smoothstep(.55, .9, f);\n gl_FragColor = vec4(vec3(1.0, .95, .86) * e, 1.0); }' }); };
    var wEdge = new T.Mesh(wgG, edgeM(.55, .9)); wEdge.renderOrder = 5; wEdge.userData.noPick = 1; wglass.add(wEdge);
    var wBack = new T.Mesh(wgG, (function () { var m = M.glass.clone(); m.side = T.BackSide; m.opacity = .07; return m; })()); wBack.renderOrder = 2.5; wBack.userData.noPick = 1; wglass.add(wBack);
    var menis = new T.Mesh(new T.TorusGeometry(1, .035, 6, 64), edgeM(1.4, 0)); menis.rotation.x = Math.PI / 2; menis.renderOrder = 5; menis.userData.noPick = 1; rig.add(menis);
    var wwG = function (lvl) { var pts = [new T.Vector2(0, .0886)], n2 = 10; for (var k = 0; k <= n2; k++) { var y = .0886 + (lvl - .0886) * k / n2; pts.push(new T.Vector2(rIn(y) - .0002, y)); } pts.push(new T.Vector2(0, lvl)); return new T.LatheGeometry(pts, 48); };
    var wwat = new T.Mesh(wwG(.13), M.water); wwat.position.copy(wglass.position); wwat.renderOrder = 1; rig.add(wwat);
    // the surface: its own disc with a ripple bump (standing waves locked to the rubbing point, out from the rim)
    var wsM = (low ? M.water.clone() : glassHi({ color: 0xffffff, side: T.FrontSide, ior: 1.333, thickness: .03, attenuationColor: new T.Color(0xe8f2ee), attenuationDistance: .5, roughness: .01 })), wsU = { heT: { value: 0 }, heA: { value: 0 }, heP: { value: 0 }, heR: { value: .03 } };
    wsM.onBeforeCompile = function (sh) { Object.assign(sh.uniforms, wsU);
      sh.vertexShader = 'varying vec3 heLp;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n heLp = position;');
      sh.fragmentShader = 'varying vec3 heLp; uniform float heT, heA, heP, heR;\n' + sh.fragmentShader.replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' +
        ' { float r = length(heLp.xz) / heR, th = atan(heLp.z, heLp.x), h = heA * (sin(r * 34.0 - heT * 26.0) * smoothstep(0.15, 1.0, r) * (0.55 + 0.45 * cos(2.0 * (th - heP))) + 0.35 * sin(r * 61.0 + heT * 17.0) * smoothstep(0.6, 1.0, r));\n' +
        '   vec3 sx = dFdx(-vViewPosition), sy = dFdy(-vViewPosition), r1 = cross(sy, normal), r2 = cross(normal, sx); float det = dot(sx, r1); vec3 gr = sign(det) * (dFdx(h) * r1 + dFdy(h) * r2); normal = normalize(abs(det) * normal - gr); }'); };
    wsM.customProgramCacheKey = function () { return 'heRipple'; };
    var wsurf = new T.Mesh(new T.CircleGeometry(1, 48), wsM); wsurf.rotation.x = -Math.PI / 2; wsurf.renderOrder = 2; rig.add(wsurf);
    // the wet glint that travels the rim under the rubbing (no hand or tool in shot): a bright point and a fading arc behind it
    var glintT = (function () { var c = document.createElement('canvas'); c.width = c.height = 64; var x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.18, 'rgba(255,250,235,.6)'); g.addColorStop(1, 'rgba(255,240,220,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c); })();
    var glint = new T.Sprite(new T.SpriteMaterial({ map: glintT, color: 0xfff4e0, transparent: true, blending: T.AdditiveBlending, depthWrite: false, fog: false })); glint.scale.set(.014, .014, 1); glint.visible = false; glint.renderOrder = 6; rig.add(glint);
    var trailM = new T.ShaderMaterial({ uniforms: { op: { value: 0 } }, transparent: true, depthWrite: false, blending: T.AdditiveBlending, vertexShader: 'varying float vU; void main() { vU = uv.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }', fragmentShader: 'uniform float op; varying float vU; void main() { float a = pow(vU, 2.2) * op; gl_FragColor = vec4(vec3(1.0, .97, .9) * a, 1.0); }' });
    var trail = new T.Mesh(new T.TorusGeometry(.0432, .0008, 4, 40, 1.3), trailM); trail.rotation.x = Math.PI / 2; trail.visible = false; trail.renderOrder = 6; rig.add(trail);
    var wineZ = zone('play', .1, .18, P(1.155, .20, ZT + .1), 'front', { src: 3, part: 'wine', set: function (Pm) { return { 'glass.surface': 1, 'glass.contact': 1, 'glass.wet': Math.max(.8, Pm['glass.wet']) }; } }); tag(wglass, wineZ);
    var pipe = [P(.44, .25, ZT + .015), P(1.12, .25, ZT + .015), P(1.12, .25, ZT + .22), P(1.155, .25, ZT + .22)]; for (i = 0; i < 3; i++) rod(pipe[i], pipe[i + 1], .0035, M.brass, null, 8);
    var gtap = new T.Group(); gtap.position.copy(P(1.155, .25, ZT + .22)); rig.add(gtap); mesh(new T.CylinderGeometry(.005, .005, .025, 8), M.brass, gtap).position.set(0, -.0125, 0); mesh(new T.BoxGeometry(.035, .006, .008), M.brass, gtap).position.set(0, .012, 0); ball(new T.Vector3(.02, .012, 0), .008, M.bone, gtap);
    var gtapZ = zone('hold', .06, .06, P(1.155, .245, ZT + .225), 'front', { part: 'gtap' }); tag(gtap, gtapZ);

    /* ---------- ⑪ drumhead over a port ---------- */
    var drum = new T.Group(); drum.position.copy(P(1.34, .15, ZT)); rig.add(drum);
    mesh(new T.CylinderGeometry(.106, .106, .014, 40, 1, true), M.brass, drum).position.y = .007;
    var head = mesh(new T.CircleGeometry(.1, 40), M.skin, drum); head.rotation.x = -Math.PI / 2; head.position.y = .012;
    for (i = 0; i < 8; i++) { var la = i / 8 * TAU; mesh(new T.BoxGeometry(.012, .02, .012), M.brass, drum).position.set(Math.cos(la) * .11, .01, Math.sin(la) * .11); }
    var drumZ = zone('knock', .2, .2, P(1.34, .15, ZT + .013), 'top', { part: 'drum', hz: 62, obj: 4 }); tag(drum, drumZ);

    /* ---------- ⑫ junk drawer and magnet arm ---------- */
    var drawer = new T.Group(); rig.add(drawer);
    box(.86, 0, ZB + .05, 1.10, .30, ZB + .055, M.walnut, drawer); box(.86, -.006, ZB + .05, 1.10, 0, ZB + .17, M.drawerF, drawer); box(.855, -.0012, ZB + .045, 1.105, -.0003, ZB + .175, M.lac); box(.86, 0, ZB + .05, .865, .30, ZB + .15, M.walnut, drawer); box(1.095, 0, ZB + .05, 1.10, .30, ZB + .15, M.walnut, drawer);
    var pull = box(.95, -.022, ZB + .10, 1.01, -.006, ZB + .115, M.brass, drawer);
    [.942, 1.018].forEach(function (x) { box(x - .002, .002, ZB + .055, x + .002, .298, ZB + .12, M.walnut, drawer); });   // three bins: steel, mixed, brass
    var nuts = new T.InstancedMesh(new T.CylinderGeometry(1, 1, .7, 6), M.steel, 60); nuts.castShadow = true; nuts.instanceMatrix.setUsage(T.DynamicDrawUsage); drawer.add(nuts);
    var dummy = new T.Object3D(), rest = [], seed = 7, rn = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }; for (i = 0; i < 60; i++) rest.push(.05 + rn() * .9, .05 + rn() * .9, .01 + rn() * .02);
    var drawerZ = zone('drawer', .24, .12, P(.98, -.025, ZB + .11), 'front', { part: 'drawer' }); drawer.add(drawerZ); tag(drawer, drawerZ);
    var junkZ = zone('play', .22, .2, P(.98, -.1, ZB + .18), 'top', { src: 6, part: 'junk', off: true });
    var arm = new T.Group(); arm.position.copy(P(1.13, .01, ZT + .02)); rig.add(arm); cyl(1.13, .01, ZT, ZT + .03, .012, M.brass);
    mesh(new T.BoxGeometry(.2, .008, .012), M.brass, arm).position.x = -.1; mesh(new T.CylinderGeometry(.016, .016, .03, 16), M.rubber, arm).position.set(-.2, -.02, 0);

    /* ---------- ⑬ spring tank slung under the right half, open at the front ---------- */
    var TK = [.95, -.02, .44, 1.42, .17, .54], tankM = [];
    tankM.push(box(TK[0] + .01, TK[4] - .01, TK[2] + .008, TK[3] - .01, TK[4], TK[5], M.iron), box(TK[0] + .01, TK[1], TK[2], TK[3] - .01, TK[4], TK[2] + .008, M.iron), box(TK[0], TK[1], TK[2], TK[0] + .01, TK[4], TK[5], M.iron), box(TK[3] - .01, TK[1], TK[2], TK[3], TK[4], TK[5], M.iron));
    [1.0, 1.37].forEach(function (x) { tankM.push(rod(P(x, .08, TK[5]), P(x, .08, ZB), .006, M.brass)); });
    // two coiled steel springs (wire on a helix, hooked through eye bolts on the tank's end walls); the helix part quivers
    var SPR = { n: 40, R: .012, w: .0013, x0: .19, seg: 12 }, sprM = std(tx.steel, { metalness: 1, roughness: 1, color: 0xc8ccca, envMapIntensity: 1.25 });
    var springs = [], sprG = []; for (i = 0; i < 2; i++) {
      var sg2 = new T.Group(); sg2.position.copy(P(1.185, .04 + i * .07, .49)); rig.add(sg2); sprG.push(sg2);
      var hc = new T.Curve(); hc.getPoint = function (u, o) { var a = u * SPR.n * TAU; return (o || new T.Vector3()).set(-SPR.x0 + 2 * SPR.x0 * u, Math.cos(a) * SPR.R, Math.sin(a) * SPR.R); };
      var NS2 = SPR.n * SPR.seg, hgm = new T.TubeGeometry(hc, NS2, SPR.w, 5, false), hm = mesh(hgm, sprM, sg2);
      hm.castShadow = false; hm.frustumCulled = false; hm.p0 = Float32Array.from(hgm.attributes.position.array); hm.rings = NS2 + 1; hm.rv = 6; hm.dsp = new Float32Array((NS2 + 1) * 2);
      [-1, 1].forEach(function (sd) {
        // the end: from the last turn in to the axis, a short lead, and an open hook through the eye bolt
        var e = hc.getPoint(sd < 0 ? 0 : 1), pts = [e, new T.Vector3(sd * (SPR.x0 + .004), e.y * .35, e.z * .35), new T.Vector3(sd * (SPR.x0 + .008), 0, 0), new T.Vector3(sd * (SPR.x0 + .013), 0, 0)];
        for (var a = 1; a <= 12; a++) { var an = a / 12 * Math.PI * 1.7; pts.push(new T.Vector3(sd * (SPR.x0 + .018 - Math.cos(an) * .005), Math.sin(an) * .005, 0)); }
        var ek = mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 40, SPR.w, 5, false), sprM, sg2); ek.castShadow = false;
        // the eye bolt: a ring at right angles to the hook, on a stud from the end wall, with a nut
        var eye = mesh(new T.TorusGeometry(.0042, .0011, 6, 16), M.steel, sg2); eye.position.set(sd * (SPR.x0 + .023), 0, 0); eye.rotation.x = Math.PI / 2;
        var stud = mesh(new T.CylinderGeometry(.0016, .0016, .012, 8), M.steel, sg2); stud.rotation.z = Math.PI / 2; stud.position.set(sd * (SPR.x0 + .0325), 0, 0);
        var nut = mesh(new T.CylinderGeometry(.0042, .0042, .003, 6), M.brass, sg2); nut.rotation.z = Math.PI / 2; nut.position.set(sd * (SPR.x0 + .0335), 0, 0);
      });
      springs.push(hm);
    }
    var tankZ = zone('play', .46, .1, P(1.185, -.021, .49), 'front', { src: 5, part: 'spring' }); tankM.forEach(function (m) { m.userData.zone = tankZ; }); sprG.forEach(function (g) { tag(g, tankZ); });

    /* ---------- ⑮ thunder sheet, ⑯ mast and gallows, ⑰ brain panel, ⑱ grille, ㉒ lamp ---------- */
    box(.77, .455, ZB, .83, .495, 1.72, M.walnut); box(.10, .45, 1.72, 1.52, .50, 1.76, M.walnut);
    rod(P(.80, .48, 1.55), P(.40, .48, 1.72), .008, M.iron); rod(P(.80, .48, 1.55), P(1.20, .48, 1.72), .008, M.iron);
    var shG = new T.PlaneGeometry(.88, .56, 16, 12), sheet = mesh(shG, std((function () { var o = {}; ['map', 'roughnessMap', 'normalMap'].forEach(function (k) { o[k] = tx.iron[k].clone(); o[k].repeat.set(1, 1); o[k].needsUpdate = true; }); return o; })(), { metalness: .7, roughness: 1, side: T.DoubleSide, color: 0xd8d2c4 })); sheet.position.copy(P(.58, .535, 1.30)); var sh0 = Float32Array.from(shG.attributes.position.array);
    [.17, .99].forEach(function (x) { wire(P(x, .535, 1.72), P(x, .535, 1.58)); });
    var sheetZ = zone('sheet', .88, .56, P(.58, .53, 1.30), 'front', { part: 'sheet', hz: 88, obj: 2 }); tag(sheet, sheetZ);
    box(.60, .43, 1.04, 1.00, .445, 1.46, M.lac); box(.59, .445, 1.03, 1.01, .45, 1.47, M.walnut);
    var KN0 = ['SHIFT', 'DETUNE', 'FEEDBACK', 'RETURN', 'AURA', 'HALL'];
    // ⑰ the faceplate: black crinkle enamel (a photo-scanned grain as its normal and roughness), engraved white-filled
    // lettering and tick scales printed round each knob and along the send fader. 3000 px per metre.
    (function () {
      var S = 3000, c = document.createElement('canvas'); c.width = 1200; c.height = 1260; var x = c.getContext('2d'), sd = 3, rr = function () { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
      var X = function (mx) { return (mx - .60) * S; }, Z = function (mz) { return (1.46 - mz) * S; };
      x.fillStyle = '#262420'; x.fillRect(0, 0, 1200, 1260);
      for (var k = 0; k < 500; k++) { x.fillStyle = 'rgba(' + (rr() < .5 ? '255,255,255' : '0,0,0') + ',' + (rr() * .03) + ')'; x.beginPath(); x.arc(rr() * 1200, rr() * 1260, 10 + rr() * 60, 0, TAU); x.fill(); }   // enamel thickness and handling
      var eng = function (t, mx, mz, sz, al) { x.save(); x.translate(X(mx), Z(mz)); x.font = '600 ' + sz + 'px "DejaVu Sans", "Helvetica Neue", Arial, sans-serif'; x.textAlign = al || 'center'; x.textBaseline = 'middle';
        if (x.letterSpacing !== undefined) x.letterSpacing = (sz * .12) + 'px'; x.fillStyle = 'rgba(0,0,0,.9)'; x.fillText(t, -2, -2); x.fillStyle = '#fbf4e2'; x.fillText(t, 0, 0); x.restore(); };
      eng('HARMONIZER  ·  AURA  ·  HALL', .80, 1.445, 40);
      KN0.forEach(function (k, j) { var cx = .66 + (j % 3) * .14, cz = j < 3 ? 1.25 : 1.15; eng(k, cx, cz - .045, 36);
        for (var q = 0; q <= 10; q++) { var a = (-135 + q * 27) * Math.PI / 180, big = q % 5 === 0, r0 = .031, r1 = big ? .0375 : .0345; x.strokeStyle = '#f4ecd8'; x.lineWidth = big ? 5 : 3; x.beginPath(); x.moveTo(X(cx + Math.sin(a) * r0), Z(cz + Math.cos(a) * r0)); x.lineTo(X(cx + Math.sin(a) * r1), Z(cz + Math.cos(a) * r1)); x.stroke();
          if (big) { x.font = '700 25px "DejaVu Sans", Arial, sans-serif'; x.fillStyle = '#efe7d3'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(q), X(cx + Math.sin(a) * .0425), Z(cz + Math.cos(a) * .0425)); } } });
      eng('SEND', .64, 1.36, 30);
      for (k = 0; k <= 10; k++) { var fx = .668 + k * .0264; x.strokeStyle = '#e6dfcd'; x.lineWidth = k % 5 ? 2.5 : 4; x.beginPath(); x.moveTo(X(fx), Z(1.3315)); x.lineTo(X(fx), Z(k % 5 ? 1.3285 : 1.326)); x.stroke(); if (k % 5 === 0) { x.font = '600 19px "DejaVu Sans", Arial, sans-serif'; x.fillStyle = '#cfc8b6'; x.textAlign = 'center'; x.fillText(String(k), X(fx), Z(1.3205)); } }
      eng('FREEZE', .68, 1.047, 30); eng('LOOP', .92, 1.047, 30);
      x.strokeStyle = 'rgba(240,232,212,.75)'; x.lineWidth = 4; x.strokeRect(36, 36, 1128, 1188); x.lineWidth = 1.5; x.strokeRect(46, 46, 1108, 1168);
      var t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
      var cr = function (k2) { var q = tx.crinkle[k2].clone(); q.repeat.set(7, 7); q.rotation = 0; q.needsUpdate = true; return q; };
      var fm = low ? new T.MeshStandardMaterial({ map: t, normalMap: cr('normalMap'), roughnessMap: cr('roughnessMap'), roughness: .85, metalness: 0 }) : new T.MeshPhysicalMaterial({ map: t, normalMap: cr('normalMap'), roughnessMap: cr('roughnessMap'), roughness: .85, metalness: 0, clearcoat: .25, clearcoatRoughness: .5 });
      fm.normalScale.set(.6, .6); fm.polygonOffset = true; fm.polygonOffsetFactor = -1; fm.polygonOffsetUnits = -2;
      var pm = new T.Mesh(new T.PlaneGeometry(.40, .42), fm); pm.position.copy(P(.80, .4288, 1.25)); pm.receiveShadow = true; rig.add(pm);
      // four slotted brass screws in the corners
      [[.615, 1.445], [.985, 1.445], [.615, 1.055], [.985, 1.055]].forEach(function (q, k2) { var sw = mesh(new T.SphereGeometry(.0045, 16, 6, 0, TAU, 0, Math.PI / 2), M.brass); sw.rotation.x = Math.PI / 2; sw.position.copy(P(q[0], .4286, q[1])); sw.castShadow = false;
        var sl = mesh(new T.BoxGeometry(.0068, .0009, .0012), M.lac, sw); sl.position.y = .0042; sl.rotation.y = k2 * .7 + .3; });
    })();
    var lcv = document.createElement('canvas'); lcv.width = 256; lcv.height = 64; var lct = new T.CanvasTexture(lcv); lct.colorSpace = T.SRGBColorSpace;
    lcv.width = 512; lcv.height = 128; var lcdM = new T.Mesh(new T.PlaneGeometry(.22, .055), new T.MeshBasicMaterial({ map: lct, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 })); lcdM.position.copy(P(.80, .4278, 1.40)); rig.add(lcdM);
    // the readout sits in a recessed black bezel behind a pane of glass
    [[.684, .916, 1.4285, 1.4325], [.684, .916, 1.3675, 1.3715], [.684, .688, 1.3675, 1.4325], [.912, .916, 1.3675, 1.4325]].forEach(function (q) { box(q[0], .4255, q[2], q[1], .4286, q[3], M.iron).castShadow = false; });
    var lcdG = new T.Mesh(new T.PlaneGeometry(.226, .059), glassThin({ envMapIntensity: 3 })); lcdG.position.copy(P(.80, .4262, 1.40)); lcdG.renderOrder = 3; rig.add(lcdG);
    // instrument knobs: a spun-aluminium skirt, a knurled aluminium body, a polished bakelite cap with a white pointer
    var knurl = (function () { var g2 = new T.CylinderGeometry(.0238, .0244, .013, 96, 1, true), ps = g2.attributes.position; for (var k = 0; k < ps.count; k++) { var px = ps.getX(k), pz = ps.getZ(k), a = Math.atan2(pz, px), f = 1 + .045 * Math.pow(Math.abs(Math.cos(a * 24)), .6); ps.setX(k, px * f / 1.045); ps.setZ(k, pz * f / 1.045); } g2.computeVertexNormals(); return g2; })();
    var skirt = new T.CylinderGeometry(.0262, .027, .0045, 64), capG = new T.CylinderGeometry(.0226, .0236, .0045, 64), faceG = new T.CylinderGeometry(.0175, .0175, .0008, 48), knobParts = function () { return [[skirt, M.alu, .00225], [knurl, M.alu, .011], [capG, M.bakelite, .0198], [faceG, M.aluFace, .0222]]; };
    var KN = [['harm.shift', 'SHIFT'], ['harm.detune', 'DETUNE'], ['harm.fb', 'FEEDBACK'], ['harm.mix', 'RETURN'], ['aura.level', 'AURA'], ['rev.decay', 'HALL']], knobs = [];
    KN.forEach(function (k, j) { var x = .66 + (j % 3) * .14, z = j < 3 ? 1.25 : 1.15, g = new T.Group(); g.position.copy(P(x, .43, z)); rig.add(g); var kparts = knobParts(); kparts.forEach(function (q) { var m = mesh(q[0], q[1], g); m.rotation.x = Math.PI / 2; m.position.z = q[2]; }); mesh(new T.BoxGeometry(.004, .018, .004), M.knobLine, g).position.set(0, .012, .024); var zk = zone('knob', .07, .07, P(x, .42, z), 'front', { part: 'knob', param: k[0], lab: k[1] }); tag(g, zk); knobs.push({ g: g, p: k[0] }); });
    var sendT = box(.66, .425, 1.335, .94, .43, 1.345, M.lac), sendK = box(.66, .418, 1.328, .675, .425, 1.352, M.alu), sendZ = zone('send', .3, .04, P(.80, .41, 1.34), 'front', { part: 'send' }); tag(sendT, sendZ); tag(sendK, sendZ);
    [1.3335, 1.3465].forEach(function (z) { box(.655, .4245, z - .0012, .945, .4286, z + .0012, M.brass).castShadow = false; });   // the fader's brass rails
    // the pilot lamp: a faceted red glass jewel in a chrome bezel
    var ledM = low ? new T.MeshStandardMaterial({ color: 0x3a0806, roughness: .2, emissive: 0xff2010, emissiveIntensity: 0 }) : new T.MeshPhysicalMaterial({ color: 0x5a0a06, roughness: .08, metalness: 0, clearcoat: 1, clearcoatRoughness: .05, emissive: 0xff2010, emissiveIntensity: 0, envMapIntensity: 2 });
    var led = new T.Mesh(new T.IcosahedronGeometry(.007, 1), ledM); led.position.copy(P(.935, .428, 1.40)); rig.add(led);
    var ledB = mesh(new T.TorusGeometry(.0078, .0016, 8, 24), M.alu); ledB.position.copy(P(.935, .4282, 1.40)); ledB.castShadow = false;
    // FREEZE and LOOP: frosted glass push buttons, lit from behind (a faint glow at rest, bright when engaged), in aluminium bezels
    var frosted = function (c, e) { return low ? new T.MeshStandardMaterial({ color: c, roughness: .45, emissive: e, emissiveIntensity: .45 }) : new T.MeshPhysicalMaterial({ color: c, roughness: .5, metalness: 0, clearcoat: .8, clearcoatRoughness: .3, sheen: .4, sheenColor: new T.Color(0xffffff), emissive: e, emissiveIntensity: .45 }); };
    var frzM = frosted(0x9ab8d4, 0x7fd0ff), loopM = frosted(0xc0584a, 0xff4a2a);
    [[.64, .72], [.88, .96]].forEach(function (q) { [[q[0] - .004, q[1] + .004, 1.0565, 1.06], [q[0] - .004, q[1] + .004, 1.09, 1.0935], [q[0] - .004, q[0], 1.06, 1.09], [q[1], q[1] + .004, 1.06, 1.09]].forEach(function (b) { box(b[0], .4255, b[2], b[1], .4288, b[3], M.alu).castShadow = false; }); });
    tag(box(.64, .418, 1.06, .72, .43, 1.09, frzM), zone('button', .08, .03, P(.68, .415, 1.075), 'front', { part: 'freeze' })); tag(box(.88, .418, 1.06, .96, .43, 1.09, loopM), zone('button', .08, .03, P(.92, .415, 1.075), 'front', { part: 'loop' }));
    // ⑱ grille with the body meter
    box(1.19, -.004, ZB + .04, 1.51, 0, ZT - .04, M.brass); box(1.20, -.006, ZB + .05, 1.50, -.002, ZT - .05, M.cloth);
    // the body meter: a round panel gauge. Iron case, brass bezel with three screws, an aged ivory dial (printed ticks and numerals,
    // foxing), a slim black needle with a counterweight and a brass cap, under a domed glass with a soft window reflection
    var meter = new T.Group(); meter.position.copy(P(1.35, -.004, .77)); rig.add(meter); var GR = .073;
    var gcase = mesh(new T.CylinderGeometry(.083, .085, .012, 48), M.iron, meter); gcase.rotation.x = Math.PI / 2; gcase.position.z = .006;
    var bez = mesh(new T.LatheGeometry([[GR - .001, .010], [GR + .002, .0215], [GR + .006, .024], [.081, .0225], [.085, .018], [.086, .012], [.0855, .011]].map(function (q) { return new T.Vector2(q[0], q[1]); }), 64), (function () { var b2 = M.brass.clone(); b2.side = T.DoubleSide; return b2; })(), meter); bez.rotation.x = Math.PI / 2;
    for (i = 0; i < 3; i++) { var sa2 = Math.PI / 2 + i * TAU / 3, scw = new T.Group(); scw.position.set(Math.cos(sa2) * .0795, Math.sin(sa2) * .0795, .0215); meter.add(scw); var sh2 = mesh(new T.SphereGeometry(.0036, 12, 6, 0, TAU, 0, Math.PI / 2), M.brass, scw); sh2.rotation.x = Math.PI / 2; var sl2 = mesh(new T.BoxGeometry(.0062, .0008, .0012), M.lac, scw); sl2.position.z = .0034; sl2.rotation.z = sa2 * 1.7 + i; }
    var dialT = (function () {
      var c = document.createElement('canvas'); c.width = c.height = 1024; var x = c.getContext('2d'), C0 = 512, sd = 7, rr = function () { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
      var bg = x.createRadialGradient(C0, C0 - 60, 40, C0, C0, 520); bg.addColorStop(0, '#efe4c6'); bg.addColorStop(.7, '#e2d3ac'); bg.addColorStop(1, '#bfa97a'); x.fillStyle = bg; x.fillRect(0, 0, 1024, 1024);
      for (var k = 0; k < 2600; k++) { x.fillStyle = 'rgba(' + (rr() < .5 ? '120,86,40' : '90,70,40') + ',' + (rr() * .05) + ')'; var rx2 = rr() * 1024, ry2 = rr() * 1024, rs = 2 + rr() * 26; x.beginPath(); x.arc(rx2, ry2, rs, 0, TAU); x.fill(); }   // foxing
      for (k = 0; k < 14; k++) { x.fillStyle = 'rgba(130,92,44,' + (.05 + rr() * .07) + ')'; x.beginPath(); x.arc(rr() * 1024, rr() * 1024, 6 + rr() * 22, 0, TAU); x.fill(); }
      var ang = function (v) { return -2.2 + v * 4.4; }, at = function (v, rad) { var a2 = ang(v); return [C0 + Math.sin(a2) * rad, C0 - Math.cos(a2) * rad]; };
      x.strokeStyle = 'rgba(150,30,22,.85)'; x.lineWidth = 34; x.beginPath(); x.arc(C0, C0, 392, ang(.8) - Math.PI / 2, ang(1) - Math.PI / 2); x.stroke();   // the red zone
      x.strokeStyle = '#231c14'; x.lineWidth = 5; x.beginPath(); x.arc(C0, C0, 410, ang(0) - Math.PI / 2, ang(1) - Math.PI / 2); x.stroke();
      for (k = 0; k <= 50; k++) { var v = k / 50, big = k % 5 === 0, p1 = at(v, 410), p2 = at(v, big ? 352 : k % 5 === 0 ? 372 : 382); x.lineWidth = big ? 9 : 4; x.beginPath(); x.moveTo(p1[0], p1[1]); x.lineTo(p2[0], p2[1]); x.stroke(); }
      x.fillStyle = '#231c14'; x.font = 'bold 66px Georgia, "Times New Roman", serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      for (k = 0; k <= 10; k += 2) { var pn = at(k / 10, 296); x.fillText(String(k), pn[0], pn[1]); }
      x.font = 'bold 54px Georgia, serif'; x.fillText('BODY', C0, C0 + 190); x.font = 'italic 34px Georgia, serif'; x.fillText('resonance', C0, C0 + 244);
      x.font = '26px "Courier New", monospace'; x.fillStyle = 'rgba(35,28,20,.75)'; x.fillText('No 18 · HORROR ENGINE WORKS', C0, C0 + 316); x.fillText('× 10', C0, C0 - 170);
      x.strokeStyle = 'rgba(60,44,28,.35)'; x.lineWidth = 3; x.beginPath(); x.arc(C0, C0, 500, 0, TAU); x.stroke();
      var t2 = new T.CanvasTexture(c); t2.colorSpace = T.SRGBColorSpace; t2.anisotropy = 8; return t2;
    })();
    var dial = mesh(new T.CircleGeometry(GR, 64), new T.MeshStandardMaterial({ map: dialT, roughness: .72, metalness: 0 }), meter); dial.position.z = .0125;
    var ndl = new T.Group(); ndl.position.z = .0165; meter.add(ndl);
    var nsh = new T.Shape(); nsh.moveTo(-.0018, -.0025); nsh.lineTo(-.0006, .063); nsh.lineTo(0, .066); nsh.lineTo(.0006, .063); nsh.lineTo(.0018, -.0025); nsh.lineTo(.001, -.0125); nsh.lineTo(-.001, -.0125); nsh.closePath();
    var ndM = new T.MeshStandardMaterial({ color: 0x14100c, roughness: .4, metalness: .35 });
    mesh(new T.ExtrudeGeometry(nsh, { depth: .0007, bevelEnabled: false }), ndM, ndl);
    var cw = mesh(new T.CylinderGeometry(.0042, .0042, .002, 20), ndM, ndl); cw.rotation.x = Math.PI / 2; cw.position.set(0, -.0125, .0004);   // counterweight
    var cap = mesh(new T.SphereGeometry(.0058, 20, 10, 0, TAU, 0, Math.PI / 2), M.brass, ndl); cap.rotation.x = Math.PI / 2; cap.position.z = .0009;
    // domed glass: a shallow spherical cap seated in the bezel, plus a soft window-shaped reflection painted on a second skin
    var DR = .2, th = Math.asin((GR + .002) / DR), dome = new T.SphereGeometry(DR, 48, 8, 0, TAU, 0, th); dome.rotateX(Math.PI / 2); dome.translate(0, 0, .0215 - DR * Math.cos(th));
    var glM = low ? new T.MeshStandardMaterial({ color: 0xe8f0ee, roughness: .03, metalness: 0, transparent: true, opacity: .1, envMapIntensity: 2.2, depthWrite: false }) : glassHi({ thickness: .0015, roughness: .01, side: T.FrontSide, envMapIntensity: 2 });
    var glass = mesh(dome, glM, meter); glass.castShadow = false; glass.receiveShadow = false; glass.renderOrder = 2;
    var refl = (function () { var c = document.createElement('canvas'); c.width = c.height = 256; var x = c.getContext('2d'); var g2 = x.createLinearGradient(40, 30, 150, 140); g2.addColorStop(0, 'rgba(255,248,230,0)'); g2.addColorStop(.45, 'rgba(255,248,230,.55)'); g2.addColorStop(.6, 'rgba(255,248,230,.2)'); g2.addColorStop(1, 'rgba(255,248,230,0)');
      x.fillStyle = g2; x.beginPath(); x.ellipse(92, 84, 52, 15, -.75, 0, TAU); x.fill(); x.fillStyle = 'rgba(255,248,230,.12)'; x.beginPath(); x.ellipse(176, 182, 26, 9, -.75, 0, TAU); x.fill(); var t3 = new T.CanvasTexture(c); t3.colorSpace = T.SRGBColorSpace; return t3; })();
    var rfl = mesh(dome.clone(), new T.MeshBasicMaterial({ map: refl, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: .22, toneMapped: false }), meter);
    rfl.castShadow = false; rfl.receiveShadow = false; rfl.renderOrder = 3; rfl.position.z = .001;   // its own skin, 1 mm proud of the glass
    // the dome's UVs wrap around its axis; give the reflection planar UVs (seen from the front) so the streak sits top-left
    (function () { var g3 = rfl.geometry, ps = g3.attributes.position, uv = g3.attributes.uv; for (var k = 0; k < ps.count; k++) uv.setXY(k, ps.getX(k) / (2 * GR) + .5, ps.getY(k) / (2 * GR) + .5); uv.needsUpdate = true; })();
    // ㉒ lamp hanging from the gallows: it is the aura voice (rub it)
    wire(P(1.22, .47, 1.72), P(1.22, .47, 1.56), .0018, new T.MeshStandardMaterial({ color: 0x2a221a, roughness: .7 }));   // the lamp's cloth flex
    var shade = mesh(new T.ConeGeometry(.075, .07, 28, 1, true), std(tx.brass, { metalness: 1, roughness: 1, side: T.DoubleSide, color: 0xb0a080 })); shade.position.copy(P(1.22, .47, 1.53));
    var bulbM = new T.MeshStandardMaterial({ color: 0x302010, emissive: 0xffa060, emissiveIntensity: .6, roughness: .2 }), bulb = new T.Mesh(new T.SphereGeometry(.025, 16, 12), bulbM); bulb.position.copy(P(1.22, .47, 1.495)); rig.add(bulb);
    var lampL = new T.PointLight(0xffa060, .6, 3, 1.5); lampL.position.copy(bulb.position); rig.add(lampL);
    var lampZ = zone('play', .2, .16, P(1.22, .46, 1.52), 'front', { src: 7, part: 'lamp' }); tag(shade, lampZ); bulb.userData.zone = lampZ;

    /* ---------- ⑲ piezo discs, ㉑ clock-spring coil bolted flat on the front-left face ---------- */
    var piezo = [[.47, .31], [.98, .30], [1.34, .285]].map(function (q) { var m = new T.MeshStandardMaterial({ color: 0xb08a4a, metalness: 1, roughness: .35, emissive: 0x6fd0b8, emissiveIntensity: 0 }), d = cyl(q[0], q[1], ZT, ZT + .004, .02, m, null, 24); var cap = cyl(q[0], q[1], ZT + .004, ZT + .006, .008, M.bone, null, 16), pz = zone('button', .05, .05, P(q[0], q[1], ZT + .007), 'top', { part: 'piezo' }); tag(d, pz); tag(cap, pz); return m; });
    var coilG = (function () { var pts = [], idx = [], n = 520, R = .1, r0 = .012, wdt = .016; for (var k = 0; k <= n; k++) { var t = k / n, a = t * 11 * TAU, rr = r0 + (R - r0) * t; pts.push(Math.cos(a) * rr, Math.sin(a) * rr, -wdt / 2, Math.cos(a) * rr, Math.sin(a) * rr, wdt / 2); if (k < n) { var b = k * 2; idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); } } var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pts, 3)); g.setIndex(idx); g.computeVertexNormals(); return g; })();
    var coil = mesh(coilG, new T.MeshStandardMaterial({ color: 0x8a8f90, metalness: 1, roughness: .35, side: T.DoubleSide })); coil.position.copy(P(.22, -.016, ZB + .15));
    // its mount: a brass backing plate (a hair off the wood), the centre bolt through the arbor, a clamp bolt on the outer end
    var coilMt = [box(.19, -.0045, ZB + .12, .25, -.0008, ZB + .18, M.brass), rod(P(.22, -.0008, ZB + .15), P(.22, -.028, ZB + .15), .009, M.steel), rod(P(.32, -.0008, ZB + .15), P(.32, -.026, ZB + .15), .006, M.steel), box(.305, -.0045, ZB + .135, .335, -.0008, ZB + .165, M.brass)];
    var coilZ = zone('bowtap', .23, .23, P(.22, -.03, ZB + .15), 'front', { part: 'coil', items: function () { return [{ u: .5, bow: { 'bowed.object': 3 }, tap: { 'struck.object': 3 } }]; } }); tag(coil, coilZ); coilMt.forEach(function (m) { tag(m, coilZ); });

    /* ---------- ① bare wood (top and front): knock on it, or moan a superball over it ---------- */
    var woodT = zone('knock', 1.6, .45, P(.8, .225, ZT + .0007), 'top', { part: 'wood', hz: 150, obj: 4 }); tag(spine, woodT);
    var woodF = zone('knock', 1.52, .30, P(.8, -.0015, (ZB + ZT) / 2), 'front', { part: 'wood', hz: 130, obj: 4 }); rays.forEach(function (q) { q.userData.zone = woodF; }); hub.userData.zone = woodF; tag(meter, woodF);

    /* ---------- ㉔ bow saw hung from the gallows, ⑨ slate (chalkboard), ⑩ bottle: the voices' remaining objects ---------- */
    // a musical saw on a wire from the gallows: bow its smooth back edge; bending the blade bends the note
    wire(P(1.42, .475, 1.72), P(1.42, .475, 1.672)); cyl(1.42, .475, 1.665, 1.675, .006, M.brass, null, 10);
    var sawH = box(1.39, .463, 1.598, 1.45, .487, 1.665, M.walnut); var sawRiv = [cyl(1.405, .475, 1.62, 1.63, .004, M.brass, null, 8), cyl(1.435, .475, 1.62, 1.63, .004, M.brass, null, 8)];
    sawRiv.forEach(function (m) { m.rotation.x = Math.PI / 2; m.position.copy(P(m.position.x + .8, .462, m.position.y)); });
    var k, sawG = new T.PlaneGeometry(1, 1, 2, 64), sp0 = sawG.attributes.position, sawB = [];
    // the toothed edge is part of the blade (a filed tooth every other row), so the teeth bend with it
    for (k = 0; k < sp0.count; k++) { var su = sp0.getX(k) + .5, sv = .5 - sp0.getY(k), wdh = .085 - .05 * sv, zz = 1.60 - .54 * sv, row = Math.round(sv * 64); sp0.setXYZ(k, (su - .5) * wdh - (su < .01 && row % 2 && row < 63 ? .0042 : 0), zz, 0); sawB.push(su, sv); }
    sawG.computeVertexNormals();
    // its own steel: long polish streaks down the blade, a filed dark band and freckles of rust along the teeth, an etched mark
    var sawTx = (function () { var c = document.createElement('canvas'); c.width = 128; c.height = 1024; var g = c.getContext('2d'), sd = 91, rr = function () { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
      var gr = g.createLinearGradient(0, 0, 128, 0); gr.addColorStop(0, '#4c4f4c'); gr.addColorStop(.12, '#73777a'); gr.addColorStop(.55, '#94989a'); gr.addColorStop(1, '#808486'); g.fillStyle = gr; g.fillRect(0, 0, 128, 1024);
      for (var n = 0; n < 420; n++) { var x = rr() * 128; g.strokeStyle = rr() < .5 ? 'rgba(255,255,255,' + (.03 + rr() * .07) + ')' : 'rgba(30,32,30,' + (.03 + rr() * .08) + ')'; g.lineWidth = .5 + rr(); g.beginPath(); var y0 = rr() * 1024; g.moveTo(x, y0); g.lineTo(x + (rr() - .5) * 2, y0 + 80 + rr() * 500); g.stroke(); }
      for (n = 0; n < 70; n++) { var rx = rr() * 30 * rr(), ry = rr() * 1024, rs = 2 + rr() * 9; g.fillStyle = 'rgba(' + (110 + rr() * 40 | 0) + ',' + (55 + rr() * 25 | 0) + ',25,' + (.12 + rr() * .3) + ')'; g.beginPath(); g.ellipse(rx, ry, rs * .6, rs, 0, 0, TAU); g.fill(); }
      g.save(); g.translate(78, 150); g.rotate(Math.PI / 2); g.fillStyle = 'rgba(35,38,36,.45)'; g.font = 'bold 15px serif'; g.fillText('CAST STEEL  \u00B7  No 26', 0, 0); g.restore();
      var q = new T.CanvasTexture(c); q.colorSpace = T.SRGBColorSpace; q.anisotropy = 8; return q; })();
    var sawM = new T.MeshStandardMaterial({ map: sawTx, metalness: .85, roughness: .34, side: T.DoubleSide, envMapIntensity: 1.2 });
    var saw = mesh(sawG, sawM); saw.position.copy(P(1.42, .475, 0)); saw.position.y = 0;
    var sawT = null;
    var sawZ = zone('bowtap', .12, .56, P(1.42, .455, 1.33), 'front', { part: 'saw', items: function () { var hz = Math.round(Math.min(1200, Math.max(300, H.P['bowed.size'] * 1.6))); return [{ u: .5, bow: { 'bowed.object': 2 }, tap: { 'struck.object': 2 }, hz: hz }]; } });
    tag(saw, sawZ); tag(sawH, sawZ); sawRiv.forEach(function (m) { tag(m, sawZ); });
    // a slate in a walnut frame, a stub of chalk beside it
    var slc = document.createElement('canvas'); slc.width = 512; slc.height = 288; (function () { var x = slc.getContext('2d'), sd = 11, rr = function () { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
      x.fillStyle = '#1d2220'; x.fillRect(0, 0, 512, 288); for (var q = 0; q < 2500; q++) { x.fillStyle = 'rgba(200,210,200,' + rr() * .05 + ')'; x.fillRect(rr() * 512, rr() * 288, 2, 2); }
      x.strokeStyle = 'rgba(220,225,215,.18)'; x.lineWidth = 7; for (q = 0; q < 6; q++) { x.beginPath(); x.moveTo(rr() * 512, rr() * 288); x.bezierCurveTo(rr() * 512, rr() * 288, rr() * 512, rr() * 288, rr() * 512, rr() * 288); x.stroke(); }
      x.fillStyle = 'rgba(225,228,220,.38)'; x.font = 'bold 34px "Courier New", monospace'; x.save(); x.translate(40, 70); x.rotate(-.04); x.fillText('f = 440 \u00D7 2^(n/12)', 0, 0); x.restore(); })();
    var slt = new T.CanvasTexture(slc); slt.colorSpace = T.SRGBColorSpace; slt.anisotropy = 8;
    var slate = box(.53, .095, ZT, .79, .225, ZT + .008, new T.MeshStandardMaterial({ map: slt, roughness: .95, metalness: 0 }));
    var slF = [box(.52, .085, ZT, .80, .095, ZT + .012, M.walnut), box(.52, .225, ZT, .80, .235, ZT + .012, M.walnut), box(.52, .095, ZT, .53, .225, ZT + .012, M.walnut), box(.79, .095, ZT, .80, .225, ZT + .012, M.walnut)];
    var chalk = rod(P(.70, .243, ZT + .004), P(.745, .243, ZT + .004), .0035, new T.MeshStandardMaterial({ color: 0xe8e4d8, roughness: 1 }), null, 8);
    var slateZ = zone('play', .26, .13, P(.66, .16, ZT + .013), 'top', { src: 3, part: 'slate', set: function (Pm, e) { return { 'glass.surface': 3, 'glass.contact': e && e.altKey ? 0 : 2 }; } });
    tag(slate, slateZ); slF.forEach(function (m) { tag(m, slateZ); }); tag(chalk, slateZ);
    // a brown bottle standing behind the drum: rub its shoulder
    var botM = low ? M.glass.clone() : glassHi({ color: 0xffffff, attenuationColor: new T.Color(0x5a3010), attenuationDistance: .006, thickness: .004, roughness: .05 }); if (low) { botM.color = new T.Color(0x6a4420); botM.opacity = .55; }
    var bot = mesh(new T.LatheGeometry([[0, 0], [.024, 0], [.025, .008], [.025, .09], [.021, .108], [.01, .122], [.0085, .15], [.0095, .156], [.007, .158], [0, .158]].map(function (q) { return new T.Vector2(q[0], q[1]); }), 28), botM); bot.position.copy(P(1.235, .30, ZT + .0005)); bot.castShadow = false;
    var botZ = zone('play', .06, .16, P(1.235, .27, ZT + .08), 'front', { src: 3, part: 'bottle', set: function (Pm, e) { return { 'glass.surface': 2, 'glass.contact': e && e.altKey ? 0 : 1, 'glass.wet': Math.max(.8, Pm['glass.wet']) }; } }); tag(bot, botZ);

    /* ---------- ⑭ superball wands, standing in holders at two corners ---------- */
    function holder(x, y) { holder.last = [cyl(x, y, ZT, ZT + .05, .022, M.walnut, null, 18), cyl(x, y, ZT + .05, ZT + .11, .012, M.brass, null, 14)]; return P(x, y, ZT + .11); }
    var wands = [
      { id: 'wandL', base: holder(.05, .42), hm: holder.last, rest: P(-.07, .44, ZT + .58), reach: 1.35, surf: { 2: 1, 3: 1, 0: 1 }, side: -1 },
      { id: 'wandR', base: holder(1.56, .03), hm: holder.last, rest: P(1.70, .0, ZT + .5), reach: 1.05, surf: { 1: 1, 0: 1 }, side: 1 }
    ];
    wands.forEach(function (w) {
      w.ball = ball(w.rest.clone(), .022, M.rubber); w.pos = w.rest.clone(); w.vel = new T.Vector3(); w.goal = w.rest.clone();
      w.tube = mesh(new T.BufferGeometry(), M.brass); w.zone = zone('wand', .09, .09, w.rest.clone(), 'front', { part: w.id }); w.ball.userData.zone = w.zone; w.tube.userData.zone = w.zone; w.hm.forEach(function (m) { m.userData.zone = w.zone; });
    });

    // wood grain: every wooden box (and the spine) gets UVs projected from its position on the rig, per face, in metres,
    // so the grain keeps one scale everywhere, runs along each board's long axis, and continues round the spine's faces
    rig.updateMatrixWorld(true);
    var rigInv = new T.Matrix4().copy(rig.matrixWorld).invert(), seedW = 5;
    rig.traverse(function (o) {
      if (!o.isMesh || !o.geometry || !/^(Box|Extrude)Geometry$/.test(o.geometry.type)) return;
      var mats = Array.isArray(o.material) ? o.material : [o.material]; if (!mats.some(function (m) { return m === M.walnut || m === M.spruce || m === M.drawerF; })) return;
      var g = o.geometry, pa = g.attributes.position, na = g.attributes.normal, uv = g.attributes.uv, mw = new T.Matrix4().multiplyMatrices(rigInv, o.matrixWorld), nm = new T.Matrix3().getNormalMatrix(mw);
      var pts = [], nrm = [], lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9], v = new T.Vector3(), k2;
      for (k2 = 0; k2 < pa.count; k2++) { v.fromBufferAttribute(pa, k2).applyMatrix4(mw); var a3 = v.toArray(); pts.push(a3); for (var c = 0; c < 3; c++) { lo[c] = Math.min(lo[c], a3[c]); hi[c] = Math.max(hi[c], a3[c]); } v.fromBufferAttribute(na, k2).applyMatrix3(nm).normalize(); nrm.push(v.toArray()); }
      var ext = [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]], grain = o === spine ? 0 : ext.indexOf(Math.max.apply(null, ext));
      var matOf = function (k3) { if (!Array.isArray(o.material)) return o.material; for (var q = 0; q < g.groups.length; q++) { var gr = g.groups[q]; if (k3 >= gr.start && k3 < gr.start + gr.count) return o.material[gr.materialIndex]; } return o.material[0]; };
      seedW = (seedW * 16807) % 2147483647; var ph = o === spine ? 0 : seedW / 2147483647, ph2 = ((seedW * 48271) % 2147483647) / 2147483647;
      for (k2 = 0; k2 < pa.count; k2++) {
        var n3 = nrm[k2].map(Math.abs), ax = n3.indexOf(Math.max.apply(null, n3)), pl = [0, 1, 2].filter(function (q) { return q !== ax; }), ua, va;
        if (pl.indexOf(grain) >= 0) { ua = grain; va = pl[0] === grain ? pl[1] : pl[0]; } else { ua = ext[pl[0]] >= ext[pl[1]] ? pl[0] : pl[1]; va = ua === pl[0] ? pl[1] : pl[0]; }
        var vi = (g.index ? k2 : k2), m3 = matOf(g.index ? -1 : k2) || mats[0], su = 1 / m3.map.repeat.x, sv = 1 / m3.map.repeat.y;
        var uu = pts[k2][ua] - lo[ua], vv = pts[k2][va] - lo[va];
        uu += ph * Math.max(0, su - ext[ua]); vv += ph2 * Math.max(0, sv - ext[va]);
        uv.setXY(vi, (uu * .996 + .002 * su), (vv * .996 + .002 * sv));
      }
      uv.needsUpdate = true;
    });
    }
    var roomPicks = SK ? AV.roomPicks : [fl, wl]; if (!SK) [water, wwat, wsurf, trail].forEach(function (o) { o.userData.noPick = 1; });
    var listPicks = function () { picks.length = 0; rig.traverse(function (o) { if (o.isMesh && !o.isInstancedMesh && zones.indexOf(o) < 0 && !o.userData.noPick) picks.push(o); }); roomPicks.forEach(function (o) { picks.push(o); }); };
    listPicks();

    V = { woodT: woodT, woodF: woodF, T: T, r: r, sc: sc, cam: cam, rig: rig, zones: zones, picks: picks, key: key, fill: fill, cone: cone, hemi: hemi, P: P, M: M, low: low,
      string: string, sp: sp, puck: puck, PUCK0: PUCK0, pkG: pkG, bar: bar, barX: barX, barZ: barZ, strZ: strZ, poleM: poleM, wheel: wheel, crank: crank, wrot: 0, drones: drones,
      rulers: rulers, RF: RF, clampL: Math.max(12, Math.min(30, H.P['bowed.length'] || 20)), tray: tray, rods: rods, water: water, w0: w0, wg: wg, tilt: 0, tiltV: 0, tiltLag: 0, tiltLagV: 0, sawG: sawG, cSteel: new T.Color(0xffffff), cBrass: new T.Color(0xd8a848), sawB: sawB, sawT: sawT, sawBend: 0, wwat: wwat, wglass: wglass, wsurf: wsurf, menis: menis, wsU: wsU, wwG: wwG, rIn: rIn, glint: glint, trail: trail, trailM: trailM, fang: 0,
      pane: pane, head: head, drawer: drawer, nuts: nuts, dummy: dummy, rest: rest, junkZ: junkZ, arm: arm, open: Math.min(1, H.P['junk.tray'] || 0), springs: springs, drips: [], spPrev: 0,
      sheet: sheet, sh0: sh0, lcv: lcv, lct: lct, lcdTxt: '', ledM: ledM, knobs: knobs, sendK: sendK, frzM: frzM, loopM: loopM, ndl: ndl, ndA: 2.2, ndV: 0, bulbM: bulbM, lampL: lampL, piezo: piezo, rayM: rayM, coil: coil,
      wands: wands, ROD_HZ: ROD_HZ, tiltBack: false, holdRun: null, vsl: 0, tilt0: 0,
      ray: new T.Raycaster(), nd: new T.Vector2(), act: null, orbit: null, t: 0, last: 0, lv: [0, 0, 0, 0, 0, 0, 0, 0, 0], bodyLv: 0, harmLv: 0, flick: 1, pt: new T.Vector3(), pl: new T.Plane(), n: new T.Vector3(), wq: new T.Vector3(),
      follow: LS('follow') === '1', demo: false, idle: 0 };
    if (SK) { Object.assign(V, AV.V); V.skin = AV; }
    V.cs = Object.assign({}, CAM.player); V.cg = Object.assign({}, CAM.player);
    V.post = post; V.quiet = 0;
    V.dyn = /[?&]dynres=0/.test(location.search) ? null : { lvl: 0, sc: 1, slow: 0, fast: 0, best: 1e9, t0: 0, n: 0, s: 0, hold: [], wait: 20000, log: [],
      L: post ? (post.maxS > 4 ? [{ sc: 1, ms: 99 }, { sc: 1, ms: 4 }, { sc: .85, ms: 4 }, { sc: .75, ms: 4 }] : [{ sc: 1, ms: 99 }, { sc: .85, ms: 99 }, { sc: .75, ms: 99 }]) : [{ sc: 1 }, { sc: .85 }, { sc: .75 }] };
    // fold the static parts (no handler or animation reaches them through V) into a few merged meshes, then re-list the picks
    if (window.HELook) V.uvParts = window.HELook.worldUV(T, sc, function (m) { return m && ((m.map && m.map.userData.he) || (m.normalMap && m.normalMap.userData.he && !m.map)); });
    if (window.HELook && !/[?&]nomerge=1/.test(location.search)) { var keep = window.HELook.reach(V, ['picks', 'zones', 'rig', 'sc', 'cam', 'M', 'r', 'P', 'T']); zones.forEach(function (z) { keep.add(z); }); V.merged = window.HELook.mergeAll(T, rig, keep);
      listPicks(); }
    r.info.autoReset = false;
    V.buildMs = Math.round(performance.now() - bt0); V.texMs = V_TEXMS; V.ready = false; V.t0 = bt0; V.tx = tx;
    V.hiQ = hiQ; V.halfQ = halfQ; V.nTex = nTex; V.genMs = genMs; V.hiTotal = hiJobs.length; V.hiDone = 0; V.hiFail = hiFail; V.load = []; V.upMs = []; V.upLog = [];
    // warm-up, off the critical path: shaders compile in parallel (KHR_parallel_shader_compile, for the same render target as
    // play), then one draw with culling off puts every buffer and texture on the GPU; only then does the view start drawing
    // warm-up in short steps so no single task blocks the page for long: a dozen meshes at a time, compile their shaders
    // (compileAsync: with KHR_parallel_shader_compile the driver compiles off-thread) and then draw just those (culling
    // off) so first-draw work (driver shader finalising, buffer uploads, shadow programs) lands in its own task. Then take
    // the half-resolution textures from the workers, and one full frame through the play path.
    var warm = function () {
      var bw0 = performance.now(), ms = [], vis = [], fc = [], i = 0, B = 12; V.warmSteps = []; V.compile0 = bw0;
      size(); sc.traverse(function (o) { if (o.isMesh || o.isLine || o.isPoints) { ms.push(o); vis.push(o.visible); } if (o.frustumCulled) { fc.push(o); o.frustumCulled = false; } }); V.warmN = ms.length; V.warmB = B;
      var tgt = function () { r.setRenderTarget(post ? post.rt : null); };
      // every object, hidden ones included (whatever a strike or a drip shows later), so nothing compiles on first use:
      // hidden groups are opened for the warm-up and closed again after it
      var gs = [], gv = []; sc.traverse(function (o) { if (!o.isMesh && !o.isLine && !o.isPoints && !o.isLight && !o.isCamera && o !== sc) { gs.push(o); gv.push(o.visible); } });
      var openG = function (on) { gs.forEach(function (o, j) { o.visible = on ? true : gv[j]; }); };
      var step = function () {
        if (i >= ms.length) { ms.forEach(function (o, j) { o.visible = vis[j]; }); openG(false); V.compileMs = Math.round(performance.now() - bw0); return post && post.compileAsync ? post.compileAsync().then(waitHalf) : waitHalf(); }
        // then draw a dozen at a time (buffer and texture uploads, shadow programs, driver finalising), each in its own task
        openG(true); ms.forEach(function (o, j) { o.visible = j >= i && j < i + B; });
        var go = function () { var s0 = performance.now(); openG(true); ms.forEach(function (o, j) { o.visible = j >= i && j < i + B; }); try { tgt(); r.render(sc, cam); } catch (e) { } r.setRenderTarget(null); i += B; V.warmSteps.push(Math.round(performance.now() - s0)); setTimeout(step, 0); };
        // no parallel compile: each batch compiles its own shaders first, as before, so no single task blocks for long
        var cp = null; if (!PAR) { try { tgt(); cp = r.compileAsync ? r.compileAsync(sc, cam) : null; } catch (e) { cp = null; } r.setRenderTarget(null); }
        if (cp) cp.then(go, go); else go();
      };
      // first, every shader at once: with KHR_parallel_shader_compile (Chrome on D3D11, Metal, most GL) the driver compiles
      // them all in parallel off the main thread; without it each batch below compiles its own, as before
      var PAR = !!(r.compileAsync && (r.getContext().getExtension('KHR_parallel_shader_compile') || /[?&]warmall=1/.test(location.search)));
      var all0 = function () {
        if (!PAR) return step();
        openG(true); ms.forEach(function (o) { o.visible = true; });
        var cp = null; try { tgt(); cp = r.compileAsync ? r.compileAsync(sc, cam) : null; } catch (e) { cp = null; } r.setRenderTarget(null);
        var done = function () { V.compileAllMs = Math.round(performance.now() - bw0); step(); };
        if (cp) cp.then(done, done); else step();
      };
      var waitT0 = 0, waitHalf = function () {
        if (!waitT0) waitT0 = performance.now();
        if (V.halfQ.length < V.nTex) {
          if ((V.hiFail || performance.now() - waitT0 > 8000) && !V.mainDec) { V.mainDec = 1; V.halfQ.length = 0; mainDec(); }
          if (performance.now() - waitT0 < 20000) return setTimeout(waitHalf, 8);
        }
        V.halfWaitMs = Math.round(performance.now() - waitT0);
        V.halfQ.splice(0).forEach(function (d) { if (d) swapTex(d.key, texSet(T, d.key, d)); });
        setTimeout(function () { var s0 = performance.now(); try { if (post) post.render(sc, cam, 0); else r.render(sc, cam); } catch (e) { }
          fc.forEach(function (o) { o.frustumCulled = true; }); r.setRenderTarget(null); V.warmSteps.push(Math.round(performance.now() - s0));
          V.warmMs = Math.round(performance.now() - bw0); V.readyMs = Math.round(performance.now() - bt0); V.ready = true; if (r.shadowMap.enabled && !/[?&]shcache=0/.test(location.search)) V.shc = shadowCache(); }, 0);
      };
      all0();
    };
    setTimeout(warm, 0);
    // first visit: switch on the couplings V2 is built around (knock to spring, sympathetic string, water in the tray)
    if (LS('v2init') !== '1') { LS('v2init', '1'); [['body.spring', .45], ['ebow.sym', .4], ['water.level', .45], ['glass.fill', .25], ['body.amt', Math.max(.35, H.P['body.amt'])]].forEach(function (q) { H.setParam(q[0], q[1]); }); }
    tools(); events(); size(); if (window.ResizeObserver) new ResizeObserver(size).observe(host);
    return true;
  }
  // a superball can reach only its own surfaces: the left one the sheet, the rods and the left of the box; the right one the drum and the right
  function wandSurf(w, z, pt) {
    var u = z.userData, sf = -1;
    if (u.part === 'sheet') sf = 2; else if (u.part === 'drum') sf = 1; else if (u.part === 'rods') sf = 3; else if (u.part === 'wood') sf = 0;
    if (sf < 0 || !w.surf[sf]) return -1;
    if (sf === 0 && (w.side < 0 ? pt.x > .1 : pt.x < -.1)) return -1;
    if (pt.distanceTo(w.base) > w.reach) return -1;
    return sf;
  }

  // camera stations: target (model coordinates), yaw, pitch, distance; orbit stays inside the limits
  var CAM = {
    player: { tx: .80, ty: .20, tz: 1.08, az: -.18, el: .36, d: 2.55 },
    left: { tx: .30, ty: .12, tz: .98, az: -.5, el: .55, d: 1.55 },
    centre: { tx: .95, ty: .15, tz: .95, az: -.1, el: .6, d: 1.45 },
    right: { tx: 1.38, ty: .15, tz: .9, az: .38, el: .5, d: 1.5 },
    panel: { tx: .80, ty: .43, tz: 1.28, az: 0, el: .12, d: 1.2 }
  };
  var FOLLOW = { string: 'centre', puck: 'centre', bar: 'centre', crank: 'right', drones: 'right', rulers: 'left', clamp: 'left', rods: 'left', tray: 'left', saw: 'panel', slate: 'centre', bottle: 'centre', filltap: 'left', pane: 'centre', wine: 'centre', gtap: 'centre', drum: 'right', drawer: 'centre', junk: 'centre', spring: 'right', wandL: 'left', wandR: 'right', sheet: 'player', wood: 'player', knob: 'panel', send: 'panel', freeze: 'panel', loop: 'panel', piezo: 'player', coil: 'left', lamp: 'panel' };
  if (SK) { Object.assign(CAM, SK.CAM); Object.assign(FOLLOW, SK.FOLLOW); }
  function station(n) { if (!V || !CAM[n]) return; V.cg = Object.assign({}, CAM[n]); V.stn = n; }

  function tools() {
    var bar = document.createElement('div'); bar.className = 'mtools'; bar.setAttribute('role', 'toolbar'); bar.setAttribute('aria-label', 'Machine view');
    [['left', 'Left', 'F6'], ['centre', 'Middle', 'F7'], ['right', 'Right', 'F8'], ['panel', 'Panel', 'F9'], ['player', 'Whole', 'Home']].forEach(function (q) { var b = document.createElement('button'); b.className = 'btn sm'; b.textContent = q[1]; b.title = 'Camera: ' + q[1] + ' (' + q[2] + ')'; b.addEventListener('click', function () { station(q[0]); }); bar.appendChild(b); });
    var fo = document.createElement('button'); fo.className = 'btn sm'; fo.setAttribute('aria-pressed', V.follow ? 'true' : 'false'); fo.textContent = 'Follow'; fo.title = 'After you let go of a part, the camera eases to it (K)'; fo.addEventListener('click', function () { V.follow = !V.follow; fo.setAttribute('aria-pressed', V.follow ? 'true' : 'false'); LS('follow', V.follow ? '1' : '0'); if (!V.follow) station('player'); }); bar.appendChild(fo); V.foBtn = fo;
    var qb = document.createElement('button'); qb.className = 'btn sm qual'; qb.textContent = QUAL === 'low' ? 'Low detail' : 'High detail'; qb.title = 'Low detail: no shadows, lighter textures, lower resolution (reloads the view)'; qb.addEventListener('click', function () { LS('quality', QUAL === 'low' ? 'high' : 'low'); location.reload(); }); bar.appendChild(qb);
    if (window.HEAltar) { var sb = document.createElement('button'); sb.className = 'btn sm skin'; sb.textContent = SK ? 'Skin: Altar' : 'Skin: Workshop'; sb.title = 'Switch between the walnut workshop machine and the altar: the same instruments in other clothes (reloads the view)'; sb.addEventListener('click', function () { LS('skin', SK ? 'workshop' : 'altar'); var u = new URL(location.href); u.searchParams.delete('skin'); location.href = u.toString(); }); bar.appendChild(sb); }
    host.appendChild(bar);
  }
  function size() { if (!V) return; var w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    // pixel-ratio cap (drawing buffer at most ~4.2 MP on High) times the dynamic-resolution scale (1 unless the frame rate sags)
    var pr = Math.min(PR0, Math.sqrt(4.2e6 / (w * h))) * (V.dyn ? V.dyn.sc : 1); if (Math.abs(V.r.getPixelRatio() - pr) > 1e-3) V.r.setPixelRatio(pr);
    V.r.setSize(w, h, false); if (V.post) { var db = V.r.getDrawingBufferSize(new V.T.Vector2()); V.post.setSize(db.x, db.y); } V.cam.aspect = w / h; V.cam.fov = w / h < 1.2 ? 52 : 36; V.cam.updateProjectionMatrix(); }
  function cast(e) { var b = host.getBoundingClientRect(); V.nd.set((e.clientX - b.left) / b.width * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1); V.ray.setFromCamera(V.nd, V.cam); }
  // the part under the pointer: the nearest hit that is a zone or a part's mesh; anything else in front blocks it
  function hits(skipWands) {
    var hs = V.ray.intersectObjects(V.picks.concat(V.zones), false);
    for (var i = 0; i < hs.length; i++) {
      var o = hs[i].object, u = o.userData, z = V.zones.indexOf(o) >= 0 ? o : u.zone || null;
      if (z === V.woodT && hs[i].point.y < ZT - .012) z = V.woodF;   // the box's front face belongs to the front wood zone
      if (z && z.userData.off) continue;
      if (z && o === z && z.userData.clip && !z.userData.clip(hs[i].point)) continue;   // a zone plane whose real outline is not a rectangle
      if (skipWands && z && z.userData.kind === 'wand') continue;
      return z ? { object: z, point: hs[i].point } : null;
    }
    return null;
  }
  function pick() { return hits(false); }
  function locate(z, e) {
    var u = z.userData, c = function (v) { return Math.min(1, Math.max(0, v)); };
    z.updateMatrixWorld(); z.getWorldDirection(V.n); V.pl.setFromNormalAndCoplanarPoint(V.n, z.getWorldPosition(V.wq).clone());
    if (!V.ray.ray.intersectPlane(V.pl, V.pt)) return null;
    var w = V.pt.clone(), l = z.worldToLocal(V.pt.clone());
    return { x: c(l.x / u.w + .5), y: c(l.y / u.h + .5), w: w };
  }
  function apply(set, e) { if (!set) return; if (typeof set === 'function') set = set(H.P, e); for (var k in set) if (H.P[k] !== set[k]) H.setParam(k, set[k]); }
  function G(s, k, x, y, p, hz) { H.send(k === 'u' ? { t: 'g', s: s, k: 'u' } : { t: 'g', s: s, k: k, x: x, y: y, p: p, hz: hz || 0 }); }
  function clampP(id, v) { var d = PDEF[id]; v = Math.min(d.max, Math.max(d.min, v)); return d.int ? Math.round(v) : v; }

  /* ---------- handlers, one per kind of part ---------- */
  var HD = {
    play: {
      down: function (A, e) {
        var u = A.u; if (u.restore) { A.rs = {}; u.restore.forEach(function (k) { A.rs[k] = H.P[k]; }); }
        apply(u.set, e);
        if (u.part === 'string') H.setParam('ebow.excite', e.shiftKey ? 2 : 1);
        if (u.part === 'junk') { var qj = locate(A.z, e); if (qj) H.setParam('junk.mat', qj.x < .333 ? 0 : qj.x < .667 ? 2 : 1); }
        if (u.part === 'spring') { A.sm = e.altKey ? 3 : 0; H.setParam('spring.mode', A.sm); }
        H.select(u.src); var q = locate(A.z, e); if (!q) return false; A.q = q;
        G(u.src, 'd', q.x, q.y, H.pressure(e)); V.mark.position.copy(q.w); V.mark.visible = true;
      },
      move: function (A, e) {
        var q = locate(A.z, e); if (!q) return; A.q = q; V.mark.position.copy(q.w);
        if (A.u.part === 'spring' && A.sm === 0 && A.dist > 10) { var up = Math.abs(e.clientY - A.sy) > Math.abs(e.clientX - A.sx); A.sm = (A.u.vert ? !up : up) ? 1 : 2; H.setParam('spring.mode', A.sm); }   // across the coil shakes it, along it scrapes (vert: a coil that hangs)
        G(A.u.src, 'm', q.x, q.y, H.pressure(e));
      },
      up: function (A) { G(A.u.src, 'u'); if (A.rs) for (var k in A.rs) H.setParam(k, A.rs[k]); if (A.sm === 1 || A.sm === 2) H.setParam('spring.mode', 0); }
    },
    // the E-bow puck rides the string: x along it, the distance across it is the harmonic placement
    puck: {
      harm: function (q) { var h = q.y < .25 ? 0 : q.y < .5 ? 1 : q.y < .75 ? 2 : 3; if ((H.P['ebow.harm'] | 0) !== h) H.setParam('ebow.harm', h); },
      down: function (A, e) { H.setParam('ebow.excite', 0); H.select(0); var q = locate(V.strZ, e); if (!q) return false; A.q = q; this.harm(q); G(0, 'd', q.x, q.y, H.pressure(e)); },
      move: function (A, e) { var q = locate(V.strZ, e); if (!q) return; A.q = q; this.harm(q); G(0, 'm', q.x, q.y, H.pressure(e)); },
      up: function () { G(0, 'u'); }
    },
    bar: {
      down: function (A, e) { if ((H.P['ebow.excite'] | 0) === 0) H.setParam('ebow.excite', 1); H.select(0); var q = locate(V.strZ, e); if (!q) return false; A.q = q; G(0, 'd', q.x, .5, .2); },
      move: function (A, e) { var q = locate(V.strZ, e); if (!q) return; A.q = q; G(0, 'm', q.x, .5, .2); },
      up: function () { G(0, 'u'); }
    },
    // bow it by stroking across, or tap it: a quick press without travel strikes or plucks it instead
    bowtap: {
      item: function (A, q) { var its = A.u.items(), b = its[0], bd = 9; its.forEach(function (it) { var d = Math.abs(it.u - q.x); if (d < bd) { bd = d; b = it; } }); return b; },
      // the bow's travel: on the rods x picks the rod, so the stroke across it is carried in y
      by: function (A, q) { return A.it.xr !== undefined ? Math.min(1, Math.max(0, .5 + (q.x - A.it.u) * 2)) : q.y; },
      down: function (A, e) {
        var q = locate(A.z, e); if (!q) return false; A.q = q; A.it = this.item(A, q); apply(A.it.bow); H.select(2); A.tv0 = V.tilt;
        G(2, 'd', A.it.xr !== undefined ? A.it.xr : q.x, this.by(A, q), H.pressure(e)); V.mark.position.copy(q.w); V.mark.visible = true;
      },
      move: function (A, e) {
        var q = locate(A.z, e); if (!q) return; A.q = q; V.mark.position.copy(q.w); var it = this.item(A, q);
        if (it !== A.it) { A.it = it; apply(it.bow); }
        G(2, 'm', A.it.xr !== undefined ? A.it.xr : q.x, this.by(A, q), H.pressure(e));
        if (A.u.part === 'rods') { V.rods.forEach(function (r) { if (Math.abs(r.xr - A.it.xr) < .05) r.sw = Math.max(r.sw, .25); });
          // pushing up or down while bowing rocks the tray under the rods
          if (Math.abs(e.clientY - A.sy) > 14) { V.tiltHeld = true; A.rock = true; V.tiltGoal = Math.min(1, Math.max(-1, A.tv0 + (e.clientY - A.sy - 14 * Math.sign(e.clientY - A.sy)) / 70)); } }
        if (A.u.part === 'saw') A.bend = q.y;
      },
      up: function (A, e) {
        G(2, 'u'); if (A.rock) { V.tiltHeld = false; V.tiltKeep = !!e.shiftKey; }
        if (performance.now() - A.t0 < 400 && A.dist < 8) {
          apply(A.it.tap); H.select(4); var x = A.it.xr !== undefined ? A.it.xr : .5;
          G(4, 'd', x, .5, Math.max(.5, H.pressure(e)), A.it.hz || 0); setTimeout(function () { G(4, 'u'); }, 60);
          if (A.u.part === 'rods') V.rods.forEach(function (r) { if (Math.abs(r.xr - x) < .05) r.sw = .6; });
        }
      }
    },
    // a knuckle on the wood, the drumhead or the sheet
    knock: {
      down: function (A, e) { var q = locate(A.z, e) || { x: .5, y: .5, w: A.hit }; A.q = q; H.setParam('struck.object', A.u.obj); H.select(4); G(4, 'd', q.x, .5, Math.max(.45, H.pressure(e)), A.u.hz * (A.u.part === 'wood' ? .8 + .5 * q.x : 1)); V.mark.position.copy(q.w); V.mark.visible = true; },
      move: function () { }, up: function () { G(4, 'u'); }
    },
    // the thunder sheet, mouse only: a click strikes it; press and drag across it to rub it into a moan (the superball's
    // stick-slip voice on the metal sheet). Rub speed drives loudness and pitch in the engine; pressure is the usual
    // pointer pressure (pen/touch, or the wheel while held). A press that starts moving within 60 ms is a pure rub; one
    // that rests longer strikes first, and can still be dragged into a rub after it.
    sheet: {
      strike: function (A, e) { if (A.struck) return; A.struck = true; var q = A.q; H.setParam('struck.object', A.u.obj); H.select(4); G(4, 'd', q.x, .5, Math.max(.45, A.p), A.u.hz); setTimeout(function () { G(4, 'u'); }, 60); },
      down: function (A, e) {
        var q = locate(A.z, e) || { x: .5, y: .5, w: A.hit }, self = this; A.q = q; A.p = H.pressure(e); A.rub = false; A.struck = false;
        V.mark.position.copy(q.w); V.mark.visible = true;
        A.tap = setTimeout(function () { requestAnimationFrame(function () { if (V.act === A && !A.rub && A.dist < 5) self.strike(A, e); }); }, 60);   // (after a frame, so a drag queued behind a slow frame wins)
      },
      move: function (A, e) {
        var q = locate(A.z, e); if (!q) return; A.q = q; V.mark.position.copy(q.w); A.p = H.pressure(e);
        if (!A.rub) { if (A.dist < 5) return; A.rub = true; clearTimeout(A.tap); if ((H.P['moan.surface'] | 0) !== 2) H.setParam('moan.surface', 2); H.select(8); G(8, 'd', q.x, q.y, A.p); return; }
        G(8, 'm', q.x, q.y, A.p);
      },
      up: function (A, e) { clearTimeout(A.tap); if (A.rub) G(8, 'u'); else this.strike(A, e); }
    },
    // drag a value up and down (knobs, the clamp, the tray tap, the rocker); A.v0 is the value on press
    knob: { down: function (A) { A.p = A.u.param; A.v0 = H.P[A.p]; }, move: function (A, e) { var d = PDEF[A.p]; H.setParam(A.p, clampP(A.p, A.v0 + (A.sy - e.clientY) / 200 * (d.max - d.min) * (e.shiftKey ? .2 : 1))); }, up: function () { } },
    send: { down: function (A) { A.p = window.HE_SOURCES[H.live().sel] + '.hsend'; A.v0 = H.P[A.p] || 0; }, move: function (A, e) { H.setParam(A.p, Math.min(1, Math.max(0, A.v0 + (e.clientX - A.sx) / 220))); }, up: function () { } },
    clamp: { down: function (A) { A.v0 = V.clampL; }, move: function (A, e) { V.clampL = Math.min(30, Math.max(12, A.v0 + (e.clientY - A.sy) / 10)); var L = Math.round(V.clampL * 10) / 10; H.setParam('bowed.length', L); H.setParam('struck.length', L); }, up: function () { } },
    filltap: { down: function (A) { A.v0 = H.P['water.level']; }, move: function (A, e) { H.setParam('water.level', Math.round(Math.min(1, Math.max(0, A.v0 + (A.sy - e.clientY) / 150)) * 100) / 100); }, up: function () { } },
    tray: {
      down: function (A, e) { var q = locate(A.z, e) || { x: .5, y: .5 }; A.side = q.x < .5 ? -1 : 1; A.v0 = V.tilt; V.tiltHeld = true; },
      move: function (A, e) { V.tiltGoal = Math.min(1, Math.max(-1, A.v0 + ((e.clientY - A.sy) * A.side + (e.clientX - A.sx) * .5) / 70)); },
      up: function (A, e) { V.tiltHeld = false; V.tiltKeep = !!e.shiftKey; }
    },
    lever: { down: function (A) { A.v0 = H.P['water.tilt']; V.tiltBack = false; }, move: function (A, e) { H.setParam('water.tilt', Math.round(Math.min(1, Math.max(-1, A.v0 + (A.sy - e.clientY) / 90)) * 100) / 100); }, up: function (A, e) { V.tiltBack = !e.shiftKey; } },
    drawer: { down: function (A) { A.v0 = V.open; }, move: function (A, e) { V.open = Math.min(1, Math.max(0, A.v0 + (e.clientY - A.sy) / 120)); H.setParam('junk.tray', Math.round(V.open * 100) / 100); }, up: function () { } },
    hold: { down: function (A, e) { V.holdRun = e.shiftKey ? -1 : 1; }, move: function () { }, up: function () { V.holdRun = null; } },
    button: {
      down: function (A) {
        var p = A.u.part;
        if (p === 'freeze') H.setParam('aura.freeze', H.P['aura.freeze'] > .5 ? 0 : 1);
        else if (p === 'loop') $('loopRec').click();
        else if (p === 'piezo') { var cur = H.P['body.piezo'], nx = cur < .2 ? .4 : cur < .6 ? .8 : 0; H.setParam('body.piezo', nx); H.toast('Piezo ' + Math.round(nx * 100) + '%'); }
      }, move: function () { }, up: function () { }
    },
    // the superball: lift the ball off its wand and drag it onto a surface it can reach; the surface picks the voice
    wand: {
      down: function (A, e) { A.w = V.wands.filter(function (w) { return w.zone === A.z; })[0]; A.sf = -1; A.on = false; this.move(A, e); },
      move: function (A, e) {
        var w = A.w, got = hits(true), sf = got ? wandSurf(w, got.object, got.point) : -1, p = H.pressure(e);
        if (sf >= 0) {
          var z = got.object, q = locate(z, e) || { x: .5, y: .5 }, n = new V.T.Vector3(); z.getWorldDirection(n); if (n.dot(V.cam.position.clone().sub(got.point)) < 0) n.negate();
          w.goal.copy(got.point).addScaledVector(n, .022);
          var x = sf === 3 ? Math.min(1, Math.max(0, (got.point.x + .8 - .08) / .36)) : q.x;
          if (sf !== A.sf) { if (A.on) G(8, 'u'); H.setParam('moan.surface', sf); H.select(8); G(8, 'd', x, q.y, p); A.on = true; A.sf = sf; }
          else G(8, 'm', x, q.y, p);
        } else {
          if (A.on) { G(8, 'u'); A.on = false; A.sf = -1; }
          // out of reach (or over something it cannot play): the ball hangs in the air under the pointer, silent
          V.pl.setFromNormalAndCoplanarPoint(V.cam.getWorldDirection(new V.T.Vector3()).negate(), w.pos.clone()); var pt = new V.T.Vector3();
          if (V.ray.ray.intersectPlane(V.pl, pt)) { var d = pt.clone().sub(w.base); if (d.length() > w.reach) d.setLength(w.reach); w.goal.copy(w.base).add(d); }
        }
      },
      up: function (A) { if (A.on) G(8, 'u'); A.w.goal.copy(A.w.rest); }
    }
  };
  function events() {
    var el = V.r.domElement, T = V.T;
    V.mark = new T.Mesh(new T.OctahedronGeometry(.012), new T.MeshBasicMaterial({ color: 0xd8c28a })); V.mark.visible = false; V.sc.add(V.mark);
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault(); cast(e); var hit = pick(); V.idle = 0;
      try { el.setPointerCapture(e.pointerId); } catch (x) { }
      if (!hit || e.button === 2) { V.orbit = { x: e.clientX, y: e.clientY, id: e.pointerId }; return; }
      var z = hit.object, A = { z: z, u: z.userData, id: e.pointerId, sx: e.clientX, sy: e.clientY, t0: performance.now(), dist: 0, hit: hit.point, h: HD[z.userData.kind] };
      var go = function () { if (V.act) return; V.act = A; if (A.h.down(A, e) === false) V.act = null; };
      if (!H.live().started) H.start().then(go); else go();
    });
    el.addEventListener('pointermove', function (e) {
      if (V.orbit && e.pointerId === V.orbit.id) { var c = V.cg; c.az = Math.min(.61, Math.max(-.61, c.az - (e.clientX - V.orbit.x) * .005)); c.el = Math.min(.79, Math.max(.12, c.el + (e.clientY - V.orbit.y) * .004)); V.orbit.x = e.clientX; V.orbit.y = e.clientY; return; }
      var A = V.act;
      if (A && e.pointerId === A.id) { cast(e); A.dist = Math.max(A.dist, Math.hypot(e.clientX - A.sx, e.clientY - A.sy)); A.h.move(A, e); return; }
      // hover: a gaming mouse reports up to 1000 moves a second; the hover pick (a raycast through the whole machine,
      // the harp alone is 176k triangles) only needs doing once per displayed frame, for the latest position
      if (e.pointerType === 'mouse') { V.hovX = e.clientX; V.hovY = e.clientY; if (!V.hovQ) { V.hovQ = true; requestAnimationFrame(hover); } }
    });
    var hover = function () { V.hovQ = false; if (V.act || V.orbit) return; cast({ clientX: V.hovX, clientY: V.hovY }); var h = pick(); el.style.cursor = h ? 'pointer' : 'grab'; label(h ? h.object.userData : null); };
    var up = function (e) {
      if (V.orbit && e.pointerId === V.orbit.id) V.orbit = null;
      var A = V.act; if (A && e.pointerId === A.id) { V.act = null; A.h.up(A, e); V.mark.visible = false; if (V.follow && FOLLOW[A.u.part]) station(FOLLOW[A.u.part]); }
    };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
    el.addEventListener('wheel', function (e) { e.preventDefault(); if (V.act) { var np = H.nudgePr(-Math.sign(e.deltaY) * .05), A = V.act; if (A.rub && A.q) { A.p = np; G(8, 'm', A.q.x, A.q.y, np); } } else V.cg.d = Math.min(4.5, Math.max(1.0, V.cg.d * (1 + Math.sign(e.deltaY) * .08))); }, { passive: false });
    el.addEventListener('dblclick', function (e) { cast(e); var h = pick(); if (h && h.object.userData.part === 'lamp') H.setParam('aura.freeze', H.P['aura.freeze'] > .5 ? 0 : 1); });
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    document.addEventListener('keydown', function (e) {
      if (tab !== 'machine' || e.ctrlKey || e.metaKey || /^(INPUT|SELECT|TEXTAREA)$/.test((e.target && e.target.tagName) || '')) return;
      var m = { F6: 'left', F7: 'centre', F8: 'right', F9: 'panel', Home: 'player' }[e.key];
      if (m) { e.preventDefault(); station(m); return; }
      var k = e.key.toLowerCase();
      if (k === 'k' && V.foBtn) V.foBtn.click();
      else if (k === 'd' && !e.repeat) { V.demo = !V.demo; host.classList.toggle('demo', V.demo); station('player'); H.toast(V.demo ? 'Demo mode: hints hidden, slow drift (D to leave)' : 'Demo mode off'); }
    });
  }
  var lastLab = null;
  function label(ud) {
    if (V && V.act) ud = V.act.u;
    if (ud === lastLab && !(ud && ud.kind === 'knob')) return; lastLab = ud;
    var t = !ud ? '' : HINT[ud.part] || '';
    if (ud && ud.kind === 'knob') { var d = PDEF[ud.param], v = H.P[ud.param]; t = HINT.knob + ' ' + ud.lab + ': ' + (Math.round(v * 100) / 100) + (d.unit ? ' ' + d.unit : ''); }
    $('ml').textContent = t;
  }

  function lcd() {
    var P = H.P, sh = Math.round(P['harm.shift']), sel = H.live().sel, k = window.HE_SOURCES[sel], snd = Math.round((P[k + '.hsend'] || 0) * 100);
    var t = (sh > 0 ? '+' : '') + sh + 'st  ' + H.ROMAN[sel] + ' ' + snd + '%';
    if (t === V.lcdTxt) return; V.lcdTxt = t;
    var c = V.lcv.getContext('2d'), W2 = V.lcv.width, H2 = V.lcv.height; c.fillStyle = '#030605'; c.fillRect(0, 0, W2, H2);
    // a vacuum-fluorescent tube: a faint grid of unlit cells, the lit text in blue-green with its phosphor glow
    c.fillStyle = 'rgba(90,255,200,.045)'; for (var gx = 14; gx < W2 - 10; gx += 34) c.fillRect(gx, 22, 28, 84);
    c.font = '600 62px "DejaVu Sans Mono", "Courier New", monospace'; c.textBaseline = 'middle'; c.shadowColor = 'rgba(80,255,190,.9)'; c.shadowBlur = 16; c.fillStyle = '#a6ffe0'; c.fillText(t, 18, 66); c.shadowBlur = 4; c.fillStyle = '#e4fff4'; c.fillText(t, 18, 66); c.shadowBlur = 0;
    var gr = c.createLinearGradient(0, 0, 0, H2); gr.addColorStop(0, 'rgba(255,255,255,.05)'); gr.addColorStop(.5, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, W2, H2); V.lct.needsUpdate = true;
  }
  // the tray rocks on its gimbal: the hand pulls it toward the goal through a stiff spring; let go and it sways back
  function tiltStep(dt) {
    var P = H.P, k;
    if (!V.tiltHeld && !V.tiltKeep) V.tiltGoal = 0;
    if (V.tiltKeep && !V.tiltHeld) V.tiltGoal = V.tiltGoal === undefined ? V.tilt : V.tiltGoal;
    var kT = V.tiltHeld ? 260 : 38, cT = V.tiltHeld ? 30 : 2.6, steps = Math.ceil(dt / .004);
    for (k = 0; k < steps; k++) { var hh = dt / steps; V.tiltV += (kT * ((V.tiltGoal || 0) - V.tilt) - cT * V.tiltV) * hh; V.tilt += V.tiltV * hh;
      V.tiltLagV = (V.tiltLagV || 0) + (60 * (V.tilt - V.tiltLag) - 3 * V.tiltLagV) * hh; V.tiltLag += V.tiltLagV * hh; }
    V.tilt = Math.min(1, Math.max(-1, V.tilt)); if (!V.tiltHeld && !V.tiltKeep && Math.abs(V.tilt) < .002 && Math.abs(V.tiltV) < .01) { V.tilt = 0; V.tiltV = 0; }
    var tq = Math.round(V.tilt * 100) / 100; if (tq !== (P['water.tilt'] || 0)) H.setParam('water.tilt', tq, true);
  }
  function wandTube(w) {
    var T = V.T, a = w.base, b = w.pos, m = a.clone().lerp(b, .5); m.y += .06 + .16 * Math.max(0, 1 - a.distanceTo(b)); m.addScaledVector(w.vel, -.03);
    w.tube.geometry.dispose(); w.tube.geometry = new T.TubeGeometry(new T.QuadraticBezierCurve3(a, m, b), 20, .0035, 6);
  }

  function frame(now) {
    if (tab !== 'machine' || !V) return;
    // film mode (__he.filmFrame): no rAF loop; each call is one fixed-length frame driven by recorded engine telemetry
    var FM = V.film; if (FM && !FM.go) return;
    if (!FM) requestAnimationFrame(frame);
    var dt = FM ? FM.dt : Math.min(.05, (now - V.last) / 1000 || .016); V.last = now; V.t += dt;
    var t = V.t, L = FM ? FM.L : H.live(), P = H.P, lv = V.lv, i, k, TM = L.tm || {}, T = V.T, Pm = V.P, A = V.act;
    for (i = 0; i < 9; i++) lv[i] += (H.level(L.pk[i] || 0) - lv[i]) * .3;
    V.bodyLv += (H.level(TM.bp || 0) - V.bodyLv) * .3; V.harmLv += (H.level(TM.hp || 0) - V.harmLv) * .3;
    if (A) label(null);
    var still = RM && RM.matches, mo = still ? .25 : 1;
    // camera: ease toward the goal; demo mode drifts slowly until someone touches something
    V.idle += dt; if (V.demo && !A && !V.orbit) V.cg.az = CAM.player.az + Math.sin(V.idle * .05) * .25;
    var c = V.cs, g = V.cg, ee = FM ? 1 : 1 - Math.pow(.02, dt / .8); for (k in g) if (typeof g[k] === 'number') c[k] += (g[k] - c[k]) * ee;
    var tg = Pm(c.tx, c.ty, c.tz); V.cam.position.set(tg.x + Math.sin(c.az) * Math.cos(c.el) * c.d, tg.y + Math.sin(c.el) * c.d, tg.z + Math.cos(c.az) * Math.cos(c.el) * c.d); V.cam.lookAt(tg);
    if (V.skin) V.skin.frame({ dt: dt, t: t, L: L, P: P, lv: lv, TM: TM, A: A, mo: mo, still: still, FM: FM }); else {
    // ② the string sings with the e-bow and booms when struck (only the length behind the slide bar rings)
    var ex = P['ebow.excite'] | 0, sp = V.sp, a0 = lv[0] * .012 * mo, onS = A && (A.u.part === 'string' || A.u.part === 'bar' || A.u.part === 'puck') && A.q;
    if (ex && onS && A.u.part !== 'puck') V.barX = .11 + 1.38 * A.q.x;
    var bx = ex ? V.barX : 1.49;
    for (k = 0; k <= 60; k++) { var u = k / 60, xx = .11 + 1.38 * u, seg = xx > bx ? 0 : Math.sin(Math.PI * (xx - .11) / Math.max(.02, bx - .11)), p0 = Pm(xx, .40, ZT + .06); sp[k * 3] = p0.x; sp[k * 3 + 1] = p0.y + seg * a0 * Math.sin(t * 70 + u * 3); sp[k * 3 + 2] = p0.z + seg * a0 * .5 * Math.cos(t * 83); }
    V.string.upd();
    V.bar.position.copy(Pm(V.barX, .40, ZT + .07)); V.barZ.position.copy(Pm(V.barX, .40, ZT + .08));
    if (A && A.u.part === 'puck' && A.q) V.puck.position.copy(Pm(.11 + 1.38 * A.q.x, .40 + (A.q.y - .5) * .06, ZT + .045)); else V.puck.position.lerp(V.PUCK0, .2);
    var pe = ex ? 0 : lv[0]; V.pkG.color.setRGB(.16 + pe * .5, .3 + pe * .6, .28 + pe * .5); V.poleM.emissiveIntensity = lv[0] * .8;
    // ④ wheel and crank turn together; ⑤ the drones shiver
    V.wrot += dt * (lv[1] > .03 ? 1.5 + 9 * lv[1] : 0); V.wheel.rotation.x = -V.wrot; V.crank.rotation.x = -V.wrot;
    V.drones.forEach(function (d, j) { d.position.y = Math.sin(t * (90 + j * 13)) * lv[1] * .0025 * mo; });
    // ⑥ rulers: overhang from the clamp; they whip when played
    var rl = (P['bowed.object'] | 0) === 0 ? lv[2] : 0, sl4 = (P['struck.object'] | 0) === 0 ? lv[4] : 0;
    V.rulers.forEach(function (r, j) { var Lm = Math.max(6, V.clampL * V.RF[j]) / 100 + .06; r.userData.b.scale.z = Lm; r.userData.b.position.z = Lm / 2; r.rotation.x = Math.sin(t * (14 + j * 5)) * (rl + sl4) * .05 * mo; });
    // ⑦⑧ the tray tips on its gimbal; the water stays level, piles up at the low end and wets the rods there
    if (false) { var tb = (P['water.tilt'] || 0) * Math.pow(.02, dt); if (Math.abs(tb) < .01) { tb = 0; V.tiltBack = false; } H.setParam('water.tilt', Math.round(tb * 100) / 100, true); }
    tiltStep(dt);
    var tilt = V.tilt, lvl = P['water.level'] || 0;
    V.tray.rotation.z = -tilt * .12;
    V.vsl = Math.max(V.vsl * Math.pow(.01, dt / 1.5), Math.min(1, Math.abs(tilt - V.tilt0) / Math.max(dt, .001) * .35)); V.tilt0 = tilt;
    V.water.visible = lvl > .01; V.water.position.copy(Pm(.26, .17, ZT + .02 + lvl * .04)); V.water.rotation.y = (V.tiltLag - tilt) * .1 * mo;   // the surface lags the tray, then settles level
    var wa = V.wg.attributes.position, w0 = V.w0, sl = (V.vsl + (P['water.slosh'] || 0) * .3) * mo, wam = P['water.amt'] || 0;
    var wMove = V.water.visible && (sl + wam > 1e-5 || V.wDirty); V.wDirty = V.water.visible && sl + wam > 1e-5;
    if (wMove) for (k = 0; k < w0.length; k += 3) { var wx = w0[k]; wa.array[k + 2] = Math.sin(wx * 40 - t * 6) * sl * .006 + Math.sin(w0[k + 1] * 50 + t * 4.3) * sl * .004 + wam * .0015 * Math.sin(t * 2 + wx * 20) + tilt * wx * .02 * 0; }
    if (wMove) { wa.needsUpdate = true; V.water.geometry.computeVertexNormals(); }
    var bw = (P['bowed.object'] | 0) === 1 ? lv[2] : 0, sw = (P['struck.object'] | 0) === 1 ? lv[4] : 0, mw = (P['moan.surface'] | 0) === 3 ? lv[8] : 0;
    V.rods.forEach(function (r) {
      // immersion as the engine computes it: the level plus the tilt times the rod's offset from the middle
      var d = Math.min(1, Math.max(0, lvl + .8 * tilt * (2 * r.xr - 1))), wet = lvl > .01 ? .004 + d * .045 : 0; r.wt.scale.y = Math.max(.001, wet); r.wt.position.y = wet / 2;
      r.sw *= Math.pow(.2, dt); r.g.rotation.x = Math.sin(t * (6 + r.xr * 9)) * (r.sw * .1 + (bw + sw + mw) * .02) * mo; r.g.rotation.z = Math.cos(t * (5 + r.xr * 7)) * (wam * .02 + V.vsl * .03) * mo;
    });
    // ⑨ pane shimmer; ⑩ the glass fills from its tap and the finger circles its rim
    if (V.holdRun) H.setParam('glass.fill', Math.round(Math.min(1, Math.max(0, (P['glass.fill'] || 0) + V.holdRun * dt * .35)) * 1000) / 1000, true);
    // the water: rebuilt to the inner wall at its level when the fill changes; the surface disc sits on it at the right radius
    var gf = P['glass.fill'] || 0, lvl = .095 + gf * .06, gp = V.wglass.position; V.wwat.visible = V.wsurf.visible = gf > .02;
    if (Math.abs(lvl - (V.wLvl || 0)) > .0004) { V.wLvl = lvl; V.wwat.geometry.dispose(); V.wwat.geometry = V.wwG(lvl); var wr = V.rIn(lvl) - .0002; V.wsurf.scale.set(wr, wr, 1); V.wsU.heR.value = 1; }
    V.wwat.position.copy(gp); V.wsurf.position.set(gp.x, gp.y + V.wLvl + .0001, gp.z); V.menis.visible = V.wsurf.visible; V.menis.position.set(gp.x, gp.y + V.wLvl + .0011, gp.z); var mr = V.rIn(V.wLvl + .0011) - .0017; V.menis.scale.set(mr, mr, .025);
    V.pane.position.x = .98 - .8 + Math.sin(t * 190) * lv[3] * .001 * mo;
    // rubbing the rim: the glint follows the pointer around it (screen-up on the zone is away from you on the rim, so the
    // angle's vertical part is negated: circling clockwise on screen runs the glint clockwise), or orbits on its own
    var fing = (P['glass.contact'] | 0) === 1, wAct = A && A.u.part === 'wine' && A.q, gOn = fing && (lv[3] > .08 || !!wAct);
    if (gOn) { if (wAct) { var na = Math.atan2(-(A.q.y - .5), A.q.x - .5), dA = na - (V.fang || 0); dA -= TAU * Math.round(dA / TAU); V.fdir = dA !== 0 ? (dA > 0 ? 1 : -1) : (V.fdir || 1); V.fang = (V.fang || 0) + dA; } else V.fang = (V.fang || 0) + (V.fdir || 1) * dt * TAU * (4 + 4 * Math.min(1, lv[3] * 1.2)) / 6 * mo; }
    var gI = gOn ? Math.min(1, .35 + lv[3] * 2.5 + (wAct ? .3 : 0)) : 0; V.gI = (V.gI || 0) + (gI - (V.gI || 0)) * Math.min(1, dt * 10);
    V.glint.visible = V.trail.visible = V.gI > .02;
    if (V.glint.visible) { var fa = V.fang; V.glint.position.set(gp.x + Math.cos(fa) * .0432, gp.y + .1699, gp.z + Math.sin(fa) * .0432); V.glint.material.opacity = V.gI; var gsz = .01 + .008 * V.gI; V.glint.scale.set(gsz, gsz, 1);
      // the arc trails behind the glint: torus arc from 0 to 1.3 rad in its own plane, turned so its bright end sits on the glint
      V.trail.position.set(gp.x, gp.y + .1699, gp.z); V.trailM.uniforms.op.value = V.gI * .8; V.trail.rotation.set(Math.PI / 2, 0, 0); if ((V.fdir || 1) > 0) { V.trail.scale.set(1, 1, 1); V.trail.rotation.z = fa - 1.3; } else { V.trail.scale.set(1, -1, 1); V.trail.rotation.z = fa + 1.3; } }
    V.wsU.heT.value = t; V.wsU.heP.value = V.fang || 0; V.wsU.heA.value = (V.wsU.heA.value || 0) + ((gOn ? .0006 + lv[3] * .004 : 0) - V.wsU.heA.value) * Math.min(1, dt * 4);
    // ⑪ the drumhead flexes under the ball
    V.head.position.y = .012 - ((P['moan.surface'] | 0) === 1 ? lv[8] * .002 * Math.sin(t * 60) : 0) * mo;
    // ⑫ the drawer slides out; the junk rides in it, the magnet arm swings over it
    V.drawer.position.z = V.open * .2; var jz = V.junkZ; jz.userData.off = V.open < .2; jz.scale.y = Math.max(.1, V.open); jz.position.copy(Pm(.98, -V.open * .1, ZB + .18));
    var J = L.junk, n = J ? Math.min(60, (J.length - 3) / 3) : Math.min(60, P['junk.count'] | 0), src = J || V.rest, dm = V.dummy;
    for (i = 0; i < 60; i++) { if (i < n) { var rr = src[i * 3 + 2] * .22; dm.position.copy(Pm(.87 + .22 * src[i * 3], .02 + .26 * src[i * 3 + 1], ZB + .057 + rr * .35)); dm.scale.set(rr * .5, rr * .5, rr * .5); dm.rotation.y = i * 1.7; } else dm.scale.set(0, 0, 0); dm.updateMatrix(); V.nuts.setMatrixAt(i, dm.matrix); if (i < n) { var bx2 = src[i * 3]; V.nuts.setColorAt(i, bx2 < .333 ? V.cSteel : bx2 < .667 ? (i % 2 ? V.cBrass : V.cSteel) : V.cBrass); } }
    V.nuts.instanceMatrix.needsUpdate = true; if (V.nuts.instanceColor) V.nuts.instanceColor.needsUpdate = true;
    var mOn = J && J[(J.length - 3) + 2] > .5, aimA = mOn ? .4 + V.open * .6 + (J[(J.length - 3)] - .5) * .8 : .2 + V.open * .7; V.arm.rotation.y += (aimA - V.arm.rotation.y) * .2;
    // ⑬ the springs jiggle, and each hit sends a drip down them (highs ahead, lows trailing)
    if (lv[5] - V.spPrev > .12) V.drips.push(0); V.spPrev = lv[5];
    for (i = V.drips.length - 1; i >= 0; i--) { V.drips[i] += dt; if (V.drips[i] > 1.4) V.drips.splice(i, 1); }
    for (i = 0; i < 2; i++) {
      var hm2 = V.springs[i], hp = hm2.geometry.attributes.position, ha = hp.array, p0 = hm2.p0, RG = hm2.rings, RV = hm2.rv, am = lv[5] * .008 * mo, moving = am > 1e-5 || V.drips.length;
      if (!moving && !hm2.dirty) continue; hm2.dirty = moving;
      for (k = 0; k < RG; k++) { var q = k / (RG - 1), wob = Math.sin(q * 30 - t * 34 + i * 2) * am * Math.sin(Math.PI * q), dz = 0;
        for (var j = 0; j < V.drips.length; j++) { var ag = V.drips[j], fr = ag / .35 % 2, pos = fr < 1 ? fr : 2 - fr, lag = q - pos, dec = Math.exp(-ag * 2.2); if (lag > -.25 && lag < .05) dz += Math.sin(lag * 90 * (1 + lag * 4)) * Math.exp(lag * 12) * .008 * dec * mo; }
        for (var v2 = 0; v2 < RV; v2++) { var o3 = (k * RV + v2) * 3; ha[o3] = p0[o3] + wob; ha[o3 + 1] = p0[o3 + 1] + wob + dz; } }
      hp.needsUpdate = true;
    }
    // ⑭ wands: the ball springs toward its goal (the pointer, a surface or home), the wand bends after it and shivers while it moans
    V.wands.forEach(function (w) {
      var act = A && A.w === w, f = w.goal.clone().sub(w.pos).multiplyScalar(act ? 400 : 120); w.vel.addScaledVector(f, dt).multiplyScalar(Math.pow(act ? 1e-5 : .002, dt)); w.pos.addScaledVector(w.vel, dt);
      if (act && A.on) w.pos.lerp(w.goal, .6);
      var shv = act && A.on ? lv[8] * .003 * mo : 0; w.ball.position.copy(w.pos); if (shv) w.ball.position.add(new T.Vector3(Math.sin(t * 61) * shv, Math.cos(t * 53) * shv, 0));
      w.zone.position.copy(w.ball.position); w.zone.lookAt(V.cam.position);
      if (!w.lp || w.pos.distanceTo(w.lp) > 1e-4 || shv) { wandTube(w); w.lp = w.pos.clone(); }
    });
    // ㉔ the saw: an S-bend that follows the hand (or the Bend knob), a shimmer while it sings
    var sAct = A && A.u.part === 'saw', sbT = sAct && A.bend !== undefined ? A.bend : P['bowed.bend'], sL = (P['bowed.object'] | 0) === 2 ? lv[2] : 0, sS = (P['struck.object'] | 0) === 2 ? lv[4] : 0;
    V.sawBend += ((sbT - .5) - V.sawBend) * .2;
    if (Math.abs(V.sawBend - (V.sawB0 || 0)) > 1e-4 || sL + sS > .01 || V.sawW) {
      var sga = V.sawG.attributes.position, sb = V.sawB; for (k = 0; k < sga.count; k++) { var sv2 = sb[k * 2 + 1]; sga.setZ(k, V.sawBend * .06 * Math.sin(TAU * sv2) * sv2 + (sL + sS) * .002 * Math.sin(t * 90 + sv2 * 20) * sv2 * mo); }
      sga.needsUpdate = true; V.sawG.computeVertexNormals(); V.sawB0 = V.sawBend; V.sawW = sL + sS > .01;
    }
    // ⑮ the thunder sheet wobbles when it moans or is struck
    var sa = V.sheet.geometry.attributes.position, s0 = V.sh0, swv = (((P['moan.surface'] | 0) === 2 ? lv[8] : 0) * .02 + ((P['struck.object'] | 0) === 2 ? lv[4] * .015 : 0)) * mo;
    if (swv > 1e-4 || V.shw) { for (k = 0; k < s0.length; k += 3) { var x2 = s0[k] / .88 + .5, y2 = s0[k + 1] / .56 + .5; sa.array[k + 2] = swv * (Math.sin(Math.PI * x2) * Math.sin(Math.PI * y2) * Math.sin(t * 9) + .5 * Math.sin(2 * Math.PI * x2) * Math.sin(2 * Math.PI * y2) * Math.sin(t * 14 + 1)); } sa.needsUpdate = true; V.sheet.geometry.computeVertexNormals(); V.shw = swv > 1e-4; }
    // ⑰ the panel: knobs show their values, the LCD the shift and the send, the LED the harmonizer return
    V.knobs.forEach(function (kq) { var d = PDEF[kq.p]; kq.g.rotation.z = -((P[kq.p] - d.min) / (d.max - d.min) - .5) * 4.4; });
    var sk = P[window.HE_SOURCES[L.sel] + '.hsend'] || 0; V.sendK.position.x = .66 + .0075 + sk * .265 - .8;
    lcd(); V.ledM.emissiveIntensity = .15 + V.harmLv * 2.5;
    V.frzM.emissiveIntensity = P['aura.freeze'] > .5 ? 2.6 : .45; V.loopM.emissiveIntensity = TM.rec ? 2.2 + .8 * Math.sin(t * 8) : .4;
    // ⑱ the meter needle, ① and ⑲ the glow of the body and its piezos, a tremble of the whole rig
    var bl = V.bodyLv;
    // the needle has mass and a damped spring (about 0.3 s to settle, a slight overshoot), pinned at the stops like a real movement
    var nT = 2.2 - Math.min(1.04, Math.max(0, bl)) * 4.4, ndt = Math.min(dt, .05); V.ndV += ((nT - V.ndA) * 160 - V.ndV * 15) * ndt; V.ndA += V.ndV * ndt;
    if (V.ndA > 2.25) { V.ndA = 2.25; V.ndV = -V.ndV * .3; } else if (V.ndA < -2.38) { V.ndA = -2.38; V.ndV = -V.ndV * .3; } V.ndl.rotation.z = V.ndA; V.rayM.emissiveIntensity = bl * 1.4; V.piezo.forEach(function (m, j) { m.emissiveIntensity = bl * (1.2 - j * .15); });
    V.rig.position.set(Math.sin(t * 97) * bl * .0006 * mo, Math.sin(t * 89) * bl * .0004 * mo, 0);
    // ㉑ the coil quivers; ㉒ the lamp swells with the aura, and Dread dims and reddens the room
    V.coil.rotation.z = Math.sin(t * 40) * ((((P['bowed.object'] | 0) === 3 ? lv[2] : 0) + ((P['struck.object'] | 0) === 3 ? lv[4] : 0)) * .05 + lv[5] * .012) * mo;
    var D = P['macro.dread']; if (FM) V.flick = FM.flick; else { if (!still && D > .55 && Math.random() < (D - .5) * .12) V.flick = .45 + Math.random() * .4; V.flick += (1 - V.flick) * .12; }
    var glow = .4 + lv[7] * 3 + (TM.frz ? .8 : 0); V.bulbM.emissiveIntensity = glow * V.flick; V.lampL.intensity = glow * .9 * V.flick; V.lampL.color.setRGB(1, .62 - D * .3, .38 - D * .3);
    V.key.intensity = 4.5 * (1 - D * .45) * V.flick * (.92 + .3 * Math.min(1, lv[7] * 2)); V.key.color.setRGB(1, .85 - D * .3, .66 - D * .4); V.sc.fog.density = .1 + P['macro.distance'] * .12; V.hemi.intensity = .5 - D * .15; if (V.cone) V.cone.material.uniforms.op.value = .07 * V.key.intensity / 4.5;
    }
    if (V.mark.visible) V.mark.rotation.y = t * 3;
    // idle: nothing touched for 4 s, everything quiet and the camera settled: draw every other frame (the scene barely changes)
    var cmv = 0; for (k in g) if (typeof g[k] === 'number') cmv += Math.abs(g[k] - c[k]);
    if (!V.ready) return;   // shaders still compiling in the background (see build)
    var R = V.r;
    // the full-resolution textures arrive from the workers: one map goes to the GPU per frame, and a set is swapped in once
    // all three of its maps are there (same shader, so nothing recompiles)
    // paced: at most one map every third frame, and only after a frame that was on time, so the GPU never queues them up
    V.upGap = (V.upGap || 0) + 1;
    if (!V.hiCur && V.hiQ.length) { var hd = V.hiQ.shift(); V.hiCur = { key: hd.key, set: texSet(T, hd.key, hd), step: 0 }; }
    if (V.hiCur && (LD.on || (V.upGap >= 3 && (dt < .02 || V.upGap >= 20)))) { V.upGap = 0; var u0 = performance.now(), hc = V.hiCur; R.initTexture(hc.set[TEXP[hc.step]]); hc.step++;
      if (hc.step === 3) { swapTex(hc.key, hc.set); V.hiCur = null; V.hiDone++; if (V.hiDone === V.hiTotal) V.hiMs = Math.round(performance.now() - V.t0); }
      var um = +(performance.now() - u0).toFixed(2); V.upMs.push(um); V.upLog.push([hc.key, TEXP[hc.step - 1], hc.set.w + 'x' + hc.set.h, um]); }
    var busy = A || V.orbit || cmv > 1e-4 || V.live || V.drips.length || Math.abs(V.tiltV) > .001 || lvMax(lv) > .005 || V.bodyLv > .005 || V.flick < .995 || V.bench || V.hiCur || V.hiQ.length;
    V.quiet = busy ? 0 : V.quiet + dt;
    // idle (nothing touched for 4 s, everything quiet, camera settled): draw at most ~50 times a second; only candles and
    // slow drifts move then, and a 144 Hz laptop does not need to render them 144 times a second
    if (V.quiet > 4 && !FM && now - (V.lastDraw || 0) < 19) { V.dynGap = true; return; }
    if (FM && !FM.draw) return;
    var f0 = performance.now(), gq = V.gpuQ, q1 = null;
    if (gq) { while (gq.pend.length && gq.gl.getQueryParameter(gq.pend[0], gq.gl.QUERY_RESULT_AVAILABLE)) { var q0 = gq.pend.shift(); gq.res.push(gq.gl.getQueryParameter(q0, gq.gl.QUERY_RESULT) / 1e6); gq.free.push(q0); }
      if (gq.pend.length < 6) { q1 = gq.free.pop() || gq.gl.createQuery(); gq.gl.beginQuery(gq.ext.TIME_ELAPSED_EXT, q1); } }
    // world matrices once per frame, here (the renders below then skip it); the shadow maps are redrawn only when a
    // shadow caster or a shadow light actually moved (see shadowCache)
    V.sc.updateMatrixWorld(); if (V.shc) V.shc.tick(dt, FM);
    V.sc.matrixWorldAutoUpdate = false;
    R.info.reset(); if (V.post) V.post.render(V.sc, V.cam, t); else R.render(V.sc, V.cam);
    V.sc.matrixWorldAutoUpdate = true;
    if (!FM && !V.bench && !LD.on) dynRes(now, V.dynGap); V.dynGap = false; V.lastDraw = now;
    if (q1) { gq.gl.endQuery(gq.ext.TIME_ELAPSED_EXT); gq.pend.push(q1); }
    V.frames = (V.frames || 0) + 1; V.cpu = performance.now() - f0; V.ft = (V.ft || 0) * .9 + V.cpu * .1;
    // the load phase (first frames, texture swap-in) is kept apart so the bench can report it on its own
    if (V.lastR && !V.timing && V.load.length < 3000) V.load.push([+(now - V.lastR).toFixed(2), +((now - V.t0) / 1000).toFixed(2)]); V.lastR = now;
    if (V.bench) V.bench.tick(now);
  }

  var RM = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var TEXP = ['map', 'roughnessMap', 'normalMap'];
  /* ---------- the shadow maps, redrawn only when something in them changed ----------
     Every frame used to redraw both 2048 px shadow maps, i.e. the whole scene twice more. Most of it never moves, so each
     shadow light now keeps its map until a shadow caster moves, deforms, appears or disappears (then both maps are redrawn
     that same frame), or the light itself moves (the candle key light jitters a few mm: its map follows at up to 75 Hz).
     Casters marked userData.shSlow (the drifting eyes) refresh at up to 20 Hz. Everything is redrawn every 2 s regardless. */
  function shadowCache() {
    var lights = [], list = [], slowF = null, M = null, G = [], GS = null, VS = null, age = 0, first = true, T = 0, stats = { frames: 0, full: 0, light: 0, slow: 0 };
    V.sc.traverse(function (o) { if (o.isLight && o.castShadow && o.shadow) { o.shadow.autoUpdate = false; o.shadow.needsUpdate = true; lights.push({ l: o, m: new Float64Array(32), last: -1, pMove: false, pSlow: false }); } });
    if (!lights.length) return null;
    function collect() {
      list = []; V.sc.traverse(function (o) { if ((o.isMesh || o.isPoints) && o.castShadow) list.push(o); });
      M = new Float64Array(list.length * 16); G = new Array(list.length); GS = new Float64Array(list.length); VS = new Uint8Array(list.length); slowF = new Uint8Array(list.length);
      list.forEach(function (o, i) { for (var p = o; p; p = p.parent) if (p.userData && p.userData.shSlow) { slowF[i] = 1; break; } });
      age = 0;
    }
    function wvis(o) { for (; o; o = o.parent) if (!o.visible) return 0; return 1; }
    function cmp(a, off, e) { var ch = false; for (var k = 0; k < 16; k++) if (a[off + k] !== e[k]) { a[off + k] = e[k]; ch = true; } return ch; }
    // casters: a move under ~1 mm (or ~1e-4 in the rotation/scale part) is below a shadow texel, so it does not count; the
    // stored matrix only advances when a move counts, so slow drifts still add up and trigger. The rig's sub-millimetre
    // tremble with the sound no longer redraws both maps every frame; the 2 s full refresh stays as the backstop.
    function cmpTol(a, off, e) { for (var k = 0; k < 16; k++) { var d = a[off + k] - e[k]; if (d > (k > 11 ? 1e-3 : 1e-4) || d < (k > 11 ? -1e-3 : -1e-4)) { for (k = 0; k < 16; k++) a[off + k] = e[k]; return true; } } return false; }
    // a cheap fingerprint of what a geometry or an instance buffer holds right now (versions alone change every frame
    // for buffers that are rewritten with the same values, like the drawer's junk)
    function sig(o) {
      var g = o.geometry, s = g.attributes.position ? g.attributes.position.version : 0;
      if (o.isInstancedMesh) { var a = o.instanceMatrix.array, n = o.count * 16, h = 0; for (var k = 0; k < n; k += 1) h += a[k] * ((k % 13) + 1); s += h * 1e-3 + o.count; }
      return s;
    }
    collect();
    return { stats: stats, tick: function (dt, FM) {
      T += dt; age += dt; stats.frames++;
      var all = first || FM; if (age > 2) { collect(); all = true; } first = false;
      var fast = false, slow = false;
      for (var i = 0; i < list.length; i++) {
        var o = list[i], v = wvis(o), ch = v !== VS[i]; VS[i] = v;
        if (v) { if (cmpTol(M, i * 16, o.matrixWorld.elements)) ch = true; var g = o.geometry, sg = sig(o); if (G[i] !== g || GS[i] !== sg) { G[i] = g; GS[i] = sg; ch = true; } }
        if (ch) { if (slowF[i]) slow = true; else fast = true; }
      }
      for (var j = 0; j < lights.length; j++) {
        var L = lights[j], l = L.l, mv = cmp(L.m, 0, l.matrixWorld.elements); if (l.target && cmp(L.m, 16, l.target.matrixWorld.elements)) mv = true;
        if (mv) L.pMove = true; if (slow) L.pSlow = true;
        var since = T - L.last, upd = all || fast || (L.pSlow && since >= .05) || (L.pMove && since >= 1 / 75);
        if (upd) { l.shadow.needsUpdate = true; L.last = T; L.pMove = L.pSlow = false; if (all || fast) stats.full++; else if (mv) stats.light++; else stats.slow++; }
      }
    } };
  }
  // dynamic resolution: when back-to-back frames run slower than ~48 fps for 2 s, step down (High: 8x -> 4x MSAA first,
  // then 85 % and 75 % resolution); step back up once frames are at the display's pace again for 5 s. A level that just
  // failed is held off for 20 s, doubling each time, so it does not flip back and forth. ?dynres=0 turns it off.
  function dynRes(now, gap) {
    var D = V.dyn; if (!D) return;
    if (gap || !V.lastDraw || now - V.lastDraw > 200 || V.hiCur || V.hiQ.length || document.hidden) { D.t0 = now; D.n = 0; D.s = 0; return; }
    D.s += now - V.lastDraw; D.n++;
    if (now - D.t0 < 1000 || D.n < 10) return;
    var avg = D.s / D.n; D.t0 = now; D.n = 0; D.s = 0; D.avg = avg; if (avg < D.best) D.best = avg;
    if (avg > 21) { D.slow++; D.fast = 0; } else if (avg < Math.max(D.best * 1.12, 8.4)) { D.fast++; D.slow = 0; } else { D.slow = 0; D.fast = 0; }
    var to = D.lvl;
    if (D.slow >= 2 && D.lvl < D.L.length - 1) { to = D.lvl + 1; D.hold[D.lvl] = now + D.wait; D.wait = Math.min(D.wait * 2, 160000); }
    else if (D.fast >= 5 && D.lvl > 0 && now > (D.hold[D.lvl - 1] || 0)) to = D.lvl - 1;
    if (to === D.lvl) return;
    D.lvl = to; D.slow = D.fast = 0; D.best = 1e9; var c = D.L[to]; D.sc = c.sc; if (V.post) V.post.capS = c.ms; D.log.push([Math.round(now), to, +avg.toFixed(1)]); size();
  }
  function lvMax(a) { var m = 0; for (var i = 0; i < a.length; i++) if (a[i] > m) m = a[i]; return m; }
  // replace the quick textures (and any clone of them, keeping its own repeat) with the full set, then free the old ones
  function swapTex(key, set) {
    var old = V.tx[key], by = {}, gone = []; TEXP.forEach(function (nm) { by[old[nm].source.uuid] = set[nm]; });
    V.sc.traverse(function (o) { if (!o.material) return; (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) { TEXP.concat(['clearcoatRoughnessMap']).forEach(function (nm) { var t0 = m[nm]; if (!t0 || !by[t0.source.uuid]) return; var nt = by[t0.source.uuid];
      if (t0 !== old[nm]) { var c2 = nt.clone(); c2.repeat.copy(t0.repeat); c2.offset.copy(t0.offset); nt = c2; } m[nm] = nt; if (gone.indexOf(t0) < 0) gone.push(t0); }); }); });
    TEXP.forEach(function (nm) { if (gone.indexOf(old[nm]) < 0) gone.push(old[nm]); }); gone.forEach(function (t0) { t0.dispose(); }); V.tx[key] = set;
  }
  function whenCryptReady(fn) {
    if (!SK || (window.HE_CRYPT && window.HE_CRYPT.models)) { fn(); return; }
    if (window.__heCryptWait) { window.__heCryptWait.push(fn); return; }
    window.__heCryptWait = [fn];
    var s = document.createElement('script');
    s.src = 'assets/crypt_models.js';
    s.onload = s.onerror = function (ev) {
      var wait = window.__heCryptWait || []; window.__heCryptWait = null;
      if (ev && ev.type === 'error') console.warn('Horror Engine: Altar models did not load (assets/crypt_models.js).');
      wait.forEach(function (f) { f(); });
    };
    document.head.appendChild(s);
  }
  function show(which, quiet) {
    if (which === 'machine' && !V && SK && !(window.HE_CRYPT && window.HE_CRYPT.models)) { whenCryptReady(function () { show(which, quiet); }); return; }
    if (which === 'machine' && !V && !build()) { $('tabNote').textContent = window.THREE ? 'This browser could not start WebGL.' : 'The 3D view needs vendor/three.min.js next to index.html.'; which = 'surface'; LD.hide(); }
    if (which !== 'machine' && !V) LD.hide();
    tab = which; var m = which === 'machine';
    host.hidden = !m; padEl.hidden = m; ['hn', 'hp', 'hx', 'hy'].forEach(function (id) { $(id).hidden = m; });
    $('tabMachine').setAttribute('aria-selected', m ? 'true' : 'false'); $('tabSurface').setAttribute('aria-selected', m ? 'false' : 'true');
    document.body.classList.toggle('machine-on', m);
    H.machine(m); window.dispatchEvent(new Event('resize'));
    if (!quiet) LS('tab', which);
    if (m) { size(); V.last = performance.now(); requestAnimationFrame(frame); }
  }
  $('tabMachine').addEventListener('click', function () { show('machine'); });
  $('tabSurface').addEventListener('click', function () { show('surface'); });
  var want = LS('tab') || 'machine';
  // build after the loading screen has painted (one frame), so it is up while the scene is assembled
  if (want === 'machine' && window.THREE) requestAnimationFrame(function () { setTimeout(function () { if (tab !== 'machine') try { show('machine', true); } catch (e) { LD.fail('The machine could not be built: ' + e.message); } }, 0); });
  else if (want === 'machine') { LD.fail('The 3D view needs vendor/three.min.js next to index.html.'); show('surface', true); }
  else LD.hide();
  // for the browser tests: each zone's projected centre and whether the pointer there picks that zone
  window.__he.view = function () {
    var z = []; if (V) { var b = host.getBoundingClientRect(); V.zones.forEach(function (m, i) {
      var p = m.getWorldPosition(new V.T.Vector3()).project(V.cam), cx = b.left + (p.x + 1) / 2 * b.width, cy = b.top + (1 - p.y) / 2 * b.height;
      cast({ clientX: cx, clientY: cy }); var h = pick(); z.push([m.userData.src, cx, cy, m.userData.part + (m.userData.param ? ':' + m.userData.param : ''), h ? V.zones.indexOf(h.object) === i : false, !!m.userData.off]); }); }
    return { tab: tab, ok: !!V, v: 2, zones: z, frames: V ? V.frames : 0, ft: V ? V.ft : 0 };
  };
  window.__he.zpt = function (i, u, v) { var m = V.zones[i], ud = m.userData, b = host.getBoundingClientRect(), p = m.localToWorld(new V.T.Vector3((u - .5) * ud.w, (v - .5) * ud.h, 0)).project(V.cam); return [b.left + (p.x + 1) / 2 * b.width, b.top + (1 - p.y) / 2 * b.height]; };
  window.__he.audit = function () {
    if (!V) return null; var b = host.getBoundingClientRect(), out = [];
    V.zones.forEach(function (m) { var u = m.userData, own = 0, other = 0, tot = 0; if (u.off) return;
      for (var gx = -.4; gx <= .41; gx += .2) for (var gy = -.4; gy <= .41; gy += .2) { var p = m.localToWorld(new V.T.Vector3(gx * u.w, gy * u.h, 0)).project(V.cam); cast({ clientX: b.left + (p.x + 1) / 2 * b.width, clientY: b.top + (1 - p.y) / 2 * b.height }); var hh = pick(); tot++; if (hh && hh.object === m) own++; else if (hh && V.zones.indexOf(hh.object) >= 0) other++; }
      out.push({ part: u.part + (u.param ? ':' + u.param : ''), own: own, other: other, of: tot }); });
    return out;
  };
  // why a zone does not get picked: the first few things the ray meets at its centre
  window.__he.whyz = function (i, u, v) { var q = window.__he.zpt(i, u === undefined ? .5 : u, v === undefined ? .5 : v); cast({ clientX: q[0], clientY: q[1] }); return V.ray.intersectObjects(V.picks.concat(V.zones), false).slice(0, 4).map(function (h) { var o = h.object, z = V.zones.indexOf(o) >= 0 ? o : o.userData.zone; return (V.zones.indexOf(o) >= 0 ? 'zone ' : 'mesh ') + (z ? z.userData.part : 'untagged ' + o.geometry.type + ' ' + o.position.toArray().map(function (n) { return n.toFixed(2); })) + ' @' + h.distance.toFixed(3); }); };
  window.__he.wtest = function (wi, i, u, v) { var q = window.__he.zpt(i, u, v); cast({ clientX: q[0], clientY: q[1] }); var g = hits(true); return g ? [g.object.userData.part, wandSurf(V.wands[wi], g.object, g.point), g.point.distanceTo(V.wands[wi].base).toFixed(2)] : null; };
  window.__he.v2 = function () { return V; };
  // drawing, with the full-resolution textures in (or given up on): what screenshot harnesses wait for
  window.__he.ready = function () { return !!(V && V.ready && !V.hiCur && (V.hiDone >= V.hiTotal || V.hiFail)) && !LD.on; };
  window.__he.loader = function () { return LD.on; };
  // film mode for the offline intro video: f = { dt, L: {tm, pk, junk}, P: {param: value}, cam: {tx..d}, flick, draw }
  window.__he.filmFrame = function (f) {
    if (!V) return false; for (var k in f.P) H.P[k] = f.P[k];
    V.cg = Object.assign({}, f.cam); V.cs = Object.assign({}, f.cam); V.act = null; V.demo = false;
    V.film = { go: true, dt: f.dt, L: f.L, flick: f.flick, draw: !!f.draw }; frame(performance.now()); V.film.go = false; return true;
  };
  window.__he.cam = function (n) { station(n); if (V) V.cs = Object.assign({}, V.cg); };
  // ?bench=1: a scripted ten-second fly-through (whole view, then close-ups) that measures frame times, CPU and GPU time
  // per frame, draw calls and triangles; the result lands in window.__benchResult (the GPU test script reads it over CDP)
  var BCAM = { gauge: { tx: 1.35, ty: .0, tz: .77, az: .05, el: .06, d: .42 }, springs: { tx: 1.25, ty: .05, tz: .52, az: .5, el: .12, d: .7 }, tray: { tx: .3, ty: .18, tz: .96, az: -.35, el: .55, d: .75 } };
  window.__he.benchCam = function (n) { if (!V) return false; var c = BCAM[n] || CAM[n]; if (!c) return false; V.cg = Object.assign({}, c); V.cs = Object.assign({}, c); return true; };
  function bench() {
    if (!V) { window.__benchResult = { error: 'no 3D view' }; window.__benchDone = true; return; }
    ['wake', 'toast'].forEach(function (id) { var e = document.getElementById(id); if (e) e.hidden = true; });   // clean screenshots
    var gl = V.r.getContext(), dbg = gl.getExtension('WEBGL_debug_renderer_info'), ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
    var info = { renderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), vendor: dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR), quality: QUAL, post: !!V.post,
      viewport: [innerWidth, innerHeight], gpuTimer: !!ext, parallelCompile: !!gl.getExtension('KHR_parallel_shader_compile'), merged: V.merged || null };
    function st(a) { if (!a.length) return null; var b = a.slice().sort(function (x, y) { return x - y; }), s = 0; a.forEach(function (x) { s += x; }); return { avg: +(s / a.length).toFixed(3), p95: +b[Math.floor(b.length * .95)].toFixed(3), worst: +b[b.length - 1].toFixed(3), n: a.length }; }
    function worst(L, n) { return L.slice().sort(function (a, b) { return b[0] - a[0]; }).slice(0, n); }
    // 1) wait: audio running, shaders compiled, full textures swapped in, then one quiet second; this is the load phase
    var audio = false, tStart = performance.now(); setTimeout(function () { if (!audio) { audio = true; info.audio = 'did not start within 5 s'; } }, 5000);
    try { Promise.resolve(window.__he.start()).then(function () { ['drone', 'heart'].forEach(function (id) { window.__he.send({ t: 'moment', id: id, on: true }); }); audio = true; }, function () { audio = true; }); } catch (e) { audio = true; }
    var seq = [['player', 2.5], ['gauge', 1.6], ['springs', 1.6], ['tray', 1.4], ['panel', 1.4], ['player', 1.5]], gseq = [['player', 1.5], ['gauge', 1.5]];
    var phase = 'wait', settle = null, t0 = 0, si = -1, ft = [], cpu = [], all = [], calls = 0, tris = 0, prev = 0, perView = {}, longT = [];
    if (window.PerformanceObserver) try { new PerformanceObserver(function (l) { l.getEntries().forEach(function (e) { longT.push([Math.round(e.duration), +((e.startTime - V.t0) / 1000).toFixed(2), phase]); }); }).observe({ type: 'longtask', buffered: true }); } catch (e) { }
    V.bench = { tick: function (now) {
      if (phase === 'wait') {
        var done = V.ready && audio && (V.hiDone >= V.hiTotal || V.hiFail) && !V.hiCur && !LD.on;
        if (!done) { settle = null; if (now - tStart > 180000) return finish('gave up waiting for load'); return; }
        if (settle === null) settle = now; if (now - settle < 1000) return;
        phase = 'run'; V.timing = true; t0 = now; prev = now; info.waitMs = Math.round(now - tStart); return;
      }
      var el = (now - t0) / 1000, d = now - prev; prev = now;
      if (phase === 'run') {
        var tt = 0, k = 0; while (k < seq.length && el > tt + seq[k][1]) { tt += seq[k][1]; k++; }
        if (k >= seq.length) { phase = 'gpu'; t0 = now; si = -1; if (ext) V.gpuQ = { gl: gl, ext: ext, pend: [], free: [], res: [] }; gl.getParameter(ext ? ext.GPU_DISJOINT_EXT : gl.VENDOR); return; }
        if (k !== si) { si = k; V.cg = Object.assign({}, BCAM[seq[k][0]] || CAM[seq[k][0]]); }
        ft.push(d); all.push([+d.toFixed(2), seq[k][0], +el.toFixed(2)]); (perView[seq[k][0]] = perView[seq[k][0]] || []).push(d);
        cpu.push(V.cpu); calls = Math.max(calls, V.r.info.render.calls); tris = Math.max(tris, V.r.info.render.triangles);
        return;
      }
      // 2) a separate few seconds with GPU timer queries (never read back before they are ready, so they cannot stall)
      var tg = 0, kg = 0; while (kg < gseq.length && el > tg + gseq[kg][1]) { tg += gseq[kg][1]; kg++; }
      if (kg >= gseq.length) return finish();
      if (kg !== si) { si = kg; V.cg = Object.assign({}, BCAM[gseq[kg][0]] || CAM[gseq[kg][0]]); V.cs = Object.assign({}, V.cg); }
    } };
    function finish(err) {
      var gres = V.gpuQ ? V.gpuQ.res.slice(2) : [], disj = ext ? gl.getParameter(ext.GPU_DISJOINT_EXT) : false;
      V.bench = null; V.gpuQ = null; V.cg = Object.assign({}, CAM.player); var f = st(ft), pv = {}; Object.keys(perView).forEach(function (k) { pv[k] = st(perView[k]); });
      var L = V.load.map(function (x) { return x[0]; });
      window.__benchResult = Object.assign(info, { error: err || null, pixelRatio: V.r.getPixelRatio(), canvas: [V.r.domElement.width, V.r.domElement.height], canvasMpx: +(V.r.domElement.width * V.r.domElement.height / 1e6).toFixed(2),
        shadowMap: V.key.shadow.mapSize.x, msaa: V.post ? V.post.rt.samples : 0,
        frameMs: f, fps: f ? +(1000 / f.avg).toFixed(1) : 0, fpsP95: f ? +(1000 / f.p95).toFixed(1) : 0, cpuMs: st(cpu), gpuMs: disj ? null : st(gres), gpuDisjoint: !!disj, perView: pv, worstFrames: worst(all, 6),
        over16: ft.filter(function (x) { return x > 16.7; }).length, over33: ft.filter(function (x) { return x > 33.4; }).length, drawCalls: calls, triangles: tris, frames: ft.length,
        load: { buildMs: V.buildMs, texMs: V.texMs, compileMs: V.compileMs || null, warmMs: V.warmMs, readyMs: V.readyMs, hiTexMs: V.hiMs || null, hiTex: V.hiTotal ? V.hiDone + '/' + V.hiTotal : 'off', hiFail: V.hiFail || null,
          uploadMs: st(V.upMs), uploads: V.upLog.slice().sort(function (a, b) { return b[3] - a[3]; }).slice(0, 8), warmSteps: V.warmSteps || null, halfWaitMs: V.halfWaitMs, workerMs: V.genMs, frames: st(L), over50: L.filter(function (x) { return x > 50; }).length, worstFrames: worst(V.load, 6) },
        longTasks: worst(longT, 10), programs: (V.r.info.programs || []).length, geometries: V.r.info.memory.geometries, textures: V.r.info.memory.textures, ua: navigator.userAgent });
      window.__benchDone = true; document.title = 'BENCH DONE';
    }
  }
  if (/[?&]bench=1/.test(location.search)) { if (tab !== 'machine' && window.THREE) show('machine', true); setTimeout(bench, 300); }
})();
