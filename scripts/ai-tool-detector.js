#!/usr/bin/env node

/**
 * AI Tool Detection Module
 * Automatically detects installed AI coding assistants and suggests optimal configurations
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const os = require('os');

const execAsync = promisify(exec);

class AIToolDetector {
  constructor(options = {}) {
    this.workingDir = options.workingDir || process.cwd();
    this.verbose = options.verbose || false;
    this.homeDir = os.homedir();

    // Tool detection strategies
    this.detectionStrategies = {
      vscode: this.detectVSCodeExtensions.bind(this),
      executables: this.detectExecutables.bind(this),
      projectConfigs: this.detectProjectConfigs.bind(this),
      packageJson: this.detectFromPackageJson.bind(this),
      gitConfigs: this.detectFromGitConfigs.bind(this)
    };

    // AI Tool definitions with detection criteria
    this.aiTools = {
      claude: {
        name: 'Claude Code',
        configFile: 'CLAUDE.md',
        description: 'Anthropic Claude Code assistant',
        detectionCriteria: {
          vscode: ['anthropic.claude-code'],
          executables: ['claude', 'claude-code'],
          projectConfigs: ['CLAUDE.md'],
          packageDeps: ['@anthropic-ai/claude']
        },
        confidence: 0
      },
      cursor: {
        name: 'Cursor',
        configFile: '.cursorrules',
        description: 'Cursor AI-powered editor',
        detectionCriteria: {
          vscode: ['cursor-ai.cursor'],
          executables: ['cursor'],
          projectConfigs: ['.cursorrules', '.cursor'],
          packageDeps: ['cursor-ai']
        },
        confidence: 0
      },
      copilot: {
        name: 'GitHub Copilot',
        configFile: '.github/copilot-instructions.md',
        description: 'GitHub Copilot AI assistant',
        detectionCriteria: {
          vscode: ['github.copilot', 'github.copilot-chat'],
          executables: ['gh'],
          projectConfigs: ['.github/copilot-instructions.md', '.github/copilot.yml'],
          packageDeps: ['@octokit/rest', 'github-copilot']
        },
        confidence: 0
      },
      codeium: {
        name: 'Codeium',
        configFile: '.codeium/instructions.md',
        description: 'Codeium AI coding assistant',
        detectionCriteria: {
          vscode: ['codeium.codeium'],
          executables: ['codeium'],
          projectConfigs: ['.codeium/instructions.md', '.codeium/config.json'],
          packageDeps: ['codeium']
        },
        confidence: 0
      },
      continue: {
        name: 'Continue',
        configFile: '.continue/context.md',
        description: 'Continue AI coding assistant',
        detectionCriteria: {
          vscode: ['continue.continue'],
          executables: ['continue'],
          projectConfigs: ['.continue/context.md', '.continue/config.json'],
          packageDeps: ['continue-ai']
        },
        confidence: 0
      },
      aider: {
        name: 'Aider',
        configFile: '.aider.conf.yml',
        description: 'Aider AI pair programming',
        detectionCriteria: {
          vscode: ['aider.aider'],
          executables: ['aider'],
          projectConfigs: ['.aider.conf.yml', '.aider'],
          packageDeps: ['aider-chat']
        },
        confidence: 0
      },
      tabnine: {
        name: 'Tabnine',
        configFile: '.tabnine/config.json',
        description: 'Tabnine AI code completion',
        detectionCriteria: {
          vscode: ['tabnine.tabnine-vscode'],
          executables: ['tabnine'],
          projectConfigs: ['.tabnine/config.json'],
          packageDeps: ['tabnine']
        },
        confidence: 0
      }
    };
  }

  /**
   * Main detection method
   */
  async detectAllTools() {
    if (this.verbose) {
      console.log('🔍 Scanning for AI coding assistants...\n');
    }

    // Run all detection strategies
    const detectionResults = {};

    for (const [strategy, detector] of Object.entries(this.detectionStrategies)) {
      try {
        const result = await detector();
        detectionResults[strategy] = result;
        if (this.verbose) {
          console.log(`✅ ${strategy} detection completed`);
        }
      } catch (error) {
        if (this.verbose) {
          console.log(`⚠️ ${strategy} detection failed:`, error.message);
        }
        detectionResults[strategy] = { found: [], error: error.message };
      }
    }

    // Calculate confidence scores
    this.calculateConfidenceScores(detectionResults);

    // Generate recommendations
    const recommendations = this.generateRecommendations();

    return {
      detectionResults,
      recommendations,
      detectedTools: this.getDetectedTools(),
      projectType: await this.detectProjectType()
    };
  }

  /**
   * Detect VS Code extensions
   */
  async detectVSCodeExtensions() {
    const found = [];
    const vscodeDir = path.join(this.homeDir, '.vscode', 'extensions');

    try {
      await fs.access(vscodeDir);
      const extensions = await fs.readdir(vscodeDir);

      for (const [toolKey, tool] of Object.entries(this.aiTools)) {
        for (const extensionId of tool.detectionCriteria.vscode || []) {
          const extensionFound = extensions.some(ext => ext.startsWith(extensionId));
          if (extensionFound) {
            found.push({
              tool: toolKey,
              name: tool.name,
              type: 'vscode-extension',
              evidence: extensionId
            });
          }
        }
      }
    } catch (error) {
      // VS Code not installed or extensions directory not found
    }

    return { found };
  }

  /**
   * Detect system executables
   */
  async detectExecutables() {
    const found = [];

    for (const [toolKey, tool] of Object.entries(this.aiTools)) {
      for (const executable of tool.detectionCriteria.executables || []) {
        try {
          const command = process.platform === 'win32' ? `where ${executable}` : `which ${executable}`;
          const { stdout } = await execAsync(command);

          if (stdout.trim()) {
            found.push({
              tool: toolKey,
              name: tool.name,
              type: 'executable',
              evidence: stdout.trim(),
              path: stdout.trim()
            });
          }
        } catch (error) {
          // Executable not found
        }
      }
    }

    return { found };
  }

  /**
   * Detect project-specific configuration files
   */
  async detectProjectConfigs() {
    const found = [];

    for (const [toolKey, tool] of Object.entries(this.aiTools)) {
      for (const configFile of tool.detectionCriteria.projectConfigs || []) {
        const configPath = path.join(this.workingDir, configFile);

        try {
          await fs.access(configPath);
          const stats = await fs.stat(configPath);

          found.push({
            tool: toolKey,
            name: tool.name,
            type: 'project-config',
            evidence: configFile,
            path: configPath,
            size: stats.size,
            modified: stats.mtime
          });
        } catch (error) {
          // Config file not found
        }
      }
    }

    return { found };
  }

  /**
   * Detect from package.json dependencies
   */
  async detectFromPackageJson() {
    const found = [];
    const packageJsonPath = path.join(this.workingDir, 'package.json');

    try {
      const packageContent = await fs.readFile(packageJsonPath, 'utf8');
      const packageData = JSON.parse(packageContent);

      const allDeps = {
        ...packageData.dependencies || {},
        ...packageData.devDependencies || {},
        ...packageData.peerDependencies || {}
      };

      for (const [toolKey, tool] of Object.entries(this.aiTools)) {
        for (const dep of tool.detectionCriteria.packageDeps || []) {
          if (allDeps[dep]) {
            found.push({
              tool: toolKey,
              name: tool.name,
              type: 'package-dependency',
              evidence: `${dep}@${allDeps[dep]}`,
              dependency: dep,
              version: allDeps[dep]
            });
          }
        }
      }
    } catch (error) {
      // package.json not found or invalid JSON
    }

    return { found };
  }

  /**
   * Detect from git configurations
   */
  async detectFromGitConfigs() {
    const found = [];

    try {
      // Check for GitHub Copilot in git config
      const { stdout } = await execAsync('git config --list');

      if (stdout.includes('copilot') || stdout.includes('github.com')) {
        found.push({
          tool: 'copilot',
          name: 'GitHub Copilot',
          type: 'git-config',
          evidence: 'GitHub configuration detected'
        });
      }
    } catch (error) {
      // Git not available or no config
    }

    return { found };
  }

  /**
   * Calculate confidence scores based on detection results
   */
  calculateConfidenceScores(detectionResults) {
    // Reset confidence scores
    Object.keys(this.aiTools).forEach(tool => {
      this.aiTools[tool].confidence = 0;
    });

    // Weight different detection methods
    const weights = {
      vscode: 0.4,
      executables: 0.3,
      projectConfigs: 0.2,
      packageJson: 0.1,
      gitConfigs: 0.1
    };

    for (const [strategy, result] of Object.entries(detectionResults)) {
      if (result.found) {
        for (const detection of result.found) {
          if (this.aiTools[detection.tool]) {
            this.aiTools[detection.tool].confidence += weights[strategy] || 0.1;
          }
        }
      }
    }

    // Normalize confidence scores to 0-100
    Object.keys(this.aiTools).forEach(tool => {
      this.aiTools[tool].confidence = Math.min(100, this.aiTools[tool].confidence * 100);
    });
  }

  /**
   * Generate recommendations based on detection results
   */
  generateRecommendations() {
    const recommendations = {
      highConfidence: [],
      suggested: [],
      optional: []
    };

    for (const [toolKey, tool] of Object.entries(this.aiTools)) {
      if (tool.confidence >= 70) {
        recommendations.highConfidence.push({
          tool: toolKey,
          name: tool.name,
          confidence: tool.confidence,
          reason: `Detected with high confidence (${Math.round(tool.confidence)}%)`
        });
      } else if (tool.confidence >= 30) {
        recommendations.suggested.push({
          tool: toolKey,
          name: tool.name,
          confidence: tool.confidence,
          reason: `Partially detected (${Math.round(tool.confidence)}%)`
        });
      } else if (tool.confidence > 0) {
        recommendations.optional.push({
          tool: toolKey,
          name: tool.name,
          confidence: tool.confidence,
          reason: `Some evidence found (${Math.round(tool.confidence)}%)`
        });
      }
    }

    return recommendations;
  }

  /**
   * Get tools that were detected with any confidence
   */
  getDetectedTools() {
    return Object.entries(this.aiTools)
      .filter(([_, tool]) => tool.confidence > 0)
      .sort(([, a], [, b]) => b.confidence - a.confidence)
      .map(([key, tool]) => ({
        key,
        name: tool.name,
        configFile: tool.configFile,
        confidence: tool.confidence
      }));
  }

  /**
   * Detect project type based on files and dependencies
   */
  async detectProjectType() {
    const indicators = {
      React: ['package.json && react'],
      Vue: ['package.json && vue'],
      Angular: ['package.json && @angular/core'],
      'Next.js': ['package.json && next'],
      'Node.js': ['package.json && !react && !vue && !@angular/core'],
      Python: ['requirements.txt', 'pyproject.toml', '*.py'],
      Django: ['manage.py', 'requirements.txt && django'],
      Flask: ['app.py', 'requirements.txt && flask'],
      Rust: ['Cargo.toml'],
      Go: ['go.mod', 'main.go'],
      Java: ['pom.xml', 'build.gradle'],
      'C#': ['*.csproj', '*.sln'],
      PHP: ['composer.json'],
      Ruby: ['Gemfile'],
      Swift: ['Package.swift'],
      Kotlin: ['build.gradle.kts']
    };

    const projectTypes = [];

    for (const [type, files] of Object.entries(indicators)) {
      for (const filePattern of files) {
        if (filePattern.includes('&&')) {
          // Complex condition (e.g., package.json && react)
          const [file, dep] = filePattern.split(' && ');

          if (await this.fileExists(file.trim())) {
            if (file.trim() === 'package.json') {
              const hasDependent = await this.hasPackageDependency(dep.trim());
              if (hasDependent) {
                projectTypes.push(type);
                break;
              }
            }
          }
        } else {
          // Simple file check
          if (await this.fileExists(filePattern)) {
            projectTypes.push(type);
            break;
          }
        }
      }
    }

    return projectTypes;
  }

  /**
   * Check if file exists
   */
  async fileExists(filename) {
    try {
      await fs.access(path.join(this.workingDir, filename));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if package.json has specific dependency
   */
  async hasPackageDependency(depName) {
    try {
      const packagePath = path.join(this.workingDir, 'package.json');
      const content = await fs.readFile(packagePath, 'utf8');
      const pkg = JSON.parse(content);

      const allDeps = {
        ...pkg.dependencies || {},
        ...pkg.devDependencies || {},
        ...pkg.peerDependencies || {}
      };

      return Object.keys(allDeps).some(dep =>
        dep.includes(depName) || dep === depName
      );
    } catch {
      return false;
    }
  }

  /**
   * Print detection results in a formatted way
   */
  printResults(results) {
    const output = ['\n🤖 AI Tool Detection Results'];
    output.push('━'.repeat(40));

    let hasResults = false;

    // High confidence detections
    if (results.recommendations.highConfidence.length > 0) {
      output.push('\n✅ HIGH CONFIDENCE DETECTIONS:');
      for (const rec of results.recommendations.highConfidence) {
        output.push(`   • ${rec.name} (${Math.round(rec.confidence)}% confidence)`);
      }
      hasResults = true;
    }

    // Suggested tools
    if (results.recommendations.suggested.length > 0) {
      output.push('\n🔍 SUGGESTED TOOLS:');
      for (const rec of results.recommendations.suggested) {
        output.push(`   • ${rec.name} (${Math.round(rec.confidence)}% confidence)`);
      }
      hasResults = true;
    }

    // Optional tools
    if (results.recommendations.optional.length > 0) {
      output.push('\n💡 OPTIONAL TOOLS:');
      for (const rec of results.recommendations.optional) {
        output.push(`   • ${rec.name} (${Math.round(rec.confidence)}% confidence)`);
      }
      hasResults = true;
    }

    // Project type
    if (results.projectType.length > 0) {
      output.push('\n📋 DETECTED PROJECT TYPES:');
      for (const type of results.projectType) {
        output.push(`   • ${type}`);
      }
      hasResults = true;
    }

    if (!hasResults) {
      output.push('\n💡 No AI tools detected in your environment.');
      output.push('   You can still set up any tools manually.');
    }

    output.push('━'.repeat(40));

    // Print everything at once
    console.log(output.join('\n'));

    return results;
  }
}

module.exports = AIToolDetector;

// CLI usage
if (require.main === module) {
  const detector = new AIToolDetector({ verbose: true });

  detector.detectAllTools()
    .then(results => detector.printResults(results))
    .catch(error => {
      console.error('❌ Detection failed:', error.message);
      process.exit(1);
    });
}
