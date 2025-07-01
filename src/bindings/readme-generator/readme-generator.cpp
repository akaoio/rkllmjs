#include "readme-generator.hpp"
#include "../config/build-config.hpp"

#include <fstream>
#include <filesystem>
#include <regex>
#include <iostream>
#include <sstream>
#include <algorithm>

namespace rkllmjs {
namespace readme {

ReadmeGenerator::ReadmeGenerator() {
    // Initialize default configuration
    config_.templatePath = "../../../configs/readme-template.md";
    config_.overwriteExisting = false;
    config_.verbose = false;
}

ReadmeGenerator::~ReadmeGenerator() = default;

bool ReadmeGenerator::loadConfig(const std::string& configPath) {
    try {
        std::ifstream file(configPath);
        if (!file.is_open()) {
            if (config_.verbose) {
                std::cerr << "Warning: Could not open config file: " << configPath << std::endl;
            }
            return false;
        }
        
        // Simple JSON-like parsing for basic configuration
        // For a production version, we would use a proper JSON parser
        std::string line;
        while (std::getline(file, line)) {
            // Skip comments and empty lines
            if (line.empty() || line[0] == '#' || line.find("//") == 0) {
                continue;
            }
            
            // Parse key-value pairs
            size_t colonPos = line.find(':');
            if (colonPos != std::string::npos) {
                std::string key = line.substr(0, colonPos);
                std::string value = line.substr(colonPos + 1);
                
                // Trim whitespace
                key.erase(0, key.find_first_not_of(" \t"));
                key.erase(key.find_last_not_of(" \t") + 1);
                value.erase(0, value.find_first_not_of(" \t"));
                value.erase(value.find_last_not_of(" \t") + 1);
                
                // Remove quotes if present
                if (value.front() == '"' && value.back() == '"') {
                    value = value.substr(1, value.length() - 2);
                }
                
                // Set configuration values
                if (key == "templatePath") {
                    config_.templatePath = value;
                } else if (key == "overwriteExisting") {
                    config_.overwriteExisting = (value == "true");
                } else if (key == "verbose") {
                    config_.verbose = (value == "true");
                }
            }
        }
        
        return true;
    } catch (const std::exception& e) {
        if (config_.verbose) {
            std::cerr << "Error loading config: " << e.what() << std::endl;
        }
        return false;
    }
}

void ReadmeGenerator::setConfig(const ReadmeConfig& config) {
    config_ = config;
}

ReadmeConfig ReadmeGenerator::getConfig() const {
    return config_;
}

bool ReadmeGenerator::analyzeSourceFile(const std::string& filePath, SourceInfo& info) {
    if (!fileExists(filePath)) {
        return false;
    }
    
    info.fileName = getFileName(filePath);
    info.filePath = filePath;
    info.fileType = detectFileType(filePath);
    
    if (info.fileType == "cpp" || info.fileType == "hpp") {
        return parseCppFile(filePath, info);
    } else if (info.fileType == "ts" || info.fileType == "js") {
        return parseTypeScriptFile(filePath, info);
    }
    
    return false;
}

bool ReadmeGenerator::analyzeModule(const std::string& modulePath, ModuleInfo& info) {
    try {
        std::filesystem::path path(modulePath);
        info.moduleName = path.filename().string();
        info.modulePath = modulePath;
        
        // Find all source files in the module directory
        auto sourceFiles = findSourceFiles(modulePath);
        
        for (const auto& sourceFile : sourceFiles) {
            SourceInfo sourceInfo;
            if (analyzeSourceFile(sourceFile, sourceInfo)) {
                info.sourceFiles.push_back(sourceInfo);
            }
        }
        
        // Extract purpose from existing README if available
        std::string readmePath = modulePath + "/README.md";
        if (fileExists(readmePath)) {
            std::string content = readFile(readmePath);
            // Simple extraction of purpose from ## Purpose section
            std::regex purposeRegex(R"(##\s*Purpose\s*\n([^\n#]+))");
            std::smatch match;
            if (std::regex_search(content, match, purposeRegex)) {
                info.purpose = match[1].str();
                // Trim whitespace
                info.purpose.erase(0, info.purpose.find_first_not_of(" \t"));
                info.purpose.erase(info.purpose.find_last_not_of(" \t") + 1);
            }
        }
        
        return !info.sourceFiles.empty();
    } catch (const std::exception& e) {
        if (config_.verbose) {
            std::cerr << "Error analyzing module: " << e.what() << std::endl;
        }
        return false;
    }
}

bool ReadmeGenerator::loadTemplate(const std::string& templatePath) {
    templateContent_ = readFile(templatePath);
    return !templateContent_.empty();
}

std::string ReadmeGenerator::processTemplate(const ModuleInfo& moduleInfo) {
    if (templateContent_.empty() && !loadTemplate(config_.templatePath)) {
        return "";
    }
    
    // Build template variables from module info
    std::map<std::string, std::string> variables = config_.variables;
    variables["MODULE_NAME"] = moduleInfo.moduleName;
    variables["MODULE_PATH"] = moduleInfo.modulePath;
    variables["PURPOSE"] = moduleInfo.purpose;
    
    // Build source files list
    std::stringstream sourceFilesList;
    for (const auto& sourceFile : moduleInfo.sourceFiles) {
        sourceFilesList << "- `" << sourceFile.fileName << "` (" << sourceFile.fileType << ")\n";
    }
    variables["SOURCE_FILES"] = sourceFilesList.str();
    
    // Build functions list
    std::stringstream functionsList;
    for (const auto& sourceFile : moduleInfo.sourceFiles) {
        if (!sourceFile.functions.empty()) {
            functionsList << "### " << sourceFile.fileName << "\n";
            for (const auto& function : sourceFile.functions) {
                functionsList << "- `" << function << "`\n";
            }
            functionsList << "\n";
        }
    }
    variables["FUNCTIONS"] = functionsList.str();
    
    // Build classes list
    std::stringstream classesList;
    for (const auto& sourceFile : moduleInfo.sourceFiles) {
        if (!sourceFile.classes.empty()) {
            classesList << "### " << sourceFile.fileName << "\n";
            for (const auto& class_name : sourceFile.classes) {
                classesList << "- `" << class_name << "`\n";
            }
            classesList << "\n";
        }
    }
    variables["CLASSES"] = classesList.str();
    
    return replaceTemplateVariables(templateContent_, variables);
}

bool ReadmeGenerator::generateReadme(const std::string& modulePath) {
    ModuleInfo moduleInfo;
    if (!analyzeModule(modulePath, moduleInfo)) {
        return false;
    }
    
    std::string outputPath = modulePath + "/README.md";
    return generateReadme(moduleInfo, outputPath);
}

bool ReadmeGenerator::generateReadme(const ModuleInfo& moduleInfo, const std::string& outputPath) {
    // Check if file exists and we shouldn't overwrite
    if (fileExists(outputPath) && !config_.overwriteExisting) {
        if (config_.verbose) {
            std::cout << "Skipping existing README: " << outputPath << std::endl;
        }
        return true;
    }
    
    std::string content = processTemplate(moduleInfo);
    if (content.empty()) {
        return false;
    }
    
    bool result = writeFile(outputPath, content);
    if (result && config_.verbose) {
        std::cout << "Generated README: " << outputPath << std::endl;
    }
    
    return result;
}

std::vector<std::string> ReadmeGenerator::findSourceFiles(const std::string& directory) {
    std::vector<std::string> sourceFiles;
    
    try {
        for (const auto& entry : std::filesystem::recursive_directory_iterator(directory)) {
            if (entry.is_regular_file()) {
                std::string filePath = entry.path().string();
                if (isSourceFile(filePath)) {
                    sourceFiles.push_back(filePath);
                }
            }
        }
    } catch (const std::exception& e) {
        if (config_.verbose) {
            std::cerr << "Error finding source files: " << e.what() << std::endl;
        }
    }
    
    return sourceFiles;
}

std::string ReadmeGenerator::detectFileType(const std::string& filePath) {
    std::filesystem::path path(filePath);
    std::string extension = path.extension().string();
    
    if (extension == ".cpp" || extension == ".cc" || extension == ".cxx") {
        return "cpp";
    } else if (extension == ".hpp" || extension == ".h" || extension == ".hxx") {
        return "hpp";
    } else if (extension == ".ts") {
        return "ts";
    } else if (extension == ".js") {
        return "js";
    }
    
    return "";
}

bool ReadmeGenerator::isSourceFile(const std::string& filePath) {
    std::string fileType = detectFileType(filePath);
    return !fileType.empty() && filePath.find(".test.") == std::string::npos;
}

bool ReadmeGenerator::validateTemplate(const std::string& templateContent) {
    // Basic validation - check for required placeholders
    std::vector<std::string> requiredVars = {"MODULE_NAME", "PURPOSE"};
    
    for (const auto& var : requiredVars) {
        std::string placeholder = "{{" + var + "}}";
        if (templateContent.find(placeholder) == std::string::npos) {
            return false;
        }
    }
    
    return true;
}

bool ReadmeGenerator::validateModule(const ModuleInfo& moduleInfo) {
    return !moduleInfo.moduleName.empty() && !moduleInfo.sourceFiles.empty();
}

// Private methods

bool ReadmeGenerator::parseCppFile(const std::string& filePath, SourceInfo& info) {
    std::string content = readFile(filePath);
    if (content.empty()) {
        return false;
    }
    
    // Extract functions using regex
    std::regex functionRegex(R"((?:^|\n)\s*(?:[\w:]+\s+)*(\w+)\s*\([^)]*\)\s*(?:const\s*)?(?:override\s*)?(?:final\s*)?(?:\s*\{|\s*;))");
    std::sregex_iterator iter(content.begin(), content.end(), functionRegex);
    std::sregex_iterator end;
    
    while (iter != end) {
        std::string functionName = (*iter)[1].str();
        // Filter out obvious false positives
        if (functionName != "if" && functionName != "for" && functionName != "while" && 
            functionName != "switch" && functionName.length() > 1) {
            info.functions.push_back(functionName);
        }
        ++iter;
    }
    
    // Extract classes
    std::regex classRegex(R"((?:^|\n)\s*class\s+(\w+)(?:\s*:\s*[^{]+)?\s*\{)");
    std::sregex_iterator classIter(content.begin(), content.end(), classRegex);
    
    while (classIter != end) {
        info.classes.push_back((*classIter)[1].str());
        ++classIter;
    }
    
    // Extract includes
    std::regex includeRegex(R"(#include\s*[<"]([^>"]+)[>"])");
    std::sregex_iterator includeIter(content.begin(), content.end(), includeRegex);
    
    while (includeIter != end) {
        info.includes.push_back((*includeIter)[1].str());
        ++includeIter;
    }
    
    return true;
}

bool ReadmeGenerator::parseTypeScriptFile(const std::string& filePath, SourceInfo& info) {
    std::string content = readFile(filePath);
    if (content.empty()) {
        return false;
    }
    
    // Extract functions (function declarations and arrow functions)
    std::regex functionRegex(R"((?:^|\n)\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)|(?:^|\n)\s*(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>)");
    std::sregex_iterator iter(content.begin(), content.end(), functionRegex);
    std::sregex_iterator end;
    
    while (iter != end) {
        std::string functionName = (*iter)[1].matched ? (*iter)[1].str() : (*iter)[2].str();
        if (!functionName.empty()) {
            info.functions.push_back(functionName);
        }
        ++iter;
    }
    
    // Extract classes
    std::regex classRegex(R"((?:^|\n)\s*(?:export\s+)?class\s+(\w+)(?:\s+extends\s+\w+)?\s*\{)");
    std::sregex_iterator classIter(content.begin(), content.end(), classRegex);
    
    while (classIter != end) {
        info.classes.push_back((*classIter)[1].str());
        ++classIter;
    }
    
    // Extract exports
    std::regex exportRegex(R"(export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)|export\s*\{\s*([^}]+)\s*\})");
    std::sregex_iterator exportIter(content.begin(), content.end(), exportRegex);
    
    while (exportIter != end) {
        if ((*exportIter)[1].matched) {
            info.exports.push_back((*exportIter)[1].str());
        } else if ((*exportIter)[2].matched) {
            // Parse multiple exports in brackets
            std::string exports = (*exportIter)[2].str();
            std::regex nameRegex(R"(\b(\w+)\b)");
            std::sregex_iterator nameIter(exports.begin(), exports.end(), nameRegex);
            while (nameIter != end) {
                info.exports.push_back((*nameIter)[1].str());
                ++nameIter;
            }
        }
        ++exportIter;
    }
    
    return true;
}

std::string ReadmeGenerator::replaceTemplateVariables(const std::string& template_str, 
                                                    const std::map<std::string, std::string>& variables) {
    std::string result = template_str;
    
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

std::string ReadmeGenerator::readFile(const std::string& filePath) {
    std::ifstream file(filePath);
    if (!file.is_open()) {
        return "";
    }
    
    std::stringstream buffer;
    buffer << file.rdbuf();
    return buffer.str();
}

bool ReadmeGenerator::writeFile(const std::string& filePath, const std::string& content) {
    try {
        // Create directory if it doesn't exist
        std::filesystem::path path(filePath);
        std::filesystem::create_directories(path.parent_path());
        
        std::ofstream file(filePath);
        if (!file.is_open()) {
            return false;
        }
        
        file << content;
        return true;
    } catch (const std::exception& e) {
        if (config_.verbose) {
            std::cerr << "Error writing file: " << e.what() << std::endl;
        }
        return false;
    }
}

bool ReadmeGenerator::fileExists(const std::string& filePath) {
    return std::filesystem::exists(filePath);
}

std::string ReadmeGenerator::getFileName(const std::string& filePath) {
    std::filesystem::path path(filePath);
    return path.filename().string();
}

std::string ReadmeGenerator::getDirectory(const std::string& filePath) {
    std::filesystem::path path(filePath);
    return path.parent_path().string();
}

} // namespace readme
} // namespace rkllmjs