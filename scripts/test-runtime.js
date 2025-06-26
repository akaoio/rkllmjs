#!/usr/bin/env node

/**
 * Universal Runtime Test Script
 * Tests RKLLMJS functionality across different JavaScript runtimes
 */

import { 
  detectRuntime, 
  getFFIInfo, 
  validateRuntimeCompatibility,
  RKLLM 
} from '../src/index.js';

async function main() {
  console.log('🚀 RKLLMJS Universal Runtime Test\n');

  // Runtime Detection
  console.log('📋 Runtime Information:');
  const runtime = detectRuntime();
  console.log(`  Runtime: ${runtime.name}`);
  console.log(`  Version: ${runtime.version || 'unknown'}`);
  console.log(`  FFI Supported: ${runtime.ffiSupported}`);

  const info = getFFIInfo();
  console.log(`  Library Extension: ${info.libraryExtension}`);
  console.log(`  Platform: ${info.platform || 'unknown'}`);

  // Compatibility Check
  console.log('\n🔍 Compatibility Check:');
  const validation = validateRuntimeCompatibility();
  console.log(`  Compatible: ${validation.compatible}`);
  if (!validation.compatible) {
    console.log('  Issues:');
    validation.issues.forEach(issue => console.log(`    - ${issue}`));
  }

  // RKLLM Basic Test
  console.log('\n🤖 RKLLM API Test:');
  try {
    const llm = new RKLLM();
    console.log(`  Instance created: ✅`);
    console.log(`  Initial state: ${llm.initialized ? 'initialized' : 'uninitialized'}`);
    console.log(`  Backend type: ${llm.backendType || 'none'}`);
    console.log(`  Runtime name: ${llm.runtimeName}`);

    // Test initialization (will fail without model, but that's expected)
    try {
      await llm.init({
        modelPath: './test-model.rkllm',
        maxContextLen: 1024,
      });
      console.log(`  Initialization: ✅ (unexpected success)`);
    } catch (error) {
      console.log(`  Initialization: ⚠️  (expected failure - no model)`);
      console.log(`    Error: ${error.message.slice(0, 80)}...`);
    }

    await llm.destroy();
    console.log(`  Cleanup: ✅`);

  } catch (error) {
    console.log(`  RKLLM test failed: ❌`);
    console.log(`    Error: ${error.message}`);
  }

  // Summary
  console.log('\n📊 Test Summary:');
  if (runtime.ffiSupported && validation.compatible) {
    console.log('  Status: ✅ Ready for RKLLM usage');
    console.log('  Recommendation: Install model files and start using RKLLM');
  } else {
    console.log('  Status: ⚠️  Runtime setup needed');
    console.log('  Recommendation: Install FFI dependencies for your runtime');
    
    if (runtime.name === 'node') {
      console.log('    Node.js: npm install koffi');
    } else if (runtime.name === 'deno') {
      console.log('    Deno: Run with --allow-ffi --allow-read flags');
    }
  }

  console.log('\n🎯 Next Steps:');
  console.log('  1. Download RKLLM model files');
  console.log('  2. Check examples in ./examples/ directory');
  console.log('  3. Read docs/multi-runtime-guide.md for details');
}

// Run the test
main().catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});