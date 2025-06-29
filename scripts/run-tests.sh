#!/bin/bash

# RKLLM.js Module Test Runner
# Runs all module tests and generates a comprehensive report

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
MODULES_DIR="$SCRIPT_DIR/modules"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_TESTS=0
TOTAL_PASSED=0
TOTAL_FAILED=0
MODULES_TESTED=0
MODULES_PASSED=0
MODULES_FAILED=0

# Test results for each module
declare -A MODULE_RESULTS

# Function to run a single module test
run_module_test() {
    local module_name="$1"
    local test_file="$MODULES_DIR/${module_name}.test.sh"
    
    echo -e "${BLUE}🧪 Testing module: $module_name${NC}"
    echo "=================================="
    
    if [[ ! -f "$test_file" ]]; then
        echo -e "${RED}❌ Test file not found: $test_file${NC}"
        MODULE_RESULTS[$module_name]="NOT_FOUND"
        MODULES_FAILED=$((MODULES_FAILED + 1))
        return 1
    fi
    
    if [[ ! -x "$test_file" ]]; then
        chmod +x "$test_file"
    fi
    
    # Run the test and capture output
    local test_output
    local test_exit_code
    
    test_output=$("$test_file" 2>&1)
    test_exit_code=$?
    
    echo "$test_output"
    echo
    
    # Parse test results from output
    local module_tests=0
    local module_passed=0
    local module_failed=0
    
    if [[ "$test_output" =~ Tests\ run:\ ([0-9]+) ]]; then
        module_tests=${BASH_REMATCH[1]}
    fi
    
    if [[ "$test_output" =~ Passed:\ ([0-9]+) ]]; then
        module_passed=${BASH_REMATCH[1]}
    fi
    
    if [[ "$test_output" =~ Failed:\ ([0-9]+) ]]; then
        module_failed=${BASH_REMATCH[1]}
    fi
    
    # Update totals
    TOTAL_TESTS=$((TOTAL_TESTS + module_tests))
    TOTAL_PASSED=$((TOTAL_PASSED + module_passed))
    TOTAL_FAILED=$((TOTAL_FAILED + module_failed))
    MODULES_TESTED=$((MODULES_TESTED + 1))
    
    if [[ $test_exit_code -eq 0 ]] && [[ $module_failed -eq 0 ]]; then
        echo -e "${GREEN}✅ Module $module_name: ALL TESTS PASSED${NC}"
        MODULE_RESULTS[$module_name]="PASS"
        MODULES_PASSED=$((MODULES_PASSED + 1))
    else
        echo -e "${RED}❌ Module $module_name: SOME TESTS FAILED${NC}"
        MODULE_RESULTS[$module_name]="FAIL"
        MODULES_FAILED=$((MODULES_FAILED + 1))
    fi
    
    echo
    return $test_exit_code
}

