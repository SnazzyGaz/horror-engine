/* GUIDs that some MinGW import libraries lack (JUCE 8 uses them). CLSID_D2D1Opacity is weak, so a libuuid that has it wins
   (Debian's mingw-w64 12 libuuid defines CLSID_D2D1Opacity; older ones do not). */
#include <windows.h>
__attribute__((weak)) const GUID CLSID_D2D1Opacity = {0x811d79a4, 0xde28, 0x4454, {0x80, 0x94, 0xc6, 0x46, 0x85, 0xf8, 0xbd, 0x4c}};
const GUID CLSID_SpVoice = {0x96749377, 0x3391, 0x11d2, {0x9e, 0xe3, 0x00, 0xc0, 0x4f, 0x79, 0x73, 0x96}};
