# ContextHub Setup Script for Windows PowerShell
# Creates symlinks or copies for AI tool configurations

param(
    [switch]$Help,
    [switch]$Verify,
    [switch]$BackupOnly,
    [switch]$Force
)

# Set strict mode
Set-StrictMode -Version Latest

# Colors (if terminal supports it)
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    Cyan = "Cyan"
    Purple = "Magenta"
}

# ASCII Banner
$Banner = @"
 ██████╗ ██████╗ ███╗   ██╗████████╗███████╗██╗  ██╗████████╗██╗  ██╗██╗   ██╗██████╗ 
██╔════╝██╔═══██╗████╗  ██║╚══██╔══╝██╔════╝╚██╗██╔╝╚══██╔══╝██║  ██║██║   ██║██╔══██╗
██║     ██║   ██║██╔██╗ ██║   ██║   █████╗   ╚███╔╝    ██║   ███████║██║   ██║██████╔╝
██║     ██║   ██║██║╚██╗██║   ██║   ██╔══╝   ██╔██╗    ██║   ██╔══██║██║   ██║██╔══██╗
╚██████╗╚██████╔╝██║ ╚████║   ██║   ███████╗██╔╝ ██╗   ██║   ██║  ██║╚██████╔╝██████╔╝
 ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ 
"@

# Configuration
$MasterFile = ".ai-context.md"
$BackupDir = ".ai-tools-backup"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# AI tool configurations
$AIConfigs = @{
    "CLAUDE.md" = "Claude Code configuration"
    ".cursorrules" = "Cursor IDE configuration"
    ".github\copilot-instructions.md" = "GitHub Copilot configuration"
    ".codeium\instructions.md" = "Codeium configuration"
    ".continue\context.md" = "Continue configuration"
}

$AiderConfig = ".aider.conf.yml"

# Check if running as administrator
function Test-IsAdmin {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Check if symlinks are supported
function Test-SymlinkSupport {
    try {
        $testDir = Join-Path $env:TEMP "contexthub-symlink-test"
        $testFile = Join-Path $testDir "test.txt"
        $testLink = Join-Path $testDir "test-link.txt"
        
        New-Item -ItemType Directory -Path $testDir -Force | Out-Null
        "test" | Out-File -FilePath $testFile -Encoding UTF8
        
        New-Item -ItemType SymbolicLink -Path $testLink -Target $testFile -ErrorAction Stop | Out-Null
        
        $result = Test-Path $testLink
        Remove-Item -Path $testDir -Recurse -Force
        return $result
    }
    catch {
        return $false
    }
}

# Logging functions
function Write-LogInfo {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Colors.Blue
}

function Write-LogSuccess {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Colors.Green
}

function Write-LogWarning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Colors.Yellow
}

function Write-LogError {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Colors.Red
}

function Write-Banner {
    Write-Host $Banner -ForegroundColor $Colors.Cyan
    Write-Host ""
    Write-Host "Unified Configuration for AI Coding Assistants" -ForegroundColor $Colors.Cyan
    Write-Host "Setting up symlinks for Claude Code, Cursor, GitHub Copilot, and more..." -ForegroundColor $Colors.Purple
    Write-Host ""
}

# Create master configuration file
function New-MasterConfig {
    if (-not (Test-Path $MasterFile)) {
        Write-LogInfo "Creating master configuration file: $MasterFile"
        
        $content = @'
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

### C# (if applicable)
- Follow Microsoft coding conventions
- Use nullable reference types
- Implement proper async/await patterns
- Use dependency injection

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
'@
        
        $content | Out-File -FilePath $MasterFile -Encoding UTF8
        Write-LogSuccess "Created $MasterFile with basic template"
    }
    else {
        Write-LogInfo "Master configuration file already exists: $MasterFile"
    }
}

# Create backup directory
function New-BackupDirectory {
    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
        Write-LogInfo "Created backup directory: $BackupDir"
        
        # Add to .gitignore if it exists
        if (Test-Path ".gitignore") {
            $gitignoreContent = Get-Content ".gitignore" -ErrorAction SilentlyContinue
            if ($gitignoreContent -notmatch [regex]::Escape($BackupDir)) {
                "`n# AI tools backup" | Add-Content ".gitignore"
                "$BackupDir/" | Add-Content ".gitignore"
                Write-LogInfo "Added $BackupDir to .gitignore"
            }
        }
    }
}

