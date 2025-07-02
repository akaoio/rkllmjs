#pragma once

/**
 * @file build-config.hpp
 * @brief Centralized build configuration
 * 
 * This header provides unified build configuration for production-ready RKLLM inference.
 * All builds target the real RKLLM backend without conditional modes.
 */

#ifndef RKLLMJS_BUILD_CONFIG_HPP
#define RKLLMJS_BUILD_CONFIG_HPP

#include <cstdlib>
#include <cstdio>
#include <string>

namespace rkllmjs { namespace config {
    // Architecture detection for build compatibility
    inline bool is_arm64() {
        #ifdef __aarch64__
            return true;
        #else
            return false;
        #endif
    }
    
    // RK3588 hardware detection
    inline bool detect_rk3588() {
        #ifdef __aarch64__
            // Check for RK3588 in /proc/device-tree/compatible
            FILE* file = fopen("/proc/device-tree/compatible", "r");
            if (file != nullptr) {
                char buffer[256];
                size_t bytes_read = fread(buffer, 1, sizeof(buffer) - 1, file);
                fclose(file);
                buffer[bytes_read] = '\0';
                
                // Look for rockchip,rk3588 string
                std::string content(buffer);
                return content.find("rockchip,rk3588") != std::string::npos;
            }
            
            // Fallback: assume RK3588 on ARM64 if can't detect
            return true;
        #else
            return false;
        #endif
    }
}}

// Header inclusion macros - unified paths
#define RKLLMJS_ERROR_HANDLER_HEADER "../utils/error-handler.hpp"
#define RKLLMJS_TYPE_CONVERTERS_HEADER "../utils/type-converters.hpp"

// Namespace aliases for clean code
#define RKLLMJS_UTILS_NS rkllmjs::utils

// Unified feature availability - single mode only
#define RKLLMJS_HAS_NAPI 1
#define RKLLMJS_HAS_NODE_INTEGRATION 1
#define RKLLMJS_HAS_RKLLM_NATIVE 1

// API visibility macros
#define RKLLMJS_API_EXPORT __attribute__((visibility("default")))
#define RKLLMJS_API_IMPORT

// Debug/release configuration
#ifdef DEBUG
    #define RKLLMJS_DEBUG 1
    #define RKLLMJS_ASSERT(x) assert(x)
#else
    #define RKLLMJS_DEBUG 0
    #define RKLLMJS_ASSERT(x) ((void)0)
#endif

#endif // RKLLMJS_BUILD_CONFIG_HPP
