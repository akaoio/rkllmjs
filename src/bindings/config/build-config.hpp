#pragma once

/**
 * @file build-config.hpp
 * @brief Centralized build configuration and conditional compilation
 * 
 * This header provides a clean, professional way to handle different build
 * modes without code duplication or messy conditional includes.
 */

#ifndef RKLLMJS_BUILD_CONFIG_HPP
#define RKLLMJS_BUILD_CONFIG_HPP

// Build mode detection
#ifdef SANDBOX_BUILD
    #define RKLLMJS_MODE_SANDBOX 1
    #define RKLLMJS_MODE_REAL 0
#else
    #define RKLLMJS_MODE_SANDBOX 0
    #define RKLLMJS_MODE_REAL 1
#endif

// Header inclusion macros
#if RKLLMJS_MODE_SANDBOX
    #define RKLLMJS_ERROR_HANDLER_HEADER "../utils/error-handler.hpp"
    #define RKLLMJS_TYPE_CONVERTERS_HEADER "../utils/type-converters.hpp"
#else
    #define RKLLMJS_ERROR_HANDLER_HEADER "../utils/error-handler.hpp"
    #define RKLLMJS_TYPE_CONVERTERS_HEADER "../utils/type-converters.hpp"
#endif

// Namespace aliases for clean code
#if RKLLMJS_MODE_SANDBOX
    #define RKLLMJS_UTILS_NS rkllmjs::utils
#else
    #define RKLLMJS_UTILS_NS rkllmjs::utils
#endif

// Feature availability macros
#if RKLLMJS_MODE_REAL
    #define RKLLMJS_HAS_NAPI 1
    #define RKLLMJS_HAS_NODE_INTEGRATION 1
    #define RKLLMJS_HAS_RKLLM_NATIVE 1
#else
    #define RKLLMJS_HAS_NAPI 0
    #define RKLLMJS_HAS_NODE_INTEGRATION 0
    #define RKLLMJS_HAS_RKLLM_NATIVE 0
#endif

// API visibility macros
#if RKLLMJS_MODE_REAL
    #define RKLLMJS_API_EXPORT __attribute__((visibility("default")))
    #define RKLLMJS_API_IMPORT
#else
    #define RKLLMJS_API_EXPORT
    #define RKLLMJS_API_IMPORT
#endif

// Debug/release configuration
#ifdef DEBUG
    #define RKLLMJS_DEBUG 1
    #define RKLLMJS_ASSERT(x) assert(x)
#else
    #define RKLLMJS_DEBUG 0
    #define RKLLMJS_ASSERT(x) ((void)0)
#endif

#endif // RKLLMJS_BUILD_CONFIG_HPP
