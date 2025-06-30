#include "type-converters.hpp"
#include "error-handler.hpp"
#include <stdexcept>

namespace rkllmjs {
namespace utils {

// String conversions
std::string jsStringToCppString(Napi::Env env, const Napi::Value& jsValue) {
    if (!jsValue.IsString()) {
        throwConversionError(env, "Expected string", jsValue.Type());
    }
    return jsValue.As<Napi::String>().Utf8Value();
}

Napi::String cppStringToJsString(Napi::Env env, const std::string& cppString) {
    return Napi::String::New(env, cppString);
}

// Object/Map conversions
std::unordered_map<std::string, std::string> jsObjectToCppStringMap(
    Napi::Env env, const Napi::Object& jsObject) {
    
    std::unordered_map<std::string, std::string> result;
    Napi::Array keys = jsObject.GetPropertyNames();
    
    for (uint32_t i = 0; i < keys.Length(); ++i) {
        Napi::Value key = keys[i];
        std::string keyStr = jsStringToCppString(env, key);
        Napi::Value value = jsObject.Get(key);
        std::string valueStr = jsStringToCppString(env, value);
        
        result[keyStr] = valueStr;
    }
    
    return result;
}

Napi::Object cppStringMapToJsObject(
    Napi::Env env, const std::unordered_map<std::string, std::string>& cppMap) {
    
    Napi::Object jsObject = Napi::Object::New(env);
    
    for (const auto& [key, value] : cppMap) {
        jsObject.Set(key, value);
    }
    
    return jsObject;
}

// Number conversions
int32_t jsNumberToCppInt32(Napi::Env env, const Napi::Value& jsValue) {
    if (!jsValue.IsNumber()) {
        throwConversionError(env, "Expected number", jsValue.Type());
    }
    return jsValue.As<Napi::Number>().Int32Value();
}

double jsNumberToCppDouble(Napi::Env env, const Napi::Value& jsValue) {
    if (!jsValue.IsNumber()) {
        throwConversionError(env, "Expected number", jsValue.Type());
    }
    return jsValue.As<Napi::Number>().DoubleValue();
}

Napi::Number cppInt32ToJsNumber(Napi::Env env, int32_t value) {
    return Napi::Number::New(env, value);
}

Napi::Number cppDoubleToJsNumber(Napi::Env env, double value) {
    return Napi::Number::New(env, value);
}

// Boolean conversions
bool jsBooleanToCppBool(Napi::Env env, const Napi::Value& jsValue) {
    if (!jsValue.IsBoolean()) {
        throwConversionError(env, "Expected boolean", jsValue.Type());
    }
    return jsValue.As<Napi::Boolean>().Value();
}

Napi::Boolean cppBoolToJsBoolean(Napi::Env env, bool value) {
    return Napi::Boolean::New(env, value);
}

// Buffer/ArrayBuffer conversions
std::vector<uint8_t> jsBufferToCppBytes(Napi::Env env, const Napi::Value& jsValue) {
    if (!jsValue.IsBuffer() && !jsValue.IsArrayBuffer() && !jsValue.IsTypedArray()) {
        throwConversionError(env, "Expected Buffer, ArrayBuffer, or TypedArray", jsValue.Type());
    }
    
    if (jsValue.IsBuffer()) {
        Napi::Buffer<uint8_t> buffer = jsValue.As<Napi::Buffer<uint8_t>>();
        return std::vector<uint8_t>(buffer.Data(), buffer.Data() + buffer.Length());
    }
    
    if (jsValue.IsArrayBuffer()) {
        Napi::ArrayBuffer arrayBuffer = jsValue.As<Napi::ArrayBuffer>();
        uint8_t* data = static_cast<uint8_t*>(arrayBuffer.Data());
        return std::vector<uint8_t>(data, data + arrayBuffer.ByteLength());
    }
    
    if (jsValue.IsTypedArray()) {
        Napi::TypedArray typedArray = jsValue.As<Napi::TypedArray>();
        Napi::ArrayBuffer arrayBuffer = typedArray.ArrayBuffer();
        uint8_t* data = static_cast<uint8_t*>(arrayBuffer.Data()) + typedArray.ByteOffset();
        return std::vector<uint8_t>(data, data + typedArray.ByteLength());
    }
    
    // Should never reach here
    throwError(env, "Internal error", "Unexpected buffer type");
    return {};
}

Napi::Buffer<uint8_t> cppBytesToJsBuffer(Napi::Env env, const std::vector<uint8_t>& bytes) {
    return Napi::Buffer<uint8_t>::Copy(env, bytes.data(), bytes.size());
}

// Utility functions
bool isValidType(Napi::Env env, const Napi::Value& value, napi_valuetype expectedType) {
    napi_valuetype actualType;
    napi_status status = napi_typeof(env, value, &actualType);
    return (status == napi_ok) && (actualType == expectedType);
}

void validateNotUndefined(Napi::Env env, const Napi::Value& value, const std::string& paramName) {
    if (value.IsUndefined()) {
        throwError(env, "Parameter validation failed", 
                  "Parameter '" + paramName + "' cannot be undefined");
    }
}

void validateNotNull(Napi::Env env, const Napi::Value& value, const std::string& paramName) {
    if (value.IsNull()) {
        throwError(env, "Parameter validation failed", 
                  "Parameter '" + paramName + "' cannot be null");
    }
}

} // namespace utils
} // namespace rkllmjs
