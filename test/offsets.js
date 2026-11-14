// Headless checks for per-voice Tune, Material and Distance offsets. No browser or GPU. Run: node test/offsets.js
var IO = require('../src/io.js'), M = require('../src/engine.js');
function ok(c, msg) { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) process.exitCode = 1; }

var offKeys = ['tune', 'cents', 'matOff', 'distOff'];
var offs = M.HE_PARAMS.filter(function (p) { return p.off; });
ok(offs.length === 9 * 4, '36 hidden offset params (9 voices x 4)');
ok(offs.every(function (p) { return p.def === 0; }), 'all offset defaults are 0');
var tune = offs.filter(function (p) { return p.id.slice(-5) === '.tune'; })[0];
var cents = offs.filter(function (p) { return p.id.slice(-6) === '.cents'; })[0];
var mat = offs.filter(function (p) { return p.id.slice(-7) === '.matOff'; })[0];
var dist = offs.filter(function (p) { return p.id.slice(-8) === '.distOff'; })[0];
ok(tune.min === -24 && tune.max === 24 && tune.int, 'Tune is integer semitones -24..+24');
ok(cents.min === -100 && cents.max === 100 && cents.int, 'Fine is integer cents -100..+100');
ok(mat.min === -1 && mat.max === 1 && dist.min === -1 && dist.max === 1, 'Material and Distance offsets are -1..+1');

var core = M.HECoreFactory(), BL = core.BL, SR = 48000;
var host = new core.Host(SR, function () { });
var P = {}; M.HE_PARAMS.forEach(function (p) { P[p.id] = p.def; });
var L = new Float32Array(BL), R = new Float32Array(BL);
function run(blocks) { for (var i = 0; i < blocks; i++) host.block(L, R, 0); }
function settle() { run(250); }   // 0.9^250 is far below 1e-9, past the 0.1 distance smoother
host.msg({ t: 'init', params: P, seed: 1337 });
settle();
var e = host.e;
function near(a, b, eps) { return Math.abs(a - b) < (eps || 1e-6); }
ok(e.vOff.length === 9 && e.vOff.every(function (o) { return near(o.pitchSt, 0) && near(o.pitchMul, 1) && near(o.material, .5) && near(o.distance, .15); }),
  'at defaults, every voice matches the global macros (pitch 0, material 0.5, distance 0.15)');

// additive pitch: global +12, ebow also +12 st + 0 c, struck stays on the macro only
host.msg({ t: 'p', k: 'macro.pitch', v: 12 });
host.msg({ t: 'p', k: 'ebow.tune', v: 12 });
host.msg({ t: 'p', k: 'ebow.cents', v: 0 });
settle();
ok(Math.abs(e.gMac.pitchSt - 12) < 1e-6 && Math.abs(e.gMac.pitchMul - 2) < 1e-6, 'global pitch macro still +12 st (x2)');
ok(Math.abs(e.vOff[0].pitchSt - 24) < 1e-6 && Math.abs(e.vOff[0].pitchMul - 4) < 1e-6, 'ebow pitch is macro + tune = +24 st (x4)');
ok(Math.abs(e.vOff[4].pitchSt - 12) < 1e-6 && Math.abs(e.vOff[4].pitchMul - 2) < 1e-6, 'struck (no offset) follows the macro only (x2)');
// cents: +100 c on struck = +1 st on top of the macro
host.msg({ t: 'p', k: 'struck.cents', v: 100 });
settle();
ok(Math.abs(e.vOff[4].pitchSt - 13) < 1e-6, 'struck fine +100 c adds one semitone on top of the macro');

// material and distance add, then clamp
host.msg({ t: 'p', k: 'macro.material', v: .5 });
host.msg({ t: 'p', k: 'macro.distance', v: .2 });
host.msg({ t: 'p', k: 'glass.matOff', v: .5 });
host.msg({ t: 'p', k: 'glass.distOff', v: -.2 });
host.msg({ t: 'p', k: 'spring.matOff', v: 1 });     // 0.5+1 clamped to 1
host.msg({ t: 'p', k: 'spring.distOff', v: 1 });    // 0.2+1 clamped to 1
host.msg({ t: 'p', k: 'hurdy.matOff', v: 0 });
host.msg({ t: 'p', k: 'hurdy.distOff', v: 0 });
settle();
ok(Math.abs(e.gMac.material - .5) < 1e-6, 'global material macro stays 0.5');
ok(near(e.distance, .2), 'global distance macro stays 0.2: ' + e.distance);
ok(Math.abs(e.vOff[3].material - 1) < 1e-6, 'glass material is macro 0.5 + offset 0.5 = 1');
ok(near(e.vOff[3].distance, 0), 'glass distance is macro 0.2 + offset -0.2 = 0 (close): ' + e.vOff[3].distance);
ok(near(e.vOff[5].material, 1) && near(e.vOff[5].distance, 1), 'spring offsets clamp at 1: mat ' + e.vOff[5].material + ' dist ' + e.vOff[5].distance);
ok(near(e.vOff[1].material, .5) && near(e.vOff[1].distance, .2), 'hurdy with zero offsets follows the macros: mat ' + e.vOff[1].material + ' dist ' + e.vOff[1].distance);
ok(near(e.vOff[3].dist.dg, 1), 'glass at distance 0 keeps full close-up level (dg=' + e.vOff[3].dist.dg + ')');
ok(e.vOff[5].dist.dg < .2, 'spring at distance 1 is quieter and darker (dg=' + e.vOff[5].dist.dg.toFixed(3) + ')');

