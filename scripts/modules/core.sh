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
    [[ ${LOG_LEVEL:-3} -ge ${LOG_DEBUG:-5} ]] && echo -e "${CYAN}[DEBUG] $1${NC}" >&2 || true
}

log_info() {
    [[ ${LOG_LEVEL:-3} -ge ${LOG_INFO:-3} ]] && echo -e "${BLUE}ℹ️  $1${NC}" || true
}

log_success() {
    [[ ${LOG_LEVEL:-3} -ge ${LOG_SUCCESS:-4} ]] && echo -e "${GREEN}✅ $1${NC}" || true
}

log_warning() {
    [[ ${LOG_LEVEL:-3} -ge ${LOG_WARNING:-2} ]] && echo -e "${YELLOW}⚠️  $1${NC}" || true
}

log_error() {
    [[ ${LOG_LEVEL:-3} -ge ${LOG_ERROR:-1} ]] && echo -e "${RED}❌ $1${NC}" >&2 || true
}

# Enhanced logging with context
log_step() {
    echo -e "${PURPLE}📋 $1${NC}"
}

log_install() {
    echo -e "${BLUE}📦 Installing: $1${NC}"
}

log_configure() {
    echo -e "${CYAN}⚙️  Configuring: $1${NC}"
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
    
    log_debug "Core module initialized"
}

# Initialize when module is loaded
init_core