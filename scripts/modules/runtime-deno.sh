#!/bin/bash

# RKLLM.js Deno Runtime Installation Module
# Handles Deno installation across different platforms

# Deno version requirements
readonly DENO_MIN_VERSION="1.30.0"

# Check if Deno is installed and get version
get_deno_version() {
    if command -v deno &> /dev/null; then
        deno --version | head -n1 | awk '{print $2}'
    else
        echo ""
    fi
}

# Check if Deno version meets requirements
check_deno_version() {
    local current_version="$1"
    local min_version="${2:-$DENO_MIN_VERSION}"
    
    if [[ -z "$current_version" ]]; then
        return 1
    fi
    
    version_compare "$current_version" ">=" "$min_version"
}

# Detect current Deno installation
detect_deno() {
    local current_version
    current_version=$(get_deno_version)
    
    if [[ -n "$current_version" ]]; then
        log_info "Deno detected: v$current_version"
        
        if check_deno_version "$current_version" "$DENO_MIN_VERSION"; then
            log_success "Deno version meets requirements (>= $DENO_MIN_VERSION)"
            return 0
        else
            log_warning "Deno version $current_version is below minimum required: $DENO_MIN_VERSION"
            return 1
        fi
    else
        log_info "Deno not found"
        return 1
    fi
}

# Install Deno via official installer script
install_deno_official() {
    log_install "Installing Deno via official installer"
    
    # Check if curl is available
    if ! command -v curl &> /dev/null; then
        log_error "curl is required for Deno installation"
        return 1
    fi
    
    # Download and run the official Deno installer
    if curl -fsSL https://deno.land/install.sh | sh; then
        log_success "Deno installed via official installer"
        
        # Add to PATH for current session
        export PATH="$HOME/.deno/bin:$PATH"
        
        # Add to shell profile
        local shell_profile=""
        if [[ -n "$BASH_VERSION" ]]; then
            shell_profile="$HOME/.bashrc"
        elif [[ -n "$ZSH_VERSION" ]]; then
            shell_profile="$HOME/.zshrc"
        fi
        
        if [[ -n "$shell_profile" ]] && [[ -f "$shell_profile" ]]; then
            if ! grep -q ".deno/bin" "$shell_profile"; then
                echo 'export PATH="$HOME/.deno/bin:$PATH"' >> "$shell_profile"
                log_info "Added Deno to $shell_profile"
            fi
        fi
        
        return 0
    else
        log_error "Failed to install Deno via official installer"
        return 1
    fi
}

# Install Deno via package manager (where available)
install_deno_package_manager() {
    log_install "Installing Deno via package manager"
    
    case "$OS" in
        macos)
            # Homebrew installation
            if command -v brew &> /dev/null; then
                if install_packages deno; then
                    log_success "Deno installed via Homebrew"
                    return 0
                else
                    log_error "Failed to install Deno via Homebrew"
                    return 1
                fi
            else
                log_error "Homebrew not available for Deno installation"
                return 1
            fi
            ;;
        arch)
            # Arch User Repository (AUR)
            if command -v yay &> /dev/null; then
                if yay -S --noconfirm deno; then
                    log_success "Deno installed via AUR (yay)"
                    return 0
                else
                    log_error "Failed to install Deno via AUR"
                    return 1
                fi
            elif command -v paru &> /dev/null; then
                if paru -S --noconfirm deno; then
                    log_success "Deno installed via AUR (paru)"
                    return 0
                else
                    log_error "Failed to install Deno via AUR"
                    return 1
                fi
            else
                log_warning "AUR helper not found (yay/paru), falling back to official installer"
                return 1
            fi
            ;;
        ubuntu|debian)
            # Try snap package
            if command -v snap &> /dev/null; then
                if sudo snap install deno; then
                    log_success "Deno installed via Snap"
                    return 0
                else
                    log_warning "Failed to install Deno via Snap"
                    return 1
                fi
            else
                log_warning "Snap not available, falling back to official installer"
                return 1
            fi
            ;;
        *)
            log_warning "Package manager installation not available for OS: $OS"
            return 1
            ;;
    esac
}

