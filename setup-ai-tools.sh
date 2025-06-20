#!/bin/bash

set -e

# ContextHub Setup Script for Unix/macOS
# Creates symlinks for AI tool configurations

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ASCII Banner
cat << 'EOF'
 ██████╗ ██████╗ ███╗   ██╗████████╗███████╗██╗  ██╗████████╗██╗  ██╗██╗   ██╗██████╗ 
██╔════╝██╔═══██╗████╗  ██║╚══██╔══╝██╔════╝╚██╗██╔╝╚══██╔══╝██║  ██║██║   ██║██╔══██╗
██║     ██║   ██║██╔██╗ ██║   ██║   █████╗   ╚███╔╝    ██║   ███████║██║   ██║██████╔╝
██║     ██║   ██║██║╚██╗██║   ██║   ██╔══╝   ██╔██╗    ██║   ██╔══██║██║   ██║██╔══██╗
╚██████╗╚██████╔╝██║ ╚████║   ██║   ███████╗██╔╝ ██╗   ██║   ██║  ██║╚██████╔╝██████╔╝
 ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ 

EOF

echo -e "${CYAN}Unified Configuration for AI Coding Assistants${NC}"
echo -e "${PURPLE}Setting up symlinks for Claude Code, Cursor, GitHub Copilot, and more...${NC}"
echo ""

# Configuration
MASTER_FILE=".ai-context.md"
BACKUP_DIR=".ai-tools-backup"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# AI tool configurations to create
declare -A AI_CONFIGS=(
    ["CLAUDE.md"]="Claude Code configuration"
    [".cursorrules"]="Cursor IDE configuration"
    [".github/copilot-instructions.md"]="GitHub Copilot configuration"
    [".codeium/instructions.md"]="Codeium configuration"
    [".continue/context.md"]="Continue configuration"
)

# Special handling for YAML configs
AIDER_CONFIG=".aider.conf.yml"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running on supported platform
check_platform() {
    case "$(uname -s)" in
        Linux*)     PLATFORM=Linux;;
        Darwin*)    PLATFORM=Mac;;
        CYGWIN*)    PLATFORM=Cygwin;;
        MINGW*)     PLATFORM=MinGw;;
        MSYS*)      PLATFORM=Msys;;
        *)          PLATFORM="UNKNOWN";;
    esac
    
    log_info "Detected platform: $PLATFORM"
    
    if [ "$PLATFORM" = "UNKNOWN" ]; then
        log_error "Unsupported platform. Please use the Python script for cross-platform support."
        exit 1
    fi
}

# Create master configuration file if it doesn't exist
create_master_config() {
    if [ ! -f "$MASTER_FILE" ]; then
        log_info "Creating master configuration file: $MASTER_FILE"
        cat > "$MASTER_FILE" << 'EOF'
# AI Context Configuration

## Project Overview
<!-- Add your project description here -->

## Architecture
<!-- Describe your project architecture -->

## Coding Standards
<!-- Define your coding standards and conventions -->

### TypeScript/JavaScript
- Use strict type checking
- Prefer const over let
- Use meaningful variable names
- Add JSDoc comments for public APIs

### React (if applicable)
- Use functional components with hooks
- Implement proper error boundaries
- Use React.memo for performance optimization

### Python (if applicable)
- Follow PEP 8 style guidelines
- Use type hints
- Write comprehensive docstrings
- Use virtual environments

## Testing Strategy
<!-- Describe your testing approach -->

## Performance Requirements
<!-- List performance requirements -->

## Security Guidelines
<!-- Security best practices for this project -->

<!-- Tool-specific sections -->
<!-- AI:CLAUDE -->
<!-- Claude-specific instructions here -->
<!-- /AI:CLAUDE -->

<!-- AI:CURSOR -->
<!-- Cursor-specific instructions here -->
<!-- /AI:CURSOR -->

<!-- AI:COPILOT -->
<!-- GitHub Copilot-specific instructions here -->
<!-- /AI:COPILOT -->
EOF
        log_success "Created $MASTER_FILE with basic template"
    else
        log_info "Master configuration file already exists: $MASTER_FILE"
    fi
}

# Create backup directory
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log_info "Created backup directory: $BACKUP_DIR"
        
        # Add to .gitignore if it exists
        if [ -f ".gitignore" ]; then
            if ! grep -q "$BACKUP_DIR" ".gitignore"; then
                echo "" >> ".gitignore"
                echo "# AI tools backup" >> ".gitignore"
                echo "$BACKUP_DIR/" >> ".gitignore"
                log_info "Added $BACKUP_DIR to .gitignore"
            fi
        fi
    fi
}

# Backup existing file
backup_existing_file() {
    local file="$1"
    if [ -f "$file" ] || [ -L "$file" ]; then
        local backup_file="$BACKUP_DIR/$(basename "$file")_$TIMESTAMP"
        cp "$file" "$backup_file" 2>/dev/null || {
            # If cp fails (e.g., broken symlink), try to remove the symlink
            if [ -L "$file" ]; then
                rm "$file"
                log_warning "Removed broken symlink: $file"
                return 0
            fi
            log_error "Failed to backup $file"
            return 1
        }
        log_info "Backed up existing $file to $backup_file"
        rm "$file"
    fi
}

