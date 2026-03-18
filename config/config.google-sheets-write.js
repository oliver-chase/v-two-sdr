/**
 * Google Sheets Write Configuration
 *
 * Service account-based authentication for write access to Google Sheets.
 * Uses google-auth-library to obtain OAuth tokens with service account credentials.
 *
 * Required environment variables:
 * - GOOGLE_SERVICE_ACCOUNT_EMAIL: Service account email (e.g., sdr@my-project.iam.gserviceaccount.com)
 * - GOOGLE_PRIVATE_KEY: Private key from service account JSON (PEM format)
 * - GOOGLE_SHEET_ID: Google Sheet ID (same as read config)
 *
 * Scopes:
 * - https://www.googleapis.com/auth/spreadsheets (full access to Sheets API)
 */

const path = require('path');

const config = {
  google_sheets_write: {
    // Service Account Credentials
    serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
    privateKey: process.env.GOOGLE_PRIVATE_KEY || '',

    // Sheet Configuration
    sheetId: process.env.GOOGLE_SHEET_ID || '',
    sheetName: process.env.GOOGLE_SHEET_NAME || 'Leads',

    // OAuth Scopes (full spreadsheet access for write operations)
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets'
    ],

    // Write Operation Settings
    writeMode: 'service_account',  // vs 'api_key' (read-only)

    // Rate Limiting
    rateLimitMaxCalls: 300,        // Google Sheets API: 300 requests/min
    rateLimitWindowMs: 60000,      // 1 minute window
    batchSize: 100,                // Rows per update call

    // Retry Configuration
    maxRetries: 3,
    retryDelayMs: 1000,            // Exponential backoff: 1s, 2s, 4s

    // Protected Fields (read-only, cannot be overwritten)
    protectedFields: [
      'Name',              // Core prospect identifier
      'Email',             // Primary contact field
      'Company',           // Segment identifier
      'Title',             // Segment identifier
      'Date Added',        // Audit trail
      'First Contact Date' // Audit trail
    ],

    // Writable Fields (safe to update after enrichment)
    writableFields: [
      'Timezone',           // tz — enriched from email domain or company location
      'LinkedIn',           // li — enriched from web search
      'Location',           // loc — enriched from company context
      'Industry',           // ind — enriched from company website
      'Funding',            // fnd — enriched from web search
      'Signal',             // sig — enriched from signals analysis
      'Status',             // st — updated by state machine
      'LastContact',        // lc — updated after outreach
      'FollowUpCount',      // fuc — incremented on follow-up
      'NextFollowUp',       // nfu — calculated from follow-up rules
      'Notes'               // no — enrichment notes, user feedback
    ]
  }
};

module.exports = config;
