#!/bin/bash

# Test symlink functionality for ContextHub
# This script tests various symlink scenarios and edge cases

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
TEST_DIR="test-symlinks-$$"
MASTER_FILE=".ai-context.md"
TEST_CONFIGS=("CLAUDE.md" ".cursorrules" ".github/copilot-instructions.md")

# Statistics
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Utility functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((TESTS_PASSED++))
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((TESTS_FAILED++))
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

run_test() {
    local test_name="$1"
    ((TESTS_RUN++))
    log_info "Running test: $test_name"
}

# Setup test environment
setup_test_env() {
    log_info "Setting up test environment: $TEST_DIR"
    
    # Create test directory
    mkdir -p "$TEST_DIR"
    cd "$TEST_DIR"
    
    # Create master configuration file
    cat > "$MASTER_FILE" << 'EOF'
# Test AI Context Configuration

## Project Overview
This is a test configuration for ContextHub symlink testing.

## Coding Standards
- Use strict mode
- Prefer const over let
- Write comprehensive tests

<!-- AI:CLAUDE -->
Focus on code quality and testing.
<!-- /AI:CLAUDE -->

<!-- AI:CURSOR -->
Provide fast autocomplete suggestions.
<!-- /AI:CURSOR -->
EOF
    
    log_success "Test environment created"
}

# Cleanup test environment
cleanup_test_env() {
    cd ..
    if [[ -d "$TEST_DIR" ]]; then
        rm -rf "$TEST_DIR"
        log_info "Cleaned up test directory: $TEST_DIR"
    fi
}

# Test basic symlink creation
test_basic_symlink_creation() {
    run_test "Basic symlink creation"
    
    local config_file="CLAUDE.md"
    
    # Create symlink
    if ln -s "$MASTER_FILE" "$config_file" 2>/dev/null; then
        # Verify symlink was created
        if [[ -L "$config_file" ]]; then
            log_success "Symlink created successfully: $config_file"
        else
            log_error "File exists but is not a symlink: $config_file"
            return 1
        fi
        
        # Verify symlink target
        local target=$(readlink "$config_file")
        if [[ "$target" == "$MASTER_FILE" ]]; then
            log_success "Symlink points to correct target: $target"
        else
            log_error "Symlink points to wrong target: $target (expected: $MASTER_FILE)"
            return 1
        fi
        
        # Verify content accessibility
        if [[ "$(cat "$config_file")" == "$(cat "$MASTER_FILE")" ]]; then
            log_success "Symlink content matches master file"
        else
            log_error "Symlink content differs from master file"
            return 1
        fi
        
    else
        log_error "Failed to create symlink (symlinks may not be supported on this filesystem)"
        return 1
    fi
}

# Test symlink in subdirectory
test_subdirectory_symlink() {
    run_test "Subdirectory symlink creation"
    
    local subdir=".github"
    local config_file="$subdir/copilot-instructions.md"
    
    # Create subdirectory
    mkdir -p "$subdir"
    
    # Create relative symlink
    local relative_target="../$MASTER_FILE"
    if ln -s "$relative_target" "$config_file" 2>/dev/null; then
        # Verify symlink works
        if [[ -L "$config_file" ]] && [[ -r "$config_file" ]]; then
            log_success "Subdirectory symlink created and readable"
        else
            log_error "Subdirectory symlink not working properly"
            return 1
        fi
        
        # Verify content
        if [[ "$(cat "$config_file")" == "$(cat "$MASTER_FILE")" ]]; then
            log_success "Subdirectory symlink content correct"
        else
            log_error "Subdirectory symlink content incorrect"
            return 1
        fi
    else
        log_error "Failed to create subdirectory symlink"
        return 1
    fi
}

# Test symlink modification
test_symlink_modification() {
    run_test "Symlink modification synchronization"
    
    local config_file="test-modify.md"
    
    # Create symlink
    ln -s "$MASTER_FILE" "$config_file" 2>/dev/null || {
        log_error "Cannot create symlink for modification test"
        return 1
    }
    
    # Get original content
    local original_content=$(cat "$MASTER_FILE")
    
    # Modify through symlink
    echo "## Additional Section" >> "$config_file"
    echo "Added via symlink modification" >> "$config_file"
    
    # Verify master file was modified
    if grep -q "Additional Section" "$MASTER_FILE"; then
        log_success "Master file updated through symlink modification"
    else
        log_error "Master file not updated through symlink modification"
        return 1
    fi
    
    # Verify both files have same content
    if [[ "$(cat "$config_file")" == "$(cat "$MASTER_FILE")" ]]; then
        log_success "Symlink and master file content synchronized"
    else
        log_error "Symlink and master file content not synchronized"
        return 1
    fi
    
    # Restore original content
    echo "$original_content" > "$MASTER_FILE"
}

# Test broken symlink handling
test_broken_symlink() {
    run_test "Broken symlink detection"
    
    local config_file="broken-link.md"
    local nonexistent_target="nonexistent.md"
    
    # Create symlink to nonexistent file
    ln -s "$nonexistent_target" "$config_file" 2>/dev/null || {
        log_error "Cannot create symlink for broken link test"
        return 1
    }
    
    # Verify symlink exists but is broken
    if [[ -L "$config_file" ]] && [[ ! -r "$config_file" ]]; then
        log_success "Broken symlink detected correctly"
    else
        log_error "Broken symlink not detected properly"
        return 1
    fi
    
    # Test reading broken symlink
    if ! cat "$config_file" >/dev/null 2>&1; then
        log_success "Reading broken symlink fails as expected"
    else
        log_error "Reading broken symlink should fail but didn't"
        return 1
    fi
}