# Create directory if it doesn't exist
ensure_directory() {
    local dir="$1"
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        log_info "Created directory: $dir"
    fi
}

# Create symlink
create_symlink() {
    local target="$1"
    local link_name="$2"
    local description="$3"
    
    # Create directory if needed
    local dir=$(dirname "$link_name")
    if [ "$dir" != "." ]; then
        ensure_directory "$dir"
    fi
    
    # Backup existing file
    backup_existing_file "$link_name"
    
    # Create symlink
    if ln -s "$(realpath "$target")" "$link_name" 2>/dev/null; then
        log_success "Created symlink: $link_name → $target ($description)"
        return 0
    else
        log_error "Failed to create symlink: $link_name → $target"
        return 1
    fi
}

# Create Aider configuration
create_aider_config() {
    if [ ! -f "$AIDER_CONFIG" ]; then
        log_info "Creating Aider configuration: $AIDER_CONFIG"
        cat > "$AIDER_CONFIG" << EOF
# Aider configuration
# This file is managed by ContextHub
# Edit .ai-context.md instead

# Model settings
model: gpt-4

# Auto-commit settings
auto-commits: true
dirty-commits: true

# Context settings
read: .ai-context.md
EOF
        log_success "Created $AIDER_CONFIG"
    else
        log_info "Aider configuration already exists: $AIDER_CONFIG"
    fi
}

# Verify setup
verify_setup() {
    log_info "Verifying setup..."
    local failed=0
    
    # Check master file
    if [ ! -f "$MASTER_FILE" ]; then
        log_error "Master file not found: $MASTER_FILE"
        failed=1
    fi
    
    # Check each symlink
    for config in "${!AI_CONFIGS[@]}"; do
        if [ -L "$config" ] && [ -f "$config" ]; then
            log_success "✓ $config → $(readlink "$config")"
        else
            log_error "✗ $config (missing or broken)"
            failed=1
        fi
    done
    
    # Check Aider config
    if [ -f "$AIDER_CONFIG" ]; then
        log_success "✓ $AIDER_CONFIG (exists)"
    else
        log_warning "✗ $AIDER_CONFIG (missing)"
    fi
    
    if [ $failed -eq 0 ]; then
        log_success "All configurations verified successfully!"
        return 0
    else
        log_error "Some configurations failed verification"
        return 1
    fi
}

# Main setup function
main() {
    echo -e "${CYAN}Starting ContextHub setup...${NC}"
    echo ""
    
    # Platform check
    check_platform
    
    # Create master config
    create_master_config
    
    # Create backup directory
    create_backup_dir
    
    # Create symlinks for each AI tool
    log_info "Creating symlinks for AI tool configurations..."
    
    local success_count=0
    local total_count=${#AI_CONFIGS[@]}
    
    for config in "${!AI_CONFIGS[@]}"; do
        if create_symlink "$MASTER_FILE" "$config" "${AI_CONFIGS[$config]}"; then
            ((success_count++))
        fi
    done
    
    # Create Aider config
    create_aider_config
    
    echo ""
    log_info "Setup Summary:"
    log_info "- Master file: $MASTER_FILE"
    log_info "- Successful symlinks: $success_count/$total_count"
    log_info "- Backup directory: $BACKUP_DIR"
    
    # Verify setup
    echo ""
    verify_setup
    
    echo ""
    if [ $success_count -eq $total_count ]; then
        log_success "🎉 ContextHub setup completed successfully!"
        echo ""
        echo -e "${CYAN}Next steps:${NC}"
        echo -e "1. Edit ${YELLOW}$MASTER_FILE${NC} to add your project context"
        echo -e "2. All AI tools will automatically use the unified configuration"
        echo -e "3. Check our examples at: ${BLUE}https://github.com/seshanpillay25/contexthub/tree/main/examples${NC}"
        echo ""
        echo -e "${GREEN}Happy coding with your AI assistants! 🤖${NC}"
    else
        log_warning "Setup completed with some issues. Please check the logs above."
        echo ""
        echo -e "${YELLOW}If you need help:${NC}"
        echo -e "- Check our troubleshooting guide: ${BLUE}https://github.com/seshanpillay25/contexthub/blob/main/docs/troubleshooting.md${NC}"
        echo -e "- Open an issue: ${BLUE}https://github.com/seshanpillay25/contexthub/issues${NC}"
    fi
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        echo "ContextHub Setup Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --verify       Verify existing setup"
        echo "  --backup-only  Create backup without setting up symlinks"
        echo ""
        echo "This script creates a unified configuration system for AI coding assistants."
        echo "It creates symlinks from tool-specific files to a master .ai-context.md file."
        exit 0
        ;;
    --verify)
        log_info "Verifying existing ContextHub setup..."
        verify_setup
        exit $?
        ;;
    --backup-only)
        log_info "Creating backup directory and files..."
        create_backup_dir
        for config in "${!AI_CONFIGS[@]}"; do
            backup_existing_file "$config"
        done
        log_success "Backup completed"
        exit 0
        ;;
    *)
        main
        ;;
esac