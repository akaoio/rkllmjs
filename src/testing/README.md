# Testing Infrastructure

Unified testing infrastructure for RKLLMJS with comprehensive logging and production-ready utilities.

## Components

### TestLogger (`test-logger.ts`)
Structured logging for test debugging and audit trails:
- Session-based timestamps for test organization
- Multiple log levels (INFO, ERROR, WARN, DEBUG)
- Expectation tracking with detailed data
- Test lifecycle management
- Automatic log file management

### Test Utilities (`test-utils.ts`)  
Production-focused utilities for real hardware testing:
- Native binding availability detection
- RK3588 hardware compatibility checking
- Test model file validation
- Production test configurations
- Real test prompts for inference validation

## Usage

```typescript
import { TestLogger, areNativeBindingsAvailable, PRODUCTION_TEST_CONFIG } from '../testing';

// Create logger for test session
const logger = new TestLogger('my-test');

// Check hardware/software requirements
if (!areNativeBindingsAvailable()) {
  logger.warn('Native bindings not available');
  return;
}

// Run test with logging
logger.testStart('inference test');
const result = await performInference(PRODUCTION_TEST_CONFIG);
logger.expectation('success', result.success, result.success === true);
logger.testEnd('inference test', result.success);
```

## Architecture

This module consolidates previously duplicated testing infrastructure:
- Replaces `src/test-logger/` (logging functionality)
- Replaces `src/rkllm-client/test-utils.ts` (production utilities)
- Provides single source of truth for all testing needs
- Maintains backward compatibility through re-exports

## Production Ready

All utilities are designed for production environments:
- No mocks or simulations
- Requires real RKLLM models and hardware
- Validates actual RK3588 NPU availability
- Tests with real inference configurations