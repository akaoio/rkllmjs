/**
 * @module testing
 * @purpose Comprehensive testing infrastructure and utilities for RKLLM JavaScript bindings
 * @description Provides structured testing framework with logging, hardware validation,
 *              native binding testing, and production-ready test utilities. Supports
 *              both unit testing and integration testing for RKLLM components.
 * @author RKLLMJS Team
 * @version 1.0.0
 */

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
  canRunProductionTests,
  skipIfRequirementsNotMet,
  PRODUCTION_TEST_CONFIG,
  PRODUCTION_TEST_PROMPTS,
  MEMORY_OPTIMIZED_CONFIG,
  forceMemoryCleanup,
} from './test-utils.js';

// Import for factory function
import { TestLogger } from './test-logger.js';

// Convenience factory functions
export const createTestLogger = (testName: string) => new TestLogger(testName);

// Default export for compatibility
export { default as testUtils } from './test-utils.js';
