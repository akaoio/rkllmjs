# RKLLMJS Development Rules

> **Strict development guidelines for RKLLMJS - A Node.js native module for Rockchip RK3588 NPU**

---

## 🎯 Project Status

**ACHIEVED**: Real AI inference working on RK3588 NPU with Qwen2.5-VL-7B-Instruct model (1.33 tokens/sec, 100% NPU utilization). Complete TypeScript ↔ C++ ↔ NPU pipeline implemented with modular architecture.

**Architecture**: TypeScript API → C++ N-API Layer → librkllmrt.so (Rockchip NPU)

---

## 📁 Source Code Organization & Testing

### 🔹 C++ Modular Architecture

**Implemented Modules**: core/rkllm-manager, inference/inference-engine, config/config-manager, utils/type-converters, utils/error-handler, memory/memory-pool, adapters/model-adapter, napi-bindings/rkllm-napi

#### C++ Module Requirements
**Each C++ module MUST:**
- ✅ **Standalone** - Independent build and test capability
- ✅ **Self-contained** - Own Makefile, tests, and documentation
- ✅ **Single responsibility** - Focused functionality
- ✅ **Interface-driven** - Clear .hpp interface with .cpp implementation
- ✅ **1:1 Test Coverage** - **MANDATORY**: Each .cpp file MUST have exactly one .test.cpp file

#### C++ Module Structure
```
└── module-name/
    ├── module-name.cpp      # Implementation
    ├── module-name.hpp      # Public interface  
    ├── module-name.test.cpp # Unit tests (MANDATORY 1:1 ratio)
    ├── Makefile            # Module-specific build rules
    └── README.md           # Module documentation
```

#### Current C++ Implementation
```
src/bindings/
├── core/
│   ├── rkllm-manager.cpp/hpp/test.cpp
│   ├── Makefile & README.md
├── inference/
│   ├── inference-engine.cpp/hpp/test.cpp  
│   ├── Makefile & README.md
├── config/
│   ├── config-manager.cpp/hpp/test.cpp
│   ├── json-parser.cpp/test.cpp
│   ├── Makefile & README.md
├── utils/
│   ├── type-converters.cpp/hpp/test.cpp
│   ├── error-handler.cpp/hpp/test.cpp
│   ├── Makefile & README.md
├── napi-bindings/
│   ├── rkllm-napi.cpp/hpp/test.cpp
│   ├── Makefile & README.md
└── binding.cpp/test.cpp
```

#### C++ Build System
**Individual module builds** with global orchestration via build.sh/test.sh. Integration with NPM: `npm run build:cpp`, `npm run test:cpp`.

### 🔹 TypeScript Layer

**PHILOSOPHY**: TypeScript serves as a thin wrapper around C++ core logic.

#### File Structure
```
└── feature-name/
    ├── feature-name.ts      # Implementation
    ├── feature-name.test.ts # Unit tests (MANDATORY 1:1 ratio)
    ├── README.md            # Feature documentation
    └── types.ts             # Type definitions (if needed)
```

### 🔹 Test Architecture

**CRITICAL RULE**: Every source file (.cpp, .ts) MUST have exactly one corresponding test file (.test.cpp, .test.ts). No exceptions.

#### Two-Tier Testing Structure

**Tier 1: Unit Tests (Co-located)**
- **Location**: Same directory as source file
- **Purpose**: Test individual functions/classes in isolation
- **Naming**: `filename.test.{cpp|ts}` for `filename.{cpp|ts}`

**Tier 2: Integration & System Tests (Centralized)**
- **Integration**: `/tests/integration/` - Multi-component workflows
- **System**: `/tests/system/` - End-to-end hardware functionality  
- **Performance**: `/tests/performance/` - NPU benchmarks

#### Special Directories
- `/src/testing/` - Test framework and utilities
- `/tmp/` - Temporary development files (ignored by validator)

### 🔹 Test Logging & Documentation

#### Test Logging Requirements
**All tests MUST generate logs**: `logs/YYYY-MM-DD_HH-MM-SS/[test-name].test.log`

**Log Content**: Test start/end timestamps, input data, expected vs actual results, error details, performance metrics, environment info.

