#!/usr/bin/env node

/**
 * ContextHub Configuration Validator
 * Validates .ai-context.md and .ai-context.yml files for completeness and correctness
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const { program } = require('commander');

const VALIDATION_RULES = {
  markdown: {
    required_sections: [
      'Project Overview',
      'Architecture',
      'Coding Standards'
    ],
    recommended_sections: [
      'Testing Strategy',
      'Performance Requirements',
      'Security Guidelines'
    ],
    tool_comments: ['claude', 'cursor', 'copilot', 'codeium'],
    max_file_size: 1024 * 1024, // 1MB
    min_content_length: 100
  },
  yaml: {
    required_fields: [
      'project.name',
      'project.description',
      'coding_standards'
    ],
    recommended_fields: [
      'project.tech_stack',
      'architecture',
      'testing',
      'tools'
    ],
    valid_tools: ['claude', 'cursor', 'copilot', 'codeium', 'continue', 'aider'],
    max_file_size: 512 * 1024 // 512KB
  }
};

const SEVERITY = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

class ConfigValidator {
  constructor(options = {}) {
    this.configFile = options.config || this.findConfigFile();
    this.strict = options.strict || false;
    this.verbose = options.verbose || false;
    this.fix = options.fix || false;

    this.issues = [];
    this.stats = {
      errors: 0,
      warnings: 0,
      info: 0
    };
  }

  /**
   * Find configuration file in current directory
   */
  findConfigFile = () => {
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

    throw new Error('No configuration file found. Expected .ai-context.md or .ai-context.yml');
  };

  /**
   * Add validation issue
   */
  addIssue = (severity, message, line = null, suggestion = null) => {
    this.issues.push({
      severity,
      message,
      line,
      suggestion,
      timestamp: new Date().toISOString()
    });

    // Map severity to stats key (handle singular vs plural)
    const statsKey = severity === 'error'
      ? 'errors'
      : severity === 'warning'
        ? 'warnings'
        : severity === 'info' ? 'info' : severity;

    if (Object.prototype.hasOwnProperty.call(this.stats, statsKey)) {
      this.stats[statsKey]++;
    }
  };

  /**
   * Read and parse configuration file
   */
  parseConfig = async () => {
    try {
      const content = await fs.readFile(this.configFile, 'utf8');
      const ext = path.extname(this.configFile);
      const stats = await fs.stat(this.configFile);

      if (ext === '.md') {
        return {
          type: 'markdown',
          content,
          size: stats.size,
          data: this.parseMarkdownContent(content)
        };
      } else if (ext === '.yml' || ext === '.yaml') {
        let parsedData;
        try {
          parsedData = yaml.load(content);
        } catch (yamlError) {
          this.addIssue(SEVERITY.ERROR, `Invalid YAML syntax: ${yamlError.message}`);
          return null;
        }

        return {
          type: 'yaml',
          content,
          size: stats.size,
          data: parsedData
        };
      } else {
        this.addIssue(SEVERITY.ERROR, `Unsupported file format: ${ext}`);
        return null;
      }
    } catch (error) {
      this.addIssue(SEVERITY.ERROR, `Failed to read config file: ${error.message}`);
      return null;
    }
  };

  /**
   * Parse markdown content for validation
   */
  parseMarkdownContent = (content) => {
    const lines = content.split('\n');
    const sections = [];
    const toolSections = {};

    // Extract sections (headings)
    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        sections.push({
          level: match[1].length,
          title: match[2].trim(),
          line: index + 1
        });
      }
    });

    // Extract tool-specific sections
    const toolRegex = /<!-- AI:(\w+) -->([\s\S]*?)<!-- \/AI:\1 -->/gi;
    let match;

    while ((match = toolRegex.exec(content)) !== null) {
      const toolName = match[1].toLowerCase();
      const toolContent = match[2].trim();
      toolSections[toolName] = {
        content: toolContent,
        startIndex: match.index,
        endIndex: match.index + match[0].length
      };
    }

    return {
      sections,
      toolSections,
      lines,
      wordCount: content.split(/\s+/).length,
      characterCount: content.length
    };
  };

  /**
   * Validate markdown configuration
   */
  validateMarkdown = (config) => {
    const rules = VALIDATION_RULES.markdown;
    const { data, size, content } = config;

    // File size validation
    if (size > rules.max_file_size) {
      this.addIssue(
        SEVERITY.WARNING,
        `File size (${Math.round(size / 1024)}KB) exceeds recommended maximum (${Math.round(rules.max_file_size / 1024)}KB)`,
        null,
        'Consider splitting large sections into separate files'
      );
    }

    // Content length validation
    if (content.length < rules.min_content_length) {
      this.addIssue(
        SEVERITY.ERROR,
        `Configuration too short (${content.length} characters). Minimum ${rules.min_content_length} characters required`,
        null,
        'Add more detailed project information and coding standards'
      );
    }

    // Required sections validation
    const sectionTitles = data.sections.map(s => s.title);

    for (const requiredSection of rules.required_sections) {
      const found = sectionTitles.some(title =>
        title.toLowerCase().includes(requiredSection.toLowerCase())
      );

      if (!found) {
        this.addIssue(
          SEVERITY.ERROR,
          `Missing required section: "${requiredSection}"`,
          null,
          `Add a section with heading "## ${requiredSection}"`
        );
      }
    }

    // Recommended sections validation
    for (const recommendedSection of rules.recommended_sections) {
      const found = sectionTitles.some(title =>
        title.toLowerCase().includes(recommendedSection.toLowerCase())
      );

      if (!found) {
        this.addIssue(
          SEVERITY.WARNING,
          `Missing recommended section: "${recommendedSection}"`,
          null,
          `Consider adding "## ${recommendedSection}" section`
        );
      }
    }

    // Tool-specific sections validation
    const toolSectionNames = Object.keys(data.toolSections);

    if (toolSectionNames.length === 0) {
      this.addIssue(
        SEVERITY.WARNING,
        'No tool-specific sections found',
        null,
        'Add tool-specific instructions using <!-- AI:TOOL_NAME --> comments'
      );
    }

    // Validate tool section syntax
    for (const [toolName, toolData] of Object.entries(data.toolSections)) {
      if (!rules.tool_comments.includes(toolName)) {
        this.addIssue(
          SEVERITY.INFO,
          `Unknown tool section: "${toolName}"`,
          null,
          `Supported tools: ${rules.tool_comments.join(', ')}`
        );
      }

      if (toolData.content.length < 10) {
        this.addIssue(
          SEVERITY.WARNING,
          `Tool section "${toolName}" is very short`,
          null,
          'Add more specific instructions for this tool'
        );
      }
    }

    // Check for common markdown issues
    this.validateMarkdownSyntax(data);
  };

  /**
   * Validate markdown syntax issues
   */
  validateMarkdownSyntax = (data) => {
    const { lines } = data;

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // Check for inconsistent heading levels
      const headingMatch = line.match(/^(#{1,6})\s/);
      if (headingMatch && index > 0) {
        const level = headingMatch[1].length;
        const prevHeadings = data.sections.filter(s => s.line < lineNum);
        const lastHeading = prevHeadings[prevHeadings.length - 1];

        if (lastHeading && level > lastHeading.level + 1) {
          this.addIssue(
            SEVERITY.WARNING,
            `Skipped heading level at line ${lineNum}`,
            lineNum,
            'Use consecutive heading levels (h1, h2, h3) without skipping'
          );
        }
      }

      // Check for empty sections
      if (headingMatch && index < lines.length - 1) {
        const nextNonEmptyLine = lines.slice(index + 1).find(l => l.trim() !== '');
        if (nextNonEmptyLine && nextNonEmptyLine.match(/^#{1,6}\s/)) {
          this.addIssue(
            SEVERITY.WARNING,
            `Empty section at line ${lineNum}`,
            lineNum,
            'Add content to this section or remove the heading'
          );
        }
      }

      // Check for long lines
      if (line.length > 120) {
        this.addIssue(
          SEVERITY.INFO,
          `Long line at line ${lineNum} (${line.length} characters)`,
          lineNum,
          'Consider breaking long lines for better readability'
        );
      }
    });
  };

  /**
   * Validate YAML configuration
   */
  validateYaml = (config) => {
    const rules = VALIDATION_RULES.yaml;
    const { data, size } = config;

    // File size validation
    if (size > rules.max_file_size) {
      this.addIssue(
        SEVERITY.WARNING,
        `File size (${Math.round(size / 1024)}KB) exceeds recommended maximum (${Math.round(rules.max_file_size / 1024)}KB)`
      );
    }

    // Required fields validation
    for (const field of rules.required_fields) {
      if (!this.getNestedValue(data, field)) {
        this.addIssue(
          SEVERITY.ERROR,
          `Missing required field: "${field}"`,
          null,
          `Add ${field} to your configuration`
        );
      }
    }

    // Recommended fields validation
    for (const field of rules.recommended_fields) {
      if (!this.getNestedValue(data, field)) {
        this.addIssue(
          SEVERITY.WARNING,
          `Missing recommended field: "${field}"`,
          null,
          `Consider adding ${field} for better configuration`
        );
      }
    }

    // Tools validation
    if (data.tools) {
      for (const toolName of Object.keys(data.tools)) {
        if (!rules.valid_tools.includes(toolName)) {
          this.addIssue(
            SEVERITY.INFO,
            `Unknown tool configuration: "${toolName}"`,
            null,
            `Supported tools: ${rules.valid_tools.join(', ')}`
          );
        }
      }
    }

    // Data type validation
    this.validateYamlDataTypes(data);
  };

  /**
   * Get nested value from object using dot notation
   */
  getNestedValue = (obj, path) => path.split('.').reduce((current, key) => current && current[key] !== undefined ? current[key] : null, obj);

  /**
   * Validate YAML data types
   */
  validateYamlDataTypes = (data) => {
    // Project validation
    if (data.project) {
      if (typeof data.project.name !== 'string') {
        this.addIssue(SEVERITY.ERROR, 'project.name must be a string');
      }

      if (typeof data.project.description !== 'string') {
        this.addIssue(SEVERITY.ERROR, 'project.description must be a string');
      }

      if (data.project.tech_stack && typeof data.project.tech_stack !== 'object') {
        this.addIssue(SEVERITY.WARNING, 'project.tech_stack should be an object or array');
      }
    }

    // Coding standards validation
    if (data.coding_standards && typeof data.coding_standards !== 'object') {
      this.addIssue(SEVERITY.ERROR, 'coding_standards must be an object');
    }

    // Tools validation
    if (data.tools && typeof data.tools !== 'object') {
      this.addIssue(SEVERITY.ERROR, 'tools must be an object');
    }
  };

  /**
   * Generate validation report
   */
  generateReport = () => {
    const report = {
      file: this.configFile,
      timestamp: new Date().toISOString(),
      stats: { ...this.stats },
      issues: this.issues,
      summary: {
        total_issues: this.issues.length,
        has_errors: this.stats.errors > 0,
        has_warnings: this.stats.warnings > 0,
        is_valid: this.stats.errors === 0
      }
    };

    return report;
  };

  /**
   * Print validation results to console
   */
  printResults = () => {
    console.log('\n🔍 ContextHub Configuration Validator');
    console.log(`📄 File: ${this.configFile}`);
    console.log(`📊 Issues: ${this.stats.errors} errors, ${this.stats.warnings} warnings, ${this.stats.info} info\n`);

    if (this.issues.length === 0) {
      console.log('✅ Configuration is valid!');
      return;
    }

    // Group issues by severity
    const errorIssues = this.issues.filter(i => i.severity === SEVERITY.ERROR);
    const warningIssues = this.issues.filter(i => i.severity === SEVERITY.WARNING);
    const infoIssues = this.issues.filter(i => i.severity === SEVERITY.INFO);

    // Print errors
    if (errorIssues.length > 0) {
      console.log('❌ Errors:');
      errorIssues.forEach(issue => {
        console.log(`   ${issue.message}${issue.line ? ` (line ${issue.line})` : ''}`);
        if (issue.suggestion && this.verbose) {
          console.log(`      💡 ${issue.suggestion}`);
        }
      });
      console.log('');
    }

    // Print warnings
    if (warningIssues.length > 0) {
      console.log('⚠️  Warnings:');
      warningIssues.forEach(issue => {
        console.log(`   ${issue.message}${issue.line ? ` (line ${issue.line})` : ''}`);
        if (issue.suggestion && this.verbose) {
          console.log(`      💡 ${issue.suggestion}`);
        }
      });
      console.log('');
    }

    // Print info (only in verbose mode)
    if (infoIssues.length > 0 && this.verbose) {
      console.log('ℹ️  Info:');
      infoIssues.forEach(issue => {
        console.log(`   ${issue.message}${issue.line ? ` (line ${issue.line})` : ''}`);
        if (issue.suggestion) {
          console.log(`      💡 ${issue.suggestion}`);
        }
      });
      console.log('');
    }

    // Summary
    if (this.stats.errors === 0) {
      console.log('✅ Configuration is valid (with warnings)');
    } else {
      console.log('❌ Configuration has errors that must be fixed');
    }
  };

  /**
   * Run validation
   */
  validate = async () => {
    try {
      console.log('Validating configuration...');

      const config = await this.parseConfig();
      if (!config) {
        return false; // Parse errors already added to issues
      }

      if (config.type === 'markdown') {
        this.validateMarkdown(config);
      } else if (config.type === 'yaml') {
        this.validateYaml(config);
      }

      return this.stats.errors === 0;
    } catch (error) {
      this.addIssue(SEVERITY.ERROR, `Validation failed: ${error.message}`);
      return false;
    }
  };
}

program
  .name('contexthub-validate')
  .description('Validate ContextHub configuration files')
  .version('1.0.0')
  .option('-c, --config <file>', 'Configuration file to validate')
  .option('-s, --strict', 'Strict mode (treat warnings as errors)')
  .option('-v, --verbose', 'Verbose output with suggestions')
  .option('-j, --json', 'Output results as JSON')
  .option('--fix', 'Attempt to fix common issues (experimental)');

program.action(async (options) => {
  try {
    const validator = new ConfigValidator(options);
    await validator.validate();

    if (options.json) {
      const report = validator.generateReport();
      console.log(JSON.stringify(report, null, 2));
    } else {
      validator.printResults();
    }

    // Exit with error code if validation failed
    const hasErrors = validator.stats.errors > 0;
    const hasWarningsInStrict = options.strict && validator.stats.warnings > 0;

    process.exit(hasErrors || hasWarningsInStrict ? 1 : 0);
  } catch (error) {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  }
});

if (require.main === module) {
  program.parse();
}

module.exports = { ConfigValidator, VALIDATION_RULES, SEVERITY };
