/**
 * @file include-manager.hpp
 * @brief Professional header inclusion management
 * 
 * Provides clean, reusable macros for conditional compilation
 * without code duplication across modules.
 */

#pragma once

#include "build-config.hpp"

// Conditional compilation macros - safer approach
#if RKLLMJS_MODE_SANDBOX
    #define RKLLMJS_INCLUDE_REAL_RKLLM_ONLY(code) /* Skip RKLLM code in sandbox mode */
#else
    #define RKLLMJS_INCLUDE_REAL_RKLLM_ONLY(code) code /* Include RKLLM code in full mode */
#endif
