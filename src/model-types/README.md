# Model Types

## Purpose
Defines TypeScript interfaces and types for RKLLM model management and metadata.

## Components

### `ModelInfo` Interface
Core interface representing a downloaded RKLLM model with all its metadata:

```typescript
interface ModelInfo {
  name: string;        // Human-readable model name
  path: string;        // Absolute path to .rkllm file
  size: number;        // File size in bytes
  created: Date;       // Download/creation timestamp
  repo?: string;       // HuggingFace repository name
  filename?: string;   // Original filename
}
```

## Usage

### Import
```typescript
import type { ModelInfo } from '../model-types/model-types';
```

### Example
```typescript
const model: ModelInfo = {
  name: "Qwen2.5-0.5B-Instruct",
  path: "/home/user/models/limcheekin/Qwen2.5-0.5B-Instruct-rk3588-1.1.4/model.rkllm",
  size: 524288000,
  created: new Date(),
  repo: "limcheekin/Qwen2.5-0.5B-Instruct-rk3588-1.1.4",
  filename: "Qwen2.5-0.5B-Instruct-rk3588-w8a8-opt-0-hybrid-ratio-0.0.rkllm"
};
```

## Design Principles

### Type Safety
- All properties properly typed with exact types
- Optional fields marked with `?` for flexible usage
- No `any` types - strict TypeScript compliance

### Consistency
- Used across all model management components
- Consistent naming with filesystem conventions
- Compatible with JSON serialization/deserialization

### Extensibility
- Easy to add new properties without breaking changes
- Optional fields allow gradual feature adoption
- Compatible with future RKLLM model formats

## Dependencies
- None - pure TypeScript interfaces
- Compatible with all runtimes (Node.js, Bun, Deno)

## Testing
- `model-types.test.ts` - Validates interface definitions and type safety
- Tests cover all required and optional properties
- Validates serialization compatibility
