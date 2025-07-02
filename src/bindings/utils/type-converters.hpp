/**
 * @module utils
 * @purpose Type conversion utilities for JavaScript and C++ interoperability
 * @description Provides safe and efficient type conversion functions between JavaScript 
 *              values and C++ types. Includes comprehensive error handling, validation,
 *              and support for complex data structures. Essential for N-API bindings.
 * @author RKLLMJS Team  
 * @version 1.0.0
 */

#pragma once

#include "../config/build-config.hpp"

// Only include N-API headers when building N-API bindings, not standalone tests
#if defined(RKLLM_NAPI_BINDINGS)
    #include <napi.h>
#endif

#include <string>
#include <vector>
#include <unordered_map>
#include <memory>

namespace rkllmjs {
namespace utils {

/**
 * @brief Result class for safe conversion operations
 * 
 * Used for functions that may fail during conversion
 */
class ConversionResult {
public:
    ConversionResult(bool success, const std::string& error = "") 
        : success_(success), error_(error) {}
    
    bool isSuccess() const { return success_; }
    const std::string& getError() const { return error_; }
    
private:
    bool success_;
    std::string error_;
};

/**
 * @brief Type conversion utilities for JS ↔ C++ interoperability
 * 
 * This module provides safe, efficient conversion functions between
 * JavaScript types (via N-API) and C++ standard library types.
 */

#if defined(RKLLM_NAPI_BINDINGS)
// Full mode: Include N-API type conversions

// String conversions
std::string jsStringToCppString(Napi::Env env, const Napi::Value& jsValue);
Napi::String cppStringToJsString(Napi::Env env, const std::string& cppString);

// Array conversions
template<typename T>
std::vector<T> jsArrayToCppVector(Napi::Env env, const Napi::Array& jsArray);

template<typename T>
Napi::Array cppVectorToJsArray(Napi::Env env, const std::vector<T>& cppVector);

// Object/Map conversions  
std::unordered_map<std::string, std::string> jsObjectToCppStringMap(
    Napi::Env env, const Napi::Object& jsObject);

Napi::Object cppStringMapToJsObject(
    Napi::Env env, const std::unordered_map<std::string, std::string>& cppMap);

// Number conversions
int32_t jsNumberToCppInt32(Napi::Env env, const Napi::Value& jsValue);
double jsNumberToCppDouble(Napi::Env env, const Napi::Value& jsValue);
Napi::Number cppInt32ToJsNumber(Napi::Env env, int32_t cppValue);
Napi::Number cppDoubleToJsNumber(Napi::Env env, double cppValue);

// Boolean conversions
bool jsBooleanToCppBool(Napi::Env env, const Napi::Value& jsValue);
Napi::Boolean cppBoolToJsBoolean(Napi::Env env, bool cppValue);

// Buffer/ArrayBuffer conversions
std::vector<uint8_t> jsBufferToCppBytes(Napi::Env env, const Napi::Value& jsValue);
Napi::Buffer<uint8_t> cppBytesToJsBuffer(Napi::Env env, const std::vector<uint8_t>& bytes);

// Utility functions
bool isValidType(Napi::Env env, const Napi::Value& value, napi_valuetype expectedType);
void validateNotUndefined(Napi::Env env, const Napi::Value& value, const std::string& paramName);
void validateNotNull(Napi::Env env, const Napi::Value& value, const std::string& paramName);

#else
// Production mode: Provide C++ only utility functions

// Basic string utilities for testing
bool validateString(const std::string& str);
std::string normalizeString(const std::string& str);

// Basic vector utilities
template<typename T>
bool validateVector(const std::vector<T>& vec);

// Basic number utilities
bool validateInt32(int32_t value);
bool validateDouble(double value);

#endif

// Common utility functions for all modes
std::string trim(const std::string& str);
std::vector<std::string> split(const std::string& str, char delimiter);
std::string join(const std::vector<std::string>& strings, const std::string& separator);
bool startsWith(const std::string& str, const std::string& prefix);
bool endsWith(const std::string& str, const std::string& suffix);

int32_t stringToInt32(const std::string& str);
double stringToDouble(const std::string& str);
std::string int32ToString(int32_t value);
std::string doubleToString(double value);

std::unordered_map<std::string, std::string> parseKeyValuePairs(const std::string& input, 
                                                                 char pairSeparator = ';',
                                                                 char keyValueSeparator = '=');
std::string mapToString(const std::unordered_map<std::string, std::string>& map,
                       const std::string& pairSeparator = ";",
                       const std::string& keyValueSeparator = "=");

bool isValidString(const std::string& str);
bool isValidNumber(const std::string& str);
bool isValidPath(const std::string& path);
bool isValidRange(double value, double min, double max);

std::vector<uint8_t> stringToBytes(const std::string& str);
std::string bytesToString(const std::vector<uint8_t>& bytes);
std::string bytesToHex(const std::vector<uint8_t>& bytes);
std::vector<uint8_t> hexToBytes(const std::string& hex);

#if defined(RKLLM_NAPI_BINDINGS)
// Template implementations for N-API mode

template<typename T>
std::vector<T> jsArrayToCppVector(Napi::Env env, const Napi::Array& jsArray) {
    std::vector<T> result;
    result.reserve(jsArray.Length());
    
    for (uint32_t i = 0; i < jsArray.Length(); ++i) {
        Napi::Value element = jsArray[i];
        
        if constexpr (std::is_same_v<T, std::string>) {
            result.push_back(jsStringToCppString(env, element));
        } else if constexpr (std::is_same_v<T, int32_t>) {
            result.push_back(jsNumberToCppInt32(env, element));
        } else if constexpr (std::is_same_v<T, double>) {
            result.push_back(jsNumberToCppDouble(env, element));
        } else if constexpr (std::is_same_v<T, bool>) {
            result.push_back(jsBooleanToCppBool(env, element));
        } else {
            static_assert(!std::is_same_v<T, T>, "Unsupported type for array conversion");
        }
    }
    
    return result;
}

template<typename T>
Napi::Array cppVectorToJsArray(Napi::Env env, const std::vector<T>& cppVector) {
    Napi::Array jsArray = Napi::Array::New(env, cppVector.size());
    
    for (size_t i = 0; i < cppVector.size(); ++i) {
        if constexpr (std::is_same_v<T, std::string>) {
            jsArray[i] = cppStringToJsString(env, cppVector[i]);
        } else if constexpr (std::is_same_v<T, int32_t>) {
            jsArray[i] = cppInt32ToJsNumber(env, cppVector[i]);
        } else if constexpr (std::is_same_v<T, double>) {
            jsArray[i] = cppDoubleToJsNumber(env, cppVector[i]);
        } else if constexpr (std::is_same_v<T, bool>) {
            jsArray[i] = cppBoolToJsBoolean(env, cppVector[i]);
        } else {
            static_assert(!std::is_same_v<T, T>, "Unsupported type for array conversion");
        }
    }
    
    return jsArray;
}

#else
// Production mode template implementations

template<typename T>
bool validateVector(const std::vector<T>& vec) {
    return true; // Basic validation - can be extended
}

#endif

} // namespace utils
} // namespace rkllmjs
