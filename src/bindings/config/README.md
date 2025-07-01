# config

## Purpose
Configuration management and validation for RKLLM components

## Overview
Provides C++ implementation with 6 source files and 4 header files. Handles JSON parsing, environment variables, and configuration schema validation with runtime safety checks.

## Architecture
Module architecture information will be added here.

## Source Files
## Source File: build-config.hpp

### Functions
*No public functions found*

### Classes
*No classes found*

### Dependencies
- `algorithm`
- `cctype`
- `cstdio`
- `cstdlib`
- `string`

## Source File: build-config.test.cpp

### Functions
- `RKLLMJS_TEST_MAIN()`
- `TEST()`

### Classes
*No classes found*

### Dependencies
- `../testing/rkllmjs-test.hpp`
- `build-config.hpp`
- `cstdlib`
- `cstring`
- `include-manager.hpp`
- `string`

## Source File: config-manager.cpp

### Functions
- `canRunModel()`
- `getAvailableModels()`
- `getProjectRoot()`
- `isValid()`
- `string()`
- `toString()`

### Classes
*No classes found*

### Dependencies
- `algorithm`
- `config-manager.hpp`
- `fstream`
- `iostream`
- `sstream`
- `sys/stat.h`
- `unistd.h`

## Source File: config-manager.hpp

### Functions
*No public functions found*

### Classes
- `ConfigManager`

### Dependencies
- `map`
- `string`
- `vector`

## Source File: config-manager.test.cpp

### Functions
- `bool()`
- `int()`

### Classes
*No classes found*

### Dependencies
- `cassert`
- `config-manager.hpp`
- `iostream`

## Source File: include-manager.hpp

### Functions
*No public functions found*

### Classes
*No classes found*

### Dependencies
- `build-config.hpp`

## Source File: include-manager.test.cpp

### Functions
- `RKLLMJS_TEST_MAIN()`
- `TEST()`

### Classes
*No classes found*

### Dependencies
- `../testing/rkllmjs-test.hpp`
- `include-manager.hpp`

## Source File: json-parser.cpp

### Functions
- `string()`
- `stringify()`

### Classes
*No classes found*

### Dependencies
- `cctype`
- `json-parser.hpp`
- `sstream`

## Source File: json-parser.hpp

### Functions
*No public functions found*

### Classes
- `JsonParser`
- `JsonValue`

### Dependencies
- `map`
- `string`
- `vector`

## Source File: json-parser.test.cpp

### Functions
- `int()`
- `void()`

### Classes
*No classes found*

### Dependencies
- `cassert`
- `iostream`
- `json-parser.hpp`
- `sstream`


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
