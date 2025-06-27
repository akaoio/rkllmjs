import { RKLLM, RKLLMInputType, LLMCallState } from '../src/index.js';
import { RKLLMModelManager } from '../tools.js';
import { 
  EXAMPLE_MODEL,
  RUNTIME_CONFIGS,
  EXAMPLE_PROMPTS,
  DOWNLOAD_INSTRUCTIONS
} from './example-constants.js';

async function streamingExample() {
  try {
    console.log('🚀 Initializing RKLLM for streaming...');
    
    // Get model path from model manager
    const modelManager = new RKLLMModelManager();
    const modelPath = await modelManager.getFirstModelPath();
    
    if (!modelPath) {
      console.log('❌ No models found! Please download a model first:');
      console.log(`   ${DOWNLOAD_INSTRUCTIONS.COMMAND}`);
      console.log('   bun tools.ts list  # to see available models');
      return;
    }
    
    console.log(`📂 Using model: ${modelPath}`);
    
    const llm = new RKLLM();
    const config = RUNTIME_CONFIGS.CREATIVE;
    await llm.init({
      modelPath,
      maxContextLen: config.maxContextLen,
      maxNewTokens: config.maxNewTokens,
      temperature: config.temperature,
      isAsync: true, // Enable async mode for streaming
    });
    
    const prompt = EXAMPLE_PROMPTS.STORY;
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