# Install Deno via GitHub releases (binary download)
install_deno_github() {
    log_install "Installing Deno via GitHub releases"
    
    # Detect system architecture
    local arch=$(uname -m)
    local os_name=""
    local deno_arch=""
    
    case "$OS" in
        ubuntu|debian|rhel|arch|suse) os_name="linux" ;;
        macos) os_name="darwin" ;;
        *) 
            log_error "Unsupported OS for GitHub installation: $OS"
            return 1
            ;;
    esac
    
    case "$arch" in
        x86_64|amd64) deno_arch="x86_64" ;;
        arm64|aarch64) deno_arch="aarch64" ;;
        *)
            log_error "Unsupported architecture for Deno: $arch"
            return 1
            ;;
    esac
    
    # Get latest release version using the core function
    local latest_version
    latest_version=$(fetch_latest_deno_version)
    
    if [[ -z "$latest_version" ]]; then
        log_error "Could not determine latest Deno version"
        return 1
    fi
    
    log_info "Installing Deno v$latest_version (latest)"
    
    # Download URL
    local download_url="https://github.com/denoland/deno/releases/download/v${latest_version}/deno-${deno_arch}-unknown-${os_name}-gnu.zip"
    local temp_dir
    temp_dir=$(create_temp_dir "deno")
    local zip_file="$temp_dir/deno.zip"
    
    # Download the binary
    if ! download_file "$download_url" "$zip_file"; then
        log_error "Failed to download Deno binary"
        return 1
    fi
    
    # Extract the binary
    if ! extract_archive "$zip_file" "$temp_dir"; then
        log_error "Failed to extract Deno binary"
        return 1
    fi
    
    # Install to user directory
    local install_dir="$HOME/.deno/bin"
    ensure_directory "$install_dir"
    
    if mv "$temp_dir/deno" "$install_dir/deno"; then
        chmod +x "$install_dir/deno"
        log_success "Deno binary installed to $install_dir"
        
        # Add to PATH
        export PATH="$install_dir:$PATH"
        
        # Add to shell profile
        local shell_profile=""
        if [[ -n "$BASH_VERSION" ]]; then
            shell_profile="$HOME/.bashrc"
        elif [[ -n "$ZSH_VERSION" ]]; then
            shell_profile="$HOME/.zshrc"
        fi
        
        if [[ -n "$shell_profile" ]] && [[ -f "$shell_profile" ]]; then
            if ! grep -q ".deno/bin" "$shell_profile"; then
                echo 'export PATH="$HOME/.deno/bin:$PATH"' >> "$shell_profile"
                log_info "Added Deno to $shell_profile"
            fi
        fi
        
        return 0
    else
        log_error "Failed to install Deno binary"
        return 1
    fi
}

# Main Deno installation function
install_deno() {
    log_step "Installing Deno..."
    
    # Check if Deno is already installed and meets requirements
    if detect_deno; then
        log_success "Deno is already installed and meets requirements"
        return 0
    fi
    
    # Check system requirements
    if ! check_deno_system_requirements; then
        log_error "System requirements for Deno not met"
        return 1
    fi
    
    # Try installation methods in order of preference
    local success=false
    
    # 1. Try package manager first (where available)
    if install_deno_package_manager; then
        success=true
    # 2. Try official installer
    elif install_deno_official; then
        success=true
    # 3. Try GitHub releases as fallback
    elif install_deno_github; then
        success=true
    fi
    
    if [[ "$success" != "true" ]]; then
        log_error "All Deno installation methods failed"
        return 1
    fi
    
    # Verify installation
    if detect_deno; then
        log_success "Deno installation completed successfully"
        
        # Show installed version
        local installed_version
        installed_version=$(get_deno_version)
        log_info "Installed Deno version: v$installed_version"
        
        return 0
    else
        log_error "Deno installation verification failed"
        return 1
    fi
}

# Check Deno system requirements
check_deno_system_requirements() {
    log_debug "Checking Deno system requirements"
    
    # Check OS compatibility
    case "$OS" in
        ubuntu|debian|armbian|rhel|arch|suse|macos)
            log_debug "OS $OS is compatible with Deno"
            ;;
        *)
            log_error "Deno is not officially supported on $OS"
            return 1
            ;;
    esac
    
    # Check architecture
    local arch=$(uname -m)
    case "$arch" in
        x86_64|amd64|arm64|aarch64)
            log_debug "Architecture $arch is compatible with Deno"
            ;;
        *)
            log_error "Deno is not supported on architecture: $arch"
            return 1
            ;;
    esac
    
    return 0
}

