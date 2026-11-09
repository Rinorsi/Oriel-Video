#!/usr/bin/env python3
"""Extract the bundled kit into an empty directory and prepare it."""
import argparse
from pathlib import Path, PurePosixPath
import shutil, subprocess, zipfile

parser = argparse.ArgumentParser(description=__doc__, allow_abbrev=False)
parser.add_argument('target', type=Path)
parser.add_argument('--no-install', action='store_true')
parser.add_argument('--no-setup', action='store_true')
args = parser.parse_args()
target = args.target.resolve()
if target.exists() and any(target.iterdir()):
    parser.error('target must be empty; use an existing project directly instead')
archive = Path(__file__).resolve().parent.parent / 'assets' / 'youyiku-kit.zip'
if not archive.is_file():
    parser.error(f'missing bundled kit: {archive}; use the built download package')
with zipfile.ZipFile(archive) as bundle:
    for info in bundle.infolist():
        name = PurePosixPath(info.filename)
        if name.is_absolute() or '..' in name.parts or ':' in info.filename or chr(92) in info.filename or (info.external_attr >> 16) & 0o170000 == 0o120000:
            parser.error(f'unsafe archive entry: {info.filename}')
    if 'package.json' not in bundle.namelist():
        parser.error('bundle has no package.json')
    target.mkdir(parents=True, exist_ok=True)
    bundle.extractall(target)
print(f'bootstrap: extracted to {target}', flush=True)
npm = shutil.which('npm.cmd') or shutil.which('npm')
if not npm and not (args.no_install and args.no_setup):
    parser.error('npm not found; install Node.js 20+ first')
for enabled, command in [(not args.no_install, ['ci']), (not args.no_setup, ['run', 'setup'])]:
    if enabled:
        subprocess.run([npm, *command], cwd=target, check=True)
print(f'Next: read {target / "docs" / "AI使用手册.md"}')
