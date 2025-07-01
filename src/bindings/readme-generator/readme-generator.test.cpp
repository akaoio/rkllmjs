#include "readme-generator.hpp"
#include "../testing/rkllmjs-test.hpp"

#include <filesystem>
#include <fstream>
#include <iostream>

using namespace rkllmjs::readme;
using namespace rkllmjs::testing;

// Test fixtures and helpers
namespace {

// Create a temporary test directory structure
class ReadmeGeneratorTestFixture {
public:
    ReadmeGeneratorTestFixture() {
        testDir = "/tmp/readme_generator_test";
        std::filesystem::create_directories(testDir);
        std::filesystem::create_directories(testDir + "/test_module");
        createTestFiles();
    }
    
    ~ReadmeGeneratorTestFixture() {
        std::filesystem::remove_all(testDir);
    }
    
    void createTestFiles() {
        // Create a test C++ file
        std::string cppContent = R"(
#include "test.hpp"
#include <iostream>

namespace test {

class TestClass {
public:
    void testMethod();
    int getValue() const;
};

void TestClass::testMethod() {
    std::cout << "Test method" << std::endl;
}

int TestClass::getValue() const {
    return 42;
}

void globalFunction(int param) {
    // Implementation
}

} // namespace test
)";
        
        std::ofstream cppFile(testDir + "/test_module/test.cpp");
        cppFile << cppContent;
        cppFile.close();
        
        // Create a test header file
        std::string hppContent = R"(
#pragma once

namespace test {

class TestClass {
public:
    void testMethod();
    int getValue() const;
private:
    int value_;
};

void globalFunction(int param);

} // namespace test
)";
        
        std::ofstream hppFile(testDir + "/test_module/test.hpp");
        hppFile << hppContent;
        hppFile.close();
        
        // Create a test TypeScript file
        std::string tsContent = R"(
export class TestTSClass {
    private value: number;
    
    constructor(value: number) {
        this.value = value;
    }
    
    public getValue(): number {
        return this.value;
    }
    
    public async processAsync(): Promise<void> {
        // Implementation
    }
}

export function utilityFunction(param: string): string {
    return param.toUpperCase();
}

const arrowFunction = (x: number, y: number): number => {
    return x + y;
};

export { arrowFunction };
)";
        
        std::ofstream tsFile(testDir + "/test_module/test.ts");
        tsFile << tsContent;
        tsFile.close();
        
        // Create a test template
        std::string templateContent = R"(# {{MODULE_NAME}}

## Purpose
{{PURPOSE}}

## Source Files
{{SOURCE_FILES}}

## Functions
{{FUNCTIONS}}

## Classes
{{CLASSES}}

## Dependencies
- Standard C++ libraries
- RKLLM runtime

## Testing
All components have corresponding unit tests.
)";
        
        std::ofstream templateFile(testDir + "/template.md");
        templateFile << templateContent;
        templateFile.close();
    }
    
    std::string testDir;
};

} // anonymous namespace

// Test basic configuration
TEST(ReadmeGeneratorTest, ConfigurationLoading) {
    ReadmeGeneratorTestFixture fixture;
    ReadmeGenerator generator;
    
    // Test default configuration
    ReadmeConfig config = generator.getConfig();
    EXPECT_EQ(config.overwriteExisting, false);
    EXPECT_EQ(config.verbose, false);
    
    // Test setting configuration
    config.verbose = true;
    config.overwriteExisting = true;
    generator.setConfig(config);
    
    ReadmeConfig retrievedConfig = generator.getConfig();
    EXPECT_EQ(retrievedConfig.verbose, true);
    EXPECT_EQ(retrievedConfig.overwriteExisting, true);
}

