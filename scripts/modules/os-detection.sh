#!/bin/bash

# RKLLM.js OS Detection Module
# Provides OS detection and package management functions

# Global variables for OS detection
OS=""
OS_VERSION=""
PACKAGE_MANAGER=""

# Detect operating system
detect_os() {
    log_debug "Detecting operating system..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux variants
        if command -v apt &> /dev/null; then
            OS="ubuntu"
            PACKAGE_MANAGER="apt"
            # Try to get more specific version info
            if [[ -f /etc/os-release ]]; then
                source /etc/os-release
                OS_VERSION="${VERSION_ID:-unknown}"
                case "$ID" in
                    ubuntu) OS="ubuntu" ;;
                    debian) OS="debian" ;;
                    armbian) 
                        OS="armbian" 
                        # Armbian is Debian-based, so we'll use debian compatibility
                        PACKAGE_MANAGER="apt"
                        log_info "Detected Armbian - using Debian compatibility mode"
                        ;;
                    *) 
                        # Check if it's Armbian by looking at pretty name
                        if [[ "${PRETTY_NAME:-}" == *"Armbian"* ]]; then
                            OS="armbian"
                            log_info "Detected Armbian via PRETTY_NAME - using Debian compatibility mode"
                        else
                            OS="ubuntu" # Default to ubuntu for apt-based systems
                        fi
                        ;;
                esac
            fi
        elif command -v yum &> /dev/null; then
            OS="rhel"
            PACKAGE_MANAGER="yum"
            # Check for dnf (newer RHEL/Fedora)
            if command -v dnf &> /dev/null; then
                PACKAGE_MANAGER="dnf"
            fi
            # Get version info
            if [[ -f /etc/redhat-release ]]; then
                OS_VERSION=$(grep -oE '[0-9]+' /etc/redhat-release | head -1)
            fi
        elif command -v pacman &> /dev/null; then
            OS="arch"
            PACKAGE_MANAGER="pacman"
            # Arch is rolling release, use kernel version
            OS_VERSION=$(uname -r)
        elif command -v zypper &> /dev/null; then
            OS="suse"
            PACKAGE_MANAGER="zypper"
            if [[ -f /etc/os-release ]]; then
                source /etc/os-release
                OS_VERSION="${VERSION_ID:-unknown}"
            fi
        else
            OS="linux"
            PACKAGE_MANAGER="unknown"
            log_warning "Unknown Linux distribution, package management may not work"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        PACKAGE_MANAGER="brew"
        # Get macOS version
        OS_VERSION=$(sw_vers -productVersion)
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        OS="windows"
        PACKAGE_MANAGER="unknown"
        log_warning "Windows detected - limited support available"
    else
        OS="unknown"
        PACKAGE_MANAGER="unknown"
        log_warning "Unknown operating system: $OSTYPE"
    fi
    
    # Export for use by other modules
    export OS OS_VERSION PACKAGE_MANAGER
    
    log_info "Detected OS: $OS ($OS_VERSION) with package manager: $PACKAGE_MANAGER"
}

# Check if OS is supported
is_os_supported() {
    case "$OS" in
        ubuntu|debian|armbian|rhel|arch|suse|macos) return 0 ;;
        *) return 1 ;;
    esac
}

# Get package manager specific commands
get_package_manager_commands() {
    case "$PACKAGE_MANAGER" in
        apt)
            UPDATE_CMD="sudo apt update"
            INSTALL_CMD="sudo apt install -y"
            SEARCH_CMD="apt search"
            ;;
        yum)
            UPDATE_CMD="sudo yum update -y"
            INSTALL_CMD="sudo yum install -y"
            SEARCH_CMD="yum search"
            ;;
        dnf)
            UPDATE_CMD="sudo dnf update -y"
            INSTALL_CMD="sudo dnf install -y"
            SEARCH_CMD="dnf search"
            ;;
        pacman)
            UPDATE_CMD="sudo pacman -Syu --noconfirm"
            INSTALL_CMD="sudo pacman -S --noconfirm"
            SEARCH_CMD="pacman -Ss"
            ;;
        zypper)
            UPDATE_CMD="sudo zypper refresh"
            INSTALL_CMD="sudo zypper install -y"
            SEARCH_CMD="zypper search"
            ;;
        brew)
            UPDATE_CMD="brew update"
            INSTALL_CMD="brew install"
            SEARCH_CMD="brew search"
            ;;
        *)
            log_error "Unknown package manager: $PACKAGE_MANAGER"
            return 1
            ;;
    esac
    
    export UPDATE_CMD INSTALL_CMD SEARCH_CMD
}

# Update package database
update_packages() {
    if [[ -z "$UPDATE_CMD" ]]; then
        get_package_manager_commands
    fi
    
    log_install "Updating package database..."
    if eval "$UPDATE_CMD"; then
        log_success "Package database updated"
        return 0
    else
        log_error "Failed to update package database"
        return 1
    fi
}

