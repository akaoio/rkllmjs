#!/bin/bash

set -e  # Exit on any error

echo "=== RKLLM.js Setup Script ==="
echo "Setting up dependencies and RKLLM libraries..."

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

# Check and install Bun (default runtime for this project)
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
    
    echo "Bun installed successfully"
else
    echo "✓ Bun is already installed"
fi

# Verify critical commands are available
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not available"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "Error: npm is not available"
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

echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo "git version: $(git --version)"
echo "Bun version: $(bun --version)"
echo ""
echo "✓ Bun is set as the default runtime for this project"

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

echo ""
echo "=== Setup Complete ==="
echo "Dependencies installed and RKLLM libraries are ready!"