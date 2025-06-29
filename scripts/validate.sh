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
echo "🔍 Checking for duplicate type definitions..."

# Check for duplicate enum definitions
ENUM_DUPLICATES=$(find src -name "*.ts" -not -name "*.test.ts" -not -name "*.d.ts" | xargs grep -l "export enum" | while read file; do
    grep "export enum" "$file" | sed "s/.*export enum \([A-Za-z0-9_]*\).*/\1/" | while read enum_name; do
        echo "$enum_name:$file"
    done
done | sort | uniq -d)

if [ -n "$ENUM_DUPLICATES" ]; then
    echo "$ENUM_DUPLICATES" | while read dup; do
        enum_name=$(echo "$dup" | cut -d: -f1)
        report_error "Duplicate enum definition found: $enum_name"
    done
else
    report_success "No duplicate enum definitions found"
fi

# Check for duplicate interface definitions
INTERFACE_DUPLICATES=$(find src -name "*.ts" -not -name "*.test.ts" -not -name "*.d.ts" | xargs grep -l "export interface" | while read file; do
    grep "export interface" "$file" | sed "s/.*export interface \([A-Za-z0-9_]*\).*/\1/" | while read interface_name; do
        echo "$interface_name:$file"
    done
done | sort | uniq -d)

if [ -n "$INTERFACE_DUPLICATES" ]; then
    echo "$INTERFACE_DUPLICATES" | while read dup; do
        interface_name=$(echo "$dup" | cut -d: -f1)
        report_error "Duplicate interface definition found: $interface_name"
    done
else
    report_success "No duplicate interface definitions found"
fi

echo ""
echo "🎯 Checking naming convention consistency..."

# Check for consistent enum naming (should be PascalCase)
ENUM_NAMING_ISSUES=$(find src -name "*.ts" -not -name "*.test.ts" -not -name "*.d.ts" -exec grep -H "export enum" {} \; 2>/dev/null | grep -v "export enum [A-Z][A-Za-z0-9]*" || true)

if [ -n "$ENUM_NAMING_ISSUES" ]; then
    echo "$ENUM_NAMING_ISSUES" | while read issue; do
        report_warning "Enum naming convention issue: $issue (should be PascalCase)"
    done
else
    report_success "Enum naming conventions are consistent"
fi

# Check for consistent interface naming (should be PascalCase)  
INTERFACE_NAMING_ISSUES=$(find src -name "*.ts" -not -name "*.test.ts" -not -name "*.d.ts" -exec grep -H "export interface" {} \; 2>/dev/null | grep -v "export interface [A-Z][A-Za-z0-9]*" || true)

if [ -n "$INTERFACE_NAMING_ISSUES" ]; then
    echo "$INTERFACE_NAMING_ISSUES" | while read issue; do
        report_warning "Interface naming convention issue: $issue (should be PascalCase)"
    done
else
    report_success "Interface naming conventions are consistent"
fi

echo ""
echo "🏗️ Checking architectural compliance..."

# Check that core types are only defined in rkllm-types (check for specific core type names)
CORE_TYPE_VIOLATIONS=$(find src -name "*.ts" -not -path "src/rkllm-types/*" -not -path "src/bindings/*" -not -name "*.test.ts" -not -name "*.d.ts" -exec grep -l "export enum \(LLMCallState\|RKLLMInputType\|RKLLMInferMode\)\|export interface \(RKLLMParam\|RKLLMInput\|RKLLMResult\|RKLLMExtendParam\) " {} \; 2>/dev/null || true)

if [ -n "$CORE_TYPE_VIOLATIONS" ]; then
    echo "$CORE_TYPE_VIOLATIONS" | while read violation; do
        report_error "Core RKLLM types defined outside rkllm-types module: $violation"
    done
else
    report_success "Core types properly centralized in rkllm-types module"
fi

# Check that testing utilities are only in testing module
TESTING_VIOLATIONS=$(find src -name "*.ts" -not -path "src/testing/*" -not -name "*.test.ts" -not -name "*.d.ts" -exec grep -l "class.*Logger\|function.*test\|TEST_.*CONFIG" {} \; 2>/dev/null || true)

if [ -n "$TESTING_VIOLATIONS" ]; then
    echo "$TESTING_VIOLATIONS" | while read violation; do
        report_warning "Testing utilities found outside testing module: $violation"
    done
else
    report_success "Testing utilities properly centralized in testing module"
fi

echo ""
echo "📋 Checking import consistency..."

# Check for imports from deprecated paths (but allow internal module imports)
DEPRECATED_IMPORTS=$(find src -name "*.ts" -not -path "src/testing/*" -exec grep -H "from.*test-logger\|from.*rkllm-client/test-utils" {} \; 2>/dev/null || true)

