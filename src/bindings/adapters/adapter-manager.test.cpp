#include "adapter-manager.hpp"
#include "../testing/rkllmjs-test.hpp"
#include <string>
#include <vector>

using namespace rkllmjs::adapters;

// Test TextAdapter functionality
TEST(AdapterManagerTest, TextAdapterBasics) {
    TextAdapter adapter;
    
    // Test initialization
    EXPECT_EQ(AdapterResult::SUCCESS, adapter.initialize());
    EXPECT_TRUE(adapter.isInitialized());
    
    // Test text processing using convertInput
    std::string input = "Hello, world!";
    std::string output;
    AdapterResult result = adapter.convertInput(input, output);
    EXPECT_EQ(AdapterResult::SUCCESS, result);
    EXPECT_FALSE(output.empty());
    
    // Test encoding
    std::string encoding = adapter.getEncoding();
    EXPECT_EQ("UTF-8", encoding);
}

TEST(AdapterManagerTest, TextAdapterValidation) {
    TextAdapter adapter;
    adapter.initialize();
    
    // Test empty text validation - should return error for empty strings
    AdapterResult empty_result = adapter.validate("");
    EXPECT_EQ(AdapterResult::ERROR_INVALID_CONFIG, empty_result);
    
    // Test non-empty text validation - should succeed
    std::string valid_text = "Hello, world!";
    AdapterResult valid_result = adapter.validate(valid_text);
    EXPECT_EQ(AdapterResult::SUCCESS, valid_result);
    
    // Test special characters
    std::string special = "Special chars: äöü 中文 🎉";
    AdapterResult validation_result = adapter.validate(special);
    EXPECT_EQ(AdapterResult::SUCCESS, validation_result);
}

TEST(AdapterManagerTest, TextAdapterCleanup) {
    TextAdapter adapter;
    adapter.initialize();
    EXPECT_TRUE(adapter.isInitialized());
    
    // Test cleanup
    adapter.cleanup();
    EXPECT_FALSE(adapter.isInitialized());
}

TEST(AdapterManagerTest, TextAdapterErrorHandling) {
    TextAdapter adapter;
    
    // Test processing without initialization
    std::string input = "test";
    std::string output;
    AdapterResult result = adapter.convertInput(input, output);
    EXPECT_EQ(AdapterResult::ERROR_INITIALIZATION_FAILED, result);
    
    // Test multiple initialization calls
    adapter.initialize();
    adapter.initialize(); // Should not cause issues
    EXPECT_TRUE(adapter.isInitialized());
}

TEST(AdapterManagerTest, JsonAdapterBasics) {
    JsonAdapter adapter;
    
    // Test initialization
    EXPECT_EQ(AdapterResult::SUCCESS, adapter.initialize());
    EXPECT_TRUE(adapter.isInitialized());
    
    // Test JSON validation
    std::string valid_json = R"({"model_path": "test.rkllm", "max_tokens": 100})";
    AdapterResult validation_result = adapter.validate(valid_json);
    EXPECT_EQ(AdapterResult::SUCCESS, validation_result);
    
    // Test invalid JSON
    std::string invalid_json = "invalid json";
    AdapterResult invalid_result = adapter.validate(invalid_json);
    EXPECT_NE(AdapterResult::SUCCESS, invalid_result);
}

TEST(AdapterManagerTest, JsonAdapterErrorHandling) {
    JsonAdapter adapter;
    adapter.initialize();
    
    // Test empty JSON
    AdapterResult empty_result = adapter.validate("");
    EXPECT_NE(AdapterResult::SUCCESS, empty_result);
    
    // Test malformed JSON
    std::string malformed = R"({"key": value})"; // Missing quotes
    AdapterResult malformed_result = adapter.validate(malformed);
    EXPECT_NE(AdapterResult::SUCCESS, malformed_result);
}

// Main function using RKLLMJS Test Framework
int main() {
    return rkllmjs::testing::TestRunner::getInstance().runAll();
}
