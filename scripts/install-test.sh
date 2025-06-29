#!/bin/bash

# RKLLM.js Modular Installation Script - Entry Point
# This is the new modular version that loads required modules

set -e  # Exit on any error

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load module system
source "$SCRIPT_DIR/lib/module-loader.sh"

# Initialize module system
if ! init_module_system; then
    echo "❌ Failed to initialize module system"
    exit 1
fi

# Load core modules in dependency order
if ! load_modules core ui-responsive os-detection runtime-node; then
    echo "❌ Failed to load required modules"
    exit 1
fi

# Main installation function
main() {
    # Show header
    show_header
    
    # Check system requirements
    if ! check_system_requirements; then
        log_error "System requirements not met"
        exit 1
    fi
    
    # Install required tools
    if ! install_required_tools; then
        log_error "Failed to install required tools"
        exit 1
    fi
    
    # Show confirmation dialog
    local continue_setup
    if show_responsive_yesno "RKLLM.js Setup" "Do you want to continue with interactive setup?\n\nThis script will:\n• Detect your OS and install packages\n• Install JavaScript runtimes\n• Setup C++ build essentials\n• Configure RKLLM libraries\n• Download the standard model"; then
        log_success "Proceeding with setup..."
    else
        log_info "Setup cancelled by user"
        exit 0
    fi
    
    # Install Node.js (required)
    if ! install_nodejs; then
        log_error "Failed to install Node.js (required)"
        exit 1
    fi
    
    # Configure Node.js environment
    configure_nodejs
    
    # Show completion message
    show_completion_message
}

# Show completion message
show_completion_message() {
    echo
    log_success "RKLLM.js Basic Setup Complete!"
    echo
    log_info "Installed components:"
    show_nodejs_info
    echo
    log_info "Next steps:"
    echo "  1. Restart your terminal or run: source ~/.bashrc"
    echo "  2. Complete setup by running the full installer"
    echo "  3. Start developing with RKLLM.js!"
    echo
}

# Run main function
main "$@"