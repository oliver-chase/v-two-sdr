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
  // Columns in order: Name | Title | Company | Email | Location | Timezone | LinkedIn |
  //   Company Size | Industry | Funding | Signal | Source | Status |
  //   Date Added | First Contact | Last Contact | Follow-Up Count | Next Follow-Up | Notes
  field_mapping: {
    'Name': 'nm',              // Full name — fn (first name) derived automatically
    'Title': 'ti',
    'Company': 'co',
    'Email': 'em',
    'Location': 'loc',
    'Timezone': 'tz',
    'LinkedIn': 'li',
    'Company Size': 'sz',
    'Industry': 'ind',
    'Funding': 'fnd',
    'Signal': 'sig',           // Intent signal: why they're a prospect
    'Source': 'src',
    'Status': 'st',
    'Date Added': 'da',
    'First Contact': 'fc',
    'Last Contact': 'lc',
    'Follow-Up Count': 'fuc',
    'Next Follow-Up': 'nfu',
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
