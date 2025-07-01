#include "../testing/rkllmjs-test.hpp"

#include <iostream>
#include <string>
#include <vector>
#include <filesystem>
#include <fstream>
#include <cstdlib>

using namespace rkllmjs::testing;

// Test fixtures and helpers
namespace {

// Create a temporary test directory structure
class CLITestFixture {
public:
    CLITestFixture() {
        testDir = "/tmp/readme_cli_test";
        std::filesystem::create_directories(testDir);
        std::filesystem::create_directories(testDir + "/test_module");
        createTestFiles();
    }
    
    ~CLITestFixture() {
        std::filesystem::remove_all(testDir);
    }
    
    void createTestFiles() {
        // Create a simple C++ file
        std::string cppContent = R"(
#include <iostream>

class TestClass {
public:
    void testMethod() {
        std::cout << "Test" << std::endl;
    }
};

void testFunction() {
    // Test implementation
}
)";
        
        std::ofstream cppFile(testDir + "/test_module/test.cpp");
        cppFile << cppContent;
        cppFile.close();
        
        // Create a template file
        std::string templateContent = R"(# {{MODULE_NAME}}

## Purpose
{{PURPOSE}}

## Source Files
{{SOURCE_FILES}}

## Functions
{{FUNCTIONS}}
)";
        
        std::ofstream templateFile(testDir + "/test-template.md");
        templateFile << templateContent;
        templateFile.close();
    }
    
    std::string testDir;
};

// Helper function to run CLI command and capture output
int runCLICommand(const std::string& command, std::string& output) {
    char buffer[128];
    std::string result = "";
    
    FILE* pipe = popen(command.c_str(), "r");
    if (!pipe) {
        return -1;
    }
    
    while (fgets(buffer, sizeof buffer, pipe) != nullptr) {
        result += buffer;
    }
    
    int exitCode = pclose(pipe);
    output = result;
    return WEXITSTATUS(exitCode);
}

} // anonymous namespace

// Test CLI help functionality
TEST(ReadmeGeneratorCLITest, HelpCommand) {
    std::string output;
    int exitCode = runCLICommand("./readme-generator-cli --help", output);
    
    EXPECT_EQ(exitCode, 0);
    EXPECT_NE(output.find("RKLLMJS README Generator"), std::string::npos);
    EXPECT_NE(output.find("Usage:"), std::string::npos);
    EXPECT_NE(output.find("Options:"), std::string::npos);
    EXPECT_NE(output.find("--help"), std::string::npos);
    EXPECT_NE(output.find("--verbose"), std::string::npos);
    EXPECT_NE(output.find("--template"), std::string::npos);
}

// Test CLI validation mode
TEST(ReadmeGeneratorCLITest, ValidationMode) {
    CLITestFixture fixture;
    
    std::string command = "./readme-generator-cli --validate-only " + fixture.testDir + "/test_module";
    std::string output;
    int exitCode = runCLICommand(command, output);
    
    EXPECT_EQ(exitCode, 0);
    EXPECT_NE(output.find("validation passed"), std::string::npos);
}

// Test CLI with custom template
TEST(ReadmeGeneratorCLITest, CustomTemplate) {
    CLITestFixture fixture;
    
    std::string command = "./readme-generator-cli --verbose --template " + 
                         fixture.testDir + "/test-template.md --validate-only " + 
                         fixture.testDir + "/test_module";
    std::string output;
    int exitCode = runCLICommand(command, output);
    
    EXPECT_EQ(exitCode, 0);
    EXPECT_NE(output.find("Template:"), std::string::npos);
    EXPECT_NE(output.find(fixture.testDir + "/test-template.md"), std::string::npos);
}

// Test CLI verbose mode
TEST(ReadmeGeneratorCLITest, VerboseMode) {
    CLITestFixture fixture;
    
    std::string command = "./readme-generator-cli --verbose --validate-only " + 
                         fixture.testDir + "/test_module";
    std::string output;
    int exitCode = runCLICommand(command, output);
    
    EXPECT_EQ(exitCode, 0);
    EXPECT_NE(output.find("RKLLMJS README Generator"), std::string::npos);
    EXPECT_NE(output.find("Module path:"), std::string::npos);
    EXPECT_NE(output.find("Template:"), std::string::npos);
    EXPECT_NE(output.find("Recursive:"), std::string::npos);
}

// Test CLI with invalid arguments
TEST(ReadmeGeneratorCLITest, InvalidArguments) {
    std::string output;
    int exitCode = runCLICommand("./readme-generator-cli --invalid-option", output);
    
    // Exit code should indicate failure, checking for non-zero
    EXPECT_TRUE(exitCode != 0 || output.find("Unknown option") != std::string::npos);
}

// Test CLI with non-existent module
TEST(ReadmeGeneratorCLITest, NonExistentModule) {
    std::string command = "./readme-generator-cli --validate-only /non/existent/module";
    std::string output;
    int exitCode = runCLICommand(command, output);
    
    // Should fail with error message
    EXPECT_TRUE(exitCode != 0 || output.find("Error:") != std::string::npos);
}

// Test CLI generation mode (creates actual files)
TEST(ReadmeGeneratorCLITest, GenerationMode) {
    CLITestFixture fixture;
    
    std::string command = "./readme-generator-cli --force --template " + 
                         fixture.testDir + "/test-template.md " + 
                         fixture.testDir + "/test_module";
    std::string output;
    int exitCode = runCLICommand(command, output);
    
    EXPECT_EQ(exitCode, 0);
    
    // Check if README was created
    std::string readmePath = fixture.testDir + "/test_module/README.md";
    EXPECT_TRUE(std::filesystem::exists(readmePath));
    
    // Verify content
    std::ifstream file(readmePath);
    std::string content((std::istreambuf_iterator<char>(file)),
                       std::istreambuf_iterator<char>());
    
    EXPECT_NE(content.find("test_module"), std::string::npos);
}

// Test CLI recursive mode  
TEST(ReadmeGeneratorCLITest, RecursiveMode) {
    CLITestFixture fixture;
    
    // Create nested module structure
    std::filesystem::create_directories(fixture.testDir + "/nested/module");
    std::ofstream nestedFile(fixture.testDir + "/nested/module/nested.cpp");
    nestedFile << "void nestedFunction() {}";
    nestedFile.close();
    
    std::string command = "./readme-generator-cli --recursive --validate-only --verbose " + 
                         fixture.testDir;
    std::string output;
    int exitCode = runCLICommand(command, output);
    
    EXPECT_EQ(exitCode, 0);
    EXPECT_NE(output.find("Recursive: yes"), std::string::npos);
    EXPECT_NE(output.find("Processing module:"), std::string::npos);
}

// Main test runner
RKLLMJS_TEST_MAIN()