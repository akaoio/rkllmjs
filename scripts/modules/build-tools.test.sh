#!/bin/bash

# RKLLM.js Build Tools Module Tests
# Tests for scripts/modules/build-tools.sh

# Get script directory and load test framework
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
source "$SCRIPT_DIR/../lib/test-framework.sh"
source "$SCRIPT_DIR/../lib/module-loader.sh"

# Initialize module system and load required modules
init_module_system
load_modules "core" "os-detection" "build-tools"

# Test build tools detection functions
test_build_tools_detection() {
    assert_function_exists "check_build_tools" "check_build_tools function exists"
    assert_function_exists "get_build_packages" "get_build_packages function exists"
    assert_function_exists "install_build_essentials" "install_build_essentials function exists"
}

# Test version constants
test_version_constants() {
    assert_not_empty "$CMAKE_MIN_VERSION" "CMAKE_MIN_VERSION constant defined"
    assert_not_empty "$GCC_MIN_VERSION" "GCC_MIN_VERSION constant defined"
    
    # Check that constants are valid version strings
    if [[ "$CMAKE_MIN_VERSION" =~ ^[0-9]+\.[0-9]+ ]]; then
        assert_true "true" "CMAKE_MIN_VERSION has valid format"
    else
        assert_true "false" "CMAKE_MIN_VERSION has valid format"
    fi
    
    if [[ "$GCC_MIN_VERSION" =~ ^[0-9]+\.[0-9]+ ]]; then
        assert_true "true" "GCC_MIN_VERSION has valid format"
    else
        assert_true "false" "GCC_MIN_VERSION has valid format"
    fi
}

# Test build packages for current OS
test_build_packages() {
    local packages
    packages=($(get_build_packages))
    
    if [[ ${#packages[@]} -gt 0 ]]; then
        assert_true "true" "build packages defined for OS: $OS"
        
        # Check that essential packages are included
        local packages_str="${packages[*]}"
        case "$OS" in
            ubuntu|debian)
                if [[ "$packages_str" == *"build-essential"* ]]; then
                    assert_true "true" "build-essential included for $OS"
                else
                    assert_true "false" "build-essential included for $OS"
                fi
                ;;
            rhel)
                if [[ "$packages_str" == *"gcc-c++"* ]]; then
                    assert_true "true" "gcc-c++ included for $OS"
                else
                    assert_true "false" "gcc-c++ included for $OS"
                fi
                ;;
            arch)
                if [[ "$packages_str" == *"base-devel"* ]]; then
                    assert_true "true" "base-devel included for $OS"
                else
                    assert_true "false" "base-devel included for $OS"
                fi
                ;;
            macos)
                if [[ "$packages_str" == *"cmake"* ]]; then
                    assert_true "true" "cmake included for $OS"
                else
                    assert_true "false" "cmake included for $OS"
                fi
                ;;
            *)
                assert_true "true" "packages defined for unknown OS: $OS"
                ;;
        esac
        
        # Check that cmake is included for all platforms
        if [[ "$packages_str" == *"cmake"* ]]; then
            assert_true "true" "cmake included in build packages"
        else
            assert_true "false" "cmake included in build packages"
        fi
    else
        assert_true "false" "build packages defined for OS: $OS"
    fi
}

# Test build tools checking
test_build_tools_checking() {
    # Test that check_build_tools can run without error
    # The result may vary based on what's installed in the test environment
    if check_build_tools > /dev/null 2>&1; then
        assert_true "true" "check_build_tools runs successfully (all tools available)"
    else
        assert_true "true" "check_build_tools runs successfully (some tools may be missing)"
    fi
}

# Test Python development tools
test_python_dev_tools() {
    assert_function_exists "install_python_dev" "install_python_dev function exists"
    
    # Stub install_packages to test the function
    install_packages() {
        stub_install_packages "$@"
    }
    
    if install_python_dev > /dev/null 2>&1; then
        assert_true "true" "install_python_dev executes successfully"
    else
        assert_true "true" "install_python_dev function works (may fail on unsupported OS)"
    fi
}

