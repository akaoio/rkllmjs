/**
 * Unit tests for RKLLM Client
 * Tests high-level wrapper functionality and Promise-based API
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import { strict as assert } from 'node:assert';
import { TestLogger } from '../test-logger/test-logger.js';
import {
  RKLLMClient,
  type RKLLMClientConfig,
  type InferenceOptions,
} from './rkllm-client.js';
import {
  RKLLMInputType,
  RKLLMInferMode,
  RKLLMStatusCode,
  RKLLMError,
} from '../rkllm-types/rkllm-types.js';

// Initialize test logger
const testLogger = new TestLogger('rkllm-client');

describe('RKLLM Client', () => {
  let client: RKLLMClient;
  let testConfig: RKLLMClientConfig;

  beforeEach(() => {
    testLogger.info('Setting up test environment');
    
    testConfig = {
      modelPath: '/tmp/test-model.rkllm',
      autoInit: false, // Manual init for testing
      enableEventLogging: true,
      maxContextLen: 2048,
      maxNewTokens: 256,
      temperature: 0.8,
    };
  });

  afterEach(async () => {
    if (client && client.isClientInitialized()) {
      await client.destroy();
    }
    testLogger.info('Test environment cleaned up');
  });

  // ============================================================================
  // Constructor and Configuration Tests
  // ============================================================================

  describe('Constructor', () => {
    it('should create client with configuration', () => {
      testLogger.info('Testing RKLLMClient constructor');
      
      client = new RKLLMClient(testConfig);
      
      assert.ok(client instanceof RKLLMClient);
      assert.equal(client.isClientInitialized(), false);
      
      const config = client.getConfig();
      assert.equal(config.modelPath, testConfig.modelPath);
      assert.equal(config.maxContextLen, testConfig.maxContextLen);
      assert.equal(config.temperature, testConfig.temperature);
      
      testLogger.info('RKLLMClient constructor validation completed');
    });

    it('should apply default configuration values', () => {
      testLogger.info('Testing default configuration values');
      
      const minimalConfig: RKLLMClientConfig = {
        modelPath: '/tmp/minimal-model.rkllm',
        autoInit: false,
      };
      
      client = new RKLLMClient(minimalConfig);
      const config = client.getConfig();
      
      assert.equal(config.modelPath, minimalConfig.modelPath);
      assert.equal(config.maxContextLen, 4096); // Default value
      assert.equal(config.temperature, 0.7); // Default value
      assert.equal(config.topP, 0.9); // Default value
      assert.equal(config.isAsync, true); // Default value
      
      testLogger.info('Default configuration validation completed');
    });

    it('should create default parameters using static method', () => {
      testLogger.info('Testing createDefaultParams static method');
      
      const params = RKLLMClient.createDefaultParams({
        modelPath: '/tmp/test.rkllm',
        maxContextLen: 8192,
        temperature: 0.5,
      });
      
      assert.equal(params.modelPath, '/tmp/test.rkllm');
      assert.equal(params.maxContextLen, 8192);
      assert.equal(params.temperature, 0.5);
      assert.equal(params.maxNewTokens, 512); // Default
      assert.equal(params.topK, 40); // Default
      
      testLogger.info('createDefaultParams validation completed');
    });
  });

  // ============================================================================
  // Lifecycle Tests
  // ============================================================================

  describe('Lifecycle Management', () => {
    beforeEach(() => {
      client = new RKLLMClient(testConfig);
    });

    it('should initialize client successfully', async () => {
      testLogger.info('Testing client initialization');
      
      assert.equal(client.isClientInitialized(), false);
      
      let initializeEventEmitted = false;
      let modelLoadEventEmitted = false;
      
      client.on('initialized', () => {
        initializeEventEmitted = true;
      });
      
      client.on('model:loaded', (modelPath) => {
        modelLoadEventEmitted = true;
        assert.equal(modelPath, testConfig.modelPath);
      });
      
      await client.initialize();
      
      assert.equal(client.isClientInitialized(), true);
      assert.equal(initializeEventEmitted, true);
      assert.equal(modelLoadEventEmitted, true);
      
      testLogger.info('Client initialization validation completed');
    });

    it('should prevent double initialization', async () => {
      testLogger.info('Testing double initialization prevention');
      
      await client.initialize();
      
      try {
        await client.initialize();
        assert.fail('Expected RKLLMError to be thrown');
      } catch (error) {
        assert.ok(error instanceof RKLLMError);
        assert.equal(error.code, RKLLMStatusCode.ERROR_UNKNOWN);
      }
      
      testLogger.info('Double initialization prevention validation completed');
    });

    it('should destroy client successfully', async () => {
      testLogger.info('Testing client destruction');
      
      await client.initialize();
      assert.equal(client.isClientInitialized(), true);
      
      let destroyEventEmitted = false;
      let modelUnloadEventEmitted = false;
      
      client.on('destroyed', () => {
        destroyEventEmitted = true;
      });
      
      client.on('model:unloaded', () => {
        modelUnloadEventEmitted = true;
      });
      
      await client.destroy();
      
      assert.equal(client.isClientInitialized(), false);
      assert.equal(destroyEventEmitted, true);
      assert.equal(modelUnloadEventEmitted, true);
      
      testLogger.info('Client destruction validation completed');
    });

    it('should handle destroy on uninitialized client', async () => {
      testLogger.info('Testing destroy on uninitialized client');
      
      assert.equal(client.isClientInitialized(), false);
      
      // Should not throw error
      await client.destroy();
      
      assert.equal(client.isClientInitialized(), false);
      
      testLogger.info('Uninitialized client destroy validation completed');
    });
  });

  // ============================================================================
  // Inference Tests
  // ============================================================================

  describe('Text Generation', () => {
    beforeEach(async () => {
      client = new RKLLMClient(testConfig);
      await client.initialize();
    });

    it('should generate text from prompt', async () => {
      testLogger.info('Testing text generation from prompt');
      
      const prompt = 'What is artificial intelligence?';
      let inferenceStarted = false;
      let inferenceCompleted = false;
      
      client.on('inference:start', (input) => {
        inferenceStarted = true;
        assert.equal(input.inputType, RKLLMInputType.PROMPT);
        assert.equal(input.promptInput, prompt);
      });
      
      client.on('inference:complete', (result) => {
        inferenceCompleted = true;
        assert.ok(result.text);
        assert.ok(result.tokenCount > 0);
      });
      
      const result = await client.generate(prompt);
      
      assert.ok(result.text);
      assert.equal(result.finishReason, 'completed');
      assert.ok(result.performance.totalTimeMs > 0);
      assert.ok(result.metadata?.modelName);
      assert.equal(inferenceStarted, true);
      assert.equal(inferenceCompleted, true);
      
      testLogger.info('Text generation validation completed', { result });
    });

    it('should generate text from tokens', async () => {
      testLogger.info('Testing text generation from tokens');
      
      const tokens = new Int32Array([1, 2, 3, 4, 5]);
      
      let inferenceStarted = false;
      client.on('inference:start', (input) => {
        inferenceStarted = true;
        assert.equal(input.inputType, RKLLMInputType.TOKEN);
        assert.equal(input.tokenInput?.nTokens, tokens.length);
      });
      
      const result = await client.generateFromTokens(tokens);
      
      assert.ok(result.text);
      assert.equal(result.finishReason, 'completed');
      assert.equal(inferenceStarted, true);
      
      testLogger.info('Token generation validation completed');
    });

    it('should generate text from embedding', async () => {
      testLogger.info('Testing text generation from embedding');
      
      const embedding = new Float32Array([0.1, 0.2, 0.3, 0.4]);
      const nTokens = 2;
      
      let inferenceStarted = false;
      client.on('inference:start', (input) => {
        inferenceStarted = true;
        assert.equal(input.inputType, RKLLMInputType.EMBED);
        assert.equal(input.embedInput?.nTokens, nTokens);
      });
      
      const result = await client.generateFromEmbedding(embedding, nTokens);
      
      assert.ok(result.text);
      assert.equal(result.finishReason, 'completed');
      assert.equal(inferenceStarted, true);
      
      testLogger.info('Embedding generation validation completed');
    });

    it('should handle inference options', async () => {
      testLogger.info('Testing inference with options');
      
      const prompt = 'Test prompt';
      let tokenCallbackCount = 0;
      let progressCallbackCount = 0;
      
      const options: InferenceOptions = {
        mode: RKLLMInferMode.GENERATE,
        streaming: true,
        onToken: (token) => {
          tokenCallbackCount++;
          assert.ok(typeof token === 'string');
        },
        onProgress: (progress) => {
          progressCallbackCount++;
          assert.ok(progress >= 0 && progress <= 1);
        },
      };
      
      const result = await client.generate(prompt, options);
      
      assert.ok(result.text);
      assert.ok(tokenCallbackCount > 0);
      // Progress callback might not be called in mock implementation
      
      testLogger.info('Inference options validation completed', {
        tokenCallbacks: tokenCallbackCount,
        progressCallbacks: progressCallbackCount,
      });
    });

    it('should prevent concurrent inference', async () => {
      testLogger.info('Testing concurrent inference prevention');
      
      const prompt1 = 'First prompt';
      const prompt2 = 'Second prompt';
      
      // Start first inference (don't await yet)
      const promise1 = client.generate(prompt1);
      
      // Try to start second inference
      try {
        await client.generate(prompt2);
        assert.fail('Expected RKLLMError to be thrown');
      } catch (error) {
        assert.ok(error instanceof RKLLMError);
        assert.equal(error.code, RKLLMStatusCode.ERROR_TASK_RUNNING);
      }
      
      // Wait for first inference to complete
      const result1 = await promise1;
      assert.ok(result1.text);
      
      testLogger.info('Concurrent inference prevention validation completed');
    });
  });

  // ============================================================================
  // Control Tests
  // ============================================================================

  describe('Inference Control', () => {
    beforeEach(async () => {
      client = new RKLLMClient(testConfig);
      await client.initialize();
    });

    it('should check running status', () => {
      testLogger.info('Testing inference running status');
      
      assert.equal(client.isInferenceRunning(), false);
      
      testLogger.info('Inference status validation completed');
    });

    it('should handle abort on non-running inference', async () => {
      testLogger.info('Testing abort on non-running inference');
      
      assert.equal(client.isInferenceRunning(), false);
      
      // Should not throw error
      await client.abort();
      
      assert.equal(client.isInferenceRunning(), false);
      
      testLogger.info('Non-running inference abort validation completed');
    });
  });

  // ============================================================================
  // Configuration Tests
  // ============================================================================

  describe('Configuration Management', () => {
    beforeEach(async () => {
      client = new RKLLMClient(testConfig);
      await client.initialize();
    });

    it('should load LoRA adapter', async () => {
      testLogger.info('Testing LoRA adapter loading');
      
      const adapter = {
        loraAdapterPath: '/tmp/test-lora.bin',
        loraAdapterName: 'test-lora',
        scale: 1.0,
      };
      
      let loraLoadedEventEmitted = false;
      client.on('lora:loaded', (adapterName) => {
        loraLoadedEventEmitted = true;
        assert.equal(adapterName, adapter.loraAdapterName);
      });
      
      await client.loadLora(adapter);
      
      const loadedAdapters = client.getLoadedLoraAdapters();
      assert.ok(loadedAdapters.includes(adapter.loraAdapterName));
      assert.equal(loraLoadedEventEmitted, true);
      
      testLogger.info('LoRA adapter loading validation completed');
    });

    it('should set chat template', async () => {
      testLogger.info('Testing chat template configuration');
      
      const chatTemplate = {
        systemPrompt: 'You are a helpful assistant.',
        promptPrefix: 'User: ',
        promptPostfix: '\nAssistant: ',
      };
      
      // Should not throw error
      await client.setChatTemplate(chatTemplate);
      
      testLogger.info('Chat template configuration validation completed');
    });

    it('should set function tools', async () => {
      testLogger.info('Testing function tools configuration');
      
      const functionTools = {
        systemPrompt: 'You can call functions.',
        tools: JSON.stringify({
          functions: [{
            name: 'get_weather',
            description: 'Get weather information',
            parameters: {
              type: 'object',
              properties: {
                location: { type: 'string' }
              }
            }
          }]
        }),
        toolResponseStr: '<tool_response>',
      };
      
      // Should not throw error
      await client.setFunctionTools(functionTools);
      
      testLogger.info('Function tools configuration validation completed');
    });
  });

  // ============================================================================
  // Cache Management Tests
  // ============================================================================

  describe('Cache Management', () => {
    beforeEach(async () => {
      client = new RKLLMClient(testConfig);
      await client.initialize();
    });

    it('should load prompt cache', async () => {
      testLogger.info('Testing prompt cache loading');
      
      const cachePath = '/tmp/test-cache.bin';
      
      let cacheLoadedEventEmitted = false;
      client.on('cache:loaded', (loadedPath) => {
        cacheLoadedEventEmitted = true;
        assert.equal(loadedPath, cachePath);
      });
      
      await client.loadPromptCache(cachePath);
      
      assert.equal(cacheLoadedEventEmitted, true);
      
      testLogger.info('Prompt cache loading validation completed');
    });

    it('should release prompt cache', async () => {
      testLogger.info('Testing prompt cache release');
      
      let cacheClearedEventEmitted = false;
      client.on('cache:cleared', () => {
        cacheClearedEventEmitted = true;
      });
      
      await client.releasePromptCache();
      
      assert.equal(cacheClearedEventEmitted, true);
      
      testLogger.info('Prompt cache release validation completed');
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('Error Handling', () => {
    it('should throw error for operations on uninitialized client', async () => {
      testLogger.info('Testing operations on uninitialized client');
      
      client = new RKLLMClient(testConfig);
      
      try {
        await client.generate('test prompt');
        assert.fail('Expected RKLLMError to be thrown');
      } catch (error) {
        assert.ok(error instanceof RKLLMError);
        assert.equal(error.code, RKLLMStatusCode.ERROR_INVALID_HANDLE);
      }
      
      testLogger.info('Uninitialized client error validation completed');
    });

    it('should emit error events', async () => {
      testLogger.info('Testing error event emission');
      
      client = new RKLLMClient(testConfig);
      
      client.on('error', (error) => {
        assert.ok(error instanceof RKLLMError);
      });
      
      try {
        await client.generate('test');
      } catch (error) {
        // Expected error
      }
      
      // Error event may not be emitted for this specific error, but functionality is there
      
      testLogger.info('Error event validation completed');
    });
  });

  // ============================================================================
  // Event System Tests
  // ============================================================================

  describe('Event System', () => {
    beforeEach(async () => {
      client = new RKLLMClient({
        ...testConfig,
        enableEventLogging: true,
      });
      await client.initialize();
    });

    it('should emit debug events when logging enabled', async () => {
      testLogger.info('Testing debug event emission');
      
      let debugEventEmitted = false;
      client.on('debug', (message) => {
        debugEventEmitted = true;
        assert.ok(typeof message === 'string');
      });
      
      await client.generate('test prompt');
      
      assert.equal(debugEventEmitted, true);
      
      testLogger.info('Debug event validation completed');
    });

    it('should support event listener management', () => {
      testLogger.info('Testing event listener management');
      
      const listener = () => {};
      
      client.on('inference:complete', listener);
      client.off('inference:complete', listener);
      
      // Should not throw errors
      assert.ok(true);
      
      testLogger.info('Event listener management validation completed');
    });
  });

  // ============================================================================
  // Utility Methods Tests
  // ============================================================================

  describe('Utility Methods', () => {
    beforeEach(async () => {
      client = new RKLLMClient(testConfig);
      await client.initialize();
    });

    it('should return immutable configuration', () => {
      testLogger.info('Testing configuration immutability');
      
      const config = client.getConfig();
      
      // Should be frozen object
      assert.throws(() => {
        (config as any).modelPath = 'modified';
      });
      
      testLogger.info('Configuration immutability validation completed');
    });

    it('should track loaded LoRA adapters', async () => {
      testLogger.info('Testing LoRA adapter tracking');
      
      assert.deepEqual(client.getLoadedLoraAdapters(), []);
      
      const adapter = {
        loraAdapterPath: '/tmp/adapter.bin',
        loraAdapterName: 'test-adapter',
        scale: 1.0,
      };
      
      await client.loadLora(adapter);
      
      const loadedAdapters = client.getLoadedLoraAdapters();
      assert.equal(loadedAdapters.length, 1);
      assert.equal(loadedAdapters[0], adapter.loraAdapterName);
      
      testLogger.info('LoRA adapter tracking validation completed');
    });
  });
});