"""Check shipped audio bytes/PCM bounds and provenance fields, not legal ownership."""
import hashlib
import json
from pathlib import Path
import struct
import unittest
import wave

ROOT = Path(__file__).resolve().parents[1] / 'frontend/public/audio'


class Phase5Audio(unittest.TestCase):
    def test_manifest_integrity_and_recording_attribution(self):
        entries = json.loads((ROOT / 'phase5-manifest.json').read_text(encoding='utf-8'))
        self.assertEqual(len(entries), 10)
        self.assertEqual(len({entry['file'] for entry in entries}), 10)
        for entry in entries:
            with self.subTest(file=entry['file']):
                data = (ROOT / entry['file']).read_bytes()
                self.assertEqual(len(data), entry['bytes'])
                self.assertEqual(hashlib.sha256(data).hexdigest(), entry['sha256'])
                self.assertTrue(entry['creator'])
                self.assertTrue(entry['licence_url'].startswith('https://creativecommons.org/'))
                if entry['file'].endswith('.mp3'):
                    self.assertTrue(entry['source'].startswith('https://commons.wikimedia.org/'))
                    self.assertIn(entry['licence'], ['CC BY 4.0', 'CC BY-SA 4.0'])
                    self.assertIn('Official Commons MP3 transcode', entry['changes'])
                    self.assertTrue(data.startswith(b'ID3') or data[:1] == b'\xff')

    def test_original_pcm_is_bounded_nonblank_and_has_quiet_loop_edges(self):
        entries = json.loads((ROOT / 'phase5-manifest.json').read_text(encoding='utf-8'))
        originals = [entry for entry in entries if entry['file'].endswith('.wav')]
        self.assertEqual(len(originals), 8)
        for entry in originals:
            with self.subTest(file=entry['file']):
                with wave.open(str(ROOT / entry['file'])) as audio:
                    self.assertEqual((audio.getnchannels(), audio.getsampwidth(), audio.getframerate()), (1, 2, 22050))
                    self.assertAlmostEqual(audio.getnframes() / audio.getframerate(), entry['seconds'])
                    values = [sample[0] for sample in struct.iter_unpack('<h', audio.readframes(audio.getnframes()))]
                self.assertGreater(max(values), 20)
                self.assertLess(max(abs(value) for value in values), 32767 * .85)
                self.assertEqual(values[0], 0)
                self.assertLess(abs(values[-1]), 100)


if __name__ == '__main__':
    unittest.main()