# Function to show final summary
show_summary() {
    echo
    echo -e "${PURPLE}📊 RKLLM.js Module Test Summary${NC}"
    echo "==============================="
    echo
    
    # Module results
    echo -e "${BLUE}Module Results:${NC}"
    for module in "${!MODULE_RESULTS[@]}"; do
        local result="${MODULE_RESULTS[$module]}"
        case "$result" in
            "PASS")
                echo -e "  ✅ $module: ${GREEN}PASSED${NC}"
                ;;
            "FAIL")
                echo -e "  ❌ $module: ${RED}FAILED${NC}"
                ;;
            "NOT_FOUND")
                echo -e "  ⚠️  $module: ${YELLOW}TEST NOT FOUND${NC}"
                ;;
        esac
    done
    echo
    
    # Overall statistics
    echo -e "${BLUE}Overall Statistics:${NC}"
    echo "  Modules tested: $MODULES_TESTED"
    echo -e "  Modules passed: ${GREEN}$MODULES_PASSED${NC}"
    echo -e "  Modules failed: ${RED}$MODULES_FAILED${NC}"
    echo
    echo "  Individual tests run: $TOTAL_TESTS"
    echo -e "  Individual tests passed: ${GREEN}$TOTAL_PASSED${NC}"
    echo -e "  Individual tests failed: ${RED}$TOTAL_FAILED${NC}"
    echo
    
    # Success rate
    if [[ $MODULES_TESTED -gt 0 ]]; then
        local success_rate=$((MODULES_PASSED * 100 / MODULES_TESTED))
        echo -e "${BLUE}Module Success Rate: ${success_rate}%${NC}"
    fi
    
    if [[ $TOTAL_TESTS -gt 0 ]]; then
        local test_success_rate=$((TOTAL_PASSED * 100 / TOTAL_TESTS))
        echo -e "${BLUE}Test Success Rate: ${test_success_rate}%${NC}"
    fi
    echo
    
    # Final result
    if [[ $MODULES_FAILED -eq 0 ]] && [[ $TOTAL_FAILED -eq 0 ]]; then
        echo -e "${GREEN}🎉 ALL TESTS PASSED! 🎉${NC}"
        return 0
    else
        echo -e "${RED}❌ SOME TESTS FAILED${NC}"
        if [[ $MODULES_FAILED -gt 0 ]]; then
            echo -e "${RED}$MODULES_FAILED module(s) had failing tests${NC}"
        fi
        if [[ $TOTAL_FAILED -gt 0 ]]; then
            echo -e "${RED}$TOTAL_FAILED individual test(s) failed${NC}"
        fi
        return 1
    fi
}

# Function to show help
show_help() {
    echo "RKLLM.js Module Test Runner"
    echo
    echo "Usage: $0 [OPTIONS] [MODULE...]"
    echo
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -v, --verbose  Verbose output"
    echo "  -q, --quiet    Quiet output (only show summary)"
    echo
    echo "Examples:"
    echo "  $0                    # Run all module tests"
    echo "  $0 core os-detection  # Run specific module tests"
    echo "  $0 --verbose          # Run all tests with verbose output"
    echo
    echo "Available modules:"
    for test_file in "$MODULES_DIR"/*.test.sh; do
        if [[ -f "$test_file" ]]; then
            local module_name
            module_name=$(basename "$test_file" .test.sh)
            echo "  - $module_name"
        fi
    done
}

# Main function
main() {
    local modules_to_test=()
    local verbose=false
    local quiet=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -v|--verbose)
                verbose=true
                shift
                ;;
            -q|--quiet)
                quiet=true
                shift
                ;;
            -*)
                echo "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
            *)
                modules_to_test+=("$1")
                shift
                ;;
        esac
    done
    
    # If no modules specified, test all available modules
    if [[ ${#modules_to_test[@]} -eq 0 ]]; then
        for test_file in "$MODULES_DIR"/*.test.sh; do
            if [[ -f "$test_file" ]]; then
                local module_name
                module_name=$(basename "$test_file" .test.sh)
                modules_to_test+=("$module_name")
            fi
        done
    fi
    
    # Check if any modules to test
    if [[ ${#modules_to_test[@]} -eq 0 ]]; then
        echo -e "${RED}No test modules found in $MODULES_DIR${NC}"
        exit 1
    fi
    
    # Show header
    if [[ "$quiet" != "true" ]]; then
        echo -e "${PURPLE}🔬 RKLLM.js Module Test Suite${NC}"
        echo "=============================="
        echo
        echo "Testing modules: ${modules_to_test[*]}"
        echo
    fi
    
    # Run tests for each module
    local overall_success=true
    for module in "${modules_to_test[@]}"; do
        if [[ "$quiet" != "true" ]]; then
            if ! run_module_test "$module"; then
                overall_success=false
            fi
        else
            # Quiet mode - capture output
            if ! run_module_test "$module" > /dev/null 2>&1; then
                overall_success=false
            fi
            echo -n "."
        fi
    done
    
    if [[ "$quiet" == "true" ]]; then
        echo
    fi
    
    # Show summary
    show_summary
    
    # Exit with appropriate code
    if [[ "$overall_success" == "true" ]] && [[ $MODULES_FAILED -eq 0 ]]; then
        exit 0
    else
        exit 1
    fi
}

# Make test files executable
find "$MODULES_DIR" -name "*.test.sh" -exec chmod +x {} \;

# Run main function
main "$@"