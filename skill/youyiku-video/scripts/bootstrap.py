#!/usr/bin/env python3
"""Unpack the bundled Youyiku kit and prepare it.

usage: python scripts/bootstrap.py <target-dir> [--no-install] [--no-setup]

Extracts assets/youyiku-kit.zip into <target-dir> (skipped when it already holds a project),
then runs `npm install` and `npm run setup`. Needs Node.js 20+; `setup` reads the textures and
sounds from a local Minecraft Java install and keeps them out of git.
"""
import subprocess, sys, zipfile
from pathlib import Path

args = [a for a in sys.argv[1:] if not a.startswith('--')]
flags = {a for a in sys.argv[1:] if a.startswith('--')}
target = Path(args[0] if args else 'youyiku').resolve()
zip_path = Path(__file__).resolve().parent.parent / 'assets' / 'youyiku-kit.zip'

if (target / 'package.json').exists():
    print(f'bootstrap: project already at {target}, skipping extract')
else:
    if not zip_path.exists():
        sys.exit(f'bootstrap: missing {zip_path}')
    target.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(zip_path) as z:
        z.extractall(target)
    print(f'bootstrap: extracted to {target}')

def run(cmd):
    print('bootstrap: $', cmd)
    if subprocess.run(cmd, cwd=target, shell=True).returncode:
        sys.exit(f'bootstrap: failed: {cmd}')

if '--no-install' not in flags:
    run('npm install')
if '--no-setup' not in flags:
    run('npm run setup')
print(f'bootstrap: done. Next: read {target / "docs" / "AI使用手册.md"}')
