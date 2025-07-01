#include "readme-generator.hpp"
#include <iostream>
#include <string>
#include <vector>
#include <filesystem>

using namespace rkllmjs::readme;

void printUsage(const std::string& programName) {
    std::cout << "RKLLMJS README Generator\n\n";
    std::cout << "Usage: " << programName << " [OPTIONS] [MODULE_PATH]\n\n";
    std::cout << "Options:\n";
    std::cout << "  -h, --help              Show this help message\n";
    std::cout << "  -t, --template PATH     Use custom template file\n";
    std::cout << "  -c, --config PATH       Use custom configuration file\n";
    std::cout << "  -f, --force             Overwrite existing README files\n";
    std::cout << "  -v, --verbose           Enable verbose output\n";
    std::cout << "  -r, --recursive         Process all modules recursively\n";
    std::cout << "  --validate-only         Only validate without generating\n\n";
    std::cout << "Examples:\n";
    std::cout << "  " << programName << " src/bindings/core\n";
    std::cout << "  " << programName << " --force --template custom.md .\n";
    std::cout << "  " << programName << " --recursive src/bindings\n";
}

int main(int argc, char* argv[]) {
    ReadmeConfig config;
    std::string modulePath = ".";
    bool recursive = false;
    bool validateOnly = false;
    std::string customTemplate;
    std::string configPath;
    
    // Parse command line arguments
    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        
        if (arg == "-h" || arg == "--help") {
            printUsage(argv[0]);
            return 0;
        } else if (arg == "-t" || arg == "--template") {
            if (++i >= argc) {
                std::cerr << "Error: --template requires a file path\n";
                return 1;
            }
            customTemplate = argv[i];
        } else if (arg == "-c" || arg == "--config") {
            if (++i >= argc) {
                std::cerr << "Error: --config requires a file path\n";
                return 1;
            }
            configPath = argv[i];
        } else if (arg == "-f" || arg == "--force") {
            config.overwriteExisting = true;
        } else if (arg == "-v" || arg == "--verbose") {
            config.verbose = true;
        } else if (arg == "-r" || arg == "--recursive") {
            recursive = true;
        } else if (arg == "--validate-only") {
            validateOnly = true;
        } else if (arg[0] != '-') {
            modulePath = arg;
        } else {
            std::cerr << "Error: Unknown option " << arg << "\n";
            printUsage(argv[0]);
            return 1;
        }
    }
    
    // Override template if specified
    if (!customTemplate.empty()) {
        config.templatePath = customTemplate;
    }
    
    ReadmeGenerator generator;
    generator.setConfig(config);
    
    // Load custom configuration file if specified
    if (!configPath.empty()) {
        if (!generator.loadConfig(configPath)) {
            std::cerr << "Warning: Could not load configuration file: " << configPath << std::endl;
        }
    }
    
    if (config.verbose) {
        std::cout << "RKLLMJS README Generator\n";
        std::cout << "========================\n";
        std::cout << "Module path: " << modulePath << "\n";
        std::cout << "Template: " << config.templatePath << "\n";
        std::cout << "Recursive: " << (recursive ? "yes" : "no") << "\n";
        std::cout << "Overwrite: " << (config.overwriteExisting ? "yes" : "no") << "\n";
        std::cout << "Validate only: " << (validateOnly ? "yes" : "no") << "\n\n";
    }
    
    int exitCode = 0;
    
    if (recursive) {
        // Process all subdirectories that look like modules
        try {
            for (const auto& entry : std::filesystem::recursive_directory_iterator(modulePath)) {
                if (entry.is_directory()) {
                    std::string dirPath = entry.path().string();
                    
                    // Check if this looks like a module (has source files)
                    auto sourceFiles = generator.findSourceFiles(dirPath);
                    if (!sourceFiles.empty()) {
                        if (config.verbose) {
                            std::cout << "Processing module: " << dirPath << std::endl;
                        }
                        
                        if (validateOnly) {
                            ModuleInfo moduleInfo;
                            if (!generator.analyzeModule(dirPath, moduleInfo)) {
                                std::cerr << "Error: Could not analyze module: " << dirPath << std::endl;
                                exitCode = 1;
                            } else if (!generator.validateModule(moduleInfo)) {
                                std::cerr << "Error: Module validation failed: " << dirPath << std::endl;
                                exitCode = 1;
                            } else if (config.verbose) {
                                std::cout << "  ✓ Module validation passed" << std::endl;
                            }
                        } else {
                            if (!generator.generateReadme(dirPath)) {
                                std::cerr << "Error: Could not generate README for: " << dirPath << std::endl;
                                exitCode = 1;
                            }
                        }
                    }
                }
            }
        } catch (const std::exception& e) {
            std::cerr << "Error during recursive processing: " << e.what() << std::endl;
            exitCode = 1;
        }
    } else {
        // Process single module
        if (validateOnly) {
            ModuleInfo moduleInfo;
            if (!generator.analyzeModule(modulePath, moduleInfo)) {
                std::cerr << "Error: Could not analyze module: " << modulePath << std::endl;
                exitCode = 1;
            } else if (!generator.validateModule(moduleInfo)) {
                std::cerr << "Error: Module validation failed: " << modulePath << std::endl;
                exitCode = 1;
            } else {
                std::cout << "✓ Module validation passed: " << modulePath << std::endl;
            }
        } else {
            if (!generator.generateReadme(modulePath)) {
                std::cerr << "Error: Could not generate README for: " << modulePath << std::endl;
                exitCode = 1;
            } else if (config.verbose) {
                std::cout << "✓ README generated successfully for: " << modulePath << std::endl;
            }
        }
    }
    
    return exitCode;
}