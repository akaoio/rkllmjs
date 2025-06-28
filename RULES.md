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

### 🔹 Feature-Based Directory Structure

**MANDATORY**: Each feature/function/module/component MUST reside in its own dedicated directory.

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

| Test Type | Required Location | Purpose |
|-----------|------------------|---------|
| **Unit Tests (TS)** | Same directory as source `.ts` file | Test individual functions/classes |
| **Unit Tests (C++)** | Same directory as source `.cpp` file | Test C++ components in isolation |
| **Integration Tests** | `/tests/integration/` | Test feature interactions |
| **System Tests** | `/tests/system/` | End-to-end functionality |
| **Performance Tests** | `/tests/performance/` | NPU performance benchmarks |
| **Temporary Dev Tests** | `/tmp/` | Development/debugging (ignored by validator) |

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
│   │   ├── inference/
│   │   └── memory-manager/
│   ├── wrappers/           # TypeScript wrappers
│   │   ├── rkllm-client/
│   │   ├── model-config/
│   │   └── result-parser/
│   └── utils/              # Shared utilities
│       ├── error-handler/
│       └── type-guards/
├── configs/                # Configuration files
│   ├── models.json         # Model repository configurations
│   └── README.md           # Configuration documentation
├── tests/
│   ├── integration/
│   ├── system/
│   └── performance/
├── libs/rkllm/            # Rockchip library (protected)
├── scripts/               # Build and validation scripts
└── tmp/                   # Temporary dev files (ignored)
```

---

## 🔧 Build System

### Build Philosophy
- **No cmake-js dependency**: Use custom `build.sh` for full control
- **Manual compilation**: Explicit compiler flags and linking
- **Reproducible builds**: Same output across different environments
- **Fast iteration**: Minimal rebuild time during development
- **Multi-runtime support**: Compatible with Node.js, Bun, and Deno

### Runtime Strategy
- **Primary Runtime**: Node.js with npm for stability and ecosystem maturity
- **Alternative Runtimes**: Bun for performance, Deno for modern features
- **Runtime Detection**: Automatic runtime detection and adaptation
- **Consistent API**: Same TypeScript API across all runtimes

### Build Script Requirements (`build.sh`)
```bash
#!/bin/bash
# Must handle:
# 1. C++ compilation with N-API headers
# 2. Linking against librkllmrt.so
# 3. TypeScript compilation (tsc or runtime-specific)
# 4. Type definition generation
# 5. Runtime-specific optimizations
# 6. Error handling and cleanup
```

### Build Artifacts
- `dist/` - Compiled JavaScript and type definitions
- `build/` - Compiled native addon (`.node` file)
- `docs/` - Generated documentation
- `dist/node/` - Node.js specific builds
- `dist/bun/` - Bun specific builds (if needed)
- `dist/deno/` - Deno specific builds (if needed)

### Environment Requirements
- **Primary Runtime**: Node.js >= 16.0.0 (recommended)
- **Alternative Runtimes**: Bun >= 1.0.0, Deno >= 1.40.0 (experimental)
- **Package Manager**: npm (primary), yarn/pnpm (alternative)
- **Architecture**: ARM64 (RK3588) or x64 (development)
- **Operating System**: Linux-based OS (primary), macOS/Windows (development)

---

## 🚀 Performance & NPU Optimization

### NPU Utilization Rules
- **Maximize NPU usage**: Prefer NPU over CPU when possible
- **Batch processing**: Group operations for efficiency
- **Memory management**: Minimize data transfer between CPU/NPU
- **Async operations**: Non-blocking inference calls

### Performance Monitoring
- Track inference latency
- Monitor memory usage
- Measure NPU utilization
- Profile bottlenecks regularly

---

## 📋 Compliance Checklist

### Before Every Commit
- [ ] All new files have corresponding test files
- [ ] All feature directories have README.md documentation
- [ ] Validator script passes (`npm run validate`)
- [ ] All tests pass (`npm test`)
- [ ] No modifications to protected Rockchip files
- [ ] Naming conventions followed
- [ ] Documentation updated if needed

### Before Every PR
- [ ] Feature complete with full test coverage
- [ ] Complete documentation for all new components
- [ ] Integration tests added if applicable
- [ ] Performance impact assessed
- [ ] Breaking changes documented
- [ ] Code review completed
- [ ] CI/CD pipeline passes

---

## 🔄 Maintenance & Evolution

### Deprecation Process
1. Mark feature as deprecated with clear timeline
2. Provide migration path and examples
3. Update documentation with alternatives
4. Remove after sufficient transition period

### Rollback Strategy
- Maintain git tags for stable releases
- Keep rollback documentation updated
- Test rollback procedures regularly
- Monitor for regressions after changes

---

> **These rules are non-negotiable and must be strictly followed by all contributors.**