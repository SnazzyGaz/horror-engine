#!/usr/bin/env python3
"""Assemble src/ into the single-file index.html (file:// and Releases).

Usage:
  python3 build.py                 write ./index.html with textures inlined as base64
  python3 build.py --hosted DEST   write a Pages site that loads textures as files
"""
import os, sys, re, json, base64, shutil

here = os.path.dirname(os.path.abspath(__file__))

def rd(n):
    return open(os.path.join(here, 'src', n), encoding='utf-8').read()

def crypt():
    cs = open(os.path.join(here, 'assets', 'crypt_assets.js'), encoding='utf-8').read()
    i = cs.index('{')
    return json.loads(cs[i:cs.rindex('}') + 1])

def tex_avg(path):
    from PIL import Image
    return list(Image.open(path).convert('RGB').resize((1, 1), Image.BOX).getpixel((0, 0)))

def workshop_sets():
    from PIL import Image  # noqa: F401  (imported so a missing Pillow fails early)
    d = os.path.join(here, 'assets', 'textures')
    man = json.load(open(os.path.join(d, 'manifest.json')))
    out = {}
    for k, m in man.items():
        e = {'s': m['size']}
        for c in 'cnr':
            e[c] = os.path.join(d, '%s_%s.webp' % (k, c))
        e['avg'] = tex_avg(os.path.join(d, k + '_c.webp'))
        out[k] = e
    return out

def scripts(tex_tag, body_html=None):
    body = body_html if body_html is not None else rd('body.html')
    eng = rd('engine.js').replace("if (typeof module !== 'undefined') module.exports = { HE_SOURCES: HE_SOURCES, HE_PARAMS: HE_PARAMS, HECoreFactory: HECoreFactory };", "")
    io = rd('io.js').replace("if (typeof module !== 'undefined') module.exports = HE_IO;", "")
    return ('<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
            '<title>Horror Engine</title>\n'
            '<style>\nbody{margin:0}[hidden]{display:none!important}\n' + rd('style.css') + '</style>\n</head>\n<body>\n'
            + body
            + '\n<script src="vendor/three.min.js"></script>'
            + '\n<script>\n' + eng + '\n</script>\n<script>\n' + io + '\n</script>\n<script>\n' + rd('ui.js') + '\n</script>\n<script>\n' + rd('look.js') + '\n</script>\n'
            + tex_tag
            + '\n<script>\n' + rd('sculpt.js') + '\n</script>\n<script>\n' + rd('altar.js') + '\n</script>\n<script>\n' + rd('machine2.js') + '\n</script>\n</body>\n</html>\n')


def texjs_inline():
    # photo texture sets as base64 WebP, plus each set's average colour for the first frame
    out = {}
    for k, e in workshop_sets().items():
        rec = {'s': e['s'], 'avg': e['avg']}
        for c in 'cnr':
            rec[c] = base64.b64encode(open(e[c], 'rb').read()).decode()
        out[k] = rec
    A = crypt()
    for k, t in A.get('tex', {}).items():
        out[k] = t
    models = json.dumps({'models': A.get('models', {})}, separators=(',', ':'))
    return 'window.HE_TEX = ' + json.dumps(out, separators=(',', ':')) + ';\nwindow.HE_CRYPT = ' + models + ';'


DOC_CSS = """
:root { color-scheme: dark; }
body { margin: 0 auto; max-width: 48rem; padding: 1.6rem 1.2rem 4rem; background: #0c0b09; color: #d8d0c4;
  font: 16px/1.55 Georgia, "Times New Roman", serif; }
nav { font: 14px/1.4 system-ui, sans-serif; margin: 0 0 2rem; color: #8a8070; }
nav a { color: #c8a35a; text-decoration: none; }
nav a:hover { text-decoration: underline; }
h1, h2, h3, h4 { color: #efdca6; font-family: system-ui, sans-serif; font-weight: 600; line-height: 1.25; }
h1 { font-size: 2rem; margin: 0 0 1rem; }
h2 { font-size: 1.35rem; margin: 2rem 0 .6rem; border-bottom: 1px solid #3a3428; padding-bottom: .25rem; }
h3 { font-size: 1.1rem; margin: 1.4rem 0 .4rem; }
a { color: #c8a35a; }
img { max-width: 100%; height: auto; border-radius: 2px; }
code, pre { font-family: ui-monospace, Consolas, monospace; font-size: .9em; background: #1a1814; }
code { padding: .1em .3em; }
pre { padding: .8rem 1rem; overflow: auto; }
pre code { padding: 0; background: none; }
table { border-collapse: collapse; margin: 1rem 0; font: 14px/1.45 system-ui, sans-serif; width: 100%; }
th, td { border: 1px solid #3a3428; padding: .35rem .55rem; text-align: left; vertical-align: top; }
th { color: #efdca6; background: #16140f; }
blockquote { margin: 1rem 0; padding: .1rem 0 .1rem 1rem; border-left: 3px solid #c8a35a; color: #b8b0a4; }
hr { border: 0; border-top: 1px solid #3a3428; margin: 2rem 0; }
footer { margin-top: 3rem; font: 13px/1.4 system-ui, sans-serif; color: #8a8070; }
video { max-width: 100%; }
""".strip()


