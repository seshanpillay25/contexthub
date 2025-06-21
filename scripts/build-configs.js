#!/usr/bin/env node

/**
 * ContextHub Build Configs Script
 * Generates tool-specific configuration files from master .ai-context.md or .ai-context.yml
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const { program } = require('commander');

const TOOL_CONFIGS = {
  claude: {
    outputFile: 'CLAUDE.md',
    format: 'markdown',
    description: 'Claude Code configuration'
  },
  cursor: {
    outputFile: '.cursorrules',
    format: 'markdown',
    description: 'Cursor IDE configuration'
  },
  copilot: {
    outputFile: '.github/copilot-instructions.md',
    format: 'markdown',
    description: 'GitHub Copilot configuration'
  },
  codeium: {
    outputFile: '.codeium/instructions.md',
    format: 'markdown',
    description: 'Codeium configuration'
  },
  continue: {
    outputFile: '.continue/context.md',
    format: 'markdown',
    description: 'Continue configuration'
  },
  aider: {
    outputFile: '.aider.conf.yml',
    format: 'yaml',
    description: 'Aider configuration'
  }
};

const AIDER_TEMPLATE = {
  model: 'gpt-4',
  'auto-commits': true,
  'dirty-commits': true,
  read: '.ai-context.md'
};

class ConfigBuilder {
  constructor(options = {}) {
    // Handle source file path - allow absolute paths from findSourceFile() but validate user-provided paths
    if (options.source) {
      this.sourceFile = this.validateAndSanitizePath(options.source);
    } else {
      this.sourceFile = this.findSourceFile(); // This can return absolute paths
    }
    // Validate and sanitize output directory path
    this.outputDir = options.output ? this.validateAndSanitizePath(options.output) : process.cwd();
    this.tools = options.tools || Object.keys(TOOL_CONFIGS);
    this.force = options.force || false;
    this.verbose = options.verbose || false;
    this.silent = options.silent || false;

    this.log = this.verbose ? console.log : () => {};
    this.logError = this.silent ? () => {} : console.error;
    this.stats = {
      processed: 0,
      created: 0,
      skipped: 0,
      errors: 0
    };
  }

  /**
   * Validate and sanitize file paths to prevent security vulnerabilities
   */
  validateAndSanitizePath = (inputPath) => {
    if (!inputPath || typeof inputPath !== 'string') {
      throw new Error('Invalid path: path must be a non-empty string');
    }

    // Check for null bytes (null byte injection protection)
    if (inputPath.includes('\0')) {
      throw new Error('Invalid path: null bytes are not allowed');
    }

    // Reject absolute paths for security
    if (path.isAbsolute(inputPath)) {
      throw new Error('Invalid path: absolute paths are not allowed for security reasons');
    }

    // Reject URL schemes (but allow Windows drive letters like C:)
    if (/^[a-z][a-z0-9+.-]*:/i.test(inputPath) &&
        !/^[a-z]:[\\//]/i.test(inputPath)) {
      throw new Error('Invalid path: URL schemes are not allowed');
    }

    // Normalize the path to resolve any .. or . components
    const normalizedPath = path.normalize(inputPath);

    // Ensure the normalized path doesn't escape the current working directory
    const resolvedPath = path.resolve(process.cwd(), normalizedPath);
    const cwd = path.resolve(process.cwd());

    if (!resolvedPath.startsWith(cwd + path.sep) && resolvedPath !== cwd) {
      throw new Error('Invalid path: path traversal outside project directory is not allowed');
    }

    return normalizedPath;
  };

  /**
   * Find the source configuration file (.ai-context.md or .ai-context.yml)
   */
  findSourceFile = () => {
    const candidates = ['.ai-context.md', '.ai-context.yml', '.ai-context.yaml'];

    for (const candidate of candidates) {
      const filePath = path.join(process.cwd(), candidate);
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
   * Parse the source configuration file
   */
  parseSourceFile = async () => {
    try {
      const content = await fs.readFile(this.sourceFile, 'utf8');
      const ext = path.extname(this.sourceFile);

      if (ext === '.md') {
        return {
          type: 'markdown',
          content,
          data: this.parseMarkdownContent(content)
        };
      } else if (ext === '.yml' || ext === '.yaml') {
        return {
          type: 'yaml',
          content,
          data: yaml.load(content)
        };
      } else {
        throw new Error(`Unsupported file format: ${ext}`);
      }
    } catch (error) {
      throw new Error(`Failed to parse source file: ${error.message}`);
    }
  };

  /**
   * Parse markdown content to extract tool-specific sections
   */
  parseMarkdownContent = (content) => {
    const toolSections = {};

    // Extract tool-specific sections using HTML comments
    const toolRegex = /<!-- AI:(\w+) -->([\s\S]*?)<!-- \/AI:\1 -->/gi;
    let match;

    while ((match = toolRegex.exec(content)) !== null) {
      const toolName = match[1].toLowerCase();
      const toolContent = match[2].trim();
      toolSections[toolName] = toolContent;
    }

    return {
      content,
      toolSections
    };
  };

  /**
   * Generate configuration for a specific tool
   */
  generateToolConfig = async (toolName, sourceData) => {
    const config = TOOL_CONFIGS[toolName];
    if (!config) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    this.log(`\nGenerating ${config.description}...`);

    let outputContent;

    if (config.format === 'yaml' && toolName === 'aider') {
      // Special handling for Aider YAML configuration
      outputContent = this.generateAiderConfig(sourceData);
    } else {
      // Generate markdown content
      outputContent = this.generateMarkdownConfig(toolName, sourceData);
    }

    return {
      config,
      content: outputContent
    };
  };

  /**
   * Generate Aider YAML configuration
   */
  generateAiderConfig = (sourceData) => {
    const aiderConfig = { ...AIDER_TEMPLATE };

    // Add source file reference
    if (sourceData.type === 'markdown') {
      aiderConfig.read = path.basename(this.sourceFile);
    } else {
      aiderConfig.read = path.basename(this.sourceFile);
    }

    // Add custom configurations if available in YAML source
    if (sourceData.type === 'yaml' && sourceData.data.tools && sourceData.data.tools.aider) {
      Object.assign(aiderConfig, sourceData.data.tools.aider);
    }

    return yaml.dump(aiderConfig, {
      defaultStyle: null,
      quotingType: '"',
      forceQuotes: false
    });
  };

  /**
   * Generate markdown configuration for tools
   */
  generateMarkdownConfig = (toolName, sourceData) => {
    let content;

    if (sourceData.type === 'markdown') {
      content = sourceData.content;

      // If there are tool-specific sections, filter for this tool
      if (sourceData.data.toolSections[toolName]) {
        // Create a version with only relevant tool sections
        content = this.filterMarkdownForTool(content, toolName);
      }
    } else {
      // Convert YAML to markdown
      content = this.convertYamlToMarkdown(sourceData.data, toolName);
    }

    // Add generation header
    const header = `<!-- Generated by ContextHub on ${new Date().toISOString()} -->\n<!-- Source: ${path.basename(this.sourceFile)} -->\n\n`;

    return header + content;
  };

  /**
   * Filter markdown content to show relevant sections for a specific tool
   */
  filterMarkdownForTool = (content, toolName) => {
    // Remove other tool-specific sections
    const otherTools = Object.keys(TOOL_CONFIGS).filter(t => t !== toolName);
    let filteredContent = content;

    for (const tool of otherTools) {
      const toolUpper = tool.toUpperCase();
      const regex = new RegExp(`<!-- AI:${toolUpper} -->.*?<!-- /AI:${toolUpper} -->`, 'gis');
      filteredContent = filteredContent.replace(regex, '');
    }

    // Clean up the tool-specific section for current tool
    const toolUpper = toolName.toUpperCase();
    const currentToolRegex = new RegExp(`<!-- AI:${toolUpper} -->\n?(.*?)\n?<!-- /AI:${toolUpper} -->`, 'gis');
    filteredContent = filteredContent.replace(currentToolRegex, (match, content) => content.trim());

    return filteredContent.trim();
  };

  /**
   * Convert YAML configuration to markdown format
   */
  convertYamlToMarkdown = (data, toolName) => {
    let markdown = '';

    // Project information
    if (data.project) {
      markdown += `# ${data.project.name || 'Project'} - AI Context Configuration\n\n`;

      if (data.project.description) {
        markdown += `## Project Overview\n${data.project.description}\n\n`;
      }

      if (data.project.tech_stack) {
        markdown += '**Tech Stack:**\n';
        if (Array.isArray(data.project.tech_stack)) {
          data.project.tech_stack.forEach(tech => {
            markdown += `- ${tech}\n`;
          });
        } else {
          Object.entries(data.project.tech_stack).forEach(([key, value]) => {
            markdown += `- **${key}:** ${value}\n`;
          });
        }
        markdown += '\n';
      }
    }

    // Architecture
    if (data.architecture) {
      markdown += '## Architecture\n';
      if (typeof data.architecture === 'string') {
        markdown += `${data.architecture}\n\n`;
      } else {
        markdown += `${JSON.stringify(data.architecture, null, 2)}\n\n`;
      }
    }

    // Coding standards
    if (data.coding_standards) {
      markdown += '## Coding Standards\n';
      Object.entries(data.coding_standards).forEach(([lang, standards]) => {
        markdown += `\n### ${lang}\n`;
        if (Array.isArray(standards)) {
          standards.forEach(standard => {
            markdown += `- ${standard}\n`;
          });
        } else if (typeof standards === 'object') {
          Object.entries(standards).forEach(([key, value]) => {
            markdown += `- **${key}:** ${value}\n`;
          });
        }
      });
      markdown += '\n';
    }

    // Tool-specific configuration
    if (data.tools && data.tools[toolName]) {
      markdown += `## ${toolName.charAt(0).toUpperCase() + toolName.slice(1)} Configuration\n`;
      const toolConfig = data.tools[toolName];

      if (typeof toolConfig === 'string') {
        markdown += `${toolConfig}\n\n`;
      } else if (Array.isArray(toolConfig)) {
        toolConfig.forEach(item => {
          markdown += `- ${item}\n`;
        });
        markdown += '\n';
      } else {
        Object.entries(toolConfig).forEach(([key, value]) => {
          markdown += `- **${key}:** ${value}\n`;
        });
        markdown += '\n';
      }
    }

    return markdown;
  };

  /**
   * Write configuration file to disk
   */
  writeConfigFile = async (toolName, configData) => {
    const outputPath = path.join(this.outputDir, configData.config.outputFile);
    const outputDir = path.dirname(outputPath);

    try {
      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });

      // Check if file exists and not forcing
      if (!this.force) {
        try {
          await fs.access(outputPath);
          this.log(`  Skipping ${outputPath} (already exists, use --force to overwrite)`);
          this.stats.skipped++;
          return false;
        } catch (error) {
          // File doesn't exist, proceed
        }
      }

      // Write file
      await fs.writeFile(outputPath, configData.content, 'utf8');
      this.log(`  Created ${outputPath}`);
      this.stats.created++;
      return true;
    } catch (error) {
      console.error(`  Error writing ${outputPath}: ${error.message}`);
      this.stats.errors++;
      return false;
    }
  };

  /**
   * Build all configurations
   */
  build = async () => {
    try {
      console.log('🔧 ContextHub Config Builder');
      console.log(`📄 Source: ${this.sourceFile}`);
      console.log(`📁 Output: ${this.outputDir}`);
      console.log(`🛠️  Tools: ${this.tools.join(', ')}`);
      console.log('');

      // Parse source file
      this.log('Parsing source configuration...');
      const sourceData = await this.parseSourceFile();
      this.log(`Source type: ${sourceData.type}`);

      // Generate configurations for each tool
      for (const toolName of this.tools) {
        try {
          this.stats.processed++;
          const configData = await this.generateToolConfig(toolName, sourceData);
          await this.writeConfigFile(toolName, configData);
        } catch (error) {
          console.error(`❌ Error processing ${toolName}: ${error.message}`);
          this.stats.errors++;
        }
      }

      // Print summary
      console.log('\n📊 Build Summary:');
      console.log(`   Processed: ${this.stats.processed}`);
      console.log(`   Created: ${this.stats.created}`);
      console.log(`   Skipped: ${this.stats.skipped}`);
      console.log(`   Errors: ${this.stats.errors}`);

      if (this.stats.errors === 0) {
        console.log('\n✅ All configurations built successfully!');
        return true;
      } else {
        console.log('\n⚠️  Some configurations failed to build.');
        return false;
      }
    } catch (error) {
      this.logError(`❌ Build failed: ${error.message}`);
      return false;
    }
  };
}

program
  .name('contexthub-build')
  .description('Generate tool-specific configuration files from unified AI context')
  .version('1.0.0')
  .option('-s, --source <file>', 'Source configuration file (.ai-context.md or .ai-context.yml)')
  .option('-o, --output <dir>', 'Output directory', process.cwd())
  .option('-t, --tools <tools>', 'Comma-separated list of tools to generate configs for',
    (value) => value.split(',').map(t => t.trim().toLowerCase()))
  .option('-f, --force', 'Overwrite existing files')
  .option('-v, --verbose', 'Verbose output')
  .option('--list-tools', 'List available tools');

program.action(async (options) => {
  if (options.listTools) {
    console.log('Available tools:');
    Object.entries(TOOL_CONFIGS).forEach(([tool, config]) => {
      console.log(`  ${tool.padEnd(10)} → ${config.outputFile} (${config.description})`);
    });
    return;
  }

  try {
    const builder = new ConfigBuilder(options);
    const success = await builder.build();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  }
});

if (require.main === module) {
  program.parse();
}

module.exports = { ConfigBuilder, TOOL_CONFIGS };
