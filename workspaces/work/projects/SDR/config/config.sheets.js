/**
 * Google Sheets Configuration — Field Mapping
 *
 * Maps TOON field abbreviations to actual Google Sheet column headers.
 * Used by sheets-connector.js to read/write prospect data.
 *
 * Required environment variables:
 * - GOOGLE_API_KEY: Read-only API key (for listing prospects)
 * - GOOGLE_SHEET_ID: Google Sheet ID
 * - GOOGLE_SHEET_NAME: Sheet tab name (default: "Leads")
 */

const config = {
  google_sheets: {
    // API Configuration
    api_key: process.env.GOOGLE_API_KEY || '',
    sheet_id: process.env.GOOGLE_SHEET_ID || '',
    sheet_name: process.env.GOOGLE_SHEET_NAME || 'Leads',
    templates_sheet: 'Templates',
    optouts_sheet: 'OptOuts',

    // Explicit Field Mapping: TOON → Sheet Column Headers
    // This ensures consistent mapping regardless of column order
    field_mapping: {
      'Name': 'nm',              // Prospect name
      'Title': 'ti',             // Job title
      'Company': 'co',           // Company name
      'Email': 'em',             // Email address
      'City': 'loc',             // Location (city)
      'Timezone': 'tz',          // Timezone (IANA format)
      'Industry': 'ind',         // Industry vertical
      'Source': 'src',           // Lead source
      'Status': 'st',            // Prospect status (new, contacted, interested, etc.)
      'Date Added': 'da',        // Date prospect added
      'Notes': 'no'              // Enrichment notes
    },

    // Protected Fields (read-only after prospect created)
    protected_fields: [
      'Name',
      'Email',
      'Company',
      'Title',
      'Date Added',
      'First Contact Date'
    ],

    // Writable Fields (can be updated after enrichment)
    writable_fields: [
      'Timezone',
      'Industry',
      'Source',
      'Status',
      'Notes',
      'Next Contact Date',
      'Second Contact Date',
      'Third Contact Date',
      'Fourth Contact Date',
      'Fifth Contact Date'
    ],

    // Rate Limiting
    rate_limit_requests_per_minute: 300,
    rate_limit_batch_size: 100
  }
};

module.exports = config;
