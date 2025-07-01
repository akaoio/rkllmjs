#!/bin/bash

# RKLLMJS C++ Build Orchestration Script
# Builds all C++ modules in dependency order

set -e

echo "🔨 RKLLMJS C++ Build System"
echo "============================"

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BINDINGS_DIR="$SCRIPT_DIR"
BUILD_DIR="$BINDINGS_DIR/../../build"
LOG_DIR="$BUILD_DIR/logs"

# Create build directories
mkdir -p "$BUILD_DIR"/{lib,include,bin}
mkdir -p "$LOG_DIR"

# Build configuration
BUILD_TYPE="${BUILD_TYPE:-Release}"
PARALLEL_JOBS="${PARALLEL_JOBS:-$(nproc)}"
VERBOSE="${VERBOSE:-0}"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Module build order (dependencies first)
declare -a MODULES=(
    "utils"
    "core" 
    "memory"
    "inference"
    "adapters"
    "napi-bindings"
)

# Source core module for architecture and mode detection
if [ -f "$BINDINGS_DIR/../../scripts/modules/core.sh" ]; then
    source "$BINDINGS_DIR/../../scripts/modules/core.sh"
    init_core
    detect_rkllm_mode
else
    log_warning "Core module not found, using basic mode detection"
    # Basic fallback mode detection
    if [[ -n "$RKLLM_MODE" ]]; then
        mode=$(echo "$RKLLM_MODE" | tr '[:upper:]' '[:lower:]')
        if [[ "$mode" == "real" ]]; then
            export RKLLM_MODE_DETECTED="real"
        else
            export RKLLM_MODE_DETECTED="sandbox"
        fi
    else
        export RKLLM_MODE_DETECTED="sandbox"
    fi
fi

# Set compilation flags based on detected mode
if [[ "$RKLLM_MODE_DETECTED" == "real" ]]; then
    export RKLLM_COMPILE_MODE_REAL=1
    export REAL_BUILD=1
    unset SANDBOX_BUILD
    log_info "Building in REAL mode (RK3588 hardware support enabled)"
else
    export RKLLM_COMPILE_MODE_SANDBOX=1
    export SANDBOX_BUILD=1
    unset REAL_BUILD
    log_info "Building in SANDBOX mode (simulation/testing mode)"
fi

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check compiler
    if ! command -v g++ &> /dev/null; then
        log_error "g++ compiler not found"
        exit 1
    fi
    
    # Check Node.js headers (look in local node_modules first)
    PROJECT_ROOT="$BINDINGS_DIR/../.."
    if [ -d "$PROJECT_ROOT/node_modules/node-addon-api" ]; then
        # Use local installation
        ADDON_API_PATH="$PROJECT_ROOT/node_modules/node-addon-api"
    elif node -p "require('node-addon-api').include" &> /dev/null; then
        # Fall back to global installation
        ADDON_API_PATH=""
    else
        log_error "Node.js addon API not found. Run: npm install"
        exit 1
    fi
    
    # Check RKLLM library
    RKLLM_LIB_PATH="$BINDINGS_DIR/../../libs/rkllm"
    if [ ! -d "$RKLLM_LIB_PATH" ]; then
        log_error "RKLLM library not found at $RKLLM_LIB_PATH"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Build a single module
build_module() {
    local module_name="$1"
    local module_dir="$BINDINGS_DIR/$module_name"
    
    if [ ! -d "$module_dir" ]; then
        log_warning "Module directory not found: $module_dir"
        return 1
    fi
    
    if [ ! -f "$module_dir/Makefile" ]; then
        log_warning "No Makefile found in $module_dir"
        return 1
    fi
    
    log_info "Building module: $module_name"
    
    # Ensure log directory exists
    mkdir -p "$LOG_DIR"
    
    # Build the module
    local log_file="$LOG_DIR/build-$module_name.log"
    
    if [ "$VERBOSE" -eq 1 ]; then
        ( cd "$module_dir" && make -j"$PARALLEL_JOBS" all ) 2>&1 | tee "$log_file"
    else
        ( cd "$module_dir" && make -j"$PARALLEL_JOBS" all ) > "$log_file" 2>&1
    fi
    
    if [ $? -eq 0 ]; then
        log_success "Module $module_name built successfully"
        return 0
    else
        log_error "Module $module_name build failed. Check log: $log_file"
        if [ "$VERBOSE" -eq 0 ]; then
            echo "Last 10 lines of build log:"
            tail -n 10 "$log_file"
        fi
        return 1
    fi
}

# Install a single module
install_module() {
    local module_name="$1"
    local module_dir="$BINDINGS_DIR/$module_name"
    
    if [ ! -d "$module_dir" ]; then
        return 1
    fi
    
    if [ ! -f "$module_dir/Makefile" ]; then
        return 1
    fi
    
    log_info "Installing module: $module_name"
    
    local log_file="$LOG_DIR/install-$module_name.log"
    
    if [ "$VERBOSE" -eq 1 ]; then
        ( cd "$module_dir" && make install ) 2>&1 | tee "$log_file"
    else
        ( cd "$module_dir" && make install ) > "$log_file" 2>&1
    fi
    
    if [ $? -eq 0 ]; then
        log_success "Module $module_name installed successfully"
        return 0
    else
        log_error "Module $module_name installation failed. Check log: $log_file"
        return 1
    fi
}

