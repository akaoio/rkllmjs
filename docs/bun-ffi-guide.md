# Bun.FFI Integration Guide

This guide explains how to use RKLLMJS with Bun's Foreign Function Interface (FFI) for direct native library access without requiring C++ compilation.

## Overview

RKLLMJS now supports two backends:

1. **N-API Backend** - Traditional Node.js native addon (requires compilation)
2. **Bun.FFI Backend** - Direct library access using Bun's FFI (no compilation required)

The library automatically detects the best available backend, with FFI preferred when running in Bun.

## Quick Start with Bun.FFI

### 1. Install Bun

```bash
curl -fsSL https://bun.sh/install | bash
```

### 2. Install RKLLMJS

```bash
bun add rkllmjs
```

### 3. Basic Usage

```typescript
import { RKLLM, RKLLMInputType } from 'rkllmjs';

// Create RKLLM instance (automatically uses FFI in Bun)
const llm = new RKLLM();

await llm.init({
  modelPath: './models/your-model.rkllm',
  maxContextLen: 2048,
  temperature: 0.7,
});

// Run inference
const result = await llm.run({
  inputType: RKLLMInputType.PROMPT,
  inputData: "Hello, world!",
});

console.log(result.text);

// Clean up
await llm.destroy();
```

### 4. Explicit Backend Selection

```typescript
import { RKLLM } from 'rkllmjs';

const llm = new RKLLM();

// Explicitly use FFI backend
await llm.init({
  modelPath: './models/your-model.rkllm',
  maxContextLen: 2048,
}, 'ffi');

console.log(`Using ${llm.backendType} backend`); // "ffi"
```

## Features Comparison

| Feature | N-API | Bun.FFI | Notes |
|---------|-------|---------|-------|
| Basic Inference | ✅ | ✅ | Core functionality |
| Streaming Inference | ✅ | 🚧 | FFI implementation in progress |
| LoRA Adapters | ✅ | ✅ | Load/unload model adapters |
| Prompt Caching | ✅ | ✅ | Cache frequently used prompts |
| KV Cache Management | ❌ | ✅ | Clear and manage key-value cache |
| Chat Templates | ❌ | ✅ | Set system prompts and templates |
| Function Calling | ❌ | ✅ | Tool/function calling support |
| Cross Attention | ❌ | ✅ | Advanced attention mechanisms |
| Runtime Support | Node.js, Bun | Bun only | Platform compatibility |
| Compilation Required | Yes | No | Setup complexity |

## Advanced FFI Features

### 1. Manual FFI Initialization

```typescript
import { initializeFFI, isFFIAvailable, isBunRuntime } from 'rkllmjs';

// Check if FFI is available
if (isBunRuntime()) {
  console.log('Running in Bun!');
  
  // Initialize FFI manually
  const success = initializeFFI();
  if (success) {
    console.log('FFI initialized successfully');
  }
}
```

### 2. KV Cache Management

```typescript
import { RKLLM } from 'rkllmjs';

const llm = new RKLLM();
await llm.init(params, 'ffi');

// Get cache sizes
const cacheSizes = await llm.getKVCacheSize();
console.log('Cache sizes:', cacheSizes);

// Clear cache (keep system prompt)
await llm.clearKVCache(true);
```

### 3. Chat Templates

```typescript
import { RKLLM } from 'rkllmjs';

const llm = new RKLLM();
await llm.init(params, 'ffi');

// Set custom chat template
await llm.setChatTemplate(
  "You are a helpful AI assistant.",  // system prompt
  "User: ",                          // prompt prefix
  "\nAssistant: "                    // prompt postfix
);
```

### 4. Performance Monitoring

```typescript
// Benchmark different backends
import { benchmarkBackend } from './examples/backend-comparison.js';

const napiResult = await benchmarkBackend('napi');
const ffiResult = await benchmarkBackend('ffi');

console.log('N-API Init Time:', napiResult.initTime, 'ms');
console.log('FFI Init Time:', ffiResult.initTime, 'ms');
```

## Examples

See the `examples/` directory for complete examples:

- `bun-ffi-example.ts` - Basic FFI usage
- `backend-comparison.ts` - Performance comparison between backends

Run examples with:

```bash
# Basic FFI example
bun run examples/bun-ffi-example.ts

# Backend comparison
bun run examples/backend-comparison.ts
```

## Benefits of Bun.FFI

### 1. **No Compilation Required**
- Skip the complex C++ build process
- Faster development iteration
- No need for build tools (node-gyp, etc.)

### 2. **Direct Library Access**
- Call native functions directly
- Better performance potential
- More precise control over memory and types

### 3. **Simpler Deployment**
- No native modules to compile
- Easier containerization
- Reduced build dependencies

### 4. **Advanced Features**
- Access to newer RKLLM library features
- More complete API coverage
- Real-time cache management

## Architecture

```
┌─────────────────┐    ┌──────────────────┐
│   Your App      │    │     RKLLMJS      │
│                 │    │                  │
│ JavaScript/TS   │────│   Common API     │
└─────────────────┘    │                  │
                       │  ┌─────────────┐ │
                       │  │ Bun.FFI     │ │
                       │  │ Backend     │ │
                       │  └─────────────┘ │
                       │  ┌─────────────┐ │
                       │  │ N-API       │ │
                       │  │ Backend     │ │
                       │  └─────────────┘ │
                       └──────────────────┘
                                │
                       ┌──────────────────┐
                       │ librkllmrt.so    │
                       │ (Native Library) │
                       └──────────────────┘
```

## Troubleshooting

### FFI Library Not Found

```
Error: Could not load RKLLM library from any location
```

**Solution:**
1. Ensure the native library is in the correct location:
   - ARM64: `./libs/rkllm/aarch64/librkllmrt.so`
   - ARMhf: `./libs/rkllm/armhf/librkllmrt.so`
2. Add the library path to `LD_LIBRARY_PATH`
3. Verify you're running on a supported architecture

### Backend Fallback

```
Warning: FFI backend failed, falling back to N-API
```

This is normal behavior when FFI is not available. The library will automatically use N-API as a fallback.

### Bun Runtime Not Detected

```
Error: RKLLM FFI implementation is only available in Bun runtime
```

**Solution:** Make sure you're running with Bun:
```bash
bun run your-script.ts
# instead of
node your-script.js
```

## Best Practices

1. **Use FFI in Bun environments** for maximum performance and features
2. **Explicit backend selection** when you need specific features
3. **Handle fallbacks gracefully** when FFI is not available
4. **Monitor performance** to choose the best backend for your use case
5. **Clean up resources** properly with `destroy()` method

## Migration from N-API Only

If you're upgrading from a version that only supported N-API:

1. **No code changes required** - the API remains the same
2. **Install Bun** to take advantage of FFI features
3. **Test both backends** to ensure compatibility
4. **Update deployment scripts** if moving to FFI-only setup

The library maintains full backward compatibility while adding new FFI capabilities.