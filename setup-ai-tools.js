#!/usr/bin/env node

/**
 * ContextHub Setup Script for Node.js
 * Cross-platform JavaScript implementation of the setup process
 */

const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');

const MASTER_FILE = '.ai-context.md';
const BACKUP_DIR = '.ai-tools-backup';
const AIDER_CONFIG = '.aider.conf.yml';

const AI_CONFIGS = {
  'CLAUDE.md': 'Claude Code configuration',
  '.cursorrules': 'Cursor IDE configuration',
  '.github/copilot-instructions.md': 'GitHub Copilot configuration',
  '.codeium/instructions.md': 'Codeium configuration',
  '.continue/context.md': 'Continue configuration'
};

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  purple: '\x1b[35m',
  cyan: '\x1b[36m'
};

const banner = `
 ██████╗ ██████╗ ███╗   ██╗████████╗███████╗██╗  ██╗████████╗██╗  ██╗██╗   ██╗██████╗ 
██╔════╝██╔═══██╗████╗  ██║╚══██╔══╝██╔════╝╚██╗██╔╝╚══██╔══╝██║  ██║██║   ██║██╔══██╗
██║     ██║   ██║██╔██╗ ██║   ██║   █████╗   ╚███╔╝    ██║   ███████║██║   ██║██████╔╝
██║     ██║   ██║██║╚██╗██║   ██║   ██╔══╝   ██╔██╗    ██║   ██╔══██║██║   ██║██╔══██╗
╚██████╗╚██████╔╝██║ ╚████║   ██║   ███████╗██╔╝ ██╗   ██║   ██║  ██║╚██████╔╝██████╔╝
 ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ 
`;

class ContextHubSetup {
  constructor(options = {}) {
    this.workingDir = options.workingDir || process.cwd();
    this.masterFile = path.join(this.workingDir, MASTER_FILE);
    this.backupDir = path.join(this.workingDir, BACKUP_DIR);
    this.useSymlinks = options.useSymlinks !== false;
    this.force = options.force || false;
    this.verbose = options.verbose || false;
    
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    this.stats = {
      created: 0,
      backed_up: 0,
      errors: 0
    };
  }

  /**
   * Log message with color
   */
  log = (message, color = null) => {
    if (color && colors[color]) {
      console.log(`${colors[color]}${message}${colors.reset}`);
    } else {
      console.log(message);
    }
  }

  /**
   * Log info message
   */
  logInfo = (message) => {
    this.log(`[INFO] ${message}`, 'blue');
  }

  /**
   * Log success message
   */
  logSuccess = (message) => {
    this.log(`[SUCCESS] ${message}`, 'green');
  }

  /**
   * Log warning message
   */
  logWarning = (message) => {
    this.log(`[WARNING] ${message}`, 'yellow');
  }

  /**
   * Log error message
   */
  logError = (message) => {
    this.log(`[ERROR] ${message}`, 'red');
  }

  /**
   * Check if symlinks are supported on this platform
   */
  checkSymlinkSupport = async () => {
    try {
      const testDir = path.join(this.workingDir, '.symlink-test');
      const testFile = path.join(testDir, 'test.txt');
      const testLink = path.join(testDir, 'test-link.txt');
      
      await fs.mkdir(testDir, { recursive: true });
      await fs.writeFile(testFile, 'test');
      
      await fs.symlink(testFile, testLink);
      
      const stats = await fs.lstat(testLink);
      const canSymlink = stats.isSymbolicLink();
      
      // Cleanup
      await fs.unlink(testLink);
      await fs.unlink(testFile);
      await fs.rmdir(testDir);
      
      return canSymlink;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create master configuration file
   */
  createMasterConfig = async () => {
    try {
      await fs.access(this.masterFile);
      this.logInfo(`Master configuration file already exists: ${MASTER_FILE}`);
      return true;
    } catch (error) {
      // File doesn't exist, create it
    }

    this.logInfo(`Creating master configuration file: ${MASTER_FILE}`);

    const template = `# AI Context Configuration

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

<!-- AI:CODEIUM -->
<!-- Codeium-specific instructions here -->
<!-- /AI:CODEIUM -->
`;

    try {
      await fs.writeFile(this.masterFile, template, 'utf8');
      this.logSuccess(`Created ${MASTER_FILE} with basic template`);
      return true;
    } catch (error) {
      this.logError(`Failed to create master config: ${error.message}`);
      return false;
    }
  }

  /**
   * Create backup directory
   */
  createBackupDir = async () => {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      this.logInfo(`Created backup directory: ${BACKUP_DIR}`);

      // Add to .gitignore if it exists
      const gitignorePath = path.join(this.workingDir, '.gitignore');
      try {
        const gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
        if (!gitignoreContent.includes(BACKUP_DIR)) {
          await fs.appendFile(gitignorePath, `\n# AI tools backup\n${BACKUP_DIR}/\n`);
          this.logInfo(`Added ${BACKUP_DIR} to .gitignore`);
        }
      } catch (error) {
        // .gitignore doesn't exist or couldn't be read, continue
      }

      return true;
    } catch (error) {
      this.logError(`Failed to create backup directory: ${error.message}`);
      return false;
    }
  }

  /**
   * Backup existing file
   */
  backupExistingFile = async (filePath) => {
    try {
      await fs.access(filePath);
      
      const fileName = path.basename(filePath);
      const backupFile = path.join(this.backupDir, `${fileName}_${this.timestamp}`);
      
      await fs.copyFile(filePath, backupFile);
      this.logInfo(`Backed up existing ${path.relative(this.workingDir, filePath)} to ${path.relative(this.workingDir, backupFile)}`);
      this.stats.backed_up++;
      
      // Remove original file
      await fs.unlink(filePath);
      
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, no need to backup
        return true;
      }
      this.logError(`Failed to backup ${filePath}: ${error.message}`);
      return false;
    }
  }

