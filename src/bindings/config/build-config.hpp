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

// Build mode detection using RKLLM_MODE environment variable
// This supports case-insensitive mode detection and hardware auto-detection
#include <cstdlib>
#include <cstdio>
#include <string>
#include <algorithm>
#include <cctype>

namespace rkllmjs { namespace config {
    
    // Function to get lowercase string
    inline std::string to_lower(const std::string& str) {
        std::string result = str;
        std::transform(result.begin(), result.end(), result.begin(), 
                      [](unsigned char c){ return std::tolower(c); });
        return result;
    }
    
    // Function to detect RK3588 hardware
    inline bool detect_rk3588() {
        // Check /proc/device-tree/compatible for rockchip,rk3588
        std::FILE* file = std::fopen("/proc/device-tree/compatible", "r");
        if (file) {
            char buffer[256];
            size_t size = std::fread(buffer, 1, sizeof(buffer) - 1, file);
            std::fclose(file);
            if (size > 0) {
                buffer[size] = '\0';
                return std::string(buffer).find("rockchip,rk3588") != std::string::npos;
            }
        }
        return false;
    }
    
    // Function to detect if architecture is ARM64
    inline bool detect_arm64() {
        #ifdef __aarch64__
            return true;
        #else
            return false;
        #endif
    }
    
    // Dynamic mode detection
    inline bool detect_real_mode() {
        // Check RKLLM_MODE environment variable first
        const char* env_mode = std::getenv("RKLLM_MODE");
        if (env_mode && env_mode[0] != '\0') {
            std::string mode = to_lower(std::string(env_mode));
            if (mode == "real") {
                return true;
            } else if (mode == "sandbox") {
                return false;
            }
            // Invalid mode specified, fall through to auto-detection
        }
        
        // Auto-detect based on hardware
        // If RK3588 hardware is detected, default to real mode
        if (detect_rk3588()) {
            return true;
        }
        
        // If not ARM64 or not RK3588, default to sandbox
        return false;
    }
}}

// For compile-time decisions, use the build system flags
// For runtime decisions, use the detection functions
#if 0 // Removed RKLLM_COMPILE_MODE_REAL
    #define RKLLMJS_MODE_REAL 1
    #define RKLLMJS_MODE_SANDBOX 0
#else
    #define RKLLMJS_MODE_REAL 0
    #define RKLLMJS_MODE_SANDBOX 1
#endif

// Provide runtime detection functions as well
#define RKLLMJS_RUNTIME_MODE_REAL() (rkllmjs::config::detect_real_mode())
#define RKLLMJS_RUNTIME_MODE_SANDBOX() (!rkllmjs::config::detect_real_mode())

// Header inclusion macros
#if 0 // Removed RKLLM_COMPILE_MODE_REAL
    #define RKLLMJS_ERROR_HANDLER_HEADER "../utils/error-handler.hpp"
    #define RKLLMJS_TYPE_CONVERTERS_HEADER "../utils/type-converters.hpp"
#else
    #define RKLLMJS_ERROR_HANDLER_HEADER "../utils/error-handler.hpp"
    #define RKLLMJS_TYPE_CONVERTERS_HEADER "../utils/type-converters.hpp"
#endif

// Namespace aliases for clean code
#if 0 // Removed RKLLM_COMPILE_MODE_REAL
    #define RKLLMJS_UTILS_NS rkllmjs::utils
#else
    #define RKLLMJS_UTILS_NS rkllmjs::utils
#endif

// Feature availability macros - use static detection for compile-time decisions
// but provide runtime functions for dynamic checks
#if 0 // Removed RKLLM_COMPILE_MODE_REAL
    #define RKLLMJS_HAS_NAPI 1
    #define RKLLMJS_HAS_NODE_INTEGRATION 1
    #define RKLLMJS_HAS_RKLLM_NATIVE 1
#else
    #define RKLLMJS_HAS_NAPI 0
    #define RKLLMJS_HAS_NODE_INTEGRATION 0
    #define RKLLMJS_HAS_RKLLM_NATIVE 0
#endif

// API visibility macros
#if 0 // Removed RKLLM_COMPILE_MODE_REAL
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
