/**
 * Test Constants - Centralized configuration values for all tests
 * This file eliminates hardcoded values throughout the test suite
 */

// Test Model Paths
export const TEST_MODEL_PATHS = {
  // Non-existent model for testing error handling
  NONEXISTENT: './test-model.rkllm',
  // Another non-existent model for different test scenarios
  NONEXISTENT_ALT: './non-existent-model.rkllm',
  // Wrong file type for testing validation
  INVALID_FORMAT: './README.md',
  // Empty path for testing edge cases
  EMPTY: '',
  // Environment variable or fallback
  FROM_ENV: process.env.TEST_MODEL_PATH || './test-fixtures/test-model.rkllm'
} as const;

// Context Length Configuration
export const CONTEXT_LENGTHS = {
  SMALL: 1024,
  MEDIUM: 2048,
  LARGE: 4096,
  INVALID: -1
} as const;

// Generation Parameters
export const GENERATION_PARAMS = {
  MAX_NEW_TOKENS: {
    SMALL: 256,
    MEDIUM: 512,
    LARGE: 1024
  },
  TEMPERATURE: {
    CREATIVE: 0.7,
    BALANCED: 0.5,
    CONSERVATIVE: 0.3,
    DETERMINISTIC: 0.0
  },
  TOP_P: {
    DIVERSE: 0.9,
    BALANCED: 0.7,
    FOCUSED: 0.5
  },
  TOP_K: {
    DIVERSE: 50,
    BALANCED: 40,
    FOCUSED: 20
  }
} as const;

// Hardware Configuration
export const CPU_CONFIG = {
  MASKS: {
    ALL_CORES: 0xFF,
    HALF_CORES: 0xF0,
    SINGLE_CORE: 0x01
  },
  ENABLED_CPUS: {
    SINGLE: 1,
    QUAD: 4,
    OCTA: 8
  },
  BATCH_SIZES: {
    SMALL: 1,
    MEDIUM: 4,
    LARGE: 8
  }
} as const;

// Test Timeouts (in milliseconds)
export const TIMEOUTS = {
  QUICK: 5000,
  NORMAL: 10000,
  SLOW: 30000,
  VERY_SLOW: 60000
} as const;

// Error Messages for Testing
export const EXPECTED_ERRORS = {
  NOT_INITIALIZED: 'not initialized',
  ALREADY_INITIALIZED: 'already initialized',
  INVALID_MODEL: 'model',
  INVALID_LIBRARY: 'library',
  FFI_ERROR: 'FFI'
} as const;

// Test Input Data
export const TEST_INPUTS = {
  SIMPLE_PROMPT: 'Hello, how are you?',
  LONG_PROMPT: 'This is a longer prompt that should test the model\'s ability to handle more complex input and generate appropriate responses.',
  EMPTY_PROMPT: '',
  UNICODE_PROMPT: '你好，世界！🌍'
} as const;

// Default Test Configuration
export const DEFAULT_TEST_CONFIG = {
  modelPath: TEST_MODEL_PATHS.NONEXISTENT,
  maxContextLen: CONTEXT_LENGTHS.SMALL,
  maxNewTokens: GENERATION_PARAMS.MAX_NEW_TOKENS.SMALL,
  temperature: GENERATION_PARAMS.TEMPERATURE.BALANCED,
  topP: GENERATION_PARAMS.TOP_P.BALANCED,
  topK: GENERATION_PARAMS.TOP_K.BALANCED
} as const;

// Performance Test Configuration
export const PERFORMANCE_CONFIG = {
  modelPath: TEST_MODEL_PATHS.FROM_ENV,
  maxContextLen: CONTEXT_LENGTHS.MEDIUM,
  maxNewTokens: GENERATION_PARAMS.MAX_NEW_TOKENS.MEDIUM,
  temperature: GENERATION_PARAMS.TEMPERATURE.DETERMINISTIC,
  topP: GENERATION_PARAMS.TOP_P.FOCUSED,
  topK: GENERATION_PARAMS.TOP_K.FOCUSED,
  extendParam: {
    enabledCpusNum: CPU_CONFIG.ENABLED_CPUS.OCTA,
    enabledCpusMask: CPU_CONFIG.MASKS.ALL_CORES,
    nBatch: CPU_CONFIG.BATCH_SIZES.MEDIUM,
    useCrossAttn: true
  }
} as const;

// Example Model Repository (for documentation)
export const EXAMPLE_MODEL_REPO = 'limcheekin/Qwen2.5-0.5B-Instruct-rk3588-1.1.4';
export const EXAMPLE_MODEL_FILE = 'Qwen2.5-0.5B-Instruct-rk3588-w8a8-opt-0-hybrid-ratio-0.0.rkllm';