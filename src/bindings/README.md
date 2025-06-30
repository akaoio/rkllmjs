# C++ Bindings Architecture

## Purpose
Modular C++ core that provides the actual LLM functionality. The TypeScript layer is just a thin wrapper around these C++ modules.

## Architecture Overview

```
┌─────────────────────┐
│   TypeScript API    │ ← Thin wrapper layer
├─────────────────────┤
│   N-API Bindings    │ ← JavaScript ↔ C++ bridge
├─────────────────────┤
│   C++ Core Modules  │ ← Business logic (THIS LAYER)
├─────────────────────┤
│   librkllmrt.so     │ ← Rockchip NPU library
└─────────────────────┘
```

## Core Modules

### `/core/` - RKLLM Manager
- **Purpose**: Model lifecycle management (init/destroy/config)
- **Dependencies**: None (foundation module)
- **Key Functions**: `rkllm_init`, `rkllm_destroy`, `createDefaultParam`

### `/inference/` - Inference Engine  
- **Purpose**: Model inference operations (run/abort/async)
- **Dependencies**: `core`, `utils`
- **Key Functions**: `rkllm_run`, `rkllm_run_async`, `rkllm_abort`

### `/memory/` - Cache Manager
- **Purpose**: Memory and cache management (KV cache, prompt cache)
- **Dependencies**: `core`, `utils`
- **Key Functions**: Cache operations, memory optimization

### `/adapters/` - LoRA Adapter
- **Purpose**: LoRA and model adaptation operations
- **Dependencies**: `core`, `utils`
- **Key Functions**: `rkllm_load_lora`, adapter management

### `/utils/` - Common Utilities
- **Purpose**: Shared utilities and type conversions
- **Dependencies**: None (utility module)
- **Key Functions**: JS ↔ C++ conversion, error handling

### `/napi-bindings/` - N-API Layer
- **Purpose**: JavaScript ↔ C++ bridge using N-API
- **Dependencies**: All other modules
- **Key Functions**: N-API exports, type marshalling
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
- **C++ Unit Tests**: Use RKLLMJS Test Framework for native logic and memory management testing
- **TypeScript Unit Tests**: Test wrapper functionality and type safety
- **Integration Tests**: Test with real RKLLM models

### Test Framework
- **RKLLMJS Test Framework**: In-house C++ testing framework (no external dependencies)
- **Location**: `src/bindings/testing/rkllmjs-test.hpp`
- **Features**: Google Test-style macros, professional output, cross-platform support
- **Benefits**: Zero dependencies, tailored for RKLLMJS, faster compilation

### Running Tests
```bash
# Build and test all C++ modules
cd src/bindings && ./test.sh

# Build and test specific module
cd src/bindings/core && make clean && make test

# Run all tests with clean build
cd src/bindings && find . -name "Makefile" -execdir make clean \; && ./test.sh
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
- ✅ **Build system integration** with individual module Makefiles
- ✅ **RKLLMJS Test Framework** for C++ and comprehensive TypeScript testing

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

## Build System

```bash
# Build all C++ modules and tests
./build.sh

# Test all C++ modules
./test.sh

# Build specific module
cd core && make

# Test specific module  
cd core && make test
```

## Module Independence

Each module:
- ✅ Can be built standalone
- ✅ Has its own unit tests
- ✅ Has clear dependencies
- ✅ Has comprehensive documentation
- ✅ Follows RULES.md requirements

## Development Workflow

1. **Develop in modules** - Work on one module at a time
2. **Test in isolation** - Each module tests independently  
3. **Integration testing** - Test module interactions
4. **N-API binding** - Connect to JavaScript layer
5. **TypeScript wrapper** - Provide user-friendly API

## Current State

- **core/**: RKLLM Manager - model lifecycle management
- **inference/**: Inference Engine - text generation
- **memory/**: Memory Management - resource monitoring  
- **utils/**: Utilities and helpers - type conversion, error handling
- **config/**: Configuration Management - JSON config handling
- **adapters/**: Model Adapters - model format handling
- **napi-bindings/**: Node.js N-API bindings - JavaScript integration
- **binding.cpp**: Main N-API entry point
- **New modular structure**: To be implemented

## Migration Plan

1. Extract core functionality to `/core/`
2. Separate inference logic to `/inference/`
3. Move cache operations to `/memory/`
4. Create common utilities in `/utils/`
5. Rebuild N-API layer in `/napi-bindings/`