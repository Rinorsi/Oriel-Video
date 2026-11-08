#!/usr/bin/env python3
"""Prepare media + data for the Promo2 (no voice-over) video. Needs ffmpeg, numpy, and the gallery previews.

usage: python promo/prep.py all   (or one step: sky | render-heroes | walls | heroes | data)
 sky           : render the four sky loops -> public/promo2/sky
 render-heroes : render the featured effects at 1080p -> public/promo2/hero/<id>.mp4
 walls         : build the wall page videos (tiles of gallery previews) -> public/promo2/wall/*.mp4
 heroes        : normal (+ slow for transitions) 1280x720 clips, find where the transition happens -> promo/heroes.meta.json
 data          : write src/promo/promo2.data.json
Put your own music at public/promo2/audio/bgm.mp3.
"""
import json, os, subprocess, sys, random
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
STUDIO = os.path.abspath(os.path.join(HERE, '..'))
GAL = os.path.join(STUDIO, 'gallery')  # made by: npm run fx -- previews all
PUB = os.path.join(STUDIO, 'public', 'promo2')
man = json.load(open(os.path.join(GAL, 'manifest.json'), encoding='utf8'))
lib = json.load(open(os.path.join(STUDIO, 'src', 'lib', 'catalog.json'), encoding='utf8'))
lib = lib if isinstance(lib, list) else lib['effects']
trans_ids = [e['id'] for e in lib if e['kind'] == 'transition']
assert len(trans_ids) == 59

def group(i):
    if i.startswith('cute-'): return '可爱'
    if i.startswith('t2-'): return '末地系'
    if i.startswith('jump-'): return '跳转'
    if i.startswith('dim-'): return '维度'
    if i.startswith('mcd-'): return '地下城'
    return '经典'

ORDER = ['经典', '末地系', '跳转', '维度', '可爱', '地下城']
trans = sorted(trans_ids, key=lambda i: (ORDER.index(group(i)), trans_ids.index(i)))

def short(name):
    return name.replace('地下城·', '')

PAGE_SIZES = [15, 15, 15, 14]
pages = []
k = 0
for n in PAGE_SIZES:
    pages.append(trans[k:k + n]); k += n
assert k == 59

OTHERS = [
    ('mcd-scene-nether', '场景'), ('mcd-scene-snow', '场景'), ('mcd-s-boss-intro', '地下城'), ('mcd-s-chest-reveal', '地下城'),
    ('mcd-s-results', '地下城'), ('soc-triple', '点赞关注'), ('soc-follow', '点赞关注'), ('map-route-minecart', '地图'),
    ('item-enchanting', '物品'), ('info-chapter-ore', '信息'), ('info-lower-third-cute', '信息'), ('atm-rain', '氛围'),
    ('atm-thunder', '氛围'), ('mcd-kit-hud', '套件'), ('scene-intro-title', '片头'),
]
for i, _ in OTHERS: assert i in man, i

HEROES = ['cute-creeper-rush', 't2-end-portal', 'cute-slime-splat', 't2-enderman-stare', 't2-villager-hmm', 't2-lava-rise', 't2-pickaxe-break', 'mcd-t-chest-beam']
SHOWS = [
    ('mcd-kit-title-text', '地下城风格'), ('mcd-s-boss-intro', '地下城风格'), ('mcd-s-results', '地下城风格'), ('mcd-s-level-up', '地下城风格'),
    ('item-craft-table', '物品动画'), ('item-furnace', '物品动画'), ('item-enchanting', '物品动画'), ('item-smithing', '物品动画'),
    ('soc-triple', '点赞关注'),
]
for i, _ in SHOWS: assert i in man, i

W, H, COLS, TW, TH, CELL_H = 1280, 720, 5, 256, 144, 240

def ff(args):
    r = subprocess.run(['ffmpeg', '-y', '-v', 'error'] + args, capture_output=True, text=True)
    if r.returncode: raise SystemExit(r.stderr[-800:])

def span(path, cap=84):
    g = frames_gray(path)
    dA = np.abs(g - g[0]).mean(axis=(1, 2)); dB = np.abs(g - g[-1]).mean(axis=(1, 2))
    thr = 3.0
    a = int(np.argmax(dA > thr)) if (dA > thr).any() else 0
    b = len(g) - int(np.argmax(dB[::-1] > thr)) if (dB > thr).any() else len(g)
    a = max(0, a - 6); b = min(len(g), b + 6)
    if b - a < 30: b = min(len(g), a + 30)
    return a, min(b, a + cap)

