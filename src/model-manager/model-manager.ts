/**
 * RKLLM Model Manager - handles downloading and managing .rkllm models
 * ES Modules implementation for Node.js (primary), Bun, Deno
 */

import type { ModelInfo } from '../model-types/model-types.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load model configurations
const modelsConfigPath = path.resolve(__dirname, '../../configs/models.json');
const constants = JSON.parse(fs.readFileSync(modelsConfigPath, 'utf8'));

// CLI examples constants (for help messages)
const CLI_EXAMPLES = {
  PULL_STANDARD: `node cli-runner.js pull ${constants.STANDARD_MODEL.REPOSITORY} ${constants.STANDARD_MODEL.MODEL_FILE}`,
  PULL_QWEN: `node cli-runner.js pull ${constants.EXAMPLE_REPOSITORIES.QWEN_05B} ${constants.EXAMPLE_MODEL_FILES.QWEN_05B}`,
  PULL_TINYLLAMA: `node cli-runner.js pull ${constants.EXAMPLE_REPOSITORIES.TINYLLAMA} ${constants.EXAMPLE_MODEL_FILES.TINYLLAMA}`,
  LIST: 'node cli-runner.js list',
  INFO: 'node cli-runner.js info [model-name]',
  REMOVE: 'node cli-runner.js remove [model-name]',
  CLEAN: 'node cli-runner.js clean',
};

export class RKLLMModelManager {
  private modelsDir: string;

  constructor(modelsDir: string = './models') {
    this.modelsDir = modelsDir;
    // Initialize directory creation on construction
    this.ensureModelsDirectory();
  }

