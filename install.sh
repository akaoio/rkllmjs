#!/bin/bash

# RKLLM.js Installation Script
# Standard installation for RKLLM.js development environment

set -e  # Exit on any error

# Script metadata
readonly SCRIPT_VERSION="2.1.0"
readonly SCRIPT_NAME="RKLLM.js Development Setup"

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_step() {
    echo
    echo -e "${BLUE}🔧 $1${NC}"
    echo "─────────────────────────────────────"
}

# Global installation state
INTERACTIVE_MODE=true
INSTALL_NODE=true
INSTALL_BUILD_TOOLS=true

# OS Detection
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v apt-get &> /dev/null; then
            OS="ubuntu"
            PKG_MANAGER="apt"
            INSTALL_CMD="apt-get install -y"
            UPDATE_CMD="apt-get update"
        elif command -v yum &> /dev/null; then
            OS="rhel"
            PKG_MANAGER="yum"
            INSTALL_CMD="yum install -y"
            UPDATE_CMD="yum update -y"
        elif command -v dnf &> /dev/null; then
            OS="fedora"
            PKG_MANAGER="dnf"
            INSTALL_CMD="dnf install -y"
            UPDATE_CMD="dnf update -y"
        elif command -v pacman &> /dev/null; then
            OS="arch"
            PKG_MANAGER="pacman"
            INSTALL_CMD="pacman -S --noconfirm"
            UPDATE_CMD="pacman -Sy"
        else
            log_error "Unsupported Linux distribution"
            exit 1
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        PKG_MANAGER="brew"
        INSTALL_CMD="brew install"
        UPDATE_CMD="brew update"
    else
        log_error "Unsupported operating system: $OSTYPE"
        exit 1
    fi
    
    log_info "Detected OS: $OS with package manager: $PKG_MANAGER"
}

# Check system requirements
check_system_requirements() {
    log_step "Checking system requirements"
    
    # Check for basic tools
    local required_tools=("curl" "wget" "git")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_warning "$tool not found, will install it"
        fi
    done
    
    # Check memory (minimum 1GB)
    local available_memory
    if [[ "$OS" == "macos" ]]; then
        available_memory=$(sysctl -n hw.memsize)
        available_memory=$((available_memory / 1024 / 1024))  # Convert to MB
    else
        available_memory=$(free -m | awk 'NR==2{print $2}')
    fi
    
    if [[ $available_memory -lt 1024 ]]; then
        log_warning "Low memory detected: ${available_memory}MB (recommended: 2GB+)"
    fi
    
    # Check disk space (minimum 1GB free)
    local available_disk
    available_disk=$(df "$SCRIPT_DIR" | awk 'NR==2 {print $4}')
    if [[ $available_disk -lt 1048576 ]]; then  # 1GB in KB
        log_warning "Low disk space detected (recommended: 1GB+ free)"
    fi
    
    log_success "System requirements check completed"
    return 0
}

