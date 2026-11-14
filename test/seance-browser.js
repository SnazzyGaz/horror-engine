// Headless Chrome check of the Seance tester (no dependencies; Node 22+ for the global WebSocket).
// node test/seance-browser.js <chrome> <index.html> <outdir> [--gpu] [--sizes 1280x760,1920x1080] [--states]
// Screenshots, console errors, and a synthetic pointer drag on the board that must make sound (read from the page's
// analyser node; Chrome runs with --mute-audio so nothing is heard).
'use strict';
const { spawn } = require('child_process'), fs = require('fs'), path = require('path'), os = require('os'), http = require('http');
const [chrome, page, out] = process.argv.slice(2);
const gpu = process.argv.includes('--gpu'), states = process.argv.includes('--states');
const si = process.argv.indexOf('--sizes'), sizes = (si > 0 ? process.argv[si + 1] : '1280x760,1920x1080').split(',').map(s => s.split('x').map(Number));
const ui = process.argv.indexOf('--profile'), prof = ui > 0 ? process.argv[ui + 1] : fs.mkdtempSync(path.join(os.tmpdir(), 'seance-'));
fs.mkdirSync(out, { recursive: true });
const args = ['--headless=new', '--no-first-run', '--no-default-browser-check', '--mute-audio', '--autoplay-policy=no-user-gesture-required', '--hide-scrollbars',
  '--user-data-dir=' + prof, '--remote-debugging-port=0', '--window-size=1280,760', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'];
if (gpu) args.push('--use-angle=d3d11', '--enable-gpu'); else args.push('--disable-gpu');
if (process.platform === 'linux') args.push('--no-sandbox');
args.push('about:blank');
const proc = spawn(chrome, args, { stdio: 'ignore', windowsHide: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const getJSON = u => new Promise((ok, no) => http.get(u, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try { ok(JSON.parse(d)); } catch (e) { no(e); } }); }).on('error', no));
const report = { errors: [], warnings: [], shots: [], audio: null };
let killer = setTimeout(() => { report.errors.push('timeout'); finish(2); }, 60000);
function finish(code) { clearTimeout(killer); try { proc.kill(); } catch (e) { } fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 1)); console.log(JSON.stringify(report, null, 1)); setTimeout(() => process.exit(code), 300); }
(async () => {
  let port = 0;
  for (let i = 0; i < 100 && !port; i++) { await sleep(100); try { port = +fs.readFileSync(path.join(prof, 'DevToolsActivePort'), 'utf8').split('\n')[0]; } catch (e) { } }
  if (!port) { report.errors.push('no DevTools port'); return finish(2); }
  const list = await getJSON('http://127.0.0.1:' + port + '/json/list'), tgt = list.find(t => t.type === 'page');
  const ws = new WebSocket(tgt.webSocketDebuggerUrl); let id = 0; const wait = {};
  await new Promise(r => ws.onopen = r);
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && wait[m.id]) { wait[m.id](m); delete wait[m.id]; return; }
    if (m.method === 'Runtime.exceptionThrown') report.errors.push('exception: ' + (m.params.exceptionDetails.exception ? m.params.exceptionDetails.exception.description : m.params.exceptionDetails.text));
    if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'warning')) (m.params.type === 'error' ? report.errors : report.warnings).push('console.' + m.params.type + ': ' + m.params.args.map(a => a.value !== undefined ? a.value : a.description).join(' '));
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') report.errors.push('log: ' + m.params.entry.text + ' ' + (m.params.entry.url || ''));
  };
  const cmd = (method, params) => new Promise(r => { const i = ++id; wait[i] = r; ws.send(JSON.stringify({ id: i, method, params: params || {} })); });
  const ev = async (expr) => { const r = await cmd('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); return r.result && r.result.result ? r.result.result.value : r; };
  await cmd('Runtime.enable'); await cmd('Log.enable'); await cmd('Page.enable');
  const TEXTS = '(function(){var o=[];document.querySelectorAll("body *").forEach(function(e){if(!e.childNodes.length)return;var t="";e.childNodes.forEach(function(n){if(n.nodeType===3)t+=n.textContent});t=t.trim();if(!t)return;var r=e.getBoundingClientRect();if(r.width<1||r.height<1)return;var cs=getComputedStyle(e);if(cs.visibility==="hidden")return;var op=1;for(var a=e;a&&a.nodeType===1;a=a.parentElement){op*=+getComputedStyle(a).opacity;if(a.hidden)return}o.push({t:t.slice(0,40),x:r.left,y:r.top,w:r.width,h:r.height,c:cs.color,fs:parseFloat(cs.fontSize),fw:cs.fontWeight,op:op,dis:!!e.closest("button:disabled")})});return o})()';
  const shot = async (name) => { const r = await cmd('Page.captureScreenshot', { format: 'png' }); const f = path.join(out, name + '.png'); fs.writeFileSync(f, Buffer.from(r.result.data, 'base64')); report.shots.push(f); if (states) fs.writeFileSync(path.join(out, name + '.texts.json'), JSON.stringify(await ev(TEXTS))); };
  const url = 'file://' + (process.platform === 'win32' ? '/' : '') + path.resolve(page).replace(/\\/g, '/');
  for (const [w, h] of sizes) {
    await cmd('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
    await cmd('Page.navigate', { url }); await sleep(1800);
    await shot('seance_' + w + 'x' + h);
  }
  const [w0, h0] = sizes[0];
  await cmd('Emulation.setDeviceMetricsOverride', { width: w0, height: h0, deviceScaleFactor: 1, mobile: false });
  await cmd('Page.navigate', { url }); await sleep(1500);
  // a drag across the board with real (trusted) mouse input: down, a slow sweep, then hold the last point
  const r = await ev('(function(){var b=document.getElementById("pad").getBoundingClientRect();return [b.left,b.top,b.width,b.height]})()');
  const X = f => r[0] + r[2] * f, Y = f => r[1] + r[3] * f;
  await cmd('Input.dispatchMouseEvent', { type: 'mouseMoved', x: X(.3), y: Y(.5) });
  await cmd('Input.dispatchMouseEvent', { type: 'mousePressed', x: X(.3), y: Y(.5), button: 'left', buttons: 1, clickCount: 1 });
  await sleep(400);
  let peak = 0, samples = 0;
  for (let i = 0; i <= 50; i++) {
    const fx = .3 + .4 * (i / 50), fy = .5 - .15 * Math.sin(i / 50 * Math.PI);
    await cmd('Input.dispatchMouseEvent', { type: 'mouseMoved', x: X(fx), y: Y(fy), button: 'left', buttons: 1 });
    await sleep(30);
    if (i % 5 === 0) { const v = await ev('(function(){var a=__he.analyser();if(!a)return -1;var d=new Float32Array(a.fftSize);a.getFloatTimeDomainData(d);var m=0;for(var i=0;i<d.length;i++)m=Math.max(m,Math.abs(d[i]));return m})()'); if (v >= 0) { samples++; peak = Math.max(peak, v); } }
  }
  const mid = await ev('(function(){var L=__he.live();return {started:!!L.started,sel:L.sel,state:__he.ctx()&&__he.ctx().state,worklet:__he.state().worklet,reading:document.getElementById("hl").textContent,pk:L.tm?L.tm.pk:null}})()');
  if (states) { await shot('seance_drag'); }
  await cmd('Input.dispatchMouseEvent', { type: 'mouseReleased', x: X(.7), y: Y(.5), button: 'left', buttons: 0, clickCount: 1 });
  report.audio = { peak, samples, during: mid, ok: peak > 1e-4 };
  if (states) {
    for (const [d, n] of [['drFx', 'effects'], ['drVoice', 'voice'], ['drLoop', 'looper'], ['drIn', 'soundin']]) { await ev('__seance.drawer("' + d + '",true)'); await sleep(250); await shot('seance_' + n); }
    await ev('__seance.drawer("drFx",false)');
    await ev('document.getElementById("pBrowse").click()'); await sleep(200); await shot('seance_browse'); await ev('document.getElementById("pBrowse").click()');
    await ev('document.getElementById("menuBtn").click()'); await sleep(200); await shot('seance_menu'); await ev('document.getElementById("menuBtn").click()');
    await ev('__he.select(4)'); await sleep(300); await shot('seance_struck');
    await ev('__he.select(3);__seance.drawer("drVoice",true)'); await sleep(300); await shot('seance_glass_voice');
    await ev('__seance.drawer("drVoice",false);__he.select(6)'); await sleep(600); await shot('seance_junk');
  }
  await sleep(200);
  finish(report.errors.length || !report.audio.ok ? 1 : 0);
})().catch(e => { report.errors.push('runner: ' + e.stack); finish(2); });
