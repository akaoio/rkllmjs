#!/bin/bash

# RKLLM.js Core Utilities Module
# Provides core constants, utilities, and common functions

# Script metadata (conditionally set to avoid conflicts)
[[ -z "${SCRIPT_NAME:-}" ]] && readonly SCRIPT_NAME="RKLLM.js Development Setup"
[[ -z "${SCRIPT_VERSION:-}" ]] && readonly SCRIPT_VERSION="1.0.0"
[[ -z "${SCRIPT_DESCRIPTION:-}" ]] && readonly SCRIPT_DESCRIPTION="Interactive development environment setup for RKLLM.js"

# Colors for output
readonly RED='\033[0;31m'
readonly YELLOW='\033[1;33m'
readonly GREEN='\033[0;32m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly NC='\033[0m' # No Color

# Logging levels
readonly LOG_ERROR=1
readonly LOG_WARNING=2
readonly LOG_INFO=3
readonly LOG_SUCCESS=4
readonly LOG_DEBUG=5

# Current log level (can be overridden by environment)
LOG_LEVEL="${LOG_LEVEL:-3}"

# Logging functions
log_debug() {
    echo "[DEBUG] $1" >&2
}

log_info() {
    echo "[INFO] $1"
}

log_success() {
    echo "[SUCCESS] $1"
}

log_warning() {
    echo "[WARNING] $1"
}

log_error() {
    echo "[ERROR] $1" >&2
}

# Enhanced logging with context
log_step() {
    echo -e "${PURPLE}📋 $1${NC}"
}

log_install() {
    echo "[INSTALL] Installing: $1"
}

log_configure() {
    echo "[CONFIGURE] Configuring: $1"
}

# Progress indicators
show_spinner() {
    local pid=$1
    local message="$2"
    local spin_chars='|/-\'
    local i=0
    
    while kill -0 $pid 2>/dev/null; do
        printf "\r${BLUE}%s %c${NC}" "$message" "${spin_chars:$i:1}"
        i=$(( (i + 1) % 4 ))
        sleep 0.1
    done
    printf "\r"
}

# Error handling
handle_error() {
    local exit_code=$?
    local line_number=$1
    local command="$2"
    
    log_error "Error occurred in script at line $line_number"
    log_error "Command: $command"
    log_error "Exit code: $exit_code"
    
    # Cleanup on error
    cleanup_on_error
    
    exit $exit_code
}

# Set up error handling
set_error_handling() {
    set -e  # Exit on any error
    # Temporarily disable strict mode for debugging
    # set -u  # Exit on undefined variables
    set -o pipefail  # Exit on pipe failures
    
    # Set up error trap
    trap 'handle_error $LINENO "$BASH_COMMAND"' ERR
}

# Cleanup function (to be overridden by specific modules)
cleanup_on_error() {
    log_warning "Performing cleanup after error..."
    # Default cleanup - remove any temporary files
    [[ -n "${TEMP_DIR:-}" ]] && [[ -d "$TEMP_DIR" ]] && rm -rf "$TEMP_DIR"
}

# File and directory utilities
ensure_directory() {
    local dir="$1"
    local permissions="${2:-755}"
    
    if [[ ! -d "$dir" ]]; then
        log_debug "Creating directory: $dir"
        mkdir -p "$dir"
        chmod "$permissions" "$dir"
    fi
}

backup_file() {
    local file="$1"
    local backup_suffix="${2:-.backup.$(date +%Y%m%d_%H%M%S)}"
    
    if [[ -f "$file" ]]; then
        local backup_file="${file}${backup_suffix}"
        log_debug "Backing up $file to $backup_file"
        cp "$file" "$backup_file"
        echo "$backup_file"
    fi
}

# Command existence checking
check_command() {
    local cmd="$1"
    local required="${2:-true}"
    
    if command -v "$cmd" &> /dev/null; then
        log_debug "Command available: $cmd"
        return 0
    else
        if [[ "$required" == "true" ]]; then
            log_error "Required command not found: $cmd"
            return 1
        else
            log_warning "Optional command not found: $cmd"
            return 1
        fi
    fi
}

# Network connectivity check
check_network() {
    local host="${1:-google.com}"
    local timeout="${2:-5}"
    
    if ping -c 1 -W "$timeout" "$host" &> /dev/null; then
        log_debug "Network connectivity confirmed"
        return 0
    else
        log_warning "Network connectivity check failed"
        return 1
    fi
}

# Download file with progress
download_file() {
    local url="$1"
    local output_file="$2"
    local show_progress="${3:-true}"
    
    log_info "Downloading: $(basename "$output_file")"
    
    local curl_args=("-L" "-o" "$output_file")
    [[ "$show_progress" == "true" ]] && curl_args+=("--progress-bar")
    
    if curl "${curl_args[@]}" "$url"; then
        log_success "Downloaded: $(basename "$output_file")"
        return 0
    else
        log_error "Failed to download: $url"
        return 1
    fi
}

# Extract archive
extract_archive() {
    local archive="$1"
    local destination="${2:-.}"
    
    log_info "Extracting: $(basename "$archive")"
    
    case "$archive" in
        *.tar.gz|*.tgz)
            tar -xzf "$archive" -C "$destination"
            ;;
        *.tar.bz2|*.tbz2)
            tar -xjf "$archive" -C "$destination"
            ;;
        *.tar.xz|*.txz)
            tar -xJf "$archive" -C "$destination"
            ;;
        *.zip)
            unzip -q "$archive" -d "$destination"
            ;;
        *)
            log_error "Unsupported archive format: $archive"
            return 1
            ;;
    esac
    
    log_success "Extracted: $(basename "$archive")"
}

