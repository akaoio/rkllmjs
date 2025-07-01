/**
 * @module config
 * @purpose Configuration management and validation for RKLLM components
 * @description Provides comprehensive configuration loading, validation, and management
 *              for RKLLM runtime settings. Handles JSON parsing, environment variables,
 *              and configuration schema validation with runtime safety checks.
 * @author RKLLMJS Team
 * @version 1.0.0
 */

#pragma once

#include <string>
#include <map>
#include <vector>

namespace rkllmjs {
namespace config {

/**
 * @brief Simple JSON-like config parser for C++
 * 
 * Lightweight config reader that can parse the runtime.json config
 * without requiring heavy JSON libraries. Compatible with both C++ and Node.js.
 */

struct ModelConfig {
    std::string id;
    std::string name;
    std::string path;              // Relative path from project root
    int size_mb = 0;
    int min_memory_mb = 0;
    int min_npu_cores = 0;
    bool multimodal = false;
    
    // RKLLM parameters
    int max_context_len = 2048;
    int max_new_tokens = 512;
    int top_k = 40;
    float top_p = 0.9f;
    float temperature = 0.7f;
    float repeat_penalty = 1.1f;
    
    bool isValid() const;
    std::string toString() const;
};

struct HardwareProfile {
    std::string name;
    int npu_cores = 0;
    int max_memory_mb = 0;
    std::vector<std::string> preferred_models;
    
    bool canRunModel(const ModelConfig& model) const;
};

/**
 * @brief Runtime configuration manager
 * 
 * Loads and manages configuration from configs/runtime.json
 * Provides methods to select appropriate models based on hardware
 */
class ConfigManager {
public:
    // Load config from file (relative path)
    static bool loadConfig(const std::string& config_file = "configs/runtime.json");
    
    // Get model configuration by ID
    static ModelConfig getModel(const std::string& model_id);
    
    // Get hardware profile
    static HardwareProfile getHardwareProfile(const std::string& profile_name = "auto");
    
    // Auto-select best model for current hardware
    static std::string selectBestModel(const std::string& hardware_profile = "auto");
    
    // Get all available models
    static std::vector<std::string> getAvailableModels();
    
    // Resolve relative path to absolute
    static std::string resolvePath(const std::string& relative_path);
    
    // Check if model file exists
    static bool modelExists(const std::string& model_id);
    
    // Get project root directory
    static std::string getProjectRoot();
    
private:
    static std::map<std::string, ModelConfig> models_;
    static std::map<std::string, HardwareProfile> hardware_profiles_;
    static std::string project_root_;
    static bool initialized_;
    
    // Simple JSON parsing helpers
    static std::string extractJsonValue(const std::string& json, const std::string& key);
    static std::map<std::string, std::string> parseJsonObject(const std::string& json_object);
    static void parseModelsFromJson(const std::string& json_content);
    static void parseHardwareProfilesFromJson(const std::string& json_content);
};

} // namespace config
} // namespace rkllmjs
