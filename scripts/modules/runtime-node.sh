#!/bin/bash

# RKLLM.js Node.js Runtime Installation Module
# Handles Node.js installation across different platforms

# Node.js version requirements
readonly NODEJS_MIN_VERSION="16.0.0"
readonly NODEJS_RECOMMENDED_VERSION="20.0.0"

# Check if Node.js is installed and get version
get_nodejs_version() {
    if command -v node &> /dev/null; then
        node --version | sed 's/^v//'
    else
        echo ""
    fi
}

# Check if Node.js version meets requirements
check_nodejs_version() {
    local current_version="$1"
    local min_version="${2:-$NODEJS_MIN_VERSION}"
    
    if [[ -z "$current_version" ]]; then
        return 1
    fi
    
    version_compare "$current_version" ">=" "$min_version"
}

# Detect current Node.js installation
detect_nodejs() {
    local current_version
    current_version=$(get_nodejs_version)
    
    if [[ -n "$current_version" ]]; then
        log_info "Node.js detected: v$current_version"
        
        if check_nodejs_version "$current_version" "$NODEJS_MIN_VERSION"; then
            log_success "Node.js version meets requirements (>= $NODEJS_MIN_VERSION)"
            return 0
        else
            log_warning "Node.js version $current_version is below minimum required: $NODEJS_MIN_VERSION"
            return 1
        fi
    else
        log_info "Node.js not found"
        return 1
    fi
}

# Install Node.js via NodeSource repository (Ubuntu/Debian)
install_nodejs_nodesource() {
    local version="${1:-20}"  # Default to Node 20 LTS
    
    log_install "Installing Node.js v$version via NodeSource repository"
    
    # Download and install the NodeSource repository
    if ! curl -fsSL https://deb.nodesource.com/setup_${version}.x | sudo -E bash -; then
        log_error "Failed to add NodeSource repository"
        return 1
    fi
    
    # Install Node.js
    if ! install_packages nodejs; then
        log_error "Failed to install Node.js from NodeSource"
        return 1
    fi
    
    log_success "Node.js installed via NodeSource"
    return 0
}

# Install Node.js via package manager
install_nodejs_package_manager() {
    log_install "Installing Node.js via system package manager"
    
    case "$OS" in
        ubuntu|debian)
            # Try to install recent version
            if ! install_packages nodejs npm; then
                log_error "Failed to install Node.js via apt"
                return 1
            fi
            ;;
        rhel)
            # RHEL/CentOS/Fedora
            if ! install_packages nodejs npm; then
                log_error "Failed to install Node.js via $PACKAGE_MANAGER"
                return 1
            fi
            ;;
        arch)
            # Arch Linux
            if ! install_packages nodejs npm; then
                log_error "Failed to install Node.js via pacman"
                return 1
            fi
            ;;
        suse)
            # openSUSE
            if ! install_packages nodejs npm; then
                log_error "Failed to install Node.js via zypper"
                return 1
            fi
            ;;
        macos)
            # macOS with Homebrew
            if ! install_packages node; then
                log_error "Failed to install Node.js via Homebrew"
                return 1
            fi
            ;;
        *)
            log_error "Node.js installation not supported for OS: $OS"
            return 1
            ;;
    esac
    
    log_success "Node.js installed via package manager"
    return 0
}

# Install Node.js via Node Version Manager (nvm)
install_nodejs_nvm() {
    local version="${1:-20}"
    
    log_install "Installing Node.js v$version via NVM"
    
    # Check if nvm is already installed
    if [[ ! -f "$HOME/.nvm/nvm.sh" ]]; then
        log_info "Installing NVM..."
        
        # Download and install nvm
        if ! curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash; then
            log_error "Failed to install NVM"
            return 1
        fi
        
        # Source nvm script
        export NVM_DIR="$HOME/.nvm"
        [[ -s "$NVM_DIR/nvm.sh" ]] && source "$NVM_DIR/nvm.sh"
        [[ -s "$NVM_DIR/bash_completion" ]] && source "$NVM_DIR/bash_completion"
    else
        log_info "NVM already installed"
        export NVM_DIR="$HOME/.nvm"
        [[ -s "$NVM_DIR/nvm.sh" ]] && source "$NVM_DIR/nvm.sh"
    fi
    
    # Install Node.js
    if ! nvm install "$version"; then
        log_error "Failed to install Node.js via NVM"
        return 1
    fi
    
    # Use the installed version
    if ! nvm use "$version"; then
        log_error "Failed to use Node.js v$version"
        return 1
    fi
    
    # Set as default
    if ! nvm alias default "$version"; then
        log_warning "Could not set Node.js v$version as default"
    fi
    
    log_success "Node.js v$version installed via NVM"
    return 0
}

