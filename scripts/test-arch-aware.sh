#!/bin/bash

# RKLLMJS Architecture-Aware Test Script
# Runs tests appropriate for the current architecture

set -e

# Colors for output
readonly GREEN='\033[0;32m'
readonly BLUE='\033[0;34m'
readonly YELLOW='\033[1;33m'
readonly RED='\033[0;31m'
readonly NC='\033[0m' # No Color

# Script metadata
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." &> /dev/null && pwd)"

echo -e "${BLUE}🏗️ RKLLMJS Architecture-Aware Testing${NC}"
echo "========================================"
echo

# Detect architecture
ARCH=$(uname -m)
echo -e "${BLUE}🔍 Detected architecture: $ARCH${NC}"

# Check if running on ARM64/aarch64 (RK3588 compatible)
if [[ "$ARCH" == "aarch64" || "$ARCH" == "arm64" ]]; then
    echo -e "${GREEN}✅ ARM64 detected - Running full test suite including C++ tests${NC}"
    
    # Check if we're on RK35xx hardware (RK3588, RK3576, etc.)
    KERNEL_VERSION=$(uname -r)
    MODEL=$(cat /proc/device-tree/model 2>/dev/null | tr -d '\0' || echo "unknown")
    
    if [[ "$KERNEL_VERSION" == *"rk35xx"* ]] || [[ "$MODEL" == *"RK35"* ]] || [[ "$MODEL" == *"RK3588"* ]] || [[ "$MODEL" == *"Orange Pi 5"* ]]; then
        echo -e "${GREEN}🚀 RK35xx hardware detected - enabling hardware-specific tests${NC}"
        export RKLLM_HARDWARE_TESTS=1
    else
        echo -e "${YELLOW}⚠️  ARM64 but not RK35xx - running compatible tests only${NC}"
        export RKLLM_HARDWARE_TESTS=0
    fi
    
    # Run C++ tests on ARM64
    echo -e "${BLUE}🧪 Running C++ module tests...${NC}"
    if bash "$SCRIPT_DIR/test-cpp.sh"; then
        echo -e "${GREEN}✅ C++ tests passed${NC}"
    else
        echo -e "${RED}❌ C++ tests failed${NC}"
        exit 1
    fi
    
elif [[ "$ARCH" == "x86_64" || "$ARCH" == "amd64" ]]; then
    echo -e "${YELLOW}⚠️  x86_64 detected - running build verification only (no C++ runtime tests)${NC}"
    
    # On x86_64, we build but don't run C++ tests (since no RK3588 hardware)
    echo -e "${BLUE}🔨 Verifying C++ modules can build on x86_64...${NC}"
    if bash "$SCRIPT_DIR/test-cpp-safe.sh"; then
        echo -e "${GREEN}✅ C++ build verification passed${NC}"
    else
        echo -e "${RED}❌ C++ build verification failed${NC}"
        exit 1
    fi
    
else
    echo -e "${YELLOW}⚠️  Unknown architecture ($ARCH) - running TypeScript tests only${NC}"
fi

echo
echo -e "${GREEN}🎉 Architecture-aware testing completed successfully${NC}"
