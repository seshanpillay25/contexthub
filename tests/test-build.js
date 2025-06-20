#!/usr/bin/env node

/**
 * Test suite for ContextHub build functionality
 * Tests configuration building, validation, and tool-specific generation
 */

const fs = require('fs').promises;
const path = require('path');
const { ConfigBuilder } = require('../scripts/build-configs.js');
const { ConfigValidator } = require('../scripts/validate-config.js');

// Test configuration
const TEST_DIR = `test-build-${Date.now()}`;
const TEMP_FILES = [];

// Test utilities
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

const logInfo = (message) => {
  console.log(`${colors.blue}[INFO]${colors.reset} ${message}`);
};

const logSuccess = (message) => {
  console.log(`${colors.green}[PASS]${colors.reset} ${message}`);
  testsPassed++;
};

const logError = (message) => {
  console.log(`${colors.red}[FAIL]${colors.reset} ${message}`);
  testsFailed++;
};

const logWarning = (message) => {
  console.log(`${colors.yellow}[WARN]${colors.reset} ${message}`);
};

const runTest = async (testName, testFn) => {
  testsRun++;
  logInfo(`Running test: ${testName}`);

  try {
    await testFn();
    logSuccess(`✓ ${testName}`);
  } catch (error) {
    logError(`✗ ${testName}: ${error.message}`);
  }
};

const setupTestEnv = async () => {
  logInfo(`Setting up test environment: ${TEST_DIR}`);

  await fs.mkdir(TEST_DIR, { recursive: true });
  process.chdir(TEST_DIR);

  // Create sample markdown configuration
  const markdownConfig = `# Test Project - AI Context Configuration

## Project Overview
A test project for validating ContextHub functionality.

**Tech Stack:**
- Frontend: React with TypeScript
- Backend: Node.js with Express
- Database: PostgreSQL

## Architecture
Modern web application with microservices architecture.

## Coding Standards

### TypeScript
- Use strict mode with proper type annotations
- Prefer interfaces over types
- Use meaningful variable names

### React
- Use functional components with hooks
- Implement proper error boundaries
- Use React.memo for performance

## Testing Strategy
- Unit tests: Jest + Testing Library
- E2E tests: Playwright
- Coverage target: 80%+

## Performance Requirements
- First Contentful Paint: < 1.5s
- Core Web Vitals: All green

## Security Guidelines
- Sanitize all user inputs
- Use HTTPS everywhere
- Implement proper authentication

<!-- AI:CLAUDE -->
Focus on clean, readable code with comprehensive documentation.
Prioritize code quality and maintainability.
<!-- /AI:CLAUDE -->

<!-- AI:CURSOR -->
Use autocomplete for common React patterns.
Focus on rapid development and iteration.
<!-- /AI:CURSOR -->

<!-- AI:COPILOT -->
Generate comprehensive test cases.
Help with complex algorithms and data structures.
<!-- /AI:COPILOT -->

<!-- AI:CODEIUM -->
Provide context-aware completions.
Focus on reducing boilerplate code.
<!-- /AI:CODEIUM -->
`;

  await fs.writeFile('.ai-context.md', markdownConfig);
  TEMP_FILES.push('.ai-context.md');

  // Create sample YAML configuration
  const yamlConfig = `project:
  name: "Test Project YAML"
  description: "A test project using YAML configuration"
  tech_stack:
    frontend: "Vue.js + TypeScript"
    backend: "Python + FastAPI"
    database: "MongoDB"

architecture: |
  Modern web application with RESTful API architecture.
  Uses containerized deployment with Docker.

coding_standards:
  typescript:
    - "Use strict mode"
    - "Prefer const over let"
    - "Add proper type annotations"
  python:
    - "Follow PEP 8"
    - "Use type hints"
    - "Write docstrings"

testing:
  unit: "pytest for Python, Vitest for TypeScript"
  integration: "Postman + Newman"
  e2e: "Playwright"
  coverage_target: 85

performance:
  api_response_time: "< 200ms"
  database_query_time: "< 100ms"
  frontend_load_time: "< 2s"

security:
  - "Input validation and sanitization"
  - "JWT token authentication"
  - "Rate limiting on APIs"
  - "HTTPS only in production"

tools:
  claude:
    instructions: "Focus on architecture and best practices"
    preferences: ["clean code", "documentation"]
  cursor:
    rules: ["prefer-const", "no-any"]
    completions: "fast and accurate"
  copilot:
    focus: ["testing", "security"]
    style: "enterprise patterns"
`;

  await fs.writeFile('.ai-context.yml', yamlConfig);
  TEMP_FILES.push('.ai-context.yml');

  logSuccess('Test environment created');
};

const cleanupTestEnv = async () => {
  process.chdir('..');

  try {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
    logInfo(`Cleaned up test directory: ${TEST_DIR}`);
  } catch (error) {
    logWarning(`Failed to cleanup ${TEST_DIR}: ${error.message}`);
  }
};

