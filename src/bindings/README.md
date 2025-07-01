# bindings

## Purpose
Native C++ binding layer for RKLLM JavaScript integration

## Overview
Comprehensive binding architecture providing seamless integration between RKLLM C++ library and JavaScript runtimes. Includes core management, memory optimization, inference engine, and platform adapters.

## Architecture
- **adapter-manager.hpp**: IAdapter, TextAdapter, JsonAdapter, RKLLMAdapter, AdapterFactory, AdapterManager, AdapterPipeline
- **config-manager.hpp**: ConfigManager
- **json-parser.hpp**: JsonValue, JsonParser
- **rkllm-manager.hpp**: RKLLMManager
- **readme-generator.hpp**: ReadmeGenerator
- **rkllm-manager.hpp**: RKLLMManager
- **inference-engine.hpp**: InferenceEngine, SamplingStrategy, GreedySampling, TopKSampling, TopPSampling
- **memory-manager.hpp**: IMemoryAllocator, CPUMemoryAllocator, NPUMemoryAllocator, MemoryManager, MemoryGuard
- **rkllm-napi.cpp**: JSRKLLMManager
- **rkllm-napi.hpp**: JSRKLLMManager
- **readme-generator.hpp**: ReadmeGenerator
- **rkllmjs-test.hpp**: TestRunner, TestCase
- **error-handler.hpp**: RKLLMException, TypeConversionException, ConfigurationException, ResourceException, ErrorScope
- **type-converters.hpp**: ConversionResult


## Source Files
- `binding-entry.cpp` (cpp)
- `binding.cpp` (cpp)
- `bindings.hpp` (hpp)
- `adapter-manager.cpp` (cpp)
- `adapter-manager.hpp` (hpp)
- `build-config.hpp` (hpp)
- `config-manager.cpp` (cpp)
- `config-manager.hpp` (hpp)
- `include-manager.hpp` (hpp)
- `json-parser.cpp` (cpp)
- `json-parser.hpp` (hpp)
- `rkllm-manager.cpp` (cpp)
- `rkllm-manager.hpp` (hpp)
- `readme-generator.hpp` (hpp)
- `rkllm-manager.hpp` (hpp)
- `inference-engine.cpp` (cpp)
- `inference-engine.hpp` (hpp)
- `memory-manager.cpp` (cpp)
- `memory-manager.hpp` (hpp)
- `rkllm-napi.cpp` (cpp)
- `rkllm-napi.hpp` (hpp)
- `readme-generator-cli.cpp` (cpp)
- `readme-generator.cpp` (cpp)
- `readme-generator.hpp` (hpp)
- `rkllmjs-test.hpp` (hpp)
- `error-handler.cpp` (cpp)
- `error-handler.hpp` (hpp)
- `type-converters.cpp` (cpp)
- `type-converters.hpp` (hpp)


## API Reference

### Functions
#### binding-entry.cpp

##### `Init()`
*No documentation available*

#### binding.cpp

##### `main()`
*No documentation available*

##### `Init()`
*No documentation available*

##### `napi_throw_error()`
*No documentation available*

#### bindings.hpp

##### `initialize()`
*No documentation available*

##### `cleanup()`
*No documentation available*

#### adapter-manager.cpp

##### `cleanup()`
*No documentation available*

##### `whitespace_regex()`
*No documentation available*

##### `dangerous_regex()`
*No documentation available*

##### `preparePrompt()`
*No documentation available*

##### `processResponse()`
*No documentation available*

##### `cleanup_regex()`
*No documentation available*

##### `registerAdapter()`
*No documentation available*

##### `createAdapter()`
*No documentation available*

##### `loadAdapterInternal()`
*No documentation available*

##### `clearPipeline()`
*No documentation available*

#### adapter-manager.hpp

##### `TextAdapter()`
*No documentation available*

##### `getName()`
*No documentation available*

##### `getVersion()`
*No documentation available*

##### `getSupportedFormat()`
*No documentation available*

##### `initialize()`
*No documentation available*

##### `cleanup()`
*No documentation available*

##### `isInitialized()`
*No documentation available*

##### `convertInput()`
*No documentation available*

##### `convertOutput()`
*No documentation available*

##### `validate()`
*No documentation available*

##### `setEncoding()`
*No documentation available*

