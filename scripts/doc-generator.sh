#!/bin/bash

# RKLLMJS Documentation Generator
# Unified system for generating both RULES.md and module README files
# Replaces C++ implementation with faster bash-based generation

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VALIDATORS_DIR="$SCRIPT_DIR/validators"
RULES_OUTPUT_FILE="$PROJECT_ROOT/RULES.md"
README_TEMPLATE="$PROJECT_ROOT/configs/readme-template.md"
README_CONFIG="$PROJECT_ROOT/configs/readme-generator.json"

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

# Parse @rule comments from validator files
parse_validator_rules() {
    local validator_file="$1"
    local module_name=$(basename "$validator_file" .sh)
    
    log_info "Parsing rules from $validator_file"
    
    # Read file line by line and extract @rule blocks
    local in_rule_block=false
    local rule_name=""
    local rule_description=""
    local rule_details=""
    local function_name=""
    
    while IFS= read -r line; do
        # Check for @rule comment
        if [[ "$line" =~ ^#[[:space:]]*@rule[[:space:]]+([a-zA-Z_][a-zA-Z0-9_]*) ]]; then
            # If we were in a previous rule block, output it
            if [ "$in_rule_block" = true ] && [ -n "$rule_name" ]; then
                output_rule "$module_name" "$rule_name" "$rule_description" "$rule_details" "$function_name"
            fi
            
            # Start new rule block
            in_rule_block=true
            rule_name="${BASH_REMATCH[1]}"
            rule_description=""
            rule_details=""
            function_name=""
            
        # Check for rule description (first comment line after @rule)
        elif [ "$in_rule_block" = true ] && [[ "$line" =~ ^#[[:space:]]*(.+) ]] && [ -z "$rule_description" ]; then
            rule_description="${BASH_REMATCH[1]}"
            
        # Check for rule details (additional comment lines)
        elif [ "$in_rule_block" = true ] && [[ "$line" =~ ^#[[:space:]]*(.+) ]]; then
            if [ -n "$rule_details" ]; then
                rule_details="$rule_details${BASH_REMATCH[1]}"
            else
                rule_details="${BASH_REMATCH[1]}"
            fi
            
        # Check for function definition
        elif [ "$in_rule_block" = true ] && [[ "$line" =~ ^([a-zA-Z_][a-zA-Z0-9_]*)\(\)[[:space:]]*\{ ]]; then
            function_name="${BASH_REMATCH[1]}"
            
            # Output the rule
            output_rule "$module_name" "$rule_name" "$rule_description" "$rule_details" "$function_name"
            
            # Reset for next rule
            in_rule_block=false
            rule_name=""
            rule_description=""
            rule_details=""
            function_name=""
            
        # Check if we hit a non-comment line without finding function (end of rule block)
        elif [ "$in_rule_block" = true ] && [[ ! "$line" =~ ^#.*$ ]] && [[ ! "$line" =~ ^[[:space:]]*$ ]]; then
            in_rule_block=false
            rule_name=""
            rule_description=""
            rule_details=""
            function_name=""
        fi
        
    done < "$validator_file"
    
    # Handle last rule if file ends while in rule block
    if [ "$in_rule_block" = true ] && [ -n "$rule_name" ]; then
        output_rule "$module_name" "$rule_name" "$rule_description" "$rule_details" "$function_name"
    fi
}

# Output a parsed rule in markdown format
output_rule() {
    local module_name="$1"
    local rule_name="$2" 
    local rule_description="$3"
    local rule_details="$4"
    local function_name="$5"
    
    # Write to temporary variable to be used in generate_rules_md
    cat >> "$TEMP_RULES_FILE" << EOF

### 🔹 $rule_name

**Function**: \`$function_name\`  
**Module**: \`$module_name.sh\`  
**Description**: $rule_description

EOF

    if [ -n "$rule_details" ]; then
        echo "$rule_details" >> "$TEMP_RULES_FILE"
        echo "" >> "$TEMP_RULES_FILE"
    fi
}

# Generate complete RULES.md file
generate_rules_md() {
    log_info "Generating RULES.md from validator comments..."
    
    # Create temporary file for parsed rules
    TEMP_RULES_FILE=$(mktemp)
    
    # Write header
    cat > "$RULES_OUTPUT_FILE" << 'EOF'
# RKLLMJS Development Rules

> **Automatically generated from validator comments - DO NOT EDIT MANUALLY**

---

## 🎯 Project Status

**ACHIEVED**: Real AI inference working on RK3588 NPU with Qwen2.5-VL-7B-Instruct model (1.33 tokens/sec, 100% NPU utilization). Complete TypeScript ↔ C++ ↔ NPU pipeline implemented with modular architecture.

**Architecture**: TypeScript API → C++ N-API Layer → librkllmrt.so (Rockchip NPU)

---

## 📋 Validation Rules

The following rules are automatically enforced by the validation system:

EOF

    # Parse all validator files
    for validator_file in "$VALIDATORS_DIR"/*.sh; do
        if [ -f "$validator_file" ] && [ "$(basename "$validator_file")" != "core.sh" ]; then
            parse_validator_rules "$validator_file"
        fi
    done
    
    # Parse core.sh separately to include utility functions
    if [ -f "$VALIDATORS_DIR/core.sh" ]; then
        echo "## 📚 Core Validation Utilities" >> "$TEMP_RULES_FILE"
        echo "" >> "$TEMP_RULES_FILE"
        parse_validator_rules "$VALIDATORS_DIR/core.sh"
    fi
    
    # Append parsed rules to output file
    cat "$TEMP_RULES_FILE" >> "$RULES_OUTPUT_FILE"
    
    # Add footer
    cat >> "$RULES_OUTPUT_FILE" << 'EOF'

---

## 🔍 Validator Script

The `scripts/validate.sh` enforces compliance by running all validation modules:
1. **TypeScript validation**: 1:1 test coverage for .ts files
2. **C++ validation**: Modular architecture and test coverage
3. **Test structure validation**: Proper test hierarchy
4. **Documentation validation**: README.md coverage and naming conventions

**Exit Codes**: 0=pass, 1=validation errors found

---

## 🏗️ Development Philosophy

### Test-Driven Development
**MANDATORY**: Write failing unit test → minimal passing code → refactor → integration tests

### Pull Request Requirements
- ✅ 100% RULES.md compliance
- ✅ Complete 1:1 test coverage  
- ✅ All tests pass
- ✅ Validator passes
- ✅ No breaking changes without migration guide

---

*Generated automatically by RKLLMJS Doc Generator*
EOF

    # Clean up
    rm "$TEMP_RULES_FILE"
    
    log_success "Generated RULES.md with $(grep -c "^### 🔹" "$RULES_OUTPUT_FILE") rules"
}

# Validate that all validator functions have @rule comments
validate_rule_comments() {
    log_info "Validating that all validator functions have @rule comments..."
    
    local missing_comments=0
    
    for validator_file in "$VALIDATORS_DIR"/*.sh; do
        if [ -f "$validator_file" ]; then
            local module_name=$(basename "$validator_file" .sh)
            log_info "Checking $module_name for missing @rule comments..."
            
            # Find all function definitions
            while IFS= read -r function_line; do
                local function_name=$(echo "$function_line" | sed 's/^\([a-zA-Z_][a-zA-Z0-9_]*\)().*/\1/')
                
                # Skip utility functions that start with get_, reset_, print_, log_
                if [[ "$function_name" =~ ^(get_|reset_|log_|print_) ]]; then
                    continue
                fi
                
                # Check if there's a @rule comment before this function
                local line_num=$(grep -n "^$function_name()" "$validator_file" | cut -d: -f1)
                if [ -n "$line_num" ]; then
                    # Look for @rule comment in the 5 lines before the function
                    local start_line=$((line_num - 5))
                    if [ $start_line -lt 1 ]; then start_line=1; fi
                    
                    local has_rule_comment=$(sed -n "${start_line},${line_num}p" "$validator_file" | grep -c "@rule $function_name" || true)
                    
                    if [ "$has_rule_comment" -eq 0 ]; then
                        log_error "Missing @rule comment for function: $function_name in $module_name.sh"
                        missing_comments=$((missing_comments + 1))
                    fi
                fi
                
            done < <(grep "^[a-zA-Z_][a-zA-Z0-9_]*() {" "$validator_file")
        fi
    done
    
    if [ $missing_comments -eq 0 ]; then
        log_success "All validator functions have proper @rule comments"
        return 0
    else
        log_error "$missing_comments function(s) missing @rule comments"
        return 1
    fi
}

# =============================================================================
# MODULE README GENERATION FUNCTIONS
# =============================================================================

# Analyze a source file and extract information
analyze_source_file() {
    local file_path="$1"
    local file_type=$(detect_file_type "$file_path")
    local file_name=$(basename "$file_path")
    
    case "$file_type" in
        "cpp"|"hpp")
            analyze_cpp_file "$file_path"
            ;;
        "ts"|"js")
            analyze_typescript_file "$file_path"
            ;;
        *)
            log_warning "Unsupported file type: $file_type for $file_name"
            ;;
    esac
}

# Detect file type from extension
detect_file_type() {
    local file_path="$1"
    local extension="${file_path##*.}"
    
    case "$extension" in
        "cpp"|"cc"|"cxx")
            echo "cpp"
            ;;
        "hpp"|"h"|"hxx")
            echo "hpp"
            ;;
        "ts")
            echo "ts"
            ;;
        "js")
            echo "js"
            ;;
        *)
            echo "unknown"
            ;;
    esac
}

# Analyze C++ source file
analyze_cpp_file() {
    local file_path="$1"
    local file_name=$(basename "$file_path")
    
    if [ ! -f "$file_path" ]; then
        return 1
    fi
    
    # Extract functions
    local functions=$(grep -n "^[a-zA-Z_][a-zA-Z0-9_:]*.*(" "$file_path" | \
        grep -v "^\s*\/\/" | grep -v "^\s*\*" | \
        sed 's/.*:\([a-zA-Z_][a-zA-Z0-9_:]*\).*/\1/' | \
        sort -u | head -20)
    
    # Extract classes
    local classes=$(grep -n "^class\s\+[a-zA-Z_][a-zA-Z0-9_]*" "$file_path" | \
        sed 's/.*class\s\+\([a-zA-Z_][a-zA-Z0-9_]*\).*/\1/' | \
        sort -u | head -10)
    
    # Extract includes
    local includes=$(grep "^#include" "$file_path" | \
        sed 's/#include\s*[<"]\([^>"]*\)[>"].*/\1/' | \
        sort -u | head -15)
    
    # Store in temporary file for later use
    cat >> "$TEMP_MODULE_FILE" << EOF
## Source File: $file_name

### Functions
EOF
    
    if [ -n "$functions" ]; then
        echo "$functions" | while read -r func; do
            if [ -n "$func" ]; then
                echo "- \`$func()\`" >> "$TEMP_MODULE_FILE"
            fi
        done
    else
        echo "*No public functions found*" >> "$TEMP_MODULE_FILE"
    fi
    
    cat >> "$TEMP_MODULE_FILE" << EOF

### Classes
EOF
    
    if [ -n "$classes" ]; then
        echo "$classes" | while read -r class; do
            if [ -n "$class" ]; then
                echo "- \`$class\`" >> "$TEMP_MODULE_FILE"
            fi
        done
    else
        echo "*No classes found*" >> "$TEMP_MODULE_FILE"
    fi
    
    cat >> "$TEMP_MODULE_FILE" << EOF

### Dependencies
EOF
    
    if [ -n "$includes" ]; then
        echo "$includes" | while read -r inc; do
            if [ -n "$inc" ]; then
                echo "- \`$inc\`" >> "$TEMP_MODULE_FILE"
            fi
        done
    else
        echo "*No includes found*" >> "$TEMP_MODULE_FILE"
    fi
    
    echo "" >> "$TEMP_MODULE_FILE"
}

# Analyze TypeScript source file
analyze_typescript_file() {
    local file_path="$1"
    local file_name=$(basename "$file_path")
    
    if [ ! -f "$file_path" ]; then
        return 1
    fi
    
    # Extract exports and functions
    local exports=$(grep -n "^export" "$file_path" | \
        sed 's/.*export[^a-zA-Z]*\([a-zA-Z_][a-zA-Z0-9_]*\).*/\1/' | \
        sort -u | head -15)
    
    # Extract interfaces and types
    local interfaces=$(grep -n "^interface\s\+[a-zA-Z_][a-zA-Z0-9_]*" "$file_path" | \
        sed 's/.*interface\s\+\([a-zA-Z_][a-zA-Z0-9_]*\).*/\1/' | \
        sort -u | head -10)
    
    # Extract imports
    local imports=$(grep "^import" "$file_path" | \
        sed 's/import.*from\s*['"'"'"]\([^'"'"'"]*\)['"'"'"].*/\1/' | \
        sort -u | head -15)
    
    # Store in temporary file
    cat >> "$TEMP_MODULE_FILE" << EOF
## Source File: $file_name

### Exports
EOF
    
    if [ -n "$exports" ]; then
        echo "$exports" | while read -r exp; do
            if [ -n "$exp" ]; then
                echo "- \`$exp\`" >> "$TEMP_MODULE_FILE"
            fi
        done
    else
        echo "*No exports found*" >> "$TEMP_MODULE_FILE"
    fi
    
    cat >> "$TEMP_MODULE_FILE" << EOF

### Interfaces
EOF
    
    if [ -n "$interfaces" ]; then
        echo "$interfaces" | while read -r iface; do
            if [ -n "$iface" ]; then
                echo "- \`$iface\`" >> "$TEMP_MODULE_FILE"
            fi
        done
    else
        echo "*No interfaces found*" >> "$TEMP_MODULE_FILE"
    fi
    
    cat >> "$TEMP_MODULE_FILE" << EOF

### Dependencies
EOF
    
    if [ -n "$imports" ]; then
        echo "$imports" | while read -r imp; do
            if [ -n "$imp" ]; then
                echo "- \`$imp\`" >> "$TEMP_MODULE_FILE"
            fi
        done
    else
        echo "*No imports found*" >> "$TEMP_MODULE_FILE"
    fi
    
    echo "" >> "$TEMP_MODULE_FILE"
}

# Generate README for a module
generate_module_readme() {
    local module_path="$1"
    local force_overwrite="$2"
    
    if [ ! -d "$module_path" ]; then
        log_error "Module directory not found: $module_path"
        return 1
    fi
    
    local module_name=$(basename "$module_path")
    local readme_path="$module_path/README.md"
    
    # Check if README exists and force flag is not set
    if [ -f "$readme_path" ] && [ "$force_overwrite" != "true" ]; then
        log_info "README exists for $module_name, skipping (use --force to overwrite)"
        return 0
    fi
    
    log_info "Generating README for module: $module_name"
    
    # Create temporary file for module analysis
    TEMP_MODULE_FILE=$(mktemp)
    
    # Find source files in the module
    local source_files=$(find "$module_path" -maxdepth 1 -type f \( -name "*.cpp" -o -name "*.hpp" -o -name "*.ts" -o -name "*.js" \) | sort)
    
    if [ -z "$source_files" ]; then
        log_warning "No source files found in $module_name"
        rm "$TEMP_MODULE_FILE"
        return 0
    fi
    
    # Analyze each source file
    echo "$source_files" | while read -r file; do
        if [ -f "$file" ]; then
            analyze_source_file "$file"
        fi
    done
    
    # Infer module purpose from name and files
    local purpose=$(infer_module_purpose "$module_name" "$source_files")
    local description=$(generate_module_description "$module_name" "$source_files")
    
    # Load template and substitute variables
    if [ ! -f "$README_TEMPLATE" ]; then
        log_error "README template not found: $README_TEMPLATE"
        rm "$TEMP_MODULE_FILE"
        return 1
    fi
    
    # Read template
    local template_content=$(cat "$README_TEMPLATE")
    
    # Substitute variables
    local generated_content=$(echo "$template_content" | \
        sed "s/{{MODULE_NAME}}/$module_name/g" | \
        sed "s/{{PURPOSE}}/$purpose/g" | \
        sed "s/{{DESCRIPTION}}/$description/g" | \
        sed "s/{{ARCHITECTURE}}/Module architecture information will be added here./g" | \
        sed "s/{{FUNCTIONS_DETAILED}}/See source files below for detailed function information./g" | \
        sed "s/{{CLASSES_DETAILED}}/See source files below for detailed class information./g" | \
        sed "s/{{STRUCTS}}/Data structures will be documented here./g" | \
        sed "s/{{ENUMS}}/Enumerations will be documented here./g" | \
        sed "s/{{DEPENDENCIES}}/See source files below for dependencies./g" | \
        sed "s/{{EXAMPLES}}/Usage examples will be added here./g" | \
        sed "s/{{ERROR_HANDLING}}/Error handling information will be added here./g" | \
        sed "s/{{PERFORMANCE_NOTES}}/Performance considerations will be documented here./g" | \
        sed "s/{{THREAD_SAFETY}}/Thread safety information will be added here./g" | \
        sed "s/{{MEMORY_MANAGEMENT}}/Memory management details will be documented here./g" | \
        sed "s/{{TESTING_INFO}}/Testing information will be added here./g" | \
        sed "s/{{TROUBLESHOOTING}}/Troubleshooting guide will be added here./g")
    
    # Replace SOURCE_FILES placeholder with actual analysis
    local source_files_section=$(cat "$TEMP_MODULE_FILE")
    generated_content=$(echo "$generated_content" | sed "/{{SOURCE_FILES}}/r $TEMP_MODULE_FILE" | sed "/{{SOURCE_FILES}}/d")
    
    # Write the generated README
    echo "$generated_content" > "$readme_path"
    
    # Clean up
    rm "$TEMP_MODULE_FILE"
    
    log_success "Generated README for: $module_name"
    return 0
}

# Infer module purpose from name and source files
infer_module_purpose() {
    local module_name="$1"
    local source_files="$2"
    
    case "$module_name" in
        "config")
            echo "Configuration management and validation for RKLLM components"
            ;;
        "core")
            echo "Core functionality and base classes for RKLLM operations"
            ;;
        "memory")
            echo "Memory management utilities for NPU and CPU memory operations"
            ;;
        "inference")
            echo "Model inference execution and NPU interface management"
            ;;
        "adapters")
            echo "Hardware adapters and device-specific implementations"
            ;;
        "utils")
            echo "Utility functions and helper classes for common operations"
            ;;
        "napi-bindings")
            echo "N-API bindings for Node.js integration with C++ modules"
            ;;
        "testing")
            echo "Testing utilities and mock implementations"
            ;;
        "readme-generator")
            echo "Automatic README generation from source code analysis"
            ;;
        "model-manager")
            echo "Model loading, validation, and lifecycle management"
            ;;
        "rkllm-client")
            echo "Main client interface for RKLLM operations"
            ;;
        "cli-runner")
            echo "Command-line interface and runner utilities"
            ;;
        "runtime-detector")
            echo "Runtime environment detection and configuration"
            ;;
        "rkllm-types")
            echo "TypeScript type definitions for RKLLM interfaces"
            ;;
        "model-types")
            echo "Model-specific type definitions and configurations"
            ;;
        *)
            echo "Module for $module_name functionality"
            ;;
    esac
}

# Generate module description based on analysis
generate_module_description() {
    local module_name="$1"
    local source_files="$2"
    
    local file_count=$(echo "$source_files" | wc -l)
    local cpp_count=$(echo "$source_files" | grep -c "\.cpp\|\.cc" || true)
    local hpp_count=$(echo "$source_files" | grep -c "\.hpp\|\.h" || true)
    local ts_count=$(echo "$source_files" | grep -c "\.ts" || true)
    
    local desc="Provides "
    
    if [ "$cpp_count" -gt 0 ] && [ "$hpp_count" -gt 0 ]; then
        desc+="C++ implementation with $cpp_count source files and $hpp_count header files. "
    elif [ "$ts_count" -gt 0 ]; then
        desc+="TypeScript implementation with $ts_count source files. "
    fi
    
    case "$module_name" in
        "config")
            desc+="Handles JSON parsing, environment variables, and configuration schema validation with runtime safety checks."
            ;;
        "core")
            desc+="Essential base classes, interfaces, and core functionality required by other modules."
            ;;
        "memory")
            desc+="NPU memory allocation, CPU-NPU transfers, and memory pool management for efficient operations."
            ;;
        "inference")
            desc+="Model execution on NPU hardware, batch processing, and inference pipeline management."
            ;;
        "adapters")
            desc+="Hardware abstraction layer for different NPU devices and platform-specific optimizations."
            ;;
        "utils")
            desc+="Common utilities including logging, error handling, file operations, and helper functions."
            ;;
        "napi-bindings")
            desc+="Bridge between Node.js and C++ modules enabling JavaScript access to NPU functionality."
            ;;
        "testing")
            desc+="Test utilities, mock objects, and testing framework integration for validation."
            ;;
        *)
            desc+="Core functionality and implementation details for the $module_name component."
            ;;
    esac
    
    echo "$desc"
}

# Generate READMEs for all modules
generate_all_readmes() {
    local force_overwrite="$1"
    
    log_info "Generating READMEs for all modules..."
    
    local errors=0
    local generated=0
    local force_flag=""
    
    if [ "$force_overwrite" = "true" ]; then
        force_flag="--force"
        log_warning "Forcing overwrite of existing README files"
    fi
    
    # Define all modules to process
    local modules=(
        "src/bindings/config"
        "src/bindings/core"
        "src/bindings/memory"
        "src/bindings/inference"
        "src/bindings/adapters"
        "src/bindings/utils"
        "src/bindings/napi-bindings"
        "src/bindings/testing"
        "src/bindings/include"
        "src/model-manager"
        "src/rkllm-client"
        "src/cli-runner"
        "src/runtime-detector"
        "src/rkllm-types"
        "src/model-types"
        "src/testing"
    )
    
    # Generate main bindings README first
    log_info "Generating main bindings README..."
    if generate_module_readme "$PROJECT_ROOT/src/bindings" "$force_overwrite"; then
        generated=$((generated + 1))
    else
        errors=$((errors + 1))
    fi
    
    # Process each module
    for module in "${modules[@]}"; do
        local module_path="$PROJECT_ROOT/$module"
        if [ -d "$module_path" ]; then
            if generate_module_readme "$module_path" "$force_overwrite"; then
                generated=$((generated + 1))
            else
                log_error "Failed to generate README for: $module"
                errors=$((errors + 1))
            fi
        else
            log_warning "Module directory not found: $module"
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
    echo "RKLLMJS Documentation Generator"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  generate      Generate RULES.md from validator comments"
    echo "  readme        Generate module README files from source code"
    echo "  all           Generate both RULES.md and README files"
    echo "  validate      Validate that all functions have @rule comments"
    echo "  help          Show this help message"
    echo ""
    echo "Options:"
    echo "  --force       Overwrite existing README files (for readme/all commands)"
    echo ""
    echo "Examples:"
    echo "  $0 generate"
    echo "  $0 readme"
    echo "  $0 readme --force"
    echo "  $0 all"
    echo "  $0 validate"
}

# Main script logic
main() {
    local force_overwrite="false"
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --force)
                force_overwrite="true"
                shift
                ;;
            *)
                break
                ;;
        esac
    done
    
    case "$1" in
        "generate")
            generate_rules_md
            ;;
        "readme")
            generate_all_readmes "$force_overwrite"
            ;;
        "all")
            log_info "Generating both RULES.md and README files..."
            if generate_rules_md && generate_all_readmes "$force_overwrite"; then
                log_success "Generated all documentation successfully"
            else
                log_error "Failed to generate some documentation"
                exit 1
            fi
            ;;
        "validate")
            validate_rule_comments
            ;;
        "help"|"--help"|"-h")
            show_usage
            ;;
        "")
            log_info "No command specified. Generating RULES.md..."
            generate_rules_md
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