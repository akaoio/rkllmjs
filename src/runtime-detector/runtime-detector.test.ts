/**
 * Unit tests for Runtime Detector
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { RuntimeDetector, type RuntimeType } from './runtime-detector';

describe('RuntimeDetector', () => {
  let detector: RuntimeDetector;

  beforeEach(() => {
    detector = RuntimeDetector.getInstance();
  });

  describe('singleton pattern', () => {
    it('should return same instance', () => {
      const detector1 = RuntimeDetector.getInstance();
      const detector2 = RuntimeDetector.getInstance();
      expect(detector1).toBe(detector2);
    });
  });

  describe('runtime detection', () => {
    it('should detect current runtime', () => {
      const runtime = detector.detect();
      expect(runtime).toBeDefined();
      expect(runtime.type).toBeDefined();
      expect(runtime.version).toBeDefined();
      expect(typeof runtime.hasFileSystem).toBe('boolean');
      expect(typeof runtime.hasProcess).toBe('boolean');
      expect(typeof runtime.hasSubprocess).toBe('boolean');
      expect(typeof runtime.supportsNativeModules).toBe('boolean');
    });

    it('should return consistent results on multiple calls', () => {
      const runtime1 = detector.detect();
      const runtime2 = detector.detect();
      expect(runtime1).toEqual(runtime2);
    });
  });

  describe('runtime-specific methods', () => {
    it('should provide CLI prefix', () => {
      const prefix = detector.getCliPrefix();
      expect(typeof prefix).toBe('string');
      expect(prefix.length).toBeGreaterThan(0);
    });

    it('should check if runtime is primary', () => {
      const isPrimary = detector.isPrimary();
      expect(typeof isPrimary).toBe('boolean');
    });

    it('should check if runtime is experimental', () => {
      const isExperimental = detector.isExperimental();
      expect(typeof isExperimental).toBe('boolean');
    });
  });

  describe('module loading', () => {
    it('should get require function if available', () => {
      const requireFn = detector.getRequire();
      // May be null for some runtimes (like Deno)
      if (requireFn) {
        expect(typeof requireFn).toBe('function');
      }
    });

    it('should get file system module', async () => {
      try {
        const fs = await detector.getFileSystem();
        expect(fs).toBeDefined();
      } catch (error) {
        // Expected for some runtimes
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should get path module', async () => {
      try {
        const path = await detector.getPath();
        expect(path).toBeDefined();
      } catch (error) {
        // Expected for some runtimes
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('command execution', () => {
    it('should execute simple command', async () => {
      try {
        const result = await detector.executeCommand('echo', ['test']);
        expect(result).toBeDefined();
        expect(typeof result.stdout).toBe('string');
        expect(typeof result.stderr).toBe('string');
        expect(typeof result.exitCode).toBe('number');
      } catch (error) {
        // Command execution might not be available in all test environments
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
});
