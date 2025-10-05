#!/usr/bin/env node

/**
 * Production Build Verification Script
 * Ensures no debug code is included in production builds
 */

import fs from 'fs';
import path from 'path';

const distPath = './dist';
const issues = [];

console.log('🔍 Verifying production build...\n');

// Check if dist directory exists
if (!fs.existsSync(distPath)) {
  console.error('❌ No dist directory found. Run npm run build first.');
  process.exit(1);
}

// Check for debug console logs
function checkForDebugLogs(filePath, content) {
  const debugPatterns = [
    /console\.log\(/g,
    /console\.debug\(/g,
    /console\.warn\(/g,
    /debugLog\(/g,
    /debugWarn\(/g,
    /debugError\(/g,
  ];

  debugPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      issues.push({
        file: filePath,
        issue: `Found debug logging: ${matches[0]}`,
        severity: 'high'
      });
    }
  });
}

// Check for debug components
function checkForDebugComponents(filePath, content) {
  const debugComponents = [
    'TokenDebugger',
    'NotificationDebugger', 
    'NotificationAPITester',
    'TokenExpirationDebugger',
    'CommunicationAnalyzer',
  ];

  debugComponents.forEach(component => {
    if (content.includes(component)) {
      issues.push({
        file: filePath,
        issue: `Found debug component: ${component}`,
        severity: 'critical'
      });
    }
  });
}

// Check for development-only code
function checkForDevCode(filePath, content) {
  const devPatterns = [
    /import\.meta\.env\.DEV/g,
    /process\.env\.NODE_ENV.*development/g,
    /__DEV__/g,
  ];

  devPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      issues.push({
        file: filePath,
        issue: `Found development code: ${matches[0]}`,
        severity: 'medium'
      });
    }
  });
}

// Scan all files in dist directory
function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      scanDirectory(filePath);
    } else if (file.endsWith('.js') || file.endsWith('.css')) {
      const content = fs.readFileSync(filePath, 'utf8');
      checkForDebugLogs(filePath, content);
      checkForDebugComponents(filePath, content);
      checkForDevCode(filePath, content);
    }
  });
}

// Run verification
scanDirectory(distPath);

// Report results
if (issues.length === 0) {
  console.log('✅ Production build verification passed!');
  console.log('🎉 No debug code found in production build.');
} else {
  console.log(`❌ Found ${issues.length} issues in production build:\n`);
  
  const critical = issues.filter(i => i.severity === 'critical');
  const high = issues.filter(i => i.severity === 'high');
  const medium = issues.filter(i => i.severity === 'medium');
  
  if (critical.length > 0) {
    console.log('🚨 CRITICAL ISSUES:');
    critical.forEach(issue => {
      console.log(`   - ${issue.file}: ${issue.issue}`);
    });
    console.log('');
  }
  
  if (high.length > 0) {
    console.log('⚠️  HIGH SEVERITY ISSUES:');
    high.forEach(issue => {
      console.log(`   - ${issue.file}: ${issue.issue}`);
    });
    console.log('');
  }
  
  if (medium.length > 0) {
    console.log('ℹ️  MEDIUM SEVERITY ISSUES:');
    medium.forEach(issue => {
      console.log(`   - ${issue.file}: ${issue.issue}`);
    });
  }
  
  console.log('\n🔧 Recommendations:');
  console.log('   1. Ensure all debug components use DebugOnly wrapper');
  console.log('   2. Replace console.log with debugLog utility');
  console.log('   3. Use environment checks for development-only code');
  console.log('   4. Run "npm run build:prod" for production builds');
  
  process.exit(1);
}
