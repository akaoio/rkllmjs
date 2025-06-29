#!/bin/bash

set -e  # Exit on any error

echo "=== RKLLM.js Interactive Development Setup ==="
echo ""
echo "⚠️  WARNING: This script is intended for DEVELOPMENT ENVIRONMENT ONLY!"
echo "⚠️  Do NOT run this script on production servers or systems!"
echo ""

# Detect OS for cross-platform support
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v apt &> /dev/null; then
            echo "ubuntu"
        elif command -v yum &> /dev/null; then
            echo "rhel"
        elif command -v pacman &> /dev/null; then
            echo "arch"
        else
            echo "linux"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    else
        echo "unknown"
    fi
}

OS=$(detect_os)
echo "🖥️  Detected OS: $OS"

# Function to install packages based on OS
install_packages() {
    local packages=("$@")
    
    case $OS in
        "ubuntu")
            sudo apt update
            sudo apt install -y "${packages[@]}"
            ;;
        "rhel")
            sudo yum install -y "${packages[@]}"
            ;;
        "arch")
            sudo pacman -S --noconfirm "${packages[@]}"
            ;;
        "macos")
            if command -v brew &> /dev/null; then
                brew install "${packages[@]}"
            else
                echo "❌ Homebrew not found. Please install Homebrew first."
                exit 1
            fi
            ;;
        *)
            echo "❌ Unsupported OS. Please install packages manually:"
            echo "   ${packages[*]}"
            exit 1
            ;;
    esac
}

# Check for required tools
check_required_tools() {
    local missing_tools=()
    
    if ! command -v curl &> /dev/null; then
        missing_tools+=("curl")
    fi
    
    if ! command -v git &> /dev/null; then
        missing_tools+=("git")
    fi
    
    if ! command -v unzip &> /dev/null; then
        missing_tools+=("unzip")
    fi
    
    # Check for whiptail/dialog for interactive prompts
    if ! command -v whiptail &> /dev/null && ! command -v dialog &> /dev/null; then
        case $OS in
            "ubuntu")
                missing_tools+=("whiptail")
                ;;
            "rhel")
                missing_tools+=("dialog")
                ;;
            "arch")
                missing_tools+=("dialog")
                ;;
            "macos")
                missing_tools+=("dialog")
                ;;
        esac
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        echo "🔧 Installing required tools: ${missing_tools[*]}"
        install_packages "${missing_tools[@]}"
    fi
}

# Interactive runtime selection using whiptail or dialog
select_runtimes() {
    local DIALOG_CMD=""
    if command -v whiptail &> /dev/null; then
        DIALOG_CMD="whiptail"
    elif command -v dialog &> /dev/null; then
        DIALOG_CMD="dialog"
    else
        echo "❌ No dialog tool available. Installing all runtimes by default."
        INSTALL_NODEJS=true
        INSTALL_BUN=false
        INSTALL_DENO=false
        INSTALL_YARN=false
        return
    fi
    
    echo "🎯 Interactive Runtime Selection"
    echo ""
    
    # Create checklist for runtime selection
    if [ "$DIALOG_CMD" = "whiptail" ]; then
        CHOICES=$(whiptail --title "RKLLM.js Runtime Selection" \
            --checklist "Select JavaScript runtimes to install (Node.js is required):" \
            15 60 4 \
            "nodejs" "Node.js (Required - Primary runtime)" ON \
            "bun" "Bun (Optional - Fast runtime & package manager)" OFF \
            "deno" "Deno (Optional - Secure TypeScript runtime)" OFF \
            "yarn" "Yarn (Optional - Alternative package manager)" OFF \
            3>&1 1>&2 2>&3)
    else
        CHOICES=$(dialog --stdout --title "RKLLM.js Runtime Selection" \
            --checklist "Select JavaScript runtimes to install (Node.js is required):" \
            15 60 4 \
            "nodejs" "Node.js (Required - Primary runtime)" on \
            "bun" "Bun (Optional - Fast runtime & package manager)" off \
            "deno" "Deno (Optional - Secure TypeScript runtime)" off \
            "yarn" "Yarn (Optional - Alternative package manager)" off)
    fi
    
    # Check if user cancelled
    if [ $? -ne 0 ]; then
        echo "❌ Setup cancelled by user."
        exit 0
    fi
    
    # Parse selections
    INSTALL_NODEJS=false
    INSTALL_BUN=false
    INSTALL_DENO=false
    INSTALL_YARN=false
    
    for choice in $CHOICES; do
        case $choice in
            '"nodejs"'|'nodejs')
                INSTALL_NODEJS=true
                ;;
            '"bun"'|'bun')
                INSTALL_BUN=true
                ;;
            '"deno"'|'deno')
                INSTALL_DENO=true
                ;;
            '"yarn"'|'yarn')
                INSTALL_YARN=true
                ;;
        esac
    done
    
    # Ensure Node.js is always installed (required)
    if [ "$INSTALL_NODEJS" = false ]; then
        echo "⚠️  Node.js is required as the primary runtime. Enabling Node.js installation."
        INSTALL_NODEJS=true
    fi
    
    echo ""
    echo "📋 Selected runtimes:"
    echo "   ✅ Node.js (Primary runtime)"
    [ "$INSTALL_BUN" = true ] && echo "   ✅ Bun (Fast runtime)"
    [ "$INSTALL_DENO" = true ] && echo "   ✅ Deno (Secure runtime)"  
    [ "$INSTALL_YARN" = true ] && echo "   ✅ Yarn (Package manager)"
    echo ""
}

