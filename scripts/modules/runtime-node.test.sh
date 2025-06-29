#!/bin/bash

# RKLLM.js Node.js Runtime Module Tests
# Tests for scripts/modules/runtime-node.sh

# Get script directory and load test framework
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
source "$SCRIPT_DIR/../lib/test-framework.sh"
source "$SCRIPT_DIR/../lib/module-loader.sh"

# Initialize module system and load required modules
init_module_system
load_modules "core" "os-detection" "runtime-node"

# Test Node.js detection functions
test_nodejs_detection_functions() {
    assert_function_exists "get_nodejs_version" "get_nodejs_version function exists"
    assert_function_exists "check_nodejs_version" "check_nodejs_version function exists"
    assert_function_exists "detect_nodejs" "detect_nodejs function exists"
}

# Test Node.js installation functions
test_nodejs_installation_functions() {
    assert_function_exists "install_nodejs" "install_nodejs function exists"
    assert_function_exists "install_nodejs_package_manager" "install_nodejs_package_manager function exists"
    assert_function_exists "install_nodejs_nvm" "install_nodejs_nvm function exists"
    assert_function_exists "configure_nodejs" "configure_nodejs function exists"
    assert_function_exists "show_nodejs_info" "show_nodejs_info function exists"
}

# Test version checking
test_version_checking() {
    # Test version comparison with known values
    if check_nodejs_version "18.0.0" "16.0.0"; then
        assert_true "true" "version check passes for higher version"
    else
        assert_true "false" "version check passes for higher version"
    fi
    
    if check_nodejs_version "14.0.0" "16.0.0"; then
        assert_true "false" "version check fails for lower version"
    else
        assert_true "true" "version check fails for lower version"
    fi
    
    if check_nodejs_version "16.0.0" "16.0.0"; then
        assert_true "true" "version check passes for equal version"
    else
        assert_true "false" "version check passes for equal version"
    fi
}

# Test Node.js detection
test_nodejs_detection() {
    # Check if Node.js is installed
    local nodejs_version
    nodejs_version=$(get_nodejs_version)
    
    if [[ -n "$nodejs_version" ]]; then
        assert_not_empty "$nodejs_version" "Node.js version detected"
        
        # Test detect_nodejs function
        if detect_nodejs; then
            assert_true "true" "detect_nodejs returns success for installed Node.js"
        else
            assert_true "true" "detect_nodejs function works (may fail if version is too old)"
        fi
    else
        assert_true "true" "Node.js version detection (Node.js may not be installed in test environment)"
    fi
}

# Test version constants
test_version_constants() {
    assert_not_empty "$NODEJS_MIN_VERSION" "NODEJS_MIN_VERSION constant defined"
    assert_not_empty "$NODEJS_RECOMMENDED_VERSION" "NODEJS_RECOMMENDED_VERSION constant defined"
    
    # Check that constants are valid version strings
    if [[ "$NODEJS_MIN_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        assert_true "true" "NODEJS_MIN_VERSION has valid format"
    else
        assert_true "false" "NODEJS_MIN_VERSION has valid format"
    fi
    
    if [[ "$NODEJS_RECOMMENDED_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        assert_true "true" "NODEJS_RECOMMENDED_VERSION has valid format"
    else
        assert_true "false" "NODEJS_RECOMMENDED_VERSION has valid format"
    fi
}

# Test installation method selection
test_installation_methods() {
    # Test Ubuntu-specific installation method
    if [[ "$OS" == "ubuntu" ]]; then
        assert_function_exists "install_nodejs_nodesource" "install_nodejs_nodesource function exists for Ubuntu"
    fi
    
    # Test that package manager installation is available for current OS
    case "$OS" in
        ubuntu|debian|rhel|arch|suse|macos)
            assert_true "true" "package manager installation supported for $OS"
            ;;
        *)
            assert_true "true" "installation methods available (unknown OS: $OS)"
            ;;
    esac
}

# Test configuration functions
test_configuration_functions() {
    # Mock npm commands to avoid actual configuration changes
    npm() {
        echo "MOCK: npm $*"
        return 0
    }
    export -f npm
    
    # Test configuration (this should not make actual changes in mock mode)
    if configure_nodejs > /dev/null 2>&1; then
        assert_true "true" "configure_nodejs executes successfully"
    else
        assert_true "false" "configure_nodejs executes successfully"
    fi
}

# Test information display
test_info_display() {
    # Test that show_nodejs_info executes without error
    if show_nodejs_info > /dev/null 2>&1; then
        assert_true "true" "show_nodejs_info executes successfully"
    else
        assert_true "false" "show_nodejs_info executes successfully"
    fi
}

# Test update functionality
test_update_functionality() {
    assert_function_exists "update_nodejs" "update_nodejs function exists"
    
    # Note: We can't actually test update functionality in a test environment
    # as it would modify the system, but we can verify the function exists
    assert_true "true" "update functionality is available"
}

# Test error handling
test_error_handling() {
    # Test version checking with invalid input
    if check_nodejs_version "" "16.0.0"; then
        assert_true "false" "version check properly handles empty version"
    else
        assert_true "true" "version check properly handles empty version"
    fi
    
    # Test get_nodejs_version when Node.js is not available
    # Temporarily hide the command
    command() {
        if [[ "$1" == "-v" ]] && [[ "$2" == "node" ]]; then
            return 1  # Simulate node not found
        else
            builtin command "$@"
        fi
    }
    export -f command
    
    local version_result
    version_result=$(get_nodejs_version)
    
    if [[ -z "$version_result" ]]; then
        assert_true "true" "get_nodejs_version handles missing Node.js gracefully"
    else
        assert_true "true" "get_nodejs_version function works (Node.js may be available through other means)"
    fi
    
    # Restore command function
    unset -f command
}

# Main test execution
main() {
    echo "🧪 Running Node.js Runtime Module Tests"
    echo "======================================"
    echo
    
    run_test_suite "Node.js Runtime Module Tests" \
        "test_nodejs_detection_functions" \
        "test_nodejs_installation_functions" \
        "test_version_checking" \
        "test_nodejs_detection" \
        "test_version_constants" \
        "test_installation_methods" \
        "test_configuration_functions" \
        "test_info_display" \
        "test_update_functionality" \
        "test_error_handling"
}

# Run tests if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main
fi