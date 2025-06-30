#!/bin/bash

# RKLLMJS C++ Bindings Test Script
# Wrapper script for testing all C++ modules

set -e

# Colors for output
readonly GREEN='\033[0;32m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Script metadata
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." &> /dev/null && pwd)"

echo -e "${BLUE}🧪 RKLLMJS C++ Bindings Test Suite${NC}"
echo "=================================="
echo

# Check if we're in the right directory
if [[ ! -f "$PROJECT_ROOT/test-all-modules.sh" ]]; then
    echo "❌ Error: Main test script not found at $PROJECT_ROOT/test-all-modules.sh"
    exit 1
fi

# Run the main test script
echo "📍 Running from: $SCRIPT_DIR"
echo "🏠 Project root: $PROJECT_ROOT"
echo

echo -e "${BLUE}🚀 Executing main test runner...${NC}"
cd "$PROJECT_ROOT"
exec ./test-all-modules.sh "$@"