##### `getEncoding()`
*No documentation available*

##### `normalize()`
*No documentation available*

##### `sanitize()`
*No documentation available*

##### `JsonAdapter()`
*No documentation available*

##### `setPrettyPrint()`
*No documentation available*

##### `getPrettyPrint()`
*No documentation available*

##### `parseJson()`
*No documentation available*

##### `createJson()`
*No documentation available*

##### `RKLLMAdapter()`
*No documentation available*

##### `preparePrompt()`
*No documentation available*

##### `processResponse()`
*No documentation available*

##### `optimizeInput()`
*No documentation available*

##### `AdapterFactory()`
*No documentation available*

##### `isAdapterAvailable()`
*No documentation available*

##### `getAdapterInfo()`
*No documentation available*

##### `getErrorMessage()`
*No documentation available*

##### `formatToString()`
*No documentation available*

##### `stringToFormat()`
*No documentation available*

##### `AdapterManager()`
*No documentation available*

##### `loadAdapterInternal()`
*No documentation available*

##### `loadAdapter()`
*No documentation available*

##### `unloadAdapter()`
*No documentation available*

##### `loadDefaultAdapters()`
*No documentation available*

##### `convertData()`
*No documentation available*

##### `validateData()`
*No documentation available*

##### `chainAdapters()`
*No documentation available*

##### `AdapterPipeline()`
*No documentation available*

##### `addAdapter()`
*No documentation available*

##### `removeAdapter()`
*No documentation available*

##### `clearPipeline()`
*No documentation available*

##### `execute()`
*No documentation available*

##### `getAdapterCount()`
*No documentation available*

#### build-config.hpp

##### `to_lower()`
*No documentation available*

##### `detect_rk3588()`
*No documentation available*

##### `detect_arm64()`
*No documentation available*

##### `detect_real_mode()`
*No documentation available*

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

#### rkllm-manager.cpp

##### `cleanup()`
*No documentation available*

##### `updateResourceStats()`
*No documentation available*

##### `rkllm_destroy()`
*No documentation available*

##### `getDefaultConfig()`
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

#### inference-engine.cpp

##### `stop()`
*No documentation available*

##### `validateParams()`
*No documentation available*

##### `updateStats()`
*No documentation available*

##### `callback()`
*No documentation available*

##### `whitespaceRegex()`
*No documentation available*

##### `iss()`
*No documentation available*

##### `detokenize()`
*No documentation available*

##### `formatPrompt()`
*No documentation available*

##### `escapeSpecialTokens()`
*No documentation available*

##### `calculatePerplexity()`
*No documentation available*

##### `isValidPrompt()`
*No documentation available*

##### `isValidInferenceParams()`
*No documentation available*

#### inference-engine.hpp

##### `isValid()`
*No documentation available*

##### `validate()`
*No documentation available*

##### `InferenceEngine()`
*No documentation available*

##### `generate()`
*No documentation available*

##### `setModelHandle()`
*No documentation available*

##### `getModelHandle()`
*No documentation available*

##### `generateStream()`
*No documentation available*

##### `pause()`
*No documentation available*

##### `resume()`
*No documentation available*

##### `stop()`
*No documentation available*

##### `isRunning()`
*No documentation available*

##### `getState()`
*No documentation available*

##### `setMaxConcurrentInferences()`
*No documentation available*

##### `setStreamBufferSize()`
*No documentation available*

##### `enableKVCache()`
*No documentation available*

##### `setDefaultParams()`
*No documentation available*

##### `getStats()`
*No documentation available*

##### `resetStats()`
*No documentation available*

##### `executeInference()`
*No documentation available*

##### `validateParams()`
*No documentation available*

##### `updateStats()`
*No documentation available*

##### `streamingWorker()`
*No documentation available*

##### `processBatchRequests()`
*No documentation available*

##### `preprocessPrompt()`
*No documentation available*

##### `shouldStop()`
*No documentation available*

##### `calculateTokensPerSecond()`
*No documentation available*

##### `sample()`
*No documentation available*

##### `getName()`
*No documentation available*

##### `detokenize()`
*No documentation available*

##### `formatPrompt()`
*No documentation available*

##### `escapeSpecialTokens()`
*No documentation available*

##### `calculatePerplexity()`
*No documentation available*

##### `isValidPrompt()`
*No documentation available*

