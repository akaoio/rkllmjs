#!/usr/bin/env bun

/**
 * Test script for RKLLMJS Model Manager
 * This script tests the model management functionality
 */

import { RKLLMModelManager } from './tools.js';

console.log('🧪 Testing RKLLMJS Model Manager');
console.log('='.repeat(50));

async function testModelManager() {
  const manager = new RKLLMModelManager();
  
  try {
    // Test listing models
    console.log('\n📋 Test 1: List models');
    const models = await manager.listModels();
    console.log(`Found ${models.length} models`);
    
    // Test getting first model path
    console.log('\n📋 Test 2: Get first model path');
    const firstModel = await manager.getFirstModelPath();
    if (firstModel) {
      console.log(`✅ First model: ${firstModel}`);
    } else {
      console.log('⚠️  No models found');
      console.log('💡 You can download a model with:');
      console.log('   bun tools.ts pull microsoft/DialoGPT-small pytorch_model.bin');
    }
    
    console.log('\n✅ Model manager tests completed');
    
  } catch (error) {
    console.error(`❌ Test failed: ${error}`);
  }
}

if (import.meta.main) {
  await testModelManager();
}

export { testModelManager };