# Backup existing file
function Backup-ExistingFile {
    param([string]$FilePath)
    
    if (Test-Path $FilePath) {
        $fileName = Split-Path $FilePath -Leaf
        $backupFile = Join-Path $BackupDir "${fileName}_$Timestamp"
        
        try {
            Copy-Item $FilePath $backupFile -Force
            Write-LogInfo "Backed up existing $FilePath to $backupFile"
            Remove-Item $FilePath -Force
            return $true
        }
        catch {
            Write-LogError "Failed to backup $FilePath : $($_.Exception.Message)"
            return $false
        }
    }
    return $true
}

# Ensure directory exists
function Ensure-Directory {
    param([string]$Path)
    
    $dir = Split-Path $Path -Parent
    if ($dir -and -not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-LogInfo "Created directory: $dir"
    }
}

# Create symlink or copy
function New-ConfigLink {
    param(
        [string]$Target,
        [string]$LinkPath,
        [string]$Description,
        [bool]$UseSymlinks = $true
    )
    
    # Ensure target directory exists
    Ensure-Directory $LinkPath
    
    # Backup existing file
    if (-not (Backup-ExistingFile $LinkPath)) {
        return $false
    }
    
    try {
        if ($UseSymlinks) {
            # Try to create symlink
            $targetPath = Resolve-Path $Target
            New-Item -ItemType SymbolicLink -Path $LinkPath -Target $targetPath -Force | Out-Null
            Write-LogSuccess "Created symlink: $LinkPath → $Target ($Description)"
        }
        else {
            # Fall back to copying
            Copy-Item $Target $LinkPath -Force
            Write-LogSuccess "Created copy: $LinkPath ← $Target ($Description)"
        }
        return $true
    }
    catch {
        Write-LogError "Failed to create link: $LinkPath → $Target : $($_.Exception.Message)"
        return $false
    }
}

# Create Aider configuration
function New-AiderConfig {
    if (-not (Test-Path $AiderConfig)) {
        Write-LogInfo "Creating Aider configuration: $AiderConfig"
        
        $aiderContent = @'
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
'@
        
        $aiderContent | Out-File -FilePath $AiderConfig -Encoding UTF8
        Write-LogSuccess "Created $AiderConfig"
    }
    else {
        Write-LogInfo "Aider configuration already exists: $AiderConfig"
    }
}

# Verify setup
function Test-Setup {
    Write-LogInfo "Verifying setup..."
    $failed = 0
    
    # Check master file
    if (-not (Test-Path $MasterFile)) {
        Write-LogError "Master file not found: $MasterFile"
        $failed++
    }
    
    # Check each configuration
    foreach ($config in $AIConfigs.Keys) {
        if (Test-Path $config) {
            $item = Get-Item $config
            if ($item.LinkType -eq "SymbolicLink") {
                $target = $item.Target
                Write-LogSuccess "✓ $config → $target"
            }
            else {
                Write-LogSuccess "✓ $config (copy)"
            }
        }
        else {
            Write-LogError "✗ $config (missing)"
            $failed++
        }
    }
    
    # Check Aider config
    if (Test-Path $AiderConfig) {
        Write-LogSuccess "✓ $AiderConfig (exists)"
    }
    else {
        Write-LogWarning "✗ $AiderConfig (missing)"
    }
    
    if ($failed -eq 0) {
        Write-LogSuccess "All configurations verified successfully!"
        return $true
    }
    else {
        Write-LogError "Some configurations failed verification"
        return $false
    }
}

# Show help
function Show-Help {
    Write-Host "ContextHub Setup Script for Windows" -ForegroundColor $Colors.Cyan
    Write-Host ""
    Write-Host "Usage: .\setup-ai-tools.ps1 [options]" -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor White
    Write-Host "  -Help          Show this help message" -ForegroundColor Gray
    Write-Host "  -Verify        Verify existing setup" -ForegroundColor Gray
    Write-Host "  -BackupOnly    Create backup without setting up links" -ForegroundColor Gray
    Write-Host "  -Force         Force setup even without admin privileges" -ForegroundColor Gray
    Write-Host ""
    Write-Host "This script creates a unified configuration system for AI coding assistants." -ForegroundColor White
    Write-Host "It creates symlinks (or copies) from tool-specific files to a master .ai-context.md file." -ForegroundColor White
    Write-Host ""
    Write-Host "Note: Symlinks require administrator privileges on Windows. The script will" -ForegroundColor Yellow
    Write-Host "automatically fall back to copying files if symlinks are not available." -ForegroundColor Yellow
}

