// Horror Engine · Séance: the spirit board. Horror Engine by Garyck Arntzen (https://x.com/_mintydoge). GNU AGPLv3.
#include "Board.h"
#include "PluginProcessor.h"
#include "BinaryData.h"
#include <vector>

using namespace juce;
using namespace look;

static const float PI_F = MathConstants<float>::pi;

// Celestial planchette: uniform scale of Gaz's drawing. Window is centred on the
// hand so the tip still points at the letter (hit-testing is unchanged). The
// master rasters are Gaz's SVG at 2x (860x1228 -> 1720x2456), made with a
// proper SVG renderer (the drawing uses a <mask> that JUCE's parser cannot
// apply). At s=1 the body is 133 logical px tall (70% of the first preview).
// Those masters are Lanczos-3 resampled to the exact on-screen pixel size
// (editor scale and the display/OpenGL scale factor) and blit 1:1, so the
// linework stays a clean antialiased stroke. Ember is a soft tint of that
// same line mask, not a second pre-coloured raster.
static constexpr float PCH_W = 1720.f, PCH_H = 2456.f, PCH_WX = 860.f, PCH_WY = 1808.f, PCH_WR = 192.f;
static constexpr float PCH_BODY_H = 2355.f, PCH_UNIT = 133.f / PCH_BODY_H, PCH_SH_PAD = 80.f;

static Image loadPngBin(const char* data, int size) {
  if (data == nullptr || size <= 0) return {};
  return ImageFileFormat::loadFrom(data, (size_t) size);
}

struct PchRgba { float r, g, b, a; };
static float lanczos3(float x) {
  x = std::fabs(x);
  if (x < 1e-6f) return 1.f;
  if (x >= 3.f) return 0.f;
  const float pi = MathConstants<float>::pi;
  return (3.f * std::sin(pi * x) * std::sin(pi * x / 3.f)) / (pi * pi * x * x);
}
static void pchPackPremul(const Image& src, std::vector<PchRgba>& out) {
  const int w = src.getWidth(), h = src.getHeight();
  out.resize((size_t) w * (size_t) h);
  Image::BitmapData d(src, Image::BitmapData::readOnly);
  for (int y = 0; y < h; ++y)
    for (int x = 0; x < w; ++x) {
      const Colour c = d.getPixelColour(x, y);
      const float a = c.getFloatAlpha();
      out[(size_t) y * (size_t) w + (size_t) x] = { c.getFloatRed() * a, c.getFloatGreen() * a, c.getFloatBlue() * a, a };
    }
}
static void pchLanczosAxis(const std::vector<PchRgba>& src, int sw, int sh,
                           std::vector<PchRgba>& dst, int dw, int dh, bool horizontal) {
  dst.assign((size_t) dw * (size_t) dh, {});
  if (horizontal) {
    const float scale = (float) sw / (float) dw;
    for (int y = 0; y < sh; ++y) {
      const PchRgba* srow = src.data() + (size_t) y * (size_t) sw;
      PchRgba* drow = dst.data() + (size_t) y * (size_t) dw;
      for (int x = 0; x < dw; ++x) {
        const float cx = ((float) x + .5f) * scale - .5f;
        const int x0 = (int) std::floor(cx - 3.f + 1e-6f);
        const int x1 = (int) std::ceil(cx + 3.f - 1e-6f);
        float r = 0, g = 0, b = 0, a = 0, wsum = 0;
        for (int xi = x0; xi <= x1; ++xi) {
          const float wt = lanczos3(cx - (float) xi);
          if (wt == 0.f || xi < 0 || xi >= sw) continue;
          const PchRgba& p = srow[xi];
          r += p.r * wt; g += p.g * wt; b += p.b * wt; a += p.a * wt; wsum += wt;
        }
        if (wsum > 1e-8f) { r /= wsum; g /= wsum; b /= wsum; a /= wsum; }
        drow[x] = { r, g, b, a };
      }
    }
  } else {
    const float scale = (float) sh / (float) dh;
    for (int x = 0; x < sw; ++x) {
      for (int y = 0; y < dh; ++y) {
        const float cy = ((float) y + .5f) * scale - .5f;
        const int y0 = (int) std::floor(cy - 3.f + 1e-6f);
        const int y1 = (int) std::ceil(cy + 3.f - 1e-6f);
        float r = 0, g = 0, b = 0, a = 0, wsum = 0;
        for (int yi = y0; yi <= y1; ++yi) {
          const float wt = lanczos3(cy - (float) yi);
          if (wt == 0.f || yi < 0 || yi >= sh) continue;
          const PchRgba& p = src[(size_t) yi * (size_t) sw + (size_t) x];
          r += p.r * wt; g += p.g * wt; b += p.b * wt; a += p.a * wt; wsum += wt;
        }
        if (wsum > 1e-8f) { r /= wsum; g /= wsum; b /= wsum; a /= wsum; }
        dst[(size_t) y * (size_t) dw + (size_t) x] = { r, g, b, a };
      }
    }
  }
}
// Lanczos-3 resample with premultiplied alpha. Used so the 2x SVG master is
// never handed to JUCE's runtime drawImage scaler (which turned fine
// linework into speckled noise at typical board sizes).
static Image scaleImageLanczos(const Image& src, int w, int h) {
  if (!src.isValid() || w < 1 || h < 1) return {};
  if (src.getWidth() == w && src.getHeight() == h) return src.createCopy();
  std::vector<PchRgba> packed, mid, outp;
  pchPackPremul(src, packed);
  if (src.getWidth() != w) pchLanczosAxis(packed, src.getWidth(), src.getHeight(), mid, w, src.getHeight(), true);
  else mid.swap(packed);
  if (src.getHeight() != h) pchLanczosAxis(mid, w, src.getHeight(), outp, w, h, false);
  else outp.swap(mid);
  Image out(Image::ARGB, w, h, true);
  Image::BitmapData d(out, Image::BitmapData::writeOnly);
  for (int y = 0; y < h; ++y)
    for (int x = 0; x < w; ++x) {
      const PchRgba& p = outp[(size_t) y * (size_t) w + (size_t) x];
      const float a = jlimit(0.f, 1.f, p.a);
      if (a <= 1e-8f) { d.setPixelColour(x, y, Colours::transparentBlack); continue; }
      const float ia = 1.f / a;
      d.setPixelColour(x, y, Colour::fromFloatRGBA(jlimit(0.f, 1.f, p.r * ia),
                                                   jlimit(0.f, 1.f, p.g * ia),
                                                   jlimit(0.f, 1.f, p.b * ia), a));
    }
  return out;
}
// Soft tint of the cream linework: multiply the line colour by the ember
// gold (the colour of celestial_ember.png), keeping the antialiased alpha
// as a soft mask — no threshold.
static Image tintByAlpha(const Image& src, Colour col) {
  if (!src.isValid()) return {};
  const int w = src.getWidth(), h = src.getHeight();
  Image out(Image::ARGB, w, h, true);
  Image::BitmapData bin(src, Image::BitmapData::readOnly);
  Image::BitmapData bout(out, Image::BitmapData::writeOnly);
  const float cr = col.getFloatRed(), cg = col.getFloatGreen(), cb = col.getFloatBlue();
  for (int y = 0; y < h; ++y)
    for (int x = 0; x < w; ++x) {
      const Colour s = bin.getPixelColour(x, y);
      const float a = s.getFloatAlpha();
      if (a <= 0.f) continue;
      bout.setPixelColour(x, y, Colour::fromFloatRGBA(s.getFloatRed() * cr,
                                                      s.getFloatGreen() * cg,
                                                      s.getFloatBlue() * cb, a));
    }
  return out;
}
// 1:1 device-pixel blit: each cached pixel maps to one physical pixel, no
// runtime resampling. (Graphics::drawImage into a dest rect was still
// filtering, which turned the cream 1-pixel strokes into dim grey.)
static void blit1to1(Graphics& g, const Image& im, float dx, float dy, float phys) {
  if (!im.isValid() || phys <= 0.f) return;
  const float inv = 1.f / phys;
  Graphics::ScopedSaveState st(g);
  g.setImageResamplingQuality(Graphics::lowResamplingQuality);
  g.addTransform(AffineTransform::scale(inv, inv).followedBy(AffineTransform::translation(dx, dy)));
  g.drawImageAt(im, 0, 0);
}

