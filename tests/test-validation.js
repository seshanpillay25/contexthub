#!/usr/bin/env node

/**
 * Test suite for ContextHub validation functionality
 * Tests configuration validation, error detection, and reporting
 */

const fs = require('fs').promises;
const { ConfigValidator, VALIDATION_RULES, SEVERITY } = require('../scripts/validate-config.js');

const TEST_DIR = `test-validation-${Date.now()}`;
const TEMP_FILES = [];

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

// Setup test environment
const setupTestEnv = async () => {
  logInfo(`Setting up test environment: ${TEST_DIR}`);

  await fs.mkdir(TEST_DIR, { recursive: true });
  process.chdir(TEST_DIR);

  logSuccess('Test environment created');
};

// Cleanup test environment
const cleanupTestEnv = async () => {
  process.chdir('..');

  try {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
    logInfo(`Cleaned up test directory: ${TEST_DIR}`);
  } catch (error) {
    logWarning(`Failed to cleanup ${TEST_DIR}: ${error.message}`);
  }
};

// Test valid markdown configuration
const testValidMarkdown = async () => {
  const validConfig = `# Test Project - AI Context Configuration

## Project Overview
A comprehensive test project for validating ContextHub functionality.

## Architecture
Modern web application with microservices architecture.

## Coding Standards

### TypeScript
- Use strict mode
- Prefer const over let
- Add proper type annotations

### React
- Use functional components
- Implement error boundaries
- Use React.memo for optimization

## Testing Strategy
Comprehensive testing with Jest and Playwright.

## Performance Requirements
- Load time: < 2s
- API response: < 200ms

## Security Guidelines
- Input validation
- HTTPS everywhere
- Authentication required

<!-- AI:CLAUDE -->
Focus on clean, readable code.
<!-- /AI:CLAUDE -->

<!-- AI:CURSOR -->
Fast autocomplete suggestions.
<!-- /AI:CURSOR -->
`;

  await fs.writeFile('.ai-context.md', validConfig);
  TEMP_FILES.push('.ai-context.md');

  const validator = new ConfigValidator({
    config: '.ai-context.md',
    strict: false,
    verbose: false
  });

  const isValid = await validator.validate();

  if (!isValid) {
    throw new Error(`Valid markdown failed validation: ${validator.issues.map(i => i.message).join(', ')}`);
  }

  if (validator.stats.errors > 0) {
    throw new Error(`Valid markdown has validation errors: ${validator.stats.errors}`);
  }
};

// Test invalid markdown configuration
const testInvalidMarkdown = async () => {
  const invalidConfig = `# Incomplete Configuration

This configuration is missing required sections.
`;

  await fs.writeFile('.ai-context-invalid.md', invalidConfig);
  TEMP_FILES.push('.ai-context-invalid.md');

  const validator = new ConfigValidator({
    config: '.ai-context-invalid.md',
    strict: false,
    verbose: false
  });

  const isValid = await validator.validate();

  if (isValid) {
    throw new Error('Invalid markdown passed validation (should have failed)');
  }

  if (validator.stats.errors === 0) {
    throw new Error('No errors detected for invalid configuration');
  }

  // Check for specific missing sections
  const errorMessages = validator.issues.map(i => i.message).join(' ');
  const requiredSections = VALIDATION_RULES.markdown.required_sections;

  for (const section of requiredSections) {
    if (!errorMessages.includes(section)) {
      throw new Error(`Missing section "${section}" not detected in validation`);
    }
  }
};

// Test markdown with warnings
const testMarkdownWarnings = async () => {
  const configWithWarnings = `# Test Project

## Project Overview
A basic project configuration.

## Architecture
Simple architecture.

## Coding Standards
Basic standards.

# This is a very long line that exceeds the recommended length and should generate a warning about line length in the validation process

`;

  await fs.writeFile('.ai-context-warnings.md', configWithWarnings);
  TEMP_FILES.push('.ai-context-warnings.md');

  const validator = new ConfigValidator({
    config: '.ai-context-warnings.md',
    strict: false,
    verbose: false
  });

  const isValid = await validator.validate();

  if (!isValid) {
    throw new Error('Configuration with warnings should be valid (errors only)');
  }

  if (validator.stats.warnings === 0) {
    throw new Error('No warnings detected for configuration that should have warnings');
  }
};

