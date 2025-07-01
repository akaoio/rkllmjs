/**
 * @file rkllmjs-test.hpp
 * @brief RKLLMJS Professional Test Framework
 * 
 * A lightweight, professional test framework designed specifically for RKLLMJS.
 * Provides clean assertion macros and test organization without external dependencies.
 * 
 * Features:
 * - Simple assertion macros (EXPECT_EQ, EXPECT_TRUE, etc.)
 * - Test case organization (TEST macro)
 * - Clear success/failure reporting
 * - Performance timing
 * - Memory leak detection support
 * - SANDBOX and FULL mode compatibility
 */

#pragma once

#include <iostream>
#include <string>
#include <vector>
#include <chrono>
#include <sstream>
#include <functional>
#include <cmath>

namespace rkllmjs {
namespace testing {

// Test result tracking
struct TestResult {
    std::string test_name;
    bool passed;
    std::string failure_message;
    std::chrono::milliseconds duration;
};

// Global test state
class TestRunner {
private:
    std::vector<TestResult> results_;
    std::string current_test_;
    std::chrono::steady_clock::time_point start_time_;
    bool current_test_failed_;
    
public:
    static TestRunner& getInstance() {
        static TestRunner instance;
        return instance;
    }
    
    void startTest(const std::string& name) {
        current_test_ = name;
        current_test_failed_ = false;
        start_time_ = std::chrono::steady_clock::now();
        std::cout << "[ RUN      ] " << name << std::endl;
    }
    
    void endTest() {
        auto end_time = std::chrono::steady_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end_time - start_time_);
        
        TestResult result;
        result.test_name = current_test_;
        result.passed = !current_test_failed_;
        result.duration = duration;
        
        if (result.passed) {
            std::cout << "[       OK ] " << current_test_ << " (" << duration.count() << " ms)" << std::endl;
        } else {
            std::cout << "[  FAILED  ] " << current_test_ << " (" << duration.count() << " ms)" << std::endl;
        }
        
        results_.push_back(result);
    }
    
    void recordFailure(const std::string& message) {
        current_test_failed_ = true;
        std::cout << "[  FAILED  ] " << message << std::endl;
    }
    
    int runAll() {
        std::cout << "[==========] Running " << results_.size() << " tests." << std::endl;
        std::cout << "[----------] Global test environment set-up." << std::endl;
        
        return 0; // Tests are run immediately, this just provides summary
    }
    