# Update Deno to latest version
update_deno() {
    log_step "Updating Deno..."
    
    if ! command -v deno &> /dev/null; then
        log_error "Deno not found - cannot update"
        return 1
    fi
    
    local current_version
    current_version=$(get_deno_version)
    log_info "Current Deno version: v$current_version"
    
    # Deno has a built-in upgrade command
    if deno upgrade; then
        log_success "Deno updated successfully"
        
        local new_version
        new_version=$(get_deno_version)
        log_info "Updated Deno version: v$new_version"
        
        return 0
    else
        log_error "Failed to update Deno"
        return 1
    fi
}

# Configure Deno environment
configure_deno() {
    log_step "Configuring Deno environment..."
    
    if ! command -v deno &> /dev/null; then
        log_warning "Deno not found - skipping configuration"
        return 1
    fi
    
    # Set Deno install directory (if not already set)
    if [[ -z "${DENO_INSTALL:-}" ]]; then
        export DENO_INSTALL="$HOME/.deno"
    fi
    
    # Ensure Deno bin directory is in PATH
    local deno_bin_path="$DENO_INSTALL/bin"
    if [[ ":$PATH:" != *":$deno_bin_path:"* ]]; then
        export PATH="$deno_bin_path:$PATH"
        log_info "Added Deno bin directory to PATH"
    fi
    
    # Set up Deno cache directory
    local deno_cache_dir="${DENO_DIR:-$HOME/.cache/deno}"
    ensure_directory "$deno_cache_dir"
    export DENO_DIR="$deno_cache_dir"
    
    log_success "Deno environment configured"
}

# Show Deno information
show_deno_info() {
    log_info "Deno Environment Information:"
    
    if command -v deno &> /dev/null; then
        local deno_version
        deno_version=$(deno --version | head -n1)
        echo "  $deno_version"
        
        # Show TypeScript version
        local ts_version
        ts_version=$(deno --version | grep "typescript" | awk '{print $2}')
        echo "  TypeScript: $ts_version"
        
        # Show V8 version
        local v8_version
        v8_version=$(deno --version | grep "v8" | awk '{print $2}')
        echo "  V8: $v8_version"
        
        # Show Deno install location
        if command -v which &> /dev/null; then
            local deno_path
            deno_path=$(which deno)
            echo "  Location: $deno_path"
        fi
        
        # Show cache directory
        echo "  Cache directory: ${DENO_DIR:-$HOME/.cache/deno}"
    else
        echo "  Deno: Not installed"
    fi
}

# Uninstall Deno
uninstall_deno() {
    log_step "Uninstalling Deno..."
    
    if ! command -v deno &> /dev/null; then
        log_warning "Deno not found - nothing to uninstall"
        return 0
    fi
    
    # Remove Deno installation directory
    local deno_install_dir="${DENO_INSTALL:-$HOME/.deno}"
    if [[ -d "$deno_install_dir" ]]; then
        log_info "Removing Deno installation directory: $deno_install_dir"
        rm -rf "$deno_install_dir"
        log_success "Deno installation directory removed"
    fi
    
    # Remove cache directory
    local deno_cache_dir="${DENO_DIR:-$HOME/.cache/deno}"
    if [[ -d "$deno_cache_dir" ]]; then
        log_info "Removing Deno cache directory: $deno_cache_dir"
        rm -rf "$deno_cache_dir"
        log_success "Deno cache directory removed"
    fi
    
    # Remove from shell profiles
    local shell_profiles=("$HOME/.bashrc" "$HOME/.zshrc" "$HOME/.profile")
    for profile in "${shell_profiles[@]}"; do
        if [[ -f "$profile" ]] && grep -q "deno" "$profile"; then
            log_info "Removing Deno references from $profile"
            sed -i '/deno/d' "$profile" 2>/dev/null || log_warning "Could not update $profile"
        fi
    done
    
    log_success "Deno uninstalled successfully"
    log_info "You may need to restart your terminal for changes to take effect"
}