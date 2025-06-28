# Test Logger

## Purpose
Provides structured logging for test debugging and audit purposes with Node.js native implementation. Generates detailed logs in timestamp-based directories for easy troubleshooting and test analysis.

## Architecture

### Logging Strategy
```
Test Execution → Log Entry Creation → File Writing → Directory Organization
      ↓                 ↓                ↓              ↓
   Test Events      Structured Data   Log Files    Timestamp Dirs
```

### Directory Structure
```
logs/
├── 2025-06-29T10-30-45/          # Timestamp-based directory
│   ├── unit-tests/
│   │   ├── model-types.test.log
│   │   ├── cli-runner.test.log
│   │   └── model-manager.test.log
│   ├── integration-tests/
│   │   └── [test-suite].test.log
│   └── test-summary.log           # Overall summary
└── 2025-06-29T11-15-22/          # Another test run
    └── ...
```

## Core Components

### `TestLogger` Class
Main logging class that provides structured test logging:

```typescript
const logger = new TestLogger('my-test-suite');

// Log different levels
logger.info('Test started', { config: testConfig });
logger.warn('Deprecated API used');
logger.error('Test failed', error, { context: 'validation' });
logger.debug('Internal state', { variables: values });

// Track test lifecycle
logger.testStart('should validate input');
logger.testEnd('should validate input', true, 150); // success, 150ms

// Track expectations
logger.expectation(expected, actual, passed);

// Generate summary
logger.summary();
```

### `TestLogEntry` Interface
Structured log entry format:

```typescript
interface TestLogEntry {
  timestamp: string;           // ISO 8601 timestamp
  level: 'INFO' | 'ERROR' | 'WARN' | 'DEBUG';
  testName: string;           // Test suite name
  message: string;            // Human-readable message
  data?: any;                 // Structured data
  error?: Error;              // Error object with stack trace
}
```

## Usage Examples

### Basic Test Logging
```typescript
import { TestLogger } from '../test-logger/test-logger.js';

const logger = TestLogger.createLogger('model-types');

// Test lifecycle
logger.testStart('should validate ModelInfo interface');

try {
  // Test logic here
  const result = validateModel(testModel);
  logger.expectation(true, result.isValid, result.isValid);
  logger.testEnd('should validate ModelInfo interface', true, 45);
} catch (error) {
  logger.error('Test failed during validation', error);
  logger.testEnd('should validate ModelInfo interface', false, 45);
}

logger.summary();
```

### Error Debugging
```typescript
// Detailed error context
logger.error('Model validation failed', error, {
  inputModel: testModel,
  validationRules: rules,
  environment: process.env.NODE_ENV
});
```

### Performance Tracking
```typescript
const startTime = Date.now();
// ... test execution ...
const duration = Date.now() - startTime;

logger.info('Performance test completed', {
  operation: 'model loading',
  duration: `${duration}ms`,
  memoryUsage: process.memoryUsage()
});
```

## Log File Format

### Header Information
```
=====================================
Test Run: model-types
Started: 2025-06-29T10:30:45.123Z
Node.js: v18.17.0
Platform: linux x64
Working Directory: /home/user/rkllmjs
=====================================
```

### Log Entries
```
[2025-06-29T10:30:45.234Z] [INFO] [model-types] 🧪 Starting test case: should validate ModelInfo
[2025-06-29T10:30:45.235Z] [DEBUG] [model-types] Expectation PASSED
Data: {
  "expected": true,
  "actual": true,
  "passed": true
}
[2025-06-29T10:30:45.240Z] [INFO] [model-types] ✅ PASS Test case: should validate ModelInfo (5ms)
```

### Footer Summary
```
=====================================
Test Run Completed: model-types
Duration: 234ms
Ended: 2025-06-29T10:30:45.456Z
Log File: logs/2025-06-29T10-30-45/unit-tests/model-types.test.log
=====================================
```

## Design Principles

### Node.js Native
- Uses only Node.js built-in modules (`fs`, `path`, `os`)
- No external dependencies for logging functionality
- Compatible with Node.js test runner and assertions

### Structured Logging
- Consistent log entry format across all tests
- JSON-serializable data for machine parsing
- Human-readable messages for manual debugging

### Timestamp-Based Organization
- Unique directory per test run prevents conflicts
- Easy chronological browsing of test history
- Automatic cleanup can target old directories

### Performance Conscious
- Synchronous file writing for test reliability
- Minimal overhead during test execution
- Efficient string formatting and JSON serialization

## Integration with Node.js Testing

### Test Runner Integration
```typescript
import { describe, it, beforeEach, afterEach } from 'node:test';
import { TestLogger } from '../test-logger/test-logger.js';

const logger = TestLogger.createLogger('test-suite');

describe('Feature Tests', () => {
  beforeEach(() => {
    logger.testStart('test setup');
  });

  afterEach(() => {
    logger.testEnd('test completed', true);
  });

  it('should work correctly', () => {
    logger.info('Test execution started');
    // Test logic...
    logger.info('Test execution completed');
  });
});

process.on('exit', () => {
  logger.summary();
});
```

### Assertion Integration
```typescript
import assert from 'node:assert';

function loggedAssert(actual: any, expected: any, message: string) {
  const passed = actual === expected;
  logger.expectation(expected, actual, passed);
  
  if (!passed) {
    logger.error(`Assertion failed: ${message}`, undefined, {
      expected,
      actual,
      comparison: 'strictEqual'
    });
  }
  
  assert.strictEqual(actual, expected, message);
}
```

## Error Analysis

### Debug Process
1. **Locate Logs**: Check latest timestamp directory in `/logs`
2. **Find Test File**: Look for specific test name in log filename
3. **Analyze Errors**: Search for `[ERROR]` entries with full context
4. **Check Expectations**: Review `[DEBUG]` expectation entries
5. **Performance Issues**: Look for duration and memory data

### Common Patterns
- **Test Setup Failures**: Look in test header and early INFO entries
- **Assertion Failures**: Check DEBUG expectation entries before errors
- **Network Issues**: ERROR entries with timeout or connection data
- **Memory Leaks**: Performance data showing increasing memory usage

## Dependencies
- Node.js built-in modules only (`fs`, `path`, `os`)
- Compatible with Node.js >= 18.0.0
- No external logging libraries required

## Testing
- `test-logger.test.ts` - Tests logger functionality itself
- Self-logging test implementation
- Validates directory creation and file writing
- Tests error handling and edge cases
