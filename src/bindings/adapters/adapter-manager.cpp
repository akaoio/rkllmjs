#include "adapter-manager.hpp"
#include "../config/build-config.hpp"
#include <iostream>
#include <sstream>
#include <algorithm>
#include <regex>
#include <mutex>

namespace rkllmjs {
namespace adapters {

// Remove all static member definitions - using local static pattern instead

// ============================================================================
// TextAdapter Implementation
// ============================================================================

TextAdapter::TextAdapter() : initialized_(false), encoding_("UTF-8") {}

TextAdapter::~TextAdapter() {
    cleanup();
}

AdapterResult TextAdapter::initialize() {
    if (initialized_) {
        return AdapterResult::SUCCESS;
    }
    
    // Initialize text processing
    encoding_ = "UTF-8";
    initialized_ = true;
    
    std::cout << "[TextAdapter] Initialized successfully" << std::endl;
    return AdapterResult::SUCCESS;
}

void TextAdapter::cleanup() {
    if (initialized_) {
        initialized_ = false;
        std::cout << "[TextAdapter] Cleanup completed" << std::endl;
    }
}

AdapterResult TextAdapter::convertInput(const std::string& input, std::string& output) {
    if (!initialized_) {
        return AdapterResult::ERROR_INITIALIZATION_FAILED;
    }
    
    // Basic text processing
    output = input;
    
    // Normalize whitespace
    std::regex whitespace_regex("\\s+");
    output = std::regex_replace(output, whitespace_regex, " ");
    
    // Trim leading/trailing whitespace
    output.erase(0, output.find_first_not_of(" \\t\\n\\r"));
    output.erase(output.find_last_not_of(" \\t\\n\\r") + 1);
    
    return AdapterResult::SUCCESS;
}

AdapterResult TextAdapter::convertOutput(const std::string& input, std::string& output) {
    if (!initialized_) {
        return AdapterResult::ERROR_INITIALIZATION_FAILED;
    }
    
    // Output processing - just pass through for now
    output = input;
    return AdapterResult::SUCCESS;
}

AdapterResult TextAdapter::validate(const std::string& data) {
    if (data.empty()) {
        return AdapterResult::ERROR_INVALID_CONFIG;
    }
    
    // Check for valid UTF-8 (simplified check)
    for (char c : data) {
        if (static_cast<unsigned char>(c) > 127) {
            // Extended ASCII - would need proper UTF-8 validation
            continue;
        }
    }
    
    return AdapterResult::SUCCESS;
}

AdapterResult TextAdapter::setEncoding(const std::string& encoding) {
    if (encoding.empty()) {
        return AdapterResult::ERROR_INVALID_CONFIG;
    }
    
    encoding_ = encoding;
    return AdapterResult::SUCCESS;
}

AdapterResult TextAdapter::normalize(std::string& text) {
    // Convert to lowercase
    std::transform(text.begin(), text.end(), text.begin(), ::tolower);
    
    // Remove extra whitespace
    std::regex whitespace_regex("\\s+");
    text = std::regex_replace(text, whitespace_regex, " ");
    
    return AdapterResult::SUCCESS;
}

AdapterResult TextAdapter::sanitize(std::string& text) {
    // Remove potentially dangerous characters
    std::regex dangerous_regex("[<>\"'&]");
    text = std::regex_replace(text, dangerous_regex, "");
    
    return AdapterResult::SUCCESS;
}

// ============================================================================
// JsonAdapter Implementation
// ============================================================================

JsonAdapter::JsonAdapter() : initialized_(false), pretty_print_(false) {}

JsonAdapter::~JsonAdapter() {
    cleanup();
}

AdapterResult JsonAdapter::initialize() {
    if (initialized_) {
        return AdapterResult::SUCCESS;
    }
    
    initialized_ = true;
    std::cout << "[JsonAdapter] Initialized successfully" << std::endl;
    return AdapterResult::SUCCESS;
}

void JsonAdapter::cleanup() {
    if (initialized_) {
        initialized_ = false;
        std::cout << "[JsonAdapter] Cleanup completed" << std::endl;
    }
}

AdapterResult JsonAdapter::convertInput(const std::string& input, std::string& output) {
    if (!initialized_) {
        return AdapterResult::ERROR_INITIALIZATION_FAILED;
    }
    
    // Simple JSON parsing - extract text content
    if (input.find("{") != std::string::npos && input.find("}") != std::string::npos) {
        // Look for "text" or "content" field
        std::regex text_regex("\"(?:text|content|prompt)\"\\s*:\\s*\"([^\"]+)\"");
        std::smatch match;
        
        if (std::regex_search(input, match, text_regex)) {
            output = match[1].str();
            return AdapterResult::SUCCESS;
        }
    }
    
    // If not JSON, treat as plain text
    output = input;
    return AdapterResult::SUCCESS;
}

AdapterResult JsonAdapter::convertOutput(const std::string& input, std::string& output) {
    if (!initialized_) {
        return AdapterResult::ERROR_INITIALIZATION_FAILED;
    }
    
    // Wrap text in JSON format
    std::ostringstream json;
    
    if (pretty_print_) {
        json << "{\n  \"result\": \"" << input << "\",\n  \"status\": \"success\"\n}";
    } else {
        json << "{\"result\":\"" << input << "\",\"status\":\"success\"}";
    }
    
    output = json.str();
    return AdapterResult::SUCCESS;
}

AdapterResult JsonAdapter::validate(const std::string& data) {
    if (data.empty()) {
        return AdapterResult::ERROR_INVALID_CONFIG;
    }
    
    // Simple JSON validation
    if (data.find("{") == std::string::npos || data.find("}") == std::string::npos) {
        return AdapterResult::ERROR_CONVERSION_FAILED;
    }
    
    // Count braces
    int brace_count = 0;
    bool in_string = false;
    bool escape_next = false;
    
    for (size_t i = 0; i < data.length(); i++) {
        char c = data[i];
        
        if (escape_next) {
            escape_next = false;
            continue;
        }
        
        if (c == '\\') {
            escape_next = true;
            continue;
        }
        
        if (c == '"') {
            in_string = !in_string;
            continue;
        }
        
        if (!in_string) {
            if (c == '{') brace_count++;
            else if (c == '}') brace_count--;
            
            // Check for unquoted values (simple check)
            if (c == ':') {
                // Look ahead for the value after colon
                size_t j = i + 1;
                while (j < data.length() && (data[j] == ' ' || data[j] == '\t')) j++;
                if (j < data.length() && data[j] != '"' && data[j] != '{' && 
                    data[j] != '[' && !std::isdigit(data[j]) && 
                    data.substr(j, 4) != "true" && data.substr(j, 5) != "false" && 
                    data.substr(j, 4) != "null") {
                    return AdapterResult::ERROR_CONVERSION_FAILED;
                }
            }
        }
    }
    
    if (brace_count != 0) {
        return AdapterResult::ERROR_CONVERSION_FAILED;
    }
    
    return AdapterResult::SUCCESS;
}

AdapterResult JsonAdapter::parseJson(const std::string& json, std::string& result) {
    // Simple JSON parsing
    std::regex value_regex("\"([^\"]+)\"");
    std::smatch match;
    
    if (std::regex_search(json, match, value_regex)) {
        result = match[1].str();
        return AdapterResult::SUCCESS;
    }
    
    return AdapterResult::ERROR_CONVERSION_FAILED;
}

AdapterResult JsonAdapter::createJson(const std::string& data, std::string& json) {
    std::ostringstream output;
    
    if (pretty_print_) {
        output << "{\n  \"data\": \"" << data << "\"\n}";
    } else {
        output << "{\"data\":\"" << data << "\"}";
    }
    
    json = output.str();
    return AdapterResult::SUCCESS;
}

// ============================================================================
// RKLLMAdapter Implementation
// ============================================================================

RKLLMAdapter::RKLLMAdapter() : initialized_(false) {}

RKLLMAdapter::~RKLLMAdapter() {
    cleanup();
}

AdapterResult RKLLMAdapter::initialize() {
    if (initialized_) {
        return AdapterResult::SUCCESS;
    }
    
    try {
#if RKLLMJS_MODE_REAL
        // Get RKLLM manager instance
        auto& manager_ref = rkllmjs::core::RKLLMManager::getInstance();
        manager_ = std::shared_ptr<rkllmjs::core::RKLLMManager>(&manager_ref, [](rkllmjs::core::RKLLMManager*){});
        
        // Initialize if needed
        auto result = manager_->initialize();
        if (result != rkllmjs::core::ManagerResult::SUCCESS) {
            return AdapterResult::ERROR_INITIALIZATION_FAILED;
        }
        
        // Create inference engine
        engine_ = std::make_shared<rkllmjs::inference::InferenceEngine>(manager_);
#else
        // SANDBOX mode: simulate initialization
        manager_ = nullptr;
        engine_ = nullptr;
        std::cout << "[RKLLMAdapter] SANDBOX mode: simulated initialization" << std::endl;
#endif
        
        initialized_ = true;
        std::cout << "[RKLLMAdapter] Initialized successfully" << std::endl;
        return AdapterResult::SUCCESS;
        
    } catch (const std::exception& e) {
        std::cerr << "[RKLLMAdapter] Initialization failed: " << e.what() << std::endl;
        return AdapterResult::ERROR_INITIALIZATION_FAILED;
    }
}

void RKLLMAdapter::cleanup() {
    if (initialized_) {
#if RKLLMJS_MODE_REAL
        engine_.reset();
        manager_.reset();
#else
        // SANDBOX mode: cleanup simulation
        manager_ = nullptr;
        engine_ = nullptr;
        std::cout << "[RKLLMAdapter] SANDBOX mode: simulated cleanup" << std::endl;
#endif
        initialized_ = false;
        std::cout << "[RKLLMAdapter] Cleanup completed" << std::endl;
    }
}

AdapterResult RKLLMAdapter::convertInput(const std::string& input, std::string& output) {
    if (!initialized_) {
        return AdapterResult::ERROR_INITIALIZATION_FAILED;
    }
    
    return preparePrompt(input, output);
}

AdapterResult RKLLMAdapter::convertOutput(const std::string& input, std::string& output) {
    if (!initialized_) {
        return AdapterResult::ERROR_INITIALIZATION_FAILED;
    }
    
    return processResponse(input, output);
}

AdapterResult RKLLMAdapter::validate(const std::string& data) {
    if (data.empty()) {
        return AdapterResult::ERROR_INVALID_CONFIG;
    }
    
    // Check for reasonable length
    if (data.length() > 4096) {
        return AdapterResult::ERROR_UNSUPPORTED_FORMAT;
    }
    
    return AdapterResult::SUCCESS;
}

AdapterResult RKLLMAdapter::preparePrompt(const std::string& user_input, std::string& rkllm_prompt) {
    // Format input for RKLLM
    std::ostringstream prompt;
    
    // Add system context if needed
    prompt << "Human: " << user_input << "\n";
    prompt << "Assistant: ";
    
    rkllm_prompt = prompt.str();
    return AdapterResult::SUCCESS;
}

AdapterResult RKLLMAdapter::processResponse(const std::string& rkllm_output, std::string& user_response) {
    // Clean up RKLLM output for user consumption
    user_response = rkllm_output;
    
    // Remove any system tokens or formatting
    std::regex cleanup_regex("\\[INST\\]|\\[/INST\\]|<s>|</s>");
    user_response = std::regex_replace(user_response, cleanup_regex, "");
    
    // Trim whitespace
    user_response.erase(0, user_response.find_first_not_of(" \\t\\n\\r"));
    user_response.erase(user_response.find_last_not_of(" \\t\\n\\r") + 1);
    
    return AdapterResult::SUCCESS;
}

AdapterResult RKLLMAdapter::optimizeInput(std::string& input) {
    // Optimize input for better RKLLM performance
    
    // Limit length
    if (input.length() > 2048) {
        input = input.substr(0, 2048);
    }
    
    // Remove excessive whitespace
    std::regex whitespace_regex("\\s+");
    input = std::regex_replace(input, whitespace_regex, " ");
    
    return AdapterResult::SUCCESS;
}

// ============================================================================
// AdapterFactory Implementation
// ============================================================================

AdapterFactory::AdapterFactory() {
    std::cout << "[AdapterFactory] Constructor starting..." << std::endl;
    
    // Register default adapters
    std::cout << "[AdapterFactory] Registering text adapter..." << std::endl;
    registerAdapter("text", []() { return std::make_unique<TextAdapter>(); });
    
    std::cout << "[AdapterFactory] Registering json adapter..." << std::endl;
    registerAdapter("json", []() { return std::make_unique<JsonAdapter>(); });
    
#if RKLLMJS_MODE_REAL
    std::cout << "[AdapterFactory] Registering rkllm adapter..." << std::endl;
    registerAdapter("rkllm", []() { return std::make_unique<RKLLMAdapter>(); });
#endif
    
    std::cout << "[AdapterFactory] Setting up format mapping..." << std::endl;
    // Set up format mapping
    format_map_[DataFormat::RAW_TEXT] = "text";
    format_map_[DataFormat::JSON] = "json";
#if RKLLMJS_MODE_REAL
    format_map_[DataFormat::CUSTOM] = "rkllm";
#else
    format_map_[DataFormat::CUSTOM] = "text";  // Fallback to text in SANDBOX mode
#endif
    
    std::cout << "[AdapterFactory] Constructor completed successfully" << std::endl;
}

AdapterFactory& AdapterFactory::getInstance() {
    static AdapterFactory instance;  // Local static - thread-safe in C++11+
    return instance;
}

AdapterFactory::~AdapterFactory() {
    creators_.clear();
    format_map_.clear();
}

AdapterResult AdapterFactory::registerAdapter(const std::string& name, 
                                              std::function<std::unique_ptr<IAdapter>()> creator) {
    if (name.empty() || !creator) {
        return AdapterResult::ERROR_INVALID_CONFIG;
    }
    
    creators_[name] = creator;
    return AdapterResult::SUCCESS;
}

std::unique_ptr<IAdapter> AdapterFactory::createAdapter(const std::string& name) {
    auto it = creators_.find(name);
    if (it != creators_.end()) {
        return it->second();
    }
    return nullptr;
}

std::unique_ptr<IAdapter> AdapterFactory::createAdapterByFormat(DataFormat format) {
    auto it = format_map_.find(format);
    if (it != format_map_.end()) {
        return createAdapter(it->second);
    }
    return nullptr;
}

std::vector<std::string> AdapterFactory::getAvailableAdapters() const {
    std::vector<std::string> adapters;
    for (const auto& [name, creator] : creators_) {
        adapters.push_back(name);
    }
    return adapters;
}

bool AdapterFactory::isAdapterAvailable(const std::string& name) const {
    return creators_.find(name) != creators_.end();
}

AdapterResult AdapterFactory::getAdapterInfo(const std::string& name, std::string& info) const {
    if (!isAdapterAvailable(name)) {
        return AdapterResult::ERROR_ADAPTER_NOT_FOUND;
    }
    
    info = "Adapter: " + name + " (Available)";
    return AdapterResult::SUCCESS;
}

std::string AdapterFactory::getErrorMessage(AdapterResult result) {
    switch (result) {
        case AdapterResult::SUCCESS:
            return "Success";
        case AdapterResult::ERROR_INVALID_CONFIG:
            return "Invalid configuration";
        case AdapterResult::ERROR_ADAPTER_NOT_FOUND:
            return "Adapter not found";
        case AdapterResult::ERROR_CONVERSION_FAILED:
            return "Conversion failed";
        case AdapterResult::ERROR_UNSUPPORTED_FORMAT:
            return "Unsupported format";
        case AdapterResult::ERROR_INITIALIZATION_FAILED:
            return "Initialization failed";
        default:
            return "Unknown error";
    }
}

std::string AdapterFactory::formatToString(DataFormat format) {
    switch (format) {
        case DataFormat::RAW_TEXT: return "text";
        case DataFormat::JSON: return "json";
        case DataFormat::MARKDOWN: return "markdown";
        case DataFormat::XML: return "xml";
        case DataFormat::BINARY: return "binary";
        case DataFormat::CUSTOM: return "custom";
        default: return "unknown";
    }
}

DataFormat AdapterFactory::stringToFormat(const std::string& format_str) {
    if (format_str == "text") return DataFormat::RAW_TEXT;
    if (format_str == "json") return DataFormat::JSON;
    if (format_str == "markdown") return DataFormat::MARKDOWN;
    if (format_str == "xml") return DataFormat::XML;
    if (format_str == "binary") return DataFormat::BINARY;
    if (format_str == "custom") return DataFormat::CUSTOM;
    return DataFormat::RAW_TEXT; // Default
}

// ============================================================================
// AdapterManager Implementation
// ============================================================================

AdapterManager::AdapterManager() : initialized_(false) {}

AdapterManager& AdapterManager::getInstance() {
    static AdapterManager instance;  // Local static - thread-safe in C++11+
    return instance;
}

AdapterManager::~AdapterManager() {
    cleanup();
}

AdapterResult AdapterManager::initialize() {
    std::cout << "[AdapterManager] initialize() called" << std::endl;
    
    std::cout << "[AdapterManager] Acquiring mutex lock..." << std::endl;
    std::lock_guard<std::mutex> lock(mutex_);
    std::cout << "[AdapterManager] Mutex locked successfully" << std::endl;
    
    if (initialized_) {
        std::cout << "[AdapterManager] Already initialized, returning SUCCESS" << std::endl;
        return AdapterResult::SUCCESS;
    }
    
    std::cout << "[AdapterManager] Loading default adapters..." << std::endl;
    // Load default adapters
    auto result = loadDefaultAdapters();
    std::cout << "[AdapterManager] loadDefaultAdapters() returned: " << static_cast<int>(result) << std::endl;
    if (result != AdapterResult::SUCCESS) {
        return result;
    }
    
    initialized_ = true;
    std::cout << "[AdapterManager] Initialized successfully" << std::endl;
    return AdapterResult::SUCCESS;
}

void AdapterManager::cleanup() {
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (!initialized_) {
        return;
    }
    
    // Cleanup all adapters
    for (auto& [name, adapter] : adapters_) {
        if (adapter) {
            adapter->cleanup();
        }
    }
    adapters_.clear();
    
    initialized_ = false;
    std::cout << "[AdapterManager] Cleanup completed" << std::endl;
}

AdapterResult AdapterManager::loadAdapter(const std::string& name) {
    std::lock_guard<std::mutex> lock(mutex_);
    return loadAdapterInternal(name);
}

AdapterResult AdapterManager::loadAdapterInternal(const std::string& name) {
    // Note: This method expects mutex_ to be already locked by caller
    
    auto& factory = AdapterFactory::getInstance();
    auto adapter = factory.createAdapter(name);
    
    if (!adapter) {
        return AdapterResult::ERROR_ADAPTER_NOT_FOUND;
    }
    
    auto result = adapter->initialize();
    if (result != AdapterResult::SUCCESS) {
        return result;
    }
    
    adapters_[name] = std::move(adapter);
    std::cout << "[AdapterManager] Loaded adapter: " << name << std::endl;
    return AdapterResult::SUCCESS;
}

AdapterResult AdapterManager::unloadAdapter(const std::string& name) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    auto it = adapters_.find(name);
    if (it == adapters_.end()) {
        return AdapterResult::ERROR_ADAPTER_NOT_FOUND;
    }
    
