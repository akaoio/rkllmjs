# 🚀 RKLLMJS

High-performance JavaScript bindings for Rockchip LLM Runtime - run local LLMs on Rockchip NPUs (RK3588, RK356x, etc.) with **universal multi-runtime support**.

> **🌍 Universal Runtime Support** - Works seamlessly across Bun, Node.js, and Deno
> 
> **⚡ Zero Compilation** - Direct FFI access without C++ compilation required!
> 
> **🛡️ Production Ready** - Comprehensive test suite with 64 passing tests and safe development environment

[![NPM Version](https://img.shields.io/npm/v/rkllmjs.svg)](https://www.npmjs.com/package/rkllmjs)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-64%20passing-brightgreen)](tests/)
[![Build Status](https://img.shields.io/github/workflow/status/akaoio/rkllmjs/CI)](https://github.com/akaoio/rkllmjs/actions)

## ✨ Features

- 🏎️ **High Performance**: Direct bindings to Rockchip's optimized LLM runtime
- 🌍 **Universal Runtime**: Supports Bun, Node.js, and Deno with automatic adapter selection
- ⚡ **Zero Compilation**: FFI-only architecture with no build steps
- 🔧 **Easy Integration**: Same JavaScript/TypeScript API across all runtimes
- 🌊 **Streaming Support**: Real-time token generation with callbacks
- 🚀 **Optimal Performance**: Bun gets native FFI, Node.js uses koffi, Deno uses native FFI
- 🔄 **Async/Await**: Modern promise-based API
- 📱 **Multi-modal**: Support for text and image inputs
- 🎨 **LoRA Adapters**: Dynamic model fine-tuning support
- 🛡️ **Type Safe**: Full TypeScript definitions included
- 🧠 **Advanced Features**: KV cache management, chat templates, function calling
- 🧪 **Production Ready**: Comprehensive test suite (64 tests) with safe development environment
- 🔧 **Developer Friendly**: Built-in model management tools and safe testing infrastructure

## 🎯 Supported Hardware

- **RK3588/RK3588S** - Flagship NPU with 6 TOPS
- **RK3576** - Mid-range NPU with 6 TOPS  
- **RK3562** - Entry-level NPU with 1 TOPS
- **RV1126** - Compact NPU for edge devices

## 📦 Installation

### Quick Install (All Runtimes)

```bash
# npm
npm install rkllmjs

# yarn  
yarn add rkllmjs

# pnpm
pnpm add rkllmjs

# bun (recommended)
bun add rkllmjs
```

### Runtime-Specific Setup

#### Bun (Recommended - Best Performance)
```bash
bun add rkllmjs
# Ready to use! No additional setup needed
```

#### Node.js
```bash
npm install rkllmjs koffi
# OR alternatively: npm install rkllmjs ffi-napi ref-napi
```

#### Deno
```bash
# No installation needed, just run with FFI permissions:
deno run --allow-ffi --allow-read your-app.ts
```

## 🚀 Universal FFI Architecture

RKLLMJS uses a universal FFI architecture that automatically selects the best implementation for your runtime:

| Runtime | FFI Implementation | Performance | Setup |
|---------|-------------------|-------------|--------|
| **Bun** | Native `Bun.dlopen` | **Optimal** | Zero config |
| **Node.js** | `koffi` or `ffi-napi` | High | Install FFI deps |
| **Deno** | Native `Deno.dlopen` | High | Enable permissions |

### ✨ Universal Advantages:
- ⚡ **Zero Compilation**: No C++ build step required
- 🌍 **Runtime Agnostic**: Same code works everywhere
- 🚀 **Optimal Performance**: Each runtime uses its best FFI implementation  
- 🔧 **Instant Setup**: Install and run immediately
- 🧠 **Full API Access**: Complete access to all RKLLM runtime features
- 📊 **Better Debugging**: Direct access to native function calls
- 🎯 **Modern Architecture**: Built for high-performance runtimes

### Prerequisites:
- **JavaScript Runtime**: Bun 1.0+ (recommended), Node.js 16+, or Deno 1.25+
- **Rockchip NPU** (RK3588, RK356x, etc.)
- **ARM64 or ARMhf** architecture

## 🚀 Quick Start

### 1. Check Your Runtime

```bash
# Test runtime compatibility and run comprehensive test suite
npm test

# Or run tests safely (recommended for development)
NODE_ENV=test RKLLMJS_TEST_MODE=true bun test

# Run specific integration tests:
bun test tests/integration/runtime.test.ts    # Runtime compatibility
bun test tests/integration/full-pipeline.test.ts  # Complete workflow
bun test tests/unit/                          # Unit tests
```

**✅ All 64 tests should pass without segfaults or crashes!**

### 2. Download a Model

First, download a model using the built-in model manager:

```bash
# Download a lightweight RKLLM model
bun tools.ts pull limcheekin/Qwen2.5-0.5B-Instruct-rk3588-1.1.4 Qwen2.5-0.5B-Instruct-rk3588-w8a8-opt-0-hybrid-ratio-0.0.rkllm

# List available models (recursively scans nested directories)
bun tools.ts list

# Get model info (works with or without .rkllm extension)
bun tools.ts info Qwen2.5-0.5B-Instruct-rk3588-1.1.4
bun tools.ts info Qwen2.5-0.5B-Instruct-rk3588-1.1.4.rkllm  # Both work

# Remove models (also supports both formats)
bun tools.ts remove Qwen2.5-0.5B-Instruct-rk3588-1.1.4

# Clean all models
bun tools.ts clean
```

### 3. Basic Inference (Universal)

```javascript
import { RKLLM, RKLLMInputType, detectRuntime } from 'rkllmjs';

async function main() {
  // Check runtime info
  const runtime = detectRuntime();
  console.log(`Running on ${runtime.name} with FFI: ${runtime.ffiSupported}`);

  // Initialize RKLLM - works on all runtimes
  const llm = new RKLLM();
  await llm.init({
    modelPath: './models/your-model.rkllm',
    maxContextLen: 2048,
    maxNewTokens: 256,
    temperature: 0.7,
  });

  console.log(`Using ${llm.backendType} backend on ${llm.runtimeName}`);

  // Run inference - same API everywhere

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
  
  // Initialize with automatic backend selection
  await llm.init({
    modelPath: './models/your-model.rkllm',
    maxContextLen: 2048,
    temperature: 0.7,
  });

  // Check which backend is being used
  console.log(`Using ${llm.backendType} backend on ${llm.runtimeName}`);

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

### 4. Streaming Inference

```javascript
import { RKLLM, RKLLMInputType, LLMCallState } from 'rkllmjs';

async function streamingExample() {
  const llm = new RKLLM();
  await llm.init({
    modelPath: './models/your-model.rkllm',
    maxContextLen: 2048,
    maxNewTokens: 256,
    temperature: 0.7,
    isAsync: true, // Enable streaming
  });

  const prompt = "Write a short story about AI:";
  let fullResponse = '';

  // Stream tokens in real-time
  await llm.runStream(
    {
      inputType: RKLLMInputType.PROMPT,
      inputData: prompt,
    },
    {
      callback: (result) => {
        if (result.text) {
          process.stdout.write(result.text);
          fullResponse += result.text;
        }
        if (result.state === LLMCallState.FINISH) {
          console.log('\n✅ Generation complete!');
        }
      }
    }
  );

  await llm.destroy();
}

streamingExample().catch(console.error);
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

RKLLMJS includes a powerful built-in model manager with enhanced features:

### Download Models

```bash
# Download a specific RKLLM model
bun tools.ts pull limcheekin/Qwen2.5-0.5B-Instruct-rk3588-1.1.4 Qwen2.5-0.5B-Instruct-rk3588-w8a8-opt-0-hybrid-ratio-0.0.rkllm

# Interactive download (will prompt for repo and filename)
bun tools.ts pull

# List available models (recursively scans nested directories)
bun tools.ts list

# Show model information (supports both formats)
bun tools.ts info Qwen2.5-0.5B-Instruct-rk3588-1.1.4          # Without extension
bun tools.ts info Qwen2.5-0.5B-Instruct-rk3588-1.1.4.rkllm   # With extension

# Remove a model (flexible naming)
bun tools.ts remove Qwen2.5-0.5B-Instruct-rk3588-1.1.4       # Auto-detects .rkllm
bun tools.ts remove some-nested-model                         # Works with nested models

# Clean all models
bun tools.ts clean
```

### Enhanced Features

- 🗂️ **Recursive Directory Scanning**: Automatically finds `.rkllm` files in nested directories
- 🏷️ **Flexible Model Naming**: Commands work with or without `.rkllm` extension
- 📋 **Standardized CLI**: Consistent `<model>` parameter naming across all commands
- ✅ **Robust Validation**: Enhanced error handling and model validation
- 🧹 **Clean Organization**: Better model file management and organization

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

## 🏗️ Development & Testing

### Prerequisites

- **Bun 1.0+** (recommended for best performance)
- **Rockchip board** with NPU support (RK3588, RK356x, etc.)
- **ARM64 or ARMhf** architecture

### Build Steps

```bash
# Clone the repository
git clone https://github.com/akaoio/rkllmjs.git
cd rkllmjs

# Install dependencies
bun install

# Build TypeScript
bun run build

# Run comprehensive test suite (64 tests)
bun test

# Run tests safely (recommended for development)
NODE_ENV=test RKLLMJS_TEST_MODE=true bun test

# Run specific test categories
bun test tests/unit/                    # Unit tests
bun test tests/integration/             # Integration tests
bun test tests/integration/full-pipeline.test.ts  # Complete workflow tests

# Run examples
bun run example
```

### Test Architecture

RKLLMJS features a comprehensive test suite with **64 passing tests** and a safe development environment:

- 🛡️ **Safe Testing**: Automatic mock mode prevents segfaults and native crashes
- 🧪 **Comprehensive Coverage**: Unit, integration, and end-to-end tests
- 🔄 **Multi-Runtime Tests**: Validates functionality across Bun, Node.js, and Deno
- ⚡ **Fast Execution**: Tests complete in ~300ms with mocking enabled
- 🎯 **Reliable**: All tests consistently pass across different environments

### Test Environment

```bash
# Set test environment (automatically prevents native crashes)
export NODE_ENV=test
export RKLLMJS_TEST_MODE=true

# Run tests safely
bun test

# Or run with inline environment variables
NODE_ENV=test RKLLMJS_TEST_MODE=true bun test
```

The test environment automatically:
- ✅ Prevents FFI loading that could cause segfaults
- ✅ Uses safe mock implementations
- ✅ Validates API compatibility without native dependencies
- ✅ Tests all functionality through controlled interfaces

## 🧪 Examples

Check out the `/examples` directory for comprehensive usage examples:

- `basic.js` - Simple inference
- `streaming.js` - Real-time streaming  
- `chat.js` - Multi-turn conversations
- `bun-ffi-example.ts` - Complete Bun.FFI demonstration
- `universal.ts` - Cross-runtime compatibility examples

### Running Examples

```bash
# Basic examples (work with all runtimes)
bun run examples/basic.js
bun run examples/streaming.js

# Universal runtime example
bun run examples/universal.ts

# FFI-specific examples
bun run example:ffi
bun run example:comparison

# Test examples with different runtimes
bun examples/universal.ts        # Bun
node examples/universal.ts       # Node.js  
deno run --allow-ffi examples/universal.ts  # Deno
```

## � Troubleshooting

### Common Issues

**Tests failing with segfaults?**
```bash
# Always run tests in safe mode
NODE_ENV=test RKLLMJS_TEST_MODE=true bun test
```

**Model not found errors?**
```bash
# Use the model manager to download models
bun tools.ts list                    # Check available models
bun tools.ts pull <repo> <filename>  # Download specific model
```

**FFI not available?**
```bash
# Check runtime compatibility
bun test tests/integration/runtime.test.ts
```

**Performance issues?**
- Use Bun for optimal performance (native FFI)
- Enable async mode for streaming: `isAsync: true`
- Tune CPU settings with `enabledCpusMask`

### Development Tips

- 🧪 Always use test mode during development
- 📊 Monitor test output for warnings and performance metrics
- 🔍 Use integration tests to validate runtime compatibility
- 🛡️ The safe test environment prevents crashes during development

## 📖 Documentation

- **[API Reference](docs/api.md)** - Detailed API documentation
- **[Multi-Runtime Guide](docs/multi-runtime-guide.md)** - Cross-runtime compatibility guide
- **[Performance Guide](docs/performance.md)** - Optimization tips and benchmarks
- **[Bun.FFI Integration Guide](docs/bun-ffi-guide.md)** - Complete guide to using Bun.FFI
- **[Contributing](CONTRIBUTING.md)** - Development and contribution guide
- **[Testing Guide](docs/testing.md)** - Safe testing practices and guidelines

### Key Documentation:

- ⚡ **[Performance Benchmarks](docs/performance.md)** - Speed comparisons across runtimes
- 🔧 **[Advanced Features](docs/bun-ffi-guide.md#advanced-ffi-features)** - KV cache, chat templates, LoRA adapters
- 🧪 **[Testing Best Practices](docs/testing.md)** - Safe development and testing guidelines
- 🐛 **[Troubleshooting](docs/bun-ffi-guide.md#troubleshooting)** - Common issues and solutions
- 🌍 **[Multi-Runtime Support](docs/multi-runtime-guide.md)** - Cross-platform development

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork and clone the repository
2. Install dependencies: `bun install`
3. Set up test environment: `export NODE_ENV=test RKLLMJS_TEST_MODE=true`
4. Run tests: `bun test` (should see 64 passing tests)
5. Build: `bun run build`
6. Submit a pull request

### Testing Guidelines

- Always run tests in safe mode during development
- Ensure all 64 tests pass before submitting PRs
- Add tests for new features
- Follow the existing test patterns and safety practices

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Rockchip** for the RKLLM Runtime and NPU technology
- **Bun** team for excellent FFI support and performance
- **Community contributors** for testing, feedback, and improvements
- **Model creators** on HuggingFace for providing RKLLM-compatible models

---

**Made with ❤️ for the edge AI community**