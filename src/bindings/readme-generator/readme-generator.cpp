#include "readme-generator.hpp"
#include "../config/build-config.hpp"

#include <fstream>
#include <filesystem>
#include <regex>
#include <iostream>
#include <sstream>
#include <algorithm>
#include <set>

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
        
        // Extract module metadata from header comments
        for (const auto& sourceFile : info.sourceFiles) {
            // Look for module header in .hpp files first, then .ts files, then .cpp/.js files
            if (sourceFile.fileType == "hpp" || 
                (info.purpose.empty() && (sourceFile.fileType == "ts" || sourceFile.fileType == "js")) ||
                (info.purpose.empty() && (sourceFile.fileType == "cpp"))) {
                std::string content = readFile(sourceFile.filePath);
                
                // Extract @purpose
                std::regex purposeRegex(R"(@purpose\s+([^\n@]+))");
                std::smatch match;
                if (std::regex_search(content, match, purposeRegex)) {
                    info.purpose = match[1].str();
                    // Trim whitespace
                    info.purpose.erase(0, info.purpose.find_first_not_of(" \t"));
                    info.purpose.erase(info.purpose.find_last_not_of(" \t") + 1);
                }
                
                // Extract @description for additional info
                std::regex descRegex(R"(@description\s+([^@]*))");
                if (std::regex_search(content, match, descRegex)) {
                    std::string description = match[1].str();
                    // Clean up multi-line description
                    std::regex cleanup(R"(\s*\*\s*|\s*\n\s*)");
                    description = std::regex_replace(description, cleanup, " ");
                    // Trim
                    description.erase(0, description.find_first_not_of(" \t"));
                    description.erase(description.find_last_not_of(" \t") + 1);
                    info.metadata["description"] = description;
                }
                
                // Extract @author
                std::regex authorRegex(R"(@author\s+([^\n@]+))");
                if (std::regex_search(content, match, authorRegex)) {
                    std::string author = match[1].str();
                    author.erase(0, author.find_first_not_of(" \t"));
                    author.erase(author.find_last_not_of(" \t") + 1);
                    info.metadata["author"] = author;
                }
                
                // Extract @version
                std::regex versionRegex(R"(@version\s+([^\n@]+))");
                if (std::regex_search(content, match, versionRegex)) {
                    std::string version = match[1].str();
                    version.erase(0, version.find_first_not_of(" \t"));
                    version.erase(version.find_last_not_of(" \t") + 1);
                    info.metadata["version"] = version;
                }
                
                // If we found purpose, prefer .hpp > .ts > .js > .cpp
                if (!info.purpose.empty() && (sourceFile.fileType == "hpp" || 
                    (sourceFile.fileType == "ts" && info.metadata.find("from_hpp") == info.metadata.end()))) {
                    if (sourceFile.fileType == "hpp") {
                        info.metadata["from_hpp"] = "true";
                    }
                    break;
                }
            }
        }
        
        // Fallback: Extract purpose from existing README if available and no @purpose found
        if (info.purpose.empty()) {
            std::string readmePath = modulePath + "/README.md";
            if (fileExists(readmePath)) {
                std::string content = readFile(readmePath);
                std::regex purposeRegex(R"(##\s*Purpose\s*\n([^\n#]+))");
                std::smatch match;
                if (std::regex_search(content, match, purposeRegex)) {
                    info.purpose = match[1].str();
                    info.purpose.erase(0, info.purpose.find_first_not_of(" \t"));
                    info.purpose.erase(info.purpose.find_last_not_of(" \t") + 1);
                }
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
    
    // Generate description from module metadata, NOT including purpose
    std::stringstream description;
    
    // Use module description from @description metadata if available
    auto descIt = moduleInfo.metadata.find("description");
    if (descIt != moduleInfo.metadata.end() && !descIt->second.empty()) {
        description << descIt->second;
    } else if (!moduleInfo.sourceFiles.empty() && !moduleInfo.sourceFiles[0].comments.empty()) {
        // Fallback to first comment as description if no @description found
        description << moduleInfo.sourceFiles[0].comments[0];
    } else if (!moduleInfo.purpose.empty()) {
        // Last resort: use purpose but add "provides" prefix to differentiate
        std::string purposeLower = moduleInfo.purpose;
        if (!purposeLower.empty()) {
            purposeLower[0] = std::tolower(purposeLower[0]);
        }
        description << "Provides " << purposeLower;
    }
    variables["DESCRIPTION"] = description.str();
    
    // Generate architecture information
    std::stringstream architecture;
    for (const auto& sourceFile : moduleInfo.sourceFiles) {
        if (!sourceFile.classes.empty()) {
            architecture << "- **" << sourceFile.fileName << "**: ";
            for (size_t i = 0; i < sourceFile.classes.size(); ++i) {
                if (i > 0) architecture << ", ";
                architecture << sourceFile.classes[i];
            }
            architecture << "\n";
        }
    }
    variables["ARCHITECTURE"] = architecture.str();
    
    // Build source files list
    std::stringstream sourceFilesList;
    for (const auto& sourceFile : moduleInfo.sourceFiles) {
        sourceFilesList << "- `" << sourceFile.fileName << "` (" << sourceFile.fileType << ")\n";
    }
    variables["SOURCE_FILES"] = sourceFilesList.str();
    
    // Build detailed functions list with documentation
    std::stringstream functionsDetailed;
    for (const auto& sourceFile : moduleInfo.sourceFiles) {
        if (!sourceFile.functions.empty()) {
            functionsDetailed << "#### " << sourceFile.fileName << "\n\n";
            for (const auto& function : sourceFile.functions) {
                functionsDetailed << "##### `" << function << "()`\n";
                
                // Add documentation if available
                auto docKey = function + "_doc";
                auto docIt = sourceFile.metadata.find(docKey);
                if (docIt != sourceFile.metadata.end() && !docIt->second.empty()) {
                    functionsDetailed << docIt->second << "\n\n";
                } else {
                    functionsDetailed << "*No documentation available*\n\n";
                }
            }
        }
    }
    variables["FUNCTIONS_DETAILED"] = functionsDetailed.str();
    
    // Build detailed classes list with documentation
    std::stringstream classesDetailed;
    for (const auto& sourceFile : moduleInfo.sourceFiles) {
        if (!sourceFile.classes.empty()) {
            classesDetailed << "#### " << sourceFile.fileName << "\n\n";
            for (const auto& class_name : sourceFile.classes) {
                classesDetailed << "##### `" << class_name << "`\n";
                
                // Add documentation if available
                auto docKey = class_name + "_doc";
                auto docIt = sourceFile.metadata.find(docKey);
                if (docIt != sourceFile.metadata.end() && !docIt->second.empty()) {
                    classesDetailed << docIt->second << "\n\n";
                } else {
                    classesDetailed << "*No documentation available*\n\n";
                }
            }
        }
    }
    variables["CLASSES_DETAILED"] = classesDetailed.str();
    
    // Build structs and enums
    std::stringstream structs, enums;
    for (const auto& sourceFile : moduleInfo.sourceFiles) {
        auto structsIt = sourceFile.metadata.find("structs");
        if (structsIt != sourceFile.metadata.end() && !structsIt->second.empty()) {
            structs << "- " << structsIt->second << "\n";
        }
        
        auto enumsIt = sourceFile.metadata.find("enums");
        if (enumsIt != sourceFile.metadata.end() && !enumsIt->second.empty()) {
            enums << "- " << enumsIt->second << "\n";
        }
    }
    variables["STRUCTS"] = structs.str().empty() ? "*None*" : structs.str();
    variables["ENUMS"] = enums.str().empty() ? "*None*" : enums.str();
    
    // Build dependencies list
    std::stringstream dependencies;
    std::set<std::string> uniqueDeps;
    for (const auto& sourceFile : moduleInfo.sourceFiles) {
        for (const auto& include : sourceFile.includes) {
            uniqueDeps.insert(include);
        }
    }
    for (const auto& dep : uniqueDeps) {
        dependencies << "- " << dep << "\n";
    }
    variables["DEPENDENCIES"] = dependencies.str().empty() ? "- Standard C++ libraries\n- RKLLM runtime" : dependencies.str();
    
    // Add placeholders for sections that will be enhanced later
    variables["EXAMPLES"] = "*Usage examples will be added based on function analysis*";
    variables["ERROR_HANDLING"] = "*Error handling documentation will be generated from code analysis*";
    variables["PERFORMANCE_NOTES"] = "*Performance considerations will be documented*";
    variables["THREAD_SAFETY"] = "*Thread safety analysis will be provided*";
    variables["MEMORY_MANAGEMENT"] = "*Memory management details will be documented*";
    variables["TESTING_INFO"] = "All components have corresponding unit tests.";
    variables["TROUBLESHOOTING"] = "*Common issues and solutions will be documented*";
    
    // Legacy variables for backward compatibility
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
        // First, add files in the current directory only (highest priority)
        for (const auto& entry : std::filesystem::directory_iterator(directory)) {
            if (entry.is_regular_file()) {
                std::string filePath = entry.path().string();
                if (isSourceFile(filePath)) {
                    sourceFiles.push_back(filePath);
                }
            }
        }
        
        // Sort files in current directory alphabetically to ensure consistent order
        std::sort(sourceFiles.begin(), sourceFiles.end());
        
        // Then, add files from subdirectories  
        std::vector<std::string> subdirFiles;
        for (const auto& entry : std::filesystem::recursive_directory_iterator(directory)) {
            if (entry.is_regular_file()) {
                std::string filePath = entry.path().string();
                std::string parentDir = std::filesystem::path(filePath).parent_path().string();
                
                // Skip files in the root directory (already added)
                if (parentDir != directory && isSourceFile(filePath)) {
                    subdirFiles.push_back(filePath);
                }
            }
        }
        
        // Sort subdirectory files and add them
        std::sort(subdirFiles.begin(), subdirFiles.end());
        sourceFiles.insert(sourceFiles.end(), subdirFiles.begin(), subdirFiles.end());
        
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
    
    // Extract comments with their context
    std::regex docCommentRegex(R"(/\*\*(.*?)\*/)");
    std::regex lineCommentRegex(R"(//\s*(.*))");
    std::sregex_iterator docIter(content.begin(), content.end(), docCommentRegex);
    std::sregex_iterator end;
    
    // Extract documentation comments
    while (docIter != end) {
        std::string comment = (*docIter)[1].str();
        // Clean up the comment
        std::regex cleanup(R"(\s*\*\s*)");
        comment = std::regex_replace(comment, cleanup, " ");
        if (!comment.empty()) {
            info.comments.push_back(comment);
        }
        ++docIter;
    }
    
    // Extract single line comments
    std::sregex_iterator lineIter(content.begin(), content.end(), lineCommentRegex);
    while (lineIter != end) {
        std::string comment = (*lineIter)[1].str();
        if (!comment.empty() && comment.find("//") == std::string::npos) {
            info.comments.push_back(comment);
        }
        ++lineIter;
    }
    
    // Extract functions with their documentation
    std::regex functionWithDocRegex(R"(/\*\*(.*?)\*/\s*(?:[\w:]+\s+)*(\w+)\s*\([^)]*\)\s*(?:const\s*)?(?:override\s*)?(?:final\s*)?(?:\s*\{|\s*;))");
    std::sregex_iterator funcDocIter(content.begin(), content.end(), functionWithDocRegex);
    
    while (funcDocIter != end) {
        std::string functionName = (*funcDocIter)[2].str();
        std::string doc = (*funcDocIter)[1].str();
        
        // Clean up documentation
        std::regex cleanup(R"(\s*\*\s*)");
        doc = std::regex_replace(doc, cleanup, " ");
        
        if (functionName != "if" && functionName != "for" && functionName != "while" && 
            functionName != "switch" && functionName.length() > 1) {
            info.functions.push_back(functionName);
            if (!doc.empty()) {
                info.metadata[functionName + "_doc"] = doc;
            }
        }
        ++funcDocIter;
    }
    
    // Extract functions without documentation
    std::regex functionRegex(R"((?:^|\n)\s*(?:[\w:]+\s+)*(\w+)\s*\([^)]*\)\s*(?:const\s*)?(?:override\s*)?(?:final\s*)?(?:\s*\{|\s*;))");
    std::sregex_iterator funcIter(content.begin(), content.end(), functionRegex);
    
    while (funcIter != end) {
        std::string functionName = (*funcIter)[1].str();
        if (functionName != "if" && functionName != "for" && functionName != "while" && 
            functionName != "switch" && functionName.length() > 1) {
            // Only add if not already added with documentation
            if (std::find(info.functions.begin(), info.functions.end(), functionName) == info.functions.end()) {
                info.functions.push_back(functionName);
            }
        }
        ++funcIter;
    }
    
    // Extract classes with documentation
    std::regex classWithDocRegex(R"(/\*\*(.*?)\*/\s*class\s+(\w+)(?:\s*:\s*[^{]+)?\s*\{)");
    std::sregex_iterator classDocIter(content.begin(), content.end(), classWithDocRegex);
    
    while (classDocIter != end) {
        std::string className = (*classDocIter)[2].str();
        std::string doc = (*classDocIter)[1].str();
        
        // Clean up documentation
        std::regex cleanup(R"(\s*\*\s*)");
        doc = std::regex_replace(doc, cleanup, " ");
        
        info.classes.push_back(className);
        if (!doc.empty()) {
            info.metadata[className + "_doc"] = doc;
        }
        ++classDocIter;
    }
    
    // Extract classes without documentation
    std::regex classRegex(R"((?:^|\n)\s*class\s+(\w+)(?:\s*:\s*[^{]+)?\s*\{)");
    std::sregex_iterator classIter(content.begin(), content.end(), classRegex);
    
    while (classIter != end) {
        std::string className = (*classIter)[1].str();
        // Only add if not already added with documentation
        if (std::find(info.classes.begin(), info.classes.end(), className) == info.classes.end()) {
            info.classes.push_back(className);
        }
        ++classIter;
    }
    
    // Extract structs and enums
    std::regex structRegex(R"((?:^|\n)\s*struct\s+(\w+))");
    std::regex enumRegex(R"((?:^|\n)\s*enum\s+(?:class\s+)?(\w+))");
    
    std::sregex_iterator structIter(content.begin(), content.end(), structRegex);
    while (structIter != end) {
        info.metadata["structs"] += (*structIter)[1].str() + " ";
        ++structIter;
    }
    
    std::sregex_iterator enumIter(content.begin(), content.end(), enumRegex);
    while (enumIter != end) {
        info.metadata["enums"] += (*enumIter)[1].str() + " ";
        ++enumIter;
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
    
    // Extract comments with their context (similar to C++)
    std::regex docCommentRegex(R"(/\*\*(.*?)\*/)");
    std::regex lineCommentRegex(R"(//\s*(.*))");
    std::sregex_iterator docIter(content.begin(), content.end(), docCommentRegex);
    std::sregex_iterator end;
    
    // Extract documentation comments
    while (docIter != end) {
        std::string comment = (*docIter)[1].str();
        // Clean up the comment
        std::regex cleanup(R"(\s*\*\s*)");
        comment = std::regex_replace(comment, cleanup, " ");
        if (!comment.empty()) {
            info.comments.push_back(comment);
        }
        ++docIter;
    }
    
    // Extract single line comments
    std::sregex_iterator lineIter(content.begin(), content.end(), lineCommentRegex);
    while (lineIter != end) {
        std::string comment = (*lineIter)[1].str();
        if (!comment.empty() && comment.find("//") == std::string::npos) {
            info.comments.push_back(comment);
        }
        ++lineIter;
    }
    
    // Extract functions with their documentation
    std::regex functionWithDocRegex(R"(/\*\*(.*?)\*/\s*(?:export\s+)?(?:async\s+)?(?:function\s+(\w+)|const\s+(\w+)\s*=))");
    std::sregex_iterator funcDocIter(content.begin(), content.end(), functionWithDocRegex);
    
    while (funcDocIter != end) {
        std::string functionName = (*funcDocIter)[2].matched ? (*funcDocIter)[2].str() : (*funcDocIter)[3].str();
        std::string doc = (*funcDocIter)[1].str();
        
        // Clean up documentation
        std::regex cleanup(R"(\s*\*\s*)");
        doc = std::regex_replace(doc, cleanup, " ");
        
        if (!functionName.empty()) {
            info.functions.push_back(functionName);
            if (!doc.empty()) {
                info.metadata[functionName + "_doc"] = doc;
            }
        }
        ++funcDocIter;
    }
    
    // Extract functions without documentation
    std::regex functionRegex(R"((?:^|\n)\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)|(?:^|\n)\s*(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>)");
    std::sregex_iterator funcIter(content.begin(), content.end(), functionRegex);
    
    while (funcIter != end) {
        std::string functionName = (*funcIter)[1].matched ? (*funcIter)[1].str() : (*funcIter)[2].str();
        if (!functionName.empty()) {
            // Only add if not already added with documentation
            if (std::find(info.functions.begin(), info.functions.end(), functionName) == info.functions.end()) {
                info.functions.push_back(functionName);
            }
        }
        ++funcIter;
    }
    
    // Extract classes with documentation
    std::regex classWithDocRegex(R"(/\*\*(.*?)\*/\s*(?:export\s+)?class\s+(\w+)(?:\s+extends\s+\w+)?\s*\{)");
    std::sregex_iterator classDocIter(content.begin(), content.end(), classWithDocRegex);
    
    while (classDocIter != end) {
        std::string className = (*classDocIter)[2].str();
        std::string doc = (*classDocIter)[1].str();
        
        // Clean up documentation
        std::regex cleanup(R"(\s*\*\s*)");
        doc = std::regex_replace(doc, cleanup, " ");
        
        info.classes.push_back(className);
        if (!doc.empty()) {
            info.metadata[className + "_doc"] = doc;
        }
        ++classDocIter;
    }
    
    // Extract classes without documentation
    std::regex classRegex(R"((?:^|\n)\s*(?:export\s+)?class\s+(\w+)(?:\s+extends\s+\w+)?\s*\{)");
    std::sregex_iterator classIter(content.begin(), content.end(), classRegex);
    
    while (classIter != end) {
        std::string className = (*classIter)[1].str();
        // Only add if not already added with documentation
        if (std::find(info.classes.begin(), info.classes.end(), className) == info.classes.end()) {
            info.classes.push_back(className);
        }
        ++classIter;
    }
    
    // Extract interfaces and types
    std::regex interfaceRegex(R"((?:^|\n)\s*(?:export\s+)?interface\s+(\w+))");
    std::regex typeRegex(R"((?:^|\n)\s*(?:export\s+)?type\s+(\w+))");
    
    std::sregex_iterator interfaceIter(content.begin(), content.end(), interfaceRegex);
    while (interfaceIter != end) {
        info.metadata["interfaces"] += (*interfaceIter)[1].str() + " ";
        ++interfaceIter;
    }
    
    std::sregex_iterator typeIter(content.begin(), content.end(), typeRegex);
    while (typeIter != end) {
        info.metadata["types"] += (*typeIter)[1].str() + " ";
        ++typeIter;
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

std::string ReadmeGenerator::inferPurpose(const std::string& moduleName, const std::vector<SourceInfo>& sourceFiles) {
    // Look for module-level documentation comments
    // Standard format: /** @module <name> @purpose <description> */
    
    for (const auto& sourceFile : sourceFiles) {
        for (const auto& comment : sourceFile.comments) {
            // Look for @module or @purpose tags
            if (comment.find("@module") != std::string::npos || 
                comment.find("@purpose") != std::string::npos) {
                
                // Extract purpose from @purpose tag
                size_t purposePos = comment.find("@purpose");
                if (purposePos != std::string::npos) {
                    std::string purpose = comment.substr(purposePos + 8); // Skip "@purpose"
                    
                    // Clean up the purpose text
                    size_t start = purpose.find_first_not_of(" \t\n");
                    if (start != std::string::npos) {
                        purpose = purpose.substr(start);
                        
                        // Find end of purpose (next @ tag or end of comment)
                        size_t end = purpose.find("@");
                        if (end != std::string::npos) {
                            purpose = purpose.substr(0, end);
                        }
                        
                        // Remove trailing whitespace
                        end = purpose.find_last_not_of(" \t\n");
                        if (end != std::string::npos) {
                            purpose = purpose.substr(0, end + 1);
                        }
                        
                        if (!purpose.empty()) {
                            return purpose;
                        }
                    }
                }
            }
            
            // Look for class-level documentation that might describe the module
            if (comment.find(moduleName) != std::string::npos && comment.length() > 20) {
                // This might be a descriptive comment about the module
                std::string desc = comment;
                
                // Clean up and format
                size_t start = desc.find_first_not_of(" \t\n*");
                if (start != std::string::npos) {
                    desc = desc.substr(start);
                    size_t end = desc.find_last_not_of(" \t\n*");
                    if (end != std::string::npos) {
                        desc = desc.substr(0, end + 1);
                    }
                    
                    if (desc.length() > 10 && desc.length() < 200) {
                        return desc;
                    }
                }
            }
        }
    }
    
    // Look for README.md in the module directory for existing purpose
    std::string readmePath = getDirectory(sourceFiles.empty() ? "" : sourceFiles[0].filePath) + "/README.md";
    if (fileExists(readmePath)) {
        std::string content = readFile(readmePath);
        
        // Look for Purpose section
        size_t purposePos = content.find("## Purpose");
        if (purposePos != std::string::npos) {
            size_t lineStart = content.find('\n', purposePos) + 1;
            size_t lineEnd = content.find('\n', lineStart);
            
            if (lineEnd != std::string::npos && lineStart < lineEnd) {
                std::string purpose = content.substr(lineStart, lineEnd - lineStart);
                
                // Clean up
                size_t start = purpose.find_first_not_of(" \t");
                if (start != std::string::npos && start < purpose.length()) {
                    purpose = purpose.substr(start);
                    if (!purpose.empty() && purpose != "{{PURPOSE}}") {
                        return purpose;
                    }
                }
            }
        }
    }
    
    // If no documentation found, return empty - force developer to add proper documentation
    return "";
}

} // namespace readme
} // namespace rkllmjs