# Real Data Testing Documentation

## Overview

This project uses **real data testing** approach instead of mocking. All tests use actual model files downloaded from HuggingFace to ensure they reflect real-world scenarios.

## Key Features

### 1. Smart Caching System

- **Shared Cache**: Downloads are cached in `./test-models-cache` directory
- **Symlink Optimization**: Tests use symlinks to cached models instead of copying large files
- **Skip Existing**: Downloads are skipped if files already exist and have correct size
- **Essential Files Only**: Downloads only necessary files (model + tokenizer), not entire repos

### 2. Efficient Download Strategy

```typescript
// Downloads only if needed, uses cache if available
const modelPath = await ensureTestModelFromCache(testDir);

// Check if essential files exist before downloading
if (await hasEssentialFiles(testDir)) {
  console.log('✅ Using existing model files');
} else {
  console.log('📥 Using cached model to avoid re-download');
}
```

### 3. Test Configuration

#### Environment Variables

- `CI=true` - Skips downloads in CI environment (unless forced)
- `FORCE_REAL_TESTS=true` - Forces real downloads even in CI
- `RKLLM_MODEL_PATH` - Points to a specific model file for testing

#### Test Helpers

```typescript
import { 
  ensureTestModelFromCache,    // Smart caching download
  hasEssentialFiles,           // Check if files exist
  cleanupTestDirSmart,         // Smart cleanup (preserves cache)
  shouldSkipDownloadTests,     // CI environment detection
  TEST_TIMEOUT                 // Extended timeout for downloads
} from './test-helpers';
```

## Test Model

- **Repository**: `limcheekin/Qwen2.5-0.5B-Instruct-rk3588-1.1.4`
- **Model File**: `Qwen2.5-0.5B-Instruct-rk3588-w8a8-opt-0-hybrid-ratio-0.0.rkllm`
- **Size**: ~700MB (lighter for faster testing)
- **Format**: RKLLM (optimized for RK3588)

## Benefits of Real Data Testing

### 1. Real-World Validation
- Tests actual file sizes, formats, and properties
- Validates real model metadata and tokenizer files
- Catches issues that mocks would miss

### 2. Performance Testing
- Tests download efficiency and caching
- Validates large file handling
- Tests symlink vs copy performance

### 3. Integration Testing
- Tests entire pipeline from download to usage
- Validates model manager + validator integration
- Tests real HuggingFace API interactions

## Test Structure

```
tests/
├── test-helpers.ts           # Real data utilities
├── model-manager.test.ts     # Model management with real files
├── model-validator.test.ts   # Validation with real files  
├── integration.test.ts       # Full system integration
├── rkllm-core.test.ts       # Core functionality with real models
└── rkllm.test.ts            # Quick validation tests
```

## Running Tests

### Local Development
```bash
# Run all tests with real data
bun test

# Run specific test file
bun test tests/model-manager.test.ts

# Force real tests even in CI
FORCE_REAL_TESTS=true bun test
```

### CI Environment
```bash
# Skips downloads by default
bun test

# Force downloads in CI
FORCE_REAL_TESTS=true bun test
```

## Performance Optimizations

### 1. Download Caching
- First test run downloads and caches model
- Subsequent tests reuse cached files via symlinks
- Cache persists across test runs

### 2. Smart Cleanup
```typescript
// Preserves downloads, cleans only test artifacts
cleanupTestDirSmart(testDir);

// Full cleanup (use sparingly)
cleanupTestDir(testDir, false);
```

### 3. File Validation
```typescript
// Checks file size before considering it valid
const minExpectedSize = expectedModelInfo.expectedSize * 0.8;
if (existingModel.size > minExpectedSize) {
  // Use existing file
} else {
  // Re-download
}
```

## Troubleshooting

### Large Download Times
- First run may take 5-10 minutes to download ~700MB model
- Subsequent runs should be <1 second using cache
- Use `shouldSkipDownloadTests()` in CI to avoid timeouts

### Storage Space
- Model cache requires ~1GB disk space
- Use `cleanupTestDir('./test-models-cache', false)` to clean cache
- Consider using smaller test model for resource-constrained environments

### Network Issues
- Tests gracefully handle network failures
- Implement retry logic for transient failures
- Fallback to cached files when available

## Best Practices

1. **Always use caching functions**: `ensureTestModelFromCache()`
2. **Check files exist**: `hasEssentialFiles()` before download
3. **Smart cleanup**: Use `cleanupTestDirSmart()` to preserve cache
4. **Timeout handling**: Use `TEST_TIMEOUT` for download operations
5. **CI detection**: Use `shouldSkipDownloadTests()` for CI environments

## Migration from Mock Tests

### Before (Mock)
```typescript
writeFileSync(modelPath, 'mock model content');
expect(models).toHaveLength(1);
```

### After (Real Data)
```typescript
const modelPath = await ensureTestModelFromCache(testDir);
expect(existsSync(modelPath)).toBe(true);
expect(realModel.size).toBeGreaterThan(100000000); // Real size check
```

This approach ensures tests are reliable, realistic, and production-ready while maintaining good performance through intelligent caching.
