# Runtime Detector

## Purpose
Detects and adapts to different JavaScript runtimes (Node.js, Bun, Deno) to enable consistent API behavior across environments.

## Architecture

### Runtime Detection Strategy
```
Environment Analysis → Runtime Identification → API Adaptation → Unified Interface
        ↓                       ↓                    ↓              ↓
   Global Objects         Runtime Type          Native APIs    Consistent API
```

### Supported Runtimes
- **Node.js**: Primary runtime (stable, mature ecosystem)
- **Bun**: Alternative runtime (performance-focused)  
- **Deno**: Experimental runtime (modern, secure)

## Core Components

### Runtime Information (`RuntimeInfo`)
```typescript
interface RuntimeInfo {
  type: 'node' | 'bun' | 'deno' | 'unknown';
  version: string;
  isExperimental: boolean;
}
```

### Detection Logic
```typescript
detect(): RuntimeInfo {
  // Check for Deno global
  if (typeof Deno !== 'undefined') {
    return { type: 'deno', version: Deno.version.deno, isExperimental: true };
  }
  
  // Check for Bun global  
  if (typeof Bun !== 'undefined') {
    return { type: 'bun', version: Bun.version, isExperimental: false };
  }
  
  // Check for Node.js process
  if (typeof process !== 'undefined' && process.versions?.node) {
    return { type: 'node', version: process.versions.node, isExperimental: false };
  }
  
  return { type: 'unknown', version: '0.0.0', isExperimental: true };
}
```

## API Adaptation

### File System Abstraction
Provides unified file system interface across runtimes:

```typescript
async getFileSystem() {
  const runtime = this.detect();
  
  switch (runtime.type) {
    case 'node':
      return {
        readFileSync: fs.readFileSync,
        writeFileSync: fs.writeFileSync,
        existsSync: fs.existsSync,
        mkdirSync: fs.mkdirSync,
        // ... other fs methods
      };
      
    case 'bun':
      return {
        readFileSync: (path: string) => Bun.file(path).text(),
        writeFileSync: (path: string, data: any) => Bun.write(path, data),
        // ... Bun-specific implementations
      };
      
    case 'deno':
      return {
        readFileSync: (path: string) => Deno.readTextFileSync(path),
        writeFileSync: (path: string, data: any) => Deno.writeTextFileSync(path, data),
        // ... Deno-specific implementations
      };
  }
}
```

### Command Execution
Runtime-agnostic command execution:

```typescript
async executeCommand(command: string, args: string[]) {
  const runtime = this.detect();
  
  switch (runtime.type) {
    case 'node':
      return require('child_process').spawn(command, args);
      
    case 'bun':
      return Bun.spawn([command, ...args]);
      
    case 'deno':
      return new Deno.Command(command, { args }).spawn();
  }
}
```

### Module Loading
Unified module loading across runtimes:

```typescript
getRequire() {
  const runtime = this.detect();
  
  if (runtime.type === 'node' || runtime.type === 'bun') {
    return require;
  } else if (runtime.type === 'deno') {
    // Deno doesn't have require, use dynamic imports
    return null;
  }
  
  return null;
}
```

## Global Type Declarations

### Type Safety Across Runtimes
`global-types.d.ts` provides TypeScript definitions for runtime-specific globals:

```typescript
// Bun global object
declare global {
  const Bun: {
    version: string;
    argv?: string[];
    spawnSync: (command: string[], options?: any) => SpawnResult;
    write: (path: string, data: any) => Promise<void>;
    file: (path: string) => BunFile;
  } | undefined;
}

// Deno global object
declare global {
  const Deno: {
    version: { deno: string };
    args: string[];
    readTextFile: (path: string) => Promise<string>;
    writeTextFile: (path: string, data: string) => Promise<void>;
    // ... other Deno APIs
  } | undefined;
}
```

## Singleton Pattern

### Instance Management
```typescript
class RuntimeDetector {
  private static instance: RuntimeDetector;
  
  static getInstance(): RuntimeDetector {
    if (!RuntimeDetector.instance) {
      RuntimeDetector.instance = new RuntimeDetector();
    }
    return RuntimeDetector.instance;
  }
  
  private constructor() {
    // Prevent direct instantiation
  }
}
```

### Benefits
- **Single Source of Truth**: One detector instance across application
- **Performance**: Avoid repeated runtime detection
- **Consistency**: Same runtime info throughout application lifecycle

## Usage Patterns

### Component Integration
```typescript
class ModelManager {
  private detector: RuntimeDetector;
  
  constructor() {
    this.detector = RuntimeDetector.getInstance();
  }
  
  async downloadModel() {
    const runtime = this.detector.detect();
    const fs = await this.detector.getFileSystem();
    
    // Use runtime-agnostic file operations
    await fs.writeFileSync(path, data);
  }
}
```

### Runtime-Specific Features
```typescript
async optimizeForRuntime() {
  const runtime = this.detector.detect();
  
  if (runtime.type === 'bun') {
    // Use Bun's high-performance APIs
    return await Bun.file(path).arrayBuffer();
  } else if (runtime.type === 'node') {
    // Use Node.js streams for large files
    return fs.createReadStream(path);
  } else if (runtime.type === 'deno') {
    // Use Deno's secure file access
    return await Deno.readFile(path);
  }
}
```

## Error Handling

### Runtime Compatibility
```typescript
validateRuntime(): boolean {
  const runtime = this.detect();
  
  if (runtime.type === 'unknown') {
    throw new Error('Unsupported JavaScript runtime detected');
  }
  
  if (runtime.isExperimental) {
    console.warn(`⚠️  ${runtime.type} is experimental. Consider using Node.js for production.`);
  }
  
  return true;
}
```

### Graceful Degradation
- **Fallback APIs**: Use Node.js APIs when runtime-specific APIs unavailable
- **Feature Detection**: Check for API availability before usage
- **Error Messages**: Clear guidance for unsupported scenarios

## Performance Considerations

### Detection Caching
- Runtime detection result cached after first call
- Avoids repeated global object checking
- Minimal overhead for subsequent calls

### Lazy Loading
- File system and other APIs loaded only when needed
- Reduces startup time and memory usage
- Dynamic adaptation based on actual usage

## Dependencies
- None - Pure runtime detection using global objects
- Compatible with all supported runtimes
- No external libraries or runtime-specific dependencies

## Testing
- `runtime-detector.test.ts` - Runtime detection logic
- Mock global objects for testing different runtimes
- Validate API adaptation and error handling
- Test singleton behavior and caching
