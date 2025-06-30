#include <gtest/gtest.h>
#include "error-handler-simple.hpp"

namespace rkllmjs {
namespace utils {
namespace test {

class ErrorHandlerSimpleTest : public ::testing::Test {
protected:
    void SetUp() override {}
    void TearDown() override {}
};

// Exception creation tests
TEST_F(ErrorHandlerSimpleTest, RKLLMExceptionCreation) {
    std::string testMessage = "Test error message";
    RKLLMException exception(testMessage);
    
    EXPECT_STREQ(exception.what(), testMessage.c_str());
}

TEST_F(ErrorHandlerSimpleTest, ConfigurationExceptionCreation) {
    std::string testMessage = "Invalid configuration";
    ConfigurationException exception(testMessage);
    
    EXPECT_STREQ(exception.what(), testMessage.c_str());
}

TEST_F(ErrorHandlerSimpleTest, ResourceExceptionCreation) {
    std::string testMessage = "Resource allocation failed";
    ResourceException exception(testMessage);
    
    EXPECT_STREQ(exception.what(), testMessage.c_str());
}

// Error info structure tests
TEST_F(ErrorHandlerSimpleTest, ErrorInfoStructure) {
    ErrorInfo errorInfo;
    errorInfo.category = ErrorCategory::CONFIGURATION;
    errorInfo.severity = ErrorSeverity::ERROR;
    errorInfo.code = "TEST_ERROR";
    errorInfo.message = "Test message";
    errorInfo.details = "Test details";
    
    EXPECT_EQ(errorInfo.category, ErrorCategory::CONFIGURATION);
    EXPECT_EQ(errorInfo.severity, ErrorSeverity::ERROR);
    EXPECT_EQ(errorInfo.code, "TEST_ERROR");
    EXPECT_EQ(errorInfo.message, "Test message");
    EXPECT_EQ(errorInfo.details, "Test details");
}

// Validation tests
TEST_F(ErrorHandlerSimpleTest, ValidateNotEmpty) {
    EXPECT_NO_THROW(validateNotEmpty("hello", "test"));
    EXPECT_THROW(validateNotEmpty("", "test"), ConfigurationException);
}

TEST_F(ErrorHandlerSimpleTest, ValidateIntRange) {
    EXPECT_NO_THROW(validateRange(5, 1, 10, "test"));
    EXPECT_THROW(validateRange(0, 1, 10, "test"), ConfigurationException);
    EXPECT_THROW(validateRange(11, 1, 10, "test"), ConfigurationException);
}

TEST_F(ErrorHandlerSimpleTest, ValidateDoubleRange) {
    EXPECT_NO_THROW(validateRange(5.5, 1.0, 10.0, "test"));
    EXPECT_THROW(validateRange(0.5, 1.0, 10.0, "test"), ConfigurationException);
    EXPECT_THROW(validateRange(10.5, 1.0, 10.0, "test"), ConfigurationException);
}

// Error logging tests (these just ensure the functions don't crash)
TEST_F(ErrorHandlerSimpleTest, LogError) {
    ErrorInfo errorInfo;
    errorInfo.category = ErrorCategory::VALIDATION;
    errorInfo.severity = ErrorSeverity::WARNING;
    errorInfo.code = "TEST_WARNING";
    errorInfo.message = "Test warning message";
    errorInfo.details = "Additional details";
    
    // This test just ensures the function doesn't crash
    EXPECT_NO_THROW(logError(errorInfo));
    EXPECT_NO_THROW(logError("Simple error message", ErrorSeverity::INFO));
}

} // namespace test
} // namespace utils
} // namespace rkllmjs

// Test runner
int main(int argc, char** argv) {
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}
