# System Tests

End-to-end functionality testing on target hardware.

## Test Cases

### Hardware Integration
- Full NPU pipeline on RK3588
- Memory allocation and cleanup
- Hardware resource management

### Production Workflows
- Real model inference with actual inputs
- Error handling and recovery scenarios
- Long-running stability tests

### Platform Compatibility
- Different model formats and sizes
- Various input data types
- Runtime environment variations

## Requirements

- RK3588 hardware (or compatible ARM64 with NPU)
- Real model files in `/models/` directory
- Sufficient memory and storage

## Usage

```bash
npm run test:system
```

System tests may take significant time and require hardware resources.
