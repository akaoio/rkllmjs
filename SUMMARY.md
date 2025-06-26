# 📚 RKLLMJS Universal Package Guide & FFI Best Practices

> **Comprehensive guide for packaging RKLLMJS as a universal package and FFI implementation best practices**

## 🎯 Overview

This document consolidates all knowledge, best practices, and guidelines for packaging RKLLMJS as a universal NPM package that can be used across different JavaScript runtimes while maintaining optimal performance through Bun.FFI.

## 🏗️ Current Architecture & Design Decisions

### FFI-Only Implementation

RKLLMJS has been strategically migrated to a **Bun.FFI exclusive implementation** for several key reasons:

- ⚡ **Zero Compilation**: No C++ build step required - instant setup
- 🚀 **Direct Native Calls**: Minimal overhead between JavaScript and native code  
- 🧠 **Full API Access**: Complete access to all 15+ RKLLM runtime features
- 📊 **Better Debugging**: Direct access to native function calls
- 🎯 **Simplified Maintenance**: Single backend instead of dual backend complexity

### Project Structure

```
rkllmjs/
├── src/
│   ├── ffi/                    # FFI implementation core
│   │   ├── rkllm-ffi.ts       # FFI symbol definitions & library loading
│   │   ├── type-conversion.ts  # JavaScript ↔ C type conversion
│   │   └── rkllm-ffi-impl.ts  # Complete FFI backend implementation
│   ├── tools/                  # Modular model management (refactored)
│   │   ├── index.ts           # CLI interface & command routing
│   │   ├── model-manager.ts   # Core model management logic
│   │   ├── types.ts           # Type definitions
│   │   └── utils.ts           # Utility functions
│   ├── rkllm.ts               # Main RKLLM class (FFI-only)
│   ├── types.ts               # Core type definitions
│   └── index.ts               # Main entry point
├── libs/
│   └── rkllm/                 # Native libraries
│       ├── aarch64/           # ARM64 libraries
│       ├── armhf/             # ARMhf libraries
│       └── include/           # C headers
├── docs/
│   ├── resources/             # Rockchip technical documentation
│   │   ├── Rockchip_RKLLM_SDK_EN_1.2.1.pdf
│   │   └── Rockchip_RKLLM_SDK_CN_1.2.1.pdf
│   ├── bun-ffi-guide.md      # Bun FFI specific guide
│   ├── performance.md         # Performance optimization
│   └── api.md                 # API documentation
└── examples/                   # Usage examples
```

## 📦 Universal Package Strategy

### 1. Package.json Configuration

The current `package.json` is optimized for universal distribution:

```json
{
  "name": "rkllmjs",
  "type": "module",
  "main": "dist/index.js",
  "module": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": [
    "dist",
    "libs",
    "src",
    "README.md",
    "LICENSE"
  ],
  "engines": {
    "bun": ">=1.0.0"
  },
  "os": ["linux"],
  "cpu": ["arm64", "arm"]
}
```

### 2. Multi-Runtime Support Strategy

While RKLLMJS is **optimized for Bun**, here's the current runtime support matrix:

| Runtime | Support Level | Implementation | Notes |
|---------|---------------|----------------|-------|
| **Bun** | ✅ **Full Support** | FFI Native | Recommended runtime |
| **Node.js** | ⚠️ **Limited** | Not Implemented | FFI not available |
| **Deno** | ⚠️ **Limited** | Not Implemented | FFI different API |

### 3. Runtime Detection & Graceful Degradation

```typescript
// src/ffi/rkllm-ffi.ts
export function isBunRuntime(): boolean {
  return typeof Bun !== 'undefined' && typeof Bun.version === 'string';
}

export function isFFIAvailable(): boolean {
  return lib !== null && typeof lib === 'object' && 'symbols' in lib;
}
```

## 🔧 FFI Implementation Details

### Native Library Management (.so files)

RKLLMJS handles dynamic library loading with fallback paths:

```typescript
// Library loading priority order:
const possiblePaths = [
  `./libs/rkllm/${arch}/librkllmrt.so`,    // Local libs
  `/usr/lib/librkllmrt.so`,                // System-wide
  `/usr/local/lib/librkllmrt.so`,          // User-installed
  `librkllmrt.so`                          // LD_LIBRARY_PATH
];
```

### Library Distribution Strategy

1. **Include Pre-built Libraries**: Ship with ARM64/ARMhf binaries in `libs/`
2. **Architecture Detection**: Automatic detection of target architecture
3. **Fallback Paths**: Multiple search locations for maximum compatibility
4. **Error Handling**: Graceful degradation when libraries unavailable

### C++ Compilation Not Required

**Key Advantage**: Users never need to compile C++ code because:

