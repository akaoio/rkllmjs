#!/bin/bash

# RKLLMJS Modular Validator Script
# Orchestrates validation modules per RULES.md

set -e

echo "🔍 RKLLMJS Validator - Checking compliance with RULES.md..."
echo "=================================================="

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VALIDATORS_DIR="$SCRIPT_DIR/validators"

# Source core utilities
source "$VALIDATORS_DIR/core.sh"

# Import validation modules
source "$VALIDATORS_DIR/typescript.sh"
source "$VALIDATORS_DIR/cpp.sh"  
source "$VALIDATORS_DIR/test-structure.sh"
source "$VALIDATORS_DIR/documentation.sh"

# Run all validation modules
echo "🚀 Running modular validation..."

# TypeScript validation
validate_typescript

# C++ validation  
validate_cpp

# Test structure validation
validate_test_structure

# Documentation and naming validation
validate_documentation_and_naming

# Final summary
echo ""
echo "📊 Validation Summary"
echo "===================="

FINAL_ERRORS=$(get_error_count)
FINAL_WARNINGS=$(get_warning_count)

if [ $FINAL_ERRORS -eq 0 ] && [ $FINAL_WARNINGS -eq 0 ]; then
    report_success "All validation checks passed! 🎉"
    echo "✨ Code is compliant with RULES.md"
    exit 0
elif [ $FINAL_ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Validation completed with $FINAL_WARNINGS warning(s)${NC}"
    echo "💡 Consider addressing warnings for better code quality"
    exit 0
else
    echo -e "${RED}❌ Validation failed with $FINAL_ERRORS error(s) and $FINAL_WARNINGS warning(s)${NC}"
    echo "🚫 Code is NOT compliant with RULES.md"
    echo "📖 Please review RULES.md and fix the reported issues"
    exit 1
fi
