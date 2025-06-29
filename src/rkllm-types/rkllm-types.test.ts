/**
 * Unit tests for RKLLM TypeScript types
 * Tests TypeScript interfaces, enums, and type safety
 */

import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { TestLogger } from '../test-logger/test-logger.js';
import {
  // Enums and Constants
  CPU_CORES,
  LLMCallState,
  RKLLMInputType,
  RKLLMInferMode,
  RKLLMStatusCode,
  
  // Interfaces
  type RKLLMExtendParam,
  type RKLLMParam,
  type RKLLMInput,
  type RKLLMResult,
  type LLMResultCallback,
  type DefaultParamOptions,
  type ChatTemplateConfig,
  type FunctionToolsConfig,
  
  // Error class
  RKLLMError,
} from './rkllm-types.js';

// Initialize test logger
const testLogger = new TestLogger('rkllm-types');

describe('RKLLM Types', () => {
  // ============================================================================
  // Constants and Enums Tests
  // ============================================================================
  
  describe('CPU_CORES constants', () => {
    it('should have correct CPU core bitmask values', () => {
      testLogger.info('Testing CPU core constants');
      
      assert.equal(CPU_CORES.CPU0, 0x01);
      assert.equal(CPU_CORES.CPU1, 0x02);
      assert.equal(CPU_CORES.CPU2, 0x04);
      assert.equal(CPU_CORES.CPU3, 0x08);
      assert.equal(CPU_CORES.CPU4, 0x10);
      assert.equal(CPU_CORES.CPU5, 0x20);
      assert.equal(CPU_CORES.CPU6, 0x40);
      assert.equal(CPU_CORES.CPU7, 0x80);
      
      testLogger.info('CPU core constants validation completed');
    });
  });

  describe('LLMCallState enum', () => {
    it('should have correct state values', () => {
      testLogger.info('Testing LLMCallState enum values');
      
      assert.equal(LLMCallState.NORMAL, 0);
      assert.equal(LLMCallState.WAITING, 1);
      assert.equal(LLMCallState.FINISH, 2);
      assert.equal(LLMCallState.ERROR, 3);
      
      testLogger.info('LLMCallState enum validation completed');
    });
  });

  describe('RKLLMInputType enum', () => {
    it('should have correct input type values', () => {
      testLogger.info('Testing RKLLMInputType enum values');
      
      assert.equal(RKLLMInputType.PROMPT, 0);
      assert.equal(RKLLMInputType.TOKEN, 1);
      assert.equal(RKLLMInputType.EMBED, 2);
      assert.equal(RKLLMInputType.MULTIMODAL, 3);
      
      testLogger.info('RKLLMInputType enum validation completed');
    });
  });

  describe('RKLLMInferMode enum', () => {
    it('should have correct inference mode values', () => {
      testLogger.info('Testing RKLLMInferMode enum values');
      
      assert.equal(RKLLMInferMode.GENERATE, 0);
      assert.equal(RKLLMInferMode.GET_LAST_HIDDEN_LAYER, 1);
      assert.equal(RKLLMInferMode.GET_LOGITS, 2);
      
      testLogger.info('RKLLMInferMode enum validation completed');
    });
  });

  describe('RKLLMStatusCode enum', () => {
    it('should have correct status code values', () => {
      testLogger.info('Testing RKLLMStatusCode enum values');
      
      assert.equal(RKLLMStatusCode.SUCCESS, 0);
      assert.equal(RKLLMStatusCode.ERROR_UNKNOWN, -1);
      assert.equal(RKLLMStatusCode.ERROR_INVALID_HANDLE, -2);
      
      testLogger.info('RKLLMStatusCode enum validation completed');
    });
  });

  // ============================================================================
  // Interface Structure Tests
  // ============================================================================

  describe('RKLLMExtendParam interface', () => {
    it('should accept valid extend parameters', () => {
      testLogger.info('Testing RKLLMExtendParam interface');
      
      const extendParam: RKLLMExtendParam = {
        baseDomainId: 0,
        embedFlash: false,
        enabledCpusNum: 4,
        enabledCpusMask: CPU_CORES.CPU0 | CPU_CORES.CPU1 | CPU_CORES.CPU2 | CPU_CORES.CPU3,
        nBatch: 1,
        useCrossAttn: false,
      };
      
      assert.equal(extendParam.baseDomainId, 0);
      assert.equal(extendParam.embedFlash, false);
      assert.equal(extendParam.enabledCpusNum, 4);
      assert.equal(extendParam.nBatch, 1);
      assert.equal(extendParam.useCrossAttn, false);
      
      testLogger.info('RKLLMExtendParam validation completed');
    });
  });

  describe('RKLLMParam interface', () => {
    it('should accept valid main parameters', () => {
      testLogger.info('Testing RKLLMParam interface');
      
      const param: RKLLMParam = {
        modelPath: '/path/to/model.rkllm',
        maxContextLen: 4096,
        maxNewTokens: 512,
        topK: 40,
        nKeep: 0,
        topP: 0.9,
        temperature: 0.7,
        repeatPenalty: 1.1,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0,
        mirostat: 0,
        mirostatTau: 5.0,
        mirostatEta: 0.1,
        skipSpecialToken: false,
        isAsync: false,
        extendParam: {
          baseDomainId: 0,
          embedFlash: false,
          enabledCpusNum: 4,
          enabledCpusMask: 0x0F,
          nBatch: 1,
          useCrossAttn: false,
        },
      };
      
      assert.equal(param.modelPath, '/path/to/model.rkllm');
      assert.equal(param.maxContextLen, 4096);
      assert.equal(param.maxNewTokens, 512);
      assert.equal(param.temperature, 0.7);
      
      testLogger.info('RKLLMParam validation completed');
    });
  });

  // ============================================================================
  // Input Structure Tests
  // ============================================================================

  describe('RKLLMInput interface', () => {
    it('should accept prompt input', () => {
      testLogger.info('Testing RKLLMInput with prompt input');
      
      const input: RKLLMInput = {
        role: 'user',
        enableThinking: false,
        inputType: RKLLMInputType.PROMPT,
        promptInput: 'Hello, how are you?',
      };
      
      assert.equal(input.role, 'user');
      assert.equal(input.inputType, RKLLMInputType.PROMPT);
      assert.equal(input.promptInput, 'Hello, how are you?');
      
      testLogger.info('Prompt input validation completed');
    });

    it('should accept token input', () => {
      testLogger.info('Testing RKLLMInput with token input');
      
      const tokenIds = new Int32Array([1, 2, 3, 4, 5]);
      const input: RKLLMInput = {
        inputType: RKLLMInputType.TOKEN,
        tokenInput: {
          inputIds: tokenIds,
          nTokens: 5,
        },
      };
      
      assert.equal(input.inputType, RKLLMInputType.TOKEN);
      assert.equal(input.tokenInput?.nTokens, 5);
      assert.deepEqual(input.tokenInput?.inputIds, tokenIds);
      
      testLogger.info('Token input validation completed');
    });
  });

  // ============================================================================
  // Result Structure Tests
  // ============================================================================

  describe('RKLLMResult interface', () => {
    it('should accept complete result with all fields', () => {
      testLogger.info('Testing RKLLMResult with all fields');
      
      const result: RKLLMResult = {
        text: 'Generated response',
        tokenId: 42,
        perf: {
          prefillTimeMs: 100.5,
          prefillTokens: 10,
          generateTimeMs: 50.2,
          generateTokens: 5,
          memoryUsageMb: 1024.0,
        },
      };
      
      assert.equal(result.text, 'Generated response');
      assert.equal(result.tokenId, 42);
      assert.equal(result.perf?.prefillTimeMs, 100.5);
      
      testLogger.info('RKLLMResult validation completed');
    });
  });

  // ============================================================================
  // Callback Type Tests
  // ============================================================================

  describe('LLMResultCallback type', () => {
    it('should accept synchronous callback', () => {
      testLogger.info('Testing synchronous LLMResultCallback');
      
      const callback: LLMResultCallback = (_result: RKLLMResult, state: LLMCallState) => {
        return state === LLMCallState.FINISH ? 0 : 1;
      };
      
      const result: RKLLMResult = { text: 'Test response' };
      const returnValue = callback(result, LLMCallState.FINISH);
      
      assert.equal(returnValue, 0);
      testLogger.info('Synchronous callback validation completed');
    });

    it('should accept asynchronous callback', async () => {
      testLogger.info('Testing asynchronous LLMResultCallback');
      
      const callback: LLMResultCallback = async (_result: RKLLMResult, state: LLMCallState) => {
        await Promise.resolve(); // Simulate async work
        return state === LLMCallState.ERROR ? 1 : 0;
      };
      
      const result: RKLLMResult = { text: 'Test response' };
      const returnValue = await callback(result, LLMCallState.ERROR);
      
      assert.equal(returnValue, 1);
      testLogger.info('Asynchronous callback validation completed');
    });
  });

  // ============================================================================
  // Error Class Tests
  // ============================================================================

  describe('RKLLMError class', () => {
    it('should create error with message and code', () => {
      testLogger.info('Testing RKLLMError creation');
      
      const error = new RKLLMError('Test error message', RKLLMStatusCode.ERROR_INVALID_PARAM, 'test context');
      
      assert.equal(error.message, 'Test error message');
      assert.equal(error.code, RKLLMStatusCode.ERROR_INVALID_PARAM);
      assert.equal(error.context, 'test context');
      assert.equal(error.name, 'RKLLMError');
      assert.ok(error instanceof Error);
      
      testLogger.info('RKLLMError validation completed');
    });
  });

  // ============================================================================
  // Utility Type Tests
  // ============================================================================

  describe('Utility types', () => {
    it('should accept DefaultParamOptions', () => {
      testLogger.info('Testing DefaultParamOptions type');
      
      const options: DefaultParamOptions = {
        modelPath: '/path/to/model.rkllm',
        maxContextLen: 4096,
        maxNewTokens: 512,
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
      };
      
      assert.equal(options.modelPath, '/path/to/model.rkllm');
      assert.equal(options.maxContextLen, 4096);
      
      testLogger.info('DefaultParamOptions validation completed');
    });

    it('should accept ChatTemplateConfig', () => {
      testLogger.info('Testing ChatTemplateConfig type');
      
      const config: ChatTemplateConfig = {
        systemPrompt: 'You are a helpful assistant.',
        promptPrefix: 'User: ',
        promptPostfix: '\nAssistant: ',
      };
      
      assert.equal(config.systemPrompt, 'You are a helpful assistant.');
      assert.equal(config.promptPrefix, 'User: ');
      
      testLogger.info('ChatTemplateConfig validation completed');
    });

    it('should accept FunctionToolsConfig', () => {
      testLogger.info('Testing FunctionToolsConfig type');
      
      const config: FunctionToolsConfig = {
        systemPrompt: 'You can call functions.',
        tools: '{"function": {"name": "get_weather", "description": "Get weather"}}',
        toolResponseStr: '<tool_response>',
      };
      
      assert.equal(config.systemPrompt, 'You can call functions.');
      assert.equal(config.toolResponseStr, '<tool_response>');
      
      testLogger.info('FunctionToolsConfig validation completed');
    });
  });
});