# Developing Horror Engine

The live site at [snazzygaz.github.io/horror-engine](https://snazzygaz.github.io/horror-engine/) is built from `src/` on every push to `main`. This page covers building, testing and the two site shapes. The instrument itself is described in the [README](../README.md) and the [instrument guide](INSTRUMENTS.md).

## Build

It is a single HTML page that uses three.js for the Machine and Web Audio for the sound. Edit the files in `src/` and rebuild:

```
python3 build.py    # needs Pillow: pip install pillow
```

That writes an inlined `index.html` for `file://` and GitHub Releases (zipped with `LICENSE`, `CREDITS.md` and `vendor/`). If your browser is strict about local files, serve the folder:

```
python3 -m http.server 8000
# then open http://localhost:8000/
```

The hosted (Pages) build keeps the same look and models but loads textures as files, and fetches the Altar crypt assets only when that skin is chosen:

```
python3 build.py --hosted DEST    # needs Pillow and the markdown package
```

Pushing a tag `v1.*` (for example `v1.2.2`) attaches the inlined build to a GitHub Release. Plugin tags use the `plugin-v*` form and do not trigger that web-app release.

The Séance layout (no 3D machine) is `python3 build.py --seance`, on the [`seance-ui`](https://github.com/SnazzyGaz/horror-engine/tree/seance-ui) branch. The VST/CLAP plugin is built from the [`vst-plugin`](https://github.com/SnazzyGaz/horror-engine/tree/vst-plugin) branch; see [plugin/BUILDING.md](https://github.com/SnazzyGaz/horror-engine/blob/vst-plugin/plugin/BUILDING.md) there.

How the engine, files and skins are put together is in [UNDER_THE_HOOD.md](UNDER_THE_HOOD.md).

## Tests

The engine and file I/O run in Node, with no browser or GPU, from the repo root:

```
node test/engine.js
node test/moments.js
node test/offsets.js
node test/v14.js
node test/glide.js
node test/goodbye.js
node test/mono_voice_clear.js
```

`test/moments-dom.js` and `test/v14-dom.js` check the UI in a fake DOM (`npm install jsdom@24` first). All of them run on every push and pull request.

## Browsers and quality

Use a current desktop Chrome or Edge. Firefox should work. Safari has not been tested. The Machine needs WebGL (WebGL 2 for the full lighting). If AudioWorklet is missing, the engine falls back to the main thread ("compatibility mode"), with more latency.

The **High detail / Low detail** button above the Machine toggles shadows, texture size and render resolution (it reloads the view). You can also add `?quality=low` or `?quality=high` to the address. Use Low on laptops with integrated graphics. The audio is the same either way. The Surface tab skips the 3D view entirely.

## Changelog

See [CHANGELOG.md](../CHANGELOG.md).
