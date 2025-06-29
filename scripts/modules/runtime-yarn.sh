#!/bin/bash

# RKLLM.js Yarn Package Manager Installation Module
# Handles Yarn installation across different platforms

# Yarn version requirements
readonly YARN_MIN_VERSION="1.22.0"
readonly YARN_RECOMMENDED_VERSION="4.0.0"  # Yarn Berry

# Check if Yarn is installed and get version
get_yarn_version() {
    if command -v yarn &> /dev/null; then
        yarn --version
    else
        echo ""
    fi
}

# Check if Yarn version meets requirements
check_yarn_version() {
    local current_version="$1"
    local min_version="${2:-$YARN_MIN_VERSION}"
    
    if [[ -z "$current_version" ]]; then
        return 1
    fi
    
    version_compare "$current_version" ">=" "$min_version"
}

# Detect current Yarn installation
detect_yarn() {
    local current_version
    current_version=$(get_yarn_version)
    
    if [[ -n "$current_version" ]]; then
        log_info "Yarn detected: v$current_version"
        
        if check_yarn_version "$current_version" "$YARN_MIN_VERSION"; then
            log_success "Yarn version meets requirements (>= $YARN_MIN_VERSION)"
            return 0
        else
            log_warning "Yarn version $current_version is below minimum required: $YARN_MIN_VERSION"
            return 1
        fi
    else
        log_info "Yarn not found"
        return 1
    fi
}

# Install Yarn via npm (Classic Yarn 1.x)
install_yarn_npm() {
    log_install "Installing Yarn via npm"
    
    # Check if npm is available
    if ! command -v npm &> /dev/null; then
        log_error "npm is required for Yarn installation"
        return 1
    fi
    
    # Install Yarn globally via npm
    if npm install -g yarn; then
        log_success "Yarn installed via npm"
        return 0
    else
        log_error "Failed to install Yarn via npm"
        return 1
    fi
}

# Install Yarn via Corepack (recommended for Node.js 16+)
install_yarn_corepack() {
    log_install "Installing Yarn via Corepack"
    
    # Check if Node.js supports Corepack
    if ! command -v node &> /dev/null; then
        log_error "Node.js is required for Corepack"
        return 1
    fi
    
    local node_version
    node_version=$(node --version | sed 's/^v//')
    
    if ! version_compare "$node_version" ">=" "16.0.0"; then
        log_warning "Node.js 16+ required for Corepack, current version: $node_version"
        return 1
    fi
    
    # Enable Corepack
    if corepack enable; then
        log_success "Corepack enabled"
    else
        log_error "Failed to enable Corepack"
        return 1
    fi
    
    # Install latest Yarn using dynamic version detection
    local latest_yarn_version
    latest_yarn_version=$(fetch_latest_yarn_version "berry")
    
    if corepack install -g yarn@$latest_yarn_version; then
        log_success "Yarn v$latest_yarn_version (latest) installed via Corepack"
        return 0
    else
        log_error "Failed to install Yarn via Corepack"
        return 1
    fi
}

# Install Yarn via official script
install_yarn_script() {
    log_install "Installing Yarn via official script"
    
    # Check if curl is available
    if ! command -v curl &> /dev/null; then
        log_error "curl is required for Yarn installation"
        return 1
    fi
    
    # Download and run the official Yarn installer
    if curl -o- -L https://yarnpkg.com/install.sh | bash; then
        log_success "Yarn installed via official script"
        
        # Add to PATH for current session
        export PATH="$HOME/.yarn/bin:$HOME/.config/yarn/global/node_modules/.bin:$PATH"
        
        # Add to shell profile
        local shell_profile=""
        if [[ -n "$BASH_VERSION" ]]; then
            shell_profile="$HOME/.bashrc"
        elif [[ -n "$ZSH_VERSION" ]]; then
            shell_profile="$HOME/.zshrc"
        fi
        
        if [[ -n "$shell_profile" ]] && [[ -f "$shell_profile" ]]; then
            if ! grep -q ".yarn/bin" "$shell_profile"; then
                echo 'export PATH="$HOME/.yarn/bin:$HOME/.config/yarn/global/node_modules/.bin:$PATH"' >> "$shell_profile"
                log_info "Added Yarn to $shell_profile"
            fi
        fi
        
        return 0
    else
        log_error "Failed to install Yarn via official script"
        return 1
    fi
}