static Image bakeLineGlow(const Image& src, Colour col, int radius) {
  if (!src.isValid() || radius < 1) return {};
  const int pad = radius + 2;
  Image padded(Image::ARGB, src.getWidth() + 2 * pad, src.getHeight() + 2 * pad, true);
  { Graphics g(padded); g.drawImageAt(src, pad, pad); }
  Image glow(Image::ARGB, padded.getWidth(), padded.getHeight(), true);
  { Graphics g(glow); DropShadow(col, radius, {0, 0}).drawForImage(g, padded); }
  return glow;
}
// Force the planchette body to opaque alpha and keep the window hole clear, so
// the board cannot show through (matches the web celestial.png body).
static Image flattenPchBody(const Image& src) {
  if (!src.isValid()) return {};
  const int w = src.getWidth(), h = src.getHeight();
  Image out(Image::ARGB, w, h, true);
  const float cx = PCH_WX * (w / PCH_W), cy = PCH_WY * (h / PCH_H);
  const float cr = PCH_WR * (w / PCH_W);
  Image::BitmapData bin(src, Image::BitmapData::readOnly);
  Image::BitmapData bout(out, Image::BitmapData::writeOnly);
  for (int y = 0; y < h; ++y)
    for (int x = 0; x < w; ++x) {
      const float dx = x + .5f - cx, dy = y + .5f - cy;
      const float hole = std::sqrt(dx * dx + dy * dy) / cr;
      Colour c = bin.getPixelColour(x, y);
      float a = c.getFloatAlpha();
      if (hole < .985f || a < .02f) { bout.setPixelColour(x, y, Colours::transparentBlack); continue; }
      if (a > .5f) a = 1.f;
      if (hole < 1.02f) a *= jlimit(0.f, 1.f, (hole - .985f) / .035f);
      bout.setPixelColour(x, y, c.withAlpha(a));
    }
  return out;
}
static Image makePchMask(const Image& src) {
  if (!src.isValid()) return {};
  const int w = src.getWidth(), h = src.getHeight();
  Image out(Image::ARGB, w, h, true);
  Image::BitmapData bin(src, Image::BitmapData::readOnly);
  Image::BitmapData bout(out, Image::BitmapData::writeOnly);
  for (int y = 0; y < h; ++y)
    for (int x = 0; x < w; ++x) {
      float a = bin.getPixelColour(x, y).getFloatAlpha();
      bout.setPixelColour(x, y, a > .5f ? Colours::white : Colours::transparentBlack);
    }
  return out;
}
// Same silhouette with the window filled in, so play/Dread glow may sit in the
// lens (as on the web) but still cannot bloom out onto the board.
static Image makePchSilhouette(const Image& mask) {
  if (!mask.isValid()) return {};
  Image out = mask.createCopy();
  Graphics g(out);
  const int w = out.getWidth(), h = out.getHeight();
  const float cx = PCH_WX * (w / PCH_W), cy = PCH_WY * (h / PCH_H), cr = PCH_WR * (w / PCH_W);
  g.setColour(Colours::white);
  g.fillEllipse(cx - cr, cy - cr, 2 * cr, 2 * cr);
  return out;
}


// Matches seance.js dreadLook: vis is 0 at Dread 0 (every draw path below is then the old one).
struct DreadLook { float vis, dark, hole, glow, flick; };
static DreadLook dreadLook(float D, float lvl, bool still, double tMs) {
  D = jlimit(0.f, 1.f, D);
  if (!(D > 0)) return {0, 0, .62f, 0, 1};
  float tone = jmin(1.f, jmax(0.f, lvl) * 4.f);
  float glow = D * (.22f + .78f * tone);
  float flick = 1.f;
  if (!still) flick = .88f + .12f * std::sin((float)(tMs * .069)) * (.35f + .65f * tone);
  return {D, .15f * D + .55f * D * D, .62f - .44f * D, glow, flick};
}
static bool motionReduced() { return false; }
static String nn(int n) { static const char* N[] = {"C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"}; return String(N[n % 12]) + String(n / 12 - 1); }

/* ---------- plaques ---------- */
Rectangle<int> Plaque::preferredSize() const {
  auto fw = font(FELL, bye ? 26.f : 30.f, bye ? .12f : 0.f); float w1 = textWidth(fw, word), w2 = textWidth(font(MONO, 12), sub);
  float pad = bye ? 26 : 18; int w = (int)std::ceil(jmax(118.f, jmax(w1, w2) + 2 * pad));
  return {0, 0, w, bye ? (5 + 26 + 4 + 16 + 7) : (6 + 30 + 4 + 16 + 8)};
}

bool he_paint::on = false;
double he_paint::acc[he_paint::NSlots] = {};
int he_paint::frames = 0;
void he_paint::reset() { for (int i = 0; i < NSlots; ++i) acc[i] = 0; frames = 0; }

void Plaque::paint(Graphics& g) {
  he_paint::ScopeT _pp(he_paint::Plaque);
  auto r = getLocalBounds().toFloat(); bool over = isMouseOver(true);
  float D = jlimit(0.f, 1.f, dread), G = jlimit(0.f, 1.f, dreadGlow);
  if (!(D > 0)) {
    if (pressed) { g.setColour(rgba(201, 168, 101, .14f)); g.fillRoundedRectangle(r, 8); }
    box(g, r.reduced(pressed ? 3.f : 0.f), 8, pressed ? rgba(201, 168, 101, .18f) : rgba(14, 11, 10, .6f), pressed ? gilt : over ? gilt : giltLo);
    if (bye && isMouseButtonDown()) { g.setColour(rgba(224, 118, 74, .18f)); g.fillRoundedRectangle(r.reduced(1), 8); }
    float top = bye ? 5.f : 6.f, wh = bye ? 26.f : 30.f;
    text(g, word, Rectangle<float>(0, top, r.getWidth(), wh + 2), font(FELL, wh, bye ? .12f : 0.f), pressed ? live : bone, Justification::centred);
    text(g, sub, Rectangle<float>(0, top + wh + 3, r.getWidth(), 16), font(MONO, 12), giltTxt, Justification::centred);
    if (progress > 0) { g.setColour(live); g.fillRect(Rectangle<float>(0, r.getBottom() - 3, r.getWidth() * jmin(1.f, progress), 3)); }
    return;
  }
  Colour border = giltLo.interpolatedWith(Colour(0xffa83a18), D);
  Colour borderOver = gilt.interpolatedWith(Colour(0xffe0764a), D);
  Colour fill = rgba(14, 11, 10, .6f + D * .25f);
  Colour wordCol = bone.interpolatedWith(Colour(0xffff6a3a), D * .9f);
  if (pressed) { g.setColour(rgba(201, 168, 101, .14f)); g.fillRoundedRectangle(r, 8); }
  box(g, r.reduced(pressed ? 3.f : 0.f), 8, pressed ? rgba(201, 168, 101, .18f) : fill, pressed ? gilt : over ? borderOver : border);
  if (bye && isMouseButtonDown()) { g.setColour(rgba(224, 118, 74, .18f)); g.fillRoundedRectangle(r.reduced(1), 8); }
  float top = bye ? 5.f : 6.f, wh = bye ? 26.f : 30.f;
  auto wr = Rectangle<float>(0, top, r.getWidth(), wh + 2);
  GlyphArrangement ga; ga.addFittedText(font(FELL, wh, bye ? .12f : 0.f), word, wr.getX(), wr.getY(), wr.getWidth(), wr.getHeight(), Justification::centred, 1);
  Path wp; ga.createPath(wp);
  DropShadow(rgba(255, 72, 24, D * .18f + G * .72f), (int)std::round(2 + 22 * G), {}).drawForPath(g, wp);
  g.setColour(pressed ? live : wordCol); g.fillPath(wp);
  text(g, sub, Rectangle<float>(0, top + wh + 3, r.getWidth(), 16), font(MONO, 12), giltTxt.withMultipliedAlpha(1.f - D * .5f), Justification::centred);
  if (progress > 0) { g.setColour(live); g.fillRect(Rectangle<float>(0, r.getBottom() - 3, r.getWidth() * jmin(1.f, progress), 3)); }
}

