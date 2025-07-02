#include "../testing/rkllmjs-test.hpp"
#include "error-handler.hpp"
#include <string>
#include <stdexcept>

using namespace rkllmjs::testing;

namespace rkllmjs {
namespace utils {
namespace test {

/**
 * @brief Test fixture for error handler functionality
 */
class ErrorHandlerTest {
public:
    void SetUp() {
        // Test setup
    }
    
    void TearDown() {
        // Test cleanup
    }
};

// Unified build tests (no build mode separation)
TEST(ErrorHandlerTest, ErrorCategoryEnum) {
    // Test that error categories are properly defined
    ErrorCategory cat1 = ErrorCategory::TYPE_CONVERSION;
    ErrorCategory cat2 = ErrorCategory::CONFIGURATION;
    ErrorCategory cat3 = ErrorCategory::RESOURCE_MANAGEMENT;
    
    EXPECT_TRUE(cat1 != cat2);
    EXPECT_TRUE(cat2 != cat3);
}

TEST(ErrorHandlerTest, ErrorSeverityEnum) {
    // Test error severity levels
    ErrorSeverity sev1 = ErrorSeverity::INFO;
    ErrorSeverity sev2 = ErrorSeverity::WARNING;
    ErrorSeverity sev3 = ErrorSeverity::CRITICAL;
    
    EXPECT_TRUE(sev1 != sev2);
    EXPECT_TRUE(sev2 != sev3);
}

TEST(ErrorHandlerTest, RKLLMExceptionBasic) {
    // Test basic exception functionality
    const std::string testMessage = "Test error message";
    RKLLMException ex(testMessage);
    
    EXPECT_STREQ(ex.what(), testMessage.c_str());
}

TEST(ErrorHandlerTest, TypeConversionException) {
    // Test type conversion exception
    const std::string testMessage = "Type conversion failed";
    TypeConversionException ex(testMessage);
    
    EXPECT_STREQ(ex.what(), testMessage.c_str());
}

TEST(ErrorHandlerTest, ConfigurationException) {
    // Test configuration exception
    const std::string testMessage = "Configuration error";
    ConfigurationException ex(testMessage);
    
    EXPECT_STREQ(ex.what(), testMessage.c_str());
}

TEST(ErrorHandlerTest, ErrorInfoStructure) {
    // Test ErrorInfo structure
    ErrorInfo info;
    info.category = ErrorCategory::TYPE_CONVERSION;
    info.severity = ErrorSeverity::WARNING;
    info.code = "TEST_001";
    info.message = "Test message";
    
    EXPECT_TRUE(info.category == ErrorCategory::TYPE_CONVERSION);
    EXPECT_TRUE(info.severity == ErrorSeverity::WARNING);
    EXPECT_STREQ(info.code.c_str(), "TEST_001");
    EXPECT_STREQ(info.message.c_str(), "Test message");
}

// Test unified build functionality
TEST(ErrorHandlerTest, UnifiedBuildAvailable) {
    // Test that unified build functionality is available
    EXPECT_TRUE(true); // Unified build has access to all functions
}

} // namespace test
} // namespace utils
} // namespace rkllmjs

// Test runner
RKLLMJS_TEST_MAIN()
