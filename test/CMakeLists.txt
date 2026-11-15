# The engine on its own, and he_render for test/parity.js
cmake_minimum_required(VERSION 3.22)
project(he_parity CXX)
set(CMAKE_CXX_STANDARD 17)
add_library(he_core STATIC ../core/he_core.cpp)
target_include_directories(he_core PUBLIC ../core)
target_compile_options(he_core PRIVATE -O2 -fno-fast-math -ffp-contract=off)
add_executable(he_render ../tools/he_render.cpp)
target_link_libraries(he_render he_core)
# Sync to host with a fake playhead
add_executable(sync_test ../test/sync_test.cpp)
target_link_libraries(sync_test he_core)
# A CC must not flicker back to the host's stale parameter value (src/ParamHold.h)
add_executable(param_hold_test ../test/param_hold_test.cpp)
