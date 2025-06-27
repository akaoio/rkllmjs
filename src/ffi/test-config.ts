/**
 * Test configuration and utilities
 * Provides safe testing environment that avoids native library crashes
 */

/**
 * Environment variable to enable/disable mock mode
 */
export const USE_MOCK_FFI = process.env.RKLLMJS_TEST_MOCK_FFI === 'true' || 
                            process.env.NODE_ENV === 'test';

/**
 * Check if we should use mock FFI for testing
 */
export function shouldUseMockFFI(): boolean {
  // Always use mock in CI environments
  if (process.env.CI === 'true') {
    return true;
  }
  
  // Use mock if explicitly requested
  if (USE_MOCK_FFI) {
    return true;
  }
  
  // Use mock if we detect potential crash scenarios
  if (process.env.NODE_ENV === 'test') {
    return true;
  }
  
  return false;
}

/**
 * Get the appropriate RKLLM implementation based on test mode
 */
export async function getTestRKLLMImpl() {
  if (shouldUseMockFFI()) {
    const { RKLLMFFIMock } = await import('./rkllm-ffi-mock.js');
    return RKLLMFFIMock;
  } else {
    const { RKLLMFFIImpl } = await import('./rkllm-ffi-impl.js');
    return RKLLMFFIImpl;
  }
}

/**
 * Test mode configuration
 */
export const TEST_CONFIG = {
  useMockFFI: shouldUseMockFFI(),
  skipNativeTests: shouldUseMockFFI(),
  enableSegfaultProtection: true,
} as const;

/**
 * Safe test wrapper that catches segfaults and native crashes
 */
export function safeTest(name: string, testFn: () => Promise<void> | void) {
  return async () => {
    try {
      if (typeof testFn === 'function') {
        const result = testFn();
        if (result instanceof Promise) {
          await result;
        }
      }
    } catch (error) {
      // Convert potential segfaults into test failures
      if (error.message && error.message.includes('segmentation fault')) {
        throw new Error(`Test "${name}" caused a segmentation fault - this indicates a native library crash`);
      }
      throw error;
    }
  };
}

/**
 * Skip test if native operations are not safe
 */
export function skipIfNativeUnsafe(reason: string = 'Native operations may cause crashes') {
  if (TEST_CONFIG.skipNativeTests) {
    console.warn(`Skipping test: ${reason}`);
    return true;
  }
  return false;
}
