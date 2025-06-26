# Tools Module Structure

This directory contains the modular implementation of the RKLLM model management tools, refactored from the original monolithic `tools.ts` file.

## Files

### `types.ts` (11 lines)
- Contains type definitions for model management
- Exports `ModelInfo` interface

### `utils.ts` (32 lines) 
- Utility functions for file operations
- Helper functions for formatting and validation

### `model-manager.ts` (385 lines)
- Core `RKLLMModelManager` class
- Handles downloading, listing, and managing .rkllm models
- Contains all business logic for model operations

### `index.ts` (131 lines)
- CLI interface and command routing
- Handles command line arguments and user interactions
- Imports and uses the model manager

## Benefits

- **Separation of Concerns**: Each file has a clear, focused responsibility
- **Maintainability**: Code is easier to understand and modify
- **Testability**: Individual components can be tested in isolation
- **Reduced Complexity**: No single file exceeds manageable complexity

## Usage

The refactored structure maintains full backward compatibility. Users can still run:

```bash
bun tools.ts pull <repo> <filename>
bun tools.ts list
bun tools.ts info <model-name>
bun tools.ts remove <model-name>
bun tools.ts clean
```

The main `tools.ts` file now acts as a thin wrapper that imports and delegates to the modular implementation.