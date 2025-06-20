#!/usr/bin/env node

/**
 * ContextHub Sync Script
 * Synchronizes changes between unified configuration and tool-specific files
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { program } = require('commander');
const { ConfigBuilder } = require('./build-configs.js');

const SYNC_FILES = {
  'CLAUDE.md': 'claude',
  '.cursorrules': 'cursor',
  '.github/copilot-instructions.md': 'copilot',
  '.codeium/instructions.md': 'codeium',
  '.continue/context.md': 'continue',
  '.aider.conf.yml': 'aider'
};

class ConfigSyncer {
  constructor(options = {}) {
    this.workingDir = options.workingDir || process.cwd();
    this.sourceFile = options.source || this.findSourceFile();
    this.direction = options.direction || 'auto'; // 'auto', 'source-to-tools', 'tools-to-source'
    this.force = options.force || false;
    this.dryRun = options.dryRun || false;
    this.verbose = options.verbose || false;

    this.checksumFile = path.join(this.workingDir, '.contexthub-checksums.json');
    this.lastChecksums = {};
    this.currentChecksums = {};

    this.log = this.verbose ? console.log : () => {};
  }

  /**
   * Find the source configuration file
   */
  findSourceFile = () => {
    const candidates = ['.ai-context.md', '.ai-context.yml', '.ai-context.yaml'];

    for (const candidate of candidates) {
      const filePath = path.join(this.workingDir, candidate);
      try {
        if (require('fs').existsSync(filePath)) {
          return filePath;
        }
      } catch (error) {
        // Continue to next candidate
      }
    }

    throw new Error('No source configuration file found. Expected .ai-context.md or .ai-context.yml');
  };

  /**
   * Calculate file checksum
   */
  calculateChecksum = async (filePath) => {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return crypto.createHash('sha256').update(content).digest('hex');
    } catch (error) {
      return null; // File doesn't exist or can't be read
    }
  };

  /**
   * Load last known checksums
   */
  loadLastChecksums = async () => {
    try {
      const content = await fs.readFile(this.checksumFile, 'utf8');
      this.lastChecksums = JSON.parse(content);
    } catch (error) {
      // No checksum file exists, this is the first run
      this.lastChecksums = {};
    }
  };

  /**
   * Save current checksums
   */
  saveCurrentChecksums = async () => {
    if (this.dryRun) {
      this.log('🔍 [DRY RUN] Would save checksums');
      return;
    }

    const checksumData = {
      timestamp: new Date().toISOString(),
      checksums: this.currentChecksums
    };

    await fs.writeFile(this.checksumFile, JSON.stringify(checksumData, null, 2));
  };

  /**
   * Calculate current checksums for all relevant files
   */
  calculateCurrentChecksums = async () => {
    // Source file checksum
    this.currentChecksums[this.sourceFile] = await this.calculateChecksum(this.sourceFile);

    // Tool-specific file checksums
    for (const toolFile of Object.keys(SYNC_FILES)) {
      const filePath = path.join(this.workingDir, toolFile);
      this.currentChecksums[toolFile] = await this.calculateChecksum(filePath);
    }
  };

  /**
   * Detect which files have changed since last sync
   */
  detectChanges = () => {
    const changes = {
      source: false,
      tools: [],
      newFiles: [],
      deletedFiles: []
    };

    // Check source file changes
    const sourceChecksum = this.currentChecksums[this.sourceFile];
    const lastSourceChecksum = this.lastChecksums[this.sourceFile];

    if (sourceChecksum !== lastSourceChecksum) {
      changes.source = true;
      this.log(`📝 Source file changed: ${this.sourceFile}`);
    }

    // Check tool file changes
    for (const toolFile of Object.keys(SYNC_FILES)) {
      const currentChecksum = this.currentChecksums[toolFile];
      const lastChecksum = this.lastChecksums[toolFile];

      if (!lastChecksum && currentChecksum) {
        changes.newFiles.push(toolFile);
        this.log(`➕ New file detected: ${toolFile}`);
      } else if (lastChecksum && !currentChecksum) {
        changes.deletedFiles.push(toolFile);
        this.log(`➖ File deleted: ${toolFile}`);
      } else if (currentChecksum !== lastChecksum && currentChecksum) {
        changes.tools.push(toolFile);
        this.log(`📝 Tool file changed: ${toolFile}`);
      }
    }

    return changes;
  };

  /**
   * Determine sync direction based on changes
   */
  determineSyncDirection = (changes) => {
    if (this.direction !== 'auto') {
      return this.direction;
    }

    const hasSourceChanges = changes.source;
    const hasToolChanges = changes.tools.length > 0;

    if (hasSourceChanges && hasToolChanges) {
      return 'conflict';
    } else if (hasSourceChanges) {
      return 'source-to-tools';
    } else if (hasToolChanges) {
      return 'tools-to-source';
    } else {
      return 'none';
    }
  };

  /**
   * Sync from source to tool-specific files
   */
  syncSourceToTools = async (_changedFiles = null) => {
    console.log('🔄 Syncing from source to tool-specific files...\n');

    const builder = new ConfigBuilder({
      source: this.sourceFile,
      output: this.workingDir,
      force: this.force,
      verbose: this.verbose
    });

    if (this.dryRun) {
      console.log('🔍 [DRY RUN] Would rebuild all tool-specific configurations');
      return true;
    }

    const success = await builder.build();

    if (success) {
      console.log('✅ Successfully synced source to tool-specific files');
    } else {
      console.log('❌ Failed to sync some tool-specific files');
    }

    return success;
  };

  /**
   * Sync from tool-specific files to source
   */
  syncToolsToSource = async (changedFiles) => {
    console.log('🔄 Syncing from tool-specific files to source...\n');

    if (this.dryRun) {
      console.log('🔍 [DRY RUN] Would update source configuration with tool changes');
      console.log(`   Changed files: ${changedFiles.join(', ')}`);
      return true;
    }

    // This is more complex and requires careful merging
    // For now, we'll provide guidance to the user
    console.log('⚠️  Manual intervention required:');
    console.log('   Tool-specific files have changed:');

    for (const file of changedFiles) {
      console.log(`   - ${file}`);
    }

    console.log('\n   Please review these changes and update your source configuration manually.');
    console.log('   Then run sync again to propagate changes to other tools.\n');

    // TODO: Implement automatic merging logic
    // This would involve:
    // 1. Reading the changed tool files
    // 2. Extracting the relevant sections
    // 3. Updating the source file with the changes
    // 4. Preserving the overall structure and other tool sections

    return false;
  };

  /**
   * Handle sync conflicts
   */
  handleConflicts = async (changes) => {
    console.log('⚠️  Sync conflict detected!\n');
    console.log('   Both source and tool-specific files have changed:');
    console.log(`   - Source: ${this.sourceFile}`);
    console.log(`   - Tools: ${changes.tools.join(', ')}\n`);

    console.log('   Conflict resolution options:');
    console.log('   1. Use --direction source-to-tools to overwrite tool files');
    console.log('   2. Use --direction tools-to-source to update source (requires manual review)');
    console.log('   3. Manually resolve conflicts and run sync again\n');

    if (this.force) {
      console.log('   --force specified: syncing source to tools');
      return await this.syncSourceToTools();
    }

    return false;
  };

  /**
   * Generate sync report
   */
  generateSyncReport = (changes, direction, success) => {
    const report = {
      timestamp: new Date().toISOString(),
      source_file: this.sourceFile,
      sync_direction: direction,
      success,
      changes,
      checksums: this.currentChecksums
    };

    return report;
  };

  /**
   * Verify sync integrity
   */
  verifySyncIntegrity = async () => {
    this.log('🔍 Verifying sync integrity...');

    const issues = [];

    // Check if source file exists
    if (!this.currentChecksums[this.sourceFile]) {
      issues.push(`Source file not found: ${this.sourceFile}`);
    }

    // Check for orphaned tool files (tool files that exist but shouldn't based on source)
    for (const toolFile of Object.keys(SYNC_FILES)) {
      const toolChecksum = this.currentChecksums[toolFile];

      if (toolChecksum) {
        // Tool file exists, check if it's a symlink or should be regenerated
        const filePath = path.join(this.workingDir, toolFile);

        try {
          const stats = await fs.lstat(filePath);
          if (stats.isSymbolicLink()) {
            const target = await fs.readlink(filePath);
            if (!target.includes('.ai-context')) {
              issues.push(`${toolFile} is a symlink but doesn't point to source file`);
            }
          }
        } catch (error) {
          issues.push(`Cannot check ${toolFile}: ${error.message}`);
        }
      }
    }

    if (issues.length > 0) {
      console.log('⚠️  Integrity issues found:');
      issues.forEach(issue => console.log(`   - ${issue}`));
      console.log('');
    } else {
      this.log('✅ Sync integrity verified');
    }

    return issues.length === 0;
  };

  /**
   * Run the sync process
   */
  sync = async () => {
    try {
      console.log('🔄 ContextHub Configuration Sync\n');

      // Load last known state
      await this.loadLastChecksums();

      // Calculate current state
      await this.calculateCurrentChecksums();

      // Detect changes
      const changes = this.detectChanges();

      // Determine sync direction
      const direction = this.determineSyncDirection(changes);

      this.log('📊 Sync analysis:');
      this.log(`   Direction: ${direction}`);
      this.log(`   Source changed: ${changes.source}`);
      this.log(`   Tools changed: ${changes.tools.length}`);
      this.log('');

      let success = false;

      // Execute sync based on direction
      switch (direction) {
        case 'none':
          console.log('✅ No changes detected. All configurations are in sync.\n');
          success = true;
          break;

        case 'source-to-tools':
          success = await this.syncSourceToTools();
          break;

        case 'tools-to-source':
          success = await this.syncToolsToSource(changes.tools);
          break;

        case 'conflict':
          success = await this.handleConflicts(changes);
          break;

        default:
          throw new Error(`Unknown sync direction: ${direction}`);
      }

      // Verify integrity
      if (success) {
        await this.verifySyncIntegrity();

        // Update checksums after successful sync
        await this.calculateCurrentChecksums();
        await this.saveCurrentChecksums();
      }

      // Generate report
      const report = this.generateSyncReport(changes, direction, success);

      if (this.verbose) {
        console.log('📋 Sync Report:');
        console.log(JSON.stringify(report, null, 2));
      }

      return success;
    } catch (error) {
      console.error(`❌ Sync failed: ${error.message}`);
      return false;
    }
  };

  /**
   * Show sync status without making changes
   */
  status = async () => {
    try {
      console.log('📊 ContextHub Sync Status\n');

      await this.loadLastChecksums();
      await this.calculateCurrentChecksums();

      const changes = this.detectChanges();
      const direction = this.determineSyncDirection(changes);

      console.log(`📄 Source: ${this.sourceFile}`);
      console.log(`📁 Working Directory: ${this.workingDir}`);
      console.log(`🔄 Sync Direction: ${direction}\n`);

      console.log('📋 File Status:');

      // Source file status
      const sourceExists = this.currentChecksums[this.sourceFile] !== null;
      const sourceChanged = changes.source;
      console.log(`   ${sourceExists ? '✅' : '❌'} ${this.sourceFile} ${sourceChanged ? '(changed)' : '(unchanged)'}`);

      // Tool file status
      for (const toolFile of Object.keys(SYNC_FILES)) {
        const exists = this.currentChecksums[toolFile] !== null;
        const changed = changes.tools.includes(toolFile);
        const isNew = changes.newFiles.includes(toolFile);
        const isDeleted = changes.deletedFiles.includes(toolFile);

        let status = '';
        if (isNew) status = '(new)';
        else if (isDeleted) status = '(deleted)';
        else if (changed) status = '(changed)';
        else status = '(unchanged)';

        console.log(`   ${exists ? '✅' : '❌'} ${toolFile} ${status}`);
      }

      console.log('');

      if (direction === 'none') {
        console.log('✅ All configurations are in sync.');
      } else if (direction === 'conflict') {
        console.log('⚠️  Sync conflict detected. Manual intervention required.');
      } else {
        console.log(`🔄 Sync needed: ${direction}`);
      }

      return true;
    } catch (error) {
      console.error(`❌ Status check failed: ${error.message}`);
      return false;
    }
  };
}

// CLI Configuration
program
  .name('contexthub-sync')
  .description('Synchronize ContextHub configuration changes')
  .version('1.0.0')
  .option('-w, --working-dir <dir>', 'Working directory', process.cwd())
  .option('-s, --source <file>', 'Source configuration file')
  .option('-d, --direction <direction>', 'Sync direction (auto, source-to-tools, tools-to-source)', 'auto')
  .option('-f, --force', 'Force sync even with conflicts')
  .option('--dry-run', 'Show what would be done without making changes')
  .option('-v, --verbose', 'Verbose output')
  .option('--status', 'Show sync status without making changes');

program.action(async (options) => {
  try {
    const syncer = new ConfigSyncer({
      workingDir: options.workingDir,
      source: options.source,
      direction: options.direction,
      force: options.force,
      dryRun: options.dryRun,
      verbose: options.verbose
    });

    let success;

    if (options.status) {
      success = await syncer.status();
    } else {
      success = await syncer.sync();
    }

    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  }
});

// Execute if run directly
if (require.main === module) {
  program.parse();
}

module.exports = { ConfigSyncer, SYNC_FILES };
