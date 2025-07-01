# core

## Purpose
Core functionality and base classes for RKLLM operations

## Overview
Provides C++ implementation with 2 source files and 1 header files. Essential base classes, interfaces, and core functionality required by other modules.

## Architecture
Module architecture information will be added here.

## Source Files
## Source File: rkllm-manager.cpp

### Functions
- `RKLLMManager::()`
- `allocateResources()`
- `cleanup()`
- `createDefaultConfig()`
- `createModel()`
- `destroyModel()`
- `generateModelId()`
- `getActiveModelCount()`
- `getActiveModelIds()`
- `getDefaultConfig()`
- `getErrorMessage()`
- `getInstance()`
- `getModelConfig()`
- `getResourceStats()`
- `getValidationError()`
- `hasAvailableResources()`
- `initialize()`
- `isInitialized()`
- `isValid()`
- `string()`

### Classes
*No classes found*

### Dependencies
- `../config/build-config.hpp`
- `chrono`
- `cstring`
- `fstream`
- `iostream`
- `rkllm-manager.hpp`
- `sstream`
- `sys/sysinfo.h`
- `thread`

## Source File: rkllm-manager.hpp

### Functions
*No public functions found*

### Classes
- `RKLLMManager`

### Dependencies
- `../config/build-config.hpp`
- `memory`
- `mutex`
- `string`
- `unordered_map`
- `vector`

## Source File: rkllm-manager.test.cpp

### Functions
- `RKLLMJS_TEST_MAIN()`
- `RKLLMModelConfig()`
- `TEST()`

### Classes
*No classes found*

### Dependencies
- `../testing/rkllmjs-test.hpp`
- `chrono`
- `rkllm-manager.hpp`
- `thread`
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