/* ---------- the board ---------- */
Board::Board(HorrorProcessor& p, Controller& c) : yes("Yes", "Stinger " + String::fromUTF8("\xc2\xb7 ") + nn(37), false), no("No", "Riser " + String::fromUTF8("\xc2\xb7 ") + nn(36), false), bye("Goodbye", String::fromUTF8("Silence \xc2\xb7 Esc"), true), proc(p), ctl(c) {
  auto title = [](int i) { return String(MOMENTS[i].name) + ": " + MOMENTS[i].desc + ". Key F" + String(i + 1) + ", MIDI channel 16 note " + String(36 + i) + " (" + nn(36 + i) + ") or CC " + String(24 + i) + ". Press again to stop."; };
  yes.setTooltip(title(1)); no.setTooltip(title(0)); bye.setTooltip("Silence: stop every voice, your sound in, and clear the hall (Esc)");
  yes.onClick = [this] { ctl.momentToggle(1); }; no.onClick = [this] { ctl.momentToggle(0); }; bye.onClick = [this] { ctl.panic(); down = false; };
  addAndMakeVisible(yes); addAndMakeVisible(no); addAndMakeVisible(bye);
  setMouseCursor(MouseCursor::NoCursor); setWantsKeyboardFocus(false);
  startTimerHz(30);
}
void Board::resized() {
  auto ys = yes.preferredSize(), ns = no.preferredSize(), bs = bye.preferredSize();
  yes.setBounds(24, 22, ys.getWidth(), ys.getHeight()); no.setBounds(getWidth() - 24 - ns.getWidth(), 22, ns.getWidth(), ns.getHeight());
  bye.setBounds((getWidth() - bs.getWidth()) / 2, getHeight() - 20 - bs.getHeight(), bs.getWidth(), bs.getHeight());
  bg = Image(); L.clear(); glyphScale = 0; layerW = 0; rulerPath.clear();
  dreadVis = -1; insetVis = -1; frameLayer = Image(); whoLayer = Image();
}
void Board::refresh() {
  bool y = ctl.momentOn(1), n = ctl.momentOn(0); float pr = ctl.riserProgress();
  if (y != yes.pressed) { yes.pressed = y; yes.repaint(); }
  if (n != no.pressed || pr != no.progress) { no.pressed = n; no.progress = pr; no.repaint(); }
}
static double rng(int& seed) { seed = (int)(((int64)seed * 16807) % 2147483647); return (seed - 1) / 2147483646.0; }

void Board::paintBg(int W, int H, float scale) {
  bg = Image(Image::ARGB, jmax(1, (int)std::round(W * scale)), jmax(1, (int)std::round(H * scale)), true); bgScale = scale;
  Graphics c(bg); c.addTransform(AffineTransform::scale(scale)); float w = (float)W, h = (float)H;
  ColourGradient g(Colour(0xff2b2019), w * .5f, h * .42f, Colour(0xff0f0b09), w * .5f + jmax(w, h) * .75f, h * .42f, true); g.addColour(.55, Colour(0xff1b1411));
  c.setGradientFill(g); c.fillRect(0.f, 0.f, w, h);
  // grain: long, slightly wandering strokes, like the figure in a lacquered board
  int seed = 9137; int n = (int)std::round(h / 2.6f);
  for (int i = 0; i < n; i++) {
    double y = rng(seed) * h, a = 1 + rng(seed) * 5, f = .002 + rng(seed) * .006, ph = rng(seed) * 6.28; bool dark = rng(seed) < .35;
    Colour col = dark ? Colours::black.withAlpha((float)(.06 + rng(seed) * .08)) : rgba(255, 232, 196, (float)(.010 + rng(seed) * .022));
    float lwid = (float)(.5 + rng(seed) * 1.3);
    Path p; for (double x = -10; x <= w + 10; x += 14) { double yy = y + a * std::sin(x * f + ph) + 2 * std::sin(x * f * 3.1 + ph * 2); if (x < 0) p.startNewSubPath((float)x, (float)yy); else p.lineTo((float)x, (float)yy); }
    c.setColour(col); c.strokePath(p, PathStrokeType(lwid));
  }
  // lacquer sheen and a faint sunburst rising behind Goodbye
  ColourGradient sh(rgba(255, 240, 210, .035f), 0, 0, Colours::black.withAlpha(.12f), w, h, false); sh.addColour(.45, rgba(255, 240, 210, 0));
  c.setGradientFill(sh); c.fillRect(0.f, 0.f, w, h);
  c.setColour(rgba(201, 168, 101, .07f));
  for (int i = 0; i <= 18; i++) {
    float t = PI_F + i * PI_F / 18, r1 = h * .14f, r2 = h * (i % 3 ? .26f : .32f);
    c.drawLine(w / 2 + std::cos(t) * r1, h + 4 + std::sin(t) * r1, w / 2 + std::cos(t) * r2, h + 4 + std::sin(t) * r2, 1.f);
  }
  Path arc; arc.addCentredArc(w / 2, h + 4, h * .14f, h * .14f, 0, -PI_F * .5f, PI_F * .5f, true); c.strokePath(arc, PathStrokeType(1.f));
  // inlay rule and corner stars
  c.setColour(rgba(201, 168, 101, .16f)); c.drawRect(Rectangle<float>(16.5f, 16.5f, w - 33, h - 33).expanded(.5f), 1.f);
  for (auto p : {Point<float>(16.5f, 16.5f), Point<float>(w - 16.5f, 16.5f), Point<float>(16.5f, h - 16.5f), Point<float>(w - 16.5f, h - 16.5f)}) {
    Path d; d.addRectangle(-2.5f, -2.5f, 5, 5); d.applyTransform(AffineTransform::rotation(PI_F / 4).translated(p)); c.setColour(rgba(201, 168, 101, .4f)); c.fillPath(d);
  }
  ColourGradient v(Colours::transparentBlack, w / 2, h / 2, Colours::black.withAlpha(.5f), w / 2 + jmax(w, h) * .72f, h / 2, true);
  float in = jmin(w, h) * .35f / (jmax(w, h) * .72f); v.clearColours(); v.addColour(0, Colours::transparentBlack); v.addColour(in, Colours::transparentBlack); v.addColour(1, Colours::black.withAlpha(.5f));
  c.setGradientFill(v); c.fillRect(0.f, 0.f, w, h);
}
void Board::layoutLetters(float w, float h) {
  fs = jmax(20.f, jmin(52.f, jmin(w / 28, h / 15.8f))); L.clear(); lw = w; lh = h;
  auto arc = [&](const char* s, float rx, float ry, float cy, float c0, int row) {
    float t0 = std::acos(c0); int n = (int)std::strlen(s);
    for (int i = 0; i < n; i++) {
      float th = PI_F - t0 - (PI_F - 2 * t0) * i / (n - 1), x = w / 2 + rx * w * std::cos(th), y = cy * h - ry * h * std::sin(th);
      L.push_back({(juce_wchar)s[i], x, y, std::atan2(ry * h * std::cos(th), rx * w * std::sin(th)), row});
    }
  };
  arc("ABCDEFGHIJKLM", .5f, .678f, 1.068f, .82f, 0); arc("NOPQRSTUVWXYZ", .46f, .591f, 1.171f, .804f, 1);
  sp = std::hypot(L[1].x - L[0].x, L[1].y - L[0].y);
  glyphScale = 0;
}
static float rulerY(float x, float h) { float u = (x - .5f) / .5f; return h * (.255f + .075f * u * u); }
// the voice's own x-to-pitch mapping (engine.js), so the rule marks real semitones
bool Board::ruler(BoardRuler& R) const {
  int s = ctl.sel();
  if (s == he::EBOW) { double r = ctl.P(he::P_EBOW_SLIDE); if (r == 0) r = 1; R = {-12 * (int)std::floor(r + .5), 12 * (int)std::floor(r + .5), r, 0, false}; return true; }
  if (s == he::STRUCK && (int)ctl.P(he::P_STRUCK_OBJECT) != 0) { R = {-18, 18, 0, 1, false}; return true; }
  if (s == he::HURDY && ctl.P(he::P_HURDY_MELODY) > .5) { R = {0, 12, 0, 2, true}; return true; }
  return false;
}
static double rX(const BoardRuler& R, double st) { return R.kind == 0 ? .5 + st / (24 * R.r) : R.kind == 1 ? .5 + st / 36 : st / 12; }
static double rSt(const BoardRuler& R, double x) { return R.kind == 0 ? (x - .5) * 24 * R.r : R.kind == 1 ? (x - .5) * 36 : std::floor(x * 12 + .5); }

