# utils

## Purpose
Utility functions and helper classes for common operations

## Overview
Provides C++ implementation with 4 source files and 2 header files. Common utilities including logging, error handling, file operations, and helper functions.

## Architecture
Module architecture information will be added here.

## Source Files
## Source File: error-handler.cpp

### Functions
- `ErrorInfo()`
- `ErrorScope::()`
- `function()`
- `string()`
- `success()`
- `void()`

### Classes
*No classes found*

### Dependencies
- `chrono`
- `error-handler.hpp`
- `iomanip`
- `iostream`
- `sstream`

## Source File: error-handler.hpp

### Functions
- `ERROR()`
- `Env()`
- `ErrorInfo()`
- `exception()`
- `string()`
- `void()`

### Classes
- `ConfigurationException`
- `ErrorScope`
- `RKLLMException`
- `ResourceException`
- `TypeConversionException`

### Dependencies
- `../config/build-config.hpp`
- `exception`
- `functional`
- `memory`
- `string`
- `vector`

## Source File: error-handler.test.cpp

### Functions
- `RKLLMJS_TEST_MAIN()`
- `TEST()`

### Classes
- `ErrorHandlerTest`

### Dependencies
- `../testing/rkllmjs-test.hpp`
- `error-handler.hpp`
- `stdexcept`
- `string`

## Source File: type-converters.cpp

### Functions
- `Env()`
- `Object()`
- `Value()`
- `bool()`
- `string()`
- `vector()`

### Classes
*No classes found*

### Dependencies
- `algorithm`
- `cctype`
- `cmath`
- `error-handler.hpp`
- `functional`
- `iomanip`
- `sstream`
- `type-converters.hpp`

## Source File: type-converters.hpp

### Functions
- `Array()`
- `Env()`
- `Object()`
- `Value()`
- `bool()`
- `string()`
- `vector()`

### Classes
- `ConversionResult`

### Dependencies
- `../config/build-config.hpp`
- `memory`
- `string`
- `unordered_map`
- `vector`

## Source File: type-converters.test.cpp

### Functions
- `RKLLMJS_TEST_MAIN()`
- `TEST()`

### Classes
- `TestEnvironment`

### Dependencies
- `../testing/rkllmjs-test.hpp`
- `cctype`
- `chrono`
- `numeric`
- `string`
- `type-converters.hpp`
- `vector`


## API Reference

### Functions
See source files below for detailed function information.

### Classes
See source files below for detailed class information.

### Data Structures
Data structures will be documented here.

### Enumerations
Enumerations will be documented here.

## Dependencies
See source files below for dependencies.

## Usage Examples
Usage examples will be added here.

## Error Handling
Error handling information will be added here.

## Performance Notes
Performance considerations will be documented here.

## Thread Safety
Thread safety information will be added here.

## Memory Management
Memory management details will be documented here.

## Testing
Testing information will be added here.

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
Troubleshooting guide will be added here.

---
*Generated automatically by RKLLMJS README Generator*
