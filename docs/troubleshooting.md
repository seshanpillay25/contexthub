# Troubleshooting ContextHub

This guide helps you diagnose and resolve common issues with ContextHub.

## Quick Diagnostic Commands

Start with these commands to identify issues:

```bash
# Check overall setup
contexthub --verify

# Validate configuration
contexthub validate

# Check sync status
contexthub sync --status

# View detailed logs
contexthub setup --verbose
```

## Common Issues

### 1. Setup Issues

#### Permission Denied on Symlink Creation

**Symptoms:**
```
[ERROR] Failed to create symlink: Permission denied
```

**Causes:**
- Running without admin privileges on Windows
- Filesystem doesn't support symlinks (FAT32, some network drives)

**Solutions:**

**Windows:**
```powershell
# Run PowerShell as Administrator
Run-As Administrator
.\setup-ai-tools.ps1

# Or use file copying mode
contexthub setup --no-symlinks
```

**Unix/macOS:**
```bash
# Check filesystem support
df -T .  # Should show ext4, APFS, etc., not FAT32

# Use file copying if needed
./setup-ai-tools.sh --no-symlinks
```

#### File Already Exists

**Symptoms:**
```
[ERROR] CLAUDE.md already exists. Use --force to overwrite.
```

**Solutions:**
```bash
# Backup and force setup
cp CLAUDE.md CLAUDE.md.backup
contexthub setup --force

# Or migrate existing configurations
contexthub migrate
```

#### Configuration File Not Found

**Symptoms:**
```
[ERROR] No source configuration file found
```

**Solutions:**
```bash
# Create initial configuration
contexthub init

# Or manually create
touch .ai-context.md
echo "# My Project Configuration" > .ai-context.md
```

### 2. Synchronization Issues

#### Changes Not Reflected in Tools

**Symptoms:**
- Updated `.ai-context.md` but tools show old content
- Tools not following new instructions

**Diagnosis:**
```bash
# Check if using symlinks or copies
ls -la CLAUDE.md
# Symlink: CLAUDE.md -> .ai-context.md
# Copy: regular file

# Check file modification times
stat .ai-context.md CLAUDE.md .cursorrules
```

**Solutions:**

**For Symlinks:**
```bash
# Should auto-sync, but restart tools if needed
# VS Code: Ctrl+Shift+P -> "Developer: Reload Window"
# Other editors: Close and reopen
```

**For File Copies:**
```bash
# Manual sync required
contexthub sync

# Or rebuild all
contexthub build --force
```

#### Symlinks Broken

**Symptoms:**
```bash
ls -la CLAUDE.md
# CLAUDE.md -> .ai-context.md (broken symlink)
```

**Causes:**
- Source file moved or renamed
- Relative path issues

**Solutions:**
```bash
# Remove broken symlinks and recreate
rm CLAUDE.md .cursorrules
contexthub setup

# Or fix manually
ln -sf .ai-context.md CLAUDE.md
```

### 3. Configuration Issues

#### Validation Errors

**Symptoms:**
```bash
contexthub validate
# [ERROR] Missing required section: "Project Overview"
# [WARNING] No tool-specific sections found
```

**Solutions:**
```bash
# Add missing sections
cat >> .ai-context.md << 'EOF'

## Project Overview
Add your project description here.

<!-- AI:CLAUDE -->
Add Claude-specific instructions here.
<!-- /AI:CLAUDE -->
EOF

# Validate again
contexthub validate
```

#### YAML Syntax Errors

**Symptoms:**
```
[ERROR] Invalid YAML syntax: unexpected character
```

**Solutions:**
```bash
# Check YAML syntax
python3 -c "import yaml; yaml.safe_load(open('.ai-context.yml'))"

# Or use online validator
# Copy content to https://yamllint.com/

# Fix common issues:
# - Indentation (use spaces, not tabs)
# - Quotes around special characters
# - Proper list formatting
```

### 4. Tool-Specific Issues

