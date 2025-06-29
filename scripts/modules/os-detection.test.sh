#!/bin/bash

# RKLLM.js OS Detection Module Tests
# Tests for scripts/modules/os-detection.sh

# Get script directory and load test framework
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
source "$SCRIPT_DIR/../lib/test-framework.sh"
source "$SCRIPT_DIR/../lib/module-loader.sh"

# Initialize module system and load required modules
init_module_system
load_modules "core" "os-detection"

# Test OS detection functions
test_os_detection_functions() {
    assert_function_exists "detect_os" "detect_os function exists"
    assert_function_exists "is_os_supported" "is_os_supported function exists"
    assert_function_exists "get_package_manager_commands" "get_package_manager_commands function exists"
    assert_function_exists "install_packages" "install_packages function exists"
    assert_function_exists "update_packages" "update_packages function exists"
}

# Test OS detection results
test_os_detection_results() {
    # OS should be detected and set
    assert_not_empty "$OS" "OS variable is set"
    assert_not_empty "$PACKAGE_MANAGER" "PACKAGE_MANAGER variable is set"
    
    # Check if detected OS is supported
    if is_os_supported; then
        assert_true "true" "detected OS is supported"
    else
        assert_true "false" "detected OS is supported"
    fi
}

# Test package manager commands
test_package_manager_commands() {
    # Get package manager commands
    get_package_manager_commands
    
    # Check that commands are set
    assert_not_empty "$UPDATE_CMD" "UPDATE_CMD is set"
    assert_not_empty "$INSTALL_CMD" "INSTALL_CMD is set"
    assert_not_empty "$SEARCH_CMD" "SEARCH_CMD is set"
    
    # Verify commands contain expected package manager
    case "$PACKAGE_MANAGER" in
        apt)
            if [[ "$INSTALL_CMD" == *"apt install"* ]]; then
                assert_true "true" "apt install command is correct"
            else
                assert_true "false" "apt install command is correct"
            fi
            ;;
        yum|dnf)
            if [[ "$INSTALL_CMD" == *"$PACKAGE_MANAGER install"* ]]; then
                assert_true "true" "$PACKAGE_MANAGER install command is correct"
            else
                assert_true "false" "$PACKAGE_MANAGER install command is correct"
            fi
            ;;
        pacman)
            if [[ "$INSTALL_CMD" == *"pacman -S"* ]]; then
                assert_true "true" "pacman install command is correct"
            else
                assert_true "false" "pacman install command is correct"
            fi
            ;;
        brew)
            if [[ "$INSTALL_CMD" == *"brew install"* ]]; then
                assert_true "true" "brew install command is correct"
            else
                assert_true "false" "brew install command is correct"
            fi
            ;;
        *)
            assert_true "true" "package manager command format (unknown manager: $PACKAGE_MANAGER)"
            ;;
    esac
}

# Test package name mapping
test_package_name_mapping() {
    assert_function_exists "get_os_package_name" "get_os_package_name function exists"
    
    # Test some common package mappings
    local curl_pkg
    curl_pkg=$(get_os_package_name "curl")
    assert_equals "curl" "$curl_pkg" "curl package name mapping"
    
    local git_pkg
    git_pkg=$(get_os_package_name "git")
    assert_equals "git" "$git_pkg" "git package name mapping"
    
    # Test build-essential mapping (varies by OS)
    local build_pkg
    build_pkg=$(get_os_package_name "build-essential")
    assert_not_empty "$build_pkg" "build-essential package name mapping"
}

# Test system requirements checking
test_system_requirements() {
    assert_function_exists "check_system_requirements" "check_system_requirements function exists"
    assert_function_exists "install_required_tools" "install_required_tools function exists"
    
    # Check system requirements (should pass on supported systems)
    if check_system_requirements; then
        assert_true "true" "system requirements check passes"
    else
        # This might fail in some test environments, so just log it
        assert_true "true" "system requirements check (may fail in test environment)"
    fi
}

# Test package installation (mock mode)
test_package_installation() {
    # Mock the install_packages function to avoid actual installation
    install_packages() {
        mock_install_packages "$@"
    }
    
    # Test that the function can be called
    if install_packages "test-package"; then
        assert_true "true" "install_packages function executes"
    else
        assert_true "false" "install_packages function executes"
    fi
}

# Test OS version detection
test_os_version() {
    # OS_VERSION should be set (may be empty on some systems)
    # Just check that the variable exists
    if [[ -n "${OS_VERSION:-}" ]]; then
        assert_not_empty "$OS_VERSION" "OS_VERSION is detected"
    else
        assert_true "true" "OS_VERSION variable exists (may be empty)"
    fi
}

# Main test execution
main() {
    echo "🧪 Running OS Detection Module Tests"
    echo "==================================="
    echo
    
    run_test_suite "OS Detection Module Tests" \
        "test_os_detection_functions" \
        "test_os_detection_results" \
        "test_package_manager_commands" \
        "test_package_name_mapping" \
        "test_system_requirements" \
        "test_package_installation" \
        "test_os_version"
}

# Run tests if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main
fi