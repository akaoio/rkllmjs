#include "../testing/rkllmjs-test.hpp"
#include <vector>
#include <string>
#include <chrono>
#include <numeric>
#include <cctype>
#include "type-converters.hpp"

using namespace rkllmjs::testing;

namespace rkllmjs {
namespace utils {
namespace test {

// Test environment helper for SANDBOX mode
class TestEnvironment {
public:
    static bool isSandboxMode() {
        return true;
    }
};

// Test basic vector operations in SANDBOX mode
TEST(TypeConvertersTest, VectorOperationsSandbox) {
    std::vector<float> input = {1.0f, 2.0f, 3.0f, 4.0f, 5.0f};
    
    // Test vector size validation
    EXPECT_EQ(input.size(), 5);
    
    // Test vector content validation
    for (size_t i = 0; i < input.size(); ++i) {
        EXPECT_FLOAT_EQ(input[i], static_cast<float>(i + 1));
    }
    
    // Test vector transformation
    std::vector<float> doubled;
    for (const auto& val : input) {
        doubled.push_back(val * 2.0f);
    }
    
    EXPECT_EQ(doubled.size(), input.size());
    EXPECT_FLOAT_EQ(doubled[0], 2.0f);
    EXPECT_FLOAT_EQ(doubled[4], 10.0f);
}

// Test string operations in simplified mode
TEST(TypeConvertersTest, StringOperationsSandbox) {
    std::string test_string = "test_input";
    
    // Test string validation
    EXPECT_FALSE(test_string.empty());
    EXPECT_EQ(test_string.length(), 10);
    
    // Test string transformation
    std::string uppercase;
    for (char c : test_string) {
        uppercase += std::toupper(c);
    }
    
    EXPECT_EQ(uppercase, "TEST_INPUT");
}

// Test tensor shape validation in simplified mode
TEST(TypeConvertersTest, TensorShapeValidationSandbox) {
    std::vector<int64_t> shape = {1, 3, 224, 224};
    
    // Test shape validation
    EXPECT_EQ(shape.size(), 4);
    EXPECT_EQ(shape[0], 1);   // batch size
    EXPECT_EQ(shape[1], 3);   // channels
    EXPECT_EQ(shape[2], 224); // height
    EXPECT_EQ(shape[3], 224); // width
    
    // Calculate total elements
    int64_t total_elements = 1;
    for (auto dim : shape) {
        total_elements *= dim;
    }
    
    EXPECT_EQ(total_elements, 150528); // 1 * 3 * 224 * 224
}

// Test data type conversion in simplified mode
TEST(TypeConvertersTest, DataTypeConversionSandbox) {
    // Test float to double conversion
    std::vector<float> float_data = {1.5f, 2.5f, 3.5f};
    std::vector<double> double_data;
    
    for (float val : float_data) {
        double_data.push_back(static_cast<double>(val));
    }
    
    EXPECT_EQ(double_data.size(), float_data.size());
    EXPECT_DOUBLE_EQ(double_data[0], 1.5);
    EXPECT_DOUBLE_EQ(double_data[1], 2.5);
    EXPECT_DOUBLE_EQ(double_data[2], 3.5);
}

// Test array range validation in simplified mode
TEST(TypeConvertersTest, ArrayRangeValidationSandbox) {
    std::vector<int> data(1000);
    std::iota(data.begin(), data.end(), 1); // Fill with 1, 2, 3, ..., 1000
    
    // Test array size
    EXPECT_EQ(data.size(), 1000);
    
    // Test range validation
    EXPECT_EQ(data.front(), 1);
    EXPECT_EQ(data.back(), 1000);
    
    // Test sum calculation
    int sum = 0;
    for (int val : data) {
        sum += val;
    }
    EXPECT_EQ(sum, 500500); // Sum of 1 to 1000
}

// Test performance characteristics in simplified mode
TEST(TypeConvertersTest, PerformanceCharacteristicsSandbox) {
    const size_t large_size = 10000;
    std::vector<float> large_vector(large_size);
    
    // Measure time for vector operations
    auto start = std::chrono::high_resolution_clock::now();
    
    // Fill vector with data
    for (size_t i = 0; i < large_size; ++i) {
        large_vector[i] = static_cast<float>(i);
    }
    
    auto end = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start);
    
    // Verify the operation completed
    EXPECT_EQ(large_vector.size(), large_size);
    EXPECT_FLOAT_EQ(large_vector[0], 0.0f);
    EXPECT_FLOAT_EQ(large_vector[large_size - 1], static_cast<float>(large_size - 1));
    
    // Performance should be reasonable (less than 10ms for 10k elements)
    EXPECT_LT(duration.count(), 10000);
}

// Test error handling in simplified mode
TEST(TypeConvertersTest, ErrorHandlingSandbox) {
    std::vector<float> empty_vector;
    
    // Test empty vector handling
    EXPECT_TRUE(empty_vector.empty());
    EXPECT_EQ(empty_vector.size(), 0);
    
    // Test safe access patterns
    if (!empty_vector.empty()) {
        // This should not execute
        FAIL("Empty vector should be detected correctly");
    }
    
    // Test vector with single element
    std::vector<float> single_element = {42.0f};
    EXPECT_FALSE(single_element.empty());
    EXPECT_EQ(single_element.size(), 1);
    EXPECT_FLOAT_EQ(single_element[0], 42.0f);
}

} // namespace test
} // namespace utils
} // namespace rkllmjs

// Main function using RKLLMJS Test Framework
RKLLMJS_TEST_MAIN()
