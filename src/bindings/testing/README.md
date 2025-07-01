# RKLLMJS Test Framework

A lightweight, professional test framework designed specifically for RKLLMJS C++ modules.

## Overview

The RKLLMJS Test Framework is an in-house testing solution that provides:

- **Simple Test Macros**: Easy-to-use TEST(), EXPECT_EQ(), ASSERT_TRUE() macros
- **Professional Output**: Clean test result formatting with colored output
- **No External Dependencies**: Completely self-contained, no Google Test or other external frameworks required
- **Cross-Platform**: Works on Linux, macOS, and other UNIX-like systems
- **Build Mode Support**: Supports both SANDBOX and FULL build configurations

## Features

### Core Macros

- `TEST(TestSuite, TestCase)` - Define a test case
- `EXPECT_EQ(expected, actual)` - Assert equality (non-fatal)
- `EXPECT_TRUE(condition)` - Assert condition is true (non-fatal)
- `EXPECT_FALSE(condition)` - Assert condition is false (non-fatal)
- `ASSERT_TRUE(condition)` - Assert condition is true (fatal)
- `ASSERT_FALSE(condition)` - Assert condition is false (fatal)

### Test Execution

- Automatic test discovery and execution
- Professional test output with timestamps
- Pass/fail statistics
- Colored terminal output for better readability

## Usage

### 1. Include the Framework

```cpp
#include "../testing/rkllmjs-test.hpp"
```

### 2. Write Test Cases

```cpp
TEST(MyModuleTest, BasicFunctionality) {
    MyModule module;
    EXPECT_TRUE(module.initialize());
    EXPECT_EQ(42, module.getValue());
}

TEST(MyModuleTest, ErrorHandling) {
    MyModule module;
    EXPECT_FALSE(module.processInvalidInput(""));
}
```

### 3. Add Main Function

```cpp
// Main function using RKLLMJS Test Framework
int main() {
    return rkllmjs::testing::runAllTests();
}
```

### 4. Build and Run

```bash
# Build the test
g++ -std=c++17 -I../testing my-module.test.cpp my-module.cpp -pthread -o my-module.test

# Run the test
./my-module.test
```

## Integration with Build System

### Makefile Integration

The framework integrates seamlessly with Makefiles:

```makefile
# Test configuration
TEST_INCLUDES := $(INCLUDES) -I../testing
TEST_LIBS := -pthread

# Test target
%.test: %.test.cpp %.cpp
	$(CXX) $(CXXFLAGS) $(TEST_INCLUDES) -o $@ $^ $(TEST_LIBS)
```

### Example Output

```
[ RUN      ] MyModuleTest.BasicFunctionality
[       OK ] MyModuleTest.BasicFunctionality (0 ms)
[ RUN      ] MyModuleTest.ErrorHandling
[       OK ] MyModuleTest.ErrorHandling (1 ms)
[==========] Running 2 tests.
[----------] Global test environment set-up.
[----------] Global test environment tear-down
[==========] 2 tests ran.
[  PASSED  ] 2 tests.
```

## File Structure

```
src/bindings/testing/
├── README.md              # This documentation
└── rkllmjs-test.hpp       # Main test framework header
```

## Test Organization

### Naming Convention

- Test files: `*.test.cpp`
- Test executables: `*.test`
- Test suites: Use module name (e.g., `MemoryManagerTest`)
- Test cases: Descriptive names (e.g., `InitializationSuccess`)

### Directory Structure

```
src/bindings/
├── core/
│   ├── rkllm-manager.cpp
│   ├── rkllm-manager.hpp
│   └── rkllm-manager.test.cpp
├── memory/
│   ├── memory-manager.cpp
│   ├── memory-manager.hpp
│   └── memory-manager.test.cpp
└── testing/
    ├── README.md
    └── rkllmjs-test.hpp
```

## Advantages Over External Frameworks

### No Dependencies
- No need to install Google Test or other external frameworks
- Reduces build complexity and dependency management
- Faster compilation times

### Tailored for RKLLMJS
- Designed specifically for RKLLMJS module testing needs
- Integrates well with RKLLM library error handling
- Supports both SANDBOX and FULL build modes

### Professional Output
- Clean, colored test output
- Familiar Google Test-style formatting
- Easy to read test results

## Best Practices

### 1. Test Organization

```cpp
// Group related tests in the same test suite
TEST(MemoryManagerTest, Initialization) { /* ... */ }
TEST(MemoryManagerTest, AllocationBasic) { /* ... */ }
TEST(MemoryManagerTest, DeallocationBasic) { /* ... */ }
```

### 2. Test Isolation

```cpp
TEST(MyModuleTest, TestCase) {
    // Create fresh instances for each test
    MyModule module;
    // Test logic here
    // Cleanup is automatic
}
```

### 3. Error Testing

```cpp
TEST(MyModuleTest, ErrorConditions) {
    MyModule module;
    EXPECT_FALSE(module.processInvalidData(nullptr));
    EXPECT_EQ(ErrorCode::INVALID_INPUT, module.getLastError());
}
```

### 4. Build Mode Testing

```cpp
TEST(MyModuleTest, SandboxMode) {
    #ifdef SANDBOX_BUILD
    // Test sandbox-specific functionality
    EXPECT_TRUE(module.isSandboxMode());
    #endif
    
    #ifdef FULL_BUILD
    // Test full build functionality
    EXPECT_TRUE(module.hasFullFeatures());
    #endif
}
```

## Supported Build Modes

### SANDBOX_BUILD
- Limited functionality for testing and development
- Reduced dependencies
- Faster compilation

### FULL_BUILD
- Complete functionality
- Full RKLLM library integration
- Production-ready features

## Thread Safety

The test framework is thread-safe and supports:
- Multi-threaded test execution
- Concurrent access to test results
- Safe cleanup in multi-threaded environments

## Migration from Google Test

For modules previously using Google Test, migration is straightforward:

1. Replace `#include <gtest/gtest.h>` with `#include "../testing/rkllmjs-test.hpp"`
2. Change `GTEST_TEST()` to `TEST()`
3. Update main function to use `rkllmjs::testing::runAllTests()`
4. Remove Google Test from build dependencies

## Contributing

When adding new test macros or features:

1. Maintain compatibility with existing tests
2. Follow the existing code style
3. Update this documentation
4. Test across both SANDBOX and FULL build modes

## Version History

- **v1.0.0** - Initial RKLLMJS Test Framework implementation
- **v1.1.0** - Added enum output operators and improved error handling
- **v1.2.0** - Enhanced thread safety and build mode support

## Support

For issues with the test framework:
1. Check the module-specific test files for examples
2. Review the framework source code in `rkllmjs-test.hpp`
3. Ensure proper includes and linking
4. Verify build mode configuration

The RKLLMJS Test Framework is maintained as part of the RKLLMJS project and follows the same development standards and practices.
