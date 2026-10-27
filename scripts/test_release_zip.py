"""Run with: python -m unittest discover -s scripts -p test_release_zip.py"""
from pathlib import Path
import hashlib
import tempfile
import unittest
from unittest.mock import patch

from release_zip import excluded, scan


class ReleaseExclusions(unittest.TestCase):
    def test_github_tokens_and_credential_urls_are_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'candidate.md'
            for value in ['gh' + 'o_' + 'a' * 36, 'https://' + 'real-user:real-secret@host.example']:
                path.write_text(value)
                with self.assertRaisesRegex(ValueError, 'Credential-like'):
                    scan(path)

    def test_private_and_generated_files_never_ship(self):
        for name in ['backend/private/organiser-jiofinance.jpeg', 'frontend/public/private/record.json',
                     'backend/private/donation-poster-candidate.png', 'backend/private/donation-qr-candidate.png', 'backend/private/donation-qr-verification.json',
                     'docs/phase5/organiser-qr-supplied.jpeg', 'docs/phase5/organiser-view.png',
                     'backend/.env', 'frontend/.env.local', 'frontend/node_modules/x.js',
                     'frontend/dist/index.html', '.git/config', 'frontend/test-results/capture.png',
                     'deploy/private-key.pem', 'credentials.key', 'certificate.pfx', 'tls.p12',
                     'browser.har', 'remote-backup.bundle']:
            with self.subTest(name=name):
                self.assertTrue(excluded(Path(name)))

    def test_source_configuration_examples_and_skills_ship(self):
        for name in ['backend/.env.example', 'frontend/.env.example', 'frontend/src/App.tsx',
                     '.opencode/skills/threejs-world-building/SKILL.md', 'docs/release/PHASE0-AUDIT-AND-ROADMAP.md']:
            with self.subTest(name=name):
                self.assertFalse(excluded(Path(name)))

    def test_private_candidate_cannot_ship_even_if_renamed(self):
        with tempfile.TemporaryDirectory() as directory:
            image = Path(directory) / 'innocent-public-image.png'
            image.write_bytes(b'test-only-private-candidate')
            with patch('release_zip.PRIVATE_QR_SHA256', {hashlib.sha256(image.read_bytes()).hexdigest()}):
                with self.assertRaisesRegex(ValueError, 'Unverified private payment image'):
                    scan(image)


if __name__ == '__main__':
    unittest.main()
