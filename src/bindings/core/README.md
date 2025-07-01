# core

## Purpose
The core module manages RKLLM model lifecycle, configuration, and resource allocation. It serves as the central point for all model-related operations and provides a clean interface for other modules.

## Architecture
{{ARCHITECTURE}}

## Source Files
- `rkllm-manager.cpp` (cpp)
- `rkllm-manager.hpp` (hpp)


## Core Components

{{#CLASSES}}
### Classes
### rkllm-manager.hpp
- `RKLLMManager`


{{/CLASSES}}

{{#FUNCTIONS}}
### Functions
### rkllm-manager.cpp
- `cleanup`
- `updateResourceStats`
- `rkllm_destroy`
- `updateResourceStats`
- `updateResourceStats`
- `getDefaultConfig`

### rkllm-manager.hpp
- `isValid`
- `getValidationError`
- `initialize`
- `cleanup`
- `isInitialized`
- `createModel`
- `destroyModel`
- `getModelConfig`
- `getResourceStats`
- `hasAvailableResources`
- `validateConfig`
- `createDefaultConfig`
- `getDefaultConfig`
- `getOptimizedConfig`
- `getActiveModelCount`
- `getErrorMessage`
- `generateModelId`
- `allocateResources`
- `deallocateResources`
- `updateResourceStats`


{{/FUNCTIONS}}

{{#EXPORTS}}
### Exports
{{EXPORTS}}
{{/EXPORTS}}

## Dependencies
{{DEPENDENCIES}}

## Testing
{{TESTING_INFO}}

### Running Tests
```bash
# Build and run tests
make test

# Run with verbose output
make test-verbose

# Build debug version for testing
make debug
```

## Design Principles
- **Modular Architecture**: Self-contained with clear interfaces
- **Minimal Dependencies**: Uses standard libraries only
- **Error Handling**: Graceful handling of edge cases
- **Performance**: Optimized for fast build times

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

## Current Status
{{STATUS}}

---

*Generated automatically by RKLLMJS README Generator*
*Last updated: {{GENERATED_DATE}}*