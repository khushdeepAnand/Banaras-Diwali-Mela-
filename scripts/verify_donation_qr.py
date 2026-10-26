"""Offline verification of the supplied 1227x1282 poster; NEVER generates a QR.

Requires Pillow and zxing-cpp as analysis tools, not application dependencies.
Example: python scripts/verify_donation_qr.py backend/private/donation-poster-candidate.png
         --tools PATH_TO_ISOLATED_TOOLS --report backend/private/qr-check.json
Exit 2 means a decoded but mismatched recipient. Reports must stay private.
"""
import argparse
import hashlib
from io import BytesIO
import json
from pathlib import Path
import sys
from urllib.parse import parse_qs, urlsplit


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('image', type=Path)
    parser.add_argument('--tools', type=Path)
    parser.add_argument('--report', type=Path, required=True)
    args = parser.parse_args()
    if 'private' not in {part.lower() for part in args.report.parts} or args.report.exists():
        raise ValueError('Use a NEW report path inside a private directory; refusing overwrite/public output')
    if args.tools:
        sys.path.insert(0, str(args.tools))
    from PIL import Image
    import zxingcpp

    image = Image.open(args.image)
    if image.size != (1227, 1282):
        raise ValueError('This audited crop applies only to the supplied 1227x1282 poster')
    box = (300, 420, 930, 1034)
    crop = image.crop(box)  # no resizing, binarisation, module edits or reconstruction
    original_result, crop_result = zxingcpp.read_barcode(image), zxingcpp.read_barcode(crop)
    if not original_result or not crop_result or original_result.text != crop_result.text:
        raise ValueError('Original/crop decoding failed or payloads differ; payments must remain disabled')
    payload = original_result.text
    uri = urlsplit(payload)
    parameters = parse_qs(uri.query, keep_blank_values=True)
    buffer = BytesIO(); crop.save(buffer, format='PNG')
    bounds = crop.convert('L').point(lambda pixel: 255 if pixel < 64 else 0).getbbox()
    if not bounds:
        raise ValueError('No code bounds found')
    quiet = [bounds[0], bounds[1], crop.width - bounds[2], crop.height - bounds[3]]
    matches = uri.scheme == 'upi' and uri.netloc == 'pay' and parameters.get('pa') == ['shreeramdiwalimela@ptyes'] and parameters.get('pn') == ['Khushdeep Anand'] and parameters.get('cu') == ['INR']
    sizes = {}
    for width in [320, 256, 240, 200]:
        preview = crop.resize((width, round(crop.height * width / crop.width)), Image.Resampling.LANCZOS)
        result = zxingcpp.read_barcode(preview)
        sizes[width] = bool(result and result.text == payload)
    report = {'decoder': 'zxing-cpp', 'source_sha256': hashlib.sha256(args.image.read_bytes()).hexdigest(),
              'crop_box': box, 'crop_sha256': hashlib.sha256(buffer.getvalue()).hexdigest(),
              'quiet_zone_pixels_left_top_right_bottom': quiet, 'payload': payload,
              'parameters': parameters, 'recipient_matches': matches,
              'fixed_amount': parameters.get('am', [''])[0] or None, 'resized_decode_checks': sizes,
              'payment_instructions_enabled': False}
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2), encoding='utf8')
    print(json.dumps({key: value for key, value in report.items() if key not in {'payload', 'parameters'}}, indent=2))
    if not matches:
        print('BLOCKED: encoded payee does not match the intended recipient. No payment instruction enabled.')
        return 2
    print('Payload matches; this does NOT verify account ownership or authorise enabling payments.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