##### `isValidInferenceParams()`
*No documentation available*

#### memory-manager.cpp

##### `block()`
*No documentation available*

##### `updateStats()`
*No documentation available*

##### `allocate()`
*No documentation available*

##### `new_block()`
*No documentation available*

##### `cleanup()`
*No documentation available*

#### memory-manager.hpp

##### `updateStats()`
*No documentation available*

##### `CPUMemoryAllocator()`
*No documentation available*

##### `allocate()`
*No documentation available*

##### `deallocate()`
*No documentation available*

##### `getStats()`
*No documentation available*

##### `isValidPointer()`
*No documentation available*

##### `reallocate()`
*No documentation available*

##### `defragment()`
*No documentation available*

##### `initializeNPU()`
*No documentation available*

##### `NPUMemoryAllocator()`
*No documentation available*

##### `isNPUAvailable()`
*No documentation available*

##### `initializeNPULazy()`
*No documentation available*

##### `allocateContiguous()`
*No documentation available*

##### `mapToNPU()`
*No documentation available*

##### `MemoryManager()`
*No documentation available*

##### `initialize()`
*No documentation available*

##### `cleanup()`
*No documentation available*

##### `isInitialized()`
*No documentation available*

##### `allocateCPU()`
*No documentation available*

##### `allocateNPU()`
*No documentation available*

##### `getCombinedStats()`
*No documentation available*

##### `getCPUStats()`
*No documentation available*

##### `getNPUStats()`
*No documentation available*

##### `optimizeMemory()`
*No documentation available*

##### `logMemoryUsage()`
*No documentation available*

##### `getErrorMessage()`
*No documentation available*

##### `bool()`
*No documentation available*

#### rkllm-napi.cpp

##### `engine()`
*No documentation available*

##### `test_napi_bindings()`
*No documentation available*

##### `InitRKLLMBindings()`
*No documentation available*

##### `napi_get_undefined()`
*No documentation available*

#### rkllm-napi.hpp

##### `InitRKLLMBindings()`
*No documentation available*

##### `JSRKLLMManager()`
*No documentation available*

##### `initializeModel()`
*No documentation available*

##### `generateText()`
*No documentation available*

##### `cleanup()`
*No documentation available*

##### `isInitialized()`
*No documentation available*

##### `setParameter()`
*No documentation available*

##### `getParameter()`
*No documentation available*

##### `getMemoryUsage()`
*No documentation available*

##### `isNPUAvailable()`
*No documentation available*

##### `test_napi_bindings()`
*No documentation available*

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

#### rkllmjs-test.hpp

##### `startTest()`
*No documentation available*

##### `endTest()`
*No documentation available*

##### `recordFailure()`
*No documentation available*

##### `runAll()`
*No documentation available*

##### `getSummary()`
*No documentation available*

##### `test_func()`
*No documentation available*

##### `main()`
*No documentation available*

#### error-handler.cpp

##### `RKLLMException()`
*No documentation available*

##### `logError()`
*No documentation available*

##### `cleanup()`
*No documentation available*

##### `createErrorInfo()`
*No documentation available*

##### `getCategoryString()`
*No documentation available*

##### `getSeverityString()`
*No documentation available*

##### `formatErrorMessage()`
*No documentation available*

##### `validateNotEmpty()`
*No documentation available*

##### `ConfigurationException()`
*No documentation available*

##### `validateRange()`
*No documentation available*

##### `validatePositive()`
*No documentation available*

#### error-handler.hpp

##### `TypeConversionException()`
*No documentation available*

##### `getTypeString()`
*No documentation available*

##### `throwError()`
*No documentation available*

##### `throwConversionError()`
*No documentation available*

##### `throwConfigurationError()`
*No documentation available*

##### `throwResourceError()`
*No documentation available*

##### `createError()`
*No documentation available*

##### `handleNativeError()`
*No documentation available*

##### `getNativeErrorMessage()`
*No documentation available*

##### `logError()`
*No documentation available*

##### `exceptionToErrorInfo()`
*No documentation available*

##### `rethrowAsJSError()`
*No documentation available*

##### `getErrorCodeString()`
*No documentation available*

##### `getErrorCategoryFromCode()`
*No documentation available*

##### `validateParameter()`
*No documentation available*

##### `validateStringParameter()`
*No documentation available*

