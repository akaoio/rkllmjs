# 🚀 RKLLMJS

High-performance JavaScript bindings for Rockchip LLM Runtime - run local LLMs on Rockchip NPUs (RK3588, RK356x, etc.) with blazing speed using **Bun.FFI**.

> **⚡ Built for Bun** - Optimized for Bun's fast JavaScript runtime with native ES modules support
> 
> **🆕 Bun.FFI Exclusive** - Direct native library access without C++ compilation required!

[![NPM Version](https://img.shields.io/npm/v/rkllmjs.svg)](https://www.npmjs.com/package/rkllmjs)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Build Status](https://img.shields.io/github/workflow/status/akaoio/rkllmjs/CI)](https://github.com/akaoio/rkllmjs/actions)

## ✨ Features

- 🏎️ **High Performance**: Direct bindings to Rockchip's optimized LLM runtime
- ⚡ **Bun.FFI Exclusive**: Zero compilation setup with direct native calls
- 🔧 **Easy Integration**: Simple JavaScript/TypeScript API
- 🌊 **Streaming Support**: Real-time token generation with callbacks
- 🚀 **Bun Runtime**: Optimized exclusively for Bun's FFI system
- 🔄 **Async/Await**: Modern promise-based API
- 📱 **Multi-modal**: Support for text and image inputs
- 🎨 **LoRA Adapters**: Dynamic model fine-tuning support
- 🛡️ **Type Safe**: Full TypeScript definitions included
- 🧠 **Advanced Features**: KV cache management, chat templates, function calling

## 🎯 Supported Hardware

- **RK3588/RK3588S** - Flagship NPU with 6 TOPS
- **RK3576** - Mid-range NPU with 6 TOPS  
- **RK3562** - Entry-level NPU with 1 TOPS
- **RV1126** - Compact NPU for edge devices

## 📦 Installation

```bash
# npm
npm install rkllmjs

# yarn
yarn add rkllmjs

# pnpm
pnpm add rkllmjs

# bun
bun add rkllmjs
```

## 🚀 Bun.FFI Architecture

RKLLMJS is now exclusively built on Bun.FFI for maximum performance and simplicity:

### ✨ Bun.FFI Advantages:
- ⚡ **Zero Compilation**: No C++ build step required
- 🚀 **Direct Native Calls**: Minimal overhead between JavaScript and native code
- 🔧 **Instant Setup**: Install and run immediately
- 🧠 **Full API Access**: Complete access to all RKLLM runtime features
- 📊 **Better Debugging**: Direct access to native function calls
- 🎯 **Modern Architecture**: Built for Bun's high-performance runtime

### Prerequisites:
- **Bun 1.0+** runtime (required)
- **Rockchip NPU** (RK3588, RK356x, etc.)
- **ARM64 or ARMhf** architecture

## 🚀 Quick Start

### 1. Download a Model

First, download a model using the built-in model manager:

```bash
# Download a lightweight RKLLM model
bun tools.ts pull limcheekin/Qwen2.5-0.5B-Instruct-rk3588-1.1.4 Qwen2.5-0.5B-Instruct-rk3588-w8a8-opt-0-hybrid-ratio-0.0.rkllm

# Or list available models if you already have some
bun tools.ts list
```

### 2. Basic Inference

```javascript
import { RKLLM, RKLLMInputType } from 'rkllmjs';

async function main() {
  // Initialize RKLLM with FFI backend
  const llm = new RKLLM();
  await llm.init({
    modelPath: './models/your-model.rkllm',
    maxContextLen: 2048,
    maxNewTokens: 256,
    temperature: 0.7,
  });

  console.log(`Using ${llm.backendType} backend`); // Always 'ffi'

  // Run inference
  const result = await llm.run({
    inputType: RKLLMInputType.PROMPT,
    inputData: "Hello, how are you?",
  });

  console.log('Response:', result.text);
  
  // Cleanup
  await llm.destroy();
}

main().catch(console.error);
```

### 3. Advanced FFI Features

```javascript
import { RKLLM, RKLLMInputType } from 'rkllmjs';

async function main() {
  const llm = new RKLLM();
  
  // Initialize with FFI backend (no need to specify, it's automatic now)
  await llm.init({
    modelPath: './models/your-model.rkllm',
    maxContextLen: 2048,
    temperature: 0.7,
  });

  // Use advanced FFI features
  await llm.setChatTemplate(
    "You are a helpful assistant.",
    "User: ",
    "\nAssistant: "
  );

  // Get KV cache info
  const cacheSizes = await llm.getContextLength();
  console.log('Cache sizes:', cacheSizes);

  // Run inference
  const result = await llm.run({
    inputType: RKLLMInputType.PROMPT,
    inputData: "What is edge computing?",
  });

  console.log('Response:', result.text);
  await llm.destroy();
}

main().catch(console.error);
```

  // Run inference
  const result = await llm.run({
    inputType: RKLLMInputType.PROMPT,
    inputData: "Hello, how are you?",
  });

  console.log('Response:', result.text);
  
  // Cleanup
  await llm.destroy();
}

main();
```

const llm = new RKLLM();

await llm.init({
  modelPath: process.env.RKLLM_MODEL_PATH || (() => {
    throw new Error('Please set RKLLM_MODEL_PATH environment variable or use the model manager: bun run model:download <url>')
  })(),
  maxContextLen: 2048,
  maxNewTokens: 256,
  temperature: 0.7,
});

const result = await llm.run({
  inputType: RKLLMInputType.PROMPT,
  inputData: "Hello, how are you today?",
});

console.log(result.text);
await llm.destroy();
```

### 3. Streaming Inference

```javascript
import { RKLLM, RKLLMInputType, LLMCallState } from 'rkllmjs';
import { RKLLMModelManager } from './tools.js';

async function streamingExample() {
  const modelManager = new RKLLMModelManager();
  const modelPath = await modelManager.getFirstModelPath();
  
  const llm = new RKLLM();
  await llm.init({
    modelPath,
    maxContextLen: 2048,
    maxNewTokens: 256,
    temperature: 0.7,
    isAsync: true, // Enable streaming
  });

  const prompt = "Write a short story about AI:";
  let fullResponse = '';

  while (true) {
    const result = await llm.run({
      inputType: RKLLMInputType.PROMPT,
      inputData: prompt,
    });

    if (result.text) {
      process.stdout.write(result.text);
      fullResponse += result.text;
    }

    if (result.state === LLMCallState.FINISH) {
      break;
    }
  }

  await llm.destroy();
}

### Advanced Usage

```javascript
// Using environment variable for model path
const llm = new RKLLM();
await llm.init({
  modelPath: process.env.RKLLM_MODEL_PATH, // Set via: export RKLLM_MODEL_PATH="./models/your-model.rkllm"
  maxContextLen: 2048,
  maxNewTokens: 256,
  temperature: 0.7,
  isAsync: true,
});

// Streaming with callback
await llm.runStream(
  {
    inputType: RKLLMInputType.PROMPT,
    inputData: "Write a story about AI:",
  },
  {
    callback: (result) => {
      if (result.text) {
        process.stdout.write(result.text);
      }
      if (result.state === LLMCallState.FINISH) {
        console.log('\nGeneration complete!');
      }
    }
  }
);
```

### Multi-modal Input

```javascript
const result = await llm.run({
  inputType: RKLLMInputType.MULTIMODAL,
  inputData: "Describe this image:",
  // Image handling would be implemented based on model requirements
});
```

## 🔧 Configuration Options

### RKLLMParam

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `modelPath` | string | **required** | Path to the RKLLM model file |
| `maxContextLen` | number | 1024 | Maximum context window size |
| `maxNewTokens` | number | 256 | Maximum tokens to generate |
| `temperature` | number | 0.7 | Sampling temperature (0.0-2.0) |
| `topP` | number | 0.9 | Nucleus sampling threshold |
| `topK` | number | 50 | Top-K sampling parameter |
| `repeatPenalty` | number | 1.1 | Repetition penalty |
| `frequencyPenalty` | number | 0.0 | Frequency penalty |
| `presencePenalty` | number | 0.0 | Presence penalty |
| `isAsync` | boolean | false | Enable async mode for streaming |

### Extended Parameters

```javascript
await llm.init({
```javascript
// Extended configuration example
await llm.init({
  modelPath: process.env.RKLLM_MODEL_PATH, // Use environment variable
  extendParam: {
    enabledCpusNum: 4,
    enabledCpusMask: 0xFF, // Use all CPUs
    nBatch: 1,
    useCrossAttn: true,
    embedFlash: false,
  }
});
```

## 🎨 LoRA Adapter Support

```javascript
// Load a LoRA adapter
await llm.loadLoraAdapter({
  loraPath: './models/adapters/your-adapter.bin', // Use real path
  scale: 1.0
});

// Use the model with adapter
const result = await llm.run({
  inputType: RKLLMInputType.PROMPT,
  inputData: "Your prompt here",
});

// Unload adapter
await llm.unloadLoraAdapter();
```

## 📊 Performance Tips

1. **CPU Optimization**: Use `enabledCpusMask` to assign specific CPU cores
2. **Memory Management**: Call `clearContext()` periodically for long conversations
3. **Batch Processing**: Set `nBatch > 1` for multiple inputs
4. **Async Mode**: Enable `isAsync: true` for streaming applications

## 📁 Model Management

RKLLMJS includes a built-in model manager to download and manage models from HuggingFace:

### Download Models

```bash
# Download a specific RKLLM model
bun tools.ts pull limcheekin/Qwen2.5-0.5B-Instruct-rk3588-1.1.4 Qwen2.5-0.5B-Instruct-rk3588-w8a8-opt-0-hybrid-ratio-0.0.rkllm

# Interactive download (will prompt for repo and filename)
bun tools.ts pull

# List available models
bun tools.ts list

# Show model information
bun tools.ts info Qwen2.5-0.5B-Instruct-rk3588-1.1.4

# Remove a model
bun tools.ts remove Qwen2.5-0.5B-Instruct-rk3588-1.1.4

# Clean all models
bun tools.ts clean
```

### Popular RKLLM Models

```bash
# Lightweight models for testing
bun tools.ts pull limcheekin/Qwen2.5-0.5B-Instruct-rk3588-1.1.4 Qwen2.5-0.5B-Instruct-rk3588-w8a8-opt-0-hybrid-ratio-0.0.rkllm
bun tools.ts pull punchnox/Tinnyllama-1.1B-rk3588-rkllm-1.1.4 TinyLlama-1.1B-Chat-v1.0-rk3588-w8a8-opt-0-hybrid-ratio-0.5.rkllm

# More capable models (larger)
bun tools.ts pull akaoio/Qwen2.5-3B-Instruct-rk3588 Qwen2.5-3B-Instruct-rk3588-w8a8-opt-0.rkllm
bun tools.ts pull rockchip/Llama-2-7b-chat-rk3588 llama-2-7b-chat-rk3588-w8a8.rkllm
```

> **💡 Tip**: Start with the 0.5B or 1.1B models first to test your setup, then move to larger models as needed.

## 🏗️ Building from Source

### Prerequisites

- **Bun 1.0+** (required for FFI support)
- **Rockchip board** with NPU support (RK3588, RK356x, etc.)
- **ARM64 or ARMhf** architecture

### Build Steps

```bash
# Clone the repository
git clone https://github.com/akaoio/rkllmjs.git
cd rkllmjs

# Install dependencies (use --force to bypass platform checks if on x64)
bun install

# Build TypeScript
bun run build

# Run tests
bun test

# Run examples
bun run example
```

## 🧪 Examples

Check out the `/examples` directory for comprehensive usage examples:

- `basic.js` - Simple inference
- `streaming.js` - Real-time streaming  
- `chat.js` - Multi-turn conversations
- `bun-ffi-example.ts` - Complete Bun.FFI demonstration

### Running Examples

```bash
# Basic examples (work with both backends)
bun run examples/basic.js

# FFI-specific examples
bun run example:ffi
bun run example:comparison
```

## 📖 Documentation

- **[Universal Package Guide](SUMMARY.md)** - Comprehensive guide for packaging and multi-runtime considerations
- **[Bun.FFI Integration Guide](docs/bun-ffi-guide.md)** - Complete guide to using Bun.FFI
- **[API Reference](docs/api.md)** - Detailed API documentation
- **[Contributing](CONTRIBUTING.md)** - Development and contribution guide

### Key Documentation:

- ⚡ **[Performance Benchmarks](docs/bun-ffi-guide.md#performance-monitoring)** - Speed comparisons
- 🔧 **[Advanced Features](docs/bun-ffi-guide.md#advanced-ffi-features)** - KV cache, chat templates
- 🐛 **[Troubleshooting](docs/bun-ffi-guide.md#troubleshooting)** - Common issues and solutions