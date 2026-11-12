/* The Machine: a playable 3D cabinet. Every part is a hit zone that sends the same gestures as the Surface. */
(function () {
  'use strict';
  if (window.__heMachine === 'v2') return;   // Machine V2 (machine2.js) is the default; ?machine=v1 brings this one back
  var H = window.__he, $ = function (id) { return document.getElementById(id); };
  var host = $('machine'), padEl = $('pad'), V = null, tab = 'surface', TOP = 1.11;
  var HINT = ['Slide along the string. Press harder to drive it (and bend it sharp).', 'Circle the wheel. Faster cranks harder; jerk it for the buzz.', 'Stroke across the rulers. Up and down changes the overhang, and the pitch with it.', 'Drag a nail over the pane.', 'Tap the rods. Long rods are low.', 'Tap the tank, or scrub it to shake the springs.', 'Drag the magnet under the tray.', 'Rub the lamp to swell the pad. Double-click to freeze it.', 'Drag the superball over it. Press harder to raise the moan.'];
  // parts that are not a whole voice: their own hint, and the params they set when you take hold of them
  var PART = {
    beam: 'Blaster Beam \u00B7 E-bow string, Strike \u2014 tap the wire, then drag the bar along it to slide.',
    wine: 'IV \u00B7 Glass \u2014 a wet finger round a wine glass. Circle faster for a faster beat.',
    wood: 'IX \u00B7 Superball on the cabinet \u2014 drag to make the wooden box moan.',
    drum: 'IX \u00B7 Superball on the drumhead \u2014 drag to moan; press harder to raise it.',
    sheet: 'IX \u00B7 Superball on the steel sheet \u2014 drag to moan; add water to make it warble.',
    wphone: 'III \u00B7 Waterphone rods (bowed metal, Rod) \u2014 bow them; the water bends them.',
    water: 'Water \u2014 drag up and down for how much water, shake side to side to slosh it.',
    harm: 'Harmonizer \u2014 drag up and down for the shift, left and right to send the selected voice into it.'
  };

  function build() {
    var T = window.THREE; if (!T) return false;
    var r;
    try { r = new T.WebGLRenderer({ antialias: true }); } catch (e) { return false; }
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap;
    r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.15; host.insertBefore(r.domElement, host.firstChild);
    var sc = new T.Scene(); sc.background = new T.Color(0x070a09); sc.fog = new T.FogExp2(0x070a09, .05);
    var cam = new T.PerspectiveCamera(36, 1, .1, 60);
    var seed = 7; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    function tex(w, h, fn, rx, ry) { var c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); var t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx || 1, ry || 1); t.anisotropy = 4; return t; }
    // reflections for the brass and steel: a tiny lit box rendered into an environment map
    var es = new T.Scene(); es.background = new T.Color(0x050707);
    [[0xffd9a0, 5, 0, 6, 0, 8, .2, 8], [0x4fa48d, 1.2, -7, 1, 0, .2, 5, 8], [0xc8a35a, 1.5, 7, 1, 2, .2, 4, 6], [0xffffff, .5, 0, 1, 7, 8, 4, .2]].forEach(function (p) { var m = new T.Mesh(new T.BoxGeometry(p[5], p[6], p[7]), new T.MeshBasicMaterial({ color: new T.Color(p[0]).multiplyScalar(p[1]) })); m.position.set(p[2], p[3], p[4]); es.add(m); });
    var pm = new T.PMREMGenerator(r); sc.environment = pm.fromScene(es, .05).texture; pm.dispose();

    var woodT = tex(256, 256, function (c, w, h) { c.fillStyle = '#3b2415'; c.fillRect(0, 0, w, h); for (var i = 0; i < 500; i++) { c.fillStyle = 'rgba(' + (rnd() < .5 ? '20,10,5' : '110,70,40') + ',' + (rnd() * .16).toFixed(2) + ')'; c.fillRect(0, rnd() * h, w, 1 + rnd() * 2.5); } }, 2, 1);
    var floorT = tex(256, 256, function (c, w, h) { for (var i = 0; i < 4; i++) { c.fillStyle = (i + (i >> 1)) & 1 ? '#8f856e' : '#101514'; c.fillRect((i & 1) * w / 2, (i >> 1) * h / 2, w / 2, h / 2); } c.strokeStyle = 'rgba(200,163,90,.5)'; c.lineWidth = 2; c.strokeRect(0, 0, w / 2, h / 2); c.strokeRect(w / 2, h / 2, w / 2, h / 2); for (i = 0; i < 40; i++) { c.strokeStyle = 'rgba(0,0,0,' + (rnd() * .12).toFixed(2) + ')'; c.beginPath(); c.moveTo(rnd() * w, rnd() * h); c.lineTo(rnd() * w, rnd() * h); c.stroke(); } }, 14, 14);
    var wallT = tex(512, 512, function (c, w, h) { c.fillStyle = '#122420'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(200,163,90,.55)'; c.lineWidth = 2; for (var i = 0; i <= 14; i++) { var a = Math.PI + i * Math.PI / 14; c.beginPath(); c.moveTo(w / 2 + Math.cos(a) * 50, h + Math.sin(a) * 50); c.lineTo(w / 2 + Math.cos(a) * 520, h + Math.sin(a) * 520); c.stroke(); } for (i = 1; i < 5; i++) { c.beginPath(); c.arc(w / 2, h, 50 + i * 90, Math.PI, 2 * Math.PI); c.stroke(); } c.fillStyle = 'rgba(200,163,90,.5)'; c.fillRect(0, 0, 6, h); c.fillRect(w - 6, 0, 6, h); }, 3, 1);
    var M = {
      wood: new T.MeshStandardMaterial({ map: woodT, roughness: .5, metalness: 0 }),
      lac: new T.MeshStandardMaterial({ color: 0x0c1110, roughness: .22, metalness: .3 }),
      brass: new T.MeshStandardMaterial({ color: 0xc8a35a, roughness: .28, metalness: 1 }),
      steel: new T.MeshStandardMaterial({ color: 0xc3cacc, roughness: .22, metalness: 1 }),
      iron: new T.MeshStandardMaterial({ color: 0x5a5f5e, roughness: .5, metalness: 1 })
    };
    function box(w, h, d, m, x, y, z, par) { var b = new T.Mesh(new T.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; (par || sc).add(b); return b; }
    function cyl(rt, rb, h, m, x, y, z, par, seg) { var b = new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg || 24), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; (par || sc).add(b); return b; }

    // room
    var fl = new T.Mesh(new T.PlaneGeometry(22, 22), new T.MeshStandardMaterial({ map: floorT, roughness: .32, metalness: .1 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; sc.add(fl);
    var wl = new T.Mesh(new T.PlaneGeometry(22, 7.5), new T.MeshStandardMaterial({ map: wallT, roughness: .8 })); wl.position.set(0, 3.75, -4.2); wl.receiveShadow = true; sc.add(wl);
    var spot = new T.SpotLight(0xffd9a8, 7, 0, .52, .55, 0); spot.position.set(.6, 6.2, 3.4); spot.target.position.set(0, .9, 0); spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); spot.shadow.bias = -.0004; spot.shadow.camera.near = 2; spot.shadow.camera.far = 14; sc.add(spot); sc.add(spot.target);
    var hemi = new T.HemisphereLight(0x5f8f84, 0x0a0806, .35); sc.add(hemi);
    var rim = new T.DirectionalLight(0x4fa48d, .7); rim.position.set(-5, 3, -3); sc.add(rim);

    // cabinet
    box(3.6, .14, 1.75, M.lac, 0, .07, 0); box(3.44, .04, 1.6, M.brass, 0, .16, 0);
    box(3.3, .86, 1.45, M.wood, 0, .61, 0); box(3.44, .03, 1.6, M.brass, 0, 1.045, 0); box(3.5, .05, 1.65, M.lac, 0, 1.085, 0);
    for (var i = 0; i <= 10; i++) { var ray = box(.018, .62, .012, M.brass, -.75, .2, .732); var a = (i - 5) * .27; ray.geometry.translate(0, .31, 0); ray.rotation.z = -a; ray.scale.y = i % 2 ? .78 : 1; }
    cyl(.1, .1, .02, M.brass, -.75, .2, .735).rotation.x = Math.PI / 2;
    box(.02, .86, .02, M.brass, -1.66, .61, .735); box(.02, .86, .02, M.brass, 1.66, .61, .735); box(.02, .86, .02, M.brass, .16, .61, .735);

    var zones = [];
    // a zone is the invisible hit surface of a part; o.set: params it switches when grabbed (the same params as the
    // Surface's buttons), o.part: its own hint, o.ry: turned to face sideways
    function zone(src, w, h, x, y, z, flat, o) { o = o || {}; var m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide })); m.position.set(x, y, z); if (flat) m.rotation.x = -Math.PI / 2; if (o.ry) m.rotation.y = o.ry; m.userData = { src: src, w: w, h: h, set: o.set || null, part: o.part || null, kind: o.kind || null }; sc.add(m); zones.push(m); return m; }
    // solid meshes of a part point back at its zone, so the pointer picks the part that is actually in front
    function tag(o, z) { o.traverse(function (c) { if (c.isMesh) c.userData.zone = z; }); return o; }

    // I. string
    cyl(.035, .045, .16, M.brass, -1.58, TOP + .08, .56); cyl(.035, .045, .16, M.brass, 1.58, TOP + .08, .56);
    var sg = new T.BufferGeometry(), sp = new Float32Array(61 * 3); sg.setAttribute('position', new T.BufferAttribute(sp, 3));
    var string = new T.Line(sg, new T.LineBasicMaterial({ color: 0xf2ead2 })); sc.add(string);
    var puck = box(.16, .05, .11, M.lac, 0, TOP + .2, .56); var glowM = new T.MeshBasicMaterial({ color: 0x7fe0c4 }); box(.12, .012, .03, glowM, 0, -.03, 0, puck); puck.visible = false;
    zone(0, 3.1, .44, 0, TOP + .14, .56, true, { set: { 'ebow.excite': 0 } });
    // I-b. Blaster Beam on the floor in front: one heavy wire on an aluminium beam, struck and slid with a bar
    var beamG = new T.Group(); sc.add(beamG); box(3.3, .06, .14, M.steel, 0, .07, 1.25, beamG); box(.12, .05, .2, M.lac, -1.5, .025, 1.25, beamG); box(.12, .05, .2, M.lac, 1.5, .025, 1.25, beamG);
    cyl(.03, .03, .05, M.brass, -1.6, .12, 1.25, beamG, 10); cyl(.03, .03, .05, M.brass, 1.6, .12, 1.25, beamG, 10);
    var bwg = new T.BufferGeometry(), bwp = new Float32Array(61 * 3); bwg.setAttribute('position', new T.BufferAttribute(bwp, 3));
    var beamW = new T.Line(bwg, new T.LineBasicMaterial({ color: 0xe8e0c8 })); sc.add(beamW);
    var bar = cyl(.022, .022, .24, M.brass, 0, .17, 1.25); bar.rotation.x = Math.PI / 2; bar.userData.noPick = true;
    var beamZ = zone(0, 3.2, .3, 0, .16, 1.25, true, { set: { 'ebow.excite': 1 }, part: 'beam' }); tag(beamG, beamZ);
    // II. hurdy wheel on the front
    var wheel = new T.Group(); wheel.position.set(.92, .6, .735); sc.add(wheel);
    cyl(.31, .31, .05, M.wood, 0, 0, 0, wheel, 40).rotation.x = Math.PI / 2;
    var rimT = new T.Mesh(new T.TorusGeometry(.31, .018, 10, 48), M.brass); rimT.position.z = .02; wheel.add(rimT);
    for (i = 0; i < 6; i++) { var spk = box(.012, .58, .012, M.brass, 0, 0, .03, wheel); spk.rotation.z = i * Math.PI / 6; }
    box(.05, .26, .025, M.brass, 0, .13, .06, wheel); var knob = new T.Mesh(new T.SphereGeometry(.05, 16, 12), M.lac); knob.position.set(0, .26, .11); knob.castShadow = true; wheel.add(knob);
    var whZ = zone(1, .86, .86, .92, .6, .78, false); tag(wheel, whZ);
    // III. rulers over the left edge
    box(.2, .08, .8, M.lac, -1.52, TOP + .065, 0); var rulers = [];
    // the visible overhang follows Ruler length and Bend (the same numbers that set the pitch); unit-length blades, scaled
    for (i = 0; i < 3; i++) { var g = new T.Group(); g.position.set(-1.5, TOP + .035, -.26 + i * .26); sc.add(g); var bl = new T.Group(); g.add(bl); var bm = box(1, .012, .08, M.steel, -.5, 0, 0, bl); bm.position.x = -.5; box(.22, .014, .085, M.steel, .1, 0, 0, g); cyl(.02, .02, .03, M.brass, -1.52, TOP + .115, -.26 + i * .26, null, 8); g.userData.blade = bl; rulers.push(g); }
    var rulZ = zone(2, 1.0, .86, -1.95, TOP + .07, 0, true, { set: { 'bowed.object': 0 } });
    // IV. glass pane
    var glassM = new T.MeshStandardMaterial({ color: 0xa8dcd0, roughness: .04, metalness: .85, transparent: true, opacity: .26, side: T.DoubleSide });
    // the pane stands at the back edge on a riser, clear of the junk tray in front of it
    var pane = box(.9, .6, .014, glassM, -.98, TOP + .42, -.64); pane.castShadow = false;
    box(.06, .12, .1, M.brass, -1.36, TOP + .06, -.64); box(.06, .12, .1, M.brass, -.6, TOP + .06, -.64);
    var paneZ = zone(3, .9, .6, -.98, TOP + .42, -.625, false, { set: function (P) { return { 'glass.surface': (P['glass.surface'] | 0) === 1 ? 0 : P['glass.surface'], 'glass.contact': (P['glass.contact'] | 0) === 1 ? 0 : P['glass.contact'] }; } }); tag(pane, paneZ);
    // IV-b. a wine glass with a wet finger that circles its rim
    var wpts = [[0, 0], [.075, 0], [.075, .008], [.012, .02], [.009, .13], [.03, .15], [.075, .2], [.092, .27], [.088, .34], [.084, .345]].map(function (q) { return new T.Vector2(q[0], q[1]); });
    var wglass = new T.Mesh(new T.LatheGeometry(wpts, 40), new T.MeshStandardMaterial({ color: 0xcfeee6, roughness: .03, metalness: .6, transparent: true, opacity: .35, side: T.DoubleSide }));
    wglass.position.set(-.3, TOP, .2); sc.add(wglass);
    var finger = new T.Group(), skin = new T.MeshStandardMaterial({ color: 0xd8a487, roughness: .6 }); var fm = new T.Mesh(new T.CylinderGeometry(.016, .018, .14, 12), skin); fm.position.y = .07; finger.add(fm); var ft = new T.Mesh(new T.SphereGeometry(.017, 12, 8), skin); finger.add(ft); finger.visible = false; sc.add(finger);
    var wineZ = zone(3, .24, .36, -.3, TOP + .18, .2, false, { set: function (P) { return { 'glass.surface': 1, 'glass.contact': 1, 'glass.wet': Math.max(.8, P['glass.wet']) }; }, part: 'wine' }); tag(wglass, wineZ);
    // V. hanging rods
    cyl(.02, .02, .9, M.brass, .42, TOP + .45, -.5); cyl(.02, .02, .9, M.brass, 1.5, TOP + .45, -.5); box(1.14, .035, .035, M.brass, .96, TOP + .9, -.5);
    var rods = [], swing = [0, 0, 0, 0, 0, 0];
    for (i = 0; i < 6; i++) { var rg = new T.Group(); rg.position.set(.56 + i * .16, TOP + .88, -.5); sc.add(rg); var rl = .74 - i * .075; cyl(.019, .019, rl, M.steel, 0, -rl / 2 - .03, 0, rg, 12); rods.push(rg); }
    var rodsZ = zone(4, 1.0, .82, .96, TOP + .46, -.47, false);
    // VI. spring tank
    box(1.04, .03, .44, M.lac, .82, TOP + .015, .06); box(1.04, .1, .02, M.iron, .82, TOP + .05, -.16); box(1.04, .1, .02, M.iron, .82, TOP + .05, .28); box(.02, .1, .44, M.iron, .3, TOP + .05, .06); box(.02, .1, .44, M.iron, 1.34, TOP + .05, .06);
    var springs = [];
    for (i = 0; i < 2; i++) { var hg = new T.BufferGeometry(); hg.setAttribute('position', new T.BufferAttribute(new Float32Array(260 * 3), 3)); var hl = new T.Line(hg, new T.LineBasicMaterial({ color: 0xd9dfe0 })); hl.position.set(.82, TOP + .075, -.04 + i * .2); sc.add(hl); springs.push(hl); }
    zone(5, 1.04, .44, .82, TOP + .12, .06, true);
    // VII. junk tray
    var TX = -.98, TZ = .0, TS = .68;
    box(.74, .016, .74, M.iron, TX, TOP + .008, TZ); box(.76, .05, .02, M.brass, TX, TOP + .03, TZ - .37); box(.76, .05, .02, M.brass, TX, TOP + .03, TZ + .37); box(.02, .05, .74, M.brass, TX - .37, TOP + .03, TZ); box(.02, .05, .74, M.brass, TX + .37, TOP + .03, TZ);
    var nuts = new T.InstancedMesh(new T.CylinderGeometry(1, 1, .7, 6), M.steel, 80); nuts.castShadow = true; nuts.instanceMatrix.setUsage(T.DynamicDrawUsage); sc.add(nuts);
    var dummy = new T.Object3D(), rest = []; for (i = 0; i < 80; i++) rest.push(.08 + rnd() * .84, .08 + rnd() * .84, .012 + rnd() * .02);
    var mag = new T.Mesh(new T.RingGeometry(.05, .065, 24), new T.MeshBasicMaterial({ color: 0x7fe0c4, side: T.DoubleSide })); mag.rotation.x = -Math.PI / 2; mag.visible = false; sc.add(mag);
    var junkZ = zone(6, .72, .72, TX, TOP + .07, TZ, true);
    // VIII. aura lamp
    cyl(.2, .25, .06, M.lac, 0, TOP + .03, -.3); cyl(.15, .19, .05, M.brass, 0, TOP + .085, -.3); cyl(.1, .14, .05, M.lac, 0, TOP + .135, -.3);
    var orbM = new T.MeshStandardMaterial({ color: 0x1c302b, emissive: 0x4fa48d, emissiveIntensity: .3, roughness: .08, metalness: .2, transparent: true, opacity: .9 });
    var orb = new T.Mesh(new T.SphereGeometry(.21, 32, 24), orbM); orb.position.set(0, TOP + .36, -.3); orb.userData = { src: 7, orb: true }; sc.add(orb); zones.push(orb);
    var orbL = new T.PointLight(0x4fa48d, .4, 4, 1.2); orbL.position.copy(orb.position); sc.add(orbL);
    var mark = new T.Mesh(new T.OctahedronGeometry(.035), new T.MeshBasicMaterial({ color: 0xefdca6 })); mark.visible = false; sc.add(mark);

    // IX. superball: the cabinet front (wood), a frame drum on the right side, a steel thunder sheet at the back left
    var woodZ = zone(8, 1.3, .62, -.95, .62, .745, false, { set: { 'moan.surface': 0 }, part: 'wood' });
    var drum = new T.Group(); drum.position.set(1.72, .62, .12); drum.rotation.z = Math.PI / 2; sc.add(drum);
    var shell = new T.Mesh(new T.CylinderGeometry(.3, .3, .09, 40, 1, true), M.wood); shell.material = M.wood; drum.add(shell);
    var headM = new T.MeshStandardMaterial({ color: 0xe6d8b8, roughness: .85, side: T.DoubleSide }), head = new T.Mesh(new T.CircleGeometry(.29, 40), headM); head.rotation.x = -Math.PI / 2; head.position.y = -.046; drum.add(head);
    var hoop = new T.Mesh(new T.TorusGeometry(.3, .012, 8, 40), M.brass); hoop.rotation.x = Math.PI / 2; hoop.position.y = -.046; drum.add(hoop);
    var drumZ = zone(8, .58, .58, 1.775, .62, .12, false, { ry: Math.PI / 2, set: { 'moan.surface': 1 }, part: 'drum' }); tag(drum, drumZ);
    var gal = new T.Group(); gal.position.set(-2.25, 0, -.85); gal.rotation.y = .5; sc.add(gal);
    box(.04, 1.75, .04, M.brass, -.48, .875, 0, gal); box(.04, 1.75, .04, M.brass, .48, .875, 0, gal); box(1.0, .04, .04, M.brass, 0, 1.75, 0, gal); box(1.1, .04, .3, M.lac, 0, .02, 0, gal);
    var shG = new T.PlaneGeometry(.8, 1.15, 10, 14), sheetM = new T.MeshStandardMaterial({ color: 0xb9c2c4, roughness: .3, metalness: 1, side: T.DoubleSide }), sheet = new T.Mesh(shG, sheetM);
    sheet.position.set(0, 1.08, 0); sheet.castShadow = true; gal.add(sheet); var sh0 = Float32Array.from(shG.attributes.position.array);
    var sheetZ = zone(8, .8, 1.15, 0, 0, 0, false, { set: { 'moan.surface': 2 }, part: 'sheet' }); gal.add(sheetZ); sheetZ.position.set(0, 1.08, .01); tag(gal, sheetZ);
    // the mallet: a rubber ball on a springy cane; it rests on the floor by the drum until you play
    var mallet = new T.Group(), ballM = new T.MeshStandardMaterial({ color: 0xc8553d, roughness: .55 }); var ball = new T.Mesh(new T.SphereGeometry(.05, 20, 14), ballM); ball.castShadow = true; mallet.add(ball);
    var cane = new T.Group(); mallet.add(cane); var cn = cyl(.007, .009, .5, M.wood, 0, .27, 0, cane, 8); cn.castShadow = true; sc.add(mallet);
    var mRest = new T.Vector3(1.95, .055, .62);
    // harmonizer: a rack unit on the floor, front left; its dial and readout follow harm.shift
    var hz = new T.Group(); hz.position.set(-2.2, 0, .75); hz.rotation.y = .35; sc.add(hz);
    box(.66, .34, .34, M.lac, 0, .17, 0, hz); box(.68, .02, .36, M.brass, 0, .345, 0, hz); box(.66, .3, .01, M.iron, 0, .17, .172, hz);
    var dial = new T.Group(); dial.position.set(.17, .17, .18); hz.add(dial); var dk = cyl(.085, .09, .05, M.brass, 0, 0, 0, dial, 32); dk.rotation.x = Math.PI / 2; var dp = box(.012, .06, .012, M.lac, 0, .045, .03, dial);
    var lcv = document.createElement('canvas'); lcv.width = 256; lcv.height = 64; var lct = new T.CanvasTexture(lcv); lct.colorSpace = T.SRGBColorSpace;
    var lcd = new T.Mesh(new T.PlaneGeometry(.32, .08), new T.MeshBasicMaterial({ map: lct })); lcd.position.set(-.13, .2, .178); hz.add(lcd);
    var ledM = new T.MeshBasicMaterial({ color: 0x2a1410 }), led = new T.Mesh(new T.SphereGeometry(.012, 8, 6), ledM); led.position.set(-.13, .1, .18); hz.add(led);
    var harmZ = zone(-1, .62, .3, 0, .17, .19, false, { kind: 'harm', part: 'harm' }); hz.add(harmZ); tag(hz, harmZ);
    // waterphone: a steel bowl of water with rods round the rim, front right. Rods = bowed metal (Rod); the water = Water
    var wp = new T.Group(); wp.position.set(2.15, 0, 1.0); sc.add(wp);
    var bowl = new T.Mesh(new T.LatheGeometry([[0, .02], [.16, .02], [.23, .07], [.24, .16], [.2, .19], [.05, .2], [.035, .22]].map(function (q) { return new T.Vector2(q[0], q[1]); }), 40), M.steel); bowl.castShadow = true; wp.add(bowl);
    var wcol = cyl(.03, .03, .25, M.steel, 0, .33, 0, wp, 12);
    var wrods = []; for (i = 0; i < 14; i++) { var an = i / 14 * Math.PI * 2, rh = .22 + .3 * ((i * 7) % 14) / 14, rg2 = new T.Group(); rg2.position.set(Math.cos(an) * .215, .17, Math.sin(an) * .215); wp.add(rg2); cyl(.0055, .0055, rh, M.brass, 0, rh / 2, 0, rg2, 6); wrods.push(rg2); }
    var waterM = new T.MeshStandardMaterial({ color: 0x2f6f84, roughness: .05, metalness: .2, transparent: true, opacity: .75 }), water = new T.Mesh(new T.CircleGeometry(.215, 32), waterM); water.rotation.x = -Math.PI / 2; water.position.y = .12; wp.add(water);
    var wphZ = zone(2, .56, .3, 2.15, .55, 1.0, false, { ry: .4, set: function (P) { return { 'bowed.object': 1, 'water.amt': Math.max(.5, P['water.amt']) }; }, part: 'wphone' });
    var watZ = zone(-1, .46, .46, 2.15, .235, 1.0, true, { kind: 'water', part: 'water' }); tag(wp, wphZ); tag(water, watZ); bowl.userData.zone = watZ; wcol.userData.zone = watZ; // the bowl itself is the water knob; the rods bow
    // the cabinet's own glow for the body: the brass sunburst on the front lights up when the box rings
    var rayM = M.brass.clone(); rayM.emissive = new T.Color(0xc8a35a); rayM.emissiveIntensity = 0; sc.traverse(function (o) { if (o.isMesh && o.material === M.brass && Math.abs(o.position.z - .732) < .01 && o.geometry.parameters && o.geometry.parameters.height === .62) o.material = rayM; });
    // everything solid takes part in picking; meshes that are not part of a voice block the pointer (the room, the cabinet)
    var picks = []; sc.traverse(function (o) { if (o.isMesh && !o.userData.noPick && o !== mark && !o.isInstancedMesh) picks.push(o); });
    rods.forEach(function (rgp) { tag(rgp, rodsZ); }); tag(nuts, junkZ);
    mallet.traverse(function (o) { o.userData.noPick = true; }); finger.traverse(function (o) { o.userData.noPick = true; });
    picks = picks.filter(function (o) { return !o.userData.noPick && o !== mark; });

    V = { T: T, r: r, sc: sc, cam: cam, zones: zones, picks: picks, string: string, sp: sp, puck: puck, wheel: wheel, rulers: rulers, pane: pane, rods: rods, swing: swing, springs: springs, nuts: nuts, dummy: dummy, rest: rest, mag: mag, orb: orb, orbM: orbM, orbL: orbL, mark: mark, spot: spot, hemi: hemi,
      beamW: beamW, bwp: bwp, bar: bar, wglass: wglass, finger: finger, fang: 0, head: head, sheet: sheet, sh0: sh0, mallet: mallet, cane: cane, mRest: mRest, dial: dial, lcv: lcv, lct: lct, lcdTxt: '', ledM: ledM, wrods: wrods, water: water, waterM: waterM, rayM: rayM, cab: null, drips: [], spPrev: 0, slosh: 0, sl0: 0, bodyLv: 0, harmLv: 0,
      TX: TX, TZ: TZ, TS: TS, az: .42, pol: 1.08, dist: 6.2, ray: new T.Raycaster(), nd: new T.Vector2(), act: null, orbit: null, t: 0, last: 0, lv: [0, 0, 0, 0, 0, 0, 0, 0, 0], wrot: 0, flick: 1, pt: new T.Vector3(), pl: new T.Plane(), n: new T.Vector3(), wq: new T.Vector3() };
    sc.traverse(function (o) { if (o.isMesh && o.material === M.wood && o.geometry.parameters && o.geometry.parameters.width === 3.3) V.cab = o; });
    events(); size(); if (window.ResizeObserver) new ResizeObserver(size).observe(host);
    return true;
  }
  function size() { if (!V) return; var w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; V.r.setSize(w, h, false); V.cam.aspect = w / h; V.cam.fov = w < 600 ? 50 : 36; V.cam.updateProjectionMatrix(); }
  function cast(e) { var b = host.getBoundingClientRect(); V.nd.set((e.clientX - b.left) / b.width * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1); V.ray.setFromCamera(V.nd, V.cam); }
  // the part under the pointer: the nearest thing hit, whether a zone or a solid mesh of a part; a solid that belongs
  // to no part (the room, the cabinet lid) blocks the pointer, so a zone hidden behind something can never be grabbed
  function pick() {
    var hs = V.ray.intersectObjects(V.picks, false);
    for (var i = 0; i < hs.length; i++) {
      var o = hs[i].object, u = o.userData;
      if (V.zones.indexOf(o) >= 0) return { object: o, point: hs[i].point };
      if (u.zone) return { object: u.zone, point: hs[i].point };
      if (u.zone === null) continue;
      return null;
    }
    return null;
  }
  function wpos(z) { return z.getWorldPosition(V.wq); }
  function locate(z, e) { // pointer -> x,y in 0..1 on the part
    var u = z.userData, c = function (v) { return Math.min(1, Math.max(0, v)); };
    if (u.orb) return { x: c(.5 + (e.clientX - V.act.sx) / 240), y: c(.5 - (e.clientY - V.act.sy) / 240), w: z.position };
    z.getWorldDirection(V.n); V.pl.setFromNormalAndCoplanarPoint(V.n, wpos(z).clone());
    if (!V.ray.ray.intersectPlane(V.pl, V.pt)) return null;
    var w = V.pt.clone(), l = z.worldToLocal(V.pt);
    return { x: c(l.x / u.w + .5), y: c(l.y / u.h + .5), w: w };
  }
  function apply(set) { if (!set) return; if (typeof set === 'function') set = set(H.P); for (var k in set) if (H.P[k] !== set[k]) H.setParam(k, set[k]); }
  function lcd() {
    var P = H.P, sh = Math.round(P['harm.shift']), sel = H.live().sel, k = window.HE_SOURCES[sel], snd = Math.round((P[k + '.hsend'] || 0) * 100);
    var t = (sh > 0 ? '+' : '') + sh + ' st  ' + H.ROMAN[sel] + ' ' + snd + '%';
    if (t === V.lcdTxt) return; V.lcdTxt = t;
    var c = V.lcv.getContext('2d'); c.fillStyle = '#0a1210'; c.fillRect(0, 0, 256, 64); c.fillStyle = '#7fe0c4'; c.font = 'bold 30px monospace'; c.textBaseline = 'middle'; c.fillText(t, 10, 34); V.lct.needsUpdate = true;
  }
  function events() {
    var el = V.r.domElement;
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault(); cast(e); var hit = pick();
      el.setPointerCapture(e.pointerId);
      if (!hit || e.button === 2) { V.orbit = { x: e.clientX, y: e.clientY, id: e.pointerId }; return; }
      var z = hit.object, ud = z.userData, src = ud.src;
      if (ud.kind) {   // knobs in the room: the harmonizer unit and the water bowl
        var sel = H.live().sel, k = window.HE_SOURCES[sel];
        V.act = { z: z, kind: ud.kind, id: e.pointerId, sx: e.clientX, sy: e.clientY, lx: e.clientX, lt: performance.now(), v0: ud.kind === 'harm' ? H.P['harm.shift'] : H.P['water.amt'], s0: H.P[k + '.hsend'] || 0, key: k + '.hsend' };
        V.mark.position.copy(hit.point); V.mark.visible = true; return;
      }
      var go = function () {
        if (V.act) return;
        apply(ud.set);
        H.select(src); V.act = { z: z, src: src, id: e.pointerId, sx: e.clientX, sy: e.clientY, x: .5, y: .5, part: ud.part };
        var q = locate(z, e); if (!q) { V.act = null; return; }
        V.act.x = q.x; V.act.y = q.y; V.mark.position.copy(q.w); V.mark.visible = true; V.act.w = q.w.clone();
        if (src === 4) V.swing[Math.min(5, (q.x * 6) | 0)] = .35;
        H.send({ t: 'g', s: src, k: 'd', x: q.x, y: q.y, p: H.pressure(e), hz: 0 });
      };
      if (!H.live().started) H.start().then(go); else go();
    });
    el.addEventListener('pointermove', function (e) {
      if (V.orbit && e.pointerId === V.orbit.id) { V.az -= (e.clientX - V.orbit.x) * .006; V.pol = Math.min(1.5, Math.max(.35, V.pol - (e.clientY - V.orbit.y) * .005)); V.orbit.x = e.clientX; V.orbit.y = e.clientY; return; }
      cast(e);
      if (V.act && V.act.kind && e.pointerId === V.act.id) {
        var A = V.act, dy = A.sy - e.clientY, dx = e.clientX - A.sx;
        if (A.kind === 'harm') { H.setParam('harm.shift', Math.max(-24, Math.min(12, Math.round(A.v0 + dy / 14)))); H.setParam(A.key, Math.max(0, Math.min(1, A.s0 + dx / 220))); }
        else {
          H.setParam('water.amt', Math.max(0, Math.min(1, A.v0 + dy / 90)));
          var now = performance.now(), sp = Math.abs(e.clientX - A.lx) / Math.max(1, now - A.lt); A.lx = e.clientX; A.lt = now;
          V.slosh = Math.max(V.slosh, Math.min(1, sp * .6));
        }
        return;
      }
      if (V.act && e.pointerId === V.act.id) { var q = locate(V.act.z, e); if (!q) return; V.act.x = q.x; V.act.y = q.y; V.act.w = q.w.clone(); V.mark.position.copy(q.w); H.send({ t: 'g', s: V.act.src, k: 'm', x: q.x, y: q.y, p: H.pressure(e), hz: 0 }); return; }
      if (e.pointerType === 'mouse') { var h = pick(); el.style.cursor = h ? 'pointer' : 'grab'; label(h ? h.object.userData : null); }
    });
    var up = function (e) {
      if (V.orbit && e.pointerId === V.orbit.id) V.orbit = null;
      if (V.act && e.pointerId === V.act.id) { if (!V.act.kind) H.send({ t: 'g', s: V.act.src, k: 'u' }); V.act = null; V.mark.visible = false; }
    };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
    el.addEventListener('wheel', function (e) { e.preventDefault(); if (V.act) H.nudgePr(-Math.sign(e.deltaY) * .05); else V.dist = Math.min(11, Math.max(3.2, V.dist + Math.sign(e.deltaY) * .4)); }, { passive: false });
    el.addEventListener('dblclick', function (e) { cast(e); var h = pick(); if (h && h.object.userData.orb) H.setParam('aura.freeze', H.P['aura.freeze'] > .5 ? 0 : 1); });
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }
  var lastLab = null;
  function label(ud) {
    if (V && V.act) ud = V.act.z.userData;
    if (ud === lastLab) return; lastLab = ud;
    $('ml').textContent = !ud ? '' : ud.part ? PART[ud.part] : H.ROMAN[ud.src] + ' \u00B7 ' + H.SRC[ud.src].n + ' \u2014 ' + HINT[ud.src];
  }

  function frame(now) {
    if (tab !== 'machine' || !V) return;
    requestAnimationFrame(frame);
    var dt = Math.min(.05, (now - V.last) / 1000 || .016); V.last = now; V.t += dt;
    var t = V.t, L = H.live(), P = H.P, lv = V.lv, i, k, TM = L.tm || {};
    for (i = 0; i < 9; i++) lv[i] += (H.level(L.pk[i] || 0) - lv[i]) * .3;
    V.bodyLv += (H.level(TM.bp || 0) - V.bodyLv) * .3; V.harmLv += (H.level(TM.hp || 0) - V.harmLv) * .3;
    if (V.act) label(null);
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches, mo = still ? .25 : 1;
    // camera
    var c = V.cam, d = V.dist; c.position.set(Math.sin(V.az) * Math.sin(V.pol) * d, .95 + Math.cos(V.pol) * d, Math.cos(V.az) * Math.sin(V.pol) * d); c.lookAt(0, .75, .1);
    // I. the e-bow string sings when Excite is E-bow; the beam's wire when it is Strike or Pluck
    var ex = P['ebow.excite'] | 0, sp = V.sp, a0 = (ex ? 0 : lv[0]) * .045 * mo;
    for (k = 0; k <= 60; k++) { var u = k / 60, env = Math.sin(Math.PI * u); sp[k * 3] = -1.58 + 3.16 * u; sp[k * 3 + 1] = TOP + .15 + env * a0 * Math.sin(t * 70) + Math.sin(2 * Math.PI * u) * a0 * .4 * Math.sin(t * 131); sp[k * 3 + 2] = .56 + env * a0 * .5 * Math.cos(t * 83); }
    V.string.geometry.attributes.position.needsUpdate = true;
    var onBeam = V.act && V.act.part === 'beam', bx = onBeam ? -1.55 + 3.1 * V.act.x : V.bar.position.x, b0 = (ex ? lv[0] : 0) * .03 * mo, bp = V.bwp, bu = (bx + 1.6) / 3.2;
    for (k = 0; k <= 60; k++) { u = k / 60; var seg = u < bu ? u / Math.max(bu, .02) : 0, en2 = Math.sin(Math.PI * seg); bp[k * 3] = -1.6 + 3.2 * u; bp[k * 3 + 1] = .135 + en2 * b0 * Math.sin(t * 47); bp[k * 3 + 2] = 1.25 + en2 * b0 * .6 * Math.cos(t * 61); }
    V.beamW.geometry.attributes.position.needsUpdate = true; V.bar.position.x = bx;
    V.puck.visible = !!(V.act && V.act.src === 0 && !onBeam); if (V.puck.visible) V.puck.position.x = -1.55 + 3.1 * V.act.x;
    // II. wheel
    V.wrot += dt * (lv[1] > .03 ? 1.5 + 9 * lv[1] : 0); V.wheel.rotation.z = -V.wrot;
    // III. rulers: overhang from Ruler length x Bend (and the live overhang gesture); they whip when bowed
    var bnd = P['bowed.bend'] + (V.act && V.act.src === 2 && V.act.part !== 'wphone' ? (V.act.y - .5) * .7 : 0), over = P['bowed.length'] * (.7 + .6 * Math.max(0, Math.min(1, bnd))) / 14 * .62;
    var f1 = .652 / Math.pow(P['bowed.length'] * (.7 + .6 * Math.max(0, Math.min(1, bnd))) / 100, 2), vis = Math.min(16, 4 + f1 * .08), rul = (P['bowed.object'] | 0) === 0 ? lv[2] : lv[2] * .2;
    for (i = 0; i < 3; i++) { var Lr = over * (1 - i * .14); V.rulers[i].userData.blade.scale.x = Lr; V.rulers[i].rotation.z = Math.sin(t * vis * (1 + i * .3) * TAU / 6 + i) * rul * .09 * mo; }
    // IV. pane shimmers with the nail; the wine glass shows the finger circling its rim at the beat rate
    V.pane.position.x = -.98 + Math.sin(t * 190) * lv[3] * .004 * mo; V.pane.material.opacity = .26 + lv[3] * .25;
    var fing = (P['glass.contact'] | 0) === 1, wineAct = V.act && V.act.part === 'wine';
    V.finger.visible = fing && (lv[3] > .08 || wineAct);
    if (V.finger.visible) {
      if (wineAct) V.fang = Math.atan2(V.act.y - .5, V.act.x - .5); else V.fang += dt * TAU * (4 + 4 * Math.min(1, lv[3] * 1.2)) / 6 * mo;
      var R = .088; V.finger.position.set(-.3 + Math.cos(V.fang) * R, TOP + .34, .2 + Math.sin(V.fang) * R); V.finger.rotation.set(Math.sin(V.fang) * .5, 0, -Math.cos(V.fang) * .5);
    }
    V.wglass.scale.setScalar(1 + (fing ? lv[3] : 0) * .012 * Math.sin(t * 40) * mo);
    // V. rods
    var wa = P['water.amt'];
    for (i = 0; i < 6; i++) { V.swing[i] *= Math.pow(.25, dt); V.rods[i].rotation.z = Math.sin(t * (7 + i)) * (V.swing[i] + lv[4] * .05) * mo; V.rods[i].rotation.x = Math.cos(t * (6 + i * .7)) * (V.swing[i] * .4 + wa * lv[4] * .03) * mo; }
    // VI. springs: coils jiggle with the level, and each hit sends a drip down the springs (highs race ahead, lows trail)
    if (lv[5] - V.spPrev > .12) V.drips.push(0); V.spPrev = lv[5];
    for (i = V.drips.length - 1; i >= 0; i--) { V.drips[i] += dt; if (V.drips[i] > 1.4) V.drips.splice(i, 1); }
    for (i = 0; i < 2; i++) {
      var hp = V.springs[i].geometry.attributes.position, ha = hp.array, am = lv[5] * .022 * mo;
      for (k = 0; k < 260; k++) {
        var q = k / 259, wob = Math.sin(q * 30 - t * 34 + i * 2) * am * Math.sin(Math.PI * q), dz = 0;
        for (var j = 0; j < V.drips.length; j++) { var ag = V.drips[j], fr = ag / .35 % 2, pos = fr < 1 ? fr : 2 - fr, lag = q - pos, dec = Math.exp(-ag * 2.2); if (lag > -.25 && lag < .05) dz += Math.sin(lag * 90 * (1 + lag * 4)) * Math.exp(lag * 12) * .02 * dec * mo; }
        ha[k * 3] = -.48 + .96 * q + wob; ha[k * 3 + 1] = Math.cos(k * .85) * .04 + wob + dz; ha[k * 3 + 2] = Math.sin(k * .85) * .04;
      }
      hp.needsUpdate = true;
    }
    // VII. junk
    var J = L.junk, n = J ? (J.length - 3) / 3 : Math.min(80, P['junk.count'] | 0), src = J || V.rest, dm = V.dummy;
    for (i = 0; i < 80; i++) { if (i < n) { var rr = src[i * 3 + 2] * V.TS; dm.position.set(V.TX + (src[i * 3] - .5) * V.TS, TOP + .016 + rr * .35, V.TZ - (src[i * 3 + 1] - .5) * V.TS); dm.scale.set(rr, rr, rr); dm.rotation.y = i * 1.7; } else dm.scale.set(0, 0, 0); dm.updateMatrix(); V.nuts.setMatrixAt(i, dm.matrix); }
    V.nuts.instanceMatrix.needsUpdate = true;
    V.mag.visible = !!(J && J[n * 3 + 2] > .5); if (V.mag.visible) V.mag.position.set(V.TX + (J[n * 3] - .5) * V.TS, TOP + .02, V.TZ - (J[n * 3 + 1] - .5) * V.TS);
    // VIII. lamp
    var frz = TM.frz; V.orbM.emissive.setHex(frz ? 0x9fd8ff : 0x4fa48d); V.orbL.color.setHex(frz ? 0x9fd8ff : 0x4fa48d);
    var glow = .25 + lv[7] * 2.2 + (frz ? .5 : 0); V.orbM.emissiveIntensity = glow; V.orbL.intensity = glow * 1.6;
    // IX. superball: the mallet rides the pointer on whichever surface is playing; the drumhead and sheet flex with it
    var sf = P['moan.surface'] | 0, mAct = V.act && V.act.src === 8 && V.act.w, ml = lv[8];
    if (mAct) { var zn = V.act.z, nrm = new V.T.Vector3(); zn.getWorldDirection(nrm); if (nrm.dot(V.cam.position.clone().sub(V.act.w)) < 0) nrm.negate(); V.mallet.position.copy(V.act.w).addScaledVector(nrm, .05); V.mallet.lookAt(V.act.w.clone().addScaledVector(nrm, 1).add(new V.T.Vector3(0, .6, 0))); V.mallet.rotateX(Math.PI / 2); }
    else { V.mallet.position.copy(V.mRest); V.mallet.rotation.set(0, .4, Math.PI / 2); }
    V.cane.rotation.x = Math.sin(t * 23) * ml * .25 * mo; V.cane.rotation.z = Math.cos(t * 17) * ml * .15 * mo;
    V.head.position.y = -.046 - (sf === 1 ? ml * .01 * Math.sin(t * 60) * mo : 0);
    var sa = V.sheet.geometry.attributes.position, s0 = V.sh0, swv = (sf === 2 ? ml : 0) * .05 * mo, wwob = wa * .5 + .5;
    for (k = 0; k < s0.length; k += 3) { var x = s0[k] / .8 + .5, y = s0[k + 1] / 1.15 + .5; sa.array[k + 2] = swv * (Math.sin(Math.PI * x) * Math.sin(Math.PI * y) * Math.sin(t * 9 * wwob) + .5 * Math.sin(2 * Math.PI * x) * Math.sin(Math.PI * y * 2) * Math.sin(t * 14 + 1)); }
    sa.needsUpdate = true; V.sheet.geometry.computeVertexNormals();
    // the body: the cabinet swells a hair and its brass sunburst glows when the box rings
    var bl = V.bodyLv; V.rayM.emissiveIntensity = bl * .9; if (V.cab) V.cab.scale.set(1 + bl * .004 * Math.sin(t * 97) * mo, 1 + bl * .006 * Math.sin(t * 89) * mo, 1);
    // harmonizer: dial angle is the shift, the readout shows shift and the selected voice's send, the LED its return
    V.dial.rotation.z = -(P['harm.shift'] + 6) / 18 * 2.4; lcd(); V.ledM.color.setRGB(.16 + V.harmLv * .84, .08 + V.harmLv * .7, .06 + V.harmLv * .3);
    // water: level and tilt follow Water and Slosh; the rods round the rim sway with it and ring with bowed metal
    if (!(V.act && V.act.kind === 'water')) V.slosh *= Math.pow(.15, dt);
    var sl = Math.round(V.slosh * 50) / 50; if (sl !== V.sl0) { V.sl0 = sl; H.setParam('water.slosh', sl, true); }
    V.water.visible = wa > .02; V.water.position.y = .06 + wa * .12; var tw = (V.slosh * .25 + wa * .05) * mo; V.water.rotation.set(-Math.PI / 2 + Math.sin(t * (2 + 6 * V.slosh)) * tw, Math.cos(t * (1.7 + 5 * V.slosh)) * tw, 0);
    V.waterM.opacity = .35 + wa * .45;
    var wpl = (P['bowed.object'] | 0) === 1 ? lv[2] : 0;
    for (i = 0; i < V.wrods.length; i++) { V.wrods[i].rotation.x = (Math.sin(t * (3 + i * .37) + i) * wa * .04 + Math.sin(t * (31 + i * 3)) * wpl * .05) * mo; V.wrods[i].rotation.z = Math.cos(t * (2.6 + i * .29)) * wa * .04 * mo; }
    // the room follows the macros: Dread dims and reddens the lamp, Distance thickens the air
    var D = P['macro.dread'];
    if (!still && D > .55 && Math.random() < (D - .5) * .12) V.flick = .45 + Math.random() * .4; V.flick += (1 - V.flick) * .12;
    V.spot.intensity = 7 * (1 - D * .5) * V.flick; V.spot.color.setRGB(1, .85 - D * .35, .66 - D * .45);
    V.sc.fog.density = .04 + P['macro.distance'] * .1; V.hemi.intensity = .35 - D * .15;
    if (V.mark.visible) V.mark.rotation.y = t * 3;
    V.r.render(V.sc, V.cam);
  }
  var TAU = Math.PI * 2;

  function show(which, quiet) {
    if (which === 'machine' && !V && !build()) { $('tabNote').textContent = window.THREE ? 'This browser could not start WebGL.' : 'The 3D view needs vendor/three.min.js next to index.html.'; which = 'surface'; }
    tab = which; var m = which === 'machine';
    host.hidden = !m; padEl.hidden = m; ['hn', 'hp', 'hx', 'hy'].forEach(function (id) { $(id).hidden = m; });
    $('tabMachine').setAttribute('aria-selected', m ? 'true' : 'false'); $('tabSurface').setAttribute('aria-selected', m ? 'false' : 'true');
    H.machine(m); window.dispatchEvent(new Event('resize'));
    if (!quiet) try { localStorage.setItem('horror-engine.tab', which); } catch (e) { }
    if (m) { size(); V.last = performance.now(); requestAnimationFrame(frame); }
  }
  $('tabMachine').addEventListener('click', function () { show('machine'); });
  $('tabSurface').addEventListener('click', function () { show('surface'); });
  var want = 'machine'; try { want = localStorage.getItem('horror-engine.tab') || 'machine'; } catch (e) { }
  if (want === 'machine' && window.THREE) show('machine', true);
  // for the browser tests: every zone's projected centre, and whether the pointer there picks that same zone
  window.__he.view = function () {
    var z = []; if (V) { var b = host.getBoundingClientRect(); V.zones.forEach(function (m, i) {
      var p = m.getWorldPosition(new V.T.Vector3()).project(V.cam), cx = b.left + (p.x + 1) / 2 * b.width, cy = b.top + (1 - p.y) / 2 * b.height;
      cast({ clientX: cx, clientY: cy }); var h = pick(); z.push([m.userData.src, cx, cy, m.userData.part || m.userData.kind || '', h ? V.zones.indexOf(h.object) === i : false]); }); }
    return { tab: tab, ok: !!V, zones: z };
  };
  // for the browser tests: screen point of (u, v) in 0..1 on zone i (u along its width, v up its height)
  window.__he.zpt = function (i, u, v) {
    var m = V.zones[i], ud = m.userData, b = host.getBoundingClientRect(), p = m.localToWorld(new V.T.Vector3((u - .5) * (ud.w || .4), (v - .5) * (ud.h || .4), 0)).project(V.cam);
    return [b.left + (p.x + 1) / 2 * b.width, b.top + (1 - p.y) / 2 * b.height];
  };
  // grid audit: share of each zone's own screen footprint where the pointer picks something else in front of it
  window.__he.audit = function () {
    if (!V) return null; var b = host.getBoundingClientRect(), T = V.T, out = [];
    V.zones.forEach(function (m, zi) {
      var u = m.userData, own = 0, other = 0, w = u.w || .4, h = u.h || .4;
      for (var gx = -.4; gx <= .41; gx += .2) for (var gy = -.4; gy <= .41; gy += .2) {
        var lp = u.orb ? new T.Vector3(gx * .3, gy * .3, .2) : new T.Vector3(gx * w, gy * h, 0), wp = m.localToWorld(lp.clone()), p = wp.clone().project(V.cam);
        cast({ clientX: b.left + (p.x + 1) / 2 * b.width, clientY: b.top + (1 - p.y) / 2 * b.height }); var hh = pick();
        if (hh && hh.object === m) own++; else if (hh && V.zones.indexOf(hh.object) >= 0) other++;
      }
      out.push({ src: u.src, part: u.part || u.kind || '', own: own, other: other });
    });
    return out;
  };
})();
