#!/bin/bash

# RKLLM.js Module Loader System
# Provides safe module loading with dependency management and error handling

set -e

# Global variables for module system
declare -A LOADED_MODULES
declare -A MODULE_DEPENDENCIES
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
MODULES_DIR="${SCRIPT_DIR}/../modules"

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[MODULE] $1${NC}" >&2
}

log_success() {
    echo -e "${GREEN}[MODULE] ✅ $1${NC}" >&2
}

log_warning() {
    echo -e "${YELLOW}[MODULE] ⚠️  $1${NC}" >&2
}

log_error() {
    echo -e "${RED}[MODULE] ❌ $1${NC}" >&2
}

# Check if module is already loaded
is_module_loaded() {
    local module_name="$1"
    [[ -n "${LOADED_MODULES[$module_name]:-}" ]]
}

# Validate module file exists and is readable
validate_module() {
    local module_name="$1"
    local module_path="${MODULES_DIR}/${module_name}.sh"
    
    if [[ ! -f "$module_path" ]]; then
        log_error "Module file not found: $module_path"
        return 1
    fi
    
    if [[ ! -r "$module_path" ]]; then
        log_error "Module file not readable: $module_path"
        return 1
    fi
    
    return 0
}

# Load a single module
load_module() {
    local module_name="$1"
    
    # Check if already loaded
    if is_module_loaded "$module_name"; then
        log_info "Module '$module_name' already loaded, skipping"
        return 0
    fi
    
    # Validate module exists
    if ! validate_module "$module_name"; then
        return 1
    fi
    
    local module_path="${MODULES_DIR}/${module_name}.sh"
    
    log_info "Loading module: $module_name"
    
    # Load the module with error handling
    if source "$module_path"; then
        LOADED_MODULES["$module_name"]=1
        log_success "Module loaded: $module_name"
        return 0
    else
        log_error "Failed to load module: $module_name"
        return 1
    fi
}

# Load multiple modules with dependency resolution
load_modules() {
    local modules=("$@")
    local failed_modules=()
    
    log_info "Loading ${#modules[@]} modules..."
    
    for module in "${modules[@]}"; do
        if ! load_module "$module"; then
            failed_modules+=("$module")
        fi
    done
    
    if [[ ${#failed_modules[@]} -gt 0 ]]; then
        log_error "Failed to load modules: ${failed_modules[*]}"
        return 1
    fi
    
    log_success "All modules loaded successfully"
    return 0
}

# Require a module (load if not already loaded)
require_module() {
    local module_name="$1"
    
    if ! is_module_loaded "$module_name"; then
        load_module "$module_name"
    else
        return 0
    fi
}

# List all available modules
list_available_modules() {
    log_info "Available modules:"
    for module_file in "${MODULES_DIR}"/*.sh; do
        if [[ -f "$module_file" ]]; then
            local module_name=$(basename "$module_file" .sh)
            echo "  - $module_name"
        fi
    done
}

# List loaded modules
list_loaded_modules() {
    log_info "Loaded modules:"
    for module_name in "${!LOADED_MODULES[@]}"; do
        echo "  - $module_name ✅"
    done
}

# Unload a module (for testing purposes)
unload_module() {
    local module_name="$1"
    
    if is_module_loaded "$module_name"; then
        unset LOADED_MODULES["$module_name"]
        log_info "Module unloaded: $module_name"
    else
        log_warning "Module not loaded: $module_name"
    fi
}

# Initialize module system
init_module_system() {
    log_info "Initializing module system"
    
    if [[ ! -d "$MODULES_DIR" ]]; then
        log_error "Modules directory not found: $MODULES_DIR"
        return 1
    fi
    
    log_success "Module system initialized"
    log_info "Modules directory: $MODULES_DIR"
    return 0
}

# Export functions for use by other scripts
export -f load_module
export -f load_modules  
export -f require_module
export -f is_module_loaded
export -f list_available_modules
export -f list_loaded_modules