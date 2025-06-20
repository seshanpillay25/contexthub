# Getting Started with ContextHub

Welcome to ContextHub! This guide will help you set up and start using ContextHub to unify your AI coding assistant configurations.

## What is ContextHub?

ContextHub is a tool that maintains a single source of truth for AI coding assistant configurations. Instead of managing separate files for Claude Code, Cursor, GitHub Copilot, and other AI tools, you can maintain one unified configuration that automatically syncs to all your tools.

## Quick Start

### 1. Installation

Choose your preferred installation method:

#### Via npm (Recommended)
```bash
npm install -g contexthub
contexthub setup
```

#### Via curl (Unix/macOS)
```bash
curl -sSL https://raw.githubusercontent.com/seshanpillay25/contexthub/main/setup-ai-tools.sh | bash
```

#### Via PowerShell (Windows)
```bash
iwr -useb https://raw.githubusercontent.com/seshanpillay25/contexthub/main/setup-ai-tools.ps1 | iex
```

#### Via Python (Cross-platform)
```bash
curl -sSL https://raw.githubusercontent.com/seshanpillay25/contexthub/main/setup-ai-tools.py | python3
```

#### Manual Installation
```bash
git clone https://github.com/seshanpillay25/contexthub.git
cd contexthub
chmod +x setup-ai-tools.sh
./setup-ai-tools.sh
```

### 2. First Run

After installation, ContextHub will:

1. ✅ Create `.ai-context.md` with a basic template
2. ✅ Create tool-specific configuration files (symlinks or copies)
3. ✅ Set up backup directory for existing files
4. ✅ Add backup directory to `.gitignore`

You should see output like this:

```
🎉 ContextHub setup completed successfully!

Next steps:
1. Edit .ai-context.md to add your project context
2. All AI tools will automatically use the unified configuration
3. Check our examples at: https://github.com/seshanpillay25/contexthub/tree/main/examples
```

### 3. Configure Your Project

Edit the `.ai-context.md` file that was created:

```markdown
# My Project - AI Context Configuration

## Project Overview
A modern web application built with React and Node.js for managing tasks and productivity.

## Architecture
- Frontend: React 18 with TypeScript
- Backend: Node.js with Express
- Database: PostgreSQL with Prisma ORM
- Deployment: Docker containers on AWS

## Coding Standards
### TypeScript
- Use strict mode with proper type annotations
- Prefer interfaces over types for object shapes
- Use meaningful variable and function names

### React
- Use functional components with hooks
- Implement proper error boundaries
- Use React.memo for performance optimization

## Testing Strategy
- Unit tests: Jest + Testing Library
- E2E tests: Playwright
- Coverage target: 80%+

## Performance Requirements
- First Contentful Paint: < 1.5s
- Core Web Vitals: All green ratings

## Security Guidelines
- Sanitize all user inputs
- Use HTTPS everywhere
- Implement proper authentication

<!-- Tool-specific instructions -->

<!-- AI:CLAUDE -->
Focus on clean, readable code with comprehensive documentation.
Suggest performance optimizations and accessibility improvements.
<!-- /AI:CLAUDE -->

<!-- AI:CURSOR -->
Use autocomplete for common React patterns.
Focus on rapid prototyping and iteration.
<!-- /AI:CURSOR -->

<!-- AI:COPILOT -->
Generate comprehensive test cases.
Help with complex algorithms and data structures.
<!-- /AI:COPILOT -->
```

### 4. Choose Your Tools (Optional)

**Generate configs only for the AI tools you actually use:**

```bash
# List all available tools
contexthub build --list-tools

# Generate for specific tools only
contexthub build --tools claude,cursor
contexthub build --tools claude,copilot,codeium
contexthub build --tools cursor  # Just Cursor

# Available tools: claude, cursor, copilot, codeium, continue, aider
```

This prevents creating unnecessary folders and files for tools you don't use.

### 5. Verify Setup

Run the verification command to ensure everything is working:

```bash
contexthub --verify
```

