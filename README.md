# Horror Engine · Séance (VST3 and CLAP)

A plugin of the Séance layout of [Horror Engine](https://github.com/SnazzyGaz/horror-engine) (the `seance-ui` branch): the spirit-board Surface, the voice tokens, Macros, Moments and Pinned knobs, the Voice, Effects, Looper and Your sound in drawers, the chain strip, presets, undo and redo, and MIDI learn. The sound comes from a line-for-line C++ port of the branch's `src/engine.js`, so it plays like the browser. There is no 3D machine.

Horror Engine is by **Garyck Arntzen** ([x.com/_mintydoge](https://x.com/_mintydoge)). This plugin is released under the **GNU Affero General Public License v3** (see `LICENSE`). It is built with JUCE 8.0.15 under JUCE's AGPLv3 option.

## Installing on Windows

- **VST3:** copy the `Horror Engine.vst3` folder to `C:\Program Files\Common Files\VST3\`.
- **CLAP:** copy `Horror Engine.clap` to `C:\Program Files\Common Files\CLAP\`.

Then rescan plugins in your DAW. It is an instrument (synth) with MIDI input. Each format is one self-contained 64-bit DLL; nothing else needs installing.

## Using it in a DAW

- **Play:** drag on the board; MIDI notes play the selected voice. Pressure: a pen's own, or Shift (hard) and Alt (soft) with a mouse, or the wheel over the board.
- **Every knob is a host parameter**, with the web app's names, ranges and curves, so it can be automated. The nine factory presets are also the host's programs.
- **MIDI:** CC 20–23 move Dread, Distance, Material and Pitch. Notes on channel 16 from C2 (36) and CC 24–43 fire the Moments. Right-click any knob, switch or selector for MIDI learn.
- **Looper, Sync to host** (on by default, saved with the project): while the host plays at a known tempo, the first layer rounds to whole bars, recording and playback start on the next bar line, and layers stay locked to the host's bars, following tempo changes, jumps and loop wraps. With the host stopped or giving no tempo, or the box off, the looper runs free like the web app.
- **Your sound in:** *Track input* runs the audio coming into the plugin on its track (route a mic, a line or another track to it in your DAW) through the spring, body, hall, harmonizer and Aura. *File* plays an audio file through it instead.
- **Keys** work when the plugin window has keyboard focus: 1–9 voices, Z…/ and Q…P notes, [ ] octave, Space looper, F1–F12 moments, H Hold, F Freeze, Esc Silence, Ctrl+Z / Ctrl+Y undo and redo, Shift+R save the last minute.
- **Saved with the project:** every setting, the selected voice, your own moments and your MIDI map. Starred presets are kept for your user account.

## What differs from the web page

The layout, controls and engine are the same. A few things that belong to the browser work the way a plugin needs:

- There is no *Start audio* / *Audio on* item and no *Wake the board*: the DAW runs the audio.
- *Mic / line* is *Track input*: the plugin takes its sound from its track.
- *Save the last minute* writes a 32-bit WAV of the plugin's last 60 seconds of output. The web page also writes a `.horror.json` performance file for re-rendering stems in the browser; the plugin does not.
- The hidden *R* recorder of the full page is left out: record in your DAW.
- *Copy share link* copies a link to the web app ([snazzygaz.github.io/horror-engine](https://snazzygaz.github.io/horror-engine/)) that opens with these settings.

## Building

See `BUILDING.md`. The Windows binaries in this release were cross-compiled on Linux with MinGW-w64 (GCC 13) and a small patch to JUCE (`patches/juce-8.0.15-mingw.patch`). With Visual Studio 2022 no patch is needed.

## Credits and notices

- Horror Engine (the instruments, the engine, the Séance layout) © 2026 Garyck Arntzen.
- The bowed-string friction curve follows the bow-table idea published in STK by Perry R. Cook and Gary P. Scavone.
- [JUCE](https://juce.com) 8.0.15 (AGPLv3), [clap-juce-extensions](https://github.com/free-audio/clap-juce-extensions) and the [CLAP](https://github.com/free-audio/clap) SDK (MIT), the VST3 SDK bundled with JUCE (MIT).
- Fonts: IM FELL English SC (Igino Marini), Crimson Pro (The Crimson Pro Project Authors), IBM Plex Mono (IBM), all under the SIL Open Font License 1.1 (`OFL.txt`). Crimson Pro is embedded as static instances (Regular, Medium, SemiBold, Italic) of its variable font.
- VST is a registered trademark of Steinberg Media Technologies GmbH.
