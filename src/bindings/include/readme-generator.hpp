#pragma once

#include <string>
#include <vector>
#include <map>
#include <memory>

namespace rkllmjs {
namespace readme {

/**
 * Configuration for README generation
 */
struct ReadmeConfig {
    std::string templatePath;           // Path to Markdown template file
    std::string outputPath;             // Where to write generated README
    std::vector<std::string> sourceFiles; // Source files to analyze
    std::map<std::string, std::string> variables; // Template variables
    bool overwriteExisting = false;     // Whether to overwrite existing READMEs
    bool verbose = false;               // Verbose logging
};

/**
 * Information extracted from source code
 */
struct SourceInfo {
    std::string fileName;
    std::string filePath;
    std::string fileType;  // cpp, hpp, ts, js
    std::vector<std::string> functions;
    std::vector<std::string> classes;
    std::vector<std::string> exports;  // For TypeScript/JavaScript
    std::vector<std::string> includes; // For C++
    std::vector<std::string> comments; // Documentation comments
    std::map<std::string, std::string> metadata;
};

/**
 * Module information for README generation
 */
struct ModuleInfo {
    std::string moduleName;
    std::string modulePath;
    std::string purpose;
    std::vector<SourceInfo> sourceFiles;
    std::vector<std::string> dependencies;
    std::map<std::string, std::string> metadata;
};

/**
 * README Generator - Analyzes source code and generates README.md files
 */
class ReadmeGenerator {
public:
    ReadmeGenerator();
    ~ReadmeGenerator();

    // Configuration
    bool loadConfig(const std::string& configPath);
    void setConfig(const ReadmeConfig& config);
    ReadmeConfig getConfig() const;

    // Source analysis
    bool analyzeSourceFile(const std::string& filePath, SourceInfo& info);
    bool analyzeModule(const std::string& modulePath, ModuleInfo& info);
    
    // Template processing
    bool loadTemplate(const std::string& templatePath);
    std::string processTemplate(const ModuleInfo& moduleInfo);
    
    // README generation
    bool generateReadme(const std::string& modulePath);
    bool generateReadme(const ModuleInfo& moduleInfo, const std::string& outputPath);
    
    // Utility functions
    std::vector<std::string> findSourceFiles(const std::string& directory);
    std::string detectFileType(const std::string& filePath);
    bool isSourceFile(const std::string& filePath);
    std::string inferPurpose(const std::string& moduleName, const std::vector<SourceInfo>& sourceFiles);
    
    // Validation
    bool validateTemplate(const std::string& templateContent);
    bool validateModule(const ModuleInfo& moduleInfo);

private:
    ReadmeConfig config_;
    std::string templateContent_;
    
    // Parser functions
    bool parseCppFile(const std::string& filePath, SourceInfo& info);
    bool parseTypeScriptFile(const std::string& filePath, SourceInfo& info);
    
    // Helper functions
    std::string extractFunctions(const std::string& content, const std::string& fileType);
    std::string extractClasses(const std::string& content, const std::string& fileType);
    std::string extractComments(const std::string& content, const std::string& fileType);
    std::string replaceTemplateVariables(const std::string& template_str, 
                                       const std::map<std::string, std::string>& variables);
    
    // File operations
    std::string readFile(const std::string& filePath);
    bool writeFile(const std::string& filePath, const std::string& content);
    bool fileExists(const std::string& filePath);
    std::string getFileName(const std::string& filePath);
    std::string getDirectory(const std::string& filePath);
};

} // namespace readme
} // namespace rkllmjs