  /**
   * Ensure directory exists
   */
  ensureDirectory = async (filePath) => {
    const dir = path.dirname(filePath);
    if (dir !== this.workingDir) {
      try {
        await fs.mkdir(dir, { recursive: true });
        this.logInfo(`Created directory: ${path.relative(this.workingDir, dir)}`);
      } catch (error) {
        this.logError(`Failed to create directory ${dir}: ${error.message}`);
        return false;
      }
    }
    return true;
  }

  /**
   * Create symlink
   */
  createSymlink = async (target, linkPath, description) => {
    try {
      const relativePath = path.relative(this.workingDir, linkPath);
      
      // Ensure directory exists
      if (!(await this.ensureDirectory(linkPath))) {
        return false;
      }

      // Backup existing file
      if (!(await this.backupExistingFile(linkPath))) {
        return false;
      }

      // Create symlink
      const relativeTarget = path.relative(path.dirname(linkPath), target);
      await fs.symlink(relativeTarget, linkPath);
      
      this.logSuccess(`Created symlink: ${relativePath} → ${MASTER_FILE} (${description})`);
      this.stats.created++;
      return true;
    } catch (error) {
      this.logError(`Failed to create symlink ${linkPath}: ${error.message}`);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Create file copy
   */
  createFileCopy = async (source, destPath, description) => {
    try {
      const relativePath = path.relative(this.workingDir, destPath);
      
      // Ensure directory exists
      if (!(await this.ensureDirectory(destPath))) {
        return false;
      }

      // Backup existing file
      if (!(await this.backupExistingFile(destPath))) {
        return false;
      }

      // Copy file
      await fs.copyFile(source, destPath);
      
      this.logSuccess(`Created copy: ${relativePath} ← ${MASTER_FILE} (${description})`);
      this.stats.created++;
      return true;
    } catch (error) {
      this.logError(`Failed to create copy ${destPath}: ${error.message}`);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Create Aider configuration
   */
  createAiderConfig = async () => {
    const aiderPath = path.join(this.workingDir, AIDER_CONFIG);
    
    try {
      await fs.access(aiderPath);
      this.logInfo(`Aider configuration already exists: ${AIDER_CONFIG}`);
      return true;
    } catch (error) {
      // File doesn't exist, create it
    }

    this.logInfo(`Creating Aider configuration: ${AIDER_CONFIG}`);

    const aiderContent = `# Aider configuration
# This file is managed by ContextHub
# Edit .ai-context.md instead

# Model settings
model: gpt-4

# Auto-commit settings
auto-commits: true
dirty-commits: true

# Context settings
read: ${MASTER_FILE}
`;

    try {
      await fs.writeFile(aiderPath, aiderContent, 'utf8');
      this.logSuccess(`Created ${AIDER_CONFIG}`);
      return true;
    } catch (error) {
      this.logError(`Failed to create Aider config: ${error.message}`);
      return false;
    }
  }

  /**
   * Verify setup
   */
  verifySetup = async () => {
    this.logInfo('Verifying setup...');
    let failed = 0;

    // Check master file
    try {
      await fs.access(this.masterFile);
      this.logSuccess(`✓ ${MASTER_FILE}`);
    } catch (error) {
      this.logError(`✗ ${MASTER_FILE} (missing)`);
      failed++;
    }

    // Check each configuration
    for (const [configFile, description] of Object.entries(AI_CONFIGS)) {
      const configPath = path.join(this.workingDir, configFile);
      
      try {
        const stats = await fs.lstat(configPath);
        
        if (stats.isSymbolicLink()) {
          const target = await fs.readlink(configPath);
          this.logSuccess(`✓ ${configFile} → ${target}`);
        } else {
          this.logSuccess(`✓ ${configFile} (copy)`);
        }
      } catch (error) {
        this.logError(`✗ ${configFile} (missing)`);
        failed++;
      }
    }

    // Check Aider config
    try {
      await fs.access(path.join(this.workingDir, AIDER_CONFIG));
      this.logSuccess(`✓ ${AIDER_CONFIG} (exists)`);
    } catch (error) {
      this.logWarning(`✗ ${AIDER_CONFIG} (missing)`);
    }

    if (failed === 0) {
      this.logSuccess('All configurations verified successfully!');
      return true;
    } else {
      this.logError('Some configurations failed verification');
      return false;
    }
  }

  /**
   * Print banner
   */
  printBanner = () => {
    console.log(colors.cyan + banner + colors.reset);
    console.log(colors.cyan + 'Unified Configuration for AI Coding Assistants' + colors.reset);
    console.log(colors.purple + 'Setting up symlinks for Claude Code, Cursor, GitHub Copilot, and more...' + colors.reset);
    console.log('');
  }

  /**
   * Run the setup process
   */
  setup = async () => {
    try {
      this.printBanner();
      
      this.logInfo('Starting ContextHub setup...');
      console.log('');

      // Check symlink support
      if (this.useSymlinks) {
        const canSymlink = await this.checkSymlinkSupport();
        if (!canSymlink) {
          this.logWarning('Symlinks not supported on this platform. Using file copying instead.');
          this.useSymlinks = false;
        } else {
          this.logInfo('Using symlinks');
        }
      } else {
        this.logInfo('Using file copying (compatibility mode)');
      }

      // Create master config
      if (!(await this.createMasterConfig())) {
        return false;
      }

      // Create backup directory
      if (!(await this.createBackupDir())) {
        return false;
      }

      // Create configurations for each AI tool
      this.logInfo('Creating configurations for AI tools...');
      
      for (const [configFile, description] of Object.entries(AI_CONFIGS)) {
        const configPath = path.join(this.workingDir, configFile);
        
        if (this.useSymlinks) {
          await this.createSymlink(this.masterFile, configPath, description);
        } else {
          await this.createFileCopy(this.masterFile, configPath, description);
        }
      }

      // Create Aider config
      await this.createAiderConfig();

      // Print summary
      console.log('');
      this.logInfo('Setup Summary:');
      this.logInfo(`- Master file: ${MASTER_FILE}`);
      this.logInfo(`- Successful configurations: ${this.stats.created}/${Object.keys(AI_CONFIGS).length}`);
      this.logInfo(`- Files backed up: ${this.stats.backed_up}`);
      this.logInfo(`- Backup directory: ${BACKUP_DIR}`);
      this.logInfo(`- Method: ${this.useSymlinks ? 'Symlinks' : 'File copying'}`);

      // Verify setup
      console.log('');
      const verifyResult = await this.verifySetup();

      console.log('');
      if (this.stats.created === Object.keys(AI_CONFIGS).length && verifyResult) {
        this.logSuccess('🎉 ContextHub setup completed successfully!');
        console.log('');
        console.log(colors.cyan + 'Next steps:' + colors.reset);
        console.log(`1. Edit ${colors.yellow}${MASTER_FILE}${colors.reset} to add your project context`);
        console.log('2. All AI tools will automatically use the unified configuration');
        console.log(`3. Check our examples at: ${colors.blue}https://github.com/seshanpillay25/contexthub/tree/main/examples${colors.reset}`);
        console.log('');
        console.log(colors.green + 'Happy coding with your AI assistants! 🤖' + colors.reset);
        return true;
      } else {
        this.logWarning('Setup completed with some issues. Please check the logs above.');
        console.log('');
        console.log(colors.yellow + 'If you need help:' + colors.reset);
        console.log(`- Check our troubleshooting guide: ${colors.blue}https://github.com/seshanpillay25/contexthub/blob/main/docs/troubleshooting.md${colors.reset}`);
        console.log(`- Open an issue: ${colors.blue}https://github.com/seshanpillay25/contexthub/issues${colors.reset}`);
        return false;
      }

    } catch (error) {
      this.logError(`Setup failed: ${error.message}`);
      return false;
    }
  }
}

// CLI Configuration
program
  .name('contexthub')
  .description('ContextHub Setup - Unified configuration for AI coding assistants')
  .version('1.0.0')
  .option('-w, --working-dir <dir>', 'Working directory', process.cwd())
  .option('--no-symlinks', 'Use file copying instead of symlinks')
  .option('-f, --force', 'Force setup even if files exist')
  .option('-v, --verbose', 'Verbose output')
  .option('--verify', 'Verify existing setup')
  .option('--version', 'Show version information');

program.action(async (options) => {
  try {
    if (options.verify) {
      const setup = new ContextHubSetup({
        workingDir: options.workingDir,
        verbose: options.verbose
      });
      
      console.log('🔍 Verifying ContextHub setup...\n');
      const result = await setup.verifySetup();
      process.exit(result ? 0 : 1);
      return;
    }

    const setup = new ContextHubSetup({
      workingDir: options.workingDir,
      useSymlinks: options.symlinks,
      force: options.force,
      verbose: options.verbose
    });

    const success = await setup.setup();
    process.exit(success ? 0 : 1);

  } catch (error) {
    console.error(`${colors.red}❌ ${error.message}${colors.reset}`);
    process.exit(1);
  }
});

// Execute if run directly
if (require.main === module) {
  program.parse();
}

module.exports = { ContextHubSetup, AI_CONFIGS };