#include "rkllm-manager.hpp"
#include "../config/build-config.hpp"
#include <iostream>
#include <sstream>
#include <fstream>
#include <thread>
#include <chrono>
#include <cstring>

#ifdef __linux__
#include <sys/sysinfo.h>
#endif

namespace rkllmjs {
namespace core {

// Static member definitions
RKLLMManager& RKLLMManager::getInstance() {
    static RKLLMManager instance;
    return instance;
}

RKLLMManager::~RKLLMManager() {
    if (initialized_) {
        cleanup();
    }
}

// Configuration validation
bool RKLLMModelConfig::isValid() const {
    return !model_path.empty() &&
           max_context_len > 0 && max_context_len <= 4096 &&
           max_new_tokens > 0 && max_new_tokens <= 2048 &&
           top_k > 0 && top_k <= 100 &&
           top_p > 0.0f && top_p <= 1.0f &&
           temperature > 0.0f && temperature <= 2.0f &&
           repeat_penalty >= 1.0f && repeat_penalty <= 2.0f &&
           npu_core_num > 0 && npu_core_num <= 3;
}

std::string RKLLMModelConfig::getValidationError() const {
    if (model_path.empty()) return "Model path cannot be empty";
    if (max_context_len <= 0 || max_context_len > 4096) return "max_context_len must be 1-4096";
    if (max_new_tokens <= 0 || max_new_tokens > 2048) return "max_new_tokens must be 1-2048";
    if (top_k <= 0 || top_k > 100) return "top_k must be 1-100";
    if (top_p <= 0.0f || top_p > 1.0f) return "top_p must be 0.0-1.0";
    if (temperature <= 0.0f || temperature > 2.0f) return "temperature must be 0.0-2.0";
    if (repeat_penalty < 1.0f || repeat_penalty > 2.0f) return "repeat_penalty must be 1.0-2.0";
    if (npu_core_num <= 0 || npu_core_num > 3) return "npu_core_num must be 1-3";
    return "";
}

// Lifecycle methods
ManagerResult RKLLMManager::initialize() {
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (initialized_) {
        return ManagerResult::SUCCESS;
    }
    
    // Initialize system info
#ifdef __linux__
    struct sysinfo si;
    if (sysinfo(&si) == 0) {
        total_memory_mb_ = si.totalram / (1024 * 1024);
    } else {
        total_memory_mb_ = 4096; // Default fallback
    }
#else
    total_memory_mb_ = 4096; // Default fallback for non-Linux
#endif
    
    // Initialize resource tracking
    used_npu_cores_ = 0;
    used_memory_mb_ = 0;
    updateResourceStats();
    
    initialized_ = true;
    std::cout << "[RKLLMManager] Initialized successfully" << std::endl;
    std::cout << "[RKLLMManager] Total memory: " << total_memory_mb_ << " MB" << std::endl;
    std::cout << "[RKLLMManager] NPU cores available: " << total_npu_cores_ << std::endl;
    
    return ManagerResult::SUCCESS;
}

ManagerResult RKLLMManager::cleanup() {
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (!initialized_) {
        return ManagerResult::SUCCESS;
    }
    
    // Destroy all active models
    for (auto& [handle, instance] : models_) {
        if (instance && instance->is_active) {
            std::cout << "[RKLLMManager] Cleaning up model: " << instance->model_id << std::endl;
#ifdef RKLLM_COMPILE_MODE_REAL
            rkllm_destroy(handle);
#else
            std::cout << "[RKLLMManager] Sandbox mode: simulated cleanup" << std::endl;
#endif
            instance->is_active = false;
        }
    }
    
    models_.clear();
    used_npu_cores_ = 0;
    used_memory_mb_ = 0;
    initialized_ = false;
    
    std::cout << "[RKLLMManager] Cleanup completed" << std::endl;
    return ManagerResult::SUCCESS;
}

bool RKLLMManager::isInitialized() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return initialized_;
}

// Model management
ManagerResult RKLLMManager::createModel(const RKLLMModelConfig& config, LLMHandle* handle) {
    if (!handle) {
        return ManagerResult::ERROR_INVALID_HANDLE;
    }
    
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (!initialized_) {
        return ManagerResult::ERROR_INITIALIZATION_FAILED;
    }
    
    // Validate configuration
    if (!config.isValid()) {
        std::cout << "[RKLLMManager] Invalid config: " << config.getValidationError() << std::endl;
        return ManagerResult::ERROR_INVALID_CONFIG;
    }
    
    // Check resource availability
    if (!hasAvailableResources(config)) {
        std::cout << "[RKLLMManager] Insufficient resources for model" << std::endl;
        return ManagerResult::ERROR_RESOURCE_EXHAUSTED;
    }
    
#ifdef RKLLM_COMPILE_MODE_REAL
    // Create RKLLM parameters using default
    RKLLMParam param = rkllm_createDefaultParam();
    
    // Override with our config
    param.model_path = config.model_path.c_str();
    param.max_context_len = config.max_context_len;
    param.max_new_tokens = config.max_new_tokens;
    param.top_k = config.top_k;
    param.top_p = config.top_p;
    param.temperature = config.temperature;
    param.repeat_penalty = config.repeat_penalty;
    
    // Initialize model
    int ret = rkllm_init(handle, &param, nullptr);
    if (ret != 0) {
        std::cout << "[RKLLMManager] Model initialization failed: " << ret << std::endl;
        return ManagerResult::ERROR_MODEL_LOAD_FAILED;
    }
#else
    // Sandbox mode: simulate successful initialization
    *handle = reinterpret_cast<LLMHandle>(0x12345678); // Mock handle
    std::cout << "[RKLLMManager] Sandbox mode: simulated model init" << std::endl;
#endif
    
    // Create model instance
    std::string model_id = generateModelId();
    auto instance = std::make_unique<ModelInstance>(*handle, config, model_id);
    models_[*handle] = std::move(instance);
    
    // Update resource usage
    used_npu_cores_ += config.npu_core_num;
    used_memory_mb_ += 1024; // Estimate, should be calculated based on model size
    updateResourceStats();
    
    std::cout << "[RKLLMManager] Model created: " << model_id << std::endl;
    std::cout << "[RKLLMManager] NPU cores used: " << used_npu_cores_ << "/" << total_npu_cores_ << std::endl;
    
    return ManagerResult::SUCCESS;
}

ManagerResult RKLLMManager::destroyModel(LLMHandle handle) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    auto it = models_.find(handle);
    if (it == models_.end()) {
        return ManagerResult::ERROR_INVALID_HANDLE;
    }
    
