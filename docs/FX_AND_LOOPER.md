# The FX panel, the looper and recording

These are the effects that sit after the instruments, the gesture looper, and how to get sound out into a DAW. The FX panel on the Machine's mast duplicates part of the **Hall & Master** section of the page, so you can use either.

## The FX panel

From left to right and top to bottom, as it hangs on the mast:

The display reads the harmonizer's shift in semitones, then the selected voice and its send. `-12st  I 0%`, for example, means an octave down with the e-bow string selected and none of it sent.

**SEND** is a slider: drag it sideways. It sets the *Harmonizer* send of the **selected voice**, the last voice you played or picked. Each voice has its own send, so play the rods, set SEND, play the string and set SEND again.

**SHIFT** (−24 to +12 semitones, default −12) is the pitch of the harmonizer return. It defaults to an octave down, which turns a string into a sub drone and a rod into a cello.

**DETUNE** (0–50 cents, default 12): the return is two voices, one panned left and one right, pulled apart by this many cents. A little widens it; a lot makes it seasick.

**FEEDBACK** (0–0.9, default 0.25) feeds the shifted sound back into the shifter, through a gentle low-pass. Each pass is shifted again, so −12 with feedback becomes a stack of octaves falling into the floor, and −1 becomes a slow downward spiral. The higher you set it, the longer the spiral rings on after you stop.

**RETURN** (default 0.8) is how loud the harmonizer comes back.

**AURA** is the level of the Aura pad (voice VIII).

**HALL** is the decay time of the large reverb (0.5–30 s, default 6).

**FREEZE** pins the Aura pad: it stops listening and holds what it has (`F` does the same).

**LOOP** starts or closes a gesture loop (`Space` does the same).

To turn a knob, drag it up or down. Hold `Shift` for fine moves.

### The rest of Hall & Master

Below the voice panel on the page:

- **Huge reverb.** An eight-line feedback delay network with slowly moving lines.
  - **Size**: room size.
  - **Decay** (the HALL knob).
  - **Damping**: darker tails.
  - **Pre-delay**: 0–200 ms. Distance adds up to 60 ms on top.
  - **Return**: how loud the hall comes back.
- **Harmonizer.** The same four knobs as the panel.
- **Body & piezo.** See [INSTRUMENTS.md](INSTRUMENTS.md#body-and-piezo).
- **Master.**
  - **Tilt**: one knob that trades lows for highs around 700 Hz.
  - **Volume**: −30 to +6 dB.
  - A look-ahead limiter at the end holds the master at about −1 dBFS.

## The gesture looper

The looper records **what your hand did**, not audio. Each pass is played again by the models, so every repeat is slightly different. If you turn a knob, the loop changes with it, and you can move a loop onto a different voice.

### Recording a layer

1. Press `Space` (or **Loop a gesture**, or the LOOP button on the panel).
2. Play a phrase on one voice.
3. Press `Space` again to close the loop.

A layer keeps the voice you played most during the take. A phrase shorter than a quarter of a second is thrown away. If you are still holding a gesture when you close the loop, it is released one block before the loop point, so nothing hangs.

### Layering

- **The first layer sets the cycle.** With **Free length** off (the default), each new layer is rounded to a whole number of cycles of the first, and starts on its downbeat, so overdubs stay in time.
- **Free length on:** each layer keeps its own length and drifts against the others. Two loops of 7.3 s and 11.1 s take a long time to line up again, which is what you want for unease.

### Per-layer controls

Each layer in the list has:

- **Voice menu**: move the layer to another voice. A bow stroke recorded on the rods can be replayed on the glass or the superball.
- **Ghost**: the layer stops repeating and improvises with its own strokes. It picks one of your strokes at random (never the same one twice running), sometimes mirrors it, plays it 0.7–1.4× as fast with a little more or less pressure, then waits a gap like one of yours before the next. Higher Dread means shorter gaps. A ghost is seeded, so the same session improvises the same way. `G` ghosts the newest layer.
- **Mute**, and **Remove** (`Backspace` removes the newest layer).

**Clear all** removes every layer.

`Ctrl+Z` and `Ctrl+Y` (or `Ctrl+Shift+Z`) undo and redo looper changes, up to 50 steps.

### A workflow that works

1. Choose the bed first. **Drone bed** (`F3`) or a held hurdy (`2`, then `H`).
2. Loop one slow bowed gesture on the rods. Keep it long and quiet.
3. Loop a few sparse taps on the spring tank, with Free length on.
4. Ghost the spring layer so the drips stop being regular.
5. Send the rods to the harmonizer, raise FEEDBACK slowly, and freeze the Aura when it sounds right.
6. Ride **Dread** and **Distance** by hand while you record.

## Recording out

Press **Record** (or `R`) to start, and press again to stop. The take is saved as a zip:

- `…_mix.wav`: the master mix, after the limiter, at your audio device's rate.
- With **Stems** on, one stereo WAV for each voice that made a sound (`ebow`, `hurdy`, `bowed`, `glass`, `struck`, `spring`, `junk`, `aura`, `superball`) plus `hall_return`, `reverse_swell`, `harmonizer_return` and `body`.
  - Stems are taken after Distance and the master tone, volume and low cut, but before the limiter.
  - Each stem starts on the same sample as the mix and is the same length.
  - When the limiter is idle, the stems add up to the mix to within rounding (about −120 dBFS). When a take hits the limiter, their sum is slightly louder than the mix, because the limiter only acts on the mix.
- `….horror.json`: the performance. It holds the starting settings, every gesture and every knob move, with the frame it landed on.

**Format.** 32-bit float is the default and keeps pre-limiter stems intact. With 24-bit, the stems get a 6.02 dB pad (multiply by 2 to restore) to make room for peaks above full scale. If any samples still clip, the app tells you to use float for that take.

**Length.** A mix-only take runs up to 10 minutes, and a take with stems up to 4.

### Re-rendering a performance

**Render…** takes a `.horror.json` and plays it again offline, faster than real time, using the same engine. It uses the current Stems and format settings. Use it to:

- get stems from a take you recorded without them;
- re-render at a different bit depth;
- recover a take whose live recording glitched.

**Load** with a performance file loads its sound: the starting settings plus its last knob positions.

### Into a DAW

- **Files:** drag the WAVs onto your timeline. Stems start at the same sample, so line them up at zero.
- **Live:** route the browser through a loopback device and record it as an input:
  - BlackHole on macOS;
  - VB-Cable or VoiceMeeter on Windows;
  - PipeWire or JACK on Linux.
- **MIDI in:** notes play the selected voice, and CC 20–23 move Dread, Distance, Material and Pitch, in browsers that support Web MIDI, once audio is started. A DAW can drive the macros this way, through a virtual MIDI port (IAC on macOS, loopMIDI on Windows).

There is no plugin version or tempo sync. A MIDI or VST version may come later.
