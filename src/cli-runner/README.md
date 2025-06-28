# CLI Runner

## Purpose
Provides command-line interface for RKLLM model management with multi-runtime support (Node.js, Bun, Deno).

## Architecture

### Core Components
```
CLIRunner
├── Command Parser    # Parse and validate CLI arguments
├── Runtime Detector  # Detect and adapt to current runtime
├── Model Manager     # Delegate to model management operations
└── Help System      # Generate usage instructions and examples
```

### Multi-Runtime Design
- **Primary Runtime**: Node.js (stable, mature ecosystem)
- **Alternative Runtimes**: Bun (performance), Deno (modern features)
- **Runtime Detection**: Automatic detection and adaptation
- **Consistent API**: Same commands work across all runtimes

## Commands

### Download Models
```bash
# Node.js (primary)
npm run cli pull <repo> <model>

# Bun (alternative)
npm run cli:bun pull <repo> <model>

# Deno (experimental)
npm run cli:deno pull <repo> <model>
```

### Model Management
```bash
npm run cli list                    # List all downloaded models
npm run cli info <model-name>       # Show model details
npm run cli remove <model-name>     # Remove specific model
npm run cli clean                   # Remove all models
npm run cli debug                   # Debug mode - filesystem scan
```

## Usage Examples

### Download Popular Models
```bash
# Download Qwen 0.5B model
npm run cli pull limcheekin/Qwen2.5-0.5B-Instruct-rk3588-1.1.4 \
  Qwen2.5-0.5B-Instruct-rk3588-w8a8-opt-0-hybrid-ratio-0.0.rkllm

# Download TinyLlama model  
npm run cli pull punchnox/Tinnyllama-1.1B-rk3588-rkllm-1.1.4 \
  TinyLlama-1.1B-Chat-v1.0-rk3588-w8a8-opt-0-hybrid-ratio-0.5.rkllm
```

### Model Operations
```bash
npm run cli list                           # Show all models
npm run cli info "Qwen2.5-0.5B-Instruct"  # Model details
npm run cli remove "TinyLlama"             # Remove model
npm run cli clean                          # Remove all models
```

## Design Principles

### Command Pattern
Each command maps to a dedicated handler method:
- `pull` → `handlePull()` - Download models from HuggingFace
- `list` → `handleList()` - List local models
- `info` → `handleInfo()` - Show model details
- `remove` → `handleRemove()` - Delete models
- `clean` → `handleClean()` - Clear all models

### Input Validation
- Required arguments validated before execution
- Clear error messages with usage examples
- Graceful exit codes for scripting compatibility

### Runtime Adaptation
```typescript
// Automatic runtime detection
const runtime = this.detector.detect();
console.log(`🔧 Runtime: ${runtime.type} v${runtime.version}`);

// Experimental runtime warnings
if (this.detector.isExperimental()) {
  console.log(`⚠️  Warning: ${runtime.type} is experimental`);
}
```

## Dependencies
- `ModelManager` - Core model operations
- `RuntimeDetector` - Runtime detection and adaptation
- `configs/models.json` - Configuration data

## Entry Points

### Package.json Scripts
```json
{
  "cli": "node dist/cli-runner/cli-runner.js",        // Node.js
  "cli:bun": "bun src/cli-runner/cli-runner.ts",      // Bun  
  "cli:deno": "deno run --allow-all src/cli-runner/cli-runner.ts"  // Deno
}
```

### Direct Execution
```typescript
// Runtime-agnostic main function
async function main() {
  const detector = RuntimeDetector.getInstance();
  const runtime = detector.detect();
  
  // Get CLI args based on runtime
  const args = runtime.type === 'node' ? process.argv.slice(2) :
               runtime.type === 'bun' ? Bun.argv.slice(2) :
               runtime.type === 'deno' ? Deno.args : [];
               
  const runner = new CLIRunner();
  await runner.run(args);
}
```

## Error Handling
- Validation errors: Clear messages with usage help
- File system errors: Graceful handling with suggestions
- Network errors: Retry suggestions and troubleshooting
- Exit codes: Standard POSIX codes for scripting

## Testing
- `cli-runner.test.ts` - Command parsing and validation
- Mock external dependencies (ModelManager, RuntimeDetector)
- Test all command flows and error conditions
- Validate help system and examples
