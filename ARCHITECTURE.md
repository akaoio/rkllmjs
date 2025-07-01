# RKLLMJS Architecture Documentation

> **Detailed architecture documentation for RKLLMJS - TypeScript/Node.js interface for Rockchip RK3588 NPU**

---

## 🏗️ System Architecture Overview

RKLLMJS implements a **4-layer architecture** that bridges TypeScript/Node.js applications with the Rockchip RK3588 NPU:

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
│  (User TypeScript/JavaScript code using RKLLMJS API)        │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  TypeScript API Layer                       │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │   RKLLMClient   │  │ ModelManager │  │ RuntimeDetector│  │
│  │   (Primary API) │  │  (Download)  │  │   (Multi-RT)   │  │
│  └─────────────────┘  └──────────────┘  └────────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   C++ N-API Layer                           │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ NAPI Bindings   │  │ Type Convert │  │ Error Handler  │  │
│  │ (Node.js bridge)│  │ (JS ↔ C++)   │  │ (Unified logs) │  │
│  └─────────────────┘  └──────────────┘  └────────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   C++ Modular Core                          │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  RKLLM Manager  │  │Inference Eng.│  │ Memory Manager │  │
│  │ (Model loading) │  │(Text gen.)   │  │(NPU resources) │  │
│  └─────────────────┘  └──────────────┘  └────────────────┘  │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Config Manager  │  │Model Adapters│  │   Utilities    │  │
│  │ (JSON configs)  │  │ (Format conv)│  │ (Shared logic) │  │
│  └─────────────────┘  └──────────────┘  └────────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                Rockchip NPU Library                         │
│              librkllmrt.so (RK3588)                         │
│        (Hardware acceleration via NPU cores)                │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Architecture

### Request Flow (TypeScript → NPU)

```
1. TypeScript Application
   └── calls RKLLMClient.generate("prompt")
       │
2. TypeScript API Layer  
   └── validates input, prepares request
       │
3. N-API Layer
   └── converts JS types to C++ (type-converters)
       │ 
4. C++ Core
   └── RKLLM Manager loads model
   └── Inference Engine processes request
   └── Memory Manager handles NPU resources
       │
5. Rockchip Library
   └── librkllmrt.so sends to NPU hardware
       │
6. RK3588 NPU
   └── parallel processing on 3 NPU cores
```

### Response Flow (NPU → TypeScript)

```
1. RK3588 NPU
   └── generates tokens via neural network
       │
2. Rockchip Library
   └── librkllmrt.so receives NPU output
       │
3. C++ Core
   └── Inference Engine processes tokens
   └── Memory Manager cleans up resources
   └── Error Handler logs any issues
       │
4. N-API Layer  
   └── converts C++ results to JS (type-converters)
       │
5. TypeScript API Layer
   └── formats response, updates progress
       │
6. TypeScript Application
   └── receives Promise<GenerationResult>
```

---

## 🔧 Module Architecture

### TypeScript Layer Modules

#### 1. RKLLMClient (`src/rkllm-client/`)
- **Purpose**: Primary user-facing API
- **Key Features**: 
  - Promise-based interface
  - Streaming support with callbacks
  - Event-driven monitoring
  - Error handling and recovery
- **Dependencies**: rkllm-types, native bindings
- **Tests**: Comprehensive unit and integration tests

#### 2. Model Manager (`src/model-manager/`)
- **Purpose**: Model downloading and lifecycle management
- **Key Features**:
  - Hugging Face integration
  - Model validation and verification
  - Local model caching
  - Metadata management
- **Dependencies**: node-fetch, file system utilities
- **Tests**: Mock-free testing with real downloads

#### 3. Runtime Detector (`src/runtime-detector/`)
- **Purpose**: JavaScript runtime detection and optimization
- **Key Features**:
  - Node.js, Bun, Deno support
  - Runtime-specific optimizations
  - Feature capability detection
  - Performance profiling
- **Dependencies**: None (pure detection logic)
- **Tests**: Multi-runtime compatibility tests

#### 4. RKLLM Types (`src/rkllm-types/`)
- **Purpose**: Canonical type definitions
- **Key Features**:
  - Complete API type coverage
  - Runtime type validation
  - Cross-layer type safety
  - Documentation generation
