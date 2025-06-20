# Incremental Tool Setup Guide

This guide shows you how to start with a few AI tools and add more over time without disrupting your existing setup.

## Overview

ContextHub is designed to grow with your needs. You can:
- Start with 1-2 AI tools
- Add new tools anytime
- Remove tools you don't use
- Switch between different tool combinations

## Getting Started

### Scenario 1: Starting with Cursor + Copilot

Maybe you're already using Cursor and GitHub Copilot and want to try ContextHub:

```bash
# 1. Install ContextHub
npm install -g contexthub

# 2. Initialize in your project
cd your-project
npm run setup

# 3. During setup, choose only the tools you want:
#    ✅ Cursor
#    ✅ GitHub Copilot  
#    ❌ Claude Code
#    ❌ Codeium
#    ❌ Continue
#    ❌ Aider
```

**Result:**
```
your-project/
├── .ai-context.md                    # 📝 Master configuration
├── .cursorrules                      # 🎯 Cursor config  
└── .github/copilot-instructions.md   # 🤖 Copilot config
```

### Scenario 2: Adding Claude Later

A month later, you hear great things about Claude Code and want to try it:

```bash
# Add Claude without touching existing configs
npm run build -- --tools claude
```

**Result:**
```
your-project/
├── .ai-context.md                    # 📝 Master configuration
├── .cursorrules                      # 🎯 Cursor config (unchanged)
├── .github/copilot-instructions.md   # 🤖 Copilot config (unchanged)
└── CLAUDE.md                         # 🆕 Claude config (new!)
```

### Scenario 3: Adding Multiple Tools

Your team wants to standardize on more AI tools:

```bash
# Add Aider and Continue for the team
npm run build -- --tools aider,continue
```

**Result:**
```
your-project/
├── .ai-context.md                    # 📝 Master configuration
├── .cursorrules                      # 🎯 Cursor config
├── .github/copilot-instructions.md   # 🤖 Copilot config  
├── CLAUDE.md                         # 🧠 Claude config
├── .aider.conf.yml                   # 🔧 Aider config (new!)
└── .continue/context.md              # ⚡ Continue config (new!)
```

## Available Commands

### List Available Tools
```bash
npm run build -- --list-tools
```

Output:
```
Available tools:
claude     → CLAUDE.md (Claude Code configuration)
cursor     → .cursorrules (Cursor IDE configuration)  
copilot    → .github/copilot-instructions.md (GitHub Copilot configuration)
codeium    → .codeium/instructions.md (Codeium configuration)
continue   → .continue/context.md (Continue configuration)
aider      → .aider.conf.yml (Aider configuration)
```

### Add Specific Tools
```bash
# Add single tool
npm run build -- --tools claude

# Add multiple tools (comma-separated)
npm run build -- --tools claude,aider,continue

# Add all remaining tools
npm run build -- --force
```

### Preview Changes (Dry Run)
```bash
# See what would be generated without actually creating files
npm run build -- --tools claude --dry-run
```

### Force Regenerate
```bash
# Overwrite existing files (useful for updates)
npm run build -- --tools claude --force
```

### Verbose Output
```bash
# See detailed information during generation
npm run build -- --tools claude --verbose
```

## Tool Selection Strategies

### 🚀 Minimal Setup
Perfect for trying ContextHub or small projects:
```bash
npm run build -- --tools claude,cursor
```
- **Claude**: For thoughtful code reviews and architecture
- **Cursor**: For fast autocomplete and editing

### 🏢 Team Setup  
Standardize your team on specific tools:
```bash
npm run build -- --tools claude,copilot,cursor
```
- **Claude**: Architecture and best practices
- **Copilot**: GitHub integration and suggestions
- **Cursor**: IDE integration and productivity

