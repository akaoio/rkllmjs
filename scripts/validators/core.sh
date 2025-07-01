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
# Respects .gitignore patterns and common build directories
should_ignore_path() {
    local path="$1"
    local gitignore_file=".gitignore"
    
    # If .gitignore doesn't exist, don't ignore anything
    [ ! -f "$gitignore_file" ] && return 1
    
    # Common build directories to ignore
    case "$path" in
        */bin|*/bin/|*/bin/*)
            return 0  # Should ignore
            ;;
        */obj|*/obj/|*/obj/*)
            return 0  # Should ignore
            ;;
        */build|*/build/|*/build/*)
            return 0  # Should ignore
            ;;
        */dist|*/dist/|*/dist/*)
            return 0  # Should ignore
            ;;
        */node_modules|*/node_modules/|*/node_modules/*)
            return 0  # Should ignore
            ;;
        */tmp|*/tmp/|*/tmp/*)
            return 0  # Should ignore
            ;;
        */logs|*/logs/|*/logs/*)
            return 0  # Should ignore
            ;;
        */.git|*/.git/|*/.git/*)
            return 0  # Should ignore
            ;;
        */.vscode|*/.vscode/|*/.vscode/*)
            return 0  # Should ignore
            ;;
        *.o|*.a|*.so|*.test|*.log)
            return 0  # Should ignore
            ;;
    esac
    
    # Check against .gitignore file content
    while IFS= read -r line; do
        # Skip comments and empty lines
        [[ "$line" =~ ^[[:space:]]*# ]] && continue
        [[ "$line" =~ ^[[:space:]]*$ ]] && continue
        
        # Remove leading/trailing whitespace
        line=$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        
        # Check if path matches pattern
        case "$path" in
            $line|*/$line|*$line*)
                return 0  # Should ignore
                ;;
        esac
    done < "$gitignore_file"
    
    return 1  # Don't ignore
}

# @rule filter_ignored_paths
# Filters file paths using .gitignore patterns and validation rules
# Used to exclude build artifacts and ignored files from validation
filter_ignored_paths() {
    while IFS= read -r path; do
        if ! should_ignore_path "$path"; then
            echo "$path"
        fi
    done
}

# Export functions for use in other modules
export -f report_error report_warning report_success report_info print_section
export -f get_error_count get_warning_count reset_counters
export -f should_ignore_path filter_ignored_paths
export ERRORS WARNINGS RED YELLOW GREEN BLUE NC
