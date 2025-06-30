#pragma once

#include <napi.h>
#include <string>
#include <vector>
#include <unordered_map>
#include <memory>

namespace rkllmjs {
namespace utils {

/**
 * @brief Type conversion utilities for JS ↔ C++ interoperability
 * 
 * This module provides safe, efficient conversion functions between
 * JavaScript types (via N-API) and C++ standard library types.
 */

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
Napi::Number cppInt32ToJsNumber(Napi::Env env, int32_t value);
Napi::Number cppDoubleToJsNumber(Napi::Env env, double value);

// Boolean conversions
bool jsBooleanToCppBool(Napi::Env env, const Napi::Value& jsValue);
Napi::Boolean cppBoolToJsBoolean(Napi::Env env, bool value);

// Buffer/ArrayBuffer conversions
std::vector<uint8_t> jsBufferToCppBytes(Napi::Env env, const Napi::Value& jsValue);
Napi::Buffer<uint8_t> cppBytesToJsBuffer(Napi::Env env, const std::vector<uint8_t>& bytes);

// Utility functions
bool isValidType(Napi::Env env, const Napi::Value& value, napi_valuetype expectedType);
void validateNotUndefined(Napi::Env env, const Napi::Value& value, const std::string& paramName);
void validateNotNull(Napi::Env env, const Napi::Value& value, const std::string& paramName);

// Template implementations
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
            static_assert(false, "Unsupported type for array conversion");
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
            static_assert(false, "Unsupported type for array conversion");
        }
    }
    
    return jsArray;
}

} // namespace utils
} // namespace rkllmjs
