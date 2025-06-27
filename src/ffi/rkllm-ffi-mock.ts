/**
 * Mock FFI implementation for testing
 * Provides safe mocked versions of RKLLM functions that don't crash
 */

import type { 
  RKLLMParam, 
  RKLLMInput, 
  RKLLMResult, 
  RKLLMLoraAdapter,
  StreamOptions,
  LLMCallState 
} from '../types.js';

/**
 * Mock RKLLM FFI implementation for testing
 */
export class RKLLMFFIMock {
  private handle: number | null = null;
  private isInitialized = false;
  private mockHandle = 0x12345678;

  constructor() {
    // Mock implementation
  }

  async init(params: RKLLMParam): Promise<void> {
    if (this.isInitialized) {
      throw new Error('RKLLM is already initialized');
    }

    if (params.modelPath.includes('nonexistent') || params.modelPath.includes('invalid')) {
      throw new Error('Invalid model path: model file not found');
    }

    this.handle = this.mockHandle;
    this.isInitialized = true;
  }

  async run(input: RKLLMInput, callback?: (result: RKLLMResult) => void): Promise<RKLLMResult> {
    if (!this.isInitialized || !this.handle) {
      throw new Error('RKLLM not initialized');
    }

    const inputText = typeof input.inputData === 'string' ? input.inputData : 'binary input';
    const mockResult: RKLLMResult = {
      text: 'Mock response to: ' + inputText,
      state: 0,
      tokens: [1, 2, 3, 4, 5],
    };

    if (callback) {
      callback(mockResult);
    }

    return mockResult;
  }

  async runStream(input: RKLLMInput, options: StreamOptions): Promise<void> {
    if (!this.isInitialized || !this.handle) {
      throw new Error('RKLLM not initialized');
    }

    const inputText = typeof input.inputData === 'string' ? input.inputData : 'binary input';
    const words = ('Mock streaming response to: ' + inputText).split(' ');
    
    for (let i = 0; i < words.length; i++) {
      const partialText = words.slice(0, i + 1).join(' ');
      const result: RKLLMResult = {
        text: partialText,
        state: i === words.length - 1 ? 0 : 1,
        tokens: [1, 2, 3, 4, i + 1],
      };
      
      if (options.callback) {
        options.callback(result, options.userdata);
      }
      
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  async destroy(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }
    this.handle = null;
    this.isInitialized = false;
  }

  async abort(): Promise<void> {
    // Mock abort
  }

  isRunning(): boolean {
    return this.isInitialized && this.handle !== null;
  }

  async loadLoRA(adapter: RKLLMLoraAdapter): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('RKLLM not initialized');
    }
  }

  async loadPromptCache(cachePath: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('RKLLM not initialized');
    }
  }

  async releasePromptCache(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('RKLLM not initialized');
    }
  }

  async clearKvCache(keepSystemPrompt: boolean = false): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('RKLLM not initialized');
    }
  }

  async clearKVCache(keepSystemPrompt: boolean = false): Promise<void> {
    // Alias for clearKvCache
    return this.clearKvCache(keepSystemPrompt);
  }

  async getKVCacheSize(): Promise<number[]> {
    if (!this.isInitialized) {
      throw new Error('RKLLM not initialized');
    }
    return [1024, 512, 256];
  }

  async setChatTemplate(systemPrompt: string, prefix: string, postfix: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('RKLLM not initialized');
    }
  }

  async setFunctionTools(systemPrompt: string, tools: string, toolResponseStr: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('RKLLM not initialized');
    }
  }

  get initialized(): boolean {
    return this.isInitialized;
  }

  get handleValue(): number | null {
    return this.handle;
  }
}

export default RKLLMFFIMock;
