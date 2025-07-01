#!/bin/bash

# RKLLMJS Documentation Generator
# Automatically generates RULES.md from validator function comments
# Replaces manual documentation maintenance with automated generation

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VALIDATORS_DIR="$SCRIPT_DIR/validators"
OUTPUT_FILE="$PROJECT_ROOT/RULES.md"

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
    cat > "$OUTPUT_FILE" << 'EOF'
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
    cat "$TEMP_RULES_FILE" >> "$OUTPUT_FILE"
    
    # Add footer
    cat >> "$OUTPUT_FILE" << 'EOF'

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
    
    log_success "Generated RULES.md with $(grep -c "^### 🔹" "$OUTPUT_FILE") rules"
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

# Show usage information
show_usage() {
    echo "RKLLMJS Documentation Generator"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  generate      Generate RULES.md from validator comments"
    echo "  validate      Validate that all functions have @rule comments"
    echo "  help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 generate"
    echo "  $0 validate"
}

# Main script logic
main() {
    case "$1" in
        "generate")
            generate_rules_md
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