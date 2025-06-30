# RKLLMJS Development Rules

> **Strict development guidelines for RKLLMJS - A Node.js native module for Rockchip RK3588 NPU**

---

## 🎯 Project Objectives

### Primary Goals
- Create a robust Node.js addon module enabling JS/TS to leverage NPU on RK3588 through Rockchip's native library
- Focus on **performance**, **stability**, and **long-term maintainability**
- Provide type-safe TypeScript interfaces for C++ native bindings
- Ensure seamless integration between JavaScript runtime and hardware acceleration

### Target Architecture
```
┌─────────────────────┐
│   TypeScript API    │ ← High-level user interface
├─────────────────────┤
│   C++ N-API Layer   │ ← Native bindings
├─────────────────────┤
│   librkllmrt.so     │ ← Rockchip NPU library
└─────────────────────┘
```

---

## 📁 Source Code Organization & Testing

### 🔹 C++ Modular Architecture (Core System)

**MANDATORY**: C++ code is the core logic of RKLLMJS and MUST follow strict modular architecture.

#### C++ Module Requirements
**Each C++ module MUST be:**
- ✅ **Standalone** - Can be built and tested independently
- ✅ **Self-contained** - Has its own Makefile, tests, and documentation
- ✅ **Single responsibility** - Focused on one specific functionality
- ✅ **Interface-driven** - Clear .hpp interface with .cpp implementation
- ✅ **Unit tested** - Comprehensive unit tests for all public functions

#### C++ Module Structure
```
└── module-name/
    ├── module-name.cpp      # Implementation
    ├── module-name.hpp      # Public interface
    ├── module-name.test.cpp # Unit tests (standalone executable)
    ├── Makefile            # Module-specific build rules
    └── README.md           # Module documentation
```

#### Required C++ Modules
```
src/bindings/
├── core/                   # RKLLM lifecycle management
│   ├── rkllm-manager.cpp   # Model init/destroy/config
│   ├── rkllm-manager.hpp
│   ├── rkllm-manager.test.cpp
│   ├── Makefile
│   └── README.md
├── inference/              # Inference operations
│   ├── inference-engine.cpp # Run/RunAsync/Abort
│   ├── inference-engine.hpp
│   ├── inference-engine.test.cpp
│   ├── Makefile
│   └── README.md
├── memory/                 # Memory & Cache management
│   ├── cache-manager.cpp   # KV cache, prompt cache
│   ├── cache-manager.hpp
│   ├── cache-manager.test.cpp
│   ├── Makefile
│   └── README.md
├── adapters/              # LoRA & extensions
│   ├── lora-adapter.cpp   # LoRA operations
│   ├── lora-adapter.hpp
│   ├── lora-adapter.test.cpp
│   ├── Makefile
│   └── README.md
├── utils/                 # Common utilities
│   ├── type-converters.cpp # JS ↔ C++ conversion
│   ├── type-converters.hpp
│   ├── type-converters.test.cpp
│   ├── error-handler.cpp  # Error handling
│   ├── error-handler.hpp
│   ├── error-handler.test.cpp
│   ├── Makefile
│   └── README.md
├── napi-bindings/         # N-API layer
│   ├── binding.cpp        # Main N-API entry point
│   ├── binding.hpp
│   ├── binding.test.cpp
│   ├── Makefile
│   └── README.md
├── build.sh              # Build all C++ modules
├── test.sh               # Test all C++ modules
└── README.md             # C++ architecture overview
```

#### C++ Build System Requirements
**MANDATORY**: Each C++ module MUST have:
- ✅ **Individual Makefile** - Can build module + tests independently
- ✅ **Dependency management** - Explicit dependencies between modules
- ✅ **Test executable** - Standalone test binary for each module
- ✅ **Clean targets** - Clean module build artifacts
- ✅ **Debug/Release modes** - Support both development and production builds

#### C++ Test Requirements
**MANDATORY**: Each C++ module test MUST:
- ✅ **Run standalone** - Execute without external dependencies
- ✅ **Use relative paths** - Portable across environments
- ✅ **Generate logs** - Detailed logging for debugging
- ✅ **Exit codes** - Proper success/failure indication
- ✅ **Memory safe** - No leaks, proper cleanup
- ✅ **Fast execution** - Complete in under 30 seconds

### 🔹 TypeScript Layer (Interface Only)

**PHILOSOPHY**: TypeScript/JavaScript serves as a thin wrapper around C++ core logic.

#### TypeScript Features
```
└── feature-name/
    ├── feature-name.ts      # Implementation
    ├── feature-name.test.ts # Unit tests
    ├── README.md            # Feature documentation
    └── types.ts             # Type definitions (if needed)
```

