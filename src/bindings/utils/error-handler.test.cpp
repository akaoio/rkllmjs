#include <gtest/gtest.h>
#include <napi.h>
#include "error-handler.hpp"

namespace rkllmjs {
namespace utils {
namespace test {

class ErrorHandlerTest : public ::testing::Test {
protected:
    void SetUp() override {
        // Setup test environment
    }
    
    void TearDown() override {
        // Cleanup test environment
    }
};

// Exception creation tests
TEST_F(ErrorHandlerTest, RKLLMExceptionCreation) {
    std::string testMessage = "Test error message";
    RKLLMException exception(testMessage);
    
    EXPECT_STREQ(exception.what(), testMessage.c_str());
}

TEST_F(ErrorHandlerTest, TypeConversionExceptionCreation) {
    std::string expected = "string";
    napi_valuetype actual = napi_number;
    
    TypeConversionException exception(expected, actual);
    
    std::string expectedMessage = "Type conversion failed: expected string, got number";
    EXPECT_EQ(std::string(exception.what()), expectedMessage);
}

TEST_F(ErrorHandlerTest, ConfigurationExceptionCreation) {
    std::string testMessage = "Invalid configuration";
    ConfigurationException exception(testMessage);
    
    EXPECT_STREQ(exception.what(), testMessage.c_str());
}

TEST_F(ErrorHandlerTest, ResourceExceptionCreation) {
    std::string testMessage = "Resource allocation failed";
    ResourceException exception(testMessage);
    
    EXPECT_STREQ(exception.what(), testMessage.c_str());
}

// Error info structure tests
TEST_F(ErrorHandlerTest, ErrorInfoStructure) {
    ErrorInfo errorInfo;
    errorInfo.category = ErrorCategory::TYPE_CONVERSION;
    errorInfo.severity = ErrorSeverity::ERROR;
    errorInfo.code = "TEST_ERROR";
    errorInfo.message = "Test message";
    errorInfo.details = "Test details";
    errorInfo.location = "test.cpp:42";
    
    EXPECT_EQ(errorInfo.category, ErrorCategory::TYPE_CONVERSION);
    EXPECT_EQ(errorInfo.severity, ErrorSeverity::ERROR);
    EXPECT_EQ(errorInfo.code, "TEST_ERROR");
    EXPECT_EQ(errorInfo.message, "Test message");
    EXPECT_EQ(errorInfo.details, "Test details");
    EXPECT_EQ(errorInfo.location, "test.cpp:42");
}

// Native error handling tests
TEST_F(ErrorHandlerTest, GetNativeErrorMessage) {
    EXPECT_EQ(getNativeErrorMessage(-1), "General error");
    EXPECT_EQ(getNativeErrorMessage(-2), "Invalid parameter");
    EXPECT_EQ(getNativeErrorMessage(-3), "Memory allocation failed");
    EXPECT_EQ(getNativeErrorMessage(-4), "Model file not found");
    EXPECT_EQ(getNativeErrorMessage(-5), "Model format invalid");
    EXPECT_EQ(getNativeErrorMessage(-6), "Hardware not supported");
    EXPECT_EQ(getNativeErrorMessage(-7), "Resource exhausted");
    
    // Test unknown error code
    std::string unknownMsg = getNativeErrorMessage(-999);
    EXPECT_TRUE(unknownMsg.find("Unknown error") != std::string::npos);
    EXPECT_TRUE(unknownMsg.find("-999") != std::string::npos);
}

// Error code utility tests
TEST_F(ErrorHandlerTest, GetErrorCodeString) {
    EXPECT_EQ(getErrorCodeString(ErrorCategory::TYPE_CONVERSION, 0), "TYPE_CONV");
    EXPECT_EQ(getErrorCodeString(ErrorCategory::CONFIGURATION, 0), "CONFIG");
    EXPECT_EQ(getErrorCodeString(ErrorCategory::RESOURCE_MANAGEMENT, 0), "RESOURCE");
    EXPECT_EQ(getErrorCodeString(ErrorCategory::MODEL_OPERATION, 0), "MODEL_OP");
    EXPECT_EQ(getErrorCodeString(ErrorCategory::MEMORY_ALLOCATION, 0), "MEMORY");
    EXPECT_EQ(getErrorCodeString(ErrorCategory::NATIVE_LIBRARY, 0), "NATIVE");
    EXPECT_EQ(getErrorCodeString(ErrorCategory::VALIDATION, 0), "VALIDATION");
    EXPECT_EQ(getErrorCodeString(ErrorCategory::UNKNOWN, 0), "UNKNOWN");
}

TEST_F(ErrorHandlerTest, GetErrorCategoryFromCode) {
    EXPECT_EQ(getErrorCategoryFromCode("RKLLM_TYPE_CONV_001"), ErrorCategory::TYPE_CONVERSION);
    EXPECT_EQ(getErrorCategoryFromCode("RKLLM_CONFIG_002"), ErrorCategory::CONFIGURATION);
    EXPECT_EQ(getErrorCategoryFromCode("RKLLM_RESOURCE_003"), ErrorCategory::RESOURCE_MANAGEMENT);
    EXPECT_EQ(getErrorCategoryFromCode("RKLLM_MODEL_OP_004"), ErrorCategory::MODEL_OPERATION);
    EXPECT_EQ(getErrorCategoryFromCode("RKLLM_MEMORY_005"), ErrorCategory::MEMORY_ALLOCATION);
    EXPECT_EQ(getErrorCategoryFromCode("RKLLM_NATIVE_006"), ErrorCategory::NATIVE_LIBRARY);
    EXPECT_EQ(getErrorCategoryFromCode("RKLLM_VALIDATION_007"), ErrorCategory::VALIDATION);
    EXPECT_EQ(getErrorCategoryFromCode("UNKNOWN_CODE"), ErrorCategory::UNKNOWN);
}

// Exception conversion tests
TEST_F(ErrorHandlerTest, ExceptionToErrorInfo) {
    // Test TypeConversionException
    TypeConversionException typeException("string", napi_number);
    ErrorInfo typeErrorInfo = exceptionToErrorInfo(typeException);
    
    EXPECT_EQ(typeErrorInfo.category, ErrorCategory::TYPE_CONVERSION);
    EXPECT_EQ(typeErrorInfo.code, "RKLLM_TYPE_CONVERSION");
    EXPECT_EQ(typeErrorInfo.severity, ErrorSeverity::ERROR);
    
    // Test ConfigurationException
    ConfigurationException configException("Invalid config");
    ErrorInfo configErrorInfo = exceptionToErrorInfo(configException);
    
    EXPECT_EQ(configErrorInfo.category, ErrorCategory::CONFIGURATION);
    EXPECT_EQ(configErrorInfo.code, "RKLLM_CONFIGURATION");
    
    // Test ResourceException
    ResourceException resourceException("Resource error");
    ErrorInfo resourceErrorInfo = exceptionToErrorInfo(resourceException);
    
    EXPECT_EQ(resourceErrorInfo.category, ErrorCategory::RESOURCE_MANAGEMENT);
    EXPECT_EQ(resourceErrorInfo.code, "RKLLM_RESOURCE");
    
    // Test generic exception
    std::runtime_error genericException("Generic error");
    ErrorInfo genericErrorInfo = exceptionToErrorInfo(genericException);
    
    EXPECT_EQ(genericErrorInfo.category, ErrorCategory::UNKNOWN);
    EXPECT_EQ(genericErrorInfo.code, "RKLLM_UNKNOWN");
}

// Error logging tests (these are hard to test without mocking stderr)
TEST_F(ErrorHandlerTest, LogError) {
    ErrorInfo errorInfo;
    errorInfo.category = ErrorCategory::VALIDATION;
    errorInfo.severity = ErrorSeverity::WARNING;
    errorInfo.code = "TEST_WARNING";
    errorInfo.message = "Test warning message";
    errorInfo.details = "Additional details";
    errorInfo.location = "test.cpp:123";
    
    // This test just ensures the function doesn't crash
    // In a real test environment, we would capture stderr output
    EXPECT_NO_THROW(logError(errorInfo));
    EXPECT_NO_THROW(logError("Simple error message", ErrorSeverity::INFO));
}

// ErrorScope RAII tests
TEST_F(ErrorHandlerTest, ErrorScopeSuccess) {
    bool cleanupCalled = false;
    
    {
        ErrorScope scope("test operation");
        scope.addCleanupFunction([&cleanupCalled]() {
            cleanupCalled = true;
        });
        scope.success(); // Mark as successful
    }
    
    // Cleanup should not be called on success
    EXPECT_FALSE(cleanupCalled);
}

TEST_F(ErrorHandlerTest, ErrorScopeFailure) {
    bool cleanupCalled = false;
    
    {
        ErrorScope scope("test operation");
        scope.addCleanupFunction([&cleanupCalled]() {
            cleanupCalled = true;
        });
        // Don't call success() - simulates failure
    }
    
    // Cleanup should be called on failure
    EXPECT_TRUE(cleanupCalled);
}

TEST_F(ErrorHandlerTest, ErrorScopeMultipleCleanups) {
    int cleanupCount = 0;
    
    {
        ErrorScope scope("test operation");
        scope.addCleanupFunction([&cleanupCount]() { cleanupCount++; });
        scope.addCleanupFunction([&cleanupCount]() { cleanupCount++; });
        scope.addCleanupFunction([&cleanupCount]() { cleanupCount++; });
        // Don't call success()
    }
    
    EXPECT_EQ(cleanupCount, 3);
}

TEST_F(ErrorHandlerTest, ErrorScopeCleanupException) {
    bool secondCleanupCalled = false;
    
    {
        ErrorScope scope("test operation");
        scope.addCleanupFunction([]() {
            throw std::runtime_error("Cleanup error");
        });
        scope.addCleanupFunction([&secondCleanupCalled]() {
            secondCleanupCalled = true;
        });
        // Don't call success()
    }
    
    // Second cleanup should still be called despite first cleanup throwing
    EXPECT_TRUE(secondCleanupCalled);
}

// Type string utility tests
TEST_F(ErrorHandlerTest, GetTypeString) {
    EXPECT_EQ(getTypeString(napi_undefined), "undefined");
    EXPECT_EQ(getTypeString(napi_null), "null");
    EXPECT_EQ(getTypeString(napi_boolean), "boolean");
    EXPECT_EQ(getTypeString(napi_number), "number");
    EXPECT_EQ(getTypeString(napi_string), "string");
    EXPECT_EQ(getTypeString(napi_symbol), "symbol");
    EXPECT_EQ(getTypeString(napi_object), "object");
    EXPECT_EQ(getTypeString(napi_function), "function");
    EXPECT_EQ(getTypeString(napi_external), "external");
    EXPECT_EQ(getTypeString(napi_bigint), "bigint");
    
    // Test unknown type (cast to avoid compiler warning)
    napi_valuetype unknownType = static_cast<napi_valuetype>(999);
    EXPECT_EQ(getTypeString(unknownType), "unknown");
}

// Edge case tests
TEST_F(ErrorHandlerTest, EmptyStringHandling) {
    std::string emptyMessage = "";
    RKLLMException exception(emptyMessage);
    
    EXPECT_STREQ(exception.what(), "");
}

TEST_F(ErrorHandlerTest, LongMessageHandling) {
    std::string longMessage(10000, 'a');
    RKLLMException exception(longMessage);
    
    EXPECT_EQ(std::string(exception.what()), longMessage);
}

} // namespace test
} // namespace utils
} // namespace rkllmjs

// Test runner
int main(int argc, char** argv) {
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}
