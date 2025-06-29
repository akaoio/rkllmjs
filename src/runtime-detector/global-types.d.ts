/**
 * Global type declarations for multi-runtime support
 */

// Bun global
declare global {
  const Bun:
    | {
        version: string;
        argv?: string[];
        spawnSync: (
          command: string[],
          options?: any
        ) => {
          stdout: Buffer | undefined;
          stderr: Buffer | undefined;
          exitCode: number;
        };
      }
    | undefined;

  // Deno global
  const Deno:
    | {
        version: { deno: string };
        args?: string[];
        readTextFile: (path: string) => Promise<string>;
        writeFile: (path: string, data: Uint8Array) => Promise<void>;
        stat: (path: string) => Promise<any>;
        statSync: (path: string) => any;
        readDir: (
          path: string
        ) => AsyncIterable<{ name: string; isFile: boolean; isDirectory: boolean }>;
        mkdir: (path: string, options?: { recursive?: boolean }) => Promise<void>;
        Command: new (
          command: string,
          options: { args: string[] }
        ) => {
          output: () => Promise<{
            stdout: Uint8Array;
            stderr: Uint8Array;
            code: number;
          }>;
        };
      }
    | undefined;
}

export {};