    it->second->cleanup();
    adapters_.erase(it);
    
    std::cout << "[AdapterManager] Unloaded adapter: " << name << std::endl;
    return AdapterResult::SUCCESS;
}

IAdapter* AdapterManager::getAdapter(const std::string& name) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    auto it = adapters_.find(name);
    return (it != adapters_.end()) ? it->second.get() : nullptr;
}

AdapterResult AdapterManager::loadDefaultAdapters() {
#if RKLLMJS_MODE_REAL
    std::vector<std::string> default_adapters = {"text", "json", "rkllm"};
#else
    std::vector<std::string> default_adapters = {"text", "json"};  // No RKLLM in SANDBOX mode
#endif
    
    for (const auto& name : default_adapters) {
        auto result = loadAdapterInternal(name);  // Use internal method (no double lock)
        if (result != AdapterResult::SUCCESS) {
            std::cerr << "[AdapterManager] Failed to load adapter: " << name << std::endl;
            return result;
        }
    }
    
    return AdapterResult::SUCCESS;
}

AdapterResult AdapterManager::convertData(const std::string& from_format, 
                                          const std::string& to_format,
                                          const std::string& input, 
                                          std::string& output) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (!initialized_) {
        return AdapterResult::ERROR_INITIALIZATION_FAILED;
    }
    
    // Get adapters
    auto from_adapter = getAdapter(from_format);
    auto to_adapter = getAdapter(to_format);
    
    if (!from_adapter || !to_adapter) {
        return AdapterResult::ERROR_ADAPTER_NOT_FOUND;
    }
    
    // Convert through intermediate format
    std::string intermediate;
    auto result = from_adapter->convertInput(input, intermediate);
    if (result != AdapterResult::SUCCESS) {
        return result;
    }
    
    return to_adapter->convertOutput(intermediate, output);
}

