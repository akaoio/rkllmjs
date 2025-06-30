#!/bin/bash

# Simple test script to debug package installation

set -e

echo "Testing package installation logic..."

# Source the modules
source scripts/modules/core.sh
source scripts/modules/os-detection.sh

echo "Modules loaded successfully"

# Test log functions
log_info "Testing log_info function"
log_success "Testing log_success function" 
log_warning "Testing log_warning function"
log_error "Testing log_error function"

echo "Log functions work"

# Test package manager detection
detect_os_and_package_manager
echo "OS: $OS"
echo "Package Manager: $PACKAGE_MANAGER"

# Test installing a simple package
echo "Testing package installation with 'curl'..."
if install_packages "curl"; then
    echo "Package installation test successful"
else
    echo "Package installation test failed"
fi
