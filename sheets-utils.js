/**
 * Google Sheets Utilities — Helper functions and constants for sheets-connector.js
 *
 * Extracted to keep sheets-connector.js under 500-line limit.
 * Contains field mapping, validation, and transformation utilities.
 */

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

// Columns match V.Two SDR - Master Lead Repository exactly (left to right):
// Name | Title | Company | Email | Location | Timezone | LinkedIn |
// Company Size | Industry | Funding | Signal | Source | Status |
// Date Added | First Contact | Last Contact | Follow-Up Count | Next Follow-Up | Notes
const TOON_FIELD_MAP = {
  // Core prospect fields
  'Name': { toonField: 'nm', required: true },         // Full name — fn derived as first word
  'Title': { toonField: 'ti', required: true },
  'Company': { toonField: 'co', required: true },
  'Email': { toonField: 'em', required: true },
  'Location': { toonField: 'loc', required: false },
  'Timezone': { toonField: 'tz', required: false },
  'LinkedIn': { toonField: 'li', required: false },

  // Segmentation fields — drive AI template grouping
  'CompanySize': { toonField: 'sz', required: false },  // e.g. "1-10", "50-200", "500+"
  'Industry': { toonField: 'ind', required: false },    // e.g. "SaaS", "FinTech"
  'Funding': { toonField: 'fnd', required: false },     // e.g. "Series A", "Bootstrap"
  'Signal': { toonField: 'sig', required: false },      // Intent signal: why they're a prospect
  'Source': { toonField: 'src', required: false },      // How they were found

  // Status & tracking
  'Status': { toonField: 'st', required: false },
  'DateAdded': { toonField: 'da', required: false },
  'FirstContact': { toonField: 'fc', required: false },
  'LastContact': { toonField: 'lc', required: false },
  'FollowUpCount': { toonField: 'fuc', required: false },
  'NextFollowUp': { toonField: 'nfu', required: false },
  'Notes': { toonField: 'no', required: false }
};

const VALID_TRACKS = ['ai-enablement', 'product-maker', 'pace-car'];
const VALID_STATUSES = [
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
];

