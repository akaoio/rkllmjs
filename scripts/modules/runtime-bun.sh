#!/bin/bash

# RKLLM.js Bun Runtime Installation Module
# Handles Bun installation across different platforms

# Bun version requirements
readonly BUN_MIN_VERSION="1.0.0"

# Check if Bun is installed and get version
get_bun_version() {
    if command -v bun &> /dev/null; then
        bun --version
    else
        echo ""
    fi
}

# Check if Bun version meets requirements
check_bun_version() {
    local current_version="$1"
    local min_version="${2:-$BUN_MIN_VERSION}"
    
    if [[ -z "$current_version" ]]; then
        return 1
    fi
    
    version_compare "$current_version" ">=" "$min_version"
}

# Detect current Bun installation
detect_bun() {
    local current_version
    current_version=$(get_bun_version)
    
    if [[ -n "$current_version" ]]; then
        log_info "Bun detected: v$current_version"
        
        if check_bun_version "$current_version" "$BUN_MIN_VERSION"; then
            log_success "Bun version meets requirements (>= $BUN_MIN_VERSION)"
            return 0
        else
            log_warning "Bun version $current_version is below minimum required: $BUN_MIN_VERSION"
            return 1
        fi
    else
        log_info "Bun not found"
        return 1
    fi
}

# Install Bun via official installer script
install_bun_official() {
    local latest_version
    latest_version=$(fetch_latest_bun_version)
    
    log_install "Installing Bun v$latest_version (latest) via official installer"
    
    # Check if curl is available
    if ! command -v curl &> /dev/null; then
        log_error "curl is required for Bun installation"
        return 1
    fi
    
    # Download and run the official Bun installer
    if curl -fsSL https://bun.sh/install | bash; then
        log_success "Bun v$latest_version installed via official installer"
        
        # Add to PATH for current session
        export PATH="$HOME/.bun/bin:$PATH"
        
        # Add to shell profile
        local shell_profile=""
        if [[ -n "$BASH_VERSION" ]]; then
            shell_profile="$HOME/.bashrc"
        elif [[ -n "$ZSH_VERSION" ]]; then
            shell_profile="$HOME/.zshrc"
        fi
        
        if [[ -n "$shell_profile" ]] && [[ -f "$shell_profile" ]]; then
            if ! grep -q ".bun/bin" "$shell_profile"; then
                echo 'export PATH="$HOME/.bun/bin:$PATH"' >> "$shell_profile"
                log_info "Added Bun to $shell_profile"
            fi
        fi
        
        return 0
    else
        log_error "Failed to install Bun via official installer"
        return 1
    fi
}

# Install Bun via package manager (where available)
install_bun_package_manager() {
    log_install "Installing Bun via package manager"
    
    case "$OS" in
        macos)
            # Homebrew installation
            if command -v brew &> /dev/null; then
                if install_packages oven-sh/bun/bun; then
                    log_success "Bun installed via Homebrew"
                    return 0
                else
                    log_error "Failed to install Bun via Homebrew"
                    return 1
                fi
            else
                log_error "Homebrew not available for Bun installation"
                return 1
            fi
            ;;
        arch)
            # Arch User Repository (AUR) - requires yay or paru
            if command -v yay &> /dev/null; then
                if yay -S --noconfirm bun-bin; then
                    log_success "Bun installed via AUR (yay)"
                    return 0
                else
                    log_error "Failed to install Bun via AUR"
                    return 1
                fi
            elif command -v paru &> /dev/null; then
                if paru -S --noconfirm bun-bin; then
                    log_success "Bun installed via AUR (paru)"
                    return 0
                else
                    log_error "Failed to install Bun via AUR"
                    return 1
                fi
            else
                log_warning "AUR helper not found (yay/paru), falling back to official installer"
                return 1
            fi
            ;;
        *)
            log_warning "Package manager installation not available for OS: $OS"
            return 1
            ;;
    esac
}

# Main Bun installation function
install_bun() {
    log_step "Installing Bun..."
    
    # Check if Bun is already installed and meets requirements
    if detect_bun; then
        log_success "Bun is already installed and meets requirements"
        return 0
    fi
    
    # Check system requirements
    if ! check_bun_system_requirements; then
        log_error "System requirements for Bun not met"
        return 1
    fi
    
    # Try package manager first (where available), then official installer
    if install_bun_package_manager; then
        log_success "Bun installed via package manager"
    elif install_bun_official; then
        log_success "Bun installed via official installer"
    else
        log_error "All Bun installation methods failed"
        return 1
    fi
    
    # Verify installation
    if detect_bun; then
        log_success "Bun installation completed successfully"
        
        # Show installed version
        local installed_version
        installed_version=$(get_bun_version)
        log_info "Installed Bun version: v$installed_version"
        
        return 0
    else
        log_error "Bun installation verification failed"
        return 1
    fi
}

