/**
 * Production Test Utilities for RKLLM Testing
 * Consolidated utilities for real hardware and native bindings testing
 */

import fs from 'fs';
import os from 'os';
import { createRequire } from 'module';

// Create require function for ES modules
const require = createRequire(import.meta.url);

/**
 * Check if native RKLLM bindings are available
 */
export function areNativeBindingsAvailable(): boolean {
  try {
    // Use createRequire for native bindings in ES modules
    require('../../build/Release/binding.node');
    return true;
  } catch {
    return false;
  }
}

/**
 * Skip test if native bindings are not available
 */
export function requireNativeBindings(testContext?: any): boolean {
  if (!areNativeBindingsAvailable()) {
    console.log('⚠️  Skipping test - native RKLLM bindings not available');
    console.log('   Build native bindings first: npm run build:native');
    // Use test skip mechanism (varies by framework)
    if (typeof testContext?.skip === 'function') {
      testContext.skip();
    } else {
      console.log('   Skipping current test');
    }
    return false;
  }
  return true;
}

/**
 * Get a valid test model path (requires actual model file)
 */
export function getTestModelPath(): string {
  // First check environment variable
  const envModelPath = process.env.RKLLM_TEST_MODEL_PATH;
  if (envModelPath && fs.existsSync(envModelPath)) {
    return envModelPath;
  }
  
  // Auto-discover models in the models directory
  const modelsDir = './models';
  if (fs.existsSync(modelsDir)) {
    const findModelFiles = (dir: string): string[] => {
      const files: string[] = [];
      const items = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = `${dir}/${item.name}`;
        if (item.isDirectory()) {
          files.push(...findModelFiles(fullPath));
        } else if (item.name.endsWith('.rkllm')) {
          files.push(fullPath);
        }
      }
      return files;
    };
    
    const modelFiles = findModelFiles(modelsDir);
    if (modelFiles.length > 0) {
      // Use the first available model
      const modelPath = modelFiles[0]!; // Non-null assertion since we checked length > 0
      console.log(`📁 Using test model: ${modelPath}`);
      return modelPath;
    }
  }
  
  // Fallback - throw error with helpful message
  throw new Error(
    `Test model not found!\n` +
    `Tried:\n` +
    `  1. Environment variable RKLLM_TEST_MODEL_PATH\n` +
    `  2. Auto-discovery in ./models directory\n\n` +
    `Solutions:\n` +
    `  1. Set RKLLM_TEST_MODEL_PATH to point to a valid RKLLM model file\n` +
    `  2. Download a model using: npm run cli pull dulimov/Qwen2.5-VL-7B-Instruct-rk3588-1.2.1 Qwen2.5-VL-7B-Instruct-rk3588-w8a8-opt-1-hybrid-ratio-0.5.rkllm`
  );
}

/**
 * Check if we're running on compatible hardware (RK3588 with NPU)
 */
export function isCompatibleHardware(): boolean {
  // Check if we're on ARM64 Linux (RK3588)
  const arch = os.arch();
  const platform = os.platform();
  
  if (platform !== 'linux' || arch !== 'arm64') {
    console.log(`⚠️  Not on compatible hardware: ${platform}/${arch} (expected linux/arm64)`);
    return false;
  }
  
  // Check if NPU is available (basic check)
  if (!fs.existsSync('/dev/dri') && !fs.existsSync('/sys/class/devfreq')) {
    console.log('⚠️  NPU device nodes not found - may not be on RK3588');
    return false;
  }
  
  return true;
}

/**
 * Production test configuration with real settings
 */
export const PRODUCTION_TEST_CONFIG = {
  maxContextLen: 512,
  maxNewTokens: 50,
  topK: 40,
  topP: 0.9,
  temperature: 0.7,
  repeatPenalty: 1.1,
  cpuMask: 0x0F, // Use CPUs 0-3
  isAsync: false,
  enableProfiler: true,
};

/**
 * Real test prompts for production testing
 */
export const PRODUCTION_TEST_PROMPTS = [
  'What is the capital of France?',
  'Explain quantum computing in simple terms.',
  'Write a short poem about technology.',
  'How do neural networks work?',
];

export default {
  areNativeBindingsAvailable,
  requireNativeBindings,
  getTestModelPath,
  isCompatibleHardware,
  PRODUCTION_TEST_CONFIG,
  PRODUCTION_TEST_PROMPTS,
};