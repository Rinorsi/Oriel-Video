#!/usr/bin/env python3
"""Build the downloadable Skill: out/skill/youyiku-video/ = skill/youyiku-video + assets/youyiku-kit.zip.

The zip is `git archive HEAD` of this repo (committed files only, minus skill/), so commit first.
usage: python scripts/build-skill.py
"""
import shutil, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'skill' / 'youyiku-video'
OUT = ROOT / 'out' / 'skill' / 'youyiku-video'

if OUT.exists():
    shutil.rmtree(OUT)
shutil.copytree(SRC, OUT)
(OUT / 'assets').mkdir(exist_ok=True)
zip_path = OUT / 'assets' / 'youyiku-kit.zip'
r = subprocess.run(['git', 'archive', '--format=zip', '-o', str(zip_path), 'HEAD', '--', '.', ':(exclude)skill'], cwd=ROOT)
if r.returncode:
    sys.exit('build-skill: git archive failed')
print(f'built {OUT} ({zip_path.stat().st_size / 1e6:.1f} MB zip)')
