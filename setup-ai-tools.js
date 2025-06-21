#!/usr/bin/env node

/**
 * ContextHub Setup Script for Node.js
 * Cross-platform JavaScript implementation of the setup process
 */

const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');
const inquirer = require('inquirer');
const AIToolDetector = require('./scripts/ai-tool-detector');

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
    this.interactive = options.interactive !== false;
    this.selectedTools = options.tools || [];
    this.detectedTools = [];
    this.setupMode = options.setupMode || null; // 'smart', 'manual', or null (auto-detect)
    this.configuredTools = []; // Track which tools were actually configured
    
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
    const testDir = path.join(this.workingDir, '.symlink-test');
    const testFile = path.join(testDir, 'test.txt');
    const testLink = path.join(testDir, 'test-link.txt');
    
    try {
      await fs.mkdir(testDir, { recursive: true });
      await fs.writeFile(testFile, 'test');
      
      await fs.symlink(testFile, testLink);
      
      const stats = await fs.lstat(testLink);
      const canSymlink = stats.isSymbolicLink();
      
      return canSymlink;
    } catch (error) {
      return false;
    } finally {
      // Always cleanup, regardless of success or failure
      try {
        await fs.unlink(testLink).catch(() => {});
        await fs.unlink(testFile).catch(() => {});
        await fs.rmdir(testDir).catch(() => {});
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
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

    // If no configured tools tracked (e.g., standalone verify), check all existing files
    const toolConfigMapping = {
      'claude': 'CLAUDE.md',
      'cursor': '.cursorrules',
      'copilot': '.github/copilot-instructions.md',
      'codeium': '.codeium/instructions.md',
      'continue': '.continue/context.md'
    };

    let toolsToCheck = this.configuredTools;
    
    // If configuredTools is empty (standalone verify), detect existing configs
    if (toolsToCheck.length === 0) {
      for (const [tool, configFile] of Object.entries(toolConfigMapping)) {
        try {
          await fs.access(path.join(this.workingDir, configFile));
          toolsToCheck.push(tool);
        } catch (error) {
          // File doesn't exist, skip
        }
      }
      
      // Check for Aider config
      try {
        await fs.access(path.join(this.workingDir, AIDER_CONFIG));
        toolsToCheck.push('aider');
      } catch (error) {
        // File doesn't exist, skip
      }
    }

    for (const tool of toolsToCheck) {
      if (tool === 'aider') {
        // Check Aider config separately
        try {
          await fs.access(path.join(this.workingDir, AIDER_CONFIG));
          this.logSuccess(`✓ ${AIDER_CONFIG} (exists)`);
        } catch (error) {
          this.logError(`✗ ${AIDER_CONFIG} (missing)`);
          failed++;
        }
      } else if (toolConfigMapping[tool]) {
        const configFile = toolConfigMapping[tool];
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
   * Run AI tool detection
   */
  runAIToolDetection = async () => {
    const detector = new AIToolDetector({ 
      workingDir: this.workingDir, 
      verbose: this.verbose 
    });
    
    try {
      const results = await detector.detectAllTools();
      this.detectedTools = results.recommendations;
      
      // Print results once
      detector.printResults(results);
      
      return results;
    } catch (error) {
      this.logWarning(`AI tool detection failed: ${error.message}`);
      return { recommendations: { highConfidence: [], suggested: [], optional: [] } };
    }
  }

  /**
   * Setup mode selection
   */
  selectSetupMode = async (detectionResults) => {
    // If setup mode is forced via CLI, use that
    if (this.setupMode) {
      return this.setupMode;
    }

    if (!this.interactive) {
      return 'smart'; // Default to smart mode for non-interactive
    }

    const hasDetections = detectionResults.recommendations.highConfidence.length > 0 || 
                         detectionResults.recommendations.suggested.length > 0;

    if (!hasDetections) {
      // No detections found, go straight to manual mode
      this.logInfo('No AI tools detected. Using manual selection mode.');
      return 'manual';
    }

    console.log('\n🎛️  Choose your setup approach:');

    const modeChoices = [
      {
        name: '🧠 Smart Setup (Recommended) - Use detected tools with customization',
        value: 'smart',
        short: 'Smart'
      },
      {
        name: '👤 Manual Setup - Choose tools without detection influence',
        value: 'manual', 
        short: 'Manual'
      },
      {
        name: '🔍 Detection Only - See detections, then decide later',
        value: 'detect-only',
        short: 'Detect Only'
      }
    ];

    const modeAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'mode',
        message: 'How would you like to set up ContextHub?',
        choices: modeChoices,
        default: 'smart'
      }
    ]);

    return modeAnswer.mode;
  }

  /**
   * Manual tool selection (no detection influence)
   */
  manualToolSelection = async () => {
    const allTools = [
      { key: 'claude', name: 'Claude Code', description: 'Anthropic\'s AI assistant' },
      { key: 'cursor', name: 'Cursor', description: 'AI-powered code editor' },
      { key: 'copilot', name: 'GitHub Copilot', description: 'GitHub\'s AI pair programmer' },
      { key: 'codeium', name: 'Codeium', description: 'Free AI code completion' },
      { key: 'continue', name: 'Continue', description: 'Open-source AI code assistant' },
      { key: 'aider', name: 'Aider', description: 'AI pair programming in terminal' }
    ];

    const choices = allTools.map(tool => ({
      name: `${tool.name} - ${tool.description}`,
      value: tool.key,
      checked: false
    }));

    console.log('\n📋 Select AI tools to configure:');

    const answers = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedTools',
        message: 'Which AI tools would you like to set up?',
        choices: choices,
        validate: function(answer) {
          if (answer.length < 1) {
            return 'You must choose at least one AI tool.';
          }
          return true;
        }
      }
    ]);

    // Ask for confirmation with summary
    console.log('\n📊 Setup Summary:');
    answers.selectedTools.forEach(tool => {
      const toolInfo = allTools.find(t => t.key === tool);
      console.log(`   ✅ ${toolInfo.name}`);
    });

    const confirmAnswer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: 'Proceed with this configuration?',
        default: true
      }
    ]);

    if (!confirmAnswer.proceed) {
      console.log('\nSetup cancelled. Run contexthub again to restart.');
      process.exit(0);
    }

    return answers.selectedTools;
  }

  /**
   * Smart tool selection (with detection influence)
   */
  smartToolSelection = async (detectionResults) => {
    const choices = [];
    const { highConfidence, suggested, optional } = detectionResults.recommendations;

    // Add detected tools with confidence indicators
    highConfidence.forEach(tool => {
      choices.push({
        name: `${tool.name} (✅ detected with ${Math.round(tool.confidence)}% confidence)`,
        value: tool.tool,
        checked: true
      });
    });

    suggested.forEach(tool => {
      choices.push({
        name: `${tool.name} (🔍 suggested, ${Math.round(tool.confidence)}% confidence)`,
        value: tool.tool,
        checked: true
      });
    });

    optional.forEach(tool => {
      choices.push({
        name: `${tool.name} (💡 some evidence, ${Math.round(tool.confidence)}% confidence)`,
        value: tool.tool,
        checked: false
      });
    });

    // Add remaining tools that weren't detected
    const allDetectedTools = [...highConfidence, ...suggested, ...optional].map(t => t.tool);
    const allAvailableTools = [
      { key: 'claude', name: 'Claude Code' },
      { key: 'cursor', name: 'Cursor' },
      { key: 'copilot', name: 'GitHub Copilot' },
      { key: 'codeium', name: 'Codeium' },
      { key: 'continue', name: 'Continue' },
      { key: 'aider', name: 'Aider' }
    ];

    allAvailableTools.forEach(tool => {
      if (!allDetectedTools.includes(tool.key)) {
        choices.push({
          name: `${tool.name} (not detected)`,
          value: tool.key,
          checked: false
        });
      }
    });

    console.log('\n📋 Customize your tool selection:');
    console.log('   ✅ = High confidence  🔍 = Suggested  💡 = Optional');

    const answers = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedTools',
        message: 'Customize your tool selection:',
        choices: choices,
        validate: function(answer) {
          if (answer.length < 1) {
            return 'You must choose at least one AI tool.';
          }
          return true;
        }
      }
    ]);

    // Show what was auto-selected vs manually chosen
    const autoSelected = [...highConfidence, ...suggested].map(t => t.tool);
    const manuallyAdded = answers.selectedTools.filter(t => !autoSelected.includes(t));
    const manuallyRemoved = autoSelected.filter(t => !answers.selectedTools.includes(t));

    if (manuallyAdded.length > 0 || manuallyRemoved.length > 0) {
      console.log('\n📝 Changes from smart recommendations:');
      if (manuallyAdded.length > 0) {
        console.log(`   ➕ Added: ${manuallyAdded.join(', ')}`);
      }
      if (manuallyRemoved.length > 0) {
        console.log(`   ➖ Removed: ${manuallyRemoved.join(', ')}`);
      }
    }

    return answers.selectedTools;
  }

  /**
   * Enhanced interactive tool selection
   */
  interactiveToolSelection = async (detectionResults) => {
    if (!this.interactive) {
      return this.selectedTools.length > 0 ? this.selectedTools : ['claude', 'cursor', 'copilot'];
    }

    // Step 1: Choose setup mode
    const setupMode = await this.selectSetupMode(detectionResults);

    if (setupMode === 'detect-only') {
      console.log('\n🔍 Detection complete! Run contexthub again to proceed with setup.');
      process.exit(0);
    }

    // Step 2: Tool selection based on mode
    let selectedTools;
    if (setupMode === 'manual') {
      selectedTools = await this.manualToolSelection();
    } else {
      selectedTools = await this.smartToolSelection(detectionResults);
    }

    return selectedTools;
  }

  /**
   * Generate smart configuration template based on project type and selected tools
   */
  generateSmartTemplate = async (projectType, selectedTools) => {
    let template = `# AI Context Configuration

## Project Overview
<!-- Add your project description here -->

## Architecture
<!-- Describe your project architecture -->

## Coding Standards
<!-- Define your coding standards and conventions -->

`;

    // Add project-specific sections based on detected project type
    if (projectType.includes('React')) {
      template += `### React Development
- Use functional components with hooks
- Implement proper error boundaries
- Use React.memo for performance optimization
- Follow React Hook rules strictly
- Use TypeScript for type safety

`;
    }

    if (projectType.includes('Node.js')) {
      template += `### Node.js Development
- Use async/await over callbacks
- Implement proper error handling
- Use environment variables for configuration
- Follow Express.js best practices if applicable

`;
    }

    if (projectType.includes('Python')) {
      template += `### Python Development
- Follow PEP 8 style guidelines
- Use type hints for better code clarity
- Write comprehensive docstrings
- Use virtual environments
- Implement proper exception handling

`;
    }

    if (projectType.includes('TypeScript')) {
      template += `### TypeScript
- Use strict mode
- Prefer interfaces over types for object shapes
- Use proper return types for all functions
- Avoid 'any' type unless absolutely necessary

`;
    }

    template += `## Testing Strategy
<!-- Describe your testing approach -->

## Performance Requirements
<!-- List performance requirements -->

## Security Guidelines
<!-- Security best practices for this project -->

<!-- Tool-specific sections -->

`;

    // Add tool-specific sections for selected tools
    if (selectedTools.includes('claude')) {
      template += `<!-- AI:CLAUDE -->
Focus on code quality, security, and performance optimization.
Provide detailed explanations for complex algorithms.
<!-- /AI:CLAUDE -->

`;
    }

    if (selectedTools.includes('cursor')) {
      template += `<!-- AI:CURSOR -->
Prefer concise, efficient code solutions.
Use modern JavaScript/TypeScript features.
<!-- /AI:CURSOR -->

`;
    }

    if (selectedTools.includes('copilot')) {
      template += `<!-- AI:COPILOT -->
GitHub Copilot-specific instructions here.
Focus on GitHub best practices and collaborative development.
<!-- /AI:COPILOT -->

`;
    }

    if (selectedTools.includes('codeium')) {
      template += `<!-- AI:CODEIUM -->
Codeium-specific instructions here.
Emphasize clean, readable code structure.
<!-- /AI:CODEIUM -->

`;
    }

    return template;
  }

  /**
   * Create master configuration file with smart template
   */
  createMasterConfigWithTemplate = async (template) => {
    try {
      await fs.access(this.masterFile);
      if (!this.force) {
        this.logInfo(`Master configuration file already exists: ${MASTER_FILE}`);
        return true;
      } else {
        this.logInfo(`Force mode: overwriting existing ${MASTER_FILE}`);
      }
    } catch (error) {
      // File doesn't exist, create it
    }

    this.logInfo(`Creating smart configuration file: ${MASTER_FILE}`);

    try {
      await fs.writeFile(this.masterFile, template, 'utf8');
      this.logSuccess(`Created ${MASTER_FILE} with intelligent template`);
      return true;
    } catch (error) {
      this.logError(`Failed to create ${MASTER_FILE}: ${error.message}`);
      return false;
    }
  }

  /**
   * Run the setup process
   */
  setup = async () => {
    try {
      this.printBanner();
      
      this.logInfo('Starting ContextHub intelligent setup...');
      console.log('');

      // Run AI tool detection
      const detectionResults = await this.runAIToolDetection();
      
      // Interactive tool selection (if enabled)
      const selectedTools = await this.interactiveToolSelection(detectionResults);
      console.log('');
      this.logInfo(`Selected tools: ${selectedTools.join(', ')}`);
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

      // Create backup directory
      if (!(await this.createBackupDir())) {
        return false;
      }

      // Generate smart configuration template
      const smartTemplate = await this.generateSmartTemplate(detectionResults.projectType || [], selectedTools);
      
      // Create master config with smart template
      if (!(await this.createMasterConfigWithTemplate(smartTemplate))) {
        return false;
      }

      // Create configurations for selected AI tools only
      this.logInfo('Creating configurations for selected AI tools...');
      console.log('');
      
      const toolConfigMapping = {
        'claude': ['CLAUDE.md', 'Claude Code configuration'],
        'cursor': ['.cursorrules', 'Cursor IDE configuration'],
        'copilot': ['.github/copilot-instructions.md', 'GitHub Copilot configuration'],
        'codeium': ['.codeium/instructions.md', 'Codeium configuration'],
        'continue': ['.continue/context.md', 'Continue configuration']
      };

      for (const tool of selectedTools) {
        if (toolConfigMapping[tool]) {
          const [configFile, description] = toolConfigMapping[tool];
          const configPath = path.join(this.workingDir, configFile);
          
          if (this.useSymlinks) {
            await this.createSymlink(this.masterFile, configPath, description);
          } else {
            await this.createFileCopy(this.masterFile, configPath, description);
          }
          
          // Track configured tools
          this.configuredTools.push(tool);
        }
      }

      // Create Aider config if selected
      if (selectedTools.includes('aider')) {
        await this.createAiderConfig();
        this.configuredTools.push('aider');
      }

      // Print summary
      console.log('');
      this.logInfo('Setup Summary:');
      this.logInfo(`- Master file: ${MASTER_FILE}`);
      this.logInfo(`- Successful configurations: ${this.stats.created}/${selectedTools.length}`);
      this.logInfo(`- Files backed up: ${this.stats.backed_up}`);
      this.logInfo(`- Backup directory: ${BACKUP_DIR}`);
      this.logInfo(`- Method: ${this.useSymlinks ? 'Symlinks' : 'File copying'}`);

      // Verify setup
      console.log('');
      const verifyResult = await this.verifySetup();

      console.log('');
      if (this.stats.created === selectedTools.length && verifyResult) {
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
  .description('ContextHub Setup - Unified configuration for AI coding assistants\n\n' +
               '🚀 Smart Detection: Automatically detects installed AI tools\n' +
               '🎯 Interactive Setup: Choose between smart and manual modes\n' +
               '⚡ Real-time Sync: Live file watching with auto-sync\n' +
               '🔍 Validation: Built-in linting and best practices\n\n' +
               'Run "contexthub --examples" for usage examples')
  .version('1.0.7')
  .option('-w, --working-dir <dir>', 'Working directory', process.cwd())
  .option('--no-symlinks', 'Use file copying instead of symlinks')
  .option('-f, --force', 'Force setup even if files exist')
  .option('-v, --verbose', 'Verbose output')
  .option('--verify', 'Verify existing setup')
  .option('--no-interactive', 'Skip interactive tool selection')
  .option('-t, --tools <tools>', 'Comma-separated list of tools to configure (claude,cursor,copilot,codeium,continue,aider)')
  .option('--detect-only', 'Only run AI tool detection without setup')
  .option('--manual', 'Force manual tool selection (no detection influence)')
  .option('--smart', 'Force smart setup mode (with detection)')
  .option('--list-tools', 'List all available AI tools')
  .option('--examples', 'Show usage examples')
  .option('--version', 'Show version information');

/**
 * Show list of available tools
 */
function showAvailableTools() {
  console.log('\n🛠️  Available AI Tools:\n');
  
  const tools = [
    { key: 'claude', name: 'Claude Code', description: 'Anthropic\'s AI assistant' },
    { key: 'cursor', name: 'Cursor', description: 'AI-powered code editor' },
    { key: 'copilot', name: 'GitHub Copilot', description: 'GitHub\'s AI pair programmer' },
    { key: 'codeium', name: 'Codeium', description: 'Free AI code completion' },
    { key: 'continue', name: 'Continue', description: 'Open-source AI code assistant' },
    { key: 'aider', name: 'Aider', description: 'AI pair programming in terminal' }
  ];

  tools.forEach(tool => {
    console.log(`   ${colors.cyan}${tool.key.padEnd(10)}${colors.reset} ${tool.name} - ${tool.description}`);
  });

  console.log('\n💡 Usage: contexthub --tools claude,cursor,copilot\n');
}

/**
 * Show usage examples
 */
function showExamples() {
  console.log('\n📚 ContextHub Usage Examples:\n');
  
  const examples = [
    {
      title: 'Basic Setup',
      commands: [
        'contexthub                    # Interactive setup with smart detection',
        'contexthub --manual           # Manual tool selection',
        'contexthub --smart            # Force smart detection mode'
      ]
    },
    {
      title: 'Non-Interactive Setup',
      commands: [
        'contexthub --no-interactive --tools claude,cursor',
        'contexthub --tools claude,copilot --force',
        'contexthub --manual --no-interactive  # Uses default tools'
      ]
    },
    {
      title: 'Detection & Analysis',
      commands: [
        'contexthub --detect-only      # See what tools are detected',
        'contexthub --list-tools       # Show all available tools',
        'npm run detect               # Standalone detection'
      ]
    },
    {
      title: 'Advanced Options',
      commands: [
        'contexthub --force --verbose  # Overwrite existing + detailed output',
        'contexthub --no-symlinks      # Use file copying instead',
        'contexthub --verify           # Check existing setup'
      ]
    },
    {
      title: 'Workflow Commands',
      commands: [
        'npm run watch                 # Start file watcher for auto-sync',
        'npm run lint                  # Validate configuration',
        'npm run build -- --tools claude  # Build specific tool configs'
      ]
    }
  ];

  examples.forEach(({ title, commands }) => {
    console.log(`${colors.yellow}${title}:${colors.reset}`);
    commands.forEach(cmd => {
      console.log(`   ${colors.cyan}${cmd}${colors.reset}`);
    });
    console.log('');
  });

  console.log('💡 Pro tip: Run with --verbose for detailed output\n');
}

program.action(async (options) => {
  try {
    // Handle info commands first
    if (options.listTools) {
      showAvailableTools();
      process.exit(0);
    }

    if (options.examples) {
      showExamples();
      process.exit(0);
    }

    // Handle detect-only mode
    if (options.detectOnly) {
      const detector = new AIToolDetector({ 
        workingDir: options.workingDir, 
        verbose: options.verbose 
      });
      const results = await detector.detectAllTools();
      detector.printResults(results);
      process.exit(0);
    }

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

    // Determine setup mode from CLI options
    let setupMode = null;
    if (options.manual) {
      setupMode = 'manual';
    } else if (options.smart) {
      setupMode = 'smart';
    }

    // Parse tools if provided
    const selectedTools = options.tools ? options.tools.split(',').map(t => t.trim()) : [];
    
    const setup = new ContextHubSetup({
      workingDir: options.workingDir,
      useSymlinks: options.symlinks,
      force: options.force,
      verbose: options.verbose,
      interactive: !options.noInteractive,
      tools: selectedTools,
      setupMode: setupMode
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