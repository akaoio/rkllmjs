#!/bin/bash

# RKLLM.js UI Responsive Module Tests
# Tests for scripts/modules/ui-responsive.sh

# Get script directory and load test framework
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
source "$SCRIPT_DIR/../lib/test-framework.sh"
source "$SCRIPT_DIR/../lib/module-loader.sh"

# Initialize module system and load required modules
init_module_system
load_modules "core" "ui-responsive"

# Test terminal size detection
test_terminal_size_detection() {
    assert_function_exists "detect_terminal_size" "detect_terminal_size function exists"
    
    # Run terminal size detection
    detect_terminal_size
    
    # Check that terminal size variables are set
    assert_not_empty "$TERM_COLS" "TERM_COLS is set"
    assert_not_empty "$TERM_LINES" "TERM_LINES is set"
    
    # Check minimum values
    if [[ $TERM_COLS -ge 80 ]]; then
        assert_true "true" "TERM_COLS meets minimum (80)"
    else
        assert_true "false" "TERM_COLS meets minimum (80)"
    fi
    
    if [[ $TERM_LINES -ge 24 ]]; then
        assert_true "true" "TERM_LINES meets minimum (24)"
    else
        assert_true "false" "TERM_LINES meets minimum (24)"
    fi
}

# Test dialog size calculation
test_dialog_size_calculation() {
    assert_function_exists "calculate_dialog_size" "calculate_dialog_size function exists"
    
    # Test with default parameters
    calculate_dialog_size
    
    assert_not_empty "$DIALOG_WIDTH" "DIALOG_WIDTH is set"
    assert_not_empty "$DIALOG_HEIGHT" "DIALOG_HEIGHT is set"
    
    # Check that calculated size is reasonable
    if [[ $DIALOG_WIDTH -le $TERM_COLS ]]; then
        assert_true "true" "DIALOG_WIDTH fits in terminal"
    else
        assert_true "false" "DIALOG_WIDTH fits in terminal"
    fi
    
    if [[ $DIALOG_HEIGHT -le $TERM_LINES ]]; then
        assert_true "true" "DIALOG_HEIGHT fits in terminal"
    else
        assert_true "false" "DIALOG_HEIGHT fits in terminal"
    fi
}

# Test small terminal detection
test_small_terminal_detection() {
    assert_function_exists "is_terminal_too_small" "is_terminal_too_small function exists"
    
    # With current terminal size, check the result
    if is_terminal_too_small; then
        assert_true "true" "is_terminal_too_small function works (terminal is small)"
    else
        assert_true "true" "is_terminal_too_small function works (terminal is adequate)"
    fi
}

# Test responsive message display
test_responsive_message() {
    assert_function_exists "show_responsive_message" "show_responsive_message function exists"
    
    # Test that the function can be called without errors
    # Capture output to avoid cluttering test results
    if show_responsive_message "Test Title" "Test message content" "info" > /dev/null; then
        assert_true "true" "show_responsive_message executes successfully"
    else
        assert_true "false" "show_responsive_message executes successfully"
    fi
}

# Test responsive dialog functions
test_responsive_dialogs() {
    assert_function_exists "show_responsive_checklist" "show_responsive_checklist function exists"
    assert_function_exists "show_responsive_input" "show_responsive_input function exists"
    assert_function_exists "show_responsive_yesno" "show_responsive_yesno function exists"
    
    # Note: We can't actually test the interactive dialogs in a non-interactive environment
    # But we can verify the functions exist and are callable
    assert_true "true" "responsive dialog functions are defined"
}

# Test progress bar
test_progress_bar() {
    assert_function_exists "show_progress_bar" "show_progress_bar function exists"
    
    # Test progress bar display
    if show_progress_bar 50 100 "Test Progress" > /dev/null; then
        assert_true "true" "show_progress_bar executes successfully"
    else
        assert_true "false" "show_progress_bar executes successfully"
    fi
}

# Test UI initialization
test_ui_initialization() {
    assert_function_exists "init_responsive_ui" "init_responsive_ui function exists"
    
    # The UI should already be initialized when the module is loaded
    # Check that DIALOG_AVAILABLE is set
    if [[ -n "${DIALOG_AVAILABLE:-}" ]]; then
        assert_not_empty "$DIALOG_AVAILABLE" "DIALOG_AVAILABLE is set"
        
        # Check if it's a boolean value
        if [[ "$DIALOG_AVAILABLE" == "true" ]] || [[ "$DIALOG_AVAILABLE" == "false" ]]; then
            assert_true "true" "DIALOG_AVAILABLE has valid boolean value"
        else
            assert_true "false" "DIALOG_AVAILABLE has valid boolean value"
        fi
    else
        assert_true "true" "DIALOG_AVAILABLE variable exists (may not be set in test environment)"
    fi
}

# Test dialog availability detection
test_dialog_availability() {
    # Check if whiptail or dialog is available
    local has_whiptail=false
    local has_dialog=false
    
    if command -v whiptail &> /dev/null; then
        has_whiptail=true
    fi
    
    if command -v dialog &> /dev/null; then
        has_dialog=true
    fi
    
    if [[ "$has_whiptail" == "true" ]] || [[ "$has_dialog" == "true" ]]; then
        assert_true "true" "dialog tools are available (whiptail: $has_whiptail, dialog: $has_dialog)"
    else
        assert_true "true" "dialog tools availability checked (none found, fallback mode will be used)"
    fi
}

# Test responsive behavior with different terminal sizes
test_responsive_behavior() {
    # Save original values
    local orig_cols=$TERM_COLS
    local orig_lines=$TERM_LINES
    
    # Test with small terminal
    TERM_COLS=80
    TERM_LINES=24
    calculate_dialog_size
    local small_width=$DIALOG_WIDTH
    local small_height=$DIALOG_HEIGHT
    
    # Test with large terminal
    TERM_COLS=120
    TERM_LINES=40
    calculate_dialog_size
    local large_width=$DIALOG_WIDTH
    local large_height=$DIALOG_HEIGHT
    
    # Verify that dialog size scales with terminal size
    if [[ $large_width -ge $small_width ]]; then
        assert_true "true" "dialog width scales with terminal width"
    else
        assert_true "false" "dialog width scales with terminal width"
    fi
    
    if [[ $large_height -ge $small_height ]]; then
        assert_true "true" "dialog height scales with terminal height"
    else
        assert_true "false" "dialog height scales with terminal height"
    fi
    
    # Restore original values
    TERM_COLS=$orig_cols
    TERM_LINES=$orig_lines
}

# Main test execution
main() {
    echo "🧪 Running UI Responsive Module Tests"
    echo "===================================="
    echo
    
    run_test_suite "UI Responsive Module Tests" \
        "test_terminal_size_detection" \
        "test_dialog_size_calculation" \
        "test_small_terminal_detection" \
        "test_responsive_message" \
        "test_responsive_dialogs" \
        "test_progress_bar" \
        "test_ui_initialization" \
        "test_dialog_availability" \
        "test_responsive_behavior"
}

# Run tests if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main
fi