#### C++ Features
```
└── cpp-feature/
    ├── cpp-feature.cpp      # Implementation
    ├── cpp-feature.hpp      # Header file
    ├── cpp-feature.test.cpp # Unit tests
    └── README.md            # Feature documentation
```

#### Mixed Features
```
└── hybrid-feature/
    ├── binding.cpp          # C++ native binding
    ├── binding.hpp          # C++ header
    ├── binding.test.cpp     # C++ unit tests
    ├── wrapper.ts           # TypeScript wrapper
    ├── wrapper.test.ts      # TypeScript unit tests
    └── README.md            # Feature documentation
```

### 🔹 Test Categories & Placement

**HYBRID TEST ARCHITECTURE**: RKLLMJS uses a two-tier testing structure to clearly separate unit tests from higher-level tests.

#### Tier 1: Unit Tests (Co-located with Source)
| Test Type | Required Location | Purpose |
|-----------|------------------|---------|
| **Unit Tests (TS)** | Same directory as source `.ts` file | Test individual functions/classes in isolation |
| **Unit Tests (C++)** | Same directory as source `.cpp` file | Test C++ components in isolation |

#### Tier 2: Integration & System Tests (Centralized)
| Test Type | Required Location | Purpose |
|-----------|------------------|---------|
| **Integration Tests** | `/tests/integration/` | Test feature interactions and multi-component workflows |
| **System Tests** | `/tests/system/` | End-to-end functionality on target hardware |
| **Performance Tests** | `/tests/performance/` | NPU performance benchmarks and optimization validation |

#### Special Directories
| Directory | Purpose |
|-----------|---------|
| `/src/testing/` | **Test Framework & Utilities** - Shared test infrastructure, loggers, helpers |
| `/tmp/` | **Temporary Dev Tests** - Development/debugging (ignored by validator) |

#### Test Architecture Overview
```
rkllmjs/
├── src/
│   ├── feature-name/
│   │   ├── feature-name.ts          # Source code
│   │   ├── feature-name.test.ts     # Unit tests (Tier 1)
│   │   └── README.md
│   └── testing/                     # Test Framework
│       ├── test-logger.ts           # Structured logging
│       ├── test-utils.ts            # Common test helpers
│       └── index.ts                 # Framework entry point
└── tests/                           # High-level Tests (Tier 2)
    ├── integration/                 # Multi-component workflows
    ├── system/                      # End-to-end functionality
    └── performance/                 # NPU benchmarks
```

### 🔹 Test Logging Requirements

**MANDATORY**: All tests MUST generate detailed logs for debugging and audit purposes.

#### Log File Structure
```
logs/
├── YYYY-MM-DD_HH-MM-SS/          # Timestamp-based directory
│   ├── unit-tests/
│   │   ├── model-types.test.log
│   │   ├── cli-runner.test.log
│   │   ├── model-manager.test.log
│   │   └── runtime-detector.test.log
│   ├── integration-tests/
│   │   └── [test-name].test.log
│   ├── system-tests/
│   │   └── [test-name].test.log
│   └── test-summary.log           # Overall test run summary
```

#### Log Content Requirements
- **Test Start/End**: Timestamps for each test case
- **Input Data**: All test inputs and parameters
- **Expected vs Actual**: Clear comparison of results
- **Error Details**: Full stack traces and error context
- **Performance Metrics**: Execution time, memory usage
- **Environment Info**: Runtime version, OS, dependencies

#### Log Naming Convention
- Format: `[feature-name].test.log`
- Timestamp directory: `YYYY-MM-DD_HH-MM-SS` format
- No spaces or special characters in filenames
- Consistent across all test types

### 🔹 Documentation Requirements

**MANDATORY**: Each feature/component directory MUST contain a `README.md` file with:

#### Required Documentation Sections
1. **Purpose** - Why this component exists, what problem it solves
2. **Architecture** - High-level design and data flow
3. **Core Components** - Main classes, functions, interfaces
4. **Usage Examples** - Code examples and common use cases
5. **Dependencies** - What this component depends on
6. **Testing** - Testing strategy and coverage
7. **Design Principles** - Key design decisions and trade-offs

#### Documentation Standards
- Clear, concise explanations suitable for new developers
- Code examples with proper syntax highlighting
- Architecture diagrams using ASCII art or mermaid
- Up-to-date with current implementation
- Include both API usage and internal workings

### 🚫 Prohibited Practices
- ❌ Multiple unrelated features in same file
- ❌ Multiple unrelated features in same directory
- ❌ Test files separated from their corresponding source files
- ❌ Generic naming like `utils.ts`, `helpers.cpp`
- ❌ Missing README.md for any feature/component directory
- ❌ Outdated or incomplete documentation
- ❌ Tests without proper logging and debug output
- ❌ Non-Node.js dependencies for core functionality

