/**
 * Unit tests for CLI Runner
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { TestLogger } from '../test-logger/test-logger.js';
import { CLIRunner } from './cli-runner.js';

const logger = TestLogger.createLogger('cli-runner');

describe('CLIRunner', () => {
  let runner: CLIRunner;
  let originalConsoleLog: typeof console.log;
  let logOutput: string[] = [];

  beforeEach(() => {
    const startTime = Date.now();
    logger.testStart('beforeEach setup');

    runner = new CLIRunner();
    logOutput = [];

    // Mock console.log to capture output
    originalConsoleLog = console.log;
    console.log = (...args: any[]) => {
      const message = args
        .map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg)))
        .join(' ');
      logOutput.push(message);
      // Don't call original to avoid infinite recursion during tests
    };

    const duration = Date.now() - startTime;
    logger.testEnd('beforeEach setup', true, duration);
  });

  afterEach(() => {
    // Restore console.log
    console.log = originalConsoleLog;
  });

  describe('constructor', () => {
    it('should create CLI runner instance', () => {
      const startTime = Date.now();
      logger.testStart('should create CLI runner instance');

      assert.ok(runner instanceof CLIRunner, 'Should create CLIRunner instance');

      const duration = Date.now() - startTime;
      logger.testEnd('should create CLI runner instance', true, duration);
    });
  });

  describe('run', () => {
    it('should show help for unknown command', async () => {
      const startTime = Date.now();
      logger.testStart('should show help for unknown command');

      await runner.run(['unknown']);

      logger.debug('Console output captured', {
        logOutput,
        outputCount: logOutput.length,
        joinedOutput: logOutput.join('|'),
      });

      const hasUsageOutput = logOutput.some((line) => line.includes('📖 Usage:'));
      logger.debug('Usage check', { hasUsageOutput, searchFor: '📖 Usage:' });

      assert.ok(hasUsageOutput, 'Should display usage information');

      const duration = Date.now() - startTime;
      logger.testEnd('should show help for unknown command', true, duration);
    });

    it('should show help for empty command', async () => {
      const startTime = Date.now();
      logger.testStart('should show help for empty command');

      await runner.run([]);
      logger.debug('Console output captured', { logOutput });

      const hasUsageOutput = logOutput.some((line) => line.includes('📖 Usage:'));
      assert.ok(hasUsageOutput, 'Should display usage information');

      const duration = Date.now() - startTime;
      logger.testEnd('should show help for empty command', true, duration);
    });

    it('should handle list command', async () => {
      const startTime = Date.now();
      logger.testStart('should handle list command');

      await runner.run(['list']);
      logger.debug('Console output captured for list command', { outputCount: logOutput.length });

      // Should call the model manager's listModels method
      // The output may vary depending on models present, but should not throw
      assert.ok(logOutput.length > 0, 'Should produce console output for list command');

      const duration = Date.now() - startTime;
      logger.testEnd('should handle list command', true, duration);
    });

    it('should handle debug command', async () => {
      const startTime = Date.now();
      logger.testStart('should handle debug command');

      await runner.run(['debug']);
      logger.debug('Console output captured for debug command', { outputCount: logOutput.length });

      // Debug command should output scanning information
      const hasDebugOutput = logOutput.some((line) => line.includes('🔧 Debug Mode'));
      assert.ok(hasDebugOutput, 'Should display debug mode information');

      const hasModelsDir = logOutput.some((line) => line.includes('📂 Models directory'));
      assert.ok(hasModelsDir, 'Should display models directory information');

      const duration = Date.now() - startTime;
      logger.testEnd('should handle debug command', true, duration);
    });
  });

  // Note: Command validation tests that involve process.exit are difficult to test
  // in Node.js without complex mocking. These would be better handled in integration tests.

  // Generate summary at the end - moved to test end instead of process exit
  // to avoid conflicts with Node.js test runner process management
});
