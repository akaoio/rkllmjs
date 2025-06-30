#include "error-handler-simple.hpp"
#include <iostream>
#include <sstream>
#include <chrono>
#include <iomanip>

namespace rkllmjs {
namespace utils {

// TypeConversionException with string types
TypeConversionException::TypeConversionException(const std::string& expected, const std::string& actual) 
    : RKLLMException("Type conversion error: expected " + expected + ", got " + actual) {}

// ErrorScope implementation
ErrorScope::ErrorScope(const std::string& operation) 
    : operation_(operation), success_called_(false) {
    logError(ErrorCategory::RESOURCE_MANAGEMENT, ErrorSeverity::LOW, 
             "Starting operation: " + operation_);
}

ErrorScope::~ErrorScope() {
    if (!success_called_) {
        // Operation failed, run cleanup functions
        for (auto& cleanup : cleanup_functions_) {
            try {
                cleanup();
            } catch (const std::exception& e) {
                logError(ErrorCategory::RESOURCE_MANAGEMENT, ErrorSeverity::HIGH,
                        "Cleanup function failed", e.what());
            }
        }
        logError(ErrorCategory::RESOURCE_MANAGEMENT, ErrorSeverity::MEDIUM,
                "Operation failed, cleanup completed: " + operation_);
    }
}

void ErrorScope::addCleanupFunction(std::function<void()> cleanup) {
    cleanup_functions_.push_back(cleanup);
}

void ErrorScope::success() {
    success_called_ = true;
    logError(ErrorCategory::RESOURCE_MANAGEMENT, ErrorSeverity::LOW,
             "Operation completed successfully: " + operation_);
}

// Core error handling functions
void logError(ErrorCategory category, ErrorSeverity severity, 
              const std::string& message, const std::string& details) {
    auto now = std::chrono::system_clock::now();
    auto time_t = std::chrono::system_clock::to_time_t(now);
    
    std::ostringstream oss;
    oss << std::put_time(std::localtime(&time_t), "%Y-%m-%d %H:%M:%S");
    oss << " [" << getSeverityString(severity) << "]";
    oss << " [" << getCategoryString(category) << "]";
    oss << " " << message;
    if (!details.empty()) {
        oss << " - " << details;
    }
    
    std::cerr << oss.str() << std::endl;
}

ErrorInfo createErrorInfo(ErrorCategory category, ErrorSeverity severity,
                         const std::string& code, const std::string& message,
                         const std::string& details, const std::string& location) {
    return ErrorInfo{
        category,
        severity,
        code,
        message,
        details,
        location,
        std::chrono::steady_clock::now()
    };
}

std::string getCategoryString(ErrorCategory category) {
    switch (category) {
        case ErrorCategory::TYPE_CONVERSION: return "TYPE_CONVERSION";
        case ErrorCategory::CONFIGURATION: return "CONFIGURATION";
        case ErrorCategory::RESOURCE_MANAGEMENT: return "RESOURCE_MANAGEMENT";
        case ErrorCategory::MODEL_OPERATION: return "MODEL_OPERATION";
        case ErrorCategory::MEMORY_ALLOCATION: return "MEMORY_ALLOCATION";
        case ErrorCategory::NATIVE_LIBRARY: return "NATIVE_LIBRARY";
        case ErrorCategory::VALIDATION: return "VALIDATION";
        default: return "UNKNOWN";
    }
}

std::string getSeverityString(ErrorSeverity severity) {
    switch (severity) {
        case ErrorSeverity::LOW: return "LOW";
        case ErrorSeverity::MEDIUM: return "MEDIUM";
        case ErrorSeverity::HIGH: return "HIGH";
        case ErrorSeverity::CRITICAL: return "CRITICAL";
        default: return "UNKNOWN";
    }
}

std::string formatErrorMessage(const ErrorInfo& error) {
    std::ostringstream oss;
    oss << "[" << getSeverityString(error.severity) << "]";
    oss << " [" << getCategoryString(error.category) << "]";
    if (!error.code.empty()) {
        oss << " " << error.code << ":";
    }
    oss << " " << error.message;
    if (!error.details.empty()) {
        oss << " - " << error.details;
    }
    if (!error.location.empty()) {
        oss << " (" << error.location << ")";
    }
    return oss.str();
}

// Validation functions
void validateNotEmpty(const std::string& value, const std::string& paramName) {
    if (value.empty()) {
        throw ConfigurationException("Parameter '" + paramName + "' cannot be empty");
    }
}

void validateRange(double value, double min, double max, const std::string& paramName) {
    if (value < min || value > max) {
        std::ostringstream oss;
        oss << "Parameter '" << paramName << "' value " << value 
            << " is out of range [" << min << ", " << max << "]";
        throw ConfigurationException(oss.str());
    }
}

void validatePositive(double value, const std::string& paramName) {
    if (value <= 0.0) {
        std::ostringstream oss;
        oss << "Parameter '" << paramName << "' must be positive, got " << value;
        throw ConfigurationException(oss.str());
    }
}

} // namespace utils
} // namespace rkllmjs