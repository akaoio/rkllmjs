import { RKLLM, RKLLMInputType } from '../src/index.js';
import { RKLLMModelManager } from '../tools.js';

async function basicExample(): Promise<void> {
  try {
    console.log('🚀 Initializing RKLLM...');
    
    // Get model path from model manager
    const modelManager = new RKLLMModelManager();
    let modelPath = await modelManager.getFirstModelPath();
    
    if (!modelPath) {
      console.log('❌ No models found! Please download a model first:');
      console.log('   bun tools.ts pull microsoft/DialoGPT-small pytorch_model.bin');
      console.log('   bun tools.ts list  # to see available models');
      return;
    }
    
    console.log(`📂 Using model: ${modelPath}`);
    
    // Create and initialize RKLLM instance
    const llm = new RKLLM();
    await llm.init({
      modelPath,
      maxContextLen: 2048,
      maxNewTokens: 256,
      temperature: 0.7,
      topP: 0.9,
      topK: 50,
    });
    
    console.log('✅ RKLLM initialized successfully');
    
    // Run inference
    const prompt = "Hello, how are you today?";
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
