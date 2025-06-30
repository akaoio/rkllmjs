# Core Module - RKLLM Manager

## Purpose
The core module manages RKLLM model lifecycle, configuration, and resource allocation. It serves as the central point for all model-related operations and provides a clean interface for other modules.

## Architecture
```
┌─────────────────────┐
│   rkllm-manager     │ ← Public API
├─────────────────────┤
│   Resource Pool     │ ← Memory & NPU management
├─────────────────────┤
│   Configuration     │ ← Model config & validation
├─────────────────────┤
│   librkllmrt.so     │ ← Rockchip NPU library
└─────────────────────┘
```

## Core Components

### RKLLMManager Class
- **Model Lifecycle**: Initialize, configure, destroy models
- **Resource Management**: NPU memory allocation, CPU core assignment
- **Configuration**: Parameter validation and optimization
- **Error Handling**: Comprehensive error reporting and recovery

### Key Features
- **Thread-safe**: Multiple model instances support
- **Resource pooling**: Efficient memory and NPU utilization
- **Configuration validation**: Parameter range checking
- **Performance monitoring**: Resource usage tracking

## Usage Examples

### Basic Model Management
```cpp
#include "rkllm-manager.hpp"

// Initialize manager
RKLLMManager manager;
auto result = manager.initialize();

// Create model instance
RKLLMModelConfig config = {
    .model_path = "../../../models/Qwen2.5-VL-7B-Instruct.rkllm",
    .max_context_len = 512,
    .max_new_tokens = 128,
    .top_k = 1,
    .top_p = 0.9,
    .temperature = 0.8,
    .npu_core_num = 3
};

RKLLMHandle handle;
auto create_result = manager.createModel(config, &handle);

// Use model...
// Clean up
manager.destroyModel(handle);
manager.cleanup();
```

### Resource Monitoring
```cpp
// Get resource usage
auto stats = manager.getResourceStats();
std::cout << "NPU Utilization: " << stats.npu_utilization << "%" << std::endl;
std::cout << "Memory Usage: " << stats.memory_usage_mb << " MB" << std::endl;
```

## Dependencies
- **librkllmrt.so**: Rockchip NPU runtime library
- **error-handler**: Unified error handling (from utils module)
- **Standard C++17**: STL containers, smart pointers, threads

## Testing
- **Unit Tests**: All public methods tested with various configurations
- **Resource Tests**: Memory leak detection, NPU utilization validation
- **Error Tests**: Invalid configuration handling, resource exhaustion

## Design Principles
- **RAII**: Automatic resource cleanup
- **Single Responsibility**: Model lifecycle management only
- **Interface Segregation**: Clean public API, hidden implementation
- **Error Safety**: No exceptions, explicit error returns