def build_page(ids, out, dur, trimmed=True):
    ins, chain, last = [], [], '[bg]'
    rnd = random.Random(7)
    for n, i in enumerate(ids):
        p = os.path.join(GAL, 'previews', i + '.mp4')
        ins += ['-i', p]
        if trimmed:
            a, b = span(p)
            chain.append(f'[{n}:v]fps=30,trim=start_frame={a}:end_frame={b},setpts=PTS-STARTPTS,loop=loop=-1:size={b - a}:start=0,scale={TW}:{TH}:flags=bicubic,setsar=1[t{n}]')
        else:
            chain.append(f'[{n}:v]fps=30,loop=loop=-1:size=400:start=0,scale={TW}:{TH}:flags=bicubic,setsar=1[t{n}]')
    flt = [f'color=c=0x14110f:s={W}x{H}:r=30:d={dur}[bg]'] + chain
    for n in range(len(ids)):
        x, y = (n % COLS) * TW, (n // COLS) * CELL_H
        nxt = f'[o{n}]'
        flt.append(f'{last}[t{n}]overlay={x}:{y}:shortest=0{nxt}')
        last = nxt
    ff(ins + ['-filter_complex', ';'.join(flt), '-map', last, '-t', str(dur), '-an', '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', out])

def frames_gray(path):
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', path, '-vf', 'fps=30,scale=64:36,format=gray', '-f', 'rawvideo', '-'])
    a = np.frombuffer(raw, np.uint8).reshape(-1, 36, 64).astype(np.float32)
    return a

def cmd_walls():
    os.makedirs(os.path.join(PUB, 'wall'), exist_ok=True)
    for n, ids in enumerate(pages):
        build_page(ids, os.path.join(PUB, 'wall', f'trans{n + 1}.mp4'), 8.4); print('page', n + 1)
    build_page([i for i, _ in OTHERS], os.path.join(PUB, 'wall', 'others.mp4'), 8.4, trimmed=False); print('others')

def _unused_frames_gray(path):
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', path, '-vf', 'fps=30,scale=64:36,format=gray', '-f', 'rawvideo', '-'])
    a = np.frombuffer(raw, np.uint8).reshape(-1, 36, 64).astype(np.float32)
    return a

def cmd_heroes():
    meta = {}
    for i in HEROES + [x for x, _ in SHOWS]:
        src = os.path.join(STUDIO, 'public', 'promo2', 'hero', i + '.mp4')
        n_out = os.path.join(PUB, 'hero', i + '_n.mp4'); s_out = os.path.join(PUB, 'hero', i + '_s.mp4')
        ff(['-i', src, '-vf', 'scale=1280:720:flags=bicubic', '-an', '-c:v', 'libx264', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', '30', n_out])
        g = frames_gray(n_out)
        if i in HEROES:
            ff(['-i', n_out, '-vf', 'framerate=fps=60:interp_start=0:interp_end=255:scene=100,setpts=2*PTS,fps=30', '-an', '-c:v', 'libx264', '-crf', '17', '-pix_fmt', 'yuv420p', s_out])
            dA = np.abs(g - g[0]).mean(axis=(1, 2)); dB = np.abs(g - g[-1]).mean(axis=(1, 2))
            thr = 3.0
            a_end = int(np.argmax(dA > thr)) if (dA > thr).any() else 0
            b_start = len(g) - int(np.argmax(dB[::-1] > thr)) if (dB > thr).any() else len(g)
            meta[i] = {'frames': len(g), 'transStart': a_end, 'transEnd': b_start}
        else:
            meta[i] = {'frames': len(g)}
        print(i, meta[i])
    json.dump(meta, open(os.path.join(HERE, 'heroes.meta.json'), 'w'), indent=1)

def cmd_data():
    heroes_meta = json.load(open(os.path.join(HERE, 'heroes.meta.json')))
    def item(i):
        m = man[i]; return {'id': i, 'name': short(m['name']), 'group': group(i), 'blurb': m.get('blurb', ''), 'usage': m.get('usage', ''), 'alpha': bool(m.get('alpha'))}
    data = {
        'totals': {'all': len(man), 'transitions': 59, 'others': len(man) - 59, 'alpha': sum(1 for v in man.values() if v.get('alpha'))},
        'heroes': [{**item(i), **heroes_meta[i]} for i in HEROES],
        'shows': [{**item(i), **heroes_meta[i], 'tag': t} for i, t in SHOWS],
        'pages': [[item(i) for i in ids] for ids in pages],
        'others': [{**item(i), 'tag': t} for i, t in OTHERS],
    }
    out = os.path.join(STUDIO, 'src', 'promo', 'promo2.data.json')
    json.dump(data, open(out, 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    print('wrote', out, data['totals'])

def run(cmd):
    r = subprocess.run(cmd, cwd=STUDIO, shell=True)
    if r.returncode: raise SystemExit('failed: ' + cmd)

def cmd_render_heroes():
    os.makedirs(os.path.join(PUB, 'hero'), exist_ok=True)
    for i in HEROES + [x for x, _ in SHOWS]:
        if os.path.exists(os.path.join(PUB, 'hero', i + '.mp4')): continue
        run(f'npx remotion render src/entry-all.tsx fx-{i} public/promo2/hero/{i}.mp4 --codec=h264 --crf=16 --muted')

def cmd_sky():
    os.makedirs(os.path.join(PUB, 'sky'), exist_ok=True)
    for k in ('dawn', 'noon', 'dusk', 'night'):
        run(f'npx remotion render src/index.ts Loop-{k} public/promo2/sky/Loop-{k}.mp4 --codec=h264 --muted')

STEPS = {'sky': cmd_sky, 'render-heroes': cmd_render_heroes, 'walls': cmd_walls, 'heroes': cmd_heroes, 'data': cmd_data}
if sys.argv[1] == 'all':
    for k in ('sky', 'render-heroes', 'walls', 'heroes', 'data'): STEPS[k]()
else:
    STEPS[sys.argv[1]]()