# Install Yarn via package manager
install_yarn_package_manager() {
    log_install "Installing Yarn via package manager"
    
    case "$OS" in
        ubuntu|debian|armbian)
            # Add Yarn repository and install
            if curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add - && \
               echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list && \
               sudo apt update && \
               sudo apt install -y yarn; then
                log_success "Yarn installed via APT"
                return 0
            else
                log_error "Failed to install Yarn via APT"
                return 1
            fi
            ;;
        rhel)
            # Add Yarn repository and install
            if curl --silent --location https://dl.yarnpkg.com/rpm/yarn.repo | sudo tee /etc/yum.repos.d/yarn.repo && \
               sudo rpm --import https://dl.yarnpkg.com/rpm/pubkey.gpg && \
               sudo $PACKAGE_MANAGER install -y yarn; then
                log_success "Yarn installed via $PACKAGE_MANAGER"
                return 0
            else
                log_error "Failed to install Yarn via $PACKAGE_MANAGER"
                return 1
            fi
            ;;
        arch)
            # Install from official repositories
            if install_packages yarn; then
                log_success "Yarn installed via pacman"
                return 0
            else
                log_error "Failed to install Yarn via pacman"
                return 1
            fi
            ;;
        macos)
            # Homebrew installation
            if command -v brew &> /dev/null; then
                if install_packages yarn; then
                    log_success "Yarn installed via Homebrew"
                    return 0
                else
                    log_error "Failed to install Yarn via Homebrew"
                    return 1
                fi
            else
                log_error "Homebrew not available for Yarn installation"
                return 1
            fi
            ;;
        *)
            log_warning "Package manager installation not available for OS: $OS"
            return 1
            ;;
    esac
}

# Main Yarn installation function
install_yarn() {
    log_step "Installing Yarn..."
    
    # Check if Yarn is already installed and meets requirements
    if detect_yarn; then
        log_success "Yarn is already installed and meets requirements"
        return 0
    fi
    
    # Check if Node.js is installed (required for Yarn)
    if ! command -v node &> /dev/null; then
        log_error "Node.js is required for Yarn installation"
        return 1
    fi
    
    # Try installation methods in order of preference
    local success=false
    local node_version
    node_version=$(node --version | sed 's/^v//')
    
    # For Node.js 16+, prefer Corepack
    if version_compare "$node_version" ">=" "16.0.0"; then
        if install_yarn_corepack; then
            success=true
        elif install_yarn_npm; then
            success=true
        elif install_yarn_package_manager; then
            success=true
        elif install_yarn_script; then
            success=true
        fi
    else
        # For older Node.js versions, use traditional methods
        if install_yarn_npm; then
            success=true
        elif install_yarn_package_manager; then
            success=true
        elif install_yarn_script; then
            success=true
        fi
    fi
    
    if [[ "$success" != "true" ]]; then
        log_error "All Yarn installation methods failed"
        return 1
    fi
    
    # Verify installation
    if detect_yarn; then
        log_success "Yarn installation completed successfully"
        
        # Show installed version
        local installed_version
        installed_version=$(get_yarn_version)
        log_info "Installed Yarn version: v$installed_version"
        
        return 0
    else
        log_error "Yarn installation verification failed"
        return 1
    fi
}

# Update Yarn
update_yarn() {
    log_step "Updating Yarn..."
    
    if ! command -v yarn &> /dev/null; then
        log_error "Yarn not found - cannot update"
        return 1
    fi
    
    local current_version
    current_version=$(get_yarn_version)
    log_info "Current Yarn version: v$current_version"
    
    # Check if Yarn was installed via Corepack
    if command -v corepack &> /dev/null; then
        if corepack install -g yarn@stable; then
            log_success "Yarn updated via Corepack"
            return 0
        fi
    fi
    
    # Try self-update (Yarn 1.x)
    if yarn self-update 2>/dev/null; then
        log_success "Yarn self-updated"
        return 0
    fi
    
    # Try npm update
    if command -v npm &> /dev/null; then
        if npm update -g yarn; then
            log_success "Yarn updated via npm"
            return 0
        fi
    fi
    
    log_error "Failed to update Yarn"
    return 1
}

