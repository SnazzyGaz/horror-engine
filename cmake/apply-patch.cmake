# Apply a patch to the current directory once: skipped when it is already applied (FetchContent may re-run
# the patch step on a tree it patched before). Usage: cmake -DPATCH=<file> -P apply-patch.cmake
# Horror Engine by Garyck Arntzen (https://x.com/_mintydoge). GNU AGPLv3.
find_package(Git REQUIRED)
execute_process(COMMAND ${GIT_EXECUTABLE} apply --reverse --check --whitespace=nowarn ${PATCH} RESULT_VARIABLE applied OUTPUT_QUIET ERROR_QUIET)
if (applied EQUAL 0)
  message(STATUS "Already applied: ${PATCH}")
  return()
endif()
execute_process(COMMAND ${GIT_EXECUTABLE} apply --whitespace=nowarn ${PATCH} RESULT_VARIABLE rc)
if (NOT rc EQUAL 0)
  message(FATAL_ERROR "Could not apply ${PATCH}")
endif()
message(STATUS "Applied: ${PATCH}")