- ✅ Pre-built native libraries included in package
- ✅ FFI provides direct access without bridge compilation
- ✅ TypeScript compiles to JavaScript only
- ✅ Zero build dependencies for end users

## 🚀 Multi-Runtime FFI Considerations

### Bun.FFI (Current Implementation)

```typescript
import { dlopen, FFIType } from 'bun:ffi';

// Direct library loading
const lib = dlopen(libraryPath, {
  rkllm_init: {
    returns: FFIType.i32,
    args: [FFIType.ptr, FFIType.ptr]
  }
});
```

**Advantages:**
- Direct native calls
- Zero overhead
- Full control over memory management
- Excellent TypeScript integration

### Node.js FFI Alternatives (Future Consideration)

For Node.js support, would require:

```typescript
// Potential implementation using node-ffi-napi
import ffi from 'ffi-napi';

const lib = ffi.Library('librkllmrt', {
  'rkllm_init': ['int', ['pointer', 'pointer']]
});
```

**Challenges:**
- Additional native dependencies
- Performance overhead
- Complex memory management
- Platform-specific compilation

### Deno FFI (Future Consideration)

```typescript
// Potential Deno implementation
const lib = Deno.dlopen('./librkllmrt.so', {
  rkllm_init: {
    parameters: ['pointer', 'pointer'],
    result: 'i32'
  }
});
```

## 📋 Distribution & Packaging Best Practices

### 1. NPM Package Structure

```
rkllmjs-x.x.x.tgz
├── dist/                   # Compiled TypeScript
├── libs/                   # Native libraries
│   └── rkllm/
│       ├── aarch64/       # ARM64 binaries
│       └── armhf/         # ARMhf binaries
├── package.json
├── README.md
└── LICENSE
```

### 2. Installation Methods

```bash
# Standard package managers - all supported
npm install rkllmjs
yarn add rkllmjs  
pnpm add rkllmjs
bun add rkllmjs      # Recommended
```

### 3. Platform Targeting

Current targeting strategy:
- **OS**: Linux only (`"os": ["linux"]`)
- **CPU**: ARM64, ARMhf (`"cpu": ["arm64", "arm"]`)
- **Runtime**: Bun 1.0+ (`"engines": {"bun": ">=1.0.0"}`)

### 4. Dependency Management

**Zero Runtime Dependencies** - Key advantage:
- No external dependencies in production
- Smaller package size
- No dependency conflicts
- Faster installation

## 🔍 Model Management Tools Architecture

### Refactored Tools Structure

The tools have been **modularized** for better maintainability:

```
src/tools/
├── index.ts          # CLI interface (131 lines)
├── model-manager.ts  # Core logic (385 lines)
├── types.ts          # Type definitions (11 lines)
└── utils.ts          # Utilities (32 lines)
```

**Benefits:**
- ✅ Separation of concerns
- ✅ Improved testability
- ✅ Reduced complexity
- ✅ Maintained backward compatibility

### Usage Patterns

```bash
# Model management via tools
bun tools.ts pull limcheekin/Qwen2.5-0.5B-Instruct-rk3588-1.1.4 model.rkllm
bun tools.ts list
bun tools.ts info model-name
bun tools.ts remove model-name
bun tools.ts clean
```

## 📚 Rockchip Technical Documentation Role

### Documentation in `/docs/resources/`

The included Rockchip SDK documentation serves critical purposes:

1. **API Reference**: Complete C API documentation for RKLLM
2. **Parameter Specifications**: Detailed parameter descriptions
3. **Model Format**: .rkllm model format specifications
4. **Hardware Optimization**: NPU-specific optimization guidelines
5. **Troubleshooting**: Common issues and solutions

**Files:**
- `Rockchip_RKLLM_SDK_EN_1.2.1.pdf` - English documentation
- `Rockchip_RKLLM_SDK_CN_1.2.1.pdf` - Chinese documentation

**Usage for Developers:**
- Reference when implementing new FFI bindings
- Understanding parameter ranges and constraints
- Model optimization guidelines
- Hardware-specific performance tuning

## ⚡ Performance Optimization Guidelines

### Hardware-Specific Configurations

#### RK3588/RK3588S (8-core, 6 TOPS NPU)
```typescript
await llm.init({
  modelPath: process.env.RKLLM_MODEL_PATH,
  maxContextLen: 4096,
  extendParam: {
    enabledCpusNum: 8,
    enabledCpusMask: 0xFF,    // Use all cores
    nBatch: 4,
    useCrossAttn: true
  }
});
```

#### RK3576 (4-core performance + efficiency)
```typescript
await llm.init({
  modelPath: process.env.RKLLM_MODEL_PATH,
  maxContextLen: 2048,
  extendParam: {
    enabledCpusNum: 4,
    enabledCpusMask: 0xF0,    // Performance cores
    nBatch: 2,
    embedFlash: true
  }
});
```

