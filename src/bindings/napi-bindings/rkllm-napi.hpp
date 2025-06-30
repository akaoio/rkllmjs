#pragma once

#include <string>
#include <memory>

namespace rkllmjs {
namespace napi {

// Future N-API integration (when Node.js headers are available)
/*
#include <node_api.h>

// N-API module initialization function
napi_status InitRKLLMBindings(napi_env env, napi_value exports);
*/

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
