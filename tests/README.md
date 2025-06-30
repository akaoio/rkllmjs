# RKLLMJS Test Hierarchy

This directory contains high-level tests that span multiple features and components.

## Test Categories

### `/integration/` - Integration Tests
- **Purpose**: Test interactions between different components
- **Scope**: Multi-feature workflows, API contracts, data flow
- **Examples**: 
  - Model loading → Inference → Result parsing
  - CLI runner → Model manager → RKLLM client
  - TypeScript wrapper → C++ bindings → NPU library

### `/system/` - System Tests  
- **Purpose**: End-to-end functionality testing
- **Scope**: Complete user workflows, real hardware integration
- **Examples**:
  - Full model inference pipeline on real RK3588
  - Memory management under load
  - Error handling and recovery

### `/performance/` - Performance Tests
- **Purpose**: NPU performance benchmarks and optimization validation
- **Scope**: Latency, throughput, memory usage, NPU utilization
- **Examples**:
  - Inference speed benchmarks
  - Memory usage profiling
  - NPU vs CPU performance comparison

## Test Framework

All tests in this directory use the shared test utilities from `/src/testing/`:
- `test-logger.ts` - Structured logging with timestamps
- `test-utils.ts` - Common test helpers and assertions
- `index.ts` - Test framework entry point

## Test Execution

```bash
# Run all high-level tests
npm run test:integration
npm run test:system  
npm run test:performance

# Run all tests (unit + integration + system + performance)
npm test
```

## Log Output

Test logs are generated in `/logs/{YYYY}-{MM}-{DD}T{HH}-{MM}-{SS}/` with categorized subdirectories:
- `unit-tests/` - Unit test logs
- `integration-tests/` - Integration test logs  
- `system-tests/` - System test logs
- `performance-tests/` - Performance test logs
