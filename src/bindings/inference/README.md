# Inference Engine Module

High-level inference orchestration and text generation for RKLLM models.

## Overview

The inference module provides a comprehensive engine for text generation, batch processing, streaming inference, and advanced sampling strategies. It builds on top of the core model management and provides JavaScript-friendly APIs.

## Features

- **Text Generation**: Single and batch text generation
- **Streaming Inference**: Real-time token streaming with callbacks
- **Advanced Sampling**: Temperature, top-k, top-p, repetition penalty
- **Batch Processing**: Efficient multi-request processing
- **Performance Monitoring**: Latency, throughput, and resource metrics
- **Error Handling**: Comprehensive error reporting and recovery

## Architecture

```
InferenceEngine
├── Core Features
│   ├── generate() - Single text generation
│   ├── generateStream() - Streaming generation
│   ├── generateBatch() - Batch processing
│   └── generateStreamAsync() - Async streaming
├── Configuration
│   ├── setMaxConcurrentInferences()
│   ├── setStreamBufferSize()
│   └── validateParams()
└── Monitoring
    ├── getStats()
    ├── resetStats()
    └── updateStats()
```

## Build Status

✅ **Built Successfully**: Library compiled and available at `bin/librkllm-inference.a`

## Dependencies

- **Core Module**: `../core` (RKLLMManager)
- **Utils Module**: `../utils` (Error handling, type conversion)
- **RKLLM Library**: `../../../libs/rkllm/include/rkllm.h`

## Usage Example

```cpp
#include "inference-engine.hpp"

// Create inference engine with core manager
auto manager = std::make_shared<rkllmjs::core::RKLLMManager>();
rkllmjs::inference::InferenceEngine engine(manager);

// Configure inference parameters
rkllmjs::inference::InferenceParams params;
params.prompt = "Hello, world!";
params.max_tokens = 50;
params.temperature = 0.7f;

// Generate text
auto result = engine.generate(params);
std::cout << "Generated: " << result.text << std::endl;
```

## Files

- `inference-engine.hpp` - Main inference engine class
- `inference-engine.cpp` - Implementation
- `inference-engine.test.cpp` - Unit tests
- `Makefile` - Build configuration
- `bin/librkllm-inference.a` - Compiled library

## Testing

Run tests with:
```bash
make test
```

Tests cover:
- Parameter validation
- Text generation
- Streaming inference
- Batch processing
- Error handling
- Performance metrics

## Integration

This module integrates with:
- **JavaScript Layer**: Via N-API bindings
- **Core Module**: For model lifecycle management
- **Utils Module**: For error handling and type conversion
- **Memory Module**: For efficient resource management