void Board::ensureCaches(float w, float h, float scale, float physScale) {
  if (!candleCream.isValid()) {
    const int dim = 256;
    auto radial = [](int d, Colour inner, Colour outer) {
      Image im(Image::ARGB, d, d, true);
      Graphics g(im);
      float c = (d - 1) * .5f;
      ColourGradient cg(inner, c, c, outer, c + c, c, true);
      g.setGradientFill(cg); g.fillAll();
      return im;
    };
    candleCream = radial(dim, rgba(255, 196, 120, 1.f), rgba(255, 196, 120, 0));
    candleEmber = radial(dim, rgba(255, 110, 50, 1.f), rgba(255, 80, 30, 0));
    ringHaloCream = radial(dim, rgba(233, 211, 154, 1.f), rgba(233, 211, 154, 0));
    ringHaloEmber = radial(dim, rgba(255, 80, 28, 1.f), rgba(255, 80, 28, 0));
  }
  if (!pchSrcArt.isValid()) {
    pchSrcArt    = loadPngBin(BinaryData::celestial_png,        BinaryData::celestial_pngSize);
    pchSrcLines  = loadPngBin(BinaryData::celestial_lines_png,  BinaryData::celestial_lines_pngSize);
    pchSrcShadow = loadPngBin(BinaryData::celestial_shadow_png, BinaryData::celestial_shadow_pngSize);
  }
  // Exact on-screen size, including the current pressure pulse and the real
  // physical scale (not clamped to 2). Rebuild only when the integer pixel
  // size changes, then blit 1:1.
  const float phys = physScale > 0.f ? physScale : scale;
  const float s0 = jmax(.75f, jmin(1.4f, h / 540));
  const float sNow = s0 * (1.f + (down ? .06f * curP : 0.f));
  if (pchSrcArt.isValid()) {
    const float unit = PCH_UNIT * sNow;
    const int cw = jmax(1, (int) std::round(PCH_W * unit * phys));
    const int ch = jmax(1, (int) std::round(PCH_H * unit * phys));
    const int sw = jmax(1, (int) std::round((PCH_W + 2 * PCH_SH_PAD) * unit * phys));
    const int sh = jmax(1, (int) std::round((PCH_H + 2 * PCH_SH_PAD) * unit * phys));
    if (pchCacheW != cw || pchCacheH != ch || pchCacheScale != phys || !pchArt.isValid()) {
      pchArt    = flattenPchBody(scaleImageLanczos(pchSrcArt, cw, ch));
      pchLines  = scaleImageLanczos(pchSrcLines,  cw, ch);
      pchEmber  = tintByAlpha(pchLines, Colour((juce::uint8) 244, (juce::uint8) 162, (juce::uint8) 66));
      pchShadow = scaleImageLanczos(pchSrcShadow, sw, sh);
      pchBodyMask = makePchMask(pchArt);
      pchBodySil  = makePchSilhouette(pchBodyMask);
      const int radius = jmax(2, (int) std::round(8.f * sNow * phys));
      pchGlowPad    = radius + 2;
      pchLinesGlow  = bakeLineGlow(pchLines, Colour((juce::uint8) 233, (juce::uint8) 211, (juce::uint8) 154), radius);
      pchEmberGlow  = bakeLineGlow(pchEmber, Colour((juce::uint8) 255, (juce::uint8) 110, (juce::uint8) 36),  radius);
      pchCacheS     = sNow;
      pchCacheScale = phys;
      pchCacheW     = cw;
      pchCacheH     = ch;
    }
  }
  if (rulerPath.isEmpty() || layerW != w || layerH != h) {
    rulerPath.clear();
    for (int j = 0; j <= 60; j++) {
      float rx = j / 60.f * w, ry = rulerY(j / 60.f, h);
      if (j) rulerPath.lineTo(rx, ry); else rulerPath.startNewSubPath(rx, ry);
    }
  }
  if (L.size() && (glyphScale != scale || L[0].glow.isNull())) buildLetterGlyphs(scale);
  if (layerW != w || layerH != h || layerScale != scale) {
    layerW = w; layerH = h; layerScale = scale;
    dreadVis = -1; insetVis = -1;
    frameLayer = Image(); whoLayer = Image(); whoFade = -1; lastVoice = -1;
  }
}

void Board::buildLetterGlyphs(float scale) {
  auto lf = font(FELL, fs);
  const int blur = 24, blurLit = 34;
  for (auto& q : L) {
    GlyphArrangement ga; ga.addFittedText(lf, String::charToString(q.ch), -fs, -fs, 2 * fs, 2 * fs, Justification::centred, 1);
    q.path.clear(); ga.createPath(q.path); q.path.applyTransform(AffineTransform::rotation(q.r));
    auto pb = q.path.getBounds();
    int pad = blurLit + 4;
    q.glowOx = pad - pb.getX(); q.glowOy = pad - pb.getY();
    q.glowW = pb.getWidth() + 2 * pad; q.glowH = pb.getHeight() + 2 * pad;
    int W = jmax(1, (int)std::ceil(q.glowW * scale)), H = jmax(1, (int)std::ceil(q.glowH * scale));
    auto bake = [&](int radius) {
      Image im(Image::ARGB, W, H, true);
      Graphics g(im); g.addTransform(AffineTransform::scale(scale));
      Path gp = q.path; gp.applyTransform(AffineTransform::translation(q.glowOx, q.glowOy));
      DropShadow(Colour((juce::uint8)255, (juce::uint8)70, (juce::uint8)18), radius, {}).drawForPath(g, gp);
      return im;
    };
    q.glow = bake(blur);
    q.glowLit = bake(blurLit);
  }
  glyphScale = scale;
}

void Board::buildDreadLayer(float w, float h, float scale, float vis, float dark, float hole) {
  int W = jmax(1, (int)std::round(w * scale)), H = jmax(1, (int)std::round(h * scale));
  dreadLayer = Image(Image::ARGB, W, H, true);
  Graphics g(dreadLayer); g.addTransform(AffineTransform::scale(scale));
  g.setColour(rgba(4, 1, 1, dark)); g.fillRect(0.f, 0.f, w, h);
  float vr = jmax(w, h);
  ColourGradient vg(Colours::transparentBlack, w * .5f, h * .48f, rgba(6, 1, 0, .35f + .6f * vis), w * .5f + vr * (.72f - .1f * vis), h * .48f, true);
  vg.clearColours(); vg.addColour(0, Colours::transparentBlack);
  float inner = (hole * vr) / (vr * (.72f - .1f * vis));
  vg.addColour(jlimit(0.f, .999f, inner), Colours::transparentBlack);
  vg.addColour(1, rgba(6, 1, 0, .35f + .6f * vis));
  g.setGradientFill(vg); g.fillRect(0.f, 0.f, w, h);
  dreadVis = vis; dreadDark = dark; dreadHole = hole;
}

void Board::buildInsetLayer(float w, float h, float scale, float vis) {
  int W = jmax(1, (int)std::round(w * scale)), H = jmax(1, (int)std::round(h * scale));
  insetLayer = Image(Image::ARGB, W, H, true);
  Graphics g(insetLayer); g.addTransform(AffineTransform::scale(scale));
  float rad = 30.f + vis * 240.f;
  auto rr = Rectangle<float>(0, 0, w, h);
  for (int i = 0; i < 18; i++) {
    float t = (i + 1) / 18.f;
    g.setColour(rgba(8, 2, 1, vis * .82f * (1.f - t) * .18f));
    g.drawRoundedRectangle(rr.reduced(t * rad * .35f), jmax(1.f, 14 - t * 10), 6.f);
  }
  insetVis = vis;
}

void Board::buildFrameLayer(float w, float h, float scale) {
  int W = jmax(1, (int)std::round(w * scale)), H = jmax(1, (int)std::round(h * scale));
  frameLayer = Image(Image::ARGB, W, H, true);
  Graphics g(frameLayer); g.addTransform(AffineTransform::scale(scale));
  auto r = Rectangle<float>(0, 0, w, h);
  Path clip; clip.addRoundedRectangle(r, 14); g.reduceClipRegion(clip);
  for (int i = 0; i < 18; i++) { g.setColour(Colours::black.withAlpha(.55f * (1 - i / 18.f) * .12f)); g.drawRoundedRectangle(r.reduced(i * 2.f + 7), 14 - jmin(13.f, i * 2.f), 2.5f); }
  g.setColour(Colour(0xff120d0b)); g.drawRoundedRectangle(r.reduced(3.5f), 11, 5.f);
  g.setColour(rgba(201, 168, 101, .35f)); g.drawRoundedRectangle(r.reduced(6.5f), 8, 1.f);
  g.setColour(giltLo); g.drawRoundedRectangle(r.reduced(.5f), 14, 1.f);
}

