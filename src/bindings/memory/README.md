# memory

## Purpose
Memory management utilities for NPU and CPU memory operations

## Overview
Provides C++ implementation with 2 source files and 1 header files. NPU memory allocation, CPU-NPU transfers, and memory pool management for efficient operations.

## Architecture
Module architecture information will be added here.

## Source Files
## Source File: memory-manager.cpp

### Functions
- `CPUMemoryAllocator()`
- `CPUMemoryAllocator::()`
- `MemoryManager()`
- `MemoryManager::()`
- `NPUMemoryAllocator()`
- `NPUMemoryAllocator::()`
- `allocate()`
- `allocateCPU()`
- `allocateContiguous()`
- `allocateNPU()`
- `cleanup()`
- `deallocate()`
- `defragment()`
- `getCPUStats()`
- `getCombinedStats()`
- `getErrorMessage()`
- `getInstance()`
- `getNPUStats()`
- `getStats()`
- `initialize()`

### Classes
*No classes found*

### Dependencies
- `../config/build-config.hpp`
- `algorithm`
- `cstdlib`
- `cstring`
- `iostream`
- `memory-manager.hpp`
- `sys/mman.h`
- `unistd.h`

## Source File: memory-manager.hpp

### Functions
*No public functions found*

### Classes
- `CPUMemoryAllocator`
- `IMemoryAllocator`
- `MemoryGuard`
- `MemoryManager`
- `NPUMemoryAllocator`

### Dependencies
- `../config/build-config.hpp`
- `cstddef`
- `functional`
- `memory`
- `mutex`
- `string`
- `type_traits`
- `unordered_map`
- `vector`

## Source File: memory-manager.test.cpp

### Functions
- `RKLLMJS_TEST_MAIN()`
- `TEST()`
- `void()`

### Classes
*No classes found*

### Dependencies
- `../testing/rkllmjs-test.hpp`
- `cstring`
- `memory-manager.hpp`
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