# Install required system tools
install_system_tools() {
    log_step "Installing required system tools"
    
    local tools_to_install=()
    
    # Check for essential tools
    for tool in curl wget git; do
        if ! command -v "$tool" &> /dev/null; then
            tools_to_install+=("$tool")
        fi
    done
    
    if [[ ${#tools_to_install[@]} -gt 0 ]]; then
        log_info "Installing: ${tools_to_install[*]}"
        
        # Update package manager first
        if [[ "$OS" != "macos" ]]; then
            sudo $UPDATE_CMD
        fi
        
        # Install tools
        if [[ "$OS" == "macos" ]]; then
            # Install Homebrew if not present
            if ! command -v brew &> /dev/null; then
                log_info "Installing Homebrew..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi
            for tool in "${tools_to_install[@]}"; do
                $INSTALL_CMD "$tool"
            done
        else
            sudo $INSTALL_CMD "${tools_to_install[@]}"
        fi
    fi
    
    log_success "System tools installation completed"
}

# Install Node.js
install_nodejs() {
    log_step "Installing Node.js"
    
    # Check if Node.js is already installed
    if command -v node &> /dev/null; then
        local node_version
        node_version=$(node --version | sed 's/v//')
        local major_version
        major_version=$(echo "$node_version" | cut -d. -f1)
        
        if [[ $major_version -ge 16 ]]; then
            log_success "Node.js $node_version is already installed (meets requirement: >=16.0.0)"
            return 0
        else
            log_warning "Node.js $node_version is too old (requirement: >=16.0.0). Installing newer version..."
        fi
    fi
    
    # Install Node.js via NodeSource repository
    if [[ "$OS" == "ubuntu" ]] || [[ "$OS" == "rhel" ]] || [[ "$OS" == "fedora" ]]; then
        log_info "Installing Node.js via NodeSource repository..."
        curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
        sudo $INSTALL_CMD nodejs
    elif [[ "$OS" == "arch" ]]; then
        sudo $INSTALL_CMD nodejs npm
    elif [[ "$OS" == "macos" ]]; then
        $INSTALL_CMD node
    fi
    
    # Verify installation
    if command -v node &> /dev/null && command -v npm &> /dev/null; then
        local node_version npm_version
        node_version=$(node --version)
        npm_version=$(npm --version)
        log_success "Node.js $node_version and npm $npm_version installed successfully"
    else
        log_error "Node.js installation failed"
        exit 1
    fi
}

# Install C++ build tools
install_build_tools() {
    log_step "Installing C++ build tools"
    
    local build_packages=()
    
    case "$OS" in
        ubuntu)
            build_packages=(build-essential cmake pkg-config)
            ;;
        rhel|fedora)
            build_packages=(gcc gcc-c++ make cmake pkgconfig)
            ;;
        arch)
            build_packages=(base-devel cmake pkgconf)
            ;;
        macos)
            # Xcode command line tools
            if ! xcode-select -p &> /dev/null; then
                log_info "Installing Xcode command line tools..."
                xcode-select --install
            fi
            build_packages=(cmake pkg-config)
            ;;
    esac
    
    if [[ ${#build_packages[@]} -gt 0 ]]; then
        log_info "Installing build tools: ${build_packages[*]}"
        if [[ "$OS" == "macos" ]]; then
            for package in "${build_packages[@]}"; do
                $INSTALL_CMD "$package"
            done
        else
            sudo $INSTALL_CMD "${build_packages[@]}"
        fi
    fi
    
    log_success "C++ build tools installation completed"
}



# Setup N-API headers for C++ compilation
setup_napi_headers() {
    log_info "Copying N-API headers to libs directory..."
    
    # Ensure libs directory exists
    mkdir -p "$SCRIPT_DIR/libs"
    
    # Copy node-addon-api headers
    if [ -f "$SCRIPT_DIR/node_modules/node-addon-api/napi.h" ]; then
        cp "$SCRIPT_DIR/node_modules/node-addon-api/napi.h" "$SCRIPT_DIR/libs/"
        cp "$SCRIPT_DIR/node_modules/node-addon-api/napi-inl.h" "$SCRIPT_DIR/libs/"
        cp "$SCRIPT_DIR/node_modules/node-addon-api/napi-inl.deprecated.h" "$SCRIPT_DIR/libs/"
        log_success "node-addon-api headers copied"
    else
        log_error "node-addon-api headers not found in node_modules"
        return 1
    fi
    
    # Copy Node.js N-API headers from node-gyp cache
    local node_version
    node_version=$(node --version | sed 's/v//')
    local node_headers_path="$HOME/.cache/node-gyp/$node_version/include/node"
    
    if [ -d "$node_headers_path" ]; then
        cp "$node_headers_path/node_api.h" "$SCRIPT_DIR/libs/" 2>/dev/null || true
        cp "$node_headers_path/js_native_api.h" "$SCRIPT_DIR/libs/" 2>/dev/null || true
        cp "$node_headers_path/js_native_api_types.h" "$SCRIPT_DIR/libs/" 2>/dev/null || true
        cp "$node_headers_path/node_api_types.h" "$SCRIPT_DIR/libs/" 2>/dev/null || true
        log_success "Node.js N-API headers copied from node-gyp cache"
    else
        log_warning "Node.js headers not found in node-gyp cache at $node_headers_path"
        log_info "Headers may be downloaded during first build - this is normal"
    fi
    
    # Verify critical headers are in place
    if [ -f "$SCRIPT_DIR/libs/napi.h" ]; then
        log_success "N-API headers setup completed"
        return 0
    else
        log_error "Critical N-API headers missing after setup"
        return 1
    fi
}

# Setup project dependencies
setup_project_dependencies() {
    log_step "Setting up project dependencies"
    
    # Navigate to project directory
    cd "$SCRIPT_DIR"
    
    # Install npm dependencies
    log_info "Installing npm dependencies..."
    if ! npm install; then
        log_error "Failed to install npm dependencies"
        return 1
    fi
    
    # Copy N-API headers to libs directory for stable build access
    log_info "Setting up N-API headers..."
    if ! setup_napi_headers; then
        log_error "Failed to setup N-API headers"
        return 1
    fi
    
    log_success "Project dependencies setup completed"
}

# Show installation summary
show_installation_summary() {
    echo
    log_success "🎉 RKLLM.js Installation Complete!"
    echo
    
    # Show installed components
    log_info "📦 Installed components:"
    
    if command -v node &> /dev/null; then
        echo "  ✅ Node.js: $(node --version)"
    fi
    
    if command -v npm &> /dev/null; then
        echo "  ✅ npm: $(npm --version)"
    fi
    
    if command -v gcc &> /dev/null; then
        echo "  ✅ GCC: $(gcc --version | head -1)"
    fi
    
    if command -v cmake &> /dev/null; then
        echo "  ✅ CMake: $(cmake --version | head -1)"
    fi
    
    echo "  ✅ RKLLMJS Test Framework: Built-in (no external dependencies)"
    
    echo
    log_info "🎯 Next steps:"
    echo "  1. Restart your terminal or run: source ~/.bashrc"
    echo "  2. Test the installation: npm test"
    echo "  3. Build C++ modules: npm run build:cpp"
    echo "  4. Run C++ tests: npm run test:cpp"
    echo "  5. Start development with your RKLLM model!"
    echo
    
    log_info "📖 Documentation:"
    echo "  • Project README: README.md"
    echo "  • Development rules: RULES.md"
    echo "  • Architecture: ARCHITECTURE.md"
    echo
    
    log_info "🚀 Available commands:"
    echo "  • npm run build         - Build the entire project"
    echo "  • npm run build:cpp     - Build C++ modules only"
    echo "  • npm run test          - Run all tests"
    echo "  • npm run test:cpp      - Run C++ tests only"
    echo "  • npm run validate      - Run validation checks"
    echo "  • npm run cli           - Use the RKLLM CLI"
    echo
}

# Show header
show_header() {
    echo
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    RKLLM.js Installation                    ║"
    echo "║                                                              ║"
    echo "║  RKLLM.js - Node.js binding for Rockchip RK3588 NPU         ║"
    echo "║  Version: $SCRIPT_VERSION                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo
}

# Interactive confirmation
confirm_installation() {
    if [[ "$INTERACTIVE_MODE" == "false" ]]; then
        return 0
    fi
    
    echo "This script will install the following components:"
    echo "  • System tools (curl, wget, git)"
    echo "  • Node.js (v16+) and npm"
    echo "  • C++ build tools (gcc, cmake, pkg-config)"
    echo "  • Project dependencies"
    echo
    
    while true; do
        read -p "Do you want to continue? (y/N): " -r
        case $REPLY in
            [Yy]|[Yy][Ee][Ss])
                return 0
                ;;
            [Nn]|[Nn][Oo]|"")
                log_info "Installation cancelled by user"
                exit 0
                ;;
            *)
                echo "Please answer yes (y) or no (n)."
                ;;
        esac
    done
}

