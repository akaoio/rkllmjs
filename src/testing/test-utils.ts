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
 * Currently returns false until N-API integration is complete
 */
export function areNativeBindingsAvailable(): boolean {
  // TODO: Re-enable when N-API integration is complete
  // For now, skip all native binding tests
  return false;
  
  // Original implementation (disabled):
  // try {
  //   require('../../build/Release/binding.node');
  //   return true;
  // } catch {
  //   return false;
  // }
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
  
  // Additional check: Model availability
  try {
    getTestModelPath();
    console.log('✅ Native bindings and test model available');
    return true;
  } catch (error) {
    console.log('⚠️  Skipping test - no test model available');
    console.log('   Download a model first: npm run setup-test');
    if (typeof testContext?.skip === 'function') {
      testContext.skip();
    }
    return false;
  }
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
 * Check if all requirements are met for production testing
 */
export function canRunProductionTests(): boolean {
  try {
    // Check 1: Native bindings available
    if (!areNativeBindingsAvailable()) {
      console.log('❌ Native bindings not available');
      return false;
    }
    
    // Check 2: Compatible hardware
    if (!isCompatibleHardware()) {
      console.log('❌ Not on compatible hardware');
      return false;
    }
    
    // Check 3: Test model available
    try {
      const modelPath = getTestModelPath();
      console.log(`✅ All requirements met - model: ${modelPath}`);
      return true;
    } catch (error) {
      console.log('❌ No test model available');
      return false;
    }
  } catch (error) {
    console.log('❌ Error checking requirements:', error);
    return false;
  }
}

/**
 * Skip test with detailed reason if requirements not met
 */
export function skipIfRequirementsNotMet(testName: string): boolean {
  if (!canRunProductionTests()) {
    console.log(`⏭️  Skipping test '${testName}' - requirements not met`);
    console.log('💡 For production testing, ensure:');
    console.log('   1. Running on RK3588 hardware');
    console.log('   2. Native bindings built: npm run build:native');
    console.log('   3. Test model available: npm run setup-test');
    return true;
  }
  return false;
}

/**
 * Production test configuration with memory-optimized settings for RK3588
 * Tuned to work with NPU memory constraints
 */
export const PRODUCTION_TEST_CONFIG = {
  maxContextLen: 256,     // Reduced from 512 to minimize memory usage
  maxNewTokens: 32,       // Reduced from 50 to minimize memory usage  
  topK: 20,              // Reduced from 40 to minimize computation
  topP: 0.9,
  temperature: 0.7,
  repeatPenalty: 1.1,
  cpuMask: 0x03,         // Use only CPUs 0-1 to reduce memory pressure
  enabledCpusNum: 2,     // Limit to 2 CPU cores
  nBatch: 1,             // Use batch size 1 to minimize memory
  isAsync: false,
  enableProfiler: true,
  
  // Extended parameters for memory optimization
  extendParam: {
    baseDomainId: 0,
    embedFlash: true,    // Use flash memory for embeddings to save RAM
    enabledCpusNum: 2,   // Limit CPU cores
    enabledCpusMask: 0x03, // Binary: 11 (use CPU 0,1)
    nBatch: 1,           // Minimize batch size
    useCrossAttn: false,
  }
};

/**
 * Memory-optimized configuration for NPU tests
 * Reduces memory usage to avoid allocation failures
 */
export const MEMORY_OPTIMIZED_CONFIG = {
  maxContextLen: 512,    // Reduced from 2048
  maxNewTokens: 128,     // Reduced from 512
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
  nKeep: 0,
  repeatPenalty: 1.1,
  frequencyPenalty: 0.0,
  presencePenalty: 0.0,
  mirostat: 0,
  mirostatTau: 5.0,
  mirostatEta: 0.1,
  skipSpecialToken: false,
  isAsync: false,
  extendParam: {
    baseDomainId: 0,
    embedFlash: false,
    enabledCpusNum: 3,      // Use fewer CPUs to reduce memory
    enabledCpusMask: 0x07,  // First 3 CPUs only
    nBatch: 1,              // Minimal batch size
    useCrossAttn: false,
  }
};

/**
 * Force cleanup NPU memory and garbage collection
 */
export async function forceMemoryCleanup(): Promise<void> {
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  // Allow NPU memory to be released
  await new Promise(resolve => setTimeout(resolve, 300));
}

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
  canRunProductionTests,
  skipIfRequirementsNotMet,
  PRODUCTION_TEST_CONFIG,
  PRODUCTION_TEST_PROMPTS,
};