#### Documentation Requirements  
**Each feature directory MUST contain README.md** with: Purpose, Architecture, Core Components, Usage Examples, Dependencies, Testing, Design Principles.

### 🚫 Prohibited Practices
- ❌ Mocking data or logic files
- ❌ Missing test files (every .cpp/.ts needs .test.cpp/.test.ts)
- ❌ Multiple unrelated features in same file/directory
- ❌ Generic naming (`utils.ts`, `helpers.cpp`)
- ❌ Missing README.md for feature directories
- ❌ Non-Node.js dependencies for core functionality
- ❌ Absolute paths in code

### 📁 Path Management Rules

**MANDATORY**: All code MUST use relative paths only.

- ✅ **No absolute paths** - Portable builds across systems
- ✅ **Relative from project root** - All paths relative to project root
- ✅ **Dynamic configuration** - Store paths in `configs/` directory
- ✅ **Runtime resolution** - Resolve paths at runtime, not compile time

### 📂 Folder Organization Principles

**PRINCIPLE**: Organize files logically for maintainability and clear separation of concerns.

#### Implementation Requirements  
- ✅ **Every directory with README.md MUST have**: At least 1 source file (.cpp/.ts) AND 1 test file
- ✅ **No placeholder directories**: Directories exist only when implementation begins
- ✅ **Clean removal**: Remove directories when all implementation files are deleted

#### Test File Placement Rules
- ❌ **Prohibited in root**: No .test.* files or test-*.* files in project root
- ✅ **Script directory only**: Test orchestration scripts belong in `scripts/`
- ✅ **Co-located unit tests**: Test files alongside source in same directory
- ✅ **Centralized integration**: System/integration tests in `tests/` hierarchy

---

## 🔍 Validator Script

The `scripts/validate.sh` enforces compliance by:
1. **1:1 Test Coverage**: Each .cpp/.ts file must have corresponding .test.cpp/.test.ts
2. **Documentation**: Each feature directory must have README.md  
3. **Structure Validation**: Proper file placement and naming
4. **Exit Codes**: 0=pass, 1=missing tests, 2=structure issues, 3=naming violations, 4=missing docs

---

## 🏗️ Development Philosophy

### Test-Driven Development
**MANDATORY**: Write failing unit test → minimal passing code → refactor → integration tests

### Pull Request Requirements
- ✅ 100% RULES.md compliance
- ✅ Complete 1:1 test coverage  
- ✅ All tests pass
- ✅ Validator passes
- ✅ No breaking changes without migration guide

---

## 📚 Rockchip Library Management

### Protected Assets
**STRICTLY PROHIBITED** to modify:
- `libs/rkllm/aarch64/librkllmrt.so` - NPU runtime library
- `libs/rkllm/include/rkllm.h` - C API header

### Integration Rules
- ✅ **Link only** against provided .so library
- ✅ **Include only** provided header file  
- ✅ **Create wrappers** around C API
- ❌ **Never modify** core Rockchip assets

---

## 📝 File Organization & Naming

### Naming Rules
- **Descriptive names**: `llm-runner.ts`, `model-loader.cpp`
- **Consistent casing**: `kebab-case` for files, `PascalCase` for classes
- **1:1 test mapping**: `file.{cpp|ts}` → `file.test.{cpp|ts}`

### Project Structure
```
rkllmjs/
├── src/
│   ├── bindings/           # C++ modules (with co-located tests)
│   ├── [feature]/          # TypeScript features (with co-located tests)
│   └── testing/            # Test framework
├── tests/                  # Integration/system/performance tests
├── configs/               # Configuration files
├── libs/rkllm/            # Rockchip library (protected)
└── scripts/               # Build and validation scripts
```

---

## 🔧 Build Systems

### C++ Build System
- **Modular**: Each module builds independently via Makefile
- **Orchestrated**: Global build.sh/test.sh coordination
- **NPM Integrated**: `npm run build:cpp`, `npm run test:cpp`

### Required Build Targets
```makefile
all: $(MODULE).cpp $(MODULE).test.cpp
clean: # Remove build artifacts
test: # Build and run tests
debug: # Debug build
```

### TypeScript Build System