You should see:
```
✅ .ai-context.md
✅ CLAUDE.md → .ai-context.md
✅ .cursorrules → .ai-context.md
✅ .github/copilot-instructions.md → .ai-context.md
✅ .codeium/instructions.md → .ai-context.md
✅ .continue/context.md → .ai-context.md
✅ .aider.conf.yml (exists)

All configurations verified successfully!
```

## Understanding the Setup

### File Structure

After setup, your project will have:

```
your-project/
├── .ai-context.md           # Master configuration (YOU EDIT THIS)
├── CLAUDE.md               # → .ai-context.md (symlink)
├── .cursorrules            # → .ai-context.md (symlink)
├── .github/
│   └── copilot-instructions.md  # → .ai-context.md (symlink)
├── .codeium/
│   └── instructions.md     # → .ai-context.md (symlink)
├── .continue/
│   └── context.md          # → .ai-context.md (symlink)
├── .aider.conf.yml         # Special YAML config for Aider
└── .ai-tools-backup/       # Backup of original files
```

### How It Works

1. **Single Source of Truth**: Edit only `.ai-context.md`
2. **Automatic Sync**: Tool-specific files automatically reflect changes
3. **Tool-Specific Sections**: Use HTML comments for tool-specific instructions
4. **Safe Backup**: Original files are backed up before replacement

### Symlinks vs. File Copying

ContextHub uses different strategies based on your system:

| Platform | Default Strategy | Fallback |
|----------|------------------|----------|
| Unix/macOS | Symlinks | File copying |
| Windows (Admin) | Symlinks | File copying |
| Windows (User) | File copying | None |

**Symlinks**: Real-time sync, no build step required
**File copying**: Compatible everywhere, requires manual sync

## Tool-Specific Instructions

### Using with Claude Code

Claude Code automatically reads `CLAUDE.md`. Your changes to `.ai-context.md` will immediately be available.

### Using with Cursor

Cursor reads `.cursorrules`. If you have tool-specific instructions, add them:

```markdown
<!-- AI:CURSOR -->
Use Tailwind CSS for styling.
Prefer function components over class components.
Use TypeScript strict mode.
<!-- /AI:CURSOR -->
```

### Using with GitHub Copilot

GitHub Copilot reads `.github/copilot-instructions.md`. Add Copilot-specific guidance:

```markdown
<!-- AI:COPILOT -->
Generate comprehensive JSDoc comments.
Suggest security best practices.
Focus on performance optimization.
<!-- /AI:COPILOT -->
```

### Using with Codeium

Codeium reads `.codeium/instructions.md`. Customize its behavior:

```markdown
<!-- AI:CODEIUM -->
Provide context-aware completions.
Focus on reducing boilerplate code.
Suggest modern ES6+ patterns.
<!-- /AI:CODEIUM -->
```

### Using with Continue

Continue reads `.continue/context.md`. Add Continue-specific instructions:

```markdown
<!-- AI:CONTINUE -->
Help with complex refactoring tasks.
Suggest architectural improvements.
Focus on code maintainability.
<!-- /AI:CONTINUE -->
```

### Using with Aider

Aider uses `.aider.conf.yml` which references your `.ai-context.md`:

```yaml
model: gpt-4
auto-commits: true
dirty-commits: true
read: .ai-context.md
```

## Advanced Configuration

### Multiple Environments

You can create environment-specific configurations:

```bash
# Development environment
cp .ai-context.md .ai-context.dev.md

# Production environment  
cp .ai-context.md .ai-context.prod.md

# Switch environments
contexthub build --source .ai-context.dev.md
```

### Custom Templates

Create your own templates in the `templates/` directory:

```bash
# Use a custom template
contexthub init --template my-custom-template
```

### YAML Configuration

For structured configuration, use YAML format:

```yaml
# .ai-context.yml
project:
  name: "My Project"
  description: "A modern web application"
  tech_stack:
    frontend: "React + TypeScript"
    backend: "Node.js + Express"
    database: "PostgreSQL"

coding_standards:
  typescript:
    - "Use strict mode"
    - "Prefer interfaces over types"
  react:
    - "Use functional components"
    - "Implement error boundaries"

tools:
  claude:
    instructions: "Focus on clean, readable code"
  cursor:
    rules: ["prefer-const", "no-any"]
```

