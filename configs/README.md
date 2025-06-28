# Configuration Files

This directory contains configuration files for RKLLMJS.

## Files

### `models.json`
Configuration for RKLLM model management:
- **EXAMPLE_REPOSITORIES**: Sample HuggingFace repositories containing RKLLM models
- **EXAMPLE_MODEL_FILES**: Sample model filenames for examples and CLI help
- **REPOSITORY_SUGGESTIONS**: List of recommended repositories for interactive selection

## Future Configuration Files

This directory is designed to accommodate additional configuration files:
- `runtime.json` - Runtime-specific configurations
- `build.json` - Build system configurations  
- `api.json` - API endpoint configurations
- `logging.json` - Logging configurations

## Usage

Configuration files are loaded by:
- CLI Runner (`src/cli-runner/cli-runner.ts`)
- Model Manager (`src/model-manager/model-manager.ts`)

These files are copied to `dist/configs/` during the build process.
