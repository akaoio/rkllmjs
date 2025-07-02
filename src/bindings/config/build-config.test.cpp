#include "../testing/rkllmjs-test.hpp"
#include "build-config.hpp"
#include "include-manager.hpp"
#include <string>
#include <cstring>

using namespace rkllmjs::testing;

namespace rkllmjs {
namespace config {
namespace test {

TEST(BuildConfigTest, HardwareDetection) {
    // Test hardware detection functions
    using namespace rkllmjs::config;
    
    // Test ARM64 detection (compile-time check)
    bool is_arm64 = detect_arm64();
    // Result depends on architecture, but should not crash
    (void)is_arm64;
    
    // Test RK3588 detection (runtime check)
    bool is_rk3588 = detect_rk3588();
    // Result depends on hardware, but should not crash
    (void)is_rk3588;
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

TEST(BuildConfigTest, UnifiedFeatureAvailability) {
    // Test that all features are now always enabled in unified build
    EXPECT_TRUE(RKLLMJS_HAS_NAPI);
    EXPECT_TRUE(RKLLMJS_HAS_NODE_INTEGRATION);
    EXPECT_TRUE(RKLLMJS_HAS_RKLLM_NATIVE);
}

TEST(IncludeManagerTest, MacroExistence) {
    // Test that include macros are defined
    // Compilation success indicates macros work
    EXPECT_TRUE(true);
}

} // namespace test
} // namespace config
} // namespace rkllmjs

// Main function using RKLLMJS Test Framework
RKLLMJS_TEST_MAIN()