#### Claude Code Not Reading Configuration

**Symptoms:**
- Claude Code not following project guidelines
- No context awareness

**Diagnosis:**
```bash
# Check if CLAUDE.md exists and is readable
ls -la CLAUDE.md
cat CLAUDE.md | head -10
```

**Solutions:**
```bash
# Ensure file exists in project root
pwd  # Should be your project directory
ls CLAUDE.md  # Should exist

# Recreate if missing
contexthub setup --force

# Check file permissions
chmod 644 CLAUDE.md
```

#### Cursor Rules Not Applying

**Symptoms:**
- Cursor not following coding rules
- Autocomplete doesn't match standards

**Diagnosis:**
```bash
# Check .cursorrules file
cat .cursorrules | head -10

# Check VS Code settings
code --list-extensions | grep cursor
```

**Solutions:**
```bash
# Restart VS Code
# Ctrl+Shift+P -> "Developer: Reload Window"

# Check Cursor extension is enabled
# Extensions -> Search "Cursor" -> Ensure enabled

# Verify file format
contexthub validate
```

#### GitHub Copilot Ignoring Instructions

**Symptoms:**
- Copilot suggestions don't follow guidelines
- No improvement in code quality

**Diagnosis:**
```bash
# Check instruction file location
ls -la .github/copilot-instructions.md

# Verify GitHub Copilot subscription
# GitHub -> Settings -> Copilot
```

**Solutions:**
```bash
# Ensure file is in correct location
mkdir -p .github
contexthub setup

# Check Copilot settings in VS Code
# Settings -> Search "copilot" -> Check configuration

# Restart VS Code and wait a few minutes
# Copilot may take time to read new instructions
```

#### Codeium Not Improving

**Symptoms:**
- Same generic completions
- No project-specific suggestions

**Solutions:**
```bash
# Check file location
ls -la .codeium/instructions.md

# Restart editor
# Changes may take 5-10 minutes to propagate

# Check Codeium extension status
# VS Code -> Extensions -> Codeium -> Ensure enabled and logged in
```

### 5. Platform-Specific Issues

#### Windows Issues

**PowerShell Execution Policy:**
```powershell
# If script execution is blocked
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Run setup script
.\setup-ai-tools.ps1
```

**WSL Issues:**
```bash
# Ensure Windows paths work
wslpath -w $(pwd)

# Check file permissions
ls -la .ai-context.md
# Should be readable by all
```

#### macOS Issues

**Symlink Creation:**
```bash
# Check if developer tools are installed
xcode-select --install

# Verify filesystem supports symlinks
df -T .
# Should show apfs or hfs
```

#### Linux Issues

**Filesystem Support:**
```bash
# Check filesystem type
df -T .
# ext4, btrfs support symlinks
# FAT32, NTFS may not

# If on mounted drive, check mount options
mount | grep $(df . | tail -1 | awk '{print $1}')
```

### 6. Performance Issues

#### Slow Tool Response

**Symptoms:**
- AI completions take too long
- High CPU usage

**Diagnosis:**
```bash
# Check configuration file size
wc -c .ai-context.md
# Should be < 100KB for optimal performance

# Check for infinite symlink loops
find . -type l -exec ls -la {} \; | grep -E "\.ai-context|CLAUDE|cursorrules"
```

**Solutions:**
```bash
# Reduce configuration size
# Split large sections into smaller ones
# Remove unnecessary detail

# Check for symlink loops
# Ensure no circular references
```

### 7. Migration Issues

#### Migration Fails

**Symptoms:**
```
[ERROR] Failed to migrate existing configurations
```

**Solutions:**
```bash
# Manual migration
cp CLAUDE.md .ai-tools-backup/
cp .cursorrules .ai-tools-backup/

# Create new configuration
contexthub init

# Manually merge content
cat .ai-tools-backup/CLAUDE.md >> .ai-context.md
```

#### Conflicting Configurations

