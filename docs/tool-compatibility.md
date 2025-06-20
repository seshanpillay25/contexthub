# Tool Compatibility Matrix

This document provides detailed information about ContextHub compatibility with different AI coding assistants, including supported features, configuration methods, and limitations.

## Supported Tools Overview

| Tool | Status | Config File | Strategy | Auto-Sync | Tool-Specific | Notes |
|------|--------|-------------|----------|-----------|---------------|-------|
| 🤖 Claude Code | ✅ Full | `CLAUDE.md` | Symlink/Copy | ✅ | ✅ | Official support |
| 🎯 Cursor | ✅ Full | `.cursorrules` | Symlink/Copy | ✅ | ✅ | Full feature support |
| 👨‍💻 GitHub Copilot | ✅ Full | `.github/copilot-instructions.md` | Symlink/Copy | ✅ | ✅ | Enterprise & individual |
| 🚀 Codeium | ✅ Full | `.codeium/instructions.md` | Symlink/Copy | ✅ | ✅ | Free & premium tiers |
| 🔄 Continue | ✅ Full | `.continue/context.md` | Symlink/Copy | ✅ | ✅ | VS Code extension |
| 🎨 Aider | ⚠️ Partial | `.aider.conf.yml` | Template | ⚠️ | ✅ | YAML format only |
| 🧠 TabNine | 🔄 Planned | `.tabnine/config.json` | Template | 🔄 | 🔄 | In development |
| ⚡ Sourcegraph | 🔄 Planned | `.sourcegraph/config.yaml` | Template | 🔄 | 🔄 | Enterprise focus |

## Detailed Tool Support

### 🤖 Claude Code

**Status**: ✅ Full Support

**Configuration File**: `CLAUDE.md`

**Features**:
- ✅ Markdown format support
- ✅ Real-time sync via symlinks
- ✅ Tool-specific sections via HTML comments
- ✅ Project context awareness
- ✅ Coding standards integration
- ✅ Architecture documentation

**Setup**:
```bash
# Automatic via ContextHub
contexthub setup

# Manual verification
ls -la CLAUDE.md  # Should show symlink to .ai-context.md
```

**Tool-Specific Configuration**:
```markdown
<!-- AI:CLAUDE -->
Focus on clean, readable code with comprehensive documentation.
Prioritize code quality and maintainability over speed.
Suggest architectural improvements when appropriate.
Explain complex algorithms and provide examples.
<!-- /AI:CLAUDE -->
```

**Limitations**: None known

**Testing Status**: ✅ Thoroughly tested

---

### 🎯 Cursor

**Status**: ✅ Full Support

**Configuration File**: `.cursorrules`

**Features**:
- ✅ Markdown format support
- ✅ Real-time sync via symlinks
- ✅ Custom rule definitions
- ✅ Multi-language support
- ✅ Project-specific contexts
- ✅ Integration with VS Code settings

**Setup**:
```bash
# Automatic via ContextHub
contexthub setup

# Manual verification
cat .cursorrules  # Should match .ai-context.md content
```

**Tool-Specific Configuration**:
```markdown
<!-- AI:CURSOR -->
Use autocomplete for common patterns and boilerplate.
Focus on rapid development and iteration.
Suggest modern language features and best practices.
Provide context-aware code completions.
<!-- /AI:CURSOR -->
```

**Best Practices**:
- Use specific coding rules for better completions
- Include framework-specific guidelines
- Define naming conventions clearly

**Limitations**: 
- File size limit: ~100KB for optimal performance
- Complex regex patterns may slow down completions

**Testing Status**: ✅ Thoroughly tested

---

### 👨‍💻 GitHub Copilot

**Status**: ✅ Full Support

**Configuration File**: `.github/copilot-instructions.md`

**Features**:
- ✅ Markdown format support
- ✅ Real-time sync via symlinks
- ✅ Repository-wide context
- ✅ Multi-language support
- ✅ Enterprise and individual accounts
- ✅ Integration with GitHub ecosystem

**Setup**:
```bash
# Automatic via ContextHub
contexthub setup

# Manual verification
ls -la .github/copilot-instructions.md
```

**Tool-Specific Configuration**:
```markdown
<!-- AI:COPILOT -->
Generate comprehensive test cases and documentation.
Focus on security best practices and performance optimization.
Suggest modern language idioms and design patterns.
Provide code examples with proper error handling.
<!-- /AI:COPILOT -->
```