#### RK3562 (Entry-level, 1 TOPS NPU)
```typescript
await llm.init({
  modelPath: process.env.RKLLM_MODEL_PATH,
  maxContextLen: 1024,
  maxNewTokens: 128,
  extendParam: {
    enabledCpusNum: 2,
    enabledCpusMask: 0x03,
    nBatch: 1,
    embedFlash: true
  }
});
```

## 🛠️ Development & Testing Guidelines

### Build Process
```bash
# TypeScript compilation only
bun run build      # Compiles src/ to dist/

# No C++ compilation needed!
```

### Testing Strategy
```bash
bun test           # Runs FFI integration tests
```

**Test Coverage:**
- FFI availability detection
- Runtime environment validation  
- API consistency checks
- Error handling verification
- Graceful degradation testing

### Development Setup
```bash
git clone https://github.com/akaoio/rkllmjs.git
cd rkllmjs
bun install
bun run build
bun test
bun run example
```

## 📖 User Documentation Strategy

### 1. README.md Structure
- Quick start guide
- Installation instructions
- Basic usage examples
- Hardware requirements
- FFI architecture explanation

### 2. Comprehensive Guides
- `docs/bun-ffi-guide.md` - FFI-specific implementation
- `docs/performance.md` - Hardware optimization
- `docs/api.md` - Complete API reference
- `SUMMARY.md` (this document) - Universal packaging guide

### 3. Example Code
- `examples/bun-ffi-example.ts` - Complete working example
- Streaming inference examples
- Advanced feature demonstrations

## 🔮 Future Considerations

### Multi-Runtime Support Expansion

If expanding beyond Bun:

1. **Node.js Support**:
   - Implement adapter using `node-ffi-napi`
   - Handle memory management differences
   - Performance testing required

2. **Deno Support**:
   - Implement using Deno's FFI API
   - Handle permission model
   - Test on Deno runtime

3. **Universal Adapter Pattern**:
   ```typescript
   // Potential universal interface
   interface RuntimeFFI {
     loadLibrary(path: string): any;
     callFunction(name: string, ...args: any[]): any;
   }
   ```

### Package Distribution Enhancements

1. **Architecture-Specific Packages**:
   - `rkllmjs-arm64` for ARM64 only
   - `rkllmjs-armhf` for ARMhf only
   - Main package depends on appropriate arch

2. **Platform Packages**:
   - `rkllmjs-rk3588` with optimized libraries
   - `rkllmjs-rk3576` with specific tuning
   - Hardware-specific optimizations

## ✅ Implementation Checklist

### Current Status (Completed ✅)

- [x] **FFI-Only Architecture**: Migrated from dual backend
- [x] **Zero Compilation**: No C++ build required
- [x] **Full API Coverage**: All 15+ RKLLM functions implemented
- [x] **Modular Tools**: Refactored model management
- [x] **TypeScript Support**: Complete type definitions
- [x] **Documentation**: Comprehensive guides and examples
- [x] **Testing**: FFI integration test suite
- [x] **Performance**: Hardware-specific optimizations
- [x] **Error Handling**: Graceful degradation
- [x] **Package Structure**: Universal distribution ready

### Future Enhancements (Optional 📋)

- [ ] **Node.js FFI Support**: Expand runtime compatibility
- [ ] **Deno FFI Support**: Additional runtime option
- [ ] **Architecture-Specific Packages**: Smaller package sizes
- [ ] **Hardware-Specific Optimizations**: Per-platform tuning
- [ ] **CI/CD Pipeline**: Automated testing on ARM hardware
- [ ] **Binary Validation**: Verify .so files in packages

## 🎉 Summary

RKLLMJS represents a **best-in-class approach** to native binding distribution:

### ✨ Key Strengths

1. **Zero Compilation** - Users never need to compile anything
2. **Universal Distribution** - Standard NPM package workflow
3. **Bun-Optimized** - Built for modern JavaScript runtime
4. **Complete API** - Full access to Rockchip LLM capabilities
5. **Well-Documented** - Comprehensive guides and examples
6. **Maintainable** - Clean, modular architecture

### 🚀 Production Ready

The current implementation is **production-ready** for Bun environments on Rockchip hardware, providing:

- Instant setup and deployment
- High-performance native access
- Complete feature coverage
- Excellent developer experience
- Comprehensive documentation

This foundation provides an excellent starting point for universal package distribution while maintaining the performance and simplicity advantages of the FFI-only approach.

---

*This document serves as the definitive guide for RKLLMJS universal packaging and should be updated as the project evolves.*