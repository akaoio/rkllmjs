#!/bin/bash

# Module Test Framework for RKLLM.js
# Simple testing framework for bash modules

# Test results tracking
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test assertion functions
assert_true() {
    local condition="$1"
    local description="${2:-assertion}"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if [[ "$condition" == "true" ]]; then
        echo -e "${GREEN}✅ PASS: $description${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL: $description${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

assert_false() {
    local condition="$1"
    local description="${2:-assertion}"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if [[ "$condition" == "false" ]]; then
        echo -e "${GREEN}✅ PASS: $description${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL: $description${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

assert_equals() {
    local expected="$1"
    local actual="$2"
    local description="${3:-equality assertion}"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if [[ "$expected" == "$actual" ]]; then
        echo -e "${GREEN}✅ PASS: $description${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL: $description (expected: '$expected', actual: '$actual')${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

assert_not_empty() {
    local value="$1"
    local description="${2:-not empty assertion}"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if [[ -n "$value" ]]; then
        echo -e "${GREEN}✅ PASS: $description${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL: $description (value is empty)${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

assert_command_exists() {
    local command="$1"
    local description="${2:-command exists}"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if command -v "$command" &> /dev/null; then
        echo -e "${GREEN}✅ PASS: $description ($command found)${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL: $description ($command not found)${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

assert_function_exists() {
    local function_name="$1"
    local description="${2:-function exists}"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if declare -f "$function_name" &> /dev/null; then
        echo -e "${GREEN}✅ PASS: $description ($function_name found)${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL: $description ($function_name not found)${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Test execution functions
run_test() {
    local test_name="$1"
    local test_function="$2"
    
    echo -e "${BLUE}🧪 Running test: $test_name${NC}"
    
    if "$test_function"; then
        echo -e "${GREEN}✅ Test completed: $test_name${NC}"
    else
        echo -e "${YELLOW}⚠️ Test completed with failures: $test_name${NC}"
    fi
    echo
}

# Test suite execution
run_test_suite() {
    local suite_name="$1"
    shift
    local test_functions=("$@")
    
    echo -e "${BLUE}🔬 Running test suite: $suite_name${NC}"
    echo
    
    for test_func in "${test_functions[@]}"; do
        run_test "$test_func" "$test_func"
    done
    
    show_test_results "$suite_name"
}

# Show test results
show_test_results() {
    local suite_name="${1:-Test Suite}"
    
    echo "📊 $suite_name Results:"
    echo "  Tests run: $TESTS_RUN"
    echo -e "  Passed: ${GREEN}$TESTS_PASSED${NC}"
    echo -e "  Failed: ${RED}$TESTS_FAILED${NC}"
    
    if [[ $TESTS_FAILED -eq 0 ]]; then
        echo -e "${GREEN}🎉 All tests passed!${NC}"
        return 0
    else
        echo -e "${RED}❌ $TESTS_FAILED test(s) failed${NC}"
        return 1
    fi
}

# Utility functions for testing
create_test_temp_dir() {
    local prefix="${1:-test}"
    mktemp -d -t "${prefix}.XXXXXX"
}

cleanup_test_temp_dir() {
    local temp_dir="$1"
    [[ -n "$temp_dir" ]] && [[ -d "$temp_dir" ]] && rm -rf "$temp_dir"
}

# Stub function to disable actual installations in tests
stub_install_packages() {
    echo "STUB: install_packages called with: $*"
    return 0
}

# Export test framework functions
export -f assert_true assert_false assert_equals assert_not_empty
export -f assert_command_exists assert_function_exists
export -f run_test run_test_suite show_test_results
export -f create_test_temp_dir cleanup_test_temp_dir
export -f stub_install_packages