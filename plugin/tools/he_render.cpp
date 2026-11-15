// Render a message log through the C++ engine to raw float32 stereo (the parity test's other half).
//   he_render log.txt out.f32
#include <cmath>
#include <cstdio>
#include <cstring>
#include <fstream>
#include <memory>
#include <sstream>
#include <string>
#include <vector>
#include "../core/he_core.h"

int main(int argc, char** argv) {
  if (argc < 3) { std::fprintf(stderr, "usage: he_render log.txt out.f32\n"); return 2; }
  std::ifstream in(argv[1]); std::string line; double sr = 48000; long long end = 0; uint32_t seed = 1337; bool sine = false;
  std::vector<double> params(he::NPARAM, 0.0);
  struct E { long long fn; he::Msg m; };
  std::vector<E> ev;
  while (std::getline(in, line)) {
    std::istringstream s(line); std::string a; s >> a;
    if (a == "SR") { s >> sr; continue; }
    if (a == "END") { s >> end; continue; }
    if (a == "SINE") { sine = true; continue; }
    if (a == "I") { s >> seed; for (int i = 0; i < he::NPARAM; i++) s >> params[i]; continue; }
    long long fn = std::stoll(a); std::string t; s >> t; E e{fn, he::Msg()};
    if (t == "P") { e.m.t = he::Msg::PARAM; s >> e.m.k >> e.m.v; }
    else if (t == "G") { e.m.t = he::Msg::GESTURE; std::string k; s >> e.m.s >> k >> e.m.x >> e.m.y >> e.m.p >> e.m.hz; e.m.g = k[0]; }
    else if (t == "M") { e.m.t = he::Msg::MOMENT; int on; s >> e.m.id >> on >> e.m.arg; e.m.on = on != 0; }
    else if (t == "C") { e.m.t = he::Msg::CMOMENT; int on; s >> e.m.id >> on; e.m.on = on != 0; }
    else if (t == "R") { e.m.t = he::Msg::CMREC; int on; s >> on; e.m.on = on != 0; }
    else if (t == "D") {
      e.m.t = he::Msg::CMDEF; auto d = std::make_shared<he::CmDefinition>(); int nev, nl; s >> e.m.id >> d->voice >> d->len >> nev;
      for (int i = 0; i < nev; i++) { he::CmEvent x; std::string k; s >> x.t >> x.s >> k >> x.x >> x.y >> x.p >> x.hz; x.k = k[0]; d->ev.push_back(x); }
      s >> nl;
      for (int i = 0; i < nl; i++) { he::CmLaneDef L; int ex, it, ab, np; s >> L.k >> L.min >> L.max >> ex >> it >> ab >> np; L.exp = ex; L.isInt = it; L.abs = ab; for (int j = 0; j < np; j++) { double t2, v; s >> t2 >> v; L.pts.push_back({t2, v}); } d->lanes.push_back(L); }
      e.m.def = d;
    }
    else if (t == "Z") { e.m.t = he::Msg::CMDEF; s >> e.m.id; }   // remove a definition
    else if (t == "L") { e.m.t = he::Msg::LOOP; int fr; s >> e.m.a >> e.m.layer >> e.m.lv >> fr; e.m.free = fr != 0; }
    else if (t == "X") e.m.t = he::Msg::PANIC;
    else if (t == "N") { e.m.t = he::Msg::INPUT; int on; s >> on; e.m.on = on != 0; }
    else continue;
    ev.push_back(e);
  }
  he::Host h(sr); h.init(params.data(), seed);
  std::vector<float> out; float L[he::BL], R[he::BL], IL[he::BL], IR[he::BL]; size_t k = 0;
  while (true) {
    long long f = h.frame();
    while (k < ev.size() && ev[k].fn <= f) { h.msg(ev[k].m); k++; }
    if (f >= end) break;
    if (sine) for (int i = 0; i < he::BL; i++) { double n = (double)(f + i); IL[i] = (float)(.3 * std::sin(6.283185307179586 * 220 * n / sr)); IR[i] = (float)(.2 * std::sin(6.283185307179586 * 331 * n / sr)); }
    h.block(L, R, sine ? IL : nullptr, sine ? IR : nullptr);
    for (int i = 0; i < he::BL; i++) { out.push_back(L[i]); out.push_back(R[i]); }
  }
  he::CmCapture cap; if (h.takeCapture(cap)) std::fprintf(stderr, "capture %zu ev %zu pv %zu p0 dur %.0f\n", cap.ev.size(), cap.pv.size(), cap.p0.size(), cap.dur);
  FILE* fo = std::fopen(argv[2], "wb"); std::fwrite(out.data(), sizeof(float), out.size(), fo); std::fclose(fo);
  return 0;
}
