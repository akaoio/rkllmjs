/**
 * @module adapters
 * @purpose Platform-specific runtime adapters for RKLLM integration
 * @description Implements platform abstraction layer with adapters for different
 *              JavaScript runtimes (Node.js, Deno, Bun). Provides unified interface
 *              for cross-platform RKLLM deployment and runtime-specific optimizations.
 * @author RKLLMJS Team
 * @version 1.0.0
 */

#pragma once

#include "../config/build-config.hpp"
#include <memory>
#include <string>
#include <vector>
#include <functional>
#include <unordered_map>
#include <mutex>
#include <ostream>

#if 0 // Removed RKLLM_COMPILE_MODE_REAL
    #include "../core/rkllm-manager.hpp"
    #include "../inference/inference-engine.hpp"
#endif

namespace rkllmjs {
namespace adapters {

/**
 * Adapter result codes
 */
enum class AdapterResult {
    SUCCESS = 0,
    ERROR_INVALID_CONFIG,
    ERROR_ADAPTER_NOT_FOUND,
    ERROR_CONVERSION_FAILED,
    ERROR_UNSUPPORTED_FORMAT,
    ERROR_INITIALIZATION_FAILED
};

/**
 * Stream operator for AdapterResult (for testing)
 */
inline std::ostream& operator<<(std::ostream& os, const AdapterResult& result) {
    switch (result) {
        case AdapterResult::SUCCESS: return os << "SUCCESS";
        case AdapterResult::ERROR_INVALID_CONFIG: return os << "ERROR_INVALID_CONFIG";
        case AdapterResult::ERROR_ADAPTER_NOT_FOUND: return os << "ERROR_ADAPTER_NOT_FOUND";
        case AdapterResult::ERROR_CONVERSION_FAILED: return os << "ERROR_CONVERSION_FAILED";
        case AdapterResult::ERROR_UNSUPPORTED_FORMAT: return os << "ERROR_UNSUPPORTED_FORMAT";
        case AdapterResult::ERROR_INITIALIZATION_FAILED: return os << "ERROR_INITIALIZATION_FAILED";
        default: return os << "UNKNOWN";
    }
}

/**
 * Data format types supported by adapters
 */
enum class DataFormat {
    RAW_TEXT,
    JSON,
    MARKDOWN,
    XML,
    BINARY,
    CUSTOM
};

/**
 * Base adapter interface
 */
class IAdapter {
public:
    virtual ~IAdapter() = default;
    
    virtual std::string getName() const = 0;
    virtual std::string getVersion() const = 0;
    virtual DataFormat getSupportedFormat() const = 0;
    
    virtual AdapterResult initialize() = 0;
    virtual void cleanup() = 0;
    virtual bool isInitialized() const = 0;
    
    // Core adaptation methods
    virtual AdapterResult convertInput(const std::string& input, std::string& output) = 0;
    virtual AdapterResult convertOutput(const std::string& input, std::string& output) = 0;
    virtual AdapterResult validate(const std::string& data) = 0;
};

/**
 * Text Adapter - Handles plain text conversions
 */
class TextAdapter : public IAdapter {
private:
    bool initialized_;
    std::string encoding_;
    
public:
    TextAdapter();
    ~TextAdapter() override;
    
    // IAdapter interface
    std::string getName() const override { return "TextAdapter"; }
    std::string getVersion() const override { return "1.0.0"; }
    DataFormat getSupportedFormat() const override { return DataFormat::RAW_TEXT; }
    
    AdapterResult initialize() override;
    void cleanup() override;
    bool isInitialized() const override { return initialized_; }
    
    AdapterResult convertInput(const std::string& input, std::string& output) override;
    AdapterResult convertOutput(const std::string& input, std::string& output) override;
    AdapterResult validate(const std::string& data) override;
    
    // Text-specific methods
    AdapterResult setEncoding(const std::string& encoding);
    std::string getEncoding() const { return encoding_; }
    AdapterResult normalize(std::string& text);
    AdapterResult sanitize(std::string& text);
};

/**
 * JSON Adapter - Handles JSON format conversions
 */
class JsonAdapter : public IAdapter {
private:
    bool initialized_;
    bool pretty_print_;
    
public:
    JsonAdapter();
    ~JsonAdapter() override;
    
    // IAdapter interface
    std::string getName() const override { return "JsonAdapter"; }
    std::string getVersion() const override { return "1.0.0"; }
    DataFormat getSupportedFormat() const override { return DataFormat::JSON; }
    
    AdapterResult initialize() override;
    void cleanup() override;
    bool isInitialized() const override { return initialized_; }
    
    AdapterResult convertInput(const std::string& input, std::string& output) override;
    AdapterResult convertOutput(const std::string& input, std::string& output) override;
    AdapterResult validate(const std::string& data) override;
    
