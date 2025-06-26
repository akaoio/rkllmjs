#!/usr/bin/env bun

/**
 * RKLLMJS Model Management Tool
 * 
 * Usage:
 *   bun tools.ts pull [repo] [filename]           - Download single model file
 *   bun tools.ts pull-complete [repo] [model]     - Download model + essential technical files
 *   bun tools.ts pull-model-only [repo] [model]   - Download ONLY the specified model file
 *   bun tools.ts download [repo] [model]          - Alias for pull-complete
 *   bun tools.ts list                             - List all downloaded models
 *   bun tools.ts info [model-name]                - Show model information
 *   bun tools.ts remove [model-name]              - Remove a model
 *   bun tools.ts clean                            - Clean all models
 * 
 * Examples:
 *   bun tools.ts pull-complete limcheekin/Qwen2.5-0.5B-Instruct-rk3588-1.1.4
 *   bun tools.ts pull-model-only limcheekin/Qwen2.5-0.5B-Instruct-rk3588-1.1.4 Qwen2.5-0.5B-Instruct-rk3588-w8a8-opt-0-hybrid-ratio-0.0.rkllm
 *   bun tools.ts download limcheekin/Qwen2.5-0.5B-Instruct-rk3588-1.1.4
 */

interface ModelInfo {
  name: string;
  path: string;
  size: number;
  created: Date;
  repo?: string;
  filename?: string;
}

class RKLLMModelManager {
  private modelsDir: string;

  constructor(modelsDir: string = './models') {
    this.modelsDir = modelsDir;
    this.ensureModelsDirectory();
  }

