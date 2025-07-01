# utils

## Purpose
Type conversion utilities for JavaScript and C++ interoperability

## Overview
Provides safe and efficient type conversion functions between JavaScript values and C++ types. Includes comprehensive error handling, validation, and support for complex data structures. Essential for N-API bindings.

## Architecture
- **error-handler.hpp**: RKLLMException, TypeConversionException, ConfigurationException, ResourceException, ErrorScope
- **type-converters.hpp**: ConversionResult


## Source Files
- `error-handler.cpp` (cpp)
- `error-handler.hpp` (hpp)
- `type-converters.cpp` (cpp)
- `type-converters.hpp` (hpp)


## API Reference

### Functions
#### error-handler.cpp

##### `RKLLMException()`
*No documentation available*

##### `logError()`
*No documentation available*

##### `cleanup()`
*No documentation available*

##### `createErrorInfo()`
*No documentation available*

##### `getCategoryString()`
*No documentation available*

##### `getSeverityString()`
*No documentation available*

##### `formatErrorMessage()`
*No documentation available*

##### `validateNotEmpty()`
*No documentation available*

##### `ConfigurationException()`
*No documentation available*

##### `validateRange()`
*No documentation available*

##### `validatePositive()`
*No documentation available*

#### error-handler.hpp

##### `TypeConversionException()`
*No documentation available*

##### `getTypeString()`
*No documentation available*

##### `throwError()`
*No documentation available*

##### `throwConversionError()`
*No documentation available*

##### `throwConfigurationError()`
*No documentation available*

##### `throwResourceError()`
*No documentation available*

##### `createError()`
*No documentation available*

##### `handleNativeError()`
*No documentation available*

##### `getNativeErrorMessage()`
*No documentation available*

##### `logError()`
*No documentation available*

##### `exceptionToErrorInfo()`
*No documentation available*

##### `rethrowAsJSError()`
*No documentation available*

##### `getErrorCodeString()`
*No documentation available*

##### `getErrorCategoryFromCode()`
*No documentation available*

##### `validateParameter()`
*No documentation available*

##### `validateStringParameter()`
*No documentation available*

##### `validateNumberParameter()`
*No documentation available*

##### `validateObjectParameter()`
*No documentation available*

##### `validateArrayParameter()`
*No documentation available*

##### `getCategoryString()`
*No documentation available*

##### `getSeverityString()`
*No documentation available*

##### `formatErrorMessage()`
*No documentation available*

##### `createErrorInfo()`
*No documentation available*

##### `validateNotEmpty()`
*No documentation available*

##### `validateRange()`
*No documentation available*

##### `validatePositive()`
*No documentation available*

##### `ErrorScope()`
*No documentation available*

##### `success()`
*No documentation available*

#### type-converters.cpp

##### `trim()`
*No documentation available*

##### `ss()`
*No documentation available*

##### `join()`
*No documentation available*

##### `startsWith()`
*No documentation available*

##### `endsWith()`
*No documentation available*

##### `stringToInt32()`
*No documentation available*

##### `TypeConversionException()`
*No documentation available*

##### `stringToDouble()`
*No documentation available*

##### `int32ToString()`
*No documentation available*

##### `doubleToString()`
*No documentation available*

##### `mapToString()`
*No documentation available*

##### `isValidString()`
*No documentation available*

##### `isValidNumber()`
*No documentation available*

##### `isValidPath()`
*No documentation available*

##### `isValidRange()`
*No documentation available*

##### `bytesToString()`
*No documentation available*

##### `bytesToHex()`
*No documentation available*

##### `safeStringToInt32()`
*No documentation available*

##### `ConversionResult()`
*No documentation available*

##### `safeStringToDouble()`
*No documentation available*

##### `validateString()`
*No documentation available*

##### `normalizeString()`
*No documentation available*

##### `validateInt32()`
*No documentation available*

##### `validateDouble()`
*No documentation available*

##### `jsStringToCppString()`
*No documentation available*

