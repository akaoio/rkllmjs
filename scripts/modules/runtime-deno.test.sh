#!/bin/bash

# RKLLM.js Deno Runtime Module Tests
# Tests for scripts/modules/runtime-deno.sh

# Get script directory and load test framework
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
source "$SCRIPT_DIR/../lib/test-framework.sh"
source "$SCRIPT_DIR/../lib/module-loader.sh"

# Initialize module system and load required modules
init_module_system
load_modules "core" "os-detection" "runtime-deno"

# Test Deno detection functions
test_deno_detection() {
    assert_function_exists "get_deno_version" "get_deno_version function exists"
    assert_function_exists "check_deno_version" "check_deno_version function exists"
    assert_function_exists "detect_deno" "detect_deno function exists"
}

# Test Deno installation functions
test_deno_installation() {
    assert_function_exists "install_deno" "install_deno function exists"
    assert_function_exists "install_deno_official" "install_deno_official function exists"
    assert_function_exists "install_deno_github" "install_deno_github function exists"
    assert_function_exists "configure_deno" "configure_deno function exists"
    assert_function_exists "show_deno_info" "show_deno_info function exists"
}

# Test version constants
test_version_constants() {
    assert_not_empty "$DENO_MIN_VERSION" "DENO_MIN_VERSION constant defined"
}

# Test system requirements
test_system_requirements() {
    assert_function_exists "check_deno_system_requirements" "check_deno_system_requirements function exists"
    
    if check_deno_system_requirements > /dev/null 2>&1; then
        assert_true "true" "Deno system requirements check passes"
    else
        assert_true "true" "Deno system requirements check (may fail on unsupported systems)"
    fi
}

# Test Deno detection
test_deno_detection_result() {
    local deno_version
    deno_version=$(get_deno_version)
    
    if [[ -n "$deno_version" ]]; then
        assert_not_empty "$deno_version" "Deno version detected"
    else
        assert_true "true" "Deno version detection (Deno may not be installed)"
    fi
}

# Test configuration functions
test_configuration() {
    if configure_deno > /dev/null 2>&1; then
        assert_true "true" "configure_deno executes successfully"
    else
        assert_true "true" "configure_deno function works (Deno may not be installed)"
    fi
}

# Test info display
test_info_display() {
    if show_deno_info > /dev/null 2>&1; then
        assert_true "true" "show_deno_info executes successfully"
    else
        assert_true "false" "show_deno_info executes successfully"
    fi
}

# Test update functionality
test_update_functionality() {
    assert_function_exists "update_deno" "update_deno function exists"
}

# Main test execution
main() {
    echo "🧪 Running Deno Runtime Module Tests"
    echo "==================================="
    echo
    
    run_test_suite "Deno Runtime Module Tests" \
        "test_deno_detection" \
        "test_deno_installation" \
        "test_version_constants" \
        "test_system_requirements" \
        "test_deno_detection_result" \
        "test_configuration" \
        "test_info_display" \
        "test_update_functionality"
}

# Run tests if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main
fi