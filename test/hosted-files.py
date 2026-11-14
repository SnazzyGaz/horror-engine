import re
#!/usr/bin/env python3
"""Check that a hosted (--hosted) build only references files that exist.
Usage: python3 test/hosted-files.py DEST
"""
import os, re, sys, json

def fail(msg):
    print('FAIL', msg)
    return 1

def ok(msg):
    print('PASS', msg)
    return 0

def main(dest):
    dest = os.path.abspath(dest)
    failed = 0
    def check(cond, msg):
        nonlocal failed
        if cond:
            ok(msg)
        else:
            failed += fail(msg)

    index = os.path.join(dest, 'index.html')
    texjs = os.path.join(dest, 'assets', 'tex.js')
    crypt = os.path.join(dest, 'assets', 'crypt_models.js')
    check(os.path.isfile(index), 'index.html exists')
    check(os.path.isfile(texjs), 'assets/tex.js exists')
    check(os.path.isfile(crypt), 'assets/crypt_models.js exists')
    check(os.path.isfile(os.path.join(dest, 'vendor', 'three.min.js')), 'vendor/three.min.js exists')

    html = open(index, encoding='utf-8').read()
    check('assets/tex.js' in html, 'index.html loads assets/tex.js')
    check('crypt_assets.js' not in html, 'index.html does not inline or link crypt_assets.js')
    check('window.HE_CRYPT =' not in html and 'window.HE_CRYPT=' not in html, 'index.html does not inline HE_CRYPT models (they load on demand)')
    # inlined textures would be long base64 WebP payloads (RIFF header UklGR).
    # A short UklGR in a comment or regex in the decoder does not count.
    check(not re.search(r'UklGR[A-Za-z0-9+/=]{80,}', html), 'index.html does not inline WebP base64')
    check(os.path.getsize(index) < 2_000_000, 'index.html is well under 2 MB (was ~9.6 MB inlined): %d' % os.path.getsize(index))

    src = open(texjs, encoding='utf-8').read()
    check(src.strip().startswith('window.HE_TEX'), 'tex.js defines window.HE_TEX')
    i = src.index('{')
    tex = json.loads(src[i:src.rindex('}') + 1])
    check(len(tex) >= 14, 'tex.js lists texture sets (%d)' % len(tex))
    missing = []
    for k, rec in tex.items():
        for c in 'cnr':
            rel = rec.get(c)
            if not isinstance(rel, str) or rel.startswith('http'):
                missing.append('%s.%s (not a relative path)' % (k, c))
                continue
            path = os.path.join(dest, rel)
            if not os.path.isfile(path):
                missing.append(rel)
            elif os.path.getsize(path) < 32:
                missing.append(rel + ' (too small)')
    check(not missing, 'every HE_TEX path exists' + ((' missing: ' + ', '.join(missing[:8])) if missing else ''))

    # workshop vs altar keys used by machine2.js SKIP lists
    workshop = [k for k in tex if k not in ('aWall', 'aFloor', 'aSheet')]
    altar = [k for k in tex if k in ('oak', 'floor', 'steel', 'iron', 'crinkle', 'aWall', 'aFloor', 'aSheet')]
    check(len(workshop) >= 14 and all(k in tex for k in ('oak', 'walnut', 'brick', 'aWall')),
          'workshop and altar sets are both listed (workshop %d, altar-used %d)' % (len(workshop), len(altar)))

    csrc = open(crypt, encoding='utf-8').read()
    check('window.HE_CRYPT' in csrc and 'goatSkull' in csrc and 'skull' in csrc, 'crypt_models.js has skull and goatSkull')

    for rel in [
        'README.md', 'README.html', 'CREDITS.md', 'CREDITS.html', 'LICENSE', '.nojekyll',
        'docs/INSTRUMENTS.md', 'docs/INSTRUMENTS.html',
        'docs/FX_AND_LOOPER.md', 'docs/FX_AND_LOOPER.html',
        'docs/RECIPES.md', 'docs/RECIPES.html',
        'docs/UNDER_THE_HOOD.md', 'docs/UNDER_THE_HOOD.html',
        'docs/index.html',
        'docs/media/hero.jpg', 'docs/media/workshop.jpg', 'docs/media/intro_720p.mp4',
        'docs/media/app_machine.jpg', 'docs/media/app_surface.jpg',
        'docs/media/still_wheel.jpg', 'docs/media/still_ruler.jpg',
        'docs/media/still_glass.jpg', 'docs/media/still_fx_panel.jpg',
        'docs/media/altar.jpg', 'docs/media/social_preview.png',
    ]:
        check(os.path.isfile(os.path.join(dest, rel)), rel + ' exists')

    # href/src on HTML tags only (not JavaScript assignments such as `src = '...'`)
    refs = re.findall(r'<(?:script|link|a|img|source|video)\b[^>]*?(?:src|href)\s*=\s*["\']([^"\']+)["\']', html, flags=re.I|re.S)
    local = [u for u in refs if u and not re.match(r'^[a-z][a-z0-9+.-]*:', u, re.I) and not u.startswith('#')]
    bad = [u for u in local if not os.path.exists(os.path.join(dest, u.split('#')[0].split('?')[0]))]
    check(not bad, 'index.html relative src/href exist' + ((' missing: ' + ', '.join(bad)) if bad else ' (%d)' % len(local)))

    print(('%s failed, ' % failed if failed else '') + 'hosted-files checks done')
    return 1 if failed else 0

if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit('usage: python3 test/hosted-files.py DEST')
    sys.exit(main(sys.argv[1]))