    // JSON-specific methods
    AdapterResult setPrettyPrint(bool enable) { pretty_print_ = enable; return AdapterResult::SUCCESS; }
    bool getPrettyPrint() const { return pretty_print_; }
    AdapterResult parseJson(const std::string& json, std::string& result);
    AdapterResult createJson(const std::string& data, std::string& json);
};

/**
 * RKLLM Adapter - Adapts data for RKLLM specific formats
 */
class RKLLMAdapter : public IAdapter {
private:
    bool initialized_;
#if 0 // Removed RKLLM_COMPILE_MODE_REAL
    std::shared_ptr<rkllmjs::core::RKLLMManager> manager_;
    std::shared_ptr<rkllmjs::inference::InferenceEngine> engine_;
#else
    // SANDBOX mode: no external dependencies
    void* manager_;  // Placeholder
    void* engine_;   // Placeholder
#endif
    
public:
    RKLLMAdapter();
    ~RKLLMAdapter() override;
    
    // IAdapter interface
    std::string getName() const override { return "RKLLMAdapter"; }
    std::string getVersion() const override { return "1.0.0"; }
    DataFormat getSupportedFormat() const override { return DataFormat::CUSTOM; }
    
    AdapterResult initialize() override;
    void cleanup() override;
    bool isInitialized() const override { return initialized_; }
    
    AdapterResult convertInput(const std::string& input, std::string& output) override;
    AdapterResult convertOutput(const std::string& input, std::string& output) override;
    AdapterResult validate(const std::string& data) override;
    
    // RKLLM-specific methods
    AdapterResult preparePrompt(const std::string& user_input, std::string& rkllm_prompt);
    AdapterResult processResponse(const std::string& rkllm_output, std::string& user_response);
    AdapterResult optimizeInput(std::string& input);
};

/**
 * Adapter Factory - Creates and manages adapters
 */
class AdapterFactory {
private:
    std::unordered_map<std::string, std::function<std::unique_ptr<IAdapter>()>> creators_;
    std::unordered_map<DataFormat, std::string> format_map_;
    
    AdapterFactory();  // Private constructor
    
public:
    static AdapterFactory& getInstance();
    ~AdapterFactory();
    
    // Factory methods
    AdapterResult registerAdapter(const std::string& name, 
                                 std::function<std::unique_ptr<IAdapter>()> creator);
    
    std::unique_ptr<IAdapter> createAdapter(const std::string& name);
    std::unique_ptr<IAdapter> createAdapterByFormat(DataFormat format);
    
    // Query methods
    std::vector<std::string> getAvailableAdapters() const;
    bool isAdapterAvailable(const std::string& name) const;
    AdapterResult getAdapterInfo(const std::string& name, std::string& info) const;
    
    // Utility methods
    static std::string getErrorMessage(AdapterResult result);
    static std::string formatToString(DataFormat format);
    static DataFormat stringToFormat(const std::string& format_str);
};

/**
 * Adapter Manager - Coordinates multiple adapters
 */
class AdapterManager {
private:
    std::unordered_map<std::string, std::unique_ptr<IAdapter>> adapters_;
    mutable std::mutex mutex_;
    bool initialized_;
    
    AdapterManager();  // Private constructor
    
    // Internal methods (assume mutex is already locked)
    AdapterResult loadAdapterInternal(const std::string& name);
    
public:
    static AdapterManager& getInstance();
    ~AdapterManager();
    
    // Lifecycle
    AdapterResult initialize();
    void cleanup();
    bool isInitialized() const { return initialized_; }
    
    // Adapter management
    AdapterResult loadAdapter(const std::string& name);
    AdapterResult unloadAdapter(const std::string& name);
    IAdapter* getAdapter(const std::string& name);
    
    // Batch operations
    AdapterResult loadDefaultAdapters();
    AdapterResult convertData(const std::string& from_format, 
                             const std::string& to_format,
                             const std::string& input, 
                             std::string& output);
    
    // Query methods
    std::vector<std::string> getLoadedAdapters() const;
    AdapterResult validateData(const std::string& format, const std::string& data);
    
    // Chain operations
    AdapterResult chainAdapters(const std::vector<std::string>& adapter_names,
                               const std::string& input,
                               std::string& output);
};

/**
 * Adapter Pipeline - For complex data transformations
 */
class AdapterPipeline {
private:
    std::vector<std::pair<std::string, std::unique_ptr<IAdapter>>> pipeline_;
    std::string name_;
    bool initialized_;
    
public:
    explicit AdapterPipeline(const std::string& name);
    ~AdapterPipeline();
    
    // Pipeline management
    AdapterResult addAdapter(const std::string& name, std::unique_ptr<IAdapter> adapter);
    AdapterResult removeAdapter(const std::string& name);
    AdapterResult clearPipeline();
    
    // Execution
    AdapterResult execute(const std::string& input, std::string& output);
    AdapterResult validate();
    
    // Query methods
    std::string getName() const { return name_; }
    size_t getAdapterCount() const { return pipeline_.size(); }
    std::vector<std::string> getAdapterNames() const;
    bool isInitialized() const { return initialized_; }
};

} // namespace adapters
} // namespace rkllmjs
