#!/usr/bin/env bun

/**
 * RKLLMJS Model Management Tool
 * 
 * Usage:
 *   bun tools.ts pull [repo] [filename]  - Download model from HuggingFace
 *   bun tools.ts list                    - List all downloaded models
 *   bun tools.ts info [model-name]       - Show model information
 *   bun tools.ts remove [model-name]     - Remove a model
 *   bun tools.ts clean                   - Clean all models
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

  constructor() {
    this.modelsDir = './models';
    this.ensureModelsDirectory();
  }

  private ensureModelsDirectory(): void {
    try {
      // Use Bun's file system API
      const file = Bun.file(this.modelsDir);
      if (!file.exists()) {
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

    const repoDir = `${this.modelsDir}/${repo.replace('/', '_')}`;
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
          
          // Update progress every 1% or every 1MB, whichever comes first
          const progressPercent = (downloadedBytes / totalSize) * 100;
          const shouldUpdate = progressPercent - lastProgressUpdate >= 1 || 
                             downloadedBytes - (lastProgressUpdate * totalSize / 100) >= 1024 * 1024;
          
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
      const metadataPath = `${repoDir}/${filename}.meta.json`;
      const metadata = {
        repo,
        filename,
        downloadedAt: new Date().toISOString(),
        size: downloadedBytes,
        url: downloadUrl
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
   * List all downloaded models
   */
  async listModels(): Promise<ModelInfo[]> {
    const modelsFile = Bun.file(this.modelsDir);
    if (!(await modelsFile.exists())) {
      console.log(`📭 No models directory found. Run 'bun tools.ts pull' to download models.`);
      return [];
    }

    const models: ModelInfo[] = [];
    
    try {
      // Get list of directories
      const result = Bun.spawnSync(['find', this.modelsDir, '-type', 'd', '-mindepth', '1', '-maxdepth', '1']);
      const repoDirs = result.stdout.toString().trim().split('\n').filter(dir => dir);

      if (repoDirs.length === 0) {
        console.log(`📭 No models found. Run 'bun tools.ts pull' to download models.`);
        return [];
      }

      console.log(`\n📚 Downloaded Models:`);
      console.log(`${'='.repeat(80)}`);
      console.log(`${'Model Name'.padEnd(30)} ${'Size'.padEnd(12)} ${'Date'.padEnd(20)} ${'Path'}`);
      console.log(`${'-'.repeat(80)}`);

      for (const repoDirPath of repoDirs) {
        // Get files in the repo directory
        const filesResult = Bun.spawnSync(['find', repoDirPath, '-type', 'f', '-name', '*.rkllm', '-o', '-name', '*.bin', '-o', '-name', '*.safetensors', '-o', '-name', '*.gguf']);
        const modelFiles = filesResult.stdout.toString().trim().split('\n').filter(file => file);

        for (const filePath of modelFiles) {
          if (!filePath) continue;
          
          const file = Bun.file(filePath);
          if (await file.exists()) {
            const stats = await file.stat();
            const repoName = repoDirPath.split('/').pop() || '';
            const fileName = filePath.split('/').pop() || '';
            
            // Try to load metadata
            const metadataPath = `${filePath}.meta.json`;
            let metadata: any = {};
            const metadataFile = Bun.file(metadataPath);
            if (await metadataFile.exists()) {
              try {
                metadata = await metadataFile.json();
              } catch {}
            }

            const modelInfo: ModelInfo = {
              name: `${repoName}/${fileName}`,
              path: filePath,
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
    const metadataPath = `${model.path}.meta.json`;
    const metadataFile = Bun.file(metadataPath);
    if (await metadataFile.exists()) {
      try {
        const metadata = await metadataFile.json();
        console.log(`Download URL: ${metadata.url}`);
        console.log(`Downloaded: ${new Date(metadata.downloadedAt).toLocaleString()}`);
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
      
      // Remove metadata if exists
      const metadataPath = `${model.path}.meta.json`;
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
    const modelsFile = Bun.file(this.modelsDir);
    if (!(await modelsFile.exists())) {
      return [];
    }

    const models: ModelInfo[] = [];
    
    try {
      // Get list of directories
      const result = Bun.spawnSync(['find', this.modelsDir, '-type', 'd', '-mindepth', '1', '-maxdepth', '1']);
      const repoDirs = result.stdout.toString().trim().split('\n').filter(dir => dir);

      for (const repoDirPath of repoDirs) {
        // Get files in the repo directory
        const filesResult = Bun.spawnSync(['find', repoDirPath, '-type', 'f', '-name', '*.rkllm', '-o', '-name', '*.bin', '-o', '-name', '*.safetensors', '-o', '-name', '*.gguf']);
        const modelFiles = filesResult.stdout.toString().trim().split('\n').filter(file => file);

        for (const filePath of modelFiles) {
          if (!filePath) continue;
          
          const file = Bun.file(filePath);
          if (await file.exists()) {
            const stats = await file.stat();
            const repoName = repoDirPath.split('/').pop() || '';
            const fileName = filePath.split('/').pop() || '';
            
            models.push({
              name: `${repoName}/${fileName}`,
              path: filePath,
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

    default:
      console.log(`📖 Usage:`);
      console.log(`   bun tools.ts pull [repo] [filename]  - Download model from HuggingFace`);
      console.log(`   bun tools.ts list                    - List all downloaded models`);
      console.log(`   bun tools.ts info [model-name]       - Show model information`);
      console.log(`   bun tools.ts remove [model-name]     - Remove a model`);
      console.log(`   bun tools.ts clean                   - Clean all models`);
      console.log(`\n📚 Examples:`);
      console.log(`   bun tools.ts pull microsoft/DialoGPT-medium pytorch_model.bin`);
      console.log(`   bun tools.ts pull gpt2 model.safetensors`);
      console.log(`   bun tools.ts list`);
      console.log(`   bun tools.ts info DialoGPT-medium`);
      break;
  }
}

// Export for use in other files
export { RKLLMModelManager };

// Run CLI if this file is executed directly
if (import.meta.main) {
  await main();
}
