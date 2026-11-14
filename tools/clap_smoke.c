/* A tiny CLAP host for a smoke test: load the plugin, play a few MIDI notes, report the output level.
   cc -I clap/include clap_smoke.c -o clap_smoke -ldl   (or x86_64-w64-mingw32-gcc ... for Windows, run under Wine) */
#include <clap/clap.h>
#include <math.h>
#include <stdio.h>
#include <string.h>
#ifdef _WIN32
#include <windows.h>
#define LOADLIB(p) (void*)LoadLibraryA(p)
#define GETSYM(h, s) (void*)GetProcAddress((HMODULE)(h), s)
#else
#include <dlfcn.h>
#define LOADLIB(p) dlopen(p, RTLD_NOW)
#define GETSYM(h, s) dlsym(h, s)
#endif

static const void* host_ext(const clap_host_t* h, const char* id) { (void)h; (void)id; return NULL; }
static void host_noop(const clap_host_t* h) { (void)h; }
static clap_host_t host = {CLAP_VERSION, NULL, "smoke", "test", "", "1", host_ext, host_noop, host_noop, host_noop};

typedef struct { clap_event_midi_t ev[8]; int n; } Events;
static uint32_t ev_size(const clap_input_events_t* l) { return (uint32_t)((const Events*)l->ctx)->n; }
static const clap_event_header_t* ev_get(const clap_input_events_t* l, uint32_t i) { return &((const Events*)l->ctx)->ev[i].header; }
static bool out_push(const clap_output_events_t* l, const clap_event_header_t* e) { (void)l; (void)e; return true; }

int main(int argc, char** argv) {
  if (argc < 2) { printf("usage: clap_smoke plugin.clap\n"); return 2; }
  void* lib = LOADLIB(argv[1]); if (!lib) { printf("FAIL: cannot load %s\n", argv[1]); return 1; }
  const clap_plugin_entry_t* entry = (const clap_plugin_entry_t*)GETSYM(lib, "clap_entry");
  if (!entry || !entry->init(argv[1])) { printf("FAIL: no clap_entry\n"); return 1; }
  const clap_plugin_factory_t* f = (const clap_plugin_factory_t*)entry->get_factory(CLAP_PLUGIN_FACTORY_ID);
  const clap_plugin_descriptor_t* d = f->get_plugin_descriptor(f, 0);
  printf("plugin: %s (%s) by %s, version %s\n", d->name, d->id, d->vendor, d->version);
  const clap_plugin_t* p = f->create_plugin(f, &host, d->id);
  if (!p || !p->init(p)) { printf("FAIL: create/init\n"); return 1; }
  const clap_plugin_params_t* params = (const clap_plugin_params_t*)p->get_extension(p, CLAP_EXT_PARAMS);
  if (params) printf("parameters: %u\n", params->count(p));
  const clap_plugin_gui_t* gui = (const clap_plugin_gui_t*)p->get_extension(p, CLAP_EXT_GUI);
  printf("gui: %s\n", gui && gui->is_api_supported(p, CLAP_WINDOW_API_WIN32, false) ? "win32" : gui && gui->is_api_supported(p, CLAP_WINDOW_API_X11, false) ? "x11" : "none");
  if (!p->activate(p, 48000, 32, 512)) { printf("FAIL: activate\n"); return 1; }
  p->start_processing(p);
  float L[512], R[512], IL[512] = {0}, IR[512] = {0}; float* outs[2] = {L, R}; float* ins[2] = {IL, IR};
  clap_audio_buffer_t ob = {outs, NULL, 2, 0, 0}, ib = {ins, NULL, 2, 0, 0};
  Events evs; clap_input_events_t in = {&evs, ev_size, ev_get}; clap_output_events_t out = {NULL, out_push};
  double peak = 0, energy = 0; long frames = 0;
  for (int b = 0; b < 400; b++) {
    evs.n = 0;
    if (b % 40 == 0 || b % 40 == 30) {   /* a note on every 40 blocks, off 30 blocks later */
      clap_event_midi_t* m = &evs.ev[evs.n++]; memset(m, 0, sizeof *m);
      m->header.size = sizeof *m; m->header.time = 0; m->header.space_id = CLAP_CORE_EVENT_SPACE_ID; m->header.type = CLAP_EVENT_MIDI; m->port_index = 0;
      int note = 36 + (b / 40) * 3; m->data[0] = b % 40 == 0 ? 0x90 : 0x80; m->data[1] = (uint8_t)note; m->data[2] = 100;
    }
    clap_process_t pr; memset(&pr, 0, sizeof pr);
    pr.steady_time = b * 512; pr.frames_count = 512; pr.audio_inputs = &ib; pr.audio_inputs_count = 1; pr.audio_outputs = &ob; pr.audio_outputs_count = 1; pr.in_events = &in; pr.out_events = &out;
    p->process(p, &pr);
    for (int i = 0; i < 512; i++) { double a = fabs(L[i]) > fabs(R[i]) ? fabs(L[i]) : fabs(R[i]); if (a > peak) peak = a; energy += L[i] * L[i] + R[i] * R[i]; if (L[i] != L[i]) { printf("FAIL: NaN\n"); return 1; } }
    frames += 512;
  }
  p->stop_processing(p); p->deactivate(p); p->destroy(p); entry->deinit();
  printf("rendered %ld frames: peak %.3f, rms %.1f dBFS\n", frames, peak, 10 * log10(energy / (2.0 * frames) + 1e-20));
  printf(peak > 0.01 && peak < 1.0 ? "PASS\n" : "FAIL: no sound or too loud\n");
  return peak > 0.01 && peak < 1.0 ? 0 : 1;
}
