#!/bin/bash

# Validator Core Utilities
# Shared functions and variables for all validator modules

# Global counters
ERRORS=0
WARNINGS=0

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
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

# Function to report info
report_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to print section header
print_section() {
    echo ""
    echo -e "${BLUE}$1${NC}"
}

# Function to get global error/warning counts
get_error_count() {
    echo $ERRORS
}

get_warning_count() {
    echo $WARNINGS
}

# Function to reset counters (for testing individual modules)
reset_counters() {
    ERRORS=0
    WARNINGS=0
}

# Export functions for use in other modules
export -f report_error report_warning report_success report_info print_section
export -f get_error_count get_warning_count reset_counters
export ERRORS WARNINGS RED YELLOW GREEN BLUE NC
