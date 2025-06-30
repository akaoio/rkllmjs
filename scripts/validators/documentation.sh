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
    print_section "🏛️ Checking directory structure..."

    # Check root directory file/folder count (max 15, excluding .git, node_modules)  
    root_count=$(find . -maxdepth 1 -not -name "." -not -name ".git" -not -name "node_modules" | wc -l)
    if [ "$root_count" -gt 15 ]; then
        report_error "Root directory contains $root_count items (max 15 allowed) - violates RULES.md folder organization limits"
    else
        report_success "Root directory count OK: $root_count/15 items"
    fi

    # Check C++ bindings module count (max 8 operational modules)
    if [ -d "src/bindings" ]; then
        bindings_modules=$(find src/bindings -maxdepth 1 -type d -not -name "bindings" | wc -l)
        if [ "$bindings_modules" -gt 8 ]; then
            report_error "C++ bindings contains $bindings_modules modules (max 8 allowed) - violates RULES.md folder organization limits"
        else
            report_success "C++ bindings module count OK: $bindings_modules/8 modules"
        fi
    fi

    # Check for empty directories (only README.md)
    print_section "🗂️ Checking for empty directories..."
    empty_dirs=$(find src -type d -exec sh -c '
        dir="$1"
        files=$(find "$dir" -maxdepth 1 -type f -not -name "README.md" -not -name "Makefile" | wc -l)
        if [ $files -eq 0 ] && [ -f "$dir/README.md" ]; then
            echo "$dir"
        fi
    ' _ {} \;)

    if [ -n "$empty_dirs" ]; then
        for dir in $empty_dirs; do
            report_error "Empty directory found: $dir (contains only README.md) - violates RULES.md implementation requirements"
        done
    else
        report_success "No empty directories found"
    fi

    # Check for test files in root (prohibited)
    print_section "🚫 Checking for prohibited test files in root..."
    root_test_files=$(find . -maxdepth 1 -name "*.test.*" -o -name "test-*" | grep -v "scripts/")
    if [ -n "$root_test_files" ]; then
        for file in $root_test_files; do
            report_error "Test file in root directory: $file - violates RULES.md test placement rules"
        done
    else
        report_success "No prohibited test files in root"
    fi

    # Find directories with multiple TypeScript files (excluding tests and type definitions)
    MULTI_FILE_DIRS=$(find src -type d -not -path "src/testing" -exec sh -c 'count=$(find "$1" -maxdepth 1 -name "*.ts" -not -name "*.test.ts" -not -name "*.d.ts" | wc -l); if [ $count -gt 1 ]; then echo "$1"; fi' _ {} \;)

    if [ -n "$MULTI_FILE_DIRS" ]; then
        for dir in $MULTI_FILE_DIRS; do
            files=$(find "$dir" -maxdepth 1 -name "*.ts" -not -name "*.test.ts" -not -name "*.d.ts")
            file_count=$(echo "$files" | wc -l)
            if [ $file_count -gt 1 ]; then
                report_warning "Directory $dir contains $file_count TypeScript files - ensure they are related features"
                echo "   Files: $(echo $files | tr '\n' ' ')"
            fi
        done
    fi
}

validate_documentation() {
    print_section "📚 Checking documentation coverage..."

    # Check that each feature directory has README.md
    # Exclude build artifacts and auto-generated directories
    FEATURE_DIRS=$(find src -mindepth 1 -type d \
        -not -path "./tmp/*" \
        -not -path "./node_modules/*" \
        -not -path "*/bin" \
        -not -path "*/obj" \
        -not -path "*/build" \
        -not -path "*/logs" \
        -not -path "*/.git")

    if [ -n "$FEATURE_DIRS" ]; then
        for dir in $FEATURE_DIRS; do
            if [ ! -f "$dir/README.md" ]; then
                report_error "Missing README.md in feature directory: $dir"
            else
                report_success "Documentation exists for: $dir"
            fi
        done
    fi

    # Check configs directory documentation
    if [ -d "configs" ]; then
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
