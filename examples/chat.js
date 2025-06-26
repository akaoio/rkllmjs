const { createRKLLM, RKLLMInputType } = require('../dist/index.js');

async function multiTurnChatExample() {
  try {
    console.log('🚀 Initializing RKLLM for multi-turn chat...');
    
    // Check for required model path
    if (!process.env.RKLLM_MODEL_PATH) {
      console.error('❌ Error: RKLLM_MODEL_PATH environment variable is required');
      console.log('💡 Set it with: export RKLLM_MODEL_PATH="./models/your-model.rkllm"');
      console.log('💡 Or download a model first: bun run model:download <url>');
      process.exit(1);
    }
    
    // Use convenience function to create and initialize
    const llm = await createRKLLM({
      modelPath: process.env.RKLLM_MODEL_PATH,
      maxContextLen: 4096,
      maxNewTokens: 512,
      temperature: 0.8,
      topP: 0.95,
      repeatPenalty: 1.1,
    });
    
    console.log('✅ Ready for conversation!');
    
    const conversation = [
      "What is the capital of France?",
      "Tell me more about its history.",
      "What are some must-see attractions there?",
      "How is the weather in December?"
    ];
    
    for (let i = 0; i < conversation.length; i++) {
      const userMessage = conversation[i];
      console.log(`\n👤 User: ${userMessage}`);
      
      const result = await llm.run({
        inputType: RKLLMInputType.PROMPT,
        inputData: userMessage,
      });
      
      console.log(`🤖 Assistant: ${result.text}`);
      
      // Check context length periodically
      const contextLen = llm.getContextLength();
      console.log(`📏 Current context length: ${contextLen}`);
      
      // Clear context if getting too long (optional)
      if (contextLen > 3000) {
        console.log('🧹 Clearing context to prevent overflow...');
        await llm.clearContext();
      }
    }
    
    await llm.destroy();
    console.log('\n💬 Conversation ended');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the example
if (require.main === module) {
  multiTurnChatExample();
}

module.exports = { multiTurnChatExample };
