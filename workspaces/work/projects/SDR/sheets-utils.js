/**
 * Google Sheets Utilities — Helper functions and constants for sheets-connector.js
 *
 * Extracted to keep sheets-connector.js under 500-line limit.
 * Contains field mapping, validation, and transformation utilities.
 */

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const TOON_FIELD_MAP = {
  // Core prospect fields
  'FirstName': { toonField: 'fn', required: true },
  'LastName': { toonField: 'ln', required: true },
  'Email': { toonField: 'em', required: true },
  'Company': { toonField: 'co', required: true },
  'Title': { toonField: 'ti', required: true },
  'LinkedIn': { toonField: 'li', required: false },
  'Location': { toonField: 'lo', required: false },
  'Timezone': { toonField: 'tz', required: false },
  'Track': { toonField: 'tr', required: false },
  'Status': { toonField: 'st', required: false },

  // Metadata fields
  'DateAdded': { toonField: 'ad', required: false },
  'LastContact': { toonField: 'lc', required: false },
  'Notes': { toonField: 'no', required: false },
  'Source': { toonField: 'sr', required: false },

  // State fields
  'LastSent': { toonField: 'ls', required: false },
  'LastReply': { toonField: 'lr', required: false },
  'ReplyStatus': { toonField: 'rs', required: false },

  // Enrichment fields
  'EmailConfidence': { toonField: 'ec', required: false },
  'EnrichedAt': { toonField: 'ea', required: false }
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

  // Try common variations
  const variations = {
    'first name': 'FirstName',
    'firstname': 'FirstName',
    'first_name': 'FirstName',
    'last name': 'LastName',
    'lastname': 'LastName',
    'last_name': 'LastName',
    'email address': 'Email',
    'email_address': 'Email',
    'company name': 'Company',
    'company_name': 'Company',
    'job title': 'Title',
    'job_title': 'Title',
    'linked in': 'LinkedIn',
    'linked_in': 'LinkedIn',
    'linkedin url': 'LinkedIn',
    'date added': 'DateAdded',
    'date_added': 'DateAdded',
    'last contact': 'LastContact',
    'last_contact': 'LastContact',
    'last sent': 'LastSent',
    'last_sent': 'LastSent',
    'last reply': 'LastReply',
    'last_reply': 'LastReply',
    'reply status': 'ReplyStatus',
    'reply_status': 'ReplyStatus',
    'email confidence': 'EmailConfidence',
    'email_confidence': 'EmailConfidence',
    'enriched at': 'EnrichedAt',
    'enriched_at': 'EnrichedAt'
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

  // Add timestamps if not present
  if (!toonRow.ad) {
    toonRow.ad = new Date().toISOString().split('T')[0];
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
