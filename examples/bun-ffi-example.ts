/**
 * Example: Using RKLLMJS with Bun.FFI
 * 
 * This example demonstrates how to use the Bun.FFI backend for RKLLMJS.
 * The FFI backend provides direct access to the native library without
 * requiring compilation of a C++ addon.
 */

import { RKLLM, createRKLLM } from '../src/index.js';
import { RKLLMInputType } from '../src/types.js';

async function runBunFFIExample() {
  console.log('🚀 RKLLMJS Bun.FFI Example');
  console.log('==========================\n');

  try {
    // Create RKLLM instance (now FFI-only)
    console.log('📦 Initializing RKLLM with Bun.FFI backend...');
    
    const llm = new RKLLM();
    await llm.init({
      modelPath: process.env.RKLLM_MODEL_PATH || './models/qwen-1.5b.rkllm',
      maxContextLen: 2048,
      maxNewTokens: 256,
      temperature: 0.7,
      topP: 0.9,
      topK: 50,
    }); // FFI backend is used automatically

    console.log(`✅ Initialized with ${llm.backendType} backend\n`);

    // Example 1: Simple text generation
    console.log('💬 Example 1: Simple Text Generation');
    console.log('------------------------------------');
    
    const result = await llm.run({
      inputType: RKLLMInputType.PROMPT,
      inputData: "Hello! Can you tell me about Rockchip NPUs?",
    });

    console.log('Input:', "Hello! Can you tell me about Rockchip NPUs?");
    console.log('Output:', result.text);
    console.log('State:', result.state);
    console.log();

    // Example 2: Streaming generation
    console.log('🌊 Example 2: Streaming Text Generation');
    console.log('---------------------------------------');
    
    let streamedText = '';
    await llm.runStream({
      inputType: RKLLMInputType.PROMPT,
      inputData: "Write a short poem about AI and edge computing:",
    }, {
      callback: (result) => {
        if (result.text) {
          streamedText += result.text;
          process.stdout.write(result.text);
        }
      }
    });
    
    console.log('\n');
    console.log('Complete streamed text:', streamedText);
    console.log();

    // Example 3: Multiple conversations
    console.log('💭 Example 3: Multiple Conversations');
    console.log('-----------------------------------');
    
    const questions = [
      "What is the RK3588 chip?",
      "How does NPU acceleration work?",
      "What are the benefits of edge AI?"
    ];

    for (const [index, question] of questions.entries()) {
      console.log(`Q${index + 1}: ${question}`);
      
      const answer = await llm.run({
        inputType: RKLLMInputType.PROMPT,
        inputData: question,
      });
      
      console.log(`A${index + 1}: ${answer.text}\n`);
    }

    // Clean up
    console.log('🧹 Cleaning up...');
    await llm.destroy();
    console.log('✅ RKLLM instance destroyed');

  } catch (error) {
    console.error('❌ Error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('FFI')) {
        console.log('\n💡 Tip: Make sure you are running this with Bun:');
        console.log('   bun run examples/bun-ffi-example.ts');
        console.log('\n💡 Also ensure the RKLLM library is available:');
        console.log('   - On ARM64: ./libs/rkllm/aarch64/librkllmrt.so');
        console.log('   - On ARMhf: ./libs/rkllm/armhf/librkllmrt.so');
      }
      
      if (error.message.includes('model')) {
        console.log('\n💡 Tip: Set the model path:');
        console.log('   export RKLLM_MODEL_PATH=/path/to/your/model.rkllm');
      }
    }
  }
}

// Utility function to demonstrate FFI functionality
async function demonstrateFFIOnlyUsage() {
  console.log('🔍 FFI-Only Demo');
  console.log('================\n');

  console.log('Testing FFI backend...');
  
  try {
    const llm = new RKLLM();
    await llm.init({
      modelPath: process.env.RKLLM_MODEL_PATH || './models/test.rkllm',
      maxContextLen: 512,
      maxNewTokens: 50,
    });
    
    console.log(`✅ Success with ${llm.backendType} backend`);
    await llm.destroy();
    
  } catch (error) {
    console.log(`❌ Failed: ${error instanceof Error ? error.message : error}`);
  }
  
  console.log();
}

// Utility function showing FFI-specific features
async function demonstrateFFIFeatures() {
  console.log('⚡ Bun.FFI Specific Features');
  console.log('===========================\n');

  try {
    // Import FFI utilities directly
    const { initializeFFI, isFFIAvailable, isBunRuntime } = await import('../src/ffi/rkllm-ffi.js');
    
    console.log('Runtime Detection:');
    console.log(`- Running in Bun: ${isBunRuntime()}`);
    console.log(`- FFI Available: ${isFFIAvailable()}`);
    console.log();
    
    if (isBunRuntime()) {
      console.log('Initializing FFI manually...');
      const success = initializeFFI();
      console.log(`- FFI Initialization: ${success ? '✅ Success' : '❌ Failed'}`);
      console.log();
      
      if (success) {
        console.log('✨ FFI is ready for direct library access!');
        console.log('This provides:');
        console.log('- No C++ compilation required');
        console.log('- Direct access to native functions');
        console.log('- Potentially better performance');
        console.log('- Easier debugging and profiling');
      }
    } else {
      console.log('⚠️  Not running in Bun - FFI features unavailable');
    }
    
  } catch (error) {
    console.error('❌ Error demonstrating FFI features:', error);
  }
}

// Main execution
async function main() {
  console.log('🎯 RKLLMJS Bun.FFI Complete Example\n');
  
  // Run all demonstrations
  await demonstrateFFIOnlyUsage();
  await demonstrateFFIFeatures();
  await runBunFFIExample();
}

// Run if called directly
if (import.meta.main) {
  main().catch(console.error);
}

export { runBunFFIExample, demonstrateFFIOnlyUsage, demonstrateFFIFeatures };