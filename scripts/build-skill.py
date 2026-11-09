#!/usr/bin/env python3
"""Package current working files, excluding generated and private assets."""
import hashlib, json, shutil, subprocess, sys, zipfile
from pathlib import Path, PurePosixPath
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'out' / 'skill' / 'oriel-video'
files = subprocess.check_output(['git', 'ls-files', '-z', '--cached', '--others', '--exclude-standard'], cwd=ROOT).decode('utf-8').split(chr(0))
files = sorted(set(f for f in files if f and not f.startswith('skill/') and (ROOT / f).is_file()))
for name in files:
    parts = PurePosixPath(name).parts
    if {'node_modules', 'out', 'vendor', 'daily', '.git', '__pycache__'}.intersection(parts) or name.startswith(('public/mc/', 'public/audio/', 'public/footage/', 'public/promo/', 'public/promo2/', 'gallery/')) or any(p.startswith('.env') for p in parts) or name.endswith(('.log', '.mp4', '.mov', '.zip', '.pyc', '.pem', '.key')) or (ROOT / name).is_symlink():
        sys.exit(f'build-skill: refused private/generated file: {name}')
if OUT.exists(): shutil.rmtree(OUT)
shutil.copytree(ROOT / 'skill/oriel-video', OUT, ignore=shutil.ignore_patterns('__pycache__', '*.pyc', 'assets'))
(OUT / 'assets').mkdir()
archive = OUT / 'assets/oriel-video-kit.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as bundle:
    for name in files: bundle.write(ROOT / name, name)
meta = {'commit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(), 'workingTree': True, 'files': len(files), 'sha256': hashlib.sha256(archive.read_bytes()).hexdigest()}
(OUT / 'assets/oriel-video-kit.json').write_text(json.dumps(meta, indent=2) + chr(10), encoding='utf-8')
print(f'built {OUT}; {len(files)} files; sha256={meta["sha256"]}')

shutil.make_archive(str(OUT.parent / 'oriel-video'), 'zip', root_dir=OUT.parent, base_dir=OUT.name)