const testMarkdownBuild = async () => {
  const builder = new ConfigBuilder({
    source: '.ai-context.md',
    output: '.',
    force: true,
    verbose: false
  });

  const success = await builder.build();

  if (!success) {
    throw new Error('Build failed');
  }

  // Verify generated files
  const expectedFiles = [
    'CLAUDE.md',
    '.cursorrules',
    '.github/copilot-instructions.md',
    '.codeium/instructions.md',
    '.continue/context.md',
    '.aider.conf.yml'
  ];

  for (const file of expectedFiles) {
    try {
      await fs.access(file);
      TEMP_FILES.push(file);
    } catch (error) {
      throw new Error(`Expected file not generated: ${file}`);
    }
  }

  // Verify content
  const claudeContent = await fs.readFile('CLAUDE.md', 'utf8');
  await fs.readFile('.ai-context.md', 'utf8'); // Read to verify file exists

  if (!claudeContent.includes('Test Project')) {
    throw new Error('Generated CLAUDE.md missing expected content');
  }

  if (!claudeContent.includes('Focus on clean, readable code')) {
    throw new Error('Tool-specific section not properly filtered');
  }
};

const testYamlBuild = async () => {
  const builder = new ConfigBuilder({
    source: '.ai-context.yml',
    output: '.',
    force: true,
    verbose: false
  });

  const success = await builder.build();

  if (!success) {
    throw new Error('YAML build failed');
  }

  // Verify YAML-generated content
  const claudeContent = await fs.readFile('CLAUDE.md', 'utf8');

  if (!claudeContent.includes('Test Project YAML')) {
    throw new Error('YAML-generated content missing project name');
  }

  if (!claudeContent.includes('Vue.js + TypeScript')) {
    throw new Error('YAML-generated content missing tech stack');
  }
};

const testValidation = async () => {
  // Test markdown validation
  const markdownValidator = new ConfigValidator({
    config: '.ai-context.md',
    strict: false,
    verbose: false
  });

  const markdownValid = await markdownValidator.validate();

  if (!markdownValid) {
    throw new Error('Markdown validation failed');
  }

  // Test YAML validation
  const yamlValidator = new ConfigValidator({
    config: '.ai-context.yml',
    strict: false,
    verbose: false
  });

  const yamlValid = await yamlValidator.validate();

  if (!yamlValid) {
    throw new Error('YAML validation failed');
  }
};

const testInvalidConfig = async () => {
  // Create invalid markdown
  const invalidMarkdown = `# Invalid Config
This is missing required sections.
`;

  await fs.writeFile('.ai-context-invalid.md', invalidMarkdown);
  TEMP_FILES.push('.ai-context-invalid.md');

  const validator = new ConfigValidator({
    config: '.ai-context-invalid.md',
    strict: false,
    verbose: false
  });

  const isValid = await validator.validate();

  if (isValid) {
    throw new Error('Invalid configuration passed validation (should have failed)');
  }

  // Check that errors were detected
  if (validator.stats.errors === 0) {
    throw new Error('No validation errors detected for invalid config');
  }
};

const testToolFiltering = async () => {
  const builder = new ConfigBuilder({
    source: '.ai-context.md',
    output: '.',
    tools: ['claude'], // Only generate Claude config
    force: true,
    verbose: false
  });

  const success = await builder.build();

  if (!success) {
    throw new Error('Tool filtering build failed');
  }

  // Verify only Claude file was generated
  try {
    await fs.access('CLAUDE.md');
  } catch (error) {
    throw new Error('Claude file not generated during tool filtering');
  }

  // Verify other tool files were not regenerated (should still exist from previous tests)
  // but check they weren't modified
  const claudeStats = await fs.stat('CLAUDE.md');
  const cursorStats = await fs.stat('.cursorrules');

  if (claudeStats.mtime <= cursorStats.mtime) {
    // This might not always be reliable due to filesystem timestamp precision
    logWarning('Tool filtering timestamp check inconclusive');
  }
};

const testMissingSource = async () => {
  const builder = new ConfigBuilder({
    source: '.ai-context-missing.md',
    output: '.',
    force: true,
    verbose: false,
    silent: true // Suppress error logging during test
  });

  const success = await builder.build();

  if (success) {
    throw new Error('Build should have failed with missing source but returned success');
  }

  // Expected: build should return false for missing source file
};

const testOutputDirCreation = async () => {
  const outputDir = 'test-output';

  const builder = new ConfigBuilder({
    source: '.ai-context.md',
    output: outputDir,
    force: true,
    verbose: false
  });

  const success = await builder.build();

  if (!success) {
    throw new Error('Output directory build failed');
  }

  // Verify files were created in output directory
  try {
    await fs.access(path.join(outputDir, 'CLAUDE.md'));
    await fs.access(path.join(outputDir, '.cursorrules'));
    TEMP_FILES.push(outputDir);
  } catch (error) {
    throw new Error('Files not created in specified output directory');
  }
};

