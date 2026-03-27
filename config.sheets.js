/**
 * Google Sheets Configuration
 *
 * Reads from the "V.Two SDR - Master Lead Repository" spreadsheet.
 * Uses service account credentials (GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY)
 * for both reads and writes — no API key required.
 */

const path = require('path');

const config = {
  // Google Sheets API Configuration
  google_sheets: {
    // Sheet ID from Google Sheet URL: https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit
    sheet_id: process.env.GOOGLE_SHEET_ID || '1bAruz-w1e45Zlgy7gWL2qTHx7eqIufpn4ok9GpPTcg0',

    // Tab name within the spreadsheet (the data tab)
    sheet_name: process.env.GOOGLE_SHEET_NAME || 'Leads',

    // Optional secondary tabs (not required for core operation)
    templates_sheet: 'Templates',
    optouts_sheet: 'OptOuts'
  },

  // Field mapping: Google Sheet column → TOON abbreviation
  // Columns in order match the actual "Leads" tab exactly
  field_mapping: {
    'Name': 'nm',
    'Title': 'ti',
    'Company': 'co',
    'Domain': 'dm',
    'Email': 'em',
    'City': 'city',
    'State': 'state',
    'Country': 'country',
    'Timezone': 'tz',
    'Company Size': 'sz',
    'Annual Revenue': 'rev',
    'Industry': 'ind',
    'Source': 'src',
    'Status': 'st',
    'Date Added': 'da',
    'Next Contact Date': 'nfu',
    'First Contact Date': 'fc',
    'Second Contact Date': 'sc',
    'Third Contact Date': 'tc',
    'Fourth Contact Date': 'fourthc',
    'Fifth Contact Date': 'fifthc',
    'Notes': 'no'
  },

  // Validation Rules
  validation: {
    required_fields: ['Name', 'Email', 'Company', 'Title'],

    valid_statuses: [
      'new',
      'email_discovered',
      'draft_generated',
      'awaiting_approval',
      'email_sent',
      'followup_due',
      'ooo_pending',
      'replied',
      'closed_positive',
      'closed_negative',
      'closed_no_reply',
      'bounced_no_alt'
    ]
  },

  // Local-only TOON fields (not mapped to Sheet columns — managed by scripts only)
  // tried_patterns: array of email addresses that have bounced for a prospect.
  //   Used by bounce-handler.js to cycle through untried email patterns.
  //   Preserved across syncs via STATE_FIELDS in sync.js.

  // Sync Options
  sync: {
    excludeOptOuts: true,
    retries: 3,
    retryDelayMs: 1000,
    cacheSchema: true,
    schemaCacheTTLMs: 3600000  // 1 hour
  },

  // Output
  output: {
    prospectsFile: path.join(__dirname, 'prospects.json'),
    prettyPrint: true
  }
};

module.exports = config;
