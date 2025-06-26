# Bun.FFI Integration Guide

This guide explains how to use RKLLMJS with Bun's Foreign Function Interface (FFI) for direct native library access without requiring C++ compilation.

## Overview

RKLLMJS is now exclusively built on Bun.FFI:

- **Bun.FFI Only** - Direct library access using Bun's FFI (no compilation required)
- **Optimized Performance** - Direct native function calls with minimal overhead
- **Instant Setup** - No build step or compilation needed
- **Full API Access** - Complete RKLLM runtime functionality available

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

## FFI Features Overview

| Feature | FFI Support | Notes |
|---------|-------------|-------|
| Basic Inference | ✅ | Core functionality |
| Streaming Inference | ✅ | Real-time token generation |
| LoRA Adapters | ✅ | Load model adapters |
| Prompt Caching | ✅ | Cache frequently used prompts |
| KV Cache Management | ✅ | Clear and manage key-value cache |
| Chat Templates | ✅ | Set system prompts and templates |
| Function Calling | ✅ | Tool/function calling support |
| Cross Attention | ✅ | Advanced attention mechanisms |
| Runtime Support | Bun only | Optimized for Bun FFI |
| Compilation Required | No | Zero build step setup |

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
// Monitor FFI performance
import { performanceMonitor } from './utils/performance.js';

const result = await performanceMonitor();
console.log('FFI Init Time:', result.initTime, 'ms');
console.log('Inference Time:', result.inferenceTime, 'ms');
```

## Examples

See the `examples/` directory for complete examples:

- `bun-ffi-example.ts` - Comprehensive FFI usage demonstration

Run examples with:

```bash
# FFI example
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

### FFI Initialization Failed

```
Error: RKLLM FFI implementation is only available in Bun runtime
```

**Solution:** Make sure you're running with Bun:
```bash
bun run your-script.ts
# Bun is required for FFI support
```

### Library Path Issues

If you get library loading errors, ensure the RKLLM library is in the correct location and properly linked.

## Best Practices

1. **Use Bun runtime** - Required for FFI functionality
2. **Clean up resources** properly with `destroy()` method
3. **Handle errors gracefully** with try-catch blocks
4. **Monitor performance** with built-in utilities
5. **Use TypeScript** for better development experience

## Migration from Dual Backend

If you're upgrading from a version that supported both N-API and FFI:

1. **Remove backend selection parameters** - `init()` no longer takes a backend parameter
2. **Ensure Bun runtime** - Node.js is no longer supported
3. **Update deployment scripts** - Use Bun instead of Node.js
4. **Test FFI features** - Take advantage of advanced capabilities

The API remains largely the same, but you now get the full power of FFI without backend complexity.