def rewrite_md_hrefs(text):
    def sub(m):
        url = m.group(2)
        if re.match(r'^[a-z][a-z0-9+.-]*:', url, re.I) or url.startswith('//') or url.startswith('#'):
            return m.group(0)
        path, frag = (url.split('#', 1) + [''])[:2]
        if path.endswith('.md'):
            path = path[:-3] + '.html'
            return '%s%s%s%s' % (m.group(1), path, ('#' + frag) if frag else '', m.group(3))
        return m.group(0)
    return re.sub(r'(\[[^\]]*\]\()([^)]+)(\))', sub, text)


def render_markdown(src_path, dest_path, title, nav_html):
    import markdown
    text = open(src_path, encoding='utf-8').read()
    body = markdown.markdown(rewrite_md_hrefs(text), extensions=['tables', 'fenced_code', 'sane_lists', 'toc'])
    html = ('<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width,initial-scale=1">\n'
            '<title>%s</title>\n<style>\n%s\n</style>\n</head>\n<body>\n<nav>%s</nav>\n'
            '%s\n<footer>Horror Engine by <a href="https://x.com/_mintydoge">Garyck Arntzen</a>. MIT licence.</footer>\n'
            '</body>\n</html>\n') % (title, DOC_CSS, nav_html, body)
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    open(dest_path, 'w', encoding='utf-8').write(html)


def nav(root=True):
    p = '' if root else '../'
    return ('<a href="%sindex.html">Play</a> · <a href="%sREADME.html">README</a> · '
            '<a href="%sdocs/INSTRUMENTS.html">Instruments</a> · '
            '<a href="%sdocs/FX_AND_LOOPER.html">FX and looper</a> · '
            '<a href="%sdocs/RECIPES.html">Recipes</a> · '
            '<a href="%sdocs/UNDER_THE_HOOD.html">Under the hood</a> · '
            '<a href="%sCREDITS.html">Credits</a>') % (p, p, p, p, p, p, p)


def write_docs(dest):
    try:
        import markdown  # noqa: F401
    except ImportError:
        sys.stderr.write('build.py --hosted needs the markdown package: pip install markdown\n')
        raise
    # raw files so the original paths still resolve (HTTP 200)
    shutil.copy2(os.path.join(here, 'README.md'), os.path.join(dest, 'README.md'))
    shutil.copy2(os.path.join(here, 'CREDITS.md'), os.path.join(dest, 'CREDITS.md'))
    shutil.copy2(os.path.join(here, 'LICENSE'), os.path.join(dest, 'LICENSE'))
    changelog = os.path.join(here, 'CHANGELOG.md')
    if os.path.isfile(changelog):
        shutil.copy2(changelog, os.path.join(dest, 'CHANGELOG.md'))
    if os.path.isdir(os.path.join(dest, 'docs')):
        shutil.rmtree(os.path.join(dest, 'docs'))
    shutil.copytree(os.path.join(here, 'docs'), os.path.join(dest, 'docs'))
    render_markdown(os.path.join(here, 'README.md'), os.path.join(dest, 'README.html'),
                    'Horror Engine', nav(True))
    render_markdown(os.path.join(here, 'CREDITS.md'), os.path.join(dest, 'CREDITS.html'),
                    'Credits — Horror Engine', nav(True))
    if os.path.isfile(os.path.join(here, 'CHANGELOG.md')):
        render_markdown(os.path.join(here, 'CHANGELOG.md'), os.path.join(dest, 'CHANGELOG.html'),
                        'Changelog — Horror Engine', nav(True))
    titles = {
        'INSTRUMENTS.md': 'Instruments — Horror Engine',
        'FX_AND_LOOPER.md': 'FX and looper — Horror Engine',
        'RECIPES.md': 'Recipes — Horror Engine',
        'UNDER_THE_HOOD.md': 'Under the hood — Horror Engine',
        'DEVELOPING.md': 'Developing — Horror Engine',
    }
    for name, title in titles.items():
        render_markdown(os.path.join(here, 'docs', name), os.path.join(dest, 'docs', name[:-3] + '.html'),
                        title, nav(False))
    idx = ('<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
           '<meta name="viewport" content="width=device-width,initial-scale=1">\n'
           '<title>Docs — Horror Engine</title>\n<style>\n%s\n</style>\n</head>\n<body>\n'
           '<nav>%s</nav>\n<h1>Horror Engine docs</h1>\n<ul>\n'
           '<li><a href="../README.html">README</a></li>\n'
           '<li><a href="INSTRUMENTS.html">Instrument guide</a></li>\n'
           '<li><a href="FX_AND_LOOPER.html">FX and looper</a></li>\n'
           '<li><a href="RECIPES.html">Recipes</a></li>\n'
           '<li><a href="UNDER_THE_HOOD.html">Under the hood</a></li>\n'
           '<li><a href="DEVELOPING.html">Developing</a></li>\n'
           '<li><a href="../CHANGELOG.html">Changelog</a></li>\n'
           '<li><a href="../CREDITS.html">Credits</a></li>\n'
           '</ul>\n<footer>Horror Engine by <a href="https://x.com/_mintydoge">Garyck Arntzen</a>. MIT licence.</footer>\n'
           '</body>\n</html>\n') % (DOC_CSS, nav(False))
    open(os.path.join(dest, 'docs', 'index.html'), 'w', encoding='utf-8').write(idx)


