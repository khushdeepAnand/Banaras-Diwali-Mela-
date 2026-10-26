"""Read-only scan of the exact staged/tracked Git payload. Never prints secret values."""
import json
from pathlib import Path
import subprocess
from release_zip import ROOT, excluded, scan


def main():
    files = subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT).decode().split('\0')
    files = [name for name in files if name]
    if not files:
        raise ValueError('No staged/tracked payload to verify')
    for name in files:
        if excluded(Path(name)):
            raise ValueError(f'Forbidden Git payload path: {name}')
        staged = subprocess.check_output(['git', 'show', ':' + name], cwd=ROOT)
        if staged != (ROOT / name).read_bytes():
            raise ValueError(f'Index differs from working file; restage before scanning: {name}')
        scan(ROOT / name)
    required = {'README.md', 'frontend/src/App.tsx', 'backend/src/server.ts',
                'frontend/package-lock.json', 'backend/package-lock.json',
                'backend/migrations/001_mela_commerce.sql', 'backend/migrations/002_staging_hardening.sql',
                'frontend/.env.example', 'backend/.env.example', 'frontend/e2e/phase7.spec.ts'}
    if not required <= set(files):
        raise ValueError('Required application files missing from Git payload')
    # No frontend secret variables. Vite embeds all VITE_ values at build time.
    example = (ROOT / 'frontend/.env.example').read_text()
    for line in example.splitlines():
        if line.strip() and not line.startswith('#') and line.split('=')[0] != 'VITE_API_BASE_URL':
            raise ValueError('Unexpected frontend environment variable')
    ignored = ['frontend/.env', 'backend/.env.local', 'frontend/node_modules/probe', 'backend/dist/server.js',
               'backend/private/owner.pdf', 'frontend/test-results/trace.zip', 'release.zip']
    for name in ignored:
        result = subprocess.run(['git', 'check-ignore', '-q', name], cwd=ROOT)
        if result.returncode != 0:
            raise ValueError(f'Missing ignore rule: {name}')
    print(json.dumps({'files_scanned': len(files), 'secrets_and_private_paths': 'passed',
                      'required_source_and_migrations': 'passed', 'ignore_checks': len(ignored)}))


if __name__ == '__main__':
    main()