## Best Practices

### 1. Start Simple

Begin with the basic template and gradually add more specific instructions:

```markdown
# Start with basics
## Project Overview
## Coding Standards
## Testing Strategy

# Add specifics later
## Performance Requirements
## Security Guidelines
## Tool-specific sections
```

### 2. Use Tool-Specific Sections

Different AI tools have different strengths. Leverage them:

```markdown
<!-- AI:CLAUDE -->
Focus on architecture and code quality.
Explain complex concepts clearly.
<!-- /AI:CLAUDE -->

<!-- AI:CURSOR -->
Provide fast autocomplete suggestions.
Focus on productivity features.
<!-- /AI:CURSOR -->

<!-- AI:COPILOT -->
Generate boilerplate and tests.
Suggest performance optimizations.
<!-- /AI:COPILOT -->
```

### 3. Keep It Updated

Regularly review and update your configuration:

- Add new coding standards as your project evolves
- Update architecture descriptions for new features
- Refine tool-specific instructions based on usage

### 4. Version Control

Commit your `.ai-context.md` to version control:

```bash
git add .ai-context.md
git commit -m "Add ContextHub configuration"

# Don't commit generated files if using symlinks
echo "CLAUDE.md" >> .gitignore
echo ".cursorrules" >> .gitignore
```

### 5. Team Consistency

Share your configuration with team members:

```bash
# Team member setup
git clone your-repo
cd your-repo
npm install -g contexthub
contexthub setup
```

## Troubleshooting

### Common Issues

#### Symlinks Not Working on Windows

**Problem**: Permission denied when creating symlinks

**Solution**: 
1. Run PowerShell as Administrator, or
2. Use file copying mode: `contexthub setup --no-symlinks`

#### File Already Exists

**Problem**: `CLAUDE.md already exists`

**Solution**: Use force mode to overwrite: `contexthub setup --force`

#### Configuration Not Updating

**Problem**: Changes to `.ai-context.md` not reflected in tools

**Solution**: 
1. Check if using file copying mode: `contexthub sync`
2. Verify symlinks: `ls -la CLAUDE.md`

#### Tool Not Reading Configuration

**Problem**: AI tool not using the configuration

**Solutions**:
1. Restart the AI tool/editor
2. Check tool-specific documentation
3. Verify file path: some tools look in specific directories

### Getting Help

If you encounter issues:

1. **Check Documentation**: [docs/troubleshooting.md](troubleshooting.md)
2. **Validate Configuration**: `contexthub validate`
3. **Check Status**: `contexthub sync --status`
4. **Open Issue**: [GitHub Issues](https://github.com/seshanpillay25/contexthub/issues)

## Next Steps

Now that you have ContextHub set up:

1. ✅ **Customize** your `.ai-context.md` file
2. ✅ **Test** with your AI tools to ensure they're reading the configuration
3. ✅ **Validate** your configuration: `contexthub validate`
4. ✅ **Explore** [examples](../examples/) for inspiration
5. ✅ **Share** with your team for consistent AI assistance

## Command Reference

| Command | Description |
|---------|-------------|
| `contexthub setup` | Initial setup with symlinks/copies |
| `contexthub --verify` | Verify existing setup |
| `contexthub validate` | Validate configuration syntax |
| `contexthub build` | Rebuild tool-specific files (all tools) |
| `contexthub build --tools claude,cursor` | Build for specific tools only |
| `contexthub build --list-tools` | List all available tools |
| `contexthub build --force` | Force rebuild (overwrite existing) |
| `contexthub sync` | Synchronize changes |
| `contexthub migrate` | Migrate existing tool configs |

### Tool Selection Commands

```bash
# Generate configs for specific tools only
contexthub build --tools claude                    # Just Claude
contexthub build --tools claude,cursor            # Claude + Cursor  
contexthub build --tools claude,copilot,codeium   # Multiple tools
contexthub build --tools cursor                   # Just Cursor

# List available tools
contexthub build --list-tools

# Available tools:
# claude, cursor, copilot, codeium, continue, aider
```

---

Ready to get started? Edit your `.ai-context.md` file and experience unified AI configuration! 🚀