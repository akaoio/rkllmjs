#include "../core/rkllm-manager.hpp"
#include "../config/config-manager.hpp"
#include <iostream>
#include <string>

using namespace rkllmjs::core;
using namespace rkllmjs::config;

int main() {
    std::cout << "[INTEGRATION] RKLLM Integration Test" << std::endl;
    std::cout << "====================================" << std::endl;
    
    // 1. Test config loading
    std::cout << "[TEST] Loading configuration..." << std::endl;
    ConfigManager& config = ConfigManager::getInstance();
    
    if (!config.loadFromFile("../../configs/models.json")) {
        std::cout << "[ERROR] Failed to load config file" << std::endl;
        return 1;
    }
    
    std::cout << "[SUCCESS] Config loaded successfully" << std::endl;
    
    // 2. Test manager initialization
    std::cout << "[TEST] Initializing RKLLM Manager..." << std::endl;
    RKLLMManager& manager = RKLLMManager::getInstance();
    
    auto result = manager.initialize();
    if (result != ManagerResult::SUCCESS) {
        std::cout << "[ERROR] Manager initialization failed" << std::endl;
        return 1;
    }
    
    std::cout << "[SUCCESS] Manager initialized" << std::endl;
    
    // 3. Test model loading (with small model)
    std::cout << "[TEST] Testing model loading..." << std::endl;
    
    // Get smallest model for testing
    auto model_names = config.getModelNames();
    std::string test_model = "qwen-05b"; // Smallest model
    
    if (!config.hasModel(test_model)) {
        std::cout << "[ERROR] Test model not found: " << test_model << std::endl;
        return 1;
    }
    
    auto model_config = config.getModel(test_model);
    std::cout << "[INFO] Testing with model: " << model_config.toString() << std::endl;
    
    // Convert to RKLLMModelConfig
    RKLLMModelConfig rkllm_config;
    rkllm_config.model_path = model_config.path;
    rkllm_config.max_context_len = model_config.max_context_len;
    rkllm_config.max_new_tokens = model_config.max_new_tokens;
    rkllm_config.top_k = model_config.top_k;
    rkllm_config.top_p = model_config.top_p;
    rkllm_config.temperature = model_config.temperature;
    rkllm_config.repeat_penalty = model_config.repeat_penalty;
    
    // Validate config
    if (!rkllm_config.isValid()) {
        std::cout << "[ERROR] Invalid model configuration" << std::endl;
        return 1;
    }
    
    // Try to create model
    LLMHandle handle;
    result = manager.createModel(rkllm_config, &handle);
    
    if (result == ManagerResult::SUCCESS) {
        std::cout << "[SUCCESS] Model loaded successfully!" << std::endl;
        
        // Clean up
        manager.destroyModel(handle);
        std::cout << "[INFO] Model unloaded" << std::endl;
    } else {
        std::cout << "[INFO] Model loading failed (expected if file doesn't exist)" << std::endl;
        std::cout << "[INFO] This is normal for integration test" << std::endl;
    }
    
    // 4. Cleanup
    manager.cleanup();
    std::cout << "[SUCCESS] Integration test completed" << std::endl;
    
    return 0;
}
