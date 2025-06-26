import { RKLLM, RKLLMInputType, LLMCallState } from '../src/index.js';
import { RKLLMModelManager } from '../tools.js';

async function streamingExample() {
  try {
    console.log('🚀 Initializing RKLLM for streaming...');
    
    // Get model path from model manager
    const modelManager = new RKLLMModelManager();
    const modelPath = await modelManager.getFirstModelPath();
    
    if (!modelPath) {
      console.log('❌ No models found! Please download a model first:');
      console.log('   bun tools.ts pull limcheekin/Qwen2.5-0.5B-Instruct-rk3588-1.1.4 Qwen2.5-0.5B-Instruct-rk3588-w8a8-opt-0-hybrid-ratio-0.0.rkllm');
      console.log('   bun tools.ts list  # to see available models');
      return;
    }
    
    console.log(`📂 Using model: ${modelPath}`);
    
    const llm = new RKLLM();
    await llm.init({
      modelPath,
      maxContextLen: 2048,
      maxNewTokens: 256,
      temperature: 0.7,
      isAsync: true, // Enable async mode for streaming
    });
    
    const prompt = "Write a short story about a robot learning to paint:";
    console.log(`💬 Prompt: ${prompt}`);
    console.log('🎯 Streaming response:');
    
    let fullResponse = '';
    
    // Run streaming inference
    await llm.runStream(
      {
        inputType: RKLLMInputType.PROMPT,
        inputData: prompt,
      },
      {
        callback: (result, userdata) => {
          if (result.text) {
            process.stdout.write(result.text);
            fullResponse += result.text;
          }
          
          if (result.state === LLMCallState.FINISH) {
            console.log('\n\n✅ Streaming completed');
            console.log(`📝 Full response length: ${fullResponse.length} characters`);
          }
        },
        userdata: { startTime: Date.now() }
      }
    );
    
    await llm.destroy();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the example
if (import.meta.main) {
  await streamingExample();
}

export { streamingExample };