Rectangle<int> Board::planchetteDirty(float px, float py, float vis) const {
  float w = (float)getWidth(), h = (float)getHeight();
  float X = px * w, Y = (1 - py) * h;
  float s = jmax(.75f, jmin(1.4f, h / 540)) * 1.1f;
  float u = PCH_UNIT * s;
  float sh = PCH_SH_PAD * u;
  float left  = X - PCH_WX * u - sh;
  float top   = Y - PCH_WY * u - sh;
  float right = X + (PCH_W - PCH_WX) * u + sh;
  float bot   = Y + (PCH_H - PCH_WY) * u + sh;
  float halo  = PCH_WR * u * 1.55f + 40.f * s;
  left = jmin(left, X - halo); top = jmin(top, Y - halo);
  right = jmax(right, X + halo); bot = jmax(bot, Y + halo);
  float crad = jmax(w, h) * (.32f - (vis ? .1f * vis : 0));
  left = jmin(left, X - crad); top = jmin(top, Y - crad);
  right = jmax(right, X + crad); bot = jmax(bot, Y + crad);
  return Rectangle<int>((int) std::floor(left), (int) std::floor(top),
                        (int) std::ceil(right - left), (int) std::ceil(bot - top));
}

Board::~Board() { vblank = {}; stopTimer(); }

void Board::hookVBlank() {
  if (isShowing() && getPeer() != nullptr) {
    if (vblank.isEmpty()) {
      stopTimer();
      vblank = VBlankAttachment(this, [this](double) { tickUi(); });
    }
    return;
  }
  if (!vblank.isEmpty()) vblank = {};
  if (!isTimerRunning()) startTimerHz(30);
}

void Board::visibilityChanged() { hookVBlank(); }
void Board::parentHierarchyChanged() { hookVBlank(); }
void Board::timerCallback() { tickUi(); }

void Board::tickUi() {
  auto look = dreadLook(proc.value(he::P_MACRO_DREAD), proc.outputLevel(), motionReduced(), Time::getMillisecondCounterHiRes());
  float g = look.glow * look.flick;
  if (yes.dread != look.vis || yes.dreadGlow != g) {
    yes.dread = no.dread = bye.dread = look.vis;
    yes.dreadGlow = no.dreadGlow = bye.dreadGlow = g;
    yes.repaint(); no.repaint(); bye.repaint();
  }
  float px, py;
  if (down) { px = curX; py = curY; } else if (hover) { px = hoverX; py = hoverY; } else { px = restX; py = restY; }
  float lvl = jmax(ctl.pkL, ctl.pkR);
  int wpos = proc.scopeW.load();
  bool trailOn = false;
  if (trail.size() > 1) trailOn = (Time::getMillisecondCounterHiRes() - trail.back().t) < 1600;
  float gL = look.vis ? look.glow * look.flick : 0;
  bool posCh = std::abs(px - lastPx) > 1e-4f || std::abs(py - lastPy) > 1e-4f || down != lastDown || hover != lastHover || std::abs(curP - lastP) > 1e-3f;
  bool glowCh = std::abs(gL - lastGL) > .012f || std::abs(look.vis - lastVis) > 1e-4f || std::abs(lvl - lastLvl) > .012f;
  bool scopeCh = wpos != lastScopeW;
  bool junkCh = ctl.sel() == he::JUNK && ctl.tm.junkN != lastJunkN;
  bool selCh = ctl.sel() != lastSel;
  bool trailCh = trailOn || lastTrail;
  if (!posCh && !glowCh && !scopeCh && !junkCh && !selCh && !trailCh) return;

  auto dirty = planchetteDirty(px, py, look.vis).getUnion(lastPlanchetteRect);
  int w = getWidth(), h = getHeight();
  dirty = dirty.getUnion({0, (int)(h * .53f - h * .25f), w, (int)(h * .5f)});
  if ((glowCh && look.vis > 0) || trailCh || junkCh || selCh) dirty = getLocalBounds();
  else if (posCh) {
    float reach = sp * 2.2f + fs + 40.f;
    auto around = [&](float nx, float ny) {
      float X = nx * w, Y = (1 - ny) * h;
      return Rectangle<int>((int)(X - reach), (int)(Y - reach), (int)(2 * reach), (int)(2 * reach));
    };
    dirty = dirty.getUnion(around(px, py)).getUnion(around(lastPx < 0 ? px : lastPx, lastPy < 0 ? py : lastPy));
  }
  lastPx = px; lastPy = py; lastP = curP; lastLvl = lvl; lastGL = gL; lastVis = look.vis;
  lastScopeW = wpos; lastJunkN = ctl.tm.junkN; lastSel = ctl.sel();
  lastDown = down; lastHover = hover; lastTrail = trailOn;
  lastPlanchetteRect = planchetteDirty(px, py, look.vis);
  dirty = dirty.expanded(2).getIntersection(getLocalBounds());
  if (dirty.isEmpty()) return;
  if (dirty.getWidth() >= w - 8 && dirty.getHeight() >= h - 8) repaint();
  else repaint(dirty);
}

