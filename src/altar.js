/* The Altar: an alternate skin for the Machine. Same parts, same hit zones, same gestures and voices as machine2.js; every
   part is swapped for a grisly stand-in on a blood-soaked altar:
     strings -> a ribcage harp strung with gut        bowed rods -> rusted railroad spikes driven into a tray of blood
     wheel drone -> a wheel cranked through a skull   wine glass -> a cracked skull bowl of dark liquid
     drum -> a stitched hide drumhead                 thunder sheet -> an iron plate under a horned goat idol
     spring tank -> rusty coils across the front panel  junk drawer -> bones and teeth
     body -> sigils and a pentagram in the altar front (they glow with the body, and carry the FX controls)
   machine2.js calls build(ctx) in place of its own scene and frame(F) in place of its own animation; the zones it
   gets back are played by the same handlers. Everything is made in code (see sculpt.js). ?skin=altar
   Horror Engine (c) 2026 Garyck Arntzen (https://x.com/_mintydoge), MIT licence. */
window.HEAltar = (function () {
  'use strict';
  var S = window.HESculpt, TAU = Math.PI * 2;
  // a quantised mesh from the crypt asset pack (the CC0 scanned skull)
  function meshG(e) {
    var T = window.THREE, bin = atob(e.b), u8 = new Uint8Array(bin.length), i; for (i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    var nv = e.nv, o = nv * 6, qp = new Int16Array(u8.buffer, 0, nv * 3), qn = new Int8Array(u8.buffer, o, nv * 4); o += nv * 4; var qu = new Uint16Array(u8.slice(o, o + nv * 4).buffer); o += nv * 4;
    var qi = e.big ? new Uint32Array(u8.slice(o, o + e.ni * 4).buffer) : new Uint16Array(u8.slice(o, o + e.ni * 2).buffer);
    var pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = new Float32Array(nv * 2);
    for (i = 0; i < nv; i++) { for (var c = 0; c < 3; c++) { pos[i * 3 + c] = e.lo[c] + (qp[i * 3 + c] + 32767) / 65534 * (e.hi[c] - e.lo[c]); nor[i * 3 + c] = qn[i * 4 + c] / 127; } uv[i * 2] = qu[i * 2] / 65535; uv[i * 2 + 1] = qu[i * 2 + 1] / 65535; }
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('normal', new T.BufferAttribute(nor, 3)); g.setAttribute('uv', new T.BufferAttribute(uv, 2)); g.setIndex(new T.BufferAttribute(qi, 1)); g.computeBoundingSphere(); return g;
  }
  function img(b64, srgb) { var T = window.THREE, t = new T.TextureLoader().load('data:image/webp;base64,' + b64); if (srgb) t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t; }
  var HINT = {
    string: '② Ribcage harp · tap the gut to strike it (Shift: pluck), keep dragging to slide the note. Left is low, right is high.',
    puck: '② Lodestone · draw it across the gut and it sings without end. Low on the strings: fundamental, then 2nd, 3rd, and at the top it flips harmonics on its own; Shift drives harder.',
    bar: '㈳ Knuckle slide · drag it along the sinew after a strike to bend the boom.',
    crank: '④ The wheel · circle the crank that runs through the skull. Faster cranks harder; jerk it for the buzz.',
    drones: '⑤ Drone gut · drag along the strings while the wheel turns: the touch point picks the note.',
    rulers: '⑥ Rusted blades · stroke across a blade to bow it, tap to strike it. Each blade is its own note.',
    clamp: '⑥ Iron strap · drag toward you or away to slide all four blades (longer is lower).',
    rods: '⑧ Rail spikes · stroke across to bow, tap to strike. While bowing, push up or down to rock the tray: the blood runs to the low end and bends those spikes.',
    tray: '⑦ Blood tray · grab the rim and push one end down to rock it; let go and it sways back (Shift as you let go holds the tilt).',
    saw: '㉔ Bone saw · stroke across the blade to bow it, tap to strike it. Drag up or down while bowing to bend the blade and the note.',
    slate: '⑨ Grave slate · drag the shard of bone across it (Alt: a fingernail).',
    bottle: '⑩ Bottle · rub its shoulder with a wet finger (Alt: a nail).',
    filltap: '⑦ Tray spigot · drag up to fill the tray with blood, down to drain it.',
    pane: '⑨ Black mirror · drag a fingernail over it (Alt: bone).',
    wine: '⑩ Skull bowl · circle the rim with a wet finger. The fuller the bowl, the lower the note.',
    gtap: '⑩ Bowl tap · drag the handle, or hold it, to run blood into the bowl; Shift-hold to drain it.',
    drum: '⑪ Stitched hide · tap for a thump. Take the right-hand eye to make it moan.',
    drawer: '⑫ Ossuary drawer · pull the onyx knob toward you to open it.',
    junk: '⑫ The hand · drag over the drawer to stir it: teeth on the left, mixed in the middle, knucklebones on the right.',
    spring: '⑬ Rusty coils · on the front, right of the drawer. Tap for the drip, drag along a coil to scrape, drag across it to shake it (Alt: make it sing). Knocks on the altar set it off too.',
    wandL: '⑭ Left wand · pluck it from its socket and drag it over the iron plate, the bones or the left of the altar.',
    wandR: '⑭ Right wand · pluck it from its socket and drag it over the hide or the right of the altar.',
    sheet: '⑮ The iron plate · click to strike it; press and drag across it to rub it into a moan (faster is louder and higher). The left wand moans it too.',
    wood: '① The altar · knock on the wood. Everything stands on it, so it rings along.',
    knob: '⑰ Sigil dials · drag a bone dial up or down.',
    send: '⑰ Harmonizer send · drag sideways: how much of the selected voice goes into the harmonizer.',
    freeze: '⑰ Freeze · the pale eye pins the aura.',
    loop: '⑰ Loop · the red eye starts or closes a gesture loop (also Space).',
    piezo: '⑲ Wax seal · click to change the contact-mic character.',
    coil: '㉑ Iron serpent · stroke across the spiral to bow it, tap to strike it.',
    lamp: '㉒ The candle · rub the flame to swell the aura; double-click to freeze it.'
  };
  var CAM = {
    player: { tx: .81, ty: .20, tz: 1.04, az: -.16, el: .26, d: 2.95 },
    left: { tx: .26, ty: .14, tz: 1.02, az: -.42, el: .46, d: 1.6 },
    centre: { tx: .92, ty: .18, tz: 1.02, az: -.08, el: .5, d: 1.55 },
    right: { tx: 1.42, ty: .2, tz: 1.02, az: .36, el: .42, d: 1.6 },
    panel: { tx: .30, ty: 0, tz: .56, az: -.12, el: .12, d: 1.35 },
    springs: { tx: 1.38, ty: -.02, tz: .73, az: .04, el: .08, d: .7 }
  };
  var FOLLOW = { saw: 'left', lamp: 'left', sheet: 'centre', spring: 'springs', coil: 'right', knob: 'panel', send: 'panel', freeze: 'panel', loop: 'panel' };

  function build(c) {
    var T = c.T, P = c.P, rig = c.rig, sc = c.sc, low = c.low, tx = c.tx, ZT = c.ZT, H = c.H, zone = c.zone, tag = c.tag, r = c.r, PDEF = c.PDEF, i, k;
    var V3 = function (x, y, z) { return new T.Vector3(x, y, z); }, rnd = S.rng(41);
    var PHYS = ['clearcoat', 'clearcoatRoughness', 'sheen', 'sheenColor', 'sheenRoughness', 'ior', 'specularIntensity'];
    // a material (physical on High, standard on Low), with gore() on top when g is given
    function mat(o, g) { var m; if (low) { o = Object.assign({}, o); PHYS.forEach(function (q) { delete o[q]; }); m = new T.MeshStandardMaterial(o); } else m = new T.MeshPhysicalMaterial(o); return g ? S.gore(m, g) : m; }
    // one of the photo sets at its own scale (metres per repeat)
    function tiled(key, tile) { var o = {}; ['map', 'roughnessMap', 'normalMap'].forEach(function (q) { var t = tx[key][q].clone(); t.repeat.set(1 / tile, 1 / tile); t.needsUpdate = true; o[q] = t; }); return o; }
    // sculpted and hand-built meshes stay their own objects (they carry vertex colours the merger would drop)
    function add(g, m, par) { var o = new T.Mesh(g, m); o.castShadow = o.receiveShadow = true; o.userData.keep = 1; (par || rig).add(o); return o; }
    function ctex(cv, srgb) { var t = new T.CanvasTexture(cv); if (srgb) t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t; }
    function heUv(g, f) { var p = g.attributes.position, a = new Float32Array(p.count * 2); for (var q = 0; q < p.count; q++) { var uv = f(p.getX(q), p.getY(q), p.getZ(q)); a[q * 2] = uv[0]; a[q * 2 + 1] = uv[1]; } g.setAttribute('heUv', new T.BufferAttribute(a, 2)); return g; }
    var m4 = function (px, py, pz, rx, ry, rz, sx, sy, sz) { return S.mat4(T, px, py, pz, rx, ry, rz, sx, sy, sz); };

    /* ---------- the air: near-black, a red-brown haze, a heavier vignette and grain than the workshop ---------- */
    sc.background = new T.Color(0x090605); sc.fog = new T.FogExp2(0x170e0a, .2); r.toneMappingExposure = 1.2;
    if (c.post) { var pu = c.post.mComp.uniforms; pu.vig.value = .5; pu.grain.value = .022; pu.bloom.value = .18; }
    // what the wet and the metal see: a black crypt, the candles, a dull glow from above the player
    var es = new T.Scene(); es.background = new T.Color(0x050403);
    [[0x2a1c14, 1, 0, 1.6, -1.6, 8, 3.4, .1], [0x1a1410, 1, -3, 1.6, 0, .1, 3.4, 8], [0x1a1410, 1, 3, 1.6, 0, .1, 3.4, 8], [0x0c0a08, 1, 0, 3.3, 0, 8, .1, 8], [0x1c140e, 1, 0, -.05, 0, 8, .1, 8],
     [0xff9a50, 26, -.86, 1.13, .17, .07, .09, .07], [0xffa860, 14, -.55, 1.6, -1.35, .16, .1, .06], [0xffa860, 10, .93, 1.05, .1, .05, .06, .05], [0xd8c0a8, 1.6, -.9, 2.7, 2.4, 1.4, .1, 1.2], [0x5a6a90, 1.2, 2.2, 2.4, -1.4, .1, 1.2, 1.2]].forEach(function (p) { var m = new T.Mesh(new T.BoxGeometry(p[5], p[6], p[7]), new T.MeshBasicMaterial({ color: new T.Color(p[0]).multiplyScalar(p[1]) })); m.position.set(p[2], p[3], p[4]); es.add(m); });
    var pm = new T.PMREMGenerator(r); if (sc.environment) sc.environment.dispose(); sc.environment = pm.fromScene(es, .04).texture; pm.dispose(); es.traverse(function (o) { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });

    /* ---------- materials ---------- */
    var oakT = tiled('oak', 1.5), beamT = tiled('floor', 2.2);
    // knife-ruler map only: dull mid-grey steel with dark pitting and a few rust stains (saw keeps tx.steel)
    var bladeMap = (function () {
      var N = 1024, cv = document.createElement('canvas'); cv.width = N; cv.height = N;
      var g = cv.getContext('2d'), rng = S.rng(19), i, x, y, r, a, s, w;
      g.fillStyle = '#8d9094'; g.fillRect(0, 0, N, N);
      // faint lengthwise polish streaks
      for (i = 0; i < 180; i++) {
        y = rng() * N; w = 1 + rng() * 3; a = .04 + rng() * .1; s = (150 + rng() * 50) | 0;
        g.fillStyle = 'rgba(' + s + ',' + s + ',' + (s + 4) + ',' + a + ')';
        g.fillRect(0, y, N, w);
      }
      for (i = 0; i < 2200; i++) {
        x = rng() * N; y = rng() * N; r = .8 + rng() * 6; a = .22 + rng() * .55; s = (36 + rng() * 50) | 0;
        g.fillStyle = 'rgba(' + s + ',' + s + ',' + (s + 4) + ',' + a + ')';
        g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      }
      for (i = 0; i < 70; i++) {
        x = rng() * N; y = rng() * N; r = .8 + rng() * 4; a = .18 + rng() * .32;
        g.fillStyle = 'rgba(88,54,32,' + a + ')';
        g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      }
      var tex = ctex(cv, true);
      tex.wrapS = tex.wrapT = T.RepeatWrapping;
      if (tx.steel && tx.steel.map && tx.steel.map.repeat) tex.repeat.copy(tx.steel.map.repeat);
      else tex.repeat.set(4, 4);
      return tex;
    })();
    var M = {
      // the altar's timber: oak gone almost black, fibrous (a bump stretched along the grain), soaked and splashed
      wood: mat(Object.assign({ color: 0x8a6650, roughness: 1, vertexColors: true }, oakT), { blood: .34, bscale: 7, grime: .55, bump: .0009, grain: [22, 330, 330] }),
      beam: mat(Object.assign({ color: 0x7a6658, roughness: 1 }, beamT), { blood: .2, bscale: 5, grime: .6, bump: .0008, grain: [420, 30, 420] }),
      bone: mat({ color: 0xb09c78, roughness: .56, vertexColors: true, clearcoat: .22, clearcoatRoughness: .4 }, { blood: .2, bscale: 16, grime: .5, bump: .0003, bfreq: 190 }),
      boneWet: mat({ color: 0xa8926c, roughness: .5, vertexColors: true, clearcoat: .35, clearcoatRoughness: .3 }, { blood: .42, bscale: 12, grime: .5, bump: .0003, bfreq: 190, seed: 3 }),
      iron: mat({ map: tx.iron.map, roughnessMap: tx.iron.roughnessMap, normalMap: tx.iron.normalMap, color: 0x8a8480, roughness: 1, metalness: .85 }, { rust: .62, blood: .16, bscale: 9, grime: .4, bump: .0006, bfreq: 240 }),
      ironV: mat({ color: 0x4a4644, roughness: .7, metalness: .85, vertexColors: true }, { rust: .66, blood: .12, bscale: 14, grime: .4, bump: .0006, bfreq: 260 }),
      blade: mat({ map: bladeMap, roughnessMap: tx.steel.roughnessMap, normalMap: tx.steel.normalMap, color: 0x7e848a, roughness: .92, metalness: .2, envMapIntensity: .22, vertexColors: true, side: T.DoubleSide, clearcoat: 0 }, { rust: .08, blood: .02, bscale: 28, grime: .28, bump: .00055, bfreq: 480, seed: 4 }),
      flesh: mat({ color: 0xc03a30, roughness: .32, vertexColors: true, clearcoat: 1, clearcoatRoughness: .16, sheen: .6, sheenColor: new T.Color(0xff5040), sheenRoughness: .4 }, { blood: .55, bscale: 26, grime: .5, bump: .0006, bfreq: 240 }),
      hide: mat({ color: 0x70584a, roughness: .8, vertexColors: true, clearcoat: .12, clearcoatRoughness: .6, sheen: .5, sheenColor: new T.Color(0x6a4a34), sheenRoughness: .7 }, { blood: .3, bscale: 13, grime: .55, bump: .0016, grain: [650, 110, 650] }),
      horn: mat({ color: 0xb0a090, roughness: .42, vertexColors: true, clearcoat: .5, clearcoatRoughness: .3 }, { grime: .3, bump: .0004, bfreq: 300 }),
      wax: mat({ color: 0xc9b488, roughness: .46, vertexColors: true, clearcoat: .4, clearcoatRoughness: .35, sheen: .5, sheenColor: new T.Color(0xffd8a0) }, { grime: .16, bump: .00015, bfreq: 120 }),
      blood: mat({ color: 0x3a0406, roughness: .22, metalness: 0, clearcoat: .35, clearcoatRoughness: .28, envMapIntensity: .7 }),
      gutStr: new T.MeshStandardMaterial({ color: 0xc9a878, roughness: .5, metalness: 0, emissive: 0x402008, emissiveIntensity: .25 }),
      sinew: mat({ color: 0x7a3828, roughness: .5, vertexColors: true, clearcoat: .5, clearcoatRoughness: .3 }, { blood: .4, bscale: 30, grime: .4, bump: .0004, bfreq: 400 }),
      soot: new T.MeshStandardMaterial({ color: 0x0c0a09, roughness: .9 }),
      goatBone: mat({ color: 0x9a8864, roughness: .64, vertexColors: true, clearcoat: .16, clearcoatRoughness: .52 }, { blood: .3, bscale: 14, grime: .62, bump: .0004, bfreq: 180, seed: 3.2 }),
      goatHorn: mat({ color: 0x3a2c20, roughness: .52, vertexColors: true, clearcoat: .28, clearcoatRoughness: .5 }, { grime: .45, bump: .00055, bfreq: 140, blood: .06 })
    };
    var boneC = [.86, .8, .64], ironC = [.5, .47, .45];
    // the CC0 scanned skull (from the first altar skin): used on the wheel, in the niches and on the floor
    var skullG, skullM, cryptLights = [], eyeM;
    (function () {
      var A = window.HE_CRYPT, models = A && A.models || {}, sk = models.skull;
      if (sk) {
        skullG = meshG(sk);
        var maps = { roughness: 1 };
        if (sk.c) maps.map = img(sk.c, true);
        if (sk.r) maps.roughnessMap = img(sk.r);
        skullM = mat(Object.assign({ color: 0x8c806e, roughness: 1, clearcoat: .15, clearcoatRoughness: .5, sheen: .12, sheenColor: new T.Color(0xfff0d8) }, maps), { blood: .18, bscale: 11, grime: .35, bump: .0003, bfreq: 190, seed: 1.7 });
      } else { skullG = S.skull(T, { seed: 5 }); skullM = M.boneWet.clone(); }
      window.__heCryptPack = Object.assign(window.__heCryptPack || {}, { skull: !!sk });
    })();

    /* ---------- the crypt: stone walls and flags, no window; niches and pillars come after the candles exist ---------- */
    var room = new T.Group(); sc.add(room);
    var wallSet = tx.aWall ? tiled('aWall', 2.4) : tiled('stone', 2.2), floorSet = tx.aFloor ? tiled('aFloor', 2.6) : tiled('stone', 1.5);
    var fl = new T.Mesh(new T.PlaneGeometry(8, 8), mat(Object.assign({ color: 0x7a6c62, roughness: 1 }, floorSet), { blood: .16, bscale: 2.1, grime: .55, bump: .0007, bfreq: 60, wet: .5 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; room.add(fl);
    var wl = new T.Mesh(new T.PlaneGeometry(8, 3.4), mat(Object.assign({ color: 0x7c6c62, roughness: 1 }, wallSet), { grime: .7, bscale: 1.6, blood: .08, bump: .0008, bfreq: 50 })); wl.position.set(0, 1.7, -1.45); wl.receiveShadow = true; room.add(wl);
    var sideM = mat(Object.assign({ color: 0x5a4e46, roughness: 1 }, wallSet), { grime: .75, bscale: 1.4, bump: .001, bfreq: 40 });
    [-1, 1].forEach(function (sd) { var w2 = new T.Mesh(new T.PlaneGeometry(5, 3.4), sideM); w2.position.set(sd * 3.0, 1.7, 1.05); w2.rotation.y = -sd * Math.PI / 2; w2.receiveShadow = true; room.add(w2); });
    var ceil = new T.Mesh(new T.PlaneGeometry(8, 5), sideM); ceil.position.set(0, 3.3, 1.05); ceil.rotation.x = Math.PI / 2; room.add(ceil);

    /* ---------- candles: tallow with runs of wax (a distance field, like the bones), a flame that leans and gutters ---------- */
    var flames = [];
    function candle(at, h, rad, seed, par, lit, coarse) {
      var rr = S.rng(seed), drips = [], n = 5 + (rr() * 5 | 0), q;
      for (q = 0; q < n; q++) drips.push([rr() * TAU, h * (.25 + .7 * rr()), rad * (.16 + .2 * rr())]);
      var lean = (rr() - .5) * .05, f = function (x, y, z) {
        x -= lean * y; var rxy = Math.sqrt(x * x + z * z), d = Math.max(rxy - rad * (1 + .05 * Math.sin(y * 70 + seed)), Math.abs(y - h / 2) - h / 2);
        d = S.smax(d, -S.ell(x, y, z, 0, h + rad * .15, 0, rad * .78, rad * .5, rad * .78), rad * .2);                     // the melted crater
        for (var j = 0; j < drips.length; j++) { var dq = drips[j], cx = Math.cos(dq[0]) * rad, cz = Math.sin(dq[0]) * rad; d = S.smin(d, S.cap(x, y, z, cx, h * .97, cz, cx * 1.04, h - dq[1], cz * 1.04, dq[2] * .8, dq[2]), rad * .22); }
        d = S.smin(d, S.ell(x, y, z, 0, 0, 0, rad * 1.7, rad * .2, rad * 1.7), rad * .3);                                  // the puddle it stands in
        return d + (S.fbm3(x * 80, y * 80, z * 80, 2) - .5) * .0012;
      };
      var g = S.nets(T, f, [-rad * 2.1, -.004, -rad * 2.1, rad * 2.1, h + rad * .5, rad * 2.1], Math.max(.0021, rad * .15) * (coarse || 1), { ao: .5, color: function (x, y, z, occ) { var e = .55 + .45 * occ, s = .8 + .3 * S.fbm3(x * 30, y * 30, z * 30, 2); return [e * s, e * s * .97, e * s * .9]; } });
      var grp = new T.Group(); grp.position.copy(at); (par || rig).add(grp); var wm = M.wax.clone(); S.gore(wm, { grime: .16, bump: .00015, bfreq: 120, glow: [h * .45, h * 1.02, 1, .42, .12] }); var body = add(g, wm, grp); body.castShadow = false;
      var wick = add(S.tint(T, new T.CylinderGeometry(.0011, .0013, .012, 5), [.05, .04, .03]), M.soot, grp); wick.position.set(lean * h, h + .002, 0); wick.castShadow = false;
      var fo = { grp: grp, wax: wm, h: h, seed: seed, lit: lit !== false, k: 1 };
      if (fo.lit) {
        // the flame: a teardrop that is white-hot in the belly, orange at the tip and blue round the wick
        var fm = new T.ShaderMaterial({ uniforms: { k: { value: 1 }, t: { value: 0 }, sd: { value: seed } }, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
          vertexShader: 'uniform float t, sd, k; varying vec3 vN, vV; varying float vY; void main() { vec3 p = position; float y = clamp(p.y / .03, 0.0, 1.0); vY = y; float w = y * y; p.x += w * (.0035 * sin(t * 9.0 + sd) + .002 * sin(t * 23.0 + sd * 2.0)) ; p.z += w * .003 * sin(t * 13.0 + sd * 3.0); p.y *= .9 + .12 * k + .06 * sin(t * 17.0 + sd);\n vec4 mv = modelViewMatrix * vec4(p, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
          fragmentShader: 'uniform float k; varying vec3 vN, vV; varying float vY; void main() { float f = abs(dot(normalize(vN), normalize(vV))); f = pow(f, 1.6); vec3 c = mix(vec3(.25, .5, 1.4), vec3(9.0, 5.2, 1.6), smoothstep(.02, .3, vY)); c = mix(c, vec3(5.0, 1.5, .25), smoothstep(.5, 1.0, vY)); float a = f * smoothstep(1.0, .75, vY) * smoothstep(-.02, .1, vY); gl_FragColor = vec4(c * a * (.7 + .5 * k), 1.0); }' });
        var fg = new T.LatheGeometry([[0, 0], [.0032, .003], [.0048, .009], [.0042, .016], [.0022, .024], [0, .031]].map(function (q2) { return new T.Vector2(q2[0], q2[1]); }), 14);
        var fl2 = new T.Mesh(fg, fm); fl2.position.set(lean * h, h + .008, 0); fl2.renderOrder = 6; fl2.userData.noPick = 1; grp.add(fl2); fo.flame = fl2; fo.fm = fm;
        var gl = new T.Sprite(new T.SpriteMaterial({ map: glowT, color: 0xff8a3a, transparent: true, blending: T.AdditiveBlending, depthWrite: false, fog: false, opacity: .5 })); gl.scale.set(.2, .2, 1); gl.position.set(lean * h, h + .022, 0); gl.renderOrder = 5; gl.userData.noPick = 1; grp.add(gl); fo.glow = gl;
      }
      if (fo.lit) { var hz = new T.Sprite(new T.SpriteMaterial({ map: glowT, color: 0xff7a30, transparent: true, blending: T.AdditiveBlending, depthWrite: false, fog: false, opacity: .1 })); hz.scale.set(1.1, 1.1, 1); hz.position.set(lean * h, h + .05, 0); hz.renderOrder = 4; grp.add(hz); fo.haze = hz; }
      fo.body = body; fo.wick = wick; fo.tip = V3(at.x + lean * h, at.y + h + .022, at.z); flames.push(fo); return fo;
    }
    var glowT = (function () { var cv = S.canvas(128, 128), x = cv.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.12, 'rgba(255,240,220,.55)'); g.addColorStop(.4, 'rgba(255,220,180,.14)'); g.addColorStop(1, 'rgba(255,200,160,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new T.CanvasTexture(cv); })();
    // the ledge in the wall behind, with three stubs burning on it
    var ledge = add(S.nets(T, function (x, y, z) { return S.rbox(x, y, z, 0, 0, 0, .34, .035, .09, .012) + (S.fbm3(x * 14, y * 14, z * 14, 3) - .5) * .012; }, [-.37, -.06, -.12, .37, .06, .12], .012, { ao: 2 }), mat(Object.assign({ color: 0x6a625a, roughness: 1, vertexColors: true }, tiled('stone', .9)), { grime: .6, bump: .001, bfreq: 80 }), room); ledge.position.set(-.5, 1.42, -1.37);
    [[-.72, .2, .026, 11], [-.52, .13, .03, 12], [-.33, .26, .022, 13]].forEach(function (q) { candle(V3(q[0], 1.455, -1.37), q[1], q[2], q[3], room, true, 1.6); });
    var wallL = new T.PointLight(0xff8a40, 2.6, 5, 1.6); wallL.position.set(-.5, 1.74, -1.2); sc.add(wallL);
    /* niches, pillars, floor candles, a candelabrum, and the scanned skulls — the crypt around Claude's altar */
    (function () {
      var stone = mat(Object.assign({ color: 0x7a6c62, roughness: 1, vertexColors: true }, wallSet), { grime: .65, bump: .0009, bfreq: 70 });
      function addSkull(pos, sc2, rot, par) { var m = new T.Mesh(skullG, skullM); m.scale.setScalar(sc2); m.position.copy(pos); if (rot) m.rotation.set(rot[0], rot[1], rot[2]); m.castShadow = m.receiveShadow = true; (par || room).add(m); return m; }
      // wall niches with a skull and two stub candles each, plus a round pillar either side
      [-1.25, 1.25].forEach(function (x, j) {
        var sh = new T.Shape(); sh.moveTo(-.24, -.32); sh.lineTo(.24, -.32); sh.lineTo(.24, .12); sh.absarc(0, .12, .24, 0, Math.PI, false); sh.lineTo(-.24, -.32);
        var ho = new T.Path(); ho.moveTo(-.16, -.27); ho.lineTo(-.16, .12); ho.absarc(0, .12, .16, Math.PI, 0, true); ho.lineTo(.16, -.27); ho.lineTo(-.16, -.27); sh.holes.push(ho);
        var nf = new T.ExtrudeGeometry(sh, { depth: .09, bevelEnabled: true, bevelThickness: .008, bevelSize: .008, bevelSegments: 2 }); nf.rotateY(0);
        var nm = new T.Mesh(nf, stone); nm.position.set(x, 1.2, -1.45); nm.castShadow = nm.receiveShadow = true; room.add(nm);
        var bk = new T.Mesh(new T.PlaneGeometry(.32, .56), new T.MeshStandardMaterial({ color: 0x060403, roughness: 1 })); bk.position.set(x, 1.15, -1.4485); room.add(bk);
        var shelf = new T.Mesh(new T.BoxGeometry(.42, .035, .17), stone); shelf.position.set(x, .915, -1.37); shelf.castShadow = shelf.receiveShadow = true; room.add(shelf);
        addSkull(V3(x + (j ? -.05 : .04), .9325, -1.38), .55, [0, j ? -.35 : .3, 0]);
        candle(V3(x + (j ? .08 : -.09), .9325, -1.36), j ? .1 : .14, .016, 100 + j, room, true, 1.5);
        candle(V3(x + (j ? .115 : -.12), .9325, -1.33), .06, .012, 110 + j, room, true, 1.6);
        var pl = new T.PointLight(0xff8840, .85, 1.5, 2); pl.position.set(x + (j ? .06 : -.06), 1.12, -1.25); room.add(pl); cryptLights.push({ l: pl, b: .85, s: 7 + j * 3 });
      });
      [-1.95, 1.95].forEach(function (x) {
        var prof = [[.0, 0], [.26, 0], [.26, .09], [.22, .1], [.21, .16], [.19, .19]];
        for (var i = 1; i <= 8; i++) prof.push([.18 - .005 * Math.sin(i), .19 + 2.7 * i / 8]);
        prof.push([.2, 2.92], [.24, 2.98], [.26, 3.08], [.26, 3.2]);
        var pm = new T.Mesh(new T.LatheGeometry(prof.map(function (q) { return new T.Vector2(q[0], q[1]); }), 28), stone);
        pm.position.set(x, 0, -1.12); pm.castShadow = pm.receiveShadow = true; room.add(pm);
      });
      // iron candelabrum, front left, three cups
      (function () {
        var base = V3(-1.12, 0, .32);
        for (var k = 0; k < 3; k++) {
          var a = k / 3 * TAU + .3, pts = [];
          for (var i = 0; i <= 12; i++) { var t = i / 12; pts.push(V3(base.x + Math.cos(a) * .16 * (1 - t) * (1 - .25 * Math.sin(Math.PI * t)), .015 + .16 * Math.pow(t, 1.6), base.z + Math.sin(a) * .16 * (1 - t))); }
          add(S.sweep(T, pts, 20, 6, function (u) { return .007 * (1 + .4 * (u < .08 ? 1 : 0)); }, { color: ironC }), M.ironV, room);
        }
        add(S.tint(T, new T.CylinderGeometry(.011, .013, .83, 10), ironC), M.ironV, room).position.set(base.x, .58, base.z);
        add(S.tint(T, new T.CylinderGeometry(.055, .06, .012, 18), ironC), M.ironV, room).position.set(base.x, 1.0, base.z);
        // the middle cup's own stem: a short iron post from the hub with a knop and a flared collar under the drip cup
        add(S.tint(T, new T.CylinderGeometry(.0075, .01, .07, 10), ironC), M.ironV, room).position.set(base.x, 1.04, base.z);
        add(S.tint(T, new T.SphereGeometry(.013, 12, 8), ironC), M.ironV, room).position.set(base.x, 1.03, base.z);
        add(S.tint(T, new T.CylinderGeometry(.016, .008, .012, 12), ironC), M.ironV, room).position.set(base.x, 1.068, base.z);
        [[-.14, .02, 1.05], [0, 0, 1.09], [.13, -.03, 1.05]].forEach(function (q, j) {
          if (q[0]) add(S.sweep(T, [V3(base.x, 1.0, base.z), V3(base.x + q[0] * .5, 1.04, base.z + q[1] * .5), V3(base.x + q[0], q[2] - .02, base.z + q[1])], 12, 6, function () { return .006; }, { color: ironC }), M.ironV, room);
          add(S.tint(T, new T.CylinderGeometry(.022, .018, .016, 12), ironC), M.ironV, room).position.set(base.x + q[0], q[2] - .01, base.z + q[1]);
          candle(V3(base.x + q[0], q[2], base.z + q[1]), [.13, .19, .09][j], [.017, .02, .016][j], 20 + j, room, true, 1.3);
        });
        var cl = new T.PointLight(0xff8a40, 1.5, 2.4, 1.8); cl.position.set(base.x, 1.28, base.z + .06); room.add(cl); cryptLights.push({ l: cl, b: 1.5, s: 2.2 });
      })();
      // a stone plinth front right, crowded with candles, more on the floor, and a shrine under the altar
      var plinth = new T.Mesh(new T.BoxGeometry(.32, .34, .3), stone); plinth.position.set(1.18, .17, .28); plinth.castShadow = plinth.receiveShadow = true; room.add(plinth);
      [[1.10, .22, .24, .036], [1.2, .33, .16, .03], [1.27, .21, .3, .042], [1.13, .35, .11, .022], [1.29, .37, .07, .018]].forEach(function (q, j) { candle(V3(q[0], .34, q[1]), q[2], q[3], 40 + j, room, true, 1.5); });
      [[.98, .48, .14, .03], [1.38, .5, .2, .034], [1.45, .32, .1, .024], [-1.32, .52, .12, .028], [-1.4, .2, .18, .03]].forEach(function (q, j) { candle(V3(q[0], 0, q[1]), q[2], q[3], 60 + j, room, true, 1.6); });
      [[-.27, .14, .09, .02], [-.2, .2, .05, .014], [.13, .12, .13, .024], [.21, .17, .06, .015]].forEach(function (q, j) { candle(V3(q[0], .075, q[1]), q[2], q[3], 120 + j, room, true, 1.6); });
      var ul = new T.PointLight(0xff7a38, .75, 1.4, 2); ul.position.set(-.05, .3, .2); room.add(ul); cryptLights.push({ l: ul, b: .75, s: 9.3 });
      // a warm pool under the hanging coils, so the tank view is not a hole
      var tankL = new T.PointLight(0xff8a3c, .7, 1.8, 1.7); tankL.position.set(.62, 1.15, -.35); room.add(tankL); cryptLights.push({ l: tankL, b: .7, s: 4.4 });
      addSkull(V3(-.05, .075, .0), .7, [-.12, .5, .18]);
      addSkull(V3(-.82, .065, .48), .66, [0, .8, 1.35]);
    })();

    /* ---------- light: a soft warm wash from above the player, the altar candle as the key (it throws the long shadows),
       a cold edge from behind, almost nothing else ---------- */
    var CND = P(-.07, .07, ZT);   // where the altar candle stands
    var fill = new T.SpotLight(0xf0c8a0, 20, 9, .78, 1, 1.6); fill.position.set(-1.0, 2.75, 2.5); fill.target.position.set(.05, .95, 0);
    fill.castShadow = !low; fill.shadow.mapSize.set(2048, 2048); fill.shadow.bias = -.0002; fill.shadow.normalBias = .02; fill.shadow.camera.near = 2; fill.shadow.camera.far = 6.5; fill.shadow.radius = 7; sc.add(fill); sc.add(fill.target);
    var key = new T.SpotLight(0xff9448, 2.6, 4.5, 1.02, .9, 1.55); key.position.set(CND.x, CND.y + .215, CND.z); key.target.position.copy(P(.95, .24, ZT + .1));
    key.castShadow = !low; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -.0004; key.shadow.normalBias = .012; key.shadow.camera.near = .05; key.shadow.camera.far = 3.2; key.shadow.radius = 5; sc.add(key); sc.add(key.target);
    var hemi = new T.HemisphereLight(0x6c7288, 0x2a1810, .34); sc.add(hemi);
    // a dull wash up the wall behind, so the idol and the gallows stand against something
    var wash = new T.SpotLight(0xe09060, 9, 6, 1.0, 1, 1.5); wash.position.set(.3, .25, -.55); wash.target.position.set(.1, 2.0, -1.45); sc.add(wash); sc.add(wash.target);
    var rim = new T.DirectionalLight(0x9aa4c8, .3); rim.position.set(2.0, 2.5, -2.4); rim.target.position.set(0, .95, .1); sc.add(rim); sc.add(rim.target);
    // the candle's own near glow (no shadow): it lights the wax, the corner of the altar and the bones beside it
    var cndL = new T.PointLight(0xff8a3c, .5, 1.6, 1.8); cndL.position.set(CND.x + .02, CND.y + .26, CND.z + .03); sc.add(cndL);
    // the pentagram's ember glow on the floor in front of the altar
    var pentL = new T.PointLight(0xff3010, 0, 1.6, 1.6); pentL.position.copy(P(.66, -.22, .47)); sc.add(pentL);

    /* ---------- (1) the altar: a slab on a framed carcass on a plinth, sculpted so its edges are worn and bitten ---------- */
    var chips = []; for (i = 0; i < 22; i++) { var cxx = -.93 + 1.88 * rnd(), frontE = rnd() < .7; chips.push([cxx, .92 - (rnd() < .3 ? .06 : 0), frontE ? .265 : -.265, .008 + .02 * rnd() * rnd()]); }
    [[-.93, .92, .265, .03], [.95, .92, .265, .024], [.95, .86, .2, .02], [-.93, .9, -.1, .02]].forEach(function (q) { chips.push(q); });
    var slabF = function (x, y, z) {
      var d = S.rbox(x, y, z, .01, .8875, 0, .94, .0325, .265, .009) + (S.fbm3(x * 5, y * 9, z * 5, 3) - .5) * .004;
      for (var j = 0; j < chips.length; j++) { var q = chips[j]; d = S.smax(d, -S.ell(x, y, z, q[0], q[1], q[2], q[3] * 1.6, q[3], q[3]), .004); }
      return d;
    };
    var woodCol = function (ao) { return function (x, y, z, occ) { var e = .34 + .66 * occ, n = .8 + .4 * S.fbm3(x * 3, y * 6, z * 3, 3); return [e * n, e * n, e * n]; }; };
    var slabG = S.nets(T, slabF, [-.96, .84, -.285, .98, .935, .285], .0085, { ao: 2.5, color: woodCol() });
    var bodyF = function (x, y, z) {
      var d = S.rbox(x, y, z, .01, .43, 0, .88, .43, .225, .01);
      d = S.smax(d, -S.rbox(x, y, z, .01, .475, .225, .81, .345, .028, .005), .006);            // the front panel sits in a frame (cut deep enough that body fbm/voxels cannot poke through the carving)
      d = S.smax(d, -S.rbox(Math.abs(x - .01), y, z, .88, .475, 0, .014, .345, .165, .005), .006);   // and so do the ends
      d = S.smax(d, -S.rbox(x, y, z, .21, .71, .12, .136, .076, .18, .004), .004);              // the drawer's hole
      d = S.smin(d, S.rbox(x, y, z, .01, .05, 0, .915, .05, .25, .012), .03);                   // the plinth
      return d + (S.fbm3(x * 5, y * 5, z * 5, 3) - .5) * .006;
    };
    var bodyG = S.nets(T, bodyF, [-.95, -.01, -.27, .97, .875, .27], .013, { ao: 3, color: woodCol() });
    // blood and dirt on the top: pools where things bleed, splashes, a dragged smear; it runs over the front edge (the mask is
    // projected straight down, so whatever reaches the edge streaks down the slab's face)
    var TW = 2048, TH = 578, topC = S.canvas(TW, TH), tcx = topC.getContext('2d'); tcx.fillStyle = '#000'; tcx.fillRect(0, 0, TW, TH);
    var tX = function (x) { return (x + .13) / 1.88 * TW; }, tY = function (y) { return (y + .04) / .53 * TH; }, tS = TW / 1.88, B1 = new S.Blood(tcx, 17);
    B1.pool(tX(1.15), tY(.2), .1 * tS, 22).splat(tX(1.2), tY(.14), .07 * tS, 50).pool(tX(1.57), tY(.44), .075 * tS, 18).pool(tX(1.63), tY(.36), .05 * tS, 12).splat(tX(1.5), tY(.3), .09 * tS, 44)
      .pool(tX(.46), tY(.2), .045 * tS, 12).splat(tX(.3), tY(.0), .06 * tS, 34).pool(tX(.66), tY(.01), .06 * tS, 16).smear(tX(.86), tY(.14), tX(1.12), tY(.0), .05 * tS).splat(tX(.9), tY(.38), .06 * tS, 30)
      .pool(tX(1.11), tY(.44), .05 * tS, 12).splat(tX(.05), tY(.3), .05 * tS, 26).pool(tX(1.36), tY(-.02), .04 * tS, 10).pool(tX(.02), tY(-.03), .03 * tS, 8).splat(tX(1.68), tY(.08), .05 * tS, 28);
    [.6, .72, 1.02, 1.18, 1.3, 1.52, .28, 1.66].forEach(function (x) { B1.pool(tX(x), tY(-.035), .016 * tS, 5); });   // what has reached the front edge
    for (i = 0; i < 4; i++) { var py = tY([.075, .185, .29, .395][i]); tcx.strokeStyle = 'rgba(0,255,0,.8)'; tcx.lineWidth = 2.6; tcx.beginPath(); tcx.moveTo(0, py); for (k = 1; k <= 40; k++) tcx.lineTo(k / 40 * TW, py + Math.sin(k * 1.7 + i) * 1.6 + (rnd() - .5) * 1.5); tcx.stroke(); }   // the gaps between the boards
    B1.dirt(tX(-.07), tY(.07), .16 * tS, .7).dirt(tX(.26), tY(.17), .26 * tS, .4).dirt(tX(1.36), tY(.15), .16 * tS, .35).dirt(tX(.66), tY(.4), .3 * tS, .35).dirt(tX(1.5), tY(.4), .3 * tS, .4);
    for (i = 0; i < 26; i++) B1.dirt(rnd() * TW, rnd() * TH, (.03 + .1 * rnd()) * tS, .1 + .2 * rnd());
    var topMask = ctex(topC), woodTop = M.wood.clone(); S.gore(woodTop, { blood: .22, bscale: 7, grime: .5, bump: .0009, grain: [22, 330, 330], mask: topMask });
    var slab = add(heUv(slabG, function (x, y, z) { return [(x + .93) / 1.88, (z + .265) / .53]; }), woodTop);
    var bodyM = M.wood.clone(); S.gore(bodyM, { blood: .3, bscale: 5, grime: .65, bump: .0009, grain: [22, 330, 330], seed: 2 }); var body = add(bodyG, bodyM);

    /* ---------- the altar front: the carved panel. Pentagram, sigils and the FX lettering are cut into a height map (the
       candle rakes across the grooves), filled with soot, and the pentagram's grooves glow with the body ---------- */
    var PW = 2048, PH = 872, PX0 = 0, PX1 = 1.62, PZ0 = .13, PZ1 = .82, pS = PW / (PX1 - PX0);
    var pX = function (x) { return (x - PX0) * pS; }, pY = function (z) { return (PZ1 - z) * pS; };
    var hC = S.canvas(PW, PH), hx = hC.getContext('2d'), mC = S.canvas(PW, PH), mx = mC.getContext('2d'), eC = S.canvas(PW, PH), ex = eC.getContext('2d');
    hx.fillStyle = '#8c8c8c'; hx.fillRect(0, 0, PW, PH); mx.fillStyle = '#000'; mx.fillRect(0, 0, PW, PH); ex.fillStyle = '#000'; ex.fillRect(0, 0, PW, PH);
    // the boards: long fibres, splits and two joints
    for (i = 0; i < 2600; i++) { var gy = rnd() * PH, gx = rnd() * PW, gl2 = 60 + rnd() * 700; hx.strokeStyle = rnd() < .5 ? 'rgba(255,255,255,' + (.03 + rnd() * .06) + ')' : 'rgba(0,0,0,' + (.04 + rnd() * .1) + ')'; hx.lineWidth = .6 + rnd() * 1.8; hx.beginPath(); hx.moveTo(gx, gy); hx.lineTo(gx + gl2, gy + (rnd() - .5) * 5); hx.stroke(); }
    var split = function (y0, x0, x1, w) { [hx, mx].forEach(function (cx2, q) { cx2.strokeStyle = q ? 'rgba(0,255,0,.9)' : 'rgba(0,0,0,.9)'; cx2.lineWidth = w; cx2.lineCap = 'round'; cx2.beginPath(); var sr = S.rng(y0 * 7 + x0 | 0), yy = y0; cx2.moveTo(x0, yy); for (var xx = x0; xx < x1; xx += 14) { yy += (sr() - .5) * 2.6; cx2.lineTo(xx, yy); } cx2.stroke(); }); };
    split(pY(.59), 0, PW, 4.5); split(pY(.36), 0, PW, 4.5); for (i = 0; i < 16; i++) { var sx0 = rnd() * PW * .8; split(rnd() * PH, sx0, sx0 + 100 + rnd() * 500, 1.5 + rnd() * 1.5); }
    // carve(): the same path into the height map (a V groove), the dirt mask (soot in the cut) and, when it glows, the ember map
    var carve = function (path, w, glow) {
      hx.lineCap = hx.lineJoin = 'round'; [[w * 2.6, 'rgba(0,0,0,.16)'], [w * 1.7, 'rgba(0,0,0,.3)'], [w, 'rgba(0,0,0,.55)'], [w * .45, 'rgba(0,0,0,.9)']].forEach(function (q) { hx.strokeStyle = q[1]; hx.lineWidth = q[0]; hx.beginPath(); path(hx); hx.stroke(); });
      mx.globalCompositeOperation = 'lighter'; mx.lineCap = mx.lineJoin = 'round'; mx.strokeStyle = 'rgba(0,255,0,.95)'; mx.lineWidth = w * 1.05; mx.beginPath(); path(mx); mx.stroke();
      if (glow) { ex.lineCap = ex.lineJoin = 'round'; ex.globalCompositeOperation = 'lighter'; ex.shadowColor = 'rgba(255,60,10,.9)'; ex.shadowBlur = w * 2.2; ex.strokeStyle = 'rgba(255,120,40,.95)'; ex.lineWidth = w * .7; ex.beginPath(); path(ex); ex.stroke(); ex.shadowBlur = 0; }
    };
    var circ = function (x, z, rad) { return function (q) { q.moveTo(pX(x) + rad * pS, pY(z)); q.arc(pX(x), pY(z), rad * pS, 0, TAU); }; };
    var line = function (a, b) { return function (q) { q.moveTo(pX(a[0]), pY(a[1])); q.lineTo(pX(b[0]), pY(b[1])); }; };
    // a rune: a few straight strokes inside a small cell, turned to face the middle of its ring
    var rune = function (x, z, s, ang, seed, w, glow) { var rr = S.rng(seed), pts = [], n = 3 + (rr() * 3 | 0), q; for (q = 0; q <= n; q++) pts.push([(Math.round(rr() * 2) - 1) * .5, (Math.round(rr() * 4) - 2) * .5]);
      carve(function (cx2) { for (q = 0; q < n; q++) { var a = pts[q], b = pts[q + 1], ca = Math.cos(ang), sa = Math.sin(ang); cx2.moveTo(pX(x + (a[0] * ca - a[1] * sa) * s), pY(z + (a[0] * sa + a[1] * ca) * s)); cx2.lineTo(pX(x + (b[0] * ca - b[1] * sa) * s), pY(z + (b[0] * sa + b[1] * ca) * s)); } }, w, glow); };
    // the pentagram, point down, in a double ring of runes
    var PC = [.665, .465], PR = .205, star = []; for (i = 0; i < 5; i++) { var sa = -Math.PI / 2 + i * TAU / 5; star.push([PC[0] + Math.cos(sa) * PR * .86, PC[1] + Math.sin(sa) * PR * .86]); }
    carve(circ(PC[0], PC[1], PR), 9, true); carve(circ(PC[0], PC[1], PR * .86), 7, true);
    carve(function (q) { q.moveTo(pX(star[0][0]), pY(star[0][1])); [2, 4, 1, 3, 0].forEach(function (j) { q.lineTo(pX(star[j][0]), pY(star[j][1])); }); }, 9, true);
    for (i = 0; i < 15; i++) { var ra = i / 15 * TAU + .2; rune(PC[0] + Math.cos(ra) * PR * .93, PC[1] + Math.sin(ra) * PR * .93, .013, ra - Math.PI / 2, 100 + i, 3.2, true); }
    carve(circ(PC[0], PC[1], .03), 5, true);
    // a second sigil under the drawer, a cross of bars and rings
    var S2 = [1.01, .40]; carve(circ(S2[0], S2[1], .1), 6); carve(line([S2[0], S2[1] + .08], [S2[0], S2[1] - .085]), 6); carve(line([S2[0] - .045, S2[1] - .035], [S2[0] + .045, S2[1] - .035]), 6);
    carve(function (q) { q.moveTo(pX(S2[0] - .06), pY(S2[1] + .05)); q.lineTo(pX(S2[0]), pY(S2[1] - .02)); q.lineTo(pX(S2[0] + .06), pY(S2[1] + .05)); }, 5); carve(circ(S2[0] - .06, S2[1] + .058, .012), 4); carve(circ(S2[0] + .06, S2[1] + .058, .012), 4);
    for (i = 0; i < 9; i++) rune(1.2 + i * .045, .2, .014, 0, 300 + i, 3);
    for (i = 0; i < 7; i++) rune(1.21 + i * .058, .76, .016, 0, 340 + i, 3.2);
    // the ring the iron serpent is nailed over
    carve(circ(1.42, .47, .125), 6); carve(circ(1.42, .47, .14), 3); for (i = 0; i < 12; i++) rune(1.42 + Math.cos(i / 12 * TAU) * .165, .47 + Math.sin(i / 12 * TAU) * .165, .011, i / 12 * TAU - Math.PI / 2, 400 + i, 2.6);
    // tally marks scratched by someone who was counting
    for (i = 0; i < 4; i++) { var t0x = .5 + i * .07; for (k = 0; k < 4; k++) carve(line([t0x + k * .011, .215 + (rnd() - .5) * .006], [t0x + k * .011 + .003, .175]), 2.2); carve(line([t0x - .008, .185], [t0x + .042, .208]), 2.2); }
    // the FX block: a frame, a slot for the ember readout, a groove for the send bead, six dial seats with their names
    var KN = [['harm.shift', 'SHIFT'], ['harm.detune', 'DETUNE'], ['harm.fb', 'FEEDBACK'], ['harm.mix', 'RETURN'], ['aura.level', 'AURA'], ['rev.decay', 'HALL']], KX = [.1, .22, .34], KZ = [.6, .455];
    var word = function (t, x, z, sz, glow) { [hx, mx].forEach(function (cx2, q) { cx2.save(); cx2.font = '700 ' + sz + 'px Georgia, "Times New Roman", serif'; cx2.textAlign = 'center'; cx2.textBaseline = 'middle'; if (cx2.letterSpacing !== undefined) cx2.letterSpacing = (sz * .14) + 'px';
      if (q) { cx2.globalCompositeOperation = 'lighter'; cx2.fillStyle = 'rgba(0,0,255,.95)'; cx2.fillText(t, pX(x), pY(z)); } else { cx2.shadowColor = 'rgba(0,0,0,.5)'; cx2.shadowBlur = 4; cx2.fillStyle = 'rgba(0,0,0,.85)'; cx2.fillText(t, pX(x), pY(z)); } cx2.restore(); }); };
    carve(function (q) { q.rect(pX(.025), pY(.805), .39 * pS, .525 * pS); }, 5); carve(function (q) { q.rect(pX(.035), pY(.795), .37 * pS, .505 * pS); }, 2.5);
    KN.forEach(function (kq, j) { var x = KX[j % 3], z = KZ[j < 3 ? 0 : 1]; carve(circ(x, z, .037), 3.2); word(kq[1], x, z - .056, 21);
      for (var q = 0; q <= 10; q++) { var a = (-135 + q * 27) * Math.PI / 180; carve(line([x + Math.sin(a) * .041, z + Math.cos(a) * .041], [x + Math.sin(a) * (q % 5 ? .046 : .05), z + Math.cos(a) * (q % 5 ? .046 : .05)]), q % 5 ? 2 : 3); } });
    word('SEND', .065, .7, 20); carve(line([.11, .7], [.375, .7]), 7); for (i = 0; i <= 10; i++) carve(line([.11 + i * .0265, .688], [.11 + i * .0265, i % 5 ? .683 : .679]), 2);
    word('FREEZE', .13, .318, 20); word('LOOP', .31, .318, 20); carve(circ(.13, .355, .024), 3); carve(circ(.31, .355, .024), 3);
    rune(.06, .355, .014, 0, 501, 2.6); rune(.22, .355, .016, 0, 502, 2.8); rune(.385, .355, .014, 0, 503, 2.6);
    // what has run down from the slab: wet, dark, irregular — not a regular curtain of wax-like drips
    var B2 = new S.Blood(mx, 23);
    var wetDrip = function (px, py, len, wd) {
      var rr = S.rng((px * 13 + py) | 0), xx = px, yy = py, left = len; mx.lineCap = 'round'; mx.globalCompositeOperation = 'lighter';
      while (left > 10) {
        var step = 7 + rr() * 22, nx = xx + (rr() - .5) * wd * 2.2, ny = yy + step;
        if (rr() > .16) { mx.strokeStyle = 'rgba(255,0,0,' + (.5 + .5 * rr()) + ')'; mx.lineWidth = Math.max(1.2, wd * (.35 + rr() * 1.3) * (.45 + .55 * left / len)); mx.beginPath(); mx.moveTo(xx, yy); mx.lineTo(nx, ny); mx.stroke(); }
        if (rr() < .4) { var rad = wd * (.7 + rr() * 1.4), g = mx.createRadialGradient(nx, ny, 0, nx, ny, rad); g.addColorStop(0, 'rgba(255,0,0,' + (.7 + .3 * rr()) + ')'); g.addColorStop(1, 'rgba(255,0,0,0)'); mx.fillStyle = g; mx.beginPath(); mx.arc(nx, ny, rad, 0, TAU); mx.fill(); }
        xx = nx; yy = ny; left -= step;
      }
      var td = wd * (1.1 + rr()); mx.fillStyle = 'rgba(255,0,0,.95)'; mx.beginPath(); mx.arc(xx, yy + td * .2, td, 0, TAU); mx.fill();
      mx.globalCompositeOperation = 'source-over';
    };
    [[.62, .82, .13], [.7, .82, .09], [1.18, .82, .08], [1.02, .82, .07], [.3, .82, .07], [1.5, .82, .09]].forEach(function (q) {
      B2.pool(pX(q[0]), pY(q[1]), q[2] * pS * .5, 9);
      var nd = 2 + (rnd() * 2 | 0); for (var j = 0; j < nd; j++) wetDrip(pX(q[0] + (rnd() - .5) * q[2] * .7), pY(q[1]) - 4, (.12 + .38 * rnd()) * pS, 3 + rnd() * 5);
    });
    B2.splat(pX(.9), pY(.3), .09 * pS, 40).splat(pX(.45), pY(.56), .05 * pS, 30).splat(pX(1.3), pY(.6), .07 * pS, 36).smear(pX(.5), pY(.7), pX(.82), pY(.62), .05 * pS);
    for (i = 0; i < 30; i++) B2.dirt(rnd() * PW, PH * (.3 + .7 * rnd()), (.05 + .16 * rnd()) * pS, .1 + .22 * rnd());
    var gdr = mx.createLinearGradient(0, PH * .55, 0, PH); gdr.addColorStop(0, 'rgba(0,255,0,0)'); gdr.addColorStop(1, 'rgba(0,255,0,.55)'); mx.fillStyle = gdr; mx.fillRect(0, 0, PW, PH);
    // wipe blood (red) off the carved pentagram; leave soot in the grooves and blood on the rest of the panel
    (function () {
      var im = mx.getImageData(0, 0, PW, PH), d = im.data, cx = pX(PC[0]), cy = pY(PC[1]), rad = PR * 1.06 * pS, r2 = rad * rad, feather = r2 * .1;
      var x0 = Math.max(0, cx - rad | 0), x1 = Math.min(PW, (cx + rad + 1) | 0), y0 = Math.max(0, cy - rad | 0), y1 = Math.min(PH, (cy + rad + 1) | 0), x, y, o, f, k;
      for (y = y0; y < y1; y++) for (x = x0; x < x1; x++) {
        f = (x - cx) * (x - cx) + (y - cy) * (y - cy);
        if (f <= r2) { k = f > r2 - feather ? (r2 - f) / feather : 1; o = (y * PW + x) * 4; d[o] *= 1 - k; }
      }
      mx.putImageData(im, 0, 0);
    })();
    var pshape = new T.Shape(); pshape.moveTo(PX0 - .8, PZ0); pshape.lineTo(PX1 - .8, PZ0); pshape.lineTo(PX1 - .8, PZ1); pshape.lineTo(PX0 - .8, PZ1); pshape.closePath();
    var DX0 = .875, DX1 = 1.145, DZ0 = .635, DZ1 = .785, dhole = new T.Path(); dhole.moveTo(DX0 - .8, DZ0); dhole.lineTo(DX0 - .8, DZ1); dhole.lineTo(DX1 - .8, DZ1); dhole.lineTo(DX1 - .8, DZ0); dhole.closePath(); pshape.holes.push(dhole);
    var panelG = new T.ShapeGeometry(pshape); heUv(panelG, function (x, y) { return [(x + .8 - PX0) / (PX1 - PX0), (y - PZ0) / (PZ1 - PZ0)]; }); panelG.setAttribute('uv1', panelG.attributes.heUv.clone());
    var pnm = S.normalFromHeight(T, hC, 3.2); pnm.channel = 1; var pem = ctex(eC, true); pem.channel = 1;
    var panelM = mat(Object.assign({ color: 0x8a6650, roughness: 1, emissive: 0xff5a20, emissiveIntensity: 0 }, oakT, { normalMap: pnm, emissiveMap: pem }), { blood: .16, bscale: 6, grime: .5, bump: .0006, grain: [22, 330, 330], mask: ctex(mC), seed: 5 });
    panelM.normalScale.set(1.5, 1.5);
    var panel = add(panelG, panelM); panel.position.z = .2102; panel.castShadow = false;

    /* ---------- plain (no vertex colour) versions for stock geometry, and a few small makers ---------- */
    M.woodB = mat(Object.assign({ color: 0x6a4c3a, roughness: 1 }, oakT), { blood: .3, bscale: 9, grime: .6, bump: .0009, grain: [22, 330, 330], seed: 7 });
    M.boneB = mat({ color: 0xa8946e, roughness: .58, clearcoat: .2, clearcoatRoughness: .4 }, { blood: .22, bscale: 18, grime: .4, bump: .0003, bfreq: 190, seed: 4 });
    M.rustB = mat({ color: 0x4c4744, roughness: .75, metalness: .85, side: T.DoubleSide }, { rust: .7, blood: .14, bscale: 16, grime: .4, bump: .0006, bfreq: 260 });
    M.stalk = mat({ color: 0x7a2a22, roughness: .4, clearcoat: .8, clearcoatRoughness: .25 }, { blood: .45, bscale: 40, grime: .5, bump: .0004, bfreq: 500 });
    M.wandShaft = mat({ color: 0xb09a78, roughness: .7, vertexColors: true, clearcoat: .14, clearcoatRoughness: .55 }, { grime: .4, blood: .1, bscale: 16, bump: .0004, grain: [60, 360, 60] });
    var setUv = function (g, f) { var p = g.attributes.position, u = g.attributes.uv; for (var q = 0; q < p.count; q++) { var w = f(p.getX(q), p.getY(q), p.getZ(q)); u.setXY(q, w[0], w[1]); } return g; };
    // an iron hook hanging from a point: a shank and an open curl; returns where things hang from it
    function hook(top, len, par) { var pts = [V3(0, 0, 0), V3(0, -len * .55, 0), V3(.004, -len * .86, 0), V3(.016, -len, 0), V3(.03, -len * .88, 0), V3(.032, -len * .72, 0)];
      var m = add(S.sweep(T, pts, 30, 6, function (u) { return .0034 * (u > .9 ? Math.max(.3, (1 - u) * 10) : 1); }, { color: ironC }), M.ironV, par); m.position.copy(top); return V3(top.x + .016, top.y - len + .004, top.z); }
    // a rough-hewn length of timber or iron bar as a field: half sizes hx, hy, hz
    function hewn(hx2, hy, hz, cell, m, par, amp) { var f = function (x, y, z) { return S.rbox(x, y, z, 0, 0, 0, hx2, hy, hz, Math.min(hx2, hy, hz) * .3) + (S.fbm3(x * 9, y * 9, z * 9, 3) - .5) * (amp || .008); }; return add(S.nets(T, f, [-hx2 - .012, -hy - .012, -hz - .012, hx2 + .012, hy + .012, hz + .012], cell, { ao: 2 }), m, par); }
    // a soft dark footprint under something standing on the altar (what the shadow maps are too coarse for)
    var blobT = (function () { var cv = S.canvas(64, 64), x = cv.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(0,0,0,.85)'); g.addColorStop(.55, 'rgba(0,0,0,.5)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new T.CanvasTexture(cv); })();
    var blobM = new T.MeshBasicMaterial({ map: blobT, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, fog: false });
    function blob(x, y, w, d, z) { var m = new T.Mesh(new T.PlaneGeometry(w, d), blobM); m.rotation.x = -Math.PI / 2; m.position.copy(P(x, y, (z || ZT) + .0035)); m.renderOrder = 1; m.userData.noPick = 1; rig.add(m); return m; }

    var woodT = zone('knock', 1.88, .53, P(.81, .225, ZT + .003), 'top', { part: 'wood', hz: 150, obj: 4 }); tag(slab, woodT); tag(body, woodT);
    var woodF = zone('knock', 1.62, .69, P(.81, .012, .475), 'front', { part: 'wood', hz: 130, obj: 4 }); panel.userData.zone = woodF;

    /* ---------- (22) the altar candle: the aura voice (rub the flame) and the scene's key light ---------- */
    var hero = candle(P(-.07, .07, ZT + .012), .185, .031, 5, rig); add(S.tint(T, new T.CylinderGeometry(.052, .04, .012, 20), ironC), M.ironV).position.copy(P(-.07, .07, ZT + .006));
    var stub1 = candle(P(-.015, .03, ZT + .001), .055, .022, 6, rig, false), stub2 = candle(P(-.1, .16, ZT + .001), .085, .019, 8, rig, true);
    var lampZ = zone('play', .16, .3, P(-.07, .06, ZT + .13), 'front', { src: 7, part: 'lamp' }); tag(hero.grp, lampZ); hero.flame.userData.noPick = 1;
    blob(-.07, .07, .2, .2);
    // and two more at the far end, by the skull, so the right of the altar has its own pool of light
    var endC = candle(P(1.60, .12, ZT + .001), .095, .024, 21, rig, true), endC2 = candle(P(1.655, .18, ZT + .001), .05, .02, 23, rig, false);
    var endL = new T.PointLight(0xff8a3c, .55, 1.5, 1.7); endL.position.copy(P(1.60, .12, ZT + .17)); sc.add(endL); blob(1.60, .12, .14, .14);

    /* ---------- (7)(8) rusted rail spikes driven into a tray of blood on a pivot; a spigot to fill it ---------- */
    var tray = new T.Group(); tray.position.copy(P(.26, .17, ZT)); rig.add(tray);
    var panF = function (x, y, z) { var o = S.rbox(x, y, z, 0, .036, 0, .18, .03, .108, .012), d = Math.max(o, -S.rbox(x, y, z, 0, .049, 0, .1725, .036, .1005, .008)); return d + (S.fbm3(x * 22, y * 22, z * 22, 2) - .5) * .003; };
    var pan = add(S.nets(T, panF, [-.195, -.004, -.123, .195, .078, .123], .0036, { ao: 1.5, color: function (x, y, z, occ) { var e = .3 + .7 * occ; return [e * .5, e * .47, e * .45]; } }), M.ironV, tray);
    var gimb = []; [.05, .29].forEach(function (y) { gimb.push(c.box(.245, y - .008, ZT, .275, y + .008, ZT + .052, M.iron), c.cyl(.26, y + (y < .1 ? .008 : -.008), ZT + .034, ZT + .046, .008, M.iron)); });
    // the rods: rusted railroad spikes driven into the pan, square shank tapering a little to a chisel point, a flat head
    // with its lip overhanging one face; all the same forging, driven to different depths (the exposed length sets the
    // pitch exactly as the bones did). One instanced mesh; each spike also has an invisible stand-in for picking.
    var SPL = .34, spikeG = (function () {
      var f = function (x, y, z) {
        var u = y / SPL, w = .0052 + .0013 * u, wx = y < .036 ? w * Math.max(.12, y / .036) : w;                       // chisel point: thins across x only
        var qx = Math.abs(x) - wx + .0007, qz = Math.abs(z) - w + .0007, d = Math.sqrt(Math.max(qx, 0) * Math.max(qx, 0) + Math.max(qz, 0) * Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - .0007;
        d = Math.max(d, -y); d = Math.max(d, y - (SPL - .006));
        var hd = S.rbox(x, y, z, .0058, SPL - .0042, 0, .0136, .0042, .0102, .0026);                                     // the head, lip toward +x
        hd = S.smax(hd, -(SPL + .0012 - y - .03 * Math.max(0, Math.abs(x - .006) - .006) - .03 * Math.abs(z)), .002);  // a crowned top
        d = S.smin(d, hd, .0022);
        return d + (S.fbm3(x * 190, y * 190, z * 190, 3) - .5) * .0011 + (S.fbm3(x * 55 + 4, y * 55, z * 55, 2) - .5) * .0009;   // pitting and scale
      };
      return S.nets(T, f, [-.0125, -.002, -.0125, .0235, SPL + .004, .0125], .0021, { ao: 1.2, color: function (x, y, z, occ) {
        var n = S.fbm3(x * 90 + 1, y * 90, z * 90, 3), sc2 = S.fbm3(x * 26 + 3, y * 26, z * 26, 2), m = Math.min(1, Math.max(0, (n - .35) / .3)), e = (.45 + .55 * occ) * (.4 + .6 * Math.min(1, y / .25));
        var c0 = [.27 + (.06 - .27) * m, .075 + (.018 - .075) * m, .018 + (.007 - .018) * m];   // linear: orange-brown rust mottled darker
        if (sc2 > .6) { var k = Math.min(1, (sc2 - .6) / .12); c0 = [c0[0] + (.022 - c0[0]) * k, c0[1] + (.011 - c0[1]) * k, c0[2] + (.007 - c0[2]) * k]; }   // dark scale
        return [c0[0] * e, c0[1] * e, c0[2] * e]; } });
    })();
    var spikeM = mat({ color: 0xffffff, roughness: .95, metalness: .28, vertexColors: true }, { rust: .5, grime: .35, blood: .1, bscale: 14, bump: .0006, bfreq: 320 });
    (function () { var ob = spikeM.onBeforeCompile; spikeM.onBeforeCompile = function (sh) { ob(sh); sh.vertexShader = sh.vertexShader.replace('vHeP = position;', 'vHeP = position;\n#ifdef USE_INSTANCING\n vHeP += instanceMatrix[3].xyz * 9.7;\n#endif'); }; spikeM.customProgramCacheKey = function () { return 'heGoreSpike'; }; })();
    var spikes = new T.InstancedMesh(spikeG, spikeM, 12); spikes.castShadow = spikes.receiveShadow = true; spikes.userData.noPick = 1; tray.add(spikes);
    var pickM = new T.MeshBasicMaterial({ visible: false }), rods = [];
    for (i = 0; i < 12; i++) {
      var ra = i / 12 * TAU, bx = .26 + .135 * Math.cos(ra), by = .17 + .082 * Math.sin(ra), xr = (bx - .08) / .36, hgt = .36 - .2 * xr;
      var rg = new T.Group(); rg.position.set(bx - .26, .012, .17 - by); tray.add(rg);
      var spl = new T.Object3D(); spl.position.y = hgt - SPL; spl.rotation.y = i * 2.4; spl.rotation.z = (rnd() - .5) * .07; spl.rotation.x = (rnd() - .5) * .07; spl.updateMatrix();
      var px = new T.Mesh(new T.BoxGeometry(.016, hgt, .016), pickM); px.position.y = hgt / 2; px.castShadow = px.receiveShadow = false; rg.add(px);
      rods.push({ g: rg, xr: xr, h: hgt, sw: 0, sm: spl.matrix });
    }
    var spM = new T.Matrix4();
    function spikeSet() { for (var q = 0; q < rods.length; q++) { var r0 = rods[q]; r0.g.updateMatrix(); spM.multiplyMatrices(r0.g.matrix, r0.sm); spikes.setMatrixAt(q, spM); } spikes.instanceMatrix.needsUpdate = true; }
    spikeSet(); spikes.computeBoundingSphere();
    var bldG = new T.PlaneGeometry(.342, .198, 14, 8), bld = new T.Mesh(bldG, M.blood); bld.rotation.x = -Math.PI / 2; bld.receiveShadow = true; bld.userData.noPick = 1; rig.add(bld); var bld0 = Float32Array.from(bldG.attributes.position.array);
    // inner trough, inset from the rounded walls. Surface stays world-level (gravity) and is clipped to the walls at every tilt.
    var T_RIM = .063, T_FLR = .014, T_HX = .164, T_HZ = .094, T_BW = .342, T_BD = .198;
    function traySurf(tilt, lvl) {
      var ang = -tilt * .12, sn = Math.sin(ang), cs = Math.cos(ang), ca = Math.max(.0001, Math.abs(cs));
      var hWant = .022 + lvl * .04, h0 = Math.max(0, hWant - T_FLR);
      var hLow = T_RIM * cs - T_HX * Math.abs(sn) - .0012, hMin = T_FLR * cs - T_HX * Math.abs(sn);
      function vol(H) {
        var acc = 0, n = 12, span = 2 * T_HX, i, xa, xb, ya, yb, cap = T_RIM - T_FLR;   // (no closure: this runs ~15 times a frame)
        for (i = 0; i < n; i++) { xa = -T_HX + span * i / n; xb = -T_HX + span * (i + 1) / n; ya = Math.max(0, Math.min(cap, (H - xa * sn) / cs - T_FLR)); yb = Math.max(0, Math.min(cap, (H - xb * sn) / cs - T_FLR)); acc += .5 * (ya + yb) * (xb - xa); }
        return acc;
      }
      var target = h0 * 2 * T_HX, lo = hMin, hi = hLow, H, it;
      if (vol(hLow) <= target) H = hLow;
      else { for (it = 0; it < 14; it++) { H = .5 * (lo + hi); if (vol(H) < target) lo = H; else hi = H; } H = .5 * (lo + hi); }
      H = Math.min(H, hLow);
      var vis = lvl > .01 && H > hMin + .001, x0 = -T_HX, x1 = T_HX;
      if (vis && Math.abs(sn) > 1e-5) {
        var a = (H - T_RIM * cs) / sn, b = (H - T_FLR * cs) / sn;
        x0 = Math.max(-T_HX, Math.min(a, b)); x1 = Math.min(T_HX, Math.max(a, b));
      }
      var mid = (x0 + x1) * .5;
      return { vis: vis, H: H, midX: (mid - H * sn) / cs, sx: Math.max(.002, (x1 - x0) / ca) / T_BW, sz: (2 * T_HZ) / T_BD, ang: ang, hLow: hLow };
    }
    var ROD_HZ = function (xr2) { var h = .36 - .2 * xr2; return 170 * Math.pow(.36 / h, 2); };
    var rodsZ = zone('bowtap', .34, .34, P(.26, .17, ZT + .17), 'front', { part: 'rods', items: function () { return rods.slice(0, 7).map(function (q) { var hz = Math.round(ROD_HZ(q.xr)); return { u: (q.xr * .36 + .08 - .09) / .34, xr: q.xr, bow: { 'bowed.object': 1, 'bowed.size': hz }, tap: { 'struck.object': 1 }, hz: hz }; }); } });
    rods.forEach(function (q) { tag(q.g, rodsZ); });
    var trayZ = zone('tray', .38, .07, P(.26, .058, ZT + .04), 'front', { part: 'tray' }); tag(pan, trayZ); gimb.forEach(function (m) { tag(m, trayZ); });
    var ftap = new T.Group(); ftap.position.copy(P(.415, .045, ZT + .03)); rig.add(ftap); add(S.tint(T, new T.CylinderGeometry(.008, .009, .05, 10), ironC), M.ironV, ftap); var fth = add(S.phalanx(T, .06, .006), M.bone, ftap); fth.rotation.z = Math.PI / 2; fth.position.set(.03, .03, 0);
    var ftapZ = zone('filltap', .08, .08, P(.415, .04, ZT + .05), 'front', { part: 'filltap' }); tag(ftap, ftapZ);
    blob(.26, .17, .5, .34);
    // leftover wand eyeball, smaller, floating part-submerged in the tilting blood; visual only (noPick)
    var ER = .0115, eyeC = S.canvas(512, 256);
    (function () {
      var x = eyeC.getContext('2d'), rr = S.rng(5), q;
      x.fillStyle = '#d8cdb8'; x.fillRect(0, 0, 512, 256);
      for (q = 0; q < 46; q++) { var vx = rr() * 512, vy = 150 + rr() * 60; x.strokeStyle = 'rgba(150,20,16,' + (.25 + rr() * .5) + ')'; x.lineWidth = .8 + rr() * 2; x.beginPath(); x.moveTo(vx, vy); for (var j = 0; j < 7; j++) { vx += (rr() - .5) * 26; vy -= 8 + rr() * 14; x.lineTo(vx, vy); } x.stroke(); }
      var eg = x.createLinearGradient(0, 150, 0, 256); eg.addColorStop(0, 'rgba(120,14,10,0)'); eg.addColorStop(.6, 'rgba(110,12,8,.8)'); eg.addColorStop(1, 'rgba(60,4,4,1)'); x.fillStyle = eg; x.fillRect(0, 150, 512, 106);
      x.fillStyle = '#3a2a16'; x.fillRect(0, 0, 512, 46); for (q = 0; q < 160; q++) { x.strokeStyle = 'rgba(' + (rr() < .5 ? '190,150,60' : '40,26,10') + ',.5)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(q * 3.2, 18); x.lineTo(q * 3.2 + (rr() - .5) * 4, 44); x.stroke(); }
      x.fillStyle = '#1a0e06'; x.fillRect(0, 42, 512, 5); x.fillStyle = '#020202'; x.fillRect(0, 0, 512, 20);
    })();
    var eyeBallM = mat({ map: ctex(eyeC, true), roughness: .16, clearcoat: .72, clearcoatRoughness: .22, envMapIntensity: .7 });
    var eyeFilmM = mat({ color: 0x3a0408, roughness: .2, metalness: 0, clearcoat: .65, clearcoatRoughness: .28, envMapIntensity: .45, transparent: true, opacity: .3 });
    var eyeG = new T.SphereGeometry(ER, 24, 18); eyeG.rotateX(Math.PI / 2);
    var floatEye = new T.Group(); rig.add(floatEye); floatEye.userData.shSlow = 1;
    var eyeMesh = add(eyeG, eyeBallM, floatEye), eyeFilm = add(new T.SphereGeometry(ER * 1.045, 20, 16), eyeFilmM, floatEye);
    floatEye.traverse(function (o) { o.userData.noPick = 1; if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    eyeFilm.castShadow = false;
    // bowl eye gets its own materials so a liquid clipping plane does not also cut the tray eye
    var bowlBallM = eyeBallM.clone(), bowlFilmM = eyeFilmM.clone(), bowlClip = new T.Plane(new T.Vector3(0, 1, 0), 0);
    bowlBallM.clippingPlanes = [bowlClip]; bowlFilmM.clippingPlanes = [bowlClip];
    var bowlEye = new T.Group(); rig.add(bowlEye); bowlEye.userData.shSlow = 1;
    add(eyeG, bowlBallM, bowlEye);
    var bowlFilm = add(new T.SphereGeometry(ER * 1.045, 20, 16), bowlFilmM, bowlEye);
    bowlEye.traverse(function (o) { o.userData.noPick = 1; if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    bowlFilm.castShadow = false;

    /* ---------- (2) the ribcage harp: two spines for pillars, ribs curling off them, a collarbone for the neck, eleven gut strings.
       One voice (the e-bow string): across the harp is the note, up the string is where the lodestone sits ---------- */
    var HY = .37, HX0 = .525, HW = .34, HZ0 = ZT + .05, HH = .56, harp = new T.Group(); rig.add(harp);
    var vertG = S.vertebra(T, .95, 1.6), hparts = [], ribparts = [], vertN = { L: 0, R: 0 };
    var pillar = function (pts, n, side, nrib) {
      var cu = new T.CatmullRomCurve3(pts.map(function (q) { return P(q[0], HY, ZT + q[1]); })); cu.arcLengthDivisions = 160;
      var total = cu.getLength(), acc = 0, j = 0, tg = V3(0, 0, 0), pp = V3(0, 0, 0);
      // a continuous shaft through the centres, so the column reads as one spine even at a glance
      hparts.push({ g: S.sweep(T, cu, 48, 8, function (u) { return .0068 * (1 - .18 * u); }, { color: boneC }) });
      // each vertebra is 10% longer along the spine so fewer are needed; still overlapped and joined into one mesh
      while (acc < total - .003) {
        var u = Math.min(1, acc / total); cu.getPointAt(u, pp); cu.getTangentAt(u, tg);
        var rz = Math.atan2(-tg.x, tg.y), sc2 = 1 - .2 * u, h = .022 * .95 * sc2 * .88 * 1.1;
        hparts.push({ g: vertG, m: m4(pp.x, pp.y, pp.z, 0, (rnd() - .5) * .06, rz, sc2, sc2 * 1.1, sc2) });
        if (j % 2 === 0 && j / 2 < nrib) { var ru = u, rw = .1 * (1 - .45 * ru) * (.8 + .4 * Math.sin(ru * 3 + .4)); ribparts.push({ g: S.rib(T, rw, rw * .55, rw * .8, 20 + j + (side > 0 ? 50 : 0), side), m: m4(pp.x + side * .012, pp.y, pp.z + .004, 0, -side * .25, rz) }); }
        acc += h; j++;
      }
      if (side < 0) vertN.L = j; else vertN.R = j;
      return cu;
    };
    var cuL = pillar([[.535, .055], [.508, .2], [.492, .4], [.5, .615]], 17, -1, 8), cuR = pillar([[.85, .055], [.876, .17], [.886, .31], [.874, .435]], 12, 1, 5);
    var neckPts = [[.478, .632], [.56, .628], [.68, .575], [.79, .49], [.885, .44]].map(function (q) { return P(q[0], HY, ZT + q[1]); }), neckCu = new T.CatmullRomCurve3(neckPts);
    hparts.push({ g: S.sweep(T, neckCu, 50, 10, function (u) { var e = Math.abs(u - .5) * 2; return [.0105 + .006 * e * e, .0085 + .005 * e * e]; }, { color: boneC }) });
    hparts.push({ g: S.bone(T, .4, .0155, 1, 9), m: new T.Matrix4().makeRotationZ(-Math.PI / 2).setPosition(P(.495, HY, ZT + .034)) });
    var harpM = add(S.join(T, hparts), M.bone, harp), ribM = add(S.join(T, ribparts), M.boneWet, harp);
    window.__heAltarVerts = { left: vertN.L, right: vertN.R, total: vertN.L + vertN.R };
    // a string that can shake: a thin tube up the y axis whose rings are moved sideways
    function vstring(a, b, rad) {
      var n = 14, RS = 5, pos = new Float32Array((n + 1) * RS * 3), nor = new Float32Array((n + 1) * RS * 3), idx = [], q, j, len = b.y - a.y;
      for (q = 0; q <= n; q++) for (j = 0; j < RS; j++) { var an = j / RS * TAU, o = (q * RS + j) * 3; nor[o] = Math.cos(an); nor[o + 2] = Math.sin(an); if (q < n) { var i0 = q * RS + j, i1 = q * RS + (j + 1) % RS; idx.push(i0, i1, i0 + RS, i1, i1 + RS, i0 + RS); } }
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('normal', new T.BufferAttribute(nor, 3)); g.setAttribute('uv', new T.BufferAttribute(new Float32Array((n + 1) * RS * 2), 2)); g.setIndex(idx);
      var o2 = new T.Mesh(g, M.gutStr); o2.castShadow = false; o2.frustumCulled = false; o2.userData.keep = 1; harp.add(o2);
      o2.set = function (amp, ph) { for (var q2 = 0; q2 <= n; q2++) { var u = q2 / n, e = Math.sin(Math.PI * u), dx = e * amp * Math.sin(ph), dz = e * amp * .6 * Math.cos(ph * 1.19); for (var j2 = 0; j2 < RS; j2++) { var w = (q2 * RS + j2) * 3; pos[w] = a.x + (b.x - a.x) * u + dx + nor[w] * rad; pos[w + 1] = a.y + len * u; pos[w + 2] = a.z + dz + nor[w + 2] * rad; } } g.attributes.position.needsUpdate = true; };
      o2.set(0, 0); return o2;
    }
    var strings = [], NS = 11, np = V3(0, 0, 0);
    for (i = 0; i < NS; i++) { var sx = .562 + i * .0268, best = 0, bd = 9; for (k = 0; k <= 80; k++) { neckCu.getPoint(k / 80, np); var dd = Math.abs(np.x - (sx - .8)); if (dd < bd) { bd = dd; best = np.y; } }
      var s = vstring(P(sx, HY, ZT + .05), V3(sx - .8, best - .008, .225 - HY), .0015 - i * .00006); s.u = (sx - HX0) / HW; strings.push(s); }
    var strZ = zone('play', HW, HH, P(HX0 + HW / 2, HY - .008, HZ0 + HH / 2), 'front', { src: 0, part: 'string' }); strings.forEach(function (q) { q.userData.zone = strZ; }); harpM.userData.zone = strZ; ribM.userData.zone = strZ;
    // the string zone is a rectangle, but the harp's top is the sloping collarbone: above it the pointer belongs to whatever is behind (the iron plate)
    (function () { var nk = [], q2 = V3(0, 0, 0); for (var k2 = 0; k2 <= 60; k2++) { neckCu.getPoint(k2 / 60, q2); nk.push([q2.x, q2.y]); } nk.sort(function (a, b) { return a[0] - b[0]; });
      var lp = V3(0, 0, 0); strZ.userData.clip = function (wp) { harp.worldToLocal(lp.copy(wp)); var x = lp.x, top = nk[nk.length - 1][1];
        if (x <= nk[0][0]) top = nk[0][1]; else for (var k3 = 1; k3 < nk.length; k3++) if (x <= nk[k3][0]) { var f = (x - nk[k3 - 1][0]) / (nk[k3][0] - nk[k3 - 1][0] || 1); top = nk[k3 - 1][1] + (nk[k3][1] - nk[k3 - 1][1]) * f; break; }
        return lp.y < top + .018; }; })();
    // the knuckle slide on its sinew, across the foot of the strings
    c.wire(P(.515, HY - .028, ZT + .098), P(.88, HY - .028, ZT + .098), .0014, M.stalk);
    var bar = add(S.vertebra(T, .5, 2), M.bone); bar.rotation.z = Math.PI / 2; var barX = .5;
    var barZ = zone('bar', .07, .08, P(HX0 + HW * barX, HY - .04, ZT + .1), 'front', { part: 'bar' }); bar.userData.zone = barZ;
    // the lodestone: black iron-stone lashed to a finger bone
    var puck = new T.Group(); rig.add(puck); var lodeM = mat({ color: 0x14110f, roughness: .34, metalness: .7, emissive: 0x58ffc0, emissiveIntensity: 0, flatShading: true }, { rust: .3, grime: .3, bump: .0007, bfreq: 300 });
    var lodeG = new T.IcosahedronGeometry(.02, 1); (function () { var p = lodeG.attributes.position; for (var q = 0; q < p.count; q++) { var x = p.getX(q), y = p.getY(q), z = p.getZ(q), f = .75 + .5 * S.fbm3(x * 60 + 3, y * 60, z * 60, 2); p.setXYZ(q, x * f * 1.25, y * f * .8, z * f); } lodeG.computeVertexNormals(); })();
    add(lodeG, lodeM, puck).position.set(.03, .012, 0); var ph1 = add(S.phalanx(T, .075, .0075), M.bone, puck); ph1.rotation.z = Math.PI / 2; ph1.position.set(.012, .012, 0);
    var PUCK0 = P(.62, .255, ZT + .004); puck.position.copy(PUCK0); puck.rotation.y = .5;
    var puckZ = zone('puck', .12, .08, P(.62, .255, ZT + .04), 'top', { part: 'puck' }); tag(puck, puckZ);
    blob(.69, HY, .48, .14);

    /* ---------- (9) a grave slate with someone's scratchings, and a shard of bone to drag over it ---------- */
    var slc = S.canvas(512, 256); (function () { var x = slc.getContext('2d'), rr = S.rng(11), q, j;
      // dark blue-grey slate, slightly uneven
      x.fillStyle = '#161c22'; x.fillRect(0, 0, 512, 256);
      for (q = 0; q < 90; q++) { x.fillStyle = 'rgba(' + (18 + rr() * 22 | 0) + ',' + (24 + rr() * 22 | 0) + ',' + (28 + rr() * 24 | 0) + ',' + (.08 + rr() * .18) + ')'; x.beginPath(); x.ellipse(rr() * 512, rr() * 256, 20 + rr() * 50, 12 + rr() * 30, rr() * 3, 0, TAU); x.fill(); }
      for (q = 0; q < 3200; q++) { x.fillStyle = 'rgba(190,200,205,' + rr() * .055 + ')'; x.fillRect(rr() * 512, rr() * 256, 1.6, 1.6); }
      // pale grey engraved lettering, no name, no dates
      x.textAlign = 'center'; x.textBaseline = 'middle';
      var engrave = function (text, y, font) {
        x.font = font;
        x.fillStyle = 'rgba(6,8,10,.9)'; x.fillText(text, 257.6, y + 1.6);
        x.fillStyle = 'rgba(210,216,220,.28)'; x.fillText(text, 254.6, y - 1.2);
        x.fillStyle = 'rgba(168,176,180,.72)'; x.fillText(text, 256, y);
      };
      engrave('IN LOVING MEMORY', 100, '600 36px Georgia, "Liberation Serif", "Times New Roman", serif');
      engrave('Forever in our hearts', 160, 'italic 26px Georgia, "Liberation Serif", "Times New Roman", serif');
      // scratches, chips and grime so it looks old and defaced
      x.lineCap = 'round';
      for (q = 0; q < 28; q++) {
        x.strokeStyle = 'rgba(8,10,12,' + (.18 + rr() * .45) + ')'; x.lineWidth = .4 + rr() * 1.8;
        x.beginPath(); x.moveTo(rr() * 512, rr() * 256);
        x.bezierCurveTo(rr() * 512, rr() * 256, rr() * 512, rr() * 256, rr() * 512, rr() * 256); x.stroke();
        if (rr() < .45) { x.strokeStyle = 'rgba(200,206,210,' + (.08 + rr() * .16) + ')'; x.lineWidth = .4; x.stroke(); }
      }
      for (q = 0; q < 12; q++) {
        var cx = 30 + rr() * 452, cy = 16 + rr() * 224, cr = 3 + rr() * 9;
        var cg = x.createRadialGradient(cx, cy, 0, cx, cy, cr);
        cg.addColorStop(0, 'rgba(8,10,12,.7)'); cg.addColorStop(1, 'rgba(8,10,12,0)');
        x.fillStyle = cg; x.beginPath(); x.arc(cx, cy, cr, 0, TAU); x.fill();
      }
      for (q = 0; q < 7; q++) { x.fillStyle = 'rgba(30,22,16,' + (.08 + rr() * .18) + ')'; x.beginPath(); x.ellipse(rr() * 512, 200 + rr() * 56, 40 + rr() * 80, 10 + rr() * 20, rr(), 0, TAU); x.fill(); }
      // a couple of sharp gouges across the lettering
      x.strokeStyle = 'rgba(10,12,14,.55)'; x.lineWidth = 1.2;
      x.beginPath(); x.moveTo(80, 88); x.lineTo(430, 118); x.stroke();
      x.strokeStyle = 'rgba(190,196,200,.18)'; x.lineWidth = .6; x.stroke();
      x.strokeStyle = 'rgba(10,12,14,.4)'; x.lineWidth = .9;
      x.beginPath(); x.moveTo(140, 40); x.lineTo(200, 210); x.stroke();
    })();
    var slateF = function (x, y, z) { var d = S.rbox(x, y, z, 0, 0, 0, .132, .0058, .067, .003); d = S.smax(d, -S.ell(x, y, z, .135, .004, .07, .03, .02, .026), .003); d = S.smax(d, -S.ell(x, y, z, -.13, .004, -.05, .016, .02, .03), .003); return d + (S.fbm3(x * 40, y * 40, z * 40, 2) - .5) * .0012; };
    var slate = add(setUv(S.nets(T, slateF, [-.14, -.01, -.075, .14, .01, .075], .0035, { ao: .5 }), function (x, y, z) { return [(x + .132) / .264, (.067 - z) / .134]; }), mat({ map: ctex(slc, true), roughness: .86, vertexColors: true }, { blood: .08, bscale: 20, grime: .38, bump: .00055, bfreq: 180 })); slate.position.copy(P(.66, .16, ZT + .0075)); slate.rotation.y = .04;
    var chalk = add(S.phalanx(T, .05, .0055), M.bone); chalk.rotation.z = Math.PI / 2; chalk.rotation.y = .5; chalk.position.copy(P(.745, .25, ZT + .007));
    var slateZ = zone('play', .26, .13, P(.66, .16, ZT + .016), 'top', { src: 3, part: 'slate', set: function (Pm, e) { return { 'glass.surface': 3, 'glass.contact': e && e.altKey ? 0 : 2 }; } }); slate.userData.zone = slateZ; chalk.userData.zone = slateZ;

    /* ---------- (6) four rusted blades under an iron strap nailed to the front edge ---------- */
    var strapF = function (x, y, z) { return S.rbox(x, y, z, 0, .012, 0, .166, .012, .034, .005) + (S.fbm3(x * 30, y * 30, z * 30, 2) - .5) * .004; };
    var clamp = add(S.nets(T, strapF, [-.18, -.004, -.045, .18, .032, .045], .0042, { ao: 1, color: function (x, y, z, occ) { var e = .35 + .65 * occ; return [e * .5, e * .47, e * .45]; } }), M.ironV); clamp.position.copy(P(.66, .035, ZT + .003));
    var clampS = [.53, .66, .79].map(function (x) { var n = add(S.tint(T, new T.SphereGeometry(.011, 10, 6, 0, TAU, 0, Math.PI / 2), ironC), M.ironV); n.scale.y = .6; n.position.copy(P(x, .035, ZT + .026)); return n; });
    var RX = [.535, .605, .675, .745], RF = [1, .75, .55, .4], bladeW = [.036, .03, .04, .026];
    var rulers = RX.map(function (x, j) { var g = new T.Group(); g.position.copy(P(x, .06, ZT + .004)); rig.add(g);
      // a blade one unit long toward the player: a spine and an edge, a clipped point (each one a different old knife)
      var pg = new T.PlaneGeometry(1, 1, 4, 14), pa = pg.attributes.position, w = bladeW[j]; for (var q = 0; q < pa.count; q++) { var u = pa.getX(q) + .5, v = pa.getY(q) + .5, tp = Math.max(0, (v - (j % 2 ? .7 : .82)) / (j % 2 ? .3 : .18)), wd = w * (1 - .12 * v) * (1 - Math.pow(tp, j % 2 ? 1.4 : .8)); pa.setXYZ(q, (u - .5) * wd + (j % 2 ? 0 : w * .5 * tp * tp) + (u > .99 ? Math.sin(v * 90 + j) * .0006 : 0), (u - .5) * (u - .5) * -.004, v); }
      pg.computeVertexNormals();
      (function () { var col = new Float32Array(pa.count * 3), i2; for (i2 = 0; i2 < pa.count; i2++) { var uu = pa.getX(i2), edge = Math.pow(Math.min(1, Math.abs(uu) * 2 / Math.max(1e-4, w)), 3); var e = .5 + .5 * edge; col[i2 * 3] = e; col[i2 * 3 + 1] = e; col[i2 * 3 + 2] = e; } pg.setAttribute('color', new T.BufferAttribute(col, 3)); })();
      var b = add(pg, M.blade, g); g.userData.b = b; return g; });
    var rulZ = zone('bowtap', .30, .32, P(.64, -.16, ZT + .004), 'top', { part: 'rulers', items: function () { var V = H.v2(); return RX.map(function (x, q) { var L = Math.round(Math.max(6, V.clampL * RF[q]) * 10) / 10; return { u: (x - .49) / .30, bow: { 'bowed.object': 0, 'bowed.length': L }, tap: { 'struck.object': 0, 'struck.length': L } }; }); } });
    rulers.forEach(function (g) { tag(g, rulZ); });
    var clampZ = zone('clamp', .34, .07, P(.66, .035, ZT + .04), 'top', { part: 'clamp' }); clamp.userData.zone = clampZ; clampS.forEach(function (m) { m.userData.zone = clampZ; });

    /* ---------- (9) the black mirror in an iron frame; (10) the skull bowl on its ring, the bleeding spout over it, a bottle ---------- */
    var MX0 = .85, MX1 = 1.05, MY0 = .05, MY1 = .235, mfr = [c.box(MX0, MY0, ZT, MX1, MY0 + .013, ZT + .013, M.iron), c.box(MX0, MY1 - .013, ZT, MX1, MY1, ZT + .013, M.iron), c.box(MX0, MY0 + .013, ZT, MX0 + .013, MY1 - .013, ZT + .013, M.iron), c.box(MX1 - .013, MY0 + .013, ZT, MX1, MY1 - .013, ZT + .013, M.iron)];
    var pane = add(new T.BoxGeometry(MX1 - MX0 - .022, .005, MY1 - MY0 - .022), mat({ color: 0x080706, roughness: .32, metalness: 0, clearcoat: .28, clearcoatRoughness: .42, envMapIntensity: .7 }, { blood: .2, bscale: 30, grime: .8, bump: .00012, bfreq: 90 })); pane.position.copy(P((MX0 + MX1) / 2, (MY0 + MY1) / 2, ZT + .0075)); pane.castShadow = false;
    var paneZ = zone('play', .2, .185, P(.95, .1425, ZT + .014), 'top', { src: 3, part: 'pane', set: function (Pm, e) { return { 'glass.surface': 0, 'glass.contact': e && e.altKey ? 2 : 0 }; } }); pane.userData.zone = paneZ; mfr.forEach(function (m) { m.userData.zone = paneZ; });
    var BS = .86, BWX = 1.15, BWY = .13, bowlY = ZT + .01, bowlM = mat({ color: 0xb09c78, roughness: .68, vertexColors: true, clearcoat: .12, clearcoatRoughness: .55, envMapIntensity: .8 }, { blood: .2, bscale: 16, grime: .5, bump: .0003, bfreq: 190 });
    var bowl = add(S.skullBowl(T), bowlM); bowl.scale.setScalar(BS); bowl.position.copy(P(BWX, BWY, bowlY)); bowl.rotation.z = .035;
    var ring = add(S.tint(T, new T.TorusGeometry(.036, .0065, 8, 28), ironC), M.ironV); ring.rotation.x = Math.PI / 2; ring.position.copy(P(BWX, BWY, ZT + .0075));
    // the inside of the bowl at a height above its foot (the sculpt's own numbers): half-widths across and front to back
    var bowlR = function (y) { var R = .085, q = Math.sqrt(Math.max(0, 1 - Math.pow((y - R * .93) / (R * .93 - .0052), 2))); return [(R * .96 - .0058) * q * BS, (R * 1.1 - .0058) * q * BS]; };
    var liq = new T.Mesh(new T.CircleGeometry(1, 40), M.blood); liq.rotation.x = -Math.PI / 2; liq.userData.noPick = 1; liq.receiveShadow = true; rig.add(liq);
    var glint = new T.Sprite(new T.SpriteMaterial({ map: glowT, color: 0xffd0a0, transparent: true, blending: T.AdditiveBlending, depthWrite: false, fog: false })); glint.scale.set(.03, .03, 1); glint.visible = false; glint.renderOrder = 6; rig.add(glint);
    var wineZ = zone('play', .2, .22, P(BWX, BWY, bowlY + .066 * BS), 'top', { src: 3, part: 'wine', set: function (Pm) { return { 'glass.surface': 1, 'glass.contact': 1, 'glass.wet': Math.max(.8, Pm['glass.wet']) }; } }); bowl.userData.zone = wineZ; ring.userData.zone = wineZ;
    // a proper hose: sits on the slab, goes over the back lip with a clear bend, then hangs down behind the altar.
    // Radius ~10 mm, not a hairline. Clips hold it to the top; a collar sits on the lip.
    var hoseR = .010, hoseM = mat({ color: 0x3a2218, roughness: .62, vertexColors: true, clearcoat: .08, clearcoatRoughness: .7 }, { blood: .12, bscale: 18, grime: .45, bump: .0005, bfreq: 220, seed: 8 });
    var hoseCol = [.28, .16, .11];
    var hosePts = [
      [1.07, .62, -.28], [1.06, .58, -.16], [1.055, .55, -.04],          // hanging drop behind the altar
      [1.05, .53, .022], [1.05, .512, .028],                             // up and over the bullnose, clear of the edge
      [1.05, .49, .014], [1.07, .45, .013], [1.11, .36, .013], [1.13, .30, .013],
      [1.128, .28, .04], [1.122, .26, .10], [1.12, .26, .15]              // rise into the standpipe, behind the bowl
    ].map(function (q) { return P(q[0], q[1], ZT + q[2]); });
    var hose = add(S.sweep(T, hosePts, 180, 12, function (u) { return hoseR * (u < .1 || u > .94 ? 1.16 : 1); }, { color: hoseCol }), hoseM);
    var lip = add(S.tint(T, new T.TorusGeometry(hoseR + .004, .0034, 8, 16), ironC), M.ironV); lip.position.copy(P(1.05, .512, ZT + .028));
    [[1.07, .45], [1.13, .32]].forEach(function (q) {
      add(S.sweep(T, [V3(-.014, 0, 0), V3(-.012, hoseR + .007, 0), V3(0, hoseR + .009, 0), V3(.012, hoseR + .007, 0), V3(.014, 0, 0)].map(function (p) { return P(q[0], q[1], ZT).add(p); }), 16, 6, function () { return .0026; }, { color: ironC }), M.ironV);
    });
    // vertical standpipe and an up-down tap (a rising stem with a cross-handle) over the bowl; hold still fills, the handle lifts when it runs
    var TAP = P(1.12, .26, ZT + .015), gtap = new T.Group(); gtap.position.copy(TAP); rig.add(gtap);
    add(S.tint(T, new T.CylinderGeometry(.016, .018, .01, 14), ironC), M.ironV, gtap).position.set(0, .005, 0);             // flange on the slab
    add(S.tint(T, new T.CylinderGeometry(.011, .012, .155, 14), ironC), M.ironV, gtap).position.set(0, .085, 0);            // the standpipe
    add(S.tint(T, new T.TorusGeometry(.013, .003, 8, 14), ironC), M.ironV, gtap).position.set(0, .155, 0); add(S.tint(T, new T.TorusGeometry(.013, .003, 8, 14), ironC), M.ironV, gtap).position.set(0, .112, 0);
    var stem = new T.Group(); stem.position.set(0, .162, 0); gtap.add(stem);
    add(S.tint(T, new T.CylinderGeometry(.0045, .0045, .05, 10), ironC), M.ironV, stem).position.set(0, .02, 0);
    var handle = add(S.tint(T, new T.CylinderGeometry(.004, .004, .056, 8), ironC), M.ironV, stem); handle.rotation.z = Math.PI / 2; handle.position.set(0, .046, 0);
    add(S.tint(T, new T.SphereGeometry(.0065, 8, 6), ironC), M.ironV, stem).position.set(-.028, .046, 0);
    add(S.tint(T, new T.SphereGeometry(.0065, 8, 6), ironC), M.ironV, stem).position.set(.028, .046, 0);
    // gooseneck spout, ending above the bowl rim
    // gooseneck reaches forward over the rim; the standpipe itself stays behind the bowl
    var spoutPts = [V3(0, .13, 0), V3(0, .175, .025), V3(.012, .19, .055), V3(.024, .185, .085), V3(.03, .155, .105)].map(function (p) { return p.clone(); });
    add(S.sweep(T, spoutPts, 32, 8, function (u) { return .0064 * (1 - .15 * u); }, { color: ironC }), M.ironV, gtap);
    add(S.tint(T, new T.CylinderGeometry(.0055, .007, .014, 10), ironC), M.ironV, gtap).position.copy(spoutPts[4]).add(V3(0, -.007, .004));
    var gtapZ = zone('hold', .1, .12, P(1.12, .25, ZT + .19), 'front', { part: 'gtap' }); tag(gtap, gtapZ);
    var stream = new T.Mesh(new T.CylinderGeometry(.0022, .003, 1, 8), M.blood); stream.visible = false; stream.userData.noPick = 1; rig.add(stream);
    var SPOUT = TAP.clone().add(spoutPts[4]);   // gtap is unrotated, so world = origin + local
    var botM = mat({ color: 0x0b1409, roughness: .22, metalness: 0, clearcoat: .45, clearcoatRoughness: .28, envMapIntensity: 1.0, transparent: true, opacity: .93 }, { blood: .2, bscale: 30, grime: .7, bump: .0001, bfreq: 80 });
    var bot = add(new T.LatheGeometry([[0, 0], [.024, 0], [.025, .008], [.025, .09], [.021, .108], [.01, .122], [.0085, .15], [.0095, .156], [.007, .158], [0, .158]].map(function (q) { return new T.Vector2(q[0], q[1]); }), 28), botM); bot.position.copy(P(1.04, .24, ZT + .002));
    var cork = add(S.tint(T, new T.CylinderGeometry(.0075, .0065, .018, 10), [.4, .1, .08]), M.wax.clone()); cork.material.color.setHex(0x7a1612); cork.position.copy(P(1.04, .24, ZT + .166));
    var botZ = zone('play', .06, .17, P(1.04, .21, ZT + .085), 'front', { src: 3, part: 'bottle', set: function (Pm, e) { return { 'glass.surface': 2, 'glass.contact': e && e.altKey ? 0 : 1, 'glass.wet': Math.max(.8, Pm['glass.wet']) }; } }); bot.userData.zone = botZ; cork.userData.zone = botZ;
    blob(BWX, BWY, .2, .22); blob(1.04, .24, .09, .09); blob(.95, .1425, .26, .24);

    /* ---------- (11) the drum: a hide stitched shut along an old tear, laced over a hoop ---------- */
    // nudged slightly toward the viewer so the hoop clears the hurdy-gurdy's near leg
    var drum = new T.Group(); drum.position.copy(P(1.36, .12, ZT)); rig.add(drum);
    var hideC = S.canvas(512, 512), hideH = S.canvas(512, 512); (function () {
      var x = hideC.getContext('2d'), h = hideH.getContext('2d'), rr = S.rng(77), q, g = x.createRadialGradient(256, 240, 30, 256, 256, 262); g.addColorStop(0, '#c9a47a'); g.addColorStop(.6, '#b08a62'); g.addColorStop(.9, '#7a5638'); g.addColorStop(1, '#4a3020'); x.fillStyle = g; x.fillRect(0, 0, 512, 512);
      h.fillStyle = '#808080'; h.fillRect(0, 0, 512, 512);
      for (q = 0; q < 260; q++) { x.fillStyle = 'rgba(' + (rr() < .5 ? '90,50,30' : '220,190,150') + ',' + (rr() * .1) + ')'; x.beginPath(); x.arc(rr() * 512, rr() * 512, 6 + rr() * 50, 0, TAU); x.fill(); }       // blotches of the animal
      for (q = 0; q < 2400; q++) { x.fillStyle = 'rgba(60,34,20,' + (rr() * .28) + ')'; x.fillRect(rr() * 512, rr() * 512, 1.4, 1.4); }                                                                  // follicles
      for (q = 0; q < 9; q++) { x.strokeStyle = 'rgba(110,40,40,' + (.1 + rr() * .14) + ')'; x.lineWidth = 1 + rr() * 2; x.beginPath(); var vx = rr() * 512, vy = rr() * 512; x.moveTo(vx, vy); for (var j = 0; j < 6; j++) { vx += (rr() - .5) * 110; vy += (rr() - .5) * 110; x.lineTo(vx, vy); } x.stroke(); }   // veins
      for (q = 0; q < 70; q++) { var a = rr() * TAU; h.strokeStyle = 'rgba(' + (rr() < .5 ? '255,255,255' : '0,0,0') + ',.1)'; h.lineWidth = 2 + rr() * 5; h.beginPath(); h.moveTo(256 + Math.cos(a) * 150, 256 + Math.sin(a) * 150); h.lineTo(256 + Math.cos(a + .05) * 262, 256 + Math.sin(a + .05) * 262); h.stroke(); }   // drawn tight at the rim
      // the seams: a puckered ridge with thread crossing it
      var seam = function (pts, n) { var cu = new T.CatmullRomCurve3(pts.map(function (p2) { return V3(p2[0], p2[1], 0); })), pp = V3(0, 0, 0), tg = V3(0, 0, 0);
        [[x, 'rgba(50,22,14,.75)', 3.2], [h, 'rgba(0,0,0,.8)', 4], [h, 'rgba(255,255,255,.25)', 14]].forEach(function (L2, li) { var cx2 = L2[0]; cx2.strokeStyle = L2[1]; cx2.lineWidth = L2[2]; cx2.lineCap = 'round'; if (li === 2) cx2.globalCompositeOperation = 'lighter'; cx2.beginPath(); for (var j = 0; j <= 60; j++) { cu.getPoint(j / 60, pp); if (j) cx2.lineTo(pp.x, pp.y); else cx2.moveTo(pp.x, pp.y); } cx2.stroke(); cx2.globalCompositeOperation = 'source-over'; });
        for (var j = 0; j < n; j++) { var u = (j + .5) / n; cu.getPoint(u, pp); cu.getTangent(u, tg); var nx = -tg.y, ny = tg.x, L = 11 + rr() * 6, sk = (rr() - .5) * 7;
          [[x, 'rgba(26,14,10,.95)', 2.6], [h, 'rgba(255,255,255,.9)', 3.4]].forEach(function (L2) { L2[0].strokeStyle = L2[1]; L2[0].lineWidth = L2[2]; L2[0].lineCap = 'round'; L2[0].beginPath(); L2[0].moveTo(pp.x - nx * L + tg.x * sk, pp.y - ny * L + tg.y * sk); L2[0].lineTo(pp.x + nx * L - tg.x * sk, pp.y + ny * L - tg.y * sk); L2[0].stroke(); });
          [-1, 1].forEach(function (sd) { x.fillStyle = 'rgba(40,10,8,.8)'; x.beginPath(); x.arc(pp.x + sd * nx * L, pp.y + sd * ny * L, 2.6, 0, TAU); x.fill(); h.fillStyle = 'rgba(0,0,0,.9)'; h.beginPath(); h.arc(pp.x + sd * nx * L, pp.y + sd * ny * L, 3.4, 0, TAU); h.fill(); }); } };
      seam([[70, 150], [170, 205], [260, 215], [350, 275], [455, 300]], 17); seam([[290, 232], [300, 330], [262, 420], [270, 490]], 9); seam([[110, 360], [160, 380], [200, 430]], 4);
      var gb = x.createRadialGradient(330, 170, 4, 330, 170, 90); gb.addColorStop(0, 'rgba(70,6,4,.8)'); gb.addColorStop(.6, 'rgba(70,10,6,.4)'); gb.addColorStop(1, 'rgba(70,10,6,0)'); x.fillStyle = gb; x.fillRect(0, 0, 512, 512);
      var ge = x.createRadialGradient(256, 256, 215, 256, 256, 258); ge.addColorStop(0, 'rgba(30,14,8,0)'); ge.addColorStop(1, 'rgba(30,14,8,.75)'); x.fillStyle = ge; x.fillRect(0, 0, 512, 512);
    })();
    var crk = tx.crinkle.normalMap, headM = mat({ map: ctex(hideC, true), normalMap: S.normalFromHeight(T, hideH, 2.6), roughness: .62, sheen: .5, sheenRoughness: .5, sheenColor: new T.Color(0xffd8b0), clearcoat: .12, clearcoatRoughness: .5 }, { blood: .24, bscale: 14, grime: .25, bump: .0006, bfreq: 480 });
    var head = add(new T.CircleGeometry(.104, 48), headM, drum); head.rotation.x = -Math.PI / 2; head.position.y = .056;
    var hoopP = [[.094, 0], [.108, 0], [.11, .01], [.108, .05], [.104, .056], [.094, .05]].map(function (q) { return new T.Vector2(q[0], q[1]); });
    var hoop = add(new T.LatheGeometry(hoopP, 44), mat(Object.assign({ color: 0x6a4a36, roughness: 1 }, beamT), { blood: .25, bscale: 14, grime: .6, bump: .0008, bfreq: 300 }), drum);
    var skirt = add(S.tint(T, new T.CylinderGeometry(.1085, .111, .03, 44, 3, true), [.62, .46, .32]), M.hide, drum); skirt.position.y = .042; (function () { var p = skirt.geometry.attributes.position; for (var q = 0; q < p.count; q++) if (p.getY(q) < -.01) p.setY(q, p.getY(q) + .008 * S.n3(Math.atan2(p.getZ(q), p.getX(q)) * 9, 3, 1)); })();
    var lace = []; for (i = 0; i < 16; i++) { var la0 = i / 16 * TAU, la1 = (i + 1) / 16 * TAU, up = i % 2 ? .034 : .004, dn = i % 2 ? .004 : .034; lace.push({ g: S.sweep(T, [V3(Math.cos(la0) * .112, up, Math.sin(la0) * .112), V3(Math.cos((la0 + la1) / 2) * .1135, (up + dn) / 2, Math.sin((la0 + la1) / 2) * .1135), V3(Math.cos(la1) * .112, dn, Math.sin(la1) * .112)], 6, 5, function () { return .0014; }, { color: [.4, .26, .16] }) }); }
    for (i = 0; i < 8; i++) { var pa2 = (i * 2 + 1) / 16 * TAU; lace.push({ g: S.phalanx(T, .03, .0042), m: m4(Math.cos(pa2) * .116, .0, Math.sin(pa2) * .116, 0, 0, 0) }); }
    add(S.join(T, lace), M.sinew, drum);
    var drumZ = zone('knock', .21, .21, P(1.36, .12, ZT + .058), 'top', { part: 'drum', hz: 62, obj: 4 }); tag(drum, drumZ);
    blob(1.36, .12, .3, .3);

    /* ---------- (12) the ossuary drawer: teeth and knucklebones, opened by a round onyx knob ---------- */
    var drawer = new T.Group(); rig.add(drawer);
    c.box(.878, .004, .638, 1.142, .022, .782, M.woodB, drawer); c.box(.885, .022, .645, 1.135, .30, .652, M.woodB, drawer); c.box(.885, .022, .652, .893, .30, .765, M.woodB, drawer); c.box(1.127, .022, .652, 1.135, .30, .765, M.woodB, drawer); c.box(.885, .292, .652, 1.135, .30, .765, M.woodB, drawer);
    // three kinds of thing in the drawer; the engine moves up to sixty pieces and each shows as one of them
    var toothG = S.join(T, [{ g: S.tint(T, new T.SphereGeometry(.5, 8, 6), [.9, .86, .72]), m: m4(0, .28, 0, 0, 0, 0, 1, .75, .8) }, { g: S.tint(T, new T.ConeGeometry(.3, 1.1, 6), [.7, .56, .36]), m: m4(-.16, -.45, 0, Math.PI, 0, .12) }, { g: S.tint(T, new T.ConeGeometry(.26, .95, 6), [.7, .56, .36]), m: m4(.2, -.4, 0, Math.PI, 0, -.16) }]);
    var knuG = S.phalanx(T, 2.6, .5), vtG = S.vertebra(T, 26, 4);
    var junkI = [[toothG, M.bone], [knuG, M.bone], [vtG, M.bone]].map(function (q) { var im = new T.InstancedMesh(q[0], q[1], 60); im.castShadow = true; im.receiveShadow = true; im.instanceMatrix.setUsage(T.DynamicDrawUsage); im.frustumCulled = false; drawer.add(im); return im; });
    var dummy = new T.Object3D(), rest = [], jr = S.rng(7); for (i = 0; i < 60; i++) rest.push(.05 + jr() * .9, .05 + jr() * .9, .01 + jr() * .02);
    var drawerZ = zone('drawer', .27, .15, P(1.01, -.006, .71), 'front', { part: 'drawer' }); drawer.add(drawerZ); tag(drawer, drawerZ);
    var junkZ = zone('play', .24, .2, P(1.01, -.1, .8), 'top', { src: 6, part: 'junk', off: true });
    var onyxM = mat({ color: 0x0c0e10, roughness: .3, metalness: .06, clearcoat: .32, clearcoatRoughness: .34, envMapIntensity: .4, sheen: .12, sheenColor: new T.Color(0x1a2220) });
    var knob = new T.Group(); knob.position.copy(P(1.01, -.002, .7)); drawer.add(knob);
    var kStem = add(S.tint(T, new T.CylinderGeometry(.005, .0055, .014, 10), ironC), M.ironV, knob); kStem.rotation.x = Math.PI / 2; kStem.position.set(0, 0, .007);
    add(new T.SphereGeometry(.016, 24, 18), onyxM, knob).position.set(0, 0, .018);

    /* ---------- (4)(5) the wheel: spoked with bones, its axle run through the temples of a skull on a spike; two drone guts ---------- */
    var WX = 1.47, WY = .2825, WZ = ZT + .158, WR = .128, WYAW = .42;
    // the whole mechanism is turned a little on the altar, so the wheel shows its face to the player; wg's x runs along the axle
    var wg = new T.Group(); wg.position.copy(P(WX, WY, 0)); wg.rotation.y = WYAW; rig.add(wg);
    var wbox = function (x0, x1, y0, y1, z0, z1, m) { var b = c.mesh(new T.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), m, wg); b.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); return b; };
    [-.078, .078].forEach(function (x) { wbox(x - .011, x + .011, ZT, WZ + .012, -.02, .02, M.iron); });
    var wheel = new T.Group(); wheel.position.set(0, WZ, 0); wg.add(wheel);
    var rimM = mat(Object.assign({ color: 0x5a4030, roughness: 1 }, beamT), { blood: .28, bscale: 14, grime: .6, bump: .0009, bfreq: 300 });
    var rim1 = add(new T.TorusGeometry(WR - .014, .014, 10, 56), rimM, wheel); rim1.rotation.y = Math.PI / 2; rim1.scale.z = 1.25;
    [-1, 1].forEach(function (sd) { var b = add(S.tint(T, new T.TorusGeometry(WR - .003, .0035, 6, 56), ironC), M.ironV, wheel); b.rotation.y = Math.PI / 2; b.position.x = sd * .0125; });
    var hub = add(S.tint(T, new T.CylinderGeometry(.021, .021, .05, 14), ironC), M.ironV, wheel); hub.rotation.z = Math.PI / 2;
    var spk = S.bone(T, WR - .03, .0058, 2, 13), spokes = []; for (i = 0; i < 6; i++) spokes.push({ g: spk, m: new T.Matrix4().makeRotationX(i * TAU / 6).multiply(new T.Matrix4().makeTranslation(0, .014, 0)) }); add(S.join(T, spokes), M.bone, wheel);
    var SKA = .175, CRA = .31, axle = c.mesh(new T.CylinderGeometry(.0068, .0068, CRA + .095, 10), M.iron, wg); axle.rotation.z = Math.PI / 2; axle.position.set((CRA - .095) / 2, WZ, 0);
    var skull = add(skullG, skullM, wg); skull.scale.setScalar(.78); skull.position.set(SKA, WZ - .06, 0); skull.rotation.set(.08, -WYAW - .22, .05);
    var spike = add(S.sweep(T, [V3(SKA, ZT - .002, 0), V3(SKA + .002, ZT + .12, 0), V3(SKA - .004, ZT + .275, -.01)], 24, 7, function (u) { return .0085 * (1 - u * .86); }, { color: ironC }), M.ironV, wg);
    add(S.tint(T, new T.CylinderGeometry(.03, .036, .012, 8), ironC), M.ironV, wg).position.set(SKA, ZT + .006, 0);
    var crank = new T.Group(); crank.position.set(CRA, WZ, 0); wg.add(crank);
    add(S.tint(T, new T.BoxGeometry(.012, .125, .02), ironC), M.ironV, crank).position.set(0, .05, 0); var grip = add(S.bone(T, .085, .0085, 2, 17), M.bone, crank); grip.rotation.z = -Math.PI / 2; grip.position.set(-.004, .104, 0);
    var crankW = wg.localToWorld(V3(CRA - .04, WZ, 0)), crankZ = zone('play', .3, .34, crankW.clone().add(V3(0, 0, .05)), 'front', { src: 1, part: 'crank' }); tag(wg, crankZ);
    var DSL = Math.atan2(WZ + WR - (ZT + .046), WX - .925);
    // drones: bone hitch at the nut, a short wrap over the wheel rim (the wheel bows them
    // and is not an anchor — it turns under the guts), then a taut run to a tailpiece
    // on the rear frame post, toward the skull, at rail height.
    var Rstr = WR + .0016;
    wg.updateWorldMatrix(true, false);
    wbox(.078 - .014, .078 + .014, WZ + .012, WZ + .018, -.018, .018, M.iron);
    var tailHits = [-.007, .007].map(function (z) {
      var pin = add(S.tint(T, new T.CylinderGeometry(.0018, .0018, .016, 8), ironC), M.ironV, wg);
      pin.position.set(.078, WZ + .018 + .008, z);
      var eye = add(S.tint(T, new T.TorusGeometry(.004, .001, 5, 8), ironC), M.ironV, wg);
      eye.position.set(.078, WZ + .026, z); eye.rotation.z = Math.PI / 2;
      return wg.localToWorld(V3(.078, WZ + .026, z));
    });
    var drones = [.33, .355].map(function (y, di) {
      var d = new T.Group(); rig.add(d);
      var a = P(.925, y, ZT + .046);
      var nut = add(S.tint(T, new T.TorusGeometry(.0046, .00115, 5, 8), ironC), M.ironV); nut.position.copy(a); nut.rotation.z = Math.PI / 2;
      // sit the two guts side by side on the far half of the tyre (toward the post)
      var sx = .000 + di * .010;
      var aL = wg.worldToLocal(a.clone());
      var py = aL.y - WZ, pz = aL.z, dist = Math.hypot(py, pz);
      var phi = Math.atan2(pz, py), alpha = Math.acos(Math.min(.999, Rstr / Math.max(dist, Rstr + .001)));
      var cands = [phi + alpha, phi - alpha].map(function (th) { return Math.atan2(Math.sin(th), Math.cos(th)); });
      var thIn = Math.abs(cands[1]) < Math.abs(cands[0]) ? cands[1] : cands[0];
      var thOut = 0;
      var pts = [a], nArc = 8, t, th, lp;
      for (t = 0; t <= nArc; t++) {
        th = thIn + (thOut - thIn) * (t / nArc);
        var drift = Math.max(0, t / nArc - .55) / .45 * .01;
        lp = V3(sx + drift, WZ + Rstr * Math.cos(th), Rstr * Math.sin(th));
        pts.push(wg.localToWorld(lp));
      }
      pts.push(tailHits[di]);
      var path = new T.CurvePath();
      for (t = 0; t < pts.length - 1; t++) path.add(new T.LineCurve3(pts[t], pts[t + 1]));
      var gut = add(new T.TubeGeometry(path, 48, .0014, 5, false), M.gutStr, d);
      gut.castShadow = false; gut.frustumCulled = false;
      var wrap = add(S.tint(T, new T.TorusGeometry(.0036, .00115, 5, 8), [0.79, 0.66, 0.47]), M.gutStr, wg);
      wrap.position.copy(wg.worldToLocal(tailHits[di].clone())); wrap.rotation.z = Math.PI / 2;
      return d;
    });
    add(S.vertebra(T, .75, 2), M.bone).position.copy(P(.925, WY, ZT + .014)); c.cyl(.925, WY, ZT + .02, ZT + .05, .0055, M.boneB, null, 8);
    var dronZ = zone('play', .56, .075, P(1.20, WY, ZT + .046 + (1.20 - .925) * Math.tan(DSL) + .004), 'top', { src: 1, part: 'drones', set: { 'hurdy.melody': 1 }, restore: ['hurdy.melody'] }); dronZ.rotateOnWorldAxis(V3(0, 0, 1), DSL); drones.forEach(function (d) { tag(d, dronZ); });
    blob(WX, WY, .26, .16); blob(WX + SKA * Math.cos(WYAW), WY + SKA * Math.sin(WYAW), .2, .2);

    /* ---------- (15)(16) the gallows over the altar; the iron plate under the goat idol (the thunder sheet) ---------- */
    var GY = .455, GZ = .225 - GY, BARZ = 1.765;
    [-.06, 1.70].forEach(function (x) { var p = hewn(.027, .43, .027, .009, M.beam); p.position.set(x - .8, ZT + .425, GZ - .012); c.box(x - .045, GY - .03, ZT, x + .045, GY + .06, ZT + .02, M.iron); });
    var gbar = hewn(.96, .028, .03, .009, M.beam); gbar.position.set(.02, BARZ, GZ - .012);
    c.rod(P(-.06, GY + .01, 1.5), P(.2, GY + .01, BARZ - .02), .008, M.iron); c.rod(P(1.70, GY + .01, 1.5), P(1.5, GY + .01, BARZ - .02), .008, M.iron);
    var shC = S.canvas(512, 704), shx = shC.getContext('2d'), sheetMask, sheetMat;
    shx.fillStyle = '#000'; shx.fillRect(0, 0, 512, 704);
    (function () { var B3 = new S.Blood(shx, 31), q, rr = S.rng(31); for (q = 0; q < 8; q++) B3.dirt(rr() * 512, rr() * 704, 30 + rr() * 80, .1 + rr() * .2); })();
    // the rusted sheet from the first altar: its photo maps and material, hung larger so the flaking rust actually reads
    var SHX = 1.03, SHZ = 1.385, SW = .78, SH = .56, shG = new T.PlaneGeometry(SW, SH, 16, 12);
    shG.setAttribute('heUv', shG.attributes.uv.clone());
    (function () { var pa = shG.attributes.position; for (var q = 0; q < pa.count; q++) { var x = pa.getX(q), y = pa.getY(q); pa.setZ(q, (S.fbm3(x * 4.2, y * 3.6, 2.1, 3) - .5) * .012); } shG.computeVertexNormals(); })();
    shG.setAttribute('heUv', shG.attributes.uv.clone());
    if (!tx.aSheet) throw new Error('altar sheet is missing the aSheet texture set');
    var shT = {}; ['map', 'roughnessMap', 'normalMap'].forEach(function (q) { shT[q] = tx.aSheet[q].clone(); shT[q].repeat.set(1, 1); shT[q].needsUpdate = true; });
    sheetMask = ctex(shC);
    sheetMat = mat(Object.assign({ color: 0xb4a496, metalness: .5, roughness: 1, envMapIntensity: .9, side: T.DoubleSide }, shT), { blood: 0, bscale: 9, grime: .12, stretch: [1, .22, 1], bump: .0004, bfreq: 160, mask: sheetMask });
    var sheet = add(shG, sheetMat); sheet.position.copy(P(SHX, GY, SHZ)); var sh0 = Float32Array.from(shG.attributes.position.array);
    [SHX - .28, SHX + .28].forEach(function (x) { c.wire(P(x, GY, BARZ - .02), P(x, GY, SHZ + SH / 2 - .012), .0022, M.rustB); });
    var sheetZ = zone('sheet', SW, SH, P(SHX, GY - .006, SHZ), 'front', { part: 'sheet', hz: 88, obj: 2 }); sheet.userData.zone = sheetZ;
    // Bohnen "Goat Skull" (CC BY 4.0), European-mount: +Y up, face +Z, snout down; origin at the back of the cranium, horn-base height.
    // pinned flat to the front face of the top cross beam, centred. Scaled so the snout stays above the sheet.
    var goat = new T.Group();
    goat.position.set(.02, BARZ + .028, GZ - .012 + .03 + .016);
    goat.scale.setScalar(1.25);   // Bohnen skull, ~1.45× the first mount; snout stays in front of the sheet
    rig.add(goat);
    (function () {
      var gs = (window.HE_CRYPT && window.HE_CRYPT.models && window.HE_CRYPT.models.goatSkull) || null, gMesh;
      if (gs) {
        var maps = { color: 0xf2ebe0, roughness: 1, clearcoat: .08, clearcoatRoughness: .6 };
        if (gs.c) maps.map = img(gs.c, true);
        if (gs.r) maps.roughnessMap = img(gs.r);
        if (gs.n) { maps.normalMap = img(gs.n); }
        gMesh = add(meshG(gs), mat(maps, { blood: .1, bscale: 12, grime: .28, bump: .00018, bfreq: 160, seed: 3.2 }), goat);
        if (maps.normalMap) gMesh.material.normalScale.set(1.05, 1.05);
      } else {
        var gq = S.goatSkull(T);
        var gHead = add(gq.head, M.goatBone, goat), gHorns = add(gq.horns, M.goatHorn, goat);
        gHead.userData.noPick = 1; gHorns.userData.noPick = 1;
        gHead.traverse(function (o) { if (o.isMesh) o.userData.noPick = 1; });
        gHorns.traverse(function (o) { if (o.isMesh) o.userData.noPick = 1; });
        gMesh = gHead;
      }
      window.__heCryptPack = Object.assign(window.__heCryptPack || {}, { goatSkull: !!gs });
      goat.traverse(function (o) { o.userData.noPick = 1; });
    })();
    [-.016, .016].forEach(function (nx) {
      var nail = add(S.tint(T, new T.CylinderGeometry(.0022, .0022, .04, 8), ironC), M.ironV, goat);
      nail.rotation.x = Math.PI / 2; nail.position.set(nx, .006, .01); nail.userData.noPick = 1;
    });

    /* ---------- (13) two rusty coils stretched horizontally across the front, right of the drawer and above the serpent ---------- */
    var SPR = { n: 28, R: .011, w: .0016, x0: .185, seg: 10 }, springs = [], sprG = [];
    var SPRX = 1.38, SPRY = -.012, SPRZ = [.695, .765];
    function springPost(ax, ay, az) {
      var base = P(ax, .0148, az), tip = P(ax, ay, az);
      c.rod(base, tip, .0032, M.ironV);
      var eye = add(S.tint(T, new T.TorusGeometry(.007, .0022, 6, 12), ironC), M.ironV); eye.position.copy(tip); eye.rotation.y = Math.PI / 2;
      return tip;
    }
    for (i = 0; i < 2; i++) {
      var sg2 = new T.Group(); sg2.position.copy(P(SPRX, SPRY, SPRZ[i])); rig.add(sg2); sprG.push(sg2);
      var hc = new T.Curve(); hc.getPoint = function (u, o) { var a = u * SPR.n * TAU; return (o || new T.Vector3()).set(-SPR.x0 + 2 * SPR.x0 * u, Math.cos(a) * SPR.R, Math.sin(a) * SPR.R); };
      var NS2 = SPR.n * SPR.seg, hgm = new T.TubeGeometry(hc, NS2, SPR.w, 5, false), hm = add(hgm, M.rustB, sg2);
      hm.castShadow = false; hm.frustumCulled = false; hm.p0 = Float32Array.from(hgm.attributes.position.array); hm.rings = NS2 + 1; hm.rv = 6; springs.push(hm);
      springPost(SPRX - SPR.x0, SPRY, SPRZ[i]); springPost(SPRX + SPR.x0, SPRY, SPRZ[i]);
    }
    var tankZ = zone('play', .42, .14, P(SPRX, SPRY - .012, .73), 'front', { src: 5, part: 'spring' }); sprG.forEach(function (g) { tag(g, tankZ); });
    var guts = [], gh = P(1.6, GY, BARZ - .03); hook(gh, .07);
    for (i = 0; i < 6; i++) { var gp = [], gx = (rnd() - .5) * .03, gz2 = (rnd() - .5) * .03, gl = .3 + rnd() * .32, ns = 7 + (rnd() * 4 | 0); for (k = 0; k <= ns; k++) { var u2 = k / ns; gp.push(V3(gx + Math.sin(u2 * 5 + i) * .022 * u2 + (rnd() - .5) * .014, -.06 - gl * u2 + (k % 3 === 2 ? .035 : 0), gz2 + Math.cos(u2 * 4 + i * 2) * .02 * u2)); } guts.push({ g: S.gut(T, gp, .007 + rnd() * .0075, 60 + i) }); }
    guts.push({ g: S.nets(T, function (x, y, z) { return S.smin(S.ell(x, y, z, 0, -.085, 0, .03, .045, .026), S.ell(x, y, z, .012, -.14, .008, .022, .035, .02), .02) + (S.fbm3(x * 50, y * 50, z * 50, 3) - .5) * .012; }, [-.05, -.2, -.05, .05, -.03, .05], .004, { ao: 1, color: function (x, y, z, occ) { var e = (.35 + .65 * occ) * (.6 + .5 * S.fbm3(x * 40, y * 40, z * 40, 2)); return [.62 * e, .2 * e, .17 * e]; } }) });
    var entr = add(S.join(T, guts), M.flesh); entr.position.set(gh.x + .016, gh.y - .01, gh.z);
    var dripLine = new T.Mesh(new T.CylinderGeometry(.0009, .0009, 1, 4), M.blood); dripLine.userData.noPick = 1; rig.add(dripLine);

    /* ---------- (24) the bone saw on its hook ---------- */
    var SWX = .26, sk0 = hook(P(SWX - .016, GY, BARZ - .028), .075);
    var sawH = add(S.nets(T, function (x, y, z) { var d = S.rbox(x, y, z, 0, 0, 0, .04, .046, .0115, .011); d = S.smax(d, -S.rbox(x, y, z, .004, .004, 0, .017, .02, .03, .009), .005); d = S.smax(d, -S.ell(x, y, z, .05, -.03, 0, .03, .03, .05), .006); return d + (S.fbm3(x * 40, y * 40, z * 40, 2) - .5) * .002; }, [-.05, -.056, -.02, .05, .056, .02], .0032, { ao: 1, color: function (x, y, z, occ) { var e = .4 + .6 * occ; return [e * .5, e * .36, e * .26]; } }), mat({ color: 0xa08064, roughness: .7, vertexColors: true, clearcoat: .2, clearcoatRoughness: .4 }, { blood: .3, bscale: 30, grime: .5, bump: .0006, grain: [300, 30, 300] })); sawH.position.copy(P(SWX + .006, GY, 1.64));
    var sawG = new T.PlaneGeometry(1, 1, 2, 64), sp0 = sawG.attributes.position, sawB = [];
    for (k = 0; k < sp0.count; k++) { var su = sp0.getX(k) + .5, sv = .5 - sp0.getY(k), wdh = .085 - .05 * sv, zz = 1.60 - .54 * sv, row = Math.round(sv * 64); sp0.setXYZ(k, (su - .5) * wdh - (su < .01 && row % 2 && row < 63 ? .0042 : 0), zz, 0); sawB.push(su, sv); }
    sawG.computeVertexNormals();
    var sawMat = mat({ map: tx.steel.map, roughnessMap: tx.steel.roughnessMap, normalMap: tx.steel.normalMap, color: 0x8a8a86, roughness: 1.2, metalness: 1, side: T.DoubleSide }, { rust: .38, blood: .22, bscale: 26, grime: .35, bump: .0003, bfreq: 300, seed: 6 });
    var saw = add(sawG, sawMat); saw.position.copy(P(SWX, GY, 0)); saw.position.y = 0;
    var sawZ = zone('bowtap', .13, .58, P(SWX, GY - .02, 1.33), 'front', { part: 'saw', items: function () { var hz = Math.round(Math.min(1200, Math.max(300, H.P['bowed.size'] * 1.6))); return [{ u: .5, bow: { 'bowed.object': 2 }, tap: { 'struck.object': 2 }, hz: hz }]; } });
    saw.userData.zone = sawZ; sawH.userData.zone = sawZ;

    /* ---------- (14) two rubbing wands in bone sockets. Default is a greasy goat-horn tip in a ferrule (?wand=horn);
       ?wand=finger is a finger bone with a cracked nail. Same zones and motion, only the tip changes. ---------- */
    var wandKind = (window.HE_WAND || (function () { try { return new URLSearchParams(location.search).get('wand'); } catch (e) { return null; } })() || 'horn');
    if (wandKind !== 'finger') wandKind = 'horn';
    var nailCv = S.canvas(256, 256); (function () {
      var x = nailCv.getContext('2d'), rr = S.rng(11), q;
      x.fillStyle = '#1a120e'; x.fillRect(0, 0, 256, 256);
      for (q = 0; q < 22; q++) { x.strokeStyle = 'rgba(' + (28 + (rr() * 18 | 0)) + ',' + (18 + (rr() * 10 | 0)) + ',' + (10 + (rr() * 8 | 0)) + ',' + (.15 + rr() * .35) + ')'; x.lineWidth = .8 + rr() * 2.2; x.beginPath(); x.moveTo(8 + rr() * 16, q * 12); x.lineTo(248, q * 12 + (rr() - .5) * 10); x.stroke(); }
      x.strokeStyle = 'rgba(6,4,3,.9)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(128, 6); x.lineTo(136, 70); x.lineTo(122, 150); x.lineTo(130, 250); x.stroke();
      x.strokeStyle = 'rgba(8,6,4,.55)'; x.lineWidth = .8; x.beginPath(); x.moveTo(96, 30); x.lineTo(102, 210); x.stroke();
      x.fillStyle = 'rgba(48,36,26,.4)'; x.beginPath(); x.ellipse(128, 228, 44, 18, 0, 0, TAU); x.fill();
      // a little grime at the cuticle
      x.fillStyle = 'rgba(20,10,6,.35)'; x.fillRect(0, 200, 256, 56);
    })();
    var nailM = mat({ map: ctex(nailCv, true), color: 0x2a2018, roughness: .48, clearcoat: .22, clearcoatRoughness: .55, envMapIntensity: .3 }, { grime: .35, bump: .00025, bfreq: 90, blood: .06 });
    var hornTipM = mat({ color: 0x4a3426, roughness: .3, clearcoat: .58, clearcoatRoughness: .26, envMapIntensity: .5, sheen: .22, sheenColor: new T.Color(0x6a4a28) }, { grime: .22, bump: .00022, bfreq: 200, blood: .08 });
    function makeWandTip() {
      var g = new T.Group();
      if (wandKind === 'horn') {
        // shaft (tube radius .0052) ends at the group origin; a bone socket buries that end, an iron ferrule
        // seats the horn inside it, and sinew wraps the neck so there is no gap or interpenetration.
        var sock = add(S.tint(T, new T.CylinderGeometry(.0078, .0066, .018, 12), boneC), M.bone, g); sock.position.set(0, -.006, 0);
        var fer = add(S.tint(T, new T.CylinderGeometry(.0096, .0092, .013, 14), ironC), M.ironV, g); fer.position.set(0, .0055, 0);
        add(S.tint(T, new T.TorusGeometry(.0094, .00115, 6, 16), ironC), M.ironV, g).position.set(0, .0116, 0);
        add(S.tint(T, new T.TorusGeometry(.0092, .00105, 6, 16), ironC), M.ironV, g).position.set(0, -.0006, 0);
        for (var wi = 0; wi < 4; wi++) { var wr = add(S.tint(T, new T.TorusGeometry(.0084, .00095, 5, 12), [.5, .24, .15]), M.sinew, g); wr.position.set(0, -.004 - wi * .0023, 0); wr.rotation.z = (wi % 2) * .12; }
        var hpts = [V3(0, .005, 0), V3(.0012, .02, .001), V3(.003, .038, .004), V3(.001, .058, .008)];
        add(S.sweep(T, hpts, 24, 12, function (u) { var r = .0072 * (1 - u * .8); return [r, r * .78]; }, { ring: function (u, a) { return 1 + .08 * Math.pow(Math.abs(Math.sin(u * 28)), 2) * (1 - u); }, color: [.45, .32, .2] }), hornTipM, g);
      } else {
        add(S.phalanx(T, .046, .0084), M.bone, g);
        var ng = new T.BoxGeometry(.011, .016, .0022, 4, 7, 1), pa = ng.attributes.position, vi;
        for (vi = 0; vi < pa.count; vi++) { var yy = pa.getY(vi), uu = (yy + .008) / .016; pa.setX(vi, pa.getX(vi) * (1.14 - .5 * uu)); pa.setZ(vi, pa.getZ(vi) + .004 * uu * uu); }
        ng.computeVertexNormals();
        var nailPl = add(ng, nailM, g); nailPl.position.set(0, .043, .0062); nailPl.rotation.x = -.2;
        var fer2 = add(S.tint(T, new T.CylinderGeometry(.0092, .0096, .012, 12), ironC), M.ironV, g); fer2.position.set(0, .004, 0);
        add(S.tint(T, new T.TorusGeometry(.0094, .0011, 6, 14), ironC), M.ironV, g).position.set(0, .01, 0);
      }
      return g;
    }
    function socket(x, y) { var a = add(S.vertebra(T, .8, 2), M.bone); a.position.copy(P(x, y, ZT + .014)); var b = c.cyl(x, y, ZT + .02, ZT + .11, .0095, M.boneB, null, 10); socket.last = [a, b]; return P(x, y, ZT + .11); }
    var wands = [
      { id: 'wandL', base: socket(.07, .405), hm: socket.last, rest: P(-.005, .36, ZT + .5), reach: 1.35, surf: { 2: 1, 3: 1, 0: 1 }, side: -1 },
      { id: 'wandR', base: socket(1.6, .03), hm: socket.last, rest: P(1.79, .0, ZT + .33), reach: 1.05, surf: { 1: 1, 0: 1 }, side: 1 }
    ];
    wands.forEach(function (w) {
      w.ball = makeWandTip(); w.ball.position.copy(w.rest); rig.add(w.ball); w.ball.castShadow = w.ball.receiveShadow = true;
      w.pos = w.rest.clone(); w.vel = V3(0, 0, 0); w.goal = w.rest.clone();
      w.tube = add(new T.BufferGeometry(), M.wandShaft); w.tube.frustumCulled = false; w.zone = zone('wand', .09, .09, w.rest.clone(), 'front', { part: w.id }); w.ball.userData.zone = w.zone; w.tube.userData.zone = w.zone; w.hm.forEach(function (m) { m.userData.zone = w.zone; });
      w.ball.traverse(function (o) { if (o.isMesh) { o.userData.zone = w.zone; o.castShadow = o.receiveShadow = true; o.userData.keep = 1; } });
    });

    /* ---------- (19) three wax seals pressed into the top (the piezos); (21) the iron serpent nailed to the front ---------- */
    var seals = [[.02, .275], [.455, .0], [1.5, .015]].map(function (q, j) { var m = mat({ color: 0x5a0c0a, roughness: .3, clearcoat: .7, clearcoatRoughness: .2, emissive: 0xff3a10, emissiveIntensity: 0 }, { grime: .3, bump: .0004, bfreq: 200 });
      var sp = [[0, .0055], [.007, .0058], [.012, .0042], [.0125, .0062], [.017, .0066], [.021, .0045], [.0235, .0012], [.024, 0]].map(function (w) { return new T.Vector2(w[0], w[1]); }), sg = new T.LatheGeometry(sp, 22), pa = sg.attributes.position;
      for (var v = 0; v < pa.count; v++) { var a = Math.atan2(pa.getZ(v), pa.getX(v)), f = 1 + .14 * Math.sin(a * 3 + j) + .08 * Math.sin(a * 7 + j * 2); pa.setX(v, pa.getX(v) * f); pa.setZ(v, pa.getZ(v) * f); } sg.computeVertexNormals();
      var d = add(sg, m); d.position.copy(P(q[0], q[1], ZT + .002)); var pz = zone('button', .055, .055, P(q[0], q[1], ZT + .011), 'top', { part: 'piezo' }); d.userData.zone = pz; return m; });
    var coilG = (function () { var pts = [], idx = [], n = 520, R = .1, r0 = .012, wdt = .016; for (var q = 0; q <= n; q++) { var t = q / n, a = t * 11 * TAU, rr = r0 + (R - r0) * t; pts.push(Math.cos(a) * rr, Math.sin(a) * rr, -wdt / 2, Math.cos(a) * rr, Math.sin(a) * rr, wdt / 2); if (q < n) { var b = q * 2; idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); } } var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pts, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(new Float32Array(pts.length / 3 * 2), 2)); g.setIndex(idx); g.computeVertexNormals(); return g; })();
    var coil = add(coilG, M.rustB); coil.position.copy(P(1.42, .004, .47));
    var coilMt = [c.rod(P(1.42, .014, .47), P(1.42, -.012, .47), .009, M.iron), c.rod(P(1.52, .014, .47), P(1.52, -.01, .47), .006, M.iron)];
    var coilZ = zone('bowtap', .23, .23, P(1.42, -.014, .47), 'front', { part: 'coil', items: function () { return [{ u: .5, bow: { 'bowed.object': 3 }, tap: { 'struck.object': 3 } }]; } }); coil.userData.zone = coilZ; coilMt.forEach(function (m) { m.userData.zone = coilZ; });

    /* ---------- (17) the FX controls, set into the carved front: six bone dials, a bead in a groove for the send, a slot where
       the numbers smoulder, a pale eye (freeze) and a red one (loop) ---------- */
    var PYF = .0148, knobG = S.nets(T, function (x, y, z) {
      var r = Math.sqrt(x * x + z * z), d = Math.max(r - .026, Math.abs(y) - .012);
      d = S.smin(d, Math.max(r - .02, y - .012, .02 - y), .003);
      d += .0018 * Math.sin(Math.atan2(z, x) * 6) * Math.max(0, y);
      return d + (S.fbm3(x * 70 + 3, y * 70, z * 70, 2) - .5) * .0014;
    }, [-.032, -.004, -.032, .032, .026, .032], .0026, { ao: 1, color: function (x, y, z, occ) { var e = .4 + .6 * occ; return [e * .72, e * .62, e * .44]; } }), knobs = [];
    knobG.rotateX(Math.PI / 2);
    KN.forEach(function (kq, j) { var x = KX[j % 3], z = KZ[j < 3 ? 0 : 1], g = new T.Group(); g.position.copy(P(x, PYF, z)); rig.add(g); add(knobG, M.bone, g);
      var nt = add(S.tint(T, new T.BoxGeometry(.0036, .02, .003), [.06, .04, .03]), M.soot, g); nt.position.set(0, .0125, .0252); nt.castShadow = false;
      var zk = zone('knob', .078, .078, P(x, -.013, z), 'front', { part: 'knob', param: kq[0], lab: kq[1] }); tag(g, zk); knobs.push({ g: g, p: kq[0] }); });
    var lcv = S.canvas(512, 96), lct = ctex(lcv, true), lcdM = new T.Mesh(new T.PlaneGeometry(.27, .05), new T.MeshStandardMaterial({ map: lct, emissiveMap: lct, emissive: 0xff5a18, emissiveIntensity: .55, roughness: .88, metalness: 0, toneMapped: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 })); lcdM.position.copy(P(.22, PYF - .0006, .765)); lcdM.userData.zone = woodF; rig.add(lcdM);
    [[.083, .357, .793, .799], [.083, .357, .731, .737], [.079, .086, .731, .799], [.354, .361, .731, .799]].forEach(function (q) { c.box(q[0], PYF - .006, q[2], q[1], PYF, q[3], M.iron).userData.zone = woodF; });
    var sendK = add(S.vertebra(T, .42, 2.5), M.bone); sendK.rotation.x = Math.PI / 2; sendK.position.copy(P(.11, PYF - .008, .7));
    var sendZ = zone('send', .31, .05, P(.2425, -.01, .7), 'front', { part: 'send' }); sendK.userData.zone = sendZ;
    var gem = function (col, em) { return mat({ color: col, roughness: .08, metalness: 0, clearcoat: 1, clearcoatRoughness: .04, emissive: em, emissiveIntensity: .3, envMapIntensity: 2 }); }, frzM = gem(0x9ab0c0, 0x9fd8ff), loopM = gem(0x5a0806, 0xff3018), ledM = gem(0x4a0604, 0xff2010);
    var gemG = new T.SphereGeometry(.021, 20, 12); gemG.scale(1, 1, .55);
    [[.13, 'freeze', frzM], [.31, 'loop', loopM]].forEach(function (q) { var g = add(gemG, q[2]); g.position.copy(P(q[0], PYF, .355)); var bz = add(S.tint(T, new T.TorusGeometry(.0225, .0036, 6, 24), ironC), M.ironV); bz.position.copy(P(q[0], PYF - .002, .355)); var zb = zone('button', .07, .065, P(q[0], -.008, .355), 'front', { part: q[1] }); g.userData.zone = zb; bz.userData.zone = zb;
      // each eye has a slit of a pupil
      var pu2 = add(S.tint(T, new T.SphereGeometry(.0215, 12, 8), [.01, .01, .01]), M.soot); pu2.scale.set(.16, .7, .57); pu2.position.copy(P(q[0], PYF, .355)); pu2.userData.zone = zb; pu2.castShadow = false; });
    var led = add(new T.IcosahedronGeometry(.0075, 1), ledM); led.position.copy(P(.39, PYF - .002, .765)); led.userData.zone = woodF;

    /* ---------- the air: slow banks of smoke behind and below the altar, dust turning in the candlelight, a drop that falls ---------- */
    var smokeT = (function () { var cv = S.canvas(128, 128), x = cv.getContext('2d'), im = x.createImageData(128, 128), d = im.data; for (var y = 0; y < 128; y++) for (var q = 0; q < 128; q++) { var dx = (q - 64) / 64, dy = (y - 64) / 64, rr = Math.sqrt(dx * dx + dy * dy), n = S.fbm3(q * .034, y * .034, 3.3, 4), a = Math.max(0, 1 - rr); a = a * a * (.2 + 1.5 * n * n); var o = (y * 128 + q) * 4; d[o] = d[o + 1] = d[o + 2] = 255; d[o + 3] = Math.min(255, a * 255); } x.putImageData(im, 0, 0); return new T.CanvasTexture(cv); })();
    var smoke = []; for (i = 0; i < 11; i++) { var back = i < 7, sm = new T.Sprite(new T.SpriteMaterial({ map: smokeT, color: back ? 0x9a7460 : 0x6a5850, transparent: true, opacity: back ? .11 : .08, depthWrite: false })), ss = back ? 1.6 + rnd() * 1.4 : 1.2 + rnd() * 1.2;
      sm.scale.set(ss * 1.5, ss, 1); sm.material.rotation = rnd() * TAU; var o0 = back ? V3((rnd() - .5) * 3.4, .7 + rnd() * 1.5, -.55 - rnd() * .7) : V3((rnd() - .5) * 3.6, .12 + rnd() * .35, .5 + rnd() * 1.0); sm.position.copy(o0); sm.renderOrder = 4; sc.add(sm); smoke.push({ s: sm, o: o0, ph: rnd() * TAU, sp: .03 + rnd() * .05 }); }
    var dustG = new T.BufferGeometry(), dn = 240, dpos = new Float32Array(dn * 3); for (i = 0; i < dn; i++) { dpos[i * 3] = (rnd() - .5) * 2.4; dpos[i * 3 + 1] = .95 + rnd() * 1.0; dpos[i * 3 + 2] = (rnd() - .5) * 1.1; } dustG.setAttribute('position', new T.BufferAttribute(dpos, 3));
    var dust = new T.Points(dustG, new T.PointsMaterial({ map: glowT, color: 0xffb070, size: .011, sizeAttenuation: true, transparent: true, opacity: .32, depthWrite: false, blending: T.AdditiveBlending })); dust.frustumCulled = false; sc.add(dust);
    var dropM = new T.Mesh(new T.SphereGeometry(.0032, 6, 5), M.blood); dropM.userData.noPick = 1; rig.add(dropM);
    var entrLow = V3(entr.position.x + .004, entr.position.y - .56, entr.position.z); dripLine.visible = false;

    /* ---------- one frame: the same motions as the workshop machine, on these parts ---------- */
    var st = { sx: .5, wrot: 0, fang: 0, fdir: 1, gI: 0, wLvl: -1, spPrev: 0, sawBend: 0, sawB0: 0, sawW: false, shw: false, lcd: '', vsl: 0, tilt0: 0, wDirty: false, drop: 0, eyeX: .04, eyeZ: .015, bEyeX: .01, bEyeZ: .008, drv: 0,
      eyes: [{ next: 4, ph: 0, u: 0, dur: 1.8, linger: 2.2 }, { next: 11, ph: 0, u: 0, dur: 2.1, linger: 1.7 }] };
    var ZERO = new T.Matrix4().makeScale(0, 0, 0), KEY0 = key.intensity, FILL0 = fill.intensity, KP = key.position.clone(), RIMX = .069, RIMZ = .079, RIMY = bowlY + .0675 * BS;
    function ember(sel) {
      var Pq = H.P, sh = Math.round(Pq['harm.shift']), kk = window.HE_SOURCES[sel], snd = Math.round((Pq[kk + '.hsend'] || 0) * 100), txt = (sh > 0 ? '+' : '') + sh + 'st  ' + H.ROMAN[sel] + ' ' + snd + '%';
      if (txt === st.lcd) return; st.lcd = txt; var x = lcv.getContext('2d'), rr = S.rng(3); x.shadowBlur = 0; x.fillStyle = '#100804'; x.fillRect(0, 0, 512, 96);
      for (var q = 0; q < 70; q++) { x.fillStyle = 'rgba(120,' + (16 + rr() * 30 | 0) + ',8,' + (rr() * .18) + ')'; x.beginPath(); x.arc(rr() * 512, 64 + rr() * 32, 2 + rr() * 8, 0, TAU); x.fill(); }
      x.font = '700 56px Georgia, "Times New Roman", serif'; x.textBaseline = 'middle'; x.textAlign = 'center'; x.shadowColor = 'rgba(180,40,8,.8)'; x.shadowBlur = 14; x.fillStyle = '#c84a18'; x.fillText(txt, 256, 50); x.shadowBlur = 4; x.fillStyle = '#e8a060'; x.fillText(txt, 256, 50); x.shadowBlur = 0; lct.needsUpdate = true;
    }
    // iris sits at the local +Z pole (geometry rotated). Rest: rolled up, out of view. Look: iris toward a high front camera.
    function lookEye(g, e, t, dt, F) {
      var fx = window.__heAltarFX, force = (fx && fx.eyeLook) ? 1 : (F.still ? 0 : -1), u, sm;
      if (force >= 0) u = force;
      else {
        if (e.ph === 0 && t >= e.next) { e.ph = 1; e.t0 = t; e.dur = 1.5 + Math.random() * .8; }
        if (e.ph === 1) { u = Math.min(1, (t - e.t0) / e.dur); if (u >= 1) { e.ph = 2; e.t0 = t; e.linger = 1.2 + Math.random() * 1.6; } }
        else if (e.ph === 2) { u = 1; if (t - e.t0 >= e.linger) { e.ph = 3; e.t0 = t; e.dur = 1.5 + Math.random() * .8; } }
        else if (e.ph === 3) { u = 1 - Math.min(1, (t - e.t0) / e.dur); if (u <= 0) { e.ph = 0; e.next = t + 6 + Math.random() * 9; } }
        else u = 0;
      }
      sm = u * u * u * (u * (u * 6 - 15) + 10);
      // rest: iris almost straight up; look: iris tilts toward a camera slightly above and in front
      var rx = -1.22 + sm * .85, ry = .06 + sm * .16, rz = sm * .03;
      if (!F.still) { rx += Math.sin(t * .35 + e.next) * .03; ry += Math.sin(t * .22 + e.dur) * .04; }
      g.rotation.set(rx, ry, rz);
    }
    function frame(F) {
      var V = H.v2(); if (!V) return;
      var dt = F.dt, t = F.t, L = F.L, Pp = F.P, lv = F.lv, TM = F.TM, A = F.A, mo = F.mo, q, j;
      // (2) the harp: the string under the hand (or the last one played) shakes hardest, its neighbours in sympathy
      var ex = Pp['ebow.excite'] | 0, onS = A && (A.u.part === 'string' || A.u.part === 'bar' || A.u.part === 'puck') && A.q; if (onS) st.sx = A.q.x;
      var a0 = lv[0] * .008 * mo;
      strings.forEach(function (s, n) { var w = Math.exp(-Math.pow((s.u - st.sx) / .075, 2)) + .08, a = a0 * w; if (a > 2e-5 || s.dirty) { s.set(a, t * (64 + n * 6.3)); s.dirty = a > 2e-5; } });
      bar.position.copy(P(HX0 + HW * st.sx, HY - .028, ZT + .098)); barZ.position.copy(P(HX0 + HW * st.sx, HY - .042, ZT + .1));
      if (A && A.u.part === 'puck' && A.q) { puck.position.copy(P(HX0 + HW * A.q.x, HY - .055, HZ0 + HH * A.q.y - .012)); puck.rotation.set(0, Math.PI / 2, 0); } else { puck.position.lerp(PUCK0, .2); puck.rotation.set(0, .5, 0); }
      lodeM.emissiveIntensity = (ex ? 0 : lv[0]) * 1.8;
      // (4) wheel and crank turn together; (5) the drones shiver
      st.wrot += dt * (lv[1] > .03 ? 1.5 + 9 * lv[1] : 0); wheel.rotation.x = -st.wrot; crank.rotation.x = -st.wrot;
      drones.forEach(function (d, n) { d.position.y = Math.sin(t * (90 + n * 13)) * lv[1] * .0025 * mo; });
      // (6) the blades: overhang from the strap; they whip when played
      var rl = (Pp['bowed.object'] | 0) === 0 ? lv[2] : 0, sl4 = (Pp['struck.object'] | 0) === 0 ? lv[4] : 0;
      rulers.forEach(function (rr, n) { rr.userData.b.scale.z = Math.max(6, V.clampL * RF[n]) / 100 + .06; rr.rotation.x = Math.sin(t * (14 + n * 5)) * (rl + sl4) * .05 * mo; });
      // (7)(8) the tray tips on its pivot; the blood stays level, slops, and the bones sway
      c.tiltStep(dt); var tilt = V.tilt, lvl = Pp['water.level'] || 0, ts = traySurf(tilt, lvl); tray.rotation.z = ts.ang;
      st.vsl = Math.max(st.vsl * Math.pow(.01, dt / 1.5), Math.min(1, Math.abs(tilt - st.tilt0) / Math.max(dt, .001) * .35)); st.tilt0 = tilt; V.vsl = st.vsl;
      bld.visible = ts.vis;
      if (ts.vis) {
        bld.position.copy(P(.26, .17, ZT + ts.H)); bld.position.x += ts.midX; bld.scale.set(ts.sx, ts.sz, 1);
        bld.rotation.y = (V.tiltLag - tilt) * .1 * mo * Math.min(1, Math.max(0, (ts.hLow - ts.H) / .008));
        var halfW = ts.sx * T_BW * .5 - ER * 1.2, halfD = ts.sz * T_BD * .5 - ER * 1.2;
        st.eyeX += (Math.sin(t * .62) * Math.min(Math.max(0, halfW), .05) - st.eyeX) * Math.min(1, dt * .7);
        st.eyeZ += (Math.cos(t * .47) * Math.min(Math.max(0, halfD), .03) - st.eyeZ) * Math.min(1, dt * .7);
        st.eyeX = Math.max(-halfW, Math.min(halfW, st.eyeX)); st.eyeZ = Math.max(-halfD, Math.min(halfD, st.eyeZ));
        var bob = Math.sin(t * 1.8) * .002 + Math.sin(t * 2.9 + .7) * .001;
        floatEye.visible = true;
        floatEye.position.copy(P(.26, .17, ZT + ts.H - ER * .35 + bob));
        floatEye.position.x += ts.midX + st.eyeX; floatEye.position.z += st.eyeZ;
        lookEye(floatEye, st.eyes[0], t, dt, F);
      } else { bld.visible = false; floatEye.visible = false; }
      var wa = bldG.attributes.position, sl = (st.vsl + (Pp['water.slosh'] || 0) * .3) * mo, wam = Pp['water.amt'] || 0, wMove = bld.visible && (sl + wam > 1e-5 || st.wDirty); st.wDirty = bld.visible && sl + wam > 1e-5;
      if (wMove) { for (q = 0; q < bld0.length; q += 3) { var wx = bld0[q]; wa.array[q + 2] = Math.sin(wx * 40 - t * 6) * sl * .006 + Math.sin(bld0[q + 1] * 50 + t * 4.3) * sl * .004 + wam * .0015 * Math.sin(t * 2 + wx * 20); } wa.needsUpdate = true; bldG.computeVertexNormals(); }
      var bw = (Pp['bowed.object'] | 0) === 1 ? lv[2] : 0, sw = (Pp['struck.object'] | 0) === 1 ? lv[4] : 0, mw = (Pp['moan.surface'] | 0) === 3 ? lv[8] : 0;
      rods.forEach(function (rr) { rr.sw *= Math.pow(.2, dt); rr.g.rotation.x = Math.sin(t * (6 + rr.xr * 9)) * (rr.sw * .1 + (bw + sw + mw) * .02) * mo; rr.g.rotation.z = Math.cos(t * (5 + rr.xr * 7)) * (wam * .02 + st.vsl * .03) * mo; }); spikeSet();
      // (9) the mirror shivers; (10) the bowl fills from the spout and a wet glint follows the finger round its rim
      if (V.holdRun) H.setParam('glass.fill', Math.round(Math.min(1, Math.max(0, (Pp['glass.fill'] || 0) + V.holdRun * dt * .35)) * 1000) / 1000, true);
      var gf = Pp['glass.fill'] || 0, ly = .017 + gf * .042; liq.visible = gf > .02;
      if (Math.abs(ly - st.wLvl) > .0003) { st.wLvl = ly; var br = bowlR(ly); liq.scale.set(br[0], br[1], 1); liq.position.copy(P(BWX, BWY, bowlY + ly * BS)); }
      // leftover wand eyeball, smaller, in the skull bowl: follows the fill, sits on the floor when empty
      var bFloor = .0052, bY = gf > .02 ? ly : bFloor + ER / BS, bRad = bowlR(bY), bW = Math.max(0, bRad[0] - ER * 1.2), bD = Math.max(0, bRad[1] - ER * 1.2);
      st.bEyeX += (Math.sin(t * .51 + 1.3) * Math.min(bW, .032) - st.bEyeX) * Math.min(1, dt * .65);
      st.bEyeZ += (Math.cos(t * .37 + .8) * Math.min(bD, .024) - st.bEyeZ) * Math.min(1, dt * .65);
      st.bEyeX = Math.max(-bW, Math.min(bW, st.bEyeX)); st.bEyeZ = Math.max(-bD, Math.min(bD, st.bEyeZ));
      var bSit = bowlY + bFloor * BS + ER * .82, bBob = Math.sin(t * 1.65 + 2) * .0015 + Math.sin(t * 2.45 + .4) * .0007;
      var bH = gf > .02 ? Math.max(bSit, bowlY + ly * BS - ER * .18 + bBob) : bSit;
      bowlEye.visible = true;
      bowlEye.position.copy(P(BWX, BWY, bH)); bowlEye.position.x += st.bEyeX; bowlEye.position.z += st.bEyeZ;
      lookEye(bowlEye, st.eyes[1], t, dt, F);
      // clip the part of the sphere that would show through the flat blood disc
      var liqY = P(BWX, BWY, gf > .02 ? bowlY + ly * BS : bowlY - .02).y, Vr = H.v2();
      bowlClip.set(new T.Vector3(0, 1, 0), -(liqY - .0005));
      if (Vr && Vr.r) Vr.r.localClippingEnabled = true;
      stream.visible = V.holdRun > 0; if (stream.visible) { var s0 = SPOUT.y, s1 = bowlY + ly * BS; stream.scale.y = Math.max(.004, s0 - s1); stream.position.set(SPOUT.x, (s0 + s1) / 2, SPOUT.z); }
      stem.position.y = .162 + (V.holdRun > 0 && !V.holdShift ? .012 : 0);   // the handle rises while blood runs
      pane.position.x = (MX0 + MX1) / 2 - .8 + Math.sin(t * 190) * lv[3] * .001 * mo;
      var fing = (Pp['glass.contact'] | 0) === 1, wAct = A && A.u.part === 'wine' && A.q, gOn = fing && (lv[3] > .08 || !!wAct);
      if (gOn) { if (wAct) { var na = Math.atan2(-(A.q.y - .5), A.q.x - .5), dA = na - st.fang; dA -= TAU * Math.round(dA / TAU); st.fdir = dA !== 0 ? (dA > 0 ? 1 : -1) : st.fdir; st.fang += dA; } else st.fang += st.fdir * dt * TAU * (4 + 4 * Math.min(1, lv[3] * 1.2)) / 6 * mo; }
      var gI = gOn ? Math.min(1, .35 + lv[3] * 2.5 + (wAct ? .3 : 0)) : 0; st.gI += (gI - st.gI) * Math.min(1, dt * 10); glint.visible = st.gI > .02;
      if (glint.visible) { glint.position.set(bowl.position.x + Math.cos(st.fang) * RIMX, RIMY, bowl.position.z + Math.sin(st.fang) * RIMZ); glint.material.opacity = st.gI; var gsz = .02 + .022 * st.gI; glint.scale.set(gsz, gsz, 1); }
      // (11) the hide flexes under the eye, and gives under a knock (the heartbeat, a thump)
      head.position.y = .056 - (((Pp['moan.surface'] | 0) === 1 ? lv[8] * .002 * Math.sin(t * 60) : 0) + ((Pp['struck.object'] | 0) === 4 ? Math.min(1, lv[4]) * .0035 : 0)) * mo;
      // (12) the drawer slides out; what is in it rides along
      drawer.position.z = V.open * .2; junkZ.userData.off = V.open < .2; junkZ.scale.y = Math.max(.1, V.open); junkZ.position.copy(P(1.01, -V.open * .1, .8));
      var J = L.junk, n = J ? Math.min(60, (J.length - 3) / 3) : Math.min(60, Pp['junk.count'] | 0), src = J || rest;
      for (q = 0; q < 60; q++) { var kind = -1; if (q < n) { var bx2 = src[q * 3], rr3 = src[q * 3 + 2]; kind = q % 9 === 4 ? 2 : bx2 < .333 ? 0 : bx2 < .667 ? q % 2 : 1;
          dummy.position.copy(P(.9 + .22 * bx2, .04 + .24 * src[q * 3 + 1], .657 + rr3 * .1)); var s3 = rr3 * (kind === 0 ? .3 : kind === 1 ? .4 : .5); dummy.scale.set(s3, s3, s3); dummy.rotation.set(kind === 1 ? Math.PI / 2 : q * 1.3, q * 1.7, q * .7); dummy.updateMatrix(); }
        for (j = 0; j < 3; j++) junkI[j].setMatrixAt(q, j === kind ? dummy.matrix : ZERO); }
      junkI.forEach(function (im) { im.instanceMatrix.needsUpdate = true; });
      // (13) the coils jiggle, and each hit sends a drip down them (highs ahead, lows trailing)
      if (lv[5] - st.spPrev > .12) V.drips.push(0); st.spPrev = lv[5];
      for (q = V.drips.length - 1; q >= 0; q--) { V.drips[q] += dt; if (V.drips[q] > 1.4) V.drips.splice(q, 1); }
      for (q = 0; q < 2; q++) {
        var hm2 = springs[q], hp = hm2.geometry.attributes.position, ha = hp.array, p0 = hm2.p0, RG = hm2.rings, RV = hm2.rv, am = lv[5] * .009 * mo, moving = am > 1e-5 || V.drips.length;
        if (!moving && !hm2.dirty) continue; hm2.dirty = moving;
        for (var kk = 0; kk < RG; kk++) { var uq = kk / (RG - 1), wob = Math.sin(uq * 30 - t * 34 + q * 2) * am * Math.sin(Math.PI * uq), dz = 0;
          for (j = 0; j < V.drips.length; j++) { var ag = V.drips[j], fr = ag / .35 % 2, pos = fr < 1 ? fr : 2 - fr, lag = uq - pos, dec = Math.exp(-ag * 2.2); if (lag > -.25 && lag < .05) dz += Math.sin(lag * 90 * (1 + lag * 4)) * Math.exp(lag * 12) * .009 * dec * mo; }
          for (var v2 = 0; v2 < RV; v2++) { var o3 = (kk * RV + v2) * 3; ha[o3] = p0[o3]; ha[o3 + 1] = p0[o3 + 1] + wob + dz; ha[o3 + 2] = p0[o3 + 2] + wob * .7; } }
        hp.needsUpdate = true;
      }
      // (14) the wands: each springs toward its goal (the pointer, a surface or home) on its shaft, and shivers while it moans
      wands.forEach(function (w) {
        var act = A && A.w === w, f = w.goal.clone().sub(w.pos).multiplyScalar(act ? 400 : 120); w.vel.addScaledVector(f, dt).multiplyScalar(Math.pow(act ? 1e-5 : .002, dt)); w.pos.addScaledVector(w.vel, dt);
        if (act && A.on) w.pos.lerp(w.goal, .6);
        var shv = act && A.on ? lv[8] * .003 * mo : 0; w.ball.position.copy(w.pos); if (shv) w.ball.position.add(V3(Math.sin(t * 61) * shv, Math.cos(t * 53) * shv, 0));
        var dir = w.pos.clone().sub(w.base); if (dir.length() > 1e-4) w.ball.quaternion.setFromUnitVectors(V3(0, 1, 0), dir.normalize());
        w.zone.position.copy(w.ball.position);
        if (!w.lp || w.pos.distanceTo(w.lp) > 1e-4 || shv) { var a = w.base, b = w.pos, m = a.clone().lerp(b, .5); m.y += .06 + .16 * Math.max(0, 1 - a.distanceTo(b)); m.addScaledVector(w.vel, -.03);
          w.tube.geometry.dispose(); w.tube.geometry = new T.TubeGeometry(new T.QuadraticBezierCurve3(a, m, b), 20, .0052, 6); w.lp = w.pos.clone(); }
      });
      // (24) the saw: an S-bend that follows the hand (or the Bend knob), a shimmer while it sings
      var sAct = A && A.u.part === 'saw', sbT = sAct && A.bend !== undefined ? A.bend : Pp['bowed.bend'], sL = (Pp['bowed.object'] | 0) === 2 ? lv[2] : 0, sS = (Pp['struck.object'] | 0) === 2 ? lv[4] : 0;
      st.sawBend += ((sbT - .5) - st.sawBend) * .2;
      if (Math.abs(st.sawBend - st.sawB0) > 1e-4 || sL + sS > .01 || st.sawW) { var sga = sawG.attributes.position; for (q = 0; q < sga.count; q++) { var sv2 = sawB[q * 2 + 1]; sga.setZ(q, st.sawBend * .06 * Math.sin(TAU * sv2) * sv2 + (sL + sS) * .002 * Math.sin(t * 90 + sv2 * 20) * sv2 * mo); } sga.needsUpdate = true; sawG.computeVertexNormals(); st.sawB0 = st.sawBend; st.sawW = sL + sS > .01; }
      // (15) the idol's plate wobbles when it moans or is struck
      var sa = shG.attributes.position, swv = (((Pp['moan.surface'] | 0) === 2 ? lv[8] : 0) * .02 + ((Pp['struck.object'] | 0) === 2 ? lv[4] * .015 : 0)) * mo;
      if (swv > 1e-4 || st.shw) { for (q = 0; q < sh0.length; q += 3) { var x2 = sh0[q] / SW + .5, y2 = sh0[q + 1] / SH + .5; sa.array[q + 2] = swv * (Math.sin(Math.PI * x2) * Math.sin(Math.PI * y2) * Math.sin(t * 9) + .5 * Math.sin(2 * Math.PI * x2) * Math.sin(2 * Math.PI * y2) * Math.sin(t * 14 + 1)) * (1 - y2 * .6); } sa.needsUpdate = true; shG.computeVertexNormals(); st.shw = swv > 1e-4; }
      // (17) the dials show their values, the bead the send, the slot the shift and the voice; the eyes light when engaged
      knobs.forEach(function (kq) { var d = PDEF[kq.p]; kq.g.rotation.z = -((Pp[kq.p] - d.min) / (d.max - d.min) - .5) * 4.4; });
      var sk = Pp[window.HE_SOURCES[L.sel] + '.hsend'] || 0; sendK.position.x = .11 + sk * .265 - .8;
      ember(L.sel); ledM.emissiveIntensity = .15 + V.harmLv * 3;
      frzM.emissiveIntensity = Pp['aura.freeze'] > .5 ? 2.8 : .3; loopM.emissiveIntensity = TM.rec ? 2.4 + .9 * Math.sin(t * 8) : .3;
      // (1) the body: the pentagram's grooves and the seals glow with it, the whole altar trembles
      var bl = V.bodyLv, D = Pp['macro.dread'] || 0;
      panelM.emissiveIntensity = bl * 3.2 + D * .3 * (.8 + .2 * Math.sin(t * 2.3)); pentL.intensity = bl * 1.6 + D * .08;
      seals.forEach(function (m, n2) { m.emissiveIntensity = bl * (1.6 - n2 * .2); });
      rig.position.set(Math.sin(t * 97) * bl * .0006 * mo, Math.sin(t * 89) * bl * .0004 * mo, 0);
      coil.rotation.z = Math.sin(t * 40) * ((((Pp['bowed.object'] | 0) === 3 ? lv[2] : 0) + ((Pp['struck.object'] | 0) === 3 ? lv[4] : 0)) * .05 + lv[5] * .012) * mo;
      // (22) the candles: every flame gutters on its own; the altar candle swells with the aura; Dread starves and reddens the room
      // Drive / Grit gently lifts the other flames (~13% at full), smoothed so a knob move doesn't pump the room
      if (F.FM) V.flick = F.FM.flick; else { if (!F.still && D > .55 && Math.random() < (D - .5) * .12) V.flick = .45 + Math.random() * .4; V.flick += (1 - V.flick) * .12; }
      var aura = Math.min(1.6, lv[7] * 2.4) + (TM.frz ? .35 : 0);
      var drvT = 0, srcN, FX = window.__heAltarFX;
      if (FX && FX.drive != null) drvT = FX.drive;
      else { for (srcN = 0; srcN < window.HE_SOURCES.length; srcN++) drvT = Math.max(drvT, Pp[window.HE_SOURCES[srcN] + '.drive'] || 0); drvT = Math.max(drvT, Pp['ebow.sustain'] || 0); }
      if (F.still) st.drv = drvT; else st.drv += (drvT - st.drv) * Math.min(1, dt * 2.2);
      var boost = 1 + .13 * st.drv;
      flames.forEach(function (f) { if (!f.lit) return; var s = f.seed, kf = F.still ? .95 : .86 + .09 * Math.sin(t * 11.3 + s) + .06 * Math.sin(t * 23.7 + s * 2.1) + .05 * Math.sin(t * 37.1 + s * 5.3); kf *= f === hero ? V.flick : (.6 + .4 * V.flick) * boost; f.k = kf;
        f.fm.uniforms.t.value = t; f.fm.uniforms.k.value = kf; f.wax.heGore.heGl.value[2] = .6 * kf * (f === hero ? 1 + aura * .5 : 1); f.glow.material.opacity = .45 * kf; f.haze.material.opacity = .09 * kf * (f === hero ? 1 + aura * .6 : .8);
        if (f !== hero) { var fs = 1 + .12 * st.drv; f.flame.scale.setScalar(fs); f.glow.scale.setScalar(.2 * fs); f.haze.scale.setScalar(1.1 * fs); } });
      hero.flame.scale.setScalar(1.3 + aura * .9); hero.glow.scale.setScalar(.24 + aura * .16);
      var kI = hero.k * (1 - D * .35) * (1 + aura * .9);
      key.intensity = KEY0 * kI; key.color.setRGB(1, .56 - D * .16, .27 - D * .14); key.position.set(KP.x + Math.sin(t * 13.1) * .004 * mo, KP.y + Math.sin(t * 17.3) * .003 * mo, KP.z + Math.sin(t * 9.7) * .004 * mo);
      cndL.intensity = .5 * kI; endL.intensity = .55 * endC.k * (1 - D * .35) * boost; wallL.intensity = 2.6 * (.6 + .4 * V.flick) * (.92 + .08 * Math.sin(t * 15 + 2)) * boost;
      cryptLights.forEach(function (q) { q.l.intensity = q.b * V.flick * (1 - D * .25) * (.88 + .07 * Math.sin(t * 9.3 + q.s) + .05 * Math.sin(t * 23.1 + q.s * 2)) * boost; });
      fill.intensity = FILL0 * (1 - D * .5); fill.color.setRGB(.94, .78 - D * .26, .63 - D * .36); hemi.intensity = .34 - D * .12; wash.intensity = 9 * (1 - D * .5); rim.intensity = .3 * (1 - D * .3);
      sc.fog.density = .18 + (Pp['macro.distance'] || 0) * .14;
      if (eyeM) eyeM.emissiveIntensity = .05 + D * D * 1.4 + ((Pp['struck.object'] | 0) === 2 ? lv[4] * 2 : 0) + ((Pp['moan.surface'] | 0) === 2 ? lv[8] * 3 : 0);
      // the air
      smoke.forEach(function (s) { s.s.position.set(s.o.x + Math.sin(t * s.sp + s.ph) * .35 * mo, s.o.y + Math.sin(t * s.sp * .7 + s.ph * 2) * .08 * mo, s.o.z); s.s.material.rotation += dt * s.sp * .25 * mo; });
      dust.rotation.y = Math.sin(t * .05) * .25 * mo; dust.position.y = Math.sin(t * .11) * .05 * mo;
      st.drop += dt; var dq = st.drop % 3.4, fall = .5 * 9.8 * dq * dq, top = entrLow.y, bot = ZT + .004; dropM.visible = top - fall > bot && !F.still; if (dropM.visible) { dropM.position.set(entrLow.x, top - fall, entrLow.z); dropM.scale.set(1, 1 + dq * 6, 1); }
      if (BATCH) BATCH.update(t);
    }

    /* ---------- the candle flames, glows and hazes drawn as three instanced batches instead of ~80 separate draws ----------
       The per-candle objects stay (frame() animates them as before, and they keep their place in the scene); they are just
       hidden, and each frame their flame transform, glow/haze position, size and opacity are copied into the batches.
       Same shaders, same blending, same render order. ?batch=0 draws them one by one as before. */
    var BATCH = !/[?&]batch=0/.test(location.search) ? (function () {
      var lit = flames.filter(function (f) { return f.lit && f.flame && f.glow && f.haze; }), N = lit.length; if (!N) return null;
      var spriteVS = 'attribute vec3 iC; attribute vec2 iS; attribute float iA; varying vec2 vUv; varying float vA;\n' +
        'void main() { vUv = uv; vA = iA; vec4 mv = viewMatrix * vec4(iC, 1.0); mv.xy += position.xy * iS; gl_Position = projectionMatrix * mv; }';
      var spriteFS = 'uniform sampler2D map; uniform vec3 color; varying vec2 vUv; varying float vA;\n' +
        'void main() { vec4 tx = texture2D(map, vUv); gl_FragColor = vec4(color * tx.rgb, vA * tx.a);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}';
      function sprites(src, ro) {
        var q = new T.PlaneGeometry(1, 1), g = new T.InstancedBufferGeometry(); g.index = q.index; g.setAttribute('position', q.attributes.position); g.setAttribute('uv', q.attributes.uv);
        var iC = new T.InstancedBufferAttribute(new Float32Array(N * 3), 3), iS = new T.InstancedBufferAttribute(new Float32Array(N * 2), 2), iA = new T.InstancedBufferAttribute(new Float32Array(N), 1);
        [iC, iS, iA].forEach(function (a) { a.setUsage(T.DynamicDrawUsage); }); g.setAttribute('iC', iC); g.setAttribute('iS', iS); g.setAttribute('iA', iA); g.instanceCount = N;
        var m0 = src.material, m = new T.ShaderMaterial({ uniforms: { map: { value: m0.map }, color: { value: m0.color.clone() } }, vertexShader: spriteVS, fragmentShader: spriteFS, transparent: true, depthWrite: false, blending: m0.blending, fog: false });
        var o = new T.Mesh(g, m); o.frustumCulled = false; o.renderOrder = ro; o.userData.noPick = 1; sc.add(o); return { o: o, iC: iC, iS: iS, iA: iA };
      }
      var B = { glow: sprites(lit[0].glow, lit[0].glow.renderOrder), haze: sprites(lit[0].haze, lit[0].haze.renderOrder) };
      // the flames: one lathe, one shader with the per-flame seed and strength as instance attributes
      var f0 = lit[0], fm0 = f0.fm, vs = fm0.vertexShader.replace('uniform float t, sd, k;', 'uniform float t; attribute float iSd, iK; float sd, k;')
        .replace('void main() {', 'void main() { sd = iSd; k = iK;').replace('vec4 mv = modelViewMatrix * vec4(p, 1.0); vN = normalize(normalMatrix * normal);', 'vec4 mv = modelViewMatrix * instanceMatrix * vec4(p, 1.0); vN = normalize(normalMatrix * mat3(instanceMatrix) * normal);');
      var fs = fm0.fragmentShader.replace('uniform float k; varying vec3 vN, vV; varying float vY;', 'varying vec3 vN, vV; varying float vY; varying float vK;').replace('(.7 + .5 * k)', '(.7 + .5 * vK)');
      vs = vs.replace('varying float vY;', 'varying float vY; varying float vK;').replace('vY = y;', 'vY = y; vK = k;');
      var fg = f0.flame.geometry.clone(), iSd = new T.InstancedBufferAttribute(new Float32Array(N), 1), iK = new T.InstancedBufferAttribute(new Float32Array(N), 1); iK.setUsage(T.DynamicDrawUsage);
      fg.setAttribute('iSd', iSd); fg.setAttribute('iK', iK);
      var fmat = new T.ShaderMaterial({ uniforms: { t: { value: 0 } }, vertexShader: vs, fragmentShader: fs, transparent: true, depthWrite: false, blending: fm0.blending, side: fm0.side });
      var fl = new T.InstancedMesh(fg, fmat, N); fl.frustumCulled = false; fl.renderOrder = f0.flame.renderOrder; fl.userData.noPick = 1; fl.instanceMatrix.setUsage(T.DynamicDrawUsage); sc.add(fl);
      lit.forEach(function (f, i) { iSd.array[i] = f.fm.uniforms.sd.value; f.flame.visible = false; f.glow.visible = false; f.haze.visible = false; });
      var mw = new T.Matrix4(), wp = new T.Vector3();
      function put(b, sp, pm, sx, i) { wp.copy(sp.position).applyMatrix4(pm); b.iC.setXYZ(i, wp.x, wp.y, wp.z); b.iS.setXY(i, sp.scale.x * sx, sp.scale.y * sx); b.iA.setX(i, sp.material.opacity); }
      return { n: N, update: function (t) {
        fmat.uniforms.t.value = t;
        for (var i = 0; i < N; i++) {
          var f = lit[i], pm = f.grp.matrixWorld, sx = Math.hypot(pm.elements[0], pm.elements[1], pm.elements[2]);
          f.flame.updateMatrix(); mw.multiplyMatrices(pm, f.flame.matrix); fl.setMatrixAt(i, mw); iK.array[i] = f.fm.uniforms.k.value;
          put(B.glow, f.glow, pm, sx, i); put(B.haze, f.haze, pm, sx, i);
        }
        fl.instanceMatrix.needsUpdate = true; iK.needsUpdate = true; B.glow.iC.needsUpdate = B.glow.iS.needsUpdate = B.glow.iA.needsUpdate = true; B.haze.iC.needsUpdate = B.haze.iS.needsUpdate = B.haze.iA.needsUpdate = true;
      } };
    })() : null;
    window.__heAltarFX = { eyeLook: 0, drive: null };
    return { V: { woodT: woodT, woodF: woodF, key: key, fill: fill, hemi: hemi, cone: null, strZ: strZ, rods: rods, wands: wands, ROD_HZ: ROD_HZ, junkZ: junkZ, springs: springs }, roomPicks: [fl, wl], frame: frame, flames: flames, M: M };
  }
  return { build: build, HINT: HINT, CAM: CAM, FOLLOW: FOLLOW };
})();
