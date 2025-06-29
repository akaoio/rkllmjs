#!/bin/bash

# Simple test to verify modules load correctly

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"

# Load module system
source "$SCRIPT_DIR/lib/module-loader.sh"

echo "Testing module system..."

# Initialize module system
if init_module_system; then
    echo "✅ Module system initialized"
else
    echo "❌ Module system failed"
    exit 1
fi

# Test loading each module individually
modules=("core" "ui-responsive" "os-detection" "runtime-node")

for module in "${modules[@]}"; do
    echo "Testing module: $module"
    if load_module "$module"; then
        echo "✅ $module loaded successfully"
    else
        echo "❌ $module failed to load"
        exit 1
    fi
done

echo "🎉 All modules loaded successfully!"

# Test basic functionality
echo "Testing basic functionality..."

# Test OS detection
if [[ -n "${OS:-}" ]]; then
    echo "✅ OS detected: $OS"
else
    echo "❌ OS detection failed"
fi

# Test terminal size detection
if [[ -n "${TERM_COLS:-}" ]] && [[ -n "${TERM_LINES:-}" ]]; then
    echo "✅ Terminal size detected: ${TERM_COLS}x${TERM_LINES}"
else
    echo "❌ Terminal size detection failed"
fi

echo "🎯 Module system test completed!"