#!/usr/bin/env python3
"""Text contrast from the screenshots and the text boxes the browser check dumps (--states).
The background of each box is the median colour of its pixels (text is the minority); the text colour is the computed
CSS colour. Prints anything under 4.5:1 (3:1 for 18.66 px bold / 24 px and up). Disabled buttons are listed apart."""
import json, sys, glob, re, os
from PIL import Image
import numpy as np
def lin(c):
    c = c / 255.0
    return np.where(c <= 0.03928, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
def L(rgb): r, g, b = lin(np.array(rgb, dtype=float)); return 0.2126 * r + 0.7152 * g + 0.0722 * b
def parse(c):
    m = re.findall(r'[\d.]+', c); v = [float(x) for x in m]
    return v[:3], (v[3] if len(v) > 3 else 1.0)
bad = 0
for tj in sorted(glob.glob(os.path.join(sys.argv[1], '*.texts.json'))):
    img = np.asarray(Image.open(tj.replace('.texts.json', '.png')).convert('RGB')).astype(float)
    worst = []
    for e in json.load(open(tj)):
        x0, y0 = max(0, int(e['x'])), max(0, int(e['y'])); x1, y1 = min(img.shape[1], int(e['x'] + e['w'])), min(img.shape[0], int(e['y'] + e['h']))
        if x1 - x0 < 2 or y1 - y0 < 2: continue
        box = img[y0:y1, x0:x1].reshape(-1, 3); bg = np.median(box, axis=0)
        rgb, a = parse(e['c']); a *= e['op']; fg = [rgb[i] * a + bg[i] * (1 - a) for i in range(3)]
        lf, lb = L(fg), L(bg); ratio = (max(lf, lb) + .05) / (min(lf, lb) + .05)
        large = e['fs'] >= 24 or (e['fs'] >= 18.66 and int(e['fw']) >= 700)
        need = 3.0 if large else 4.5
        if e['fs'] < 12: worst.append(('SMALL', e['fs'], e['t']))
        if ratio < need: worst.append(('DISABLED' if e['dis'] else 'LOW', round(ratio, 2), e['t'], e['c'], [int(v) for v in bg], e['fs']))
    lows = [w for w in worst if w[0] != 'DISABLED']
    bad += len(lows)
    print(os.path.basename(tj), 'issues:', len(lows), 'disabled-only:', len(worst) - len(lows))
    for w in worst: print('   ', w)
sys.exit(1 if bad else 0)
