#pragma once

#include <string>
#include <exception>

namespace rkllmjs {
namespace utils {

/**
 * @brief Simple error handling without N-API dependencies
 * 
 * This is a simplified version for initial testing and building.
 * Full N-API integration will be added later.
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
    CONFIGURATION,
    RESOURCE_MANAGEMENT,
    MODEL_OPERATION,
    MEMORY_ALLOCATION,
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
};

// Error logging
void logError(const ErrorInfo& errorInfo);
void logError(const std::string& message, ErrorSeverity severity = ErrorSeverity::ERROR);

// Validation helpers
void validateNotEmpty(const std::string& value, const std::string& paramName);
void validateRange(int value, int min, int max, const std::string& paramName);
void validateRange(double value, double min, double max, const std::string& paramName);

} // namespace utils
} // namespace rkllmjs
