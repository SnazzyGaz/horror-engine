# Real-time notes: what the audio thread allocates

Horror Engine · Séance by Garyck Arntzen ([x.com/_mintydoge](https://x.com/_mintydoge)). GNU AGPLv3.

The engine renders without touching the heap: voices, effects, the looper clock and the contact list run on
buffers made when the plugin is prepared. Since 1.0.1 the things that grow while you play are reserved up front:

| What | Reserved | Enough for |
|---|---|---|
| Looper gesture recording (`recEv`) | 16384 events | about 2 minutes of continuous dragging in one layer |
| Custom-moment recording (`recM.ev`, `recM.pv`) | 8192 each | as before |
| Contact list (`act`) | 256 slots | all voices, layers and moments at once |
| Layers, undo and redo stacks | 64 layers, 52 snapshots each | the 50-step undo limit |
| Held MIDI notes (`held_`) | 128 notes | every MIDI note |

Measured with `tools/rt_harness.cpp` (9 s of playing on all nine voices, two loop layers, ghost, mute, undo and redo):
heap allocations inside `render()` went from 2 to 0, and in message handling from 110 to 90.

## What still allocates, and why it is left

These run on the audio thread (engine messages are handled at the start of a block), but only once per user command,
never per sample or per block:

- **Closing a loop layer** (`stop`): builds the layer's event table (a `shared_ptr<vector>`), the `Layer` itself and
  an undo snapshot. Sized by what you recorded.
- **Ghosting a layer**: builds the ghost's stroke and gap tables from the layer.
- **Undo / redo**: rebuilds the layers from a snapshot (the event tables are shared, not copied).
- **Your own moments**: defining one builds its per-voice state; firing one adds an instance.
- **Frees**: removing a layer, clearing, dropping an old undo snapshot, or replacing a moment definition can free the
  last reference to an event table or definition.

Each is a handful of small allocations (tens of bytes to a few hundred KB for a long layer) at the moment you press a
button, which Windows' and macOS's heaps serve in microseconds. Moving them off the audio thread means building the
tables on the message thread and handing them over through the FIFO, plus a return queue for frees; that is a larger
change to the line-for-line engine port and is left for a later version. No locks are taken on the audio path (only
`SpinLock` try-locks).