# Install build essentials for C++ compilation
install_build_essentials() {
    echo "🔨 Installing C++ build essentials..."
    
    case $OS in
        "ubuntu")
            local build_packages=("build-essential" "cmake" "make" "g++" "unzip")
            install_packages "${build_packages[@]}"
            ;;
        "rhel")
            local build_packages=("gcc-c++" "cmake" "make" "unzip")
            install_packages "${build_packages[@]}"
            ;;
        "arch")
            local build_packages=("base-devel" "cmake" "unzip")
            install_packages "${build_packages[@]}"
            ;;
        "macos")
            # Check if Xcode command line tools are installed
            if ! xcode-select -p &> /dev/null; then
                echo "Installing Xcode command line tools..."
                xcode-select --install
                echo "⚠️  Please complete Xcode installation and run this script again."
                exit 1
            fi
            local build_packages=("cmake" "unzip")
            install_packages "${build_packages[@]}"
            ;;
        *)
            echo "❌ Please install C++ build tools manually for your OS"
            ;;
    esac
    
    echo "✅ Build essentials installed"
}

# Install Node.js
install_nodejs() {
    if ! command -v node &> /dev/null; then
        echo "📦 Installing Node.js..."
        case $OS in
            "ubuntu")
                # Install Node.js 18+ from NodeSource repository
                curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
                sudo apt-get install -y nodejs
                ;;
            "macos")
                install_packages "node"
                ;;
            *)
                local node_packages=("nodejs" "npm")
                install_packages "${node_packages[@]}"
                ;;
        esac
        echo "✅ Node.js installed"
    else
        echo "✅ Node.js already installed: $(node --version)"
    fi
}

# Install Bun
install_bun() {
    if ! command -v bun &> /dev/null; then
        echo "📦 Installing Bun..."
        curl -fsSL https://bun.sh/install | bash
        
        # Add Bun to PATH
        export PATH="$HOME/.bun/bin:$PATH"
        
        # Add to shell profiles
        for profile in ~/.bashrc ~/.zshrc ~/.profile; do
            if [ -f "$profile" ]; then
                if ! grep -q "/.bun/bin" "$profile"; then
                    echo 'export PATH="$HOME/.bun/bin:$PATH"' >> "$profile"
                fi
            fi
        done
        
        echo "✅ Bun installed"
    else
        echo "✅ Bun already installed: v$(bun --version)"
    fi
}

# Install Deno  
install_deno() {
    if ! command -v deno &> /dev/null; then
        echo "📦 Installing Deno..."
        curl -fsSL https://deno.land/install.sh | sh
        
        # Add Deno to PATH
        export PATH="$HOME/.deno/bin:$PATH"
        
        # Add to shell profiles
        for profile in ~/.bashrc ~/.zshrc ~/.profile; do
            if [ -f "$profile" ]; then
                if ! grep -q "/.deno/bin" "$profile"; then
                    echo 'export PATH="$HOME/.deno/bin:$PATH"' >> "$profile"
                fi
            fi
        done
        
        echo "✅ Deno installed"
    else
        echo "✅ Deno already installed: $(deno --version | head -n1)"
    fi
}

# Install Yarn
install_yarn() {
    if ! command -v yarn &> /dev/null; then
        echo "📦 Installing Yarn..."
        case $OS in
            "ubuntu")
                curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
                echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
                sudo apt update
                sudo apt install -y yarn
                ;;
            "macos")
                install_packages "yarn"
                ;;
            *)
                # Fallback to npm installation
                npm install -g yarn
                ;;
        esac
        echo "✅ Yarn installed"
    else
        echo "✅ Yarn already installed: $(yarn --version)"
    fi
}