- **Dependencies**: None (pure types)
- **Tests**: Type validation and serialization tests

### C++ Layer Modules

#### 1. Core Module (`src/bindings/core/`)
- **Components**: `rkllm-manager.cpp/hpp`
- **Purpose**: Central model lifecycle management
- **Key Features**:
  - Model loading and unloading
  - Resource lifecycle tracking
  - Thread-safe operations
  - Error state management
- **Dependencies**: librkllmrt.so, memory module
- **Tests**: Model loading, lifecycle, error scenarios

#### 2. Inference Module (`src/bindings/inference/`)
- **Components**: `inference-engine.cpp/hpp`
- **Purpose**: Text generation and inference logic
- **Key Features**:
  - Token generation
  - Stream processing
  - Performance monitoring
  - Cancellation support
- **Dependencies**: core module, utils module
- **Tests**: Generation accuracy, performance, streaming

#### 3. Memory Module (`src/bindings/memory/`)
- **Components**: `memory-manager.cpp/hpp`
- **Purpose**: NPU memory and resource management
- **Key Features**:
  - NPU memory allocation
  - Resource pooling
  - Garbage collection
  - Memory leak prevention
- **Dependencies**: core module
- **Tests**: Allocation, deallocation, leak detection

#### 4. Config Module (`src/bindings/config/`)
- **Components**: `config-manager.cpp/hpp`, `json-parser.cpp`
- **Purpose**: Configuration and settings management
- **Key Features**:
  - JSON configuration parsing
  - Runtime parameter validation
  - Default value management
  - Environment variable support
- **Dependencies**: utils module
- **Tests**: Configuration loading, validation, defaults

#### 5. Utils Module (`src/bindings/utils/`)
- **Components**: `type-converters.cpp/hpp`, `error-handler.cpp/hpp`
- **Purpose**: Shared utilities and helpers
- **Key Features**:
  - JavaScript ↔ C++ type conversion
  - Unified error handling and logging
  - String manipulation utilities
  - Debug and profiling helpers
- **Dependencies**: None (foundation module)
- **Tests**: Type conversion accuracy, error handling

#### 6. Adapters Module (`src/bindings/adapters/`)
- **Components**: `adapter-manager.cpp/hpp`
- **Purpose**: Model format adaptation and conversion
- **Key Features**:
  - RKLLM format support
  - Model validation
  - Metadata extraction
  - Format conversion utilities
- **Dependencies**: config module, utils module
- **Tests**: Format validation, conversion accuracy

#### 7. N-API Bindings (`src/bindings/napi-bindings/`)
- **Components**: `rkllm-napi.cpp/hpp`
- **Purpose**: Node.js N-API bridge layer
- **Key Features**:
  - JavaScript function exposure
  - Async operation support
  - Thread-safe callbacks
  - Memory management integration
- **Dependencies**: All other C++ modules
- **Tests**: API exposure, async operations, memory safety

---

## 🔄 Build System Architecture

### Two-Tier Build System

#### Tier 1: Module-Level Builds
Each C++ module has its own `Makefile` supporting:
- **Standalone compilation**: Independent module building
- **Unit testing**: Module-specific test execution
- **Debug builds**: Debug symbol generation
- **Clean operations**: Artifact removal

```makefile
# Example module Makefile structure
all: build test
build: $(MODULE_NAME).o
test: $(MODULE_NAME).test
clean: # Remove artifacts
debug: # Debug build with symbols
```

#### Tier 2: Global Orchestration
- **build.sh**: Coordinates all module builds
- **test.sh**: Runs all module tests
- **NPM integration**: `npm run build:cpp`, `npm run test:cpp`

### Build Modes

#### SANDBOX Mode
- **Purpose**: Development and unit testing
- **Features**: No N-API dependencies, standalone compilation
- **Use Case**: Module development, CI/CD testing

#### FULL Mode  
- **Purpose**: Production builds with Node.js integration
- **Features**: Complete N-API integration, all dependencies
- **Use Case**: Final builds, runtime execution

---

