#!/usr/bin/env node

/**
 * RKLLMJS CLI Runner - Command Line Interface for Model Management
 * Primary runtime: Node.js, Alternative support: Bun, Deno (experimental)
 * 
 * Usage:
 *   node dist/cli-runner/cli-runner.js pull [repo] [model]    # Node.js (primary/production)
 *   npm run cli pull [repo] [model]                          # Node.js via npm script
 *   bun src/cli-runner/cli-runner.ts pull [repo] [model]      # Bun (alternative/dev)
 *   deno run --allow-all src/cli-runner/cli-runner.ts [...]   # Deno (experimental)
 * 
 * Examples:
 *   npm run cli pull limcheekin/Qwen2.5-0.5B-Instruct-rk3588-1.1.4 Qwen2.5-0.5B-Instruct-rk3588-w8a8-opt-0-hybrid-ratio-0.0.rkllm
 *   node dist/cli-runner/cli-runner.js pull punchnox/Tinnyllama-1.1B-rk3588-rkllm-1.1.4 TinyLlama-1.1B-Chat-v1.0-rk3588-w8a8-opt-0-hybrid-ratio-0.5.rkllm
 */

import { RKLLMModelManager } from '../model-manager/model-manager.js';
import { RuntimeDetector } from '../runtime-detector/runtime-detector.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load model configurations from JSON
const modelsConfigPath = path.resolve(__dirname, '../../configs/models.json');
const modelsConfig = JSON.parse(fs.readFileSync(modelsConfigPath, 'utf8'));

// Generate CLI examples from model configurations
const CLI_EXAMPLES = {
  PULL_QWEN: `node cli-runner.js pull ${modelsConfig.EXAMPLE_REPOSITORIES.QWEN_05B} ${modelsConfig.EXAMPLE_MODEL_FILES.QWEN_05B}`,
  PULL_TINYLLAMA: `node cli-runner.js pull ${modelsConfig.EXAMPLE_REPOSITORIES.TINYLLAMA} ${modelsConfig.EXAMPLE_MODEL_FILES.TINYLLAMA}`,
  LIST: 'node cli-runner.js list',
  INFO: 'node cli-runner.js info [model-name]',
  REMOVE: 'node cli-runner.js remove [model-name]',
  CLEAN: 'node cli-runner.js clean'
};

export class CLIRunner {
  private manager: RKLLMModelManager | null = null;
  private detector: RuntimeDetector;

  constructor() {
    this.detector = RuntimeDetector.getInstance();
  }

  private getManager(): RKLLMModelManager {
    if (!this.manager) {
      this.manager = new RKLLMModelManager();
    }
    return this.manager;
  }

  async run(args: string[]): Promise<void> {
    const command = args[0];
    const runtime = this.detector.detect();

    console.log(`🤖 RKLLMJS Model Manager`);
    console.log(`🔧 Runtime: ${runtime.type} v${runtime.version} ${runtime.type === 'node' ? '(Primary)' : '(Alternative)'}\n`);

    // Show runtime warning for experimental runtimes
    if (this.detector.isExperimental()) {
      console.log(`⚠️  Warning: ${runtime.type} is experimental. Consider using Node.js for production.`);
      console.log(`💡 Switch to Node.js: npm run cli ${args.join(' ')}\n`);
    }

    switch (command) {
      case 'pull':
        await this.handlePull(args);
        break;

      case 'list':
        await this.handleList();
        break;

      case 'info':
        await this.handleInfo(args);
        break;

      case 'remove':
        await this.handleRemove(args);
        break;

      case 'clean':
        await this.handleClean();
        break;

      case 'debug':
        await this.handleDebug();
        break;

      default:
        this.showHelp();
        break;
    }
  }

