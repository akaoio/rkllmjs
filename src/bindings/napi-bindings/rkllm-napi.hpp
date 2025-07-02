/**
 * @module napi-bindings
 * @purpose Node.js N-API binding layer for RKLLM functionality exposure
 * @description Provides stable and efficient Node.js bindings using N-API for
 *              RKLLM operations. Handles JavaScript to C++ bridging, async operations,
 *              memory safety, and error propagation between runtime environments.
 * @author RKLLMJS Team
 * @version 1.0.0
 */

#pragma once

#include "../config/build-config.hpp"
#include <string>
#include <memory>

namespace rkllmjs {
namespace napi {

// N-API integration - always available in unified build
#ifdef RKLLM_NAPI_BINDINGS
    // N-API headers are available when building actual bindings
    /*
    #include <node_api.h>

    // N-API module initialization function
    napi_status InitRKLLMBindings(napi_env env, napi_value exports);
    */
#endif

} // namespace napi

/**
 * JavaScript-exposed RKLLM Manager class
 * Provides JavaScript bindings for RKLLM functionality
 */
class JSRKLLMManager {
private:
    class Impl;
    std::unique_ptr<Impl> pImpl;

public:
    JSRKLLMManager();
    ~JSRKLLMManager();
    
    // Core functionality
    bool initializeModel(const std::string& modelPath);
    std::string generateText(const std::string& prompt);
    void cleanup();
    bool isInitialized() const;
    
    // Advanced functionality (future expansion)
    bool setParameter(const std::string& key, const std::string& value);
    std::string getParameter(const std::string& key) const;
    
    // Memory and performance
    size_t getMemoryUsage() const;
    bool isNPUAvailable() const;
};

// Test function for now
void test_napi_bindings();

} // namespace rkllmjs
