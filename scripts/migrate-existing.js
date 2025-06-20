#!/usr/bin/env node

/**
 * ContextHub Migration Script
 * Migrates existing AI tool configurations to unified ContextHub format
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const { program } = require('commander');

const MIGRATION_SOURCES = {
  claude: {
    files: ['CLAUDE.md'],
    format: 'markdown',
    description: 'Claude Code configuration'
  },
  cursor: {
    files: ['.cursorrules'],
    format: 'markdown',
    description: 'Cursor IDE configuration'
  },
  copilot: {
    files: ['.github/copilot-instructions.md', 'copilot-instructions.md'],
    format: 'markdown',
    description: 'GitHub Copilot configuration'
  },
  codeium: {
    files: ['.codeium/instructions.md', 'codeium.md'],
    format: 'markdown',
    description: 'Codeium configuration'
  },
  continue: {
    files: ['.continue/context.md', '.continue/instructions.md'],
    format: 'markdown',
    description: 'Continue configuration'
  },
  aider: {
    files: ['.aider.conf.yml', '.aider.yaml', 'aider.yml'],
    format: 'yaml',
    description: 'Aider configuration'
  },
  tabnine: {
    files: ['.tabnine/config.json'],
    format: 'json',
    description: 'TabNine configuration'
  }
};

// Template for new .ai-context.md file
const MARKDOWN_TEMPLATE = `# {{PROJECT_NAME}} - AI Context Configuration

## Project Overview
{{PROJECT_DESCRIPTION}}

## Architecture
{{ARCHITECTURE_DESCRIPTION}}

## Coding Standards
{{CODING_STANDARDS}}

## Testing Strategy
{{TESTING_STRATEGY}}

## Performance Requirements
{{PERFORMANCE_REQUIREMENTS}}

## Security Guidelines
{{SECURITY_GUIDELINES}}

{{TOOL_SECTIONS}}

---

*This configuration was migrated to ContextHub format on {{MIGRATION_DATE}}*
*Original files backed up to: {{BACKUP_DIR}}*`;

class ConfigMigrator {
  constructor(options = {}) {
    this.workingDir = options.workingDir || process.cwd();
    this.outputFormat = options.format || 'markdown'; // 'markdown' or 'yaml'
    this.outputFile = options.output || (this.outputFormat === 'yaml' ? '.ai-context.yml' : '.ai-context.md');
    this.backupDir = options.backupDir || '.migration-backup';
    this.interactive = options.interactive !== false;
    this.force = options.force || false;
    this.dryRun = options.dryRun || false;

    this.foundFiles = {};
    this.migrationData = {};
    this.projectInfo = {
      name: path.basename(this.workingDir),
      description: '',
      techStack: [],
      architecture: '',
      codingStandards: {},
      testing: '',
      performance: '',
      security: ''
    };
  }

  /**
   * Scan for existing AI tool configuration files
   */
  scanForConfigs = async () => {
    console.log('🔍 Scanning for existing AI tool configurations...\n');

    for (const [toolName, config] of Object.entries(MIGRATION_SOURCES)) {
      for (const fileName of config.files) {
        const filePath = path.join(this.workingDir, fileName);

        try {
          await fs.access(filePath);

          if (!this.foundFiles[toolName]) {
            this.foundFiles[toolName] = [];
          }

          this.foundFiles[toolName].push({
            path: filePath,
            relativePath: fileName,
            format: config.format,
            description: config.description
          });

          console.log(`✅ Found ${config.description}: ${fileName}`);
        } catch (error) {
          // File doesn't exist, continue
        }
      }
    }

    const totalFiles = Object.values(this.foundFiles).reduce((sum, files) => sum + files.length, 0);
    console.log(`\n📊 Found ${totalFiles} configuration files across ${Object.keys(this.foundFiles).length} tools\n`);

    return totalFiles > 0;
  };

  /**
   * Read and parse existing configuration files
   */
  parseConfigs = async () => {
    console.log('📖 Reading existing configurations...\n');

    for (const [toolName, files] of Object.entries(this.foundFiles)) {
      this.migrationData[toolName] = [];

      for (const fileInfo of files) {
        try {
          const content = await fs.readFile(fileInfo.path, 'utf8');
          let parsedContent;

          if (fileInfo.format === 'markdown') {
            parsedContent = this.parseMarkdownConfig(content);
          } else if (fileInfo.format === 'yaml') {
            parsedContent = yaml.load(content);
          } else if (fileInfo.format === 'json') {
            parsedContent = JSON.parse(content);
          } else {
            parsedContent = { raw: content };
          }

          this.migrationData[toolName].push({
            ...fileInfo,
            content,
            parsed: parsedContent,
            size: content.length
          });

          console.log(`   📄 Parsed ${fileInfo.relativePath} (${content.length} characters)`);
        } catch (error) {
          console.error(`   ❌ Failed to parse ${fileInfo.relativePath}: ${error.message}`);
        }
      }
    }
  };

  /**
   * Parse markdown configuration file
   */
  parseMarkdownConfig = (content) => {
    const sections = {};
    const lines = content.split('\n');
    let currentSection = null;
    let currentContent = [];

    for (const line of lines) {
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

      if (headingMatch) {
        // Save previous section
        if (currentSection) {
          sections[currentSection] = currentContent.join('\n').trim();
        }

        // Start new section
        currentSection = headingMatch[2].trim();
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }

    // Save last section
    if (currentSection) {
      sections[currentSection] = currentContent.join('\n').trim();
    }

    return {
      sections,
      raw: content,
      wordCount: content.split(/\s+/).length
    };
  };

  /**
   * Analyze configurations to extract common project information
   */
  analyzeConfigs = () => {
    console.log('🔬 Analyzing configurations for project information...\n');

    // Extract project information from different sources
    for (const [toolName, configs] of Object.entries(this.migrationData)) {
      for (const config of configs) {
        this.extractProjectInfo(toolName, config);
      }
    }

    // Infer project information from directory structure
    this.inferProjectInfo();

    console.log(`   📋 Project: ${this.projectInfo.name}`);
    console.log(`   📝 Description: ${this.projectInfo.description || 'To be added'}`);
    console.log(`   🛠️  Tech Stack: ${this.projectInfo.techStack.join(', ') || 'To be determined'}`);
  };

  /**
   * Extract project information from a configuration file
   */
  extractProjectInfo = (toolName, config) => {
    if (config.format === 'markdown' && config.parsed.sections) {
      const sections = config.parsed.sections;

      // Extract project description
      const overviewSections = Object.keys(sections).filter(key =>
        key.toLowerCase().includes('overview') ||
        key.toLowerCase().includes('description') ||
        key.toLowerCase().includes('project')
      );

      if (overviewSections.length > 0 && !this.projectInfo.description) {
        this.projectInfo.description = `${sections[overviewSections[0]].substring(0, 200)}...`;
      }

      // Extract tech stack information
      const techSections = Object.keys(sections).filter(key =>
        key.toLowerCase().includes('tech') ||
        key.toLowerCase().includes('stack') ||
        key.toLowerCase().includes('technology')
      );

      for (const section of techSections) {
        const content = sections[section];
        const technologies = this.extractTechnologies(content);
        this.projectInfo.techStack.push(...technologies);
      }

      // Extract coding standards
      const codingStandardsSections = Object.keys(sections).filter(key =>
        key.toLowerCase().includes('standard') ||
        key.toLowerCase().includes('convention') ||
        key.toLowerCase().includes('coding')
      );

      if (codingStandardsSections.length > 0) {
        this.projectInfo.codingStandards[toolName] = sections[codingStandardsSections[0]];
      }

      // Extract architecture information
      const archSections = Object.keys(sections).filter(key =>
        key.toLowerCase().includes('architecture') ||
        key.toLowerCase().includes('structure')
      );

      if (archSections.length > 0 && !this.projectInfo.architecture) {
        this.projectInfo.architecture = sections[archSections[0]];
      }
    }
  };

  /**
   * Extract technology mentions from text
   */
  extractTechnologies = (text) => {
    const technologies = [];
    const commonTech = [
      'React', 'Vue', 'Angular', 'TypeScript', 'JavaScript', 'Node.js',
      'Python', 'Django', 'Flask', 'FastAPI', 'Java', 'Spring', 'C#', '.NET',
      'Go', 'Rust', 'PHP', 'Laravel', 'Ruby', 'Rails', 'Docker', 'Kubernetes',
      'AWS', 'Azure', 'GCP', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
      'GraphQL', 'REST', 'Next.js', 'Nuxt.js', 'Svelte', 'Flutter', 'React Native'
    ];

    for (const tech of commonTech) {
      if (text.toLowerCase().includes(tech.toLowerCase()) && !technologies.includes(tech)) {
        technologies.push(tech);
      }
    }

    return technologies;
  };

  /**
   * Infer project information from directory structure and files
   */
  inferProjectInfo = async () => {
    try {
      // Check for package.json
      const packageJsonPath = path.join(this.workingDir, 'package.json');
      try {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
        if (packageJson.name && !this.projectInfo.name) {
          this.projectInfo.name = packageJson.name;
        }
        if (packageJson.description && !this.projectInfo.description) {
          this.projectInfo.description = packageJson.description;
        }

        // Extract technologies from dependencies
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        if (deps.react) this.projectInfo.techStack.push('React');
        if (deps.vue) this.projectInfo.techStack.push('Vue');
        if (deps.angular) this.projectInfo.techStack.push('Angular');
        if (deps.typescript) this.projectInfo.techStack.push('TypeScript');
        if (deps.next) this.projectInfo.techStack.push('Next.js');
        if (deps.express) this.projectInfo.techStack.push('Express');
      } catch (error) {
        // No package.json or parsing error
      }

      // Check for other common files
      const files = await fs.readdir(this.workingDir);

      if (files.includes('requirements.txt') || files.includes('setup.py')) {
        this.projectInfo.techStack.push('Python');
      }
      if (files.includes('Gemfile')) {
        this.projectInfo.techStack.push('Ruby');
      }
      if (files.includes('go.mod')) {
        this.projectInfo.techStack.push('Go');
      }
      if (files.includes('Cargo.toml')) {
        this.projectInfo.techStack.push('Rust');
      }
      if (files.includes('composer.json')) {
        this.projectInfo.techStack.push('PHP');
      }

      // Remove duplicates
      this.projectInfo.techStack = [...new Set(this.projectInfo.techStack)];
    } catch (error) {
      // Error reading directory, continue with available information
    }
  };

  /**
   * Generate unified configuration content
   */
  generateUnifiedConfig = () => {
    if (this.outputFormat === 'yaml') {
      return this.generateYamlConfig();
    } else {
      return this.generateMarkdownConfig();
    }
  };

  /**
   * Generate YAML configuration
   */
  generateYamlConfig = () => {
    const config = {
      project: {
        name: this.projectInfo.name,
        description: this.projectInfo.description || 'Add project description here',
        tech_stack: this.projectInfo.techStack.length > 0 ? this.projectInfo.techStack : ['Add technologies here']
      },
      architecture: this.projectInfo.architecture || 'Add architecture description here',
      coding_standards: Object.keys(this.projectInfo.codingStandards).length > 0
        ? this.projectInfo.codingStandards
        : { general: 'Add coding standards here' },
      testing: this.projectInfo.testing || 'Add testing strategy here',
      performance: this.projectInfo.performance || 'Add performance requirements here',
      security: this.projectInfo.security || 'Add security guidelines here',
      tools: {}
    };

    // Add tool-specific configurations
    for (const [toolName, configs] of Object.entries(this.migrationData)) {
      if (configs.length > 0) {
        const primaryConfig = configs[0]; // Use first config if multiple

        if (toolName === 'aider' && primaryConfig.format === 'yaml') {
          config.tools[toolName] = primaryConfig.parsed;
        } else {
          config.tools[toolName] = {
            instructions: `${primaryConfig.content.substring(0, 500)}...`,
            source_file: primaryConfig.relativePath
          };
        }
      }
    }

    return yaml.dump(config, { defaultStyle: null, quotingType: '"' });
  };

  /**
   * Generate Markdown configuration
   */
  generateMarkdownConfig = () => {
    const toolSections = [];

    // Generate tool-specific sections
    for (const [toolName, configs] of Object.entries(this.migrationData)) {
      if (configs.length > 0) {
        const primaryConfig = configs[0];
        toolSections.push(`<!-- AI:${toolName.toUpperCase()} -->`);

        if (primaryConfig.format === 'markdown') {
          // Extract key content from original markdown
          const content = this.extractKeyContent(primaryConfig.content);
          toolSections.push(content);
        } else {
          toolSections.push(`Configuration migrated from ${primaryConfig.relativePath}`);
          toolSections.push('Please review and update these instructions.');
        }

        toolSections.push(`<!-- /AI:${toolName.toUpperCase()} -->`);
        toolSections.push('');
      }
    }

    // Replace template placeholders
    const content = MARKDOWN_TEMPLATE
      .replace('{{PROJECT_NAME}}', this.projectInfo.name)
      .replace('{{PROJECT_DESCRIPTION}}', this.projectInfo.description || 'Add project description here')
      .replace('{{ARCHITECTURE_DESCRIPTION}}', this.projectInfo.architecture || 'Add architecture description here')
      .replace('{{CODING_STANDARDS}}', this.generateCodingStandardsSection())
      .replace('{{TESTING_STRATEGY}}', this.projectInfo.testing || 'Add testing strategy here')
      .replace('{{PERFORMANCE_REQUIREMENTS}}', this.projectInfo.performance || 'Add performance requirements here')
      .replace('{{SECURITY_GUIDELINES}}', this.projectInfo.security || 'Add security guidelines here')
      .replace('{{TOOL_SECTIONS}}', toolSections.join('\n'))
      .replace('{{MIGRATION_DATE}}', new Date().toISOString().split('T')[0])
      .replace('{{BACKUP_DIR}}', this.backupDir);

    return content;
  };

  /**
   * Extract key content from configuration, removing headers and footers
   */
  extractKeyContent = (content) => {
    // Remove common headers and footers
    let cleaned = content
      .replace(/^#.*$/gm, '') // Remove top-level headers
      .replace(/---.*$/gm, '') // Remove footer separators
      .replace(/^\*.*generated.*\*$/gim, '') // Remove generation comments
      .trim();

    // Limit length
    if (cleaned.length > 1000) {
      cleaned = `${cleaned.substring(0, 1000)}\n\n[Content truncated - please review original file]`;
    }

    return cleaned || 'Please add tool-specific instructions here.';
  };

  /**
   * Generate coding standards section
   */
  generateCodingStandardsSection = () => {
    if (Object.keys(this.projectInfo.codingStandards).length === 0) {
      return 'Add coding standards and conventions here.';
    }

    let standards = '';
    for (const [tool, content] of Object.entries(this.projectInfo.codingStandards)) {
      standards += `\n### From ${tool}\n${content}\n`;
    }

    return standards.trim();
  };

  /**
   * Create backup of existing files
   */
  createBackup = async () => {
    if (this.dryRun) {
      console.log('🔍 [DRY RUN] Would create backup directory and copy files...\n');
      return;
    }

    console.log('💾 Creating backup of existing files...\n');

    const backupPath = path.join(this.workingDir, this.backupDir);
    await fs.mkdir(backupPath, { recursive: true });

    for (const configs of Object.values(this.migrationData)) {
      for (const config of configs) {
        const backupFilePath = path.join(backupPath, path.basename(config.relativePath));
        await fs.copyFile(config.path, backupFilePath);
        console.log(`   📁 Backed up ${config.relativePath} → ${this.backupDir}/${path.basename(config.relativePath)}`);
      }
    }

    // Create backup manifest
    const manifest = {
      timestamp: new Date().toISOString(),
      migrated_files: Object.entries(this.migrationData).map(([tool, configs]) => ({
        tool,
        files: configs.map(c => ({
          original_path: c.relativePath,
          backup_path: path.basename(c.relativePath),
          size: c.size
        }))
      })),
      output_file: this.outputFile,
      project_info: this.projectInfo
    };

    await fs.writeFile(
      path.join(backupPath, 'migration-manifest.json'),
      JSON.stringify(manifest, null, 2)
    );

    console.log('   📋 Created migration manifest\n');
  };

  /**
   * Write unified configuration file
   */
  writeUnifiedConfig = async () => {
    const outputPath = path.join(this.workingDir, this.outputFile);

    // Check if output file already exists
    if (!this.force) {
      try {
        await fs.access(outputPath);
        throw new Error(`Output file ${this.outputFile} already exists. Use --force to overwrite.`);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
        // File doesn't exist, proceed
      }
    }

    const content = this.generateUnifiedConfig();

    if (this.dryRun) {
      console.log('🔍 [DRY RUN] Would write unified configuration:');
      console.log(`   📄 File: ${this.outputFile}`);
      console.log(`   📏 Size: ${content.length} characters`);
      console.log('   📋 Content preview:\n');
      console.log(`${content.substring(0, 500)}...\n`);
      return;
    }

    await fs.writeFile(outputPath, content, 'utf8');
    console.log(`✅ Created unified configuration: ${this.outputFile}\n`);
  };

  /**
   * Run the migration process
   */
  migrate = async () => {
    try {
      console.log('🚀 ContextHub Configuration Migration\n');

      const hasConfigs = await this.scanForConfigs();
      if (!hasConfigs) {
        console.log('ℹ️  No existing AI tool configurations found.');
        console.log('   Run `contexthub init` to create a new configuration.\n');
        return false;
      }

      await this.parseConfigs();
      this.analyzeConfigs();
      await this.createBackup();
      await this.writeUnifiedConfig();
      console.log('🎉 Migration completed successfully!\n');
      console.log('📝 Next steps:');
      console.log(`   1. Review and edit ${this.outputFile}`);
      console.log('   2. Run \'contexthub validate\' to check the configuration');
      console.log('   3. Run \'contexthub build\' to generate tool-specific files');
      console.log(`   4. Original files are backed up in ${this.backupDir}/\n`);

      return true;
    } catch (error) {
      console.error(`❌ Migration failed: ${error.message}`);
      return false;
    }
  };
}

// CLI Configuration
program
  .name('contexthub-migrate')
  .description('Migrate existing AI tool configurations to ContextHub format')
  .version('1.0.0')
  .option('-w, --working-dir <dir>', 'Working directory to scan for configurations', process.cwd())
  .option('-f, --format <format>', 'Output format (markdown or yaml)', 'markdown')
  .option('-o, --output <file>', 'Output file name')
  .option('-b, --backup-dir <dir>', 'Backup directory name', '.migration-backup')
  .option('--force', 'Overwrite existing unified configuration file')
  .option('--dry-run', 'Show what would be done without making changes')
  .option('--non-interactive', 'Run without interactive prompts');

program.action(async (options) => {
  try {
    const migrator = new ConfigMigrator({
      workingDir: options.workingDir,
      format: options.format,
      output: options.output,
      backupDir: options.backupDir,
      interactive: !options.nonInteractive,
      force: options.force,
      dryRun: options.dryRun
    });

    const success = await migrator.migrate();
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

module.exports = { ConfigMigrator, MIGRATION_SOURCES };
