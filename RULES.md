# RKLLMJS Development Rules

> **Automatically generated from validator comments - DO NOT EDIT MANUALLY**

---

## 🎯 Project Status

**ACHIEVED**: Real AI inference working on RK3588 NPU with Qwen2.5-VL-7B-Instruct model (1.33 tokens/sec, 100% NPU utilization). Complete TypeScript ↔ C++ ↔ NPU pipeline implemented with modular architecture.

**Architecture**: TypeScript API → C++ N-API Layer → librkllmrt.so (Rockchip NPU)

---

## 📋 Validation Rules

The following rules are automatically enforced by the validation system:


### 🔹 validate_cpp_unit_tests

**Function**: `validate_cpp_unit_tests`  
**Module**: `cpp.sh`  
**Description**: Validates that every C++ source file has a corresponding unit test file

Ensures 1:1 test coverage requirement for all .cpp files


### 🔹 validate_cpp_modular_architecture

**Function**: `validate_cpp_modular_architecture`  
**Module**: `cpp.sh`  
**Description**: Validates C++ modular architecture requirements

Checks that required modules exist with proper structure, Makefiles, and documentation


### 🔹 validate_cpp

**Function**: `validate_cpp`  
**Module**: `cpp.sh`  
**Description**: Main C++ validation orchestrator

Runs all C++ validation checks including unit tests and modular architecture


### 🔹 validate_naming_conventions

**Function**: `validate_naming_conventions`  
**Module**: `documentation.sh`  
**Description**: Validates naming conventions across the codebase

Prohibits generic names like utils.ts, helpers.cpp that violate RULES.md


### 🔹 validate_directory_structure

**Function**: `validate_directory_structure`  
**Module**: `documentation.sh`  
**Description**: Validates directory structure compliance

Ensures no empty directories exist (directories with only README.md)


### 🔹 validate_documentation

**Function**: `validate_documentation`  
**Module**: `documentation.sh`  
**Description**: Validates documentation coverage requirements

Ensures each feature directory has proper README.md documentation


### 🔹 validate_protected_assets

**Function**: `validate_protected_assets`  
**Module**: `documentation.sh`  
**Description**: Validates presence of protected Rockchip assets

Ensures critical library files and headers exist and are not modified


### 🔹 validate_documentation_and_naming

**Function**: `validate_documentation_and_naming`  
**Module**: `documentation.sh`  
**Description**: Main documentation and naming validation orchestrator

Runs all documentation coverage and naming convention checks


### 🔹 validate_tier2_tests

**Function**: `validate_tier2_tests`  
**Module**: `test-structure.sh`  
**Description**: Validates Tier 2 test structure for integration, system, and performance tests

Ensures proper test hierarchy with documentation and structure compliance


### 🔹 validate_test_framework

**Function**: `validate_test_framework`  
**Module**: `test-structure.sh`  
**Description**: Validates test framework structure and utilities

Ensures test framework components exist and have corresponding tests


### 🔹 validate_test_structure

**Function**: `validate_test_structure`  
**Module**: `test-structure.sh`  
**Description**: Main test structure validation orchestrator

Runs all test structure validation checks for Tier 2 tests and framework


### 🔹 validate_typescript

**Function**: `validate_typescript`  
**Module**: `typescript.sh`  
**Description**: Validates TypeScript source files and ensures 1:1 unit test coverage

Every .ts file must have a corresponding .test.ts file in the same directory

## 📚 Core Validation Utilities


### 🔹 report_error

**Function**: `report_error`  
**Module**: `core.sh`  
**Description**: Reports validation errors with consistent formatting

Increments global error counter for final reporting


### 🔹 report_warning

**Function**: `report_warning`  
**Module**: `core.sh`  
**Description**: Reports validation warnings with consistent formatting

Increments global warning counter for final reporting


### 🔹 report_success

**Function**: `report_success`  
**Module**: `core.sh`  
**Description**: Reports successful validation checks with consistent formatting

Used to indicate when validation rules pass


### 🔹 report_info

**Function**: `report_info`  
**Module**: `core.sh`  
**Description**: Reports informational messages with consistent formatting

Used for status updates and non-critical information


### 🔹 print_section

**Function**: `print_section`  
**Module**: `core.sh`  
**Description**: Prints section headers with consistent formatting

Used to organize validation output into logical sections


### 🔹 should_ignore_path

**Function**: `should_ignore_path`  
**Module**: `core.sh`  
**Description**: Determines if a file path should be ignored during validation

Respects .gitignore patterns and common build directories


### 🔹 filter_ignored_paths

**Function**: `filter_ignored_paths`  
**Module**: `core.sh`  
**Description**: Filters file paths using .gitignore patterns and validation rules

Used to exclude build artifacts and ignored files from validation


---

## 🔍 Validator Script

The `scripts/validate.sh` enforces compliance by running all validation modules:
1. **TypeScript validation**: 1:1 test coverage for .ts files
2. **C++ validation**: Modular architecture and test coverage
3. **Test structure validation**: Proper test hierarchy
4. **Documentation validation**: README.md coverage and naming conventions

**Exit Codes**: 0=pass, 1=validation errors found

---

## 🏗️ Development Philosophy

### Test-Driven Development
**MANDATORY**: Write failing unit test → minimal passing code → refactor → integration tests

### Pull Request Requirements
- ✅ 100% RULES.md compliance
- ✅ Complete 1:1 test coverage  
- ✅ All tests pass
- ✅ Validator passes
- ✅ No breaking changes without migration guide

---

*Generated automatically by RKLLMJS Doc Generator*