// globals restored after a block, so hall/reverb still see the macros
ok(Math.abs(e.pitchSt - 12) < 1e-6 && Math.abs(e.material - .5) < 1e-6, 'after the voice loop, engine macros are restored for the hall');

// preset / performance save and load, including a 1.2.0 file with no offsets
var P2 = {}; M.HE_PARAMS.forEach(function (p) { P2[p.id] = p.def; });
P2['ebow.tune'] = -7; P2['ebow.cents'] = 25; P2['ebow.matOff'] = .2; P2['ebow.distOff'] = -.15;
P2['macro.pitch'] = 3;
var pre = JSON.parse(JSON.stringify(IO.toPreset(P2, 'offset test')));
ok(pre.version === '1.4.0', 'preset version is 1.4.0');
ok(IO.check(pre).length === 0, 'preset with offsets validates: ' + JSON.stringify(IO.check(pre).slice(0, 3)));
ok(pre.sources.ebow.tune === -7 && pre.sources.ebow.cents === 25 && pre.sources.ebow.matOff === .2 && pre.sources.ebow.distOff === -.15, 'offsets live on the source in the preset');
var back = IO.fromPreset(pre);
ok(back['ebow.tune'] === -7 && back['ebow.cents'] === 25 && back['ebow.matOff'] === .2 && back['ebow.distOff'] === -.15 && back['macro.pitch'] === 3 && back['struck.tune'] === 0, 'fromPreset restores offsets and leaves other voices at 0');

var oldPre = JSON.parse(JSON.stringify(IO.toPreset(P, 'old')));
offKeys.forEach(function (k) { M.HE_SOURCES.forEach(function (s) { delete oldPre.params[s + '.' + k]; if (oldPre.sources[IO.SRC_IDS[M.HE_SOURCES.indexOf(s)]]) delete oldPre.sources[IO.SRC_IDS[M.HE_SOURCES.indexOf(s)]][k]; }); });
oldPre.version = '1.2.0';
ok(IO.check(oldPre).length === 0, 'a v1.2.0 preset without offset keys still validates');
var oldBack = IO.fromPreset(oldPre);
ok(M.HE_SOURCES.every(function (s) { return offKeys.every(function (k) { return oldBack[s + '.' + k] === 0; }); }), 'missing offsets in an old preset load as 0');

var perf = JSON.parse(JSON.stringify(IO.toPerformance({ log: [{ fn: 0, m: { t: 'init', params: P2, seed: 1337 } }], sr: SR, title: 'offset take', endFrame: SR })));
ok(perf.version === '1.4.0' && IO.check(perf).length === 0, 'performance with offsets in the start preset validates');
ok(perf.preset.params['ebow.tune'] === -7, 'performance start state carries ebow.tune');
var oldPerf = JSON.parse(JSON.stringify(perf));
oldPerf.version = '1.1.0';
delete oldPerf.customMoments;
offKeys.forEach(function (k) { M.HE_SOURCES.forEach(function (s) { var id = s + '.' + k; if (oldPerf.preset.params) delete oldPerf.preset.params[id]; var sid = IO.SRC_IDS[M.HE_SOURCES.indexOf(s)]; if (oldPerf.preset.sources[sid]) delete oldPerf.preset.sources[sid][k]; }); });
ok(IO.check(oldPerf).length === 0, 'a v1.1.0 performance without offset keys still validates');
var tlog = IO.toLog(oldPerf, SR);
ok(tlog.log[0].m.params['ebow.tune'] === 0 && tlog.log[0].m.params['glass.distOff'] === 0, 'old performance init fills missing offsets with 0');

// a Moment does not store offsets; replay uses the instrument's current ones
var def = { id: 'mOff', name: 'Ping', voice: 4, len: 0.2, ev: [[0, 4, 'd', .5, .5, .8, 0], [0.1, 4, 'u']], lanes: [] };
ok(!('tune' in def) && def.voice === 4, 'moment records the instrument, not the offsets');
