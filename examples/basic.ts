import { RKLLM, RKLLMInputType } from '../src/index.js';
import { RKLLMModelManager } from '../tools.js';
import { 
  EXAMPLE_MODEL,
  RUNTIME_CONFIGS,
  EXAMPLE_PROMPTS,
  DOWNLOAD_INSTRUCTIONS
} from './example-constants.js';

async function basicExample(): Promise<void> {
  try {
    console.log('🚀 Initializing RKLLM...');
    
    // Get model path from model manager
    const modelManager = new RKLLMModelManager();
    let modelPath = await modelManager.getFirstModelPath();
    
    if (!modelPath) {
      console.log('❌ No models found! Please download a model first:');
      console.log(`   ${DOWNLOAD_INSTRUCTIONS.COMMAND}`);
      console.log('   bun tools.ts list  # to see available models');
      return;
    }
    
    console.log(`📂 Using model: ${modelPath}`);
    
    // Create and initialize RKLLM instance
    const llm = new RKLLM();
    const config = RUNTIME_CONFIGS.BALANCED;
    await llm.init({
      modelPath,
      maxContextLen: config.maxContextLen,
      maxNewTokens: config.maxNewTokens,
      temperature: config.temperature,
      topP: config.topP,
      topK: config.topK,
    });
    
    console.log('✅ RKLLM initialized successfully');
    
    // Run inference
    const prompt = EXAMPLE_PROMPTS.GREETING;
    console.log(`💬 Prompt: ${prompt}`);
    
    const result = await llm.run({
      inputType: RKLLMInputType.PROMPT,
      inputData: prompt,
    });
    
    console.log(`🤖 Response: ${result.text}`);
    console.log(`📊 State: ${result.state}`);
    
    // Clean up
    await llm.destroy();
    console.log('🧹 Cleanup completed');
    
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
  }
}

export { basicExample };
