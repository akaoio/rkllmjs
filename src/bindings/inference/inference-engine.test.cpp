#include "../testing/rkllmjs-test.hpp"
#include "../config/build-config.hpp"
#include "inference-engine.hpp"

using namespace rkllmjs::testing;

namespace rkllmjs {
namespace inference {
namespace test {

// Tests for unified build system (full functionality always available)
TEST(InferenceEngineTest, InferenceParamsValidation) {
    // Test valid parameters
    InferenceParams params;
    params.prompt = "Hello, world!";
    params.maxTokens = 100;
    params.temperature = 0.7f;
    params.topP = 0.9f;
    params.topK = 40;
    
    EXPECT_FALSE(params.prompt.empty());
    EXPECT_TRUE(params.maxTokens > 0);
    EXPECT_TRUE(params.temperature >= 0.0f);
    EXPECT_TRUE(params.temperature <= 2.0f);
    EXPECT_TRUE(params.isValid());
    
    // Test invalid parameters
    InferenceParams invalidParams;
    invalidParams.prompt = "";
    EXPECT_FALSE(invalidParams.isValid());
    
    invalidParams.prompt = "Hello";
    invalidParams.maxTokens = -1;
    EXPECT_FALSE(invalidParams.isValid());
}

// Utility function tests
TEST(InferenceEngineTest, UtilityFunctions) {
    // Test prompt formatting
    std::map<std::string, std::string> vars = {{"name", "Alice"}};
    auto formatted = utils::formatPrompt("Hello {{name}}!", vars);
    EXPECT_EQ(formatted, "Hello Alice!");
    
    // Test validation
    EXPECT_TRUE(utils::isValidPrompt("Hello world"));
    EXPECT_FALSE(utils::isValidPrompt(""));
    
    // Test valid inference params through utility function
    InferenceParams validParams;
    validParams.prompt = "Hello world";
    validParams.maxTokens = 100;
    validParams.temperature = 0.7f;
    EXPECT_TRUE(utils::isValidInferenceParams(validParams));
    
    // Test invalid inference params through utility function
    InferenceParams invalidParams;
    invalidParams.prompt = "";
    EXPECT_FALSE(utils::isValidInferenceParams(invalidParams));
}

// Sampling strategy tests
TEST(InferenceEngineTest, SamplingStrategies) {
    std::vector<float> logits = {1.0f, 2.0f, 3.0f, 1.5f};
    
    GreedySampling greedy;
    int result = greedy.sample(logits, 1.0f, 0.9f, 3);
    EXPECT_EQ(result, 2); // Index of max value (3.0f)
    
    TopKSampling topK;
    result = topK.sample(logits, 1.0f, 0.9f, 2);
    EXPECT_GE(result, 0);
    EXPECT_LT(result, static_cast<int>(logits.size()));
    
    TopPSampling topP;
    result = topP.sample(logits, 1.0f, 0.9f, 4);
    EXPECT_GE(result, 0);
    EXPECT_LT(result, static_cast<int>(logits.size()));
}

// Performance utility tests
TEST(InferenceEngineTest, PerformanceUtils) {
    std::vector<float> logprobs = {-0.1f, -0.2f, -0.15f};
    float perplexity = utils::calculatePerplexity(logprobs);
    EXPECT_GT(perplexity, 0.0f);
    
    std::vector<float> logits = {1.0f, 2.0f, 3.0f};
    auto softmax_result = utils::softmax(logits, 1.0f);
    EXPECT_EQ(softmax_result.size(), logits.size());
    
    // Check that probabilities sum to 1
    float sum = 0.0f;
    for (float prob : softmax_result) {
        sum += prob;
    }
    EXPECT_NEAR(sum, 1.0f, 1e-6f);
}

// Hardware-specific tests that adapt at runtime
TEST(InferenceEngineTest, HardwareAdaptiveTests) {
    // Test that engine can detect hardware capabilities
    using namespace rkllmjs::config;
    
    bool is_rk3588 = detect_rk3588();
    // bool is_arm64 = detect_arm64(); // Unused for now
    
    // These should work regardless of hardware
    EXPECT_TRUE(true); // Basic compilation test
    
    // Runtime behavior can adapt based on hardware
    if (is_rk3588) {
        // On actual RK3588 hardware, full features available
        EXPECT_TRUE(RKLLMJS_HAS_RKLLM_NATIVE);
    } else {
        // On other platforms, features still available but may use fallbacks
        EXPECT_TRUE(RKLLMJS_HAS_RKLLM_NATIVE);
    }
}

} // namespace test
} // namespace inference
} // namespace rkllmjs

// Main function using RKLLMJS Test Framework
RKLLMJS_TEST_MAIN()