#!/bin/bash

# RKLLMJS Module Test Runner
# Tests all modules using the RKLLMJS Test Framework

echo "🧪 RKLLMJS Module Test Runner"
echo "=============================="
echo

# Test modules in dependency order
modules=(
    "utils"
    "core" 
    "memory"
    "inference"
    "config"
)

passed=0
failed=0
total=0

for module in "${modules[@]}"; do
    echo "📦 Testing module: $module"
    cd "/home/x/Projects/rkllmjs/src/bindings/$module"
    
    if [ -f "Makefile" ]; then
        if make clean >/dev/null 2>&1 && make test SANDBOX_BUILD=1 >/dev/null 2>&1; then
            echo "✅ $module - PASSED"
            ((passed++))
        else
            echo "❌ $module - FAILED"
            ((failed++))
        fi
    else
        echo "⚠️  $module - No Makefile found"
    fi
    ((total++))
    echo
done

echo "================================="
echo "🎯 Test Summary:"
echo "   Passed: $passed"
echo "   Failed: $failed" 
echo "   Total:  $total"
echo

if [ $failed -eq 0 ]; then
    echo "🎉 All modules pass their tests!"
    exit 0
else
    echo "💥 $failed module(s) failed tests"
    exit 1
fi
