# Bindings

## Purpose
Root directory for all C++ N-API bindings that interface with the Rockchip RKLLM library. This module provides the native bridge between JavaScript/TypeScript and the RKLLM C API.

## Architecture

```
┌─────────────────────────────┐
│   TypeScript Wrappers      │ ← High-level type-safe API  
├─────────────────────────────┤
│   C++ N-API Bindings       │ ← Native bridge layer
├─────────────────────────────┤
│   RKLLM C API              │ ← Core Rockchip library
│   (librkllmrt.so)          │
└─────────────────────────────┘
```

## Core Components

### Main Binding Entry Point
- **binding.cpp**: Main N-API module initialization and export orchestration
- **binding.test.cpp**: Unit tests for main binding entry point

### Feature Modules
- **llm-handle/**: LLM instance creation, initialization, and destruction
- **inference/**: Inference operations (sync/async execution) - *planned*
- **memory-manager/**: Memory and cache management - *planned*
- **lora-adapter/**: LoRA adapter support - *planned*
- **chat-template/**: Chat template management - *planned*
- **cross-attention/**: Cross-attention parameter handling - *planned*

## Usage

### Loading the Native Binding
```typescript
// The compiled binding is loaded automatically by wrapper modules
const nativeBinding = require('../../build/Release/binding.node');
```

### Module Integration
Each feature module exports its functions through the main binding:
```cpp
// In binding.cpp
napi_value Init(napi_env env, napi_value exports) {
    // Initialize all feature modules
    LLMHandle::Init(env, exports);
    Inference::Init(env, exports);       // planned
    MemoryManager::Init(env, exports);   // planned
    // ... other modules
    
    return exports;
}
```

## Dependencies

### Build Dependencies
- **Node.js N-API**: Native addon interface
- **node-addon-api**: C++ wrapper for N-API
- **node-gyp**: Build system for native addons

### Runtime Dependencies
- **Rockchip RKLLM Library**: `libs/rkllm/aarch64/librkllmrt.so`
- **RKLLM Headers**: `libs/rkllm/include/rkllm.h`

### System Requirements
- **Architecture**: ARM64 (RK3588) or x64 (development)
- **OS**: Linux-based (primary), macOS/Windows (development)
- **Compiler**: GCC/Clang with C++17 support

## Testing

### Test Structure
Each binding module includes comprehensive unit tests:
- **C++ Unit Tests**: Test native binding logic and memory management
- **TypeScript Unit Tests**: Test wrapper functionality and type safety
- **Integration Tests**: Test with real RKLLM models

### Running Tests
```bash
# Build and test all bindings
npm run build:native && npm test

# Test specific module
npm test -- src/bindings/llm-handle/

# Run C++ unit tests (after compilation)
./build/test/binding-test
```

## Design Principles

### Memory Safety
- RAII patterns for automatic resource management
- Proper cleanup of native handles and allocated memory
- Exception safety with proper unwinding

### Type Safety
- Strong typing between C++ and TypeScript layers
- Compile-time validation of parameter structures
- Runtime validation of inputs and handles

### Error Handling
- Comprehensive error propagation from C++ to JavaScript
- Consistent error message format across all modules
- Graceful handling of invalid inputs and edge cases

### Performance
- Zero-copy data passing where possible
- Efficient JavaScript ↔ C++ object conversion
- Minimal overhead in N-API bridge layer

## Build Configuration

### binding.gyp
The main build configuration defines:
- Source files to compile
- Include directories for headers
- Library linking (librkllmrt.so)
- Compiler flags and options

### Compilation Flags
- **C++17 Standard**: For modern C++ features
- **N-API Macros**: For proper N-API integration
- **PIC (Position Independent Code)**: For shared library compatibility
- **RPATH**: For runtime library location

## Current Status

### Implemented
- ✅ **Main binding entry point** with module initialization
- ✅ **LLM Handle module** with create/init/destroy functions
- ✅ **Build system integration** with node-gyp
- ✅ **Unit test framework** for C++ and TypeScript

### Planned Implementation
- [ ] **Inference module** for sync/async execution
- [ ] **Memory management module** for cache operations
- [ ] **LoRA adapter module** for fine-tuning support
- [ ] **Chat template module** for conversation handling
- [ ] **Cross-attention module** for advanced inference

### Integration Testing
- [ ] End-to-end tests with real RKLLM models
- [ ] Performance benchmarking
- [ ] Memory leak testing
- [ ] Cross-platform compatibility testing

## Troubleshooting

### Common Build Issues
1. **Missing N-API headers**: Ensure Node.js development headers are installed
2. **Library linking errors**: Verify librkllmrt.so path and permissions
3. **Compilation errors**: Check GCC/Clang version and C++17 support

### Runtime Issues
1. **Module loading failures**: Check .node file permissions and dependencies
2. **Segmentation faults**: Usually indicate memory management issues
3. **Function not found**: Verify proper function export in binding.cpp

## Performance Considerations
- Use efficient data structures for parameter passing
- Minimize JavaScript ↔ C++ boundary crossings
- Implement proper caching for frequently accessed data
- Profile memory usage and optimize allocation patterns