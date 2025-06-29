# LLM Handle

## Purpose
Provides C++ N-API bindings and TypeScript wrappers for core LLM handle management functionality from the Rockchip RKLLM library. This module handles the fundamental operations of creating, initializing, and destroying LLM instances.

## Architecture

```
┌─────────────────────────────┐
│   TypeScript Wrapper       │ ← High-level API with type safety
├─────────────────────────────┤
│   C++ N-API Binding        │ ← Native bridge layer
├─────────────────────────────┤
│   RKLLM C Functions        │ ← Core library functions
│   - rkllm_createDefaultParam│
│   - rkllm_init             │
│   - rkllm_destroy          │
└─────────────────────────────┘
```

## Core Components

### C++ N-API Binding (`llm-handle.cpp`, `llm-handle.hpp`)
- **LLMHandle::CreateDefaultParam**: Binds `rkllm_createDefaultParam()` to create default configuration parameters
- **LLMHandle::Init**: Binds `rkllm_init()` to initialize LLM instances with custom parameters and callbacks
- **LLMHandle::Destroy**: Binds `rkllm_destroy()` to clean up LLM instances and release resources
- **Parameter Conversion**: Utilities to convert between JavaScript objects and C structs (`RKLLMParam`)
- **Error Handling**: Proper N-API error propagation and resource cleanup

### TypeScript Wrapper (`llm-handle-wrapper.ts`)
- **LLMHandleWrapper**: Main class providing type-safe interface to native bindings
- **RKLLMParam Interface**: TypeScript type definitions for LLM parameters
- **LLMHandle Interface**: TypeScript type definitions for LLM handle objects
- **Async/Sync APIs**: Both Promise-based and synchronous method variants
- **Error Handling**: Typed error messages with proper stack traces

## Usage Examples

### Basic LLM Initialization
```typescript
import LLMHandleWrapper, { RKLLMParam } from './llm-handle-wrapper';

// Create default parameters
const defaultParam = await LLMHandleWrapper.createDefaultParam();
console.log('Default parameters:', defaultParam);

// Customize parameters for your model
const customParam: RKLLMParam = {
  ...defaultParam,
  model_path: '/path/to/your/model.rkllm',
  max_context_len: 4096,
  max_new_tokens: 1024,
  temperature: 0.8
};

// Initialize LLM
const handle = await LLMHandleWrapper.init(customParam);
console.log('LLM initialized successfully');

// Clean up when done
const success = await LLMHandleWrapper.destroy(handle);
console.log('LLM destroyed:', success);
```

### Error Handling
```typescript
try {
  const handle = await LLMHandleWrapper.init({
    model_path: '', // Invalid: empty path
    max_context_len: 2048
  });
} catch (error) {
  console.error('Initialization failed:', error.message);
  // Output: "model_path is required"
}
```

### Synchronous API (for compatibility)
```typescript
// Synchronous variants for environments that need them
const param = LLMHandleWrapper.createDefaultParamSync();
const handle = LLMHandleWrapper.initSync(param);
const success = LLMHandleWrapper.destroySync(handle);
```

## Dependencies
- **Core**: Rockchip RKLLM library (`libs/rkllm/aarch64/librkllmrt.so`)
- **Headers**: RKLLM C API (`libs/rkllm/include/rkllm.h`)
- **Build**: Node.js N-API, node-addon-api, node-gyp
- **Runtime**: Node.js >= 16.0.0

## Testing

### Unit Tests
- **C++ Tests** (`llm-handle.test.cpp`): Tests core C++ binding logic and parameter handling
- **TypeScript Tests** (`llm-handle-wrapper.test.ts`): Tests wrapper functionality, type safety, and error handling
- **Integration Tests**: Tests with real RKLLM models (requires actual .rkllm files)

### Test Coverage
- ✅ Default parameter creation
- ✅ Parameter validation and type safety
- ✅ LLM initialization and destruction lifecycle
- ✅ Error handling and edge cases
- ✅ Memory management and resource cleanup
- ✅ Async/sync API compatibility

### Running Tests
```bash
# Run C++ unit tests (requires compilation)
./build/test/llm-handle-test

# Run TypeScript unit tests
npm test -- src/bindings/llm-handle/llm-handle-wrapper.test.ts

# Run all tests
npm test
```

## Design Principles

### Type Safety
- Full TypeScript interfaces for all parameters and return types
- Compile-time validation of parameter structures
- Runtime validation of required fields

### Resource Management
- Proper cleanup of native resources using RAII patterns
- Automatic handle validation to prevent use-after-free
- Memory leak prevention through consistent resource lifecycle

### Error Handling
- Comprehensive error propagation from C++ to JavaScript
- Descriptive error messages with context
- Graceful handling of invalid inputs and edge cases

### API Design
- Consistent naming with RKLLM C API
- Both async and sync variants for flexibility
- Easy-to-use defaults with customization options

## Build Integration
This module is compiled as part of the main N-API addon:
- Source files included in `binding.gyp`
- Links against `librkllmrt.so` 
- Compiled to `build/Release/binding.node`
- Exported through main binding entry point

## Performance Considerations
- Zero-copy parameter passing where possible
- Efficient JavaScript ↔ C++ object conversion
- Minimal overhead in N-API bridge layer
- Reusable parameter objects to reduce allocations

## Future Enhancements
- Callback function support for result handling
- Streaming parameter updates
- Advanced error diagnostics
- Performance monitoring and profiling hooks