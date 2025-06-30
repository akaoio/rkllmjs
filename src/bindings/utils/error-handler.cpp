#include "error-handler.hpp"
#include <iostream>
#include <sstream>
#include <chrono>
#include <iomanip>
#include <functional>

namespace rkllmjs {
namespace utils {

// TypeConversionException implementation
TypeConversionException::TypeConversionException(const std::string& expected, napi_valuetype actual) 
    : RKLLMException("Type conversion failed: expected " + expected + ", got " + getTypeString(actual)) {}

// Helper function to convert napi_valuetype to string
std::string getTypeString(napi_valuetype type) {
    switch (type) {
        case napi_undefined: return "undefined";
        case napi_null: return "null";
        case napi_boolean: return "boolean";
        case napi_number: return "number";
        case napi_string: return "string";
        case napi_symbol: return "symbol";
        case napi_object: return "object";
        case napi_function: return "function";
        case napi_external: return "external";
        case napi_bigint: return "bigint";
        default: return "unknown";
    }
}

// Core error handling functions
void throwError(Napi::Env env, const std::string& message, const std::string& details) {
    std::string fullMessage = message;
    if (!details.empty()) {
        fullMessage += " [" + details + "]";
    }
    
    Napi::Error::New(env, fullMessage).ThrowAsJavaScriptException();
}

void throwError(Napi::Env env, const ErrorInfo& errorInfo) {
    std::ostringstream oss;
    oss << "[" << getErrorCodeString(errorInfo.category, 0) << "] " 
        << errorInfo.message;
    
    if (!errorInfo.details.empty()) {
        oss << " - " << errorInfo.details;
    }
    
    if (!errorInfo.location.empty()) {
        oss << " (" << errorInfo.location << ")";
    }
    
    Napi::Error error = Napi::Error::New(env, oss.str());
    error.Set("code", errorInfo.code);
    error.Set("category", static_cast<int>(errorInfo.category));
    error.Set("severity", static_cast<int>(errorInfo.severity));
    
    error.ThrowAsJavaScriptException();
}

void throwConversionError(Napi::Env env, const std::string& expected, napi_valuetype actual) {
    throw TypeConversionException(expected, actual);
}

void throwConfigurationError(Napi::Env env, const std::string& message) {
    ErrorInfo errorInfo;
    errorInfo.category = ErrorCategory::CONFIGURATION;
    errorInfo.severity = ErrorSeverity::ERROR;
    errorInfo.code = "RKLLM_CONFIG_ERROR";
    errorInfo.message = message;
    
    throwError(env, errorInfo);
}

void throwResourceError(Napi::Env env, const std::string& message) {
    ErrorInfo errorInfo;
    errorInfo.category = ErrorCategory::RESOURCE_MANAGEMENT;
    errorInfo.severity = ErrorSeverity::ERROR;
    errorInfo.code = "RKLLM_RESOURCE_ERROR";
    errorInfo.message = message;
    
    throwError(env, errorInfo);
}

// Error creation functions
Napi::Error createError(Napi::Env env, const std::string& message, const std::string& code) {
    Napi::Error error = Napi::Error::New(env, message);
    if (!code.empty()) {
        error.Set("code", code);
    }
    return error;
}

Napi::Error createError(Napi::Env env, const ErrorInfo& errorInfo) {
    std::ostringstream oss;
    oss << "[" << getErrorCodeString(errorInfo.category, 0) << "] " 
        << errorInfo.message;
    
    if (!errorInfo.details.empty()) {
        oss << " - " << errorInfo.details;
    }
    
    Napi::Error error = Napi::Error::New(env, oss.str());
    error.Set("code", errorInfo.code);
    error.Set("category", static_cast<int>(errorInfo.category));
    error.Set("severity", static_cast<int>(errorInfo.severity));
    
    return error;
}

// Native error handling
void handleNativeError(Napi::Env env, int errorCode, const std::string& operation) {
    if (errorCode == 0) return; // Success
    
    std::string message = "Native operation failed: " + operation;
    std::string nativeMessage = getNativeErrorMessage(errorCode);
    
    ErrorInfo errorInfo;
    errorInfo.category = ErrorCategory::NATIVE_LIBRARY;
    errorInfo.severity = ErrorSeverity::ERROR;
    errorInfo.code = "RKLLM_NATIVE_ERROR_" + std::to_string(errorCode);
    errorInfo.message = message;
    errorInfo.details = nativeMessage;
    
    throwError(env, errorInfo);
}

std::string getNativeErrorMessage(int errorCode) {
    // Map RKLLM error codes to human-readable messages
    switch (errorCode) {
        case -1: return "General error";
        case -2: return "Invalid parameter";
        case -3: return "Memory allocation failed";
        case -4: return "Model file not found";
        case -5: return "Model format invalid";
        case -6: return "Hardware not supported";
        case -7: return "Resource exhausted";
        default: return "Unknown error (code: " + std::to_string(errorCode) + ")";
    }
}

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
    
