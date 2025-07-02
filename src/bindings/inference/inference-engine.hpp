/**
 * @module inference
 * @purpose High-performance text generation and streaming inference engine
 * @description Implements advanced inference capabilities with multiple sampling strategies,
 *              streaming text generation, batch processing, and KV-cache optimization.
 *              Supports concurrent inference management and real-time performance monitoring.
 * @author RKLLMJS Team
 * @version 1.0.0
 */

#pragma once

#include <memory>
#include <string>
#include <vector>
#include <functional>
#include <future>
#include <atomic>
#include <map>
#include "../config/build-config.hpp"

// Conditional RKLLM includes
#if RKLLMJS_HAS_RKLLM_NATIVE
    #include "../../../libs/rkllm/include/rkllm.h"
#else
    // Production mode - define proper types
    typedef void* LLMHandle;
#endif

// Professional conditional includes - centralized configuration
#include "../utils/error-handler.hpp"
#include "../utils/type-converters.hpp"

#include "../core/rkllm-manager.hpp"

namespace rkllmjs {
namespace inference {

/**
 * @brief Inference execution engine for RKLLM models
 * 
 * This module handles text generation, batch inference, streaming,
 * and advanced sampling strategies for RKLLM models.
 */

/**
 * Inference parameters for text generation
 */
struct InferenceParams {
    // Basic parameters
    std::string prompt;
    int32_t maxTokens = 512;
    float temperature = 0.7f;
    float topP = 0.9f;
    int32_t topK = 40;
    float repetitionPenalty = 1.1f;
    
    // Advanced parameters
    std::vector<std::string> stopSequences;
    int32_t seed = -1; // -1 for random seed
    bool useCache = true;
    float presencePenalty = 0.0f;
    float frequencyPenalty = 0.0f;
    
    // Streaming parameters
    bool stream = false;
    int32_t streamBatchSize = 1;
    
    // Performance parameters
    int32_t batchSize = 1;
    bool enableKVCache = true;
    
    // Validation
    bool isValid() const;
    std::string validate() const;
};

/**
 * Inference result structure
 */
struct InferenceResult {
    std::string text;
    std::vector<float> logprobs;
    int32_t tokensGenerated;
    float totalTime;
    float tokensPerSecond;
    bool finished;
    std::string finishReason; // "length", "stop", "error"
    
    // Metadata
    int32_t promptTokens;
    int32_t completionTokens;
    int32_t totalTokens;
};

/**
 * Streaming inference callback
 */
using StreamCallback = std::function<void(const std::string& token, bool isLast)>;

/**
 * Batch inference request
 */
struct BatchRequest {
    std::string id;
    InferenceParams params;
};

/**
 * Batch inference result
 */
struct BatchResult {
    std::string id;
    InferenceResult result;
    rkllmjs::utils::ErrorInfo error; // Empty if successful
};

/**
 * Inference engine state
 */
enum class InferenceState {
    IDLE,
    RUNNING,
    STREAMING,
    BATCH_PROCESSING,
    PAUSED,
    ERROR
};

/**
 * Main inference engine class
 */
class InferenceEngine {
public:
    explicit InferenceEngine(std::shared_ptr<core::RKLLMManager> manager);
    ~InferenceEngine();
    
    // Basic inference
    InferenceResult generate(const InferenceParams& params);
    
    // Model handle management
    void setModelHandle(LLMHandle handle);
    LLMHandle getModelHandle() const;
    
    // Streaming inference
    void generateStream(const InferenceParams& params, StreamCallback callback);
    std::future<InferenceResult> generateStreamAsync(const InferenceParams& params, StreamCallback callback);
    
    // Batch inference
    std::vector<BatchResult> generateBatch(const std::vector<BatchRequest>& requests);
    std::future<std::vector<BatchResult>> generateBatchAsync(const std::vector<BatchRequest>& requests);
    
    // Control methods
    void pause();
    void resume();
    void stop();
    bool isRunning() const;
    InferenceState getState() const;
    
    // Configuration
    void setMaxConcurrentInferences(int32_t maxConcurrent);
    void setStreamBufferSize(int32_t bufferSize);
    void enableKVCache(bool enable);
    void setDefaultParams(const InferenceParams& params);
    
    // Statistics
    struct Stats {
        int64_t totalInferences;
        int64_t totalTokensGenerated;
        float averageTokensPerSecond;
        float averageLatency;
        int32_t activeInferences;
    };
    
    Stats getStats() const;
    void resetStats();
    
private:
    // Core components
    std::shared_ptr<core::RKLLMManager> manager_;
    LLMHandle modelHandle_;
    
    // State management
    std::atomic<InferenceState> state_;
    std::atomic<bool> stopRequested_;
    std::atomic<bool> pauseRequested_;
    
    // Configuration
    InferenceParams defaultParams_;
    int32_t maxConcurrentInferences_;
    int32_t streamBufferSize_;
    bool kvCacheEnabled_;
    
    // Statistics
    mutable std::mutex statsMutex_;
    Stats stats_;
    
    // Internal methods
    InferenceResult executeInference(const InferenceParams& params);
    void validateParams(const InferenceParams& params);
    void updateStats(const InferenceResult& result);
    
    // Streaming implementation
    void streamingWorker(const InferenceParams& params, StreamCallback callback, 
                        std::promise<InferenceResult> promise);
    
    // Batch processing
    void processBatchRequests(const std::vector<BatchRequest>& requests, 
                             std::promise<std::vector<BatchResult>> promise);
    
    // Utility methods
    std::string preprocessPrompt(const std::string& prompt);
    bool shouldStop(const std::string& generated, const std::vector<std::string>& stopSequences);
    float calculateTokensPerSecond(int32_t tokens, float timeSeconds);
};

/**
 * Sampling strategy interface
 */
class SamplingStrategy {
public:
    virtual ~SamplingStrategy() = default;
    virtual int32_t sample(const std::vector<float>& logits, float temperature, float topP, int32_t topK) = 0;
    virtual std::string getName() const = 0;
};

/**
 * Standard sampling strategies
 */
class GreedySampling : public SamplingStrategy {
public:
    int32_t sample(const std::vector<float>& logits, float temperature, float topP, int32_t topK) override;
    std::string getName() const override { return "greedy"; }
};

class TopKSampling : public SamplingStrategy {
public:
    int32_t sample(const std::vector<float>& logits, float temperature, float topP, int32_t topK) override;
    std::string getName() const override { return "top_k"; }
};

class TopPSampling : public SamplingStrategy {
public:
    int32_t sample(const std::vector<float>& logits, float temperature, float topP, int32_t topK) override;
    std::string getName() const override { return "top_p"; }
};

/**
 * Advanced inference utilities
 */
namespace utils {
    // Token utilities
    std::vector<int32_t> tokenize(const std::string& text, const std::string& modelPath);
    std::string detokenize(const std::vector<int32_t>& tokens, const std::string& modelPath);
    
    // Prompt utilities
    std::string formatPrompt(const std::string& template_, const std::map<std::string, std::string>& variables);
    std::string escapeSpecialTokens(const std::string& text);
    
    // Performance utilities
    float calculatePerplexity(const std::vector<float>& logprobs);
    std::vector<float> softmax(const std::vector<float>& logits, float temperature = 1.0f);
    
    // Validation utilities
    bool isValidPrompt(const std::string& prompt);
    bool isValidInferenceParams(const InferenceParams& params);
}

} // namespace inference
} // namespace rkllmjs
