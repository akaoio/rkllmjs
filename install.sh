#!/bin/bash

set -e  # Exit on any error

echo "=== RKLLM.js Development Setup Script ==="
echo ""
echo "⚠️  WARNING: This script is intended for DEVELOPMENT ENVIRONMENT ONLY!"
echo "⚠️  Do NOT run this script on production servers or systems!"
echo ""
echo "This script will:"
echo "  • Install system dependencies (Node.js, npm, git, build tools)"
echo "  • Install JavaScript runtimes (Bun, Deno, Yarn)" 
echo "  • Download and setup RKLLM native libraries"
echo "  • Modify your shell profile (~/.bashrc, ~/.zshrc)"
echo ""
echo "Are you sure you want to continue? This is a development setup."
echo ""

while true; do
    read -p "Do you want to continue? (Y/N): " yn
    case $yn in
        [Yy]* ) 
            echo "✓ Proceeding with development setup..."
            break
            ;;
        [Nn]* ) 
            echo "Setup cancelled by user."
            echo "To run this script later, execute: bash install.sh"
            exit 0
            ;;
        * ) 
            echo "Please answer Y (yes) or N (no)."
            ;;
    esac
done

echo ""
echo "Setting up RKLLM.js development environment..."

# Check and install dependencies
echo "Checking and installing system dependencies..."

# Update package list
sudo apt update

# Array of packages to check and install
PACKAGES=("nodejs" "npm" "git" "build-essential" "cmake" "unzip")
MISSING_PACKAGES=()

# Check which packages are missing
for package in "${PACKAGES[@]}"; do
    if ! dpkg -l | grep -q "^ii  $package "; then
        echo "Package $package is not installed"
        MISSING_PACKAGES+=("$package")
    else
        echo "✓ Package $package is already installed"
    fi
done

