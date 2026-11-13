/* Sculpting kit for the Altar skin: everything organic (skulls, bones, a goat idol, entrails) is modelled in code, like the
   rest of the Machine. A shape is a signed distance function; surface nets turn it into a mesh, the field's gradient gives
   the normals, and the field itself bakes the ambient occlusion into vertex colours (dirt in every socket and seam).
   Thin parts (ribs, horns, gut) are swept tubes. gore() adds blood, rust, grime and a fine bump to any standard material
   from 3D noise in object space, so nothing needs UVs. No model files, no textures loaded.
   Horror Engine (c) 2026 Garyck Arntzen (https://x.com/_mintydoge), MIT licence. */
window.HESculpt = (function () {
  'use strict';
  var TAU = Math.PI * 2, sqrt = Math.sqrt, abs = Math.abs, min = Math.min, max = Math.max, sin = Math.sin, cos = Math.cos;

  /* ---------- noise ---------- */
  var PM = new Uint8Array(512);
  (function () { var p = [], s = 1237, i; for (i = 0; i < 256; i++) p[i] = i; for (i = 255; i > 0; i--) { s = (s * 16807) % 2147483647; var j = s % (i + 1), t = p[i]; p[i] = p[j]; p[j] = t; } for (i = 0; i < 512; i++) PM[i] = p[i & 255]; })();
  function n3(x, y, z) {
    var xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi; xi &= 255; yi &= 255; zi &= 255;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
    var A = PM[xi] + yi, B = PM[xi + 1] + yi, AA = PM[A] + zi, AB = PM[A + 1] + zi, BA = PM[B] + zi, BB = PM[B + 1] + zi;
    var a = PM[AA], b = PM[BA], c = PM[AB], d = PM[BB], e = PM[AA + 1], f = PM[BA + 1], g = PM[AB + 1], h = PM[BB + 1];
    var x0 = a + (b - a) * u, x1 = c + (d - c) * u, x2 = e + (f - e) * u, x3 = g + (h - g) * u, y0 = x0 + (x1 - x0) * v, y1 = x2 + (x3 - x2) * v;
    return (y0 + (y1 - y0) * w) / 255;
  }
  function fbm3(x, y, z, o) { var s = 0, a = .5, f = 1, t = 0; for (var i = 0; i < (o || 4); i++) { s += a * n3(x * f + i * 17.1, y * f + i * 3.7, z * f + i * 9.2); t += a; f *= 2.03; a *= .5; } return s / t; }
  function rng(seed) { var s = seed || 7; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

  /* ---------- distance primitives (plain numbers, no allocation) ---------- */
  function ell(x, y, z, cx, cy, cz, rx, ry, rz) { x -= cx; y -= cy; z -= cz; var k0 = sqrt(x * x / (rx * rx) + y * y / (ry * ry) + z * z / (rz * rz)), k1 = sqrt(x * x / (rx * rx * rx * rx) + y * y / (ry * ry * ry * ry) + z * z / (rz * rz * rz * rz)); return k1 < 1e-9 ? -min(rx, ry, rz) : k0 * (k0 - 1) / k1; }
  // capsule a..b, radius r1 at a and r2 at b
  function cap(x, y, z, ax, ay, az, bx, by, bz, r1, r2) { var px = x - ax, py = y - ay, pz = z - az, dx = bx - ax, dy = by - ay, dz = bz - az, h = (px * dx + py * dy + pz * dz) / (dx * dx + dy * dy + dz * dz); h = h < 0 ? 0 : h > 1 ? 1 : h; px -= dx * h; py -= dy * h; pz -= dz * h; return sqrt(px * px + py * py + pz * pz) - (r2 === undefined ? r1 : r1 + (r2 - r1) * h); }
  function rbox(x, y, z, cx, cy, cz, hx, hy, hz, r) { var qx = abs(x - cx) - hx + r, qy = abs(y - cy) - hy + r, qz = abs(z - cz) - hz + r, ax = max(qx, 0), ay = max(qy, 0), az = max(qz, 0); return sqrt(ax * ax + ay * ay + az * az) + min(max(qx, max(qy, qz)), 0) - r; }
  function smin(a, b, k) { var h = max(k - abs(a - b), 0) / k; return min(a, b) - h * h * k * .25; }
  function smax(a, b, k) { var h = max(k - abs(a - b), 0) / k; return max(a, b) + h * h * k * .25; }

  /* ---------- surface nets: field f(x, y, z) < 0 inside, box b = [x0, y0, z0, x1, y1, z1], cell size c ---------- */
  function nets(T, f, b, c, o) {
    o = o || {};
    var nx = Math.ceil((b[3] - b[0]) / c) + 1, ny = Math.ceil((b[4] - b[1]) / c) + 1, nz = Math.ceil((b[5] - b[2]) / c) + 1, g = new Float32Array(nx * ny * nz), i, j, k;
    // coarse pass: a block whose centre is farther from the surface than its own reach is filled without sampling
    var B = 4, far = B * c * 1.9, done = new Uint8Array(nx * ny * nz);
    for (k = 0; k < nz; k += B) for (j = 0; j < ny; j += B) for (i = 0; i < nx; i += B) {
      var d0 = f(b[0] + (i + B / 2) * c, b[1] + (j + B / 2) * c, b[2] + (k + B / 2) * c); if (abs(d0) < far) continue;
      for (var kk = k; kk < min(nz, k + B); kk++) for (var jj = j; jj < min(ny, j + B); jj++) for (var ii = i; ii < min(nx, i + B); ii++) { var q = ii + nx * (jj + ny * kk); g[q] = d0; done[q] = 1; }
    }
    for (k = 0; k < nz; k++) for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) { var q2 = i + nx * (j + ny * k); if (!done[q2]) g[q2] = f(b[0] + i * c, b[1] + j * c, b[2] + k * c); }
    var cx = nx - 1, cy = ny - 1, cz = nz - 1, vid = new Int32Array(cx * cy * cz).fill(-1), pos = [], idx = [];
    var EA = [0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3], EB = [1, 3, 3, 2, 5, 7, 7, 6, 4, 5, 6, 7];   // cube edges by corner number (bit 0 = x, 1 = y, 2 = z)
    var cv = new Float32Array(8);
    for (k = 0; k < cz; k++) for (j = 0; j < cy; j++) for (i = 0; i < cx; i++) {
      var m = 0, n; for (n = 0; n < 8; n++) { cv[n] = g[(i + (n & 1)) + nx * ((j + ((n >> 1) & 1)) + ny * (k + ((n >> 2) & 1)))]; if (cv[n] < 0) m |= 1 << n; }
      if (m === 0 || m === 255) continue;
      var sx = 0, sy = 0, sz = 0, cnt = 0;
      for (n = 0; n < 12; n++) { var a = EA[n], bb = EB[n], va = cv[a], vb = cv[bb]; if ((va < 0) === (vb < 0)) continue; var t = va / (va - vb);
        sx += (a & 1) + (((bb & 1) - (a & 1)) * t); sy += ((a >> 1) & 1) + ((((bb >> 1) & 1) - ((a >> 1) & 1)) * t); sz += ((a >> 2) & 1) + ((((bb >> 2) & 1) - ((a >> 2) & 1)) * t); cnt++; }
      vid[i + cx * (j + cy * k)] = pos.length / 3; pos.push(b[0] + (i + sx / cnt) * c, b[1] + (j + sy / cnt) * c, b[2] + (k + sz / cnt) * c);
    }
    // one quad per grid edge that crosses the surface, wound by which end is inside
    var V = function (a, b2, c2) { return vid[a + cx * (b2 + cy * c2)]; };
    for (k = 1; k < cz; k++) for (j = 1; j < cy; j++) for (i = 1; i < cx; i++) {
      var g0 = g[i + nx * (j + ny * k)], s0 = g0 < 0, a0, a1, a2, a3;
      if (s0 !== (g[i + 1 + nx * (j + ny * k)] < 0)) { a0 = V(i, j - 1, k - 1); a1 = V(i, j, k - 1); a2 = V(i, j, k); a3 = V(i, j - 1, k); if (s0) idx.push(a0, a1, a2, a0, a2, a3); else idx.push(a0, a2, a1, a0, a3, a2); }
      if (s0 !== (g[i + nx * (j + 1 + ny * k)] < 0)) { a0 = V(i - 1, j, k - 1); a1 = V(i - 1, j, k); a2 = V(i, j, k); a3 = V(i, j, k - 1); if (s0) idx.push(a0, a1, a2, a0, a2, a3); else idx.push(a0, a2, a1, a0, a3, a2); }
      if (s0 !== (g[i + nx * (j + ny * (k + 1))] < 0)) { a0 = V(i - 1, j - 1, k); a1 = V(i, j - 1, k); a2 = V(i, j, k); a3 = V(i - 1, j, k); if (s0) idx.push(a0, a1, a2, a0, a2, a3); else idx.push(a0, a2, a1, a0, a3, a2); }
    }
    // normals from the field's gradient; occlusion from how fast the field opens up along the normal
    var nv = pos.length / 3, P = new Float32Array(pos), N = new Float32Array(nv * 3), C = new Float32Array(nv * 3), e = c * .6, ao = o.ao === undefined ? 1 : o.ao;
    for (i = 0; i < nv; i++) {
      var x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2], gx = f(x + e, y, z) - f(x - e, y, z), gy = f(x, y + e, z) - f(x, y - e, z), gz = f(x, y, z + e) - f(x, y, z - e), l = 1 / (sqrt(gx * gx + gy * gy + gz * gz) || 1);
      gx *= l; gy *= l; gz *= l; N[i * 3] = gx; N[i * 3 + 1] = gy; N[i * 3 + 2] = gz;
      var occ = 1; if (ao) { var r1 = .004 * ao, r2 = .011 * ao, r3 = .026 * ao; occ = (min(1, max(0, f(x + gx * r1, y + gy * r1, z + gz * r1) / r1)) + min(1, max(0, f(x + gx * r2, y + gy * r2, z + gz * r2) / r2)) + min(1, max(0, f(x + gx * r3, y + gy * r3, z + gz * r3) / r3))) / 3; }
      var col = o.color ? o.color(x, y, z, occ, gx, gy, gz) : [occ, occ, occ]; C[i * 3] = col[0]; C[i * 3 + 1] = col[1]; C[i * 3 + 2] = col[2];
    }
    var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(P, 3)); geo.setAttribute('normal', new T.BufferAttribute(N, 3)); geo.setAttribute('color', new T.BufferAttribute(C, 3));
    geo.setAttribute('uv', new T.BufferAttribute(new Float32Array(nv * 2), 2)); geo.setIndex(idx); geo.computeBoundingSphere(); geo.computeBoundingBox(); return geo;
  }

  /* ---------- swept tube: pts (Vector3 list) through a Catmull-Rom curve, n rings of m points; rad(u) -> radius or [across, thick] ---------- */
  function sweep(T, pts, n, m, rad, o) {
    o = o || {};
    var cu = pts.getPoint ? pts : new T.CatmullRomCurve3(pts, false, 'centripetal', .5), fr = cu.computeFrenetFrames(n, false), pos = [], col = [], idx = [], i, j, p = new T.Vector3(), base = o.color || [1, 1, 1];
    for (i = 0; i <= n; i++) {
      var u = i / n, r = rad(u), ra = r.length ? r[0] : r, rb = r.length ? r[1] : r, tw = o.twist ? o.twist(u) : 0; cu.getPoint(u, p); var N = fr.normals[i], Bn = fr.binormals[i], cl = o.colorAt ? o.colorAt(u) : base;
      for (j = 0; j < m; j++) { var a = j / m * TAU + tw, ca = cos(a) * ra * (o.ring ? o.ring(u, a) : 1), sa = sin(a) * rb * (o.ring ? o.ring(u, a) : 1); pos.push(p.x + N.x * ca + Bn.x * sa, p.y + N.y * ca + Bn.y * sa, p.z + N.z * ca + Bn.z * sa); col.push(cl[0], cl[1], cl[2]);
        if (i < n) { var a0 = i * m + j, a1 = i * m + (j + 1) % m; idx.push(a0, a1, a0 + m, a1, a1 + m, a0 + m); } }
    }
    // closed ends
    [0, n].forEach(function (e) { cu.getPoint(e / n, p); var c0 = pos.length / 3; pos.push(p.x, p.y, p.z); var cl = o.colorAt ? o.colorAt(e / n) : base; col.push(cl[0], cl[1], cl[2]); for (j = 0; j < m; j++) { var a = e * m + j, b = e * m + (j + 1) % m; if (e) idx.push(a, b, c0); else idx.push(b, a, c0); } });
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(new Float32Array(pos.length / 3 * 2), 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
  }

  /* ---------- join geometries (position, normal, colour, uv) into one, each under its own matrix ---------- */
  function join(T, list) {
    var pos = [], nor = [], col = [], idx = [], v = new T.Vector3(), nm = new T.Matrix3(), off = 0;
    list.forEach(function (q) {
      var g = q.g || q, mx = q.m || null, tint = q.c || null, pa = g.attributes.position, na = g.attributes.normal, ca = g.attributes.color, k; if (mx) nm.getNormalMatrix(mx);
      for (k = 0; k < pa.count; k++) { v.fromBufferAttribute(pa, k); if (mx) v.applyMatrix4(mx); pos.push(v.x, v.y, v.z); v.fromBufferAttribute(na, k); if (mx) v.applyMatrix3(nm).normalize(); nor.push(v.x, v.y, v.z);
        var r = ca ? ca.getX(k) : 1, gg = ca ? ca.getY(k) : 1, b = ca ? ca.getZ(k) : 1; if (tint) { r *= tint[0]; gg *= tint[1]; b *= tint[2]; } col.push(r, gg, b); }
      if (g.index) { var ia = g.index.array; for (k = 0; k < ia.length; k++) idx.push(ia[k] + off); } else for (k = 0; k < pa.count; k++) idx.push(k + off);
      off += pa.count;
    });
    var o = new T.BufferGeometry(); o.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); o.setAttribute('normal', new T.Float32BufferAttribute(nor, 3)); o.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    o.setAttribute('uv', new T.Float32BufferAttribute(new Float32Array(pos.length / 3 * 2), 2)); o.setIndex(idx); o.computeBoundingSphere(); o.computeBoundingBox(); return o;
  }
  function mat4(T, px, py, pz, rx, ry, rz, sx, sy, sz) { var s = sx === undefined ? 1 : sx; return new T.Matrix4().compose(new T.Vector3(px, py, pz), new T.Quaternion().setFromEuler(new T.Euler(rx || 0, ry || 0, rz || 0)), new T.Vector3(s, sy === undefined ? s : sy, sz === undefined ? s : sz)); }
  // give any stock geometry a flat vertex colour so it can be joined with the sculpted ones
  function tint(T, g, c) { var n = g.attributes.position.count, a = new Float32Array(n * 3); for (var i = 0; i < n; i++) { a[i * 3] = c[0]; a[i * 3 + 1] = c[1]; a[i * 3 + 2] = c[2]; } g.setAttribute('color', new T.BufferAttribute(a, 3)); return g; }

  /* ---------- bone colour: ivory where it is rubbed, brown where the dirt sits (occlusion), blotched by age ---------- */
  function boneCol(amt) {
    return function (x, y, z, occ) {
      var n = fbm3(x * 38, y * 38, z * 38, 3), m = fbm3(x * 9 + 4, y * 9, z * 9 + 2, 2), o2 = occ * occ * (3 - 2 * occ), d = (.3 + .7 * o2) * (.78 + .34 * n) * (.84 + .3 * m), w = 1 - o2 * (.55 + .45 * n);   // w: how deep in the dirt
      w = min(1, w * (amt === undefined ? 1 : amt));
      return [d * (1 - .22 * w), d * (.93 - .42 * w), d * (.78 - .58 * w)];
    };
  }

  /* ---------- the models ---------- */
  // a human skull without its jaw, face toward +z, about 18 cm front to back; the teeth are separate little pegs
  function skullField(open) {
    return function (x, y, z) {
      var ax = abs(x), w = fbm3(x * 55, y * 55, z * 55, 2) - .5;
      var d = ell(x, y, z, 0, .03, -.03, .071, .066, .078);                                  // braincase
      d = smin(d, ell(x, y, z, 0, -.012, -.04, .06, .046, .058), .03);                      // the back of the head, down to the base
      d = smin(d, ell(x, y, z, 0, .028, .022, .06, .058, .054), .03);                       // forehead
      d = smin(d, rbox(x, y, z, 0, -.03, .047, .04, .036, .022, .02), .028);                // the face
      d = smin(d, cap(ax, y, z, .012, .019, .074, .046, .022, .062, .0095), .012);          // brow ridges
      d = smin(d, ell(ax, y, z, .05, -.026, .05, .02, .016, .022), .016);                   // cheekbones
      d = smin(d, rbox(x, y, z, 0, -.06, .05, .03, .015, .027, .013), .016);                // upper jaw
      d = smin(d, ell(ax, y, z, .052, -.046, -.028, .012, .018, .014), .014);               // mastoid
      d = smin(d, ell(x, y, z, 0, -.036, .074, .009, .02, .012), .01);                      // the root of the nose
      d = smax(d, -ell(ax, y, z, .033, -.001, .068, .0215, .019, .034), .007);              // orbits
      d = smax(d, -min(ell(ax, y, z, .008, -.044, .082, .0105, .015, .03), ell(x, y, z, 0, -.03, .082, .007, .014, .03)), .004);   // the nasal opening, a pear
      d = smax(d, -ell(ax, y, z, .075, -.012, .028, .012, .028, .028), .012);               // the hollow of the temple
      d = smax(d, -ell(ax, y, z, .046, -.062, .03, .014, .02, .03), .012);                  // under the cheekbone
      d = smax(d, -rbox(x, y, z, 0, -.102, -.05, .1, .04, .06, .012), .012);                // the flat underside behind the palate
      d = smax(d, -ell(x, y, z, 0, -.078, .046, .022, .014, .024), .006);                   // the roof of the mouth
      d = smin(d, cap(ax, y, z, .056, -.026, .042, .0655, -.024, -.012, .0052), .009);      // the cheek arch, standing free
      if (open) d = smax(d, -open(x, y, z), .003);
      return d + w * .0011;
    };
  }
  function skull(T, o) {
    o = o || {}; var f = skullField(o.open), col = boneCol(o.dirt);
    var g = nets(T, f, [-.085, -.092, -.12, .085, .105, .095], o.cell || .0026, { color: function (x, y, z, occ) {
      var c = col(x, y, z, occ), su = abs(z - (-.005 + .012 * sin(x * 95) + .004 * sin(x * 260))) , k = y > .03 ? max(0, 1 - su / .0022) : 0;   // the coronal suture, a dark wandering line
      var sg = y > .04 && z < -.005 ? max(0, 1 - abs(x - .003 * sin(z * 210)) / .002) : 0; k = max(k, sg) * .55;
      return [c[0] * (1 - k), c[1] * (1 - k), c[2] * (1 - k)]; } });
    var parts = [{ g: g }], r = rng(o.seed || 5), tooth = new T.SphereGeometry(.5, 8, 6); tint(T, tooth, [.82, .74, .56]);
    // sixteen sockets round the arch, a few of them empty
    for (var i = 0; i < 16; i++) { if (o.gaps !== 0 && r() < (o.gaps || .22)) continue; var t = (i + .5) / 16 * 2 - 1, a = t * 1.42, mol = abs(t) > .45, wd = mol ? .0088 : .0068, ln = (mol ? .011 : .015) * (.85 + .3 * r());
      parts.push({ g: tooth, m: mat4(T, sin(a) * .0262, -.0745 - ln * .28, .0485 + cos(a) * .0282 - (mol ? .002 : 0), (r() - .5) * .2, a, (r() - .5) * .2, wd, ln, mol ? .0088 : .0056), c: [.8 + r() * .2, .76 + r() * .18, .6 + r() * .2] }); }
    return join(T, parts);
  }
  // the top of a skull sawn off and turned over as a bowl: opening up, a chipped rim and a crack down one side
  function skullBowl(T) {
    var R = .085, th = .0052, col = boneCol(.9);
    var f = function (x, y, z) {
      var o = ell(x, y, z, 0, R * .93, 0, R * .96, R * .93, R * 1.1), d = max(o, -(o + th));                              // a shell
      var rim = y - (R * .78 + .006 * (fbm3(x * 30, 0, z * 30, 2) - .5) + .01 * max(0, 1 - sqrt((x - .05) * (x - .05) + (z - .07) * (z - .07)) / .03) * -1);   // sawn edge, a chip out of the front
      d = smax(d, rim, .0025);
      var cx = x - .028 - .006 * sin(y * 120), cz = z - .09; d = max(d, -(max(abs(cx) - .0011 - .0016 * max(0, (y - .01) / R), -cz - .06)));                   // the crack
      return d + (fbm3(x * 60, y * 60, z * 60, 2) - .5) * .0008;
    };
    return nets(T, f, [-.095, -.008, -.105, .095, .082, .105], .003, { color: function (x, y, z, occ) { var c = col(x, y, z, .35 + .65 * occ), ins = (x * x + z * z < .0068 * (1 - (y - .08) * (y - .08) / .0064) * .9) ? .5 : 1; return [c[0] * ins, c[1] * ins * .86, c[2] * ins * .74]; } });
  }
  // a long bone, 1 unit long along +y, knuckled at both ends; kind 0 femur (a ball on a neck), 1 shin, 2 forearm
  function bone(T, len, rad, kind, seed, dip) {
    var r = rng(seed || 3), bend = (r() - .5) * .03, k = kind || 0, col = boneCol(1.1), R = rad;
    var f = function (x, y, z) {
      var u = y / len, bx = bend * len * sin(Math.PI * u), d = cap(x - bx, y, z, 0, R * 1.2, 0, 0, len - R * 1.2, 0, R * (.86 + .28 * abs(u - .5) * 2));
      // the foot end: two condyles side by side
      d = smin(d, ell(x, y, z, -R * .85, R * 1.25, 0, R * 1.15, R * 1.3, R * 1.35), R * 1.1); d = smin(d, ell(x, y, z, R * .85, R * 1.25, 0, R * 1.15, R * 1.3, R * 1.35), R * 1.1);
      d = smax(d, -ell(x, y, z, 0, R * .2, R * .9, R * .4, R * 1.1, R * .8), R * .5);
      // the head end
      if (k === 0) { d = smin(d, cap(x, y, z, 0, len - R * 2.4, 0, -R * 1.9, len - R * .6, 0, R * .95, R * .8), R * 1.2); d = smin(d, ell(x, y, z, -R * 2.2, len - R * .2, 0, R * 1.35, R * 1.35, R * 1.35), R * .5); d = smin(d, ell(x, y, z, R * .9, len - R * 1.5, 0, R * 1.05, R * 1.5, R * 1.1), R * 1.1); }
      else if (k === 1) { d = smin(d, ell(x, y, z, 0, len - R * 1.1, 0, R * 1.9, R * 1.05, R * 1.55), R * 1.5); d = smax(d, -ell(x, y, z, 0, len + R * .25, 0, R * 1.3, R * .5, R * 1.1), R * .5); }
      else { d = smin(d, ell(x, y, z, 0, len - R * 1.2, 0, R * 1.3, R * 1.25, R * 1.25), R * 1.2); d = smin(d, ell(x, y, z, R * .5, len - R * .4, -R * .5, R * .8, R * .9, R * .8), R * .8); }
      return d + (fbm3(x * 90, y * 40, z * 90, 2) - .5) * R * .12;
    };
    return nets(T, f, [-R * 4.2, -R * .4, -R * 2.4, R * 3.2, len + R * 1.6, R * 2.4], max(.0016, R * .34), { ao: .6, color: function (x, y, z, occ) { var c = col(x, y, z, .25 + .75 * occ), e = min(y, len - y) / len, s = .86 + .2 * min(1, e * 6);
      // dip: how far up the bone has stood in blood (a dark tide line, redder below it)
      var w = dip ? max(0, min(1, (dip * len * (1 + .25 * (fbm3(x * 60, 0, z * 60, 2) - .5)) - y) / (len * .06))) : 0; return [c[0] * s * (1 - .55 * w), c[1] * s * (1 - .9 * w), c[2] * s * (1 - .93 * w)]; } });
  }
  // a vertebra, the hole along +y, spine pointing -z, about 5 cm across
  function vertebra(T, s, coarse) {
    s = s || 1; var col = boneCol(1.2);
    var f = function (x, y, z) {
      x /= s; y /= s; z /= s; var ax = abs(x), d = max(sqrt(x * x + (z - .012) * (z - .012)) - (.0165 + .003 * (y * y / .00012)), abs(y) - .011);   // the body, waisted
      d = smin(d, max(abs(sqrt(x * x + (z + .012) * (z + .012)) - .0125) - .0036, abs(y) - .008), .004);                                   // the arch
      d = smin(d, cap(x, y, z, 0, -.002, -.024, 0, -.012, -.05, .0052, .0036), .006);                                                      // the spinous process
      d = smin(d, cap(ax, y, z, .012, 0, -.012, .036, .002, -.02, .0048, .0036), .006);                                                    // the wings
      d = smin(d, ell(ax, y, z, .012, .01, -.016, .005, .006, .005), .004);
      return (d + (fbm3(x * 110, y * 110, z * 110, 2) - .5) * .0011) * s;
    };
    return nets(T, f, [-.045 * s, -.02 * s, -.058 * s, .045 * s, .02 * s, .034 * s], .0017 * s * (coarse || 1), { ao: .5, color: function (x, y, z, occ) { return col(x, y, z, .15 + .85 * occ); } });
  }
  // the goat idol: a horned head on a neck stub, facing +z, snout hanging down; about 36 cm from poll to beard
  function goatField() {
    return function (x, y, z) {
      var ax = abs(x), xs = x / .84;
      var d = ell(x, y, z, 0, .0, -.005, .058, .062, .066);                                             // the skull
      d = smin(d, cap(xs, y, z, 0, -.03, .03, 0, -.185, .088, .05, .0295), .03);                         // the long face
      d = smin(d, ell(x, y, z, 0, -.2, .098, .0285, .026, .031), .018);                                  // the muzzle
      d = smin(d, ell(ax, y, z, .034, .012, .044, .021, .014, .02), .016);                               // brows
      d = smin(d, ell(ax, y, z, .034, -.09, .04, .02, .046, .03), .03);                                  // cheeks
      d = smin(d, ell(x, y, z, 0, -.19, .062, .023, .03, .03), .02);                                     // the lower jaw
      d = smin(d, cap(x, y, z, 0, -.06, .074, 0, -.17, .112, .012, .011), .02);                          // the bridge of the nose
      d = smin(d, ell(x, y, z, 0, -.01, -.075, .062, .075, .05), .03);                                   // the neck stub against the plate
      d = smin(d, ell(ax, y, z, .03, .056, -.012, .024, .02, .024), .014);                               // horn roots
      // ears: flat leaves hanging out and a little down
      var ex = ax - .1, ey = y + .012 + .28 * (ax - .05), ez = z + .012; d = smin(d, ell(ex, ey, ez, 0, 0, 0, .056, .0105, .026), .016);
      d = smax(d, -ell(ex, ey, ez, .008, 0, .014, .04, .0065, .015), .006);
      d = smax(d, -ell(ax, y, z, .0475, -.02, .06, .014, .0105, .014), .005);                            // eye sockets
      d = smax(d, -ell(ax, y, z, .03, -.125, .085, .012, .04, .014), .014);                              // the hollow down each side of the face
      d = smin(d, cap(ax, y, z, .02, .03, .05, .05, .0, .05, .009, .007), .01);                          // the brow bone
      d = smax(d, -ell(ax, y, z, .0115, -.203, .1265, .0048, .0085, .006), .003);                        // nostrils
      d = smax(d, -ell(x, y, z, 0, -.2215, .1, .021, .0022, .028), .002);                                // the mouth
      // the beard: a tapering hank, combed by noise
      var bd = cap(x, y, z, 0, -.21, .068, 0, -.34, .048, .021, .004) + (n3(x * 420, y * 22, z * 420) - .5) * .009;
      d = smin(d, bd, .01);
      return d + (fbm3(x * 70, y * 70, z * 70, 3) - .5) * .0034 + (n3(x * 300, y * 40, z * 300) - .5) * .0012;
    };
  }
  function goat(T) {
    var f = goatField();
    var g = nets(T, f, [-.175, -.345, -.13, .175, .09, .14], .003, { color: function (x, y, z, occ) {
      var n = fbm3(x * 30, y * 30, z * 30, 3), h = n3(x * 380, y * 30, z * 380), o2 = .12 + .88 * occ * occ, d = o2 * (.5 + .7 * n) * (.75 + .5 * h); return [d * .8, d * .62, d * .5]; } });
    var horns = [], eyes = [];
    // horns: ridged, three-sided, sweeping up, back and out
    [-1, 1].forEach(function (sd) {
      var pts = [[.03, .058, -.012], [.05, .13, -.03], [.085, .2, -.075], [.13, .245, -.135], [.175, .255, -.19], [.2, .225, -.225]].map(function (q) { return new T.Vector3(q[0] * sd, q[1], q[2]); });
      horns.push({ g: sweep(T, pts, 170, 12, function (u) { var r = .0235 * Math.pow(1 - u, .75) + .0022; return [r, r * .78]; }, { ring: function (u, a) { return 1 + .075 * Math.pow(abs(sin(u * 62)), 3) * (1 - u) + .06 * cos(a * 3 + 1); },
        colorAt: function (u) { var k = .2 + .22 * u + .05 * Math.pow(abs(sin(u * 62)), 3); return [k * 1.0, k * .86, k * .7]; } }) });
    });
    // eyes: wet dark beads deep in the sockets
    var eye = new T.SphereGeometry(.0088, 14, 10); tint(T, eye, [.06, .035, .02]);
    [-1, 1].forEach(function (sd) { eyes.push({ g: eye, m: mat4(T, sd * .0455, -.02, .0545) }); });
    return { head: g, horns: join(T, horns), eyes: join(T, eyes) };
  }
  // European-mount goat skull. Local frame: +Y up, face +Z, snout down (-Y).
  // Origin is the back of the cranium (z = 0, against a beam or wall) at horn-base height (y = 0).
  // Front-on silhouette: a long tapering muzzle and ridged horns rising up and out in a V.
  function goatSkull(T) {
    var col = boneCol(1.2);
    var f = function (x, y, z) {
      var ax = abs(x);
      var d = ell(x, y, z, 0, -.018, .038, .042, .036, .048);                         // braincase
      d = smin(d, ell(x, y, z, 0, -.038, .028, .038, .03, .036), .018);             // occipital / lower back
      d = smin(d, ell(x, y, z, 0, .006, .048, .036, .022, .036), .016);              // forehead
      d = smin(d, ell(ax, y, z, .016, .01, .02, .014, .014, .016), .01);             // horn pedicles
      d = smin(d, cap(ax, y, z, .012, .0, .07, .036, -.018, .062, .007, .005), .008); // brow ridge
      d = smin(d, ell(ax, y, z, .032, -.036, .05, .011, .014, .012), .01);           // slimmer zygomatic
      d = smin(d, cap(ax, y, z, .026, -.02, .058, .038, -.048, .046, .0045, .0035), .007);
      d = smin(d, cap(x, y, z, 0, -.02, .07, 0, -.075, .085, .024, .014), .014);     // long tapering face
      d = smin(d, cap(x, y, z, 0, -.075, .085, 0, -.108, .092, .016, .008), .01);
      d = smin(d, ell(x, y, z, 0, -.11, .09, .009, .012, .014), .006);                // snout tip
      d = smin(d, cap(x, y, z, 0, -.01, .08, 0, -.09, .1, .007, .004), .008);        // nasal bone ridge
      d = smax(d, -ell(ax, y, z, .028, -.018, .08, .018, .015, .026), .0035);         // deep lateral orbits
      d = smax(d, -ell(x, y, z, 0, -.055, .105, .006, .032, .016), .004);            // nasal opening
      d = smax(d, -ell(x, y, z, 0, -.09, .108, .005, .02, .012), .003);
      d = smax(d, -ell(ax, y, z, .05, -.018, .03, .01, .02, .018), .008);             // temples
      d = smax(d, -ell(x, y, z, 0, -.07, .07, .012, .04, .016), .006);                // palate
      d = smax(d, -z - .001, .005);                                                  // flat back against the plate
      return d + (fbm3(x * 50, y * 50, z * 50, 2) - .5) * .0009;
    };
    var g = nets(T, f, [-.065, -.13, -.015, .065, .03, .12], .0026, { color: function (x, y, z, occ) {
      var c = col(x, y, z, occ);
      var mid = max(0, 1 - abs(x) / .0018) * (z > .04 ? .55 : 0);
      var cor = (y > -.01 && y < .02 && z > .02) ? max(0, 1 - abs(y - .002 - .004 * sin(x * 90)) / .0018) * .45 : 0;
      var k = max(mid, cor);
      return [c[0] * (1 - k), c[1] * (1 - k * 1.05), c[2] * (1 - k * 1.1)];
    } });
    var parts = [{ g: g }], tooth = new T.SphereGeometry(.5, 8, 6); tint(T, tooth, [.82, .74, .56]);
    parts.push({ g: tooth, m: mat4(T, -.004, -.122, .096, .2, 0, 0, .0036, .007, .0034) });
    parts.push({ g: tooth, m: mat4(T, .004, -.122, .096, .2, 0, 0, .0036, .007, .0034) });
    [-1, 1].forEach(function (sd) {
      for (var i = 0; i < 4; i++) {
        var yy = -.055 - i * .012, zz = .078 + i * .004, rr = i < 2 ? .0034 : .0026, ln = i < 2 ? .006 : .005;
        parts.push({ g: tooth, m: mat4(T, sd * (.022 - i * .003), yy, zz, .15, 0, 0, rr, ln, rr * .8) });
      }
    });
    var horns = [];
    [-1, 1].forEach(function (sd) {
      var pts = [[.016, .01, .02], [.028, .045, .012], [.05, .09, -.005], [.072, .115, -.02], [.095, .1, -.03], [.108, .078, -.028]].map(function (q) { return new T.Vector3(q[0] * sd, q[1], q[2]); });
      horns.push({ g: sweep(T, pts, 48, 14, function (u) { var r = .013 * Math.pow(1 - u, .7) + .002; return [r, r * .82]; }, {
        ring: function (u, a) { return 1 + .24 * Math.pow(abs(sin(u * 50)), 1.2) * (1 - u * .3) + .06 * cos(a * 3); },
        colorAt: function (u) { var k = .22 + .16 * u + .08 * Math.pow(abs(sin(u * 42)), 2); return [k * 1.15, k * .85, k * .58]; }
      }) });
    });
    return { head: join(T, parts), horns: join(T, horns) };
  }
    // a rib: a flat curved blade from the spine end (thick) round to the tip
  function rib(T, w, drop, depth, seed, side) {
    var r = rng(seed || 2), pts = [], n = 9; for (var i = 0; i <= n; i++) { var u = i / n, a = u * 2.25; pts.push(new T.Vector3((side || 1) * sin(a) * w * (1 - .12 * u), -drop * u * u + (r() - .5) * .003, (1 - cos(a)) * depth)); }
    return sweep(T, pts, 40, 9, function (u) { var e = .5 + .5 * Math.pow(sin(Math.PI * min(1, u * 1.08 + .05)), .5); return [.0034 + .002 * e, .0068 * e + .0026]; }, { colorAt: function (u) { var k = .62 + .25 * sin(u * 9 + seed) * .4 + .1 * u; return [k, k * .9, k * .7]; } });
  }
  // a finger bone, along +y
  function phalanx(T, len, rad) { return sweep(T, [new T.Vector3(0, 0, 0), new T.Vector3(0, len * .5, rad * .15), new T.Vector3(0, len, 0)], 12, 8, function (u) { var e = abs(u - .5) * 2; return rad * (.62 + .5 * e * e) * (u < .04 || u > .96 ? .55 : 1); }, { color: [.72, .64, .47] }); }
  // a hank of gut or sinew hanging from a point: lumpy, sagging loops
  function gut(T, pts, rad, seed, colr) {
    var r = rng(seed || 4), ph = r() * 9;
    return sweep(T, pts, pts.length * 9, 9, function (u) { return rad * (.72 + .36 * sin(u * 37 + ph) * sin(u * 11 + ph * 2) + .2 * sin(u * 83)) * (u > .9 ? max(.2, (1 - u) * 10) : 1) * (u < .04 ? max(.4, u * 25) : 1); },
      { colorAt: function (u) { var k = .55 + .4 * fbm3(u * 14 + ph, ph, 0, 2); return [(colr ? colr[0] : .62) * k, (colr ? colr[1] : .2) * k, (colr ? colr[2] : .17) * k]; } });
  }

  /* ---------- gore(): blood, rust, grime and a fine bump for any Mesh{Standard,Physical}Material ----------
     o = { blood: 0..1 (how much of the surface), bscale: noise repeats per metre, rust: 0..1, grime: 0..1 (blotchy darkening),
           stretch: [x, y, z] scales on the stain noise (0.2 on an axis draws the stains out along it),
           bump: metres of relief, bfreq: bump repeats per metre, grain: [x, y, z] repeats per metre instead (fibres: long along one axis),
           mask: texture (r blood, g dirt, b bone-white paint rubbed into a cut) read with the 'heUv' attribute, glow: [y0, y1, r, g, b] light soaking through from y1 down to y0 } */
  var NOISE = 'float heH(vec3 p) { p = fract(p * .3183099 + .1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }\n' +
    'float heN(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(mix(mix(heH(i), heH(i + vec3(1, 0, 0)), f.x), mix(heH(i + vec3(0, 1, 0)), heH(i + vec3(1, 1, 0)), f.x), f.y), mix(mix(heH(i + vec3(0, 0, 1)), heH(i + vec3(1, 0, 1)), f.x), mix(heH(i + vec3(0, 1, 1)), heH(i + vec3(1, 1, 1)), f.x), f.y), f.z); }\n' +
    'float heF(vec3 p) { return .5 * heN(p) + .25 * heN(p * 2.03 + 7.1) + .125 * heN(p * 4.01 + 13.3) + .0625 * heN(p * 8.1 + 3.7); }\n';
  function gore(m, o) {
    o = o || {}; var U = { heA: { value: [o.blood || 0, o.bscale || 9, o.rust || 0, o.grime === undefined ? .35 : o.grime] }, heB: { value: [o.bump === undefined ? .0006 : o.bump, o.bfreq || 260, o.wet === undefined ? 1 : o.wet, o.seed || 0] }, heMask: { value: o.mask || null }, heBC: { value: o.bloodColor || [.2, .012, .008] },
      heS: { value: o.grain || [o.bfreq || 260, o.bfreq || 260, o.bfreq || 260] }, heT: { value: o.stretch || [1, 1, 1] }, heGl: { value: o.glow ? [o.glow[0], o.glow[1], 1, 0] : [0, 1, 0, 0] }, heGc: { value: o.glow ? [o.glow[2], o.glow[3], o.glow[4]] : [0, 0, 0] } };
    m.heGore = U;
    m.onBeforeCompile = function (sh) {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = 'varying vec3 vHeP;\n' + (o.mask ? 'attribute vec2 heUv; varying vec2 vHeUv;\n' : '') + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vHeP = position;' + (o.mask ? ' vHeUv = heUv;' : ''));
      var fs = 'varying vec3 vHeP; uniform vec4 heA, heB, heGl; uniform vec3 heBC, heS, heGc, heT;\n' + (o.mask ? 'uniform sampler2D heMask; varying vec2 vHeUv;\n' : '') + NOISE + sh.fragmentShader;
      fs = fs.replace('#include <map_fragment>', '#include <map_fragment>\n' +
        ' vec3 heQ = vHeP + heB.w, heQs = heQ * heT; float heM = heF(heQs * heA.y * 3.3 + 5.0), heL = heF(heQs * heA.y), heBl = 0.0, heRu = 0.0, heDk = 0.0;\n' +
        ' diffuseColor.rgb *= 1.0 - heA.w * (1.0 - smoothstep(.25, .75, heM * .6 + heL * .5));\n' +
        (o.rust ? ' heRu = smoothstep(1.0 - heA.z, 1.0 - heA.z + .3, heL * .75 + heM * .45); diffuseColor.rgb = mix(diffuseColor.rgb, mix(vec3(.1, .04, .018), vec3(.3, .125, .045), smoothstep(.3, .7, heF(heQ * heA.y * 7.0 + 2.0))) * (.5 + .8 * heM), heRu);\n' : '') +
        (o.mask ? ' vec4 heK = texture2D(heMask, vHeUv); heDk = heK.g; diffuseColor.rgb *= 1.0 - .92 * heDk; diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.62, .55, .4) * (.6 + .6 * heM), heK.b * .85);\n' : '') +
        ' heBl = smoothstep(1.0 - heA.x, 1.0 - heA.x + .035, heL + .22 * (heM - .5));\n' +
        (o.mask ? ' heBl = max(heBl * (heA.x > 0.0 ? 1.0 : 0.0), smoothstep(.3, .62, heK.r + (heM - .5) * .16));\n' : ' heBl *= heA.x > 0.0 ? 1.0 : 0.0;\n') +
        // old blood is brown-black and matt, fresh is deep red and wet; the noise picks which
        ' float heFr = smoothstep(.35, .7, heF(heQ * heA.y * .6 + 9.0)); diffuseColor.rgb = mix(diffuseColor.rgb, mix(heBC * vec3(.5, .55, .6), heBC, heFr) * (.55 + .9 * heM), heBl);\n');
      fs = fs.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = mix(roughnessFactor, mix(.5, .12, heFr * heB.z) + .12 * heM, heBl); roughnessFactor = mix(roughnessFactor, 1.0, heRu * (1.0 - heBl));');
      fs = fs.replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\n metalnessFactor *= (1.0 - heBl) * (1.0 - heRu * .9);');
      fs = fs.replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' +
        ' { float heFl = length(fwidth(heQ) * heS), heFw = clamp(1.5 - heFl * 2.0, 0.0, 1.0), heFx = clamp(1.5 - heFl * 7.4, 0.0, 1.0);   // each octave of the relief fades out before it turns to sparkle\n' +
        '   float h = heB.x * (heFw * heF(heQ * heS) + .5 * heFx * heN(heQ * heS * 3.7)) * (1.0 - .85 * heBl) + heBl * .0005 + heFx * heRu * .0003 * heN(heQ * 420.0);\n' +
        '   vec3 sx = dFdx(-vViewPosition), sy = dFdy(-vViewPosition), r1 = cross(sy, normal), r2 = cross(normal, sx); float det = dot(sx, r1); vec3 gr = sign(det) * (dFdx(h) * r1 + dFdy(h) * r2); normal = normalize(abs(det) * normal - gr); }');
      if (o.glow) fs = fs.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += heGc * heGl.z * smoothstep(heGl.x, heGl.y, vHeP.y) * diffuseColor.rgb;');
      sh.fragmentShader = fs;
    };
    var key = 'heGore' + (o.rust ? 'r' : '') + (o.mask ? 'm' : '') + (o.glow ? 'g' : ''); m.customProgramCacheKey = function () { return key; };
    return m;
  }

  /* ---------- canvases ---------- */
  function canvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  // paint blood into the red channel of a canvas (additive, so the other channels are left alone)
  //   pool: a puddle of merged blobs; splat: a burst with flung droplets; drip: a run down from a point; smear: a dragged streak
  function Blood(x, seed) {
    var r = rng(seed || 9), self = this; this.x = x; this.r = r; x.globalCompositeOperation = 'lighter';
    var dot = function (px, py, rad, a) { var g = x.createRadialGradient(px, py, rad * .55, px, py, rad); g.addColorStop(0, 'rgba(255,0,0,' + (a === undefined ? 1 : a) + ')'); g.addColorStop(1, 'rgba(255,0,0,0)'); x.fillStyle = g; x.beginPath(); x.arc(px, py, rad, 0, TAU); x.fill(); };
    this.dot = dot;
    this.pool = function (px, py, rad, n) { for (var i = 0; i < (n || 14); i++) { var a = r() * TAU, d = r() * rad * .8; dot(px + cos(a) * d, py + sin(a) * d * .7, rad * (.25 + .5 * r())); } return self; };
    this.splat = function (px, py, rad, n) { dot(px, py, rad * .35); for (var i = 0; i < (n || 40); i++) { var a = r() * TAU, d = rad * (.2 + Math.pow(r(), 1.6) * 1.6), s = rad * (.02 + .09 * r() * (1 - d / (rad * 2))); dot(px + cos(a) * d, py + sin(a) * d, max(1.2, s));
        if (r() < .35) { x.strokeStyle = 'rgba(255,0,0,.9)'; x.lineWidth = max(1, s * .8); x.lineCap = 'round'; x.beginPath(); x.moveTo(px + cos(a) * d * .75, py + sin(a) * d * .75); x.lineTo(px + cos(a) * d, py + sin(a) * d); x.stroke(); } } return self; };
    this.drip = function (px, py, len, wd) { wd = wd || 3; x.lineCap = 'round'; var n = 14, yy = py, xx = px; x.strokeStyle = 'rgba(255,0,0,1)';
      for (var i = 0; i < n; i++) { var u = i / n, ny = yy + len / n, nx = xx + (r() - .5) * wd * .5; x.lineWidth = wd * (1 - .45 * u) * (.8 + .4 * r()); x.beginPath(); x.moveTo(xx, yy); x.lineTo(nx, ny); x.stroke(); xx = nx; yy = ny; }
      dot(xx, yy, wd * 1.15); return self; };
    this.smear = function (px, py, qx, qy, wd) { for (var i = 0; i < 26; i++) { var o = (r() - .5) * wd; x.strokeStyle = 'rgba(255,0,0,' + (.12 + .3 * r()) + ')'; x.lineWidth = 1 + r() * wd * .2; x.beginPath(); var t0 = r() * .3, t1 = .6 + r() * .4; x.moveTo(px + (qx - px) * t0 - (qy - py) / 99 * o, py + (qy - py) * t0 + o); x.lineTo(px + (qx - px) * t1, py + (qy - py) * t1 + o * 1.2); x.stroke(); } return self; };
    // dirt goes to green: soot, old stains, handling
    this.dirt = function (px, py, rad, a) { var g = x.createRadialGradient(px, py, 0, px, py, rad); g.addColorStop(0, 'rgba(0,255,0,' + (a || .5) + ')'); g.addColorStop(1, 'rgba(0,255,0,0)'); x.fillStyle = g; x.beginPath(); x.arc(px, py, rad, 0, TAU); x.fill(); return self; };
  }
  // a height canvas (white high) to a tangent-space normal map; also returns the canvas so the same drawing can mask colour
  function normalFromHeight(T, hc, strength) {
    var w = hc.width, h = hc.height, src = hc.getContext('2d').getImageData(0, 0, w, h).data, out = canvas(w, h), ox = out.getContext('2d'), im = ox.createImageData(w, h), d = im.data, s = strength || 2;
    var H = function (xx, yy) { xx = (xx + w) % w; yy = min(h - 1, max(0, yy)); return src[(yy * w + xx) * 4] / 255; };
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) { var dx = (H(x + 1, y) - H(x - 1, y)) * s, dy = (H(x, y + 1) - H(x, y - 1)) * s, l = 1 / sqrt(dx * dx + dy * dy + 1), o = (y * w + x) * 4; d[o] = (-dx * l * .5 + .5) * 255; d[o + 1] = (dy * l * .5 + .5) * 255; d[o + 2] = (l * .5 + .5) * 255; d[o + 3] = 255; }
    ox.putImageData(im, 0, 0); var t = new T.CanvasTexture(out); t.anisotropy = 8; return t;
  }

  return { n3: n3, fbm3: fbm3, rng: rng, ell: ell, cap: cap, rbox: rbox, smin: smin, smax: smax, nets: nets, sweep: sweep, join: join, mat4: mat4, tint: tint, boneCol: boneCol,
    skull: skull, skullBowl: skullBowl, bone: bone, vertebra: vertebra, goat: goat, goatSkull: goatSkull, rib: rib, phalanx: phalanx, gut: gut, gore: gore, canvas: canvas, Blood: Blood, normalFromHeight: normalFromHeight };
})();
