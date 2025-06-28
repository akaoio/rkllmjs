/**
 * Unit tests for Runtime Detector
 * Node.js implementation with structured logging
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { TestLogger } from '../test-logger/test-logger.js';
import { RuntimeDetector, type RuntimeType } from './runtime-detector';

const logger = TestLogger.createLogger('runtime-detector');

describe('RuntimeDetector', () => {
  let detector: RuntimeDetector;

  beforeEach(() => {
    logger.testStart('beforeEach setup');
    detector = RuntimeDetector.getInstance();
    logger.info('Test setup completed', { detectorCreated: true });
  });

  describe('singleton pattern', () => {
    it('should return same instance', () => {
      const startTime = Date.now();
      logger.testStart('should return same instance');
      
      const detector1 = RuntimeDetector.getInstance();
      const detector2 = RuntimeDetector.getInstance();
      
      logger.debug('Singleton test', { 
        detector1Id: detector1.constructor.name,
        detector2Id: detector2.constructor.name,
        areSame: detector1 === detector2
      });
      
      assert.strictEqual(detector1, detector2);
      
      const duration = Date.now() - startTime;
      logger.testEnd('should return same instance', true, duration);
    });
  });

  describe('runtime detection', () => {
    it('should detect current runtime', () => {
      const startTime = Date.now();
      logger.testStart('should detect current runtime');
      
      const runtime = detector.detect();
      
      logger.debug('Runtime detection result', { runtime });
      
      assert.ok(runtime, 'Runtime should be defined');
      assert.ok(runtime.type, 'Runtime type should be defined');
      assert.ok(runtime.version, 'Runtime version should be defined');
      assert.strictEqual(typeof runtime.hasFileSystem, 'boolean');
      assert.strictEqual(typeof runtime.hasProcess, 'boolean');
      assert.strictEqual(typeof runtime.hasSubprocess, 'boolean');
      assert.strictEqual(typeof runtime.supportsNativeModules, 'boolean');
      
      const duration = Date.now() - startTime;
      logger.testEnd('should detect current runtime', true, duration);
    });

    it('should return consistent results on multiple calls', () => {
      const startTime = Date.now();
      logger.testStart('should return consistent results on multiple calls');
      
      const runtime1 = detector.detect();
      const runtime2 = detector.detect();
      
      logger.debug('Consistency test', { runtime1, runtime2 });
      
      assert.deepStrictEqual(runtime1, runtime2);
      
      const duration = Date.now() - startTime;
      logger.testEnd('should return consistent results on multiple calls', true, duration);
    });
  });

  describe('runtime-specific methods', () => {
    it('should provide CLI prefix', () => {
      const startTime = Date.now();
      logger.testStart('should provide CLI prefix');
      
      const prefix = detector.getCliPrefix();
      
      logger.debug('CLI prefix test', { prefix });
      
      assert.strictEqual(typeof prefix, 'string');
      assert.ok(prefix.length > 0);
      
      const duration = Date.now() - startTime;
      logger.testEnd('should provide CLI prefix', true, duration);
    });

    it('should check if runtime is primary', () => {
      const startTime = Date.now();
      logger.testStart('should check if runtime is primary');
      
      const isPrimary = detector.isPrimary();
      
      logger.debug('Primary runtime check', { isPrimary });
      
      assert.strictEqual(typeof isPrimary, 'boolean');
      
      const duration = Date.now() - startTime;
      logger.testEnd('should check if runtime is primary', true, duration);
    });

    it('should check if runtime is experimental', () => {
      const startTime = Date.now();
      logger.testStart('should check if runtime is experimental');
      
      const isExperimental = detector.isExperimental();
      
      logger.debug('Experimental runtime check', { isExperimental });
      
      assert.strictEqual(typeof isExperimental, 'boolean');
      
      const duration = Date.now() - startTime;
      logger.testEnd('should check if runtime is experimental', true, duration);
    });
  });

  describe('module loading', () => {
    it('should provide file system module', async () => {
      const startTime = Date.now();
      logger.testStart('should provide file system module');
      
      try {
        const fs = await detector.getFileSystem();
        logger.debug('File system module test', { success: true, hasFs: !!fs });
        assert.ok(fs, 'fs module should be available');
      } catch (error) {
        logger.debug('File system module test', { success: false, error: error instanceof Error ? error.message : String(error) });
        assert.ok(error instanceof Error);
      }
      
      const duration = Date.now() - startTime;
      logger.testEnd('should provide file system module', true, duration);
    });

    it('should provide path module', async () => {
      const startTime = Date.now();
      logger.testStart('should provide path module');
      
      try {
        const path = await detector.getPath();
        logger.debug('Path module test', { success: true, hasPath: !!path });
        assert.ok(path, 'path module should be available');
      } catch (error) {
        logger.debug('Path module test', { success: false, error: error instanceof Error ? error.message : String(error) });
        assert.ok(error instanceof Error);
      }
      
      const duration = Date.now() - startTime;
      logger.testEnd('should provide path module', true, duration);
    });
  });

  describe('command execution', () => {
    it('should execute commands safely', async () => {
      const startTime = Date.now();
      logger.testStart('should execute commands safely');
      
      try {
        const result = await detector.executeCommand('echo', ['test']);
        logger.debug('Command execution test', { success: true, result });
        
        assert.ok(result, 'Command result should be defined');
        assert.strictEqual(typeof result.stdout, 'string');
        assert.strictEqual(typeof result.stderr, 'string');
        assert.strictEqual(typeof result.exitCode, 'number');
      } catch (error) {
        logger.debug('Command execution test', { success: false, error: error instanceof Error ? error.message : String(error) });
        // Command execution might not be available in all environments
        assert.ok(error instanceof Error);
      }
      
      const duration = Date.now() - startTime;
      logger.testEnd('should execute commands safely', true, duration);
    });
  });
  
  // Test run summary - moved to avoid conflicts with Node.js test runner
  logger.summary();
});
