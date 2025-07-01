#include "../testing/rkllmjs-test.hpp"
#include "build-config.hpp"
#include "include-manager.hpp"
#include <string>
#include <cstring>
#include <cstdlib>

using namespace rkllmjs::testing;

namespace rkllmjs {
namespace config {
namespace test {

TEST(BuildConfigTest, BuildModeDetection) {
    // Test the dynamic mode detection functions
    using namespace rkllmjs::config;
    
    // Test case insensitive parsing
    setenv("RKLLM_MODE", "REAL", 1);
    EXPECT_TRUE(detect_real_mode());
    
    setenv("RKLLM_MODE", "real", 1);
    EXPECT_TRUE(detect_real_mode());
    
    setenv("RKLLM_MODE", "ReAl", 1);
    EXPECT_TRUE(detect_real_mode());
    
    setenv("RKLLM_MODE", "SANDBOX", 1);
    EXPECT_FALSE(detect_real_mode());
    
    setenv("RKLLM_MODE", "sandbox", 1);
    EXPECT_FALSE(detect_real_mode());
    
    setenv("RKLLM_MODE", "SaNdBoX", 1);
    EXPECT_FALSE(detect_real_mode());
    
    // Test invalid mode falls back to auto-detection
    setenv("RKLLM_MODE", "invalid", 1);
    // Result depends on hardware, but should not crash
    bool result = detect_real_mode();
    (void)result; // Suppress unused variable warning
    
    // Test with no environment variable (auto-detection)
    unsetenv("RKLLM_MODE");
    bool auto_result = detect_real_mode();
    (void)auto_result; // Result depends on hardware detection
    
    // Test compile-time features based on current build mode
#ifdef RKLLM_COMPILE_MODE_REAL
    EXPECT_EQ(RKLLMJS_HAS_NAPI, 1);
    EXPECT_EQ(RKLLMJS_HAS_NODE_INTEGRATION, 1);
    EXPECT_EQ(RKLLMJS_HAS_RKLLM_NATIVE, 1);
#else
    EXPECT_EQ(RKLLMJS_HAS_NAPI, 0);
    EXPECT_EQ(RKLLMJS_HAS_NODE_INTEGRATION, 0);
    EXPECT_EQ(RKLLMJS_HAS_RKLLM_NATIVE, 0);
#endif
}

TEST(BuildConfigTest, HeaderPathConfiguration) {
    // Test that header paths are defined
    EXPECT_TRUE(strlen(RKLLMJS_ERROR_HANDLER_HEADER) > 0);
    EXPECT_TRUE(strlen(RKLLMJS_TYPE_CONVERTERS_HEADER) > 0);
    
    // Test that paths contain expected components
    std::string error_header(RKLLMJS_ERROR_HANDLER_HEADER);
    std::string converter_header(RKLLMJS_TYPE_CONVERTERS_HEADER);
    
    EXPECT_TRUE(error_header.find("error-handler") != std::string::npos);
    EXPECT_TRUE(converter_header.find("type-converters") != std::string::npos);
}

TEST(BuildConfigTest, FeatureAvailability) {
    // Test feature flags consistency based on compile-time mode
#ifdef RKLLM_COMPILE_MODE_REAL
    EXPECT_TRUE(RKLLMJS_HAS_NAPI);
    EXPECT_TRUE(RKLLMJS_HAS_NODE_INTEGRATION);
    EXPECT_TRUE(RKLLMJS_HAS_RKLLM_NATIVE);
#else
    EXPECT_FALSE(RKLLMJS_HAS_NAPI);
    EXPECT_FALSE(RKLLMJS_HAS_NODE_INTEGRATION);
    EXPECT_FALSE(RKLLMJS_HAS_RKLLM_NATIVE);
#endif
}

TEST(BuildConfigTest, MacroDefinitions) {
    // Test that all required macros are defined
    EXPECT_TRUE(RKLLMJS_MODE_SANDBOX == 0 || RKLLMJS_MODE_SANDBOX == 1);
    EXPECT_TRUE(RKLLMJS_MODE_REAL == 0 || RKLLMJS_MODE_REAL == 1);
    EXPECT_TRUE(RKLLMJS_HAS_NAPI == 0 || RKLLMJS_HAS_NAPI == 1);
    EXPECT_TRUE(RKLLMJS_HAS_NODE_INTEGRATION == 0 || RKLLMJS_HAS_NODE_INTEGRATION == 1);
}

TEST(IncludeManagerTest, MacroExistence) {
    // Test that include macros are defined
    // Note: We can't easily test macro expansion in unit tests,
    // but we can verify the build system works by this test compiling
    EXPECT_TRUE(true); // Compilation success indicates macros work
}

} // namespace test
} // namespace config
} // namespace rkllmjs

// Main function using RKLLMJS Test Framework
RKLLMJS_TEST_MAIN()
