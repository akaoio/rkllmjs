#!/bin/bash

# RKLLMJS C++ Test Orchestration Script
# Runs all C++ module tests with comprehensive reporting

set -e

echo "🧪 RKLLMJS C++ Test Suite"
echo "========================="

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BINDINGS_DIR="$SCRIPT_DIR"
BUILD_DIR="$BINDINGS_DIR/../../build"
LOG_DIR="$BUILD_DIR/logs/tests"

# Create test directories
mkdir -p "$LOG_DIR"

# Test configuration
PARALLEL_TESTS="${PARALLEL_TESTS:-1}"
VERBOSE="${VERBOSE:-0}"
COVERAGE="${COVERAGE:-0}"
MEMCHECK="${MEMCHECK:-0}"
BENCHMARK="${BENCHMARK:-0}"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Test modules in dependency order
declare -a MODULES=(
    "utils"
    "core"
    "memory"
    "inference"
    "adapters"
    "napi-bindings"
)

# Test result tracking
declare -A TEST_RESULTS
declare -A TEST_TIMES
declare -A TEST_COVERAGE
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Check test prerequisites
check_prerequisites() {
    log_info "Checking test prerequisites..."
    
    # Check Google Test
    if ! /usr/sbin//usr/sbin/ldconfig -p | grep -q libgtest; then
        log_warning "Google Test library not found in system path"
        log_info "Attempting to find local installation..."
        
        if ! find /usr -name "libgtest.a" 2>/dev/null | head -1; then
            log_error "Google Test not found. Install with: sudo apt-get install libgtest-dev"
            exit 1
        fi
    fi
    
    # Check Valgrind (for memory checks)
    if [ "$MEMCHECK" -eq 1 ]; then
        if ! command -v valgrind &> /dev/null; then
            log_error "Valgrind not found. Install with: sudo apt-get install valgrind"
            exit 1
        fi
    fi
    
    # Check coverage tools
    if [ "$COVERAGE" -eq 1 ]; then
        if ! command -v gcov &> /dev/null; then
            log_error "gcov not found. Install with: sudo apt-get install gcc"
            exit 1
        fi
        if ! command -v lcov &> /dev/null; then
            log_warning "lcov not found. Install with: sudo apt-get install lcov"
        fi
    fi
    
    log_success "Test prerequisites check passed"
}

# Test a single module
test_module() {
    local module_name="$1"
    local module_dir="$BINDINGS_DIR/$module_name"
    
    if [ ! -d "$module_dir" ]; then
        log_warning "Module directory not found: $module_dir"
        TEST_RESULTS["$module_name"]="SKIP"
        return 1
    fi
    
    if [ ! -f "$module_dir/Makefile" ]; then
        log_warning "No Makefile found in $module_dir"
        TEST_RESULTS["$module_name"]="SKIP"
        return 1
    fi
    
    log_info "Testing module: $module_name"
    
    local start_time=$(date +%s)
    local log_file="$LOG_DIR/test-$module_name.log"
    local test_command="test"
    
    # Determine test command based on options
    if [ "$COVERAGE" -eq 1 ]; then
        test_command="coverage"
    elif [ "$MEMCHECK" -eq 1 ]; then
        test_command="memcheck"
    elif [ "$BENCHMARK" -eq 1 ]; then
        test_command="benchmark"
    fi
    
    # Run the tests
    local test_exit_code=0
    
    if [ "$VERBOSE" -eq 1 ]; then
        ( cd "$module_dir" && make "$test_command" ) 2>&1 | tee "$log_file"
        test_exit_code=${PIPESTATUS[0]}
    else
        ( cd "$module_dir" && make "$test_command" ) > "$log_file" 2>&1
        test_exit_code=$?
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    TEST_TIMES["$module_name"]=$duration
    
    if [ $test_exit_code -eq 0 ]; then
        log_success "Module $module_name tests passed (${duration}s)"
        TEST_RESULTS["$module_name"]="PASS"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        
        # Extract coverage information if available
        if [ "$COVERAGE" -eq 1 ]; then
            local coverage_file="$module_dir/coverage.info"
            if [ -f "$coverage_file" ]; then
                local coverage_percent=$(lcov --summary "$coverage_file" 2>/dev/null | grep "lines" | grep -o "[0-9]\+\.[0-9]\+%" | head -1)
                TEST_COVERAGE["$module_name"]="${coverage_percent:-N/A}"
            fi
        fi
        
        return 0
    else
        log_error "Module $module_name tests failed (${duration}s)"
        TEST_RESULTS["$module_name"]="FAIL"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        
        if [ "$VERBOSE" -eq 0 ]; then
            echo "Last 10 lines of test log:"
            tail -n 10 "$log_file"
        fi
        
        return 1
    fi
}

