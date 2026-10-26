"""Verify the owner-supplied Paytm image; lossless crop only, never redraw a QR.

Requires Pillow/zxing-cpp in isolated analysis tools. No application dependency.
"""
import argparse
import hashlib
from io import BytesIO
import json
from pathlib import Path
import shutil
import sys
from urllib.parse import parse_qs, urlsplit


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('image', type=Path)
    parser.add_argument('--tools', type=Path, required=True)
    parser.add_argument('--report', type=Path, required=True)
    parser.add_argument('--owner-authorised', action='store_true')
    parser.add_argument('--publish', action='store_true')
    args = parser.parse_args()
    if 'private' not in args.report.parts or args.report.exists():
        raise ValueError('Use a new private report path')
    sys.path.insert(0, str(args.tools))
    from PIL import Image
    import zxingcpp

    image = Image.open(args.image).convert('RGB')
    if image.size != (788, 1280):
        raise ValueError('Reviewed crop is specific to the supplied 788x1280 Paytm image')
    box = (150, 496, 638, 985)
    crop = image.crop(box)
    original, cropped = zxingcpp.read_barcode(image), zxingcpp.read_barcode(crop)
    if not original or not cropped or original.text != cropped.text:
        raise ValueError('Original/crop decoding must match')
    uri = urlsplit(original.text)
    parameters = parse_qs(uri.query, keep_blank_values=True)
    matches = (uri.scheme == 'upi' and uri.netloc == 'pay' and not uri.fragment
               and parameters.get('pa') == ['shreeramdiwalimela@ptyes']
               and parameters.get('pn', [''])[0].strip().upper() == 'KHUSHDEEP ANAND'
               and len(parameters.get('pn', [])) == 1
               and set(parameters) <= {'pa', 'pn', 'cu'}
               and ('cu' not in parameters or parameters['cu'] == ['INR']))
    dark = crop.convert('L').point(lambda pixel: 255 if pixel < 64 else 0).getbbox()
    if not dark:
        raise ValueError('QR bounds unavailable')
    quiet = [dark[0], dark[1], crop.width - dark[2], crop.height - dark[3]]
    if min(quiet) < 48:
        raise ValueError('Insufficient reviewed quiet area')
    sizes = {}
    for width in [320, 256, 240, 200]:
        result = zxingcpp.read_barcode(crop.resize((width, round(crop.height * width / crop.width)), Image.Resampling.LANCZOS))
        sizes[width] = bool(result and result.text == original.text)
    data = BytesIO(); crop.save(data, format='PNG')
    summary = {'source_sha256': hashlib.sha256(args.image.read_bytes()).hexdigest(),
               'crop_sha256': hashlib.sha256(data.getvalue()).hexdigest(), 'crop_box': box,
               'quiet_zone_pixels': quiet, 'recipient_matches': matches,
               'currency_encoded': parameters.get('cu', [None])[0], 'fixed_amount': None,
               'resized_decode_checks': sizes, 'owner_authorised': args.owner_authorised,
               'account_ownership_bank_verified': False}
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps({**summary, 'payload': original.text, 'parameters': parameters}, indent=2), encoding='utf-8')
    if not matches or not all(sizes.values()):
        raise ValueError('Verification failed; no public QR may be published')
    if args.publish:
        if not args.owner_authorised:
            raise ValueError('Explicit owner authorisation required for publication')
        root = Path(__file__).resolve().parents[1]
        output = root / 'backend/assets/donation-paytm-qr.png'
        if output.exists():
            raise ValueError('Public output already exists; refusing overwrite')
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_bytes(data.getvalue())
        if Image.open(output).tobytes() != image.crop(box).tobytes():
            raise ValueError('Crop pixel comparison failed')
        private = root / 'backend/private/paytm-poster-20261026.jpeg'
        if not private.exists():
            shutil.copyfile(args.image, private)
    print(json.dumps(summary, indent=2))


if __name__ == '__main__':
    main()
