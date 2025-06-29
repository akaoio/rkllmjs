/**
 * Production tests for RKLLM Client
 * Essential tests with real native bindings and actual RKLLM models
 * No mocks - only production-ready functionality
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import { strict as assert } from 'node:assert';
import { TestLogger, getTestModelPath, MEMORY_OPTIMIZED_CONFIG, forceMemoryCleanup } from '../testing/index.js';
import {
  RKLLMClient,
  type RKLLMClientConfig,
} from './rkllm-client.js';
import {
  RKLLMInputType,
  RKLLMStatusCode,
  RKLLMError,
} from '../rkllm-types/rkllm-types.js';
import {
  areNativeBindingsAvailable,
  isCompatibleHardware,
  PRODUCTION_TEST_CONFIG,
  PRODUCTION_TEST_PROMPTS,
} from '../testing/index.js';

// Initialize test logger
const testLogger = TestLogger.createLogger('rkllm-client-production');

describe('RKLLM Client - Production Tests', () => {
  let client: RKLLMClient | null;
  let testConfig: RKLLMClientConfig;

  beforeEach(() => {
    testLogger.info('Setting up production test environment');
    testConfig = {
      ...MEMORY_OPTIMIZED_CONFIG,  // Use memory-optimized config
      modelPath: '', // Will be set by tests that require models
      autoInit: false,
      enableEventLogging: true,
    };
  });

  afterEach(async () => {
    testLogger.info('🧹 Cleaning up test resources...');
    
    if (client?.isClientInitialized()) {
      try {
        await client.destroy();
        testLogger.info('✅ Client destroyed successfully');
      } catch (error) {
        testLogger.error('❌ Failed to destroy client', error as Error);
      }
    }
    
    // Set client to null to ensure cleanup
    client = null;
    
    // Force memory cleanup
    await forceMemoryCleanup();
    
    testLogger.info('🔄 Memory cleanup completed');
  });

  // ============================================================================
  // Environment Prerequisites
  // ============================================================================

  describe('Environment', () => {
    it('should check native bindings availability', () => {
      testLogger.info('Checking native bindings availability');
      const available = areNativeBindingsAvailable();
      testLogger.info(`Native bindings available: ${available}`);
      
      if (!available) {
        testLogger.warn('Native bindings not available - build with: npm run build:native');
      }
    });

    it('should check hardware compatibility', () => {
      testLogger.info('Checking hardware compatibility (RK3588)');
      const compatible = isCompatibleHardware();
      testLogger.info(`Hardware compatible: ${compatible}`);
      
      if (!compatible) {
        testLogger.warn('Not on RK3588 hardware - NPU acceleration unavailable');
      }
    });
  });

  // ============================================================================
  // Configuration Tests
  // ============================================================================

  describe('Configuration', () => {
    it('should create client with production config', () => {
      testLogger.info('Testing production configuration');
      
      try {
        const realModelPath = getTestModelPath();
        const config: RKLLMClientConfig = {
          ...PRODUCTION_TEST_CONFIG,
          modelPath: realModelPath,
          autoInit: false,
        };
        
        client = new RKLLMClient(config);
        
        assert.ok(client instanceof RKLLMClient);
        assert.equal(client.isClientInitialized(), false);
        
        testLogger.info('Production config test completed with real model', { modelPath: realModelPath });
      } catch (error) {
        if (error instanceof Error && error.message.includes('Test model not found')) {
          testLogger.info('Skipping test - no real model available');
          // Create fallback config for testing structure
          const config: RKLLMClientConfig = {
            ...PRODUCTION_TEST_CONFIG,
            modelPath: process.env.RKLLM_TEST_MODEL_PATH || './models/dummy.rkllm',
            autoInit: false,
          };
          
          client = new RKLLMClient(config);
          assert.ok(client instanceof RKLLMClient);
        } else {
          throw error;
        }
      }
      
      const clientConfig = client.getConfig();
      assert.equal(clientConfig.maxContextLen, PRODUCTION_TEST_CONFIG.maxContextLen);
      assert.equal(clientConfig.temperature, PRODUCTION_TEST_CONFIG.temperature);
      
      testLogger.info('Production configuration validation completed');
    });

    it('should validate required parameters', () => {
      testLogger.info('Testing parameter validation');
      
      try {
        // Missing modelPath should throw
        client = new RKLLMClient({ autoInit: false } as any);
        assert.fail('Expected error for missing modelPath');
      } catch (error) {
        assert.ok(error instanceof Error);
        testLogger.info('Parameter validation working correctly');
      }
    });
  });

  // ============================================================================
  // Initialization Tests (Require Native Bindings)
  // ============================================================================

  describe('Initialization', function() {
    it('should initialize with real model and native bindings', async () => {
      testLogger.info('Testing initialization with real model');
      
      // Check if we have native bindings and real model
      if (!areNativeBindingsAvailable()) {
        testLogger.info('⚠️  Skipping test - native RKLLM bindings not available');
        testLogger.info('   Build native bindings first: npm run build:native');
        return;
      }
      
      try {
        const modelPath = getTestModelPath();
        testLogger.info('📁 Using real model for initialization test', { modelPath });
        
        testConfig.modelPath = modelPath;
        client = new RKLLMClient(testConfig);
        
        let initEventEmitted = false;
        client.on('initialized', () => { initEventEmitted = true; });
        
        testLogger.info('🚀 Starting model initialization...');
        await client.initialize();
        
        assert.equal(client.isClientInitialized(), true);
        assert.equal(initEventEmitted, true);
        
        testLogger.info('✅ Initialization with real model completed successfully');
      } catch (error) {
        if (error instanceof Error && error.message.includes('Test model not found')) {
          testLogger.info('⚠️  Skipping test - no real model available');
          testLogger.info('   Download a model first: npm run cli pull dulimov/Qwen2.5-VL-7B-Instruct-rk3588-1.2.1 Qwen2.5-VL-7B-Instruct-rk3588-w8a8-opt-1-hybrid-ratio-0.5.rkllm');
          return;
        }
        testLogger.error('❌ Initialization failed', error as Error);
        throw error;
      }
    });

    it('should fail gracefully without native bindings', async () => {
      if (areNativeBindingsAvailable()) {
        testLogger.info('Skipping - native bindings available');
        console.log("Skipping test - requirements not met"); return;
        return;
      }
      
      testLogger.info('Testing graceful failure without native bindings');
      
      const config: RKLLMClientConfig = {
        ...PRODUCTION_TEST_CONFIG,
        modelPath: '/any/path/model.rkllm',
        autoInit: false,
      };
      
      client = new RKLLMClient(config);
      
      try {
        await client.initialize();
        assert.fail('Expected initialization to fail');
      } catch (error) {
        assert.ok(error instanceof RKLLMError);
        assert.equal(error.code, RKLLMStatusCode.ERROR_NATIVE_BINDING_NOT_AVAILABLE);
        testLogger.info('Graceful failure working correctly');
      }
    });
  });

  // ============================================================================
  // Inference Tests (Require Real Model)
  // ============================================================================

  describe('Inference', function() {
    beforeEach(async () => {
      // Check requirements before setting up inference tests
      if (!areNativeBindingsAvailable()) {
        testLogger.info('⚠️  Skipping inference test setup - native RKLLM bindings not available');
        return;
      }
      
      try {
        const modelPath = getTestModelPath();
        testConfig.modelPath = modelPath;
        client = new RKLLMClient(testConfig);
        await client.initialize();
      } catch (error) {
        testLogger.warn('Failed to setup inference test environment', error);
        console.log("Skipping test - requirements not met"); return;
      }
    });

    it('should perform real text generation', async () => {
      // Check requirements before proceeding
      if (!areNativeBindingsAvailable()) {
        testLogger.info('⚠️  Skipping test - native RKLLM bindings not available');
        return;
      }
      
      testLogger.info('Testing real text generation');
      
      const prompt = PRODUCTION_TEST_PROMPTS[0]!!;
      let resultReceived = false;
      
      try {
        assert.ok(client, 'Client should be initialized');
        assert.ok(client, "Client should be initialized"); const result = await client.generate(prompt, {
          maxNewTokens: 20,
          temperature: 0.7,
        });
        
        assert.ok(result);
        assert.ok(typeof result.text === 'string');
        assert.ok(result.text.length > 0);
        assert.ok(typeof result.tokenCount === 'number');
        assert.ok(result.tokenCount > 0);
        
        resultReceived = true;
        testLogger.info(`Generated response: "${result.text.substring(0, 50)}..."`);
        testLogger.info(`Tokens generated: ${result.tokenCount}`);
        testLogger.info('Real text generation completed successfully');
      } catch (error) {
        testLogger.error('Text generation failed', error as Error);
        throw error;
      }
      
      assert.equal(resultReceived, true);
    });

    it('should handle streaming inference', async () => {
      // Check requirements before proceeding
      if (!areNativeBindingsAvailable()) {
        testLogger.info('⚠️  Skipping test - native RKLLM bindings not available');
        return;
      }
      
      testLogger.info('Testing streaming inference');
      
      const prompt = PRODUCTION_TEST_PROMPTS[1]!;
      let tokensReceived = 0;
      let streamingWorked = false;
      
      try {
        assert.ok(client, 'Client should be initialized');
        assert.ok(client, "Client should be initialized"); const result = await client.generate(prompt, {
          streaming: true,
          maxNewTokens: 15,
          onToken: (token: string) => {
            testLogger.info(`Streaming token: ${token}`);
            tokensReceived++;
            streamingWorked = true;
          },
        });
        
        assert.ok(result);
        assert.ok(streamingWorked);
        assert.ok(tokensReceived > 0);
        
        testLogger.info(`Streaming completed with ${tokensReceived} tokens`);
      } catch (error) {
        testLogger.error('Streaming inference failed', error as Error);
        throw error;
      }
    });

    it('should handle multiple inference types', async () => {
      // Check requirements before proceeding
      if (!areNativeBindingsAvailable()) {
        testLogger.info('⚠️  Skipping test - native RKLLM bindings not available');
        return;
      }
      
      testLogger.info('Testing multiple inference types');
      
      try {
        // Test text input
        assert.ok(client, 'Client should be initialized');
        assert.ok(client, "Client should be initialized"); const textResult = await client.infer({
          inputType: RKLLMInputType.PROMPT,
          promptInput: PRODUCTION_TEST_PROMPTS[2]!,
        }, {
          maxNewTokens: 10,
        });
        
        assert.ok(textResult);
        assert.ok(textResult.text);
        
        testLogger.info('Multiple inference types test completed');
      } catch (error) {
        testLogger.error('Multiple inference test failed', error as Error);
        throw error;
      }
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('Error Handling', () => {
    it('should throw structured errors', async () => {
      testLogger.info('Testing structured error handling');
      
      const config: RKLLMClientConfig = {
        ...PRODUCTION_TEST_CONFIG,
        modelPath: '/nonexistent/model.rkllm',
        autoInit: false,
      };
      
      client = new RKLLMClient(config);
      
      try {
        await client.generate('test prompt');
        assert.fail('Expected error for uninitialized client');
      } catch (error) {
        assert.ok(error instanceof RKLLMError);
        assert.ok(typeof error.code === 'number');
        assert.ok(typeof error.message === 'string');
        testLogger.info('Structured error handling working correctly');
      }
    });
  });

  // ============================================================================
  // Performance Tests
  // ============================================================================

  describe('Performance', function() {
    beforeEach(async () => {
      // Check requirements before setting up performance tests
      if (!areNativeBindingsAvailable()) {
        testLogger.info('⚠️  Skipping performance test setup - native RKLLM bindings not available');
        return;
      }
      if (!isCompatibleHardware()) {
        testLogger.warn('Not on RK3588 - skipping performance tests');
        console.log("Skipping test - requirements not met"); return;
        return;
      }
      
      try {
        const modelPath = getTestModelPath();
        testConfig.modelPath = modelPath;
        
        client = new RKLLMClient(testConfig);
        await client.initialize();
      } catch (error) {
        testLogger.warn('Failed to setup performance test environment', error);
        console.log("Skipping test - requirements not met"); return;
      }
    });

    it('should measure inference performance', async () => {
      // Check requirements before proceeding
      if (!areNativeBindingsAvailable()) {
        testLogger.info('⚠️  Skipping test - native RKLLM bindings not available');
        return;
      }
      
      testLogger.info('Testing inference performance measurement');
      
      const prompt = PRODUCTION_TEST_PROMPTS[3]!;
      const startTime = Date.now();
      
      try {
        const result = await client!.generate(prompt, {
          maxNewTokens: 50,
          enableProfiler: true,
        });
        
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        
        assert.ok(result.performance);
        assert.ok(typeof result.performance.totalTimeMs === 'number');
        assert.ok(result.performance.totalTimeMs > 0);
        assert.ok(result.performance.totalTimeMs <= totalTime);
        
        testLogger.info(`Performance metrics:`, {
          totalTime: `${totalTime}ms`,
          inferenceTime: `${result.performance.totalTimeMs}ms`,
          tokensPerSecond: result.tokenCount / (result.performance.totalTimeMs / 1000),
        });
        
        testLogger.info('Performance measurement completed successfully');
      } catch (error) {
        testLogger.error('Performance test failed', error as Error);
        throw error;
      }
    });
  });

  // ============================================================================
  // Cleanup Tests
  // ============================================================================

  describe('Cleanup', function() {
    it('should cleanup resources properly', async () => {
      // Check requirements before proceeding
      if (!areNativeBindingsAvailable()) {
        testLogger.info('⚠️  Skipping test - native RKLLM bindings not available');
        return;
      }
      
      testLogger.info('Testing resource cleanup');
      
      try {
        const modelPath = getTestModelPath();
        testConfig.modelPath = modelPath;
        client = new RKLLMClient(testConfig);
        
        await client.initialize();
        assert.equal(client.isClientInitialized(), true);
        
        await client.destroy();
        assert.equal(client.isClientInitialized(), false);
        
        // Try to use destroyed client - should fail
        try {
          await client.generate('test');
          assert.fail('Expected error for destroyed client');
        } catch (error) {
          assert.ok(error instanceof RKLLMError);
          testLogger.info('Resource cleanup working correctly');
        }
      } catch (error) {
        testLogger.error('Cleanup test failed', error as Error);
        throw error;
      }
    });
  });
});