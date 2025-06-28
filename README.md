# RKLLMJS - Node.js Native Module for Rockchip RK3588 NPU

> **A robust Node.js addon module enabling JavaScript/TypeScript to leverage NPU on RK3588 through Rockchip's native library**

## 🎯 Project Status

**Current Phase**: Infrastructure & Model Management  
**Compliance**: ✅ Fully compliant with [RULES.md](./RULES.md)  
**Test Coverage**: 🧪 100% unit test coverage enforced

## 🏗️ Architecture

```
┌─────────────────────┐
│   TypeScript API    │ ← High-level user interface  
├─────────────────────┤
│   C++ N-API Layer   │ ← Native bindings (planned)
├─────────────────────┤
│   librkllmrt.so     │ ← Rockchip NPU library
└─────────────────────┘
```

## 📁 Project Structure (Compliant with RULES.md)

```
rkllmjs/
├── src/
│   ├── cli-runner/              # CLI interface feature
│   │   ├── cli-runner.ts        # Implementation
│   │   └── cli-runner.test.ts   # Unit tests  
│   ├── model-manager/           # Model management feature
│   │   ├── model-manager.ts     # Implementation
│   │   └── model-manager.test.ts # Unit tests
│   ├── model-types/             # Type definitions feature
│   │   ├── model-types.ts       # Implementation  
│   │   └── model-types.test.ts  # Unit tests
│   └── tools/ (DEPRECATED)      # Legacy backward compatibility
│       ├── manager.ts           # Legacy manager
│       ├── manager.test.ts      # Tests
│       ├── types.ts             # Legacy types
│       └── types.test.ts        # Tests
├── libs/rkllm/ (PROTECTED)      # Rockchip library assets
│   ├── aarch64/librkllmrt.so    # 🔒 NPU runtime library
│   └── include/rkllm.h          # 🔒 C API header
├── scripts/
│   └── validate.sh              # Compliance validator
└── RULES.md                     # 📖 Development rules (non-negotiable)
```

## 🚀 Quick Start

### Prerequisites

**Primary Runtime (Recommended):**
```bash
# Node.js >= 16.0.0 (Primary, stable)
node --version

# Install dependencies
npm install
```

**Alternative Runtimes (Experimental):**
```bash
# Bun >= 1.0.0 (Alternative, fast)
bun --version

# Deno >= 1.40.0 (Experimental, modern)
deno --version
```

### Model Management

**Node.js (Primary - Recommended):**
```bash
# Build TypeScript first
npm run build

# Use Node.js CLI (stable)
npm run cli pull limcheekin/Qwen2.5-0.5B-Instruct-rk3588-1.1.4 Qwen2.5-0.5B-Instruct-rk3588-w8a8-opt-0-hybrid-ratio-0.0.rkllm

# List downloaded models
npm run cli list

# Show model info
npm run cli info Qwen2.5

# Remove model  
npm run cli remove Qwen2.5
```

**Bun (Alternative - Fast):**
```bash
# Use Bun CLI (experimental)
npm run cli:bun pull limcheekin/Qwen2.5-0.5B-Instruct-rk3588-1.1.4 Qwen2.5-0.5B-Instruct-rk3588-w8a8-opt-0-hybrid-ratio-0.0.rkllm

# Direct Bun execution
bun src/cli-runner/cli-runner.ts list
```

**Deno (Experimental - Modern):**
```bash
# Use Deno CLI (experimental)
npm run cli:deno pull limcheekin/Qwen2.5-0.5B-Instruct-rk3588-1.1.4 Qwen2.5-0.5B-Instruct-rk3588-w8a8-opt-0-hybrid-ratio-0.0.rkllm

# Direct Deno execution
deno run --allow-all src/cli-runner/cli-runner.ts list
```

### Development

```bash
# Validate compliance with RULES.md
npm run validate

# Run tests (Node.js)
npm test

# Run tests (Bun)
npm run test:bun

# Run tests (Deno)
npm run test:deno

# Build for Node.js (primary)
npm run build

# Build TypeScript only
npm run build:ts

# Development mode (watch)
npm run dev
```

## 🧪 Test-Driven Development (TDD)

This project strictly follows TDD principles per [RULES.md](./RULES.md):

- ✅ **100% test coverage** enforced by validator
- ✅ **Tests written before** implementation  
- ✅ **Each feature** has its own directory with tests
- ✅ **No code without tests** allowed in main branch

```bash
# Validator ensures compliance
bash scripts/validate.sh

# Example output:
# ✅ Test file exists for ./src/model-manager/model-manager.ts
# ✅ Test file exists for ./src/cli-runner/cli-runner.ts  
# ✅ All validation checks passed! 🎉
```

## 📚 API Documentation

### RKLLMModelManager (Multi-Runtime)