# Main Node.js installation function
install_nodejs() {
    log_step "Installing Node.js..."
    
    # Check if Node.js is already installed and meets requirements
    if detect_nodejs; then
        log_success "Node.js is already installed and meets requirements"
        return 0
    fi
    
    # Determine installation method based on OS
    local installation_method="package_manager"
    
    case "$OS" in
        ubuntu|debian)
            # For Ubuntu/Debian, try NodeSource for newer versions
            installation_method="nodesource"
            ;;
        macos)
            # For macOS, prefer Homebrew
            if ! command -v brew &> /dev/null; then
                log_warning "Homebrew not found. Please install Homebrew first."
                log_info "Visit: https://brew.sh/"
                return 1
            fi
            installation_method="package_manager"
            ;;
        *)
            installation_method="package_manager"
            ;;
    esac
    
    # Try the primary installation method
    local success=false
    case "$installation_method" in
        nodesource)
            if install_nodejs_nodesource; then
                success=true
            else
                log_warning "NodeSource installation failed, trying package manager"
                if install_nodejs_package_manager; then
                    success=true
                fi
            fi
            ;;
        package_manager)
            if install_nodejs_package_manager; then
                success=true
            fi
            ;;
    esac
    
    # If both methods failed, try NVM as fallback
    if [[ "$success" != "true" ]]; then
        log_warning "Package manager installation failed, trying NVM"
        if install_nodejs_nvm; then
            success=true
        fi
    fi
    
    if [[ "$success" != "true" ]]; then
        log_error "All Node.js installation methods failed"
        return 1
    fi
    
    # Verify installation
    if detect_nodejs; then
        log_success "Node.js installation completed successfully"
        
        # Show installed version
        local installed_version
        installed_version=$(get_nodejs_version)
        log_info "Installed Node.js version: v$installed_version"
        
        # Check npm availability
        if command -v npm &> /dev/null; then
            local npm_version
            npm_version=$(npm --version)
            log_info "NPM version: v$npm_version"
        else
            log_warning "NPM not found - you may need to install it separately"
        fi
        
        return 0
    else
        log_error "Node.js installation verification failed"
        return 1
    fi
}

# Update Node.js to latest LTS version
update_nodejs() {
    log_step "Updating Node.js..."
    
    local current_version
    current_version=$(get_nodejs_version)
    
    if [[ -z "$current_version" ]]; then
        log_error "Node.js not found - cannot update"
        return 1
    fi
    
    log_info "Current Node.js version: v$current_version"
    
    # Check if update is needed
    if check_nodejs_version "$current_version" "$NODEJS_RECOMMENDED_VERSION"; then
        log_success "Node.js is already at recommended version or newer"
        return 0
    fi
    
    # Determine update method
    if [[ -f "$HOME/.nvm/nvm.sh" ]]; then
        log_info "Updating via NVM..."
        export NVM_DIR="$HOME/.nvm"
        [[ -s "$NVM_DIR/nvm.sh" ]] && source "$NVM_DIR/nvm.sh"
        
        if nvm install --lts; then
            nvm use --lts
            nvm alias default node
            log_success "Node.js updated via NVM"
        else
            log_error "Failed to update Node.js via NVM"
            return 1
        fi
    else
        log_info "Updating via package manager..."
        if update_packages && install_nodejs_package_manager; then
            log_success "Node.js updated via package manager"
        else
            log_error "Failed to update Node.js via package manager"
            return 1
        fi
    fi
    
    # Verify update
    local new_version
    new_version=$(get_nodejs_version)
    log_info "Updated Node.js version: v$new_version"
    
    return 0
}

# Configure Node.js environment
configure_nodejs() {
    log_step "Configuring Node.js environment..."
    
    # Set npm global prefix to avoid permission issues
    local npm_prefix="$HOME/.npm-global"
    if [[ ! -d "$npm_prefix" ]]; then
        mkdir -p "$npm_prefix"
    fi
    
    npm config set prefix "$npm_prefix" 2>/dev/null || log_warning "Could not set npm prefix"
    
    # Add npm global bin to PATH if not already there
    local npm_bin_path="$npm_prefix/bin"
    if [[ ":$PATH:" != *":$npm_bin_path:"* ]]; then
        export PATH="$npm_bin_path:$PATH"
        
        # Add to shell profile
        local shell_profile=""
        if [[ -n "$BASH_VERSION" ]]; then
            shell_profile="$HOME/.bashrc"
        elif [[ -n "$ZSH_VERSION" ]]; then
            shell_profile="$HOME/.zshrc"
        fi
        
        if [[ -n "$shell_profile" ]] && [[ -f "$shell_profile" ]]; then
            if ! grep -q "npm-global/bin" "$shell_profile"; then
                echo "export PATH=\"$npm_bin_path:\$PATH\"" >> "$shell_profile"
                log_info "Added npm global bin to $shell_profile"
            fi
        fi
    fi
    
    # Set NODE_ENV for development
    export NODE_ENV="${NODE_ENV:-development}"
    
    log_success "Node.js environment configured"
}

# Show Node.js information
show_nodejs_info() {
    log_info "Node.js Environment Information:"
    
    if command -v node &> /dev/null; then
        local node_version
        node_version=$(node --version)
        echo "  Node.js: $node_version"
    else
        echo "  Node.js: Not installed"
    fi
    
    if command -v npm &> /dev/null; then
        local npm_version
        npm_version=$(npm --version)
        echo "  NPM: v$npm_version"
    else
        echo "  NPM: Not installed"
    fi
    
    if [[ -f "$HOME/.nvm/nvm.sh" ]]; then
        echo "  NVM: Installed"
    else
        echo "  NVM: Not installed"
    fi
    
    echo "  Global packages directory: $(npm config get prefix 2>/dev/null || echo 'Not configured')"
}