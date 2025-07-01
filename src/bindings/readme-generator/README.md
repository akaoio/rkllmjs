# readme-generator

## Purpose
std::regex purposeRegex(R"(

## Overview
for additional info std::regex descRegex(R"(

## Architecture
- **readme-generator.hpp**: ReadmeGenerator


## Source Files
- `readme-generator-cli.cpp` (cpp)
- `readme-generator.cpp` (cpp)
- `readme-generator.hpp` (hpp)


## API Reference

### Functions
#### readme-generator-cli.cpp

##### `printUsage()`
*No documentation available*

##### `main()`
*No documentation available*

#### readme-generator.cpp

##### `file()`
*No documentation available*

##### `parseCppFile()`
*No documentation available*

##### `parseTypeScriptFile()`
*No documentation available*

##### `path()`
*No documentation available*

##### `replaceTemplateVariables()`
*No documentation available*

##### `generateReadme()`
*No documentation available*

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



### Classes
#### readme-generator.hpp

##### `ReadmeGenerator`
*No documentation available*



### Data Structures
- ReadmeConfig SourceInfo ModuleInfo 


### Enumerations
*None*

## Dependencies
- ../config/build-config.hpp
- algorithm
- filesystem
- fstream
- iostream
- map
- memory
- readme-generator.hpp
- regex
- set
- sstream
- string
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