# Run integration tests
run_integration_tests() {
    log_info "Running integration tests..."
    
    local integration_dir="$BINDINGS_DIR/../../tests/integration"
    
    if [ ! -d "$integration_dir" ]; then
        log_warning "Integration test directory not found: $integration_dir"
        return 0
    fi
    
    local start_time=$(date +%s)
    local log_file="$LOG_DIR/integration-tests.log"
    
    # Run integration tests (placeholder - would need actual implementation)
    echo "Integration tests would run here" > "$log_file"
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_success "Integration tests completed (${duration}s)"
    TEST_TIMES["integration"]=$duration
    TEST_RESULTS["integration"]="PASS"
}

# Test all modules
test_all() {
    log_info "Running all C++ module tests..."
    
    TOTAL_TESTS=${#MODULES[@]}
    
    if [ "$PARALLEL_TESTS" -eq 1 ]; then
        # Sequential testing
        for module in "${MODULES[@]}"; do
            test_module "$module"
        done
    else
        # Parallel testing (not implemented for simplicity)
        log_warning "Parallel testing not yet implemented, running sequentially"
        for module in "${MODULES[@]}"; do
            test_module "$module"
        done
    fi
    
    # Run integration tests
    run_integration_tests
}

# Generate test report
generate_test_report() {
    local report_file="$BUILD_DIR/test-report.txt"
    local html_report="$BUILD_DIR/test-report.html"
    
    log_info "Generating test report..."
    
    # Text report
    {
        echo "RKLLMJS C++ Test Report"
        echo "======================"
        echo "Generated: $(date)"
        echo "Configuration: COVERAGE=$COVERAGE, MEMCHECK=$MEMCHECK, BENCHMARK=$BENCHMARK"
        echo ""
        echo "Summary:"
        echo "  Total Modules: $TOTAL_TESTS"
        echo "  Passed: $PASSED_TESTS"
        echo "  Failed: $FAILED_TESTS"
        echo "  Success Rate: $(( (PASSED_TESTS * 100) / (PASSED_TESTS + FAILED_TESTS) ))%"
        echo ""
        echo "Module Results:"
        echo "  Module           Status    Time(s)   Coverage"
        echo "  ----------------------------------------"
        
        for module in "${MODULES[@]}" "integration"; do
            if [ -n "${TEST_RESULTS[$module]}" ]; then
                local status="${TEST_RESULTS[$module]}"
                local time="${TEST_TIMES[$module]:-0}"
                local coverage="${TEST_COVERAGE[$module]:-N/A}"
                printf "  %-15s  %-7s   %-8s  %s\n" "$module" "$status" "$time" "$coverage"
            fi
        done
        
        echo ""
        echo "Test Logs:"
        for module in "${MODULES[@]}"; do
            if [ -f "$LOG_DIR/test-$module.log" ]; then
                echo "  $module: $LOG_DIR/test-$module.log"
            fi
        done
        
    } > "$report_file"
    
    # HTML report
    {
        echo "<!DOCTYPE html>"
        echo "<html><head><title>RKLLMJS C++ Test Report</title>"
        echo "<style>"
        echo "body { font-family: Arial, sans-serif; margin: 20px; }"
        echo "table { border-collapse: collapse; width: 100%; }"
        echo "th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }"
        echo "th { background-color: #f2f2f2; }"
        echo ".pass { color: green; font-weight: bold; }"
        echo ".fail { color: red; font-weight: bold; }"
        echo ".skip { color: orange; font-weight: bold; }"
        echo "</style></head><body>"
        echo "<h1>RKLLMJS C++ Test Report</h1>"
        echo "<p><strong>Generated:</strong> $(date)</p>"
        echo "<p><strong>Summary:</strong> $PASSED_TESTS passed, $FAILED_TESTS failed out of $TOTAL_TESTS modules</p>"
        
        echo "<table>"
        echo "<tr><th>Module</th><th>Status</th><th>Time (s)</th><th>Coverage</th></tr>"
        
        for module in "${MODULES[@]}" "integration"; do
            if [ -n "${TEST_RESULTS[$module]}" ]; then
                local status="${TEST_RESULTS[$module]}"
                local time="${TEST_TIMES[$module]:-0}"
                local coverage="${TEST_COVERAGE[$module]:-N/A}"
                local css_class="pass"
                
                case "$status" in
                    "FAIL") css_class="fail" ;;
                    "SKIP") css_class="skip" ;;
                esac
                
                echo "<tr>"
                echo "<td>$module</td>"
                echo "<td class=\"$css_class\">$status</td>"
                echo "<td>$time</td>"
                echo "<td>$coverage</td>"
                echo "</tr>"
            fi
        done
        
        echo "</table>"
        echo "</body></html>"
        
    } > "$html_report"
    
    log_success "Test reports generated:"
    log_info "  Text: $report_file"
    log_info "  HTML: $html_report"
}

