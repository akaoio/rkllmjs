# Adapters Module

Model adapters and fine-tuning support for RKLLM.

## Overview

The adapters module provides support for LoRA (Low-Rank Adaptation) and other fine-tuning adapters, allowing dynamic model customization without full retraining.

## Features

- **LoRA Support**: Load and manage LoRA adapters
- **Adapter Chaining**: Combine multiple adapters
- **Dynamic Loading**: Runtime adapter loading and unloading
- **Adapter Management**: Lifecycle management for adapters
- **Performance Optimization**: Efficient adapter inference
- **Adapter Validation**: Compatibility checking and validation

## Architecture

```
AdapterManager
├── LoRA Management
│   ├── loadLoraAdapter()
│   ├── unloadLoraAdapter()
│   └── getLoraAdapters()
├── Adapter Chaining
│   ├── chainAdapters()
│   ├── unchainAdapters()
│   └── getAdapterChain()
├── Validation
│   ├── validateAdapter()
│   ├── checkCompatibility()
│   └── getAdapterInfo()
└── Performance
    ├── optimizeAdapters()
    ├── getAdapterStats()
    └── enableAdapterProfiling()
```

## Build Status

✅ **Built Successfully**: Placeholder module with Makefile structure

## Dependencies

- **RKLLM Library**: `../../../libs/rkllm/include/rkllm.h`
- **Core Module**: `../core` (Model management)
- **Utils Module**: `../utils` (Error handling)

## Usage Example

```cpp
#include "adapter-manager.hpp"

// Create adapter manager
rkllmjs::adapters::AdapterManager adapterMgr;

// Load LoRA adapter
auto loraConfig = rkllmjs::adapters::LoraConfig{
    .adapter_path = "/path/to/lora.bin",
    .alpha = 32,
    .rank = 16
};

auto result = adapterMgr.loadLoraAdapter(loraConfig);
if (result.success) {
    std::cout << "LoRA adapter loaded: " << result.adapter_id << std::endl;
}
```

## Files

- `adapter-manager.hpp` - Adapter management interface (planned)
- `adapter-manager.cpp` - Implementation (planned)
- `adapter-manager.test.cpp` - Unit tests (planned)
- `Makefile` - Build configuration (placeholder)

## Implementation Status

🚧 **In Development**: Module structure created, implementation pending

**Next Steps:**
1. Implement LoRA adapter loading/unloading
2. Add adapter validation and compatibility checking
3. Create adapter chaining capabilities
4. Add performance optimization
5. Implement comprehensive testing

## Integration

This module will integrate with:
- **Core Module**: For model handle management
- **Inference Module**: For adapter-aware inference
- **N-API Bindings**: For JavaScript adapter management APIs
