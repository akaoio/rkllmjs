# 🚀 RKLLMJS

High-performance JavaScript bindings for Rockchip LLM Runtime - run local LLMs on Rockchip NPUs (RK3588, RK356x, etc.) with blazing speed using **Bun**.

> **⚡ Built for Bun** - Optimized for Bun's fast JavaScript runtime with native ES modules support

[![NPM Version](https://img.shields.io/npm/v/rkllmjs.svg)](https://www.npmjs.com/package/rkllmjs)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Build Status](https://img.shields.io/github/workflow/status/akaoio/rkllmjs/CI)](https://github.com/akaoio/rkllmjs/actions)

## ✨ Features

- 🏎️ **High Performance**: Direct bindings to Rockchip's optimized LLM runtime
- 🔧 **Easy Integration**: Simple JavaScript/TypeScript API
- 🌊 **Streaming Support**: Real-time token generation with callbacks
- 🎯 **Multiple Runtimes**: Works with Bun, Node.js, and Deno
- 🔄 **Async/Await**: Modern promise-based API
- 📱 **Multi-modal**: Support for text and image inputs
- 🎨 **LoRA Adapters**: Dynamic model fine-tuning support
- 🛡️ **Type Safe**: Full TypeScript definitions included

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

## 🚀 Quick Start

### 1. Download a Model

First, download a model using the built-in model manager:

```bash
# Download a small conversational model
bun tools.ts pull microsoft/DialoGPT-small pytorch_model.bin

# Or list available models if you already have some
bun tools.ts list
```

### 2. Basic Inference

```javascript
import { RKLLM, RKLLMInputType } from 'rkllmjs';
import { RKLLMModelManager } from './tools.js';

async function main() {
  // Get the first available model
  const modelManager = new RKLLMModelManager();
  const modelPath = await modelManager.getFirstModelPath();
  
  if (!modelPath) {
    console.log('No models found! Download one first with: bun tools.ts pull');
    return;
  }

  // Initialize RKLLM
  const llm = new RKLLM();
  await llm.init({
    modelPath,
    maxContextLen: 512,
    maxNewTokens: 128,
  });

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
# Download a specific model
bun tools.ts pull microsoft/DialoGPT-small pytorch_model.bin

# Interactive download (will prompt for repo and filename)
bun tools.ts pull

# List available models
bun tools.ts list

# Show model information
bun tools.ts info DialoGPT-small

# Remove a model
bun tools.ts remove DialoGPT-small

# Clean all models
bun tools.ts clean
```

### Popular Models for RKLLM

```bash
# Small conversational models
bun tools.ts pull microsoft/DialoGPT-small pytorch_model.bin
bun tools.ts pull microsoft/DialoGPT-medium pytorch_model.bin

# General purpose models
bun tools.ts pull gpt2 pytorch_model.bin
bun tools.ts pull distilgpt2 pytorch_model.bin
```

> **💡 Tip**: Start with smaller models first to test your setup, then move to larger models as needed.

## 🏗️ Building from Source

### Prerequisites

- Node.js 14+ or Bun 1.0+
- Python 3.8+ (for node-gyp)
- GCC/G++ compiler
- Rockchip board with NPU support

### Build Steps

```bash
# Clone the repository
git clone https://github.com/akaoio/rkllmjs.git
cd rkllmjs

# Install dependencies
npm install

# Build native addon and TypeScript
npm run build

# Run tests
npm test

# Run examples
npm run example
```

## 🧪 Examples

Check out the `/examples` directory for comprehensive usage examples:

- `basic.js` - Simple inference
- `streaming.js` - Real-time streaming
- `chat.js` - Multi-turn conversations
- `benchmark.js` - Performance testing

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Rockchip RKLLM SDK Documentation](https://github.com/rockchip-linux/rknn-llm)
- [NPU Performance Guide](docs/performance.md)
- [Model Conversion Tutorial](docs/model-conversion.md)
- [API Reference](docs/api.md)

## 🆘 Support

- 📧 Email: support@yourproject.com
- 💬 Discord: [Join our community](https://discord.gg/yourserver)
- 🐛 Issues: [GitHub Issues](https://github.com/akaoio/rkllmjs/issues)

---

Made with ❤️ for the Rockchip NPU community