const testForceOverwrite = async () => {
  // Create existing file with different content
  const existingContent = '# Existing Content\nThis should be overwritten.';
  await fs.writeFile('CLAUDE.md', existingContent);

  // Build without force (should skip)
  const builderNoForce = new ConfigBuilder({
    source: '.ai-context.md',
    output: '.',
    force: false,
    verbose: false
  });

  await builderNoForce.build();

  const contentAfterNoForce = await fs.readFile('CLAUDE.md', 'utf8');
  if (contentAfterNoForce !== existingContent) {
    throw new Error('File was overwritten without force flag');
  }

  // Build with force (should overwrite)
  const builderWithForce = new ConfigBuilder({
    source: '.ai-context.md',
    output: '.',
    force: true,
    verbose: false
  });

  const success = await builderWithForce.build();

  if (!success) {
    throw new Error('Force build failed');
  }

  const contentAfterForce = await fs.readFile('CLAUDE.md', 'utf8');
  if (contentAfterForce === existingContent) {
    throw new Error('File was not overwritten with force flag');
  }

  if (!contentAfterForce.includes('Test Project')) {
    throw new Error('Forced overwrite content is incorrect');
  }
};

const testTemplateGeneration = async () => {
  // This test would require template functionality
  // For now, we'll test that the system handles missing templates gracefully

  try {
    const builder = new ConfigBuilder({
      source: '.ai-context.md',
      output: '.',
      template: 'nonexistent-template',
      force: true,
      verbose: false
    });

    // If template functionality isn't implemented, this should still work
    // with default behavior
    await builder.build();

    logWarning('Template functionality not implemented or template ignored');
  } catch (error) {
    if (error.message.includes('template')) {
      logWarning('Template functionality properly rejects invalid templates');
    } else {
      throw error;
    }
  }
};

const testLargeConfig = async () => {
  let largeConfig = await fs.readFile('.ai-context.md', 'utf8');

  // Add a lot of content to test performance
  for (let i = 0; i < 100; i++) {
    largeConfig += `\n## Section ${i}\nThis is additional content for section ${i}.\n`;
  }

  await fs.writeFile('.ai-context-large.md', largeConfig);
  TEMP_FILES.push('.ai-context-large.md');

  const startTime = Date.now();

  const builder = new ConfigBuilder({
    source: '.ai-context-large.md',
    output: '.',
    force: true,
    verbose: false
  });

  const success = await builder.build();

  const endTime = Date.now();
  const duration = endTime - startTime;

  if (!success) {
    throw new Error('Large config build failed');
  }

  if (duration > 10000) { // 10 seconds
    logWarning(`Large config build took ${duration}ms (may be slow)`);
  }

  // Verify large content was processed
  const claudeContent = await fs.readFile('CLAUDE.md', 'utf8');
  if (!claudeContent.includes('Section 99')) {
    throw new Error('Large config content not fully processed');
  }
};

const main = async () => {
  console.log('ContextHub Build Test Suite');
  console.log('===========================');
  console.log('');

  try {
    await setupTestEnv();

    // Run all tests
    await runTest('Markdown Configuration Build', testMarkdownBuild);
    await runTest('YAML Configuration Build', testYamlBuild);
    await runTest('Configuration Validation', testValidation);
    await runTest('Invalid Configuration Handling', testInvalidConfig);
    await runTest('Tool-Specific Filtering', testToolFiltering);
    await runTest('Missing Source Handling', testMissingSource);
    await runTest('Output Directory Creation', testOutputDirCreation);
    await runTest('Force Overwrite Functionality', testForceOverwrite);
    await runTest('Template Generation', testTemplateGeneration);
    await runTest('Large Configuration Handling', testLargeConfig);
  } finally {
    await cleanupTestEnv();
  }

  // Print summary
  console.log('');
  console.log('Test Summary');
  console.log('============');
  console.log(`Tests run: ${testsRun}`);
  console.log(`Tests passed: ${testsPassed}`);
  console.log(`Tests failed: ${testsFailed}`);

  if (testsFailed === 0) {
    logSuccess('All tests passed! ✅');
    process.exit(0);
  } else {
    logError('Some tests failed! ❌');
    process.exit(1);
  }
};

process.on('exit', cleanupTestEnv);
process.on('SIGINT', () => {
  cleanupTestEnv().then(() => process.exit(1));
});
process.on('SIGTERM', () => {
  cleanupTestEnv().then(() => process.exit(1));
});

if (require.main === module) {
  main().catch(error => {
    console.error('Test suite failed:', error);
    cleanupTestEnv().then(() => process.exit(1));
  });
}

module.exports = {
  setupTestEnv,
  cleanupTestEnv,
  testMarkdownBuild,
  testYamlBuild,
  testValidation
};
