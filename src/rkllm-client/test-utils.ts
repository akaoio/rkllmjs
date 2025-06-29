/**
 * Test utilities for production RKLLM tests
 * No mocks - only real native bindings
 */

/**
 * Check if native RKLLM bindings are available
 */
export function areNativeBindingsAvailable(): boolean {
  try {
    require('../../build/Release/binding.node');
    return true;
  } catch {
    return false;
  }
}

/**
 * Skip test if native bindings are not available
 */
export function requireNativeBindings(testContext: any): boolean {
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
  // In production, this should point to an actual RKLLM model file
  const modelPath = process.env.RKLLM_TEST_MODEL_PATH || '/path/to/test-model.rkllm';
  
  // Check if model file exists
  const fs = require('fs');
  if (!fs.existsSync(modelPath)) {
    throw new Error(
      `Test model not found at: ${modelPath}\n` +
      'Set RKLLM_TEST_MODEL_PATH environment variable to point to a valid RKLLM model file.'
    );
  }
  
  return modelPath;
}

/**
 * Check if we're running on compatible hardware (RK3588 with NPU)
 */
export function isCompatibleHardware(): boolean {
  // Check if we're on ARM64 Linux (RK3588)
  const os = require('os');
  const arch = os.arch();
  const platform = os.platform();
  
  if (platform !== 'linux' || arch !== 'arm64') {
    console.log(`⚠️  Not on compatible hardware: ${platform}/${arch} (expected linux/arm64)`);
    return false;
  }
  
  // Check if NPU is available (basic check)
  const fs = require('fs');
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