# Config Manager Module

This module provides configuration management for RKLLMJS, allowing dynamic model and hardware configuration through JSON files.

## Features

- **Dynamic Model Configuration**: Load model configurations from `configs/runtime.json`
- **Hardware Profile Management**: Support different hardware profiles (high/low-end RK3588)
- **Automatic Model Selection**: Choose best model based on available hardware
- **Relative Path Support**: All paths are relative to project root
- **Cross-Platform**: Works with both C++ and Node.js

## Architecture

```
ConfigManager
├── ModelConfig      # Individual model configurations
├── HardwareProfile  # Hardware capability profiles  
└── Path Resolution  # Relative path management
```

## Usage

```cpp
#include "config-manager.hpp"
using namespace rkllmjs::config;

// Load configuration
ConfigManager::loadConfig("configs/runtime.json");

// Get model by ID
ModelConfig model = ConfigManager::getModel("qwen_0.5b");

// Auto-select best model for hardware
std::string best_model = ConfigManager::selectBestModel("rk3588_low");

// Check if model exists on filesystem
bool exists = ConfigManager::modelExists("tinyllama");
```

## Configuration Format

The `configs/runtime.json` file contains:

```json
{
  "models": {
    "qwen_0.5b": {
      "path": "models/qwen/model.rkllm",
      "size_mb": 512,
      "min_memory_mb": 1024,
      "parameters": { ... }
    }
  },
  "hardware_profiles": {
    "rk3588_low": {
      "npu_cores": 2,
      "max_memory_mb": 4096
    }
  }
}
```

## Build & Test

```bash
# Build module
make

# Run unit tests  
make test

# Clean build artifacts
make clean
```

## Dependencies

- Standard C++17 library
- POSIX file system APIs (stat, getcwd)
- No external JSON library required

## Integration

This module integrates with:
- Core RKLLM manager for model loading
- Utils module for error handling
- Build system for path resolution