# Clean a single module
clean_module() {
    local module_name="$1"
    local module_dir="$BINDINGS_DIR/$module_name"
    
    if [ ! -d "$module_dir" ]; then
        return 0
    fi
    
    if [ ! -f "$module_dir/Makefile" ]; then
        return 0
    fi
    
    log_info "Cleaning module: $module_name"
    
    ( cd "$module_dir" && make clean ) > /dev/null 2>&1
    
    log_success "Module $module_name cleaned"
}

# Build all modules
build_all() {
    log_info "Building all C++ modules..."
    
    local failed_modules=()
    
    for module in "${MODULES[@]}"; do
        if ! build_module "$module"; then
            failed_modules+=("$module")
        fi
    done
    
    if [ ${#failed_modules[@]} -eq 0 ]; then
        log_success "All modules built successfully"
        return 0
    else
        log_error "Failed to build modules: ${failed_modules[*]}"
        return 1
    fi
}

# Install all modules
install_all() {
    log_info "Installing all C++ modules..."
    
    local failed_modules=()
    
    for module in "${MODULES[@]}"; do
        if ! install_module "$module"; then
            failed_modules+=("$module")
        fi
    done
    
    if [ ${#failed_modules[@]} -eq 0 ]; then
        log_success "All modules installed successfully"
        return 0
    else
        log_error "Failed to install modules: ${failed_modules[*]}"
        return 1
    fi
}

# Clean all modules
clean_all() {
    log_info "Cleaning all C++ modules and build cache..."
    
    for module in "${MODULES[@]}"; do
        clean_module "$module"
    done
    
    # Clean global build directory
    rm -rf "$BUILD_DIR"/{lib,include,bin}/*
    
    # Clean log files but keep directory structure
    rm -rf "$LOG_DIR"/*
    
    # Recreate necessary directories
    mkdir -p "$BUILD_DIR"/{lib,include,bin}
    mkdir -p "$LOG_DIR"
    
    # Clean Node.js build cache
    rm -rf "$BINDINGS_DIR/../../build"
    rm -rf "$BINDINGS_DIR/../../node_modules/.cache"
    
    # Clean any leftover object files
    find "$BINDINGS_DIR" -name "*.o" -type f -delete 2>/dev/null || true
    find "$BINDINGS_DIR" -name "*.a" -type f -delete 2>/dev/null || true
    find "$BINDINGS_DIR" -name "binding.node" -type f -delete 2>/dev/null || true
    
    log_success "All modules and build cache cleaned"
}

# Create final binding
create_binding() {
    log_info "Creating final Node.js binding..."
    
    local binding_dir="$BINDINGS_DIR/napi-bindings"
    local binding_log="$LOG_DIR/binding.log"
    
    if [ ! -d "$binding_dir" ]; then
        log_error "N-API bindings module not found"
        return 1
    fi
    
    # Link all module libraries into final binding
    if [ "$VERBOSE" -eq 1 ]; then
        ( cd "$binding_dir" && make binding ) 2>&1 | tee "$binding_log"
    else
        ( cd "$binding_dir" && make binding ) > "$binding_log" 2>&1
    fi
    
    if [ $? -eq 0 ]; then
        log_success "Node.js binding created successfully"
        
        # Copy to root build directory
        cp "$binding_dir/bin/binding.node" "$BUILD_DIR/../build/Release/" 2>/dev/null || true
        
        return 0
    else
        log_error "Failed to create Node.js binding. Check log: $binding_log"
        return 1
    fi
}

# Generate build report
generate_report() {
    local report_file="$BUILD_DIR/build-report.txt"
    
    echo "RKLLMJS C++ Build Report" > "$report_file"
    echo "========================" >> "$report_file"
    echo "Generated: $(date)" >> "$report_file"
    echo "Build Type: $BUILD_TYPE" >> "$report_file"
    echo "Parallel Jobs: $PARALLEL_JOBS" >> "$report_file"
    echo "" >> "$report_file"
    
    echo "Modules Built:" >> "$report_file"
    for module in "${MODULES[@]}"; do
        local module_dir="$BINDINGS_DIR/$module"
        local success=false
        
        # Check for different possible library names and locations
        case "$module" in
            "core")
                if [ -f "$module_dir/librkllm-manager.a" ]; then
                    success=true
                fi
                ;;
            "utils")
                if [ -f "$module_dir/bin/librkllm-utils.a" ] || [ -f "$module_dir/librkllm-utils.a" ]; then
                    success=true
                fi
                ;;
            "memory")
                if [ -f "$module_dir/bin/librkllm-memory.a" ] || [ -f "$module_dir/librkllm-memory.a" ]; then
                    success=true
                fi
                ;;
            "inference")
                if [ -f "$module_dir/bin/librkllm-inference.a" ] || [ -f "$module_dir/librkllm-inference.a" ]; then
                    success=true
                fi
                ;;
            "config")
                if [ -f "$module_dir/bin/librkllm-config.a" ] || [ -f "$module_dir/librkllm-config.a" ] || [ -f "$module_dir/libconfig-manager.a" ]; then
                    success=true
                fi
                ;;
            "adapters")
                if [ -f "$module_dir/bin/librkllm-adapters.a" ] || [ -f "$module_dir/librkllm-adapters.a" ]; then
                    success=true
                fi
                ;;
            "napi-bindings")
                if [ -f "$module_dir/bin/binding.node" ] || [ -f "$module_dir/binding.node" ] || [ -f "$BUILD_DIR/binding.node" ] || [ -f "$module_dir/bin/librkllm-napi-bindings.a" ]; then
                    success=true
                fi
                ;;
            *)
                # Default pattern - check both bin/ and module root
                if [ -f "$module_dir/bin/librkllm-$module.a" ] || [ -f "$module_dir/librkllm-$module.a" ]; then
                    success=true
                fi
                ;;
        esac
        
        if [ "$success" = true ]; then
            echo "  ✅ $module" >> "$report_file"
        else
            echo "  ❌ $module" >> "$report_file"
        fi
    done
    
    echo "" >> "$report_file"
    echo "Build Artifacts:" >> "$report_file"
    echo "  Libraries: $(find "$BUILD_DIR/lib" -name "*.a" 2>/dev/null | wc -l)" >> "$report_file"
    echo "  Headers: $(find "$BUILD_DIR/include" -name "*.hpp" 2>/dev/null | wc -l)" >> "$report_file"
    local binding_count=$(find "$BINDINGS_DIR" -name "binding.node" 2>/dev/null | wc -l)
    echo "  Bindings: $binding_count" >> "$report_file"
    
    log_info "Build report generated: $report_file"
}

# Show help
show_help() {
    echo "RKLLMJS C++ Build System"
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  build [MODULE]    Build all modules or specific module"
    echo "  install [MODULE]  Install all modules or specific module"
    echo "  clean [MODULE]    Clean all modules or specific module"
    echo "  binding           Create final Node.js binding"
    echo "  report            Generate build report"
    echo "  help              Show this help message"
    echo ""
    echo "Options:"
    echo "  --verbose, -v     Enable verbose output"
    echo "  --jobs, -j N      Number of parallel jobs (default: $(nproc))"
    echo "  --type TYPE       Build type: Debug|Release (default: Release)"
    echo ""
    echo "Environment Variables:"
    echo "  BUILD_TYPE        Build type (Debug|Release)"
    echo "  PARALLEL_JOBS     Number of parallel jobs"
    echo "  VERBOSE           Enable verbose output (1|0)"
    echo ""
    echo "Examples:"
    echo "  $0 build                  # Build all modules"
    echo "  $0 build utils            # Build only utils module"
    echo "  $0 clean && $0 build      # Clean and rebuild all"
    echo "  $0 --verbose build        # Build with verbose output"
    echo "  $0 -j 8 build             # Build with 8 parallel jobs"
}

# Parse command line arguments
COMMAND="build"
MODULE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --verbose|-v)
            VERBOSE=1
            shift
            ;;
        --jobs|-j)
            PARALLEL_JOBS="$2"
            shift 2
            ;;
        --type)
            BUILD_TYPE="$2"
            shift 2
            ;;
        build|install|clean|binding|report|help)
            COMMAND="$1"
            shift
            ;;
        -*)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
        *)
            if [ -z "$MODULE" ]; then
                MODULE="$1"
            else
                echo "Too many arguments"
                show_help
                exit 1
            fi
            shift
            ;;
    esac
done

# Main execution
main() {
    case "$COMMAND" in
        build)
            # Clean all cache first to ensure fresh build
            log_info "Cleaning all cache before build..."
            clean_all
            check_prerequisites
            if [ -n "$MODULE" ]; then
                build_module "$MODULE"
            else
                build_all && install_all
            fi
            ;;
        install)
            if [ -n "$MODULE" ]; then
                install_module "$MODULE"
            else
                install_all
            fi
            ;;
        clean)
            if [ -n "$MODULE" ]; then
                clean_module "$MODULE"
            else
                clean_all
            fi
            ;;
        binding)
            check_prerequisites
            create_binding
            ;;
        report)
            generate_report
            ;;
        help)
            show_help
            ;;
        *)
            echo "Unknown command: $COMMAND"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"

# Exit with appropriate code
if [ $? -eq 0 ]; then
    echo ""
    log_success "Build operation completed successfully"
    generate_report
    exit 0
else
    echo ""
    log_error "Build operation failed"
    exit 1
fi
