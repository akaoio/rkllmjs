import { RKLLM, RKLLMInputType, LLMCallState } from '../dist/index.js';

async function streamingExample() {
  try {
    console.log('🚀 Initializing RKLLM for streaming...');
    
    // Check for model from environment or prompt user
    const modelPath = Bun?.env?.RKLLM_MODEL_PATH;
    if (!modelPath) {
      console.log('❌ No model path provided!');
      console.log('💡 Please set RKLLM_MODEL_PATH environment variable or download a model:');
      console.log('   bun tools.ts pull limcheekin/Qwen2.5-0.5B-Instruct-rk3588-1.1.4 Qwen2.5-0.5B-Instruct-rk3588-w8a8-opt-0-hybrid-ratio-0.0.rkllm');
      console.log('   export RKLLM_MODEL_PATH="./models/limcheekin_Qwen2.5-0.5B-Instruct-rk3588-1.1.4/Qwen2.5-0.5B-Instruct-rk3588-w8a8-opt-0-hybrid-ratio-0.0.rkllm"');
      console.log('   bun examples/streaming.js');
      return;
    }
    
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
            Bun?.write?.(Bun.stdout, result.text) || process?.stdout?.write?.(result.text);
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

// Run the example if this is the main file
if (import.meta.path === Bun?.main) {
  await streamingExample();
}

export { streamingExample };