def write_hosted(dest):
    dest = os.path.abspath(dest)
    if os.path.isdir(dest):
        # replace the staged site, not the repo itself
        if os.path.abspath(dest) == os.path.abspath(here):
            sys.exit('refusing to write the hosted site over the repo root; pass a DEST folder')
    os.makedirs(dest, exist_ok=True)
    tex_dir = os.path.join(dest, 'assets', 'textures')
    os.makedirs(tex_dir, exist_ok=True)

    manifest = {}
    for k, e in workshop_sets().items():
        rec = {'s': e['s'], 'avg': e['avg']}
        for c in 'cnr':
            name = '%s_%s.webp' % (k, c)
            shutil.copy2(e[c], os.path.join(tex_dir, name))
            rec[c] = 'assets/textures/' + name
        manifest[k] = rec

    A = crypt()
    for k, t in A.get('tex', {}).items():
        rec = {'s': t['s'], 'avg': t.get('avg', [128, 110, 90])}
        for c in 'cnr':
            name = '%s_%s.webp' % (k, c)
            open(os.path.join(tex_dir, name), 'wb').write(base64.b64decode(t[c]))
            rec[c] = 'assets/textures/' + name
        manifest[k] = rec

    open(os.path.join(dest, 'assets', 'tex.js'), 'w', encoding='utf-8').write(
        'window.HE_TEX = ' + json.dumps(manifest, separators=(',', ':')) + ';\n')
    open(os.path.join(dest, 'assets', 'crypt_models.js'), 'w', encoding='utf-8').write(
        'window.HE_CRYPT = ' + json.dumps({'models': A.get('models', {})}, separators=(',', ':')) + ';\n')

    vdest = os.path.join(dest, 'vendor')
    if os.path.isdir(vdest):
        shutil.rmtree(vdest)
    shutil.copytree(os.path.join(here, 'vendor'), vdest)
    shutil.copy2(os.path.join(here, '.nojekyll'), os.path.join(dest, '.nojekyll'))

    body = rd('body.html').replace(
        'Garyck Arntzen</a> &middot; MIT licence</span>',
        'Garyck Arntzen</a> &middot; MIT licence &middot; <a href="README.html">Docs</a></span>',
        1)
    html = scripts('<script src="assets/tex.js"></script>', body_html=body)
    open(os.path.join(dest, 'index.html'), 'w', encoding='utf-8').write(html)
    write_docs(dest)
    print('hosted site', dest)
    print('  index.html', len(html), 'bytes')
    print('  tex.js', os.path.getsize(os.path.join(dest, 'assets', 'tex.js')), 'bytes')
    print('  crypt_models.js', os.path.getsize(os.path.join(dest, 'assets', 'crypt_models.js')), 'bytes')


def write_inline():
    html = scripts('<script>\n' + texjs_inline() + '\n</script>')
    path = os.path.join(here, 'index.html')
    open(path, 'w', encoding='utf-8').write(html)
    print('index.html', len(html), 'bytes')


if __name__ == '__main__':
    args = sys.argv[1:]
    if args and args[0] == '--hosted':
        if len(args) != 2:
            sys.exit('usage: python3 build.py --hosted DEST')
        write_hosted(args[1])
    elif args:
        sys.exit('usage: python3 build.py  OR  python3 build.py --hosted DEST')
    else:
        write_inline()