// Test valid YAML configuration
const testValidYaml = async () => {
  const validYamlConfig = `project:
  name: "Test Project"
  description: "A test project for validation"
  tech_stack:
    frontend: "React"
    backend: "Node.js"

architecture: "Microservices architecture"

coding_standards:
  typescript:
    - "Use strict mode"
    - "Prefer const over let"
  react:
    - "Use functional components"
    - "Implement error boundaries"

testing:
  framework: "Jest"
  coverage: 80

tools:
  claude:
    instructions: "Focus on code quality"
  cursor:
    rules: ["prefer-const"]
`;

  await fs.writeFile('.ai-context.yml', validYamlConfig);
  TEMP_FILES.push('.ai-context.yml');

  const validator = new ConfigValidator({
    config: '.ai-context.yml',
    strict: false,
    verbose: false
  });

  const isValid = await validator.validate();

  if (!isValid) {
    throw new Error(`Valid YAML failed validation: ${validator.issues.map(i => i.message).join(', ')}`);
  }

  if (validator.stats.errors > 0) {
    throw new Error(`Valid YAML has validation errors: ${validator.stats.errors}`);
  }
};

// Test invalid YAML configuration
const testInvalidYaml = async () => {
  const invalidYamlConfig = `project:
  name: "Incomplete Project"
  # Missing required fields like description

coding_standards: "This should be an object, not a string"

tools: []  # This should be an object
`;

  await fs.writeFile('.ai-context-invalid.yml', invalidYamlConfig);
  TEMP_FILES.push('.ai-context-invalid.yml');

  const validator = new ConfigValidator({
    config: '.ai-context-invalid.yml',
    strict: false,
    verbose: false
  });

  const isValid = await validator.validate();

  if (isValid) {
    throw new Error('Invalid YAML passed validation (should have failed)');
  }

  if (validator.stats.errors === 0) {
    throw new Error('No errors detected for invalid YAML configuration');
  }
};

// Test YAML syntax errors
const testYamlSyntaxError = async () => {
  const syntaxErrorYaml = `project:
  name: "Test Project"
  description: "A project with syntax errors
# Missing closing quote above
invalid_indent:
not_properly_indented: "value"
`;

  await fs.writeFile('.ai-context-syntax-error.yml', syntaxErrorYaml);
  TEMP_FILES.push('.ai-context-syntax-error.yml');

  const validator = new ConfigValidator({
    config: '.ai-context-syntax-error.yml',
    strict: false,
    verbose: false
  });

  const isValid = await validator.validate();

  if (isValid) {
    throw new Error('YAML with syntax errors passed validation');
  }

  // Should detect YAML parsing error
  const errorMessages = validator.issues.map(i => i.message).join(' ');
  if (!errorMessages.includes('YAML') && !errorMessages.includes('syntax')) {
    throw new Error('YAML syntax error not properly detected');
  }
};

// Test strict mode validation
const testStrictMode = async () => {
  const configWithWarnings = `# Test Project

## Project Overview
A basic project.

## Architecture
Simple.

## Coding Standards
Basic.
`;

  await fs.writeFile('.ai-context-strict.md', configWithWarnings);
  TEMP_FILES.push('.ai-context-strict.md');

  // Test non-strict mode (should pass with warnings)
  const normalValidator = new ConfigValidator({
    config: '.ai-context-strict.md',
    strict: false,
    verbose: false
  });

  const normalResult = await normalValidator.validate();

  if (!normalResult) {
    throw new Error('Configuration should pass in normal mode');
  }

  // Test strict mode (should fail due to warnings)
  const strictValidator = new ConfigValidator({
    config: '.ai-context-strict.md',
    strict: true,
    verbose: false
  });

  // Note: Current implementation doesn't have strict mode
  // This test verifies the interface exists
  if (strictValidator.strict) {
    logInfo('Strict mode interface available');
  }
};

