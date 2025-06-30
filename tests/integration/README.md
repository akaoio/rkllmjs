# Integration Tests

Tests for component interactions and multi-feature workflows.

## Test Cases

### Model Loading Integration
- Model manager + Model types + File system
- Configuration loading + Validation + Error handling

### Inference Pipeline Integration  
- Model loading + RKLLM client + Result parsing
- Memory management + NPU utilization + Output formatting

### CLI Integration
- CLI runner + Model manager + User input validation
- Command parsing + Execution + Result presentation

## Usage

```bash
npm run test:integration
```

Integration tests use real model files and may require RK3588 hardware for full validation.