# Version comparison
version_compare() {
    local version1="$1"
    local operator="$2"
    local version2="$3"
    
    # Use sort -V for version comparison
    case "$operator" in
        "=="|"=")
            [[ "$version1" == "$version2" ]]
            ;;
        "!="|"<>")
            [[ "$version1" != "$version2" ]]
            ;;
        "<")
            [[ "$(printf '%s\n%s\n' "$version1" "$version2" | sort -V | head -n1)" == "$version1" ]] && [[ "$version1" != "$version2" ]]
            ;;
        "<=")
            [[ "$(printf '%s\n%s\n' "$version1" "$version2" | sort -V | head -n1)" == "$version1" ]]
            ;;
        ">")
            [[ "$(printf '%s\n%s\n' "$version1" "$version2" | sort -V | tail -n1)" == "$version1" ]] && [[ "$version1" != "$version2" ]]
            ;;
        ">=")
            [[ "$(printf '%s\n%s\n' "$version1" "$version2" | sort -V | tail -n1)" == "$version1" ]]
            ;;
        *)
            log_error "Invalid version comparison operator: $operator"
            return 1
            ;;
    esac
}

# Get script directory
get_script_dir() {
    echo "$(cd "$(dirname "${BASH_SOURCE[1]}")" &> /dev/null && pwd)"
}

# Get project root directory
get_project_root() {
    local script_dir
    script_dir=$(get_script_dir)
    
    # Assuming script is in scripts/ subdirectory
    echo "$(dirname "$script_dir")"
}

# Create temporary directory
create_temp_dir() {
    local prefix="${1:-rkllmjs}"
    TEMP_DIR=$(mktemp -d -t "${prefix}.XXXXXX")
    export TEMP_DIR
    log_debug "Created temporary directory: $TEMP_DIR"
    echo "$TEMP_DIR"
}

# Cleanup temporary directory
cleanup_temp_dir() {
    if [[ -n "${TEMP_DIR:-}" ]] && [[ -d "$TEMP_DIR" ]]; then
        log_debug "Cleaning up temporary directory: $TEMP_DIR"
        rm -rf "$TEMP_DIR"
        unset TEMP_DIR
    fi
}

