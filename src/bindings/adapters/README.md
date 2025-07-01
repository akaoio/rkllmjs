# adapters

## Purpose
Hardware adapters and device-specific implementations

## Overview
Provides C++ implementation with 2 source files and 1 header files. Hardware abstraction layer for different NPU devices and platform-specific optimizations.

## Architecture
Module architecture information will be added here.

## Source Files
## Source File: adapter-manager.cpp

### Functions
- `AdapterFactory()`
- `AdapterFactory::()`
- `AdapterManager()`
- `AdapterManager::()`
- `AdapterPipeline::()`
- `JsonAdapter()`
- `JsonAdapter::()`
- `RKLLMAdapter()`
- `RKLLMAdapter::()`
- `TextAdapter()`
- `TextAdapter::()`
- `cleanup()`
- `clearPipeline()`
- `createAdapterByFormat()`
- `formatToString()`
- `getAdapterNames()`
- `getAvailableAdapters()`
- `getErrorMessage()`
- `getInstance()`
- `getLoadedAdapters()`

### Classes
*No classes found*

### Dependencies
- `../config/build-config.hpp`
- `adapter-manager.hpp`
- `algorithm`
- `iostream`
- `mutex`
- `regex`
- `sstream`

## Source File: adapter-manager.hpp

### Functions
- `ostream()`

### Classes
- `AdapterFactory`
- `AdapterManager`
- `AdapterPipeline`
- `IAdapter`
- `JsonAdapter`
- `RKLLMAdapter`
- `TextAdapter`

### Dependencies
- `../config/build-config.hpp`
- `functional`
- `memory`
- `mutex`
- `ostream`
- `string`
- `unordered_map`
- `vector`

## Source File: adapter-manager.test.cpp

### Functions
- `TEST()`
- `int()`

### Classes
*No classes found*

### Dependencies
- `../testing/rkllmjs-test.hpp`
- `adapter-manager.hpp`
- `string`
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
