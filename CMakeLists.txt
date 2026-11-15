# Horror Engine · Séance: VST3 and CLAP plugin (and a standalone app for testing).
# Horror Engine by Garyck Arntzen (https://x.com/_mintydoge). Released under the GNU AGPLv3 (see LICENSE).
#   cmake -B build -DJUCE_DIR=/path/to/JUCE-8.0.15 -DCJE_DIR=/path/to/clap-juce-extensions
#   (or leave both out and CMake fetches JUCE 8.0.15 and the pinned clap-juce-extensions)
cmake_minimum_required(VERSION 3.22)
project(HorrorEngineSeance VERSION 1.0.0 LANGUAGES C CXX)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Pinned dependencies. JUCE_DIR / CJE_DIR point at local checkouts; left empty, CMake fetches the pinned commits.
# A local JUCE must be 8.0.15 (the version the engine parity, pluginval runs and the MinGW patch were checked with);
# -DHE_ALLOW_OTHER_JUCE=ON builds with another version anyway.
set(HE_JUCE_VERSION 8.0.15)
set(HE_JUCE_COMMIT 91ad83ae34a81e0833b1a2b0866f54846370ae53)   # tag 8.0.15
set(HE_CJE_COMMIT 6bde108329ff9fc24404b79b8b397261a75cf6a8)    # clap-juce-extensions main, CLAP 1.2.7
set(JUCE_DIR "" CACHE PATH "JUCE ${HE_JUCE_VERSION} checkout (empty: fetch tag ${HE_JUCE_VERSION})")
set(CJE_DIR "" CACHE PATH "clap-juce-extensions checkout with submodules (empty: fetch the pinned commit)")
option(HE_ALLOW_OTHER_JUCE "Allow a JUCE version other than ${HE_JUCE_VERSION}" OFF)
include(FetchContent)
if (POLICY CMP0169)
  cmake_policy(SET CMP0169 OLD)   # FetchContent_Populate(): CJE is added EXCLUDE_FROM_ALL, which MakeAvailable cannot do before CMake 3.28
