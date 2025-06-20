#!/usr/bin/env python3
"""
ContextHub Setup Script (Cross-platform Python version)
Creates symlinks or copies for AI tool configurations
"""

import os
import sys
import shutil
import argparse
import platform
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Optional

# ANSI color codes
class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    PURPLE = '\033[0;35m'
    CYAN = '\033[0;36m'
    NC = '\033[0m'  # No Color

# ASCII Banner
BANNER = """
 ██████╗ ██████╗ ███╗   ██╗████████╗███████╗██╗  ██╗████████╗██╗  ██╗██╗   ██╗██████╗ 
██╔════╝██╔═══██╗████╗  ██║╚══██╔══╝██╔════╝╚██╗██╔╝╚══██╔══╝██║  ██║██║   ██║██╔══██╗
██║     ██║   ██║██╔██╗ ██║   ██║   █████╗   ╚███╔╝    ██║   ███████║██║   ██║██████╔╝
██║     ██║   ██║██║╚██╗██║   ██║   ██╔══╝   ██╔██╗    ██║   ██╔══██║██║   ██║██╔══██╗
╚██████╗╚██████╔╝██║ ╚████║   ██║   ███████╗██╔╝ ██╗   ██║   ██║  ██║╚██████╔╝██████╔╝
 ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ 
"""

# Configuration
MASTER_FILE = ".ai-context.md"
BACKUP_DIR = ".ai-tools-backup"
AIDER_CONFIG = ".aider.conf.yml"

# AI tool configurations
AI_CONFIGS = {
    "CLAUDE.md": "Claude Code configuration",
    ".cursorrules": "Cursor IDE configuration",
    ".github/copilot-instructions.md": "GitHub Copilot configuration", 
    ".codeium/instructions.md": "Codeium configuration",
    ".continue/context.md": "Continue configuration"
}

def supports_color() -> bool:
    """Check if terminal supports color output."""
    return hasattr(sys.stdout, 'isatty') and sys.stdout.isatty()

def colorize(text: str, color: str) -> str:
    """Add color to text if terminal supports it."""
    if supports_color():
        return f"{color}{text}{Colors.NC}"
    return text

def log_info(message: str) -> None:
    """Log info message."""
    print(colorize(f"[INFO] {message}", Colors.BLUE))

def log_success(message: str) -> None:
    """Log success message."""
    print(colorize(f"[SUCCESS] {message}", Colors.GREEN))

def log_warning(message: str) -> None:
    """Log warning message."""
    print(colorize(f"[WARNING] {message}", Colors.YELLOW))

def log_error(message: str) -> None:
    """Log error message."""
    print(colorize(f"[ERROR] {message}", Colors.RED))

def print_banner() -> None:
    """Print the ASCII banner."""
    print(colorize(BANNER, Colors.CYAN))
    print(colorize("Unified Configuration for AI Coding Assistants", Colors.CYAN))
    print(colorize("Setting up symlinks for Claude Code, Cursor, GitHub Copilot, and more...", Colors.PURPLE))
    print()

def check_symlink_support() -> bool:
    """Check if the system supports symbolic links."""
    try:
        test_dir = Path.cwd() / "symlink_test"
        test_file = test_dir / "test.txt"
        test_link = test_dir / "test_link.txt"
        
        test_dir.mkdir(exist_ok=True)
        test_file.write_text("test")
        
        test_link.symlink_to(test_file)
        result = test_link.exists() and test_link.is_symlink()
        
        # Cleanup
        if test_link.exists():
            test_link.unlink()
        if test_file.exists():
            test_file.unlink()
        if test_dir.exists():
            test_dir.rmdir()
            
        return result
    except (OSError, NotImplementedError):
        return False

def is_admin() -> bool:
    """Check if running with administrator/root privileges."""
    try:
        if platform.system() == "Windows":
            import ctypes
            return ctypes.windll.shell32.IsUserAnAdmin() != 0
        else:
            return os.geteuid() == 0
    except (AttributeError, ImportError):
        return False

def create_master_config() -> None:
    """Create the master configuration file if it doesn't exist."""
    master_path = Path(MASTER_FILE)
    
    if not master_path.exists():
        log_info(f"Creating master configuration file: {MASTER_FILE}")
        
        content = """# AI Context Configuration

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
"""
        
        master_path.write_text(content)
        log_success(f"Created {MASTER_FILE} with basic template")
    else:
        log_info(f"Master configuration file already exists: {MASTER_FILE}")