### 🛠️ Power User Setup
Use all available tools for maximum coverage:
```bash
npm run build -- --force
```
- **Claude**: Architecture and documentation
- **Cursor**: Fast editing and autocomplete  
- **Copilot**: GitHub suggestions
- **Codeium**: Alternative completions
- **Continue**: VS Code integration
- **Aider**: Command-line AI coding

### 🎯 Specialized Workflows
Choose tools for specific use cases:

**Documentation Heavy:**
```bash
npm run build -- --tools claude,copilot
```

**Fast Development:**
```bash  
npm run build -- --tools cursor,continue
```

**Command Line Focused:**
```bash
npm run build -- --tools claude,aider
```

## Managing Tool Configurations

### Removing Tools
To remove a tool, simply delete its configuration file:
```bash
# Remove Claude
rm CLAUDE.md

# Remove Cursor  
rm .cursorrules

# Remove Copilot
rm .github/copilot-instructions.md
```

The master `.ai-context.md` file remains unchanged.

### Updating Tools
To update an existing tool's configuration:
```bash
# Regenerate Claude config with latest changes
npm run build -- --tools claude --force
```

### Checking What's Installed
See which tools are currently configured:
```bash
ls -la | grep -E "(CLAUDE|cursorrules|copilot-instructions|aider.conf|continue)"
```

## Best Practices

### 1. Start Small
Begin with 1-2 tools you already use, then expand:
```bash
# Week 1: Start with your current tool
npm run build -- --tools cursor

# Week 2: Add Claude for code review  
npm run build -- --tools claude

# Month 1: Add team tools
npm run build -- --tools copilot
```

### 2. Team Coordination
Coordinate tool choices with your team:
```bash
# Document team standard in README
echo "Team AI Tools: Claude, Copilot, Cursor" >> README.md

# Use consistent setup across projects
npm run build -- --tools claude,copilot,cursor
```

### 3. Experiment Safely
Use dry run to experiment:
```bash
# Test what adding Aider would do
npm run build -- --tools aider --dry-run

# Actually add it if you like the preview
npm run build -- --tools aider
```

### 4. Regular Updates
Keep configurations fresh:
```bash
# Weekly: Update all tool configs with latest context
npm run build -- --force

# After major changes: Regenerate everything  
npm run build -- --force
```

## Troubleshooting

### Tool Not Working?
1. **Check if file exists:**
   ```bash
   ls -la CLAUDE.md  # Should exist for Claude
   ```

2. **Verify content:**
   ```bash
   head CLAUDE.md  # Should show your project context
   ```

3. **Regenerate if needed:**
   ```bash
   npm run build -- --tools claude --force
   ```

### Conflicts During Team Setup?
1. **Check backups:**
   ```bash
   ls .ai-tools-backup/  # ContextHub backs up existing files
   ```

2. **Restore if needed:**
   ```bash
   cp .ai-tools-backup/CLAUDE.md_2024-01-01T12-00-00 CLAUDE.md
   ```

3. **Merge conflicts manually:**
   Edit `.ai-context.md` to include both team and personal preferences.

## Advanced: Custom Tool Selection

You can create scripts for common tool combinations:

```bash
# package.json scripts
{
  "scripts": {
    "ai:minimal": "npm run build -- --tools claude,cursor",
    "ai:team": "npm run build -- --tools claude,copilot,cursor", 
    "ai:full": "npm run build -- --force",
    "ai:docs": "npm run build -- --tools claude,copilot"
  }
}
```

Usage:
```bash
npm run ai:minimal  # Quick setup
npm run ai:team     # Team standard
npm run ai:full     # Everything
npm run ai:docs     # Documentation focus
```

## Conclusion

ContextHub's incremental setup approach means you can:
- ✅ Start with familiar tools
- ✅ Add new tools without disruption  
- ✅ Experiment safely with dry runs
- ✅ Scale up or down as needed
- ✅ Coordinate with your team

The key is that your master `.ai-context.md` file remains the single source of truth, and you can generate tool-specific configurations on demand.

Happy coding with your AI assistants! 🤖✨