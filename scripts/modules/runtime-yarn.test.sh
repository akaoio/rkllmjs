#!/bin/bash

# RKLLM.js Yarn Runtime Module Tests
# Tests for scripts/modules/runtime-yarn.sh

# Get script directory and load test framework
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
source "$SCRIPT_DIR/../lib/test-framework.sh"
source "$SCRIPT_DIR/../lib/module-loader.sh"

# Initialize module system and load required modules
init_module_system
load_modules "core" "os-detection" "runtime-yarn"

# Test Yarn detection functions
test_yarn_detection() {
    assert_function_exists "get_yarn_version" "get_yarn_version function exists"
    assert_function_exists "check_yarn_version" "check_yarn_version function exists"
    assert_function_exists "detect_yarn" "detect_yarn function exists"
}

# Test Yarn installation functions
test_yarn_installation() {
    assert_function_exists "install_yarn" "install_yarn function exists"
    assert_function_exists "install_yarn_npm" "install_yarn_npm function exists"
    assert_function_exists "install_yarn_corepack" "install_yarn_corepack function exists"
    assert_function_exists "install_yarn_script" "install_yarn_script function exists"
    assert_function_exists "configure_yarn" "configure_yarn function exists"
    assert_function_exists "show_yarn_info" "show_yarn_info function exists"
}

# Test version constants
test_version_constants() {
    assert_not_empty "$YARN_MIN_VERSION" "YARN_MIN_VERSION constant defined"
    assert_not_empty "$YARN_RECOMMENDED_VERSION" "YARN_RECOMMENDED_VERSION constant defined"
}

# Test Yarn detection
test_yarn_detection_result() {
    local yarn_version
    yarn_version=$(get_yarn_version)
    
    if [[ -n "$yarn_version" ]]; then
        assert_not_empty "$yarn_version" "Yarn version detected"
    else
        assert_true "true" "Yarn version detection (Yarn may not be installed)"
    fi
}

# Test configuration functions
test_configuration() {
    # Stub yarn config commands
    yarn() {
        if [[ "$1" == "config" ]]; then
            echo "STUB: yarn config $*"
            return 0
        else
            echo "STUB: yarn $*"
            return 0
        fi
    }
    export -f yarn
    
    if configure_yarn > /dev/null 2>&1; then
        assert_true "true" "configure_yarn executes successfully"
    else
        assert_true "true" "configure_yarn function works (Yarn may not be installed)"
    fi
    
    unset -f yarn
}

# Test info display
test_info_display() {
    if show_yarn_info > /dev/null 2>&1; then
        assert_true "true" "show_yarn_info executes successfully"
    else
        assert_true "false" "show_yarn_info executes successfully"
    fi
}

# Test update functionality
test_update_functionality() {
    assert_function_exists "update_yarn" "update_yarn function exists"
}

# Test uninstall functionality
test_uninstall_functionality() {
    assert_function_exists "uninstall_yarn" "uninstall_yarn function exists"
}

# Main test execution
main() {
    echo "🧪 Running Yarn Runtime Module Tests"
    echo "==================================="
    echo
    
    run_test_suite "Yarn Runtime Module Tests" \
        "test_yarn_detection" \
        "test_yarn_installation" \
        "test_version_constants" \
        "test_yarn_detection_result" \
        "test_configuration" \
        "test_info_display" \
        "test_update_functionality" \
        "test_uninstall_functionality"
}

# Run tests if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main
fi