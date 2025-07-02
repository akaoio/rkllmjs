#pragma once

#include "../config/build-config.hpp"
#include <string>
#include <exception>
#include <memory>
#include <functional>
#include <vector>

// Only include N-API headers when building N-API bindings, not standalone tests
#if defined(RKLLM_NAPI_BINDINGS)
    #include <napi.h>
#endif

namespace rkllmjs {
namespace utils {

/**
 * @brief Unified error handling and exception management for RKLLM C++ modules
 * 
 * This module provides standardized error handling, exception conversion,
 * and error logging functionality across all RKLLM C++ components.
 */

/**
 * Custom exception types for RKLLM operations
 */
class RKLLMException : public std::exception {
public:
    explicit RKLLMException(const std::string& message) : message_(message) {}
    const char* what() const noexcept override { return message_.c_str(); }
    
private:
    std::string message_;
};

class TypeConversionException : public RKLLMException {
public:
    explicit TypeConversionException(const std::string& message) : RKLLMException(message) {}
    TypeConversionException(const std::string& expected, const std::string& actual);
#if defined(RKLLM_COMPILE_MODE_REAL) && defined(RKLLM_NAPI_BINDINGS)
    TypeConversionException(const std::string& expected, napi_valuetype actual);
#endif
};

class ConfigurationException : public RKLLMException {
public:
    explicit ConfigurationException(const std::string& message) : RKLLMException(message) {}
};

class ResourceException : public RKLLMException {
public:
    explicit ResourceException(const std::string& message) : RKLLMException(message) {}
};

/**
 * Error severity levels
 */
enum class ErrorSeverity {
    INFO,
    WARNING,
    ERROR,
    CRITICAL
};

/**
 * Error categories for structured error handling
 */
enum class ErrorCategory {
    TYPE_CONVERSION,
    CONFIGURATION,
    RESOURCE_MANAGEMENT,
    MODEL_OPERATION,
    MEMORY_ALLOCATION,
    NATIVE_LIBRARY,
    VALIDATION,
    UNKNOWN
};

/**
 * Error information structure
 */
struct ErrorInfo {
    ErrorCategory category;
    ErrorSeverity severity;
    std::string code;
    std::string message;
    std::string details;
    std::string location; // File:line info
};

#if defined(RKLLM_COMPILE_MODE_REAL) && defined(RKLLM_NAPI_BINDINGS)
// Utility function declarations
std::string getTypeString(napi_valuetype type);

// Core error handling functions
void throwError(Napi::Env env, const std::string& message, const std::string& details = "");
void throwError(Napi::Env env, const ErrorInfo& errorInfo);
void throwConversionError(Napi::Env env, const std::string& expected, napi_valuetype actual);
void throwConfigurationError(Napi::Env env, const std::string& message);
void throwResourceError(Napi::Env env, const std::string& message);

// Error creation functions
Napi::Error createError(Napi::Env env, const std::string& message, const std::string& code = "");
Napi::Error createError(Napi::Env env, const ErrorInfo& errorInfo);

// Native error handling
void handleNativeError(Napi::Env env, int errorCode, const std::string& operation);
std::string getNativeErrorMessage(int errorCode);

// Error logging
void logError(const ErrorInfo& errorInfo);
void logError(const std::string& message, ErrorSeverity severity = ErrorSeverity::ERROR);
void logError(ErrorCategory category, ErrorSeverity severity, 
              const std::string& message, const std::string& details = "");

// Exception conversion utilities
ErrorInfo exceptionToErrorInfo(const std::exception& e);
void rethrowAsJSError(Napi::Env env, const std::exception& e);

// Error code utilities
std::string getErrorCodeString(ErrorCategory category, int code);
ErrorCategory getErrorCategoryFromCode(const std::string& code);

// Validation helpers
void validateParameter(Napi::Env env, const Napi::Value& value, const std::string& paramName);
void validateStringParameter(Napi::Env env, const Napi::Value& value, const std::string& paramName);
void validateNumberParameter(Napi::Env env, const Napi::Value& value, const std::string& paramName);
void validateObjectParameter(Napi::Env env, const Napi::Value& value, const std::string& paramName);
void validateArrayParameter(Napi::Env env, const Napi::Value& value, const std::string& paramName);

#else
// Standard C++ mode: Error handling functions without N-API

// Error logging (production mode)
void logError(const ErrorInfo& errorInfo);
void logError(const std::string& message, ErrorSeverity severity = ErrorSeverity::ERROR);
void logError(ErrorCategory category, ErrorSeverity severity, 
              const std::string& message, const std::string& details = "");

// Exception conversion utilities (production mode)
ErrorInfo exceptionToErrorInfo(const std::exception& e);

// Error code utilities (production mode)
std::string getErrorCodeString(ErrorCategory category, int code);
ErrorCategory getErrorCategoryFromCode(const std::string& code);

// Utility functions (production mode)
std::string getCategoryString(ErrorCategory category);
std::string getSeverityString(ErrorSeverity severity);
std::string formatErrorMessage(const ErrorInfo& error);
ErrorInfo createErrorInfo(ErrorCategory category, ErrorSeverity severity,
                         const std::string& code, const std::string& message,
                         const std::string& details = "", const std::string& location = "");

// Validation functions (production mode)
void validateNotEmpty(const std::string& value, const std::string& paramName);
void validateRange(double value, double min, double max, const std::string& paramName);
void validatePositive(double value, const std::string& paramName);

#endif

// Macros for location tracking
#define RKLLM_ERROR_LOCATION __FILE__ ":" + std::to_string(__LINE__)
#define RKLLM_THROW_ERROR(env, message) \
    throwError(env, message, RKLLM_ERROR_LOCATION)
#define RKLLM_LOG_ERROR(message) \
    logError(message + " [" + RKLLM_ERROR_LOCATION + "]")

// RAII error scope for automatic cleanup
class ErrorScope {
public:
    explicit ErrorScope(const std::string& operation);
    ~ErrorScope();
    
    void addCleanupFunction(std::function<void()> cleanup);
    void success(); // Mark operation as successful
    
private:
    std::string operation_;
    std::vector<std::function<void()>> cleanupFunctions_;
    bool successful_;
};

} // namespace utils
} // namespace rkllmjs
