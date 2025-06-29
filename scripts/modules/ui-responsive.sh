#!/bin/bash

# RKLLM.js Responsive UI Module
# Provides responsive dialog and text display functions that adapt to terminal size

# Terminal size detection
detect_terminal_size() {
    TERM_COLS=$(tput cols 2>/dev/null || echo "80")
    TERM_LINES=$(tput lines 2>/dev/null || echo "24")
    
    # Ensure minimum values
    [[ $TERM_COLS -lt 80 ]] && TERM_COLS=80
    [[ $TERM_LINES -lt 24 ]] && TERM_LINES=24
    
    export TERM_COLS TERM_LINES
}

# Calculate optimal dialog dimensions based on terminal size
calculate_dialog_size() {
    local min_width=${1:-60}
    local min_height=${2:-15}
    local max_width=${3:-120}
    local max_height=${4:-40}
    
    # Calculate 80% of terminal size, but within min/max bounds
    local calc_width=$((TERM_COLS * 80 / 100))
    local calc_height=$((TERM_LINES * 70 / 100))
    
    # Apply constraints
    [[ $calc_width -lt $min_width ]] && calc_width=$min_width
    [[ $calc_width -gt $max_width ]] && calc_width=$max_width
    [[ $calc_height -lt $min_height ]] && calc_height=$min_height  
    [[ $calc_height -gt $max_height ]] && calc_height=$max_height
    
    # Ensure dialog fits in terminal
    [[ $calc_width -gt $TERM_COLS ]] && calc_width=$((TERM_COLS - 4))
    [[ $calc_height -gt $TERM_LINES ]] && calc_height=$((TERM_LINES - 4))
    
    export DIALOG_WIDTH=$calc_width
    export DIALOG_HEIGHT=$calc_height
}

# Check if terminal is too small for interactive dialogs
is_terminal_too_small() {
    [[ $TERM_COLS -lt 80 || $TERM_LINES -lt 24 ]]
}

# Show a responsive message with text wrapping
show_responsive_message() {
    local title="$1"
    local message="$2"
    local type="${3:-info}"  # info, warning, error, success
    
    # Choose appropriate icon and color
    local icon="ℹ️"
    local color=""
    case "$type" in
        warning) icon="⚠️"; color="\033[1;33m" ;;
        error) icon="❌"; color="\033[0;31m" ;;
        success) icon="✅"; color="\033[0;32m" ;;
        info) icon="ℹ️"; color="\033[0;34m" ;;
    esac
    
    # Format message with wrapping
    local wrapped_message
    wrapped_message=$(echo "$message" | fold -w $((TERM_COLS - 8)) -s)
    
    echo -e "${color}${icon} ${title}${color:+\033[0m}"
    echo "$wrapped_message" | sed 's/^/   /'
    echo
}

