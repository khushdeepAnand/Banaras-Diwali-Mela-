"""Package source, scan credentials, extract and byte-verify. Python stdlib only.

Run from any directory: python scripts/release_zip.py --output PATH --extract-to NEW_DIR
The extraction directory must not exist. Build/test dependencies are never archived.
"""
import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import re
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SKIP = {"node_modules", "dist", ".git", "coverage", "test-results", "playwright-report", "__pycache__", ".vite", ".cache", "private"}
TEXT = {".ts", ".tsx", ".js", ".mjs", ".cjs", ".json", ".md", ".sql", ".html", ".css", ".example", ".yaml", ".yml", ".py"}
PRIVATE_QR_SHA256 = {
    '51adf81b52394ab832825d8a71c46f672cb59a9c86ffc6f414812ca2df467662',
    'ef280fd49776b4db41ce74caf8c4e30db4e507840e83acf2ab2fb98067e6eaee',
    'f2947b53820ba1b3a6ccfcef7406d004453d8f5440da816983a529d8ba8dc162',
}


def local_secrets():
    keys = {'SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ACCESS_TOKEN', 'ADMIN_API_TOKEN'}
    values = [os.environ.get(key, '') for key in keys]
    for directory in [ROOT, ROOT / 'backend', ROOT / 'frontend']:
        for path in directory.glob('.env*'):
            if path.name == '.env.example' or not path.is_file():
                continue
            for line in path.read_text().splitlines():
                name, separator, value = line.removeprefix('export ').partition('=')
                if separator and name.strip() in keys:
                    values.append(value.strip().strip('\"\''))
    return [value.encode() for value in values if len(value) >= 16]


SECRETS = local_secrets()


def excluded(path):
    return (bool(set(path.parts) & SKIP)
            or path.name.lower().startswith('organiser-') and path.suffix.lower() in {'.png', '.jpg', '.jpeg', '.webp', '.pdf'}
            or path.name.startswith('.env') and path.name != '.env.example'
            or path.suffix in {'.zip', '.log', '.tsbuildinfo', '.pyc', '.tmp', '.trace', '.har', '.pem', '.key', '.p12', '.pfx', '.bundle'}
            or path.name == '.DS_Store')


