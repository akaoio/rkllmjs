#pragma once

#include <memory>
#include <string>
#include <unordered_map>
#include <mutex>
#include <vector>
#include "../../../libs/rkllm/include/rkllm.h"

namespace rkllmjs {
namespace core {

/**
 * Result codes for RKLLM operations
 */
enum class ManagerResult {
    SUCCESS = 0,
    ERROR_INVALID_CONFIG,
    ERROR_MODEL_LOAD_FAILED,
    ERROR_RESOURCE_EXHAUSTED,
    ERROR_INVALID_HANDLE,
    ERROR_INITIALIZATION_FAILED,
    ERROR_UNKNOWN
};

/**
 * Model configuration structure
 */
struct RKLLMModelConfig {
    std::string model_path;
    int max_context_len = 512;
    int max_new_tokens = 128;
    int top_k = 1;
    float top_p = 0.9f;
    float temperature = 0.8f;
    float repeat_penalty = 1.1f;
    int npu_core_num = 3;
    bool use_gpu = false;
    
    // Validation
    bool isValid() const;
    std::string getValidationError() const;
};

/**
 * Resource usage statistics
 */
struct ResourceStats {
    float npu_utilization = 0.0f;     // Percentage 0-100
    size_t memory_usage_mb = 0;       // Memory usage in MB
    size_t total_memory_mb = 0;       // Total available memory
    int active_models = 0;            // Number of active model instances
    int npu_cores_used = 0;          // NPU cores in use
};

/**
 * Model instance information
 */
struct ModelInstance {
    LLMHandle handle;
    RKLLMModelConfig config;
    std::string model_id;
    bool is_active;
    
    ModelInstance(LLMHandle h, const RKLLMModelConfig& cfg, const std::string& id)
        : handle(h), config(cfg), model_id(id), is_active(true) {}
};

/**
 * RKLLM Manager - Core model lifecycle management
 * 
 * Thread-safe singleton that manages RKLLM model instances,
 * resource allocation, and configuration validation.
 */
class RKLLMManager {
public:
    // Singleton access
    static RKLLMManager& getInstance();
    
    // Lifecycle
    ManagerResult initialize();
    ManagerResult cleanup();
    bool isInitialized() const;
    
    // Model management
    ManagerResult createModel(const RKLLMModelConfig& config, LLMHandle* handle);
    ManagerResult destroyModel(LLMHandle handle);
    ManagerResult getModelConfig(LLMHandle handle, RKLLMModelConfig* config);
    
    // Resource monitoring
    ResourceStats getResourceStats() const;
    bool hasAvailableResources(const RKLLMModelConfig& config) const;
    
    // Configuration validation
    static ManagerResult validateConfig(const RKLLMModelConfig& config);
    static RKLLMModelConfig getDefaultConfig();
    static RKLLMModelConfig getOptimizedConfig(const std::string& model_path);
    
    // Utility
    std::vector<std::string> getActiveModelIds() const;
    size_t getActiveModelCount() const;
    
    // Error handling
    static std::string getErrorMessage(ManagerResult result);

private:
    // Singleton
    RKLLMManager() = default;
    ~RKLLMManager();
    RKLLMManager(const RKLLMManager&) = delete;
    RKLLMManager& operator=(const RKLLMManager&) = delete;
    
    // Internal methods
    std::string generateModelId();
    ManagerResult allocateResources(const RKLLMModelConfig& config);
    void deallocateResources(const std::string& model_id);
    void updateResourceStats();
    
    // Member variables
    mutable std::mutex mutex_;
    bool initialized_ = false;
    std::unordered_map<LLMHandle, std::unique_ptr<ModelInstance>> models_;
    ResourceStats resource_stats_;
    size_t next_model_id_ = 1;
    
    // Resource tracking
    int total_npu_cores_ = 3;
    size_t total_memory_mb_ = 0;
    int used_npu_cores_ = 0;
    size_t used_memory_mb_ = 0;
};

} // namespace core
} // namespace rkllmjs
