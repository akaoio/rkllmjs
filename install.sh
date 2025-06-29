#!/bin/bash

# RKLLM.js Modular Installation Script
# Modern, responsive, and modular installation system

set -e  # Exit on any error

# Script metadata
readonly SCRIPT_VERSION="2.0.0"
readonly SCRIPT_NAME="RKLLM.js Development Setup"

# Get script directory and load module system
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
MODULE_LIB_DIR="$SCRIPT_DIR/scripts/lib"
MODULE_SYSTEM="$MODULE_LIB_DIR/module-loader.sh"

# Check if module system exists
if [[ ! -f "$MODULE_SYSTEM" ]]; then
    echo "❌ Module system not found: $MODULE_SYSTEM"
    echo "Please ensure the modular installation files are present."
    exit 1
fi

# Load module system
source "$MODULE_SYSTEM"

# Initialize module system
if ! init_module_system; then
    echo "❌ Failed to initialize module system"
    exit 1
fi

# Load required modules in dependency order
REQUIRED_MODULES=(
    "core"           # Core utilities and logging
    "ui-responsive"  # Responsive UI system
    "os-detection"   # OS detection and package management
    "runtime-node"   # Node.js installation
    "runtime-bun"    # Bun installation
    "runtime-deno"   # Deno installation
    "runtime-yarn"   # Yarn installation
    "build-tools"    # C++ build essentials
)

if ! load_modules "${REQUIRED_MODULES[@]}"; then
    echo "❌ Failed to load required modules"
    exit 1
fi

# Global installation state
declare -A RUNTIME_SELECTION
declare -A RUNTIME_INSTALLED

# Main installation function
main() {
    # Show header
    show_header
    
    # Check system requirements
    if ! check_system_requirements; then
        log_error "System requirements not met"
        show_system_requirements_help
        exit 1
    fi
    
    # Install required tools first
    if ! install_required_tools; then
        log_error "Failed to install required tools"
        exit 1
    fi
    
    # Show interactive runtime selection
    if ! select_runtimes_interactive; then
        log_info "Setup cancelled by user"
        exit 0
    fi
    
    # Install selected runtimes
    install_selected_runtimes
    
    # Install build essentials
    if ! install_build_essentials; then
        log_warning "Build essentials installation failed - some features may not work"
    fi
    
    # Configure environments
    configure_runtime_environments
    
    # Show completion summary
    show_completion_summary
}

# Interactive runtime selection with responsive UI
select_runtimes_interactive() {
    log_step "Runtime Selection"
    
    # Prepare runtime options for dialog
    local runtime_options=(
        "nodejs" "Node.js (Required - Primary runtime)" "ON"
        "bun" "Bun (Optional - Fast runtime & package manager)" "OFF"
        "deno" "Deno (Optional - Secure TypeScript runtime)" "OFF"
        "yarn" "Yarn (Optional - Alternative package manager)" "OFF"
    )
    
    # Show selection dialog
    local choices
    choices=$(show_responsive_checklist \
        "RKLLM.js Runtime Selection" \
        "Select JavaScript runtimes to install:\n\nNode.js is required as the primary runtime.\nOther runtimes are optional but recommended for development." \
        "${runtime_options[@]}")
    
    local dialog_result=$?
    
    # Handle dialog result
    case $dialog_result in
        0)
            # User made selections
            parse_runtime_selections "$choices"
            ;;
        1)
            # User cancelled
            return 1
            ;;
        2)
            # Terminal too small - use fallback
            select_runtimes_fallback
            ;;
        *)
            log_error "Unexpected dialog result: $dialog_result"
            return 1
            ;;
    esac
    
    # Ensure Node.js is always selected
    if [[ "${RUNTIME_SELECTION[nodejs]:-false}" != "true" ]]; then
        log_warning "Node.js is required as the primary runtime. Enabling Node.js installation."
        RUNTIME_SELECTION[nodejs]=true
    fi
    
    # Show selected runtimes
    show_runtime_selections
    
    # Final confirmation
    if show_responsive_yesno "Confirm Installation" "Proceed with the installation of selected runtimes?"; then
        return 0
    else
        return 1
    fi
}