if [ -n "$DEPRECATED_IMPORTS" ]; then
    echo "$DEPRECATED_IMPORTS" | while read import_issue; do
        report_error "Deprecated import path found: $import_issue (should use src/testing)"
    done
else
    report_success "No deprecated import paths found"
fi

# Check for relative imports going up more than one level
DEEP_RELATIVE_IMPORTS=$(find src -name "*.ts" -exec grep -H "from.*\.\./\.\./\.\." {} \; 2>/dev/null || true)

if [ -n "$DEEP_RELATIVE_IMPORTS" ]; then
    echo "$DEEP_RELATIVE_IMPORTS" | while read import_issue; do
        report_warning "Deep relative import found: $import_issue (consider absolute imports)"
    done
else
    report_success "No problematic deep relative imports found"
fi

echo ""
echo "🔧 Checking function signature consistency..."

# Check for duplicate function signatures across modules
DUPLICATE_FUNCTIONS=$(find src -name "*.ts" -not -name "*.test.ts" -not -name "*.d.ts" | xargs grep -h "export function\|export async function" | sort | uniq -d)

if [ -n "$DUPLICATE_FUNCTIONS" ]; then
    echo "$DUPLICATE_FUNCTIONS" | while read dup_function; do
        report_warning "Potentially duplicate function signature: $dup_function"
    done
else
    report_success "No duplicate function signatures found"
fi

echo ""
echo "🎨 Checking usage pattern consistency..."

# Check for inconsistent TestLogger usage patterns
INCONSISTENT_LOGGER_USAGE=$(find src -name "*.test.ts" -exec grep -H "new TestLogger\|TestLogger\.createLogger" {} \; | grep -v "src/testing/")

if [ -n "$INCONSISTENT_LOGGER_USAGE" ]; then
    NEW_USAGE=$(echo "$INCONSISTENT_LOGGER_USAGE" | grep "new TestLogger" | wc -l)
    FACTORY_USAGE=$(echo "$INCONSISTENT_LOGGER_USAGE" | grep "createLogger" | wc -l)
    
    if [ $NEW_USAGE -gt 0 ] && [ $FACTORY_USAGE -gt 0 ]; then
        report_warning "Inconsistent TestLogger usage patterns found - mix of 'new TestLogger()' ($NEW_USAGE) and 'TestLogger.createLogger()' ($FACTORY_USAGE)"
        report_warning "Consider standardizing on one pattern for consistency"
    else
        report_success "Consistent TestLogger usage patterns"
    fi
else
    report_success "Consistent TestLogger usage patterns"
fi

echo ""
echo "📐 Checking interface similarity (advanced duplication detection)..."

# Extract interface names and their property counts to detect similar structures
INTERFACE_ANALYSIS=$(find src -name "*.ts" -not -name "*.test.ts" -not -name "*.d.ts" -exec grep -A 20 "export interface" {} \; | awk '
    /export interface/ {
        interface_name = $3
        gsub(/\{/, "", interface_name)
        property_count = 0
    }
    /^[[:space:]]*[a-zA-Z].*:/ {
        property_count++
    }
    /^}/ {
        if (interface_name) {
            print interface_name ":" property_count
            interface_name = ""
        }
    }
' | sort)

# Check for interfaces with identical property counts (potential duplicates)
SIMILAR_INTERFACES=$(echo "$INTERFACE_ANALYSIS" | cut -d: -f2 | sort | uniq -d)

if [ -n "$SIMILAR_INTERFACES" ]; then
    echo "$SIMILAR_INTERFACES" | while read prop_count; do
        MATCHING_INTERFACES=$(echo "$INTERFACE_ANALYSIS" | grep ":$prop_count$" | cut -d: -f1 | tr '\n' ' ')
        if [ $(echo $MATCHING_INTERFACES | wc -w) -gt 1 ]; then
            report_warning "Interfaces with similar structure ($prop_count properties): $MATCHING_INTERFACES"
        fi
    done
else
    report_success "No obviously similar interface structures detected"
fi

echo ""
echo "📄 Checking documentation consistency..."

# Check for consistent README structure across modules
README_ISSUES=0
find src -name "README.md" | while read readme_file; do
    if ! grep -q "## Purpose" "$readme_file"; then
        report_warning "Missing '## Purpose' section in $readme_file"
        README_ISSUES=$((README_ISSUES + 1))
    fi
    if ! grep -q "## " "$readme_file"; then
        report_warning "No section headers found in $readme_file"
        README_ISSUES=$((README_ISSUES + 1))
    fi
done

if [ $README_ISSUES -eq 0 ]; then
    report_success "Documentation follows consistent structure"
fi

echo ""
echo "🔒 Checking protected Rockchip assets..."

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
