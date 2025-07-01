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

# @rule report_error
# Reports validation errors with consistent formatting
# Increments global error counter for final reporting
report_error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
    ERRORS=$((ERRORS + 1))
}

# @rule report_warning
# Reports validation warnings with consistent formatting
# Increments global warning counter for final reporting
report_warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
    WARNINGS=$((WARNINGS + 1))
}

# @rule report_success
# Reports successful validation checks with consistent formatting
# Used to indicate when validation rules pass
report_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# @rule report_info
# Reports informational messages with consistent formatting
# Used for status updates and non-critical information
report_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# @rule print_section
# Prints section headers with consistent formatting
# Used to organize validation output into logical sections
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

# @rule should_ignore_path
# Determines if a file path should be ignored during validation
# Uses git check-ignore to respect .gitignore patterns exactly as git does
should_ignore_path() {
    local path="$1"
    
    # Use git check-ignore to determine if path should be ignored
    # This respects all .gitignore patterns including complex glob patterns,
    # negation patterns (!), directory-only patterns (/), and relative paths
    if echo "$path" | git check-ignore --stdin >/dev/null 2>&1; then
        return 0  # Should ignore
    else
        return 1  # Don't ignore
    fi
}

# @rule filter_ignored_paths
# Filters file paths using git check-ignore to respect .gitignore patterns
# Processes paths efficiently in batch mode for better performance
filter_ignored_paths() {
    # Read all paths into a temporary array
    local paths=()
    while IFS= read -r path; do
        paths+=("$path")
    done
    
    # If no paths, return empty
    if [ ${#paths[@]} -eq 0 ]; then
        return 0
    fi
    
    # Use git check-ignore to filter out ignored paths in batch
    # This is much more efficient than calling git check-ignore for each path
    local ignored_paths
    ignored_paths=$(printf '%s\n' "${paths[@]}" | git check-ignore --stdin 2>/dev/null || true)
    
    # Create associative array of ignored paths for fast lookup
    declare -A ignored_map
    while IFS= read -r ignored_path; do
        [ -n "$ignored_path" ] && ignored_map["$ignored_path"]=1
    done <<< "$ignored_paths"
    
    # Output only non-ignored paths
    for path in "${paths[@]}"; do
        if [ -z "${ignored_map["$path"]}" ]; then
            echo "$path"
        fi
    done
}

# Export functions for use in other modules
export -f report_error report_warning report_success report_info print_section
export -f get_error_count get_warning_count reset_counters
export -f should_ignore_path filter_ignored_paths
export ERRORS WARNINGS RED YELLOW GREEN BLUE NC