// Test file type detection
TEST(ReadmeGeneratorTest, FileTypeDetection) {
    ReadmeGenerator generator;
    
    EXPECT_EQ(generator.detectFileType("test.cpp"), "cpp");
    EXPECT_EQ(generator.detectFileType("test.hpp"), "hpp");
    EXPECT_EQ(generator.detectFileType("test.h"), "hpp");
    EXPECT_EQ(generator.detectFileType("test.ts"), "ts");
    EXPECT_EQ(generator.detectFileType("test.js"), "js");
    EXPECT_EQ(generator.detectFileType("test.txt"), "");
    
    EXPECT_TRUE(generator.isSourceFile("test.cpp"));
    EXPECT_TRUE(generator.isSourceFile("test.ts"));
    EXPECT_FALSE(generator.isSourceFile("test.test.cpp"));
    EXPECT_FALSE(generator.isSourceFile("test.txt"));
}

// Test source file analysis
TEST(ReadmeGeneratorTest, SourceFileAnalysis) {
    ReadmeGeneratorTestFixture fixture;
    ReadmeGenerator generator;
    
    // Test C++ file analysis
    SourceInfo cppInfo;
    std::string cppPath = fixture.testDir + "/test_module/test.cpp";
    EXPECT_TRUE(generator.analyzeSourceFile(cppPath, cppInfo));
    
    EXPECT_EQ(cppInfo.fileName, "test.cpp");
    EXPECT_EQ(cppInfo.fileType, "cpp");
    EXPECT_GT(cppInfo.functions.size(), 0);
    EXPECT_GT(cppInfo.classes.size(), 0);
    
    // Verify specific functions were found
    bool foundTestMethod = false;
    bool foundGetValue = false;
    bool foundGlobalFunction = false;
    
    for (const auto& func : cppInfo.functions) {
        if (func == "testMethod") foundTestMethod = true;
        if (func == "getValue") foundGetValue = true;
        if (func == "globalFunction") foundGlobalFunction = true;
    }
    
    EXPECT_TRUE(foundTestMethod || foundGetValue || foundGlobalFunction);
    
    // Verify class was found
    bool foundTestClass = false;
    for (const auto& cls : cppInfo.classes) {
        if (cls == "TestClass") foundTestClass = true;
    }
    EXPECT_TRUE(foundTestClass);
    
    // Test header file analysis
    SourceInfo hppInfo;
    std::string hppPath = fixture.testDir + "/test_module/test.hpp";
    EXPECT_TRUE(generator.analyzeSourceFile(hppPath, hppInfo));
    
    EXPECT_EQ(hppInfo.fileName, "test.hpp");
    EXPECT_EQ(hppInfo.fileType, "hpp");
    
    // Test TypeScript file analysis
    SourceInfo tsInfo;
    std::string tsPath = fixture.testDir + "/test_module/test.ts";
    EXPECT_TRUE(generator.analyzeSourceFile(tsPath, tsInfo));
    
    EXPECT_EQ(tsInfo.fileName, "test.ts");
    EXPECT_EQ(tsInfo.fileType, "ts");
    EXPECT_GT(tsInfo.functions.size(), 0);
    EXPECT_GT(tsInfo.classes.size(), 0);
    EXPECT_GT(tsInfo.exports.size(), 0);
}

// Test module analysis
TEST(ReadmeGeneratorTest, ModuleAnalysis) {
    ReadmeGeneratorTestFixture fixture;
    ReadmeGenerator generator;
    
    ModuleInfo moduleInfo;
    std::string modulePath = fixture.testDir + "/test_module";
    
    EXPECT_TRUE(generator.analyzeModule(modulePath, moduleInfo));
    
    EXPECT_EQ(moduleInfo.moduleName, "test_module");
    EXPECT_EQ(moduleInfo.modulePath, modulePath);
    EXPECT_GT(moduleInfo.sourceFiles.size(), 0);
    
    // Verify we found the expected source files
    bool foundCpp = false, foundHpp = false, foundTs = false;
    
    for (const auto& sourceFile : moduleInfo.sourceFiles) {
        if (sourceFile.fileType == "cpp") foundCpp = true;
        if (sourceFile.fileType == "hpp") foundHpp = true;
        if (sourceFile.fileType == "ts") foundTs = true;
    }
    
    EXPECT_TRUE(foundCpp);
    EXPECT_TRUE(foundHpp);
    EXPECT_TRUE(foundTs);
}

