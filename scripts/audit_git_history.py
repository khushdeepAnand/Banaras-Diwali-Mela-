"""Scan every reachable Git blob without printing credential values. Stdlib only."""
import json
from pathlib import Path
import subprocess
import tempfile
from release_zip import ROOT, excluded, scan


def main():
    commits = subprocess.check_output(['git', 'rev-list', '--all'], cwd=ROOT, text=True).splitlines()
    if not commits:
        raise ValueError('No history to inspect')
    seen = set()
    largest = []
    with tempfile.TemporaryDirectory(prefix='banaras-history-') as directory:
        for commit in commits:
            entries = subprocess.check_output(['git', 'ls-tree', '-rz', commit], cwd=ROOT).decode().split('\0')
            for entry in filter(None, entries):
                metadata, name = entry.split('\t', 1)
                mode, kind, oid = metadata.split()
                if kind != 'blob' or mode == '120000' or excluded(Path(name)):
                    raise ValueError(f'Forbidden historical path/type: {name}')
                if oid in seen:
                    continue
                seen.add(oid)
                data = subprocess.check_output(['git', 'cat-file', 'blob', oid], cwd=ROOT)
                path = Path(directory) / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(data)
                scan(path)
                largest.append((len(data), name))
    print(json.dumps({'reachable_commits': len(commits), 'unique_blobs_scanned': len(seen),
                      'secret_and_private_path_scan': 'PASS', 'largest_blobs': sorted(largest, reverse=True)[:5]}))


if __name__ == '__main__':
    main()