**Best Practices**:
- Include security guidelines for sensitive projects
- Specify testing frameworks and patterns
- Define code review criteria

**Limitations**:
- Requires GitHub Copilot subscription
- May have delay in reading updated configurations
- Enterprise features require GitHub Enterprise

**Testing Status**: ✅ Thoroughly tested

---

### 🚀 Codeium

**Status**: ✅ Full Support

**Configuration File**: `.codeium/instructions.md`

**Features**:
- ✅ Markdown format support
- ✅ Real-time sync via symlinks
- ✅ Multi-language completions
- ✅ Free tier support
- ✅ Enterprise features
- ✅ Custom model training (Enterprise)

**Setup**:
```bash
# Automatic via ContextHub
contexthub setup

# Manual verification
cat .codeium/instructions.md
```

**Tool-Specific Configuration**:
```markdown
<!-- AI:CODEIUM -->
Provide context-aware completions based on project structure.
Focus on reducing boilerplate and improving productivity.
Suggest performance optimizations and modern alternatives.
Adapt suggestions to project's existing patterns.
<!-- /AI:CODEIUM -->
```

**Best Practices**:
- Include project-specific patterns and conventions
- Define performance requirements
- Specify preferred libraries and frameworks

**Limitations**:
- Free tier has usage limits
- Some features require Codeium Pro/Enterprise
- Configuration updates may take time to propagate

**Testing Status**: ✅ Thoroughly tested

---

### 🔄 Continue

**Status**: ✅ Full Support

**Configuration File**: `.continue/context.md`

**Features**:
- ✅ Markdown format support
- ✅ Real-time sync via symlinks
- ✅ VS Code integration
- ✅ Custom model support
- ✅ Chat interface context
- ✅ Codebase understanding

**Setup**:
```bash
# Automatic via ContextHub
contexthub setup

# Manual verification
ls -la .continue/context.md
```

**Tool-Specific Configuration**:
```markdown
<!-- AI:CONTINUE -->
Help with complex refactoring and architectural decisions.
Provide detailed explanations for code changes.
Focus on maintainability and long-term code health.
Suggest testing strategies and implementation approaches.
<!-- /AI:CONTINUE -->
```

**Best Practices**:
- Include architecture documentation
- Define refactoring guidelines
- Specify testing requirements

**Limitations**:
- Requires VS Code with Continue extension
- Some features depend on selected AI model
- Context window limitations vary by model

**Testing Status**: ✅ Thoroughly tested

---

### 🎨 Aider

**Status**: ⚠️ Partial Support

**Configuration File**: `.aider.conf.yml`

**Features**:
- ✅ YAML configuration format
- ✅ Reference to markdown context
- ⚠️ Manual sync required for updates
- ✅ Command-line integration
- ✅ Git integration
- ✅ Multiple model support

**Setup**:
```bash
# Automatic via ContextHub
contexthub setup

# Manual verification
cat .aider.conf.yml
```

**Generated Configuration**:
```yaml
# Aider configuration
# This file is managed by ContextHub
# Edit .ai-context.md instead

model: gpt-4
auto-commits: true
dirty-commits: true
read: .ai-context.md
```

**Manual Sync Required**:
```bash
# After updating .ai-context.md
aider --read .ai-context.md
```

**Best Practices**:
- Use Aider's `--read` flag to reference context
- Keep YAML config minimal
- Include git workflow preferences

**Limitations**:
- YAML format doesn't auto-sync with markdown changes
- Requires manual invocation with `--read` flag
- Limited to Aider-specific YAML schema

**Testing Status**: ⚠️ Limited testing

---

### 🧠 TabNine (Planned)

**Status**: 🔄 In Development

**Configuration File**: `.tabnine/config.json`

**Planned Features**:
- 🔄 JSON configuration format
- 🔄 Template-based generation
- 🔄 Language-specific settings
- 🔄 Team sharing capabilities

**Expected Timeline**: Q2 2024

---

### ⚡ Sourcegraph Cody (Planned)

**Status**: 🔄 In Development

**Configuration File**: `.sourcegraph/cody.yaml`

**Planned Features**:
- 🔄 YAML configuration format
- 🔄 Enterprise integration
- 🔄 Repository-wide context
- 🔄 Custom model support

