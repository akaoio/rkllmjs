#!/bin/bash

# TypeScript Validator Module
# Validates TypeScript source files and unit test coverage

# Source the core utilities
VALIDATOR_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$VALIDATOR_DIR/core.sh"

validate_typescript() {
    print_section "📁 Scanning TypeScript source files..."
    
    # Find all TypeScript source files and filter using .gitignore
    TS_FILES=$(find . -name "*.ts" -not -name "*.test.ts" -not -name "*.d.ts" | filter_ignored_paths)

    if [ -z "$TS_FILES" ]; then
        report_info "No TypeScript source files found"
        return 0
    fi

    echo "📋 Found TypeScript source files:"
    for file in $TS_FILES; do
        echo "   $file"
    done

    print_section "🧪 Checking unit test coverage (Tier 1: Co-located tests)..."

    # Check each TypeScript file for corresponding test file
    for ts_file in $TS_FILES; do
        # Skip if file should be ignored
        should_ignore_path "$ts_file" && continue
        
        # Get directory and filename without extension
        dir=$(dirname "$ts_file")
        filename=$(basename "$ts_file" .ts)
        
        # Expected test file path
        test_file="${dir}/${filename}.test.ts"
        
        if [ -f "$test_file" ]; then
            report_success "Test file exists for $ts_file"
        else
            report_error "Missing test file: $test_file (for source file: $ts_file)"
        fi
    done
}

# Run validation if script is called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    validate_typescript
    
    errors=$(get_error_count)
    warnings=$(get_warning_count)
    
    if [ $errors -eq 0 ] && [ $warnings -eq 0 ]; then
        echo -e "${GREEN}✅ TypeScript validation passed!${NC}"
        exit 0
    elif [ $errors -eq 0 ]; then
        echo -e "${YELLOW}⚠️  TypeScript validation completed with $warnings warning(s)${NC}"
        exit 0
    else
        echo -e "${RED}❌ TypeScript validation failed with $errors error(s) and $warnings warning(s)${NC}"
        exit 1
    fi
fi
