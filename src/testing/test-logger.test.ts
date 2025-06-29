/**
 * Test Logger Tests
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import * as path from 'path';
import { TestLogger } from './test-logger.js';

describe('TestLogger', () => {
  test('should create logger with proper initialization', () => {
    const logger = new TestLogger('test-logger-init');
    assert.ok(logger instanceof TestLogger);
  });

  test('should write log entries to file', () => {
    const testName = 'test-logger-file-write';
    const logger = new TestLogger(testName);
    
    logger.info('Test message');
    logger.warn('Warning message');
    logger.debug('Debug message');
    
    // Log files should be created
    const logPattern = path.join('logs', '*', 'unit-tests', `${testName}.test.log`);
    const glob = require('glob');
    const logFiles = glob.sync(logPattern);
    
    assert.ok(logFiles.length > 0, 'Log file should be created');
  });

  test('should handle test lifecycle methods', () => {
    const logger = new TestLogger('test-logger-lifecycle');
    
    // Should not throw errors
    logger.testStart('sample test');
    logger.expectation('expected', 'actual', false);
    logger.testEnd('sample test', true, 100);
    logger.summary();
    
    assert.ok(true, 'Lifecycle methods should complete without errors');
  });

  test('should handle data serialization safely', () => {
    const logger = new TestLogger('test-logger-serialization');
    
    // Test with circular reference
    const circular: any = { prop: 'value' };
    circular.self = circular;
    
    // Should not throw error
    logger.info('Circular reference test', circular);
    
    // Test with large data
    const largeData = 'x'.repeat(20000);
    logger.info('Large data test', { data: largeData });
    
    assert.ok(true, 'Data serialization should handle edge cases');
  });

  test('should handle errors properly', () => {
    const logger = new TestLogger('test-logger-errors');
    
    const testError = new Error('Test error message');
    logger.error('Error test', testError);
    
    assert.ok(true, 'Error logging should work');
  });

  test('should create static logger instance', () => {
    const logger = TestLogger.createLogger('static-test');
    assert.ok(logger instanceof TestLogger);
  });
});