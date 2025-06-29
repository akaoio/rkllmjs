/**
 * Unified Testing Module for RKLLMJS
 * 
 * Provides a comprehensive testing infrastructure with:
 * - Structured logging for test debugging and audit
 * - Production utilities for real hardware testing
 * - Hardware and native binding validation
 * - Test configuration and data management
 */

// Re-export all testing functionality from a single entry point
export { TestLogger, type TestLogEntry } from './test-logger.js';
export { 
  areNativeBindingsAvailable,
  requireNativeBindings,
  getTestModelPath,
  isCompatibleHardware,
  PRODUCTION_TEST_CONFIG,
  PRODUCTION_TEST_PROMPTS
} from './test-utils.js';

// Import for factory function
import { TestLogger } from './test-logger.js';

// Convenience factory functions
export const createTestLogger = (testName: string) => new TestLogger(testName);

// Default export for compatibility
export { default as testUtils } from './test-utils.js';