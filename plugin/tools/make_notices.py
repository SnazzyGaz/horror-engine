#!/usr/bin/env python3
# Horror Engine · Séance: writes THIRD_PARTY_NOTICES.txt from the licence files of the code that is actually
# linked into the plugin. Horror Engine by Garyck Arntzen (https://x.com/_mintydoge). GNU AGPLv3.
#
#   python3 tools/make_notices.py <JUCE-8.0.15> <clap-juce-extensions> [mingw-w64 copyright file] [gcc copyright file]
#
# The list was checked against the Windows binaries (strings and PE imports): FLAC, Ogg Vorbis, libpng, IJG jpeg,
# zlib, HarfBuzz, SheenBidi and the VST3 SDK are compiled in from JUCE; the CLAP build adds CLAP, clap-helpers and
# clap-juce-extensions; MinGW builds link the mingw-w64 runtime, winpthreads and the GCC runtime statically.
# Not linked (so not listed): GLEW/Mesa (juce_opengl), CHOC/QuickJS (juce_javascript), LV2, ASIO, Oboe, AAX, Box2D.
import os, sys

juce, cje = sys.argv[1], sys.argv[2]
mingw = sys.argv[3] if len(sys.argv) > 3 else '/usr/share/doc/mingw-w64-x86-64-dev/copyright'
gcc = sys.argv[4] if len(sys.argv) > 4 else '/usr/share/doc/gcc-mingw-w64-base/copyright'
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
M = os.path.join(juce, 'modules')

def rd(p): return open(p, encoding='utf-8', errors='replace').read().replace('\r\n', '\n').replace('\r', '\n').strip('\n')
def lines(p, a, b): return '\n'.join(rd(p).split('\n')[a - 1:b]).strip('\n')
def section(text, start, stop):
    L = text.split('\n'); i = L.index(start); j = next(k for k in range(i + 1, len(L)) if L[k] == stop); return '\n'.join(L[i:j]).strip('\n')

out = []
def part(title, used, body):
    out.append('=' * 78 + '\n' + title + '\n' + used + '\n' + '-' * 78 + '\n\n' + body + '\n\n')

head = """Horror Engine · Séance (VST3 / CLAP) - third-party notices

Horror Engine (c) 2026 Garyck Arntzen (https://x.com/_mintydoge)
Source: https://github.com/SnazzyGaz/horror-engine
Horror Engine is free software under the GNU Affero General Public License version 3 (see LICENSE). The complete
corresponding source of this plugin is in the source zip that comes with it and at the address above.

The plugin is built with the JUCE framework, used under the AGPLv3 (JUCE is dual-licensed under the AGPLv3 and the
commercial JUCE licence; this build uses the AGPLv3). JUCE (c) Raw Material Software Limited. https://juce.com
The full AGPLv3 text is in LICENSE.

The plugin contains the following third-party code. Each section names what it is, where it is used, and gives its
licence text in full. Fonts are listed last.

"""
part('FLAC (libFLAC)', 'Used by: JUCE FlacAudioFormat (Your sound in: reading FLAC files). BSD licence.', rd(os.path.join(M, 'juce_audio_formats/codecs/flac/Flac Licence.txt')))
part('Ogg Vorbis (libogg, libvorbis)', 'Used by: JUCE OggVorbisAudioFormat (Your sound in: reading Ogg files). BSD licence.', rd(os.path.join(M, 'juce_audio_formats/codecs/oggvorbis/Ogg Vorbis Licence.txt')))
part('libpng', 'Used by: JUCE PNGImageFormat (images). PNG Reference Library License version 2 / libpng licence.', rd(os.path.join(M, 'juce_graphics/image_formats/pnglib/LICENSE')))
part('Independent JPEG Group jpeg library', 'Used by: JUCE JPEGImageFormat. This software is based in part on the work of the Independent JPEG Group.',
     section(rd(os.path.join(M, 'juce_graphics/image_formats/jpglib/README')), 'LEGAL ISSUES', 'REFERENCES'))
part('zlib', 'Used by: JUCE (PNG images, zip and gzip streams). zlib licence.', lines(os.path.join(M, 'juce_core/zip/zlib/zlib.h'), 1, 29).lstrip('/* ').rstrip('*/').strip('\n'))
part('HarfBuzz', 'Used by: JUCE text shaping. "Old MIT" licence.', rd(os.path.join(M, 'juce_graphics/fonts/harfbuzz/COPYING')))
part('SheenBidi', 'Used by: JUCE bidirectional text. Apache License 2.0 (SheenBidi ships no NOTICE file).', rd(os.path.join(M, 'juce_graphics/unicode/sheenbidi/LICENSE')))
part('VST 3 SDK', 'Used by: the VST3 plugin (via JUCE). MIT licence. VST is a registered trademark of Steinberg Media Technologies GmbH.', rd(os.path.join(M, 'juce_audio_processors_headless/format_types/VST3_SDK/LICENSE.txt')))
part('CLAP', 'Used by: the CLAP plugin. MIT licence.', rd(os.path.join(cje, 'clap-libs/clap/LICENSE')))
part('clap-helpers', 'Used by: the CLAP plugin. MIT licence.', rd(os.path.join(cje, 'clap-libs/clap-helpers/LICENSE')))
part('clap-juce-extensions', 'Used by: the CLAP plugin (the JUCE to CLAP wrapper). MIT licence.', rd(os.path.join(cje, 'LICENSE.md')))
part('GCC runtime libraries (libstdc++, libgcc)', 'Used by: Windows builds made with MinGW-w64 GCC, linked statically. GPLv3 with the GCC Runtime Library\nException, which allows them to be combined with this plugin under its own licence. The Exception text:',
     section(rd(gcc), 'GCC RUNTIME LIBRARY EXCEPTION', 'libquadmath/*.[hc]:'))
part('mingw-w64 runtime and winpthreads', 'Used by: Windows builds made with MinGW-w64 (C runtime startup code, gdtoa, winpthreads), linked statically.\nThe complete copyright file of the mingw-w64 package used for the build follows; the parts compiled into the\nplugin are the mingw-w64-crt (ZPL-2.1, public domain, gdtoa: Lucent/David Gay) and winpthreads (expat/MIT,\nBSD-3-clause) sections. Header-only parts (LGPL/GPL headers) contribute declarations only.', rd(mingw))
part('Fonts: IM FELL English SC, Crimson Pro, IBM Plex Mono', 'Embedded in the plugin (fonts/, see OFL.txt for the copyright lines). SIL Open Font License 1.1:',
     rd(os.path.join(root, 'OFL.txt')))
open(os.path.join(root, 'THIRD_PARTY_NOTICES.txt'), 'w', encoding='utf-8').write(head + ''.join(out).rstrip('\n') + '\n')
print('wrote THIRD_PARTY_NOTICES.txt,', sum(len(x) for x in out) // 1024, 'KB')
