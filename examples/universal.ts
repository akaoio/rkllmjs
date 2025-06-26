/**
 * Universal Runtime Example
 * Demonstrates RKLLMJS working across Bun, Node.js, and Deno
 */

import { 
  RKLLM, 
  detectRuntime, 
  getFFIInfo, 
  validateRuntimeCompatibility,
  RKLLMInputType 
} from '../src/index.js';

async function universalExample() {
  console.log('🌍 RKLLMJS Universal Runtime Example\n');

  // Step 1: Runtime Detection
  console.log('📋 Step 1: Runtime Detection');
  const runtime = detectRuntime();
  const info = getFFIInfo();
  
  console.log(`  Running on: ${runtime.name} ${runtime.version || ''}`);
  console.log(`  FFI Support: ${runtime.ffiSupported ? '✅' : '❌'}`);
  console.log(`  Library Extension: .${info.libraryExtension}`);
  
  // Step 2: Compatibility Check
  console.log('\n🔍 Step 2: Compatibility Check');
  const validation = validateRuntimeCompatibility();
  
  if (validation.compatible) {
    console.log('  Status: ✅ Compatible');
  } else {
    console.log('  Status: ⚠️  Issues found:');
    validation.issues.forEach(issue => console.log(`    - ${issue}`));
    console.log('\n  Please install FFI dependencies for your runtime.');
    return;
  }

  // Step 3: Initialize RKLLM
  console.log('\n🤖 Step 3: Initialize RKLLM');
  const llm = new RKLLM();
  
  console.log(`  Created RKLLM instance using ${llm.runtimeName} adapter`);
  
  try {
    // Note: This will fail without a real model file
    await llm.init({
      modelPath: process.env.RKLLM_MODEL_PATH || './models/qwen-0.5b.rkllm',
      maxContextLen: 2048,
      maxNewTokens: 256,
      temperature: 0.7,
      topP: 0.9,
      topK: 50,
      // Runtime-specific optimizations
      extendParam: runtime.name === 'bun' ? {
        enabledCpusNum: 8,
        enabledCpusMask: 0xFF,
        nBatch: 4,
        useCrossAttn: true
      } : {
        enabledCpusNum: 4,
        enabledCpusMask: 0xF,
        nBatch: 2
      }
    });
    
    console.log('  ✅ RKLLM initialized successfully');
    console.log(`  Backend: ${llm.backendType}`);
    console.log(`  Runtime: ${llm.runtimeName}`);
    
    // Step 4: Run Inference
    console.log('\n💭 Step 4: Run Inference');
    
    const prompt = "Hello! Can you tell me about Rockchip NPUs?";
    console.log(`  Prompt: "${prompt}"`);
    
    const result = await llm.run({
      inputType: RKLLMInputType.PROMPT,
      inputData: prompt,
    });
    
    console.log(`  Response: "${result.text}"`);
    console.log(`  State: ${result.state}`);
    console.log(`  Tokens: ${result.tokens?.length || 0}`);
    
    // Step 5: Advanced Features
    console.log('\n🚀 Step 5: Advanced Features');
    
    // Chat template
    await llm.setChatTemplate(
      'You are a helpful AI assistant.',
      'Human: ',
      '\nAssistant: '
    );
    console.log('  ✅ Chat template configured');
    
    // Context management
    const contextSize = await llm.getContextLength();
    console.log(`  📊 Context size: ${contextSize.join(', ')}`);
    
    // Streaming example
    console.log('\n  🔄 Testing streaming...');
    let streamedTokens = 0;
    
    await llm.runStream(
      {
        inputType: RKLLMInputType.PROMPT,
        inputData: "Count from 1 to 5:"
      },
      {
        callback: (result, userdata, state) => {
          streamedTokens++;
          console.log(`    Stream token ${streamedTokens}: "${result.text}"`);
          return 0; // Continue
        }
      }
    );
    
    console.log(`  ✅ Streaming completed (${streamedTokens} tokens)`);
    
    // Step 6: Cleanup
    console.log('\n🧹 Step 6: Cleanup');
    await llm.destroy();
    console.log('  ✅ Resources cleaned up');
    
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    
    if (error.message.includes('model')) {
      console.log('\n💡 Model Loading Help:');
      console.log('  1. Download a model file:');
      console.log('     bun tools.ts pull limcheekin/Qwen2.5-0.5B-Instruct-rk3588-1.1.4 Qwen2.5-0.5B-Instruct-rk3588-w8a8-opt-0-hybrid-ratio-0.0.rkllm');
      console.log('  2. Set model path:');
      console.log('     export RKLLM_MODEL_PATH=./models/your-model.rkllm');
      console.log('  3. Run this example again');
    } else if (error.message.includes('library')) {
      console.log('\n💡 Library Loading Help:');
      console.log('  1. Ensure RKLLM libraries are in ./libs/ directory');
      console.log('  2. Check that librkllmrt.so exists for your architecture');
      console.log('  3. Verify file permissions');
    }
  }
  
  // Performance Summary
  console.log('\n📊 Runtime Performance Notes:');
  switch (runtime.name) {
    case 'bun':
      console.log('  🚀 Bun: Optimal performance with native FFI');
      break;
    case 'node':
      console.log('  ⚡ Node.js: High performance with koffi/ffi-napi');
      break;
    case 'deno':
      console.log('  🦕 Deno: High performance with native FFI');
      break;
    default:
      console.log('  ❓ Unknown runtime - limited support');
  }
}

// Export for use as module
export { universalExample };

// Run if called directly
if (import.meta.main || process.argv[1] === new URL(import.meta.url).pathname) {
  universalExample().catch(error => {
    console.error('❌ Example failed:', error);
    process.exit(1);
  });
}