# RKLLMJS Tests

Comprehensive test suite for RKLLMJS covering different testing levels.

## Test Structure

### Integration Tests (`integration/`)
Tests component interactions and multi-feature workflows:
- Model manager + Configuration loading 
- Component interface compatibility
- Cross-platform development scenarios

```bash
cd tests/integration && make test
```

### System Tests (`system/`)
End-to-end tests on real RK3588 hardware with actual models:
- Real model loading and inference
- Hardware NPU utilization
- Real-time streaming output
- Memory and resource management

```bash
cd tests/system && make test
```

### Performance Tests (`performance/`)
Benchmarking and performance analysis:
- Latency measurements
- Throughput analysis
- Memory usage profiling

```bash
cd tests/performance && npm test
```

## Requirements

### Integration Tests
- Built core and config libraries
- No real hardware required
- Cross-platform development support

### System Tests  
- RK3588 hardware with NPU support
- Real model files in `../../models/`
- Sufficient memory (>8GB recommended)
- Built inference libraries

### Performance Tests
- Node.js environment
- Real hardware for accurate benchmarks

## Running All Tests

```bash
# From project root
npm run test:integration
npm run test:system
npm run test:performance
```

## Test Development

- **Unit tests**: Place in respective module directories (`src/*/`)
- **Integration tests**: Component interaction tests here
- **System tests**: End-to-end hardware tests here
- **Performance tests**: Benchmarking and profiling here

## Log Output

Test logs are generated in `/logs/{YYYY}-{MM}-{DD}T{HH}-{MM}-{SS}/` with categorized subdirectories:
- `unit-tests/` - Unit test logs
- `integration-tests/` - Integration test logs  
- `system-tests/` - System test logs
- `performance-tests/` - Performance test logs