# Create responsive checklist dialog
show_responsive_checklist() {
    local title="$1"
    local text="$2"
    shift 2
    local items=("$@")
    
    # Check if we have dialog available
    local dialog_cmd=""
    if command -v whiptail &> /dev/null; then
        dialog_cmd="whiptail"
    elif command -v dialog &> /dev/null; then
        dialog_cmd="dialog"
    else
        show_responsive_message "Dialog Missing" "No interactive dialog available. Please install whiptail or dialog." "error"
        return 1
    fi
    
    # Calculate appropriate dialog size
    calculate_dialog_size 60 15 120 40
    
    # Adjust for number of items
    local items_count=$((${#items[@]} / 3))  # Each item has 3 parts: tag, item, status
    local needed_height=$((items_count + 10))
    [[ $needed_height -gt $DIALOG_HEIGHT ]] && DIALOG_HEIGHT=$needed_height
    
    # Handle very small terminals
    if is_terminal_too_small; then
        show_responsive_message "Small Terminal" "Terminal too small for interactive dialog. Using fallback mode." "warning"
        return 2  # Signal fallback needed
    fi
    
    # Create the dialog command
    if [[ "$dialog_cmd" == "whiptail" ]]; then
        whiptail --title "$title" \
            --checklist "$text" \
            $DIALOG_HEIGHT $DIALOG_WIDTH $((items_count + 2)) \
            "${items[@]}" \
            3>&1 1>&2 2>&3
    else
        dialog --stdout --title "$title" \
            --checklist "$text" \
            $DIALOG_HEIGHT $DIALOG_WIDTH $((items_count + 2)) \
            "${items[@]}"
    fi
}

# Show responsive input dialog
show_responsive_input() {
    local title="$1"
    local text="$2"
    local default_value="$3"
    
    local dialog_cmd=""
    if command -v whiptail &> /dev/null; then
        dialog_cmd="whiptail"
    elif command -v dialog &> /dev/null; then
        dialog_cmd="dialog"
    else
        # Fallback to read
        echo "$text"
        [[ -n "$default_value" ]] && echo "(Default: $default_value)"
        read -r response
        echo "${response:-$default_value}"
        return 0
    fi
    
    calculate_dialog_size 60 10 100 20
    
    if [[ "$dialog_cmd" == "whiptail" ]]; then
        whiptail --title "$title" \
            --inputbox "$text" \
            $DIALOG_HEIGHT $DIALOG_WIDTH \
            "$default_value" \
            3>&1 1>&2 2>&3
    else
        dialog --stdout --title "$title" \
            --inputbox "$text" \
            $DIALOG_HEIGHT $DIALOG_WIDTH \
            "$default_value"
    fi
}

# Show responsive yes/no dialog
show_responsive_yesno() {
    local title="$1"
    local text="$2"
    local default_yes="${3:-true}"
    
    local dialog_cmd=""
    if command -v whiptail &> /dev/null; then
        dialog_cmd="whiptail"
    elif command -v dialog &> /dev/null; then
        dialog_cmd="dialog"
    else
        # Fallback to read
        echo "$text"
        local prompt="(Y/n)"
        [[ "$default_yes" == "false" ]] && prompt="(y/N)"
        
        while true; do
            read -p "$prompt: " -r response
            case "$response" in
                [Yy]*) return 0 ;;
                [Nn]*) return 1 ;;
                "") 
                    [[ "$default_yes" == "true" ]] && return 0 || return 1
                    ;;
                *) echo "Please answer Y (yes) or N (no)." ;;
            esac
        done
    fi
    
    calculate_dialog_size 60 10 100 15
    
    local default_arg=""
    [[ "$default_yes" == "false" ]] && default_arg="--defaultno"
    
    if [[ "$dialog_cmd" == "whiptail" ]]; then
        whiptail --title "$title" \
            --yesno "$text" \
            $DIALOG_HEIGHT $DIALOG_WIDTH \
            $default_arg
    else
        dialog --title "$title" \
            --yesno "$text" \
            $DIALOG_HEIGHT $DIALOG_WIDTH \
            $default_arg
    fi
}

# Print a responsive progress bar (text-based)
show_progress_bar() {
    local current="$1"
    local total="$2"
    local description="$3"
    local width=$((TERM_COLS - 20))
    
    # Ensure minimum width
    [[ $width -lt 20 ]] && width=20
    
    local percentage=$((current * 100 / total))
    local filled=$((current * width / total))
    local empty=$((width - filled))
    
    printf "\r%s [" "$description"
    printf "%*s" "$filled" "" | tr ' ' '='
    printf "%*s" "$empty" ""
    printf "] %d%%" "$percentage"
}

# Initialize responsive UI system
init_responsive_ui() {
    detect_terminal_size
    
    # Export terminal size info
    export TERM_COLS TERM_LINES
    
    # Check for dialog availability
    local dialog_available=false
    if command -v whiptail &> /dev/null || command -v dialog &> /dev/null; then
        dialog_available=true
    fi
    
    export DIALOG_AVAILABLE=$dialog_available
    
    # Show terminal info if in debug mode
    if [[ "${DEBUG:-}" == "true" ]]; then
        show_responsive_message "Terminal Info" "Size: ${TERM_COLS}x${TERM_LINES}, Dialog: $dialog_available" "info"
    fi
}

# Initialize the UI system when module is loaded
init_responsive_ui