    if (!errorInfo.location.empty()) {
        std::cerr << " (" << errorInfo.location << ")";
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

// Exception conversion utilities
ErrorInfo exceptionToErrorInfo(const std::exception& e) {
    ErrorInfo errorInfo;
    errorInfo.message = e.what();
    errorInfo.severity = ErrorSeverity::ERROR;
    
    // Try to determine error category from exception type
    if (dynamic_cast<const TypeConversionException*>(&e)) {
        errorInfo.category = ErrorCategory::TYPE_CONVERSION;
        errorInfo.code = "RKLLM_TYPE_CONVERSION";
    } else if (dynamic_cast<const ConfigurationException*>(&e)) {
        errorInfo.category = ErrorCategory::CONFIGURATION;
        errorInfo.code = "RKLLM_CONFIGURATION";
    } else if (dynamic_cast<const ResourceException*>(&e)) {
        errorInfo.category = ErrorCategory::RESOURCE_MANAGEMENT;
        errorInfo.code = "RKLLM_RESOURCE";
    } else {
        errorInfo.category = ErrorCategory::UNKNOWN;
        errorInfo.code = "RKLLM_UNKNOWN";
    }
    
    return errorInfo;
}

void rethrowAsJSError(Napi::Env env, const std::exception& e) {
    ErrorInfo errorInfo = exceptionToErrorInfo(e);
    throwError(env, errorInfo);
}

// Error code utilities
std::string getErrorCodeString(ErrorCategory category, int code) {
    switch (category) {
        case ErrorCategory::TYPE_CONVERSION: return "TYPE_CONV";
        case ErrorCategory::CONFIGURATION: return "CONFIG";
        case ErrorCategory::RESOURCE_MANAGEMENT: return "RESOURCE";
        case ErrorCategory::MODEL_OPERATION: return "MODEL_OP";
        case ErrorCategory::MEMORY_ALLOCATION: return "MEMORY";
        case ErrorCategory::NATIVE_LIBRARY: return "NATIVE";
        case ErrorCategory::VALIDATION: return "VALIDATION";
        default: return "UNKNOWN";
    }
}

ErrorCategory getErrorCategoryFromCode(const std::string& code) {
    if (code.find("TYPE_CONV") != std::string::npos) return ErrorCategory::TYPE_CONVERSION;
    if (code.find("CONFIG") != std::string::npos) return ErrorCategory::CONFIGURATION;
    if (code.find("RESOURCE") != std::string::npos) return ErrorCategory::RESOURCE_MANAGEMENT;
    if (code.find("MODEL_OP") != std::string::npos) return ErrorCategory::MODEL_OPERATION;
    if (code.find("MEMORY") != std::string::npos) return ErrorCategory::MEMORY_ALLOCATION;
    if (code.find("NATIVE") != std::string::npos) return ErrorCategory::NATIVE_LIBRARY;
    if (code.find("VALIDATION") != std::string::npos) return ErrorCategory::VALIDATION;
    return ErrorCategory::UNKNOWN;
}

// Validation helpers
void validateParameter(Napi::Env env, const Napi::Value& value, const std::string& paramName) {
    if (value.IsUndefined()) {
        throwError(env, "Parameter '" + paramName + "' is required");
    }
    if (value.IsNull()) {
        throwError(env, "Parameter '" + paramName + "' cannot be null");
    }
}

void validateStringParameter(Napi::Env env, const Napi::Value& value, const std::string& paramName) {
    validateParameter(env, value, paramName);
    if (!value.IsString()) {
        throwConversionError(env, "string", value.Type());
    }
}

void validateNumberParameter(Napi::Env env, const Napi::Value& value, const std::string& paramName) {
    validateParameter(env, value, paramName);
    if (!value.IsNumber()) {
        throwConversionError(env, "number", value.Type());
    }
}

void validateObjectParameter(Napi::Env env, const Napi::Value& value, const std::string& paramName) {
    validateParameter(env, value, paramName);
    if (!value.IsObject()) {
        throwConversionError(env, "object", value.Type());
    }
}

void validateArrayParameter(Napi::Env env, const Napi::Value& value, const std::string& paramName) {
    validateParameter(env, value, paramName);
    if (!value.IsArray()) {
        throwConversionError(env, "array", value.Type());
    }
}

// ErrorScope implementation
ErrorScope::ErrorScope(const std::string& operation) 
    : operation_(operation), successful_(false) {
}

ErrorScope::~ErrorScope() {
    if (!successful_) {
        // Operation failed, run cleanup functions
        for (auto& cleanup : cleanupFunctions_) {
            try {
                cleanup();
            } catch (const std::exception& e) {
                logError("Cleanup failed in ErrorScope for " + operation_ + ": " + e.what());
            }
        }
    }
}

void ErrorScope::addCleanupFunction(std::function<void()> cleanup) {
    cleanupFunctions_.push_back(cleanup);
}

void ErrorScope::success() {
    successful_ = true;
}

} // namespace utils
} // namespace rkllmjs
