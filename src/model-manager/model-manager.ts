/**
 * RKLLM Model Manager - handles downloading and managing .rkllm models
 * Multi-runtime support: Node.js (primary), Bun, Deno
 */

import type { ModelInfo } from '../model-types/model-types';
import { RuntimeDetector } from '../runtime-detector/runtime-detector';

// Runtime-agnostic modules
let fs: any;
let path: any;
let constants: any;

// Initialize runtime-specific modules
async function initializeModules() {
  const detector = RuntimeDetector.getInstance();
  
  try {
    fs = await detector.getFileSystem();
    path = await detector.getPath();
    
    // Load constants - runtime specific
    const runtime = detector.detect();
    if (runtime.type === 'node' || runtime.type === 'bun') {
      const requireFn = detector.getRequire();
      if (requireFn) {
        const modelsConfigPath = requireFn('path').resolve(__dirname, '../../configs/models.json');
        constants = JSON.parse(requireFn('fs').readFileSync(modelsConfigPath, 'utf8'));
      }
    } else if (runtime.type === 'deno') {
      // For Deno, use direct file read
      const modelsConfigPath = './configs/models.json';
      const constantsText = fs.readFileSync(modelsConfigPath, 'utf8');
      constants = JSON.parse(constantsText);
    }
  } catch (error) {
    throw new Error(`Failed to initialize runtime modules: ${error}`);
  }
}

// CLI examples constants (for help messages)
// Used in interactive prompts and error messages
const CLI_EXAMPLES = {
  PULL_QWEN: `npm run cli pull ${constants.EXAMPLE_REPOSITORIES.QWEN_05B} ${constants.EXAMPLE_MODEL_FILES.QWEN_05B}`,
  PULL_TINYLLAMA: `npm run cli pull ${constants.EXAMPLE_REPOSITORIES.TINYLLAMA} ${constants.EXAMPLE_MODEL_FILES.TINYLLAMA}`,
  LIST: 'npm run cli list',
  INFO: 'npm run cli info [model-name]',
  REMOVE: 'npm run cli remove [model-name]',
  CLEAN: 'npm run cli clean'
};

export class RKLLMModelManager {
  private modelsDir: string;
  private detector: RuntimeDetector;
  private initialized: boolean = false;

