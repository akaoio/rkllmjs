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
import { 
  EXAMPLE_MODEL,
  RUNTIME_CONFIGS,
  EXAMPLE_PROMPTS,
  DOWNLOAD_INSTRUCTIONS,
  ENV_VARS
} from './example-constants.js';

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
    const config = RUNTIME_CONFIGS[runtime.name.toUpperCase()] || RUNTIME_CONFIGS.NODE;
    await llm.init({
      modelPath: process.env[ENV_VARS.MODEL_PATH] || EXAMPLE_MODEL.PATH,
      maxContextLen: config.maxContextLen,
      maxNewTokens: config.maxNewTokens,
      temperature: config.temperature,
      topP: config.topP,
      topK: config.topK,
      // Runtime-specific optimizations
      extendParam: config.extendParam
    });
    
    console.log('  ✅ RKLLM initialized successfully');
    console.log(`  Backend: ${llm.backendType}`);
    console.log(`  Runtime: ${llm.runtimeName}`);
    
    // Step 4: Run Inference
    console.log('\n💭 Step 4: Run Inference');
    
    const prompt = EXAMPLE_PROMPTS.QUESTION;
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
        inputData: EXAMPLE_PROMPTS.CREATIVE
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
      console.log(DOWNLOAD_INSTRUCTIONS.HELP_TEXT);
    } else if (error.message.includes('library')) {
      console.log(DOWNLOAD_INSTRUCTIONS.LIBRARY_HELP);
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