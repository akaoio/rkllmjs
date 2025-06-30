#include <gtest/gtest.h>
#include "inference-engine.hpp"

namespace rkllmjs {
namespace inference {
namespace test {

class InferenceEngineTest : public ::testing::Test {
protected:
    void SetUp() override {
        // For now, we'll skip creating the actual inference engine
        // since it requires a working RKLLMManager
    }
    
    void TearDown() override {}
};

// Basic parameter tests
TEST_F(InferenceEngineTest, InferenceParamsValidation) {
    InferenceParams params;
    params.prompt = "Hello, world!";
    params.maxTokens = 100;
    params.temperature = 0.7f;
    params.topP = 0.9f;
    params.topK = 40;
    
    EXPECT_TRUE(params.isValid());
    
    // Test invalid parameters
    params.prompt = "";
    EXPECT_FALSE(params.isValid());
    
    params.prompt = "Hello";
    params.maxTokens = -1;
    EXPECT_FALSE(params.isValid());
}

// Utility function tests
TEST_F(InferenceEngineTest, UtilityFunctions) {
    // Test tokenization (mock implementation)
    auto tokens = utils::tokenize("hello world", "");
    EXPECT_EQ(tokens.size(), 2);
    
    // Test detokenization (mock implementation)
    std::vector<int32_t> tokenIds = {1, 2, 3};
    auto text = utils::detokenize(tokenIds, "");
    EXPECT_FALSE(text.empty());
    
    // Test prompt formatting
    std::map<std::string, std::string> vars = {{"name", "Alice"}};
    auto formatted = utils::formatPrompt("Hello {{name}}!", vars);
    EXPECT_EQ(formatted, "Hello Alice!");
    
    // Test validation
    EXPECT_TRUE(utils::isValidPrompt("Hello world"));
    EXPECT_FALSE(utils::isValidPrompt(""));
}

// Sampling strategy tests
TEST_F(InferenceEngineTest, SamplingStrategies) {
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
TEST_F(InferenceEngineTest, PerformanceUtils) {
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

} // namespace test
} // namespace inference
} // namespace rkllmjs

// Test runner
int main(int argc, char** argv) {
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}
