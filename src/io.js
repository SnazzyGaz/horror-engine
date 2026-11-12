/* Horror Engine - (c) 2026 Garyck Arntzen (https://x.com/_mintydoge) - MIT licence.
   io.js: performance files (.horror.json), presets, a small JSON Schema validator, deterministic offline
   re-render, and the WAV / zip writers. Classic script (works from file://); also loads in Node for tests. */
function HEIOFactory() {
  'use strict';
  if (typeof HECoreFactory === 'undefined' && typeof require === 'function') { var M_ = require('./engine.js'); globalThis.HECoreFactory = M_.HECoreFactory; globalThis.HE_PARAMS = M_.HE_PARAMS; globalThis.HE_SOURCES = M_.HE_SOURCES; }
  var VERSION = '1.1.0', AUTHOR = 'Garyck Arntzen', CREDIT = 'https://x.com/_mintydoge';
  var SRC_IDS = ['ebow', 'hurdy', 'bowedMetal', 'glass', 'struckMetal', 'springTank', 'junkTray', 'aura', 'superball'];
  var SCHEMAS = {"performance":{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"horror-engine/performance/1","title":"Horror Engine performance file (v1)","type":"object","required":["format","version","engine","seed","sampleRate","durationFrames","preset","lanes"],"additionalProperties":false,"properties":{"format":{"const":"horror-engine.performance"},"version":{"type":"string","pattern":"^1\\.\\d+\\.\\d+$"},"meta":{"type":"object","properties":{"title":{"type":"string"},"author":{"type":"string","default":"Garyck Arntzen"},"created":{"type":"string","format":"date-time"},"notes":{"type":"string"}}},"engine":{"type":"object","required":["version","codeHash"],"properties":{"version":{"type":"string"},"codeHash":{"type":"string","description":"FNV-1a hash of the shared DSP code text, e.g. fnv1a:1a2b3c4d"}}},"seed":{"$ref":"#/$defs/uint32"},"sampleRate":{"const":48000,"description":"Canonical frame rate. All frame values are at this rate."},"durationFrames":{"type":"integer","minimum":0},"tempo":{"type":["number","null"],"minimum":40,"maximum":200},"preset":{"oneOf":[{"$ref":"#/$defs/presetRef"},{"$ref":"#/$defs/inlinePreset"}]},"macros":{"$ref":"#/$defs/macroState"},"automation":{"type":"array","items":{"$ref":"#/$defs/paramLane"}},"lanes":{"type":"array","maxItems":3,"items":{"type":"object","required":["id","lengthFrames","layers"],"properties":{"id":{"enum":["A","B","C"]},"lengthFrames":{"type":"integer","minimum":4800},"startFrame":{"type":"integer","minimum":0,"default":0},"gainDb":{"type":"number","minimum":-60,"maximum":6},"printed":{"type":"boolean","default":false},"reversed":{"type":"boolean","default":false},"layers":{"type":"array","items":{"$ref":"#/$defs/layer"}}}}},"ghosts":{"type":"array","maxItems":4,"items":{"$ref":"#/$defs/ghost"}},"moments":{"type":"array","items":{"$ref":"#/$defs/moment"}},"liveEvents":{"type":"array","items":{"$ref":"#/$defs/event"}},"markers":{"type":"array","items":{"type":"object","required":["frame","label"],"properties":{"frame":{"type":"integer","minimum":0},"label":{"type":"string"}}}}},"$defs":{"uint32":{"type":"integer","minimum":0,"maximum":4294967295},"unit":{"type":"number","minimum":0,"maximum":1},"sourceId":{"enum":["ebow","hurdy","bowedMetal","glass","struckMetal","springTank","junkTray","aura","superball"]},"presetRef":{"type":"object","required":["ref"],"properties":{"ref":{"type":"string"},"hash":{"type":"string"}}},"macroState":{"type":"object","properties":{"dread":{"$ref":"#/$defs/unit"},"distance":{"$ref":"#/$defs/unit"},"material":{"$ref":"#/$defs/unit"},"pitchStretch":{"type":"number","minimum":-36,"maximum":24}}},"event":{"type":"object","required":["f","type"],"properties":{"f":{"type":"integer","minimum":0,"description":"Frame. Absolute for liveEvents; lane-relative for layer events."},"type":{"enum":["down","move","up","note","noteOff","param","trigger"]},"c":{"type":"integer","minimum":0,"maximum":15,"description":"contact / voice id"},"src":{"$ref":"#/$defs/sourceId"},"x":{"$ref":"#/$defs/unit"},"y":{"$ref":"#/$defs/unit"},"p":{"$ref":"#/$defs/unit"},"note":{"type":"integer","minimum":0,"maximum":127},"vel":{"$ref":"#/$defs/unit"},"param":{"type":"string","description":"registry path, e.g. glass.judder or fx.reverb.size"},"value":{"type":["number","boolean","string"]}}},"paramLane":{"type":"object","required":["param","points"],"properties":{"param":{"type":"string"},"interp":{"enum":["step","linear","exp"],"default":"linear"},"points":{"type":"array","items":{"type":"array","prefixItems":[{"type":"integer","minimum":0},{"type":"number"}],"minItems":2,"maxItems":2}}}},"layer":{"type":"object","required":["id","source","events"],"properties":{"id":{"type":"string"},"name":{"type":"string"},"source":{"$ref":"#/$defs/sourceId"},"stack":{"type":"array","maxItems":2,"items":{"$ref":"#/$defs/sourceId"}},"createdCycle":{"type":"integer","minimum":0},"gainDb":{"type":"number","minimum":-60,"maximum":6,"default":0},"pan":{"type":"number","minimum":-1,"maximum":1,"default":0},"mute":{"type":"boolean","default":false},"solo":{"type":"boolean","default":false},"sends":{"type":"object","properties":{"spring":{"$ref":"#/$defs/unit"},"reverb":{"$ref":"#/$defs/unit"},"aura":{"$ref":"#/$defs/unit"}}},"inserts":{"type":"object","properties":{"distortion":{"type":"object"},"pitchShift":{"type":"object"}}},"variation":{"type":"object","properties":{"timingMs":{"type":"number","minimum":0,"maximum":40},"value":{"type":"number","minimum":0,"maximum":0.1},"drop":{"type":"number","minimum":0,"maximum":0.3},"pitchCents":{"type":"number","minimum":0,"maximum":30}}},"sourceParams":{"type":"object","description":"per-layer overrides of source parameters (registry paths without the source prefix)"},"paramLanes":{"type":"array","maxItems":4,"items":{"$ref":"#/$defs/paramLane"}},"events":{"type":"array","items":{"$ref":"#/$defs/event"}}}},"ghost":{"type":"object","required":["id","fromLayer","seed","startFrame"],"properties":{"id":{"type":"string"},"fromLayer":{"type":"string"},"source":{"$ref":"#/$defs/sourceId"},"seed":{"$ref":"#/$defs/uint32"},"startFrame":{"type":"integer","minimum":0},"endFrame":{"type":["integer","null"]},"fadeOutFrames":{"type":"integer","minimum":0},"freedom":{"$ref":"#/$defs/unit"},"intensity":{"$ref":"#/$defs/unit"},"human":{"$ref":"#/$defs/unit"},"listen":{"$ref":"#/$defs/unit"},"gainDb":{"type":"number","minimum":-60,"maximum":6},"pan":{"type":"number","minimum":-1,"maximum":1},"paramAutomation":{"type":"array","items":{"$ref":"#/$defs/paramLane"}}}},"moment":{"type":"object","required":["type","startFrame","seed"],"properties":{"type":{"enum":["riser","stinger","droneBed","heartbeat","inTheWalls"]},"startFrame":{"type":"integer","minimum":0},"endFrame":{"type":["integer","null"]},"seed":{"$ref":"#/$defs/uint32"},"params":{"type":"object"}}},"inlinePreset":{"type":"object","required":["format"],"properties":{"format":{"const":"horror-engine.preset"}},"description":"An inline preset. Validate it fully against PRESET_SCHEMA as well."}}},"preset":{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"horror-engine/preset/1","title":"Horror Engine preset (v1)","type":"object","required":["format","version","name","macros","sources"],"properties":{"format":{"const":"horror-engine.preset"},"version":{"type":"string","pattern":"^1\\.\\d+\\.\\d+$"},"name":{"type":"string","minLength":1},"author":{"type":"string"},"seed":{"type":"integer","minimum":0,"maximum":4294967295},"tags":{"type":"array","items":{"type":"string"}},"macros":{"type":"object","properties":{"dread":{"type":"number","minimum":0,"maximum":1},"distance":{"type":"number","minimum":0,"maximum":1},"material":{"type":"number","minimum":0,"maximum":1},"pitchStretch":{"type":"number","minimum":-36,"maximum":24}}},"sources":{"type":"object","propertyNames":{"enum":["ebow","hurdy","bowedMetal","glass","struckMetal","springTank","junkTray","aura","superball"]},"additionalProperties":{"type":"object","properties":{"enabled":{"type":"boolean"}},"description":"Source parameter values keyed by registry name (validated against src/core/params.ts at load time)"}},"fx":{"type":"object","description":"fx.* registry values: distortion, pitchShift, spring, reverb, reverse, master"},"mixer":{"type":"object"}}}};

  /* ---------- small JSON Schema validator (only the keywords the design doc uses) ---------- */
  function typeOf(v) { return v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v === 'number' ? (Math.floor(v) === v && isFinite(v) ? 'integer' : 'number') : typeof v; }
  function typeOk(v, t) { var a = typeOf(v); return a === t || (t === 'number' && a === 'integer'); }
  function validate(schema, data, root, path, errs) {
    root = root || schema; path = path || '$'; errs = errs || [];
    if (schema.$ref) { var ref = schema.$ref.replace(/^#\//, '').split('/'), s = root; ref.forEach(function (k) { s = s[k]; }); return validate(s, data, root, path, errs); }
    if (schema.type) { var ts = [].concat(schema.type); if (!ts.some(function (t) { return typeOk(data, t); })) { errs.push(path + ': expected ' + ts.join(' or ') + ', got ' + typeOf(data)); return errs; } }
    if ('const' in schema && data !== schema.const) errs.push(path + ': must be ' + JSON.stringify(schema.const));
    if (schema.enum && schema.enum.indexOf(data) < 0) errs.push(path + ': must be one of ' + schema.enum.join(', '));
    if (typeof data === 'number') {
      if (schema.minimum !== undefined && data < schema.minimum) errs.push(path + ': below minimum ' + schema.minimum);
      if (schema.maximum !== undefined && data > schema.maximum) errs.push(path + ': above maximum ' + schema.maximum);
    }
    if (typeof data === 'string') {
      if (schema.minLength !== undefined && data.length < schema.minLength) errs.push(path + ': too short');
      if (schema.pattern && !new RegExp(schema.pattern).test(data)) errs.push(path + ': does not match ' + schema.pattern);
    }
    if (Array.isArray(data)) {
      if (schema.minItems !== undefined && data.length < schema.minItems) errs.push(path + ': needs at least ' + schema.minItems + ' items');
      if (schema.maxItems !== undefined && data.length > schema.maxItems) errs.push(path + ': at most ' + schema.maxItems + ' items');
      var pre = schema.prefixItems || [];
      data.forEach(function (x, i) { var sc = i < pre.length ? pre[i] : schema.items; if (sc) validate(sc, x, root, path + '[' + i + ']', errs); });
    }
    if (data && typeOf(data) === 'object') {
      (schema.required || []).forEach(function (k) { if (!(k in data)) errs.push(path + ': missing "' + k + '"'); });
      var props = schema.properties || {};
      Object.keys(data).forEach(function (k) {
        if (schema.propertyNames) validate(schema.propertyNames, k, root, path + '{' + k + '}', errs);
        if (props[k]) validate(props[k], data[k], root, path + '.' + k, errs);
        else if (schema.additionalProperties === false) errs.push(path + ': unexpected "' + k + '"');
        else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') validate(schema.additionalProperties, data[k], root, path + '.' + k, errs);
      });
    }
    if (schema.oneOf) {
      var ok = schema.oneOf.filter(function (sc) { return validate(sc, data, root, path, []).length === 0; }).length;
      if (ok !== 1) errs.push(path + ': must match exactly one alternative (matched ' + ok + ')');
    }
    return errs;
  }

  function fnv1a(str) { var h = 0x811c9dc5; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return ('0000000' + h.toString(16)).slice(-8); }
  function codeHash() { return 'fnv1a:' + fnv1a(HECoreFactory.toString()); }

  /* ---------- presets ---------- */
  function toPreset(P, name) {
    var src = {}, fx = { reverb: {}, master: {} };
    HE_PARAMS.forEach(function (p) {
      var dot = p.id.indexOf('.'), g = p.id.slice(0, dot), k = p.id.slice(dot + 1), si = HE_SOURCES.indexOf(g);
      if (si >= 0) { var o = src[SRC_IDS[si]] || (src[SRC_IDS[si]] = { enabled: true }); o[k] = P[p.id]; if (k === 'mute') o.enabled = P[p.id] < .5; }
      else if (g === 'rev') fx.reverb[k] = P[p.id]; else if (g === 'master') fx.master[k] = P[p.id];
    });
    return { format: 'horror-engine.preset', version: VERSION, name: name || 'Untitled', author: AUTHOR, seed: 1337,
      macros: { dread: P['macro.dread'], distance: P['macro.distance'], material: P['macro.material'], pitchStretch: P['macro.pitch'] },
      sources: src, fx: fx, params: P, credit: CREDIT };
  }
  // flat registry values from a preset (ours carries "params"; a spec-style preset is mapped by key name)
  function fromPreset(j) {
    var P = {}; HE_PARAMS.forEach(function (p) { P[p.id] = p.def; });
    function put(id, v) { var d = null; HE_PARAMS.forEach(function (p) { if (p.id === id) d = p; }); if (d && typeof v === 'number' && isFinite(v)) P[id] = Math.min(d.max, Math.max(d.min, v)); else if (d && typeof v === 'boolean' && d.sw) P[id] = v ? 1 : 0; }
    if (j.params) { for (var k in j.params) put(k, j.params[k]); return P; }
    var m = j.macros || {}; put('macro.dread', m.dread); put('macro.distance', m.distance); put('macro.material', m.material); put('macro.pitch', m.pitchStretch);
    var s = j.sources || {}; Object.keys(s).forEach(function (sid) { var g = HE_SOURCES[SRC_IDS.indexOf(sid)]; if (!g) return; for (var k2 in s[sid]) put(g + '.' + k2, s[sid][k2]); if (s[sid].enabled === false) P[g + '.mute'] = 1; });
    var f = j.fx || {}; if (f.reverb) for (var k3 in f.reverb) put('rev.' + k3, f.reverb[k3]); if (f.master) for (var k4 in f.master) put('master.' + k4, f.master[k4]);
    return P;
  }

  /* ---------- performance file ---------- */
  // log: [{fn: native frame, m: message}] exactly as the audio host applied them (from frame 0, starting with init)
  function toPerformance(o) {
    var sr = o.sr, k = 48000 / sr, init = o.log[0] && o.log[0].m.t === 'init' ? o.log[0].m : { params: o.params, seed: 1337 };
    var ev = [], rs = null, re = null, end = o.endFrame;
    o.log.forEach(function (x, i) {
      var m = x.m, e = { f: Math.round(x.fn * k), fn: x.fn };
      if (m.t === 'init') return;
      if (m.t === 'g') { e.type = m.k === 'd' ? 'down' : m.k === 'm' ? 'move' : 'up'; e.c = m.s; e.src = SRC_IDS[m.s]; if (m.k !== 'u') { e.x = m.x; e.y = m.y; e.p = m.p; if (m.hz) e.hz = m.hz; } }
      else if (m.t === 'p') { e.type = 'param'; e.param = m.k; e.value = m.v; }
      else if (m.t === 'moment') { e.type = 'trigger'; e.value = 'moment.' + m.id; e.on = !!m.on; if (m.arg !== undefined) e.arg = m.arg; }
      else if (m.t === 'loop') { e.type = 'trigger'; e.value = 'loop.' + m.a; if (m.id !== undefined) e.id = m.id; if (m.v !== undefined) e.v = m.v; if (m.free) e.free = true; if (m.snap) e.snap = m.snap; }
      else if (m.t === 'panic') { e.type = 'trigger'; e.value = 'panic'; }
      else if (m.t === 'rec') { e.type = 'trigger'; e.value = m.on ? 'record.start' : 'record.stop'; if (m.stems) e.stems = true; if (m.on) rs = x.fn; else re = x.fn; }
      else return;
      ev.push(e);
    });
    if (end === undefined) end = re !== null ? re : (o.log.length ? o.log[o.log.length - 1].fn : 0);
    var markers = []; if (rs !== null) markers.push({ frame: Math.round(rs * k), label: 'record start' }); if (re !== null) markers.push({ frame: Math.round(re * k), label: 'record stop' });
    var P = init.params;
    return {
      format: 'horror-engine.performance', version: VERSION,
      meta: { title: o.title || 'Untitled', author: AUTHOR, created: new Date().toISOString(), notes: 'Re-render with Horror Engine (the Render button). Frames in "f" are at 48 kHz; "fn" are native frames at meta.nativeSampleRate and are used for bit-exact re-renders at that rate. Design and credit: ' + AUTHOR + ' (' + CREDIT + ').', nativeSampleRate: sr, nativeEndFrame: end, recordStartFrame: rs, recordStopFrame: re, looper: o.looper || null },
      engine: { version: VERSION, codeHash: codeHash() },
      seed: init.seed >>> 0 || 1337, sampleRate: 48000, durationFrames: Math.round(end * k), tempo: null,
      preset: toPreset(P, (o.title || 'Untitled') + ' (start state)'),
      macros: { dread: P['macro.dread'], distance: P['macro.distance'], material: P['macro.material'], pitchStretch: P['macro.pitch'] },
      lanes: [], liveEvents: ev, markers: markers
    };
  }
  // back to host messages; native frames when rendering at the take's own rate, otherwise scaled from 48 kHz
  function toLog(perf, sr) {
    var nat = perf.meta && perf.meta.nativeSampleRate, useN = nat === sr, k = sr / 48000, log = [{ fn: 0, m: { t: 'init', params: fromPreset(perf.preset), seed: perf.seed } }];
    (perf.liveEvents || []).forEach(function (e) {
      var f = useN && typeof e.fn === 'number' ? e.fn : Math.round(e.f * k), m = null, v = String(e.value);
      if (e.type === 'down' || e.type === 'move' || e.type === 'up') { var s = typeof e.c === 'number' ? e.c : SRC_IDS.indexOf(e.src); m = { t: 'g', s: s, k: e.type[0], x: e.x, y: e.y, p: e.p, hz: e.hz || 0 }; if (e.type === 'up') m = { t: 'g', s: s, k: 'u' }; }
      else if (e.type === 'param') m = { t: 'p', k: e.param, v: e.value };
      else if (e.type === 'trigger') {
        if (v.indexOf('moment.') === 0) m = { t: 'moment', id: v.slice(7), on: e.on !== false, arg: e.arg };
        else if (v.indexOf('loop.') === 0) { m = { t: 'loop', a: v.slice(5) }; if (e.id !== undefined) m.id = e.id; if (e.v !== undefined) m.v = e.v; if (e.free) m.free = true; if (e.snap) m.snap = e.snap; }
        else if (v === 'panic') m = { t: 'panic' };
        else if (v === 'record.start') m = { t: 'rec', on: true, stems: !!e.stems };
        else if (v === 'record.stop') m = { t: 'rec', on: false };
      }
      if (m) log.push({ fn: f, m: m });
    });
    var end = useN && perf.meta.nativeEndFrame ? perf.meta.nativeEndFrame : Math.round(perf.durationFrames * k);
    return { log: log, end: end };
  }
  function check(j) {
    if (!j || typeof j !== 'object') return ['not a JSON object'];
    if (j.format === 'horror-engine.performance') { var e = validate(SCHEMAS.performance, j); if (j.preset && j.preset.format) e = e.concat(validate(SCHEMAS.preset, j.preset).map(function (x) { return x.replace('$', '$.preset'); })); return e; }
    if (j.format === 'horror-engine.preset') return validate(SCHEMAS.preset, j);
    return ['format must be horror-engine.performance or horror-engine.preset'];
  }

  /* ---------- offline render: the same Host, fed the same messages at the same frames ---------- */
  // returns a job; call job.step(blocks) until job.done. Result: {sr, frames, mix:[L,R], stems:[[L,R]..] or null, recorded}
  function renderJob(perf, opt) {
    opt = opt || {};
    var sr = opt.sr || (perf.meta && perf.meta.nativeSampleRate) || 48000, core = HECoreFactory(), BL = core.BL, chunks = [];
    var host = new core.Host(sr, function (m) { if (m.t === 'chunk') chunks.push(m); });
    var t = toLog(perf, sr), log = t.log, end = t.end, hasRec = log.some(function (x) { return x.m.t === 'rec'; });
    if (opt.stems !== undefined) log.forEach(function (x) { if (x.m.t === 'rec' && x.m.on) x.m.stems = !!opt.stems; });
    if (!hasRec) { log.splice(1, 0, { fn: 0, m: { t: 'rec', on: true, stems: !!opt.stems } }); log.push({ fn: end, m: { t: 'rec', on: false } }); }
    log.forEach(function (x, i) { x.i = i; }); log.sort(function (a, b) { return a.fn - b.fn || a.i - b.i; });
    var L = new Float32Array(BL), R = new Float32Array(BL), li = 0, job = { done: false, progress: 0, sr: sr };
    job.step = function (nb) {
      for (var b = 0; b < nb && !job.done; b++) {
        var f = host.e.frame;
        while (li < log.length && log[li].fn <= f) host.msg(JSON.parse(JSON.stringify(log[li++].m)));
        if (li >= log.length && f >= end) { job.done = true; break; }
        host.block(L, R, 0);
      }
      job.progress = Math.min(1, host.e.frame / Math.max(1, end));
      if (job.done) job.result = collect(chunks, sr);
      return job.done;
    };
    return job;
  }
  function collect(chunks, sr) {
    var n = 0; chunks.forEach(function (c) { n += c.n; });
    var mix = [new Float32Array(n), new Float32Array(n)], ns = 0, o = 0;
    chunks.forEach(function (c) { if (c.st) ns = Math.max(ns, c.st.length); });
    var st = []; for (var s = 0; s < ns; s++) st.push(null);
    chunks.forEach(function (c) {
      for (var i = 0; i < c.n; i++) { mix[0][o + i] = c.mix[i * 2]; mix[1][o + i] = c.mix[i * 2 + 1]; }
      if (c.st) for (var s2 = 0; s2 < ns; s2++) { var d = c.st[s2]; if (!d) continue; if (!st[s2]) st[s2] = [new Float32Array(n), new Float32Array(n)]; for (i = 0; i < c.n; i++) { st[s2][0][o + i] = d[i * 2]; st[s2][1][o + i] = d[i * 2 + 1]; } }
      o += c.n;
    });
    return { sr: sr, frames: n, mix: mix, stems: ns ? st : null };
  }
  function renderSync(perf, opt) { var j = renderJob(perf, opt); while (!j.step(4096)); return j.result; }

  /* ---------- WAV + zip ---------- */
  // planar [L,R] float input. bits 32 = IEEE float + fact; 24 = PCM with seeded TPDF dither. pad: -6.02 dB (24-bit stems)
  function wav(ch, sr, bits, title, note, pad) {
    var frames = ch[0].length, gain = pad ? .5 : 1, clips = 0, ds = 1337;
    var bps = bits === 24 ? 3 : 4, info = [['INAM', title], ['IART', AUTHOR], ['ISFT', 'Horror Engine v' + VERSION], ['ICMT', (note ? note + ', ' : '') + (pad ? '-6.02 dB pad: multiply by 2 to restore, ' : '') + CREDIT]];
    var il = 4; info.forEach(function (x) { il += 8 + x[1].length + 1 + ((x[1].length + 1) & 1); });
    var dl = frames * 2 * bps, buf = new ArrayBuffer(44 + dl + (dl & 1) + 8 + il + (bits === 32 ? 12 : 0)), v = new DataView(buf), u = new Uint8Array(buf), o = 0;
    function S(s) { for (var i = 0; i < s.length; i++) u[o++] = s.charCodeAt(i) & 255; }
    function U32(x) { v.setUint32(o, x, true); o += 4; } function U16(x) { v.setUint16(o, x, true); o += 2; }
    S('RIFF'); U32(buf.byteLength - 8); S('WAVE'); S('fmt '); U32(16); U16(bits === 24 ? 1 : 3); U16(2); U32(sr); U32(sr * 2 * bps); U16(2 * bps); U16(bits);
    if (bits === 32) { S('fact'); U32(4); U32(frames); }
    S('data'); U32(dl);
    var A = ch[0], B = ch[1], i, c;
    if (bits === 32) { for (i = 0; i < frames; i++) { v.setFloat32(o, A[i], true); v.setFloat32(o + 4, B[i], true); o += 8; } }
    else for (i = 0; i < frames; i++) for (c = 0; c < 2; c++) {
      ds ^= ds << 13; ds >>>= 0; ds ^= ds >>> 17; ds ^= ds << 5; ds >>>= 0; var r1 = ds / 4294967296;
      ds ^= ds << 13; ds >>>= 0; ds ^= ds >>> 17; ds ^= ds << 5; ds >>>= 0; var r2 = ds / 4294967296;
      var y = (c ? B[i] : A[i]) * gain; if (y > 1 || y < -1) clips++;
      var x = Math.round(Math.max(-1, Math.min(1, y)) * 8388607 + r1 - r2); if (x > 8388607) x = 8388607; else if (x < -8388608) x = -8388608; u[o++] = x & 255; u[o++] = (x >> 8) & 255; u[o++] = (x >> 16) & 255;
    }
    if (dl & 1) o++;
    S('LIST'); U32(il); S('INFO');
    info.forEach(function (x) { S(x[0]); U32(x[1].length + 1); S(x[1]); o++; if ((x[1].length + 1) & 1) o++; });
    u.clips = clips; return u;
  }
  var CRC = null;
  function crc32(u) { if (!CRC) { CRC = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 3988292384 ^ (c >>> 1) : c >>> 1; CRC[n] = c >>> 0; } } var r = 4294967295; for (var i = 0; i < u.length; i++) r = CRC[(r ^ u[i]) & 255] ^ (r >>> 8); return (r ^ 4294967295) >>> 0; }
  // STORE zip; returns an array of parts (ArrayBuffers / Uint8Arrays) to wrap in a Blob, or to concatenate in Node
  function zipParts(files, date) {
    var parts = [], cd = [], off = 0, d = date || new Date(), dt = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(), tmv = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    var enc = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
    files.forEach(function (f) {
      var nm = enc.encode(f.name), crc = crc32(f.data), h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint16(10, tmv, true); h.setUint16(12, dt, true); h.setUint32(14, crc, true); h.setUint32(18, f.data.length, true); h.setUint32(22, f.data.length, true); h.setUint16(26, nm.length, true); h.setUint16(28, 0, true);
      parts.push(h.buffer, nm, f.data);
      var c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true); c.setUint16(12, tmv, true); c.setUint16(14, dt, true); c.setUint32(16, crc, true); c.setUint32(20, f.data.length, true); c.setUint32(24, f.data.length, true); c.setUint16(28, nm.length, true); c.setUint32(42, off, true);
      cd.push(c.buffer, nm); off += 30 + nm.length + f.data.length;
    });
    var cl = 0; cd.forEach(function (x) { cl += x.byteLength; });
    var e = new DataView(new ArrayBuffer(22)); e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cl, true); e.setUint32(16, off, true);
    return parts.concat(cd, [e.buffer]);
  }
  // a whole take as zip files: mix, stems, performance JSON
  var STEM_NAMES = ['ebow', 'hurdy', 'bowed', 'glass', 'struck', 'spring', 'junk', 'aura', 'superball', 'hall_return', 'reverse_swell', 'harmonizer_return', 'body'];
  function takeFiles(res, title, bits, perf) {
    var files = [], clips = 0;
    files.push({ name: title + '_mix.wav', data: wav(res.mix, res.sr, bits, title + ' mix', 'seed=' + (perf ? perf.seed : 1337) + ', master mix (limited)') });
    if (res.stems) res.stems.forEach(function (st, i) {
      if (!st) return;
      var f = { name: title + '_' + STEM_NAMES[i] + '.wav', data: wav(st, res.sr, bits, title + ' ' + STEM_NAMES[i], 'stem: pre-limiter, latency-aligned with the mix', bits === 24) };
      clips += f.data.clips; files.push(f);
    });
    if (perf) files.push({ name: title + '.horror.json', data: new TextEncoder().encode(JSON.stringify(perf)) });
    files.clips = clips; return files;
  }

  return { VERSION: VERSION, AUTHOR: AUTHOR, CREDIT: CREDIT, SRC_IDS: SRC_IDS, SCHEMAS: SCHEMAS, STEM_NAMES: STEM_NAMES, validate: validate, check: check, fnv1a: fnv1a, codeHash: codeHash,
    toPreset: toPreset, fromPreset: fromPreset, toPerformance: toPerformance, toLog: toLog, renderJob: renderJob, renderSync: renderSync, collect: collect,
    wav: wav, crc32: crc32, zipParts: zipParts, takeFiles: takeFiles };
}
var HE_IO = HEIOFactory();
if (typeof module !== 'undefined') module.exports = HE_IO;
