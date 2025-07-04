#!/bin/bash

# RKLLMJS C++ Bindings Test Script
# Direct test runner for all C++ modules

set -e

# Colors for output
readonly GREEN='\033[0;32m'
readonly BLUE='\033[0;34m'
readonly RED='\033[0;31m'
readonly NC='\033[0m' # No Color

# Script metadata
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." &> /dev/null && pwd)"
CPP_BINDINGS_DIR="$PROJECT_ROOT/src/bindings"

echo -e "${BLUE}🧪 RKLLMJS C++ Bindings Test Suite${NC}"
echo "=================================="
echo

# Find all C++ modules with Makefiles
echo -e "${BLUE}🔍 Discovering C++ modules...${NC}"
MODULES_FOUND=0
MODULES_PASSED=0
MODULES_FAILED=0

# Define build order based on dependencies
# core -> inference -> adapters -> others
ORDERED_MODULES=("core" "inference" "adapters")

# First, build all modules in dependency order (without testing yet)
for module_name in "${ORDERED_MODULES[@]}"; do
    module_dir="$CPP_BINDINGS_DIR/$module_name"
    if [[ -d "$module_dir" && -f "$module_dir/Makefile" ]]; then
        echo -e "${BLUE}🏗️ Building module: $module_name${NC}"
        
        # Always clean first to ensure consistent build flags
        (cd "$module_dir" && make clean >/dev/null 2>&1)
        
        # Build the module (library only, not tests yet)
        if ! (cd "$module_dir" && make >/dev/null 2>&1); then
            echo -e "${RED}❌ $module_name: BUILD FAILED${NC}"
            exit 1
        fi
        echo -e "${GREEN}✅ $module_name: BUILT${NC}"
    fi
done

echo

# Now test modules in dependency order
for module_name in "${ORDERED_MODULES[@]}"; do
    module_dir="$CPP_BINDINGS_DIR/$module_name"
    if [[ -d "$module_dir" && -f "$module_dir/Makefile" ]]; then
        echo -e "${BLUE}📦 Testing module: $module_name${NC}"
        
        MODULES_FOUND=$((MODULES_FOUND + 1))

        # Run module tests (dependencies should already be built)
        if (cd "$module_dir" && make test); then
            echo -e "${GREEN}✅ $module_name: PASSED${NC}"
            MODULES_PASSED=$((MODULES_PASSED + 1))
        else
            echo -e "${RED}❌ $module_name: FAILED${NC}"
            MODULES_FAILED=$((MODULES_FAILED + 1))
        fi
        echo
    fi
done

# Then test any remaining modules
for module_dir in "$CPP_BINDINGS_DIR"/*; do
    if [[ -d "$module_dir" && -f "$module_dir/Makefile" ]]; then
        module_name=$(basename "$module_dir")
        
        # Skip if already tested
        if [[ " ${ORDERED_MODULES[@]} " =~ " ${module_name} " ]]; then
            continue
        fi
        
        echo -e "${BLUE}📦 Testing module: $module_name${NC}"
        
        MODULES_FOUND=$((MODULES_FOUND + 1))
        
        # Always clean first to ensure consistent build flags
        (cd "$module_dir" && make clean >/dev/null 2>&1)

        # Run module tests
        if (cd "$module_dir" && make test); then
            echo -e "${GREEN}✅ $module_name: PASSED${NC}"
            MODULES_PASSED=$((MODULES_PASSED + 1))
        else
            echo -e "${RED}❌ $module_name: FAILED${NC}"
            MODULES_FAILED=$((MODULES_FAILED + 1))
        fi
        echo
    fi
done

# Summary
echo "📊 Test Summary"
echo "==============="
echo "Modules found: $MODULES_FOUND"
echo -e "Modules passed: ${GREEN}$MODULES_PASSED${NC}"
echo -e "Modules failed: ${RED}$MODULES_FAILED${NC}"

if [[ $MODULES_FAILED -eq 0 ]]; then
    echo -e "${GREEN}🎉 All C++ module tests passed!${NC}"
    exit 0
else
    echo -e "${RED}💥 Some C++ module tests failed!${NC}"
    exit 1
fi
