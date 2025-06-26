/**
 * Backend Comparison Example
 * 
 * This example compares the performance and behavior of different backends
 * (N-API vs Bun.FFI) for RKLLMJS.
 */

import { RKLLM } from '../src/index.js';
import { RKLLMInputType } from '../src/types.js';

interface BenchmarkResult {
  backend: string;
  initTime: number;
  inferenceTime: number;
  cleanupTime: number;
  success: boolean;
  error?: string;
}

async function benchmarkBackend(
  backend: 'napi' | 'ffi',
  prompt: string = "Hello, world!"
): Promise<BenchmarkResult> {
  const result: BenchmarkResult = {
    backend,
    initTime: 0,
    inferenceTime: 0,
    cleanupTime: 0,
    success: false,
  };

  try {
    // Initialization benchmark
    const initStart = performance.now();
    const llm = new RKLLM();
    await llm.init({
      modelPath: process.env.RKLLM_MODEL_PATH || './models/test.rkllm',
      maxContextLen: 1024,
      maxNewTokens: 128,
      temperature: 0.7,
    }, backend);
    result.initTime = performance.now() - initStart;

    // Inference benchmark
    const inferenceStart = performance.now();
    const response = await llm.run({
      inputType: RKLLMInputType.PROMPT,
      inputData: prompt,
    });
    result.inferenceTime = performance.now() - inferenceStart;

    // Cleanup benchmark
    const cleanupStart = performance.now();
    await llm.destroy();
    result.cleanupTime = performance.now() - cleanupStart;

    result.success = true;
    console.log(`✅ ${backend.toUpperCase()} backend completed successfully`);
    
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    console.log(`❌ ${backend.toUpperCase()} backend failed: ${result.error}`);
  }

  return result;
}

async function runComparison() {
  console.log('🏁 RKLLMJS Backend Comparison');
  console.log('=============================\n');

  const prompt = "Explain the benefits of edge AI computing in one sentence.";
  console.log(`Test prompt: "${prompt}"\n`);

  // Test both backends
  const results: BenchmarkResult[] = [];
  
  console.log('🔧 Testing N-API backend...');
  const napiResult = await benchmarkBackend('napi', prompt);
  results.push(napiResult);
  
  console.log('\n⚡ Testing Bun.FFI backend...');
  const ffiResult = await benchmarkBackend('ffi', prompt);
  results.push(ffiResult);

  // Display comparison
  console.log('\n📊 Performance Comparison');
  console.log('=========================');
  
  console.log('| Backend | Init (ms) | Inference (ms) | Cleanup (ms) | Status |');
  console.log('|---------|-----------|----------------|--------------|--------|');
  
  for (const result of results) {
    const status = result.success ? '✅ Success' : '❌ Failed';
    console.log(
      `| ${result.backend.padEnd(7)} | ${result.initTime.toFixed(2).padStart(9)} | ${result.inferenceTime.toFixed(2).padStart(14)} | ${result.cleanupTime.toFixed(2).padStart(12)} | ${status.padEnd(6)} |`
    );
  }

  // Analysis
  console.log('\n🔍 Analysis');
  console.log('===========');
  
  const successfulResults = results.filter(r => r.success);
  
  if (successfulResults.length === 2) {
    const [napi, ffi] = successfulResults;
    
    console.log('Performance comparison:');
    console.log(`- Initialization: ${ffi.initTime < napi.initTime ? 'FFI faster' : 'N-API faster'} (${Math.abs(ffi.initTime - napi.initTime).toFixed(2)}ms difference)`);
    console.log(`- Inference: ${ffi.inferenceTime < napi.inferenceTime ? 'FFI faster' : 'N-API faster'} (${Math.abs(ffi.inferenceTime - napi.inferenceTime).toFixed(2)}ms difference)`);
    console.log(`- Cleanup: ${ffi.cleanupTime < napi.cleanupTime ? 'FFI faster' : 'N-API faster'} (${Math.abs(ffi.cleanupTime - napi.cleanupTime).toFixed(2)}ms difference)`);
    
    const totalFFI = ffi.initTime + ffi.inferenceTime + ffi.cleanupTime;
    const totalNAPI = napi.initTime + napi.inferenceTime + napi.cleanupTime;
    
    console.log(`\nTotal time: ${totalFFI < totalNAPI ? 'FFI faster overall' : 'N-API faster overall'} (${Math.abs(totalFFI - totalNAPI).toFixed(2)}ms difference)`);
    
  } else {
    console.log('Cannot compare - one or both backends failed');
    
    for (const result of results) {
      if (!result.success) {
        console.log(`- ${result.backend.toUpperCase()} failed: ${result.error}`);
      }
    }
  }

  // Recommendations
  console.log('\n💡 Recommendations');
  console.log('==================');
  
  if (successfulResults.some(r => r.backend === 'ffi')) {
    console.log('✅ Bun.FFI Backend Available:');
    console.log('  - Use when running in Bun runtime');
    console.log('  - Benefits: No compilation required, direct library access');
    console.log('  - Best for: Development, rapid prototyping, Bun-native apps');
  }
  
  if (successfulResults.some(r => r.backend === 'napi')) {
    console.log('✅ N-API Backend Available:');
    console.log('  - Use when running in Node.js or need maximum compatibility');
    console.log('  - Benefits: Wide runtime support, mature ecosystem');
    console.log('  - Best for: Production deployments, Node.js apps');
  }
  
  if (successfulResults.length === 0) {
    console.log('❌ No backends available:');
    console.log('  - Check if RKLLM library is properly installed');
    console.log('  - Verify model path is correct');
    console.log('  - Ensure running on supported architecture (ARM64/ARMhf)');
  }
}

// Feature comparison
async function compareFeatures() {
  console.log('\n🔧 Feature Comparison');
  console.log('=====================');
  
  const features = [
    { name: 'Basic Inference', napi: '✅', ffi: '✅' },
    { name: 'Streaming Inference', napi: '✅', ffi: '🚧' },
    { name: 'LoRA Adapters', napi: '✅', ffi: '🚧' },
    { name: 'Prompt Caching', napi: '✅', ffi: '✅' },
    { name: 'KV Cache Management', napi: '❌', ffi: '✅' },
    { name: 'Chat Templates', napi: '❌', ffi: '✅' },
    { name: 'Function Calling', napi: '❌', ffi: '✅' },
    { name: 'Cross Attention', napi: '❌', ffi: '✅' },
    { name: 'Runtime Support', napi: 'Node.js, Bun', ffi: 'Bun only' },
    { name: 'Compilation Required', napi: '✅ Yes', ffi: '❌ No' },
  ];
  
  console.log('| Feature | N-API | Bun.FFI |');
  console.log('|---------|-------|---------|');
  
  for (const feature of features) {
    console.log(`| ${feature.name.padEnd(19)} | ${feature.napi.padEnd(5)} | ${feature.ffi.padEnd(7)} |`);
  }
  
  console.log('\nLegend: ✅ Supported, 🚧 Partial/WIP, ❌ Not supported');
}

// Main function
async function main() {
  await runComparison();
  await compareFeatures();
  
  console.log('\n🎯 Conclusion');
  console.log('=============');
  console.log('The RKLLMJS library now supports both N-API and Bun.FFI backends,');
  console.log('allowing you to choose the best option for your specific use case.');
  console.log('The library automatically detects the best available backend,');
  console.log('but you can also explicitly specify your preference.');
}

// Run if called directly
if (import.meta.main) {
  main().catch(console.error);
}

export { runComparison, compareFeatures, benchmarkBackend };