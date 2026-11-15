![The Horror Engine's Altar skin in a candle-lit crypt](docs/media/hero.jpg)

# Horror Engine

A playable machine for horror sound: nine physical models on one resonant box, with no samples.

**[Play it in your browser](https://snazzygaz.github.io/horror-engine/)**

This branch is the **Séance** layout of the same engine: the spirit board, not the 3D machine. Build it with `python3 build.py --seance`. The live site is built from `main`.

It is a software take on the idea of the [Apprehension Engine](https://apprehensionengine.com/) (Mark Korven and Tony Duggan-Smith). It is not affiliated with them, and uses none of their recordings or images.

## Play

The page opens on **the Surface**, a gesture pad for the selected voice, so you can play at once. **The Machine** is a 3D view of the same instrument (Workshop or Altar skins; only the look changes). Drag with the mouse or a pen; Shift is a harder touch, Alt a softer one.

- **1–9** select a voice. **Z…/** and **Q…P** play notes. **H** holds, **F** freezes the Aura, **Space** starts or closes a loop, **Esc** silences everything (GOODBYE).
- **Dread**, **Distance**, **Material** and **Pitch** are the four macros. **F1–F5** fire the built-in Moments.
- **R** records a WAV (and stems, if Stems is on). MIDI notes play the selected voice; CC 20–23 move the macros, once audio has started.

The full voices, knobs, keys, looper and recording notes are in the [instrument guide](docs/INSTRUMENTS.md) and [FX and looper](docs/FX_AND_LOOPER.md).

Use a current desktop **Chrome** or **Edge** (Firefox should work; Safari is untested). The Machine needs WebGL; the audio needs Web Audio. Headphones or decent speakers help: a lot of this lives below 60 Hz. Everything runs in your browser, with no account. A [Release](https://github.com/SnazzyGaz/horror-engine/releases) zip also works offline: unzip, open `index.html`, press **Start audio**.

## Séance VST / CLAP plugin (Windows)

**Horror Engine · Séance** is the same engine as a VST3 and CLAP instrument: the spirit-board Surface, the nine voices, macros, Moments and a looper that can sync to the host's tempo and bars. There is no 3D machine. Every knob is a host parameter.

**Download** the [plugin-v1.0.6](https://github.com/SnazzyGaz/horror-engine/releases/tag/plugin-v1.0.6) release. Use **`HorrorEngine-Seance-1.0.6-Windows-MinGW.zip`** (recommended: this is the build already used in FL Studio). The `…-Windows-MSVC.zip` is the GitHub Actions build; it passed automated validation but has not yet been load-tested in a DAW.

### Install

1. Unzip the folder.
2. Copy the `Horror Engine.vst3` folder to `C:\Program Files\Common Files\VST3\`.
3. Optionally copy `Horror Engine.clap` to `C:\Program Files\Common Files\CLAP\` (create that folder if needed). FL Studio supports CLAP from 2024.1.

Then, in **FL Studio**:

1. **Options > Manage plugins** (also under **Options > File settings**).
2. Turn on **Verify plugins** and **Rescan previously verified plugins**, then click **Find installed plugins**.
3. Add it from the Browser under **Plugin database > Installed > Generators > New**, or from the Channel Rack **+** button / **Add** menu (use **More plugins…** if it is not in the list yet). It is a generator (instrument), not an effect.

In other DAWs, rescan plugins and add it as an instrument on a MIDI track.

### First steps

Play from the piano roll or a MIDI keyboard, or drag on the board. YES / NO / GOODBYE are on the board (GOODBYE, or Esc, is a hard stop). The looper can follow the host's tempo when **Sync to host** is on (it is, by default). Computer-keyboard shortcuts are off until you turn them on in the plugin menu, so FL Studio keeps Space and the letter keys.

### Uninstall

Delete the copied `Horror Engine.vst3` folder and, if you installed it, `Horror Engine.clap`, then rescan (or remove the entry from FL Studio's Plugin database). That does not remove your projects or starred presets.

**Limits.** Windows only (64-bit). Tested in FL Studio. Other DAWs should work after a rescan, but have not been load-tested yet. Source is on the [`vst-plugin`](https://github.com/SnazzyGaz/horror-engine/tree/vst-plugin) branch. The plugin is AGPLv3; see the [plugin README](https://github.com/SnazzyGaz/horror-engine/blob/vst-plugin/plugin/README.md).

## Licence and credits

The web app is by **Garyck Arntzen** ([@_mintydoge](https://x.com/_mintydoge)), [MIT licence](LICENSE). The Séance plugin is [AGPLv3](https://github.com/SnazzyGaz/horror-engine/blob/vst-plugin/plugin/LICENSE).

The beam-mounted goat skull on the Altar skin is ["Goat Skull"](https://sketchfab.com/3d-models/goat-skull-99b738abd7d34b27a38b363900856043) by [Bohnen](https://sketchfab.com/BOHNEN), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

Textures, fonts, three.js and other third-party notices are in [CREDITS.md](CREDITS.md). What changed is in the [changelog](https://github.com/SnazzyGaz/horror-engine/blob/main/CHANGELOG.md). How to build, test and run it from source is in [docs/DEVELOPING.md](docs/DEVELOPING.md).