# Check Bun system requirements
check_bun_system_requirements() {
    log_debug "Checking Bun system requirements"
    
    # Check OS compatibility
    case "$OS" in
        ubuntu|debian|armbian|rhel|arch|suse|macos)
            log_debug "OS $OS is compatible with Bun"
            ;;
        *)
            log_error "Bun is not officially supported on $OS"
            return 1
            ;;
    esac
    
    # Check architecture (Bun supports x64 and arm64)
    local arch=$(uname -m)
    case "$arch" in
        x86_64|amd64|arm64|aarch64)
            log_debug "Architecture $arch is compatible with Bun"
            ;;
        *)
            log_error "Bun is not supported on architecture: $arch"
            return 1
            ;;
    esac
    
    return 0
}

# Update Bun to latest version
update_bun() {
    log_step "Updating Bun..."
    
    if ! command -v bun &> /dev/null; then
        log_error "Bun not found - cannot update"
        return 1
    fi
    
    local current_version
    current_version=$(get_bun_version)
    log_info "Current Bun version: v$current_version"
    
    # Bun has a built-in upgrade command
    if bun upgrade; then
        log_success "Bun updated successfully"
        
        local new_version
        new_version=$(get_bun_version)
        log_info "Updated Bun version: v$new_version"
        
        return 0
    else
        log_error "Failed to update Bun"
        return 1
    fi
}

# Configure Bun environment
configure_bun() {
    log_step "Configuring Bun environment..."
    
    if ! command -v bun &> /dev/null; then
        log_warning "Bun not found - skipping configuration"
        return 1
    fi
    
    # Set Bun install directory (if not already set)
    if [[ -z "${BUN_INSTALL:-}" ]]; then
        export BUN_INSTALL="$HOME/.bun"
    fi
    
    # Ensure Bun bin directory is in PATH
    local bun_bin_path="$BUN_INSTALL/bin"
    if [[ ":$PATH:" != *":$bun_bin_path:"* ]]; then
        export PATH="$bun_bin_path:$PATH"
        log_info "Added Bun bin directory to PATH"
    fi
    
    # Create global package directory
    local bun_global_dir="$HOME/.bun/global"
    if [[ ! -d "$bun_global_dir" ]]; then
        mkdir -p "$bun_global_dir"
        log_debug "Created Bun global directory: $bun_global_dir"
    fi
    
    log_success "Bun environment configured"
}

# Show Bun information
show_bun_info() {
    log_info "Bun Environment Information:"
    
    if command -v bun &> /dev/null; then
        local bun_version
        bun_version=$(bun --version)
        echo "  Bun: v$bun_version"
        
        # Show Bun install location
        if command -v which &> /dev/null; then
            local bun_path
            bun_path=$(which bun)
            echo "  Location: $bun_path"
        fi
        
        # Show Bun install directory
        echo "  Install directory: ${BUN_INSTALL:-$HOME/.bun}"
        
        # Show global packages directory
        echo "  Global packages: ${BUN_INSTALL:-$HOME/.bun}/global"
    else
        echo "  Bun: Not installed"
    fi
}

# Uninstall Bun
uninstall_bun() {
    log_step "Uninstalling Bun..."
    
    if ! command -v bun &> /dev/null; then
        log_warning "Bun not found - nothing to uninstall"
        return 0
    fi
    
    # Remove Bun installation directory
    local bun_install_dir="${BUN_INSTALL:-$HOME/.bun}"
    if [[ -d "$bun_install_dir" ]]; then
        log_info "Removing Bun installation directory: $bun_install_dir"
        rm -rf "$bun_install_dir"
        log_success "Bun installation directory removed"
    fi
    
    # Remove from shell profiles
    local shell_profiles=("$HOME/.bashrc" "$HOME/.zshrc" "$HOME/.profile")
    for profile in "${shell_profiles[@]}"; do
        if [[ -f "$profile" ]] && grep -q "bun" "$profile"; then
            log_info "Removing Bun references from $profile"
            sed -i '/bun/d' "$profile" 2>/dev/null || log_warning "Could not update $profile"
        fi
    done
    
    log_success "Bun uninstalled successfully"
    log_info "You may need to restart your terminal for changes to take effect"
}