  private ensureModelsDirectory(): void {
    try {
      const fs = require('fs');
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
   * Download a model from HuggingFace repository
   */
  async pullModel(repo?: string, filename?: string): Promise<void> {
    if (!repo) {
      repo = await this.promptForRepo();
    }

    if (!filename) {
      filename = await this.promptForFilename(repo);
    }

    const repoDir = `${this.modelsDir}/${repo}`;
    const modelPath = `${repoDir}/${filename}`;

    console.log(`🚀 Downloading model from ${repo}/${filename}...`);
    console.log(`📥 Target: ${modelPath}`);

    // Create repo directory
    try {
      Bun.spawnSync(['mkdir', '-p', repoDir]);
    } catch (error) {
      console.error(`❌ Failed to create directory: ${error}`);
      return;
    }

    try {
      // HuggingFace Hub download URL
      const downloadUrl = `https://huggingface.co/${repo}/resolve/main/${filename}`;
      console.log(`🔗 URL: ${downloadUrl}`);

      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const totalSize = parseInt(response.headers.get('content-length') || '0');
      console.log(`📊 File size: ${this.formatBytes(totalSize)}`);

      // Check available disk space (rough estimate)
      if (totalSize > 0) {
        try {
          const spaceCheck = Bun.spawnSync(['df', '-h', '.']);
          const spaceOutput = spaceCheck.stdout.toString();
          console.log(`💽 Checking disk space...`);
          
          // Warn if file is very large
          if (totalSize > 5 * 1024 * 1024 * 1024) { // > 5GB
            console.log(`⚠️  Large file detected (${this.formatBytes(totalSize)}). This may take a while...`);
          }
        } catch {
          // Ignore disk space check errors
        }
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      // Download with progress tracking
      const reader = response.body.getReader();
      let downloadedBytes = 0;
      let lastProgressUpdate = 0;

      // Reset progress tracking variables
      this.downloadStartTime = 0;
      this.lastDownloadedBytes = 0;
      this.lastSpeedUpdate = 0;
      this.lastCalculatedSpeed = 0;

      console.log(`\n⬇️  Downloading...`);
      this.showProgressBar(0, totalSize);

      // Create a writable file stream to avoid memory issues with large files
      const file = Bun.file(modelPath);
      const writer = file.writer();

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          // Write chunk directly to file
          writer.write(value);
          downloadedBytes += value.length;
          
          // Update progress more frequently for better visual feedback
          const progressPercent = (downloadedBytes / totalSize) * 100;
          const shouldUpdate = progressPercent - lastProgressUpdate >= 0.5 || // Every 0.5%
                             downloadedBytes - (lastProgressUpdate * totalSize / 100) >= 512 * 1024 || // Every 512KB
                             Date.now() - this.lastSpeedUpdate >= 250; // Every 250ms
          
          if (shouldUpdate || downloadedBytes === totalSize) {
            this.showProgressBar(downloadedBytes, totalSize);
            lastProgressUpdate = progressPercent;
          }
        }

        // Finalize the file
        await writer.end();
        
        console.log('\n'); // New line after progress bar

      } catch (writeError) {
        await writer.end();
        throw writeError;
      }

      // Save metadata
      const metadataPath = `${repoDir}/meta.json`;
      const metadata = {
        repo
      };
      await Bun.write(metadataPath, JSON.stringify(metadata, null, 2));

      console.log(`✅ Model downloaded successfully!`);
      console.log(`📂 Path: ${modelPath}`);
      console.log(`💾 Size: ${this.formatBytes(downloadedBytes)}`);

    } catch (error) {
      console.error(`❌ Download failed: ${(error as Error).message}`);
      
      // Clean up partial download
      try {
        const partialFile = Bun.file(modelPath);
        if (await partialFile.exists()) {
          Bun.spawnSync(['rm', '-f', modelPath]);
          console.log(`🧹 Cleaned up partial download`);
        }
      } catch {
        // Ignore cleanup errors
      }
      
      // Suggest some popular models if the download fails
      console.log(`\n💡 Popular RKLLM models you might try:`);
      console.log(`   • microsoft/DialoGPT-medium`);
      console.log(`   • microsoft/DialoGPT-small`);
      console.log(`   • gpt2`);
      console.log(`   • distilgpt2`);
      console.log(`\n💭 Tips for large files:`);
      console.log(`   • Ensure stable internet connection`);
      console.log(`   • Check available disk space`);
      console.log(`   • Try smaller model variants first`);
      
      process.exit(1);
    }
  }

  /**
   * Get list of files from HuggingFace repository
   */
  async getRepoFiles(repo: string): Promise<string[]> {
    try {
      console.log(`🔍 Getting file list from ${repo}...`);
      const apiUrl = `https://huggingface.co/api/models/${repo}/tree/main`;
      
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Failed to get repo info: ${response.status}`);
      }
      
      const data = await response.json();
      const files = data.filter((item: any) => item.type === 'file').map((item: any) => item.path);
      
      console.log(`📄 Found ${files.length} files in repository`);
      return files;
    } catch (error) {
      console.error(`❌ Failed to get repo files: ${error}`);
      return [];
    }
  }

  /**
   * Download all essential files from a model repository
   */
  async pullModelComplete(repo: string, modelFileName?: string): Promise<void> {
    console.log(`🚀 Downloading specific model and essential files from ${repo}...`);
    
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

    // 1. Add specific model file if requested
    if (modelFileName) {
      if (allFiles.includes(modelFileName)) {
        filesToDownload.push(modelFileName);
        console.log(`📄 Target model: ${modelFileName}`);
      } else {
        console.error(`❌ Requested model file '${modelFileName}' not found in repository`);
        const availableModels = allFiles.filter(f => 
          f.endsWith('.rkllm') || f.endsWith('.bin') || f.endsWith('.safetensors') || f.endsWith('.gguf')
        );
        console.log('📋 Available model files:', availableModels.slice(0, 5).join(', '));
        return;
      }
    } else {
      // If no specific model file, find the first .rkllm file
      const rkllmFiles = allFiles.filter(f => f.endsWith('.rkllm'));
      if (rkllmFiles.length > 0) {
        filesToDownload.push(rkllmFiles[0]);
        console.log(`📄 Auto-selected model: ${rkllmFiles[0]}`);
      } else {
        console.error('❌ No .rkllm model files found in repository');
        return;
      }
    }

    // 2. Add only essential technical files that exist
    for (const techFile of essentialTechnicalFiles) {
      if (allFiles.includes(techFile)) {
        filesToDownload.push(techFile);
      }
    }

    console.log(`📦 Will download ${filesToDownload.length} files (1 model + ${filesToDownload.length - 1} technical):`);
    filesToDownload.forEach(file => {
      const isModel = file.endsWith('.rkllm') || file.endsWith('.bin') || file.endsWith('.safetensors') || file.endsWith('.gguf');
      console.log(`  ${isModel ? '🤖' : '⚙️ '} ${file}`);
    });

    let successCount = 0;
    let failCount = 0;

    // Download each file
    for (const fileName of filesToDownload) {
      try {
        console.log(`\n⬇️  Downloading ${fileName}...`);
        await this.downloadFile(repo, fileName, repoDir);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to download ${fileName}: ${error}`);
        failCount++;
        
        // If model file fails, it's critical
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
        console.log(`💾 Saved metadata to ${metadataPath}`);
      } catch (error) {
        console.error(`⚠️  Failed to save metadata: ${error}`);
      }
      
      console.log(`🎉 Targeted download completed! Files saved to: ${repoDir}`);
      console.log(`📁 Model file: ${filesToDownload[0]}`);
      console.log(`⚙️  Technical files: ${filesToDownload.length - 1}`);
    } else {
      console.error(`❌ No files were downloaded successfully`);
    }
  }

  /**
   * Download a single file from HuggingFace repository
   */
  private async downloadFile(repo: string, fileName: string, targetDir: string): Promise<void> {
    const targetPath = `${targetDir}/${fileName}`;
    const downloadUrl = `https://huggingface.co/${repo}/resolve/main/${fileName}`;

    const response = await fetch(downloadUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const totalSize = parseInt(response.headers.get('content-length') || '0');
    
    if (totalSize > 0) {
      console.log(`📊 Size: ${this.formatBytes(totalSize)}`);
      
      if (totalSize > 100 * 1024 * 1024) { // > 100MB
        console.log(`⚠️  Large file detected (${this.formatBytes(totalSize)}). This may take a while...`);
      }
    }

    // Stream download with progress
    if (response.body) {
      const reader = response.body.getReader();
      const file = Bun.file(targetPath);
      const writer = file.writer();
      
      let downloadedBytes = 0;
      const startTime = Date.now();
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          writer.write(value);
          downloadedBytes += value.length;
          
          // Show progress more frequently with better visual feedback
          if (totalSize > 1024 * 1024) { // Files > 1MB get progress bar
            const progress = totalSize > 0 ? (downloadedBytes / totalSize * 100).toFixed(1) : '?';
            
            // Update every 256KB or every 2%
            if (downloadedBytes % (256 * 1024) === 0 || 
                (totalSize > 0 && Math.floor((downloadedBytes / totalSize) * 50) !== Math.floor(((downloadedBytes - value.length) / totalSize) * 50))) {
              
              const elapsed = (Date.now() - startTime) / 1000;
              const speed = elapsed > 0 ? downloadedBytes / elapsed : 0;
              
              // Create simple progress bar
              const barLength = 20;
              const filled = Math.floor((downloadedBytes / totalSize) * barLength);
              const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
              
              process.stdout.write(
                `\r📥 [${bar}] ${progress}% (${this.formatBytes(downloadedBytes)}/${this.formatBytes(totalSize)}) ${this.formatBytes(speed)}/s`
              );
            }
          }
        }
        
        writer.flush();
        writer.end();
        
        // New line after progress bar
        if (totalSize > 1024 * 1024) {
          console.log(''); // New line
        }
        
        const duration = (Date.now() - startTime) / 1000;
        console.log(`✅ Downloaded ${fileName} (${this.formatBytes(downloadedBytes)} in ${duration.toFixed(1)}s)`);
        
      } catch (error) {
        writer.end();
        // Clean up partial file
        try {
          await Bun.file(targetPath).exists() && Bun.spawnSync(['rm', targetPath]);
        } catch {}
        throw error;
      }
    } else {
      throw new Error('No response body');
    }
  }

  /**
   * List all downloaded models
   */
  async listModels(): Promise<ModelInfo[]> {
    const fs = require('fs');
    
    if (!fs.existsSync(this.modelsDir)) {
      console.log(`📭 No models directory found. Run 'bun tools.ts pull' to download models.`);
      return [];
    }

    const models: ModelInfo[] = [];
    
    try {
      console.log(`🔍 Scanning models directory: ${this.modelsDir}`);
      
      // Use readdir instead of find for better reliability
      const readdirResult = await this.readDirectoryRecursive(this.modelsDir);
      console.log(`📂 Found ${readdirResult.length} items in models directory`);
      
      const repoDirs = readdirResult.filter(item => item.isDirectory);
      console.log(`📁 Found ${repoDirs.length} repository directories:`, repoDirs.map(d => d.name));

      if (repoDirs.length === 0) {
        console.log(`📭 No models found. Run 'bun tools.ts pull' to download models.`);
        return [];
      }

      console.log(`\n📚 Downloaded Models:`);
      console.log(`${'='.repeat(80)}`);
      console.log(`${'Model Name'.padEnd(30)} ${'Size'.padEnd(12)} ${'Date'.padEnd(20)} ${'Path'}`);
      console.log(`${'-'.repeat(80)}`);

      for (const repoDir of repoDirs) {
        console.log(`🔍 Scanning repository: ${repoDir.name}`);
        
        // Get files in the repo directory
        const repoFiles = await this.readDirectoryRecursive(repoDir.path);
        console.log(`📄 Found ${repoFiles.length} files in ${repoDir.name}`);
        
        const modelFiles = repoFiles.filter(item => 
          !item.isDirectory && 
          (item.name.endsWith('.rkllm') || 
           item.name.endsWith('.bin') || 
           item.name.endsWith('.safetensors') || 
           item.name.endsWith('.gguf'))
        );
        
        console.log(`🤖 Found ${modelFiles.length} model files in ${repoDir.name}:`, modelFiles.map(f => f.name));

        for (const modelFile of modelFiles) {
          if (!modelFile) continue;
          
          const file = Bun.file(modelFile.path);
          if (await file.exists()) {
            const stats = await file.stat();
            const repoName = repoDir.name;
            const fileName = modelFile.name;
            
            // Try to load metadata
            const metadataPath = `${repoDir.path}/meta.json`;
            let metadata: any = {};
            const metadataFile = Bun.file(metadataPath);
            if (await metadataFile.exists()) {
              try {
                metadata = await metadataFile.json();
              } catch {}
            }

            const modelInfo: ModelInfo = {
              name: `${repoName}/${fileName}`,
              path: modelFile.path,
              size: stats.size,
              created: new Date(stats.birthtime || stats.mtime),
              repo: metadata.repo,
              filename: metadata.filename
            };

            models.push(modelInfo);

            // Display model info
            const name = modelInfo.name.length > 29 ? 
              modelInfo.name.substring(0, 26) + '...' : 
              modelInfo.name;
            
            console.log(
              `${name.padEnd(30)} ` +
              `${this.formatBytes(modelInfo.size).padEnd(12)} ` +
              `${modelInfo.created.toLocaleDateString().padEnd(20)} ` +
              `${modelInfo.path}`
            );
          }
        }
      }

      console.log(`${'-'.repeat(80)}`);
      console.log(`📊 Total: ${models.length} models`);
      return models;
      
    } catch (error) {
      console.error(`❌ Failed to list models: ${error}`);
      return [];
    }
  }

  /**
   * Show detailed information about a model
   */
  async showModelInfo(modelName: string): Promise<void> {
    const models = await this.getAllModels();
    const model = models.find(m => 
      m.name.includes(modelName) || 
      m.path.split('/').pop()?.includes(modelName)
    );

    if (!model) {
      console.log(`❌ Model '${modelName}' not found.`);
      console.log(`\n📋 Available models:`);
      models.forEach(m => console.log(`   • ${m.name}`));
      return;
    }

    console.log(`\n📋 Model Information:`);
    console.log(`${'='.repeat(50)}`);
    console.log(`Name: ${model.name}`);
    console.log(`Path: ${model.path}`);
    console.log(`Size: ${this.formatBytes(model.size)}`);
    console.log(`Created: ${model.created.toLocaleString()}`);
    
    if (model.repo) {
      console.log(`Repository: ${model.repo}`);
    }
    if (model.filename) {
      console.log(`Original filename: ${model.filename}`);
    }

    // Check if metadata exists
    const modelDir = model.path.substring(0, model.path.lastIndexOf('/'));
    const metadataPath = `${modelDir}/meta.json`;
    const metadataFile = Bun.file(metadataPath);
    if (await metadataFile.exists()) {
      try {
        const metadata = await metadataFile.json();
        console.log(`Repository: ${metadata.repo}`);
      } catch {}
    }
  }

  /**
   * Remove a model
   */
  async removeModel(modelName: string): Promise<void> {
    const models = await this.getAllModels();
    const model = models.find(m => 
      m.name.includes(modelName) || 
      m.path.split('/').pop()?.includes(modelName)
    );

    if (!model) {
      console.log(`❌ Model '${modelName}' not found.`);
      return;
    }

    try {
      // Remove model file
      Bun.spawnSync(['rm', '-f', model.path]);
      
      // Remove metadata if exists (now in repo directory)
      const modelDir = model.path.substring(0, model.path.lastIndexOf('/'));
      const metadataPath = `${modelDir}/meta.json`;
      Bun.spawnSync(['rm', '-f', metadataPath]);

      console.log(`✅ Removed model: ${model.name}`);
      
      // Check if repo directory is empty and remove it
      const repoDir = model.path.substring(0, model.path.lastIndexOf('/'));
      const result = Bun.spawnSync(['find', repoDir, '-type', 'f']);
      const remainingFiles = result.stdout.toString().trim();
      
      if (!remainingFiles) {
        Bun.spawnSync(['rm', '-rf', repoDir]);
        console.log(`📁 Removed empty directory: ${repoDir.split('/').pop()}`);
      }
      
    } catch (error) {
      console.error(`❌ Failed to remove model: ${error}`);
    }
  }

  /**
   * Clean all models
   */
  async cleanAllModels(): Promise<void> {
    const modelsFile = Bun.file(this.modelsDir);
    if (!(await modelsFile.exists())) {
      console.log(`📭 No models directory found.`);
      return;
    }

    try {
      Bun.spawnSync(['rm', '-rf', this.modelsDir]);
      console.log(`✅ All models removed.`);
      this.ensureModelsDirectory();
    } catch (error) {
      console.error(`❌ Failed to clean models: ${error}`);
    }
  }

  /**
   * Get the first available model path (for examples)
   */
  async getFirstModelPath(): Promise<string | null> {
    const models = await this.getAllModels();
    return models.length > 0 ? models[0].path : null;
  }

  private async getAllModels(): Promise<ModelInfo[]> {
    const fs = require('fs');
    
    if (!fs.existsSync(this.modelsDir)) {
      return [];
    }

    const models: ModelInfo[] = [];
    
    try {
      // Use readdir instead of find for better reliability
      const readdirResult = await this.readDirectoryRecursive(this.modelsDir);
      const repoDirs = readdirResult.filter(item => item.isDirectory);

      for (const repoDir of repoDirs) {
        // Get files in the repo directory
        const repoFiles = await this.readDirectoryRecursive(repoDir.path);
        const modelFiles = repoFiles.filter(item => 
          !item.isDirectory && 
          (item.name.endsWith('.rkllm') || 
           item.name.endsWith('.bin') || 
           item.name.endsWith('.safetensors') || 
           item.name.endsWith('.gguf'))
        );

        for (const modelFile of modelFiles) {
          if (!modelFile) continue;
          
          const file = Bun.file(modelFile.path);
          if (await file.exists()) {
            const stats = await file.stat();
            const repoName = repoDir.name;
            const fileName = modelFile.name;
            
            models.push({
              name: `${repoName}/${fileName}`,
              path: modelFile.path,
              size: stats.size,
              created: new Date(stats.birthtime || stats.mtime)
            });
          }
        }
      }
      
    } catch (error) {
      console.error(`❌ Failed to get models: ${error}`);
    }

    return models;
  }

  private async promptForRepo(): Promise<string> {
    console.log(`\n🤖 Enter HuggingFace repository (e.g., 'microsoft/DialoGPT-medium'):`);
    console.log(`💡 Popular choices:`);
    console.log(`   • microsoft/DialoGPT-medium`);
    console.log(`   • microsoft/DialoGPT-small`);
    console.log(`   • gpt2`);
    console.log(`   • distilgpt2`);
    
    const input = prompt(`Repository: `);
    if (!input || input.trim() === '') {
      console.log(`❌ Repository is required.`);
      process.exit(1);
    }
    return input.trim();
  }

  private async promptForFilename(repo: string): Promise<string> {
    console.log(`\n📁 Enter filename (e.g., 'pytorch_model.bin', 'model.safetensors'):`);
    console.log(`💡 Common filenames:`);
    console.log(`   • pytorch_model.bin`);
    console.log(`   • model.safetensors`);
    console.log(`   • model.gguf`);
    console.log(`   • consolidated.00.pth`);
    
    const input = prompt(`Filename: `);
    if (!input || input.trim() === '') {
      console.log(`❌ Filename is required.`);
      process.exit(1);
    }
    return input.trim();
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private showProgressBar(downloaded: number, total: number): void {
    const percentage = total > 0 ? (downloaded / total) * 100 : 0;
    const barLength = 40;
    const filledLength = Math.round((percentage / 100) * barLength);
    
    // Create progress bar with different colors/chars based on progress
    let bar = '';
    const filled = '█';
    const empty = '░';
    
    // Color coding for different progress levels
    for (let i = 0; i < barLength; i++) {
      if (i < filledLength) {
        if (percentage < 25) {
          bar += filled; // Red zone
        } else if (percentage < 50) {
          bar += filled; // Yellow zone  
        } else if (percentage < 75) {
          bar += filled; // Orange zone
        } else {
          bar += filled; // Green zone
        }
      } else {
        bar += empty;
      }
    }
    
    const speed = this.calculateDownloadSpeed(downloaded);
    const eta = this.calculateETA(downloaded, total, speed);
    
    // Clear the current line and write progress
    process.stdout.write('\r');
    
    // Add status emoji based on progress
    let statusEmoji = '📥';
    if (percentage >= 100) {
      statusEmoji = '✅';
    } else if (percentage >= 75) {
      statusEmoji = '🔥';
    } else if (percentage >= 50) {
      statusEmoji = '⚡';
    } else if (percentage >= 25) {
      statusEmoji = '🚀';
    }
    
    process.stdout.write(
      `${statusEmoji} [${bar}] ${percentage.toFixed(1)}% ` +
      `(${this.formatBytes(downloaded)}/${this.formatBytes(total)}) ` +
      `${this.formatBytes(speed)}/s ${eta}`
    );
    
    // Force immediate output
    try {
      (process.stdout as any).flush?.();
    } catch {
      // Ignore flush errors
    }
    
    // Add newline when complete
    if (percentage >= 100) {
      process.stdout.write('\n✅ Download completed!\n');
    }
  }

  private downloadStartTime: number = 0;
  private lastDownloadedBytes: number = 0;
  private lastSpeedUpdate: number = 0;

  private calculateDownloadSpeed(downloaded: number): number {
    const now = Date.now();
    
    if (this.downloadStartTime === 0) {
      this.downloadStartTime = now;
      this.lastDownloadedBytes = downloaded;
      this.lastSpeedUpdate = now;
      return 0;
    }
    
    // Update speed every 500ms
    if (now - this.lastSpeedUpdate < 500) {
      return this.lastCalculatedSpeed || 0;
    }
    
    const timeDiff = (now - this.lastSpeedUpdate) / 1000; // seconds
    const bytesDiff = downloaded - this.lastDownloadedBytes;
    const speed = bytesDiff / timeDiff;
    
    this.lastDownloadedBytes = downloaded;
    this.lastSpeedUpdate = now;
    this.lastCalculatedSpeed = speed;
    
    return speed;
  }

  private lastCalculatedSpeed: number = 0;

  private calculateETA(downloaded: number, total: number, speed: number): string {
    if (speed === 0 || downloaded === 0) return 'ETA: --:--';
    
    const remaining = total - downloaded;
    const etaSeconds = remaining / speed;
    
    if (etaSeconds < 60) {
      return `ETA: ${Math.round(etaSeconds)}s`;
    } else if (etaSeconds < 3600) {
      const minutes = Math.floor(etaSeconds / 60);
      const seconds = Math.round(etaSeconds % 60);
      return `ETA: ${minutes}m ${seconds}s`;
    } else {
      const hours = Math.floor(etaSeconds / 3600);
      const minutes = Math.floor((etaSeconds % 3600) / 60);
      return `ETA: ${hours}h ${minutes}m`;
    }
  }

  /**
   * Recursively read directory contents
   */
  private async readDirectoryRecursive(dirPath: string): Promise<{name: string, path: string, isDirectory: boolean}[]> {
    const items: {name: string, path: string, isDirectory: boolean}[] = [];
    
    try {
      const fs = require('fs');
      const path = require('path');
      
      if (!fs.existsSync(dirPath)) {
        return items;
      }

      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        items.push({
          name: entry.name,
          path: fullPath,
          isDirectory: entry.isDirectory()
        });

        // Recursively scan subdirectories
        if (entry.isDirectory()) {
          const subItems = await this.readDirectoryRecursive(fullPath);
          items.push(...subItems);
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dirPath}: ${error}`);
    }
    
    return items;
  }

  /**
   * Get model info by name
   */
  async getModelInfo(modelName: string): Promise<ModelInfo | null> {
    const models = await this.getAllModels();
    return models.find(model => model.name === modelName) || null;
  }

  /**
   * Download only a specific model file (no tokenizer or config files)
   */
  async pullModelOnly(repo: string, modelFileName: string): Promise<void> {
    console.log(`🎯 Downloading specific model file: ${modelFileName} from ${repo}...`);
    
    const repoDir = `${this.modelsDir}/${repo}`;
    
    // Create repo directory
    try {
      Bun.spawnSync(['mkdir', '-p', repoDir]);
      console.log(`📁 Created directory: ${repoDir}`);
    } catch (error) {
      console.error(`❌ Failed to create directory: ${error}`);
      return;
    }

    // Check if file exists in repo
    const allFiles = await this.getRepoFiles(repo);
    if (!allFiles.includes(modelFileName)) {
      console.error(`❌ Model file '${modelFileName}' not found in repository`);
      const availableModels = allFiles.filter(f => 
        f.endsWith('.rkllm') || f.endsWith('.bin') || f.endsWith('.safetensors') || f.endsWith('.gguf')
      );
      console.log('📋 Available model files:', availableModels.slice(0, 5).join(', '));
      return;
    }

    try {
      console.log(`⬇️  Downloading ${modelFileName}...`);
      await this.downloadFile(repo, modelFileName, repoDir);
      
      // Save minimal metadata
      const metadataPath = `${repoDir}/meta.json`;
      const metadata = {
        repo
      };
      
      await Bun.write(metadataPath, JSON.stringify(metadata, null, 2));
      console.log(`🎉 Model file downloaded successfully!`);
      console.log(`📁 Path: ${repoDir}/${modelFileName}`);
      
    } catch (error) {
      console.error(`❌ Failed to download ${modelFileName}: ${error}`);
    }
  }
}

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
      await manager.pullModel(repo, filename);
      break;

    case 'pull-complete':
    case 'download':
      const repoComplete = args[1];
      const modelFile = args[2];
      if (!repoComplete) {
        console.log(`❌ Please specify a repository.`);
        console.log(`Usage: bun tools.ts pull-complete <repo> [model-file]`);
        console.log(`Example: bun tools.ts pull-complete punchnox/Tinnyllama-1.1B-rk3588-rkllm-1.1.4`);
        process.exit(1);
      }
      await manager.pullModelComplete(repoComplete, modelFile);
      break;

    case 'list':
      await manager.listModels();
      break;

    case 'info':
      const modelName = args[1];
      if (!modelName) {
        console.log(`❌ Please specify a model name.`);
        console.log(`Usage: bun tools.ts info <model-name>`);
        process.exit(1);
      }
      await manager.showModelInfo(modelName);
      break;

    case 'remove':
      const removeModelName = args[1];
      if (!removeModelName) {
        console.log(`❌ Please specify a model name.`);
        console.log(`Usage: bun tools.ts remove <model-name>`);
        process.exit(1);
      }
      await manager.removeModel(removeModelName);
      break;

    case 'clean':
      await manager.cleanAllModels();
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

    case 'pull-model-only':
      const repoModelOnly = args[1];
      const modelFileOnly = args[2];
      if (!repoModelOnly || !modelFileOnly) {
        console.log(`❌ Please specify repository and model file.`);
        console.log(`Usage: bun tools.ts pull-model-only <repo> <model-file>`);
        console.log(`Example: bun tools.ts pull-model-only limcheekin/Qwen2.5-0.5B-Instruct-rk3588-1.1.4 Qwen2.5-0.5B-Instruct-rk3588-w8a8-opt-0-hybrid-ratio-0.0.rkllm`);
        process.exit(1);
      }
      await manager.pullModelOnly(repoModelOnly, modelFileOnly);
      break;

    default:
      console.log(`📖 Usage:`);
      console.log(`   bun tools.ts pull [repo] [filename]           - Download single model file`);
      console.log(`   bun tools.ts pull-complete [repo] [model]     - Download model + essential technical files`);
      console.log(`   bun tools.ts pull-model-only [repo] [model]   - Download ONLY the specified model file`);
      console.log(`   bun tools.ts download [repo] [model]          - Alias for pull-complete`);
      console.log(`   bun tools.ts list                             - List all downloaded models`);
      console.log(`   bun tools.ts info [model-name]                - Show model information`);
      console.log(`   bun tools.ts remove [model-name]              - Remove a model`);
      console.log(`   bun tools.ts clean                            - Clean all models`);
      console.log(`\n📚 Examples:`);
      console.log(`   # Download complete model with tokenizer:`);
      console.log(`   bun tools.ts pull-complete punchnox/Tinnyllama-1.1B-rk3588-rkllm-1.1.4`);
      console.log(`   bun tools.ts download punchnox/Tinnyllama-1.1B-rk3588-rkllm-1.1.4 TinyLlama-1.1B-Chat-v1.0-rk3588-w8a8-opt-0-hybrid-ratio-0.5.rkllm`);
      console.log(`\n   # Traditional single file download:`);
      console.log(`   bun tools.ts pull microsoft/DialoGPT-medium pytorch_model.bin`);
      console.log(`\n   # Management:`);
      console.log(`   bun tools.ts list`);
      console.log(`   bun tools.ts info punchnox_Tinnyllama-1.1B-rk3588-rkllm-1.1.4`);
      break;
  }
}

// Export for use in other files
export { RKLLMModelManager };

// Run CLI if this file is executed directly
if (import.meta.main) {
  main().catch(console.error);
}
