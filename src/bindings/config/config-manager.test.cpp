#include "config-manager.hpp"
#include <iostream>
#include <cassert>

namespace rkllmjs {
namespace config {

// Simple test framework
#define ASSERT_TRUE(condition) \
    if (!(condition)) { \
        std::cerr << "ASSERT_TRUE failed: " << #condition << " at line " << __LINE__ << std::endl; \
        return false; \
    }

#define ASSERT_FALSE(condition) \
    if (condition) { \
        std::cerr << "ASSERT_FALSE failed: " << #condition << " at line " << __LINE__ << std::endl; \
        return false; \
    }

#define ASSERT_EQ(expected, actual) \
    if ((expected) != (actual)) { \
        std::cerr << "ASSERT_EQ failed: expected " << expected << " but got " << actual << " at line " << __LINE__ << std::endl; \
        return false; \
    }

bool test_config_loading() {
    std::cout << "Testing config loading..." << std::endl;
    
    // Test loading config
    bool loaded = ConfigManager::loadConfig();
    ASSERT_TRUE(loaded);
    
    // Test getting available models
    auto models = ConfigManager::getAvailableModels();
    ASSERT_TRUE(models.size() >= 2);
    
    std::cout << "Available models: ";
    for (const auto& model : models) {
        std::cout << model << " ";
    }
    std::cout << std::endl;
    
    return true;
}

bool test_model_config() {
    std::cout << "Testing model configuration..." << std::endl;
    
    // Test getting specific model
    ModelConfig qwen = ConfigManager::getModel("qwen_0.5b");
    ASSERT_TRUE(qwen.isValid());
    ASSERT_EQ(qwen.id, std::string("qwen_0.5b"));
    ASSERT_TRUE(qwen.size_mb > 0);
    ASSERT_TRUE(qwen.min_memory_mb > 0);
    
    std::cout << "Qwen model: " << qwen.toString() << std::endl;
    
    // Test getting non-existent model
    ModelConfig empty = ConfigManager::getModel("non_existent");
    ASSERT_FALSE(empty.isValid());
    
    return true;
}

bool test_hardware_profiles() {
    std::cout << "Testing hardware profiles..." << std::endl;
    
    // Test getting hardware profile
    HardwareProfile high = ConfigManager::getHardwareProfile("rk3588_high");
    ASSERT_EQ(high.name, std::string("rk3588_high"));
    ASSERT_TRUE(high.npu_cores > 0);
    ASSERT_TRUE(high.max_memory_mb > 0);
    
    HardwareProfile low = ConfigManager::getHardwareProfile("rk3588_low");
    ASSERT_EQ(low.name, std::string("rk3588_low"));
    ASSERT_TRUE(low.npu_cores > 0);
    ASSERT_TRUE(low.max_memory_mb > 0);
    
    // Test auto-detection
    HardwareProfile auto_profile = ConfigManager::getHardwareProfile("auto");
    ASSERT_TRUE(!auto_profile.name.empty());
    
    return true;
}

bool test_model_selection() {
    std::cout << "Testing model selection..." << std::endl;
    
    // Test selecting best model for low-end hardware
    std::string best_low = ConfigManager::selectBestModel("rk3588_low");
    ASSERT_FALSE(best_low.empty());
    
    // Test selecting best model for high-end hardware  
    std::string best_high = ConfigManager::selectBestModel("rk3588_high");
    ASSERT_FALSE(best_high.empty());
    
    std::cout << "Best model for low hardware: " << best_low << std::endl;
    std::cout << "Best model for high hardware: " << best_high << std::endl;
    
    return true;
}

bool test_path_resolution() {
    std::cout << "Testing path resolution..." << std::endl;
    
    // Test project root detection
    std::string root = ConfigManager::getProjectRoot();
    ASSERT_FALSE(root.empty());
    std::cout << "Project root: " << root << std::endl;
    
    // Test relative path resolution
    std::string resolved = ConfigManager::resolvePath("configs/runtime.json");
    ASSERT_FALSE(resolved.empty());
    ASSERT_TRUE(resolved.find("configs/runtime.json") != std::string::npos);
    std::cout << "Resolved config path: " << resolved << std::endl;
    
    return true;
}

bool test_hardware_compatibility() {
    std::cout << "Testing hardware compatibility..." << std::endl;
    
    HardwareProfile low = ConfigManager::getHardwareProfile("rk3588_low");
    ModelConfig qwen = ConfigManager::getModel("qwen_0.5b");
    ModelConfig tinyllama = ConfigManager::getModel("tinyllama");
    
    // Test if models can run on hardware
    ASSERT_TRUE(low.canRunModel(qwen));
    ASSERT_TRUE(low.canRunModel(tinyllama));
    
    std::cout << "Low-end hardware can run qwen_0.5b: " << (low.canRunModel(qwen) ? "Yes" : "No") << std::endl;
    std::cout << "Low-end hardware can run tinyllama: " << (low.canRunModel(tinyllama) ? "Yes" : "No") << std::endl;
    
    return true;
}

} // namespace config
} // namespace rkllmjs

// Main test runner
int main() {
    using namespace rkllmjs::config;
    
    std::cout << "=== Config Manager Unit Tests ===" << std::endl;
    
    bool all_passed = true;
    
    all_passed &= test_config_loading();
    all_passed &= test_model_config();
    all_passed &= test_hardware_profiles();
    all_passed &= test_model_selection();
    all_passed &= test_path_resolution();
    all_passed &= test_hardware_compatibility();
    
    if (all_passed) {
        std::cout << "✅ All config manager tests passed!" << std::endl;
        return 0;
    } else {
        std::cout << "❌ Some tests failed!" << std::endl;
        return 1;
    }
}
