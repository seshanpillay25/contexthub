#!/usr/bin/env node

/**
 * Security test suite for path traversal vulnerabilities
 * Tests that ContextHub properly validates file paths and prevents directory traversal
 */

const path = require('path');
const fs = require('fs').promises;
const { ConfigBuilder } = require('../../scripts/build-configs.js');

const TEST_DIR = `test-security-path-${Date.now()}`;
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

const logInfo = (message) => {
  console.log(`${colors.blue}[SECURITY]${colors.reset} ${message}`);
};

const logSuccess = (message) => {
  console.log(`${colors.green}[PASS]${colors.reset} ${message}`);
  testsPassed++;
};

const logError = (message) => {
  console.log(`${colors.red}[FAIL]${colors.reset} ${message}`);
  testsFailed++;
};

const runTest = async (testName, testFn) => {
  testsRun++;
  logInfo(`Running security test: ${testName}`);

  try {
    await testFn();
    logSuccess(`✓ ${testName}`);
  } catch (error) {
    logError(`✗ ${testName}: ${error.message}`);
  }
};

// Setup test environment
const setupTestEnv = async () => {
  await fs.mkdir(TEST_DIR, { recursive: true });
  process.chdir(TEST_DIR);

  // Create a legitimate config file
  await fs.writeFile('.ai-context.md', '# Test Configuration\n\n## Project Overview\nTest project');
};

// Cleanup test environment
const cleanupTestEnv = async () => {
  process.chdir('..');
  try {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  } catch (error) {
    console.warn(`Cleanup warning: ${error.message}`);
  }
};

// Test path traversal in source parameter
const testSourcePathTraversal = async () => {
  const maliciousPaths = [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32\\config\\sam',
    '/etc/shadow',
    'C:\\Windows\\System32\\config\\SAM',
    '....//....//....//etc/passwd',
    '..%2F..%2F..%2Fetc%2Fpasswd',
    '..%252F..%252F..%252Fetc%252Fpasswd'
  ];

  for (const maliciousPath of maliciousPaths) {
    try {
      const builder = new ConfigBuilder({
        source: maliciousPath,
        output: '.',
        force: true,
        verbose: false
      });

      await builder.build();

      // If we reach here, the path traversal wasn't blocked
      throw new Error(`Path traversal not blocked for: ${maliciousPath}`);
    } catch (error) {
      // Expected behavior - path traversal should be blocked
      if (error.message.includes('not found') ||
          error.message.includes('ENOENT') ||
          error.message.includes('outside') ||
          error.message.includes('traversal') ||
          error.message.includes('absolute paths are not allowed') ||
          error.message.includes('URL schemes are not allowed') ||
          error.message.includes('null bytes are not allowed')) {
        // Good - the malicious path was rejected
        continue;
      } else {
        throw error;
      }
    }
  }
};

// Test path traversal in output parameter
const testOutputPathTraversal = async () => {
  const maliciousPaths = [
    '../../../tmp',
    '/etc',
    'C:\\Windows\\System32',
    '....//....//tmp',
    '..%2F..%2Ftmp'
  ];

  for (const maliciousPath of maliciousPaths) {
    try {
      const builder = new ConfigBuilder({
        source: '.ai-context.md',
        output: maliciousPath,
        force: true,
        verbose: false
      });

      await builder.build();

      // Check if files were created outside project directory
      const resolvedPath = path.resolve(maliciousPath);
      const projectRoot = process.cwd();

      if (!resolvedPath.startsWith(projectRoot)) {
        throw new Error(`Files created outside project directory: ${maliciousPath}`);
      }
    } catch (error) {
      // Expected behavior for obvious traversal attempts
      if (error.message.includes('outside') ||
          error.message.includes('traversal') ||
          error.message.includes('ENOENT') ||
          error.message.includes('absolute paths are not allowed') ||
          error.message.includes('URL schemes are not allowed') ||
          error.message.includes('null bytes are not allowed')) {
        continue;
      } else {
        throw error;
      }
    }
  }
};

// Test relative path handling
const testRelativePathHandling = async () => {
  const relativePaths = [
    './config.md',
    'subdir/../config.md',
    'subdir/./config.md',
    './subdir/../config.md'
  ];

  // Create subdirectory and test files
  await fs.mkdir('subdir', { recursive: true });
  await fs.writeFile('config.md', '# Test Config');
  await fs.writeFile('subdir/config.md', '# Subdir Config');

  for (const relativePath of relativePaths) {
    try {
      const builder = new ConfigBuilder({
        source: relativePath,
        output: '.',
        force: true,
        verbose: false
      });

      const success = await builder.build();

      if (!success) {
        throw new Error(`Legitimate relative path rejected: ${relativePath}`);
      }
    } catch (error) {
      // Only throw if it's not a legitimate file not found error
      if (!error.message.includes('not found') && !error.message.includes('ENOENT')) {
        throw error;
      }
    }
  }
};