# Show script header
show_header() {
    local width=${TERM_COLS:-80}
    local padding=$(( (width - ${#SCRIPT_NAME} - 2) / 2 ))
    
    echo
    printf "%*s" "$width" "" | tr ' ' '='
    echo
    printf "%*s %s %*s\n" "$padding" "" "$SCRIPT_NAME" "$padding" ""
    echo
    echo -e "${YELLOW}⚠️  WARNING: This script is intended for DEVELOPMENT ENVIRONMENT ONLY!${NC}"
    echo -e "${YELLOW}⚠️  Do NOT run this script on production servers or systems!${NC}"
    echo
    printf "%*s" "$width" "" | tr ' ' '='
    echo
}

# Initialize core module
init_core() {
    # Set error handling
    set_error_handling
    
    # Create cleanup trap
    trap cleanup_temp_dir EXIT
    
    # Detect architecture for optimizations
    detect_architecture
    
    log_debug "Core module initialized"
}

# Architecture detection and optimization
detect_architecture() {
    local arch=$(uname -m)
    local cpu_info=""
    
    # Get CPU info if available
    if [[ -f /proc/cpuinfo ]]; then
        cpu_info=$(grep -i "model name\|cpu part" /proc/cpuinfo | head -1 | cut -d: -f2 | xargs)
    fi
    
    # Check for RK3588 specifically
    if [[ "$cpu_info" == *"RK3588"* ]] || [[ -f /proc/device-tree/compatible ]] && grep -q "rockchip,rk3588" /proc/device-tree/compatible 2>/dev/null; then
        export SYSTEM_ARCH="rk3588"
        export SYSTEM_ARCH_FAMILY="arm64"
        log_info "Detected RK3588 ARM64 architecture (optimized for Orange Pi 5 Plus)"
    else
        case "$arch" in
            x86_64|amd64)
                export SYSTEM_ARCH="x86_64"
                export SYSTEM_ARCH_FAMILY="x86_64"
                ;;
            aarch64|arm64)
                export SYSTEM_ARCH="aarch64"
                export SYSTEM_ARCH_FAMILY="arm64"
                ;;
            armv7l|armv6l)
                export SYSTEM_ARCH="arm32"
                export SYSTEM_ARCH_FAMILY="arm32"
                ;;
            *)
                export SYSTEM_ARCH="$arch"
                export SYSTEM_ARCH_FAMILY="unknown"
                log_warning "Unknown architecture: $arch"
                ;;
        esac
    fi
    
    log_debug "Architecture: $SYSTEM_ARCH ($SYSTEM_ARCH_FAMILY)"
}