**Expected Timeline**: Q3 2024

## Platform Compatibility

### Operating Systems

| OS | Symlinks | File Copying | Setup Script | Node.js CLI |
|----|----------|--------------|--------------|-------------|
| **macOS** | ✅ Native | ✅ Fallback | `setup-ai-tools.sh` | ✅ |
| **Linux** | ✅ Native | ✅ Fallback | `setup-ai-tools.sh` | ✅ |
| **Windows 10/11** | ⚠️ Admin required | ✅ Default | `setup-ai-tools.ps1` | ✅ |
| **WSL** | ✅ Native | ✅ Fallback | `setup-ai-tools.sh` | ✅ |

### Editors and IDEs

| Editor | Supported Tools | Notes |
|--------|----------------|-------|
| **VS Code** | Claude Code, Cursor, Copilot, Codeium, Continue | Best support |
| **JetBrains IDEs** | Copilot, Codeium | Plugin dependent |
| **Vim/Neovim** | Copilot, Codeium, Continue | Via plugins |
| **Emacs** | Copilot, Codeium | Via packages |
| **Sublime Text** | Codeium | Limited support |
| **Atom** | ⚠️ Deprecated | Not recommended |

### Package Managers

| Package Manager | Installation Command | Status |
|----------------|---------------------|---------|
| **npm** | `npm install -g contexthub` | ✅ Primary |
| **yarn** | `yarn global add contexthub` | ✅ Supported |
| **pnpm** | `pnpm add -g contexthub` | ✅ Supported |
| **homebrew** | `brew install contexthub` | 🔄 Planned |
| **chocolatey** | `choco install contexthub` | 🔄 Planned |

## Configuration Strategies

### 1. Symlink Strategy (Recommended)

**How it works**: Creates symbolic links from tool files to master configuration

**Pros**:
- ✅ Real-time synchronization
- ✅ No build step required
- ✅ Single file to maintain
- ✅ Works with any editor

**Cons**:
- ⚠️ Requires symlink support
- ⚠️ May need admin rights on Windows

**Supported Platforms**:
- ✅ macOS (native)
- ✅ Linux (native)
- ⚠️ Windows (admin required)
- ✅ WSL (native)

### 2. File Copying Strategy

**How it works**: Copies master configuration to tool-specific files

**Pros**:
- ✅ Works everywhere
- ✅ No permission requirements
- ✅ Compatible with all systems

**Cons**:
- ⚠️ Manual sync required
- ⚠️ Files can drift out of sync
- ⚠️ Build step recommended

**Sync Command**:
```bash
contexthub sync  # Manual sync after changes
```

### 3. Build Process Strategy

**How it works**: Generates tool files during build process

**Implementation**:
```json
{
  "scripts": {
    "prebuild": "contexthub build",
    "precommit": "contexthub sync"
  }
}
```

**Pros**:
- ✅ Integrates with CI/CD
- ✅ Ensures consistency
- ✅ Version controlled

**Cons**:
- ⚠️ Requires build setup
- ⚠️ Additional complexity

### 4. Git Hooks Strategy

**How it works**: Automatically syncs on git operations

**Setup**:
```bash
contexthub install-hooks
```

**Pros**:
- ✅ Automatic synchronization
- ✅ No manual intervention
- ✅ Team consistency

**Cons**:
- ⚠️ Git repository required
- ⚠️ Hooks can be bypassed

## Feature Comparison

### Configuration Formats

| Feature | Markdown | YAML | JSON |
|---------|----------|------|------|
| **Human Readable** | ✅ Excellent | ✅ Good | ⚠️ Fair |
| **Comments** | ✅ Native | ✅ Native | ❌ No |
| **Structure** | ⚠️ Limited | ✅ Excellent | ✅ Good |
| **Tool Support** | ✅ Most tools | ⚠️ Some tools | ⚠️ Few tools |
| **Version Control** | ✅ Excellent | ✅ Good | ✅ Good |

### Sync Methods