# Main installation function
main() {
    # Show header
    show_header
    
    # Detect OS and package manager
    detect_os
    
    # Check system requirements
    if ! check_system_requirements; then
        log_error "System requirements check failed"
        exit 1
    fi
    
    # Show confirmation dialog
    confirm_installation
    
    # Install system tools
    if ! install_system_tools; then
        log_error "System tools installation failed"
        exit 1
    fi
    
    # Install Node.js
    if [[ "$INSTALL_NODE" == "true" ]]; then
        if ! install_nodejs; then
            log_error "Node.js installation failed"
            exit 1
        fi
    fi
    
    # Install build tools
    if [[ "$INSTALL_BUILD_TOOLS" == "true" ]]; then
        if ! install_build_tools; then
            log_warning "Build tools installation failed - some features may not work"
        fi
    fi
    
    # Setup project dependencies
    if ! setup_project_dependencies; then
        log_warning "Project setup failed - you may need to run 'npm install' manually"
    fi
    
    # Show installation summary
    show_installation_summary
}

# Handle command line arguments
handle_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help|-h)
                show_help
                exit 0
                ;;
            --version|-v)
                echo "$SCRIPT_NAME v$SCRIPT_VERSION"
                exit 0
                ;;
            --non-interactive)
                INTERACTIVE_MODE=false
                shift
                ;;
            --no-node)
                INSTALL_NODE=false
                shift
                ;;
            --no-build-tools)
                INSTALL_BUILD_TOOLS=false
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# Show help
show_help() {
    echo "$SCRIPT_NAME v$SCRIPT_VERSION"
    echo
    echo "A standardized installation script for RKLLM.js development environment."
    echo
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -v, --version           Show version information"
    echo "      --non-interactive   Run without prompts (auto-confirm)"
    echo "      --no-node           Skip Node.js installation"
    echo "      --no-build-tools    Skip C++ build tools installation"
    echo
    echo "Examples:"
    echo "  $0                      # Interactive installation (default)"
    echo "  $0 --non-interactive    # Automated installation"
    echo
    echo "This script installs:"
    echo "  • System tools (curl, wget, git)"
    echo "  • Node.js v16+ and npm"
    echo "  • C++ build essentials (gcc, cmake, pkg-config)"
    echo "  • RKLLMJS Test Framework (built-in, no external dependencies)"
    echo "  • Project dependencies via npm"
    echo
    echo "Supported platforms:"
    echo "  • Ubuntu/Debian (apt)"
    echo "  • RHEL/CentOS/Fedora (yum/dnf)"
    echo "  • Arch Linux (pacman)"
    echo "  • macOS (homebrew)"
    echo
    echo "For more information, see: README.md"
}

# Entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Handle command line arguments
    handle_arguments "$@"
    
    # Run main installation
    main
fi