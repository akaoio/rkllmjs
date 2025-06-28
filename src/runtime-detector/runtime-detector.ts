/**
 * Runtime Detector - Detects current JavaScript runtime and provides appropriate APIs
 */

/// <reference path="./global-types.d.ts" />

export type RuntimeType = 'node' | 'bun' | 'deno' | 'unknown';

export interface RuntimeInfo {
  type: RuntimeType;
  version: string;
  hasFileSystem: boolean;
  hasProcess: boolean;
  hasSubprocess: boolean;
  supportsNativeModules: boolean;
}

export class RuntimeDetector {
  private static _instance: RuntimeDetector;
  private _runtimeInfo: RuntimeInfo | null = null;

  private constructor() {}

  static getInstance(): RuntimeDetector {
    if (!RuntimeDetector._instance) {
      RuntimeDetector._instance = new RuntimeDetector();
    }
    return RuntimeDetector._instance;
  }

  /**
   * Detect current runtime environment
   */
  detect(): RuntimeInfo {
    if (this._runtimeInfo) {
      return this._runtimeInfo;
    }

    // Check for Bun
    if (typeof Bun !== 'undefined') {
      this._runtimeInfo = {
        type: 'bun',
        version: Bun.version || 'unknown',
        hasFileSystem: true,
        hasProcess: true,
        hasSubprocess: true,
        supportsNativeModules: true
      };
      return this._runtimeInfo;
    }

    // Check for Deno
    if (typeof Deno !== 'undefined') {
      this._runtimeInfo = {
        type: 'deno',
        version: Deno.version?.deno || 'unknown',
        hasFileSystem: true,
        hasProcess: true,
        hasSubprocess: true,
        supportsNativeModules: false // Deno uses FFI instead
      };
      return this._runtimeInfo;
    }

    // Check for Node.js
    if (typeof process !== 'undefined' && process.versions?.node) {
      this._runtimeInfo = {
        type: 'node',
        version: process.versions.node,
        hasFileSystem: true,
        hasProcess: true,
        hasSubprocess: true,
        supportsNativeModules: true
      };
      return this._runtimeInfo;
    }

    // Unknown runtime
    this._runtimeInfo = {
      type: 'unknown',
      version: 'unknown',
      hasFileSystem: false,
      hasProcess: false,
      hasSubprocess: false,
      supportsNativeModules: false
    };
    return this._runtimeInfo;
  }

  /**
   * Get runtime-specific module loader (ES modules only)
   * Note: In ES modules context, use dynamic import() instead of require()
   */
  async getModule(modulePath: string): Promise<any> {
    const runtime = this.detect();
    
    switch (runtime.type) {
      case 'node':
      case 'bun':
      case 'deno':
        // All runtimes support dynamic imports in ES modules
        return await import(modulePath);
      default:
        throw new Error(`Module loading not supported in ${runtime.type} runtime`);
    }
  }

  /**
   * Get runtime-specific file system module
   */
  async getFileSystem(): Promise<any> {
    const runtime = this.detect();
    
    switch (runtime.type) {
      case 'node':
        // Use ES module import
        return await import('fs');
      case 'bun':
        return await import('fs');
      case 'deno':
        // Use Deno's built-in APIs, not external imports
        return {
          existsSync: (path: string) => {
            try {
              if (typeof Deno !== 'undefined' && Deno.statSync) {
                Deno.statSync(path);
                return true;
              }
              return false;
            } catch {
              return false;
            }
          },
          readFileSync: async (path: string, _encoding: string = 'utf8') => {
            if (typeof Deno !== 'undefined' && Deno.readTextFile) {
              return await Deno.readTextFile(path);
            }
            throw new Error('Deno not available');
          },
          writeFileSync: async (path: string, data: string | Uint8Array) => {
            if (typeof Deno !== 'undefined' && Deno.writeFile) {
              await Deno.writeFile(path, typeof data === 'string' ? new TextEncoder().encode(data) : data);
            }
          },
          statSync: (path: string) => {
            if (typeof Deno !== 'undefined' && Deno.statSync) {
              return Deno.statSync(path);
            }
            throw new Error('Deno not available');
          },
          readdirSync: async (path: string, _options?: any) => {
            if (typeof Deno !== 'undefined') {
              const entries = [];
              for await (const entry of Deno.readDir(path)) {
                entries.push(entry);
              }
              return entries;
            }
            throw new Error('Deno not available');
          }
        };
      default:
        throw new Error(`File system not available in ${runtime.type} runtime`);
    }
  }

  /**
   * Get runtime-specific path module
   */
  async getPath(): Promise<any> {
    const runtime = this.detect();
    
    switch (runtime.type) {
      case 'node':
        return await import('path');
      case 'bun':
        return await import('path');
      case 'deno':
        // Basic path utilities for Deno
        return {
          join: (...parts: string[]) => parts.join('/'),
          resolve: (...parts: string[]) => {
            // Simple implementation for Deno
            return parts.join('/').replace(/\/+/g, '/');
          },
          dirname: (path: string) => {
            const parts = path.split('/');
            return parts.slice(0, -1).join('/') || '/';
          },
          basename: (path: string, ext?: string) => {
            const name = path.split('/').pop() || '';
            if (ext && name.endsWith(ext)) {
              return name.slice(0, -ext.length);
            }
            return name;
          }
        };
      default:
        throw new Error(`Path module not available in ${runtime.type} runtime`);
    }
  }

  /**
   * Execute command in runtime-specific way
   */
  async executeCommand(command: string, args: string[] = []): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const runtime = this.detect();
    
    switch (runtime.type) {
      case 'node':
        const { spawn } = await import('child_process');
        return new Promise((resolve, reject) => {
          const process = spawn(command, args, { stdio: 'pipe' });
          let stdout = '';
          let stderr = '';
          
          process.stdout.on('data', (data: Buffer) => {
            stdout += data.toString();
          });
          
          process.stderr.on('data', (data: Buffer) => {
            stderr += data.toString();
          });
          
          process.on('close', (code: number) => {
            resolve({ stdout, stderr, exitCode: code });
          });
          
          process.on('error', reject);
        });
        
      case 'bun':
        if (typeof Bun !== 'undefined') {
          const result = Bun.spawnSync([command, ...args]);
          return {
            stdout: result.stdout?.toString() || '',
            stderr: result.stderr?.toString() || '',
            exitCode: result.exitCode
          };
        }
        throw new Error('Bun not available');
        
      case 'deno':
        if (typeof Deno !== 'undefined') {
          const denoProcess = new Deno.Command(command, { args });
          const denoResult = await denoProcess.output();
          return {
            stdout: new TextDecoder().decode(denoResult.stdout),
            stderr: new TextDecoder().decode(denoResult.stderr),
            exitCode: denoResult.code
          };
        }
        throw new Error('Deno not available');
        
      default:
        throw new Error(`Command execution not supported in ${runtime.type} runtime`);
    }
  }

  /**
   * Check if current runtime is primary (Node.js)
   */
  isPrimary(): boolean {
    return this.detect().type === 'node';
  }

  /**
   * Check if current runtime is experimental
   */
  isExperimental(): boolean {
    const runtime = this.detect();
    return runtime.type === 'bun' || runtime.type === 'deno';
  }

  /**
   * Get runtime-specific CLI command prefix
   */
  getCliPrefix(): string {
    const runtime = this.detect();
    
    switch (runtime.type) {
      case 'node':
        return 'node';
      case 'bun':
        return 'bun';
      case 'deno':
        return 'deno run --allow-all';
      default:
        return 'node'; // fallback
    }
  }
}
