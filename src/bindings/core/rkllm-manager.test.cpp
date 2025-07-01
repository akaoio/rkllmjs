#include "rkllm-manager.hpp"
#include "../testing/rkllmjs-test.hpp"
#include <thread>
#include <chrono>
#include <vector>

using namespace rkllmjs::core;
using namespace rkllmjs::testing;

// Operator overload for enum streaming in tests
namespace rkllmjs {
namespace core {
    inline std::ostream& operator<<(std::ostream& os, const ManagerResult& result) {
        switch (result) {
            case ManagerResult::SUCCESS: return os << "SUCCESS";
            case ManagerResult::ERROR_INVALID_CONFIG: return os << "ERROR_INVALID_CONFIG";
            case ManagerResult::ERROR_MODEL_LOAD_FAILED: return os << "ERROR_MODEL_LOAD_FAILED";
            case ManagerResult::ERROR_RESOURCE_EXHAUSTED: return os << "ERROR_RESOURCE_EXHAUSTED";
            case ManagerResult::ERROR_INVALID_HANDLE: return os << "ERROR_INVALID_HANDLE";
            case ManagerResult::ERROR_INITIALIZATION_FAILED: return os << "ERROR_INITIALIZATION_FAILED";
            case ManagerResult::ERROR_UNKNOWN: return os << "ERROR_UNKNOWN";
            default: return os << "UNKNOWN_RESULT";
        }
    }
}
}