endif()
if (NOT JUCE_DIR)
  set(HE_JUCE_PATCH "")
  if (MINGW)   # JUCE 8 refuses MinGW without patches/juce-8.0.15-mingw.patch (see BUILDING.md)
    set(HE_JUCE_PATCH PATCH_COMMAND git apply --whitespace=nowarn ${CMAKE_CURRENT_SOURCE_DIR}/patches/juce-8.0.15-mingw.patch)
  endif()
  FetchContent_Declare(juce GIT_REPOSITORY https://github.com/juce-framework/JUCE.git GIT_TAG ${HE_JUCE_COMMIT} ${HE_JUCE_PATCH})
  FetchContent_GetProperties(juce)
  if (NOT juce_POPULATED)
    FetchContent_Populate(juce)
  endif()
  set(JUCE_DIR ${juce_SOURCE_DIR})
endif()
file(STRINGS ${JUCE_DIR}/CMakeLists.txt HE_JUCE_PROJECT REGEX "^project\\(JUCE VERSION ")
string(REGEX MATCH "[0-9]+\\.[0-9]+\\.[0-9]+" HE_JUCE_FOUND "${HE_JUCE_PROJECT}")
if (NOT HE_JUCE_FOUND STREQUAL HE_JUCE_VERSION)
  if (HE_ALLOW_OTHER_JUCE)
    message(WARNING "JUCE ${HE_JUCE_FOUND} at ${JUCE_DIR}; this plugin is pinned to ${HE_JUCE_VERSION}")
  else()
    message(FATAL_ERROR "JUCE ${HE_JUCE_FOUND} at ${JUCE_DIR}; this plugin is pinned to ${HE_JUCE_VERSION} (git checkout ${HE_JUCE_VERSION}, or -DHE_ALLOW_OTHER_JUCE=ON)")
  endif()
endif()
if (NOT CJE_DIR)
  FetchContent_Declare(cje GIT_REPOSITORY https://github.com/free-audio/clap-juce-extensions.git GIT_TAG ${HE_CJE_COMMIT} GIT_SUBMODULES_RECURSE TRUE)
  FetchContent_GetProperties(cje)
  if (NOT cje_POPULATED)
    FetchContent_Populate(cje)
  endif()
  set(CJE_DIR ${cje_SOURCE_DIR})
endif()
add_subdirectory(${JUCE_DIR} juce)
add_subdirectory(${CJE_DIR} clap-juce-extensions EXCLUDE_FROM_ALL)

add_library(he_core STATIC core/he_core.cpp)
target_include_directories(he_core PUBLIC core)
set_target_properties(he_core PROPERTIES POSITION_INDEPENDENT_CODE ON)
# the engine must round like the JavaScript one: no fast-math
if (NOT MSVC)
  target_compile_options(he_core PRIVATE -O2 -fno-fast-math -ffp-contract=off)
endif()

set(HE_FORMATS VST3)
if (HE_STANDALONE)
  list(APPEND HE_FORMATS Standalone)
endif()

juce_add_plugin(HorrorEngine
  COMPANY_NAME "Garyck Arntzen"
  COMPANY_WEBSITE "https://x.com/_mintydoge"
  BUNDLE_ID com.mintydoge.horror-engine-seance
  PLUGIN_MANUFACTURER_CODE Mnty
  PLUGIN_CODE HrSe
  PRODUCT_NAME "Horror Engine"
  DESCRIPTION "Nine physical-model horror instruments on a spirit board"
  VERSION 1.0.0
  IS_SYNTH TRUE
  NEEDS_MIDI_INPUT TRUE
  EDITOR_WANTS_KEYBOARD_FOCUS TRUE
  VST3_CATEGORIES Instrument Synth
  VST3_AUTO_MANIFEST FALSE
  COPY_PLUGIN_AFTER_BUILD FALSE
  FORMATS ${HE_FORMATS})

juce_add_binary_data(HorrorEngineFonts SOURCES
  fonts/IMFellEnglishSC-Regular.ttf fonts/CrimsonPro-Regular.ttf fonts/CrimsonPro-Medium.ttf fonts/CrimsonPro-SemiBold.ttf
  fonts/CrimsonPro-Italic.ttf fonts/IBMPlexMono-Regular.ttf)
set_target_properties(HorrorEngineFonts PROPERTIES POSITION_INDEPENDENT_CODE ON)

target_sources(HorrorEngine PRIVATE src/PluginProcessor.cpp src/Controller.cpp src/Look.cpp src/Widgets.cpp src/Board.cpp src/Panels.cpp src/Drawers.cpp src/PluginEditor.cpp)
target_compile_definitions(HorrorEngine PUBLIC JUCE_WEB_BROWSER=0 JUCE_USE_CURL=0 JUCE_VST3_CAN_REPLACE_VST2=0 JUCE_DISPLAY_SPLASH_SCREEN=0
  JUCE_USE_WINDOWS_MEDIA_FORMAT=0 JUCE_USE_MP3AUDIOFORMAT=1 JUCE_USE_FLAC=1 JUCE_USE_OGGVORBIS=1 JUCE_REPORT_APP_USAGE=0)
target_link_libraries(HorrorEngine PRIVATE he_core HorrorEngineFonts juce::juce_audio_utils juce::juce_audio_processors juce::juce_audio_formats juce::juce_gui_extra
  PUBLIC juce::juce_recommended_config_flags juce::juce_recommended_warning_flags)
if (NOT MINGW)
  target_link_libraries(HorrorEngine PUBLIC juce::juce_recommended_lto_flags)
endif()

if (MINGW)
  target_sources(HorrorEngine PRIVATE src/mingw_guids.c)
  target_link_libraries(HorrorEngine PRIVATE imm32 shcore comctl32 dwmapi d2d1 d3d11 dxgi dwrite dcomp windowscodecs version winmm ws2_32 wininet ole32 oleaut32 uuid shlwapi rpcrt4 gdi32 user32 advapi32 comdlg32 setupapi dbghelp crypt32)
endif()

clap_juce_extensions_plugin(TARGET HorrorEngine
  CLAP_ID "com.mintydoge.horror-engine-seance"
  CLAP_FEATURES instrument synthesizer "sound-effects"
  CLAP_MANUAL_URL "https://github.com/SnazzyGaz/horror-engine"
  CLAP_SUPPORT_URL "https://github.com/SnazzyGaz/horror-engine")

if (HE_SNAP)
  juce_add_gui_app(HorrorSnap PRODUCT_NAME "HorrorSnap")
  target_sources(HorrorSnap PRIVATE tools/snap.cpp src/PluginProcessor.cpp src/Controller.cpp src/Look.cpp src/Widgets.cpp src/Board.cpp src/Panels.cpp src/Drawers.cpp src/PluginEditor.cpp)
  target_compile_definitions(HorrorSnap PRIVATE JUCE_WEB_BROWSER=0 JUCE_USE_CURL=0 HE_TEST_HOOKS=1 JUCE_PLUGINHOST_VST3=1 JUCE_USE_WINDOWS_MEDIA_FORMAT=0)
  target_link_libraries(HorrorSnap PRIVATE he_core HorrorEngineFonts juce::juce_audio_utils juce::juce_audio_processors juce::juce_audio_formats juce::juce_gui_extra juce::juce_recommended_config_flags)
  if (MINGW)
    target_sources(HorrorSnap PRIVATE src/mingw_guids.c)
    target_link_libraries(HorrorSnap PRIVATE ksguid ksuser imm32 shcore comctl32 dwmapi d2d1 d3d11 dxgi dwrite dcomp windowscodecs version winmm ws2_32 wininet ole32 oleaut32 uuid shlwapi rpcrt4 gdi32 user32 advapi32 comdlg32 setupapi dbghelp crypt32)
  endif()
endif()
