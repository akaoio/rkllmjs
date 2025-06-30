# Performance Tests

NPU performance benchmarks and optimization validation.

## Test Categories

### Latency Benchmarks
- Single inference timing
- Batch processing performance
- Memory allocation overhead

### Throughput Tests
- Maximum requests per second
- Concurrent inference handling
- Resource utilization efficiency

### Resource Monitoring
- NPU utilization percentage
- Memory usage patterns
- CPU vs NPU performance comparison

### Optimization Validation
- Performance before/after optimizations
- Regression detection
- Hardware-specific tuning validation

## Metrics Tracked

- **Inference Latency**: Time from input to output
- **Memory Usage**: Peak and average memory consumption
- **NPU Utilization**: Percentage of NPU capacity used
- **Throughput**: Operations per second
- **Resource Efficiency**: Performance per resource unit

## Requirements

- RK3588 hardware for accurate NPU measurements
- Representative model files
- Sufficient test duration for reliable measurements

## Usage

```bash
npm run test:performance
```

Performance tests generate detailed reports in logs directory.
