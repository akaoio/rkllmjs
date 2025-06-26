import { RKLLM, RKLLMInputType } from '../dist/index.js';

async function basicExample() {
  try {
    console.log('🚀 Initializing RKLLM...');
    
    // Check for model from environment or prompt user
    const modelPath = Bun?.env?.RKLLM_MODEL_PATH;
    if (!modelPath) {
      console.log('❌ No model path provided!');
      console.log('💡 Please set RKLLM_MODEL_PATH environment variable or download a model:');
      console.log('   bun tools.ts pull microsoft/DialoGPT-small pytorch_model.bin');
      console.log('   export RKLLM_MODEL_PATH="./models/microsoft_DialoGPT-small/pytorch_model.bin"');
      console.log('   bun examples/basic.js');
      return;
    }
    
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
    console.error('❌ Error:', error.message);
  }
}

// Run the example if this is the main file
if (import.meta.path === Bun?.main) {
  await basicExample();
}

export { basicExample };
