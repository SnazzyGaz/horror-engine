# The instruments

This is a field guide to the nine voices: what each one is, how to play it on the Machine and on the Surface, what every knob does, and where it earns its place in a score. 

[Ways to play](#ways-to-play) · [I. E-bow string](#i-e-bow-string) · [II. Hurdy-gurdy](#ii-hurdy-gurdy) · [III. Bowed metal](#iii-bowed-metal) · [IV. Glass](#iv-glass) · [V. Struck metal](#v-struck-metal) · [VI. Spring tank](#vi-spring-tank) · [VII. Junk tray](#vii-junk-tray) · [VIII. Aura](#viii-aura) · [IX. Superball](#ix-superball) · [Shared parts](#shared-parts) · [Macros](#macros) · [Moments](#moments) · [Presets](#presets) · [Keys](#keys)

## Ways to play

Every voice reads the same four things from your hand: **where** you touch (x and y), **how hard** (pressure), and **how fast** you move. Bowed, scraped, cranked and rubbed voices make no sound until you move. Speed is the bow.

**The Machine** (the default tab). Drag a part of the cabinet to play it. When the pointer is over a part, a hint at the top of the view says what that part does. Drag empty space or the room to look around, use the wheel to zoom, and right-drag to orbit from anywhere. `F6` `F7` `F8` `F9` move the camera to the left, middle, right and the panel, and `Home` shows the whole machine. `K` makes the camera follow the part you play. `D` is demo mode, with the hints hidden and a slow drift.

**The Surface.** A flat pad for the selected voice (choose it with `1`–`9` or the rack). The labels on the pad edges say what x and y do for that voice.

**Pressure.** A pen uses its real pressure. With a mouse, hold `Shift` for a hard touch (100%) or `Alt` for a soft one (30%). Otherwise the wheel sets the resting pressure in 5% steps (it starts at 60%). On the Machine, the wheel changes pressure while you are holding a part and zooms otherwise.

**Notes.** `Z X C V B N M , . /` and `Q W E T Y U I O P` play chromatic notes on the selected voice, starting from A at 55 Hz. The upper row is an octave above the lower one and skips `R`, which is Record. `[` and `]` shift the octave (from −2 to +4). `Shift` plays a note hard and `Alt` plays it soft. A MIDI keyboard does the same, with velocity, wherever the browser allows Web MIDI. A note sets the voice's pitch directly: the e-bow string, bowed metal, superball, struck metal and the hurdy's melody string follow it, and glass sounds two octaves above it.

Every key is listed under [Keys](#keys).

**Hold** (`H`, or the Hold button) keeps the selected voice sounding with no hand on it, at a steady medium pressure and bow speed. **Mute** silences it.

### The channel strip (every voice)

| Knob | What it does |
|---|---|
| Level | −60 to +6 dB. |
| Pan | Left to right. |
| Hall | Send into the large reverb. |
| Spring | Send into the spring tank, so any voice can drip through the springs. The tank itself has no Spring send. |
| Harmonizer | Send into the pitch shifter. The FX panel's SEND slider moves this knob for the selected voice. |
| Grit | Soft-clip drive with a darkening filter after it. When Grit is up, Dread adds more. The e-bow string starts at 45%; every other voice starts clean. |

Each voice also feeds the shared wooden **Body** by a fixed amount. Struck metal, the junk tray and the superball feed it hardest, then bowed metal, the string, the hurdy and the spring tank, then glass. The aura does not feed it at all.

---

## I. E-bow string

**What it is.** A single slack string kept ringing forever by a magnetic driver, like an EBow held over a guitar string. The model is a waveguide loop with a self-oscillating driver. The string goes sharp as it swings wider, so pressing harder bends it up.

**On the Machine.**
- **E-bow puck:** run it along the string. Moving along the string slides the pitch. Moving across it picks the harmonic: nearest you is the fundamental, then 2nd and 3rd, and at the far edge it flips between harmonics on its own. `Shift` drives harder.
- **The string:** tap it to strike it (`Shift`-tap to pluck) and keep dragging to slide the bar. This is the Blaster Beam.
- **Slide bar:** drag it along the groove after a strike to bend the boom.

**On the Surface.** x slides the pitch up to *Slide range* octaves either side of *Pitch*. y moves the driver along the string. Pressure is drive, and pressing harder bends the slack string sharp.

**Knobs.**
- **Pitch** (30–400 Hz, default 55): the open string.
- **Drive**: driver strength, multiplied by your pressure. Moving fast adds a little more.
- **Slack**: how loose the string is. A looser string wanders in pitch (more with Dread) and bends further when driven hard, up to about a semitone at full slack.
- **Driver**: where the driver sits along the string. Near the end is thin and nasal; towards the middle is rounder.
- **Harmonic**: Fund, 2nd or 3rd lock the driver onto that harmonic. **Auto** flips to the 2nd or 3rd on its own when drive and Dread together are high: the wail that cracks into a scream.
- **Buzz**: the string clips against something as it swings. Turn it up for a rattling, distorted edge.
- **Damping**: how fast the string dies once the driver stops, from about half a second with full damping to around ten seconds with none (longer with Material up). Damping also dulls the tone.
- **Piezo**: blends in a bright contact-mic pickup. It adds upper harmonics, so a 50 Hz drone still reads on laptop speakers without adding more sub.
- **Excite**: **E-bow** (endless sustain), **Strike** (a narrow knock near the end: a bright boom) or **Pluck** (rounder). With Strike or Pluck the driver is off, and x slides the bar along the ringing string.
- **Slide range** (1–3 octaves): how far x reaches.
- **Sympathy**: with the driver off, the string picks up the hurdy-gurdy and the body and rings along with them.

**Character.** A low, held, unstable tone that never quite settles. With Grit and the Harmonizer an octave down, it becomes the floor of a cue.

**Scoring tips.** Hold it at 41–55 Hz with Slack high and Dread around 0.4: the pitch breathes without you touching it. For the Blaster Beam, set Excite to Strike, Slide range 2, Damping low, and drag the bar down slowly after each hit. Raise Sympathy and stop the driver so the string ghosts the wheel underneath.

---

## II. Hurdy-gurdy

**What it is.** Three strings bowed by a rosined wheel that you turn with a crank, played through a small wooden body. String one sits on the root, string two a fifth above and string three an octave above. A dog-buzz bridge rattles when you jerk the crank.

**On the Machine.**
- **Crank:** circle it. The faster you turn, the harder it drives. Jerk it for the buzz.
- **Drone strings:** drag along them while it cranks, and the touch point picks the note on the top string, chromatically over an octave.

**On the Surface.** The speed of your hand turns the crank. x plays the melody when *Melody on X* is on.

**Knobs.**
- **Crank** (0–4 rev/s, default 1): how fast your movement turns the wheel. Hold turns it at this rate.
- **Wheel**: how hard the wheel presses the strings, times your pressure. Light is airy and hollow; heavy is gritty and grabbing.
- **Root** (30–220 Hz, default 49): the bottom string.
- **Dog buzz**: how easily the buzz bridge rattles. It answers sudden accelerations and fast cranking.
- **Rosin**: unevenness in the wheel's grip, so scratch and wobble. Dread scales it.
- **Melody on X**: puts the top string under x, chromatic over one octave.

**Dread works on the tuning.** Above about 0.3, the fifth slides toward a tritone, fully there by 0.8. Above 0.5, the octave string sharpens toward a minor ninth. A calm drone sours as Dread rises.

**Scoring tips.** A slow crank at Root 41–49 Hz is the bed most cues in this machine sit on. Push Dread from 0.2 to 0.7 across a scene and let the interval curdle. Keep Dog buzz low and give the crank one jerk at a cut.

---

## III. Bowed metal

**What it is.** A bow on steel: a **ruler** clamped over a table edge, a free **rod**, a **saw** blade or a **clock spring**. Each is a bank of the object's own modes driven through a stick-slip friction contact. Change the bow pressure and the note jumps to another mode, which is where the whoops come from.

**On the Machine.**
- **Steel rulers:** stroke across a ruler to bow it and tap to strike it. Each ruler is its own note.
- **Ruler clamp:** drag it toward you or away to slide all four rulers. Longer is lower.
- **Waterphone rods:** stroke across to bow and tap to strike. While bowing, push up or down to rock the tray: the water runs to the low end and bends those rods.
- **Bow saw:** stroke across the blade to bow it and tap to strike it. Drag up or down while bowing to bend the blade and the note.
- **Clock spring (coil):** stroke across to bow it and tap to strike it.

**On the Surface.** x is the bow position along the object, which changes which modes speak. y is bend, or overhang for a ruler. Speed is bow speed; with no motion there is no sound. Pressure picks the mode.

**Knobs.**
- **Object**: Ruler, Rod, Saw or Clock spring.
- **Size** (40–4000 Hz, default 330): the fundamental for the rod, saw and clock spring. A ruler takes its pitch from *Ruler length* instead.
- **Pressure**: bow force, times your pressure. Light pressure favours high modes and heavy pressure favours low ones. A change of more than about 15% knocks the bow loose for an instant, and it catches on a new mode.
- **Bow speed**: how much bow your hand speed gives. It is also the speed Hold uses.
- **Bend**: for a ruler, the overhang (about ±30% of the length). For the saw, how far the blade is flexed, which pulls the partials and the pitch. On the rod and clock spring it stretches the partials slightly.
- **Damping**: how quickly the metal stops ringing.
- **Ruler length** (6–30 cm, default 14): how far the ruler hangs over the edge. Pitch goes as one over the length squared: 10 cm is about 65 Hz and 20 cm about 16 Hz. The clamp on the Machine sets this for both bowed and struck rulers.

**Water.** The Water knobs appear under this voice (see [Shared parts](#water)). With the Rod object, the modes wobble in the water and the rods sink lower in pitch where the tray is deep.

**Character.** Bow the ruler and it stick-slips into a groan. The rod sings and whines. The saw bends like a voice. The clock spring is a cluster of clashing tones.

**Scoring tips.** For a riser, bow a rod slowly and lean on the pressure every few seconds so it climbs mode to mode. For a moan under dialogue, use the ruler at 18–24 cm with a slow, light bow. For the waterphone, choose the Rod object, raise Water to 0.5 and Slosh to 0.3, and send 40% to the Harmonizer.

---

## IV. Glass

**What it is.** Friction on glass. A **pane** under a fingernail, a **wine glass** rubbed with a wet finger, a **bottle** and a **chalkboard**. The contact sticks and slips at a rate set by your speed and pressure. Dry, it judders; wet, it slides into a steady tone.

**On the Machine.**
- **Glass pane:** drag a fingernail over it (`Alt`: chalk).
- **Slate:** drag the chalk across it (`Alt`: a fingernail).
- **Wine glass:** circle the rim with a wet finger. More water in the glass gives a lower note.
- **Glass tap:** hold it to run water into the wine glass, and `Shift`-hold to drain it.
- **Bottle:** rub its shoulder with a wet finger (`Alt`: a nail).

**On the Surface.** x is the contact point. y goes from dull to shrill. Scrape speed sets the judder rate, and stopping suddenly leaves a short squeak. With a finger, the glass beats faster as you circle faster.

**Knobs.**
- **Surface**: Pane, Wine glass (long ring), Bottle or Chalkboard (almost no ring).
- **Contact**: Nail, Finger (a soft, sung tone with the slow 4–8 Hz beat of a finger going round a rim) or Chalk (noisy and dry).
- **Pressure**: contact force, times your pressure. More force gives a lower, heavier judder.
- **Judder**: how irregular the stick-slip is. Dread scales it.
- **Wetness**: how long each stick lasts. Dry judders; fully wet slides into a sung tone.
- **Size** (0.25–4×): scales the pitch of the glass.
- **Water in glass**: wine glass only. Lowers the note by up to 20%.
- **Ear guard** (on by default): watches the 2–5 kHz band, where nail and chalk get painful, and turns the voice down when that band crosses a ceiling. Turn it off only with the volume down.

**Character.** It ranges from a held, pure rim note in a far room to a nail dragged slowly enough that you hear each catch.

**Scoring tips.** Wine glass, Finger, Distance at 0.4 and Hall at 0.6 make a shimmer that sits far behind everything. A nail on the pane at very low speed gives isolated ticks of friction, which do more for tension than a long scrape. Leave the ear guard on for anything you will listen to more than once.

---

## V. Struck metal

**What it is.** Things you hit: a ruler twang, a rod ping, a bell, a clock spring, or a knuckle on the wooden body. It is polyphonic, with twelve voices. A new hit steals the oldest voice with a 5 ms fade.

**On the Machine.** Tap a ruler, rod, the saw or the coil to strike it. Knock on the bare wood (the spine), tap the drumhead, or hit the thunder sheet. Every tap is this voice.

**On the Surface.** Tap. Pressure is velocity. x moves the pitch 1½ octaves either side of *Pitch*; for a ruler it changes the overhang instead. y is the strike position, which changes which partials ring.

**Knobs.**
- **Object**: Ruler, Rod, Bell, Clock spring or Body (wood: a short, dry knock).
- **Pitch** (30–5000 Hz, default 180).
- **Hardness**: a shorter, harder contact for a brighter hit.
- **Decay** (0.05–20 s). The Body object is always short.
- **Slap**: ruler only. The ruler slaps the table edge as it swings, which adds a flapping buzz.
- **Ruler length** (6–30 cm): the ruler's overhang, shared with the bowed ruler.

**Water.** Rods, bells and clock springs wobble in pitch with Water, and rods drop where the tray is deep.

**Scoring tips.** A Bell at 110 Hz with Decay 9 s and the Spring send at 0.35 is a distant clock. For a heartbeat-adjacent knock, use the Body object at a low pitch and Body Piezo up. Put the struck metal into the Harmonizer with Feedback 0.5 and every hit falls away in steps.

---

## VI. Spring tank

**What it is.** A spring reverb tank that you play directly. There are three springs of different lengths, each a chain of dispersive filters in a feedback loop. Low frequencies travel slower down a spring, so every echo drips downward: highs arrive first and lows last. The tank is also the Spring send for every other voice.

**On the Machine.** Tap it for a drip. Drag along it to scrape, or drag up and down to shake it. The direction of your first movement picks scrape or shake, and the tank returns to Hit when you let go. `Alt` e-bows it (sustain while you hold). Knocks on the wood set it off too when *Knock to spring* is up.

**On the Surface.** Tap to hit, scrub to shake or scrape (set by Excite), and hold in E-bow mode to sustain.

**Knobs.**
- **Excite**: Hit, Shake, Scrape or E-bow. A hit is a short burst of noise rather than a click: soft is dark and long, hard is bright and splashes, and a hard knock makes the coils rattle.
- **Decay** (0.3–8 s).
- **Tension**: a slack tank (about 2.2 kHz top) is darker and slower; a tight tank (about 4.2 kHz) is brighter.
- **Dispersion**: how strongly each echo smears into a falling chirp.

**Scoring tips.** Single soft hits with Decay at 4 s, far apart, are the Trepidation sound. Send the e-bow string into the Spring at 0.25 so its swells come back as drips. Turn up *Knock to spring* (in the Body section) and every knock on the box sets the springs off a moment later.

---

## VII. Junk tray

**What it is.** A tray of nuts and bolts with a magnet underneath. Up to 80 pieces are simulated: they chase the magnet, collide with each other and the walls, and each impact rings a tiny resonator. The tray rings under them.

**On the Machine.** Pull the drawer handle toward you to open it. The magnet only works on an open drawer, and the further it is open, the more the tray rings. Drag over the junk to stir it: steel nuts are on the left, a mix in the middle, brass on the right.

**On the Surface.** The magnet is under your pointer. Drag it and the pieces chase it. Moving faster agitates them more.

**Knobs.**
- **Count** (4–80): how many pieces there are.
- **Magnet**: how strongly the magnet pulls, times your pressure.
- **Agitation**: random kicks while the magnet is down: skitter.
- **Junk**: Steel (bright, short), Brass (lower, longer ring) or Mixed.
- **Tray ring**: how much the tray itself resonates.

**Scoring tips.** Use Count 10–20, Agitation low and slow magnet moves for something small moving in the walls. Hold it at high Agitation under a cut for nervous texture. The *In the walls* moment plays this voice for you.

---

## VIII. Aura

**What it is.** A granular pad made from the machine itself. The Aura records the last few seconds of every other voice and replays them as overlapping grains, many of them an octave down and some an octave up. It is silent until another voice has played. Hold is on by default, so it is always listening.

**On the Machine.** Rub the lamp to swell the pad. Double-click the lamp to freeze it. The AURA knob on the panel is its level, and FREEZE pins it.

**On the Surface.** x scrubs back through the last eight seconds, and y adds blur. Pressure is level.

**Knobs.**
- **Grain** (40–1000 ms): the length of each grain. Short is grainy and long is smooth.
- **Density** (1–32): grains at once.
- **Blur**: how widely the grains are scattered in time.
- **Freeze** (`F`): stops recording, so the pad holds what it has forever. A slow leveller keeps a frozen cloud at a steady volume.
- **Shimmer** (0–0.7): the share of grains played an octave up.
- **Darkness**: a low-pass from open down to about 500 Hz.
- **Breathe**: a slow swell and sag in level.

**Scoring tips.** Play a phrase on any voice, freeze the Aura, then stop: the room keeps the last thing it heard. With Pitch below −12 st, the grains get longer and some drop two octaves. Darkness at 0.7 with Breathe at 0.5 gives a pad that seems to inhale.

---

## IX. Superball

**What it is.** A rubber ball on a flexible stick, dragged across a surface. It sticks and slips, and each slip is a soft rubber pulse. Their rate is the moan's pitch, which rises with pressure and speed. Near one of the surface's own notes it catches and swells. The surface colours it.

**On the Machine.** Pick up a ball by its wand and drag it onto a surface it can reach. The surface picks the sound. The **left** ball reaches the thunder sheet, the waterphone rods and the left of the box. The **right** ball reaches the drumhead and the right of the box. Out of reach, it hangs silent in the air.

**On the Surface.** Drag to moan. x is the contact point; y is the handle angle, which bends the moan. Press harder to raise it.

**Knobs.**
- **Surface**: Wood body (short and woody), Drumhead, Metal sheet (long ring, wobbles with Water) or Rods (the waterphone rods, in the water).
- **Pitch** (30–400 Hz, default 75): the centre of the moan.
- **Pressure**: raises the pitch and the level.
- **Grip**: more grip is lower and rougher, and catches the surface's notes harder.
- **Size** (0.5–2×): a larger surface has lower modes.

**Scoring tips.** On the Metal sheet, a slow drag with rising pressure is a whale call. On the drumhead, short pushes give groans. Use Grip high for a bowed-door creak.

---

## Shared parts

### Water

The waterphone tray and its water are shared by the rods (bowed and struck), bells, clock springs and the superball on the metal sheet and the rods. The Water knobs appear under Bowed metal, Struck metal and the Superball.

- **Water**: how much the submerged modes wobble in pitch.
- **Slosh**: how fast they wobble (about 0.3–3 Hz).
- **Level**: how deep the tray is. Deeper water lowers the rods by up to 6%.
- **Tilt** (−1 to 1): the water runs to one end, so the rods on that end sink lower.

On the Machine, grab the tray by its rim and push one end down to rock it. It sways back level when you let go (`Shift` as you let go holds the tilt). Rocking it also makes it slosh. The **tray tap** fills it (drag up) and drains it (drag down).

### Body and piezo

Every part is bolted to one wooden box heard through a contact mic.

- **Body**: how much the box rings along with each voice.
- **Piezo**: from the warm box toward the quacky, bass-light contact-mic sound. On the Machine, click the piezo disc to step through 0, 40% and 80%.
- **Box size** (0.5–2×): a bigger box has lower resonances.
- **Knock to spring**: sharp transients on the body kick the spring tank.

Knock the bare wood on the Machine (the spine) and everything on it rings along.

## Macros

Four large knobs that move many things at once. MIDI CC 20–23 control them in this order.

- **Dread** (off-key to chaos). This affects:
  - Detune across the machine, from about 2 to 60 cents.
  - Instability: pitch wander and judder.
  - A rough tremolo on sustained voices.
  - A sub-octave under the string and the wheel.
  - Extra Grit on voices that already have some.
  - The hurdy's fifth turning to a tritone.
  - Auto-harmonic flips on the string.
  - The heartbeat's tempo.
  - How often the walls skitter.
- **Distance** (close to down the corridor). Turning it up has these effects on each voice:
  - It filters out the highs, toward about 1 kHz.
  - It drops the level by up to 15 dB and narrows the image.
  - It takes away the bass.
  - It sends more to the hall, with up to 60 ms more pre-delay.
- **Material** (wood, steel, glass): ring time, brightness and how stretched (bell-like) the partials are, across the metal and glass voices.
- **Pitch** (−36 to +24 semitones): the whole machine. Below −12 it adds sub and lengthens the aura's grains.

## Moments

These are scripted gestures that play the machine for you. They are buttons on the right and `F1`–`F5` on the keyboard.

- **Riser** (`F1`): an 8-second climb. Pitch rises 11 semitones, Dread rises, and the Aura thickens while the bowed metal and the string are played harder and harder. It ends in a hard cut that chokes both, then everything glides back over half a second. Press it again to end early without the cut.
- **Stinger** (`F2`): the last moment of sound plays back reversed and swells for 0.8 s, with the string screaming two octaves up. Then a hit lands exactly 800 ms after the press: low bells, a deep knock and the spring tank, with a burst of extra hall. Distance is pulled to zero while it plays.
- **Drone bed** (`F3`): the wheel cranks and the string sustains on the hurdy's root. After 2 s the Aura freezes under it. Every 20–40 s, the second string moves to a new interval chosen by Dread: fifths and fourths when calm, tritones and minor seconds as it rises.
- **Heartbeat** (`F4`): two low, muffled thumps, lub then dub, at about 54 bpm, rising toward 70 with Dread. Each beat ducks the string, the wheel and the Aura by 3–9 dB.
- **In the walls** (`F5`): bursts of the junk tray, short glass scrapes, spring drips and low knocks at random. Dread makes them come more often.

## Presets

The Preset menu resets every setting and then applies a few:

- **Cold Cellar**: the defaults.
- **The Lighthouse**: a held wheel at 41 Hz with an Auto-harmonic string and a long hall.
- **Glass Asylum**: wet wine glass, high Material and shimmer.
- **Clock Tower**: low bells and a bowed clock spring in a vast room.
- **Rust Works**: high Dread, gritty string, a bowed rod and a lot of steel junk.
- **Drowned Choir**: bowed rods in water through the harmonizer with feedback.
- **Blaster Beam**: the struck string with a two-octave slide, through the harmonizer and the piezo.
- **Sub Basement**: everything 14 semitones down, far away, with a 20-second hall.

**Save** writes every setting to a `.json` preset. **Load** reads a preset or the starting sound of a performance file.

## Keys

Every key the app answers to. Keys are ignored while a text field or menu has focus, and while the Guide is open.

### Playing

| Keys | What it does |
|---|---|
| `1`–`9` | Select voice I–IX |
| `Z X C V B N M , . /` | Chromatic notes on the selected voice, from A at 55 Hz (octave 0) |
| `Q W E T Y U I O P` | Chromatic notes an octave above the lower row (`R` is skipped: it is Record) |
| `[` / `]` | Octave down / up (−2 to +4) |
| `Shift` + note or drag | Hard touch (velocity or pressure 100%) |
| `Alt` + note or drag | Soft touch (notes 35%, drags 30%) |
| Mouse wheel over the Surface | Resting pressure up / down in 5% steps (starts at 60%) |
| `H` | Hold the selected voice on / off |
| `F` | Freeze the Aura on / off |
| `F1`–`F5` | Moments: Riser, Stinger, Drone bed, Heartbeat, In the walls |
| `Esc` | Silence: stop every voice and moment, turn off Hold (except the Aura's) and Freeze, clear the hall. Loop layers carry on at their next stroke. |

### Looper

| Keys | What it does |
|---|---|
| `Space` | Start a gesture loop / close it |
| `G` | Ghost the newest layer on / off |
| `Backspace` | Remove the newest layer |
| `Ctrl+Z` | Undo a looper change (up to 50) |
| `Ctrl+Y` or `Ctrl+Shift+Z` | Redo |

On a Mac, `Cmd` works in place of `Ctrl`.

### Recording

| Keys | What it does |
|---|---|
| `R` | Start / stop recording (saves a zip) |

### Knobs (when a knob has focus)

| Keys | What it does |
|---|---|
| Drag up / down, or the mouse wheel | Turn it (hold `Shift` for fine) |
| `↑` `→` / `↓` `←` | Step up / down (hold `Shift` for fine) |
| `Home` / `End` | Minimum / maximum |
| `Delete`, or double-click | Back to the default |

### The Machine view

| Keys / mouse | What it does |
|---|---|
| Drag a part | Play it (the hint at the top says how) |
| Drag empty space, or right-drag anywhere | Look around |
| Mouse wheel | Zoom; while you hold a part, change pressure instead |
| `F6` `F7` `F8` `F9` | Camera to the left, middle, right, panel |
| `Home` | Camera on the whole machine |
| `K` | Follow the part you play on / off |
| `D` | Demo mode on / off (hints hidden, slow drift) |
| Double-click the lamp | Freeze the Aura on / off |

### MIDI

In browsers with Web MIDI, once audio is started: notes play the selected voice with velocity, and CC 20, 21, 22 and 23 move Dread, Distance, Material and Pitch.