std::vector<std::string> AdapterManager::getLoadedAdapters() const {
    std::lock_guard<std::mutex> lock(mutex_);
    
    std::vector<std::string> loaded;
    for (const auto& [name, adapter] : adapters_) {
        loaded.push_back(name);
    }
    return loaded;
}

AdapterResult AdapterManager::validateData(const std::string& format, const std::string& data) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    auto adapter = getAdapter(format);
    if (!adapter) {
        return AdapterResult::ERROR_ADAPTER_NOT_FOUND;
    }
    
    return adapter->validate(data);
}

AdapterResult AdapterManager::chainAdapters(const std::vector<std::string>& adapter_names,
                                            const std::string& input,
                                            std::string& output) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (adapter_names.empty()) {
        output = input;
        return AdapterResult::SUCCESS;
    }
    
    std::string current_data = input;
    std::string next_data;
    
    for (const auto& name : adapter_names) {
        auto adapter = getAdapter(name);
        if (!adapter) {
            return AdapterResult::ERROR_ADAPTER_NOT_FOUND;
        }
        
        auto result = adapter->convertInput(current_data, next_data);
        if (result != AdapterResult::SUCCESS) {
            return result;
        }
        
        current_data = next_data;
    }
    
    output = current_data;
    return AdapterResult::SUCCESS;
}