  constructor(modelsDir: string = './models') {
    this.modelsDir = modelsDir;
    this.detector = RuntimeDetector.getInstance();
    // Initialize directory creation on construction
    this.ensureModelsDirectory();
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await initializeModules();
      this.initialized = true;
    }
  }

  private async ensureModelsDirectory(): Promise<void> {
    await this.ensureInitialized();
    
    try {
      // Runtime-agnostic directory creation
      const runtime = this.detector.detect();
      
      if (runtime.type === 'node' || runtime.type === 'bun') {
        if (!fs.existsSync(this.modelsDir)) {
          await this.detector.executeCommand('mkdir', ['-p', this.modelsDir]);
          console.log(`📁 Created models directory: ${this.modelsDir}`);
        }        } else if (runtime.type === 'deno') {
          try {
            await fs.stat(this.modelsDir);
          } catch {
            await fs.mkdir(this.modelsDir, { recursive: true });
            console.log(`📁 Created models directory: ${this.modelsDir}`);
          }
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

    const modelDir = path.join(this.modelsDir, repo);

    console.log(`📥 Downloading model from ${repo}...`);
    console.log(`🎯 Target: ${filename}`);
    console.log(`📂 Directory: ${modelDir}`);

    // Ensure model directory exists
    if (!fs.existsSync(modelDir)) {
      if (this.detector.detect().type === 'bun' && Bun) {
        Bun.spawnSync(['mkdir', '-p', modelDir]);
      } else {
        fs.mkdirSync(modelDir, { recursive: true });
      }
    }

    try {
      // Download the .rkllm model file
      const modelUrl = `https://huggingface.co/${repo}/resolve/main/${filename}`;
      const modelPath = path.join(modelDir, filename);
      
      console.log(`🔄 Downloading ${filename}...`);
      const modelResponse = await fetch(modelUrl);
      
      if (!modelResponse.ok) {
        throw new Error(`Failed to download model: ${modelResponse.status} ${modelResponse.statusText}`);
      }

      const modelBuffer = await modelResponse.arrayBuffer();
      fs.writeFileSync(modelPath, new Uint8Array(modelBuffer));
      console.log(`✅ Downloaded ${filename} (${(modelBuffer.byteLength / 1024 / 1024).toFixed(2)} MB)`);

      // Download essential technical files
      const essentialFiles = [
        'config.json',
        'generation_config.json', 
        'meta.json',
        'tokenizer_config.json',
        'tokenizer.json'
      ];

      console.log(`📋 Downloading ${essentialFiles.length} essential technical files...`);
      
      for (const file of essentialFiles) {
        try {
          const fileUrl = `https://huggingface.co/${repo}/resolve/main/${file}`;
          const filePath = path.join(modelDir, file);
          
          console.log(`  🔄 ${file}...`);
          const response = await fetch(fileUrl);
          
          if (response.ok) {
            const buffer = await response.arrayBuffer();
            fs.writeFileSync(filePath, new Uint8Array(buffer));
            console.log(`  ✅ ${file} (${(buffer.byteLength / 1024).toFixed(1)} KB)`);
          } else {
            console.log(`  ⚠️  ${file} (not available - ${response.status})`);
          }
        } catch (error) {
          console.log(`  ❌ ${file} (download failed)`);
        }
      }

      console.log(`\n🎉 Model successfully downloaded!`);
      console.log(`📂 Location: ${modelDir}`);
      console.log(`🤖 Model file: ${filename}`);
      
    } catch (error) {
      console.error(`❌ Failed to download model: ${error}`);
      throw error;
    }
  }

  /**
   * List all downloaded models
   */
  async listModels(): Promise<ModelInfo[]> {
    console.log(`📋 Scanning models directory: ${this.modelsDir}`);
    
    if (!fs.existsSync(this.modelsDir)) {
      console.log(`📂 No models directory found. Use 'pull' command to download models.`);
      return [];
    }

    const models: ModelInfo[] = [];
    
    try {
      const items = fs.readdirSync(this.modelsDir, { withFileTypes: true });
      
      for (const item of items) {
        if (item.isDirectory()) {
          const itemPath = path.join(this.modelsDir, item.name);
          const subItems = fs.readdirSync(itemPath, { withFileTypes: true });
          
          // Look for .rkllm files
          for (const subItem of subItems) {
            if (subItem.name.endsWith('.rkllm')) {
              const modelPath = path.join(itemPath, subItem.name);
              const stats = fs.statSync(modelPath);
              
              const modelInfo: ModelInfo = {
                name: subItem.name.replace('.rkllm', ''),
                path: modelPath,
                size: stats.size,
                created: stats.birthtime,
                repo: item.name,
                filename: subItem.name
              };
              
              models.push(modelInfo);
            }
          }
        }
      }
      
      if (models.length === 0) {
        console.log(`📭 No RKLLM models found.`);
      console.log(`💡 Use 'npm run cli pull <repo> <model>' to download models.`);
      console.log(`💡 Example: ${CLI_EXAMPLES.PULL_QWEN}`);
        return [];
      }
      
      console.log(`\n🤖 Found ${models.length} RKLLM model(s):`);
      console.log(`${'='.repeat(80)}`);
      
      models.forEach((model, index) => {
        const sizeInMB = (model.size / 1024 / 1024).toFixed(2);
        console.log(`${index + 1}. ${model.name}`);
        console.log(`   📂 Repository: ${model.repo}`);
        console.log(`   📄 File: ${model.filename}`);
        console.log(`   📊 Size: ${sizeInMB} MB`);
        console.log(`   📅 Downloaded: ${model.created.toLocaleString()}`);
        console.log(`   📍 Path: ${model.path}`);
        console.log('');
      });
      
    } catch (error) {
      console.error(`❌ Error scanning models: ${error}`);
      return [];
    }
    
    return models;
  }

  /**
   * Show detailed information about a specific model
   */
  async showModelInfo(modelName: string): Promise<void> {
    const models = await this.listModels();
    const model = models.find(m => m.name.toLowerCase().includes(modelName.toLowerCase()));
    
    if (!model) {
      console.log(`❌ Model '${modelName}' not found.`);
      console.log(`💡 Use 'npm run cli list' to see available models.`);
      return;
    }
    
    console.log(`🤖 Model Information: ${model.name}`);
    console.log(`${'='.repeat(50)}`);
    console.log(`📂 Repository: ${model.repo}`);
    console.log(`📄 Filename: ${model.filename}`);
    console.log(`📊 Size: ${(model.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📅 Downloaded: ${model.created.toLocaleString()}`);
    console.log(`📍 Full Path: ${model.path}`);
    
    // Check for additional files
    const modelDir = path.dirname(model.path);
    const files = fs.readdirSync(modelDir);
    const configFiles = files.filter((f: string) => f.endsWith('.json'));
    
    if (configFiles.length > 0) {
      console.log(`\n📋 Configuration Files:`);
      configFiles.forEach((file: string) => {
        const filePath = path.join(modelDir, file);
        const stats = fs.statSync(filePath);
        console.log(`   • ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
      });
    }
  }

  /**
   * Remove a specific model
   */
  async removeModel(modelName: string): Promise<void> {
    const models = await this.listModels();
    const model = models.find(m => m.name.toLowerCase().includes(modelName.toLowerCase()));
    
    if (!model) {
      console.log(`❌ Model '${modelName}' not found.`);
      return;
    }
    
    const modelDir = path.dirname(model.path);
    
    try {
      // Remove entire model directory
      if (this.detector.detect().type === 'bun' && Bun) {
        Bun.spawnSync(['rm', '-rf', modelDir]);
      } else {
        await fs.rm(modelDir, { recursive: true, force: true });
      }
      console.log(`🗑️  Removed model: ${model.name}`);
      console.log(`📂 Deleted directory: ${modelDir}`);
    } catch (error) {
      console.error(`❌ Failed to remove model: ${error}`);
    }
  }

  /**
   * Clean all models
   */
  async cleanModels(): Promise<void> {
    if (!fs.existsSync(this.modelsDir)) {
      console.log(`📂 No models directory to clean.`);
      return;
    }
    
    try {
      const items = fs.readdirSync(this.modelsDir);
      if (items.length === 0) {
        console.log(`📭 Models directory is already empty.`);
        return;
      }
      
      // Remove all items in models directory
      for (const item of items) {
        const itemPath = path.join(this.modelsDir, item);
        if (this.detector.detect().type === 'bun' && Bun) {
          Bun.spawnSync(['rm', '-rf', itemPath]);
        } else {
          await fs.rm(itemPath, { recursive: true, force: true });
        }
      }
      
      console.log(`🧹 Cleaned all models from ${this.modelsDir}`);
      console.log(`📂 Removed ${items.length} item(s)`);
    } catch (error) {
      console.error(`❌ Failed to clean models: ${error}`);
    }
  }

  /**
   * Interactive prompt to select repository
   */
  private async promptForRepo(): Promise<string> {
    console.log(`\n🤖 Available RKLLM Model Repositories:`);
    console.log(`${'='.repeat(50)}`);
    
    constants.REPOSITORY_SUGGESTIONS.forEach((repo: string, index: number) => {
      console.log(`${index + 1}. ${repo}`);
    });
    
    console.log(`\n💡 Choose a repository number or enter custom repo (format: user/repo-name):`);
    
    // For now, return first suggestion as default
    // In a real implementation, you'd use process.stdin for interactive input
    return constants.REPOSITORY_SUGGESTIONS[0];
  }

  /**
   * Interactive prompt to select model filename
   */
  private async promptForFilename(repo: string): Promise<string> {
    console.log(`\n🎯 Select model file from ${repo}:`);
    
    // Try to fetch repository files list
    try {
      const apiUrl = `https://huggingface.co/api/models/${repo}`;
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const repoData = await response.json() as any;
        const rkllmFiles = repoData.files?.filter((f: any) => f.rfilename?.endsWith('.rkllm')) || [];
        
        if (rkllmFiles.length > 0) {
          console.log(`📄 Available .rkllm files:`);
          rkllmFiles.forEach((file: any, index: number) => {
            const sizeInMB = file.size ? (file.size / 1024 / 1024).toFixed(2) : 'Unknown';
            console.log(`${index + 1}. ${file.rfilename} (${sizeInMB} MB)`);
          });
          
          // For now, return first file as default
          return rkllmFiles[0].rfilename;
        }
      }
    } catch (error) {
      console.log(`⚠️  Could not fetch repository files: ${error}`);
    }
    
    // Fallback to example files
    const repoKey = Object.keys(constants.EXAMPLE_REPOSITORIES).find(
      key => constants.EXAMPLE_REPOSITORIES[key] === repo
    );
    
    if (repoKey && constants.EXAMPLE_MODEL_FILES[repoKey]) {
      return constants.EXAMPLE_MODEL_FILES[repoKey];
    }
    
    throw new Error(`No model files found for repository: ${repo}`);
  }
}