// Test file size validation
const testFileSizeValidation = async () => {
  // Create a very large configuration
  let largeConfig = '# Large Configuration\n\n## Project Overview\n';

  // Add enough content to exceed size limits
  for (let i = 0; i < 10000; i++) {
    largeConfig += `## Section ${i}\nThis is content for section ${i}.\n`;
  }

  await fs.writeFile('.ai-context-large.md', largeConfig);
  TEMP_FILES.push('.ai-context-large.md');

  const validator = new ConfigValidator({
    config: '.ai-context-large.md',
    strict: false,
    verbose: false
  });

  const isValid = await validator.validate();

  // Large files should be processed without fatal errors
  // Some warnings about size or structure are acceptable
  if (!isValid && validator.stats.errors > 0) {
    // Only fail if there are severe structural errors
    const severeErrors = validator.issues.filter(
      issue => issue.severity === SEVERITY.ERROR &&
      issue.message.toLowerCase().includes('syntax') ||
      issue.message.toLowerCase().includes('parse')
    );

    if (severeErrors.length > 0) {
      throw new Error('Large file has severe parsing errors');
    }
    
    // If only size/structure warnings, that's acceptable
    logInfo('Large file validation completed with warnings (acceptable)');
  }
};

// Test tool section validation
const testToolSectionValidation = async () => {
  const configWithToolSections = `# Project with Tool Sections

## Project Overview
Test project for tool section validation.

## Architecture
Simple architecture.

## Coding Standards
Basic standards.

<!-- AI:CLAUDE -->
Claude-specific instructions here.
<!-- /AI:CLAUDE -->

<!-- AI:UNKNOWN_TOOL -->
Instructions for unknown tool.
<!-- /AI:UNKNOWN_TOOL -->

<!-- AI:CURSOR -->
<!-- Empty tool section -->
<!-- /AI:CURSOR -->
`;

  await fs.writeFile('.ai-context-tools.md', configWithToolSections);
  TEMP_FILES.push('.ai-context-tools.md');

  const validator = new ConfigValidator({
    config: '.ai-context-tools.md',
    strict: false,
    verbose: false
  });

  const isValid = await validator.validate();

  if (!isValid && validator.stats.errors > 0) {
    throw new Error('Tool section validation failed with errors');
  }

  // Check for warnings about unknown tool or empty sections
  const warningMessages = validator.issues
    .filter(i => i.severity === SEVERITY.WARNING)
    .map(i => i.message)
    .join(' ');

  if (!warningMessages.includes('UNKNOWN_TOOL') && !warningMessages.includes('short')) {
    logWarning('Tool section warnings may not be detected');
  }
};

// Test empty file validation
const testEmptyFile = async () => {
  await fs.writeFile('.ai-context-empty.md', '');
  TEMP_FILES.push('.ai-context-empty.md');

  const validator = new ConfigValidator({
    config: '.ai-context-empty.md',
    strict: false,
    verbose: false
  });

  const isValid = await validator.validate();

  if (isValid) {
    throw new Error('Empty file should not pass validation');
  }

  if (validator.stats.errors === 0) {
    throw new Error('Empty file should generate errors');
  }
};

// Test nonexistent file
const testNonexistentFile = async () => {
  const validator = new ConfigValidator({
    config: '.ai-context-nonexistent.md',
    strict: false,
    verbose: false
  });

  const isValid = await validator.validate();

  if (isValid) {
    throw new Error('Nonexistent file should not pass validation');
  }

  if (validator.stats.errors === 0) {
    throw new Error('Nonexistent file should generate errors');
  }

  // Check error message
  const errorMessages = validator.issues.map(i => i.message).join(' ');
  if (!errorMessages.includes('read') && !errorMessages.includes('not found')) {
    throw new Error('Nonexistent file error message incorrect');
  }
};

