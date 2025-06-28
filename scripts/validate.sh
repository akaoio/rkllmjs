#!/bin/bash

# RKLLMJS Validator Script
# Enforces test coverage requirements per RULES.md

set -e

echo "🔍 RKLLMJS Validator - Checking compliance with RULES.md..."
echo "=================================================="

ERRORS=0
WARNINGS=0

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Function to report errors
report_error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
    ERRORS=$((ERRORS + 1))
}

# Function to report warnings
report_warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
    WARNINGS=$((WARNINGS + 1))
}

# Function to report success
report_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

echo "📁 Scanning source files..."

# Find all TypeScript source files (excluding generated, test, and tmp files)
TS_FILES=$(find . -name "*.ts" -not -path "./tmp/*" -not -path "./node_modules/*" -not -path "./dist/*" -not -path "./build/*" -not -name "*.test.ts" -not -name "*.d.ts")

echo "📋 Found TypeScript source files:"
for file in $TS_FILES; do
    echo "   $file"
done

echo ""
echo "🧪 Checking test coverage..."

# Check each TypeScript file for corresponding test file
for ts_file in $TS_FILES; do
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

echo ""
echo "🏗️ Checking C++ source files..."

# Find all C++ source files (excluding tmp)
CPP_FILES=$(find . -name "*.cpp" -not -path "./tmp/*" -not -path "./node_modules/*" -not -path "./build/*" -not -name "*.test.cpp")

if [ -n "$CPP_FILES" ]; then
    echo "📋 Found C++ source files:"
    for file in $CPP_FILES; do
        echo "   $file"
    done
    
    # Check each C++ file for corresponding test file
    for cpp_file in $CPP_FILES; do
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
else
    echo "📋 No C++ source files found"
fi

echo ""
echo "📝 Checking naming conventions..."

# Check for prohibited generic names
PROHIBITED_NAMES=("utils.ts" "helpers.ts" "util.ts" "helper.ts" "utils.cpp" "helpers.cpp" "util.cpp" "helper.cpp")

for prohibited in "${PROHIBITED_NAMES[@]}"; do
    if find . -name "$prohibited" -not -path "./tmp/*" -not -path "./node_modules/*" | grep -q .; then
        report_error "Prohibited generic filename found: $prohibited (violates RULES.md naming conventions)"
    fi
done

echo ""
echo "🏛️ Checking directory structure..."

# Check that each feature has its own directory (no multiple unrelated files in same directory)
# This is a simplified check - in practice, you might want more sophisticated logic

# Find directories with multiple TypeScript files (excluding tests and type definitions)
MULTI_FILE_DIRS=$(find src -type d -exec sh -c 'count=$(find "$1" -maxdepth 1 -name "*.ts" -not -name "*.test.ts" -not -name "*.d.ts" | wc -l); if [ $count -gt 1 ]; then echo "$1"; fi' _ {} \;)

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

echo ""
echo "� Checking documentation coverage..."

# Check that each feature directory has README.md
FEATURE_DIRS=$(find src -mindepth 1 -type d -not -path "./tmp/*" -not -path "./node_modules/*")

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

echo ""
echo "�🔒 Checking protected Rockchip assets..."

# Check that protected files are not modified (this is a placeholder - you'd implement actual checks)
PROTECTED_FILES=(
    "libs/rkllm/aarch64/librkllmrt.so"
    "libs/rkllm/include/rkllm.h"
)

for protected_file in "${PROTECTED_FILES[@]}"; do
    if [ -f "$protected_file" ]; then
        report_success "Protected file exists: $protected_file"
        # In a real implementation, you might check file hashes or timestamps
    else
        report_warning "Protected file missing: $protected_file"
    fi
done

echo ""
echo "📊 Validation Summary"
echo "===================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    report_success "All validation checks passed! 🎉"
    echo "✨ Code is compliant with RULES.md"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Validation completed with $WARNINGS warning(s)${NC}"
    echo "💡 Consider addressing warnings for better code quality"
    exit 0
else
    echo -e "${RED}❌ Validation failed with $ERRORS error(s) and $WARNINGS warning(s)${NC}"
    echo "🚫 Code is NOT compliant with RULES.md"
    echo "📖 Please review RULES.md and fix the reported issues"
    exit 1
fi
