#!/usr/bin/env node

/**
 * Add Prospects to Google Sheet
 *
 * Reads prospect data from a JSON file and appends to the master
 * "V.Two SDR - Master Lead Repository" sheet using SheetsWriter.
 *
 * Usage: node scripts/add-prospects.js --file /path/to/prospects.json
 *
 * Prospect format (TOON):
 * [
 *   {
 *     "nm": "John Smith",           // Name (required)
 *     "em": "john.smith@example.com", // Email (optional)
 *     "co": "Example Corp",          // Company (required)
 *     "ti": "VP Sales",              // Title (required)
 *     "loc": "San Francisco, CA",     // Location (optional)
 *     "no": "Researched via Serper"   // Notes (optional)
 *   }
 * ]
 *
 * Exit codes:
 *   0 = Success (all prospects added)
 *   1 = Failure (error during processing)
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { GoogleSheetsConnector } = require('../sheets-connector');
const sheetsConfig = require('../config/config.sheets');

const SDR_ROOT = path.join(__dirname, '..');

/**
 * Parse command-line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const result = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' && i + 1 < args.length) {
      result.file = args[i + 1];
      i++;
    }
  }

  return result;
}

/**
 * Read prospects from JSON file
 */
function readProspectsFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const data = fs.readFileSync(filePath, 'utf8');
    const prospects = JSON.parse(data);

    if (!Array.isArray(prospects)) {
      throw new Error('Prospects must be an array');
    }

    return prospects;
  } catch (error) {
    throw new Error(`Failed to read prospects file: ${error.message}`);
  }
}

/**
 * Validate prospect data
 */
function validateProspect(prospect, index) {
  const errors = [];

  if (!prospect.nm || typeof prospect.nm !== 'string') {
    errors.push(`Prospect ${index}: Missing or invalid "nm" (name)`);
  }

  if (!prospect.co || typeof prospect.co !== 'string') {
    errors.push(`Prospect ${index}: Missing or invalid "co" (company)`);
  }

  if (!prospect.ti || typeof prospect.ti !== 'string') {
    errors.push(`Prospect ${index}: Missing or invalid "ti" (title)`);
  }

  // Email is optional but must be valid format if provided
  if (prospect.em && typeof prospect.em === 'string') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(prospect.em)) {
      errors.push(`Prospect ${index}: Invalid email format "${prospect.em}"`);
    }
  }

  return errors;
}

/**
 * Add prospects to Google Sheet
 */
async function addProspects(filePath) {
  try {
    // Read prospects from file
    console.log(`[SDR] Reading prospects from ${filePath}...`);
    const prospects = readProspectsFile(filePath);

    if (prospects.length === 0) {
      console.log('[SDR] No prospects to add');
      return { success: true, added: 0 };
    }

    console.log(`[SDR] Loaded ${prospects.length} prospect(s)`);

    // Validate all prospects
    const validationErrors = [];
    for (let i = 0; i < prospects.length; i++) {
      const errors = validateProspect(prospects[i], i);
      validationErrors.push(...errors);
    }

    if (validationErrors.length > 0) {
      console.error('[SDR] Validation errors:');
      validationErrors.forEach(err => console.error(`  - ${err}`));
      return { success: false, added: 0, error: 'Validation failed' };
    }

    // Initialize Google Sheets connector with config + credentials
    const config = {
      ...sheetsConfig,
      google_sheets: {
        ...sheetsConfig.google_sheets,
        // Override sheet ID and name from environment if provided
        sheet_id: process.env.GOOGLE_SHEET_ID || sheetsConfig.google_sheets.sheet_id,
        sheet_name: process.env.GOOGLE_SHEET_NAME || sheetsConfig.google_sheets.sheet_name,
        // Service account credentials for write access
        service_account_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY
      }
    };

    const connector = new GoogleSheetsConnector(config, 'write');

    console.log('[SDR] Authenticating with Google Sheets...');
    await connector.authenticate();

    // Confirm field mapping
    console.log('[SDR] Confirming field mappings...');
    await connector.confirmFieldMapping();

    // Append prospects
    console.log(`[SDR] Appending ${prospects.length} prospect(s) to sheet...`);

    try {
      const result = await connector.appendProspects(prospects);

      if (result.error) {
        console.error(`[SDR] Failed to append prospects: ${result.error}`);
        return { success: false, added: result.added || 0, error: result.error };
      }

      if (result.added === 0) {
        console.error('[SDR] ERROR: No prospects were added to the sheet (silent write failure)');
        throw new Error('Silent write failure: appendProspects returned 0 rows added');
      }

      console.log(`[SDR] ✅ Successfully added ${result.added} prospect(s) to sheet`);
      return { success: true, added: result.added };
    } catch (error) {
      console.error(`[SDR] Write error: ${error.message}`);
      return { success: false, added: 0, error: error.message };
    }
  } catch (error) {
    console.error(`[SDR] Error: ${error.message}`);
    return { success: false, added: 0, error: error.message };
  }
}

/**
 * Main entry point
 */
async function main() {
  const args = parseArgs();

  if (!args.file) {
    console.error('[SDR] Usage: node scripts/add-prospects.js --file /path/to/prospects.json');
    process.exit(1);
  }

  const result = await addProspects(args.file);

  if (!result.success) {
    process.exit(1);
  }

  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { addProspects, readProspectsFile, validateProspect };
