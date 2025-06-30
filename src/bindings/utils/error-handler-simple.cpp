#include "error-handler-simple.hpp"
#include <iostream>
#include <sstream>
#include <chrono>
#include <iomanip>

namespace rkllmjs {
namespace utils {

// Error logging
void logError(const ErrorInfo& errorInfo) {
    auto now = std::chrono::system_clock::now();
    auto time_t = std::chrono::system_clock::to_time_t(now);
    
    std::ostringstream oss;
    oss << std::put_time(std::localtime(&time_t), "%Y-%m-%d %H:%M:%S");
    
    std::string severityStr;
    switch (errorInfo.severity) {
        case ErrorSeverity::INFO: severityStr = "INFO"; break;
        case ErrorSeverity::WARNING: severityStr = "WARN"; break;
        case ErrorSeverity::ERROR: severityStr = "ERROR"; break;
        case ErrorSeverity::CRITICAL: severityStr = "CRITICAL"; break;
    }
    
    std::cerr << "[" << oss.str() << "] [" << severityStr << "] "
              << "[" << errorInfo.code << "] " << errorInfo.message;
    
    if (!errorInfo.details.empty()) {
        std::cerr << " - " << errorInfo.details;
    }
    
    std::cerr << std::endl;
}

void logError(const std::string& message, ErrorSeverity severity) {
    ErrorInfo errorInfo;
    errorInfo.category = ErrorCategory::UNKNOWN;
    errorInfo.severity = severity;
    errorInfo.code = "RKLLM_GENERIC";
    errorInfo.message = message;
    
    logError(errorInfo);
}

// Validation helpers
void validateNotEmpty(const std::string& value, const std::string& paramName) {
    if (value.empty()) {
        throw ConfigurationException("Parameter '" + paramName + "' cannot be empty");
    }
}

void validateRange(int value, int min, int max, const std::string& paramName) {
    if (value < min || value > max) {
        std::ostringstream oss;
        oss << "Parameter '" << paramName << "' must be between " << min << " and " << max << ", got " << value;
        throw ConfigurationException(oss.str());
    }
}

void validateRange(double value, double min, double max, const std::string& paramName) {
    if (value < min || value > max) {
        std::ostringstream oss;
        oss << "Parameter '" << paramName << "' must be between " << min << " and " << max << ", got " << value;
        throw ConfigurationException(oss.str());
    }
}

} // namespace utils
} // namespace rkllmjs