void Board::paint(Graphics& g) {
  he_paint::ScopeT _pt(he_paint::Total);
  float w = (float)getWidth(), h = (float)getHeight();
  Path clip; clip.addRoundedRectangle(getLocalBounds().toFloat(), 14); g.reduceClipRegion(clip);
  const float physScale = (float) g.getInternalContext().getPhysicalPixelScaleFactor();
  float scale = jmin(2.f, physScale);
  {
    he_paint::ScopeT _pb(he_paint::Bg);
    if (!bg.isValid() || bgScale != scale) paintBg(getWidth(), getHeight(), scale);
    g.drawImage(bg, Rectangle<float>(0, 0, w, h));
  }
  if (L.empty() || lw != w || lh != h) layoutLetters(w, h);
  ensureCaches(w, h, scale, physScale);
  const auto& tm = ctl.tm; float lvl = jmax(ctl.pkL, ctl.pkR);
  auto look = dreadLook(proc.value(he::P_MACRO_DREAD), proc.outputLevel(), motionReduced(), Time::getMillisecondCounterHiRes());
  float fade = look.vis ? 1.f - look.vis * .82f : 1.f, gL = look.vis ? look.glow * look.flick : 0;
  float px, py; bool live = down;
  if (down) { px = curX; py = curY; } else if (hover) { px = hoverX; py = hoverY; } else { px = restX; py = restY; }
  if (down || hover) { restX = px; restY = py; }
  float X = px * w, Y = (1 - py) * h;
  BoardRuler R{}; bool hasR = false; double stNow = 0; int lit = -1;
  // Dread: cached wood darkening + vignette (depends on D only, not flicker)
  if (look.vis) {
    he_paint::ScopeT _pd(he_paint::Dread);
    if (dreadVis != look.vis || dreadDark != look.dark || dreadHole != look.hole || !dreadLayer.isValid())
      buildDreadLayer(w, h, scale, look.vis, look.dark, look.hole);
    g.drawImage(dreadLayer, Rectangle<float>(0, 0, w, h));
  }
  // candlelight pooling under the planchette, clipped to the glow circle
  {
    he_paint::ScopeT _pc(he_paint::Candle);
    float ca = live ? .08f + jmin(.22f, lvl * .6f) : .035f;
    if (look.vis) ca *= 1.f - look.vis * .35f;
    float crad = jmax(w, h) * (.32f - (look.vis ? .1f * look.vis : 0));
    Graphics::ScopedSaveState st(g);
    Path cclip; cclip.addEllipse(X - crad, Y - crad, 2 * crad, 2 * crad); g.reduceClipRegion(cclip);
    if (look.vis) {
      ColourGradient cg(rgba(255, 110, 50, ca * (.8f + .7f * look.glow)), X, Y, rgba(255, 80, 30, 0), X + crad, Y, true); g.setGradientFill(cg); g.fillRect(X - crad, Y - crad, 2 * crad, 2 * crad);
    } else {
      ColourGradient cg(rgba(255, 196, 120, ca), X, Y, rgba(255, 196, 120, 0), X + crad, Y, true); g.setGradientFill(cg); g.fillRect(X - crad, Y - crad, 2 * crad, 2 * crad);
    }
  }
  // the machine's own voice as a faint smoke line
  {
    he_paint::ScopeT _ps(he_paint::Scope);
    int wpos = proc.scopeW.load(); Path p;
    for (int i = 0; i < 1024; i += 4) { float s = proc.scope[(wpos - 1024 + i) & 2047]; float sx = i / 1020.f * w, sy = h * .53f - s * h * .2f; if (i) p.lineTo(sx, sy); else p.startNewSubPath(sx, sy); }
    g.setColour(rgba(201, 168, 101, jmin(.32f, .08f + lvl * .6f) * fade)); g.strokePath(p, PathStrokeType(1.2f));
  }
  // the brass rule
  {
    he_paint::ScopeT _pruler(he_paint::Ruler);
    hasR = ruler(R);
    g.setColour(rgba(201, 168, 101, .30f * fade)); g.strokePath(rulerPath, PathStrokeType(1.f));
    stNow = hasR ? rSt(R, px) : 0;
    if (hasR) {
      int span = R.hi - R.lo, every = w / span < 6 ? 2 : 1; auto mf = font(MONO, 12);
      for (int s = R.lo; s <= R.hi; s++) {
        bool oc = s % 12 == 0; if (!oc && s % every) continue;
        double tx = rX(R, s); if (tx < -.001 || tx > 1.001) continue;
        float Xs = (float)tx * w, Ys = rulerY((float)tx, h); bool nearNow = live && std::abs((R.q ? stNow : std::floor(stNow + .5)) - s) < .5;
        if (look.vis && (nearNow || oc)) {
          g.setColour(nearNow ? rgba(255, 150, 90, .7f + .3f * gL) : rgba(255, 120, 60, .35f + .45f * gL));
        } else g.setColour(nearNow ? rgba(246, 231, 191, .95f) : oc ? rgba(201, 168, 101, .7f) : rgba(201, 168, 101, .48f));
        if (look.vis && (nearNow || oc)) {
          // a cheap stand-in for the old 1px DropShadow: a soft pre-baked halo scaled to the tick
          float ha = .25f + .55f * gL, hr = (8 + 10 * gL) * 2.f;
          Graphics::ScopedSaveState st(g); g.setOpacity(ha);
          g.drawImage(ringHaloEmber, Rectangle<float>(Xs - hr, Ys - 2, 2 * hr, (oc ? 14.f : 8.f) + 4));
        }
        g.drawLine(Xs, Ys, Xs, Ys + (oc ? 14.f : 8.f), nearNow ? 2.f : 1.f);
        if (oc) {
          String t = s == 0 ? "0" : (s > 0 ? "+" : String::fromUTF8("\xe2\x88\x92")) + String(std::abs(s));
          float tw = textWidth(mf, t), tx2 = Xs < 24 ? Xs + 22 : Xs > w - 24 ? Xs - 22 - tw : Xs - tw / 2;
          if (Xs < 24) tx2 = Xs + 22;
          g.setColour(look.vis ? rgba(255, 160, 110, .45f + .5f * gL) : rgba(203, 189, 159, .8f));
          g.setFont(mf); g.drawSingleLineText(t, (int)std::round(tx2), (int)std::round(Ys - 3 - mf.getDescent()));
        }
      }
    } else { Path d; d.addRectangle(-3.f, -3.f, 6.f, 6.f); d.applyTransform(AffineTransform::rotation(PI_F / 4).translated(w / 2, rulerY(.5f, h))); g.setColour(rgba(201, 168, 101, .45f * fade)); g.fillPath(d); }
  }
  // dotted trail of the last strokes
  {
    he_paint::ScopeT _ptrail(he_paint::Trail);
    double now = Time::getMillisecondCounterHiRes();
    if (trail.size() > 1) {
      float acc = 0;
      for (size_t i = trail.size() - 1; i > 0; i--) {
        double age = (now - trail[i].t) / 1600; if (age > 1) break;
        float ax = trail[i].x * w, ay = (1 - trail[i].y) * h, bx = trail[i - 1].x * w, by = (1 - trail[i - 1].y) * h; acc += std::hypot(bx - ax, by - ay);
        if (acc < 8) continue; acc = 0;
        g.setColour(rgba(233, 211, 154, (float)(.55 * (1 - age) * fade))); g.fillEllipse(ax - 1.4f, ay - 1.4f, 2.8f, 2.8f);
      }
    }
  }
  // the letters: cached paths + pre-baked glow sprites (alpha only changes per frame)
  {
    he_paint::ScopeT _plet(he_paint::Letters);
    int best = -1; float bd = 1e9f;
    for (size_t i = 0; i < L.size(); i++) { float dd = std::hypot(L[i].x - X, L[i].y - Y); if (dd < bd) { bd = dd; best = (int)i; } }
    float reach = sp * 2.2f; lit = bd < sp * .75f ? best : -1;
    for (size_t i = 0; i < L.size(); i++) {
      auto& q = L[i]; float dq = std::hypot(q.x - X, q.y - Y), a0 = (q.row ? .20f : .26f) + jmin(.08f, lvl * .2f), a = a0;
      if (dq < reach) a = a0 + (live ? .42f : .14f) * (1 - dq / reach);
      auto dest = Rectangle<float>(q.x - q.glowOx, q.y - q.glowOy, q.glowW, q.glowH);
      if (look.vis) {
        float nearL = dq < reach ? 1 - dq / reach : 0, aL = jmin(1.f, a + look.vis * (.28f + .5f * gL) + nearL * .2f);
        int er = (int)std::round(236 + (255 - 236) * look.vis), eg2 = (int)std::round(225 + (96 - 225) * look.vis), eb = (int)std::round(200 + (40 - 200) * look.vis);
        float sa = jlimit(0.f, 1.f, .15f * look.vis + .7f * gL + .2f * nearL);
        const Image& spr = ((int)i == lit && live) ? q.glowLit : q.glow;
        { Graphics::ScopedSaveState st(g); g.setOpacity(sa); g.drawImage(spr, dest); }
        if ((int)i == lit && live) g.setColour(Colour((juce::uint8)er, (juce::uint8)jmin(255, eg2 + 40), (juce::uint8)jmin(255, eb + 40)));
        else g.setColour(rgba(er, eg2, eb, aL));
      } else if ((int)i == lit && live) {
        { Graphics::ScopedSaveState st(g); g.setOpacity(.9f); g.drawImage(q.glow, dest); }
        g.setColour(Colour(0xfff6e7bf));
      } else g.setColour(rgba(236, 225, 200, a));
      g.fillPath(q.path, AffineTransform::translation(q.x, q.y));
    }
  }
  // Junk Tray: the pieces chasing the magnet
  {
    he_paint::ScopeT _pjunk(he_paint::Junk);
    if (ctl.sel() == he::JUNK && tm.junkN > 0) {
      for (int i = 0; i < tm.junkN; i++) {
        g.setColour(i % 3 ? rgba(236, 225, 200, .6f * fade) : rgba(201, 168, 101, .85f * fade));
        float r = jmax(2.5f, tm.junk[i * 3 + 2] * jmin(w, h) * .8f); g.drawEllipse(tm.junk[i * 3] * w - r, (1 - tm.junk[i * 3 + 1]) * h - r, 2 * r, 2 * r, 1.4f);
      }
    }
  }
  // the planchette: cached celestial art, glass lens, play-glow and Dread ember
  {
    he_paint::ScopeT _pplan(he_paint::Planchette);
    float s = jmax(.75f, jmin(1.4f, h / 540)) * (1 + (live ? .06f * curP : 0)), pr = live ? curP : 0;
    const float unit = PCH_UNIT, wr = PCH_WR * unit, rCss = wr * s;
    // Blit the cached art 1:1 in physical pixels (dest size is cache / physScale).
    const float invP = 1.f / jmax(1e-6f, physScale);
    const float dw = pchArt.isValid() ? (float) pchArt.getWidth() * invP : PCH_W * unit * s;
    const float dh = pchArt.isValid() ? (float) pchArt.getHeight() * invP : PCH_H * unit * s;
    const float dx = std::round((X - PCH_WX / PCH_W * dw) * physScale) * invP;
    const float dy = std::round((Y - PCH_WY / PCH_H * dh) * physScale) * invP;
    const float shs = pchShadow.isValid() && pchArt.isValid()
                        ? .5f * ((float) pchShadow.getWidth() * invP - dw)
                        : PCH_SH_PAD * unit * s;
    auto dest = Rectangle<float>(dx, dy, dw, dh);
    float gl = live ? .55f + .45f * pr + jmin(.4f, lvl) : .25f;
    bool ember = look.vis > 0; float ev = ember ? look.vis : 0, eg = ember ? look.glow * look.flick : 0;
    if (ember) gl = jmax(gl, .35f + .65f * eg);

    // Magnify what is already under the window (cached bg, dread, nearby letters).
    if (pchArt.isValid()) {
      Graphics::ScopedSaveState st(g);
      Path hole; hole.addEllipse(X - rCss * .99f, Y - rCss * .99f, 2 * rCss * .99f, 2 * rCss * .99f);
      g.reduceClipRegion(hole);
      g.addTransform(AffineTransform::scale(1.14f, 1.14f, X, Y));
      if (bg.isValid()) g.drawImage(bg, Rectangle<float>(0, 0, w, h));
      if (look.vis && dreadLayer.isValid()) g.drawImage(dreadLayer, Rectangle<float>(0, 0, w, h));
      float reach = sp * 2.2f;
      for (size_t i = 0; i < L.size(); i++) {
        auto& q = L[i]; float dq = std::hypot(q.x - X, q.y - Y);
        if (dq > rCss * 3.f + reach) continue;
        float a0 = (q.row ? .20f : .26f) + jmin(.08f, lvl * .2f), a = a0;
        if (dq < reach) a = a0 + (live ? .42f : .14f) * (1 - dq / reach);
        if (look.vis) {
          float nearL = dq < reach ? 1 - dq / reach : 0, aL = jmin(1.f, a + look.vis * (.28f + .5f * gL) + nearL * .2f);
          int er = (int) std::round(236 + (255 - 236) * look.vis), eg2 = (int) std::round(225 + (96 - 225) * look.vis), eb = (int) std::round(200 + (40 - 200) * look.vis);
          if ((int) i == lit && live) g.setColour(Colour((juce::uint8) er, (juce::uint8) jmin(255, eg2 + 40), (juce::uint8) jmin(255, eb + 40)));
          else g.setColour(rgba(er, eg2, eb, aL));
        } else if ((int) i == lit && live) g.setColour(Colour(0xfff6e7bf));
        else g.setColour(rgba(236, 225, 200, a));
        g.fillPath(q.path, AffineTransform::translation(q.x, q.y));
      }
    }

    // Letters leave a low fill-colour alpha on the Graphics context;
    // reset it or the planchette blit is composited at ~25-60% and the
    // cream linework goes grey.
    g.setOpacity(1.f);
    g.setColour(Colours::white);
    if (pchShadow.isValid())
      blit1to1(g, pchShadow, dx - shs, dy - shs, physScale);

    auto bodyXform = [&]() {
      if (!pchBodyMask.isValid() || pchBodyMask.getWidth() <= 0) return AffineTransform();
      return AffineTransform::scale(dw / (float) pchBodyMask.getWidth(), dh / (float) pchBodyMask.getHeight()).translated(dx, dy);
    };
    // Opaque body underlay (clip + fill, not image alpha) so the board cannot show through.
    if (pchBodyMask.isValid()) {
      Graphics::ScopedSaveState st(g);
      g.reduceClipRegion(pchBodyMask, bodyXform());
      g.setColour(Colour(0xff101010));
      g.fillRect(dest);
    }
    g.setOpacity(1.f);
    g.setColour(Colours::white);
    if (pchArt.isValid())
      blit1to1(g, pchArt, dx, dy, physScale);

    // Glow may sit in the glass and on the rim/linework, but not out on the board.
    auto clipBodyMinusHole = [&](Graphics& gg) {
      if (pchBodyMask.isValid()) gg.reduceClipRegion(pchBodyMask, bodyXform());
      Path outside;
      outside.addRectangle(dx - dw, dy - dh, dw * 3, dh * 3);
      outside.addEllipse(X - rCss, Y - rCss, 2 * rCss, 2 * rCss);
      outside.setUsingNonZeroWinding(false);
      gg.reduceClipRegion(outside);
    };
    auto clipBodySil = [&](Graphics& gg) {
      const Image& sil = pchBodySil.isValid() ? pchBodySil : pchBodyMask;
      if (sil.isValid()) {
        if (pchBodyMask.isValid() && pchBodyMask.getWidth() > 0)
          gg.reduceClipRegion(sil, AffineTransform::scale(dw / (float) pchBodyMask.getWidth(), dh / (float) pchBodyMask.getHeight()).translated(dx, dy));
      }
    };
    if (live || ev) {
      Graphics::ScopedSaveState st(g);
      clipBodySil(g);
      if (ember && ev > 0) {
        float aL = jmin(1.f, ev * (.45f + .7f * (eg > 0 ? eg : ev)));
        const float gpad = (float) pchGlowPad / jmax(1e-6f, physScale);
        if (pchEmberGlow.isValid()) { Graphics::ScopedSaveState st2(g); g.setOpacity(aL); blit1to1(g, pchEmberGlow, dx - gpad, dy - gpad, physScale); }
        if (pchEmber.isValid()) {
          { Graphics::ScopedSaveState st2(g); g.setOpacity(aL); blit1to1(g, pchEmber, dx, dy, physScale); }
          { Graphics::ScopedSaveState st2(g); g.setOpacity(aL * .7f); blit1to1(g, pchEmber, dx, dy, physScale); }
        }
      } else if (live) {
        float aL = .35f + .35f * gl;
        const float gpad = (float) pchGlowPad / jmax(1e-6f, physScale);
        if (pchLinesGlow.isValid()) { Graphics::ScopedSaveState st2(g); g.setOpacity(aL); blit1to1(g, pchLinesGlow, dx - gpad, dy - gpad, physScale); }
        if (pchLines.isValid()) { Graphics::ScopedSaveState st2(g); g.setOpacity(aL); blit1to1(g, pchLines, dx, dy, physScale); }
      }
    }

    // Rim stroke + soft halo, clipped to the body so it cannot bloom onto the board.
    // The hole is excluded so the letter stays readable; in-lens light is the glass fill below.
    {
      Graphics::ScopedSaveState st(g);
      clipBodyMinusHole(g);
      float blur = (live ? 8 + 14 * pr : 3) + (ember ? 6 + 12 * eg : 0);
      float haloA = ember ? jmin(1.f, .35f + .55f * gl) : jmin(1.f, gl * .85f);
      Path ring; ring.addEllipse(X - rCss, Y - rCss, 2 * rCss, 2 * rCss);
      Path ringS; PathStrokeType(1.6f * s).createStrokedPath(ringS, ring);
      Colour haloCol = ember ? rgba(255, 80, 28, haloA) : rgba(233, 211, 154, haloA);
      DropShadow(haloCol, jmax(1, (int) std::round(blur)), {0, 0}).drawForPath(g, ringS);
      if (ember) g.setColour(live ? Colour(0xffffb08a) : rgba(255, 140, 80, .45f + .4f * ev));
      else g.setColour(live ? Colour(0xfff1dfae) : rgba(233, 211, 154, .55f));
      g.fillPath(ringS);
    }

    // Light glass fill + specular highlight in the window.
    {
      float ha = (live ? .10f : .05f) + (ember ? .08f * ev + .06f * eg : 0);
      ColourGradient lg(Colours::transparentWhite, X - wr * .28f * s, Y - wr * .35f * s,
                        Colours::transparentWhite, X - wr * .28f * s + wr * s, Y - wr * .35f * s, true);
      lg.clearColours();
      if (ember) {
        lg.addColour(0,    rgba(255, 190, 140, ha + .06f));
        lg.addColour(.55f, rgba(255, 120,  60, ha * .4f));
        lg.addColour(1,    rgba(255,  90,  30, 0));
      } else {
        lg.addColour(0,    rgba(255, 250, 230, ha + .05f));
        lg.addColour(.5f,  rgba(210, 225, 230, ha * .45f));
        lg.addColour(1,    rgba(255, 246, 220, 0));
      }
      const float rr = rCss - .35f;
      g.setGradientFill(lg);
      g.fillEllipse(X - rr, Y - rr, 2 * rr, 2 * rr);
      Path hl; hl.addCentredArc(X, Y, rCss * .72f, rCss * .72f, 0, PI_F * 1.1f, PI_F * 1.45f, true);
      g.setColour(ember ? rgba(255, 220, 180, .45f) : rgba(255, 250, 235, .5f));
      g.strokePath(hl, PathStrokeType(1.3f * s));
      {
        Graphics::ScopedSaveState st(g);
        const float cx = X - wr * .22f * s, cy = Y - wr * .32f * s, rx = wr * .14f * s, ry = wr * .07f * s;
        g.addTransform(AffineTransform::rotation(-0.5f, cx, cy));
        g.setColour(ember ? rgba(255, 235, 210, .16f) : rgba(255, 255, 250, .18f));
        g.fillEllipse(cx - rx, cy - ry, 2 * rx, 2 * ry);
      }
    }
  }
  // CSS-style inset shadow (cached; skipped at Dread 0)
  {
    he_paint::ScopeT _pinset(he_paint::Inset);
    if (look.vis) {
      float rad = 30.f + look.vis * 240.f;
      auto rr = getLocalBounds().toFloat();
      for (int i = 0; i < 18; i++) {
        float t = (i + 1) / 18.f;
        g.setColour(rgba(8, 2, 1, look.vis * .82f * (1.f - t) * .18f));
        g.drawRoundedRectangle(rr.reduced(t * rad * .35f), jmax(1.f, 14 - t * 10), 6.f);
      }
    }
  }
  // the reading in the corner
  String hlt;
  if (live) {
    hlt = (lit >= 0 ? String::charToString(L[(size_t)lit].ch) : String::fromUTF8("\xc2\xb7"));
    if (hasR) { String sign = stNow > 0 ? "+" : stNow < 0 ? String::fromUTF8("\xe2\x88\x92") : String(); hlt += String::fromUTF8("  \xc2\xb7  ") + sign + (R.q ? String((int)std::abs(stNow)) : String(std::abs(stNow), 1)) + " st"; }
    else hlt += String::fromUTF8("  \xc2\xb7  x ") + String((int)std::floor(px * 100 + .5)) + "  y " + String((int)std::floor(py * 100 + .5));
  }
  reading = hlt;
}

