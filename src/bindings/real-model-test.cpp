#include "core/rkllm-manager.hpp" 
#include <iostream>
#include <fstream>
#include <string>
#include <vector>

using namespace rkllmjs::core;

/**
 * Simple test to load actual models from filesystem
 */
int main() {
    std::cout << "[REAL MODEL TEST] RKLLM Real Model Loading Test" << std::endl;
    std::cout << "================================================" << std::endl;
    
    // Initialize manager
    RKLLMManager& manager = RKLLMManager::getInstance();
    auto result = manager.initialize();
    
    if (result != ManagerResult::SUCCESS) {
        std::cout << "[ERROR] Manager initialization failed" << std::endl;
        return 1;
    }
    
    std::cout << "[SUCCESS] Manager initialized" << std::endl;
    
    // Test with real model paths based on models.json structure
    std::vector<std::string> test_models = {
        "models/dulimov/Qwen2.5-VL-7B-Instruct-rk3588-1.2.1/Qwen2.5-VL-7B-Instruct-rk3588-w8a8-opt-1-hybrid-ratio-0.5.rkllm",
        "models/limcheekin/Qwen2.5-0.5B-Instruct-rk3588-1.1.4/Qwen2.5-0.5B-Instruct-rk3588-w8a8-opt-0-hybrid-ratio-0.0.rkllm",
        "models/punchnox/Tinnyllama-1.1B-rk3588-rkllm-1.1.4/TinyLlama-1.1B-Chat-v1.0-rk3588-w8a8-opt-0-hybrid-ratio-0.5.rkllm"
    };
    
    std::vector<std::string> model_names = {
        "Qwen2.5-VL-7B-Instruct", 
        "Qwen2.5-0.5B-Instruct",
        "TinyLlama-1.1B-Chat"
    };
    
    bool any_loaded = false;
    
    for (size_t i = 0; i < test_models.size(); i++) {
        std::cout << std::endl << "[TEST] Attempting to load: " << model_names[i] << std::endl;
        std::cout << "[INFO] Model path: " << test_models[i] << std::endl;
        
        // Check if file exists
        std::ifstream file(test_models[i]);
        if (!file.good()) {
            std::cout << "[INFO] Model file not found (this is expected if not downloaded)" << std::endl;
            continue;
        }
        file.close();
        
        // Create configuration
        RKLLMModelConfig config;
        config.model_path = test_models[i];
        
        // Use appropriate settings based on model size
        if (i == 0) { // Qwen VL 7B - large model
            config.max_context_len = 512;
            config.max_new_tokens = 128;
        } else if (i == 1) { // Qwen 0.5B - small model  
            config.max_context_len = 256;
            config.max_new_tokens = 64;
        } else { // TinyLlama - medium model
            config.max_context_len = 512;
            config.max_new_tokens = 128;
        }
        
        config.top_k = 1;
        config.top_p = 0.9f;
        config.temperature = 0.8f;
        config.repeat_penalty = 1.1f;
        
        if (!config.isValid()) {
            std::cout << "[ERROR] Invalid configuration" << std::endl;
            continue;
        }
        
        // Try to load model
        LLMHandle handle;
        result = manager.createModel(config, &handle);
        
        if (result == ManagerResult::SUCCESS) {
            std::cout << "[SUCCESS] 🎉 Model loaded successfully!" << std::endl;
            any_loaded = true;
            
            // Test basic model info
            RKLLMModelConfig retrieved_config;
            auto get_result = manager.getModelConfig(handle, &retrieved_config);
            if (get_result == ManagerResult::SUCCESS) {
                std::cout << "[INFO] Model config retrieved successfully" << std::endl;
            }
            
            // Get resource stats
            auto stats = manager.getResourceStats();
            std::cout << "[INFO] Resource usage after loading:" << std::endl;
            std::cout << "  - Memory: " << stats.memory_usage_mb << "/" << stats.total_memory_mb << " MB" << std::endl;
            std::cout << "  - NPU utilization: " << stats.npu_utilization << "%" << std::endl;
            std::cout << "  - Active models: " << stats.active_models << std::endl;
            
            // Clean up
            std::cout << "[INFO] Unloading model..." << std::endl;
            result = manager.destroyModel(handle);
            if (result == ManagerResult::SUCCESS) {
                std::cout << "[SUCCESS] Model unloaded successfully" << std::endl;
            }
            
            // Only test one model to avoid memory issues
            break;
        } else {
            std::cout << "[ERROR] Model loading failed: " << static_cast<int>(result) << std::endl;
            std::cout << "[INFO] This is expected if model file doesn't exist" << std::endl;
        }
    }
    
    if (!any_loaded) {
        std::cout << std::endl << "[INFO] No models were loaded. This is expected if:" << std::endl;
        std::cout << "  1. Model files are not downloaded yet" << std::endl;
        std::cout << "  2. Models are in different locations" << std::endl;
        std::cout << "  3. Insufficient system resources" << std::endl;
        std::cout << "[INFO] To download models, run: ./install.sh" << std::endl;
    }
    
    // Cleanup manager
    manager.cleanup();
    std::cout << std::endl << "[SUCCESS] Real model test completed" << std::endl;
    
    return any_loaded ? 0 : 1; // Return 0 if any model loaded, 1 if none
}
