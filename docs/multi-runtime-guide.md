# Universal Multi-Runtime FFI Support

RKLLMJS now supports multiple JavaScript runtimes while maintaining the same high-performance FFI architecture. The library automatically detects your runtime and uses the most appropriate FFI implementation.

## Supported Runtimes

| Runtime | Support Level | FFI Implementation | Performance |
|---------|---------------|-------------------|-------------|
| **Bun** | ✅ **Full Support** | Native `Bun.dlopen` | **Optimal** |
| **Node.js** | ✅ **Full Support** | `koffi` or `ffi-napi` | High |
| **Deno** | ✅ **Full Support** | Native `Deno.dlopen` | High |

## Quick Start

```typescript
import { RKLLM, detectRuntime } from 'rkllmjs';

// Check your runtime
const runtime = detectRuntime();
console.log(`Running on ${runtime.name} with FFI support: ${runtime.ffiSupported}`);

// Use RKLLM - same API across all runtimes
const llm = new RKLLM();
await llm.init({
  modelPath: './model.rkllm',
  maxContextLen: 2048,
});

const result = await llm.run({
  inputType: 0, // PROMPT
  inputData: 'Hello, how are you?'
});

console.log(result.text);
await llm.destroy();
```

## Runtime-Specific Setup

### Bun (Recommended)

No additional setup required - FFI is built-in:

```bash
bun install rkllmjs
bun run your-app.ts
```

### Node.js

Install FFI dependencies:

```bash
npm install rkllmjs koffi
# OR alternatively:
# npm install rkllmjs ffi-napi ref-napi
```

### Deno

Enable FFI permissions:

```bash
deno run --allow-ffi --allow-read your-app.ts
```

## Advanced Usage

### Runtime Detection and Selection

```typescript
import { detectRuntime, createFFIAdapter, getFFIInfo } from 'rkllmjs';

// Get detailed runtime information
const info = getFFIInfo();
console.log(`Runtime: ${info.runtime}`);
console.log(`FFI Supported: ${info.ffiSupported}`);
console.log(`Library Extension: ${info.libraryExtension}`);

// Create specific adapter
const adapter = await createFFIAdapter({
  preferredRuntime: 'bun',
  fallbackEnabled: true
});
```

### Hardware-Specific Optimization

```typescript
// RK3588/RK3588S - 8 cores, 6 TOPS NPU
await llm.init({
  modelPath: './model.rkllm',
  maxContextLen: 4096,
  extendParam: {
    enabledCpusNum: 8,
    enabledCpusMask: 0xFF,    // Use all cores
    nBatch: 4,
    useCrossAttn: true
  }
});

// RK3576 - 4 performance cores
await llm.init({
  modelPath: './model.rkllm', 
  maxContextLen: 2048,
  extendParam: {
    enabledCpusNum: 4,
    enabledCpusMask: 0xF0,    // Performance cores
    nBatch: 2,
    embedFlash: true
  }
});
```

### Error Handling

```typescript
import { RKLLM, validateRuntimeCompatibility } from 'rkllmjs';

// Check compatibility before using
const validation = validateRuntimeCompatibility();
if (!validation.compatible) {
  console.error('Runtime issues:', validation.issues);
  process.exit(1);
}

// Graceful error handling
try {
  const llm = new RKLLM();
  await llm.init({...});
} catch (error) {
  if (error.message.includes('FFI')) {
    console.error('FFI not available - install runtime dependencies');
  } else if (error.message.includes('model')) {
    console.error('Model loading failed - check model path');
  }
}
```

## Migration Guide

### From Bun-Only Version

No changes needed! Existing code continues to work:

```typescript
// This code works unchanged
import { RKLLM } from 'rkllmjs';

const llm = new RKLLM();
// ... rest of your code
```

### New Universal Features

```typescript
// New features available
console.log(`Runtime: ${llm.runtimeName}`);

// Runtime-specific optimizations
if (llm.runtimeName === 'bun') {
  // Bun-specific optimizations
} else {
  // Universal optimizations
}
```

## Performance Notes

- **Bun**: Uses native FFI for maximum performance
- **Node.js**: Uses `koffi` (preferred) or `ffi-napi` with minimal overhead
- **Deno**: Uses native FFI with comparable performance to Bun

## Troubleshooting

### Node.js FFI Issues

```bash
# Install recommended FFI library
npm install koffi

# For older systems, use alternative
npm install ffi-napi ref-napi
```

### Deno Permission Issues

```bash
# Grant necessary permissions
deno run --allow-ffi --allow-read --allow-env your-app.ts
```

### Runtime Detection

```typescript
import { getRuntimeInfo } from 'rkllmjs';

const info = getRuntimeInfo();
console.log('Debug info:', JSON.stringify(info, null, 2));
```

## API Compatibility

All existing APIs work across all runtimes:

- ✅ `init()` - Initialize with model
- ✅ `run()` - Execute inference  
- ✅ `runStream()` - Streaming inference
- ✅ `destroy()` - Cleanup resources
- ✅ `loadLoraAdapter()` - LoRA support
- ✅ `setChatTemplate()` - Chat formatting
- ✅ `clearContext()` - Memory management
- ✅ All configuration options and parameters

The universal implementation ensures consistent behavior and performance across all supported JavaScript runtimes.