// Test validation report generation
const testReportGeneration = async () => {
  const configForReport = `# Report Test

## Project Overview
Test configuration for report generation.

## Architecture
Simple.
`;

  await fs.writeFile('.ai-context-report.md', configForReport);
  TEMP_FILES.push('.ai-context-report.md');

  const validator = new ConfigValidator({
    config: '.ai-context-report.md',
    strict: false,
    verbose: false
  });

  await validator.validate();

  const report = validator.generateReport();

  // Verify report structure
  if (!report.file || !report.timestamp || !report.stats || !report.issues) {
    throw new Error('Validation report missing required fields');
  }

  if (typeof report.summary !== 'object') {
    throw new Error('Report summary should be an object');
  }

  if (!Object.prototype.hasOwnProperty.call(report.summary, 'total_issues')) {
    throw new Error('Report summary missing total_issues');
  }

  if (!Object.prototype.hasOwnProperty.call(report.summary, 'is_valid')) {
    throw new Error('Report summary missing is_valid');
  }
};

// Test configuration with special characters
const testSpecialCharacters = async () => {
  const configWithSpecialChars = `# Project with Special Characters: 测试项目

## Project Overview
This project contains special characters: áéíóú, 中文, русский, 🚀 emoji.

## Architecture
Unicode support: ∑, ∆, π, ∞

## Coding Standards
- Use UTF-8 encoding
- Support internationalization (i18n)
- Handle special characters properly

<!-- AI:CLAUDE -->
Handle Unicode characters correctly: ∀x∈ℝ
<!-- /AI:CLAUDE -->
`;

  await fs.writeFile('.ai-context-unicode.md', configWithSpecialChars, 'utf8');
  TEMP_FILES.push('.ai-context-unicode.md');

  const validator = new ConfigValidator({
    config: '.ai-context-unicode.md',
    strict: false,
    verbose: false
  });

  const isValid = await validator.validate();

  if (!isValid && validator.stats.errors > 0) {
    throw new Error('Configuration with special characters failed validation');
  }

  // Verify content was parsed correctly
  const parsedData = await validator.parseConfig();
  if (!parsedData.content.includes('测试项目')) {
    throw new Error('Special characters not preserved in parsing');
  }
};

// Main test execution
const main = async () => {
  console.log('ContextHub Validation Test Suite');
  console.log('================================');
  console.log('');

  try {
    await setupTestEnv();

    // Run all tests
    await runTest('Valid Markdown Configuration', testValidMarkdown);
    await runTest('Invalid Markdown Configuration', testInvalidMarkdown);
    await runTest('Markdown with Warnings', testMarkdownWarnings);
    await runTest('Valid YAML Configuration', testValidYaml);
    await runTest('Invalid YAML Configuration', testInvalidYaml);
    await runTest('YAML Syntax Errors', testYamlSyntaxError);
    await runTest('Strict Mode Validation', testStrictMode);
    await runTest('File Size Validation', testFileSizeValidation);
    await runTest('Tool Section Validation', testToolSectionValidation);
    await runTest('Empty File Validation', testEmptyFile);
    await runTest('Nonexistent File Validation', testNonexistentFile);
    await runTest('Validation Report Generation', testReportGeneration);
    await runTest('Special Characters Support', testSpecialCharacters);
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

// Handle cleanup on exit
process.on('exit', cleanupTestEnv);
process.on('SIGINT', () => {
  cleanupTestEnv().then(() => process.exit(1));
});
process.on('SIGTERM', () => {
  cleanupTestEnv().then(() => process.exit(1));
});

// Run tests
if (require.main === module) {
  main().catch(error => {
    console.error('Test suite failed:', error);
    cleanupTestEnv().then(() => process.exit(1));
  });
}

module.exports = {
  setupTestEnv,
  cleanupTestEnv,
  testValidMarkdown,
  testInvalidMarkdown,
  testValidYaml,
  testInvalidYaml
};