## 🧪 Testing Architecture

### Test Framework Strategy

#### C++ Testing: RKLLMJS Test Framework
- **Philosophy**: Zero external dependencies
- **Features**:
  - Familiar test syntax (describe/it style)
  - Colored output with clear results
  - Performance measurement
  - Memory leak detection
- **Coverage**: 1:1 test-to-source ratio enforced

#### TypeScript Testing: Node.js Native
- **Philosophy**: Use platform-native testing
- **Features**:
  - Node.js built-in test runner
  - Multi-runtime support (Node.js, Bun, Deno)
  - Integration with NPM scripts
  - Mock-free testing preferred

### Test Categories

#### Unit Tests (Co-located)
- **Location**: Same directory as source files
- **Purpose**: Individual component testing
- **Coverage**: 100% function/method coverage required

#### Integration Tests (`tests/integration/`)
- **Purpose**: Multi-component workflows
- **Scope**: TypeScript ↔ C++ interaction
- **Real Data**: No mocking, real model files

#### System Tests (`tests/system/`)
- **Purpose**: End-to-end hardware functionality
- **Scope**: Full pipeline with real NPU
- **Hardware**: RK3588-specific testing

#### Performance Tests (`tests/performance/`)
- **Purpose**: NPU performance benchmarking
- **Metrics**: Tokens/second, memory usage, latency
- **Comparison**: Baseline performance tracking

---

## 🔐 Security Architecture

### Asset Protection
- **Protected Files**: `libs/rkllm/` (Rockchip proprietary)
- **Principle**: Never modify, only link/include
- **Validation**: Automated hash verification

### Error Handling
- **Strategy**: Fail-fast with detailed logging
- **Recovery**: Automatic resource cleanup
- **Logging**: Structured logs in `logs/` directory
- **Privacy**: No sensitive data in logs

### Memory Safety
- **RAII**: Resource Acquisition Is Initialization
- **Smart Pointers**: Automatic memory management
- **Leak Detection**: Built into test framework
- **Bounds Checking**: Array and string validation

---

## 📈 Performance Architecture

### NPU Optimization
- **Parallel Processing**: 3 NPU cores utilization
- **Memory Pooling**: Pre-allocated NPU memory
- **Batch Processing**: Efficient token generation
- **Caching**: Model and configuration caching

### Multi-Runtime Support
- **Primary**: Node.js (stable, recommended)
- **Alternative**: Bun (fast, experimental)
- **Experimental**: Deno (modern, limited)
- **Optimization**: Runtime-specific code paths

### Monitoring and Profiling
- **Real-time Metrics**: Token generation rates
- **Resource Tracking**: Memory and NPU utilization
- **Performance Logs**: Detailed timing information
- **Benchmarking**: Automated performance testing

---

## 🔧 Configuration Architecture

### Configuration Hierarchy
1. **Default Values**: Built-in sensible defaults
2. **Configuration Files**: `configs/*.json`
3. **Environment Variables**: Runtime overrides
4. **API Parameters**: Request-specific settings

### Model Configuration
- **Model Metadata**: `configs/models.json`
- **Runtime Settings**: `configs/runtime.json`
- **Performance Tuning**: NPU-specific parameters
- **Validation**: Schema-based validation

---

## 🚀 Deployment Architecture

### Build Artifacts
- **TypeScript**: Compiled to `dist/`
- **C++ Modules**: Static libraries in `build/`
- **NPM Package**: Complete with native bindings
- **Documentation**: Generated API docs

### Platform Targets
- **Primary**: Orange Pi 5 Plus (RK3588)
- **Secondary**: Other RK3588 boards
- **Development**: x64 Linux (SANDBOX mode)
- **CI/CD**: ARM64 Ubuntu runners

### Distribution Strategy
- **NPM Registry**: TypeScript package with bindings
- **GitHub Releases**: Platform-specific binaries
- **Docker Images**: Complete runtime environment
- **Documentation**: Comprehensive guides and examples

---

This architecture ensures **modularity**, **testability**, **performance**, and **maintainability** while providing a clean interface for developers to leverage RK3588 NPU capabilities from TypeScript/Node.js applications.
