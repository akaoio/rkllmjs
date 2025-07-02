#include <iostream>
#include <string>
#include <memory>
#include <chrono>
#include "rkllm-manager.hpp"
#include "inference-engine.hpp"
#include "build-config.hpp"

using namespace rkllmjs;

int main() {
    std::cout << "🧪 RKLLM.js Real Inference Test" << std::endl;
    std::cout << "===============================" << std::endl;
    
    // Model path
    std::string model_path = "../../models/dulimov/Qwen2.5-VL-7B-Instruct-rk3588-1.2.1/Qwen2.5-VL-7B-Instruct-rk3588-w8a8-opt-1-hybrid-ratio-0.5.rkllm";
    
    try {
        // Test 1: Initialize Core Manager
        std::cout << "\n🔧 Step 1: Initialize Core Manager" << std::endl;
        auto& manager = core::RKLLMManager::getInstance();
        
        auto result = manager.initialize();
        if (result != core::ManagerResult::SUCCESS) {
            std::cout << "❌ Manager initialization failed: " << core::RKLLMManager::getErrorMessage(result) << std::endl;
            return 1;
        }
        std::cout << "✅ Manager initialized successfully" << std::endl;
        
        // Test 2: Load Configuration
        std::cout << "\n🔧 Step 2: Load Model Configuration" << std::endl;
        auto config = core::RKLLMManager::getOptimizedConfig(model_path);
        std::cout << "✅ Configuration loaded for model: " << config.model_path << std::endl;
        
        // Test 3: Validate Configuration
        std::cout << "\n🔧 Step 3: Validate Configuration" << std::endl;
        auto validation_result = core::RKLLMManager::validateConfig(config);
        if (validation_result != core::ManagerResult::SUCCESS) {
            std::cout << "❌ Configuration validation failed: " << core::RKLLMManager::getErrorMessage(validation_result) << std::endl;
            return 1;
        }
        std::cout << "✅ Configuration validated successfully" << std::endl;
        
        // Test 4: Create Model
        std::cout << "\n🔧 Step 4: Create Model Instance" << std::endl;
        LLMHandle handle;
        result = manager.createModel(config, &handle);
        if (result != core::ManagerResult::SUCCESS) {
            std::cout << "❌ Model creation failed: " << core::RKLLMManager::getErrorMessage(result) << std::endl;
            return 1;
        }
        std::cout << "✅ Model created successfully with handle: " << handle << std::endl;
        
        // Test 5: Check Resources
        std::cout << "\n🔧 Step 5: Check Resource Usage" << std::endl;
        auto stats = manager.getResourceStats();
        std::cout << "📊 Resource Stats:" << std::endl;
        std::cout << "   - Memory used: " << stats.memory_usage_mb << " MB" << std::endl;
        std::cout << "   - NPU usage: " << stats.npu_utilization << "%" << std::endl;
        std::cout << "   - Active models: " << manager.getActiveModelCount() << std::endl;
        
        // Test 6: Create Inference Engine
        std::cout << "\n🔧 Step 6: Create Inference Engine" << std::endl;
        std::shared_ptr<core::RKLLMManager> manager_ptr(&manager, [](core::RKLLMManager*){});
        inference::InferenceEngine engine(manager_ptr);
        engine.setModelHandle(handle);  // Set the model handle for inference
        std::cout << "✅ Inference engine created" << std::endl;
        
        // Test 7: Simple Inference
        std::cout << "\n🔧 Step 7: Run Simple Inference" << std::endl;
        std::string prompt = "Hello, how are you today?";
        std::cout << "📝 Prompt: \"" << prompt << "\"" << std::endl;
        
        inference::InferenceParams params;
        params.prompt = prompt;
        params.maxTokens = 100;
        params.temperature = 0.7f;
        params.topP = 0.9f;
        params.topK = 40;
        
        auto start_time = std::chrono::high_resolution_clock::now();
        auto inference_result = engine.generate(params);
        auto end_time = std::chrono::high_resolution_clock::now();
        
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end_time - start_time);
        
        if (inference_result.finished) {
            std::cout << "✅ Inference completed successfully!" << std::endl;
            std::cout << "📄 Generated Text: \"" << inference_result.text << "\"" << std::endl;
            std::cout << "📊 Statistics:" << std::endl;
            std::cout << "   - Tokens generated: " << inference_result.tokensGenerated << std::endl;
            std::cout << "   - Time taken: " << duration.count() << " ms" << std::endl;
            std::cout << "   - Tokens/sec: " << inference_result.tokensPerSecond << std::endl;
            std::cout << "   - Finish reason: " << inference_result.finishReason << std::endl;
        } else {
            std::cout << "⚠️ Inference completed but may be incomplete" << std::endl;
            std::cout << "📄 Partial Text: \"" << inference_result.text << "\"" << std::endl;
        }
        
        // Test 8: Cleanup
        std::cout << "\n🔧 Step 8: Cleanup Resources" << std::endl;
        result = manager.destroyModel(handle);
        if (result == core::ManagerResult::SUCCESS) {
            std::cout << "✅ Model destroyed successfully" << std::endl;
        } else {
            std::cout << "⚠️ Model cleanup warning: " << core::RKLLMManager::getErrorMessage(result) << std::endl;
        }
        
        result = manager.cleanup();
        if (result == core::ManagerResult::SUCCESS) {
            std::cout << "✅ Manager cleaned up successfully" << std::endl;
        } else {
            std::cout << "⚠️ Manager cleanup warning: " << core::RKLLMManager::getErrorMessage(result) << std::endl;
        }
        
        std::cout << "\n🎉 All tests completed successfully!" << std::endl;
        return 0;
        
    } catch (const std::exception& e) {
        std::cout << "💥 Exception caught: " << e.what() << std::endl;
        return 1;
    } catch (...) {
        std::cout << "💥 Unknown exception caught" << std::endl;
        return 1;
    }
}
