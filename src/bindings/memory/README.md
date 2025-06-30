# Memory Management Module

Efficient memory allocation, tracking, and optimization for RKLLM operations.

## Overview

The memory module provides sophisticated memory management for RKLLM models, including NPU memory allocation, system memory tracking, and memory pool optimization.

## Features

- **NPU Memory Management**: Efficient NPU memory allocation and deallocation
- **Memory Pools**: Pre-allocated memory pools for performance
- **Memory Tracking**: Real-time memory usage monitoring
- **Memory Optimization**: Automatic memory defragmentation and cleanup
- **Resource Limits**: Configurable memory limits and warnings
- **Memory Profiling**: Detailed memory usage analytics

## Architecture

```
MemoryManager
├── NPU Management
│   ├── allocateNPUMemory()
│   ├── deallocateNPUMemory()
│   └── getNPUMemoryStats()
├── System Management
│   ├── allocateSystemMemory()
│   ├── deallocateSystemMemory()
│   └── getSystemMemoryStats()
├── Pool Management
│   ├── createMemoryPool()
│   ├── allocateFromPool()
│   └── destroyMemoryPool()
└── Monitoring
    ├── getMemoryUsage()
    ├── setMemoryLimits()
    └── enableMemoryProfiling()
```

## Build Status

✅ **Built Successfully**: Placeholder module with Makefile structure

## Dependencies

- **RKLLM Library**: `../../../libs/rkllm/include/rkllm.h`
- **System Libraries**: pthread, memory mapping

## Usage Example

```cpp
#include "memory-manager.hpp"

// Create memory manager
rkllmjs::memory::MemoryManager memManager;

// Allocate NPU memory
void* npuBuffer = memManager.allocateNPUMemory(1024 * 1024); // 1MB

// Track memory usage
auto stats = memManager.getMemoryStats();
std::cout << "NPU Memory: " << stats.npu_used << " / " << stats.npu_total << std::endl;

// Clean up
memManager.deallocateNPUMemory(npuBuffer);
```

## Files

- `memory-manager.hpp` - Memory management interface (planned)
- `memory-manager.cpp` - Implementation (planned)
- `memory-manager.test.cpp` - Unit tests (planned)
- `Makefile` - Build configuration (placeholder)

## Implementation Status

🚧 **In Development**: Module structure created, implementation pending

**Next Steps:**
1. Implement NPU memory allocation APIs
2. Add system memory tracking
3. Create memory pool management
4. Add memory profiling capabilities
5. Implement comprehensive testing

## Integration

This module will integrate with:
- **Core Module**: For model memory requirements
- **Inference Module**: For inference buffer management
- **N-API Bindings**: For JavaScript memory management APIs
