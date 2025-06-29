#!/bin/bash

# RKLLM.js Core Module Tests
# Tests for scripts/modules/core.sh

# Get script directory and load test framework
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
source "$SCRIPT_DIR/../lib/test-framework.sh"
source "$SCRIPT_DIR/../lib/module-loader.sh"

# Initialize module system and load core module
init_module_system
load_module "core"

# Test logging functions
test_logging_functions() {
    # Test logging functions exist
    assert_function_exists "log_debug" "log_debug function exists"
    assert_function_exists "log_info" "log_info function exists"
    assert_function_exists "log_success" "log_success function exists"
    assert_function_exists "log_warning" "log_warning function exists"
    assert_function_exists "log_error" "log_error function exists"
    
    # Test logging level constants
    assert_not_empty "$LOG_ERROR" "LOG_ERROR constant defined"
    assert_not_empty "$LOG_WARNING" "LOG_WARNING constant defined"
    assert_not_empty "$LOG_INFO" "LOG_INFO constant defined"
    assert_not_empty "$LOG_SUCCESS" "LOG_SUCCESS constant defined"
    assert_not_empty "$LOG_DEBUG" "LOG_DEBUG constant defined"
}

# Test utility functions
test_utility_functions() {
    # Test directory utilities
    assert_function_exists "ensure_directory" "ensure_directory function exists"
    assert_function_exists "backup_file" "backup_file function exists"
    
    # Test command checking
    assert_function_exists "check_command" "check_command function exists"
    
    # Test version comparison
    assert_function_exists "version_compare" "version_compare function exists"
    
    # Test file operations
    assert_function_exists "download_file" "download_file function exists"
    assert_function_exists "extract_archive" "extract_archive function exists"
}

# Test version comparison functionality
test_version_compare() {
    # Test basic version comparisons
    if version_compare "1.0.0" "==" "1.0.0"; then
        assert_true "true" "version_compare equality works"
    else
        assert_true "false" "version_compare equality works"
    fi
    
    if version_compare "2.0.0" ">" "1.0.0"; then
        assert_true "true" "version_compare greater than works"
    else
        assert_true "false" "version_compare greater than works"
    fi
    
    if version_compare "1.0.0" "<" "2.0.0"; then
        assert_true "true" "version_compare less than works"
    else
        assert_true "false" "version_compare less than works"
    fi
}

# Test directory operations
test_directory_operations() {
    local test_dir
    test_dir=$(create_test_temp_dir "core_test")
    
    # Test ensure_directory
    local new_dir="$test_dir/new_directory"
    ensure_directory "$new_dir"
    
    if [[ -d "$new_dir" ]]; then
        assert_true "true" "ensure_directory creates directory"
    else
        assert_true "false" "ensure_directory creates directory"
    fi
    
    cleanup_test_temp_dir "$test_dir"
}

# Test file backup functionality
test_file_backup() {
    local test_dir
    test_dir=$(create_test_temp_dir "core_backup_test")
    
    # Create a test file
    local test_file="$test_dir/test.txt"
    echo "test content" > "$test_file"
    
    # Test backup
    local backup_file
    backup_file=$(backup_file "$test_file")
    
    if [[ -f "$backup_file" ]]; then
        assert_true "true" "backup_file creates backup"
        
        # Check content
        local backup_content
        backup_content=$(cat "$backup_file")
        assert_equals "test content" "$backup_content" "backup file has correct content"
    else
        assert_true "false" "backup_file creates backup"
    fi
    
    cleanup_test_temp_dir "$test_dir"
}

# Test command checking
test_command_checking() {
    # Test with a command that should exist
    if check_command "bash" "false"; then
        assert_true "true" "check_command finds existing command"
    else
        assert_true "false" "check_command finds existing command"
    fi
    
    # Test with a command that shouldn't exist
    if check_command "nonexistent_command_12345" "false"; then
        assert_true "false" "check_command correctly fails for non-existent command"
    else
        assert_true "true" "check_command correctly fails for non-existent command"
    fi
}

# Test environment setup
test_environment_setup() {
    # Test script metadata
    assert_not_empty "$SCRIPT_NAME" "SCRIPT_NAME is set"
    assert_not_empty "$SCRIPT_VERSION" "SCRIPT_VERSION is set"
    assert_not_empty "$SCRIPT_DESCRIPTION" "SCRIPT_DESCRIPTION is set"
    
    # Test color constants
    assert_not_empty "$RED" "RED color constant defined"
    assert_not_empty "$GREEN" "GREEN color constant defined"
    assert_not_empty "$YELLOW" "YELLOW color constant defined"
    assert_not_empty "$BLUE" "BLUE color constant defined"
    assert_not_empty "$NC" "NC (no color) constant defined"
}

# Test error handling setup
test_error_handling() {
    assert_function_exists "set_error_handling" "set_error_handling function exists"
    assert_function_exists "handle_error" "handle_error function exists"
    assert_function_exists "cleanup_on_error" "cleanup_on_error function exists"
}

# Test temp directory functions
test_temp_directory() {
    # Test create temp dir
    local temp_dir
    temp_dir=$(create_temp_dir "test")
    
    if [[ -d "$temp_dir" ]]; then
        assert_true "true" "create_temp_dir creates directory"
        
        # Test manual cleanup (since cleanup_temp_dir cleans up TEMP_DIR)
        local original_temp_dir="$TEMP_DIR"
        TEMP_DIR="$temp_dir"
        cleanup_temp_dir
        
        if [[ ! -d "$temp_dir" ]]; then
            assert_true "true" "cleanup_temp_dir removes directory"
        else
            assert_true "false" "cleanup_temp_dir removes directory"
            # Manual cleanup if test failed
            rm -rf "$temp_dir"
        fi
        
        # Restore original TEMP_DIR
        TEMP_DIR="$original_temp_dir"
    else
        assert_true "false" "create_temp_dir creates directory"
    fi
}

# Main test execution
main() {
    echo "🧪 Running Core Module Tests"
    echo "============================="
    echo
    
    run_test_suite "Core Module Tests" \
        "test_logging_functions" \
        "test_utility_functions" \
        "test_version_compare" \
        "test_directory_operations" \
        "test_file_backup" \
        "test_command_checking" \
        "test_environment_setup" \
        "test_error_handling" \
        "test_temp_directory"
}

# Run tests if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main
fi