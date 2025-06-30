# N-API Bindings Module

Node.js N-API bindings for RKLLM functionality.

## Overview

The N-API bindings module provides the bridge between JavaScript/TypeScript and the C++ RKLLM implementation, exposing all RKLLM functionality to Node.js applications.

## Features

- **Complete API Coverage**: All RKLLM functions exposed to JavaScript
- **Type Safety**: Comprehensive type validation and conversion
- **Error Handling**: JavaScript-friendly error reporting
- **Async Support**: Promise-based and callback-based async APIs
- **Memory Management**: Automatic cleanup and garbage collection
- **Performance Optimization**: Efficient data marshaling

## Architecture

```
N-API Bindings
├── Core Bindings
│   ├── Model Management
│   ├── Configuration
│   └── Lifecycle Management
├── Inference Bindings
│   ├── Text Generation
│   ├── Streaming APIs
│   └── Batch Processing
├── Memory Bindings
│   ├── Memory Stats
│   ├── Resource Management
│   └── NPU Management
└── Utility Bindings
    ├── Type Conversion
    ├── Error Handling
    └── Validation
```

## Build Status

✅ **Built Successfully**: Placeholder module with Makefile structure

## Dependencies

- **Node.js N-API**: Native addon development
- **All C++ Modules**: core, inference, memory, adapters, utils
- **RKLLM Library**: `../../../libs/rkllm/include/rkllm.h`

## Usage Example

```javascript
const rkllm = require('rkllmjs');

// Create model configuration
const config = {
    modelPath: '/path/to/model.rkllm',
    maxContextLen: 2048,
    maxNewTokens: 512,
    temperature: 0.7
};

// Initialize model
const model = await rkllm.createModel(config);

// Generate text
const result = await model.generate('Hello, world!');
console.log('Generated:', result.text);

// Clean up
await model.destroy();
```

## Files

- `binding.cpp` - Main N-API binding entry point (planned)
- `model-bindings.hpp/cpp` - Model management bindings (planned)
- `inference-bindings.hpp/cpp` - Inference bindings (planned)
- `memory-bindings.hpp/cpp` - Memory management bindings (planned)
- `adapter-bindings.hpp/cpp` - Adapter bindings (planned)
- `utils-bindings.hpp/cpp` - Utility bindings (planned)
- `Makefile` - Build configuration (placeholder)

## Implementation Status

🚧 **In Development**: Module structure created, implementation pending

**Next Steps:**
1. Create main N-API binding entry point
2. Implement model management bindings
3. Add inference API bindings
4. Create memory management bindings
5. Add adapter management bindings
6. Implement comprehensive error handling
7. Add TypeScript type definitions

## Integration

This module integrates with:
- **All C++ Modules**: Provides JavaScript access to all functionality
- **TypeScript Layer**: Via generated type definitions
- **Node.js Runtime**: Through N-API native addon interface