// ============================================================================
// AdapterPipeline Implementation
// ============================================================================

AdapterPipeline::AdapterPipeline(const std::string& name) : name_(name), initialized_(false) {}

AdapterPipeline::~AdapterPipeline() {
    clearPipeline();
}

AdapterResult AdapterPipeline::addAdapter(const std::string& name, std::unique_ptr<IAdapter> adapter) {
    if (!adapter) {
        return AdapterResult::ERROR_INVALID_CONFIG;
    }
    
    auto result = adapter->initialize();
    if (result != AdapterResult::SUCCESS) {
        return result;
    }
    
    pipeline_.emplace_back(name, std::move(adapter));
    return AdapterResult::SUCCESS;
}

AdapterResult AdapterPipeline::removeAdapter(const std::string& name) {
    auto it = std::find_if(pipeline_.begin(), pipeline_.end(),
                          [&name](const auto& pair) { return pair.first == name; });
    
    if (it != pipeline_.end()) {
        it->second->cleanup();
        pipeline_.erase(it);
        return AdapterResult::SUCCESS;
    }
    
    return AdapterResult::ERROR_ADAPTER_NOT_FOUND;
}

AdapterResult AdapterPipeline::clearPipeline() {
    for (auto& [name, adapter] : pipeline_) {
        if (adapter) {
            adapter->cleanup();
        }
    }
    pipeline_.clear();
    return AdapterResult::SUCCESS;
}

AdapterResult AdapterPipeline::execute(const std::string& input, std::string& output) {
    if (pipeline_.empty()) {
        output = input;
        return AdapterResult::SUCCESS;
    }
    
    std::string current_data = input;
    std::string next_data;
    
    for (auto& [name, adapter] : pipeline_) {
        auto result = adapter->convertInput(current_data, next_data);
        if (result != AdapterResult::SUCCESS) {
            return result;
        }
        current_data = next_data;
    }
    
    output = current_data;
    return AdapterResult::SUCCESS;
}

AdapterResult AdapterPipeline::validate() {
    for (auto& [name, adapter] : pipeline_) {
        if (!adapter || !adapter->isInitialized()) {
            return AdapterResult::ERROR_INITIALIZATION_FAILED;
        }
    }
    return AdapterResult::SUCCESS;
}

std::vector<std::string> AdapterPipeline::getAdapterNames() const {
    std::vector<std::string> names;
    for (const auto& [name, adapter] : pipeline_) {
        names.push_back(name);
    }
    return names;
}

} // namespace adapters
} // namespace rkllmjs