  private ensureModelsDirectory(): void {
    try {
      // Use synchronous fs operations for simplicity in ES modules
      if (!fs.existsSync(this.modelsDir)) {
        fs.mkdirSync(this.modelsDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create models directory:', error);
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    const models: ModelInfo[] = [];

    try {
      if (!fs.existsSync(this.modelsDir)) {
        console.log('📂 Models directory does not exist.');
        return models;
      }

      const items = fs.readdirSync(this.modelsDir, { withFileTypes: true });

      for (const item of items) {
        if (item.isDirectory()) {
          const repoPath = path.join(this.modelsDir, item.name);
          const subItems = fs.readdirSync(repoPath, { withFileTypes: true });

          for (const subItem of subItems) {
            if (subItem.isDirectory()) {
              const modelPath = path.join(repoPath, subItem.name);
              const modelFiles = fs.readdirSync(modelPath);

              for (const file of modelFiles) {
                if (file.endsWith('.rkllm')) {
                  const fullPath = path.join(modelPath, file);
                  const stats = fs.statSync(fullPath);

                  models.push({
                    name: file.replace('.rkllm', ''),
                    path: fullPath,
                    size: stats.size,
                    created: stats.birthtime,
                    repo: `${item.name}/${subItem.name}`,
                    filename: file,
                  });
                }
              }
            }
          }
        }
      }

      if (models.length === 0) {
        console.log('📦 No RKLLM models found.');
        console.log(`💡 Download models using: ${CLI_EXAMPLES.PULL_STANDARD}`);
      } else {
        console.log(`🤖 RKLLMJS Model Manager\n`);
        console.log(`📦 Found ${models.length} model(s):\n`);

        models.forEach((model, index) => {
          console.log(`${index + 1}. 🤖 ${model.name}`);
          console.log(`   📁 Repository: ${model.repo}`);
          console.log(`   📄 File: ${model.filename}`);
          console.log(`   📏 Size: ${(model.size / 1024 / 1024).toFixed(2)} MB`);
          console.log(`   📅 Created: ${model.created.toLocaleDateString()}`);
          console.log(`   🗂️  Path: ${model.path}`);
          console.log('');
        });
      }
    } catch (error) {
      console.error('❌ Error listing models:', error);
    }

    return models;
  }

  async pullModel(repo: string, filename: string): Promise<void> {
    console.log(`🔽 Pulling model from ${repo}...`);
    console.log(`📄 Model file: ${filename}`);

    // Create repository directory structure
    const repoDir = path.join(this.modelsDir, repo);
    fs.mkdirSync(repoDir, { recursive: true });

    const modelPath = path.join(repoDir, filename);

    try {
      console.log(`📂 Repository directory: ${repoDir}`);
      console.log(`💾 Target path: ${modelPath}`);

      // Check if model already exists
      if (fs.existsSync(modelPath)) {
        console.log(`✅ Model already exists at: ${modelPath}`);
        const stats = fs.statSync(modelPath);
        console.log(`📏 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        return;
      }

      // Construct Hugging Face download URL
      const downloadUrl = `https://huggingface.co/${repo}/resolve/main/${filename}`;
      console.log(`🌐 Download URL: ${downloadUrl}`);

      // Import fetch for Node.js compatibility
      let fetchFn: typeof fetch;
      try {
        // Try using built-in fetch (Node.js 18+)
        fetchFn = globalThis.fetch;
        if (!fetchFn) {
          throw new Error('fetch not available');
        }
      } catch {
        // Fallback to node-fetch if needed
        const nodeFetch = await import('node-fetch');
        fetchFn = nodeFetch.default as any;
      }

      console.log(`⬇️  Starting download...`);
      const response = await fetch(downloadUrl);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Get file size from headers if available
      const contentLength = response.headers.get('content-length');
      const totalSize = contentLength ? parseInt(contentLength, 10) : null;

      if (totalSize) {
        console.log(`📊 Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
      }

      // Stream download to file
      const writer = fs.createWriteStream(modelPath);
      let downloadedSize = 0;

      if (response.body) {
        const reader = response.body.getReader();
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            writer.write(value);
            downloadedSize += value.length;
            
            if (totalSize) {
              const progress = (downloadedSize / totalSize * 100).toFixed(1);
              process.stdout.write(`\r📈 Progress: ${progress}% (${(downloadedSize / 1024 / 1024).toFixed(2)} MB)`);
            } else {
              process.stdout.write(`\r📈 Downloaded: ${(downloadedSize / 1024 / 1024).toFixed(2)} MB`);
            }
          }
        } finally {
          reader.releaseLock();
        }
      }

      writer.end();
      console.log(`\n✅ Model downloaded successfully!`);
      console.log(`📁 Saved to: ${modelPath}`);
      console.log(`📏 Final size: ${(downloadedSize / 1024 / 1024).toFixed(2)} MB`);

    } catch (error) {
      console.error(`\n❌ Failed to pull model:`, error);
      
      // Clean up incomplete download
      if (fs.existsSync(modelPath)) {
        try {
          fs.unlinkSync(modelPath);
          console.log(`🧹 Cleaned up incomplete download`);
        } catch (cleanupError) {
          console.error(`⚠️  Failed to clean up incomplete file:`, cleanupError);
        }
      }
      
      throw error;
    }
  }

  async showModelInfo(modelName: string): Promise<void> {
    console.log(`🔍 Searching for model: ${modelName}`);

    try {
      const models = await this.listModels();
      const model = models.find(
        (m) => m.name === modelName || (m.filename && m.filename.includes(modelName))
      );

      if (model) {
        console.log(`\n🤖 Model Information:`);
        console.log(`📛 Name: ${model.name}`);
        console.log(`📁 Repository: ${model.repo}`);
        console.log(`📄 Filename: ${model.filename}`);
        console.log(`📏 Size: ${(model.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`📅 Created: ${model.created.toLocaleDateString()}`);
        console.log(`🗂️  Full Path: ${model.path}`);

        // Try to read additional metadata if available
        const modelDir = path.dirname(model.path);
        const metaFiles = ['config.json', 'meta.json', 'generation_config.json'];

        console.log(`\n📋 Additional Files:`);
        for (const metaFile of metaFiles) {
          const metaPath = path.join(modelDir, metaFile);
          if (fs.existsSync(metaPath)) {
            console.log(`   ✅ ${metaFile}`);
            try {
              const content = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
              if (metaFile === 'config.json' && content.model_type) {
                console.log(`      🏷️  Model Type: ${content.model_type}`);
              }
            } catch (e) {
              console.log(`      ⚠️  Could not parse ${metaFile}`);
            }
          } else {
            console.log(`   ❌ ${metaFile} (missing)`);
          }
        }
      } else {
        console.log(`❌ Model '${modelName}' not found.`);
        console.log(`💡 List available models: ${CLI_EXAMPLES.LIST}`);
      }
    } catch (error) {
      console.error('❌ Error getting model info:', error);
    }
  }

  async removeModel(modelName: string): Promise<void> {
    console.log(`🗑️  Removing model: ${modelName}`);

    try {
      const models = await this.listModels();
      const model = models.find(
        (m) => m.name === modelName || (m.filename && m.filename.includes(modelName))
      );

      if (model) {
        const modelDir = path.dirname(model.path);

        // Confirm removal
        console.log(`📁 Model directory: ${modelDir}`);
        console.log(`⚠️  This will remove the entire model directory and all its contents.`);

        // Remove the model directory
        fs.rmSync(modelDir, { recursive: true, force: true });

        console.log(`✅ Model '${modelName}' removed successfully.`);
      } else {
        console.log(`❌ Model '${modelName}' not found.`);
        console.log(`💡 List available models: ${CLI_EXAMPLES.LIST}`);
      }
    } catch (error) {
      console.error('❌ Error removing model:', error);
    }
  }

  async cleanModels(): Promise<void> {
    console.log(`🧹 Cleaning models directory: ${this.modelsDir}`);

    try {
      if (fs.existsSync(this.modelsDir)) {
        const items = fs.readdirSync(this.modelsDir);

        if (items.length === 0) {
          console.log(`✨ Models directory is already clean.`);
          return;
        }

        console.log(`📂 Found ${items.length} item(s) to remove:`);
        items.forEach((item) => console.log(`   - ${item}`));

        // Remove all items in models directory
        for (const item of items) {
          const itemPath = path.join(this.modelsDir, item);
          const stats = fs.statSync(itemPath);

          if (stats.isDirectory()) {
            fs.rmSync(itemPath, { recursive: true, force: true });
            console.log(`🗑️  Removed directory: ${item}`);
          } else {
            fs.unlinkSync(itemPath);
            console.log(`🗑️  Removed file: ${item}`);
          }
        }

        console.log(`✅ Models directory cleaned successfully.`);
      } else {
        console.log(`📁 Models directory does not exist.`);
      }
    } catch (error) {
      console.error('❌ Error cleaning models:', error);
    }
  }
}