# Main setup function
function Start-Setup {
    Write-Banner
    
    Write-LogInfo "Starting ContextHub setup..."
    Write-Host ""
    
    # Check admin privileges and symlink support
    $isAdmin = Test-IsAdmin
    $canSymlink = Test-SymlinkSupport
    $useSymlinks = $isAdmin -and $canSymlink
    
    if (-not $isAdmin -and -not $Force) {
        Write-LogWarning "Not running as administrator. Symlinks may not work."
        Write-LogWarning "Consider running as administrator or use -Force to continue with file copying."
        Write-Host ""
        
        $response = Read-Host "Continue with file copying instead of symlinks? [Y/n]"
        if ($response -match '^[Nn]') {
            Write-LogInfo "Setup cancelled. Run as administrator for symlink support."
            return
        }
        $useSymlinks = $false
    }
    
    if ($useSymlinks) {
        Write-LogInfo "Using symlinks (administrator mode)"
    }
    else {
        Write-LogInfo "Using file copying (compatibility mode)"
    }
    
    # Create master config
    New-MasterConfig
    
    # Create backup directory
    New-BackupDirectory
    
    # Create links for each AI tool
    Write-LogInfo "Creating configurations for AI tools..."
    
    $successCount = 0
    $totalCount = $AIConfigs.Count
    
    foreach ($config in $AIConfigs.Keys) {
        if (New-ConfigLink $MasterFile $config $AIConfigs[$config] $useSymlinks) {
            $successCount++
        }
    }
    
    # Create Aider config
    New-AiderConfig
    
    Write-Host ""
    Write-LogInfo "Setup Summary:"
    Write-LogInfo "- Master file: $MasterFile"
    Write-LogInfo "- Successful configurations: $successCount/$totalCount"
    Write-LogInfo "- Backup directory: $BackupDir"
    Write-LogInfo "- Method: $(if ($useSymlinks) { 'Symlinks' } else { 'File copying' })"
    
    # Verify setup
    Write-Host ""
    $verifyResult = Test-Setup
    
    Write-Host ""
    if ($successCount -eq $totalCount -and $verifyResult) {
        Write-LogSuccess "🎉 ContextHub setup completed successfully!"
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor $Colors.Cyan
        Write-Host "1. Edit $MasterFile to add your project context" -ForegroundColor White
        Write-Host "2. All AI tools will automatically use the unified configuration" -ForegroundColor White
        Write-Host "3. Check our examples at: https://github.com/seshanpillay25/contexthub/tree/main/examples" -ForegroundColor $Colors.Blue
        Write-Host ""
        Write-Host "Happy coding with your AI assistants! 🤖" -ForegroundColor $Colors.Green
    }
    else {
        Write-LogWarning "Setup completed with some issues. Please check the logs above."
        Write-Host ""
        Write-Host "If you need help:" -ForegroundColor $Colors.Yellow
        Write-Host "- Check our troubleshooting guide: https://github.com/seshanpillay25/contexthub/blob/main/docs/troubleshooting.md" -ForegroundColor $Colors.Blue
        Write-Host "- Open an issue: https://github.com/seshanpillay25/contexthub/issues" -ForegroundColor $Colors.Blue
    }
}

# Handle command line arguments
if ($Help) {
    Show-Help
    exit 0
}

if ($Verify) {
    Write-LogInfo "Verifying existing ContextHub setup..."
    $result = Test-Setup
    exit $(if ($result) { 0 } else { 1 })
}

if ($BackupOnly) {
    Write-LogInfo "Creating backup directory and files..."
    New-BackupDirectory
    foreach ($config in $AIConfigs.Keys) {
        Backup-ExistingFile $config | Out-Null
    }
    Write-LogSuccess "Backup completed"
    exit 0
}

# Run main setup
Start-Setup