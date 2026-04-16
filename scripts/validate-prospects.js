#!/usr/bin/env node

/**
 * SDR Prospect Validation Script
 * Validates prospect data for completeness, accuracy, and compliance
 * Usage: node validate-prospects.js [prospects.json] [output-file]
 */

const fs = require('fs');
const path = require('path');

const VALID_TRACKS = ['ai-enablement', 'product-maker', 'pace-car'];
const VALID_STATUSES = [
  'new', 'email_discovered', 'draft_generated', 'awaiting_approval',
  'email_sent', 'followup_due', 'ooo_pending', 'replied',
  'closed_positive', 'closed_negative', 'closed_no_reply', 'bounced_no_alt'
];
const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Australia/Sydney'
];

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateProspect(prospect, index) {
  const errors = [];
  const warnings = [];

  // Required fields
  if (!prospect.fn || prospect.fn.trim() === '') {
    errors.push(`Row ${index}: Missing first name (fn)`);
  }
  if (!prospect.ln || prospect.ln.trim() === '') {
    errors.push(`Row ${index}: Missing last name (ln)`);
  }
  if (!prospect.co || prospect.co.trim() === '') {
    errors.push(`Row ${index}: Missing company (co)`);
  }
  if (!prospect.ti || prospect.ti.trim() === '') {
    errors.push(`Row ${index}: Missing title (ti)`);
  }
  if (!prospect.em || prospect.em.trim() === '') {
    errors.push(`Row ${index}: Missing email (em)`);
  } else if (!validateEmail(prospect.em)) {
    errors.push(`Row ${index}: Invalid email format: ${prospect.em}`);
  }

  // Track validation
  if (!prospect.tr || !VALID_TRACKS.includes(prospect.tr)) {
    errors.push(`Row ${index}: Invalid track (tr). Must be one of: ${VALID_TRACKS.join(', ')}`);
  }

  // Status validation
  if (!prospect.st || !VALID_STATUSES.includes(prospect.st)) {
    warnings.push(`Row ${index}: Invalid or missing status (st). Setting to "new"`);
    prospect.st = 'new';
  }

  // Timezone validation
  if (prospect.tz && !TIMEZONES.includes(prospect.tz)) {
    warnings.push(`Row ${index}: Timezone ${prospect.tz} may be invalid`);
  }

  // LinkedIn optional but should be valid format if provided
  if (prospect.li && !prospect.li.includes('linkedin.com')) {
    warnings.push(`Row ${index}: LinkedIn URL should contain "linkedin.com"`);
  }

  // Duplicate email check (done separately at prospectss level)
  if (!prospect.id) {
    prospect.id = `p-${String(index).padStart(6, '0')}`;
  }

  return { errors, warnings };
}

function validateProspects(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  let data;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    data = JSON.parse(content);
  } catch (e) {
    console.error(`❌ Invalid JSON: ${e.message}`);
    process.exit(1);
  }

  if (!Array.isArray(data.prospects)) {
    console.error('❌ prospects.json must contain a "prospects" array');
    process.exit(1);
  }

  const results = {
    totalProspects: data.prospects.length,
    validProspects: 0,
    errors: [],
    warnings: [],
    duplicateEmails: [],
    prospectsByTrack: { 'ai-enablement': 0, 'product-maker': 0, 'pace-car': 0 }
  };

  const emailSet = new Set();

  data.prospects.forEach((prospect, index) => {
    const { errors, warnings } = validateProspect(prospect, index + 1);
    results.errors.push(...errors);
    results.warnings.push(...warnings);

    if (errors.length === 0) {
      results.validProspects++;
      if (prospect.tr) {
        results.prospectsByTrack[prospect.tr]++;
      }
    }

    // Check for duplicates
    if (prospect.em) {
      if (emailSet.has(prospect.em)) {
        results.duplicateEmails.push(prospect.em);
      } else {
        emailSet.add(prospect.em);
      }
    }
  });

  // Report
  console.log('\n📊 PROSPECT VALIDATION REPORT\n');
  console.log(`Total prospects: ${results.totalProspects}`);
  console.log(`Valid prospects: ${results.validProspects}`);
  console.log(`\nBy track:`);
  Object.entries(results.prospectsByTrack).forEach(([track, count]) => {
    console.log(`  ${track}: ${count}`);
  });

  if (results.errors.length > 0) {
    console.log(`\n❌ ERRORS (${results.errors.length}):`);
    results.errors.forEach(err => console.log(`  ${err}`));
  }

  if (results.warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${results.warnings.length}):`);
    results.warnings.forEach(warn => console.log(`  ${warn}`));
  }

  if (results.duplicateEmails.length > 0) {
    console.log(`\n🔄 DUPLICATE EMAILS (${results.duplicateEmails.length}):`);
    results.duplicateEmails.forEach(email => console.log(`  ${email}`));
  }

  const status = results.errors.length === 0 ? '✅ VALID' : '❌ INVALID';
  console.log(`\n${status}\n`);

  return {
    isValid: results.errors.length === 0,
    summary: results
  };
}

// CLI
if (require.main === module) {
  const filePath = process.argv[2] || path.join(__dirname, '..', 'prospects.json');
  const result = validateProspects(filePath);
  process.exit(result.isValid ? 0 : 1);
}

module.exports = { validateProspects, validateProspect, validateEmail };
