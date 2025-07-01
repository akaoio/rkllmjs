/**
 * @module bindings
 * @purpose Native C++ binding layer for RKLLM JavaScript integration
 * @description Comprehensive binding architecture providing seamless integration
 *              between RKLLM C++ library and JavaScript runtimes. Includes core
 *              management, memory optimization, inference engine, and platform adapters.
 * @author RKLLMJS Team
 * @version 1.0.0
 */

#pragma once

// Core RKLLM binding components
#include "core/rkllm-manager.hpp"
#include "memory/memory-manager.hpp"
#include "inference/inference-engine.hpp"
#include "config/config-manager.hpp"
#include "utils/type-converters.hpp"
#include "utils/error-handler.hpp"
#include "adapters/adapter-manager.hpp"
#include "napi-bindings/rkllm-napi.hpp"

/**
 * @brief Main namespace for RKLLM JavaScript bindings
 * 
 * This namespace encompasses all components needed for RKLLM JavaScript
 * integration including core management, memory optimization, inference
 * execution, and platform-specific adapters.
 */
namespace rkllmjs {
    
    /**
     * @brief Initialize the RKLLM binding system
     * @return true if initialization successful, false otherwise
     */
    bool initialize();
    
    /**
     * @brief Cleanup and shutdown the RKLLM binding system
     */
    void cleanup();
    
    /**
     * @brief Get version information for the binding layer
     * @return Version string in format "major.minor.patch"
     */
    const char* getVersion();
    
} // namespace rkllmjs
