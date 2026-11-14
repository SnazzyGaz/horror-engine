![The Horror Engine's Altar skin in a candle-lit crypt: a blood-stained wooden altar with rusted rail spikes, a ribcage harp, a hide drum, a skull bowl, a bone-spoked wheel, an iron plate under a goat skull, and a carved pentagram glowing on the front](docs/media/hero.jpg)

# Horror Engine

A playable machine for horror sound that runs in your browser: nine physical models bolted to one wooden box, with no samples.

[Play it in your browser](https://snazzygaz.github.io/horror-engine/) · [Run it locally](#running-it) · [Watch the intro (MP4, 64 s)](docs/media/intro_720p.mp4) · [Instrument guide](docs/INSTRUMENTS.md)

## What it is

Horror Engine is a single-page instrument for scoring slow dread. You play it with the mouse, a pen, the computer keyboard or MIDI, and you can play it two ways. In **The Machine**, a 3D view of the instrument, you bow, scrape, strike and crank each part. It has two skins, Workshop and Altar, that share every voice; only the look changes (see [Skins](#skins)). **The Surface** is a flat gesture pad for the selected voice; the page opens on it so you can play at once while the Machine loads behind it. Each sound is synthesised live from a model of a real object: a slack string, a rosined wheel, steel rulers, glass, springs, a tray of bolts.

It owes its idea to the [Apprehension Engine](https://apprehensionengine.com/), the acoustic horror instrument conceived by composer Mark Korven and luthier Tony Duggan-Smith and built by Duggan-Smith. This project is not affiliated with either of them, and it uses none of their recordings or images. It is a separate, software take on the same idea: odd objects on a resonant box, played by hand.

## The instruments

| Object | How you play it | What it sounds like |
|---|---|---|
| I. E-bow string | Run the e-bow puck along the slack string; tap the string to strike it and drag the slide bar | Endless sustain that flips between harmonics; with a strike, a long beam boom you can bend |
| II. Hurdy-gurdy | Circle the crank; drag along the drone strings for melody | A rosined drone bed; jerk the crank and the dog buzz rattles in |
| III. Bowed metal | Stroke across a ruler, rod, saw or clock spring | Stick-slip whoops and groans that jump between modes as you change pressure |
| IV. Glass | Nail or chalk on the pane and slate, a wet finger round the wine glass or bottle | From a pure singing rim to a judder that sets your teeth on edge |
| V. Struck metal | Tap a ruler, rod, saw or coil; knock the wood, drumhead or thunder sheet | Ruler twangs, rod pings, bells and knocks, up to 12 at once |
| VI. Spring tank | Tap, drag along it to scrape, shake it up and down; Alt to e-bow it | Echoes that drip downward, highs first, lows last |
| VII. Junk tray | Open the drawer, drag the magnet over the nuts and bolts | Rattles, ticks and skitters |
| VIII. Aura | Rub the lamp; double-click it to freeze | A granular pad made from the machine's own last few seconds |
| IX. Superball | Lift a ball off its wand and drag it over the drumhead, the thunder sheet, the rods or the box | Moans and whale calls that rise as you press |

Every part is bolted to one wooden body heard through a contact mic, so a knock on the wood rings everything a little. [docs/INSTRUMENTS.md](docs/INSTRUMENTS.md) covers each voice in full: what it is, how to play it, every knob and how to use it in a score.

<img src="docs/media/still_wheel.jpg" width="49%" alt="The hurdy-gurdy wheel and its crank on the right of the cabinet, with the drumhead and the wine glass behind"> <img src="docs/media/still_ruler.jpg" width="49%" alt="Four steel rulers hanging over the front edge of the cabinet below the slate, the brass sunburst inlay underneath">
<img src="docs/media/still_glass.jpg" width="49%" alt="The wine glass under its brass tap, a dark bottle, the glass pane and the drumhead in the middle of the cabinet"> <img src="docs/media/still_fx_panel.jpg" width="49%" alt="The brass FX panel on the mast: a blue-green display reading -12st, a Send slider, six knobs (Shift, Detune, Feedback, Return, Aura, Hall) and the Freeze and Loop buttons">

## Skins

The Machine has two skins. They share every hit zone, gesture and voice; only the look changes. Switch with the **Skin** button above the view, or add `?skin=altar` (or `?skin=workshop`) to the address.

![Workshop skin: the Horror Engine in a dark brick cellar, a walnut cabinet with waterphone rods, a wine glass, a hurdy-gurdy wheel and two superball wands, the brass FX panel on a mast above it, one blue window high on the right](docs/media/workshop.jpg)

| Workshop | Altar |
|---|---|
| Slack string, e-bow, slide bar | Ribcage harp strung with gut, lodestone, knuckle slide |
| Waterphone rods in a water tray | Rusted rail spikes in a tray of blood |
| Hurdy-gurdy wheel and crank | A wheel cranked through a skull on a spike, with two drone guts the wheel bows |
| Wine glass and tap | Cracked skull bowl and a bleeding spout |
| Glass pane, slate, bottle | Black mirror, grave slate, bottle |
| Steel rulers and clamp, bow saw, clock spring | Rusted blades under an iron strap, bone saw, iron serpent |
| Drumhead | Stitched hide drumhead |
| Thunder sheet | Iron plate under a beam-mounted goat skull |
| Spring tank | Rusty coils beside hanging entrails |
| Junk drawer and magnet | Drawer of bones and teeth, stirred by a claw |
| Superballs | Eyes on stalks |
| Lamp (Aura) | The altar candle |
| Brass FX panel, body sunburst | Bone dials and a carved pentagram that glows with the Body voice |

The Altar is built in code like the rest (`src/sculpt.js`, `src/altar.js`). Most of the bones and the blood are distance fields and procedural work meshed at load; the human skulls and the beam-mounted goat skull are packed scans (see [CREDITS.md](CREDITS.md)).

## The FX panel

The FX panel holds the effects that sit after the instruments:

- **SEND**, a slider: how much of the selected voice goes into the harmonizer.
- **SHIFT**, **DETUNE**, **FEEDBACK** and **RETURN**: the harmonizer. It is an octave down by default, split into two voices detuned left and right, with feedback that stacks the shift into a falling spiral.
- **AURA**: the level of the Aura pad.
- **HALL**: the decay of the large reverb.
- **FREEZE** pins the aura pad. **LOOP** records a gesture loop (Space does the same).

The looper records what your hand did, not audio, so every pass is played again by the models, and a layer handed to a Ghost keeps improvising with your strokes. The whole session can be recorded out as WAV files (see [Getting sound out](#getting-sound-out)). See [docs/FX_AND_LOOPER.md](docs/FX_AND_LOOPER.md) for the looper, stems and recording, and [docs/RECIPES.md](docs/RECIPES.md) for step-by-step patches.

![The full app: the 3D machine in the centre, voices along the bottom, macros and moments on the right](docs/media/app_machine.jpg)

## Running it

Horror Engine is one HTML page (with `vendor/three.min.js` beside it). It needs no install and no server.

**Double-click build.** Download the zip from [Releases](https://github.com/SnazzyGaz/horror-engine/releases). It contains `index.html`, `vendor/`, `LICENSE` and `CREDITS.md`. Unzip it, open `index.html` in a desktop browser (it works from `file://`), press **Start audio**, then drag a part of the machine.

The `index.html` at the root of this repository is a snapshot kept so existing clones and the current GitHub Pages site keep working. It is **no longer updated** when the source changes. Until the first tagged release, use that snapshot or rebuild from source. After that, get the current double-click build from Releases, or rebuild:

```
python3 build.py    # needs Pillow: pip install pillow
```

If your browser is strict about local files, serve the folder instead:

```
python3 -m http.server 8000
# then open http://localhost:8000/
```

The live site at [snazzygaz.github.io/horror-engine](https://snazzygaz.github.io/horror-engine/) is built from `src/` on every push to `main` by a GitHub Action and deployed to GitHub Pages. That hosted build loads each skin's textures and models as separate, cacheable files, and fetches the Altar crypt assets only when the Altar skin is chosen (the Workshop skin never downloads them). Docs are on the same site: the [README](README.html), [instrument guide](docs/INSTRUMENTS.html), [FX and looper](docs/FX_AND_LOOPER.html), [recipes](docs/RECIPES.html) and [how it is built](docs/UNDER_THE_HOOD.html). Pushing a tag `v*` attaches the single-file (inlined) build, zipped with `LICENSE`, `CREDITS.md` and `vendor/`, to a GitHub Release, for opening from disk.

**Tests.** The engine and file I/O run in Node, with no browser or GPU. From the repo root:

```
node test/engine.js
node test/moments.js
node test/offsets.js
node test/v14.js
```

That checks that performance files load, presets round-trip, an offline render is deterministic, finite and limited, custom Moments and the per-voice offsets replay exactly, and the 1.4 file features (last minute, audio input, Bowed Cymbal) behave. `test/moments-dom.js` and `test/v14-dom.js` check the UI in a fake DOM (`npm install jsdom@24` first). All of them run on every push and pull request.

**Browsers.** Use a current desktop Chrome or Edge. Firefox should work. Safari has not been tested. The machine needs WebGL (WebGL 2 for the full lighting), and the audio needs Web Audio with AudioWorklet. If AudioWorklet is missing, the engine falls back to the main thread ("compatibility mode"), with more latency. Use headphones or decent speakers: a lot of this lives below 60 Hz.

**Quality.** The **High detail / Low detail** button above the machine toggles shadows, texture size and render resolution (it reloads the view). You can also add `?quality=low` or `?quality=high` to the address. Use Low on laptops with integrated graphics. The audio is the same either way. **The Surface** tab skips the 3D view entirely.

![The Surface: a dark gesture pad with a brass sunburst, a waveform and a fading bow trail](docs/media/app_surface.jpg)

**Keys.** These are the essentials. The full list, including knob and camera keys, is in [docs/INSTRUMENTS.md](docs/INSTRUMENTS.md#keys).

| Keys | What it does |
|---|---|
| `1`–`9` | Select a voice |
| `Z`…`/`, `Q`…`P` | Play notes on the selected voice |
| `Shift` / `Alt` | Hard / soft touch |
| `Space` | Start or close a gesture loop |
| `F1`–`F5` | Moments: Riser, Stinger, Drone bed, Heartbeat, In the walls |
| `F6`–`F12` | Your saved Moments in panel order; press again to stop (browser may reserve F11/F12) |
| `H` / `F` | Hold the voice / freeze the Aura |
| `R` | Record |
| `Shift+R` | Save what I just played (the last minute) |
| `Ctrl+Z` / `Ctrl+Y` | Undo / redo |
| `Esc` | Silence everything |

## Your own Moments

Press **Record moment**, play on any voice and move knobs or macros, then press it again. Name it in the inline field and **Save**. It becomes a new button after the built-in five, starting at **F6**. Leading silence is trimmed; it captures gestures and automation, not audio. Each press performs the phrase once through the models, with a little variation in timing, position, pressure and automation depth. Press again to stop it.

The **…** menu lets you rename, change voice, delete, export a `.horror-moment.json` file or move a Moment earlier. **Import** brings one back. Your Moments persist in this browser, travel inside saved presets and performances, and replay with **Render…**. Export a copy before clearing browser data. Works in the Machine and Surface, with either skin.

Continuous knob moves are **relative**, in knob travel: a Dread sweep from 20% to 60% adds about 40% to today's Dread. Switches and choices are **absolute**. Your live knobs stay where you put them; any moves during playback update the base, and automation releases back to that base when it ends. [Details and MIDI mapping](docs/INSTRUMENTS.md#your-own-moments).

## Tune & place

Each voice has a **Tune & place** row under its panel: **Tune** (semitones), **Fine** (cents), and **Material** and **Distance** offsets. They add on top of the four Macros, so you can drop just the springs a fifth or sit only the junk further down the corridor, and the macros still move the whole machine. A brass dot appears on a voice that isn't at zero. **Reset** on that panel clears that voice; **Defaults** under the voice list clears every voice (click **Sure?** to confirm; **Undo** then appears for a few seconds). Offsets save in presets, performances and this browser; a Moment plays on the instrument it recorded, using that instrument's current offsets. Older `.horror.json` files still load.

## Save, undo, MIDI learn, share, your sound

- **Save what I just played** (`Shift+R` or **Last min**): the last minute is always kept, so a happy accident is never lost. You get a zip with the WAV and its performance file.
- **Undo / redo** (`Ctrl+Z` / `Ctrl+Y`, or the toolbar arrows) for knobs, presets, Defaults, the Tune & place offsets and the looper.
- **MIDI learn**: right-click (or long-press) any knob, choose **MIDI learn…** and move a controller. A green dot marks a mapped knob. MPE is not supported.
- **Share links**: **Link** copies an address that rebuilds your exact settings.
- **Bowed Cymbal**: a new Object for Bowed Metal, with its own preset.
- **Your sound in** (Hall & Master strip): run a mic, a line input or an audio file through the spring tank, the body, the hall, the harmonizer and the Aura.

The details are in [docs/INSTRUMENTS.md](docs/INSTRUMENTS.md#saving-undo-and-sharing).

## Getting sound out

There is no plugin. Two ways that work:

1. **Record out.** Press **Record** (or `R`), play, then press it again. You get a zip with the mix as a WAV. With **Stems** on, you also get one WAV per voice that made a sound, plus the hall, reverse-swell, harmonizer and body returns. Drop them on your timeline at the same start point.
   - Every stem starts on the same sample as the mix and is the same length.
   - Stems are taken before the final limiter. When the limiter is idle, they add up to the mix to within rounding (about −120 dBFS). When a take hits the limiter, their sum is slightly louder than the mix.
   - Every take also includes a `.horror.json` performance file. **Render…** plays it back through the engine offline and writes the WAVs again.
2. **Loopback.** Route the browser's output into your DAW with a loopback device and record it live against picture. Use BlackHole on macOS, VB-Cable or VoiceMeeter on Windows, or PipeWire or JACK on Linux.

MIDI notes and CC 20–23 (Dread, Distance, Material, Pitch) work in browsers that support Web MIDI, once audio is started. Channel 16 is reserved for Moments: notes 36–40 fire the built-in five, 41 onwards your own. CC 24–43 on any channel fire Moments 1–20 on a rise past 64. Notes on channels 1–15 play the selected voice. A MIDI or VST version may come later. The recording details are in [docs/FX_AND_LOOPER.md](docs/FX_AND_LOOPER.md#recording-out).

## How it's built

It is a single HTML page that uses three.js for the machine and Web Audio for the sound. Edit the files in `src/` and run `python3 build.py` (needs Pillow) to rebuild the inlined `index.html` used for `file://` and Releases. Do not commit that rebuilt `index.html`. The live site is a second, hosted build (`python3 build.py --hosted DEST`, needs Pillow and the `markdown` package) that keeps the same look and models but loads textures as files, and loads Altar assets only for the Altar skin. GitHub Actions runs the hosted build for Pages and the inlined build for Releases. See [docs/UNDER_THE_HOOD.md](docs/UNDER_THE_HOOD.md).

## Credits and licence

Horror Engine by Garyck Arntzen ([@_mintydoge](https://x.com/_mintydoge)). MIT licence; see [LICENSE](LICENSE).

- The surface textures are CC0 scans from Poly Haven and ambientCG, listed in [CREDITS.md](CREDITS.md).
- The beam-mounted goat skull on the Altar skin is "Goat Skull" by [Bohnen](https://sketchfab.com/BOHNEN), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) ([Sketchfab](https://sketchfab.com/3d-models/goat-skull-99b738abd7d34b27a38b363900856043)).
- three.js r160 is © the three.js authors under the MIT licence ([vendor/three.LICENSE](vendor/three.LICENSE)).
- The bowed-string friction curve follows the bow-table idea published in STK by Perry R. Cook and Gary P. Scavone. The spring tank's dispersion follows the model by Välimäki, Parker and Abel (2010).
- Inspired by the Apprehension Engine by Mark Korven and Tony Duggan-Smith; not affiliated.

Curious how it works? See [docs/UNDER_THE_HOOD.md](docs/UNDER_THE_HOOD.md).
