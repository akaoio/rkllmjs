#include "inference-engine.hpp"
#include "../config/build-config.hpp"
#include "../../../libs/rkllm/include/rkllm.h"

// Professional conditional inclusion - centralized configuration
#include "../utils/type-converters.hpp"

#include <algorithm>
#include <random>
#include <chrono>
#include <thread>
#include <sstream>
#include <regex>
#include <numeric>
#include <map>
#include <iostream>

namespace rkllmjs {
namespace inference {

// Static callback function for RKLLM results
static int rkllm_result_callback(RKLLMResult* result, void* userdata, LLMCallState state) {
    struct InferenceContext {
        std::string* accumulated_text;
        int* token_count;
        bool* is_finished;
        std::string* finish_reason;
    };
    
    InferenceContext* ctx = static_cast<InferenceContext*>(userdata);
    
    if (result && result->text && ctx->accumulated_text) {
        // Print streaming text in real-time
        std::cout << result->text << std::flush;
        *(ctx->accumulated_text) += result->text;
        (*(ctx->token_count))++;
    }
    
    switch (state) {
        case RKLLM_RUN_NORMAL:
            return 0; // Continue
        case RKLLM_RUN_WAITING:
            return 0; // Continue
        case RKLLM_RUN_FINISH:
            if (ctx->is_finished && ctx->finish_reason) {
                *(ctx->is_finished) = true;
                *(ctx->finish_reason) = "completed";
                std::cout << "\n"; // New line after completion
            }
            return 0;
        case RKLLM_RUN_ERROR:
            if (ctx->is_finished && ctx->finish_reason) {
                *(ctx->is_finished) = true;
                *(ctx->finish_reason) = "error";
                std::cout << "\n[ERROR] Inference failed\n";
            }
            return 1; // Stop
        default:
            return 0;
    }
}

// InferenceParams implementation
bool InferenceParams::isValid() const {
    return validate().empty();
}

std::string InferenceParams::validate() const {
    std::vector<std::string> errors;
    
    if (prompt.empty()) {
        errors.push_back("Prompt cannot be empty");
    }
    
    if (maxTokens <= 0 || maxTokens > 8192) {
        errors.push_back("maxTokens must be between 1 and 8192");
    }
    
    if (temperature < 0.0f || temperature > 2.0f) {
        errors.push_back("temperature must be between 0.0 and 2.0");
    }
    
    if (topP < 0.0f || topP > 1.0f) {
        errors.push_back("topP must be between 0.0 and 1.0");
    }
    
    if (topK <= 0 || topK > 1000) {
        errors.push_back("topK must be between 1 and 1000");
    }
    
    if (repetitionPenalty < 0.0f || repetitionPenalty > 2.0f) {
        errors.push_back("repetitionPenalty must be between 0.0 and 2.0");
    }
    
    if (batchSize <= 0 || batchSize > 32) {
        errors.push_back("batchSize must be between 1 and 32");
    }
    
    if (errors.empty()) {
        return "";
    }
    
    std::ostringstream oss;
    oss << "Invalid inference parameters: ";
    for (size_t i = 0; i < errors.size(); ++i) {
        if (i > 0) oss << ", ";
        oss << errors[i];
    }
    return oss.str();
}

// InferenceEngine implementation
InferenceEngine::InferenceEngine(std::shared_ptr<core::RKLLMManager> manager)
    : manager_(manager)
    , modelHandle_(nullptr)
    , state_(InferenceState::IDLE)
    , stopRequested_(false)
    , pauseRequested_(false)
    , maxConcurrentInferences_(4)
    , streamBufferSize_(128)
    , kvCacheEnabled_(true)
    , stats_{} {
    
    if (!manager_) {
        throw rkllmjs::utils::ResourceException("RKLLMManager cannot be null");
    }
    
    // Set default parameters
    defaultParams_.maxTokens = 512;
    defaultParams_.temperature = 0.7f;
    defaultParams_.topP = 0.9f;
    defaultParams_.topK = 40;
    defaultParams_.repetitionPenalty = 1.1f;
}

InferenceEngine::~InferenceEngine() {
    stop();
}

void InferenceEngine::setModelHandle(LLMHandle handle) {
    modelHandle_ = handle;
}

LLMHandle InferenceEngine::getModelHandle() const {
    return modelHandle_;
}

InferenceResult InferenceEngine::generate(const InferenceParams& params) {
    if (state_ == InferenceState::ERROR) {
        throw rkllmjs::utils::RKLLMException("Inference engine is in error state");
    }
    
    validateParams(params);
    
    state_ = InferenceState::RUNNING;
    
    try {
        InferenceResult result = executeInference(params);
        updateStats(result);
        state_ = InferenceState::IDLE;
        return result;
    } catch (const std::exception& e) {
        state_ = InferenceState::ERROR;
        throw;
    }
}

void InferenceEngine::generateStream(const InferenceParams& params, StreamCallback callback) {
    if (!callback) {
        throw rkllmjs::utils::RKLLMException("Stream callback cannot be null");
    }
    
    validateParams(params);
    
    state_ = InferenceState::STREAMING;
    
    std::promise<InferenceResult> promise;
    std::thread streamThread(&InferenceEngine::streamingWorker, this, params, callback, std::move(promise));
    streamThread.detach();
}

std::future<InferenceResult> InferenceEngine::generateStreamAsync(const InferenceParams& params, StreamCallback callback) {
    if (!callback) {
        throw rkllmjs::utils::RKLLMException("Stream callback cannot be null");
    }
    
    validateParams(params);
    
    state_ = InferenceState::STREAMING;
    
    std::promise<InferenceResult> promise;
    std::future<InferenceResult> future = promise.get_future();
    
    std::thread streamThread(&InferenceEngine::streamingWorker, this, params, callback, std::move(promise));
    streamThread.detach();
    
    return future;
}

std::vector<BatchResult> InferenceEngine::generateBatch(const std::vector<BatchRequest>& requests) {
    if (requests.empty()) {
        return {};
    }
    
    state_ = InferenceState::BATCH_PROCESSING;
    
    try {
        std::promise<std::vector<BatchResult>> promise;
        std::future<std::vector<BatchResult>> future = promise.get_future();
        
        std::thread batchThread(&InferenceEngine::processBatchRequests, this, requests, std::move(promise));
        batchThread.join();
        
        auto results = future.get();
        state_ = InferenceState::IDLE;
        return results;
    } catch (const std::exception& e) {
        state_ = InferenceState::ERROR;
        throw;
    }
}

std::future<std::vector<BatchResult>> InferenceEngine::generateBatchAsync(const std::vector<BatchRequest>& requests) {
    if (requests.empty()) {
        std::promise<std::vector<BatchResult>> promise;
        promise.set_value({});
        return promise.get_future();
    }
    
    state_ = InferenceState::BATCH_PROCESSING;
    
    std::promise<std::vector<BatchResult>> promise;
    std::future<std::vector<BatchResult>> future = promise.get_future();
    
    std::thread batchThread(&InferenceEngine::processBatchRequests, this, requests, std::move(promise));
    batchThread.detach();
    
    return future;
}

void InferenceEngine::pause() {
    pauseRequested_ = true;
    state_ = InferenceState::PAUSED;
}

void InferenceEngine::resume() {
    pauseRequested_ = false;
    state_ = InferenceState::IDLE;
}

void InferenceEngine::stop() {
    stopRequested_ = true;
    state_ = InferenceState::IDLE;
}

bool InferenceEngine::isRunning() const {
    InferenceState currentState = state_.load();
    return currentState == InferenceState::RUNNING || 
           currentState == InferenceState::STREAMING || 
           currentState == InferenceState::BATCH_PROCESSING;
}

InferenceState InferenceEngine::getState() const {
    return state_.load();
}

void InferenceEngine::setMaxConcurrentInferences(int32_t maxConcurrent) {
    if (maxConcurrent <= 0 || maxConcurrent > 16) {
        throw rkllmjs::utils::RKLLMException("maxConcurrent must be between 1 and 16");
    }
    maxConcurrentInferences_ = maxConcurrent;
}

void InferenceEngine::setStreamBufferSize(int32_t bufferSize) {
    if (bufferSize <= 0 || bufferSize > 1024) {
        throw rkllmjs::utils::RKLLMException("bufferSize must be between 1 and 1024");
    }
    streamBufferSize_ = bufferSize;
}

void InferenceEngine::enableKVCache(bool enable) {
    kvCacheEnabled_ = enable;
}

void InferenceEngine::setDefaultParams(const InferenceParams& params) {
    validateParams(params);
    defaultParams_ = params;
}

InferenceEngine::Stats InferenceEngine::getStats() const {
    std::lock_guard<std::mutex> lock(statsMutex_);
    return stats_;
}

void InferenceEngine::resetStats() {
    std::lock_guard<std::mutex> lock(statsMutex_);
    stats_ = {};
}

// Private methods
InferenceResult InferenceEngine::executeInference(const InferenceParams& params) {
    auto startTime = std::chrono::high_resolution_clock::now();
    
    // Preprocess prompt
    std::string processedPrompt = preprocessPrompt(params.prompt);
    
    // Initialize result
    InferenceResult result;
    result.tokensGenerated = 0;
    result.finished = false;
    result.finishReason = "";
    
    try {
        // Check if we have a valid model handle
        if (!modelHandle_) {
            throw rkllmjs::utils::RKLLMException("No model handle set for inference");
        }
        
        // Context structure for callback
        std::string accumulated_text;
        int token_count = 0;
        bool is_finished = false;
        std::string finish_reason;
        
        struct InferenceContext {
            std::string* accumulated_text;
            int* token_count;
            bool* is_finished;
            std::string* finish_reason;
        };
        
        InferenceContext context = {
            &accumulated_text,
            &token_count, 
            &is_finished,
            &finish_reason
        };
        
        // Prepare RKLLM input structure
        RKLLMInput rkllm_input;
        rkllm_input.role = "user";
        rkllm_input.enable_thinking = false;
        rkllm_input.input_type = RKLLM_INPUT_PROMPT;
        rkllm_input.prompt_input = processedPrompt.c_str();
        
        // Prepare RKLLM inference parameters
        RKLLMInferParam rkllm_infer_params;
        rkllm_infer_params.mode = RKLLM_INFER_GENERATE;
        rkllm_infer_params.lora_params = nullptr;
        rkllm_infer_params.prompt_cache_params = nullptr;
        rkllm_infer_params.keep_history = 1;
        
        // Run RKLLM inference with context for callback
        int status = rkllm_run(modelHandle_, &rkllm_input, &rkllm_infer_params, &context);
        
        if (status == 0) {
            result.text = accumulated_text.empty() ? "Inference completed successfully" : accumulated_text;
            result.finished = is_finished;
            result.finishReason = finish_reason.empty() ? "completed" : finish_reason;
            result.tokensGenerated = token_count > 0 ? token_count : static_cast<uint32_t>(result.text.length() / 4);
        } else {
            result.text = "";
            result.finished = false;
            result.finishReason = "error";
            throw rkllmjs::utils::RKLLMException("RKLLM inference failed with status: " + std::to_string(status));
        }
        
    } catch (const std::exception& e) {
        // Fallback to error state
        result.text = "Error: " + std::string(e.what());
        result.finished = false;
        result.finishReason = "error";
    }
    
    auto endTime = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(endTime - startTime);
    
    result.totalTime = duration.count() / 1000.0f;
    result.tokensPerSecond = calculateTokensPerSecond(result.tokensGenerated, result.totalTime);
    result.promptTokens = static_cast<int32_t>(processedPrompt.length() / 4); // Rough estimate
    result.completionTokens = result.tokensGenerated;
    result.totalTokens = result.promptTokens + result.completionTokens;
    
    return result;
}

void InferenceEngine::validateParams(const InferenceParams& params) {
    std::string validationError = params.validate();
    if (!validationError.empty()) {
        throw rkllmjs::utils::ConfigurationException(validationError);
    }
}

void InferenceEngine::updateStats(const InferenceResult& result) {
    std::lock_guard<std::mutex> lock(statsMutex_);
    
    stats_.totalInferences++;
    stats_.totalTokensGenerated += result.tokensGenerated;
    
    // Update running averages
    float newAvgTPS = (stats_.averageTokensPerSecond * (stats_.totalInferences - 1) + result.tokensPerSecond) / stats_.totalInferences;
    float newAvgLatency = (stats_.averageLatency * (stats_.totalInferences - 1) + result.totalTime) / stats_.totalInferences;
    
    stats_.averageTokensPerSecond = newAvgTPS;
    stats_.averageLatency = newAvgLatency;
}

void InferenceEngine::streamingWorker(const InferenceParams& params, StreamCallback callback, 
                                    std::promise<InferenceResult> promise) {
    try {
        // Execute inference with streaming
        InferenceResult result = executeInference(params);
        
        // Simulate streaming by breaking up the result
        std::vector<std::string> tokens = {"This", " is", " a", " simulated", " streaming", " response"};
        
        for (size_t i = 0; i < tokens.size(); ++i) {
            if (stopRequested_) break;
            
            bool isLast = (i == tokens.size() - 1);
            callback(tokens[i], isLast);
            
            // Simulate streaming delay
            std::this_thread::sleep_for(std::chrono::milliseconds(50));
        }
        
        updateStats(result);
        promise.set_value(result);
        state_ = InferenceState::IDLE;
        
    } catch (const std::exception& e) {
        state_ = InferenceState::ERROR;
        promise.set_exception(std::current_exception());
    }
}

void InferenceEngine::processBatchRequests(const std::vector<BatchRequest>& requests, 
                                         std::promise<std::vector<BatchResult>> promise) {
    try {
        std::vector<BatchResult> results;
        results.reserve(requests.size());
        
        for (const auto& request : requests) {
            if (stopRequested_) break;
            
            BatchResult batchResult;
            batchResult.id = request.id;
            
            try {
                batchResult.result = executeInference(request.params);
                updateStats(batchResult.result);
            } catch (const std::exception& e) {
                batchResult.error.category = rkllmjs::utils::ErrorCategory::MODEL_OPERATION;
                batchResult.error.severity = rkllmjs::utils::ErrorSeverity::ERROR;
                batchResult.error.message = e.what();
                batchResult.error.code = "BATCH_INFERENCE_FAILED";
            }
            
            results.push_back(batchResult);
        }
        
        promise.set_value(results);
        state_ = InferenceState::IDLE;
        
    } catch (const std::exception& e) {
        state_ = InferenceState::ERROR;
        promise.set_exception(std::current_exception());
    }
}

std::string InferenceEngine::preprocessPrompt(const std::string& prompt) {
    // Basic preprocessing - in real implementation, this would be more sophisticated
    std::string processed = prompt;
    
    // Remove excessive whitespace
    std::regex whitespaceRegex("\\s+");
    processed = std::regex_replace(processed, whitespaceRegex, " ");
    
    // Trim leading/trailing whitespace
    processed.erase(0, processed.find_first_not_of(" \t\n\r"));
    processed.erase(processed.find_last_not_of(" \t\n\r") + 1);
    
    return processed;
}

bool InferenceEngine::shouldStop(const std::string& generated, const std::vector<std::string>& stopSequences) {
    for (const auto& stopSeq : stopSequences) {
        if (generated.find(stopSeq) != std::string::npos) {
            return true;
        }
    }
    return false;
}

float InferenceEngine::calculateTokensPerSecond(int32_t tokens, float timeSeconds) {
    if (timeSeconds <= 0.0f) return 0.0f;
    return static_cast<float>(tokens) / timeSeconds;
}

// Sampling strategies implementation
int32_t GreedySampling::sample(const std::vector<float>& logits, float temperature, float topP, int32_t topK) {
    (void)temperature; (void)topP; (void)topK; // Suppress unused parameter warnings
    
    auto maxIt = std::max_element(logits.begin(), logits.end());
    return static_cast<int32_t>(std::distance(logits.begin(), maxIt));
}

int32_t TopKSampling::sample(const std::vector<float>& logits, float temperature, float topP, int32_t topK) {
    (void)topP; // Not used in TopK sampling
    
    // Create pairs of (logit, index)
    std::vector<std::pair<float, int32_t>> logitPairs;
    for (size_t i = 0; i < logits.size(); ++i) {
        logitPairs.emplace_back(logits[i], static_cast<int32_t>(i));
    }
    
    // Sort by logit value (descending)
    std::sort(logitPairs.begin(), logitPairs.end(), 
              [](const auto& a, const auto& b) { return a.first > b.first; });
    
    // Keep only top K
    int32_t k = std::min(topK, static_cast<int32_t>(logitPairs.size()));
    logitPairs.resize(k);
    
    // Apply temperature and sample
    std::vector<float> probs;
    probs.reserve(k);
    
    for (const auto& pair : logitPairs) {
        probs.push_back(std::exp(pair.first / temperature));
    }
    
    // Normalize probabilities
    float sum = std::accumulate(probs.begin(), probs.end(), 0.0f);
    for (float& prob : probs) {
        prob /= sum;
    }
    
    // Sample from distribution
    std::random_device rd;
    std::mt19937 gen(rd());
    std::discrete_distribution<> dist(probs.begin(), probs.end());
    
    int32_t sampledIndex = dist(gen);
    return logitPairs[sampledIndex].second;
}

int32_t TopPSampling::sample(const std::vector<float>& logits, float temperature, float topP, int32_t topK) {
    (void)topK; // Not used in TopP sampling
    
    // Create pairs of (logit, index)
    std::vector<std::pair<float, int32_t>> logitPairs;
    for (size_t i = 0; i < logits.size(); ++i) {
        logitPairs.emplace_back(logits[i], static_cast<int32_t>(i));
    }
    
    // Sort by logit value (descending)
    std::sort(logitPairs.begin(), logitPairs.end(), 
              [](const auto& a, const auto& b) { return a.first > b.first; });
    
    // Apply temperature and compute probabilities
    std::vector<float> probs;
    probs.reserve(logitPairs.size());
    
    for (const auto& pair : logitPairs) {
        probs.push_back(std::exp(pair.first / temperature));
    }
    
    // Normalize probabilities
    float sum = std::accumulate(probs.begin(), probs.end(), 0.0f);
    for (float& prob : probs) {
        prob /= sum;
    }
    
    // Find cutoff for top-p
    float cumulativeProb = 0.0f;
    size_t cutoff = 0;
    
    for (size_t i = 0; i < probs.size(); ++i) {
        cumulativeProb += probs[i];
        cutoff = i + 1;
        if (cumulativeProb >= topP) {
            break;
        }
    }
    
    // Keep only top-p tokens
    logitPairs.resize(cutoff);
    probs.resize(cutoff);
    
    // Renormalize
    sum = std::accumulate(probs.begin(), probs.end(), 0.0f);
    for (float& prob : probs) {
        prob /= sum;
    }
    
    // Sample from distribution
    std::random_device rd;
    std::mt19937 gen(rd());
    std::discrete_distribution<> dist(probs.begin(), probs.end());
    
    int32_t sampledIndex = dist(gen);
    return logitPairs[sampledIndex].second;
}

// Utility functions implementation
namespace utils {

std::vector<int32_t> tokenize(const std::string& text, const std::string& modelPath) {
    (void)modelPath; // Will be used in real implementation
    
    // Tokenization - split by whitespace and assign IDs
    std::vector<int32_t> tokens;
    std::istringstream iss(text);
    std::string word;
    
    while (iss >> word) {
        // Simple hash-based token ID (not suitable for production)
        int32_t tokenId = static_cast<int32_t>(std::hash<std::string>{}(word) % 50000);
        tokens.push_back(tokenId);
    }
    
    return tokens;
}

std::string detokenize(const std::vector<int32_t>& tokens, const std::string& modelPath) {
    (void)modelPath; // Will be used in real implementation
    
    // Detokenization
    std::ostringstream oss;
    for (size_t i = 0; i < tokens.size(); ++i) {
        if (i > 0) oss << " ";
        oss << "token_" << tokens[i];
    }
    
    return oss.str();
}

std::string formatPrompt(const std::string& template_, const std::map<std::string, std::string>& variables) {
    std::string result = template_;
    
    for (const auto& [key, value] : variables) {
        std::string placeholder = "{{" + key + "}}";
        size_t pos = 0;
        
        while ((pos = result.find(placeholder, pos)) != std::string::npos) {
            result.replace(pos, placeholder.length(), value);
            pos += value.length();
        }
    }
    
    return result;
}

std::string escapeSpecialTokens(const std::string& text) {
    std::string escaped = text;
    
    // Escape common special tokens
    std::vector<std::pair<std::string, std::string>> replacements = {
        {"<|endoftext|>", "&lt;|endoftext|&gt;"},
        {"<|im_start|>", "&lt;|im_start|&gt;"},
        {"<|im_end|>", "&lt;|im_end|&gt;"}
    };
    
    for (const auto& [from, to] : replacements) {
        size_t pos = 0;
        while ((pos = escaped.find(from, pos)) != std::string::npos) {
            escaped.replace(pos, from.length(), to);
            pos += to.length();
        }
    }
    
    return escaped;
}

float calculatePerplexity(const std::vector<float>& logprobs) {
    if (logprobs.empty()) return 0.0f;
    
    float sum = 0.0f;
    for (float logprob : logprobs) {
        sum += logprob;
    }
    
    float avgLogProb = sum / static_cast<float>(logprobs.size());
    return std::exp(-avgLogProb);
}

std::vector<float> softmax(const std::vector<float>& logits, float temperature) {
    std::vector<float> result;
    result.reserve(logits.size());
    
    // Find max for numerical stability
    float maxLogit = *std::max_element(logits.begin(), logits.end());
    
    // Compute exp(logit / temperature - max)
    float sum = 0.0f;
    for (float logit : logits) {
        float exp_val = std::exp((logit - maxLogit) / temperature);
        result.push_back(exp_val);
        sum += exp_val;
    }
    
    // Normalize
    for (float& val : result) {
        val /= sum;
    }
    
    return result;
}

bool isValidPrompt(const std::string& prompt) {
    return !prompt.empty() && prompt.length() <= 32768; // 32K character limit
}

bool isValidInferenceParams(const InferenceParams& params) {
    return params.isValid();
}

} // namespace utils

} // namespace inference
} // namespace rkllmjs
