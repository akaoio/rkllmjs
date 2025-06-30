#include "rkllm-manager.hpp"
#include <iostream>
#include <cassert>
#include <chrono>
#include <thread>
#include <vector>

using namespace rkllmjs::core;

// Test utilities
class TestLogger {
public:
    static void info(const std::string& message) {
        std::cout << "[TEST] " << message << std::endl;
    }
    
    static void error(const std::string& message) {
        std::cerr << "[ERROR] " << message << std::endl;
    }
    
    static void success(const std::string& message) {
        std::cout << "[SUCCESS] " << message << std::endl;
    }
};

// Test framework macros
#define ASSERT_EQ(expected, actual) \
    do { \
        if ((expected) != (actual)) { \
            TestLogger::error("Assertion failed: " #expected " != " #actual); \
            return false; \
        } \
    } while(0)

#define ASSERT_TRUE(condition) \
    do { \
        if (!(condition)) { \
            TestLogger::error("Assertion failed: " #condition " is false"); \
            return false; \
        } \
    } while(0)

#define ASSERT_FALSE(condition) \
    do { \
        if (condition) { \
            TestLogger::error("Assertion failed: " #condition " is true"); \
            return false; \
        } \
    } while(0)

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

// Test functions
bool test_config_validation() {
    TestLogger::info("Testing configuration validation...");
    
    // Valid config
    auto valid_config = createTestConfig();
    ASSERT_TRUE(valid_config.isValid());
    ASSERT_EQ(ManagerResult::SUCCESS, RKLLMManager::validateConfig(valid_config));
    
    // Invalid model path
    auto invalid_config = valid_config;
    invalid_config.model_path = "";
    ASSERT_FALSE(invalid_config.isValid());
    ASSERT_EQ(ManagerResult::ERROR_INVALID_CONFIG, RKLLMManager::validateConfig(invalid_config));
    
    // Invalid context length
    invalid_config = valid_config;
    invalid_config.max_context_len = 0;
    ASSERT_FALSE(invalid_config.isValid());
    
    // Invalid temperature
    invalid_config = valid_config;
    invalid_config.temperature = 0.0f;
    ASSERT_FALSE(invalid_config.isValid());
    
    // Invalid NPU core count
    invalid_config = valid_config;
    invalid_config.npu_core_num = 0;
    ASSERT_FALSE(invalid_config.isValid());
    
    TestLogger::success("Configuration validation tests passed");
    return true;
}

bool test_manager_lifecycle() {
    TestLogger::info("Testing manager lifecycle...");
    
    auto& manager = RKLLMManager::getInstance();
    
    // Test initialization
    ASSERT_EQ(ManagerResult::SUCCESS, manager.initialize());
    ASSERT_TRUE(manager.isInitialized());
    
    // Test double initialization (should be safe)
    ASSERT_EQ(ManagerResult::SUCCESS, manager.initialize());
    
    // Test resource stats after initialization
    auto stats = manager.getResourceStats();
    ASSERT_EQ(0, stats.active_models);
    ASSERT_EQ(0, stats.npu_cores_used);
    
    // Test cleanup
    ASSERT_EQ(ManagerResult::SUCCESS, manager.cleanup());
    ASSERT_FALSE(manager.isInitialized());
    
    // Re-initialize for other tests
    ASSERT_EQ(ManagerResult::SUCCESS, manager.initialize());
    
    TestLogger::success("Manager lifecycle tests passed");
    return true;
}

bool test_default_configs() {
    TestLogger::info("Testing default configurations...");
    
    // Test default config
    auto default_config = RKLLMManager::getDefaultConfig();
    ASSERT_TRUE(default_config.isValid());
    
    // Test optimized config
    auto optimized_config = RKLLMManager::getOptimizedConfig("../../../models/test.rkllm");
    ASSERT_TRUE(optimized_config.isValid());
    ASSERT_EQ("../../../models/test.rkllm", optimized_config.model_path);
    
    TestLogger::success("Default configuration tests passed");
    return true;
}

bool test_error_messages() {
    TestLogger::info("Testing error messages...");
    
    // Test all error message types
    ASSERT_TRUE(!RKLLMManager::getErrorMessage(ManagerResult::SUCCESS).empty());
    ASSERT_TRUE(!RKLLMManager::getErrorMessage(ManagerResult::ERROR_INVALID_CONFIG).empty());
    ASSERT_TRUE(!RKLLMManager::getErrorMessage(ManagerResult::ERROR_MODEL_LOAD_FAILED).empty());
    ASSERT_TRUE(!RKLLMManager::getErrorMessage(ManagerResult::ERROR_RESOURCE_EXHAUSTED).empty());
    ASSERT_TRUE(!RKLLMManager::getErrorMessage(ManagerResult::ERROR_INVALID_HANDLE).empty());
    ASSERT_TRUE(!RKLLMManager::getErrorMessage(ManagerResult::ERROR_INITIALIZATION_FAILED).empty());
    
    TestLogger::success("Error message tests passed");
    return true;
}

bool test_resource_monitoring() {
    TestLogger::info("Testing resource monitoring...");
    
    auto& manager = RKLLMManager::getInstance();
    
    // Test initial state
    auto stats = manager.getResourceStats();
    ASSERT_EQ(0, stats.active_models);
    ASSERT_EQ(0, stats.npu_cores_used);
    ASSERT_TRUE(stats.total_memory_mb > 0);
    
    // Test resource availability check
    auto config = createTestConfig();
    
    // Should have resources initially
    ASSERT_TRUE(manager.hasAvailableResources(config));
    
    // Test with excessive NPU core requirement
    config.npu_core_num = 10; // More than available
    ASSERT_FALSE(manager.hasAvailableResources(config));
    
    TestLogger::success("Resource monitoring tests passed");
    return true;
}

bool test_model_creation_failure() {
    TestLogger::info("Testing model creation failure scenarios...");
    
    auto& manager = RKLLMManager::getInstance();
    
    // Test with nullptr handle
    auto config = createTestConfig();
    ASSERT_EQ(ManagerResult::ERROR_INVALID_HANDLE, manager.createModel(config, nullptr));
    
    // Test with invalid config
    config.model_path = "";
    LLMHandle handle;
    ASSERT_EQ(ManagerResult::ERROR_INVALID_CONFIG, manager.createModel(config, &handle));
    
    // Test with non-existent model file
    config = createTestConfig();
    config.model_path = "/non/existent/model.rkllm";
    ASSERT_EQ(ManagerResult::ERROR_MODEL_LOAD_FAILED, manager.createModel(config, &handle));
    
    TestLogger::success("Model creation failure tests passed");
    return true;
}

bool test_utility_functions() {
    TestLogger::info("Testing utility functions...");
    
    auto& manager = RKLLMManager::getInstance();
    
    // Test with no models
    auto model_ids = manager.getActiveModelIds();
    ASSERT_EQ(0, model_ids.size());
    ASSERT_EQ(0, manager.getActiveModelCount());
    
    TestLogger::success("Utility function tests passed");
    return true;
}

bool test_concurrent_access() {
    TestLogger::info("Testing concurrent access safety...");
    
    auto& manager = RKLLMManager::getInstance();
    
    // Create multiple threads accessing manager simultaneously
    const int num_threads = 4;
    std::vector<std::thread> threads;
    std::vector<bool> results(num_threads, false);
    
    for (int i = 0; i < num_threads; ++i) {
        threads.emplace_back([&manager, &results, i]() {
            // Test concurrent resource stats access
            for (int j = 0; j < 10; ++j) {
                auto stats = manager.getResourceStats();
                (void)stats; // Suppress unused variable warning
                std::this_thread::sleep_for(std::chrono::milliseconds(1));
            }
            
            // Test concurrent utility function access
            auto model_ids = manager.getActiveModelIds();
            auto count = manager.getActiveModelCount();
            (void)count; // Suppress unused variable warning
            
            results[i] = true;
        });
    }
    
    // Wait for all threads
    for (auto& thread : threads) {
        thread.join();
    }
    
    // Check all threads completed successfully
    for (bool result : results) {
        ASSERT_TRUE(result);
    }
    
    TestLogger::success("Concurrent access tests passed");
    return true;
}

// Main test runner
int main(int argc, char* argv[]) {
    TestLogger::info("Starting RKLLM Manager Core Module Tests");
    TestLogger::info("===========================================");
    
    bool verbose = (argc > 1 && std::string(argv[1]) == "--verbose");
    
    // List of test functions
    std::vector<std::pair<std::string, bool(*)()>> tests = {
        {"Configuration Validation", test_config_validation},
        {"Manager Lifecycle", test_manager_lifecycle},
        {"Default Configurations", test_default_configs},
        {"Error Messages", test_error_messages},
        {"Resource Monitoring", test_resource_monitoring},
        {"Model Creation Failures", test_model_creation_failure},
        {"Utility Functions", test_utility_functions},
        {"Concurrent Access", test_concurrent_access}
    };
    
    int passed = 0;
    int failed = 0;
    
    for (const auto& [name, test_func] : tests) {
        TestLogger::info("Running test: " + name);
        
        try {
            if (test_func()) {
                TestLogger::success("✅ " + name + " - PASSED");
                passed++;
            } else {
                TestLogger::error("❌ " + name + " - FAILED");
                failed++;
            }
        } catch (const std::exception& e) {
            TestLogger::error("❌ " + name + " - EXCEPTION: " + e.what());
            failed++;
        } catch (...) {
            TestLogger::error("❌ " + name + " - UNKNOWN EXCEPTION");
            failed++;
        }
        
        if (verbose) {
            std::cout << std::endl;
        }
    }
    
    // Cleanup
    auto& manager = RKLLMManager::getInstance();
    manager.cleanup();
    
    // Summary
    TestLogger::info("===========================================");
    TestLogger::info("Test Results:");
    TestLogger::info("  Passed: " + std::to_string(passed));
    TestLogger::info("  Failed: " + std::to_string(failed));
    TestLogger::info("  Total:  " + std::to_string(passed + failed));
    
    if (failed == 0) {
        TestLogger::success("🎉 All tests passed!");
        return 0;
    } else {
        TestLogger::error("💥 " + std::to_string(failed) + " test(s) failed!");
        return 1;
    }
}