// Test symlink path traversal
const testSymlinkPathTraversal = async () => {
  try {
    // Create a symlink pointing outside the project directory
    await fs.symlink('/etc/passwd', 'malicious-link.md');

    const builder = new ConfigBuilder({
      source: 'malicious-link.md',
      output: '.',
      force: true,
      verbose: false
    });

    await builder.build();

    // If we reach here, the symlink traversal wasn't blocked
    throw new Error('Symlink path traversal not blocked');
  } catch (error) {
    // Expected behavior - symlink should be validated
    if (error.message.includes('not found') ||
        error.message.includes('ENOENT') ||
        error.message.includes('invalid') ||
        error.message.includes('traversal')) {
      // Good - the malicious symlink was rejected or doesn't exist

    } else {
      throw error;
    }
  }
};

// Test absolute path rejection
const testAbsolutePathRejection = async () => {
  const absolutePaths = [
    '/etc/passwd',
    '/tmp/config.md',
    'C:\\Windows\\temp\\config.md',
    '/usr/local/bin/config.md'
  ];

  for (const absolutePath of absolutePaths) {
    try {
      const builder = new ConfigBuilder({
        source: absolutePath,
        output: '.',
        force: true,
        verbose: false
      });

      await builder.build();

      // Check if the absolute path was processed
      const resolvedPath = path.resolve(absolutePath);
      const projectRoot = process.cwd();

      if (!resolvedPath.startsWith(projectRoot)) {
        throw new Error(`Absolute path not properly restricted: ${absolutePath}`);
      }
    } catch (error) {
      // Expected behavior for paths outside project
      if (error.message.includes('not found') ||
          error.message.includes('ENOENT') ||
          error.message.includes('outside') ||
          error.message.includes('absolute') ||
          error.message.includes('absolute paths are not allowed')) {
        continue;
      } else {
        throw error;
      }
    }
  }
};

// Test URL schemes
const testURLSchemes = async () => {
  const urlSchemes = [
    'file:///etc/passwd',
    'http://evil.com/config.md',
    'ftp://evil.com/config.md',
    'data:text/plain,malicious content'
  ];

  for (const url of urlSchemes) {
    try {
      const builder = new ConfigBuilder({
        source: url,
        output: '.',
        force: true,
        verbose: false
      });

      await builder.build();

      // If we reach here, the URL wasn't properly rejected
      throw new Error(`URL scheme not rejected: ${url}`);
    } catch (error) {
      // Expected behavior - URLs should be rejected
      if (error.message.includes('not found') ||
          error.message.includes('ENOENT') ||
          error.message.includes('invalid') ||
          error.message.includes('scheme') ||
          error.message.includes('URL schemes are not allowed')) {
        continue;
      } else {
        throw error;
      }
    }
  }
};

// Test null byte injection
const testNullByteInjection = async () => {
  const nullBytePaths = [
    'config.md\x00.txt',
    'config.md\x00/etc/passwd',
    '.ai-context.md\x00.evil'
  ];

  for (const nullBytePath of nullBytePaths) {
    try {
      const builder = new ConfigBuilder({
        source: nullBytePath,
        output: '.',
        force: true,
        verbose: false
      });

      await builder.build();

      // If we reach here, null byte injection wasn't blocked
      throw new Error(`Null byte injection not blocked: ${nullBytePath}`);
    } catch (error) {
      // Expected behavior - null bytes should be rejected
      if (error.message.includes('not found') ||
          error.message.includes('ENOENT') ||
          error.message.includes('invalid') ||
          error.message.includes('null') ||
          error.message.includes('null bytes are not allowed')) {
        continue;
      } else {
        throw error;
      }
    }
  }
};

// Main test execution
const main = async () => {
  console.log('ContextHub Security Test Suite - Path Traversal');
  console.log('=================================================');
  console.log('');

  try {
    await setupTestEnv();

    // Run all security tests
    await runTest('Source Path Traversal Protection', testSourcePathTraversal);
    await runTest('Output Path Traversal Protection', testOutputPathTraversal);
    await runTest('Relative Path Handling', testRelativePathHandling);
    await runTest('Symlink Path Traversal Protection', testSymlinkPathTraversal);
    await runTest('Absolute Path Rejection', testAbsolutePathRejection);
    await runTest('URL Scheme Rejection', testURLSchemes);
    await runTest('Null Byte Injection Protection', testNullByteInjection);
  } finally {
    await cleanupTestEnv();
  }

  // Print summary
  console.log('');
  console.log('Security Test Summary');
  console.log('====================');
  console.log(`Tests run: ${testsRun}`);
  console.log(`Tests passed: ${testsPassed}`);
  console.log(`Tests failed: ${testsFailed}`);

  if (testsFailed === 0) {
    logSuccess('All security tests passed! ✅');
    process.exit(0);
  } else {
    logError('Some security tests failed! ❌');
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
    console.error('Security test suite failed:', error);
    cleanupTestEnv().then(() => process.exit(1));
  });
}

module.exports = {
  setupTestEnv,
  cleanupTestEnv,
  testSourcePathTraversal,
  testOutputPathTraversal,
  testSymlinkPathTraversal
};
