#!/bin/bash

# C++ Validator Module
# Validates C++ modular architecture and unit test coverage

# Source the core utilities
VALIDATOR_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$VALIDATOR_DIR/core.sh"

validate_cpp_unit_tests() {
    print_section "🏗️ Checking C++ source files..."

    # Find all C++ source files and filter using .gitignore
    CPP_FILES=$(find . -name "*.cpp" -not -name "*.test.cpp" | filter_ignored_paths)

    if [ -z "$CPP_FILES" ]; then
        report_info "No C++ source files found"
        return 0
    fi

    echo "📋 Found C++ source files:"
    for file in $CPP_FILES; do
        echo "   $file"
    done
    
    # Check each C++ file for corresponding test file
    for cpp_file in $CPP_FILES; do
        # Skip if file should be ignored
        should_ignore_path "$cpp_file" && continue
        
        # Get directory and filename without extension
        dir=$(dirname "$cpp_file")
        filename=$(basename "$cpp_file" .cpp)
        
        # Expected test file path
        test_file="${dir}/${filename}.test.cpp"
        
        if [ -f "$test_file" ]; then
            report_success "Test file exists for $cpp_file"
        else
            report_error "Missing test file: $test_file (for source file: $cpp_file)"
        fi
    done
}

validate_cpp_modular_architecture() {
    print_section "🏗️ Checking C++ Modular Architecture..."

    # Check required C++ modules exist
    REQUIRED_CPP_MODULES=("core" "inference" "memory" "adapters" "utils" "napi-bindings")
    CPP_BINDINGS_DIR="src/bindings"

    if [ ! -d "$CPP_BINDINGS_DIR" ]; then
        report_error "Missing C++ bindings directory: $CPP_BINDINGS_DIR"
        return 1
    fi

    report_success "C++ bindings directory exists: $CPP_BINDINGS_DIR"
    
    # Check each required module
    for module in "${REQUIRED_CPP_MODULES[@]}"; do
        module_dir="$CPP_BINDINGS_DIR/$module"
        if [ -d "$module_dir" ]; then
            report_success "Required C++ module exists: $module"
            
            # Check for Makefile
            if [ -f "$module_dir/Makefile" ]; then
                report_success "Module Makefile exists: $module"
                
                # Check Makefile has required targets
                makefile="$module_dir/Makefile"
                required_targets=("all" "clean" "test")
                
                for target in "${required_targets[@]}"; do
                    if grep -q "^${target}:" "$makefile"; then
                        report_success "Makefile target exists: $module/$target"
                    else
                        report_error "Missing Makefile target: $module_dir/Makefile:$target"
                    fi
                done
            else
                report_error "Missing Makefile: $module_dir/Makefile"
            fi
            
            # Check for README.md
            if [ -f "$module_dir/README.md" ]; then
                report_success "Module documentation exists: $module"
            else
                report_error "Missing README.md: $module_dir/README.md"
            fi
        else
            report_error "Missing required C++ module: $module_dir"
        fi
    done
    
    # Check for global build scripts
    if [ -f "$CPP_BINDINGS_DIR/build.sh" ]; then
        report_success "Global C++ build script exists"
        
        # Check if build.sh is executable
        if [ -x "$CPP_BINDINGS_DIR/build.sh" ]; then
            report_success "Build script is executable"
        else
            report_error "Build script is not executable: $CPP_BINDINGS_DIR/build.sh"
        fi
    else
        report_error "Missing global C++ build script: $CPP_BINDINGS_DIR/build.sh"
    fi
    
    # Note: Test orchestration scripts are optional and may be located in scripts/ directory
    # The primary validation relies on .test.cpp files which are checked above
}

validate_cpp() {
    validate_cpp_unit_tests
    validate_cpp_modular_architecture
}

# Run validation if script is called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    validate_cpp
    
    errors=$(get_error_count)
    warnings=$(get_warning_count)
    
    if [ $errors -eq 0 ] && [ $warnings -eq 0 ]; then
        echo -e "${GREEN}✅ C++ validation passed!${NC}"
        exit 0
    elif [ $errors -eq 0 ]; then
        echo -e "${YELLOW}⚠️  C++ validation completed with $warnings warning(s)${NC}"
        exit 0
    else
        echo -e "${RED}❌ C++ validation failed with $errors error(s) and $warnings warning(s)${NC}"
        exit 1
    fi
fi