### 📁 Path Management Rules

**MANDATORY**: All code MUST use relative paths only.

#### Path Requirements
- ✅ **No absolute paths** - `/home/user/...` or `/usr/...` etc. are FORBIDDEN
- ✅ **Relative from project root** - All paths relative to project root directory
- ✅ **Portable builds** - Code must work on any system/user directory
- ✅ **Cross-platform** - Paths work on Linux, macOS, Windows

#### Configuration Files
- ✅ **Dynamic configuration** - No hardcoded model paths in source code
- ✅ **JSON/YAML configs** - Store model paths in `configs/` directory
- ✅ **Runtime resolution** - Resolve paths at runtime, not compile time
- ✅ **Environment aware** - Support different configs for dev/test/prod

#### Examples
```cpp
// ❌ FORBIDDEN - Absolute paths
#include "/home/user/libs/rkllm/include/rkllm.h"
std::string model_path = "/home/user/models/qwen.rkllm";

// ✅ REQUIRED - Relative paths
#include "../../../libs/rkllm/include/rkllm.h"
std::string model_path = config.getModelPath("qwen");  // from configs/
```

---

## 🔍 Validator Script (Test Coverage Enforcement)

### Validator Responsibilities
The validator script (`scripts/validate.sh`) runs during `npm test` and MUST:

1. **Scan entire codebase** for source files (`.ts`, `.cpp`, `.hpp`)
2. **Verify test coverage** - each source file MUST have corresponding test file
3. **Check documentation** - each feature directory MUST have README.md
4. **Ignore `/tmp` directory** for temporary development files
5. **Report missing tests** with exact file paths
6. **Report missing documentation** with feature directories
7. **Fail CI/CD pipeline** if any source file lacks tests or documentation
8. **Validate naming conventions** and directory structure

### Validator Rules
```bash
# For each .ts file, require .test.ts in same directory
# For each .cpp file, require .test.cpp in same directory
# For each feature directory, require README.md
# Exception: files in /tmp/ directory
# Exception: generated files (*.d.ts, *.js from build)
```

### Exit Codes
- `0`: All validation passed
- `1`: Missing test files detected
- `2`: Invalid directory structure
- `3`: Naming convention violations
- `4`: Missing documentation (README.md)

---

## 🏗️ Development Philosophy

### Test-Driven Development (TDD)
**MANDATORY**: Unit tests MUST be written BEFORE implementation code.

#### Development Workflow
1. 📝 Write failing unit test
2. 🔴 Run test suite (should fail)
3. ✅ Write minimal code to pass test
4. 🔄 Refactor while maintaining test passing
5. 📋 Add integration tests if needed

### Pull Request Requirements
Every PR MUST satisfy ALL conditions:
- ✅ 100% compliance with `RULES.md`
- ✅ Complete unit test coverage for new code
- ✅ All existing tests still pass
- ✅ Validator script passes
- ✅ No breaking changes without migration guide
- ✅ Updated documentation if API changes

### Code Quality Standards
- **Extensibility**: Easy to add new features
- **Maintainability**: Easy to modify/deprecate features
- **Rollback-friendly**: Easy to revert problematic changes
- **Minimal dependencies**: Avoid unnecessary external libraries
- **Type safety**: Leverage TypeScript's type system fully
- **Memory safety**: Proper C++ RAII patterns and cleanup

---

## 📚 Rockchip Library Management

### Protected Assets
**STRICTLY PROHIBITED** to modify, override, or replace:
- `libs/rkllm/aarch64/librkllmrt.so` - NPU runtime library
- `libs/rkllm/include/rkllm.h` - C API header definitions

### Library Integration Rules
- ✅ Only **link against** the provided `.so` library
- ✅ Only **include** the provided header file
- ✅ Create **wrapper interfaces** around C API
- ❌ **Never modify** core Rockchip assets
- ❌ **Never create** alternative implementations of core functions
- ❌ **Never bypass** the official C API

### Version Management
- Document current library version in `package.json`
- Test compatibility when Rockchip releases updates
- Maintain backward compatibility in our wrapper API

---

## 📝 Naming Conventions & File Organization

### File Naming Rules
- **Descriptive names**: `llm-runner.ts`, `model-loader.cpp`
- **No arbitrary abbreviations**: ❌ `util.ts`, ❌ `hlpr.cpp`
- **Consistent casing**: `kebab-case` for files, `PascalCase` for classes
- **No name conflicts**: TypeScript and C++ files must have distinct names

### Directory Structure Requirements
- **Logical grouping**: Related functionality together
- **Flat when possible**: Avoid deep nesting unless necessary
- **Clear hierarchy**: Parent-child relationships obvious
- **Easy navigation**: Developers can find files intuitively