##### `cppStringToJsString()`
*No documentation available*

##### `cppStringMapToJsObject()`
*No documentation available*

##### `jsNumberToCppInt32()`
*No documentation available*

##### `jsNumberToCppDouble()`
*No documentation available*

##### `cppInt32ToJsNumber()`
*No documentation available*

##### `cppDoubleToJsNumber()`
*No documentation available*

##### `jsBooleanToCppBool()`
*No documentation available*

##### `cppBoolToJsBoolean()`
*No documentation available*

##### `isValidType()`
*No documentation available*

##### `validateNotUndefined()`
*No documentation available*

##### `validateNotNull()`
*No documentation available*

#### type-converters.hpp

##### `isSuccess()`
*No documentation available*

##### `jsStringToCppString()`
*No documentation available*

##### `cppStringToJsString()`
*No documentation available*

##### `cppVectorToJsArray()`
*No documentation available*

##### `cppStringMapToJsObject()`
*No documentation available*

##### `jsNumberToCppInt32()`
*No documentation available*

##### `jsNumberToCppDouble()`
*No documentation available*

##### `cppInt32ToJsNumber()`
*No documentation available*

##### `cppDoubleToJsNumber()`
*No documentation available*

##### `jsBooleanToCppBool()`
*No documentation available*

##### `cppBoolToJsBoolean()`
*No documentation available*

##### `isValidType()`
*No documentation available*

##### `validateNotUndefined()`
*No documentation available*

##### `validateNotNull()`
*No documentation available*

##### `validateString()`
*No documentation available*

##### `normalizeString()`
*No documentation available*

##### `validateVector()`
*No documentation available*

##### `validateInt32()`
*No documentation available*

##### `validateDouble()`
*No documentation available*

##### `trim()`
*No documentation available*

##### `join()`
*No documentation available*

##### `startsWith()`
*No documentation available*

##### `endsWith()`
*No documentation available*

##### `stringToInt32()`
*No documentation available*

##### `stringToDouble()`
*No documentation available*

##### `int32ToString()`
*No documentation available*

##### `doubleToString()`
*No documentation available*

##### `mapToString()`
*No documentation available*

##### `isValidString()`
*No documentation available*

##### `isValidNumber()`
*No documentation available*

##### `isValidPath()`
*No documentation available*

##### `isValidRange()`
*No documentation available*

##### `bytesToString()`
*No documentation available*

##### `bytesToHex()`
*No documentation available*

##### `constexpr()`
*No documentation available*

##### `static_assert()`
*No documentation available*



### Classes
#### error-handler.hpp

##### `RKLLMException`
*No documentation available*

##### `TypeConversionException`
*No documentation available*

##### `ConfigurationException`
*No documentation available*

##### `ResourceException`
*No documentation available*

##### `ErrorScope`
*No documentation available*

#### type-converters.hpp

##### `ConversionResult`
*No documentation available*



### Data Structures
- ErrorInfo 


### Enumerations
- ErrorSeverity ErrorCategory 


## Dependencies
- ../config/build-config.hpp
- algorithm
- cctype
- chrono
- cmath
- error-handler.hpp
- exception
- functional
- iomanip
- iostream
- memory
- napi.h
- sstream
- string
- type-converters.hpp
- unordered_map
- vector


## Usage Examples
*Usage examples will be added based on function analysis*

## Error Handling
*Error handling documentation will be generated from code analysis*

## Performance Notes
*Performance considerations will be documented*

## Thread Safety
*Thread safety analysis will be provided*

## Memory Management
*Memory management details will be documented*

## Testing
All components have corresponding unit tests.

### Running Tests
```bash
# Build and run tests
make test

# Run with verbose output
make test-verbose

# Build debug version for testing
make debug
```

## Build Configuration

### Standalone Build
```bash
# Build the module
make

# Clean artifacts
make clean

# Install library for other modules
make install
```

## Troubleshooting
*Common issues and solutions will be documented*

---
*Generated automatically by RKLLMJS README Generator*