**Symptoms:**
- Multiple tools have different instructions
- Inconsistent project information

**Solutions:**
```bash
# Review all existing files
ls CLAUDE.md .cursorrules .github/copilot-instructions.md

# Compare content
diff CLAUDE.md .cursorrules

# Choose canonical version
contexthub migrate --source CLAUDE.md
```

## Advanced Troubleshooting

### Debug Mode

Enable verbose logging for detailed diagnostics:

```bash
# Verbose setup
contexthub setup --verbose

# Debug build process
contexthub build --verbose

# Detailed validation
contexthub validate --verbose
```

### Manual Configuration Check

Verify configuration manually:

```bash
# Check all relevant files
files=(.ai-context.md CLAUDE.md .cursorrules .github/copilot-instructions.md .codeium/instructions.md .continue/context.md)

for file in "${files[@]}"; do
    if [[ -f "$file" ]]; then
        echo "=== $file ==="
        if [[ -L "$file" ]]; then
            echo "Symlink to: $(readlink "$file")"
        else
            echo "Regular file"
        fi
        echo "Size: $(wc -c < "$file") bytes"
        echo "Modified: $(stat -c %y "$file" 2>/dev/null || stat -f %m "$file" 2>/dev/null)"
        echo
    else
        echo "Missing: $file"
    fi
done
```

### Log Collection

Collect logs for support:

```bash
# Create diagnostic report
{
    echo "=== ContextHub Diagnostic Report ==="
    echo "Date: $(date)"
    echo "OS: $(uname -a)"
    echo "PWD: $(pwd)"
    echo
    
    echo "=== ContextHub Version ==="
    contexthub --version
    echo
    
    echo "=== File Status ==="
    ls -la .ai-context.md CLAUDE.md .cursorrules 2>/dev/null || echo "Some files missing"
    echo
    
    echo "=== Validation ==="
    contexthub validate 2>&1
    echo
    
    echo "=== Sync Status ==="
    contexthub sync --status 2>&1
    
} > contexthub-diagnostic.txt

echo "Diagnostic report saved to: contexthub-diagnostic.txt"
```

## Getting Help

### Self-Help Resources

1. **Documentation**: Check [docs/](.) for comprehensive guides
2. **Examples**: Review [examples/](../examples/) for working configurations
3. **Tool Compatibility**: See [tool-compatibility.md](tool-compatibility.md)

### Community Support

1. **GitHub Issues**: [Report bugs and issues](https://github.com/seshanpillay25/contexthub/issues)
2. **Discussions**: [Ask questions and share tips](https://github.com/seshanpillay25/contexthub/discussions)

### Reporting Issues

When reporting issues, include:

1. **Operating System** and version
2. **ContextHub version**: `contexthub --version`
3. **Error message** (full output)
4. **Steps to reproduce**
5. **Diagnostic report**: `contexthub-diagnostic.txt`
6. **Configuration file** (sanitized)

### Issue Template

```markdown
## Bug Report

**Environment:**
- OS: [Windows 11 / macOS 13 / Ubuntu 22.04]
- ContextHub Version: [1.0.0]
- Node.js Version: [18.0.0]

**Description:**
Brief description of the issue

**Steps to Reproduce:**
1. Run `contexthub setup`
2. Edit `.ai-context.md`
3. Notice that...

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Error Output:**
```
Paste error messages here
```

**Configuration:**
[Attach diagnostic report if possible]
```

### Quick Fixes

Before reporting, try these quick fixes:

```bash
# 1. Clean restart
rm -rf .ai-tools-backup .contexthub-checksums.json
contexthub setup --force

# 2. Validate configuration
contexthub validate --strict

# 3. Manual sync
contexthub sync --force

# 4. Reinstall ContextHub
npm uninstall -g contexthub
npm install -g contexthub@latest
```

---

Still having issues? Don't hesitate to [open an issue](https://github.com/seshanpillay25/contexthub/issues) with your diagnostic report!