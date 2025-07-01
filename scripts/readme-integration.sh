#!/bin/bash

# RKLLMJS README Generator Integration Script
# Integrates README generation into build and validation processes

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
README_GENERATOR="$PROJECT_ROOT/src/bindings/readme-generator/readme-generator-cli"
README_CONFIG="$PROJECT_ROOT/configs/readme-generator.json"
README_TEMPLATE="$PROJECT_ROOT/configs/readme-template.md"

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if README generator is built
check_readme_generator() {
    if [ ! -f "$README_GENERATOR" ]; then
        log_warning "README generator not found. Building..."
        cd "$PROJECT_ROOT/src/bindings/readme-generator"
        make clean && make all
        
        if [ ! -f "$README_GENERATOR" ]; then
            log_error "Failed to build README generator"
            return 1
        fi
        
        log_success "README generator built successfully"
    fi
    return 0
}

# Validate all modules without generating
validate_modules() {
    log_info "Validating all modules with README generator..."
    
    if ! check_readme_generator; then
        return 1
    fi
    
    local errors=0
    local modules=(
        "src/bindings/core"
        "src/bindings/inference"
        "src/bindings/memory"
        "src/bindings/adapters"
        "src/bindings/utils"
        "src/bindings/readme-generator"
        "src/bindings/napi-bindings"
        "src/model-manager"
        "src/rkllm-client"
        "src/cli-runner"
        "src/runtime-detector"
        "src/rkllm-types"
        "src/model-types"
    )
    
    for module in "${modules[@]}"; do
        if [ -d "$PROJECT_ROOT/$module" ]; then
            log_info "Validating module: $module"
            if ! "$README_GENERATOR" --validate-only "$PROJECT_ROOT/$module" >/dev/null 2>&1; then
                log_error "Module validation failed: $module"
                errors=$((errors + 1))
            else
                log_success "Module validation passed: $module"
            fi
        fi
    done
    
    if [ $errors -eq 0 ]; then
        log_success "All modules validated successfully"
        return 0
    else
        log_error "$errors module(s) failed validation"
        return 1
    fi
}

# Generate READMEs for all modules
generate_readmes() {
    log_info "Generating READMEs for all modules..."
    
    if ! check_readme_generator; then
        return 1
    fi
    
    local force_flag=""
    if [ "$1" = "--force" ]; then
        force_flag="--force"
        log_warning "Forcing overwrite of existing README files"
    fi
    
    local errors=0
    local generated=0
    
    # Use recursive mode for all C++ modules
    log_info "Generating READMEs for C++ modules..."
    if "$README_GENERATOR" --recursive $force_flag --verbose --config "$README_CONFIG" --template "$README_TEMPLATE" "$PROJECT_ROOT/src/bindings"; then
        log_success "C++ modules processed"
        generated=$((generated + 1))
    else
        log_error "Failed to process C++ modules"
        errors=$((errors + 1))
    fi
    
    # Process TypeScript modules individually
    local ts_modules=(
        "src/model-manager"
        "src/rkllm-client"
        "src/cli-runner"
        "src/runtime-detector"
        "src/rkllm-types"
        "src/model-types"
        "src/testing"
    )
    
    for module in "${ts_modules[@]}"; do
        if [ -d "$PROJECT_ROOT/$module" ]; then
            log_info "Generating README for: $module"
            if "$README_GENERATOR" $force_flag --config "$README_CONFIG" --template "$README_TEMPLATE" "$PROJECT_ROOT/$module"; then
                log_success "Generated README for: $module"
                generated=$((generated + 1))
            else
                log_error "Failed to generate README for: $module"
                errors=$((errors + 1))
            fi
        fi
    done
    
    if [ $errors -eq 0 ]; then
        log_success "Generated READMEs for $generated module(s)"
        return 0
    else
        log_error "$errors module(s) failed README generation"
        return 1
    fi
}

# Show usage information
show_usage() {
    echo "RKLLMJS README Generator Integration"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  validate      Validate all modules without generating READMEs"
    echo "  generate      Generate READMEs for all modules"
    echo "  help          Show this help message"
    echo ""
    echo "Options:"
    echo "  --force       Overwrite existing README files (for generate command)"
    echo ""
    echo "Examples:"
    echo "  $0 validate"
    echo "  $0 generate"
    echo "  $0 generate --force"
}

# Main script logic
main() {
    case "$1" in
        "validate")
            validate_modules
            ;;
        "generate")
            generate_readmes "$2"
            ;;
        "help"|"--help"|"-h")
            show_usage
            ;;
        "")
            log_info "No command specified. Running validation..."
            validate_modules
            ;;
        *)
            log_error "Unknown command: $1"
            show_usage
            exit 1
            ;;
    esac
}

# Change to project root
cd "$PROJECT_ROOT"

# Run main function with all arguments
main "$@"