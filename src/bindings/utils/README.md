# RKLLMJS Utils Module

> **Type conversion utilities and error handling for RKLLMJS C++ modules**

## Overview

The Utils module provides essential utilities for seamless interoperability between JavaScript and C++ code in RKLLMJS. It contains two main components:

1. **Type Converters** - Safe, efficient conversion between JS and C++ types
2. **Error Handler** - Unified error handling and exception management

## Architecture

```
src/bindings/utils/
├── type-converters.hpp     # Type conversion interfaces
├── type-converters.cpp     # Type conversion implementations  
├── error-handler.hpp       # Error handling interfaces
├── error-handler.cpp       # Error handling implementations
├── type-converters.test.cpp # Type converter unit tests
├── error-handler.test.cpp   # Error handler unit tests
├── Makefile                # Build configuration
└── README.md              # This file
```

## Components

### Type Converters (`type-converters.hpp/cpp`)

Provides safe, efficient conversion functions between JavaScript types (via N-API) and C++ standard library types.

**Features:**
- String conversions (JS ↔ C++ std::string)
- Array conversions (JS Array ↔ C++ std::vector)
- Object/Map conversions (JS Object ↔ C++ std::unordered_map)
- Number conversions (JS Number ↔ C++ int32_t/double)
- Boolean conversions (JS Boolean ↔ C++ bool)
- Buffer conversions (JS Buffer/ArrayBuffer ↔ C++ std::vector<uint8_t>)
- Validation utilities

**Key Functions:**
```cpp
// String conversions
std::string jsStringToCppString(Napi::Env env, const Napi::Value& jsValue);
Napi::String cppStringToJsString(Napi::Env env, const std::string& cppString);

// Array conversions (templated)
template<typename T>
std::vector<T> jsArrayToCppVector(Napi::Env env, const Napi::Array& jsArray);

// Object conversions
std::unordered_map<std::string, std::string> jsObjectToCppStringMap(
    Napi::Env env, const Napi::Object& jsObject);

// Validation utilities
void validateNotUndefined(Napi::Env env, const Napi::Value& value, const std::string& paramName);
```

### Error Handler (`error-handler.hpp/cpp`)

Provides standardized error handling, exception conversion, and error logging functionality.

**Features:**
- Custom exception hierarchy
- Error categorization and severity levels
- Native library error handling
- Error logging with timestamps
- RAII error scopes for automatic cleanup
- JS ↔ C++ exception conversion

**Error Categories:**
- `TYPE_CONVERSION` - Type conversion errors
- `CONFIGURATION` - Configuration validation errors
- `RESOURCE_MANAGEMENT` - Resource allocation/cleanup errors
- `MODEL_OPERATION` - Model-specific operations errors
- `MEMORY_ALLOCATION` - Memory management errors
- `NATIVE_LIBRARY` - RKLLM native library errors
- `VALIDATION` - Parameter validation errors

**Key Classes:**
```cpp
// Exception hierarchy
class RKLLMException : public std::exception;
class TypeConversionException : public RKLLMException;
class ConfigurationException : public RKLLMException;
class ResourceException : public RKLLMException;

// Error information structure
struct ErrorInfo {
    ErrorCategory category;
    ErrorSeverity severity;
    std::string code;
    std::string message;
    std::string details;
    std::string location;
};

// RAII error scope
class ErrorScope {
public:
    explicit ErrorScope(const std::string& operation);
    void addCleanupFunction(std::function<void()> cleanup);
    void success();
};
```

## Usage Examples

### Type Conversion

```cpp
#include "type-converters.hpp"

// Convert JS string to C++ string
Napi::Value jsValue = info[0];
std::string cppStr = jsStringToCppString(env, jsValue);

// Convert C++ vector to JS array
std::vector<int32_t> cppVec = {1, 2, 3, 4, 5};
Napi::Array jsArray = cppVectorToJsArray(env, cppVec);

// Convert JS object to C++ map
Napi::Object jsObj = info[0].As<Napi::Object>();
auto cppMap = jsObjectToCppStringMap(env, jsObj);
```

### Error Handling

```cpp
#include "error-handler.hpp"

// Basic error throwing
try {
    // Some risky operation
    if (someCondition) {
        throwConfigurationError(env, "Invalid configuration parameter");
    }
} catch (const std::exception& e) {
    rethrowAsJSError(env, e);
}

// Using ErrorScope for automatic cleanup
{
    ErrorScope scope("model_loading");
    
    // Add cleanup functions
    scope.addCleanupFunction([&model]() {
        if (model) freeModel(model);
    });
    
    // Perform operations
    model = loadModel(path);
    configureModel(model, config);
    
    scope.success(); // Mark as successful
    // Cleanup functions won't be called
}
  - `throwError()` - Throw JS exceptions from C++
  - `handleNativeError()` - Convert native RKLLM errors to JS errors
  - `logError()` - Structured error logging

## Dependencies

- Node.js N-API headers
- RKLLM native library headers
- C++ standard library

## Build Requirements

- Standalone compilation via local Makefile
- Integration with global build system
- Comprehensive unit testing

## Testing Strategy

- **Unit Tests**: Each conversion function tested individually
- **Integration Tests**: Cross-module compatibility
- **Error Tests**: Exception handling and error propagation
- **Memory Tests**: No memory leaks in type conversions

## Usage Example

```cpp
#include "type-converters.hpp"
#include "error-handler.hpp"

// Convert JS string to C++ and handle errors
try {
    auto cppStr = utils::jsStringToCppString(env, jsValue);
    // Use cppStr...
} catch (const std::exception& e) {
    utils::throwError(env, "Type conversion failed", e.what());
}
```

## Integration Points

- **Core Module**: Model configuration type conversion
- **Inference Module**: Input/output data conversion
- **Memory Module**: Memory allocation error handling
- **NAPI Bindings**: Primary consumer of type conversion utilities

## Implementation Status

- [ ] `type-converters.hpp` - Type conversion interface
- [ ] `type-converters.cpp` - Type conversion implementation
- [ ] `type-converters.test.cpp` - Comprehensive unit tests
- [ ] `error-handler.hpp` - Error handling interface
- [ ] `error-handler.cpp` - Error handling implementation  
- [ ] `error-handler.test.cpp` - Error handling unit tests
- [ ] `Makefile` - Standalone build configuration
- [ ] Integration with global build system
