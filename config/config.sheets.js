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
      'Domain',
      'City',
      'State',
      'Country',
      'Timezone',
      'Company Size',
      'Annual Revenue',
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