    int getSummary() {
        int passed = 0;
        int failed = 0;
        
        for (const auto& result : results_) {
            if (result.passed) passed++;
            else failed++;
        }
        
        std::cout << "[----------] Global test environment tear-down" << std::endl;
        std::cout << "[==========] " << results_.size() << " tests ran." << std::endl;
        
        if (passed > 0) {
            std::cout << "[  PASSED  ] " << passed << " tests." << std::endl;
        }
        
        if (failed > 0) {
            std::cout << "[  FAILED  ] " << failed << " tests, listed below:" << std::endl;
            for (const auto& result : results_) {
                if (!result.passed) {
                    std::cout << "[  FAILED  ] " << result.test_name << std::endl;
                }
            }
            std::cout << std::endl << failed << " FAILED TESTS" << std::endl;
            return 1;
        }
        
        return 0;
    }
};

// Test registration
class TestCase {
public:
    TestCase(const std::string& name, std::function<void()> test_func) {
        auto& runner = TestRunner::getInstance();
        runner.startTest(name);
        
        try {
            test_func();
        } catch (const std::exception& e) {
            runner.recordFailure(std::string("Exception: ") + e.what());
        } catch (...) {
            runner.recordFailure("Unknown exception");
        }
        
        runner.endTest();
    }
};

// Assertion macros
#define EXPECT_EQ(expected, actual) \
    do { \
        if ((expected) != (actual)) { \
            std::ostringstream ss; \
            ss << __FILE__ << ":" << __LINE__ << " Expected: " << (expected) << ", Actual: " << (actual); \
            rkllmjs::testing::TestRunner::getInstance().recordFailure(ss.str()); \
        } \
    } while(0)

#define EXPECT_NE(expected, actual) \
    do { \
        if ((expected) == (actual)) { \
            std::ostringstream ss; \
            ss << __FILE__ << ":" << __LINE__ << " Expected: " << (expected) << " != " << (actual); \
            rkllmjs::testing::TestRunner::getInstance().recordFailure(ss.str()); \
        } \
    } while(0)

#define EXPECT_TRUE(condition) \
    do { \
        if (!(condition)) { \
            std::ostringstream ss; \
            ss << __FILE__ << ":" << __LINE__ << " Expected: true, Actual: false"; \
            rkllmjs::testing::TestRunner::getInstance().recordFailure(ss.str()); \
        } \
    } while(0)

#define EXPECT_FALSE(condition) \
    do { \
        if (condition) { \
            std::ostringstream ss; \
            ss << __FILE__ << ":" << __LINE__ << " Expected: false, Actual: true"; \
            rkllmjs::testing::TestRunner::getInstance().recordFailure(ss.str()); \
        } \
    } while(0)

#define EXPECT_STREQ(expected, actual) \
    do { \
        if (std::string(expected) != std::string(actual)) { \
            std::ostringstream ss; \
            ss << __FILE__ << ":" << __LINE__ << " Expected: \"" << (expected) << "\", Actual: \"" << (actual) << "\""; \
            rkllmjs::testing::TestRunner::getInstance().recordFailure(ss.str()); \
        } \
    } while(0)

#define EXPECT_STRNE(expected, actual) \
    do { \
        if (std::string(expected) == std::string(actual)) { \
            std::ostringstream ss; \
            ss << __FILE__ << ":" << __LINE__ << " Expected: \"" << (expected) << "\" != \"" << (actual) << "\""; \
            rkllmjs::testing::TestRunner::getInstance().recordFailure(ss.str()); \
        } \
    } while(0)

#define EXPECT_GT(val1, val2) \
    do { \
        if (!((val1) > (val2))) { \
            std::ostringstream ss; \
            ss << __FILE__ << ":" << __LINE__ << " Expected: " << (val1) << " > " << (val2); \
            rkllmjs::testing::TestRunner::getInstance().recordFailure(ss.str()); \
        } \
    } while(0)

#define EXPECT_LT(val1, val2) \
    do { \
        if (!((val1) < (val2))) { \
            std::ostringstream ss; \
            ss << __FILE__ << ":" << __LINE__ << " Expected: " << (val1) << " < " << (val2); \
            rkllmjs::testing::TestRunner::getInstance().recordFailure(ss.str()); \
        } \
    } while(0)

#define EXPECT_GE(val1, val2) \
    do { \
        if (!((val1) >= (val2))) { \
            std::ostringstream ss; \
            ss << __FILE__ << ":" << __LINE__ << " Expected: " << (val1) << " >= " << (val2); \
            rkllmjs::testing::TestRunner::getInstance().recordFailure(ss.str()); \
        } \
    } while(0)

#define EXPECT_LE(val1, val2) \
    do { \
        if (!((val1) <= (val2))) { \
            std::ostringstream ss; \
            ss << __FILE__ << ":" << __LINE__ << " Expected: " << (val1) << " <= " << (val2); \
            rkllmjs::testing::TestRunner::getInstance().recordFailure(ss.str()); \
        } \
    } while(0)

// Floating point comparison macros
#define EXPECT_FLOAT_EQ(expected, actual) \
    do { \
        float eps = 1e-6f; \
        if (std::abs((expected) - (actual)) > eps) { \
            std::ostringstream ss; \
            ss << __FILE__ << ":" << __LINE__ << " Expected: " << (expected) << " but got: " << (actual); \
            rkllmjs::testing::TestRunner::getInstance().recordFailure(ss.str()); \
        } \
    } while(0)

#define EXPECT_DOUBLE_EQ(expected, actual) \
    do { \
        double eps = 1e-9; \
        if (std::abs((expected) - (actual)) > eps) { \
            std::ostringstream ss; \
            ss << __FILE__ << ":" << __LINE__ << " Expected: " << (expected) << " but got: " << (actual); \
            rkllmjs::testing::TestRunner::getInstance().recordFailure(ss.str()); \
        } \
    } while(0)

#define EXPECT_NEAR(val1, val2, abs_error) \
    do { \
        if (std::abs((val1) - (val2)) > (abs_error)) { \
            std::ostringstream ss; \
            ss << __FILE__ << ":" << __LINE__ << " Expected: " << (val1) << " near " << (val2) << " within " << (abs_error); \
            rkllmjs::testing::TestRunner::getInstance().recordFailure(ss.str()); \
        } \
    } while(0)

// Failure macro
#define FAIL(message) \
    do { \
        std::ostringstream ss; \
        ss << __FILE__ << ":" << __LINE__ << " " << (message); \
        rkllmjs::testing::TestRunner::getInstance().recordFailure(ss.str()); \
    } while(0)

// Test case definition macro
#define TEST(test_case_name, test_name) \
    void test_case_name##_##test_name##_TestBody(); \
    static rkllmjs::testing::TestCase test_case_name##_##test_name##_instance( \
        #test_case_name "." #test_name, \
        test_case_name##_##test_name##_TestBody \
    ); \
    void test_case_name##_##test_name##_TestBody()

} // namespace testing
} // namespace rkllmjs

// Main function helper
#define RKLLMJS_TEST_MAIN() \
    int main() { \
        auto& runner = rkllmjs::testing::TestRunner::getInstance(); \
        runner.runAll(); \
        return runner.getSummary(); \
    }