# Fallback runtime selection for small terminals
select_runtimes_fallback() {
    log_info "Using fallback selection method for small terminal"
    
    echo "Available runtimes:"
    echo "  1. Node.js (Required)"
    echo "  2. Bun (Optional)"
    echo "  3. Deno (Optional)"
    echo "  4. Yarn (Optional)"
    echo
    
    # Set defaults
    RUNTIME_SELECTION[nodejs]=true
    RUNTIME_SELECTION[bun]=false
    RUNTIME_SELECTION[deno]=false
    RUNTIME_SELECTION[yarn]=false
    
    # Ask for each optional runtime
    for runtime in bun deno yarn; do
        local runtime_name
        case $runtime in
            bun) runtime_name="Bun" ;;
            deno) runtime_name="Deno" ;;
            yarn) runtime_name="Yarn" ;;
        esac
        
        echo -n "Install $runtime_name? (y/N): "
        read -r response
        case $response in
            [Yy]*) RUNTIME_SELECTION[$runtime]=true ;;
            *) RUNTIME_SELECTION[$runtime]=false ;;
        esac
    done
}

# Parse runtime selections from dialog
parse_runtime_selections() {
    local choices="$1"
    
    # Initialize all to false
    RUNTIME_SELECTION[nodejs]=false
    RUNTIME_SELECTION[bun]=false
    RUNTIME_SELECTION[deno]=false
    RUNTIME_SELECTION[yarn]=false
    
    # Parse selections
    for choice in $choices; do
        case $choice in
            '"nodejs"'|'nodejs') RUNTIME_SELECTION[nodejs]=true ;;
            '"bun"'|'bun') RUNTIME_SELECTION[bun]=true ;;
            '"deno"'|'deno') RUNTIME_SELECTION[deno]=true ;;
            '"yarn"'|'yarn') RUNTIME_SELECTION[yarn]=true ;;
        esac
    done
}

# Show selected runtimes
show_runtime_selections() {
    echo
    log_info "Selected runtimes:"
    [[ "${RUNTIME_SELECTION[nodejs]}" == "true" ]] && echo "  ✅ Node.js (Primary runtime)"
    [[ "${RUNTIME_SELECTION[bun]}" == "true" ]] && echo "  ✅ Bun (Fast runtime)"
    [[ "${RUNTIME_SELECTION[deno]}" == "true" ]] && echo "  ✅ Deno (Secure runtime)"
    [[ "${RUNTIME_SELECTION[yarn]}" == "true" ]] && echo "  ✅ Yarn (Package manager)"
    echo
}

# Install selected runtimes
install_selected_runtimes() {
    log_step "Installing selected runtimes..."
    
    # Install Node.js (required)
    if [[ "${RUNTIME_SELECTION[nodejs]}" == "true" ]]; then
        if install_nodejs; then
            RUNTIME_INSTALLED[nodejs]=true
            log_success "Node.js installation completed"
        else
            log_error "Node.js installation failed"
            exit 1
        fi
    fi
    
    # Install Bun (optional)
    if [[ "${RUNTIME_SELECTION[bun]}" == "true" ]]; then
        if install_bun; then
            RUNTIME_INSTALLED[bun]=true
            log_success "Bun installation completed"
        else
            log_warning "Bun installation failed - continuing with other runtimes"
            RUNTIME_INSTALLED[bun]=false
        fi
    fi
    
    # Install Deno (optional)
    if [[ "${RUNTIME_SELECTION[deno]}" == "true" ]]; then
        if install_deno; then
            RUNTIME_INSTALLED[deno]=true
            log_success "Deno installation completed"
        else
            log_warning "Deno installation failed - continuing with other runtimes"
            RUNTIME_INSTALLED[deno]=false
        fi
    fi
    
    # Install Yarn (optional)
    if [[ "${RUNTIME_SELECTION[yarn]}" == "true" ]]; then
        if install_yarn; then
            RUNTIME_INSTALLED[yarn]=true
            log_success "Yarn installation completed"
        else
            log_warning "Yarn installation failed - continuing with setup"
            RUNTIME_INSTALLED[yarn]=false
        fi
    fi
}

