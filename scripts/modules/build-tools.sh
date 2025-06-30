#!/bin/bash

# RKLLM.js Build Tools Installation Module
# Handles C++ build essentials installation across different platforms

# Build tools requirements
readonly CMAKE_MIN_VERSION="3.16"
readonly GCC_MIN_VERSION="7.0"

# Check if build tools are installed
check_build_tools() {
    log_step "Checking build tools availability..."
    
    local missing_tools=()
    local tools_info=()
    
    # Check C++ compiler
    if command -v g++ &> /dev/null; then
        local gcc_version
        gcc_version=$(g++ --version | head -n1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -n1)
        tools_info+=("g++: v$gcc_version")
        
        if ! version_compare "$gcc_version" ">=" "$GCC_MIN_VERSION"; then
            log_warning "g++ version $gcc_version is below recommended: $GCC_MIN_VERSION"
        fi
    elif command -v clang++ &> /dev/null; then
        local clang_version
        clang_version=$(clang++ --version | head -n1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -n1)
        tools_info+=("clang++: v$clang_version")
    else
        missing_tools+=("C++ compiler")
    fi
    
    # Check make
    if command -v make &> /dev/null; then
        local make_version
        make_version=$(make --version | head -n1 | grep -oE '[0-9]+\.[0-9]+' | head -n1)
        tools_info+=("make: v$make_version")
    else
        missing_tools+=("make")
    fi
    
    # Check cmake
    if command -v cmake &> /dev/null; then
        local cmake_version
        cmake_version=$(cmake --version | head -n1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -n1)
        tools_info+=("cmake: v$cmake_version")
        
        if ! version_compare "$cmake_version" ">=" "$CMAKE_MIN_VERSION"; then
            log_warning "cmake version $cmake_version is below recommended: $CMAKE_MIN_VERSION"
        fi
    else
        missing_tools+=("cmake")
    fi
    
    # Check git
    if command -v git &> /dev/null; then
        local git_version
        git_version=$(git --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -n1)
        tools_info+=("git: v$git_version")
    else
        missing_tools+=("git")
    fi
    
    # Check pkg-config
    if command -v pkg-config &> /dev/null; then
        local pkgconfig_version
        pkgconfig_version=$(pkg-config --version)
        tools_info+=("pkg-config: v$pkgconfig_version")
    else
        missing_tools+=("pkg-config")
    fi
    
    # Check Google Test
    if pkg-config --exists gtest 2>/dev/null; then
        local gtest_version
        gtest_version=$(pkg-config --modversion gtest 2>/dev/null || echo "unknown")
        tools_info+=("Google Test: v$gtest_version")
    elif [[ -f "/usr/include/gtest/gtest.h" || -f "/usr/local/include/gtest/gtest.h" ]]; then
        tools_info+=("Google Test: installed (headers found)")
    else
        missing_tools+=("Google Test")
    fi
    
    # Show what's available
    if [[ ${#tools_info[@]} -gt 0 ]]; then
        log_success "Available build tools:"
        for tool in "${tools_info[@]}"; do
            echo "  ✅ $tool"
        done
    fi
    
    # Show what's missing
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log_warning "Missing build tools: ${missing_tools[*]}"
        return 1
    else
        log_success "All required build tools are available"
        return 0
    fi
}

# Get OS-specific build package names
get_build_packages() {
    local packages=()
    
    case "$OS" in
        ubuntu|debian|armbian)
            packages+=(
                "build-essential"
                "cmake"
                "git"
                "pkg-config"
                "libssl-dev"
                "libffi-dev"
                "python3-dev"
                "libgtest-dev"
                "googletest"
            )
            
            # Add ARM64/RK3588 specific packages for better performance
            if is_arm64_optimized; then
                packages+=(
                    "gcc-aarch64-linux-gnu"
                    "g++-aarch64-linux-gnu"
                    "libc6-dev-arm64-cross"
                )
                
                if [[ "$SYSTEM_ARCH" == "rk3588" ]]; then
                    packages+=(
                        "linux-libc-dev"
                        "libdrm-dev"
                        "libgbm-dev"
                    )
                fi
                
                # Log messages after package array construction
                log_info "Adding ARM64 cross-compilation tools for optimized builds"
                if [[ "$SYSTEM_ARCH" == "rk3588" ]]; then
                    log_info "RK3588 detected - adding additional optimization packages"
                fi
            fi
            ;;
        rhel)
            packages+=(
                "gcc-c++"
                "cmake"
                "make"
                "git"
                "pkg-config"
                "openssl-devel"
                "libffi-devel"
                "python3-devel"
                "gtest-devel"
            )
            
            # Additional packages for newer RHEL/CentOS
            if [[ "$PACKAGE_MANAGER" == "dnf" ]]; then
                packages+=("dnf-plugins-core")
            fi
            ;;
        arch)
            packages+=(
                "base-devel"
                "cmake"
                "git"
                "pkg-config"
                "openssl"
                "libffi"
                "python"
                "gtest"
            )
            ;;
        suse)
            packages+=(
                "patterns-devel-base-devel_basis"
                "cmake"
                "git"
                "pkg-config"
                "libopenssl-devel"
                "libffi-devel"
                "python3-devel"
            )
            ;;
        macos)
            # macOS uses different approach - Xcode Command Line Tools
            packages+=(
                "cmake"
                "git"
                "pkg-config"
            )
            ;;
        *)
            log_error "Build packages not defined for OS: $OS"
            return 1
            ;;
    esac
    
    echo "${packages[@]}"
}

