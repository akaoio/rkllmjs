# include

## Purpose
Core RKLLM runtime management and model lifecycle operations

## Overview
Provides thread-safe singleton that manages RKLLM model instances, resource allocation, configuration validation, and cleanup operations. This module handles the fundamental infrastructure needed for RKLLM model management including NPU resource allocation and monitoring.

## Architecture
- **readme-generator.hpp**: ReadmeGenerator
- **rkllm-manager.hpp**: RKLLMManager


## Source Files
- `readme-generator.hpp` (hpp)
- `rkllm-manager.hpp` (hpp)


## API Reference

### Functions
#### readme-generator.hpp

##### `ReadmeGenerator()`
*No documentation available*

##### `loadConfig()`
*No documentation available*

##### `setConfig()`
*No documentation available*

##### `getConfig()`
*No documentation available*

##### `analyzeSourceFile()`
*No documentation available*

##### `analyzeModule()`
*No documentation available*

##### `loadTemplate()`
*No documentation available*

##### `processTemplate()`
*No documentation available*

##### `generateReadme()`
*No documentation available*

##### `detectFileType()`
*No documentation available*

##### `isSourceFile()`
*No documentation available*

##### `inferPurpose()`
*No documentation available*

##### `validateTemplate()`
*No documentation available*

##### `validateModule()`
*No documentation available*

##### `parseCppFile()`
*No documentation available*

##### `parseTypeScriptFile()`
*No documentation available*

##### `extractFunctions()`
*No documentation available*

##### `extractClasses()`
*No documentation available*

##### `extractComments()`
*No documentation available*

##### `replaceTemplateVariables()`
*No documentation available*

##### `readFile()`
*No documentation available*

##### `writeFile()`
*No documentation available*

##### `fileExists()`
*No documentation available*

##### `getFileName()`
*No documentation available*

##### `getDirectory()`
*No documentation available*

#### rkllm-manager.hpp

##### `isValid()`
*No documentation available*

##### `getValidationError()`
*No documentation available*

##### `initialize()`
*No documentation available*

##### `cleanup()`
*No documentation available*

##### `isInitialized()`
*No documentation available*

##### `createModel()`
*No documentation available*

##### `destroyModel()`
*No documentation available*

##### `getModelConfig()`
*No documentation available*

##### `getResourceStats()`
*No documentation available*

##### `hasAvailableResources()`
*No documentation available*

##### `validateConfig()`
*No documentation available*

##### `createDefaultConfig()`
*No documentation available*

##### `getDefaultConfig()`
*No documentation available*

##### `getOptimizedConfig()`
*No documentation available*

##### `getActiveModelCount()`
*No documentation available*

##### `getErrorMessage()`
*No documentation available*

##### `generateModelId()`
*No documentation available*

##### `allocateResources()`
*No documentation available*

##### `deallocateResources()`
*No documentation available*

##### `updateResourceStats()`
*No documentation available*



### Classes
#### readme-generator.hpp

##### `ReadmeGenerator`
*No documentation available*

#### rkllm-manager.hpp

##### `RKLLMManager`
*No documentation available*



### Data Structures
- ReadmeConfig SourceInfo ModuleInfo 
- RKLLMModelConfig ResourceStats ModelInstance 


### Enumerations
- ManagerResult 


## Dependencies
- ../../../libs/rkllm/include/rkllm.h
- ../config/build-config.hpp
- map
- memory
- mutex
- string
- unordered_map
- vector


## Usage Examples
*Usage examples will be added based on function analysis*

## Error Handling
*Error handling documentation will be generated from code analysis*

## Performance Notes
*Performance considerations will be documented*

## Thread Safety
*Thread safety analysis will be provided*

## Memory Management
*Memory management details will be documented*

## Testing
All components have corresponding unit tests.

### Running Tests
```bash
# Build and run tests
make test

# Run with verbose output
make test-verbose

# Build debug version for testing
make debug
```

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

## Troubleshooting
*Common issues and solutions will be documented*

---
*Generated automatically by RKLLMJS README Generator*