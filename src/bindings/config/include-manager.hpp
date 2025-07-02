/**
 * @file include-manager.hpp
 * @brief Unified header inclusion management
 * 
 * Provides clean, unified macros for code inclusion.
 * All builds now include full RKLLM functionality.
 */

#pragma once

#include "build-config.hpp"

// All functionality is always included - no conditional compilation needed
#define RKLLMJS_INCLUDE_RKLLM_CODE(code) code
