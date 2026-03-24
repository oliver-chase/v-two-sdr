#!/usr/bin/env node
/**
 * Full System Test — SDR Automation Verification
 * Tests all components without sending emails
 */

const path = require('path');
const fs = require('fs');

console.log('═══════════════════════════════════════════════════════');
console.log('  SDR SYSTEM AUTOMATION TEST');
console.log('═══════════════════════════════════════════════════════\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (err) {
    console.log(`❌ ${name}: ${err.message}`);
    failed++;
  }
}

// Test 1: Config files exist
test('Config: config.sheets.js exists', () => {
  if (!fs.existsSync('./config.sheets.js')) throw new Error('Missing');
});

test('Config: Sheet ID configured', () => {
  const config = require('./config.sheets.js');
  if (!config.google_sheets.sheet_id) throw new Error('Sheet ID empty');
  if (config.google_sheets.sheet_id !== '1bAruz-w1e45Zlgy7gWL2qTHx7eqIufpn4ok9GpPTcg0') {
    throw new Error('Wrong Sheet ID');
  }
});

// Test 2: Google credentials
test('Secrets: google-credentials.json exists', () => {
  if (!fs.existsSync('./secrets/google-credentials.json')) throw new Error('Missing');
});

test('Secrets: Credentials file has real private key', () => {
  const creds = JSON.parse(fs.readFileSync('./secrets/google-credentials.json', 'utf8'));
  if (!creds.private_key || creds.private_key.includes('YOUR_PRIVATE_KEY_HERE')) {
    throw new Error('Private key is placeholder — needs real value from Google Cloud');
  }
});

// Test 3: Scripts exist
test('Scripts: daily-run.js exists', () => {
  if (!fs.existsSync('./scripts/daily-run.js')) throw new Error('Missing');
});

test('Scripts: sync-from-sheets.js exists', () => {
  if (!fs.existsSync('./scripts/sync-from-sheets.js')) throw new Error('Missing');
});

test('Scripts: draft-emails.js exists', () => {
  if (!fs.existsSync('./scripts/draft-emails.js')) throw new Error('Missing');
});

// Test 4: Data files
test('Data: prospects.json exists', () => {
  if (!fs.existsSync('./prospects.json')) throw new Error('Missing');
});

test('Data: outreach/ directory exists', () => {
  if (!fs.existsSync('./outreach')) throw new Error('Missing');
});

// Test 5: GitHub Actions
test('CI/CD: .github/workflows/daily-sdr.yml exists', () => {
  if (!fs.existsSync('./.github/workflows/daily-sdr.yml')) throw new Error('Missing');
});

test('CI/CD: No duplicate workflows', () => {
  const workflows = fs.readdirSync('./.github/workflows/');
  if (workflows.length !== 1) throw new Error(`Found ${workflows.length} workflows, expected 1`);
});

// Test 6: Node dependencies
test('Deps: node_modules exists', () => {
  if (!fs.existsSync('./node_modules')) throw new Error('Run npm install');
});

test('Deps: googleapis installed', () => {
  if (!fs.existsSync('./node_modules/googleapis')) throw new Error('Run npm install');
});

console.log('\n═══════════════════════════════════════════════════════');
console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
console.log('═══════════════════════════════════════════════════════\n');

if (failed > 0) {
  console.log('⚠️  BLOCKER: Fill in secrets/google-credentials.json');
  console.log('   with real private_key from Google Cloud Console');
  console.log('   See secrets/README.md for instructions\n');
  process.exit(1);
} else {
  console.log('✅ All checks passed! System ready for automation.');
  console.log('   Run: npm test (unit tests)');
  console.log('   Run: node scripts/daily-run.js (full workflow)\n');
  process.exit(0);
}