void Board::paintOverChildren(Graphics& g) {
  he_paint::ScopeT _pover(he_paint::Over);
  float w = (float)getWidth(), h = (float)getHeight(); auto r = getLocalBounds().toFloat();
  auto look = dreadLook(proc.value(he::P_MACRO_DREAD), proc.outputLevel(), motionReduced(), Time::getMillisecondCounterHiRes());
  { Graphics::ScopedSaveState fadeWho(g);
  if (look.vis) g.setOpacity(1.f - look.vis * .88f);
  int s = ctl.sel(); String who = String(ROMAN[s]) + String::fromUTF8(" \xc2\xb7 ") + SRC[s].n;
  float ww = jmin(480.f, w * .46f); auto wr = Rectangle<float>((w - ww) / 2, 26, ww, 22);
  text(g, who, wr, font(SERIF_SEMI, 17), live, Justification::centredTop);
  { AttributedString a; a.append(String(CharPointer_UTF8(SRC[s].h)), font(SERIF_ITAL, 14), dim); a.setJustification(Justification::centredTop); a.setWordWrap(AttributedString::byWord); TextLayout tl; tl.createLayout(a, ww); tl.draw(g, Rectangle<float>((w - ww) / 2, 26 + 22 + 4 - 2, ww, 40)); }
  String ax = SRC[s].x, ay = SRC[s].y;
  if (s == he::EBOW) { double rr = ctl.P(he::P_EBOW_SLIDE); ax = "Slide, " + String(std::floor(rr * 10 + .5) / 10, std::floor(rr * 10 + .5) / 10 == std::floor(rr) ? 0 : 1) + " oct either side"; }
  if (s == he::STRUCK) ax = (int)ctl.P(he::P_STRUCK_OBJECT) == 0 ? "Ruler overhang (pitch)" : String::fromUTF8("Pitch, 1\xc2\xbd oct either side");
  if (s == he::HURDY) ax = ctl.P(he::P_HURDY_MELODY) > .5 ? "Melody, one octave" : "Melody (switch Melody on X on)";
  auto mf = font(MONO, 13);
  if (ax.isNotEmpty()) text(g, String::fromUTF8("x \xc2\xb7 ") + ax, Rectangle<float>(28, h - 24 - 18, jmax(40.f, w * .5f - 150 - 28), 18), mf, bone2);
  if (ay.isNotEmpty()) {
    Graphics::ScopedSaveState st(g); g.addTransform(AffineTransform::rotation(-PI_F / 2).translated(22, h * .74f));
    g.setColour(bone2); g.setFont(mf); g.drawSingleLineText(String::fromUTF8("y \xc2\xb7 ") + ay, 0, (int)mf.getAscent());
  }
  String pr = "Pressure " + String((int)std::floor((down ? curP : (float)ctl.basePr) * 100 + .5f)) + "%";
  float pw = textWidth(mf, pr), rw = reading.isNotEmpty() ? textWidth(mf, reading) : 0;
  text(g, pr, Rectangle<float>(w - 28 - pw - 2, h - 24 - 18, pw + 2, 18), mf, live, Justification::centredRight);
  if (reading.isNotEmpty()) text(g, reading, Rectangle<float>(w - 28 - pw - 14 - rw - 2, h - 24 - 18, rw + 2, 18), mf, live, Justification::centredRight);
  }
  Path clip; clip.addRoundedRectangle(r, 14); g.reduceClipRegion(clip);
  for (int i = 0; i < 18; i++) { g.setColour(Colours::black.withAlpha(.55f * (1 - i / 18.f) * .12f)); g.drawRoundedRectangle(r.reduced(i * 2.f + 7), 14 - jmin(13.f, i * 2.f), 2.5f); }
  g.setColour(Colour(0xff120d0b)); g.drawRoundedRectangle(r.reduced(3.5f), 11, 5.f);
  g.setColour(rgba(201, 168, 101, .35f)); g.drawRoundedRectangle(r.reduced(6.5f), 8, 1.f);
  g.setColour(giltLo); g.drawRoundedRectangle(r.reduced(.5f), 14, 1.f);
}

