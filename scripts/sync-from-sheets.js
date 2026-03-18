#!/usr/bin/env node

/**
 * Sync from Google Sheets → prospects.json
 *
 * Usage:
 *   node scripts/sync-from-sheets.js [options]
 *
 * Options:
 *   --config <path>     Path to config file (default: config.sheets.js)
 *   --creds <path>      Path to credentials file
 *   --output <path>     Output file path
 *   --validate          Validate data after sync
 *   --exclude-optouts   Exclude opted-out prospects
 *   --verbose           Verbose logging
 */

const path = require('path');
const fs = require('fs');
const { GoogleSheetsConnector } = require('../sheets-connector');
const { validateProspects } = require('./validate-prospects');

// ============================================================================
// CONFIG & ARGUMENT PARSING
// ============================================================================

const defaultConfig = require('../config.sheets.js');

const args = {
  configPath: process.argv.find(arg => arg.startsWith('--config='))?.split('=')[1] ||
    path.join(__dirname, '..', 'config.sheets.js'),
  credsPath: process.argv.find(arg => arg.startsWith('--creds='))?.split('=')[1],
  outputPath: process.argv.find(arg => arg.startsWith('--output='))?.split('=')[1],
  validate: process.argv.includes('--validate'),
  excludeOptOuts: process.argv.includes('--exclude-optouts') || defaultConfig.sync.excludeOptOuts,
  verbose: process.argv.includes('--verbose')
};

// ============================================================================
// LOGGING
// ============================================================================

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    debug: '🔍',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
    success: '✅'
  }[level] || '•';

  console.log(`${prefix} [${timestamp}] ${message}`);
}

// ============================================================================
// MAIN SYNC FUNCTION
// ============================================================================

async function syncFromSheets() {
  try {
    log('Starting sync from Google Sheets...', 'info');

    // Load config
    let config = defaultConfig;
    if (fs.existsSync(args.configPath)) {
      config = require(args.configPath);
    }

    const outputPath = args.outputPath || config.output.prospectsFile;
    const credsPath = args.credsPath || config.credentials_path;

    if (!fs.existsSync(credsPath)) {
      throw new Error(
        `Credentials file not found: ${credsPath}\n` +
        `Create a service account in Google Cloud Console and save credentials.json to this path.`
      );
    }

    // Initialize connector
    log('Initializing Google Sheets connector...', 'info');
    const connector = new GoogleSheetsConnector(config);

    // Authenticate
    log('Authenticating with Google Sheets API...', 'info');
    await connector.authenticate(credsPath);

    // Detect schema
    log('Detecting sheet schema...', 'info');
    const schema = await connector.detectSchema();

    if (Object.keys(schema).length === 0) {
      throw new Error('No valid columns found in sheet. Check field names.');
    }

    if (args.verbose) {
      log(`Detected schema: ${JSON.stringify(Object.keys(schema))}`, 'debug');
    }

    // Confirm field mapping (use defaults)
    log('Confirming field mapping...', 'info');
    const mappingResult = await connector.confirmFieldMapping(null, true);

    if (!mappingResult.isValid) {
      throw new Error(`Invalid field mapping: ${mappingResult.errors.join(', ')}`);
    }

    if (args.verbose) {
      log(`Field mapping: ${JSON.stringify(mappingResult.mapping)}`, 'debug');
    }

    // Full sync
    log('Reading prospects from Google Sheet...', 'info');
    const syncResult = args.excludeOptOuts
      ? await connector.fullSync()
      : await connector.readProspects({ includeMetadata: true });

    const { prospects, metadata, summary } = syncResult;

    log(`Synced ${prospects.length} prospects`, 'success');

    if (summary) {
      log(
        `Summary: ${summary.totalRead} read, ` +
        `${summary.optedOutCount} opted-out, ` +
        `${summary.validatedCount} valid`,
        'info'
      );
      log(
        `By track: ${JSON.stringify(summary.trackBreakdown)}`,
        'info'
      );
    }

    // Prepare output
    const output = {
      prospects,
      metadata: metadata || {
        tot: prospects.length,
        lu: new Date().toISOString()
      }
    };

    // Write to file
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(
      outputPath,
      JSON.stringify(output, null, 2)
    );

    log(`Prospects written to ${outputPath}`, 'success');

    // Optional: Validate
    if (args.validate) {
      log('Validating synced prospects...', 'info');
      const validation = validateProspects(outputPath);

      if (!validation.isValid) {
        log(`Validation failed: ${validation.summary.errors.length} errors`, 'warn');
      } else {
        log('Validation passed', 'success');
      }
    }

    // Report final summary
    log('', 'info');
    log('════════════════════════════════════════════════════════', 'info');
    log('SYNC COMPLETE', 'success');
    log('════════════════════════════════════════════════════════', 'info');
    log(`Total prospects: ${prospects.length}`, 'info');
    log(`Output: ${outputPath}`, 'info');
    log(`Last updated: ${output.metadata.lu}`, 'info');

    return {
      success: true,
      prospectsCount: prospects.length,
      outputPath,
      metadata: output.metadata
    };

  } catch (error) {
    log(`Sync failed: ${error.message}`, 'error');
    if (args.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// ============================================================================
// RUN IF CALLED DIRECTLY
// ============================================================================

if (require.main === module) {
  syncFromSheets();
}

module.exports = syncFromSheets;
