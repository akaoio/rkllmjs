#pragma once

/**
 * @file build-config.hpp
 * @brief Centralized build configuration
 * 
 * This header provides unified build configuration without mode separation.
 * All builds have full RK3588 support with automatic runtime adaptation.
 */

#ifndef RKLLMJS_BUILD_CONFIG_HPP
#define RKLLMJS_BUILD_CONFIG_HPP

#include <cstdlib>
#include <cstdio>
#include <string>

namespace rkllmjs { namespace config {
    
    // Function to detect RK3588 hardware at runtime
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
}}

// Header inclusion macros - unified paths
#define RKLLMJS_ERROR_HANDLER_HEADER "../utils/error-handler.hpp"
#define RKLLMJS_TYPE_CONVERTERS_HEADER "../utils/type-converters.hpp"

// Namespace aliases for clean code
#define RKLLMJS_UTILS_NS rkllmjs::utils

// Unified feature availability - always enabled
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