# Test symlink replacement
test_symlink_replacement() {
    run_test "Symlink replacement"
    
    local config_file="replace-test.md"
    
    # Create initial regular file
    echo "Original content" > "$config_file"
    
    # Verify it's a regular file
    if [[ -f "$config_file" ]] && [[ ! -L "$config_file" ]]; then
        log_success "Initial regular file created"
    else
        log_error "Failed to create initial regular file"
        return 1
    fi
    
    # Replace with symlink
    rm "$config_file"
    ln -s "$MASTER_FILE" "$config_file" 2>/dev/null || {
        log_error "Cannot create replacement symlink"
        return 1
    }
    
    # Verify replacement
    if [[ -L "$config_file" ]] && [[ "$(cat "$config_file")" == "$(cat "$MASTER_FILE")" ]]; then
        log_success "File successfully replaced with symlink"
    else
        log_error "File replacement with symlink failed"
        return 1
    fi
}

# Test circular symlink detection
test_circular_symlink() {
    run_test "Circular symlink detection"
    
    local file1="circular1.md"
    local file2="circular2.md"
    
    # Create circular symlinks
    ln -s "$file2" "$file1" 2>/dev/null || {
        log_error "Cannot create first symlink for circular test"
        return 1
    }
    
    ln -s "$file1" "$file2" 2>/dev/null || {
        log_error "Cannot create second symlink for circular test"
        return 1
    }
    
    # Test that reading fails
    if ! cat "$file1" >/dev/null 2>&1; then
        log_success "Circular symlink reading fails as expected"
    else
        log_error "Circular symlink reading should fail but didn't"
        return 1
    fi
}

# Test symlink permissions
test_symlink_permissions() {
    run_test "Symlink permissions"
    
    local config_file="permission-test.md"
    
    # Create symlink
    ln -s "$MASTER_FILE" "$config_file" 2>/dev/null || {
        log_error "Cannot create symlink for permission test"
        return 1
    }
    
    # Test read permissions
    if [[ -r "$config_file" ]]; then
        log_success "Symlink is readable"
    else
        log_error "Symlink is not readable"
        return 1
    fi
    
    # Test write permissions (should inherit from target)
    if [[ -w "$config_file" ]]; then
        log_success "Symlink is writable"
    else
        log_warning "Symlink is not writable (may be filesystem dependent)"
    fi
}

# Test multiple symlinks to same target
test_multiple_symlinks() {
    run_test "Multiple symlinks to same target"
    
    local configs=("multi1.md" "multi2.md" "multi3.md")
    
    # Create multiple symlinks
    for config in "${configs[@]}"; do
        ln -s "$MASTER_FILE" "$config" 2>/dev/null || {
            log_error "Cannot create symlink: $config"
            return 1
        }
    done
    
    # Verify all symlinks work
    for config in "${configs[@]}"; do
        if [[ ! -L "$config" ]] || [[ "$(cat "$config")" != "$(cat "$MASTER_FILE")" ]]; then
            log_error "Symlink not working properly: $config"
            return 1
        fi
    done
    
    log_success "All multiple symlinks working correctly"
    
    # Test modification through one symlink affects all
    echo "## Multi-symlink test" >> "${configs[0]}"
    
    for config in "${configs[@]:1}"; do
        if ! grep -q "Multi-symlink test" "$config"; then
            log_error "Modification not reflected in all symlinks"
            return 1
        fi
    done
    
    log_success "Modification propagated to all symlinks"
}

# Test symlink with spaces in filename
test_symlink_spaces() {
    run_test "Symlink with spaces in filename"
    
    local config_file="file with spaces.md"
    
    # Create symlink with spaces
    if ln -s "$MASTER_FILE" "$config_file" 2>/dev/null; then
        # Test reading
        if [[ "$(cat "$config_file")" == "$(cat "$MASTER_FILE")" ]]; then
            log_success "Symlink with spaces works correctly"
        else
            log_error "Symlink with spaces content mismatch"
            return 1
        fi
    else
        log_error "Failed to create symlink with spaces in filename"
        return 1
    fi
}

# Main test execution
main() {
    echo "ContextHub Symlink Test Suite"
    echo "============================="
    echo ""
    
    # Check if symlinks are supported
    if ! ln -s /dev/null test-symlink-support 2>/dev/null; then
        log_error "Symlinks not supported on this filesystem"
        exit 1
    fi
    rm -f test-symlink-support
    
    # Setup
    setup_test_env
    
    # Run tests
    test_basic_symlink_creation || true
    test_subdirectory_symlink || true
    test_symlink_modification || true
    test_broken_symlink || true
    test_symlink_replacement || true
    test_circular_symlink || true
    test_symlink_permissions || true
    test_multiple_symlinks || true
    test_symlink_spaces || true
    
    # Cleanup
    cleanup_test_env
    
    # Summary
    echo ""
    echo "Test Summary"
    echo "============"
    echo "Tests run: $TESTS_RUN"
    echo "Tests passed: $TESTS_PASSED"
    echo "Tests failed: $TESTS_FAILED"
    
    if [[ $TESTS_FAILED -eq 0 ]]; then
        log_success "All tests passed! ✅"
        exit 0
    else
        log_error "Some tests failed! ❌"
        exit 1
    fi
}

# Handle cleanup on exit
trap cleanup_test_env EXIT

# Run main function
main "$@"