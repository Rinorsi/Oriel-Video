#!/usr/bin/env python3
"""Packaging regression tests. Set YOUYIKU_TEST_TMP to an isolated output directory."""
import os, shutil, subprocess, sys, tempfile, unittest, zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent

class BootstrapTests(unittest.TestCase):
    def setUp(self):
        base = os.environ.get('YOUYIKU_TEST_TMP')
        if base: Path(base).mkdir(parents=True, exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(dir=base)
        self.root = Path(self.temp.name)
        self.skill = self.root / 'skill'
        (self.skill / 'scripts').mkdir(parents=True)
        (self.skill / 'assets').mkdir()
        shutil.copyfile(ROOT / 'skill/oriel-video/scripts/bootstrap.py', self.skill / 'scripts/bootstrap.py')
        self.target = self.root / 'target with spaces'
    def tearDown(self): self.temp.cleanup()
    def archive(self, entries):
        with zipfile.ZipFile(self.skill / 'assets/oriel-video-kit.zip', 'w') as z:
            for name, value in entries.items(): z.writestr(name, value)
    def run_bootstrap(self, *extra):
        return subprocess.run([sys.executable, str(self.skill / 'scripts/bootstrap.py'), str(self.target), '--no-install', '--no-setup', *extra], capture_output=True, text=True)
    def test_extract_to_path_with_spaces(self):
        self.archive({'package.json':'{"name":"oriel-video"}', 'src/a.ts':'export const a=1;'})
        self.assertEqual(self.run_bootstrap().returncode, 0)
        self.assertTrue((self.target / 'src/a.ts').is_file())
    def test_refuses_existing_project(self):
        self.target.mkdir()
        marker = self.target / 'package.json'
        marker.write_text('{"name":"another-project"}')
        self.assertNotEqual(self.run_bootstrap().returncode, 0)
        self.assertEqual(marker.read_text(), '{"name":"another-project"}')
    def test_refuses_traversal_before_extract(self):
        self.archive({'package.json':'{}', '../escape.txt':'bad'})
        self.assertNotEqual(self.run_bootstrap().returncode, 0)
        self.assertFalse((self.root / 'escape.txt').exists())
        self.assertFalse(self.target.exists())
    def test_refuses_unknown_option(self):
        self.archive({'package.json':'{}'})
        self.assertNotEqual(self.run_bootstrap('--no-instal').returncode, 0)

if __name__ == '__main__': unittest.main()