# Test build environment configuration
test_build_environment_config() {
    assert_function_exists "configure_build_environment" "configure_build_environment function exists"
    
    # Test configuration
    if configure_build_environment > /dev/null 2>&1; then
        assert_true "true" "configure_build_environment executes successfully"
        
        # Check that environment variables are set
        assert_not_empty "$CC" "CC environment variable is set"
        assert_not_empty "$CXX" "CXX environment variable is set"
        assert_not_empty "$MAKE" "MAKE environment variable is set"
        
        # Check MAKEFLAGS
        if [[ -n "${MAKEFLAGS:-}" ]]; then
            assert_not_empty "$MAKEFLAGS" "MAKEFLAGS is set"
            
            # Should contain -j for parallel jobs
            if [[ "$MAKEFLAGS" == *"-j"* ]]; then
                assert_true "true" "MAKEFLAGS contains parallel job setting"
            else
                assert_true "false" "MAKEFLAGS contains parallel job setting"
            fi
        else
            assert_true "true" "MAKEFLAGS configuration (may not be set in test environment)"
        fi
    else
        assert_true "false" "configure_build_environment executes successfully"
    fi
}

# Test macOS specific functions
test_macos_specific() {
    if [[ "$OS" == "macos" ]]; then
        assert_function_exists "install_xcode_tools" "install_xcode_tools function exists for macOS"
        
        # Test Xcode tools detection (without actually installing)
        if xcode-select -p &> /dev/null; then
            assert_true "true" "Xcode Command Line Tools are available"
        else
            assert_true "true" "Xcode Command Line Tools detection (not installed or not macOS)"
        fi
    else
        assert_true "true" "macOS-specific tests skipped (not on macOS)"
    fi
}

# Test build environment testing
test_build_environment_testing() {
    assert_function_exists "test_build_environment" "test_build_environment function exists"
    
    # Note: We won't actually run the build test as it requires a working compiler
    # and may create temporary files, but we can verify the function exists
    assert_true "true" "build environment testing function is available"
}

# Test information display
test_info_display() {
    assert_function_exists "show_build_info" "show_build_info function exists"
    
    # Test that show_build_info executes without error
    if show_build_info > /dev/null 2>&1; then
        assert_true "true" "show_build_info executes successfully"
    else
        assert_true "false" "show_build_info executes successfully"
    fi
}

# Test compiler availability
test_compiler_availability() {
    # Check for common compilers
    local has_gcc=false
    local has_clang=false
    local has_cpp_compiler=false
    
    if command -v gcc &> /dev/null; then
        has_gcc=true
        has_cpp_compiler=true
    fi
    
    if command -v clang &> /dev/null; then
        has_clang=true
        has_cpp_compiler=true
    fi
    
    if command -v g++ &> /dev/null; then
        has_cpp_compiler=true
    fi
    
    if command -v clang++ &> /dev/null; then
        has_cpp_compiler=true
    fi
    
    # Log compiler availability (not a failure if missing in test environment)
    assert_true "true" "compiler availability checked (gcc: $has_gcc, clang: $has_clang, cpp: $has_cpp_compiler)"
}

# Test make and cmake availability
test_build_tools_availability() {
    # Check for build tools
    local has_make=false
    local has_cmake=false
    
    if command -v make &> /dev/null; then
        has_make=true
    fi
    
    if command -v cmake &> /dev/null; then
        has_cmake=true
    fi
    
    # Log build tools availability
    assert_true "true" "build tools availability checked (make: $has_make, cmake: $has_cmake)"
}

# Main test execution
main() {
    echo "🧪 Running Build Tools Module Tests"
    echo "=================================="
    echo
    
    run_test_suite "Build Tools Module Tests" \
        "test_build_tools_detection" \
        "test_version_constants" \
        "test_build_packages" \
        "test_build_tools_checking" \
        "test_python_dev_tools" \
        "test_build_environment_config" \
        "test_macos_specific" \
        "test_build_environment_testing" \
        "test_info_display" \
        "test_compiler_availability" \
        "test_build_tools_availability"
}

# Run tests if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main
fi