import { RKLLM, RKLLMInputType, LLMCallState } from '../dist/index.js';

async function streamingExample() {
  try {
    console.log('🚀 Initializing RKLLM for streaming...');
    
    const llm = new RKLLM();
    await llm.init({
      modelPath: Bun?.env?.RKLLM_MODEL_PATH || '/path/to/your/model.rkllm',
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