# Configure runtime environments
configure_runtime_environments() {
    log_step "Configuring runtime environments..."
    
    # Configure Node.js environment
    if [[ "${RUNTIME_INSTALLED[nodejs]}" == "true" ]]; then
        configure_nodejs
    fi
    
    # Configure Bun environment
    if [[ "${RUNTIME_INSTALLED[bun]}" == "true" ]]; then
        configure_bun
    fi
    
    # Configure Deno environment
    if [[ "${RUNTIME_INSTALLED[deno]}" == "true" ]]; then
        configure_deno
    fi
    
    # Configure Yarn environment
    if [[ "${RUNTIME_INSTALLED[yarn]}" == "true" ]]; then
        configure_yarn
    fi
    
    # Configure build environment
    configure_build_environment
}

# Show system requirements help
show_system_requirements_help() {
    echo
    echo "📋 System Requirements:"
    echo "  • Supported OS: Ubuntu, Debian, RHEL/CentOS, Arch Linux, macOS"
    echo "  • Minimum 1GB RAM (recommended: 2GB+)"
    echo "  • Minimum 1GB free disk space"
    echo "  • Internet connection for downloads"
    echo "  • Terminal size: minimum 80x24 characters"
    echo
    echo "💡 Tips:"
    echo "  • Ensure your package manager is working"
    echo "  • Run 'sudo apt update' (Ubuntu) or equivalent before running this script"
    echo "  • Close other applications to free up memory"
    echo
}

# Show completion summary
show_completion_summary() {
    echo
    log_success "🎉 RKLLM.js Development Setup Complete!"
    echo
    
    # Show installed runtimes
    log_info "✅ Installed runtimes:"
    if [[ "${RUNTIME_INSTALLED[nodejs]}" == "true" ]]; then
        show_nodejs_info | sed 's/^/  /'
    fi
    if [[ "${RUNTIME_INSTALLED[bun]}" == "true" ]]; then
        show_bun_info | sed 's/^/  /'
    fi
    if [[ "${RUNTIME_INSTALLED[deno]}" == "true" ]]; then
        show_deno_info | sed 's/^/  /'
    fi
    if [[ "${RUNTIME_INSTALLED[yarn]}" == "true" ]]; then
        show_yarn_info | sed 's/^/  /'
    fi
    
    echo
    show_build_info | sed 's/^/  /'
    
    echo
    log_info "🎯 Next steps:"
    echo "  1. Restart your terminal or run: source ~/.bashrc"
    echo "  2. Navigate to your RKLLM.js project directory"
    echo "  3. Install project dependencies: npm install"
    echo "  4. Run tests: npm test"
    echo "  5. Start development: npm run dev"
    echo
    
    log_info "📖 Documentation:"
    echo "  • Project README: README.md"
    echo "  • Development rules: RULES.md"
    echo "  • Module documentation: scripts/modules/*/README.md"
    echo
    
    echo "⚠️  REMINDER: This setup is for DEVELOPMENT ONLY!"
}

# Handle script arguments
handle_arguments() {
    case "${1:-}" in
        --help|-h)
            show_help
            exit 0
            ;;
        --version|-v)
            echo "$SCRIPT_NAME v$SCRIPT_VERSION"
            exit 0
            ;;
        --test)
            echo "Running module system test..."
            scripts/test-modules.sh
            exit $?
            ;;
        --responsive-demo)
            echo "Demonstrating responsive UI behavior..."
            test_responsive_behavior
            exit 0
            ;;
        --non-interactive)
            log_info "Non-interactive mode - installing Node.js only"
            RUNTIME_SELECTION[nodejs]=true
            RUNTIME_SELECTION[bun]=false
            RUNTIME_SELECTION[deno]=false
            RUNTIME_SELECTION[yarn]=false
            ;;
        *)
            # Interactive mode (default)
            ;;
    esac
}

# Show help
show_help() {
    echo "$SCRIPT_NAME v$SCRIPT_VERSION"
    echo
    echo "A modern, modular installation system for RKLLM.js development environment."
    echo
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -v, --version           Show version information"
    echo "      --test              Test the module system"
    echo "      --responsive-demo   Demonstrate responsive UI behavior"
    echo "      --non-interactive   Install Node.js only (no prompts)"
    echo
    echo "Interactive mode (default):"
    echo "  • Responsive UI that adapts to terminal size"
    echo "  • Interactive runtime selection"
    echo "  • Progress feedback and error handling"
    echo
    echo "Supported runtimes:"
    echo "  • Node.js (required)"
    echo "  • Bun (optional)"
    echo "  • Deno (optional)"
    echo "  • Yarn (optional)"
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