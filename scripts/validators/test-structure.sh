#!/bin/bash

# Test Structure Validator Module  
# Validates Tier 2 test structure and test framework

# Source the core utilities
VALIDATOR_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$VALIDATOR_DIR/core.sh"

validate_tier2_tests() {
    print_section "🧪 Checking Tier 2 test structure (Integration/System/Performance)..."

    # Check that high-level test directories exist and have proper structure
    TIER2_DIRS=("tests/integration" "tests/system" "tests/performance")

    for test_dir in "${TIER2_DIRS[@]}"; do
        if [ -d "$test_dir" ]; then
            report_success "Tier 2 test directory exists: $test_dir"
            
            # Check for README.md in each test directory
            if [ -f "$test_dir/README.md" ]; then
                report_success "Documentation exists for: $test_dir"
            else
                report_error "Missing README.md in test directory: $test_dir"
            fi
            
            # Check for at least one test file or warn if empty
            test_files=$(find "$test_dir" -name "*.test.ts" -o -name "*.test.cpp" 2>/dev/null | wc -l)
            if [ $test_files -eq 0 ]; then
                report_warning "No test files found in $test_dir (may be intended for future use)"
            fi
        else
            report_error "Missing Tier 2 test directory: $test_dir"
        fi
    done

    # Check that main tests directory has documentation
    if [ -f "tests/README.md" ]; then
        report_success "Test hierarchy documentation exists: tests/README.md"
    else
        report_error "Missing test hierarchy documentation: tests/README.md"
    fi
}

validate_test_framework() {
    print_section "🔧 Checking test framework structure..."

    # Check that test framework utilities exist
    TEST_FRAMEWORK_DIR="src/testing"
    if [ ! -d "$TEST_FRAMEWORK_DIR" ]; then
        report_error "Missing test framework directory: $TEST_FRAMEWORK_DIR"
        return 1
    fi

    report_success "Test framework directory exists: $TEST_FRAMEWORK_DIR"
    
    # Check for required test framework files
    REQUIRED_FRAMEWORK_FILES=("test-logger.ts" "test-utils.ts" "index.ts")
    for framework_file in "${REQUIRED_FRAMEWORK_FILES[@]}"; do
        if [ -f "$TEST_FRAMEWORK_DIR/$framework_file" ]; then
            report_success "Test framework file exists: $TEST_FRAMEWORK_DIR/$framework_file"
            
            # Check if the framework file has corresponding test
            framework_test="$TEST_FRAMEWORK_DIR/${framework_file%.ts}.test.ts"
            if [ -f "$framework_test" ]; then
                report_success "Test framework test exists: $framework_test"
            else
                report_error "Missing test for framework file: $framework_test"
            fi
        else
            report_error "Missing test framework file: $TEST_FRAMEWORK_DIR/$framework_file"
        fi
    done
}

validate_test_structure() {
    validate_tier2_tests
    validate_test_framework
}

# Run validation if script is called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    validate_test_structure
    
    errors=$(get_error_count)
    warnings=$(get_warning_count)
    
    if [ $errors -eq 0 ] && [ $warnings -eq 0 ]; then
        echo -e "${GREEN}✅ Test structure validation passed!${NC}"
        exit 0
    elif [ $errors -eq 0 ]; then
        echo -e "${YELLOW}⚠️  Test structure validation completed with $warnings warning(s)${NC}"
        exit 0
    else
        echo -e "${RED}❌ Test structure validation failed with $errors error(s) and $warnings warning(s)${NC}"
        exit 1
    fi
fi