const RATE_LIMIT = {
  maxCalls: 300,
  windowMs: 60000, // 1 minute
  batchSize: 100 // Rows per append call
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normalize a sheet header string to match TOON_FIELD_MAP keys
 */
function normalizeHeader(header) {
  if (!header) return null;

  // Try exact match first
  if (TOON_FIELD_MAP[header]) return header;

  // Try common variations (handles multi-word column names from Google Sheets)
  const variations = {
    // Name
    'full name': 'Name',
    'first name': 'Name',
    'firstname': 'Name',
    'first_name': 'Name',
    // Email
    'email address': 'Email',
    'email_address': 'Email',
    // Company
    'company name': 'Company',
    'company_name': 'Company',
    // Title
    'job title': 'Title',
    'job_title': 'Title',
    'role': 'Title',
    // LinkedIn
    'linked in': 'LinkedIn',
    'linked_in': 'LinkedIn',
    'linkedin url': 'LinkedIn',
    // Segmentation
    'company size': 'CompanySize',
    'company_size': 'CompanySize',
    'employees': 'CompanySize',
    'intent signal': 'Signal',
    'lead signal': 'Signal',
    // Status & dates
    'date added': 'DateAdded',
    'date_added': 'DateAdded',
    'add date': 'DateAdded',
    'first contact': 'FirstContact',
    'first_contact': 'FirstContact',
    'last contact': 'LastContact',
    'last_contact': 'LastContact',
    'follow-up count': 'FollowUpCount',
    'follow up count': 'FollowUpCount',
    'followup count': 'FollowUpCount',
    'follow_up_count': 'FollowUpCount',
    'next follow-up': 'NextFollowUp',
    'next follow up': 'NextFollowUp',
    'next_follow_up': 'NextFollowUp'
  };

  const normalized = variations[header.toLowerCase().trim()];
  return normalized && TOON_FIELD_MAP[normalized] ? normalized : null;
}

/**
 * Convert PascalCase header to camelCase key
 */
function toCamelCase(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

/**
 * Infer schema from sheet headers — returns camelCase keys
 */
function inferSchema(headers) {
  const schema = {};

  for (const header of headers) {
    const normalized = normalizeHeader(header);
    if (!normalized || !TOON_FIELD_MAP[normalized]) {
      if (header) console.warn(`[sheets] Skipping unrecognized column: "${header}"`);
    }
    if (normalized && TOON_FIELD_MAP[normalized]) {
      const camelKey = toCamelCase(normalized);
      schema[camelKey] = {
        ...TOON_FIELD_MAP[normalized],
        originalHeader: header
      };
    }
  }

  return schema;
}

/**
 * Validate that a field mapping includes all required TOON fields
 */
function validateFieldMapping(mapping) {
  const errors = [];
  const mappedToonFields = new Set(Object.values(mapping));

  // Check required fields
  const requiredToonFields = Object.entries(TOON_FIELD_MAP)
    .filter(([_, meta]) => meta.required)
    .map(([_, meta]) => meta.toonField);

  for (const requiredField of requiredToonFields) {
    if (!mappedToonFields.has(requiredField)) {
      const origField = Object.entries(TOON_FIELD_MAP).find(
        ([_, meta]) => meta.toonField === requiredField
      )?.[0];
      errors.push(`Missing required field mapping: ${origField?.toLowerCase()} (${requiredField})`);
    }
  }

  // Check for duplicate mappings (count from values array, not Set)
  const fieldCounts = new Map();
  for (const toonField of Object.values(mapping)) {
    fieldCounts.set(toonField, (fieldCounts.get(toonField) || 0) + 1);
  }

  for (const [toonField, count] of fieldCounts) {
    if (count > 1) {
      errors.push(`duplicate TOON field mapping: ${toonField} mapped ${count} times`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate email format
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email?.toString().trim());
}

/**
 * Parse a single sheet row into TOON format
 */
function parseSheetRow(sheetRow, fieldMapping, rowIndex) {
  const toonRow = {
    id: `p-${String(rowIndex).padStart(6, '0')}`
  };

  // Map fields
  for (const [sheetField, toonField] of Object.entries(fieldMapping)) {
    const value = sheetRow[sheetField];
    if (value !== undefined && value !== null && value !== '') {
      toonRow[toonField] = value.toString().trim();
    }
  }

  // Derive first name from full Name column (for email personalization)
  if (toonRow.nm && !toonRow.fn) {
    toonRow.fn = toonRow.nm.split(' ')[0];
  }

  // Add timestamps if not present
  if (!toonRow.da) {
    toonRow.da = new Date().toISOString().split('T')[0];
  }
  if (!toonRow.lc) {
    toonRow.lc = new Date().toISOString().split('T')[0];
  }

  // Validate email
  if (toonRow.em && !validateEmail(toonRow.em)) {
    toonRow.vl = { em: 'invalid_format' };
  }

  return toonRow;
}

/**
 * Convert TOON row back to sheet format
 */
function toonToSheetRow(toonRow, reverseMapping) {
  const sheetRow = {};

  for (const [toonField, sheetField] of Object.entries(reverseMapping)) {
    if (toonRow[toonField] !== undefined) {
      sheetRow[sheetField] = toonRow[toonField];
    }
  }

  return sheetRow;
}

/**
 * Convert sheet row to TOON with timestamp metadata
 */
function sheetRowToToon(sheetRow, fieldMapping, rowIndex) {
  return parseSheetRow(sheetRow, fieldMapping, rowIndex);
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  parseSheetRow,
  inferSchema,
  validateFieldMapping,
  toonToSheetRow,
  sheetRowToToon,
  validateEmail,
  normalizeHeader,
  TOON_FIELD_MAP,
  VALID_TRACKS,
  VALID_STATUSES,
  RATE_LIMIT
};