def create_backup_dir() -> None:
    """Create backup directory and update .gitignore."""
    backup_path = Path(BACKUP_DIR)
    
    if not backup_path.exists():
        backup_path.mkdir(exist_ok=True)
        log_info(f"Created backup directory: {BACKUP_DIR}")
        
        # Add to .gitignore if it exists
        gitignore_path = Path(".gitignore")
        if gitignore_path.exists():
            gitignore_content = gitignore_path.read_text()
            if BACKUP_DIR not in gitignore_content:
                with gitignore_path.open("a") as f:
                    f.write(f"\n# AI tools backup\n{BACKUP_DIR}/\n")
                log_info(f"Added {BACKUP_DIR} to .gitignore")

def backup_existing_file(file_path: str) -> bool:
    """Backup an existing file before replacing it."""
    path = Path(file_path)
    
    if path.exists() or path.is_symlink():
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = Path(BACKUP_DIR) / f"{path.name}_{timestamp}"
        
        try:
            if path.is_symlink():
                # For symlinks, just remove them
                path.unlink()
                log_info(f"Removed existing symlink: {file_path}")
            else:
                # For regular files, backup then remove
                shutil.copy2(path, backup_file)
                path.unlink()
                log_info(f"Backed up existing {file_path} to {backup_file}")
            return True
        except Exception as e:
            log_error(f"Failed to backup {file_path}: {e}")
            return False
    
    return True

def ensure_directory(file_path: str) -> None:
    """Ensure the parent directory of a file exists."""
    path = Path(file_path)
    parent = path.parent
    
    if parent != Path(".") and not parent.exists():
        parent.mkdir(parents=True, exist_ok=True)
        log_info(f"Created directory: {parent}")

def create_config_link(target: str, link_path: str, description: str, use_symlinks: bool = True) -> bool:
    """Create a symlink or copy for a configuration file."""
    # Ensure parent directory exists
    ensure_directory(link_path)
    
    # Backup existing file
    if not backup_existing_file(link_path):
        return False
    
    target_path = Path(target).resolve()
    link_path_obj = Path(link_path)
    
    try:
        if use_symlinks:
            # Create symlink
            link_path_obj.symlink_to(target_path)
            log_success(f"Created symlink: {link_path} → {target} ({description})")
        else:
            # Copy file
            shutil.copy2(target_path, link_path_obj)
            log_success(f"Created copy: {link_path} ← {target} ({description})")
        return True
    except Exception as e:
        log_error(f"Failed to create link: {link_path} → {target}: {e}")
        return False

def create_aider_config() -> None:
    """Create Aider configuration file."""
    aider_path = Path(AIDER_CONFIG)
    
    if not aider_path.exists():
        log_info(f"Creating Aider configuration: {AIDER_CONFIG}")
        
        content = """# Aider configuration
# This file is managed by ContextHub
# Edit .ai-context.md instead

# Model settings
model: gpt-4

# Auto-commit settings
auto-commits: true
dirty-commits: true

# Context settings
read: .ai-context.md
"""
        
        aider_path.write_text(content)
        log_success(f"Created {AIDER_CONFIG}")
    else:
        log_info(f"Aider configuration already exists: {AIDER_CONFIG}")

def verify_setup() -> bool:
    """Verify the setup was successful."""
    log_info("Verifying setup...")
    failed = 0
    
    # Check master file
    if not Path(MASTER_FILE).exists():
        log_error(f"Master file not found: {MASTER_FILE}")
        failed += 1
    
    # Check each configuration
    for config_file in AI_CONFIGS:
        path = Path(config_file)
        if path.exists():
            if path.is_symlink():
                target = path.readlink()
                log_success(f"✓ {config_file} → {target}")
            else:
                log_success(f"✓ {config_file} (copy)")
        else:
            log_error(f"✗ {config_file} (missing)")
            failed += 1
    
    # Check Aider config
    if Path(AIDER_CONFIG).exists():
        log_success(f"✓ {AIDER_CONFIG} (exists)")
    else:
        log_warning(f"✗ {AIDER_CONFIG} (missing)")
    
    if failed == 0:
        log_success("All configurations verified successfully!")
        return True
    else:
        log_error("Some configurations failed verification")
        return False

