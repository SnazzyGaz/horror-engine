# Cross-compile the Windows plugin with MinGW-w64 (GCC, POSIX threads) from Linux.
# JUCE 8 does not support MinGW out of the box: apply patches/juce-8.0.15-mingw.patch to JUCE first, and use
# mingw-w64 headers new enough for Direct2D 1.3 (d2d1_3.h); see BUILDING.md.
set(CMAKE_SYSTEM_NAME Windows)
set(CMAKE_SYSTEM_PROCESSOR x86_64)
set(CMAKE_C_COMPILER x86_64-w64-mingw32-gcc-posix)
set(CMAKE_CXX_COMPILER x86_64-w64-mingw32-g++-posix)
set(CMAKE_RC_COMPILER x86_64-w64-mingw32-windres)
set(CMAKE_FIND_ROOT_PATH /usr/x86_64-w64-mingw32)
set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
set(CMAKE_CXX_FLAGS_INIT "-include cstring -D_WIN32_WINNT=0x0A00 -DWINVER=0x0A00")
set(CMAKE_C_FLAGS_INIT "-D_WIN32_WINNT=0x0A00 -DWINVER=0x0A00")
# one self-contained DLL: no libstdc++, libgcc or winpthread DLLs next to it
set(CMAKE_SHARED_LINKER_FLAGS_INIT "-static -static-libgcc -static-libstdc++")
set(CMAKE_MODULE_LINKER_FLAGS_INIT "-static -static-libgcc -static-libstdc++")
set(CMAKE_EXE_LINKER_FLAGS_INIT "-static -static-libgcc -static-libstdc++")
