/**
 * Google Sheets Configuration
 *
 * Configure access to Google Sheet with credential paths and sheet names.
 * Credentials files should NOT be committed to git (use .gitignore).
 */

const path = require('path');

const config = {
  // Google Sheets API Configuration
  google_sheets: {
    // Sheet ID from Google Sheet URL: https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit
    sheet_id: process.env.GOOGLE_SHEETS_ID || 'REPLACE_WITH_ACTUAL_SHEET_ID',

    // Main prospects data sheet
    sheet_name: 'Prospects',

    // Templates reference sheet (optional)
    templates_sheet: 'Templates',

    // Opt-outs management sheet (optional)
    optouts_sheet: 'OptOuts'
  },

  // Service Account Credentials (for Claude Code read-only access)
  // Location: workspaces/work/projects/SDR/secrets/google-code-credentials.json
  // Permissions: Read-only on Prospects sheet
  credentials_path: path.join(__dirname, 'secrets', 'google-code-credentials.json'),

  // Alternative: Load from environment variable
  // credentials_path: process.env.GOOGLE_CREDENTIALS_PATH,

  // OpenClaw Credentials (separate, has write permissions)
  // Location: workspaces/work/projects/SDR/secrets/google-openclaw-credentials.json
  openclaw_credentials_path: path.join(__dirname, 'secrets', 'google-openclaw-credentials.json'),

  // API Rate Limiting
  rate_limit: {
    maxCallsPerMinute: 300,
    batchSize: 100 // Rows per append operation
  },

  // Prospect Fields Mapping (TOON Format)
  // Maps sheet columns to TOON abbreviations
  field_mapping: {
    'FirstName': 'fn',      // First name
    'LastName': 'ln',       // Last name
    'Email': 'em',          // Email address
    'Company': 'co',        // Company name
    'Title': 'ti',          // Job title
    'LinkedIn': 'li',       // LinkedIn URL
    'Location': 'lo',       // City, State
    'Timezone': 'tz',       // IANA timezone
    'Track': 'tr',          // ai-enablement|product-maker|pace-car
    'Status': 'st',         // new|sent|replied|etc
    'DateAdded': 'ad',      // Date added to database
    'LastContact': 'lc',    // Last contact date
    'LastSent': 'ls',       // Last send date
    'LastReply': 'lr',      // Last reply date
    'ReplyStatus': 'rs',    // positive|negative|neutral|ooo
    'Notes': 'no',          // Internal notes
    'Source': 'sr',         // Where prospect came from
    'EmailConfidence': 'ec' // Email validation confidence (0-1)
  },

  // Validation Rules
  validation: {
    // Required fields (cannot be empty)
    required_fields: ['FirstName', 'LastName', 'Email', 'Company', 'Title', 'Track', 'Status'],

    // Valid values for Track
    valid_tracks: ['ai-enablement', 'product-maker', 'pace-car'],

    // Valid statuses
    valid_statuses: [
      'new',
      'email_discovered',
      'draft_generated',
      'awaiting_approval',
      'email_sent',
      'replied',
      'closed_positive',
      'closed_negative',
      'opted_out',
      'bounced'
    ],

    // Common timezones
    valid_timezones: [
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'America/Anchorage',
      'Pacific/Honolulu',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Europe/Amsterdam',
      'Europe/Vienna',
      'Europe/Prague',
      'Europe/Madrid',
      'Europe/Moscow',
      'Asia/Dubai',
      'Asia/Singapore',
      'Asia/Hong_Kong',
      'Asia/Tokyo',
      'Asia/Seoul',
      'Asia/Shanghai',
      'Asia/Kolkata',
      'Australia/Sydney',
      'Australia/Melbourne',
      'Australia/Brisbane'
    ]
  },

  // Sync Options
  sync: {
    // Auto-exclude opted-out prospects
    excludeOptOuts: true,

    // Skip validation on read (for performance)
    skipValidation: false,

    // Retry failed API calls
    retries: 3,
    retryDelayMs: 1000,

    // Batch write size
    batchSize: 100,

    // Cache schema detection
    cacheSchema: true,
    schemaCacheTTLMs: 3600000 // 1 hour
  },

  // Output Options
  output: {
    // Directory for synced prospects
    prospectsFile: path.join(__dirname, 'prospects.json'),

    // Directory for sync logs
    logsDir: path.join(__dirname, 'logs'),

    // Include metadata in output
    includeMetadata: true,

    // Pretty-print JSON
    prettyPrint: true
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info', // debug, info, warn, error
    logApiCalls: false, // Log every API call (verbose)
    logValidationErrors: true, // Log validation issues
    logSyncSummary: true // Log sync summary
  }
};

module.exports = config;
