/**
 * @module core
 * @purpose Core RKLLM runtime management and model lifecycle operations
 * @description Provides thread-safe singleton that manages RKLLM model instances,
 *              resource allocation, configuration validation, and cleanup operations.
 *              This module handles the fundamental infrastructure needed for RKLLM
 *              model management including NPU resource allocation and monitoring.
 * @author RKLLMJS Team
 * @version 1.0.0
 */

#pragma once

#include "../config/build-config.hpp"
#include <memory>
#include <string>
#include <unordered_map>
#include <mutex>
#include <vector>

// Conditional RKLLM include and type definitions
#if 1 // Simplified - always use sandbox-like logic
    // Sandbox mode: no RKLLM headers, use void* for handle
    namespace rkllmjs {
    namespace core {
        using LLMHandle = void*;
    }
    }
#else
    // Full mode: include RKLLM headers and use real handle type
    #include "../../../libs/rkllm/include/rkllm.h"
    namespace rkllmjs {
    namespace core {
    #ifdef __cplusplus
        // If RKLLMHandle is not defined in rkllm.h, define it as void*
        #ifndef RKLLMHandle
        using RKLLMHandle = void*;
        #endif
    #endif
        using LLMHandle = RKLLMHandle;
    }
    }
#endif

// Continue namespace for the rest of the definitions
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
    
    /**
     * @brief Initialize the RKLLM runtime and allocate system resources
     * @return ManagerResult::SUCCESS on success, error code on failure
     * @note Must be called before any model operations. Thread-safe.
     */
    ManagerResult initialize();
    
    /**
     * @brief Cleanup all models and release system resources
     * @return ManagerResult::SUCCESS on success, error code on failure
     * @note Destroys all active models and releases NPU resources. Thread-safe.
     */
    ManagerResult cleanup();
    
    /**
     * @brief Check if the manager has been initialized
     * @return true if initialized, false otherwise
     */
    bool isInitialized() const;
    
    /**
     * @brief Create a new model instance with the given configuration
     * @param config Model configuration parameters
     * @param handle Output parameter for the created model handle
     * @return ManagerResult::SUCCESS on success, error code on failure
     * @note Validates config and allocates NPU resources. Thread-safe.
     */
    ManagerResult createModel(const RKLLMModelConfig& config, LLMHandle* handle);
    
    /**
     * @brief Destroy an existing model instance and free its resources
     * @param handle Handle to the model to destroy
     * @return ManagerResult::SUCCESS on success, error code on failure
     * @note Releases NPU cores and memory allocated to the model. Thread-safe.
     */
    ManagerResult destroyModel(LLMHandle handle);
    
    /**
     * @brief Get the configuration of an existing model
     * @param handle Handle to the model
     * @param config Output parameter for the model configuration
     * @return ManagerResult::SUCCESS on success, error code on failure
     */
    ManagerResult getModelConfig(LLMHandle handle, RKLLMModelConfig* config);
    
    /**
     * @brief Get current resource usage statistics
     * @return ResourceStats structure with current usage information
     * @note Includes NPU utilization, memory usage, and active model count
     */
    ResourceStats getResourceStats() const;
    
    /**
     * @brief Check if sufficient resources are available for a configuration
     * @param config Model configuration to check resource requirements for
     * @return true if resources are available, false otherwise
     */
    bool hasAvailableResources(const RKLLMModelConfig& config) const;
    
    // Configuration validation
    static ManagerResult validateConfig(const RKLLMModelConfig& config);
    static RKLLMModelConfig createDefaultConfig();  // Add this method
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