    auto& instance = it->second;
    if (!instance || !instance->is_active) {
        return ManagerResult::ERROR_INVALID_HANDLE;
    }
    
    // Destroy RKLLM handle
#ifdef RKLLM_COMPILE_MODE_REAL
    int ret = rkllm_destroy(handle);
    if (ret != 0) {
        std::cout << "[RKLLMManager] Warning: rkllmDestroy returned: " << ret << std::endl;
    }
#else
    // Sandbox mode: simulate successful destruction
    std::cout << "[RKLLMManager] Sandbox mode: simulated model destroy" << std::endl;
#endif
    
    // Update resource usage
    used_npu_cores_ -= instance->config.npu_core_num;
    used_memory_mb_ -= 1024; // Should match allocation estimate
    
    std::cout << "[RKLLMManager] Model destroyed: " << instance->model_id << std::endl;
    
    models_.erase(it);
    updateResourceStats();
    
    return ManagerResult::SUCCESS;
}

ManagerResult RKLLMManager::getModelConfig(LLMHandle handle, RKLLMModelConfig* config) {
    if (!config) {
        return ManagerResult::ERROR_INVALID_CONFIG;
    }
    
    std::lock_guard<std::mutex> lock(mutex_);
    
    auto it = models_.find(handle);
    if (it == models_.end() || !it->second->is_active) {
        return ManagerResult::ERROR_INVALID_HANDLE;
    }
    
    *config = it->second->config;
    return ManagerResult::SUCCESS;
}

// Resource monitoring
ResourceStats RKLLMManager::getResourceStats() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return resource_stats_;
}