# Install Xcode Command Line Tools on macOS
install_xcode_tools() {
    log_install "Installing Xcode Command Line Tools"
    
    # Check if already installed
    if xcode-select -p &> /dev/null; then
        log_success "Xcode Command Line Tools already installed"
        return 0
    fi
    
    # Install Xcode Command Line Tools
    log_info "Starting Xcode Command Line Tools installation..."
    log_info "This may take several minutes and require user interaction..."
    
    if xcode-select --install; then
        # Wait for installation to complete
        log_info "Waiting for Xcode Command Line Tools installation to complete..."
        while ! xcode-select -p &> /dev/null; do
            sleep 5
            echo -n "."
        done
        echo
        
        log_success "Xcode Command Line Tools installed successfully"
        return 0
    else
        log_error "Failed to install Xcode Command Line Tools"
        return 1
    fi
}

# Install build essentials
install_build_essentials() {
    log_step "Installing C++ build essentials..."
    
    # Check if already installed
    if check_build_tools; then
        log_success "Build tools are already installed"
        return 0
    fi
    
    case "$OS" in
        macos)
            # Install Xcode Command Line Tools first
            if ! install_xcode_tools; then
                log_error "Failed to install Xcode Command Line Tools"
                return 1
            fi
            
            # Install additional tools via Homebrew
            if command -v brew &> /dev/null; then
                local packages
                packages=($(get_build_packages))
                if install_packages "${packages[@]}"; then
                    log_success "Additional build tools installed via Homebrew"
                else
                    log_warning "Some build tools may not have been installed via Homebrew"
                fi
            else
                log_warning "Homebrew not available - some build tools may be missing"
            fi
            ;;
        *)
            # Install via package manager
            local packages
            packages=($(get_build_packages))
            
            if [[ ${#packages[@]} -eq 0 ]]; then
                log_error "No build packages defined for OS: $OS"
                return 1
            fi
            
            log_info "Installing build packages: ${packages[*]}"
            
            if install_packages "${packages[@]}"; then
                log_success "Build essentials installed successfully"
            else
                log_error "Failed to install build essentials"
                return 1
            fi
            ;;
    esac
    
    # Verify installation
    if check_build_tools; then
        log_success "Build tools installation completed and verified"
        
        # Install Google Test separately if needed
        if ! install_google_test; then
            log_warning "Google Test installation failed - C++ unit tests may not work"
        fi
        
        # Setup architecture-specific build environment
        setup_build_environment
        
        return 0
    else
        log_error "Build tools installation verification failed"
        return 1
    fi
}

# Install Google Test if not available
install_google_test() {
    log_step "Installing Google Test..."
    
    # Check if already installed
    if pkg-config --exists gtest 2>/dev/null || [[ -f "/usr/include/gtest/gtest.h" ]]; then
        log_success "Google Test is already installed"
        return 0
    fi
    
    case "$OS" in
        ubuntu|debian|armbian)
            log_info "Installing Google Test via package manager..."
            if install_packages "libgtest-dev" "googletest"; then
                # On Ubuntu, we may need to build the libraries
                if [[ ! -f "/usr/lib/libgtest.a" && ! -f "/usr/lib/x86_64-linux-gnu/libgtest.a" && ! -f "/usr/lib/aarch64-linux-gnu/libgtest.a" ]]; then
                    log_info "Building Google Test libraries..."
                    if command -v cmake &> /dev/null; then
                        (
                            cd /usr/src/gtest 2>/dev/null || cd /usr/src/googletest/googletest 2>/dev/null || {
                                log_warning "Google Test source not found in expected locations"
                                return 1
                            }
                            sudo cmake . || return 1
                            sudo make || return 1
                            sudo cp lib/*.a /usr/lib/ 2>/dev/null || sudo cp *.a /usr/lib/ 2>/dev/null || {
                                log_warning "Failed to install Google Test libraries"
                                return 1
                            }
                        )
                    else
                        log_warning "cmake not available for building Google Test"
                        return 1
                    fi
                fi
                log_success "Google Test installation completed"
                return 0
            else
                log_warning "Failed to install Google Test via package manager"
                return 1
            fi
            ;;
        rhel|arch|suse)
            log_info "Installing Google Test via package manager..."
            local gtest_package
            case "$OS" in
                rhel) gtest_package="gtest-devel" ;;
                arch) gtest_package="gtest" ;;
                suse) gtest_package="gtest-devel" ;;
            esac
            
            if install_packages "$gtest_package"; then
                log_success "Google Test installation completed"
                return 0
            else
                log_warning "Failed to install Google Test via package manager"
                return 1
            fi
            ;;
        macos)
            log_info "Installing Google Test via Homebrew..."
            if command -v brew &> /dev/null; then
                if brew install googletest; then
                    log_success "Google Test installation completed"
                    return 0
                else
                    log_warning "Failed to install Google Test via Homebrew"
                    return 1
                fi
            else
                log_warning "Homebrew not available for Google Test installation"
                return 1
            fi
            ;;
        *)
            log_warning "Unsupported OS for automatic Google Test installation: $OS"
            return 1
            ;;
    esac
}

# Install Python development headers (needed for some native modules)
install_python_dev() {
    log_step "Installing Python development headers..."
    
    local python_packages=()
    
    case "$OS" in
        ubuntu|debian|armbian)
            python_packages+=("python3-dev" "python3-pip")
            ;;
        rhel)
            python_packages+=("python3-devel" "python3-pip")
            ;;
        arch)
            python_packages+=("python" "python-pip")
            ;;
        suse)
            python_packages+=("python3-devel" "python3-pip")
            ;;
        macos)
            # Python should be available via Xcode tools
            if command -v brew &> /dev/null; then
                python_packages+=("python@3.11")
            fi
            ;;
        *)
            log_warning "Python development packages not defined for OS: $OS"
            return 1
            ;;
    esac
    
    if [[ ${#python_packages[@]} -gt 0 ]]; then
        if install_packages "${python_packages[@]}"; then
            log_success "Python development headers installed"
        else
            log_warning "Failed to install Python development headers"
            return 1
        fi
    fi
    
    return 0
}

# Configure build environment
configure_build_environment() {
    log_step "Configuring build environment..."
    
    # Set common environment variables
    export CC="${CC:-gcc}"
    export CXX="${CXX:-g++}"
    export MAKE="${MAKE:-make}"
    
    # Set number of parallel jobs for make
    if [[ -z "${MAKEFLAGS:-}" ]]; then
        local cpu_count
        if command -v nproc &> /dev/null; then
            cpu_count=$(nproc)
        elif command -v sysctl &> /dev/null; then
            cpu_count=$(sysctl -n hw.ncpu)
        else
            cpu_count=2
        fi
        
        export MAKEFLAGS="-j$cpu_count"
        log_info "Set MAKEFLAGS to use $cpu_count parallel jobs"
    fi
    
    # Configure pkg-config path (if needed)
    if [[ "$OS" == "macos" ]] && command -v brew &> /dev/null; then
        local brew_prefix
        brew_prefix=$(brew --prefix)
        export PKG_CONFIG_PATH="$brew_prefix/lib/pkgconfig:${PKG_CONFIG_PATH:-}"
        log_info "Configured PKG_CONFIG_PATH for Homebrew"
    fi
    
    log_success "Build environment configured"
}

# Test build environment
test_build_environment() {
    log_step "Testing build environment..."
    
    local temp_dir
    temp_dir=$(create_temp_dir "build_test")
    
    # Create a simple C++ test program
    cat > "$temp_dir/test.cpp" << 'EOF'
#include <iostream>
#include <string>

int main() {
    std::string message = "Build environment test successful!";
    std::cout << message << std::endl;
    return 0;
}
EOF
    
    # Create a simple CMakeLists.txt
    cat > "$temp_dir/CMakeLists.txt" << 'EOF'
cmake_minimum_required(VERSION 3.10)
project(BuildTest)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(test_program test.cpp)
EOF
    
    # Test compilation with g++/clang++
    log_info "Testing direct compilation..."
    if (cd "$temp_dir" && ${CXX:-g++} -std=c++17 -o test_direct test.cpp); then
        log_success "Direct compilation test passed"
        
        # Test execution
        if (cd "$temp_dir" && ./test_direct); then
            log_success "Direct compilation execution test passed"
        else
            log_warning "Direct compilation execution test failed"
        fi
    else
        log_error "Direct compilation test failed"
        return 1
    fi
    
    # Test CMake build
    log_info "Testing CMake build..."
    if (cd "$temp_dir" && mkdir -p build && cd build && cmake .. && make); then
        log_success "CMake build test passed"
        
        # Test execution
        if (cd "$temp_dir/build" && ./test_program); then
            log_success "CMake build execution test passed"
        else
            log_warning "CMake build execution test failed"
        fi
    else
        log_error "CMake build test failed"
        return 1
    fi
    
    log_success "Build environment tests completed successfully"
    return 0
}

# Show build environment information
show_build_info() {
    log_info "Build Environment Information:"
    
    # Show compilers
    if command -v gcc &> /dev/null; then
        local gcc_version
        gcc_version=$(gcc --version | head -n1)
        echo "  GCC: $gcc_version"
    fi
    
    if command -v clang &> /dev/null; then
        local clang_version
        clang_version=$(clang --version | head -n1)
        echo "  Clang: $clang_version"
    fi
    
    # Show build tools
    if command -v make &> /dev/null; then
        local make_version
        make_version=$(make --version | head -n1)
        echo "  Make: $make_version"
    fi
    
    if command -v cmake &> /dev/null; then
        local cmake_version
        cmake_version=$(cmake --version | head -n1)
        echo "  CMake: $cmake_version"
    fi
    
    # Show environment variables
    echo "  CC: ${CC:-not set}"
    echo "  CXX: ${CXX:-not set}"
    echo "  MAKEFLAGS: ${MAKEFLAGS:-not set}"
    echo "  PKG_CONFIG_PATH: ${PKG_CONFIG_PATH:-not set}"
    
    # Show architecture
    echo "  Architecture: $(uname -m)"
    echo "  Operating System: $OS"
    
    # Show system architecture details
    if [[ -n "${SYSTEM_ARCH:-}" ]]; then
        echo "  System Architecture: $SYSTEM_ARCH"
        echo "  Architecture Family: $SYSTEM_ARCH_FAMILY"
        
        if [[ "$SYSTEM_ARCH" == "rk3588" ]]; then
            echo "  🚀 RK3588 optimizations: ENABLED"
            echo "  🎯 Target platform: Orange Pi 5 Plus"
        fi
    fi
}

# Setup architecture-specific build environment
setup_build_environment() {
    log_info "Setting up build environment for $SYSTEM_ARCH architecture"
    
    # Get optimal compile flags for this architecture
    local compile_flags
    compile_flags=$(get_arch_compile_flags)
    
    # Set environment variables for optimal compilation
    export CFLAGS="${CFLAGS:-} $compile_flags"
    export CXXFLAGS="${CXXFLAGS:-} $compile_flags"
    
    if [[ "$SYSTEM_ARCH" == "rk3588" ]]; then
        log_info "Configuring RK3588 specific build optimizations"
        
        # RK3588 has 4x Cortex-A76 + 4x Cortex-A55 cores
        # Set optimal parallel build jobs
        local cpu_cores
        cpu_cores=$(nproc 2>/dev/null || echo "8")
        export MAKEFLAGS="${MAKEFLAGS:-} -j$cpu_cores"
        
        # RK3588 specific optimizations
        export NPM_CONFIG_TARGET_ARCH="arm64"
        export NPM_CONFIG_TARGET_PLATFORM="linux"
        export NPM_CONFIG_DISTURL="https://electronjs.org/headers"
        export NPM_CONFIG_RUNTIME="node"
        export NPM_CONFIG_ARCH="arm64"
        
        # Python build optimizations for ARM64
        export SETUPTOOLS_USE_DISTUTILS="stdlib"
        
        log_success "RK3588 build environment configured"
    elif is_arm64_optimized; then
        log_info "Configuring ARM64 build optimizations"
        
        # Generic ARM64 optimizations
        export NPM_CONFIG_TARGET_ARCH="arm64"
        export NPM_CONFIG_ARCH="arm64"
        
        log_success "ARM64 build environment configured"
    fi
    
    # Show current build environment
    show_build_info
}