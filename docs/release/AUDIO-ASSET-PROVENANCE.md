# Phase 5 audio provenance inventory

26 October2026. Actual downloaded/generated file sizes and SHA-256 values are in
`frontend/public/audio/phase5-manifest.json`; public credits ship beside the files
as `CREDITS.md` and are linked inside Kashi Radio.

## Bundled recordings and original assets

| Title / local file | Creator / source | Licence / attribution | Stream / embed / downloadable redistribution |
| --- | --- | --- | --- |
| Om Navashivam — `om-navashivam.mp3` | Yann (Yann Forget); Fulvio314/Mitar audio revisions; [published file licence](https://commons.wikimedia.org/w/index.php?title=File:Om_Navashivam,_traditional_hindu_song,_Kumaon,_Uttarakhand,_India.ogg&oldid=631545800) | Selected CC BY-SA4.0; creator, revisions, source, licence and transcode/no-new-edit notice retained | Self-host/public playback and bundled download permitted by published grant. Adaptations of recording remain ShareAlike. Not a Ganga Aarti recording |
| Thakil & Nadaswaram — `temple-deeparadhana.mp3` | Vis M, own work; [published file licence](https://commons.wikimedia.org/w/index.php?title=File:Thakil_%26_Nadaswaram_during_temple_Deeparadhana.ogg&oldid=1110590040) | CC BY4.0; creator/source/licence/transcode notice retained | Self-host/public playback and bundled download permitted by published grant. Attribution and change notices required. Not represented as Banaras audio |
| Sandhya — `sandhya-drone.wav` | Original project elementary-wave composition; generator script | CC0-1.0 to extent rights exist | May bundle/reproduce; no third-party recording inputs |
| Deep ki lau — `deep-ki-lau.wav` | Original project quiet melody; generator script | Same original-output terms | May bundle/reproduce; not an authentic traditional recording |
| River, crowd, bells — `river-loop.wav`, `crowd-loop.wav`, `bells-loop.wav` | Original deterministic noise/oscillator textures | Same original-output terms | May bundle/reproduce; no actual river/crowd recording or speech |
| Fountain, gift, offering — `spark-fountain.wav`, `gift-feedback.wav`, `offering-water.wav` | Original project synthesis | Same original-output terms | May bundle/reproduce; brief in-game feedback only |
| Historical `aarti-placeholder.wav` | Original project demo chime from earlier release | Original project asset, labelled demo; no third-party samples | Retained for history, excluded from active radio playlist; never described as Aarti |

Both real recordings were obtained from the MP3 transcode URLs explicitly linked
in their Commons file pages, not from YouTube or the design reference. No conversion
tool/library, content protection bypass, song extraction or remote runtime hotlink
is used. Files are unchanged official transcodes with shorter local filenames.
Licence links: [CC BY-SA4.0](https://creativecommons.org/licenses/by-sa/4.0/),
[CC BY4.0](https://creativecommons.org/licenses/by/4.0/),
[CC0](https://creativecommons.org/publicdomain/zero/1.0/).

The permission basis is each creator's explicit public self-licensing declaration.
No independent legal/performer-identity certification or endorsement is claimed.
CC metadata being free does not by itself license an audio recording; the
file-specific recording grants above were inspected separately.

## Investigated but not bundled

| Candidate | Evidence / decision |
| --- | --- |
| Reference Diwali radio | [Public page](https://melachaloge.online/diwali/) declares a YouTube radio, expandable list, seek/time and transport. Browser inspection exposed five entries including Ghar More Pardesiya; the list interaction later timed out. No ownership/recording licence supplied. User explicitly confirms reference-only; no source/audio copied |
| Ganga Aarti | [Commons category](https://commons.wikimedia.org/wiki/Category:Ganga_Aarti) contains video/photo candidates, not a blanket licence for any audio. No suitable standalone recording with adequately checked sound/performance provenance was selected. Active UI marks this missing and makes no asset request |
| Aarti Puja, deity Santoshi | [File page](https://commons.wikimedia.org/wiki/File:Aarti_Puja,_deity_Santoshi.ogg) has a CC0 tag but credits commercial performer Shri Hari Om Sharan and an external Internet Archive collection. Uploader authority is not established; also not Ganga Aarti. Rejected rather than falsely labelled public domain |
| Pixabay devotional candidates | [Licence summary](https://pixabay.com/service/license-summary/) prohibits standalone redistribution and warns of additional rights. No particular cleared recording selected or downloaded; a generic royalty-free label is insufficient for a downloadable source ZIP |
| YouTube recordings/playlists | Provider playback permission is not a local file redistribution licence. No downloads/proxies. No embed implemented because a visible unobscured provider player conflicts with a tiny gameplay dock and introduces third-party requests |

Optional external search link is separate from local music and opens only on a
click. No iframe/script, provider cookies or remote audio are loaded by the game.
[YouTube required minimum functionality](https://developers.google.com/youtube/terms/required-minimum-functionality)
requires visible unobscured player dimensions and other policies; a future embed
needs a separate consent/layout/provider review. External links imply no licence
or promise that every search result is authorised.

## Reproduction and validation

`python scripts/prepare_phase5_audio.py --fetch-reviewed-cc` was executed after
file-specific licence review. It generated eight original mono22.05kHz/16-bit PCM
WAVs and downloaded exactly the two allowlisted MP3 transcodes. The script validates
the download header/size ceiling and records all hashes. Running without that flag
generates original assets only and does not fetch recordings.

Original levels are bounded by the generator and recorded as peak/RMS metrics.
Browser playback/decoding tests are not a subjective listening-quality, traditional
authenticity or physical-phone audio-mix certification. Those remain launch QA.