# Setup RKLLM native libraries
setup_rkllm_libs() {
    local LIBS_DIR="./libs/rkllm"
    local REQUIRED_DIRS=("aarch64" "armhf" "include")
    local MISSING_DIRS=()

    echo "🔍 Checking RKLLM library structure..."

    if [ ! -d "$LIBS_DIR" ]; then
        echo "libs/rkllm directory not found"
        MISSING_DIRS=("${REQUIRED_DIRS[@]}")
    else
        for dir in "${REQUIRED_DIRS[@]}"; do
            if [ ! -d "$LIBS_DIR/$dir" ]; then
                echo "Missing directory: $LIBS_DIR/$dir"
                MISSING_DIRS+=("$dir")
            fi
        done
    fi

    # If any required directories are missing, clone and setup
    if [ ${#MISSING_DIRS[@]} -gt 0 ]; then
        echo "🔧 Setting up RKLLM native libraries..."
        
        # Clone rknn-llm repository if it doesn't exist
        if [ ! -d "rknn-llm" ]; then
            echo "📥 Cloning rknn-llm repository..."
            git clone https://github.com/airockchip/rknn-llm
        fi
        
        # Create libs/rkllm directory
        mkdir -p "$LIBS_DIR"
        
        # Copy librkllm_api contents
        local LIBRKLLM_API_DIR="./rknn-llm/rkllm-runtime/Linux/librkllm_api"
        
        if [ -d "$LIBRKLLM_API_DIR" ]; then
            echo "📋 Copying RKLLM API files..."
            cp -r "$LIBRKLLM_API_DIR"/* "$LIBS_DIR/"
            echo "✅ RKLLM libraries setup completed"
        else
            echo "❌ Error: librkllm_api directory not found"
            exit 1
        fi
        
        # Cleanup
        echo "🧹 Cleaning up temporary files..."
        rm -rf rknn-llm
    else
        echo "✅ RKLLM library structure is complete"
    fi
}

# Download standard model using CLI
download_standard_model() {
    echo "🤖 Setting up standard RKLLM model..."
    
    # Build the project first
    echo "🔨 Building project..."
    npm install
    npm run build
    
    # Download the standard model
    echo "📥 Downloading standard model (dulimov/Qwen2.5-VL-7B-Instruct-rk3588-1.2.1)..."
    echo "   Model file: Qwen2.5-VL-7B-Instruct-rk3588-w8a8-opt-1-hybrid-ratio-0.5.rkllm"
    
    # Use the CLI to pull the model
    npm run cli pull dulimov/Qwen2.5-VL-7B-Instruct-rk3588-1.2.1 Qwen2.5-VL-7B-Instruct-rk3588-w8a8-opt-1-hybrid-ratio-0.5.rkllm
    
    echo "✅ Standard model setup completed"
}

# Main installation flow
main() {
    echo "🚀 Starting RKLLM.js interactive setup..."
    echo ""
    
    # Check for required tools first
    check_required_tools
    
    # Interactive runtime selection
    select_runtimes
    
    # Install build essentials
    install_build_essentials
    
    # Install selected runtimes
    echo "📦 Installing selected runtimes..."
    
    if [ "$INSTALL_NODEJS" = true ]; then
        install_nodejs
    fi
    
    if [ "$INSTALL_BUN" = true ]; then
        install_bun
    fi
    
    if [ "$INSTALL_DENO" = true ]; then
        install_deno
    fi
    
    if [ "$INSTALL_YARN" = true ]; then
        install_yarn
    fi
    
    # Setup RKLLM libraries
    setup_rkllm_libs
    
    # Download standard model
    download_standard_model
    
    echo ""
    echo "🎉 RKLLM.js Development Setup Complete!"
    echo ""
    echo "✅ Installed runtimes:"
    [ "$INSTALL_NODEJS" = true ] && echo "   🟢 Node.js: $(node --version)"
    [ "$INSTALL_BUN" = true ] && [ -x "$(command -v bun)" ] && echo "   🟠 Bun: v$(bun --version)"
    [ "$INSTALL_DENO" = true ] && [ -x "$(command -v deno)" ] && echo "   🔵 Deno: $(deno --version | head -n1)"
    [ "$INSTALL_YARN" = true ] && [ -x "$(command -v yarn)" ] && echo "   🟡 Yarn: $(yarn --version)"
    echo ""
    echo "✅ Standard model: dulimov/Qwen2.5-VL-7B-Instruct-rk3588-1.2.1"
    echo "✅ C++ build essentials configured"
    echo ""
    echo "🎯 Next steps:"
    echo "   1. Restart your terminal or run: source ~/.bashrc"  
    echo "   2. Start developing with RKLLM.js!"
    echo "   3. List models: npm run cli list"
    echo "   4. Run tests: npm test"
    echo ""
    echo "⚠️  REMINDER: This setup is for DEVELOPMENT ONLY!"
}

# Confirmation prompt
echo "This script will:"
echo "  • Detect your OS and install appropriate packages"
echo "  • Let you choose which JavaScript runtimes to install"
echo "  • Install C++ build essentials for your platform"
echo "  • Setup RKLLM native libraries"
echo "  • Download the standard RKLLM model"
echo "  • Modify your shell profile for PATH updates"
echo ""

while true; do
    read -p "Do you want to continue with interactive setup? (Y/N): " yn
    case $yn in
        [Yy]* ) 
            echo "✅ Proceeding with interactive setup..."
            main
            break
            ;;
        [Nn]* ) 
            echo "❌ Setup cancelled by user."
            echo "To run this script later, execute: bash install.sh"
            exit 0
            ;;
        * ) 
            echo "Please answer Y (yes) or N (no)."
            ;;
    esac
done