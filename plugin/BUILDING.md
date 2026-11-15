# Building Horror Engine · Séance

You need CMake 3.22+, Ninja (or Visual Studio), [JUCE](https://github.com/juce-framework/JUCE) 8.0.15 (pinned: CMake stops on another version unless you pass `-DHE_ALLOW_OTHER_JUCE=ON`) and [clap-juce-extensions](https://github.com/free-audio/clap-juce-extensions) (with its submodules; pinned to commit 6bde108, CLAP 1.2.7). Leave out `-DJUCE_DIR` and `-DCJE_DIR` and CMake fetches both pinned versions itself. On Windows (MSVC and MinGW) CMake applies `patches/juce-8.0.15-taskdialog.patch` to JUCE, so the DLL looks up `TaskDialogIndirect` at run time instead of importing it; on MinGW it also applies `patches/juce-8.0.15-mingw.patch` (compiler compatibility). If using a local `JUCE_DIR`, apply those patches there yourself before configuring.

```
git clone --depth 1 -b 8.0.15 https://github.com/juce-framework/JUCE.git
git clone https://github.com/free-audio/clap-juce-extensions.git
cd clap-juce-extensions && git checkout 6bde108329ff9fc24404b79b8b397261a75cf6a8 && git submodule update --init --recursive
```

## Windows with Visual Studio 2022 or later

```
cmake -B build -A x64
# CMake picks the installed Visual Studio; JUCE and clap-juce-extensions are fetched and patched automatically.
cmake --build build --config Release --target HorrorEngine_VST3 HorrorEngine_CLAP
```

## Windows binaries cross-compiled on Linux (how this release was made)

JUCE 8 refuses MinGW, so patch it first; the patch only marks MinGW as a 64-bit Windows compiler and works around four
spots where JUCE relies on MSVC (`__uuidof` on a variable, two SDK constants, `__cpuid`, jpeglib's `boolean`).
The separate TaskDialog patch is shared by MSVC and MinGW:

```
cd JUCE
git apply path/to/plugin/patches/juce-8.0.15-taskdialog.patch
git apply path/to/plugin/patches/juce-8.0.15-mingw.patch
```

MinGW-w64 needs headers new enough for JUCE 8 (`d2d1_3.h` with `ID2D1SpriteBatch`, `dcomp.h`,
`ISelectionProvider2` in `uiautomationcore.h`): mingw-w64 12 (Debian trixie) is too old, 13.0.0 works. Either install
current [mingw-w64-headers](https://github.com/mingw-w64/mingw-w64) over your distribution's (keep its winpthreads
headers), or leave the system alone and build against a private overlay (how 1.0.1 and 1.0.2 were built):

```
# overlay = the distribution's headers with the mingw-w64 13.0.0 headers copied on top
cp -rL /usr/x86_64-w64-mingw32/include ~/mingw-include-13
(cd mingw-w64-13.0.0/mingw-w64-headers && ./configure --host=x86_64-w64-mingw32 --prefix=$PWD/out --with-default-msvcrt=msvcrt && make install)
cp -r mingw-w64-13.0.0/mingw-w64-headers/out/include/. ~/mingw-include-13/
G=/usr/lib/gcc/x86_64-w64-mingw32/14-posix; O=~/mingw-include-13
CXXINC="-nostdinc -nostdinc++ -isystem $G/include/c++ -isystem $G/include/c++/x86_64-w64-mingw32 -isystem $G/include/c++/backward -isystem $G/include -isystem $G/include-fixed -isystem $O"
CINC="-nostdinc -isystem $G/include -isystem $G/include-fixed -isystem $O"
# then add  -DCMAKE_CXX_FLAGS="$CXXINC" -DCMAKE_C_FLAGS="$CINC"  to the cmake line below
```
Then:

```
cmake -B build-win -G Ninja -DCMAKE_TOOLCHAIN_FILE=cmake/mingw-w64.cmake -DCMAKE_BUILD_TYPE=Release \
      -DJUCE_DIR=path/to/JUCE -DCJE_DIR=path/to/clap-juce-extensions
ninja -C build-win HorrorEngine_VST3 HorrorEngine_CLAP
```

`src/mingw_guids.c` defines two GUIDs older MinGW import libraries lack. The DLLs link libstdc++, libgcc and winpthread
statically, so they depend only on Windows system DLLs.

MinGW does not see JUCE's MSVC `/MANIFESTDEPENDENCY` pragma, so `src/win/manifest.rc` embeds the Common Controls v6
manifest (`src/win/HorrorEngine.manifest`, RT_MANIFEST id 2) in the VST3 and CLAP. Wine accepts DLLs without it;
Windows may not. MSVC gets the v6 manifest from JUCE. Both Windows builds link the C/C++ runtime statically,
so no Visual C++ redistributable is needed. To check a build, `x86_64-w64-mingw32-objdump -p "Horror Engine.vst3"` should list no `COMCTL32.dll`
and no `TaskDialogIndirect` (including the ordinal import #345). Check both DLLs have a Common Controls v6
manifest at RT_MANIFEST id 2. Neither DLL should import MSVCP140, VCRUNTIME140, libstdc++, libgcc or winpthread.

## Linux

```
cmake -B build -G Ninja -DCMAKE_BUILD_TYPE=Release -DJUCE_DIR=path/to/JUCE -DCJE_DIR=path/to/clap-juce-extensions
ninja -C build HorrorEngine_VST3 HorrorEngine_CLAP
```

Options: `-DHE_STANDALONE=ON` adds a standalone app; `-DHE_SNAP=ON` builds `HorrorSnap`, which screenshots the window in
several states (used to compare the layout with the web page).

## Checking the engine against the JavaScript

`core/` is the C++ port of `src/engine.js`. `core/gen.js` regenerates the parameter table and the factory presets from
the web sources (`node core/gen.js path/to/horror-engine/src core`). `test/parity.js` renders the same message logs
(every preset with a tour of the voices and the moments, Tune & place offsets, your own moments, the looper, your sound
in) through the JavaScript engine and through `tools/he_render`, and compares them sample by sample:

```
cmake -S test -B build-test -G Ninja && ninja -C build-test
node test/parity.js path/to/horror-engine/src build-test/he_render
```
