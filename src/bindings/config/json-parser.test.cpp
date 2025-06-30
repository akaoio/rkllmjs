#include "json-parser.hpp"
#include <iostream>
#include <cassert>
#include <sstream>

using namespace rkllmjs::config;

// Test basic JSON parsing
void test_basic_parsing() {
    std::cout << "[TEST] Basic JSON parsing..." << std::endl;
    
    JSONParser parser;
    std::string json = R"({"key": "value", "number": 42})";
    
    auto result = parser.parse(json);
    assert(result.isValid());
    
    std::cout << "✅ Basic JSON parsing test passed" << std::endl;
}

// Test invalid JSON handling
void test_invalid_json() {
    std::cout << "[TEST] Invalid JSON handling..." << std::endl;
    
    JSONParser parser;
    std::string invalid_json = R"({"key": value})"; // Missing quotes
    
    auto result = parser.parse(invalid_json);
    assert(!result.isValid());
    
    std::cout << "✅ Invalid JSON handling test passed" << std::endl;
}

// Test empty JSON
void test_empty_json() {
    std::cout << "[TEST] Empty JSON handling..." << std::endl;
    
    JSONParser parser;
    std::string empty_json = "{}";
    
    auto result = parser.parse(empty_json);
    assert(result.isValid());
    
    std::cout << "✅ Empty JSON handling test passed" << std::endl;
}

int main() {
    std::cout << "🧪 JSON Parser Unit Tests" << std::endl;
    std::cout << "=========================" << std::endl;
    
    try {
        test_basic_parsing();
        test_invalid_json();
        test_empty_json();
        
        std::cout << "\n✅ All JSON Parser tests passed!" << std::endl;
        return 0;
    } catch (const std::exception& e) {
        std::cout << "\n❌ Test failed: " << e.what() << std::endl;
        return 1;
    }
}