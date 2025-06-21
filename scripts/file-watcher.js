#!/usr/bin/env node

/**
 * ContextHub File Watcher
 * Automatically syncs changes from .ai-context.md to all tool-specific config files
 */

const fs = require('fs');
const path = require('path');
const { program } = require('commander');

class ContextHubWatcher {
  constructor(options = {}) {
    this.workingDir = options.workingDir || process.cwd();
    this.verbose = options.verbose || false;
    this.masterFile = path.join(this.workingDir, '.ai-context.md');
    this.debounceDelay = options.debounceDelay || 500; // ms
    this.debounceTimer = null;

    // Tool configuration mappings
    this.toolConfigs = {
      'CLAUDE.md': 'Claude Code',
      '.cursorrules': 'Cursor IDE',
      '.github/copilot-instructions.md': 'GitHub Copilot',
      '.codeium/instructions.md': 'Codeium',
      '.continue/context.md': 'Continue'
    };

    // Colors for console output
    this.colors = {
      reset: '\x1b[0m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      purple: '\x1b[35m',
      cyan: '\x1b[36m'
    };

    this.watcher = null;
    this.syncStats = {
      totalSyncs: 0,
      successfulSyncs: 0,
      errors: []
    };
  }

  /**
   * Log with color
   */
  log(message, color = null) {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[${timestamp}]`;

    if (color && this.colors[color]) {
      console.log(`${this.colors[color]}${prefix} ${message}${this.colors.reset}`);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  /**
   * Log info message
   */
  logInfo(message) {
    this.log(`ℹ️  ${message}`, 'blue');
  }

  /**
   * Log success message
   */
  logSuccess(message) {
    this.log(`✅ ${message}`, 'green');
  }

  /**
   * Log warning message
   */
  logWarning(message) {
    this.log(`⚠️  ${message}`, 'yellow');
  }

  /**
   * Log error message
   */
  logError(message) {
    this.log(`❌ ${message}`, 'red');
  }

  /**
   * Check if a symlink target is valid
   */
  async isValidSymlink(linkPath) {
    try {
      const stats = await fs.promises.lstat(linkPath);
      if (!stats.isSymbolicLink()) {
        return false;
      }

      const target = await fs.promises.readlink(linkPath);
      const targetPath = path.resolve(path.dirname(linkPath), target);

      // Check if target exists and points to our master file
      return targetPath === path.resolve(this.masterFile);
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if we need to sync a specific config file
   */
  async needsSync(configPath) {
    try {
      const configExists = await fs.promises.access(configPath).then(() => true).catch(() => false);

      if (!configExists) {
        return false; // Config doesn't exist, skip
      }

      // If it's a valid symlink to our master file, no sync needed
      if (await this.isValidSymlink(configPath)) {
        if (this.verbose) {
          this.logInfo(`${path.basename(configPath)} is symlinked, skipping sync`);
        }
        return false;
      }

      // If it's a regular file, it needs sync
      return true;
    } catch (error) {
      if (this.verbose) {
        this.logWarning(`Error checking ${configPath}: ${error.message}`);
      }
      return false;
    }
  }

  /**
   * Sync master file content to a specific config file
   */
  async syncConfigFile(configPath, toolName) {
    try {
      // Read master file content
      const masterContent = await fs.promises.readFile(this.masterFile, 'utf8');

      // Process content for specific tools (filter tool-specific sections)
      const processedContent = this.processContentForTool(masterContent, configPath);

      // Write to config file
      await this.ensureDirectoryExists(path.dirname(configPath));
      await fs.promises.writeFile(configPath, processedContent, 'utf8');

      this.logSuccess(`Synced ${toolName} → ${path.basename(configPath)}`);
      this.syncStats.successfulSyncs++;

      return true;
    } catch (error) {
      this.logError(`Failed to sync ${toolName}: ${error.message}`);
      this.syncStats.errors.push({ tool: toolName, error: error.message });
      return false;
    }
  }

  /**
   * Process content for specific tools (handle tool-specific sections)
   */
  processContentForTool(content, configPath) {
    const toolName = this.getToolNameFromPath(configPath);

    if (!toolName) {
      return content;
    }

    // Extract tool-specific sections
    const toolSpecificRegex = new RegExp(`<!-- AI:${toolName.toUpperCase()} -->[\\s\\S]*?<!-- /AI:${toolName.toUpperCase()} -->`, 'g');
    const toolSpecificSections = content.match(toolSpecificRegex) || [];

    // Remove all tool-specific sections first
    let processedContent = content.replace(/<!-- AI:\w+ -->[\s\S]*?<!-- \/AI:\w+ -->/g, '');

    // Add back only the sections for this tool
    if (toolSpecificSections.length > 0) {
      processedContent += `\n\n${toolSpecificSections.join('\n\n')}`;
    }

    return `${processedContent.trim()}\n`;
  }

  /**
   * Get tool name from config path
   */
  getToolNameFromPath(configPath) {
    const basename = path.basename(configPath);
    const toolMapping = {
      'CLAUDE.md': 'claude',
      '.cursorrules': 'cursor',
      'copilot-instructions.md': 'copilot',
      'instructions.md': configPath.includes('.codeium') ? 'codeium' : null,
      'context.md': 'continue'
    };

    return toolMapping[basename] || null;
  }

  /**
   * Ensure directory exists
   */
  async ensureDirectoryExists(dirPath) {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  /**
   * Sync all configuration files
   */
  async syncAllConfigs() {
    this.logInfo('Starting sync process...');

    const syncPromises = [];

    for (const [configFile, toolName] of Object.entries(this.toolConfigs)) {
      const configPath = path.join(this.workingDir, configFile);

      if (await this.needsSync(configPath)) {
        syncPromises.push(this.syncConfigFile(configPath, toolName));
      }
    }

    // Handle Aider config separately (YAML format)
    const aiderConfigPath = path.join(this.workingDir, '.aider.conf.yml');
    if (await this.needsSync(aiderConfigPath)) {
      syncPromises.push(this.syncAiderConfig(aiderConfigPath));
    }

    if (syncPromises.length === 0) {
      this.logInfo('All configurations are up to date (using symlinks)');
      return;
    }

    const results = await Promise.allSettled(syncPromises);
    this.syncStats.totalSyncs++;

    // Log summary
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    if (failed === 0) {
      this.logSuccess(`Sync completed successfully (${successful} files updated)`);
    } else {
      this.logWarning(`Sync completed with ${failed} errors (${successful} successful)`);
    }
  }

  /**
   * Sync Aider configuration (special YAML format)
   */
  async syncAiderConfig(configPath) {
    try {
      const aiderTemplate = {
        model: 'gpt-4',
        'auto-commits': true,
        'dirty-commits': true,
        read: '.ai-context.md'
      };

      const yaml = require('js-yaml');
      const yamlContent = yaml.dump(aiderTemplate, {
        defaultStyle: null,
        lineWidth: -1
      });

      await fs.promises.writeFile(configPath, yamlContent, 'utf8');
      this.logSuccess('Synced Aider → .aider.conf.yml');
      this.syncStats.successfulSyncs++;

      return true;
    } catch (error) {
      this.logError(`Failed to sync Aider config: ${error.message}`);
      this.syncStats.errors.push({ tool: 'Aider', error: error.message });
      return false;
    }
  }

  /**
   * Handle file change events (with debouncing)
   */
  onFileChange(eventType, filename) {
    if (filename !== '.ai-context.md') {
      return;
    }

    // Clear existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Set new timer
    this.debounceTimer = setTimeout(async () => {
      this.logInfo(`Detected change in ${filename}, syncing configurations...`);
      await this.syncAllConfigs();
    }, this.debounceDelay);
  }

  /**
   * Start watching for file changes
   */
  async startWatching() {
    try {
      // Check if master file exists
      await fs.promises.access(this.masterFile);
    } catch (error) {
      this.logError(`Master file ${this.masterFile} not found. Please run 'contexthub' to set up first.`);
      process.exit(1);
    }

    this.logInfo(`🔍 Starting file watcher for ${this.masterFile}`);
    this.logInfo('Press Ctrl+C to stop watching');
    console.log('');

    // Perform initial sync
    await this.syncAllConfigs();
    console.log('');

    // Start watching
    this.watcher = fs.watch(this.workingDir, { persistent: true }, (eventType, filename) => {
      this.onFileChange(eventType, filename);
    });

    // Handle process termination
    process.on('SIGINT', () => {
      this.stopWatching();
    });

    process.on('SIGTERM', () => {
      this.stopWatching();
    });

    this.logInfo('File watcher is running... (watching for changes to .ai-context.md)');
  }

  /**
   * Stop watching for file changes
   */
  stopWatching() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    console.log('');
    this.logInfo('File watcher stopped');
    this.logInfo(`Session stats: ${this.syncStats.totalSyncs} syncs, ${this.syncStats.successfulSyncs} successful`);

    if (this.syncStats.errors.length > 0) {
      this.logWarning(`${this.syncStats.errors.length} errors occurred during session`);
    }

    process.exit(0);
  }

  /**
   * Run one-time sync without watching
   */
  async runOnceSync() {
    try {
      await fs.promises.access(this.masterFile);
    } catch (error) {
      this.logError(`Master file ${this.masterFile} not found. Please run 'contexthub' to set up first.`);
      process.exit(1);
    }

    this.logInfo('Running one-time configuration sync...');
    console.log('');

    await this.syncAllConfigs();

    console.log('');
    this.logSuccess('One-time sync completed');
  }
}

// CLI Configuration
program
  .name('contexthub-watch')
  .description('ContextHub File Watcher - Auto-sync AI tool configurations')
  .version('1.0.7')
  .option('-w, --working-dir <dir>', 'Working directory', process.cwd())
  .option('-v, --verbose', 'Verbose output')
  .option('--once', 'Run sync once and exit (no watching)')
  .option('--debounce <ms>', 'Debounce delay in milliseconds', '500');

program.action(async (options) => {
  try {
    const watcher = new ContextHubWatcher({
      workingDir: options.workingDir,
      verbose: options.verbose,
      debounceDelay: parseInt(options.debounce)
    });

    if (options.once) {
      await watcher.runOnceSync();
    } else {
      await watcher.startWatching();
    }
  } catch (error) {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  }
});

// Execute if run directly
if (require.main === module) {
  program.parse();
}

module.exports = ContextHubWatcher;