// Test template processing
TEST(ReadmeGeneratorTest, TemplateProcessing) {
    ReadmeGeneratorTestFixture fixture;
    ReadmeGenerator generator;
    
    // Load template
    std::string templatePath = fixture.testDir + "/template.md";
    EXPECT_TRUE(generator.loadTemplate(templatePath));
    
    // Create test module info
    ModuleInfo moduleInfo;
    moduleInfo.moduleName = "test_module";
    moduleInfo.purpose = "Testing purpose";
    
    SourceInfo sourceInfo;
    sourceInfo.fileName = "test.cpp";
    sourceInfo.fileType = "cpp";
    sourceInfo.functions.push_back("testFunction");
    sourceInfo.classes.push_back("TestClass");
    
    moduleInfo.sourceFiles.push_back(sourceInfo);
    
    // Process template
    std::string result = generator.processTemplate(moduleInfo);
    
    EXPECT_FALSE(result.empty());
    EXPECT_NE(result.find("test_module"), std::string::npos);
    EXPECT_NE(result.find("Testing purpose"), std::string::npos);
    EXPECT_NE(result.find("test.cpp"), std::string::npos);
    EXPECT_NE(result.find("testFunction"), std::string::npos);
    EXPECT_NE(result.find("TestClass"), std::string::npos);
}

// Test README generation
TEST(ReadmeGeneratorTest, ReadmeGeneration) {
    ReadmeGeneratorTestFixture fixture;
    ReadmeGenerator generator;
    
    // Configure generator
    ReadmeConfig config = generator.getConfig();
    config.templatePath = fixture.testDir + "/template.md";
    config.overwriteExisting = true;
    config.verbose = true;
    generator.setConfig(config);
    
    // Generate README
    std::string modulePath = fixture.testDir + "/test_module";
    EXPECT_TRUE(generator.generateReadme(modulePath));
    
    // Verify README was created
    std::string readmePath = modulePath + "/README.md";
    EXPECT_TRUE(std::filesystem::exists(readmePath));
    
    // Verify content
    std::ifstream file(readmePath);
    std::string content((std::istreambuf_iterator<char>(file)),
                       std::istreambuf_iterator<char>());
    
    EXPECT_NE(content.find("test_module"), std::string::npos);
    EXPECT_NE(content.find("test.cpp"), std::string::npos);
}

// Test validation functions
TEST(ReadmeGeneratorTest, ValidationFunctions) {
    ReadmeGenerator generator;
    
    // Test template validation
    std::string validTemplate = "# {{MODULE_NAME}}\n\n## Purpose\n{{PURPOSE}}";
    EXPECT_TRUE(generator.validateTemplate(validTemplate));
    
    std::string invalidTemplate = "# Test\n\nNo placeholders";
    EXPECT_FALSE(generator.validateTemplate(invalidTemplate));
    
    // Test module validation
    ModuleInfo validModule;
    validModule.moduleName = "test";
    
    SourceInfo sourceInfo;
    sourceInfo.fileName = "test.cpp";
    validModule.sourceFiles.push_back(sourceInfo);
    
    EXPECT_TRUE(generator.validateModule(validModule));
    
    ModuleInfo invalidModule;
    EXPECT_FALSE(generator.validateModule(invalidModule));
}

// Test edge cases and error handling
TEST(ReadmeGeneratorTest, EdgeCasesAndErrorHandling) {
    ReadmeGenerator generator;
    
    // Test non-existent file
    SourceInfo info;
    EXPECT_FALSE(generator.analyzeSourceFile("/non/existent/file.cpp", info));
    
    // Test non-existent module
    ModuleInfo moduleInfo;
    EXPECT_FALSE(generator.analyzeModule("/non/existent/module", moduleInfo));
    
    // Test empty template
    ReadmeGenerator emptyGenerator;
    ReadmeConfig emptyConfig = emptyGenerator.getConfig();
    emptyConfig.templatePath = "/non/existent/template.md";
    emptyGenerator.setConfig(emptyConfig);
    
    std::string result = emptyGenerator.processTemplate(ModuleInfo{});
    EXPECT_TRUE(result.empty());
}

// Main test runner
RKLLMJS_TEST_MAIN()