# Changelog

All notable changes to the Horror Engine web app are listed here. Plugin releases are tagged `plugin-v*` on the `vst-plugin` branch and described in [plugin/README.md](https://github.com/SnazzyGaz/horror-engine/blob/vst-plugin/plugin/README.md) on that branch.

## 1.2.1 — 15 November 2026

- **GOODBYE** (and Esc) is a hard stop. The mix and every stem fade out over 25 ms (a raised cosine, so no click), then everything is cleared: every voice (Aura Hold and Freeze too), Moments and custom Moments, the looper's playback, your sound in, and the hall, spring, body and harmonizer tails. From then the output is true zero until something is played again. The looper keeps its layers, muted (their Mute buttons light); a take being recorded is dropped. Messages that arrive during the fade wait and are applied, in order, as soon as it is over. The UI's panic now also clears Aura's Hold.
- **Superball** (Moan) writes both left and right. Each voice's work buffers are cleared at the start of a block, so Superball no longer leaves a hanging mid-range tone (a 128-sample loop, 344 Hz at 44.1 kHz) on the right after you lift off.
- **Surface drags** send gliding moves (`n`) so the bow and glass hear a steady hand speed however the moves arrive (browser frames, slow frames, audio callbacks). Glides hold the hand's speed across gaps of up to 120 ms, so a slow skate stays in touch between pointer updates. Performance files record those glides (`glide: true` on a move).
- The **Séance** VST3 and CLAP plugin for Windows is available on the [`vst-plugin`](https://github.com/SnazzyGaz/horror-engine/tree/vst-plugin) branch and as [plugin-v1.0.5](https://github.com/SnazzyGaz/horror-engine/releases/tag/plugin-v1.0.5).

Tests: `test/goodbye.js`, `test/glide.js`, `test/mono_voice_clear.js`, at 44.1, 48 and (where it applies) 96 kHz.

## 1.2.0

Surface-first loading, your own Moments, Tune & place, last minute, undo, MIDI learn, share links, Bowed Cymbal and your sound in. See the [1.2.0 docs commit](https://github.com/SnazzyGaz/horror-engine/commit/40dc75bfa40e8adf772a4fb5766f58a6d3e00869).
