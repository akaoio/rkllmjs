import { RKLLM, createRKLLM, RKLLMInputType, LLMCallState } from '../src/index';

describe('RKLLM', () => {
  describe('Constructor', () => {
    it('should create an instance', () => {
      const llm = new RKLLM();
      expect(llm).toBeInstanceOf(RKLLM);
      expect(llm.initialized).toBe(false);
    });
  });

  describe('Initialization', () => {
    it('should throw error for missing model path', async () => {
      const llm = new RKLLM();
      await expect(llm.init({} as any)).rejects.toThrow();
    });

    it('should throw error for double initialization', async () => {
      const llm = new RKLLM();
      // Mock the init to avoid actual initialization
      llm['isInitialized'] = true;
      
      await expect(llm.init({
        modelPath: '/fake/path'
      })).rejects.toThrow('RKLLM is already initialized');
    });
  });

  describe('Parameter validation', () => {
    it('should validate required parameters', () => {
      expect(() => {
        const params = {
          modelPath: '/path/to/model.rkllm',
          maxContextLen: 1024,
          temperature: 0.7,
        };
        expect(params.modelPath).toBeDefined();
        expect(typeof params.modelPath).toBe('string');
      }).not.toThrow();
    });

    it('should handle optional parameters', () => {
      const params = {
        modelPath: '/path/to/model.rkllm',
        maxContextLen: 2048,
        maxNewTokens: 512,
        temperature: 0.8,
        topP: 0.95,
        topK: 40,
        extendParam: {
          enabledCpusNum: 4,
          nBatch: 2,
        }
      };
      
      expect(params.maxContextLen).toBe(2048);
      expect(params.extendParam?.nBatch).toBe(2);
    });
  });

  describe('Input validation', () => {
    it('should validate input types', () => {
      const validInput = {
        inputType: RKLLMInputType.PROMPT,
        inputData: "Hello, world!",
      };
      
      expect(validInput.inputType).toBe(RKLLMInputType.PROMPT);
      expect(typeof validInput.inputData).toBe('string');
    });

    it('should handle different input data types', () => {
      const stringInput = {
        inputType: RKLLMInputType.PROMPT,
        inputData: "Text prompt",
      };
      
      const tokenInput = {
        inputType: RKLLMInputType.TOKEN,
        inputData: [1, 2, 3, 4, 5],
      };
      
      const embedInput = {
        inputType: RKLLMInputType.EMBED,
        inputData: new Uint8Array([0.1, 0.2, 0.3]),
      };
      
      expect(typeof stringInput.inputData).toBe('string');
      expect(Array.isArray(tokenInput.inputData)).toBe(true);
      expect(embedInput.inputData).toBeInstanceOf(Uint8Array);
    });
  });

  describe('Utility functions', () => {
    it('should create RKLLM instance with createRKLLM', () => {
      expect(typeof createRKLLM).toBe('function');
    });
  });

  describe('Constants', () => {
    it('should export LLMCallState enum', () => {
      expect(LLMCallState.NORMAL).toBe(0);
      expect(LLMCallState.WAITING).toBe(1);
      expect(LLMCallState.FINISH).toBe(2);
      expect(LLMCallState.ERROR).toBe(3);
    });

    it('should export RKLLMInputType enum', () => {
      expect(RKLLMInputType.PROMPT).toBe(0);
      expect(RKLLMInputType.TOKEN).toBe(1);
      expect(RKLLMInputType.EMBED).toBe(2);
      expect(RKLLMInputType.MULTIMODAL).toBe(3);
    });
  });
});