bool RKLLMManager::hasAvailableResources(const RKLLMModelConfig& config) const {
    // Check NPU cores
    if (used_npu_cores_ + config.npu_core_num > total_npu_cores_) {
        return false;
    }
    
    // Estimate memory requirement (rough calculation)
    size_t estimated_memory = 1024; // MB, should be based on actual model size
    if (used_memory_mb_ + estimated_memory > total_memory_mb_ * 0.8) { // 80% limit
        return false;
    }
    
    return true;
}

// Static methods
ManagerResult RKLLMManager::validateConfig(const RKLLMModelConfig& config) {
    if (!config.isValid()) {
        return ManagerResult::ERROR_INVALID_CONFIG;
    }
    return ManagerResult::SUCCESS;
}

RKLLMModelConfig RKLLMManager::getDefaultConfig() {
    RKLLMModelConfig config;
    config.model_path = "../../../models/default.rkllm";
    config.max_context_len = 512;
    config.max_new_tokens = 128;
    config.top_k = 1;
    config.top_p = 0.9f;
    config.temperature = 0.8f;
    config.repeat_penalty = 1.1f;
    config.npu_core_num = 3;
    config.use_gpu = false;
    return config;
}

RKLLMModelConfig RKLLMManager::createDefaultConfig() {
    return getDefaultConfig();  // Delegate to existing method
}

RKLLMModelConfig RKLLMManager::getOptimizedConfig(const std::string& model_path) {
    auto config = createDefaultConfig();
    config.model_path = model_path;
    // Could add model-specific optimizations here
    return config;
}

ManagerResult RKLLMManager::allocateResources(const RKLLMModelConfig& config) {
    // Check if resources are available
    if (!hasAvailableResources(config)) {
        return ManagerResult::ERROR_RESOURCE_EXHAUSTED;
    }
    
    // Reserve resources
    used_npu_cores_ += config.npu_core_num;
    used_memory_mb_ += 1024; // Estimate
    
    return ManagerResult::SUCCESS;
}

void RKLLMManager::deallocateResources(const std::string& model_id) {
    // Find model by ID and deallocate resources
    for (const auto& [handle, instance] : models_) {
        if (instance && instance->model_id == model_id) {
            used_npu_cores_ -= instance->config.npu_core_num;
            used_memory_mb_ -= 1024; // Should match allocation
            break;
        }
    }
}

std::string RKLLMManager::getErrorMessage(ManagerResult result) {
    switch (result) {
        case ManagerResult::SUCCESS:
            return "Success";
        case ManagerResult::ERROR_INVALID_CONFIG:
            return "Invalid configuration";
        case ManagerResult::ERROR_MODEL_LOAD_FAILED:
            return "Model load failed";
        case ManagerResult::ERROR_RESOURCE_EXHAUSTED:
            return "Insufficient resources";
        case ManagerResult::ERROR_INVALID_HANDLE:
            return "Invalid model handle";
        case ManagerResult::ERROR_INITIALIZATION_FAILED:
            return "Manager not initialized";
        default:
            return "Unknown error";
    }
}

// Utility methods
std::vector<std::string> RKLLMManager::getActiveModelIds() const {
    std::lock_guard<std::mutex> lock(mutex_);
    
    std::vector<std::string> ids;
    for (const auto& [handle, instance] : models_) {
        if (instance && instance->is_active) {
            ids.push_back(instance->model_id);
        }
    }
    return ids;
}

size_t RKLLMManager::getActiveModelCount() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return models_.size();
}

// Private methods
std::string RKLLMManager::generateModelId() {
    return "model_" + std::to_string(next_model_id_++);
}

void RKLLMManager::updateResourceStats() {
    resource_stats_.npu_utilization = total_npu_cores_ > 0 ? 
        (static_cast<float>(used_npu_cores_) / total_npu_cores_) * 100.0f : 0.0f;
    resource_stats_.memory_usage_mb = used_memory_mb_;
    resource_stats_.total_memory_mb = total_memory_mb_;
    resource_stats_.active_models = static_cast<int>(models_.size());
    resource_stats_.npu_cores_used = used_npu_cores_;
}

} // namespace core
} // namespace rkllmjs