def scan(path):
    data = path.read_bytes()
    if hashlib.sha256(data).hexdigest() in PRIVATE_QR_SHA256:
        raise ValueError(f'Unverified private payment image detected in release/public output: {path}')
    if any(secret in data for secret in SECRETS):
        raise ValueError(f'Local credential value detected in {path}; value redacted')
    if path.suffix not in TEXT:
        return
    text = path.read_text(encoding='utf-8-sig')
    if re.search(r'sb_secret_[A-Za-z0-9_-]{16,}|sbp_[a-fA-F0-9]{40,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|AKIA[A-Z0-9]{16}', text):
        raise ValueError(f'Secret-like value in {path}')
    # Exact public rejection-test fixture, not a credential. No general test exemption.
    credential_text = text
    if path.as_posix().endswith('/backend/test/staging.test.ts'):
        credential_text = text.replace('https://' + 'user:password@project.supabase.co', '')
    if path.as_posix().endswith('/frontend/src/components/sharing.test.ts'):
        credential_text = text.replace('https://' + 'user:password@example.org/?private=value#fragment', '')
    if re.search(r'gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|https?://[^\s/@:]+:[^\s/@]+@', credential_text):
        raise ValueError(f'Credential-like value in {path}; value redacted')
    for token in re.findall(r'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+', text):
        try:
            payload = token.split('.')[1]
            claims = json.loads(base64.urlsafe_b64decode(payload + '=' * (-len(payload) % 4)))
        except (ValueError, UnicodeDecodeError):
            continue
        if claims.get('role') == 'service_role':
            raise ValueError(f'Service-role JWT in {path}')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--extract-to', type=Path, required=True)
    args = parser.parse_args()
    if args.extract_to.exists() or args.output.exists():
        raise ValueError('Output ZIP and extraction directory must be new; refusing overwrite')
    files = sorted(p for p in ROOT.rglob('*') if p.is_file() and not excluded(p.relative_to(ROOT)))
    for path in files:
        scan(path)
    required = ['frontend/package-lock.json', 'backend/package-lock.json', 'frontend/src/App.tsx',
                'frontend/src/world/MelaScene.tsx', 'backend/src/server.ts',
                'backend/migrations/001_mela_commerce.sql', 'backend/migrations/002_staging_hardening.sql',
                'frontend/e2e/phase12.spec.ts',
                'docs/phase11/VERIFICATION.md', 'docs/phase12/VERIFICATION.md',
                 '.opencode/skills/caveman/SKILL.md', '.opencode/skills/token-efficient-coding/SKILL.md']
    required += ['docs/phase13/LAUNCH.md', 'docs/phase13/VERIFICATION.md',
                 'docs/phase13/PREFLIGHT-DATABASE.sql', 'docs/phase13/VERIFY-SERVICE-ROLE.sql',
                 'scripts/check_supabase.mjs', 'scripts/verify_database.mjs', 'scripts/verify_live.mjs',
                 'backend/test/release.test.ts', 'backend/.env.example', 'frontend/.env.example',
                 '.opencode/skills/supabase-security/SKILL.md',
                 '.opencode/skills/release-zip-verification/SKILL.md']
    required += ['docs/release/PHASE0-AUDIT-AND-ROADMAP.md', 'docs/release/PHASE1-IMPLEMENTATION.md',
                 'docs/release/PHASE2-IMPLEMENTATION.md', 'backend/src/rooms.ts',
                 'backend/src/shared/world.ts', 'backend/src/shared/network.ts',
                 'backend/test/rooms.test.ts', 'frontend/src/components/useRoom.ts',
                 'frontend/src/components/RoomPanel.tsx', 'frontend/src/world/CrowdScene.tsx',
                 'frontend/src/world/crowd.ts', 'frontend/e2e/phase2.spec.ts']
    required += ['docs/release/DONATION-UI-AND-QR-VERIFICATION.md', 'backend/src/shared/donation.ts',
                 'frontend/src/components/DonationPanel.tsx', 'frontend/src/donation.css',
                 'backend/test/donation.test.ts', 'frontend/e2e/donation-redesign.spec.ts',
                 'scripts/verify_donation_qr.py']
    names = {p.relative_to(ROOT).as_posix() for p in files}
    required += ['backend/assets/donation-paytm-qr.png', 'scripts/verify_paytm_qr.py',
                 'docs/release/DONATION-PAYTM-REPLACEMENT-20261026.md']
    required += ['docs/release/PHASE5-GAPS.md', 'docs/release/PHASE5-AUDIO-REPORT.md',
                 'docs/release/AUDIO-ASSET-PROVENANCE.md', 'docs/release/WEBSITE-INTEGRATION-PLAN.md',
                 'frontend/src/components/KashiRadio.tsx', 'frontend/src/components/festivalSound.ts',
                 'frontend/src/components/useFestivalSound.ts', 'frontend/src/components/festivalSound.test.ts',
                 'frontend/src/radio.css', 'frontend/e2e/phase5.spec.ts', 'frontend/e2e/audioProbe.ts',
                 'frontend/public/audio/CREDITS.md', 'frontend/public/audio/phase5-manifest.json',
                 'scripts/prepare_phase5_audio.py', 'scripts/test_phase5_audio.py']
    required += ['frontend/public/audio/' + name for name in
                 ['sandhya-drone.wav', 'deep-ki-lau.wav', 'river-loop.wav', 'crowd-loop.wav',
                  'bells-loop.wav', 'spark-fountain.wav', 'gift-feedback.wav', 'offering-water.wav',
                  'om-navashivam.mp3', 'temple-deeparadhana.mp3']]
    required += ['backend/src/shared/gameplay.ts', 'frontend/src/components/useGameplay.ts',
                 'frontend/src/components/CollectionPanel.tsx', 'frontend/src/world/GameplayEffects.tsx',
                 'frontend/src/world/gameplay.test.ts', 'frontend/e2e/phase4.spec.ts',
                  'docs/release/PHASE4-GAPS.md', 'docs/release/PHASE4-IMPLEMENTATION-REPORT.md']
    required += ['docs/release/PHASE6-GAPS.md', 'docs/release/PHASE6-IMPLEMENTATION-REPORT.md',
                 'docs/release/PHASE6-WEBSITE-READINESS.md', 'frontend/e2e/phase6-launch.spec.ts',
                 'frontend/src/launch.css', 'frontend/src/components/LaunchExperience.tsx',
                 'frontend/src/components/sharing.ts', 'frontend/src/components/sharing.test.ts',
                 'frontend/src/components/photoFinish.ts', 'frontend/src/world/phase6.test.ts',
                 'frontend/src/world/adaptiveQuality.ts', 'frontend/public/gallery/riverfront.png',
                  'frontend/public/gallery/temple-court.png']
    required += ['docs/release/PHASE7-GAPS.md', 'docs/release/PHASE7-IMPLEMENTATION-REPORT.md',
                 'docs/release/PHASE7-GITHUB-AND-HOSTING-HANDOFF.md', 'scripts/github_safety.py',
                 'frontend/src/components/journey.ts', 'frontend/src/components/useJourney.ts',
                 'frontend/src/components/JourneyPanel.tsx', 'frontend/src/components/RangoliPanel.tsx',
                 'frontend/src/components/rangoli.ts', 'frontend/src/components/SocialPanel.tsx',
                 'backend/src/shared/social.ts', 'backend/test/social.test.ts',
                 'frontend/src/components/journey.test.ts', 'frontend/e2e/phase7.spec.ts',
                 'frontend/e2e/phase7-social.spec.ts', 'frontend/src/journey.css']
    required += ['docs/release/PHASE8-GAPS.md', 'docs/release/PHASE8-IMPLEMENTATION-REPORT.md',
                 'docs/release/PHASE8-STAGING-RUNBOOK.md', 'docs/release/PHASE8-ROLLBACK-PLAN.md',
                 'docs/release/PHASE8-REQUIREMENTS-MATRIX.md', 'backend/src/static.ts',
                 'backend/test/deployment.test.ts', 'backend/test/restart.test.ts',
                 'frontend/playwright.staging.config.ts', 'frontend/e2e-staging/deployment.spec.ts',
                 'frontend/e2e-staging/tls-proxy.mjs', 'scripts/audit_git_history.py',
                  'deploy/staging/.env.example', 'deploy/portal-link.html', 'render.yaml', 'render.free.yaml',
                  'scripts/test_free_staging.py', '.node-version']
    if not set(required) <= names:
        raise ValueError(f'Missing required files: {set(required) - names}')
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(args.output, 'x', zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for path in files:
            archive.write(path, 'banaras-diwali-mela/' + path.relative_to(ROOT).as_posix())
    with zipfile.ZipFile(args.output) as archive:
        if archive.testzip() is not None:
            raise ValueError('ZIP CRC verification failed')
        for name in archive.namelist():
            parts = Path(name).parts
            if '\\' in name or '..' in parts or parts[0] != 'banaras-diwali-mela' or excluded(Path(*parts[1:])):
                raise ValueError(f'Unexpected archive entry: {name}')
        archive.extractall(args.extract_to)
    for path in files:
        extracted = args.extract_to / 'banaras-diwali-mela' / path.relative_to(ROOT)
        if hashlib.sha256(path.read_bytes()).digest() != hashlib.sha256(extracted.read_bytes()).digest():
            raise ValueError(f'Extracted file mismatch: {path}')
        scan(extracted)
    print(json.dumps({'zip': str(args.output), 'files': len(files), 'bytes': args.output.stat().st_size,
                      'sha256': hashlib.sha256(args.output.read_bytes()).hexdigest(),
                      'extracted_to': str(args.extract_to), 'crc_and_byte_comparison': 'passed'}, indent=2))


if __name__ == '__main__':
    main()