| Method | Real-time | Manual | Build | Git Hooks |
|--------|-----------|--------|-------|-----------|
| **Complexity** | ⭐ Simple | ⭐⭐ Medium | ⭐⭐⭐ Complex | ⭐⭐ Medium |
| **Reliability** | ✅ High | ⚠️ Medium | ✅ High | ⚠️ Medium |
| **Platform Support** | ⚠️ Limited | ✅ Universal | ✅ Universal | ✅ Universal |
| **Team Adoption** | ✅ Easy | ⚠️ Manual | ⚠️ Setup Required | ✅ Automatic |

## Migration Support

### From Existing Configurations

ContextHub can migrate from existing tool configurations:

```bash
contexthub migrate
```

**Supported Migration Sources**:
- ✅ `CLAUDE.md` → `.ai-context.md`
- ✅ `.cursorrules` → `.ai-context.md`
- ✅ `.github/copilot-instructions.md` → `.ai-context.md`
- ✅ `.codeium/instructions.md` → `.ai-context.md`
- ✅ `.continue/context.md` → `.ai-context.md`
- ⚠️ `.aider.conf.yml` → `.ai-context.yml` (partial)

### Migration Process

1. **Scan**: Detects existing configurations
2. **Backup**: Creates backup copies
3. **Merge**: Combines configurations intelligently
4. **Generate**: Creates unified configuration
5. **Verify**: Ensures all tools work

## Troubleshooting

### Common Compatibility Issues

#### Tool Not Reading Configuration

**Symptoms**: AI tool not following configuration guidelines

**Solutions**:
1. Restart the tool/editor
2. Check file path and permissions
3. Verify symlink integrity: `ls -la`
4. Check tool-specific documentation

#### Symlink Creation Failed

**Symptoms**: "Permission denied" or "Operation not supported"

**Solutions**:
1. Run with admin privileges (Windows)
2. Use file copying mode: `--no-symlinks`
3. Check filesystem support (FAT32 doesn't support symlinks)

#### Configuration Not Syncing

**Symptoms**: Changes not reflected in tools

**Solutions**:
1. Manual sync: `contexthub sync`
2. Rebuild configs: `contexthub build`
3. Check file modification times

#### Performance Issues

**Symptoms**: Slow completions or high CPU usage

**Solutions**:
1. Reduce configuration file size
2. Remove complex regex patterns
3. Use tool-specific sections
4. Check for infinite symlink loops

### Tool-Specific Issues

#### Claude Code
- **Issue**: Configuration not loading
- **Solution**: Ensure `CLAUDE.md` exists in project root

#### Cursor
- **Issue**: Rules not applying
- **Solution**: Restart VS Code, check `.cursorrules` syntax

#### GitHub Copilot
- **Issue**: Instructions ignored
- **Solution**: Verify GitHub Copilot subscription and file location

#### Codeium
- **Issue**: Completions not improving
- **Solution**: Wait for propagation (up to 5 minutes), restart editor

#### Continue
- **Issue**: Context not loaded
- **Solution**: Check `.continue/context.md` file and extension status

#### Aider
- **Issue**: Context not read
- **Solution**: Use `--read .ai-context.md` flag explicitly

## Testing and Validation

### Validation Commands

```bash
# Validate configuration syntax
contexthub validate

# Check setup integrity
contexthub --verify

# Test sync functionality
contexthub sync --dry-run

# Check tool compatibility
contexthub doctor  # Coming soon
```

### Manual Testing

1. **Create test project**
2. **Run ContextHub setup**
3. **Verify file creation**
4. **Test tool functionality**
5. **Validate sync behavior**

### Automated Testing

ContextHub includes test suites for:
- ✅ Setup process validation
- ✅ Symlink creation/deletion
- ✅ Configuration parsing
- ✅ Tool file generation
- ⚠️ Tool integration (limited)

## Contributing to Compatibility

### Adding New Tool Support

1. **Research** tool configuration format
2. **Implement** parser and generator
3. **Add** tool to compatibility matrix
4. **Write** tests and documentation
5. **Submit** pull request

### Reporting Issues

When reporting compatibility issues, include:
- Operating system and version
- Tool name and version
- ContextHub version
- Error messages
- Configuration file contents
- Reproduction steps

### Testing New Versions

Help test new tool integrations:
1. Join beta testing program
2. Test with your projects
3. Report bugs and feedback
4. Contribute improvements

---

For the most up-to-date compatibility information, check the [GitHub repository](https://github.com/seshanpillay25/contexthub) and [release notes](https://github.com/seshanpillay25/contexthub/releases).