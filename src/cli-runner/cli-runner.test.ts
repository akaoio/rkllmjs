/**
 * Unit tests for CLI Runner
 */

import { describe, it, expect, beforeEach, spyOn } from 'bun:test';
import { CLIRunner } from './cli-runner.js';

describe('CLIRunner', () => {
  let runner: CLIRunner;
  let consoleSpy: any;

  beforeEach(() => {
    runner = new CLIRunner();
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('constructor', () => {
    it('should create CLI runner instance', () => {
      expect(runner).toBeInstanceOf(CLIRunner);
    });
  });

  describe('run', () => {
    it('should show help for unknown command', async () => {
      await runner.run(['unknown']);
      expect(consoleSpy).toHaveBeenCalledWith('📖 Usage:');
    });

    it('should show help for empty command', async () => {
      await runner.run([]);
      expect(consoleSpy).toHaveBeenCalledWith('📖 Usage:');
    });

    it('should handle list command', async () => {
      await runner.run(['list']);
      expect(consoleSpy).toHaveBeenCalledWith('🤖 RKLLMJS Model Manager\n');
    });

    it('should handle debug command', async () => {
      await runner.run(['debug']);
      expect(consoleSpy).toHaveBeenCalledWith('🔧 Debug Mode: Scanning models directory...');
    });
  });

  describe('command validation', () => {
    it('should require repo and filename for pull command', async () => {
      const exitSpy = spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      await expect(runner.run(['pull'])).rejects.toThrow('process.exit called');
      expect(consoleSpy).toHaveBeenCalledWith('❌ Please specify both repository and model.');
      expect(exitSpy).toHaveBeenCalledWith(1);

      exitSpy.mockRestore();
    });

    it('should require model name for info command', async () => {
      const exitSpy = spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      await expect(runner.run(['info'])).rejects.toThrow('process.exit called');
      expect(consoleSpy).toHaveBeenCalledWith('❌ Please specify a model.');
      expect(exitSpy).toHaveBeenCalledWith(1);

      exitSpy.mockRestore();
    });

    it('should require model name for remove command', async () => {
      const exitSpy = spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      await expect(runner.run(['remove'])).rejects.toThrow('process.exit called');
      expect(consoleSpy).toHaveBeenCalledWith('❌ Please specify a model.');
      expect(exitSpy).toHaveBeenCalledWith(1);

      exitSpy.mockRestore();
    });
  });
});
