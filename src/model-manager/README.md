# Model Manager

## Purpose
Core component for downloading, managing, and organizing RKLLM models from HuggingFace repositories with multi-runtime support.

## Architecture

### Model Management Pipeline
```
HuggingFace Repository → Download → Local Storage → Model Registry
       ↓                    ↓            ↓              ↓
   Repository API    File Download    File System    Model Index
```

### Components
- **Download Engine**: Fetch models and metadata from HuggingFace
- **Storage Manager**: Organize files in structured directory layout
- **Model Registry**: Track downloaded models with metadata
- **Runtime Adapter**: Work consistently across Node.js, Bun, Deno

## Core Operations

### Download Models (`downloadModel`)
Downloads RKLLM model file plus essential technical files:

```typescript
await manager.downloadModel(
  'limcheekin/Qwen2.5-0.5B-Instruct-rk3588-1.1.4',
  'Qwen2.5-0.5B-Instruct-rk3588-w8a8-opt-0-hybrid-ratio-0.0.rkllm'
);
```

**Downloaded Files:**
- **Primary**: `.rkllm` model file (main inference model)
- **Technical**: `config.json`, `generation_config.json`, `meta.json`
- **Tokenization**: `tokenizer_config.json`, `tokenizer.json`

### List Models (`listModels`)
Scans local filesystem and returns model inventory:

```typescript
const models: ModelInfo[] = await manager.listModels();
// Returns array of ModelInfo with path, size, dates, etc.
```

### Model Operations
```typescript
// Get specific model by name
const model = await manager.getModel('Qwen2.5-0.5B-Instruct');

// Remove model and all associated files  
await manager.removeModel('TinyLlama');

// Clear all downloaded models
await manager.cleanModels();
```

## Storage Architecture

### Directory Structure
```
models/
├── limcheekin/
│   └── Qwen2.5-0.5B-Instruct-rk3588-1.1.4/
│       ├── Qwen2.5-0.5B-Instruct-rk3588-w8a8-opt-0-hybrid-ratio-0.0.rkllm
│       ├── config.json
│       ├── generation_config.json
│       ├── meta.json
│       ├── tokenizer_config.json
│       └── tokenizer.json
└── punchnox/
    └── Tinnyllama-1.1B-rk3588-rkllm-1.1.4/
        ├── TinyLlama-1.1B-Chat-v1.0-rk3588-w8a8-opt-0-hybrid-ratio-0.5.rkllm
        └── [technical files...]
```

### Storage Benefits
- **Organized**: Repository-based directory structure
- **Complete**: Model + all technical files together
- **Discoverable**: Easy to locate models by repository
- **Portable**: Standard directory layout across systems

## Multi-Runtime Support

### Runtime Adaptation
```typescript
// Automatic runtime detection and adaptation
async function initializeModules() {
  const detector = RuntimeDetector.getInstance();
  
  fs = await detector.getFileSystem();
  path = await detector.getPath();
  
  // Load configuration based on runtime
  const runtime = detector.detect();
  if (runtime.type === 'node' || runtime.type === 'bun') {
    // Use require() for Node.js/Bun
  } else if (runtime.type === 'deno') {
    // Use Deno APIs
  }
}
```

### File System Operations
Runtime-agnostic file operations:
- **Node.js**: `fs.promises` APIs
- **Bun**: Native `Bun.write()` and `fs` compatibility
- **Deno**: `Deno.readFile()` and `Deno.writeFile()`

## Configuration Integration

### Model Configuration
Loads repository suggestions and examples from `configs/models.json`:

```typescript
// Example repositories for CLI help
const repositories = config.REPOSITORY_SUGGESTIONS;
const examples = config.EXAMPLE_MODEL_FILES;
```

### Runtime-Specific Loading
```typescript
// Node.js/Bun: Use require()
const config = require('../../configs/models.json');

// Deno: Use direct file reading  
const configText = await Deno.readTextFile('./configs/models.json');
const config = JSON.parse(configText);
```

## Download Process

### HuggingFace Integration
1. **Repository Validation**: Check repository exists and accessible
2. **File Discovery**: Scan for available `.rkllm` files
3. **Essential Files**: Download model + technical configuration files
4. **Progress Tracking**: Show download progress for large files
5. **Integrity Check**: Verify file sizes and successful downloads
6. **Metadata Storage**: Save repository info and download timestamp

### Network Error Handling
- **Retry Logic**: Automatic retry for temporary network issues
- **Resume Support**: Handle partial downloads gracefully
- **Timeout Management**: Reasonable timeouts for large files
- **Error Reporting**: Clear error messages with troubleshooting hints

## Performance Optimizations

### Download Efficiency
- **Parallel Downloads**: Download technical files concurrently
- **Progress Feedback**: Real-time progress for user experience
- **Memory Management**: Stream large files to avoid memory issues
- **Caching**: Avoid re-downloading existing files

### Storage Efficiency
- **Deduplication**: Check existing files before download
- **Cleanup**: Remove incomplete downloads on failure
- **Compression**: Preserve original file formats (no re-compression)

## Dependencies
- `RuntimeDetector` - Multi-runtime support
- `ModelInfo` types - TypeScript interfaces
- `configs/models.json` - Repository configuration
- Native runtime APIs - File system and network operations

## Testing
- `model-manager.test.ts` - All core operations and error scenarios
- Mock network requests for reliable testing
- Validate file system operations across runtimes
- Test configuration loading and parsing
- Verify error handling and edge cases

## Error Scenarios
- **Network Issues**: Connection failures, timeouts, HTTP errors
- **File System**: Permission errors, disk space, path issues
- **Configuration**: Missing or invalid configuration files
- **Runtime**: Unsupported runtime or missing APIs