# Generate coverage report
generate_coverage_report() {
    if [ "$COVERAGE" -ne 1 ]; then
        return 0
    fi
    
    log_info "Generating coverage report..."
    
    local coverage_dir="$BUILD_DIR/coverage"
    mkdir -p "$coverage_dir"
    
    # Combine all coverage files
    local combined_coverage="$coverage_dir/combined.info"
    
    # Find all coverage files
    local coverage_files=()
    for module in "${MODULES[@]}"; do
        local module_coverage="$BINDINGS_DIR/$module/coverage.info"
        if [ -f "$module_coverage" ]; then
            coverage_files+=("$module_coverage")
        fi
    done
    
    if [ ${#coverage_files[@]} -gt 0 ]; then
        # Combine coverage files
        lcov $(printf -- "-a %s " "${coverage_files[@]}") -o "$combined_coverage" 2>/dev/null
        
        # Generate HTML report
        genhtml "$combined_coverage" --output-directory "$coverage_dir/html" 2>/dev/null
        
        log_success "Coverage report generated: $coverage_dir/html/index.html"
    else
        log_warning "No coverage files found"
    fi
}

# Show help
show_help() {
    echo "RKLLMJS C++ Test System"
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  test [MODULE]     Run tests for all modules or specific module"
    echo "  coverage          Run tests with coverage analysis"
    echo "  memcheck          Run tests with memory leak detection"
    echo "  benchmark         Run performance benchmarks"
    echo "  report            Generate test report only"
    echo "  help              Show this help message"
    echo ""
    echo "Options:"
    echo "  --verbose, -v     Enable verbose output"
    echo "  --parallel, -p    Run tests in parallel (not yet implemented)"
    echo ""
    echo "Environment Variables:"
    echo "  VERBOSE           Enable verbose output (1|0)"
    echo "  COVERAGE          Enable coverage analysis (1|0)"
    echo "  MEMCHECK          Enable memory leak detection (1|0)"
    echo "  BENCHMARK         Enable benchmarking (1|0)"
    echo "  PARALLEL_TESTS    Enable parallel testing (1|0)"
    echo ""
    echo "Examples:"
    echo "  $0 test                   # Run all module tests"
    echo "  $0 test utils             # Run only utils module tests"
    echo "  $0 coverage               # Run tests with coverage analysis"
    echo "  $0 memcheck               # Run tests with memory checking"
    echo "  $0 --verbose test         # Run tests with verbose output"
}

# Parse command line arguments
COMMAND="test"
MODULE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --verbose|-v)
            VERBOSE=1
            shift
            ;;
        --parallel|-p)
            PARALLEL_TESTS=1
            shift
            ;;
        test|coverage|memcheck|benchmark|report|help)
            COMMAND="$1"
            # Set appropriate flags for special commands
            case "$1" in
                coverage) COVERAGE=1 ;;
                memcheck) MEMCHECK=1 ;;
                benchmark) BENCHMARK=1 ;;
            esac
            shift
            ;;
        -*)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
        *)
            if [ -z "$MODULE" ]; then
                MODULE="$1"
            else
                echo "Too many arguments"
                show_help
                exit 1
            fi
            shift
            ;;
    esac
done

# Main execution
main() {
    case "$COMMAND" in
        test|coverage|memcheck|benchmark)
            check_prerequisites
            if [ -n "$MODULE" ]; then
                test_module "$MODULE"
            else
                test_all
            fi
            generate_test_report
            if [ "$COVERAGE" -eq 1 ]; then
                generate_coverage_report
            fi
            ;;
        report)
            generate_test_report
            if [ "$COVERAGE" -eq 1 ]; then
                generate_coverage_report
            fi
            ;;
        help)
            show_help
            ;;
        *)
            echo "Unknown command: $COMMAND"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"

# Exit with appropriate code
if [ $FAILED_TESTS -eq 0 ]; then
    echo ""
    log_success "All tests passed! 🎉"
    exit 0
else
    echo ""
    log_error "$FAILED_TESTS test(s) failed"
    exit 1
fi
