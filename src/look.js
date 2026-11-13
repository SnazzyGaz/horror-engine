/* The Machine's look: an HDR post chain (MSAA scene buffer, soft bloom, ACES, vignette, sRGB, dither), merging of static
   parts into a few draw calls, and baked contact shadows. Plain WebGL2 through three.js r160 (no addons), so it runs from
   file:// with no network. Horror Engine (c) 2026 Garyck Arntzen (https://x.com/_mintydoge), MIT licence. */
window.HELook = (function () {
  'use strict';
  var VS = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  // 4 bilinear taps at the corners of the texel: a 4x4 box, cheap and stable for downsampling
  var DOWN = 'uniform sampler2D tMap; uniform vec2 texel; uniform float thr, knee, first; varying vec2 vUv;\n' +
    'void main() { vec2 o = texel; vec3 c = (texture2D(tMap, vUv + vec2(-o.x, -o.y)).rgb + texture2D(tMap, vUv + vec2(o.x, -o.y)).rgb + texture2D(tMap, vUv + vec2(-o.x, o.y)).rgb + texture2D(tMap, vUv + vec2(o.x, o.y)).rgb) * .25;\n' +
    '  if (first > .5) { c = min(c, vec3(64.0)); float br = max(c.r, max(c.g, c.b)); float s = clamp(br - thr + knee, 0.0, 2.0 * knee); s = s * s / (4.0 * knee + 1e-4); c *= max(s, br - thr) / max(br, 1e-4); }\n' +
    '  gl_FragColor = vec4(c, 1.0); }';
  // 9-tap tent upsample, added onto the next larger level
  var UP = 'uniform sampler2D tMap; uniform vec2 texel; uniform float k; varying vec2 vUv;\n' +
    'void main() { vec2 o = texel; vec3 c = texture2D(tMap, vUv).rgb * 4.0;\n' +
    '  c += (texture2D(tMap, vUv + vec2(o.x, 0.0)).rgb + texture2D(tMap, vUv - vec2(o.x, 0.0)).rgb + texture2D(tMap, vUv + vec2(0.0, o.y)).rgb + texture2D(tMap, vUv - vec2(0.0, o.y)).rgb) * 2.0;\n' +
    '  c += texture2D(tMap, vUv + o).rgb + texture2D(tMap, vUv - o).rgb + texture2D(tMap, vUv + vec2(o.x, -o.y)).rgb + texture2D(tMap, vUv + vec2(-o.x, o.y)).rgb;\n' +
    '  gl_FragColor = vec4(c / 16.0 * k, 1.0); }';
  var COMP = 'uniform sampler2D tScene, tBloom; uniform float bloom, exposure, vig, grain, time; uniform vec2 res; varying vec2 vUv;\n' +
    'vec3 heFit(vec3 v) { vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }\n' +
    'vec3 heAces(vec3 c) { const mat3 I = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));\n' +
    '  const mat3 O = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602)); c *= exposure / 0.6; c = I * c; c = heFit(c); c = O * c; return clamp(c, 0.0, 1.0); }\n' +
    'vec3 heSrgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c)); }\n' +
    'float heHash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }\n' +
    'void main() { vec3 c = texture2D(tScene, vUv).rgb + texture2D(tBloom, vUv).rgb * bloom;\n' +
    '  vec2 q = vUv - .5; q.x *= res.x / res.y; float v = 1.0 - vig * smoothstep(.35, 1.05, length(q)); c *= v;\n' +
    '  c = heSrgb(heAces(c)); float n = heHash(gl_FragCoord.xy + fract(time) * 61.0) - .5; c += n * (grain + 1.0 / 255.0);\n' +
    '  gl_FragColor = vec4(c, 1.0); }';

  function Post(T, r, o) {
    o = o || {}; this.T = T; this.r = r; this.on = true; this.levels = o.levels || 5; this.maxS = o.samples === undefined ? 4 : o.samples; this.fixedS = !!o.fixedSamples;
    var hf = { type: T.HalfFloatType, depthBuffer: false, minFilter: T.LinearFilter, magFilter: T.LinearFilter };
    this.rt = new T.WebGLRenderTarget(2, 2, { type: T.HalfFloatType, samples: o.samples === undefined ? 4 : o.samples, minFilter: T.LinearFilter, magFilter: T.LinearFilter });
    this.bl = []; for (var i = 0; i < this.levels; i++) this.bl.push(new T.WebGLRenderTarget(2, 2, hf));
    this.cam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1); this.sc = new T.Scene();
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3)); g.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
    this.q = new T.Mesh(g, null); this.q.frustumCulled = false; this.sc.add(this.q);
    var sm = function (fs, u, add) { return new T.ShaderMaterial({ vertexShader: VS, fragmentShader: fs, uniforms: u, depthTest: false, depthWrite: false, blending: add ? T.AdditiveBlending : T.NoBlending, transparent: !!add }); };
    this.mDown = sm(DOWN, { tMap: { value: null }, texel: { value: new T.Vector2() }, thr: { value: o.threshold || 1.6 }, knee: { value: .6 }, first: { value: 0 } });
    this.mUp = sm(UP, { tMap: { value: null }, texel: { value: new T.Vector2() }, k: { value: 1 } }, true);
    this.mComp = sm(COMP, { tScene: { value: this.rt.texture }, tBloom: { value: this.bl[0].texture }, bloom: { value: o.bloom === undefined ? .22 : o.bloom }, exposure: { value: 1 }, vig: { value: o.vignette === undefined ? .32 : o.vignette }, grain: { value: o.grain === undefined ? .012 : o.grain }, time: { value: 0 }, res: { value: new T.Vector2(1, 1) } });
  }
  Post.prototype.setSize = function (w, h) {
    w = Math.max(2, w | 0); h = Math.max(2, h | 0);
    // 8x MSAA up to about 2 megapixels; above that 4x (the extra samples cost more than they show at that density)
    var sm = this.fixedS ? this.maxS : (w * h > 2.2e6 ? Math.min(4, this.maxS) : this.maxS); if (this.capS) sm = Math.min(sm, this.capS); if (sm !== this.rt.samples) { this.rt.samples = sm; this.rt.dispose(); }
    this.rt.setSize(w, h); this.mComp.uniforms.res.value.set(w, h);
    for (var i = 0; i < this.levels; i++) { w = Math.max(1, w >> 1); h = Math.max(1, h >> 1); this.bl[i].setSize(w, h); }
  };
  Post.prototype.pass = function (m, target, clear) { var r = this.r; this.q.material = m; r.setRenderTarget(target); if (clear) r.clear(true, false, false); r.render(this.sc, this.cam); };
  // compile the post shaders ahead of the first frame (one at a time, each for the target it draws into), so their
  // first use is not a synchronous compile in the middle of a frame
  Post.prototype.compileAsync = function () {
    var r = this.r, self = this, T = this.T, list = [[this.mDown, this.bl[0]], [this.mUp, this.bl[0]], [this.mComp, null]], i = 0;
    return new Promise(function (ok) {
      (function next() {
        if (i >= list.length) { r.setRenderTarget(null); return ok(); }
        var m = list[i][0], t = list[i][1], s = new T.Scene(), q = new T.Mesh(self.q.geometry, m); q.frustumCulled = false; s.add(q); i++;
        var p = null; try { r.setRenderTarget(t); p = r.compileAsync ? r.compileAsync(s, self.cam) : (r.compile(s, self.cam), null); } catch (e) { } r.setRenderTarget(null);
        if (p) p.then(function () { setTimeout(next, 0); }, function () { setTimeout(next, 0); }); else setTimeout(next, 0);
      })();
    });
  };
  Post.prototype.render = function (scene, cam, t) {
    var r = this.r, i, ac = r.autoClear;
    r.setRenderTarget(this.rt); r.render(scene, cam);
    r.autoClear = false;
    // bloom: downsample with a soft threshold, then tent-upsample back, each level added onto the next larger one
    var src = this.rt.texture, sw = this.rt.width, sh = this.rt.height;
    for (i = 0; i < this.levels; i++) { var u = this.mDown.uniforms; u.tMap.value = src; u.texel.value.set(.5 / sw, .5 / sh); u.first.value = i === 0 ? 1 : 0; this.pass(this.mDown, this.bl[i], true); src = this.bl[i].texture; sw = this.bl[i].width; sh = this.bl[i].height; }
    for (i = this.levels - 1; i > 0; i--) { var uu = this.mUp.uniforms; uu.tMap.value = this.bl[i].texture; uu.texel.value.set(1 / this.bl[i].width, 1 / this.bl[i].height); this.pass(this.mUp, this.bl[i - 1], false); }
    this.mComp.uniforms.exposure.value = r.toneMappingExposure; this.mComp.uniforms.time.value = t || 0;
    this.pass(this.mComp, null, false);
    r.autoClear = ac;
  };
  Post.prototype.dispose = function () { this.rt.dispose(); this.bl.forEach(function (b) { b.dispose(); }); [this.mDown, this.mUp, this.mComp].forEach(function (m) { m.dispose(); }); this.q.geometry.dispose(); };

  // static parts that share a material and a hit zone become one mesh (same look, same picking, far fewer draw calls)
  // every group under the rig gets the same treatment in its own space, so moving groups keep moving as one
  function mergeAll(T, rig, skip) {
    var tot = { before: 0, after: 0 }, gs = []; rig.traverse(function (o) { if (!o.isMesh && o.children.length) gs.push(o); });
    gs.forEach(function (g) { var q = mergeStatic(T, g, skip); tot.before += q.before; tot.after += q.after; }); return tot;
  }
  function mergeStatic(T, rig, skip) {
    var groups = {}, before = 0;
    rig.updateMatrixWorld(true);
    rig.children.slice().forEach(function (c) {
      if (!c.isMesh || c.isInstancedMesh || skip.has(c) || skip.has(c.geometry) || Array.isArray(c.material) || !c.visible || c.renderOrder) return;
      var m = c.material, g = c.geometry; if (!m || m.transparent || m.visible === false || m.transmission > 0 || !g.attributes.normal || !g.attributes.uv || g.morphAttributes.position) return;
      if (Object.keys(c.userData).some(function (k) { return k !== 'zone'; }) || c.children.length) return;
      var z = c.userData.zone, key = m.uuid + '|' + (z ? z.uuid : '-') + '|' + c.castShadow + c.receiveShadow;
      (groups[key] = groups[key] || []).push(c); before++;
    });
    var after = 0;
    Object.keys(groups).forEach(function (key) {
      var L = groups[key]; if (L.length < 2) { after += L.length; return; }
      var pos = [], nor = [], uv = [], v = new T.Vector3(), nm = new T.Matrix3();
      L.forEach(function (c) {
        var g = c.geometry.index ? c.geometry.toNonIndexed() : c.geometry, pa = g.attributes.position, na = g.attributes.normal, ua = g.attributes.uv; c.updateMatrix(); nm.getNormalMatrix(c.matrix);
        for (var k = 0; k < pa.count; k++) { v.fromBufferAttribute(pa, k).applyMatrix4(c.matrix); pos.push(v.x, v.y, v.z); v.fromBufferAttribute(na, k).applyMatrix3(nm).normalize(); nor.push(v.x, v.y, v.z); uv.push(ua.getX(k), ua.getY(k)); }
        if (g !== c.geometry) g.dispose(); c.geometry.dispose(); rig.remove(c);
      });
      var mg = new T.BufferGeometry(); mg.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); mg.setAttribute('normal', new T.Float32BufferAttribute(nor, 3)); mg.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
      mg.computeBoundingSphere(); mg.computeBoundingBox();
      var o = new T.Mesh(mg, L[0].material); o.castShadow = L[0].castShadow; o.receiveShadow = L[0].receiveShadow; if (L[0].userData.zone) o.userData.zone = L[0].userData.zone; o.name = 'merged'; rig.add(o); after++;
    });
    return { before: before, after: after };
  }
  // everything an animation or handler reaches through V: these stay separate objects
  function reach(V, skipKeys) {
    var s = new Set(), seen = new Set();
    (function walk(v, d) {
      if (!v || typeof v !== 'object' || d > 6 || seen.has(v)) return; seen.add(v);
      if (v.isObject3D) { s.add(v); if (v.geometry) s.add(v.geometry); return; }   // its children may still merge (in its own space)
      if (v.isBufferGeometry) { s.add(v); return; }
      if (Array.isArray(v)) { v.forEach(function (x) { walk(x, d + 1); }); return; }
      if (Object.getPrototypeOf(v) === Object.prototype) Object.keys(v).forEach(function (k) { if (d === 0 && skipKeys.indexOf(k) >= 0) return; walk(v[k], d + 1); });
    })(V, 0);
    return s;
  }
  // a soft dark footprint on the floor: what an ambient-occlusion bake gives under a heavy box on legs
  function contact(T, w, d, feet) {
    // computed straight into a texture (no canvas read-back): soft radial blobs, combined like layered paint, stored as the
    // multiply factor 1 - alpha (white = untouched floor)
    var W = 256, Hh = 128, px = new Uint8Array(W * Hh * 4), bl = [[128, 64, 125, 60, .5], [128, 64, 100, 40, .35]];
    (feet || []).forEach(function (f) { var cx = 128 + f[0] / w * 256, cy = 64 + f[1] / d * 128; bl.push([cx, cy, 15, 15, .75], [cx, cy, 6, 6, .55]); });
    for (var y = 0; y < Hh; y++) for (var x = 0; x < W; x++) {
      var keep = 1; for (var i = 0; i < bl.length; i++) { var b = bl[i], dx = (x + .5 - b[0]) / b[2], dy = (y + .5 - b[1]) / b[3], rr = Math.sqrt(dx * dx + dy * dy); if (rr >= 1) continue;
        var a = rr < .55 ? b[4] * (1 - .45 * rr / .55) : b[4] * .55 * (1 - (rr - .55) / .45); keep *= 1 - a; }
      var j = ((Hh - 1 - y) * W + x) * 4, v = Math.round(255 * keep); px[j] = px[j + 1] = px[j + 2] = v; px[j + 3] = 255;
    }
    var t = new T.DataTexture(px, W, Hh, T.RGBAFormat, T.UnsignedByteType); t.colorSpace = T.SRGBColorSpace; t.magFilter = T.LinearFilter; t.minFilter = T.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true;
    var m = new T.Mesh(new T.PlaneGeometry(w, d), new T.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, color: 0xffffff, toneMapped: false, fog: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    m.material.blending = T.MultiplyBlending; m.material.premultipliedAlpha = true;
    m.rotation.x = -Math.PI / 2; m.renderOrder = -1; return m;
  }

  // UVs in metres, so every photo texture has the same real-world scale on every part (BoxGeometry and friends give each face
  // 0..1, which squashed a 1.8 m board of grain onto a 2 cm block). Round things keep their own parametrisation, scaled to
  // metres; flat-faced things get a box projection with u along the longer side of the part (so the grain follows the board).
  // A per-part offset from its position keeps neighbouring boards from showing the same figure.
  function worldUV(T, root, want) {
    var n = 0, s = new T.Vector3(), wp = new T.Vector3();
    root.traverse(function (o) {
      if (!o.isMesh || o.isInstancedMesh || !o.geometry || !o.geometry.attributes.uv) return;
      var ms = Array.isArray(o.material) ? o.material : [o.material]; if (!ms.some(want)) return;
      var g = o.geometry, ty = g.type, P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv, pr = g.parameters || {}, i;
      if (ty === 'ExtrudeGeometry' || ty === 'TubeGeometry') return;   // extrusions already carry shape units (metres); tubes are wire
      o.getWorldScale(s); o.getWorldPosition(wp);
      var h = Math.abs(Math.sin(wp.x * 12.9898 + wp.y * 78.233 + wp.z * 37.719) * 43758.5453), ou = (h % 1) * 3, ov = (h * 7.31 % 1) * 3;
      if (!g.boundingBox) g.computeBoundingBox(); var bb = g.boundingBox, ex = [(bb.max.x - bb.min.x) * s.x, (bb.max.y - bb.min.y) * s.y, (bb.max.z - bb.min.z) * s.z];
      for (i = 0; i < P.count; i++) {
        var x = P.getX(i) * s.x, y = P.getY(i) * s.y, z = P.getZ(i) * s.z, u, v;
        if (ty === 'CylinderGeometry' || ty === 'ConeGeometry' || ty === 'LatheGeometry') {
          var ny = N ? Math.abs(N.getY(i)) : 0;
          if (ny > .98 && ty !== 'LatheGeometry') { u = x; v = z; }
          else { var rr = Math.max(Math.sqrt(x * x + z * z), .002); u = U.getX(i) * 2 * Math.PI * (ty === 'LatheGeometry' ? Math.max(ex[0], ex[2]) / 2 : rr); v = ty === 'LatheGeometry' ? U.getY(i) * ex[1] * 1.3 : y; }
          if (ex[1] > Math.max(ex[0], ex[2]) * 1.5 && ny <= .98) { var t0 = u; u = v; v = t0; }   // tall: grain runs up the part
        } else if (ty === 'SphereGeometry' || ty === 'TorusGeometry') { var R = Math.max(ex[0], ex[1], ex[2]) / 2; u = U.getX(i) * 2 * Math.PI * R; v = U.getY(i) * Math.PI * R; }
        else {
          var nx = N ? Math.abs(N.getX(i)) : 0, nyy = N ? Math.abs(N.getY(i)) : 1, nz = N ? Math.abs(N.getZ(i)) : 0, a, b, ea, eb;
          if (nx >= nyy && nx >= nz) { a = z; b = y; ea = ex[2]; eb = ex[1]; } else if (nyy >= nz) { a = x; b = z; ea = ex[0]; eb = ex[2]; } else { a = x; b = y; ea = ex[0]; eb = ex[1]; }
          if (eb > ea * 1.2) { u = b; v = a; } else { u = a; v = b; }
        }
        U.setXY(i, u + ou, v + ov);
      }
      U.needsUpdate = true; n++;
    });
    return n;
  }
  return { worldUV: worldUV, Post: Post, mergeStatic: mergeStatic, mergeAll: mergeAll, reach: reach, contact: contact };
})();