# Install missing packages
if [ ${#MISSING_PACKAGES[@]} -gt 0 ]; then
    echo "Installing missing packages: ${MISSING_PACKAGES[*]}"
    sudo apt install -y "${MISSING_PACKAGES[@]}"
else
    echo "All required packages are already installed"
fi

# Check and install JavaScript runtimes (Bun, Node.js, Deno)
echo "Checking for JavaScript runtime installations..."

# Install Bun
echo "Checking for Bun installation..."
if ! command -v bun &> /dev/null; then
    echo "Bun is not installed. Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    
    # Add Bun to PATH for current session
    export PATH="$HOME/.bun/bin:$PATH"
    
    # Add Bun to shell profile for future sessions
    if [ -f ~/.bashrc ]; then
        echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
    fi
    if [ -f ~/.zshrc ]; then
        echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.zshrc
    fi
    
    echo "✓ Bun installed successfully"
else
    echo "✓ Bun is already installed"
fi

# Install Deno
echo "Checking for Deno installation..."
if ! command -v deno &> /dev/null; then
    echo "Deno is not installed. Installing Deno..."
    curl -fsSL https://deno.land/install.sh | sh
    
    # Add Deno to PATH for current session
    export PATH="$HOME/.deno/bin:$PATH"
    
    # Add Deno to shell profile for future sessions
    if [ -f ~/.bashrc ]; then
        echo 'export PATH="$HOME/.deno/bin:$PATH"' >> ~/.bashrc
    fi
    if [ -f ~/.zshrc ]; then
        echo 'export PATH="$HOME/.deno/bin:$PATH"' >> ~/.zshrc
    fi
    
    echo "✓ Deno installed successfully"
else
    echo "✓ Deno is already installed"
fi

# Node.js is already covered in the system packages section above

# Install Yarn package manager
echo "Checking for Yarn installation..."
if ! command -v yarn &> /dev/null; then
    echo "Yarn is not installed. Installing Yarn..."
    
    # Try to install Yarn via official installer (recommended method)
    if curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add - 2>/dev/null; then
        echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
        sudo apt update
        sudo apt install -y yarn
        echo "✓ Yarn installed via official repository"
    else
        # Fallback: Install via npm with sudo
        echo "Fallback: Installing Yarn via npm (requires sudo)..."
        sudo npm install -g yarn
        echo "✓ Yarn installed via npm"
    fi
else
    echo "✓ Yarn is already installed"
fi

# Verify critical commands are available
echo "Verifying runtime installations..."

if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not available"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "Error: npm is not available"
    exit 1
fi

if ! command -v yarn &> /dev/null; then
    echo "Error: Yarn is not available"
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo "Error: git is not available"
    exit 1
fi

if ! command -v bun &> /dev/null; then
    echo "Error: Bun is not available"
    exit 1
fi

if ! command -v deno &> /dev/null; then
    echo "Error: Deno is not available"
    exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo "✓ npm version: $(npm --version)"
echo "✓ Yarn version: $(yarn --version)"
echo "✓ git version: $(git --version)"
echo "✓ Bun version: $(bun --version)"
echo "✓ Deno version: $(deno --version | head -n1)"
echo ""
echo "✓ All JavaScript runtimes and package managers are installed and ready!"
echo "  - Node.js + npm: Traditional Node.js ecosystem"
echo "  - Yarn: Alternative package manager for Node.js"
echo "  - Bun: Fast all-in-one JavaScript runtime and package manager"
echo "  - Deno: Secure runtime for JavaScript and TypeScript"

# Check if libs/rkllm exists and has required files
LIBS_DIR="./libs/rkllm"
REQUIRED_DIRS=("aarch64" "armhf" "include")
MISSING_DIRS=()

echo "Checking RKLLM library structure..."

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
    echo "Missing RKLLM library components. Setting up..."
    
    # Clone rknn-llm repository if it doesn't exist
    if [ ! -d "rknn-llm" ]; then
        echo "Cloning rknn-llm repository..."
        git clone https://github.com/airockchip/rknn-llm
    else
        echo "rknn-llm repository already exists"
    fi
    
    # Create libs/rkllm directory if it doesn't exist
    mkdir -p "$LIBS_DIR"
    
    # Copy librkllm_api contents to libs/rkllm
    LIBRKLLM_API_DIR="./rknn-llm/rkllm-runtime/Linux/librkllm_api"
    
    if [ -d "$LIBRKLLM_API_DIR" ]; then
        echo "Copying RKLLM API files from $LIBRKLLM_API_DIR to $LIBS_DIR..."
        cp -r "$LIBRKLLM_API_DIR"/* "$LIBS_DIR/"
        echo "RKLLM library setup completed"
    else
        echo "Error: librkllm_api directory not found in $LIBRKLLM_API_DIR"
        echo "Please check the rknn-llm repository structure"
        exit 1
    fi
else
    echo "RKLLM library structure is complete"
fi

# Verify the setup
echo "Verifying RKLLM library setup..."
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$LIBS_DIR/$dir" ]; then
        echo "✓ $LIBS_DIR/$dir exists"
    else
        echo "✗ $LIBS_DIR/$dir missing"
        exit 1
    fi
done

# Check for key files
if [ -f "$LIBS_DIR/include/rkllm.h" ]; then
    echo "✓ rkllm.h header file found"
else
    echo "✗ rkllm.h header file missing"
    exit 1
fi

if [ -f "$LIBS_DIR/aarch64/librkllmrt.so" ]; then
    echo "✓ aarch64 library found"
else
    echo "✗ aarch64 library missing"
fi

if [ -f "$LIBS_DIR/armhf/librkllmrt.so" ]; then
    echo "✓ armhf library found"
else
    echo "✗ armhf library missing"
fi

# Cleanup: Remove rknn-llm directory after successful setup
if [ -d "rknn-llm" ]; then
    echo "Cleaning up: Removing rknn-llm directory..."
    rm -rf rknn-llm
    echo "✓ rknn-llm directory removed"
fi

echo ""
echo "=== Development Setup Complete ==="
echo "✅ Dependencies installed and RKLLM libraries are ready!"
echo "✅ Development environment is configured for RKLLM.js"
echo ""
echo "⚠️  REMINDER: This setup is for DEVELOPMENT ONLY!"
echo "⚠️  For production deployment, use proper package managers and"
echo "⚠️  containerization instead of running this script."
echo ""
echo "Next steps:"
echo "  1. Restart your terminal or run: source ~/.bashrc"
echo "  2. Run: bun install  (or npm install / yarn install)"
echo "  3. Run: bun run build  (or npm run build)"
echo "  4. Start developing with RKLLM.js!"
echo ""
echo "Note: rknn-llm temporary directory has been cleaned up."