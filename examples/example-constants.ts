/**
 * Example Configuration Constants
 * Centralized configuration values for examples and documentation
 */

// Example Model Repository Information
export const EXAMPLE_MODEL = {
  REPOSITORY: 'limcheekin/Qwen2.5-0.5B-Instruct-rk3588-1.1.4',
  FILENAME: 'Qwen2.5-0.5B-Instruct-rk3588-w8a8-opt-0-hybrid-ratio-0.0.rkllm',
  PATH: process.env.RKLLM_MODEL_PATH || './models/qwen-0.5b.rkllm'
} as const;

// Runtime-Specific Configurations
export const RUNTIME_CONFIGS = {
  BUN: {
    maxContextLen: 2048,
    maxNewTokens: 256,
    temperature: 0.7,
    topP: 0.9,
    topK: 50,
    extendParam: {
      enabledCpusNum: 8,
      enabledCpusMask: 0xFF,
      nBatch: 4,
      useCrossAttn: true
    }
  },
  NODE: {
    maxContextLen: 2048,
    maxNewTokens: 256,
    temperature: 0.7,
    topP: 0.9,
    topK: 50,
    extendParam: {
      enabledCpusNum: 4,
      enabledCpusMask: 0xF0,
      nBatch: 2,
      useCrossAttn: false
    }
  },
  DENO: {
    maxContextLen: 2048,
    maxNewTokens: 256,
    temperature: 0.7,
    topP: 0.9,
    topK: 50,
    extendParam: {
      enabledCpusNum: 4,
      enabledCpusMask: 0xF0,
      nBatch: 2,
      useCrossAttn: false
    }
  }
} as const;

// Common Configuration Templates
export const CONFIG_TEMPLATES = {
  CREATIVE: {
    temperature: 0.8,
    topP: 0.95,
    topK: 100
  },
  BALANCED: {
    temperature: 0.7,
    topP: 0.9,
    topK: 50
  },
  PRECISE: {
    temperature: 0.3,
    topP: 0.7,
    topK: 20
  },
  DETERMINISTIC: {
    temperature: 0.0,
    topP: 1.0,
    topK: 1
  }
} as const;

// Performance Optimization Settings
export const PERFORMANCE_SETTINGS = {
  HIGH_PERFORMANCE: {
    enabledCpusNum: 8,
    enabledCpusMask: 0xFF,
    nBatch: 8,
    useCrossAttn: true
  },
  BALANCED: {
    enabledCpusNum: 4,
    enabledCpusMask: 0xF0,
    nBatch: 4,
    useCrossAttn: true
  },
  LOW_RESOURCE: {
    enabledCpusNum: 2,
    enabledCpusMask: 0x03,
    nBatch: 1,
    useCrossAttn: false
  }
} as const;

// Example Prompts and Messages
export const EXAMPLE_PROMPTS = {
  GREETING: 'Hello! How can I help you today?',
  STORY: 'Tell me a short story about a brave robot.',
  QUESTION: 'What is the capital of France?',
  CREATIVE: 'Write a haiku about technology.',
  CONVERSATION: [
    'Hello, how are you doing today?',
    'Can you explain what RKLLM is?',
    'What are the benefits of running LLMs locally?'
  ]
} as const;

// Model Download Instructions
export const DOWNLOAD_INSTRUCTIONS = {
  COMMAND: `bun tools.ts pull ${EXAMPLE_MODEL.REPOSITORY} ${EXAMPLE_MODEL.FILENAME}`,
  HELP_TEXT: [
    '💡 Model Loading Help:',
    '  1. Download a model file:',
    `     ${`bun tools.ts pull ${EXAMPLE_MODEL.REPOSITORY} ${EXAMPLE_MODEL.FILENAME}`}`,
    '  2. Set model path:',
    '     export RKLLM_MODEL_PATH=./models/your-model.rkllm',
    '  3. Run this example again'
  ].join('\n'),
  LIBRARY_HELP: [
    '💡 Library Loading Help:',
    '  1. Ensure RKLLM libraries are in ./libs/ directory',
    '  2. Check that librkllmrt.so exists for your architecture',
    '  3. Verify file permissions'
  ].join('\n')
} as const;

// Environment Variable Names
export const ENV_VARS = {
  MODEL_PATH: 'RKLLM_MODEL_PATH',
  LIBRARY_PATH: 'RKLLM_LIBRARY_PATH',
  CPU_MASK: 'RKLLM_CPU_MASK',
  BATCH_SIZE: 'RKLLM_BATCH_SIZE'
} as const;