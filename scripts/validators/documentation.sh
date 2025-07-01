#!/bin/bash

# Documentation and Naming Validator Module
# Validates documentation coverage and naming conventions

# Source the core utilities
VALIDATOR_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$VALIDATOR_DIR/core.sh"

validate_naming_conventions() {
    print_section "📝 Checking naming conventions..."

    # Check for prohibited generic names
    PROHIBITED_NAMES=("utils.ts" "helpers.ts" "util.ts" "helper.ts" "utils.cpp" "helpers.cpp" "util.cpp" "helper.cpp")

    for prohibited in "${PROHIBITED_NAMES[@]}"; do
        if find . -name "$prohibited" -not -path "./tmp/*" -not -path "./node_modules/*" | grep -q .; then
            report_error "Prohibited generic filename found: $prohibited (violates RULES.md naming conventions)"
        fi
    done
}

validate_directory_structure() {
    # Check for empty directories (only README.md) but respect .gitignore
    print_section "🗂️ Checking for empty directories..."
    
    # Find directories and filter by .gitignore
    empty_dirs=$(find src -type d | filter_ignored_paths | while IFS= read -r dir; do
        # Skip if directory should be ignored
        should_ignore_path "$dir" && continue
        
        # Count non-README, non-Makefile files
        files=$(find "$dir" -maxdepth 1 -type f -not -name "README.md" -not -name "Makefile" | wc -l)
        if [ $files -eq 0 ] && [ -f "$dir/README.md" ]; then
            echo "$dir"
        fi
    done)

    if [ -n "$empty_dirs" ]; then
        for dir in $empty_dirs; do
            report_error "Empty directory found: $dir (contains only README.md) - violates RULES.md implementation requirements"
        done
    else
        report_success "No empty directories found"
    fi

    # Check for test files in root (prohibited)
    print_section "🚫 Checking for prohibited test files in root..."
    root_test_files=$(find . -maxdepth 1 -name "*.test.*" -o -name "test-*" 2>/dev/null | grep -v "scripts/" | filter_ignored_paths || true)
    if [ -n "$root_test_files" ]; then
        for file in $root_test_files; do
            report_error "Test file in root directory: $file - violates RULES.md test placement rules"
        done
    else
        report_success "No prohibited test files in root"
    fi
}

validate_documentation() {
    print_section "📚 Checking documentation coverage..."

    # Check that each feature directory has README.md
    # Exclude build artifacts and auto-generated directories using .gitignore
    FEATURE_DIRS=$(find src -mindepth 1 -type d | filter_ignored_paths)

    if [ -n "$FEATURE_DIRS" ]; then
        for dir in $FEATURE_DIRS; do
            # Skip if directory should be ignored
            should_ignore_path "$dir" && continue
            
            if [ ! -f "$dir/README.md" ]; then
                report_error "Missing README.md in feature directory: $dir"
            else
                report_success "Documentation exists for: $dir"
            fi
        done
    fi

    # Check configs directory documentation
    if [ -d "configs" ] && ! should_ignore_path "configs"; then
        if [ ! -f "configs/README.md" ]; then
            report_error "Missing README.md in configs directory"
        else
            report_success "Configuration documentation exists"
        fi
    fi
}

validate_protected_assets() {
    print_section "🔒 Checking protected Rockchip assets..."

    # Check that protected files exist and haven't been modified
    PROTECTED_FILES=("libs/rkllm/aarch64/librkllmrt.so" "libs/rkllm/include/rkllm.h")

    for protected_file in "${PROTECTED_FILES[@]}"; do
        if [ -f "$protected_file" ]; then
            report_success "Protected file exists: $protected_file"
            # In a real implementation, you might check file hashes or timestamps
        else
            report_warning "Protected file missing: $protected_file"
        fi
    done
}

validate_documentation_and_naming() {
    validate_naming_conventions
    validate_directory_structure  
    validate_documentation
    validate_protected_assets
}

# Run validation if script is called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    validate_documentation_and_naming
    
    errors=$(get_error_count)
    warnings=$(get_warning_count)
    
    if [ $errors -eq 0 ] && [ $warnings -eq 0 ]; then
        echo -e "${GREEN}✅ Documentation and naming validation passed!${NC}"
        exit 0
    elif [ $errors -eq 0 ]; then
        echo -e "${YELLOW}⚠️  Documentation and naming validation completed with $warnings warning(s)${NC}"
        exit 0
    else
        echo -e "${RED}❌ Documentation and naming validation failed with $errors error(s) and $warnings warning(s)${NC}"
        exit 1
    fi
fi