# Install packages
install_packages() {
    local packages=("$@")
    
    if [[ ${#packages[@]} -eq 0 ]]; then
        log_warning "No packages specified for installation"
        return 0
    fi
    
    if [[ -z "$INSTALL_CMD" ]]; then
        get_package_manager_commands
    fi
    
    log_install "Installing packages: ${packages[*]}"
    
    # For some package managers, we might need to update first
    case "$PACKAGE_MANAGER" in
        apt)
            # Update package database for apt
            sudo apt update &> /dev/null || log_warning "Could not update apt database"
            ;;
    esac
    
    # Use a different approach for package installation
    local install_cmd_array=($INSTALL_CMD)
    if "${install_cmd_array[@]}" "${packages[@]}"; then
        log_success "Packages installed: ${packages[*]}"
        return 0
    else
        log_error "Failed to install packages: ${packages[*]}"
        return 1
    fi
}

# Check if package is installed
is_package_installed() {
    local package="$1"
    
    case "$PACKAGE_MANAGER" in
        apt)
            dpkg -l "$package" &> /dev/null
            ;;
        yum|dnf)
            rpm -q "$package" &> /dev/null
            ;;
        pacman)
            pacman -Q "$package" &> /dev/null
            ;;
        zypper)
            zypper se -i "$package" &> /dev/null
            ;;
        brew)
            brew list "$package" &> /dev/null
            ;;
        *)
            log_warning "Cannot check package installation status for package manager: $PACKAGE_MANAGER"
            return 1
            ;;
    esac
}

# Get OS-specific package names
get_os_package_name() {
    local generic_name="$1"
    
    case "$generic_name" in
        "build-essential")
            case "$OS" in
                ubuntu|debian) echo "build-essential" ;;
                rhel) echo "gcc-c++ make" ;;
                arch) echo "base-devel" ;;
                suse) echo "patterns-devel-base-devel_basis" ;;
                macos) echo "xcode-command-line-tools" ;;
                *) echo "$generic_name" ;;
            esac
            ;;
        "curl")
            echo "curl"  # Same across platforms
            ;;
        "git")
            echo "git"   # Same across platforms
            ;;
        "unzip")
            echo "unzip" # Same across platforms
            ;;
        "cmake")
            echo "cmake" # Same across platforms
            ;;
        "dialog")
            case "$OS" in
                ubuntu|debian) echo "whiptail" ;;
                *) echo "dialog" ;;
            esac
            ;;
        *)
            echo "$generic_name"
            ;;
    esac
}

# Install required tools for the installer
install_required_tools() {
    log_step "Checking for required tools..."
    
    local missing_tools=()
    
    # Check for essential tools
    if ! command -v curl &> /dev/null; then
        missing_tools+=("curl")
    fi
    
    if ! command -v git &> /dev/null; then
        missing_tools+=("git")
    fi
    
    if ! command -v unzip &> /dev/null; then
        missing_tools+=("unzip")
    fi
    
    # Check for dialog tools
    if ! command -v whiptail &> /dev/null && ! command -v dialog &> /dev/null; then
        case "$OS" in
            ubuntu|debian)
                missing_tools+=("whiptail")
                ;;
            *)
                missing_tools+=("dialog")
                ;;
        esac
    fi
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log_install "Installing required tools: ${missing_tools[*]}"
        
        # Convert generic names to OS-specific names
        local os_specific_tools=()
        for tool in "${missing_tools[@]}"; do
            os_specific_tools+=($(get_os_package_name "$tool"))
        done
        
        if install_packages "${os_specific_tools[@]}"; then
            log_success "Required tools installed successfully"
        else
            log_error "Failed to install required tools"
            return 1
        fi
    else
        log_success "All required tools are already installed"
    fi
}

# Check system requirements
check_system_requirements() {
    log_step "Checking system requirements..."
    
    local requirements_met=true
    
    # Check if OS is supported
    if ! is_os_supported; then
        log_error "Unsupported operating system: $OS"
        requirements_met=false
    fi
    
    # Check available disk space (need at least 1GB)
    local available_space
    available_space=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
    if [[ $available_space -lt 1 ]]; then
        log_warning "Low disk space available: ${available_space}GB (recommend at least 1GB)"
    fi
    
    # Check memory (need at least 1GB)
    if command -v free &> /dev/null; then
        local available_memory
        available_memory=$(free -m | awk 'NR==2 {print $7}')
        if [[ $available_memory -lt 1024 ]]; then
            log_warning "Low memory available: ${available_memory}MB (recommend at least 1GB)"
        fi
    fi
    
    if [[ "$requirements_met" == "true" ]]; then
        log_success "System requirements check passed"
        return 0
    else
        log_error "System requirements check failed"
        return 1
    fi
}

# Initialize OS detection module
init_os_detection() {
    detect_os
    get_package_manager_commands
    
    log_debug "OS detection module initialized"
}

# Initialize when module is loaded
init_os_detection