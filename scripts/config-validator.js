#!/usr/bin/env node

/**
 * ContextHub Configuration Validator & Linter
 * Validates and lints AI context configurations for best practices and consistency
 */

const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');

class ConfigValidator {
  constructor(options = {}) {
    this.workingDir = options.workingDir || process.cwd();
    this.verbose = options.verbose || false;
    this.strict = options.strict || false;
    this.fix = options.fix || false;

    this.masterFile = path.join(this.workingDir, '.ai-context.md');

    // Validation results
    this.results = {
      errors: [],
      warnings: [],
      suggestions: [],
      fixed: []
    };

    // Colors for output
    this.colors = {
      reset: '\x1b[0m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      purple: '\x1b[35m',
      cyan: '\x1b[36m'
    };

    // Validation rules
    this.rules = {
      structure: this.validateStructure.bind(this),
      content: this.validateContent.bind(this),
      toolSections: this.validateToolSections.bind(this),
      consistency: this.validateConsistency.bind(this),
      bestPractices: this.validateBestPractices.bind(this),
      security: this.validateSecurity.bind(this)
    };
  }

  /**
   * Log with color
   */
  log(message, color = null) {
    if (color && this.colors[color]) {
      console.log(`${this.colors[color]}${message}${this.colors.reset}`);
    } else {
      console.log(message);
    }
  }

  /**
   * Add validation issue
   */
  addIssue(type, rule, message, line = null, fixable = false, autofix = null) {
    const issue = {
      type,
      rule,
      message,
      line,
      fixable,
      autofix
    };

    this.results[type].push(issue);
  }

  /**
   * Read and parse configuration file
   */
  async readConfig() {
    try {
      const content = await fs.readFile(this.masterFile, 'utf8');
      const lines = content.split('\n');

      return {
        content,
        lines,
        sections: this.parseSections(content),
        toolSections: this.parseToolSections(content)
      };
    } catch (error) {
      throw new Error(`Cannot read configuration file: ${error.message}`);
    }
  }

  /**
   * Parse markdown sections
   */
  parseSections(content) {
    const sections = {};
    const lines = content.split('\n');
    let currentSection = null;
    let currentContent = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('# ')) {
        if (currentSection) {
          sections[currentSection] = {
            content: currentContent.join('\n'),
            line: i - currentContent.length,
            length: currentContent.length
          };
        }
        currentSection = line.substring(2).trim();
        currentContent = [];
      } else if (line.startsWith('## ')) {
        if (currentSection) {
          sections[currentSection] = {
            content: currentContent.join('\n'),
            line: i - currentContent.length,
            length: currentContent.length
          };
        }
        currentSection = line.substring(3).trim();
        currentContent = [];
      } else {
        currentContent.push(lines[i]);
      }
    }

    if (currentSection) {
      sections[currentSection] = {
        content: currentContent.join('\n'),
        line: lines.length - currentContent.length,
        length: currentContent.length
      };
    }

