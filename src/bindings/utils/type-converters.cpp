#include "type-converters.hpp"
#include "error-handler.hpp"
#include <algorithm>
#include <sstream>
#include <cctype>
#include <iomanip>
#include <functional>
#include <cmath>

namespace rkllmjs {
namespace utils {

// String utilities
std::string trim(const std::string& str) {
    auto start = str.begin();
    auto end = str.end();
    
    // Trim from start
    start = std::find_if(start, end, [](unsigned char ch) {
        return !std::isspace(ch);
    });
    
    // Trim from end
    end = std::find_if(str.rbegin(), str.rend(), [](unsigned char ch) {
        return !std::isspace(ch);
    }).base();
    
    return (start < end) ? std::string(start, end) : std::string();
}

std::vector<std::string> split(const std::string& str, char delimiter) {
    std::vector<std::string> result;
    std::stringstream ss(str);
    std::string item;
    
    while (std::getline(ss, item, delimiter)) {
        result.push_back(trim(item));
    }
    
    return result;
}

std::string join(const std::vector<std::string>& strings, const std::string& separator) {
    if (strings.empty()) return "";
    
    std::ostringstream oss;
    oss << strings[0];
    for (size_t i = 1; i < strings.size(); ++i) {
        oss << separator << strings[i];
    }
    return oss.str();
}

bool startsWith(const std::string& str, const std::string& prefix) {
    return str.length() >= prefix.length() && 
           str.compare(0, prefix.length(), prefix) == 0;
}

bool endsWith(const std::string& str, const std::string& suffix) {
    return str.length() >= suffix.length() && 
           str.compare(str.length() - suffix.length(), suffix.length(), suffix) == 0;
}

// Number conversion utilities
int32_t stringToInt32(const std::string& str) {
    try {
        return std::stoi(str);
    } catch (const std::exception& e) {
        throw TypeConversionException("Failed to convert string to int32: " + str);
    }
}

double stringToDouble(const std::string& str) {
    try {
        return std::stod(str);
    } catch (const std::exception& e) {
        throw TypeConversionException("Failed to convert string to double: " + str);
    }
}

std::string int32ToString(int32_t value) {
    return std::to_string(value);
}

std::string doubleToString(double value) {
    return std::to_string(value);
}

// Map utilities
std::unordered_map<std::string, std::string> parseKeyValuePairs(const std::string& input, 
                                                                 char pairSeparator,
                                                                 char keyValueSeparator) {
    std::unordered_map<std::string, std::string> result;
    
    auto pairs = split(input, pairSeparator);
    for (const auto& pair : pairs) {
        auto kvPos = pair.find(keyValueSeparator);
        if (kvPos != std::string::npos) {
            std::string key = trim(pair.substr(0, kvPos));
            std::string value = trim(pair.substr(kvPos + 1));
            if (!key.empty()) {
                result[key] = value;
            }
        }
    }
    
    return result;
}

std::string mapToString(const std::unordered_map<std::string, std::string>& map,
                       const std::string& pairSeparator,
                       const std::string& keyValueSeparator) {
    std::vector<std::string> pairs;
    for (const auto& kv : map) {
        pairs.push_back(kv.first + keyValueSeparator + kv.second);
    }
    return join(pairs, pairSeparator);
}

// Validation utilities
bool isValidString(const std::string& str) {
    return !str.empty() && !trim(str).empty();
}

bool isValidNumber(const std::string& str) {
    if (str.empty()) return false;
    
    try {
        std::stod(str);
        return true;
    } catch (const std::exception&) {
        return false;
    }
}

bool isValidPath(const std::string& path) {
    if (path.empty()) return false;
    
    // Basic path validation - no control characters
    for (char c : path) {
        if (c < 32 && c != '\t' && c != '\n' && c != '\r') {
            return false;
        }
    }
    
    return true;
}

bool isValidRange(double value, double min, double max) {
    return value >= min && value <= max;
}

// Buffer/Binary utilities
std::vector<uint8_t> stringToBytes(const std::string& str) {
    return std::vector<uint8_t>(str.begin(), str.end());
}

std::string bytesToString(const std::vector<uint8_t>& bytes) {
    return std::string(bytes.begin(), bytes.end());
}

std::string bytesToHex(const std::vector<uint8_t>& bytes) {
    std::ostringstream oss;
    oss << std::hex << std::setfill('0');
    for (uint8_t b : bytes) {
        oss << std::setw(2) << static_cast<unsigned>(b);
    }
    return oss.str();
}

std::vector<uint8_t> hexToBytes(const std::string& hex) {
    std::vector<uint8_t> result;
    for (size_t i = 0; i < hex.length(); i += 2) {
        if (i + 1 < hex.length()) {
            std::string byteStr = hex.substr(i, 2);
            uint8_t byte = static_cast<uint8_t>(std::stoul(byteStr, nullptr, 16));
            result.push_back(byte);
        }
    }
    return result;
}

// Error-safe conversion functions
ConversionResult safeStringToInt32(const std::string& str, int32_t& result) {
    try {
        result = std::stoi(str);
        return ConversionResult(true);
    } catch (const std::exception& e) {
        return ConversionResult(false, "Failed to convert to int32: " + std::string(e.what()));
    }
}

ConversionResult safeStringToDouble(const std::string& str, double& result) {
    try {
        result = std::stod(str);
        return ConversionResult(true);
    } catch (const std::exception& e) {
        return ConversionResult(false, "Failed to convert to double: " + std::string(e.what()));
    }
}

#if RKLLMJS_MODE_SANDBOX
// SANDBOX mode: Implement the utility functions for testing

bool validateString(const std::string& str) {
    return isValidString(str);
}

std::string normalizeString(const std::string& str) {
    return trim(str);
}

bool validateInt32(int32_t value) {
    // Basic validation - check if value is within reasonable bounds
    return value >= INT32_MIN && value <= INT32_MAX;
}

bool validateDouble(double value) {
    return std::isfinite(value); // Check for NaN and infinity
}

#else
// REAL mode: Implement N-API conversion functions

std::string jsStringToCppString(Napi::Env env, const Napi::Value& jsValue) {
    if (!jsValue.IsString()) {
        throw Napi::TypeError::New(env, "Expected string value");
    }
    return jsValue.As<Napi::String>().Utf8Value();
}

Napi::String cppStringToJsString(Napi::Env env, const std::string& cppString) {
    return Napi::String::New(env, cppString);
}

std::unordered_map<std::string, std::string> jsObjectToCppStringMap(
    Napi::Env env, const Napi::Object& jsObject) {
    std::unordered_map<std::string, std::string> result;
    
    Napi::Array propertyNames = jsObject.GetPropertyNames();
    for (uint32_t i = 0; i < propertyNames.Length(); ++i) {
        Napi::Value key = propertyNames[i];
        std::string keyStr = jsStringToCppString(env, key);
        Napi::Value value = jsObject.Get(key);
        
        if (value.IsString()) {
            result[keyStr] = jsStringToCppString(env, value);
        }
    }
    
    return result;
}

Napi::Object cppStringMapToJsObject(
    Napi::Env env, const std::unordered_map<std::string, std::string>& cppMap) {
    Napi::Object jsObject = Napi::Object::New(env);
    
    for (const auto& pair : cppMap) {
        jsObject.Set(pair.first, pair.second);
    }
    
    return jsObject;
}

int32_t jsNumberToCppInt32(Napi::Env env, const Napi::Value& jsValue) {
    if (!jsValue.IsNumber()) {
        throw Napi::TypeError::New(env, "Expected number value");
    }
    return jsValue.As<Napi::Number>().Int32Value();
}

double jsNumberToCppDouble(Napi::Env env, const Napi::Value& jsValue) {
    if (!jsValue.IsNumber()) {
        throw Napi::TypeError::New(env, "Expected number value");
    }
    return jsValue.As<Napi::Number>().DoubleValue();
}

Napi::Number cppInt32ToJsNumber(Napi::Env env, int32_t cppValue) {
    return Napi::Number::New(env, cppValue);
}

Napi::Number cppDoubleToJsNumber(Napi::Env env, double cppValue) {
    return Napi::Number::New(env, cppValue);
}

bool jsBooleanToCppBool(Napi::Env env, const Napi::Value& jsValue) {
    if (!jsValue.IsBoolean()) {
        throw Napi::TypeError::New(env, "Expected boolean value");
    }
    return jsValue.As<Napi::Boolean>().Value();
}

Napi::Boolean cppBoolToJsBoolean(Napi::Env env, bool cppValue) {
    return Napi::Boolean::New(env, cppValue);
}

std::vector<uint8_t> jsBufferToCppBytes(Napi::Env env, const Napi::Value& jsValue) {
    if (jsValue.IsBuffer()) {
        Napi::Buffer<uint8_t> buffer = jsValue.As<Napi::Buffer<uint8_t>>();
        return std::vector<uint8_t>(buffer.Data(), buffer.Data() + buffer.Length());
    } else if (jsValue.IsArrayBuffer()) {
        Napi::ArrayBuffer arrayBuffer = jsValue.As<Napi::ArrayBuffer>();
        uint8_t* data = static_cast<uint8_t*>(arrayBuffer.Data());
        return std::vector<uint8_t>(data, data + arrayBuffer.ByteLength());
    } else {
        throw Napi::TypeError::New(env, "Expected Buffer or ArrayBuffer");
    }
}

Napi::Buffer<uint8_t> cppBytesToJsBuffer(Napi::Env env, const std::vector<uint8_t>& bytes) {
    return Napi::Buffer<uint8_t>::Copy(env, bytes.data(), bytes.size());
}

bool isValidType(Napi::Env env, const Napi::Value& value, napi_valuetype expectedType) {
    napi_valuetype actualType;
    napi_status status = napi_typeof(env, value, &actualType);
    return status == napi_ok && actualType == expectedType;
}

void validateNotUndefined(Napi::Env env, const Napi::Value& value, const std::string& paramName) {
    if (value.IsUndefined()) {
        throw Napi::TypeError::New(env, "Parameter '" + paramName + "' is undefined");
    }
}

void validateNotNull(Napi::Env env, const Napi::Value& value, const std::string& paramName) {
    if (value.IsNull()) {
        throw Napi::TypeError::New(env, "Parameter '" + paramName + "' is null");
    }
}

#endif

} // namespace utils
} // namespace rkllmjs