##### `validateNumberParameter()`
*No documentation available*

##### `validateObjectParameter()`
*No documentation available*

##### `validateArrayParameter()`
*No documentation available*

##### `getCategoryString()`
*No documentation available*

##### `getSeverityString()`
*No documentation available*

##### `formatErrorMessage()`
*No documentation available*

##### `createErrorInfo()`
*No documentation available*

##### `validateNotEmpty()`
*No documentation available*

##### `validateRange()`
*No documentation available*

##### `validatePositive()`
*No documentation available*

##### `ErrorScope()`
*No documentation available*

##### `success()`
*No documentation available*

#### type-converters.cpp

##### `trim()`
*No documentation available*

##### `ss()`
*No documentation available*

##### `join()`
*No documentation available*

##### `startsWith()`
*No documentation available*

##### `endsWith()`
*No documentation available*

##### `stringToInt32()`
*No documentation available*

##### `TypeConversionException()`
*No documentation available*

##### `stringToDouble()`
*No documentation available*

##### `int32ToString()`
*No documentation available*

##### `doubleToString()`
*No documentation available*

##### `mapToString()`
*No documentation available*

##### `isValidString()`
*No documentation available*

##### `isValidNumber()`
*No documentation available*

##### `isValidPath()`
*No documentation available*

##### `isValidRange()`
*No documentation available*

##### `bytesToString()`
*No documentation available*

##### `bytesToHex()`
*No documentation available*

##### `safeStringToInt32()`
*No documentation available*

##### `ConversionResult()`
*No documentation available*

##### `safeStringToDouble()`
*No documentation available*

##### `validateString()`
*No documentation available*

##### `normalizeString()`
*No documentation available*

##### `validateInt32()`
*No documentation available*

##### `validateDouble()`
*No documentation available*

##### `jsStringToCppString()`
*No documentation available*

##### `cppStringToJsString()`
*No documentation available*

##### `cppStringMapToJsObject()`
*No documentation available*

##### `jsNumberToCppInt32()`
*No documentation available*

##### `jsNumberToCppDouble()`
*No documentation available*

##### `cppInt32ToJsNumber()`
*No documentation available*

##### `cppDoubleToJsNumber()`
*No documentation available*

##### `jsBooleanToCppBool()`
*No documentation available*

##### `cppBoolToJsBoolean()`
*No documentation available*

##### `isValidType()`
*No documentation available*

##### `validateNotUndefined()`
*No documentation available*

##### `validateNotNull()`
*No documentation available*

#### type-converters.hpp

##### `isSuccess()`
*No documentation available*

##### `jsStringToCppString()`
*No documentation available*

##### `cppStringToJsString()`
*No documentation available*

##### `cppVectorToJsArray()`
*No documentation available*

##### `cppStringMapToJsObject()`
*No documentation available*

##### `jsNumberToCppInt32()`
*No documentation available*

##### `jsNumberToCppDouble()`
*No documentation available*

##### `cppInt32ToJsNumber()`
*No documentation available*

##### `cppDoubleToJsNumber()`
*No documentation available*

##### `jsBooleanToCppBool()`
*No documentation available*

##### `cppBoolToJsBoolean()`
*No documentation available*

##### `isValidType()`
*No documentation available*

##### `validateNotUndefined()`
*No documentation available*

##### `validateNotNull()`
*No documentation available*

##### `validateString()`
*No documentation available*

##### `normalizeString()`
*No documentation available*

##### `validateVector()`
*No documentation available*

##### `validateInt32()`
*No documentation available*

##### `validateDouble()`
*No documentation available*

##### `trim()`
*No documentation available*

##### `join()`
*No documentation available*

##### `startsWith()`
*No documentation available*

##### `endsWith()`
*No documentation available*

##### `stringToInt32()`
*No documentation available*

##### `stringToDouble()`
*No documentation available*

##### `int32ToString()`
*No documentation available*

##### `doubleToString()`
*No documentation available*

##### `mapToString()`
*No documentation available*

##### `isValidString()`
*No documentation available*

##### `isValidNumber()`
*No documentation available*

##### `isValidPath()`
*No documentation available*

##### `isValidRange()`
*No documentation available*

##### `bytesToString()`
*No documentation available*

##### `bytesToHex()`
*No documentation available*