  private async handlePull(args: string[]): Promise<void> {
    const repo = args[1];
    const filename = args[2];
    
    if (!repo || !filename) {
      console.log(`❌ Please specify both repository and model.`);
      console.log(`Usage: ${this.detector.getCliPrefix()} cli-runner.js pull <repo> <model>`);
      console.log(`Example: ${CLI_EXAMPLES.PULL_QWEN}`);
      process.exit(1);
    }
    
    await this.getManager().pullModel(repo, filename);
  }

  private async handleList(): Promise<void> {
    await this.getManager().listModels();
  }

  private async handleInfo(args: string[]): Promise<void> {
    const modelName = args[1];
    
    if (!modelName) {
      console.log(`❌ Please specify a model.`);
      console.log(`Usage: ${this.detector.getCliPrefix()} cli-runner.js info <model>`);
      process.exit(1);
    }
    
    await this.getManager().showModelInfo(modelName);
  }

  private async handleRemove(args: string[]): Promise<void> {
    const removeModelName = args[1];
    
    if (!removeModelName) {
      console.log(`❌ Please specify a model.`);
      console.log(`Usage: ${this.detector.getCliPrefix()} cli-runner.js remove <model>`);
      process.exit(1);
    }
    
    await this.getManager().removeModel(removeModelName);
  }

  private async handleClean(): Promise<void> {
    await this.getManager().cleanModels();
  }

  private async handleDebug(): Promise<void> {
    console.log('🔧 Debug Mode: Scanning models directory...');
    
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
    await this.getManager().listModels();
  }

  private showHelp(): void {
    const prefix = this.detector.getCliPrefix();
    console.log(`📖 Usage:`);
    console.log(`   ${prefix} cli-runner.js pull <repo> <model>       - Download specified RKLLM model + essential technical files`);
    console.log(`   ${prefix} cli-runner.js list                      - List all downloaded models`);
    console.log(`   ${prefix} cli-runner.js info <model>              - Show model information`);
    console.log(`   ${prefix} cli-runner.js remove <model>            - Remove a model`);
    console.log(`   ${prefix} cli-runner.js clean                     - Clean all models`);
    console.log(`\n📚 Examples:`);
    console.log(`   # Download RKLLM model with essential technical files:`);
    console.log(`   ${CLI_EXAMPLES.PULL_QWEN}`);
    console.log(`   ${CLI_EXAMPLES.PULL_TINYLLAMA}`);
    console.log(`\n   # Management:`);
    console.log(`   ${CLI_EXAMPLES.LIST}`);
    console.log(`   ${CLI_EXAMPLES.INFO}`);
    console.log(`   ${CLI_EXAMPLES.REMOVE}`);
  }
}

// CLI Interface - Multi-runtime entry point
async function main() {
  const detector = RuntimeDetector.getInstance();
  const runtime = detector.detect();
  
  let args: string[] = [];
  
  // Get command line arguments based on runtime
  switch (runtime.type) {
    case 'node':
      args = process.argv.slice(2);
      break;
    case 'bun':
      if (typeof Bun !== 'undefined' && 'argv' in Bun) {
        args = (Bun as any).argv.slice(2);
      } else {
        args = process.argv.slice(2); // Fallback
      }
      break;
    case 'deno':
      if (typeof Deno !== 'undefined') {
        args = (Deno as any).args || [];
      }
      break;
    default:
      args = process.argv.slice(2); // Fallback
  }
  
  const runner = new CLIRunner();
  await runner.run(args);
}

// Export for use in examples and other modules
export { RKLLMModelManager };

// Run CLI if executed directly - runtime detection
const isMainModule = (() => {
  const detector = RuntimeDetector.getInstance();
  const runtime = detector.detect();
  
  switch (runtime.type) {
    case 'node':
      // In ES modules, use import.meta.url to detect if this is the main module
      return import.meta.url === `file://${process.argv[1]}`;
    case 'bun':
      return typeof Bun !== 'undefined' && 'main' in import.meta && (import.meta as any).main;
    case 'deno':
      return typeof Deno !== 'undefined' && (import.meta as any).main;
    default:
      return false;
  }
})();

if (isMainModule) {
  main().catch(console.error);
}
