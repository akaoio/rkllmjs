# config

## Purpose
Configuration management and validation for RKLLM components

## Overview
Provides comprehensive configuration loading, validation, and management for RKLLM runtime settings. Handles JSON parsing, environment variables, and configuration schema validation with runtime safety checks.

## Architecture
- **config-manager.hpp**: ConfigManager
- **json-parser.hpp**: JsonValue, JsonParser


## Source Files
- `build-config.hpp` (hpp)
- `config-manager.cpp` (cpp)
- `config-manager.hpp` (hpp)
- `include-manager.hpp` (hpp)
- `json-parser.cpp` (cpp)
- `json-parser.hpp` (hpp)


## API Reference

### Functions
#### config-manager.cpp

##### `file()`
*No documentation available*

##### `parseModelsFromJson()`
*No documentation available*

##### `parseHardwareProfilesFromJson()`
*No documentation available*

##### `loadConfig()`
*No documentation available*

#### config-manager.hpp

##### `isValid()`
*No documentation available*

##### `toString()`
*No documentation available*

##### `canRunModel()`
*No documentation available*

##### `loadConfig()`
*No documentation available*

##### `getModel()`
*No documentation available*

##### `getHardwareProfile()`
*No documentation available*

##### `selectBestModel()`
*No documentation available*

##### `resolvePath()`
*No documentation available*

##### `modelExists()`
*No documentation available*

##### `getProjectRoot()`
*No documentation available*

##### `extractJsonValue()`
*No documentation available*

##### `parseModelsFromJson()`
*No documentation available*

##### `parseHardwareProfilesFromJson()`
*No documentation available*

#### json-parser.cpp

##### `setObject()`
*No documentation available*

##### `skipWhitespace()`
*No documentation available*

##### `parseValue()`
*No documentation available*

##### `JsonValue()`
*No documentation available*

##### `parseObject()`
*No documentation available*

##### `parseString()`
*No documentation available*

##### `parseNumber()`
*No documentation available*

#### json-parser.hpp

##### `getType()`
*No documentation available*

##### `asString()`
*No documentation available*

##### `asNumber()`
*No documentation available*

##### `asInt()`
*No documentation available*

##### `asBool()`
*No documentation available*

##### `isNull()`
*No documentation available*

##### `isString()`
*No documentation available*

##### `isNumber()`
*No documentation available*

##### `isBool()`
*No documentation available*

##### `isObject()`
*No documentation available*

##### `hasKey()`
*No documentation available*

##### `setObject()`
*No documentation available*

##### `set()`
*No documentation available*

##### `parse()`
*No documentation available*

##### `stringify()`
*No documentation available*

##### `parseValue()`
*No documentation available*

##### `parseObject()`
*No documentation available*

##### `parseString()`
*No documentation available*

##### `parseNumber()`
*No documentation available*

##### `skipWhitespace()`
*No documentation available*



### Classes
#### config-manager.hpp

##### `ConfigManager`
*No documentation available*

#### json-parser.hpp

##### `JsonValue`
*No documentation available*

##### `JsonParser`
*No documentation available*



### Data Structures
- stat stat 
- ModelConfig HardwareProfile 


### Enumerations
- Type 


## Dependencies
- algorithm
- build-config.hpp
- cctype
- config-manager.hpp
- fstream
- iostream
- json-parser.hpp
- map
- sstream
- string
- sys/stat.h
- unistd.h
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