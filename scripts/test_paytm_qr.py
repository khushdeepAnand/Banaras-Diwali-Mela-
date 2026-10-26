"""Release checks for the approved crop. Decoder verification has its own script."""
import hashlib
from pathlib import Path
import struct
import unittest
from release_zip import excluded, PRIVATE_QR_SHA256

ROOT = Path(__file__).resolve().parents[1]


class PaytmQr(unittest.TestCase):
    def test_only_the_approved_lossless_crop_is_public(self):
        path = ROOT / 'backend/assets/donation-paytm-qr.png'
        data = path.read_bytes()
        self.assertEqual(data[:8], b'\x89PNG\r\n\x1a\n')
        self.assertEqual(struct.unpack('>II', data[16:24]), (488, 489))
        digest = hashlib.sha256(data).hexdigest()
        self.assertEqual(digest, '3d0887baef035c36ad1fb8ca4a404a96975abd4c81e393ee6a2a6e35d8776f14')
        self.assertNotIn(digest, PRIVATE_QR_SHA256)
        self.assertIn('f2947b53820ba1b3a6ccfcef7406d004453d8f5440da816983a529d8ba8dc162', PRIVATE_QR_SHA256)
        self.assertTrue(excluded(Path('backend/private/paytm-poster-20261026.jpeg')))
        self.assertTrue(excluded(Path('backend/private/paytm-verification-20261026.json')))


if __name__ == '__main__':
    unittest.main()