float Board::pressure(const MouseEvent& e) const {
  if (e.isPressureValid() && e.pressure > 0 && e.source.isPen()) return e.pressure;
  if (e.isPressureValid() && e.source.isTouch() && e.pressure > 0 && e.pressure != .5f) return e.pressure;
  return e.mods.isShiftDown() ? 1.f : e.mods.isAltDown() ? .3f : (float)ctl.basePr;
}
void Board::point(const MouseEvent& e) {
  curX = jlimit(0.f, 1.f, e.position.x / (float)getWidth()); curY = jlimit(0.f, 1.f, 1 - e.position.y / (float)getHeight()); curP = pressure(e);
}
void Board::mouseDown(const MouseEvent& e) {
  if (e.mods.isPopupMenu() || down) return;
  point(e); down = true; ctl.padDown = true; trail.clear(); ctl.gesture('d', curX, curY, curP);
}
void Board::mouseDrag(const MouseEvent& e) {
  if (!down) return; point(e); hoverX = curX; hoverY = curY;
  double now = Time::getMillisecondCounterHiRes(); trail.push_back({curX, curY, now}); if (trail.size() > 90) trail.erase(trail.begin());
  if (now - lastSend > 6) { lastSend = now; ctl.gesture('n', curX, curY, curP); }   // gliding moves (1.0.4)
}
void Board::mouseUp(const MouseEvent&) { if (!down) return; down = false; ctl.padDown = false; ctl.gesture('u', 0, 0, 0); }
void Board::mouseMove(const MouseEvent& e) { hoverX = jlimit(0.f, 1.f, e.position.x / (float)getWidth()); hoverY = jlimit(0.f, 1.f, 1 - e.position.y / (float)getHeight()); hover = true; }
void Board::mouseExit(const MouseEvent&) { hover = false; }
void Board::mouseWheelMove(const MouseEvent&, const MouseWheelDetails& w) {
  if (w.deltaY == 0) return;
  ctl.basePr = jlimit(.05, 1.0, ctl.basePr + (w.deltaY > 0 ? .05 : -.05));
  if (down) { curP = (float)ctl.basePr; ctl.gesture('n', curX, curY, curP); }
}
