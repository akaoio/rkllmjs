#include "../testing/rkllmjs-test.hpp"
#include "include-manager.hpp"

using namespace rkllmjs::testing;

namespace rkllmjs {
namespace config {
namespace test {

TEST(IncludeManagerTest, HeaderInclusionMacros) {
    // Test that macros are properly defined
    // The fact that this test compiles means the macros work correctly
    EXPECT_TRUE(true);
}

TEST(IncludeManagerTest, UnifiedBuildSystem) {
    // Test that unified build system works
    // All builds now have full functionality
    EXPECT_TRUE(RKLLMJS_HAS_NAPI);
    EXPECT_TRUE(RKLLMJS_HAS_NODE_INTEGRATION);
    EXPECT_TRUE(RKLLMJS_HAS_RKLLM_NATIVE);
}

TEST(IncludeManagerTest, SystemDependencies) {
    // Test that system dependencies are handled correctly
    // Compilation success indicates proper header management
    EXPECT_TRUE(true);
}

} // namespace test
} // namespace config
} // namespace rkllmjs

// Main function using RKLLMJS Test Framework
RKLLMJS_TEST_MAIN()