    return sections;
  }

  /**
   * Parse tool-specific sections
   */
  parseToolSections(content) {
    const toolSections = {};
    const regex = /<!-- AI:(\w+) -->([\s\S]*?)<!-- \/AI:\1 -->/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const tool = match[1].toLowerCase();
      const sectionContent = match[2].trim();

      toolSections[tool] = {
        content: sectionContent,
        start: match.index,
        end: match.index + match[0].length
      };
    }

    return toolSections;
  }

  /**
   * Validate document structure
   */
  validateStructure(config) {
    const requiredSections = [
      'Project Overview',
      'Architecture',
      'Coding Standards'
    ];

    const recommendedSections = [
      'Testing Strategy',
      'Performance Requirements',
      'Security Guidelines'
    ];

    // Check for required sections
    for (const section of requiredSections) {
      if (!config.sections[section]) {
        this.addIssue('errors', 'structure',
          `Missing required section: "${section}"`,
          null, true, () => `\n## ${section}\n<!-- Add ${section.toLowerCase()} information here -->\n`
        );
      }
    }

    // Check for recommended sections
    for (const section of recommendedSections) {
      if (!config.sections[section]) {
        this.addIssue('suggestions', 'structure',
          `Consider adding section: "${section}" for better AI guidance`
        );
      }
    }

    // Check document title
    if (!config.content.startsWith('# ')) {
      this.addIssue('warnings', 'structure',
        'Document should start with a main heading (# AI Context Configuration)',
        1, true, '# AI Context Configuration\n\n'
      );
    }
  }

  /**
   * Validate content quality
   */
  validateContent(config) {
    // Check for empty sections
    for (const [sectionName, section] of Object.entries(config.sections)) {
      const contentLines = section.content.split('\n').filter(line =>
        line.trim() && !line.trim().startsWith('<!--')
      );

      if (contentLines.length === 0) {
        this.addIssue('warnings', 'content',
          `Section "${sectionName}" is empty or contains only comments`,
          section.line
        );
      }
    }

    // Check for placeholder content
    const placeholderPatterns = [
      /<!-- Add .* here -->/g,
      /\[TODO\]/gi,
      /\[PLACEHOLDER\]/gi,
      /Your project/gi
    ];

    for (const pattern of placeholderPatterns) {
      const matches = config.content.match(pattern);
      if (matches) {
        this.addIssue('suggestions', 'content',
          `Found ${matches.length} placeholder(s) that should be replaced with actual content`
        );
      }
    }

    // Check content length
    const wordCount = config.content.split(/\s+/).length;
    if (wordCount < 100) {
      this.addIssue('warnings', 'content',
        `Configuration seems too brief (${wordCount} words). Consider adding more detailed guidance.`
      );
    }

    // Check for code examples
    const codeBlocks = (config.content.match(/```/g) || []).length / 2;
    if (codeBlocks === 0) {
      this.addIssue('suggestions', 'content',
        'Consider adding code examples to provide clearer guidance to AI assistants'
      );
    }
  }

  /**
   * Validate tool-specific sections
   */
  validateToolSections(config) {
    const detectedTools = Object.keys(config.toolSections);

    // Check for malformed tool sections
    const malformedRegex = /<!-- AI:\w+ -->/g;
    let match;
    while ((match = malformedRegex.exec(config.content)) !== null) {
      const tool = match[0].match(/AI:(\w+)/)[1];
      const closingTag = `<!-- /AI:${tool} -->`;

      if (!config.content.includes(closingTag)) {
        this.addIssue('errors', 'toolSections',
          `Malformed tool section: ${match[0]} is missing closing tag ${closingTag}`
        );
      }
    }

    // Check for empty tool sections
    for (const [tool, section] of Object.entries(config.toolSections)) {
      if (!section.content.trim()) {
        this.addIssue('warnings', 'toolSections',
          `Tool section for ${tool.toUpperCase()} is empty`
        );
      }
    }

    // Suggest adding tool sections if none exist
    if (detectedTools.length === 0) {
      this.addIssue('suggestions', 'toolSections',
        'Consider adding tool-specific sections (e.g., <!-- AI:CLAUDE -->...<!-- /AI:CLAUDE -->) for customized guidance'
      );
    }
  }

  /**
   * Validate consistency across configurations
   */
  async validateConsistency(config) {
    // Check if synced files exist and are consistent
    const toolConfigs = {
      'CLAUDE.md': 'claude',
      '.cursorrules': 'cursor',
      '.github/copilot-instructions.md': 'copilot',
      '.codeium/instructions.md': 'codeium',
      '.continue/context.md': 'continue'
    };

    for (const [configFile, toolName] of Object.entries(toolConfigs)) {
      const configPath = path.join(this.workingDir, configFile);

      try {
        const stats = await fs.lstat(configPath);

        if (stats.isSymbolicLink()) {
          // Check if symlink points to master file
          const target = await fs.readlink(configPath);
          const targetPath = path.resolve(path.dirname(configPath), target);
          const masterPath = path.resolve(this.masterFile);

          if (targetPath !== masterPath) {
            this.addIssue('warnings', 'consistency',
              `${configFile} symlink points to wrong target: ${target}`
            );
          }
        } else {
          // Check if file content matches processed master content
          const toolContent = await fs.readFile(configPath, 'utf8');
          const expectedContent = this.processContentForTool(config.content, toolName);

          if (toolContent.trim() !== expectedContent.trim()) {
            this.addIssue('warnings', 'consistency',
              `${configFile} is out of sync with master configuration`
            );
          }
        }
      } catch (error) {
        // File doesn't exist - this might be okay
        if (this.verbose) {
          this.addIssue('suggestions', 'consistency',
            `${configFile} doesn't exist. Run 'contexthub build' to create it.`
          );
        }
      }
    }
  }

  /**
   * Process content for specific tool (similar to file-watcher logic)
   */
  processContentForTool(content, toolName) {
    if (!toolName) return content;

    const toolSpecificRegex = new RegExp(`<!-- AI:${toolName.toUpperCase()} -->[\\s\\S]*?<!-- /AI:${toolName.toUpperCase()} -->`, 'g');
    const toolSpecificSections = content.match(toolSpecificRegex) || [];

    let processedContent = content.replace(/<!-- AI:\w+ -->[\s\S]*?<!-- \/AI:\w+ -->/g, '');

    if (toolSpecificSections.length > 0) {
      processedContent += `\n\n${toolSpecificSections.join('\n\n')}`;
    }

    return `${processedContent.trim()}\n`;
  }

  /**
   * Validate best practices
   */
  validateBestPractices(config) {
    // Check for specific language/framework patterns
    const content = config.content.toLowerCase();

    // TypeScript best practices
    if (content.includes('typescript')) {
      const tsPatterns = [
        { pattern: /strict.*mode/i, message: 'TypeScript strict mode configuration' },
        { pattern: /interface.*type/i, message: 'Interface vs type usage guidance' },
        { pattern: /any.*type/i, message: 'Guidelines for avoiding "any" type' }
      ];

      for (const { pattern, message } of tsPatterns) {
        if (!pattern.test(config.content)) {
          this.addIssue('suggestions', 'bestPractices',
            `Consider adding ${message} to TypeScript guidelines`
          );
        }
      }
    }

    // React best practices
    if (content.includes('react')) {
      const reactPatterns = [
        { pattern: /functional.*component/i, message: 'functional components guidance' },
        { pattern: /hook/i, message: 'React hooks best practices' },
        { pattern: /error.*boundary/i, message: 'error boundary implementation' }
      ];

      for (const { pattern, message } of reactPatterns) {
        if (!pattern.test(config.content)) {
          this.addIssue('suggestions', 'bestPractices',
            `Consider adding ${message} to React guidelines`
          );
        }
      }
    }

    // Security mentions
    if (!content.includes('security')) {
      this.addIssue('suggestions', 'bestPractices',
        'Consider adding security guidelines section'
      );
    }

    // Testing mentions
    if (!content.includes('test')) {
      this.addIssue('suggestions', 'bestPractices',
        'Consider adding testing strategy and guidelines'
      );
    }

    // Performance mentions
    if (!content.includes('performance')) {
      this.addIssue('suggestions', 'bestPractices',
        'Consider adding performance requirements and guidelines'
      );
    }
  }

  /**
   * Validate security aspects
   */
  validateSecurity(config) {
    // Check for sensitive information patterns
    const sensitivePatterns = [
      { pattern: /api[_-]?key|apikey/gi, message: 'API key detected' },
      { pattern: /password|passwd/gi, message: 'Password reference detected' },
      { pattern: /secret|token/gi, message: 'Secret or token detected' },
      { pattern: /\b[A-Za-z0-9]{32,}\b/g, message: 'Potential hash or key detected' },
      { pattern: /https?:\/\/[^\s]+@[^\s]+/g, message: 'URL with credentials detected' }
    ];

    for (const { pattern, message } of sensitivePatterns) {
      const matches = config.content.match(pattern);
      if (matches) {
        this.addIssue('errors', 'security',
          `${message}: ${matches[0].substring(0, 20)}...`
        );
      }
    }

    // Check for security best practices
    const securityKeywords = ['sanitize', 'validate', 'escape', 'csrf', 'xss', 'sql injection'];
    const hasSecurityGuidance = securityKeywords.some(keyword =>
      config.content.toLowerCase().includes(keyword)
    );

    if (!hasSecurityGuidance) {
      this.addIssue('suggestions', 'security',
        'Consider adding specific security guidelines (input validation, XSS prevention, etc.)'
      );
    }
  }

  /**
   * Run all validation rules
   */
  async validate() {
    try {
      const config = await this.readConfig();

      // Run all validation rules
      for (const [ruleName, ruleFunction] of Object.entries(this.rules)) {
        try {
          await ruleFunction(config);
        } catch (error) {
          this.addIssue('errors', ruleName,
            `Validation rule failed: ${error.message}`
          );
        }
      }

      return this.results;
    } catch (error) {
      this.addIssue('errors', 'general', error.message);
      return this.results;
    }
  }

  /**
   * Apply automatic fixes
   */
  async applyFixes() {
    if (!this.fix) {
      return;
    }

    const config = await this.readConfig();
    let modifiedContent = config.content;
    let fixCount = 0;

    // Apply fixes for fixable issues
    for (const issue of [...this.results.errors, ...this.results.warnings]) {
      if (issue.fixable && issue.autofix) {
        if (typeof issue.autofix === 'string') {
          // Simple string insertion
          modifiedContent = issue.autofix + modifiedContent;
          fixCount++;
          this.results.fixed.push(issue);
        } else if (typeof issue.autofix === 'function') {
          // Function-based fix
          const fixContent = issue.autofix();
          modifiedContent = fixContent + modifiedContent;
          fixCount++;
          this.results.fixed.push(issue);
        }
      }
    }

    if (fixCount > 0) {
      await fs.writeFile(this.masterFile, modifiedContent, 'utf8');
      this.log(`✅ Applied ${fixCount} automatic fixes`, 'green');
    }
  }

  /**
   * Print validation results
   */
  printResults() {
    console.log('\n📋 Configuration Validation Results\n');
    console.log('━'.repeat(50));

    // Print errors
    if (this.results.errors.length > 0) {
      this.log('\n❌ ERRORS:', 'red');
      for (const error of this.results.errors) {
        const line = error.line ? ` (line ${error.line})` : '';
        this.log(`   • ${error.message}${line}`, 'red');
      }
    }

    // Print warnings
    if (this.results.warnings.length > 0) {
      this.log('\n⚠️  WARNINGS:', 'yellow');
      for (const warning of this.results.warnings) {
        const line = warning.line ? ` (line ${warning.line})` : '';
        this.log(`   • ${warning.message}${line}`, 'yellow');
      }
    }

    // Print suggestions
    if (this.results.suggestions.length > 0) {
      this.log('\n💡 SUGGESTIONS:', 'blue');
      for (const suggestion of this.results.suggestions) {
        this.log(`   • ${suggestion.message}`, 'blue');
      }
    }

    // Print fixes applied
    if (this.results.fixed.length > 0) {
      this.log('\n🔧 FIXES APPLIED:', 'green');
      for (const fix of this.results.fixed) {
        this.log(`   • ${fix.message}`, 'green');
      }
    }

    // Summary
    console.log('\n━'.repeat(50));
    const total = this.results.errors.length + this.results.warnings.length + this.results.suggestions.length;

    if (total === 0) {
      this.log('✅ Configuration looks great! No issues found.', 'green');
    } else {
      this.log(`📊 Summary: ${this.results.errors.length} errors, ${this.results.warnings.length} warnings, ${this.results.suggestions.length} suggestions`, 'cyan');

      if (this.results.errors.length > 0) {
        this.log('❗ Please fix the errors before proceeding.', 'red');
      }
    }

    return this.results.errors.length === 0;
  }
}

// CLI Configuration
program
  .name('contexthub-validate')
  .description('ContextHub Configuration Validator & Linter')
  .version('1.0.7')
  .option('-w, --working-dir <dir>', 'Working directory', process.cwd())
  .option('-v, --verbose', 'Verbose output')
  .option('--strict', 'Strict validation mode')
  .option('--fix', 'Apply automatic fixes where possible')
  .option('--json', 'Output results in JSON format');

program.action(async (options) => {
  try {
    const validator = new ConfigValidator({
      workingDir: options.workingDir,
      verbose: options.verbose,
      strict: options.strict,
      fix: options.fix
    });

    const results = await validator.validate();

    if (options.fix) {
      await validator.applyFixes();
    }

    if (options.json) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      const isValid = validator.printResults();
      process.exit(isValid ? 0 : 1);
    }
  } catch (error) {
    console.error(`❌ Validation failed: ${error.message}`);
    process.exit(1);
  }
});

// Execute if run directly
if (require.main === module) {
  program.parse();
}

module.exports = ConfigValidator;
