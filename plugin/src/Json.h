// JSON written the way the web app's JSON.stringify writes it (key order kept, JavaScript number formatting), so files
// saved by the plugin and by the browser look alike. Horror Engine by Garyck Arntzen. GNU AGPLv3.
#pragma once
#include <juce_core/juce_core.h>
#include <cmath>
#include <cstdio>
#include <cstdlib>

namespace hejson {

// Number.prototype.toString for a double
inline juce::String num(double v) {
  if (!std::isfinite(v)) return "null";
  if (v == 0) return "0";
  if (v == std::floor(v) && std::fabs(v) < 1e21) { char b[40]; std::snprintf(b, sizeof b, "%.0f", v); return b; }
  char b[40]; int prec = 1;
  for (; prec <= 17; prec++) { std::snprintf(b, sizeof b, "%.*e", prec - 1, v); if (std::strtod(b, nullptr) == v) break; }
  // b = "-d.ddde+XX": split into sign, digits and exponent
  juce::String s(b), sign; if (s.startsWithChar('-')) { sign = "-"; s = s.substring(1); }
  int ePos = s.indexOfChar('e'); int e = s.substring(ePos + 1).getIntValue();
  juce::String digits = s.substring(0, ePos).removeCharacters(".");
  int k = digits.length(), n = e + 1;
  juce::String out;
  if (k <= n && n <= 21) out = digits + juce::String::repeatedString("0", n - k);
  else if (0 < n && n <= 21) out = digits.substring(0, n) + "." + digits.substring(n);
  else if (-6 < n && n <= 0) out = "0." + juce::String::repeatedString("0", -n) + digits;
  else out = digits.substring(0, 1) + (k > 1 ? "." + digits.substring(1) : juce::String()) + "e" + (n - 1 >= 0 ? "+" : "-") + juce::String(std::abs(n - 1));
  return sign + out;
}

inline juce::String str(const juce::String& s) {
  juce::String o = "\"";
  for (auto p = s.getCharPointer(); !p.isEmpty(); ++p) {
    juce::juce_wchar c = *p;
    if (c == '"') o << "\\\""; else if (c == '\\') o << "\\\\"; else if (c == '\n') o << "\\n"; else if (c == '\r') o << "\\r"; else if (c == '\t') o << "\\t";
    else if (c < 32) { char b[8]; std::snprintf(b, sizeof b, "\\u%04x", (int)c); o << b; }
    else o << juce::String::charToString(c);
  }
  return o + "\"";
}

// indent 0: compact, as JSON.stringify(x); indent 1: JSON.stringify(x, null, 1)
inline void write(const juce::var& v, juce::String& o, int indent, int level) {
  juce::String nl = indent ? "\n" : "", pad = juce::String::repeatedString(" ", indent * (level + 1)), pad0 = juce::String::repeatedString(" ", indent * level);
  if (v.isVoid() || v.isUndefined()) { o << "null"; return; }
  if (v.isBool()) { o << ((bool)v ? "true" : "false"); return; }
  if (v.isInt() || v.isInt64() || v.isDouble()) { o << num((double)v); return; }
  if (v.isString()) { o << str(v.toString()); return; }
  if (auto* a = v.getArray()) {
    if (a->isEmpty()) { o << "[]"; return; }
    o << "[" << nl;
    for (int i = 0; i < a->size(); i++) { o << pad; write((*a)[i], o, indent, level + 1); if (i + 1 < a->size()) o << ","; o << nl; }
    o << pad0 << "]"; return;
  }
  if (auto* d = v.getDynamicObject()) {
    auto& props = d->getProperties();
    int n = 0; for (auto& p : props) if (!p.value.isUndefined()) n++;
    if (!n) { o << "{}"; return; }
    o << "{" << nl; int i = 0;
    for (auto& p : props) {
      if (p.value.isUndefined()) continue;
      o << pad << str(p.name.toString()) << ":" << (indent ? " " : ""); write(p.value, o, indent, level + 1);
      if (++i < n) o << ","; o << nl;
    }
    o << pad0 << "}"; return;
  }
  o << "null";
}
inline juce::String stringify(const juce::var& v, int indent = 0) { juce::String o; write(v, o, indent, 0); return o; }

inline juce::var obj() { return juce::var(new juce::DynamicObject()); }
inline void set(juce::var& o, const char* k, const juce::var& v) { o.getDynamicObject()->setProperty(k, v); }

}  // namespace hejson
