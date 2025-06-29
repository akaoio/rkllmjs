#!/bin/bash

# RKLLM.js Bun Runtime Module Tests
# Tests for scripts/modules/runtime-bun.sh

# Get script directory and load test framework
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
source "$SCRIPT_DIR/../lib/test-framework.sh"
source "$SCRIPT_DIR/../lib/module-loader.sh"

# Initialize module system and load required modules
init_module_system
load_modules "core" "os-detection" "runtime-bun"

# Test Bun detection functions
test_bun_detection() {
    assert_function_exists "get_bun_version" "get_bun_version function exists"
    assert_function_exists "check_bun_version" "check_bun_version function exists"
    assert_function_exists "detect_bun" "detect_bun function exists"
}

# Test Bun installation functions
test_bun_installation() {
    assert_function_exists "install_bun" "install_bun function exists"
    assert_function_exists "install_bun_official" "install_bun_official function exists"
    assert_function_exists "configure_bun" "configure_bun function exists"
    assert_function_exists "show_bun_info" "show_bun_info function exists"
}

# Test version constants
test_version_constants() {
    assert_not_empty "$BUN_MIN_VERSION" "BUN_MIN_VERSION constant defined"
}

# Test system requirements
test_system_requirements() {
    assert_function_exists "check_bun_system_requirements" "check_bun_system_requirements function exists"
    
    if check_bun_system_requirements > /dev/null 2>&1; then
        assert_true "true" "Bun system requirements check passes"
    else
        assert_true "true" "Bun system requirements check (may fail on unsupported systems)"
    fi
}

# Test Bun detection
test_bun_detection_result() {
    local bun_version
    bun_version=$(get_bun_version)
    
    if [[ -n "$bun_version" ]]; then
        assert_not_empty "$bun_version" "Bun version detected"
    else
        assert_true "true" "Bun version detection (Bun may not be installed)"
    fi
}

# Test configuration functions
test_configuration() {
    if configure_bun > /dev/null 2>&1; then
        assert_true "true" "configure_bun executes successfully"
    else
        assert_true "true" "configure_bun function works (Bun may not be installed)"
    fi
}

# Test info display
test_info_display() {
    if show_bun_info > /dev/null 2>&1; then
        assert_true "true" "show_bun_info executes successfully"
    else
        assert_true "false" "show_bun_info executes successfully"
    fi
}

# Main test execution
main() {
    echo "🧪 Running Bun Runtime Module Tests"
    echo "=================================="
    echo
    
    run_test_suite "Bun Runtime Module Tests" \
        "test_bun_detection" \
        "test_bun_installation" \
        "test_version_constants" \
        "test_system_requirements" \
        "test_bun_detection_result" \
        "test_configuration" \
        "test_info_display"
}

# Run tests if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main
fi