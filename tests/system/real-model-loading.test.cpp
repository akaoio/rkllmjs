#include "core/rkllm-manager.hpp"
#include <iostream>
#include <fstream>

using namespace rkllmjs::core;

int main() {
    std::cout << "[REAL TEST] RKLLM Real Model Loading Test" << std::endl;
    std::cout << "=========================================" << std::endl;
    
    // 1. Initialize manager
    std::cout << "[TEST] Initializing RKLLM Manager..." << std::endl;
    RKLLMManager& manager = RKLLMManager::getInstance();
    
    auto result = manager.initialize();
    if (result != ManagerResult::SUCCESS) {
        std::cout << "[ERROR] Manager initialization failed" << std::endl;
        return 1;
    }
    std::cout << "[SUCCESS] Manager initialized successfully" << std::endl;
    
    // 2. Test với model thực có sẵn  
    std::string model_path = "../../models/dulimov/Qwen2.5-VL-7B-Instruct-rk3588-1.2.1/Qwen2.5-VL-7B-Instruct-rk3588-w8a8-opt-1-hybrid-ratio-0.5.rkllm";
    std::cout << "[TEST] Testing real model: " << model_path << std::endl;
    
    // Check if file exists
    std::ifstream file(model_path);
    if (!file.good()) {
        std::cout << "[ERROR] Model file not found: " << model_path << std::endl;
        std::cout << "[INFO] Please ensure the model is downloaded" << std::endl;
        manager.cleanup();
        return 1;
    }
    file.close();
    std::cout << "[SUCCESS] Model file exists!" << std::endl;
    
    // 3. Create configuration for Qwen VL 7B
    RKLLMModelConfig config;
    config.model_path = model_path;
    config.max_context_len = 512;  // Conservative for large VL model
    config.max_new_tokens = 128;   
    config.top_k = 1;
    config.top_p = 0.9f;
    config.temperature = 0.8f;
    config.repeat_penalty = 1.1f;
    
    if (!config.isValid()) {
        std::cout << "[ERROR] Invalid configuration" << std::endl;
        manager.cleanup();
        return 1;
    }
    std::cout << "[INFO] Configuration is valid" << std::endl;
    
    // 4. Load model
    std::cout << "[TEST] Loading Qwen2.5-VL-7B model..." << std::endl;
    std::cout << "[INFO] This may take a while for large models..." << std::endl;
    
    LLMHandle handle;
    result = manager.createModel(config, &handle);
    
    if (result == ManagerResult::SUCCESS) {
        std::cout << "[SUCCESS] 🎉 Model loaded successfully!" << std::endl;
        
        // Get resource stats after loading
        auto stats = manager.getResourceStats();
        std::cout << "[INFO] Resource usage after loading:" << std::endl;
        std::cout << "  - Memory: " << stats.memory_usage_mb << "/" << stats.total_memory_mb << " MB" << std::endl;
        std::cout << "  - NPU utilization: " << stats.npu_utilization << "%" << std::endl;
        std::cout << "  - Active models: " << stats.active_models << std::endl;
        
        // Test model config retrieval
        RKLLMModelConfig retrieved_config;
        auto get_result = manager.getModelConfig(handle, &retrieved_config);
        if (get_result == ManagerResult::SUCCESS) {
            std::cout << "[SUCCESS] Model configuration retrieved" << std::endl;
        }
        
        std::cout << "[INFO] Model is ready for inference!" << std::endl;
        
        // Clean up
        std::cout << "[TEST] Unloading model..." << std::endl;
        result = manager.destroyModel(handle);
        if (result == ManagerResult::SUCCESS) {
            std::cout << "[SUCCESS] Model unloaded successfully" << std::endl;
        } else {
            std::cout << "[WARNING] Model unload had issues" << std::endl;
        }
    } else {
        std::cout << "[ERROR] Model loading failed: " << static_cast<int>(result) << std::endl;
        std::cout << "[INFO] Possible causes:" << std::endl;
        std::cout << "  - Insufficient memory (VL-7B needs ~6-8GB)" << std::endl;
        std::cout << "  - NPU driver issues" << std::endl;
        std::cout << "  - Model file corruption" << std::endl;
    }
    
    // 5. Cleanup
    manager.cleanup();
    std::cout << "[SUCCESS] Test completed" << std::endl;
    
    return (result == ManagerResult::SUCCESS) ? 0 : 1;
}
