// texIsPath must treat hosted file URLs as paths and inlined base64 WebP as data.
var fs = require('fs');
var path = require('path');
var src = fs.readFileSync(path.join(__dirname, '../src/machine2.js'), 'utf8');
var m = src.match(/function texIsPath\(s\) \{[^}]+\}/);
if (!m) {
  console.error('texIsPath not found in src/machine2.js');
  process.exit(1);
}
eval(m[0]);
function ok(cond, msg) { if (!cond) { console.error('FAIL: ' + msg); process.exit(1); } }

ok(texIsPath('assets/textures/oak_c.webp'), 'hosted relative path');
ok(texIsPath('https://snazzygaz.github.io/horror-engine/assets/textures/oak_c.webp'), 'absolute https');
ok(texIsPath('http://127.0.0.1:8767/assets/textures/oak_n.webp'), 'absolute http');
ok(texIsPath('blob:https://example/123'), 'blob URL');
ok(!texIsPath('UklGRhgEAABXRUJQVlA4IAwEAACQQACdASoA/AgACPmEwlkik'), 'short base64 WebP with slashes');
var aluN = 'UklGRggDAABXRUJQVlA4IPwCAACwOwCdASoAAgACPj0ejkWiIaEQBAAgA8S0t3BiAdsfAP/+zHf8vhHScAAAJ7APfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIiB5OQ99snIe+2TkPfbJyHvtk5D32ycj/nk5D32ych77ZOQ99snJSYe+2TEAA';
ok(aluN.length < 2048 && aluN.indexOf('/') >= 0, 'fixture is a short slashed base64 string');
ok(!texIsPath(aluN), 'real short alu_n base64 is not a path');
ok(!texIsPath('not-a-texture'), 'plain string');
console.log('tex-path: 8 checks passed');
