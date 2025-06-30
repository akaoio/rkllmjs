// Simple test compilation
#include "rkllm-napi.hpp"
#include <iostream>

int main() {
    std::cout << "Testing N-API bindings compilation..." << std::endl;
    
    rkllmjs::test_napi_bindings();
    
    std::cout << "Test completed successfully!" << std::endl;
    return 0;
}
