# Performance Optimization Guide

This guide provides tips and best practices for optimizing RKLLMJS performance on Rockchip NPU platforms.

## Hardware Optimization

### CPU Core Assignment

Use the `enabledCpusMask` parameter to assign specific CPU cores to your LLM workload:

```javascript
await llm.init({
  modelPath: process.env.RKLLM_MODEL_PATH, // Use environment variable
  extendParam: {
    enabledCpusNum: 4,
    enabledCpusMask: 0xF0, // Use cores 4-7 (big cores on RK3588)
  }
});
```

### CPU Core Mapping (RK3588)

- **Cores 0-3**: Cortex-A55 (efficiency cores)
- **Cores 4-7**: Cortex-A76 (performance cores)

For best performance, use the Cortex-A76 cores (4-7) for LLM inference.

### Memory Optimization

Enable flash memory for embeddings to reduce RAM usage:

```javascript
await llm.init({
  modelPath: process.env.RKLLM_MODEL_PATH,
  extendParam: {
    embedFlash: true, // Store embeddings in flash memory
  }
});
```

## Software Optimization

### Batch Processing

Process multiple inputs in batches for better throughput:

```javascript
await llm.init({
  modelPath: process.env.RKLLM_MODEL_PATH,
  extendParam: {
    nBatch: 4, // Process 4 inputs simultaneously
  }
});
```

### Context Management

Clear context periodically in long conversations to prevent memory buildup:

```javascript
const MAX_CONTEXT = 3000;

async function generateResponse(prompt) {
  const currentLen = llm.getContextLength();
  
  if (currentLen > MAX_CONTEXT) {
    await llm.clearContext();
    console.log('Context cleared to prevent overflow');
  }
  
  return await llm.run({
    inputType: RKLLMInputType.PROMPT,
    inputData: prompt,
  });
}
```

### Streaming for Real-time Applications

Use streaming for real-time applications to reduce perceived latency:

```javascript
await llm.init({
  modelPath: process.env.RKLLM_MODEL_PATH,
  isAsync: true, // Enable async mode
});

await llm.runStream(input, {
  callback: (result) => {
    if (result.text) {
      // Display token immediately
      displayToken(result.text);
    }
  }
});
```

## Model Optimization

### Quantization

Use quantized models for better performance:

- **INT8**: Best performance, slight quality reduction
- **INT4**: Maximum performance, more quality reduction
- **FP16**: Balanced performance and quality

### Model Size Guidelines

| Model Size | RK3588 | RK3576 | RK3562 | RV1126 |
|-----------|--------|--------|--------|--------|
| 1B params | ✅ Fast | ✅ Fast | ✅ Good | ⚠️ Slow |
| 3B params | ✅ Good | ✅ Good | ⚠️ Slow | ❌ |
| 7B params | ✅ Good | ⚠️ Slow | ❌ | ❌ |
| 13B+ params | ⚠️ Slow | ❌ | ❌ | ❌ |

## Platform-Specific Optimizations

### RK3588/RK3588S

```javascript
// Optimal configuration for RK3588
await llm.init({
  modelPath: process.env.RKLLM_MODEL_PATH,
  maxContextLen: 4096,
  extendParam: {
    enabledCpusNum: 8,
    enabledCpusMask: 0xFF, // Use all 8 cores
    nBatch: 4,
    useCrossAttn: true,
  }
});
```

### RK3576

```javascript
// Optimal configuration for RK3576
await llm.init({
  modelPath: process.env.RKLLM_MODEL_PATH, // Set your model path via environment variable
  maxContextLen: 2048,
  extendParam: {
    enabledCpusNum: 4,
    enabledCpusMask: 0xF0, // Use performance cores
    nBatch: 2,
    embedFlash: true,
  }
});
```

### RK3562

```javascript
// Optimal configuration for RK3562
await llm.init({
  modelPath: process.env.RKLLM_MODEL_PATH, // Set your model path via environment variable
  maxContextLen: 1024,
  maxNewTokens: 128,
  extendParam: {
    enabledCpusNum: 2,
    enabledCpusMask: 0x03,
    nBatch: 1,
    embedFlash: true,
  }
});
```

## Performance Monitoring

### Basic Monitoring

```javascript
class PerformanceMonitor {
  constructor() {
    this.startTime = null;
    this.tokenCount = 0;
  }
  
  start() {
    this.startTime = process.hrtime.bigint();
    this.tokenCount = 0;
  }
  
  addToken() {
    this.tokenCount++;
  }
  
  getStats() {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - this.startTime) / 1e9; // seconds
    const tokensPerSecond = this.tokenCount / duration;
    
    return {
      duration,
      tokenCount: this.tokenCount,
      tokensPerSecond,
    };
  }
}

// Usage
const monitor = new PerformanceMonitor();
monitor.start();

await llm.runStream(input, {
  callback: (result) => {
    if (result.text) {
      monitor.addToken();
    }
    if (result.state === LLMCallState.FINISH) {
      const stats = monitor.getStats();
      console.log(`Performance: ${stats.tokensPerSecond.toFixed(2)} tokens/sec`);
    }
  }
});
```

### System Resource Monitoring

```javascript
function logSystemResources() {
  const usage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  console.log({
    memory: {
      rss: Math.round(usage.rss / 1024 / 1024) + ' MB',
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + ' MB',
      external: Math.round(usage.external / 1024 / 1024) + ' MB',
    },
    cpu: {
      user: cpuUsage.user / 1000,
      system: cpuUsage.system / 1000,
    }
  });
}

// Monitor every 5 seconds during inference
const monitorInterval = setInterval(logSystemResources, 5000);
```

## Troubleshooting Performance Issues

### Slow Inference

1. **Check CPU assignment**: Ensure you're using performance cores
2. **Reduce context length**: Lower `maxContextLen` if possible
3. **Use quantized models**: Switch to INT8 or INT4 models
4. **Enable flash embeddings**: Set `embedFlash: true`

### High Memory Usage

1. **Clear context regularly**: Call `clearContext()` periodically
2. **Reduce batch size**: Lower `nBatch` value
3. **Enable flash embeddings**: Move embeddings to flash storage
4. **Use smaller models**: Consider smaller parameter models

### NPU Not Utilized

1. **Check NPU driver**: Ensure NPU driver is installed
2. **Verify model format**: Use `.rkllm` format models
3. **Check platform support**: Verify your model is compatible

### Low Throughput

1. **Increase batch size**: Set `nBatch > 1` for multiple inputs
2. **Use async mode**: Enable `isAsync: true` for streaming
3. **Optimize CPU cores**: Use performance cores with proper mask

## Benchmarking

Use the built-in benchmark tool to test your configuration:

```bash
npm run benchmark
```

Or create custom benchmarks:

```javascript
const Benchmark = require('./benchmarks/inference.js');
const benchmark = new Benchmark();
await benchmark.run();
```

## Best Practices Summary

1. **Always use performance CPU cores** for LLM inference
2. **Enable flash embeddings** on memory-constrained devices
3. **Use streaming** for real-time applications
4. **Monitor context length** and clear when necessary
5. **Choose model size** appropriate for your hardware
6. **Use quantized models** for production deployments
7. **Batch multiple inputs** when possible
8. **Profile your specific use case** with the benchmark tool