**Node.js (Primary):**
```javascript
// CommonJS (compiled)
const { RKLLMModelManager } = require('./dist/model-manager/model-manager.js');

// ES Modules (TypeScript source)
import { RKLLMModelManager } from './src/model-manager/model-manager';

const manager = new RKLLMModelManager('./models');
await manager.pullModel('limcheekin/Qwen2.5-0.5B-Instruct-rk3588-1.1.4', 'model.rkllm');
```

**Bun (Alternative):**
```typescript
import { RKLLMModelManager } from './src/model-manager/model-manager';

const manager = new RKLLMModelManager('./models');

// Download model with essential config files
await manager.pullModel('limcheekin/Qwen2.5-0.5B-Instruct-rk3588-1.1.4', 'model.rkllm');

// List all models  
const models = await manager.listModels();

// Get model info
await manager.showModelInfo('Qwen2.5');

// Clean up
await manager.removeModel('Qwen2.5');
await manager.cleanModels(); // Remove all
```

**Deno (Experimental):**
```typescript
import { RKLLMModelManager } from './src/model-manager/model-manager.ts';

const manager = new RKLLMModelManager('./models');

// Same API as above, but with Deno runtime optimizations
```

### Runtime Detection

```typescript
import { RuntimeDetector } from './src/runtime-detector/runtime-detector';

const detector = RuntimeDetector.getInstance();
const runtime = detector.detect();

console.log(`Running on: ${runtime.type} v${runtime.version}`);
console.log(`Primary runtime: ${detector.isPrimary()}`);
console.log(`Experimental: ${detector.isExperimental()}`);
```

### Type Definitions

```typescript
import type { 
  ModelInfo, 
  ModelConfig, 
  ModelMetadata 
} from './src/model-types/model-types';

import type { 
  RuntimeType, 
  RuntimeInfo 
} from './src/runtime-detector/runtime-detector';

interface ModelInfo {
  name: string;
  path: string; 
  size: number;
  created: Date;
  repo?: string;
  filename?: string;
}
```

## 🔧 Development Rules

This project follows **strict development guidelines** defined in [RULES.md](./RULES.md):

### Core Principles

- 🏗️ **Feature-based structure**: Each feature in its own directory
- 🧪 **Test-driven development**: Tests written before implementation  
- 🔒 **Protected assets**: Never modify Rockchip library files
- 📝 **Descriptive naming**: No generic names like `utils.ts`
- ✅ **Validator enforcement**: Automatic compliance checking

### Compliance Checklist

- [ ] Each `.ts` file has corresponding `.test.ts` in same directory
- [ ] Each `.cpp` file has corresponding `.test.cpp` in same directory  
- [ ] No modifications to `libs/rkllm/` protected files
- [ ] Descriptive file and directory names
- [ ] Validator script passes: `bash scripts/validate.sh`

## 🚦 Build System

### Custom Build (No cmake-js)

- **Manual compilation** using custom `build.sh` (when ready)
- **N-API bindings** for C++ integration  
- **TypeScript compilation** for type safety
- **Reproducible builds** across environments

### Requirements  

**Primary Runtime:**
- **Node.js >= 16.0.0** (Primary, stable, recommended)
- **npm >= 8.0.0** (Package manager)

**Alternative Runtimes:**
- **Bun >= 1.0.0** (Alternative, fast, experimental)
- **Deno >= 1.40.0** (Experimental, modern, limited support)

**System Requirements:**
- **GCC/Clang with C++17 support** (for native bindings)
- **ARM64 architecture (RK3588)** for NPU features
- **Linux-based OS** (primary), macOS/Windows (development only)

## 🔒 Rockchip Library Integration

### Protected Assets (DO NOT MODIFY)

- `libs/rkllm/aarch64/librkllmrt.so` - NPU runtime library
- `libs/rkllm/include/rkllm.h` - C API header definitions

### Integration Rules

- ✅ **Link against** provided `.so` library
- ✅ **Include** provided header file  
- ✅ **Create wrapper interfaces** around C API
- ❌ **Never modify** core Rockchip assets
- ❌ **Never bypass** official C API

## 🤝 Contributing

### Pull Request Requirements

Every PR must satisfy ALL conditions:

- ✅ 100% compliance with [RULES.md](./RULES.md)
- ✅ Complete unit test coverage for new code
- ✅ All existing tests still pass  
- ✅ Validator script passes
- ✅ No breaking changes without migration guide
- ✅ Updated documentation if API changes

### Development Workflow

1. 📝 Write failing unit test
2. 🔴 Run test suite (should fail)  
3. ✅ Write minimal code to pass test
4. 🔄 Refactor while maintaining test passing
5. 📋 Add integration tests if needed
6. 🔍 Run validator: `bash scripts/validate.sh`

## 📖 Documentation

- [RULES.md](./RULES.md) - **Non-negotiable development rules**
- [libs/rkllm/include/rkllm.h](./libs/rkllm/include/rkllm.h) - Rockchip C API reference
- Source code documentation in each feature directory

## 🏷️ License

[MIT License](./LICENSE) - Feel free to use this project as you see fit.

---

> **⚡ Performance-focused, rule-compliant, test-driven Node.js NPU integration for RK3588**