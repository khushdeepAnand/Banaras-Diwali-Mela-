"""Reproduce original audio; explicitly opt in to the two reviewed CC downloads.

No reference-site/YouTube asset is fetched. Python standard library only.
"""
import argparse
import array
import hashlib
import json
import math
from pathlib import Path
import random
import sys
import urllib.request
import wave

ROOT = Path(__file__).resolve().parents[1] / 'frontend/public/audio'
RATE = 22050
RECORDINGS = [
    {'file': 'om-navashivam.mp3', 'title': 'Om Navashivam — Kumaon devotional song',
     'creator': 'Yann (Yann Forget); Commons audio revisions by Fulvio314 and Mitar',
     'source': 'https://commons.wikimedia.org/w/index.php?title=File:Om_Navashivam,_traditional_hindu_song,_Kumaon,_Uttarakhand,_India.ogg&oldid=631545800',
     'licence': 'CC BY-SA 4.0', 'licence_url': 'https://creativecommons.org/licenses/by-sa/4.0/',
     'url': 'https://upload.wikimedia.org/wikipedia/commons/transcoded/d/d9/Om_Navashivam%2C_traditional_hindu_song%2C_Kumaon%2C_Uttarakhand%2C_India.ogg/Om_Navashivam%2C_traditional_hindu_song%2C_Kumaon%2C_Uttarakhand%2C_India.ogg.mp3'},
    {'file': 'temple-deeparadhana.mp3', 'title': 'Thakil & Nadaswaram — temple Deeparadhana',
     'creator': 'Vis M',
     'source': 'https://commons.wikimedia.org/w/index.php?title=File:Thakil_%26_Nadaswaram_during_temple_Deeparadhana.ogg&oldid=1110590040',
     'licence': 'CC BY 4.0', 'licence_url': 'https://creativecommons.org/licenses/by/4.0/',
     'url': 'https://upload.wikimedia.org/wikipedia/commons/transcoded/4/41/Thakil_%26_Nadaswaram_during_temple_Deeparadhana.ogg/Thakil_%26_Nadaswaram_during_temple_Deeparadhana.ogg.mp3'},
]


def tone(frequency, time):
    return math.sin(math.tau * frequency * time)


def render(name, seconds, sample):
    values = array.array('h')
    for i in range(int(RATE * seconds)):
        t = i / RATE
        envelope = min(1, t / .15, (seconds - t) / .2)
        value = max(-.85, min(.85, sample(t) * envelope))
        values.append(round(value * 32767))
    peak = max(abs(v) for v in values) / 32768
    rms = math.sqrt(sum((v / 32768) ** 2 for v in values) / len(values))
    if sys.byteorder != 'little':
        values.byteswap()
    path = ROOT / name
    with wave.open(str(path), 'wb') as output:
        output.setparams((1, 2, RATE, len(values), 'NONE', 'not compressed'))
        output.writeframes(values.tobytes())
    return {'file': name, 'seconds': seconds, 'sample_rate': RATE, 'peak': round(peak, 5),
            'rms': round(rms, 5), 'creator': 'Banaras Diwali Mela project procedural synthesis',
            'licence': 'CC0-1.0', 'licence_url': 'https://creativecommons.org/publicdomain/zero/1.0/',
            'source': 'scripts/prepare_phase5_audio.py; elementary tones and deterministic noise only'}


def originals():
    rng = random.Random(51026)
    brown = 0.0

    def river(t):
        nonlocal brown
        brown = .985 * brown + .015 * rng.uniform(-1, 1)
        return brown * .8 + rng.uniform(-1, 1) * .012 * (1 + .35 * tone(.2, t))

    def crowd(t):
        # Abstract murmur, not human speech or a field recording.
        return rng.uniform(-1, 1) * .025 * (1 + .3 * tone(.31, t)) * (1 + .2 * tone(240, t))

    def bells(t):
        age = t % 8
        return sum(tone(392 * ratio, age) * math.exp(-age * decay) * .022
                   for ratio, decay in [(1, .8), (2.71, 1.4), (4.13, 2)]) * min(1, age / .015)

    def drone(t):
        return sum(tone(f, t) * gain * (1 + .13 * tone(.1, t))
                   for f, gain in [(130.81, .07), (196.22, .035), (261.63, .025), (392.44, .012)])

    def melody(t):
        notes = [261.63, 293.66, 329.63, 392, 440, 392, 329.63, 293.66]
        age = t % 3
        return drone(t) * .6 + tone(notes[int(t // 3) % len(notes)], t) * .06 * math.sin(math.pi * age / 3) ** 2

    def fountain(t):
        if t < .9:
            return rng.uniform(-1, 1) * .045 * (t / .9)
        age = t - .9
        pulse = math.exp(-((age % .37) / .025) ** 2)
        return (rng.uniform(-1, 1) * .065 + tone(95, age) * pulse * .10) * max(0, 1 - age / 3)

    return [render('sandhya-drone.wav', 32, drone), render('deep-ki-lau.wav', 48, melody),
            render('river-loop.wav', 24, river), render('crowd-loop.wav', 24, crowd),
            render('bells-loop.wav', 24, bells), render('spark-fountain.wav', 4.2, fountain),
            render('gift-feedback.wav', .24, lambda t: tone(523.25, t) * .08 * math.exp(-t * 14)),
            render('offering-water.wav', .8, lambda t: rng.uniform(-1, 1) * .06 * math.sin(math.pi * t / .8) ** 2)]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--fetch-reviewed-cc', action='store_true')
    args = parser.parse_args()
    ROOT.mkdir(parents=True, exist_ok=True)
    entries = originals()
    for recording in RECORDINGS:
        path = ROOT / recording['file']
        if args.fetch_reviewed_cc and not path.exists():
            request = urllib.request.Request(recording['url'], headers={'User-Agent': 'BanarasMelaAudio/1.0 (CC attribution preserved)'})
            with urllib.request.urlopen(request, timeout=90) as response:
                data = response.read(25_000_001)
            if len(data) > 25_000_000 or not (data.startswith(b'ID3') or data[:1] == b'\xff'):
                raise ValueError('Unexpected or oversized audio download')
            path.write_bytes(data)
        if path.exists():
            entries.append({**recording, 'changes': 'Official Commons MP3 transcode; filename shortened; no edits, cuts or mixing into the recording'})
    for entry in entries:
        data = (ROOT / entry['file']).read_bytes()
        entry.update(bytes=len(data), sha256=hashlib.sha256(data).hexdigest())
    (ROOT / 'phase5-manifest.json').write_text(json.dumps(entries, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(json.dumps([{'file': e['file'], 'bytes': e['bytes'], 'sha256': e['sha256']} for e in entries], indent=2))


if __name__ == '__main__':
    main()