# Latest version fetching utilities
fetch_latest_nodejs_version() {
    local version_type="${1:-lts}"  # lts, current, or specific major version
    
    log_debug "Fetching latest Node.js version ($version_type)"
    
    # For LTS versions, use the Node.js API
    if [[ "$version_type" == "lts" ]]; then
        local latest_version
        latest_version=$(curl -s https://nodejs.org/dist/index.json | grep -o '"version":"[^"]*' | head -1 | cut -d'"' -f4 | sed 's/^v//')
        
        if [[ -n "$latest_version" ]]; then
            echo "$latest_version"
        else
            # Fallback to known stable version
            echo "20.11.0"
        fi
    elif [[ "$version_type" == "current" ]]; then
        # Get the latest current version
        local latest_version
        latest_version=$(curl -s https://nodejs.org/dist/index.json | grep -o '"version":"[^"]*' | head -1 | cut -d'"' -f4 | sed 's/^v//')
        echo "${latest_version:-21.6.0}"
    else
        # Specific major version (e.g., "20" for Node 20.x)
        local major_version="$version_type"
        local latest_version
        latest_version=$(curl -s https://nodejs.org/dist/index.json | grep -o '"version":"v'${major_version}'[^"]*' | head -1 | cut -d'"' -f4 | sed 's/^v//')
        echo "${latest_version:-${major_version}.0.0}"
    fi
}

fetch_latest_bun_version() {
    log_debug "Fetching latest Bun version"
    
    local latest_version
    latest_version=$(curl -s https://api.github.com/repos/oven-sh/bun/releases/latest | grep '"tag_name"' | cut -d'"' -f4 | sed 's/^bun-v//')
    
    if [[ -n "$latest_version" ]]; then
        echo "$latest_version"
    else
        # Fallback to known stable version
        echo "1.0.25"
    fi
}

fetch_latest_deno_version() {
    log_debug "Fetching latest Deno version"
    
    local latest_version
    latest_version=$(curl -s https://api.github.com/repos/denoland/deno/releases/latest | grep '"tag_name"' | cut -d'"' -f4 | sed 's/^v//')
    
    if [[ -n "$latest_version" ]]; then
        echo "$latest_version"
    else
        # Fallback to known stable version
        echo "1.40.0"
    fi
}

fetch_latest_yarn_version() {
    local version_type="${1:-berry}"  # berry (4.x) or classic (1.x)
    
    log_debug "Fetching latest Yarn version ($version_type)"
    
    if [[ "$version_type" == "berry" ]]; then
        # Get latest Yarn Berry (4.x)
        local latest_version
        latest_version=$(curl -s https://api.github.com/repos/yarnpkg/berry/releases/latest | grep '"tag_name"' | cut -d'"' -f4 | sed 's/^@yarnpkg\/cli\///')
        echo "${latest_version:-4.0.2}"
    else
        # Get latest Yarn Classic (1.x)
        local latest_version
        latest_version=$(curl -s https://api.github.com/repos/yarnpkg/yarn/releases/latest | grep '"tag_name"' | cut -d'"' -f4 | sed 's/^v//')
        echo "${latest_version:-1.22.19}"
    fi
}

# Check if system is optimized for ARM64 compilation
is_arm64_optimized() {
    [[ "$SYSTEM_ARCH_FAMILY" == "arm64" ]] && return 0 || return 1
}

# Detect RKLLM mode based on environment and hardware
detect_rkllm_mode() {
# Detect RKLLM capabilities based on hardware
detect_rkllm_mode() {
    log_debug "Detecting RKLLM hardware capabilities..."
    
    # Ensure architecture is detected first
    if [[ -z "$SYSTEM_ARCH" ]]; then
        detect_architecture
    fi
    
    # Check hardware capabilities for RKLLM
    if [[ "$SYSTEM_ARCH" == "rk3588" ]]; then
        export RKLLM_HARDWARE_SUPPORTED="true"
        export RKLLM_MODE_DETECTED="production"
        log_info "RKLLM hardware detected: RK3588 NPU available"
    else
        export RKLLM_HARDWARE_SUPPORTED="false"
        export RKLLM_MODE_DETECTED="production"
        log_info "RKLLM hardware not detected: Running in CPU-only mode"
    fi
}

# Get RKLLM mode (always production)
get_rkllm_mode() {
    if [[ -z "$RKLLM_MODE_DETECTED" ]]; then
        detect_rkllm_mode
    fi
    echo "$RKLLM_MODE_DETECTED"
}

# Get optimal compilation flags for the current architecture
get_arch_compile_flags() {
    case "$SYSTEM_ARCH" in
        rk3588)
            # RK3588 specific optimizations
            echo "-march=armv8-a+crc -mtune=cortex-a76 -mfpu=neon-fp-armv8 -O2"
            ;;
        aarch64)
            # Generic ARM64 optimizations
            echo "-march=armv8-a -mtune=generic -O2"
            ;;
        x86_64)
            # Generic x86_64 optimizations
            echo "-march=x86-64 -mtune=generic -O2"
            ;;
        *)
            # Safe fallback
            echo "-O2"
            ;;
    esac
}

# Initialize when module is loaded
init_core