### Recommended Project Structure
```
rkllmjs/
├── src/
│   ├── bindings/           # C++ N-API bindings
│   │   ├── llm-handle/
│   │   │   ├── llm-handle.cpp
│   │   │   ├── llm-handle.hpp  
│   │   │   ├── llm-handle.test.cpp    # Unit tests
│   │   │   └── README.md
│   │   ├── inference/
│   │   └── memory-manager/
│   ├── cli-runner/         # TypeScript features
│   │   ├── cli-runner.ts
│   │   ├── cli-runner.test.ts         # Unit tests
│   │   └── README.md
│   ├── model-manager/
│   │   ├── model-manager.ts
│   │   ├── model-manager.test.ts      # Unit tests
│   │   └── README.md
│   └── testing/            # Test Framework & Utilities
│       ├── test-logger.ts
│       ├── test-logger.test.ts
│       ├── test-utils.ts
│       ├── test-utils.test.ts
│       ├── index.ts
│       └── README.md
├── tests/                  # High-level Tests (Tier 2)
│   ├── integration/        # Multi-component workflows
│   │   ├── model-loading-integration.test.ts
│   │   ├── inference-pipeline.test.ts
│   │   └── README.md
│   ├── system/            # End-to-end functionality
│   │   ├── hardware-integration.test.ts
│   │   ├── production-workflows.test.ts  
│   │   └── README.md
│   ├── performance/       # NPU benchmarks
│   │   ├── latency-benchmarks.test.ts
│   │   ├── throughput-tests.test.ts
│   │   └── README.md
│   └── README.md          # Test hierarchy documentation
├── configs/               # Configuration files
│   ├── models.json        # Model repository configurations
│   └── README.md          # Configuration documentation
├── libs/rkllm/            # Rockchip library (protected)
├── scripts/               # Build and validation scripts
└── tmp/                   # Temporary dev files (ignored)
```

---

## 🔧 C++ Build System

### C++ Build Philosophy
- **Modular builds**: Each C++ module builds independently
- **Dependency aware**: Modules build in correct dependency order
- **Development friendly**: Fast incremental builds and easy debugging
- **Production ready**: Optimized builds for release
- **Test integrated**: Build system includes comprehensive testing

### Required Build Commands

#### Individual Module Commands
```bash
# Build specific module
cd src/bindings/core && make

# Test specific module
cd src/bindings/core && make test

# Clean specific module
cd src/bindings/core && make clean

# Debug build for specific module
cd src/bindings/core && make debug
```

#### Global Build Commands
```bash
# Build all C++ modules (from project root)
bash src/bindings/build.sh

# Test all C++ modules
bash src/bindings/test.sh

# Clean all C++ modules
bash src/bindings/build.sh clean

# Build and test all modules
bash src/bindings/build.sh && bash src/bindings/test.sh
```

#### NPM Integration
```bash
# NPM commands that use C++ build system
npm run build:cpp           # Build all C++ modules
npm run test:cpp            # Test all C++ modules
npm run test:cpp:module     # Test specific module (interactive)
npm run clean:cpp           # Clean all C++ builds
```

### C++ Build Requirements

#### Module Makefile Standards
**MANDATORY**: Each module Makefile MUST include:
```makefile
# Standard targets
all: $(MODULE_NAME) $(MODULE_NAME).test
clean: # Remove all build artifacts
test: $(MODULE_NAME).test && ./$(MODULE_NAME).test
debug: # Build with debug flags
install: # Install module artifacts

# Standard variables
CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra -fPIC
INCLUDES = -I../../libs/rkllm/include
LIBS = -L../../libs/rkllm/aarch64 -lrkllmrt

# Debug/Release configuration
ifdef DEBUG
    CXXFLAGS += -g -O0 -DDEBUG
else
    CXXFLAGS += -O2 -DNDEBUG
endif
```

#### Build Dependencies
**MANDATORY**: C++ modules MUST declare dependencies:
- ✅ **Header dependencies** - Include paths for other modules
- ✅ **Library dependencies** - Link order and requirements
- ✅ **Build order** - Dependencies build before dependents
- ✅ **Test dependencies** - Test modules can access implementation modules

### Global Build Script Requirements

#### build.sh Responsibilities
```bash
#!/bin/bash
# src/bindings/build.sh MUST:
# 1. Validate build environment (compiler, libraries)
# 2. Build modules in dependency order
# 3. Handle clean/debug/release modes
# 4. Report build status and errors
# 5. Generate build artifacts list
```

#### test.sh Responsibilities  
```bash
#!/bin/bash
# src/bindings/test.sh MUST:
# 1. Build all modules if needed
# 2. Run all module tests in order
# 3. Collect test results and logs
# 4. Generate test summary report
# 5. Exit with proper status codes
```

---

## 🔧 TypeScript Build System