# Configure Yarn environment
configure_yarn() {
    log_step "Configuring Yarn environment..."
    
    if ! command -v yarn &> /dev/null; then
        log_warning "Yarn not found - skipping configuration"
        return 1
    fi
    
    # Set global folder to avoid permission issues
    local yarn_global_dir="$HOME/.config/yarn/global"
    ensure_directory "$yarn_global_dir"
    
    # Configure Yarn to use the global directory
    yarn config set global-folder "$yarn_global_dir" 2>/dev/null || log_warning "Could not set Yarn global folder"
    
    # Set prefix for global installs
    yarn config set prefix "$HOME/.yarn" 2>/dev/null || log_warning "Could not set Yarn prefix"
    
    # Configure cache directory
    local yarn_cache_dir="$HOME/.cache/yarn"
    ensure_directory "$yarn_cache_dir"
    yarn config set cache-folder "$yarn_cache_dir" 2>/dev/null || log_warning "Could not set Yarn cache folder"
    
    # Add Yarn global bin to PATH if not already there
    local yarn_global_bin="$HOME/.config/yarn/global/node_modules/.bin"
    local yarn_bin="$HOME/.yarn/bin"
    
    for bin_path in "$yarn_global_bin" "$yarn_bin"; do
        if [[ ":$PATH:" != *":$bin_path:"* ]]; then
            export PATH="$bin_path:$PATH"
        fi
    done
    
    log_success "Yarn environment configured"
}

# Show Yarn information
show_yarn_info() {
    log_info "Yarn Environment Information:"
    
    if command -v yarn &> /dev/null; then
        local yarn_version
        yarn_version=$(yarn --version)
        echo "  Yarn: v$yarn_version"
        
        # Show Yarn location
        if command -v which &> /dev/null; then
            local yarn_path
            yarn_path=$(which yarn)
            echo "  Location: $yarn_path"
        fi
        
        # Show configuration
        local global_folder
        global_folder=$(yarn config get global-folder 2>/dev/null || echo "Not configured")
        echo "  Global folder: $global_folder"
        
        local cache_folder
        cache_folder=$(yarn config get cache-folder 2>/dev/null || echo "Not configured")
        echo "  Cache folder: $cache_folder"
        
        # Show if Corepack is managing Yarn
        if command -v corepack &> /dev/null; then
            if corepack which yarn &>/dev/null; then
                echo "  Managed by: Corepack"
            fi
        fi
    else
        echo "  Yarn: Not installed"
    fi
}

# Uninstall Yarn
uninstall_yarn() {
    log_step "Uninstalling Yarn..."
    
    if ! command -v yarn &> /dev/null; then
        log_warning "Yarn not found - nothing to uninstall"
        return 0
    fi
    
    # Try different uninstallation methods
    local uninstalled=false
    
    # If installed via npm
    if npm list -g yarn &>/dev/null; then
        if npm uninstall -g yarn; then
            log_success "Yarn uninstalled via npm"
            uninstalled=true
        fi
    fi
    
    # If installed via package manager
    if [[ "$uninstalled" != "true" ]]; then
        case "$OS" in
            ubuntu|debian)
                if sudo apt remove -y yarn; then
                    log_success "Yarn uninstalled via APT"
                    uninstalled=true
                fi
                ;;
            rhel)
                if sudo $PACKAGE_MANAGER remove -y yarn; then
                    log_success "Yarn uninstalled via $PACKAGE_MANAGER"
                    uninstalled=true
                fi
                ;;
            arch)
                if sudo pacman -R --noconfirm yarn; then
                    log_success "Yarn uninstalled via pacman"
                    uninstalled=true
                fi
                ;;
            macos)
                if command -v brew &> /dev/null && brew uninstall yarn; then
                    log_success "Yarn uninstalled via Homebrew"
                    uninstalled=true
                fi
                ;;
        esac
    fi
    
    # Remove Yarn directories
    local yarn_dirs=("$HOME/.yarn" "$HOME/.config/yarn" "$HOME/.cache/yarn")
    for dir in "${yarn_dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            log_info "Removing Yarn directory: $dir"
            rm -rf "$dir"
        fi
    done
    
    # Remove from shell profiles
    local shell_profiles=("$HOME/.bashrc" "$HOME/.zshrc" "$HOME/.profile")
    for profile in "${shell_profiles[@]}"; do
        if [[ -f "$profile" ]] && grep -q "yarn" "$profile"; then
            log_info "Removing Yarn references from $profile"
            sed -i '/yarn/d' "$profile" 2>/dev/null || log_warning "Could not update $profile"
        fi
    done
    
    log_success "Yarn uninstalled successfully"
    log_info "You may need to restart your terminal for changes to take effect"
}