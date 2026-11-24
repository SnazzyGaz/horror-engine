# Horror Engine · Séance (VST3 and CLAP)

A plugin of the Séance layout of [Horror Engine](https://github.com/SnazzyGaz/horror-engine) (the `seance-ui` branch): the spirit-board Surface, the voice tokens, Macros, Moments and Pinned knobs, the Voice, Effects, Looper and Your sound in drawers, the chain strip, presets, undo and redo, and MIDI learn. The sound comes from a line-for-line C++ port of the branch's `src/engine.js`, so it plays like the browser. There is no 3D machine.

Horror Engine is by **Garyck Arntzen** ([x.com/_mintydoge](https://x.com/_mintydoge)). This plugin is released under the **GNU Affero General Public License v3** (see `LICENSE`). It is built with JUCE 8.0.15 under JUCE's AGPLv3 option.

## Installing on Windows

Download the [plugin-v1.0.14](https://github.com/SnazzyGaz/horror-engine/releases/tag/plugin-v1.0.14) release and unzip it. Use **`HorrorEngine-Seance-1.0.14-Windows-MinGW.zip`** (recommended: this is the build already used in FL Studio). The `…-Windows-MSVC.zip` is the GitHub Actions build; it passed automated validation but has not yet been load-tested in a DAW.

- **VST3:** copy the `Horror Engine.vst3` folder to `C:\Program Files\Common Files\VST3\`.
- **CLAP** (optional): copy `Horror Engine.clap` to `C:\Program Files\Common Files\CLAP\` (create that folder if needed). FL Studio supports CLAP from 2024.1.

Then rescan plugins in your DAW. It is an instrument (synth) with MIDI input. Each format is one self-contained 64-bit DLL; nothing else needs installing.

**FL Studio:** **Options > Manage plugins** (also under **Options > File settings**). Turn on **Verify plugins** and **Rescan previously verified plugins**, then click **Find installed plugins**. Add it from the Browser under **Plugin database > Installed > Generators > New**, or from the Channel Rack **+** button / **Add** menu (use **More plugins…** if it is not in the list yet).

In other DAWs, rescan plugins and add it as an instrument on a MIDI track.

**Uninstall:** delete the copied `Horror Engine.vst3` folder and, if you installed it, `Horror Engine.clap`, then rescan (or remove the entry from FL Studio's Plugin database).

**Limits.** Windows only (64-bit). Tested in FL Studio. Other DAWs should work after a rescan, but have not been load-tested yet.

## Using it in a DAW

- **Play:** drag on the board; MIDI notes play the selected voice. Pressure: a pen's own, or Shift (hard) and Alt (soft) with a mouse, or the wheel over the board.
- **Every knob is a host parameter**, with the web app's names, ranges and curves, so it can be automated. The nine factory presets are also the host's programs.
- **MIDI:** CC 20–23 move Dread, Distance, Material and Pitch. Notes on channel 16 from C2 (36) and CC 24–43 fire the Moments. Right-click any knob, switch or selector for MIDI learn.
- **Looper, Sync to host** (on by default, saved with the project): while the host plays at a known tempo, the first layer rounds to whole bars, recording and playback start on the next bar line, and layers stay locked to the host's bars, following tempo changes, jumps and loop wraps. With the host stopped or giving no tempo, or the box off, the looper runs free like the web app.
- **Your sound in:** *Track input* runs the audio coming into the plugin on its track (route a mic, a line or another track to it in your DAW) through the spring, body, hall, harmonizer and Aura. *File* plays an audio file through it instead.
- **Keys** are off by default so the host (FL Studio and others) keeps Space, letters and digits. Turn them on in the menu (*Computer keyboard*, saved with the project); they then work while the plugin window has keyboard focus: 1–9 voices, Z…/ and Q…P notes, [ ] octave, Space looper, F1–F12 moments, H Hold, F Freeze, Esc Silence, Ctrl+Z / Ctrl+Y undo and redo, Shift+R save the last minute.
- **Saved with the project:** every setting, the selected voice, your own moments and your MIDI map. Starred presets are kept for your user account.

## What differs from the web page

The layout, controls and engine are the same. A few things that belong to the browser work the way a plugin needs:

- There is no *Start audio* / *Audio on* item and no *Wake the board*: the DAW runs the audio.
- *Mic / line* is *Track input*: the plugin takes its sound from its track.
- *Save the last minute* writes a 32-bit WAV of the plugin's last 60 seconds of output. The web page also writes a `.horror.json` performance file for re-rendering stems in the browser; the plugin does not.
- The hidden *R* recorder of the full page is left out: record in your DAW.
- *Copy share link* copies a link to the web app ([snazzygaz.github.io/horror-engine](https://snazzygaz.github.io/horror-engine/)) that opens with these settings.

## Building

See `BUILDING.md`. Windows builds use MSVC in GitHub Actions (the installed Visual Studio, selected by CMake), or MinGW-w64 when cross-compiled on Linux. Both use a small JUCE message-box patch (`patches/juce-8.0.15-taskdialog.patch`) to avoid a static import of `TaskDialogIndirect`, and link the C/C++ runtime statically. MinGW also needs `patches/juce-8.0.15-mingw.patch` for compiler compatibility. CMake fetches and patches its pinned dependencies automatically; if supplying a local `JUCE_DIR`, apply the relevant patches yourself first.

## Changes in 1.0.14

- **MIDI expression.** Pitch bend (±2 semitones), channel aftertouch and the mod wheel now shape held notes, and the sustain pedal holds them. The wheel and aftertouch take over from velocity only once moved while a note is held, so a wheel left up does not flatten every new phrase.
- **Chords.** E-bow plays up to 2 MIDI notes at once, Bowed and Glass up to 3. A chord recorded into the looper replays as a chord, and letting go of one note keeps the others sounding. Record moment folds a chord onto one line per voice (newest note leads), so a moment keeps sounding until the last note is let go. Moment files are unchanged.
- **High sample rates.** Filters, smoothing and the limiter now behave the same at 88.2 and 96 kHz as at 48 kHz. At 48 kHz the sound is identical to 1.0.13.
- **Stability.** Safer loading of saved projects, no locking on the audio thread, MIDI CC 120 (All Sound Off) releases notes, and fixes for rare crashes in Struck and Moan.
- **Automation.** The board's position and pressure can be automated from the host.

## Changes in 1.0.13

- **The planchette now sits with the point facing up.** Gaz's drawing is rotated 180° once when the editor loads (a rotation, not a mirror, so the symbol stays exactly as drawn). The window, now near the top, is re-derived from the rotated alpha and still sits on the letter under the hand. The drop shadow is baked downward from the rotated body so the light stays from above; it is not rotated with the art. The 1.0.12 cache behaviour is unchanged: the rotation happens at load, never per frame. The glass lens, ember glow, opaque body and board hit area are unchanged. The sound is unchanged.

## Changes in 1.0.12

- **Dragging on the board no longer locks up the editor.** In 1.0.11, clicking or dragging rebuilt the planchette's Lanczos-3 cache whenever the 6% pressure pulse changed the integer size — about 200 ms of work, which froze the UI until you let go. The cache now rebuilds only when the window or display scale changes. While you play, the already-cached sprite is blitted 1:1, and pressure only drives the glow. The glass lens draws a cropped patch of the board under the window, not the whole image.
- **The plugin now uses Gaz's hand-drawn small planchette** (`plugin/art/celestial_plugin.png`, 100×143). The window centre and tip are taken from the PNG's alpha (the see-through hole, including the drawn glass highlight), so the window still sits on the letter. The art is Lanczos-resampled once to the exact on-screen size (about 80 px wide at FL Studio's minimum window) and blitted 1:1, with no per-frame scaling. The Dread ember is a soft tint of the cream linework, with no hard threshold. The symbol is kept exactly as drawn. The sound is unchanged.

## Changes in 1.0.11

- **The celestial planchette's linework is now clean at any editor scale.** In 1.0.10 the ornament broke into speckled orange dots at typical window sizes, because a large raster was downscaled at draw time and the ember glow used a noisy pre-coloured mask. The plugin now resamples Gaz's SVG art with Lanczos-3 to the exact on-screen pixel size (including the display/OpenGL scale factor), blits it 1:1, and tints the clean cream linework for the Dread ember (a soft multiply, no threshold). At rest the body is opaque black with clearly visible cream linework, matching the web board. The glass lens is unchanged. The sound is unchanged.

## Changes in 1.0.10

- **The celestial planchette now matches the web board.** In 1.0.9 the black body could look transparent (the board and letters showed through, especially at rest) and the play/Dread glow bloomed out of the window onto the board. The body is now painted opaque, and the glow stays in the glass lens and on the rim and linework. The sound is unchanged.

## Changes in 1.0.9

- **New celestial planchette.** The board now uses Gaz's drawn teardrop (the lattice symbol in the astrolabe ring, with a glass window at the tip) at 70% of the first preview size, the same scale as the web Séance board. The window still sits on the letter. While you play, the rim and linework glow; at high Dread the ornament goes ember and the black body stays dark. The glass lens slightly magnifies the letter underneath. Cached sprites and dirty rects cover the new shape; the art is not rescaled every frame. The sound is unchanged.

## Changes in 1.0.8

- **The editor now draws on the GPU in FL Studio.** 1.0.7 asked JUCE for an OpenGL context, but JUCE 8's plugin window uses a Direct2D/DXGI swap chain, and a child WGL window of that HWND never received a hardware pixel format — so the NVIDIA driver never loaded and drawing stayed on the CPU. The plugin now switches that window to GDI just before creating the context. If a context still cannot be created, it falls back to software automatically. Each time the editor opens, it writes `%APPDATA%\HorrorEngine\seance.log` with `GL_VENDOR` / `GL_RENDERER` / `GL_VERSION`, or `software` and the reason. The sound is unchanged.
- To force software, set `HE_SEANCE_OPENGL=0`, or put `opengl=0` in `%APPDATA%\HorrorEngine\HorrorEngine.ini`.

## Changes in 1.0.7

- **The editor is smoother and uses less CPU**, especially at high Dread and when the host scales the window. The board was software-rasterizing every letter's glow, the planchette halo and a couple of full-board gradients at 60 Hz, which could take more than one CPU core and drop frames in FL Studio. Letter shapes and glow sprites are now cached and only their brightness changes each frame, the planchette uses a pre-baked shadow and halo, unchanged frames are skipped, and the UI follows the display refresh (or 30 Hz if that is not available). The look is the same as 1.0.6; the sound is unchanged.
- **OpenGL is used for the editor when it can be**, which takes the final blit off the CPU. If the host cannot create a context, it falls back to software automatically. To force software, set the environment variable `HE_SEANCE_OPENGL=0`, or put `opengl=0` in `%APPDATA%\HorrorEngine\HorrorEngine.ini`.

## Changes in 1.0.6

- **High Dread now darkens the board**, the way it already does on the 3D machine. As Dread rises, a vignette closes in and the letters, numbers, Yes, No and Goodbye glow ember-red, with a slight flicker that follows the output level (starved when quiet). At full Dread mostly only the letters and the planchette's glass stay lit. Dread 0 is unchanged. Visual only: the engine and the sound are untouched.

## Changes in 1.0.5


- **Superball no longer leaves a hanging background tone.** Superball (Moan) is mixed as a stereo voice but only wrote the left work buffer, so a leftover 128-sample right buffer was replayed every block as a constant tone at the block rate (sample rate / 128, and its harmonics) — 344.5 Hz at 44.1 kHz, 375 Hz at 48 kHz — until GOODBYE or another stereo voice overwrote it. Superball now writes both sides equally, and both work buffers are cleared before each voice is rendered, so a stale block cannot leak through.
- New engine test `mono_voice_clear_test` (in CI): after Superball lifts off, no block-rate energy remains at 44.1, 48 and 96 kHz.

## Changes in 1.0.4

- **Drags pull smoothly at any buffer size.** The board now sends gliding moves: each move walks the hand to its new spot over about 1.5 times the usual gap between moves (one block to 120 ms) instead of jumping there and stopping. Your mouse moves reach the engine in clumps (one per screen frame, all applied at the start of each host buffer), so before this the hand speed that Bowed and Glass hear pulsed at the frame or buffer rate, which sounded steppy. Hand-speed ripple at 512- and 1024-sample buffers drops from 0.12-0.29 to 0.03-0.08 (a hand sampled every block measures about 0.01).
- **Slow skating keeps the glass in touch.** A slow mouse only reports a move when it reaches a new pixel, sometimes five frames apart, so the glass kept letting go (about 40% of the time at 10 px/s). Glides hold the hand's speed across those gaps (about 6%).
- The short, irregular bursts you still hear when skating slowly with the nail are the glass's stick-slip (3-8 slips a second at slow speeds), not the input. Wetness smooths them out.
- Recorded moments, loop layers and performance files keep glides as glides. Old ones (plain moves) play exactly as before, and preset renders are bit-identical to the web app.
- New engine test `drag_test` (in CI): bursty moves fed as 256-, 512- and 1024-sample buffers at 44.1 and 48 kHz on Bowed and Glass, plus a slow skate.

## Changes in 1.0.3

- **GOODBYE is a hard stop.** GOODBYE and Esc now silence everything at once: every voice (Aura's Hold and Freeze included), moments and custom moments, looper playback, your sound in, and the hall, spring, body and harmonizer tails. The output fades over 25 ms (no click), then stays at true silence until you play again.
- Hold on every voice (Aura too) and Freeze are switched off, so nothing starts again by itself. The next note or touch plays normally. Notes, knob moves and moments sent during the 25 ms fade wait for it and then play.
- **The looper keeps its layers, muted** (their Mute buttons light). A take being recorded is dropped. Unmute a layer, or start a new take, to carry on. Nothing is deleted.
- New engine test `goodbye_test` (in CI): below -90 dBFS within 50 ms with Aura holding, Freeze on, a ghost layer playing and a 30 s hall, at 44.1, 48 and 96 kHz; no click; untouched output up to the press. Everything sounds exactly as in 1.0.2 until GOODBYE is pressed.

## Changes in 1.0.2

- **Loads on real Windows.** 1.0.0 and 1.0.1 failed to load in FL Studio with "Entry Point Not Found: TaskDialogIndirect". The DLLs imported a function that only exists in Common Controls v6 but had no manifest asking for v6. The VST3 and CLAP now carry a Common Controls v6 manifest, and the message box looks that function up at run time (falling back to a plain message box), so the plugin no longer depends on it to load.
- The CLAP now has the same Windows file-version info as the VST3 (MSVC and MinGW).
- The Windows CI builds with the installed Visual Studio on `windows-latest`; both MSVC and MinGW avoid a static `TaskDialogIndirect` import and statically link the C/C++ runtime.

## Changes in 1.0.1

- Looper **Sync to host** (on by default): bar-rounded first layer, bar-aligned start, locked to the host's tempo, position, jumps and loops; free-running when the host is stopped.
- The **computer keyboard is off by default**, so FL Studio and other hosts keep Space and letter keys; turn it on in the menu.
- MIDI CC 20–23 and learned CCs no longer flicker between the CC value and the old parameter value.
- No crash above 124 kHz (the limiter's lookahead overran its buffer; found by clap-validator) and no blow-up below 5.8 kHz (the body's band-pass sat past Nyquist).
- 44.1 and 96 kHz now sound the same as the web app at those rates (the sample rate was applied after the voices were built).
- Fewer allocations on the audio thread (`NOTES-realtime.md`); JUCE 8.0.15 and clap-juce-extensions pinned in CMake; full third-party licence texts in `THIRD_PARTY_NOTICES.txt`; Windows CI workflow.

## Credits and notices

- Horror Engine (the instruments, the engine, the Séance layout) © 2026 Garyck Arntzen.
- The bowed-string friction curve follows the bow-table idea published in STK by Perry R. Cook and Gary P. Scavone.
- Source: [github.com/SnazzyGaz/horror-engine](https://github.com/SnazzyGaz/horror-engine) (AGPLv3); the plugin's complete source is also in the source zip that comes with it.
- [JUCE](https://juce.com) 8.0.15 (AGPLv3), [clap-juce-extensions](https://github.com/free-audio/clap-juce-extensions), the [CLAP](https://github.com/free-audio/clap) SDK and clap-helpers (MIT), the VST3 SDK bundled with JUCE (MIT), and from JUCE: FLAC and Ogg Vorbis (BSD), libpng, the IJG jpeg library, zlib, HarfBuzz (MIT) and SheenBidi (Apache 2.0). MinGW builds also link the mingw-w64 runtime, winpthreads and the GCC runtime statically. Full licence texts: `THIRD_PARTY_NOTICES.txt` (regenerate with `tools/make_notices.py`).
- Fonts: IM FELL English SC (Igino Marini), Crimson Pro (The Crimson Pro Project Authors), IBM Plex Mono (IBM), all under the SIL Open Font License 1.1 (`OFL.txt`). Crimson Pro is embedded as static instances (Regular, Medium, SemiBold, Italic) of its variable font.
- VST is a registered trademark of Steinberg Media Technologies GmbH.
