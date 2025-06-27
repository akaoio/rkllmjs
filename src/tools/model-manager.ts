/**
 * RKLLM Model Manager - handles downloading and managing .rkllm models
 */

import type { ModelInfo } from './types.js';
import { REPOSITORY_SUGGESTIONS, CLI_EXAMPLES } from './tool-constants.js';

const fs = require('fs');
const path = require('path');

export class RKLLMModelManager {
  private modelsDir: string;

  constructor(modelsDir: string = './models') {
    this.modelsDir = modelsDir;
    this.ensureModelsDirectory();
  }

  private ensureModelsDirectory(): void {
    try {
      if (!fs.existsSync(this.modelsDir)) {
        // Create directory
        Bun.spawnSync(['mkdir', '-p', this.modelsDir]);
        console.log(`📁 Created models directory: ${this.modelsDir}`);
      }
    } catch (error) {
      console.error(`❌ Failed to create models directory: ${error}`);
    }
  }

  /**
   * Download a specified RKLLM model and essential technical files from HuggingFace repository
   */
  async pullModel(repo?: string, filename?: string): Promise<void> {
    if (!repo) {
      repo = await this.promptForRepo();
    }

    if (!filename) {
      filename = await this.promptForFilename(repo);
    }

    console.log(`🚀 Downloading specified model and essential files from ${repo}...`);
    
    const repoDir = `${this.modelsDir}/${repo}`;
    
    // Create repo directory
    try {
      Bun.spawnSync(['mkdir', '-p', repoDir]);
      console.log(`📁 Created directory: ${repoDir}`);
    } catch (error) {
      console.error(`❌ Failed to create directory: ${error}`);
      return;
    }

    // Get all files from repo to check availability
    const allFiles = await this.getRepoFiles(repo);
    if (allFiles.length === 0) {
      console.error('❌ No files found in repository');
      return;
    }

    // Define essential technical files (minimal set)
    const essentialTechnicalFiles = [
      'tokenizer.json',
      'tokenizer_config.json', 
      'config.json',
      'special_tokens_map.json',
      'generation_config.json'
    ];

    // Build final download list
    const filesToDownload: string[] = [];

    // 1. Add specific model file
    if (allFiles.includes(filename)) {
      filesToDownload.push(filename);
      console.log(`📄 Target model: ${filename}`);
    } else {
      console.error(`❌ Requested model file '${filename}' not found in repository`);
      const availableModels = allFiles.filter(f => 
        f.endsWith('.rkllm') || f.endsWith('.bin') || f.endsWith('.safetensors') || f.endsWith('.gguf')
      );
      
      if (availableModels.length > 0) {
        console.log(`📋 Available model files:`);
        availableModels.forEach(f => console.log(`   • ${f}`));
      }
      return;
    }

    // 2. Add available essential technical files
    console.log(`🔧 Adding essential technical files...`);
    const foundEssential: string[] = [];
    
    for (const essentialFile of essentialTechnicalFiles) {
      if (allFiles.includes(essentialFile)) {
        filesToDownload.push(essentialFile);
        foundEssential.push(essentialFile);
      }
    }

    console.log(`📋 Download list (${filesToDownload.length} files):`);
    filesToDownload.forEach(f => console.log(`   📄 ${f}`));

    // Download each file
    let successCount = 0;
    let failCount = 0;

    for (const fileName of filesToDownload) {
      try {
        const fileUrl = `https://huggingface.co/${repo}/resolve/main/${fileName}`;
        const filePath = `${repoDir}/${fileName}`;
        
        console.log(`⬇️  Downloading ${fileName}...`);
        
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const fileData = await response.arrayBuffer();
        await Bun.write(filePath, fileData);
        
        const fileSizeMB = (fileData.byteLength / (1024 * 1024)).toFixed(2);
        console.log(`✅ ${fileName} downloaded (${fileSizeMB} MB)`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Failed to download ${fileName}: ${error.message}`);
        failCount++;
        
        // Critical failure for model files
        const isModel = fileName.endsWith('.rkllm') || fileName.endsWith('.bin') || fileName.endsWith('.safetensors') || fileName.endsWith('.gguf');
        if (isModel) {
          console.error(`❌ Critical: Model file download failed. Aborting.`);
          return;
        }
      }
    }

    console.log(`\n📊 Download Summary:`);
    console.log(`✅ Success: ${successCount} files`);
    console.log(`❌ Failed: ${failCount} files`);
    
    if (successCount > 0) {
      // Save metadata
      const metadataPath = `${repoDir}/meta.json`;
      const metadata = {
        repo
      };
      
      try {
        await Bun.write(metadataPath, JSON.stringify(metadata, null, 2));
        console.log(`📄 Metadata saved to ${metadataPath}`);
      } catch (error) {
        console.warn(`⚠️  Could not save metadata: ${error.message}`);
      }
      
      console.log(`🎉 Model and essential files downloaded successfully!`);
      console.log(`📁 Location: ${repoDir}`);
    }
  }

  private async getRepoFiles(repo: string): Promise<string[]> {
    try {
      const apiUrl = `https://huggingface.co/api/models/${repo}/tree/main`;
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.map((item: any) => item.path).filter((path: string) => !path.includes('/'));
    } catch (error) {
      console.error(`❌ Failed to get repo files: ${error.message}`);
      return [];
    }
  }

  private async promptForRepo(): Promise<string> {
    console.log(`\n🤖 Enter HuggingFace repository (e.g., '${REPOSITORY_SUGGESTIONS[0]}'):`);
    console.log(`💡 Popular RKLLM models:`);
    REPOSITORY_SUGGESTIONS.forEach(repo => {
      console.log(`   • ${repo}`);
    });
    
    const input = prompt(`Repository: `);
    if (!input || input.trim() === '') {
      console.log(`❌ Repository is required.`);
      process.exit(1);
    }
    return input.trim();
  }

  private async promptForFilename(repo: string): Promise<string> {
    console.log(`\n📂 Getting available files from ${repo}...`);
    
    const allFiles = await this.getRepoFiles(repo);
    if (allFiles.length === 0) {
      console.error('❌ No files found in repository');
      process.exit(1);
    }

    const modelFiles = allFiles.filter(f => 
      f.endsWith('.rkllm') || f.endsWith('.bin') || f.endsWith('.safetensors') || f.endsWith('.gguf')
    );

    if (modelFiles.length === 0) {
      console.error('❌ No model files found in repository');
      process.exit(1);
    }

    console.log(`📋 Available model files:`);
    modelFiles.forEach((f, i) => console.log(`   ${i + 1}. ${f}`));
    
    const input = prompt(`\nEnter filename or number (1-${modelFiles.length}): `);
    if (!input || input.trim() === '') {
      console.log(`❌ Filename is required.`);
      process.exit(1);
    }

    const trimmed = input.trim();
    
    // Check if it's a number
    const num = parseInt(trimmed);
    if (!isNaN(num) && num >= 1 && num <= modelFiles.length) {
      return modelFiles[num - 1];
    }
    
    // Check if it's a valid filename
    if (modelFiles.includes(trimmed)) {
      return trimmed;
    }
    
    console.error(`❌ Invalid selection: ${trimmed}`);
    process.exit(1);
  }

  async listModels(): Promise<void> {
    console.log('📁 Available models:\n');
    
    const models = await this.getModels();
    
    if (models.length === 0) {
      console.log('🚫 No models found. Download some models using:');
      console.log(`   ${CLI_EXAMPLES.PULL_QWEN}`);
      return;
    }

    models.forEach(model => {
      const sizeMB = (model.size / (1024 * 1024)).toFixed(2);
      console.log(`🤖 ${model.name}`);
      console.log(`   📁 Path: ${model.path}`);
      console.log(`   📊 Size: ${sizeMB} MB`);
      console.log(`   📅 Created: ${model.created.toLocaleDateString()}`);
      if (model.repo) {
        console.log(`   🔗 Repository: ${model.repo}`);
      }
      console.log();
    });
  }

  async getModels(): Promise<ModelInfo[]> {
    const models: ModelInfo[] = [];

    try {
      if (!fs.existsSync(this.modelsDir)) {
        return models;
      }

      // Recursively scan for .rkllm files in the models directory
      const scanDirectory = (dirPath: string, relativePath: string = '') => {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          const entryRelativePath = relativePath ? path.join(relativePath, entry.name) : entry.name;
          
          if (entry.isDirectory()) {
            // Recursively scan subdirectories
            scanDirectory(fullPath, entryRelativePath);
          } else if (entry.isFile() && entry.name.endsWith('.rkllm')) {
            // Found a .rkllm model file
            const stat = fs.statSync(fullPath);
            
            // Try to get repo from metadata in the same directory
            let repo: string | undefined;
            try {
              const metaPath = path.join(path.dirname(fullPath), 'meta.json');
              if (fs.existsSync(metaPath)) {
                const metaContent = fs.readFileSync(metaPath, 'utf8');
                const meta = JSON.parse(metaContent);
                repo = meta.repo;
              }
            } catch {
              // Ignore metadata errors
            }
            
            // Use the actual .rkllm filename as the model name (without extension)
            const modelName = entry.name.replace('.rkllm', '');
            
            models.push({
              name: modelName,
              path: fullPath,
              size: stat.size,
              created: stat.birthtime,
              repo,
              filename: entry.name
            });
          }
        }
      };

      scanDirectory(this.modelsDir);
    } catch (error) {
      console.error(`❌ Error reading models: ${error.message}`);
    }

    return models;
  }

  async getFirstModelPath(): Promise<string | null> {
    const models = await this.getModels();
    return models.length > 0 ? models[0].path : null;
  }

  async showModelInfo(modelName: string): Promise<void> {
    const models = await this.getModels();
    
    // Find model by name (with or without .rkllm extension)
    let model = models.find(m => m.name === modelName);
    
    // If not found, try with .rkllm extension
    if (!model && !modelName.endsWith('.rkllm')) {
      model = models.find(m => m.name === modelName || m.filename === modelName + '.rkllm');
    }
    
    // If still not found, try without .rkllm extension
    if (!model && modelName.endsWith('.rkllm')) {
      const nameWithoutExt = modelName.replace('.rkllm', '');
      model = models.find(m => m.name === nameWithoutExt);
    }
    
    if (!model) {
      console.log(`❌ Model '${modelName}' not found.`);
      console.log('\n📋 Available models:');
      models.forEach(m => console.log(`   • ${m.name}`));
      return;
    }

    const sizeMB = (model.size / (1024 * 1024)).toFixed(2);
    
    console.log(`🤖 Model Information: ${model.name}\n`);
    console.log(`📁 Path: ${model.path}`);
    console.log(`📊 Size: ${sizeMB} MB`);
    console.log(`📅 Created: ${model.created.toLocaleDateString()}`);
    if (model.repo) {
      console.log(`🔗 Repository: ${model.repo}`);
    }
    if (model.filename) {
      console.log(`📄 Filename: ${model.filename}`);
    }
  }

  async removeModel(modelName: string): Promise<void> {
    // Find the model by name (with or without .rkllm extension)
    const models = await this.getModels();
    let modelToRemove = models.find(m => m.name === modelName);
    
    // If not found, try with .rkllm extension
    if (!modelToRemove && !modelName.endsWith('.rkllm')) {
      modelToRemove = models.find(m => m.name === modelName || m.filename === modelName + '.rkllm');
    }
    
    // If still not found, try without .rkllm extension
    if (!modelToRemove && modelName.endsWith('.rkllm')) {
      const nameWithoutExt = modelName.replace('.rkllm', '');
      modelToRemove = models.find(m => m.name === nameWithoutExt);
    }
    
    if (!modelToRemove) {
      console.log(`❌ Model '${modelName}' not found.`);
      console.log('\n📋 Available models:');
      models.forEach(m => console.log(`   • ${m.name}`));
      return;
    }

    // Get the directory path from the model path
    const modelDir = path.dirname(modelToRemove.path);
    
    try {
      Bun.spawnSync(['rm', '-rf', modelDir]);
      console.log(`🗑️  Model '${modelToRemove.name}' removed successfully.`);
    } catch (error) {
      console.error(`❌ Failed to remove model: ${error.message}`);
    }
  }

  async cleanModels(): Promise<void> {
    try {
      if (fs.existsSync(this.modelsDir)) {
        Bun.spawnSync(['rm', '-rf', this.modelsDir]);
        console.log(`🧹 All models cleaned.`);
        this.ensureModelsDirectory();
      } else {
        console.log(`📁 Models directory doesn't exist.`);
      }
    } catch (error) {
      console.error(`❌ Failed to clean models: ${error.message}`);
    }
  }

  async getModelByName(modelName: string): Promise<ModelInfo | null> {
    const models = await this.getModels();
    
    // Find model by name (with or without .rkllm extension)
    let model = models.find(m => m.name === modelName);
    
    // If not found, try with .rkllm extension
    if (!model && !modelName.endsWith('.rkllm')) {
      model = models.find(m => m.name === modelName || m.filename === modelName + '.rkllm');
    }
    
    // If still not found, try without .rkllm extension
    if (!model && modelName.endsWith('.rkllm')) {
      const nameWithoutExt = modelName.replace('.rkllm', '');
      model = models.find(m => m.name === nameWithoutExt);
    }
    
    return model || null;
  }
}