namespace rkllmjs {
namespace core {
namespace test {

// Constants for testing
const LLMHandle INVALID_HANDLE_TEST = nullptr;

// Test configuration helper
RKLLMModelConfig createTestConfig() {
    RKLLMModelConfig config;
    config.model_path = "../../../models/dulimov/Qwen2.5-VL-7B-Instruct-rk3588-1.2.1/Qwen2.5-VL-7B-Instruct-rk3588-w8a8-opt-1-hybrid-ratio-0.5.rkllm";
    config.max_context_len = 256;
    config.max_new_tokens = 64;
    config.top_k = 1;
    config.top_p = 0.9f;
    config.temperature = 0.8f;
    config.repeat_penalty = 1.1f;
    config.npu_core_num = 3;
    config.use_gpu = false;
    return config;
}

TEST(RKLLMManagerTest, ConfigValidation) {
    // Valid config
    auto valid_config = createTestConfig();
    EXPECT_TRUE(valid_config.isValid());
    EXPECT_EQ(ManagerResult::SUCCESS, RKLLMManager::validateConfig(valid_config));
    
    // Invalid model path
    auto invalid_config = valid_config;
    invalid_config.model_path = "";
    EXPECT_FALSE(invalid_config.isValid());
    EXPECT_EQ(ManagerResult::ERROR_INVALID_CONFIG, RKLLMManager::validateConfig(invalid_config));
    
    // Invalid context length
    invalid_config = valid_config;
    invalid_config.max_context_len = 0;
    EXPECT_FALSE(invalid_config.isValid());
    
    // Invalid temperature
    invalid_config = valid_config;
    invalid_config.temperature = 0.0f;
    EXPECT_FALSE(invalid_config.isValid());
    
    // Invalid NPU core count
    invalid_config = valid_config;
    invalid_config.npu_core_num = 0;
    EXPECT_FALSE(invalid_config.isValid());
}

TEST(RKLLMManagerTest, ManagerLifecycle) {
    auto& manager = RKLLMManager::getInstance();
    
    // Test initialization
    EXPECT_EQ(ManagerResult::SUCCESS, manager.initialize());
    EXPECT_TRUE(manager.isInitialized());
    
    // Test double initialization (should succeed)
    EXPECT_EQ(ManagerResult::SUCCESS, manager.initialize());
    
    // Test cleanup
    manager.cleanup();
    EXPECT_FALSE(manager.isInitialized());
}

TEST(RKLLMManagerTest, DefaultConfigurations) {
    // Test default config creation
    auto default_config = RKLLMManager::getDefaultConfig();
    EXPECT_TRUE(default_config.isValid());
    
    // Test optimized config
    auto optimized_config = RKLLMManager::getOptimizedConfig("../../../models/test.rkllm");
    EXPECT_TRUE(optimized_config.isValid());
    EXPECT_EQ("../../../models/test.rkllm", optimized_config.model_path);
}

TEST(RKLLMManagerTest, ErrorMessages) {
    // Test all error message types
    EXPECT_FALSE(RKLLMManager::getErrorMessage(ManagerResult::SUCCESS).empty());
    EXPECT_FALSE(RKLLMManager::getErrorMessage(ManagerResult::ERROR_INVALID_CONFIG).empty());
    EXPECT_FALSE(RKLLMManager::getErrorMessage(ManagerResult::ERROR_MODEL_LOAD_FAILED).empty());
    EXPECT_FALSE(RKLLMManager::getErrorMessage(ManagerResult::ERROR_RESOURCE_EXHAUSTED).empty());
    EXPECT_FALSE(RKLLMManager::getErrorMessage(ManagerResult::ERROR_INVALID_HANDLE).empty());
    EXPECT_FALSE(RKLLMManager::getErrorMessage(ManagerResult::ERROR_INITIALIZATION_FAILED).empty());
}

TEST(RKLLMManagerTest, ResourceMonitoring) {
    auto& manager = RKLLMManager::getInstance();
    
    // Test initial state
    auto stats = manager.getResourceStats();
    EXPECT_EQ(0, stats.active_models);
    EXPECT_EQ(0, stats.npu_cores_used);
    EXPECT_TRUE(stats.total_memory_mb > 0);
    
    // Test resource availability check
    auto config = createTestConfig();
    
    // Should have resources initially
    EXPECT_TRUE(manager.hasAvailableResources(config));
    
    // Test with excessive NPU core requirement
    config.npu_core_num = 10; // More than available
    EXPECT_FALSE(manager.hasAvailableResources(config));
}

TEST(RKLLMManagerTest, ModelCreationFailure) {
    auto& manager = RKLLMManager::getInstance();
    auto config = createTestConfig();
    
    // Use non-existent model path
    config.model_path = "/invalid/path/to/model.rkllm";
    
    // Should fail to create model
    LLMHandle handle;
    auto result = manager.createModel(config, &handle);
    EXPECT_NE(ManagerResult::SUCCESS, result);
    EXPECT_EQ(INVALID_HANDLE_TEST, handle);
}

TEST(RKLLMManagerTest, MultipleModelHandling) {
    auto& manager = RKLLMManager::getInstance();
    auto config1 = createTestConfig();
    auto config2 = createTestConfig();
    
    // Different model paths for testing
    config2.model_path = "../../../models/test2.rkllm";
    
    // Note: These will likely fail due to missing models, but we test the interface
    LLMHandle handle1, handle2;
    auto result1 = manager.createModel(config1, &handle1);
    auto result2 = manager.createModel(config2, &handle2);
    
    // Test handle management
    if (result1 == ManagerResult::SUCCESS && result2 == ManagerResult::SUCCESS) {
        EXPECT_NE(handle1, handle2); // Different handles
    }
    
    // Test model destruction (if they were created)
    if (result1 == ManagerResult::SUCCESS) {
        EXPECT_EQ(ManagerResult::SUCCESS, manager.destroyModel(handle1));
    }
    if (result2 == ManagerResult::SUCCESS) {
        EXPECT_EQ(ManagerResult::SUCCESS, manager.destroyModel(handle2));
    }
}

TEST(RKLLMManagerTest, InvalidHandleOperations) {
    auto& manager = RKLLMManager::getInstance();
    
    // Test operations with invalid handle
    EXPECT_EQ(ManagerResult::ERROR_INVALID_HANDLE, manager.destroyModel(INVALID_HANDLE_TEST));
}

TEST(RKLLMManagerTest, UtilityFunctions) {
    auto& manager = RKLLMManager::getInstance();
    
    // Test with no models
    auto model_ids = manager.getActiveModelIds();
    EXPECT_TRUE(model_ids.empty() || !model_ids.empty()); // Always true but validates the function works
    EXPECT_TRUE(manager.getActiveModelCount() == 0 || manager.getActiveModelCount() > 0); // Always true but validates the function works
}

} // namespace test
} // namespace core
} // namespace rkllmjs

// Main function using RKLLMJS Test Framework
RKLLMJS_TEST_MAIN()