##### `constexpr()`
*No documentation available*

##### `static_assert()`
*No documentation available*



### Classes
#### adapter-manager.hpp

##### `IAdapter`
*No documentation available*

##### `TextAdapter`
*No documentation available*

##### `JsonAdapter`
*No documentation available*

##### `RKLLMAdapter`
*No documentation available*

##### `AdapterFactory`
*No documentation available*

##### `AdapterManager`
*No documentation available*

##### `AdapterPipeline`
*No documentation available*

#### config-manager.hpp

##### `ConfigManager`
*No documentation available*

#### json-parser.hpp

##### `JsonValue`
*No documentation available*

##### `JsonParser`
*No documentation available*

#### rkllm-manager.hpp

##### `RKLLMManager`
*No documentation available*

#### readme-generator.hpp

##### `ReadmeGenerator`
*No documentation available*

#### rkllm-manager.hpp

##### `RKLLMManager`
*No documentation available*

#### inference-engine.hpp

##### `InferenceEngine`
*No documentation available*

##### `SamplingStrategy`
*No documentation available*

##### `GreedySampling`
*No documentation available*

##### `TopKSampling`
*No documentation available*

##### `TopPSampling`
*No documentation available*

#### memory-manager.hpp

##### `IMemoryAllocator`
*No documentation available*

##### `CPUMemoryAllocator`
*No documentation available*

##### `NPUMemoryAllocator`
*No documentation available*

##### `MemoryManager`
*No documentation available*

##### `MemoryGuard`
*No documentation available*

#### rkllm-napi.cpp

##### `JSRKLLMManager`
*No documentation available*

#### rkllm-napi.hpp

##### `JSRKLLMManager`
*No documentation available*

#### readme-generator.hpp

##### `ReadmeGenerator`
*No documentation available*

#### rkllmjs-test.hpp

##### `TestRunner`
*No documentation available*

##### `TestCase`
*No documentation available*

#### error-handler.hpp

##### `RKLLMException`
*No documentation available*

##### `TypeConversionException`
*No documentation available*

##### `ConfigurationException`
*No documentation available*

##### `ResourceException`
*No documentation available*

##### `ErrorScope`
*No documentation available*

#### type-converters.hpp

##### `ConversionResult`
*No documentation available*



### Data Structures
- stat stat 
- ModelConfig HardwareProfile 
- sysinfo 
- RKLLMModelConfig ResourceStats ModelInstance 
- ReadmeConfig SourceInfo ModuleInfo 
- RKLLMModelConfig ResourceStats ModelInstance 
- InferenceParams InferenceResult BatchRequest BatchResult Stats 
- MemoryStats MemoryBlock 
- ReadmeConfig SourceInfo ModuleInfo 
- TestResult 
- ErrorInfo 


### Enumerations
- AdapterResult DataFormat 
- Type 
- ManagerResult 
- ManagerResult 
- InferenceState 
- MemoryResult 
- ErrorSeverity ErrorCategory 


## Dependencies
- ../../../libs/rkllm/include/rkllm.h
- ../config/build-config.hpp
- ../core/rkllm-manager.hpp
- ../inference/inference-engine.hpp
- ../utils/error-handler.hpp
- ../utils/type-converters.hpp
- adapter-manager.hpp
- adapters/adapter-manager.hpp
- algorithm
- atomic
- build-config.hpp
- cctype
- chrono
- cmath
- config-manager.hpp
- config/config-manager.hpp
- core/rkllm-manager.hpp
- cstddef
- cstdio
- cstdlib
- cstring
- error-handler.hpp
- exception
- filesystem
- fstream
- functional
- future
- inference-engine.hpp
- inference/inference-engine.hpp
- iomanip
- iostream
- json-parser.hpp
- map
- memory
- memory-manager.hpp
- memory/memory-manager.hpp
- mutex
- napi-bindings/rkllm-napi.hpp
- napi.h
- node_api.h
- numeric
- ostream
- random
- readme-generator.hpp
- regex
- rkllm-manager.hpp
- rkllm-napi.hpp
- set
- sstream
- string
- sys/mman.h
- sys/stat.h
- sys/sysinfo.h
- thread
- type-converters.hpp
- type_traits
- unistd.h
- unordered_map
- utils/error-handler.hpp
- utils/type-converters.hpp
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