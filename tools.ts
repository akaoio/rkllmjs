#!/usr/bin/env bun

/**
 * RKLLMJS Model Management Tool - Main Entry Point
 * 
 * Usage:
 *   bun tools.ts pull [repo] [model]                 - Download specified RKLLM model + essential technical files
 *   bun tools.ts list                                - List all downloaded models
 *   bun tools.ts info [model]                        - Show model information
 *   bun tools.ts remove [model]                      - Remove a model
 *   bun tools.ts clean                               - Clean all models
 * 
 * Examples:
 *   bun tools.ts pull limcheekin/Qwen2.5-0.5B-Instruct-rk3588-1.1.4 Qwen2.5-0.5B-Instruct-rk3588-w8a8-opt-0-hybrid-ratio-0.0.rkllm
 *   bun tools.ts pull punchnox/Tinnyllama-1.1B-rk3588-rkllm-1.1.4 TinyLlama-1.1B-Chat-v1.0-rk3588-w8a8-opt-0-hybrid-ratio-0.5.rkllm
 */

import { RKLLMModelManager } from './src/tools/model-manager.js';
import { CLI_EXAMPLES } from './src/tools/tool-constants.js';

// CLI Interface
async function main() {
  const args = Bun.argv.slice(2);
  const command = args[0];
  const manager = new RKLLMModelManager();

  console.log(`🤖 RKLLMJS Model Manager\n`);

  switch (command) {
    case 'pull':
      const repo = args[1];
      const filename = args[2];
      if (!repo || !filename) {
        console.log(`❌ Please specify both repository and model.`);
        console.log(`Usage: bun tools.ts pull <repo> <model>`);
        console.log(`Example: ${CLI_EXAMPLES.PULL_QWEN}`);
        process.exit(1);
      }
      await manager.pullModel(repo, filename);
      break;

    case 'list':
      await manager.listModels();
      break;

    case 'info':
      const modelName = args[1];
      if (!modelName) {
        console.log(`❌ Please specify a model.`);
        console.log(`Usage: bun tools.ts info <model>`);
        process.exit(1);
      }
      await manager.showModelInfo(modelName);
      break;

    case 'remove':
      const removeModelName = args[1];
      if (!removeModelName) {
        console.log(`❌ Please specify a model.`);
        console.log(`Usage: bun tools.ts remove <model>`);
        process.exit(1);
      }
      await manager.removeModel(removeModelName);
      break;

    case 'clean':
      await manager.cleanModels();
      break;

    case 'debug':
      console.log('🔧 Debug Mode: Scanning models directory...');
      const fs = require('fs');
      const path = require('path');
      
      const modelsDir = './models';
      console.log(`📂 Models directory: ${modelsDir}`);
      console.log(`📂 Exists: ${fs.existsSync(modelsDir)}`);
      
      if (fs.existsSync(modelsDir)) {
        const items = fs.readdirSync(modelsDir, { withFileTypes: true });
        console.log(`📁 Found ${items.length} items:`);
        
        for (const item of items) {
          const itemPath = path.join(modelsDir, item.name);
          console.log(`  ${item.isDirectory() ? '📁' : '📄'} ${item.name}`);
          
          if (item.isDirectory()) {
            const subItems = fs.readdirSync(itemPath, { withFileTypes: true });
            console.log(`    Sub-items (${subItems.length}):`);
            
            for (const subItem of subItems) {
              const subItemPath = path.join(itemPath, subItem.name);
              const subStat = fs.statSync(subItemPath);
              console.log(`      ${subItem.isDirectory() ? '📁' : '📄'} ${subItem.name} (${subStat.size} bytes)`);
              
              if (subItem.name.endsWith('.rkllm')) {
                console.log(`      *** 🤖 RKLLM MODEL FOUND: ${subItemPath} ***`);
              }
            }
          }
        }
      }
      
      console.log('\n🔧 Testing manager.listModels()...');
      await manager.listModels();
      break;

    default:
      console.log(`📖 Usage:`);
      console.log(`   bun tools.ts pull <repo> <model>                 - Download specified RKLLM model + essential technical files`);
      console.log(`   bun tools.ts list                                - List all downloaded models`);
      console.log(`   bun tools.ts info <model>                        - Show model information`);
      console.log(`   bun tools.ts remove <model>                      - Remove a model`);
      console.log(`   bun tools.ts clean                               - Clean all models`);
      console.log(`\n📚 Examples:`);
      console.log(`   # Download RKLLM model with essential technical files:`);
      console.log(`   ${CLI_EXAMPLES.PULL_QWEN}`);
      console.log(`   ${CLI_EXAMPLES.PULL_TINYLLAMA}`);
      console.log(`\n   # Management:`);
      console.log(`   ${CLI_EXAMPLES.LIST}`);
      console.log(`   ${CLI_EXAMPLES.INFO}`);
      console.log(`   ${CLI_EXAMPLES.REMOVE}`);
      break;
  }
}

// Run CLI
main().catch(console.error);