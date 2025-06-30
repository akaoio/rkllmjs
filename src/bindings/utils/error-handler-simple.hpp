#pragma once

#include <string>
#include <exception>
#include <memory>
#include <functional>
#include <chrono>

namespace rkllmjs {
namespace utils {

/**
 * @brief Unified error handling and exception management for RKLLM C++ modules
 * 
 * This module provides standardized error handling, exception conversion,
 * and error logging functionality across all RKLLM C++ components.
 * 
 * NOTE: This is a simplified version without N-API dependencies for standalone compilation.
 * The full N-API version is available when building with Node.js headers.
 */

/**
 * Error categories for RKLLM operations
 */
enum class ErrorCategory {
    TYPE_CONVERSION,
    CONFIGURATION,
    RESOURCE_MANAGEMENT,
    MODEL_OPERATION,
    MEMORY_ALLOCATION,
    NATIVE_LIBRARY,
    VALIDATION
};

/**
 * Error severity levels
 */
enum class ErrorSeverity {
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL
};

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
    TypeConversionException(const std::string& expected, const std::string& actual);
    explicit TypeConversionException(const std::string& message) : RKLLMException(message) {}
};

class ConfigurationException : public RKLLMException {
public:
    explicit ConfigurationException(const std::string& message) : RKLLMException(message) {}
};

class ResourceException : public RKLLMException {
public:
    explicit ResourceException(const std::string& message) : RKLLMException(message) {}
};

class ModelException : public RKLLMException {
public:
    explicit ModelException(const std::string& message) : RKLLMException(message) {}
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
    std::string location;
    std::chrono::steady_clock::time_point timestamp;
};

/**
 * RAII error scope for automatic cleanup
 */
class ErrorScope {
public:
    explicit ErrorScope(const std::string& operation);
    ~ErrorScope();
    
    void addCleanupFunction(std::function<void()> cleanup);
    void success();
    
private:
    std::string operation_;
    std::vector<std::function<void()>> cleanup_functions_;
    bool success_called_;
};

/**
 * Core error handling functions (simplified - no N-API dependencies)
 */

// Log error with timestamp and details
void logError(ErrorCategory category, ErrorSeverity severity, 
              const std::string& message, const std::string& details = "");

// Create error info structure
ErrorInfo createErrorInfo(ErrorCategory category, ErrorSeverity severity,
                         const std::string& code, const std::string& message,
                         const std::string& details = "", const std::string& location = "");

// Get string representation of error category
std::string getCategoryString(ErrorCategory category);

// Get string representation of error severity  
std::string getSeverityString(ErrorSeverity severity);

// Format error message with timestamp
std::string formatErrorMessage(const ErrorInfo& error);

// Basic validation functions (without N-API)
void validateNotEmpty(const std::string& value, const std::string& paramName);
void validateRange(double value, double min, double max, const std::string& paramName);
void validatePositive(double value, const std::string& paramName);

} // namespace utils
} // namespace rkllmjs