def main_setup(force_copy: bool = False) -> None:
    """Main setup function."""
    print_banner()
    log_info("Starting ContextHub setup...")
    print()
    
    # Check platform and privileges
    system = platform.system()
    can_symlink = check_symlink_support()
    is_privileged = is_admin()
    
    # Determine strategy
    use_symlinks = False
    if not force_copy:
        if system == "Windows":
            use_symlinks = is_privileged and can_symlink
        else:
            use_symlinks = can_symlink
    
    if use_symlinks:
        log_info("Using symlinks")
    else:
        log_info("Using file copying (compatibility mode)")
        if system == "Windows" and not is_privileged and not force_copy:
            log_warning("Symlinks require administrator privileges on Windows")
            log_warning("Consider running as administrator for symlink support")
    
    # Create master config
    create_master_config()
    
    # Create backup directory
    create_backup_dir()
    
    # Create configurations for each AI tool
    log_info("Creating configurations for AI tools...")
    
    success_count = 0
    total_count = len(AI_CONFIGS)
    
    for config_file, description in AI_CONFIGS.items():
        if create_config_link(MASTER_FILE, config_file, description, use_symlinks):
            success_count += 1
    
    # Create Aider config
    create_aider_config()
    
    print()
    log_info("Setup Summary:")
    log_info(f"- Master file: {MASTER_FILE}")
    log_info(f"- Successful configurations: {success_count}/{total_count}")
    log_info(f"- Backup directory: {BACKUP_DIR}")
    log_info(f"- Method: {'Symlinks' if use_symlinks else 'File copying'}")
    
    # Verify setup
    print()
    verify_result = verify_setup()
    
    print()
    if success_count == total_count and verify_result:
        log_success("🎉 ContextHub setup completed successfully!")
        print()
        print(colorize("Next steps:", Colors.CYAN))
        print(f"1. Edit {colorize(MASTER_FILE, Colors.YELLOW)} to add your project context")
        print("2. All AI tools will automatically use the unified configuration")
        print(colorize("3. Check our examples at: https://github.com/seshanpillay25/contexthub/tree/main/examples", Colors.BLUE))
        print()
        print(colorize("Happy coding with your AI assistants! 🤖", Colors.GREEN))
    else:
        log_warning("Setup completed with some issues. Please check the logs above.")
        print()
        print(colorize("If you need help:", Colors.YELLOW))
        print(colorize("- Check our troubleshooting guide: https://github.com/seshanpillay25/contexthub/blob/main/docs/troubleshooting.md", Colors.BLUE))
        print(colorize("- Open an issue: https://github.com/seshanpillay25/contexthub/issues", Colors.BLUE))

def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="ContextHub Setup Script - Unified configuration for AI coding assistants",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
This script creates a unified configuration system for AI coding assistants.
It creates symlinks (or copies) from tool-specific files to a master .ai-context.md file.

Examples:
  python setup-ai-tools.py              # Run normal setup
  python setup-ai-tools.py --verify     # Verify existing setup
  python setup-ai-tools.py --force-copy # Force file copying instead of symlinks
        """
    )
    
    parser.add_argument(
        "--verify",
        action="store_true",
        help="Verify existing setup"
    )
    
    parser.add_argument(
        "--backup-only",
        action="store_true",
        help="Create backup without setting up links"
    )
    
    parser.add_argument(
        "--force-copy",
        action="store_true",
        help="Force file copying instead of symlinks"
    )
    
    args = parser.parse_args()
    
    try:
        if args.verify:
            log_info("Verifying existing ContextHub setup...")
            result = verify_setup()
            sys.exit(0 if result else 1)
        
        elif args.backup_only:
            log_info("Creating backup directory and files...")
            create_backup_dir()
            for config_file in AI_CONFIGS:
                backup_existing_file(config_file)
            log_success("Backup completed")
            sys.exit(0)
        
        else:
            main_setup(force_copy=args.force_copy)
    
    except KeyboardInterrupt:
        print()
        log_warning("Setup cancelled by user")
        sys.exit(1)
    except Exception as e:
        log_error(f"Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()