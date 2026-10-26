# Kashi Radio audio assets

The active single music player is `src/components/useFestivalAudio.ts`, mounted by
App. `useCeremonyAudio.ts` and `aarti-placeholder.wav` are retained historical/demo
resources, not the active radio and not an authentic Aarti recording.

See [CREDITS.md](CREDITS.md) for recording attribution, source and reuse terms.
`phase5-manifest.json` records asset sizes, hashes, original synthesis levels and
source/licence URLs. Music is fetched only after a visitor explicitly selects Play
or a track. Environment assets are fetched only after their separate enable action.

The original WAV assets reproduce with `python scripts/prepare_phase5_audio.py` from
the repository root. `--fetch-reviewed-cc` additionally obtains only the two
explicitly reviewed Commons MP3 transcodes; no reference-site or YouTube audio is
downloaded. Do not run that opt-in command for arbitrary substitute recordings.

No licensed Ganga Aarti recording is currently bundled. The selector explains that
gap without making a missing-file request. Supply documented rights for an actual
recording before adding one; never rename a chime, generic instrumental or another
deity's Aarti as Ganga Aarti.
