#include "config-manager.hpp"
#include <fstream>
#include <sstream>
#include <iostream>
#include <algorithm>
#include <unistd.h>
#include <sys/stat.h>

namespace rkllmjs {
namespace config {

// Static members
std::map<std::string, ModelConfig> ConfigManager::models_;
std::map<std::string, HardwareProfile> ConfigManager::hardware_profiles_;
std::string ConfigManager::project_root_;
bool ConfigManager::initialized_ = false;

bool ModelConfig::isValid() const {
    return !id.empty() && !path.empty() && 
           max_context_len > 0 && max_new_tokens > 0 &&
           top_k > 0 && top_p > 0.0f && top_p <= 1.0f &&
           temperature > 0.0f && repeat_penalty > 0.0f;
}

std::string ModelConfig::toString() const {
    std::ostringstream oss;
    oss << "ModelConfig{id=" << id 
        << ", name=" << name
        << ", path=" << path
        << ", size_mb=" << size_mb
        << ", min_memory_mb=" << min_memory_mb
        << ", min_npu_cores=" << min_npu_cores
        << ", multimodal=" << (multimodal ? "true" : "false")
        << "}";
    return oss.str();
}

bool HardwareProfile::canRunModel(const ModelConfig& model) const {
    return max_memory_mb >= model.min_memory_mb && 
           npu_cores >= model.min_npu_cores;
}

std::string ConfigManager::getProjectRoot() {
    if (!project_root_.empty()) {
        return project_root_;
    }
    
    // Get current working directory and find project root
    char cwd[1024];
    if (getcwd(cwd, sizeof(cwd)) != nullptr) {
        std::string current_dir = cwd;
        
        // Look for package.json to identify project root
        while (!current_dir.empty() && current_dir != "/") {
            std::string package_json = current_dir + "/package.json";
            struct stat buffer;
            if (stat(package_json.c_str(), &buffer) == 0) {
                project_root_ = current_dir;
                return project_root_;
            }
            
            // Go up one directory
            size_t last_slash = current_dir.find_last_of('/');
            if (last_slash == std::string::npos) break;
            current_dir = current_dir.substr(0, last_slash);
        }
    }
    
    // Fallback to current directory
    project_root_ = ".";
    return project_root_;
}

std::string ConfigManager::resolvePath(const std::string& relative_path) {
    std::string root = getProjectRoot();
    if (relative_path.empty()) return root;
    if (relative_path[0] == '/') return relative_path; // Already absolute
    
    return root + "/" + relative_path;
}

bool ConfigManager::loadConfig(const std::string& config_file) {
    try {
        std::string full_path = resolvePath(config_file);
        std::ifstream file(full_path);
        if (!file.is_open()) {
            std::cerr << "[ConfigManager] Cannot open config file: " << full_path << std::endl;
            return false;
        }
        
        // Read entire file
        std::ostringstream buffer;
        buffer << file.rdbuf();
        std::string json_content = buffer.str();
        file.close();
        
        // Parse models (simplified JSON parsing)
        parseModelsFromJson(json_content);
        parseHardwareProfilesFromJson(json_content);
        
        initialized_ = true;
        std::cout << "[ConfigManager] Loaded " << models_.size() << " models and " 
                  << hardware_profiles_.size() << " hardware profiles" << std::endl;
        return true;
        
    } catch (const std::exception& e) {
        std::cerr << "[ConfigManager] Error loading config: " << e.what() << std::endl;
        return false;
    }
}

ModelConfig ConfigManager::getModel(const std::string& model_id) {
    if (!initialized_) {
        loadConfig();
    }
    
    auto it = models_.find(model_id);
    if (it != models_.end()) {
        return it->second;
    }
    
    // Return empty config if not found
    ModelConfig empty_config;
    return empty_config;
}

HardwareProfile ConfigManager::getHardwareProfile(const std::string& profile_name) {
    if (!initialized_) {
        loadConfig();
    }
    
    std::string target_profile = profile_name;
    if (target_profile == "auto") {
        // Simple auto-detection - default to low profile for safety
        target_profile = "rk3588_low";
    }
    
    auto it = hardware_profiles_.find(target_profile);
    if (it != hardware_profiles_.end()) {
        return it->second;
    }
    
    // Return default profile
    HardwareProfile default_profile;
    default_profile.name = "default";
    default_profile.npu_cores = 1;
    default_profile.max_memory_mb = 2048;
    return default_profile;
}

std::string ConfigManager::selectBestModel(const std::string& hardware_profile) {
    if (!initialized_) {
        loadConfig();
    }
    
    HardwareProfile hw_profile = getHardwareProfile(hardware_profile);
    
    // Find the largest model that can run on this hardware
    std::string best_model = "";
    int best_size = 0;
    
    for (const auto& pair : models_) {
        const ModelConfig& model = pair.second;
        if (hw_profile.canRunModel(model) && model.size_mb > best_size) {
            best_model = model.id;
            best_size = model.size_mb;
        }
    }
    
    // Fallback to smallest model if nothing fits
    if (best_model.empty() && !models_.empty()) {
        best_model = models_.begin()->first;
    }
    
    return best_model;
}

std::vector<std::string> ConfigManager::getAvailableModels() {
    if (!initialized_) {
        loadConfig();
    }
    
    std::vector<std::string> model_ids;
    for (const auto& pair : models_) {
        model_ids.push_back(pair.first);
    }
    return model_ids;
}

bool ConfigManager::modelExists(const std::string& model_id) {
    ModelConfig model = getModel(model_id);
    if (model.id.empty()) return false;
    
    std::string model_path = resolvePath(model.path);
    struct stat buffer;
    return (stat(model_path.c_str(), &buffer) == 0);
}

// Simplified JSON parsing helpers
void ConfigManager::parseModelsFromJson(const std::string& json_content) {
    // This is a simplified parser - in production you'd use a real JSON library
    // For now, we'll create some default models
    (void)json_content; // Suppress unused parameter warning
    
    ModelConfig qwen_0_5b;
    qwen_0_5b.id = "qwen_0.5b";
    qwen_0_5b.name = "Qwen 2.5 0.5B Instruct";
    qwen_0_5b.path = "models/qwen/Qwen2.5-0.5B-Instruct-rk3588-w8a8-opt-0-hybrid-ratio-0.0.rkllm";
    qwen_0_5b.size_mb = 512;
    qwen_0_5b.min_memory_mb = 1024;
    qwen_0_5b.min_npu_cores = 1;
    qwen_0_5b.max_context_len = 2048;
    qwen_0_5b.max_new_tokens = 512;
    qwen_0_5b.top_k = 40;
    qwen_0_5b.top_p = 0.9f;
    qwen_0_5b.temperature = 0.7f;
    qwen_0_5b.repeat_penalty = 1.1f;
    models_[qwen_0_5b.id] = qwen_0_5b;
    
    ModelConfig tinyllama;
    tinyllama.id = "tinyllama";
    tinyllama.name = "TinyLlama 1.1B Chat";
    tinyllama.path = "models/tinyllama/TinyLlama-1.1B-Chat-v1.0-rk3588-w8a8-opt-0-hybrid-ratio-0.5.rkllm";
    tinyllama.size_mb = 1100;
    tinyllama.min_memory_mb = 2048;
    tinyllama.min_npu_cores = 1;
    tinyllama.max_context_len = 2048;
    tinyllama.max_new_tokens = 512;
    tinyllama.top_k = 40;
    tinyllama.top_p = 0.9f;
    tinyllama.temperature = 0.8f;
    tinyllama.repeat_penalty = 1.05f;
    models_[tinyllama.id] = tinyllama;
}

void ConfigManager::parseHardwareProfilesFromJson(const std::string& json_content) {
    (void)json_content; // Suppress unused parameter warning
    
    HardwareProfile high_profile;
    high_profile.name = "rk3588_high";
    high_profile.npu_cores = 3;
    high_profile.max_memory_mb = 8192;
    high_profile.preferred_models = {"qwen_7b", "qwen_vl_7b"};
    hardware_profiles_[high_profile.name] = high_profile;
    
    HardwareProfile low_profile;
    low_profile.name = "rk3588_low";
    low_profile.npu_cores = 2;
    low_profile.max_memory_mb = 4096;
    low_profile.preferred_models = {"qwen_0.5b", "tinyllama"};
    hardware_profiles_[low_profile.name] = low_profile;
}

} // namespace config
} // namespace rkllmjs
