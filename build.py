#!/usr/bin/env python3
"""Assemble src/ into the single-file index.html. Usage: python3 build.py"""
import os
here = os.path.dirname(os.path.abspath(__file__))
def rd(n): return open(os.path.join(here, 'src', n), encoding='utf-8').read()
import base64, json
def texjs():
    # the photo texture sets in assets/textures as base64 WebP, plus each set's average colour for the first frame
    from PIL import Image
    d = os.path.join(here, 'assets', 'textures'); man = json.load(open(os.path.join(d, 'manifest.json'))); out = {}
    for k, m in man.items():
        e = {'s': m['size']}
        for c in 'cnr': e[c] = base64.b64encode(open(os.path.join(d, '%s_%s.webp' % (k, c)), 'rb').read()).decode()
        e['avg'] = list(Image.open(os.path.join(d, k + '_c.webp')).convert('RGB').resize((1, 1), Image.BOX).getpixel((0, 0)))
        out[k] = e
    # stone wall, floor, rusty sheet and the scanned skull from the first altar skin
    cs = open(os.path.join(here, 'assets', 'crypt_assets.js'), encoding='utf-8').read()
    i = cs.index('{'); A = json.loads(cs[i:cs.rindex('}') + 1])
    for k, t in A.get('tex', {}).items(): out[k] = t
    models = json.dumps({'models': A.get('models', {})}, separators=(',', ':'))
    return 'window.HE_TEX = ' + json.dumps(out, separators=(',', ':')) + ';\nwindow.HE_CRYPT = ' + models + ';'
eng = rd('engine.js').replace("if (typeof module !== 'undefined') module.exports = { HE_SOURCES: HE_SOURCES, HE_PARAMS: HE_PARAMS, HECoreFactory: HECoreFactory };", "")
io = rd('io.js').replace("if (typeof module !== 'undefined') module.exports = HE_IO;", "")
html = ('<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
        '<title>Horror Engine</title>\n'
        '<style>\nbody{margin:0}[hidden]{display:none!important}\n' + rd('style.css') + '</style>\n</head>\n<body>\n'
        + rd('body.html')
        + '\n<script src="vendor/three.min.js"></script>'
        + '\n<script>\n' + eng + '\n</script>\n<script>\n' + io + '\n</script>\n<script>\n' + rd('ui.js') + '\n</script>\n<script>\n' + rd('look.js') + '\n</script>\n<script>\n' + texjs() + '\n</script>\n<script>\n' + rd('sculpt.js') + '\n</script>\n<script>\n' + rd('altar.js') + '\n</script>\n<script>\n' + rd('machine2.js') + '\n</script>\n</body>\n</html>\n')
open(os.path.join(here, 'index.html'), 'w', encoding='utf-8').write(html)
print('index.html', len(html), 'bytes')
