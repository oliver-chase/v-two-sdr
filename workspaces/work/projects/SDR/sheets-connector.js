/**
 * Google Sheets Connector — Phase 1 Chunk 2
 *
 * Bidirectional sync between Google Sheets and prospects.json
 * Features:
 * - OAuth-based authentication with token refresh
 * - Dynamic schema inference (detect columns → TOON field mapping)
 * - Field confirmation workflow (user validates mapping)
 * - Read operations (sync all leads from Sheet)
 * - Write operations (append enriched fields, state updates, metrics)
 * - Batch API optimization (respect rate limits, caching)
 * - Full test coverage (unit + integration + mocks)
 */

const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const fs = require('fs');
const {
  parseSheetRow,
  inferSchema,
  validateFieldMapping,
  toonToSheetRow,
  RATE_LIMIT,
  VALID_STATUSES
} = require('./sheets-utils');

// ============================================================================
// GOOGLE SHEETS CONNECTOR CLASS
// ============================================================================

class GoogleSheetsConnector {
  constructor(config, authMode = 'read') {
    // Validate config
    if (!config.google_sheets?.sheet_id) {
      throw new Error('Config must include google_sheets.sheet_id');
    }
    if (!config.google_sheets?.sheet_name) {
      throw new Error('Config must include google_sheets.sheet_name');
    }

    this.sheetId = config.google_sheets.sheet_id;
    this.sheetName = config.google_sheets.sheet_name;
    this.templatesSheetName = config.google_sheets.templates_sheet || 'Templates';
    this.optOutsSheetName = config.google_sheets.optouts_sheet || 'OptOuts';
    this.authMode = authMode; // 'read' or 'write'

    // Read-mode config (API key)
    this.apiKey = config.google_sheets.api_key || process.env.GOOGLE_API_KEY || '';

    // Write-mode config (service account)
    this.serviceAccountEmail = config.google_sheets?.service_account_email || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
    this.privateKey = config.google_sheets?.private_key || process.env.GOOGLE_PRIVATE_KEY || '';
    this.protectedFields = config.google_sheets?.protected_fields || [];
    this.writableFields = config.google_sheets?.writable_fields || [];

    // Initialize API client
    this.doc = null;
    this.authenticated = false;
    this.authClient = null;

    // Cache & rate limiting
    this.schema = null;
    this.fieldMapping = null;
    this.apiCallTimes = [];
    this.apiCallCount = 0;
  }

  /**
   * Authenticate with Google Sheets API.
   *
   * Two modes:
   * - 'read' (default): Uses API key (public sheets)
   * - 'write': Uses service account OAuth (private sheets with write access)
   *
   * @param {string} [apiKey] - Override the key from config/env (read mode only)
   */
  async authenticate(apiKey) {
    if (this.authMode === 'write') {
      return this._authenticateServiceAccount();
    }

    // Read-mode authentication (API key)
    const key = apiKey || this.apiKey;

    if (!key) {
      throw new Error('Google Sheets authentication required: GOOGLE_API_KEY must be set');
    }

    try {
      this.doc = new GoogleSpreadsheet(this.sheetId, { apiKey: key });
      await this.doc.loadInfo();

      this.authenticated = true;
      return true;
    } catch (error) {
      throw new Error(`Google Sheets authentication failed: ${error.message}`);
    }
  }

  /**
   * Authenticate with Google Sheets API using service account (write access).
   * Uses JWT-based OAuth with google-auth-library.
   *
   * @private
   * @returns {Promise<boolean>}
   */
  async _authenticateServiceAccount() {
    if (!this.serviceAccountEmail || !this.privateKey) {
      throw new Error(
        'Service account authentication required: GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY must be set'
      );
    }

    try {
      // Create JWT auth client
      this.authClient = new JWT({
        email: this.serviceAccountEmail,
        key: this.privateKey,
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets'
        ]
      });

      // Initialize GoogleSpreadsheet with service account auth
      this.doc = new GoogleSpreadsheet(this.sheetId);
      this.doc.useServiceAccountAuth(this.authClient);

      await this.doc.loadInfo();

      this.authenticated = true;
      return true;
    } catch (error) {
      throw new Error(`Service account authentication failed: ${error.message}`);
    }
  }

  /**
   * Detect schema from sheet headers
   */
  async detectSchema() {
    if (this.schema) {
      return this.schema;
    }

    if (!this.doc || !this.doc.sheetsByTitle) {
      throw new Error('Google Sheets authentication required. Call authenticate() first.');
    }

    const sheet = this.doc.sheetsByTitle[this.sheetName];
    if (!sheet) {
      throw new Error(`Sheet "${this.sheetName}" not found`);
    }

    const rows = await this.recordApiCall(() => sheet.getRows());
    if (rows.length === 0) {
      return {};
    }

    const headers = Object.keys(rows[0]);
    this.schema = inferSchema(headers);

    return this.schema;
  }

  /**
   * User confirms field mapping based on detected schema
   */
  async confirmFieldMapping(userMapping = null, useDefaults = false) {
    if (userMapping) {
      const validation = validateFieldMapping(userMapping);
      if (validation.isValid) {
        this.fieldMapping = userMapping;
      }
      return { ...validation, mapping: userMapping };
    }

    if (useDefaults) {
      // Build default mapping from schema
      const schema = await this.detectSchema();
      const defaultMapping = {};

      for (const [sheetField, meta] of Object.entries(schema)) {
        defaultMapping[sheetField] = meta.toonField;
      }

      this.fieldMapping = defaultMapping;
      return {
        isValid: true,
        mapping: defaultMapping
      };
    }

    throw new Error('Must provide userMapping or set useDefaults=true');
  }

  /**
   * Read all prospects from sheet and convert to TOON format
   */
  async readProspects(options = {}) {
    if (!this.doc) {
      throw new Error('Google Sheets authentication required. Call authenticate() first.');
    }

    if (!this.fieldMapping) {
      await this.confirmFieldMapping(null, true);
    }

    const sheet = this.doc.sheetsByTitle[this.sheetName];
    if (!sheet) {
      throw new Error(`Sheet "${this.sheetName}" not found`);
    }

    const rows = await this.recordApiCall(() => sheet.getRows());

    const prospects = rows.map((row, index) =>
      parseSheetRow(row, this.fieldMapping, index + 1)
    );

    if (options.includeMetadata) {
      return {
        prospects,
        metadata: {
          tot: prospects.length,
          by_tr: this._countByTrack(prospects),
          by_st: this._countByStatus(prospects),
          lu: new Date().toISOString()
        }
      };
    }

    return prospects;
  }

  /**
   * Read opt-out list from sheet
   */
  async readOptOuts() {
    if (!this.doc) {
      throw new Error('Google Sheets authentication required. Call authenticate() first.');
    }

    const sheet = this.doc.sheetsByTitle[this.optOutsSheetName];
    if (!sheet) {
      return [];
    }

    const rows = await this.recordApiCall(() => sheet.getRows());

    return rows.map(row => ({
      em: row.Email?.toString().toLowerCase() || '',
      fn: row.FirstName || '',
      co: row.Company || '',
      rs: row.Reason || '',
      da: row.DateAdded || '',
      no: row.Notes || ''
    }));
  }

  /**
   * Append new prospects to sheet in batches
   */
  async appendProspects(toonProspects, options = {}) {
    if (!this.doc) {
      throw new Error('Google Sheets authentication required. Call authenticate() first.');
    }

    if (!this.fieldMapping) {
      throw new Error('Field mapping not set. Call confirmFieldMapping() first.');
    }

    const sheet = this.doc.sheetsByTitle[this.sheetName];
    if (!sheet) {
      throw new Error(`Sheet "${this.sheetName}" not found`);
    }

    const reverseMapping = {};
    for (const [sheetField, toonField] of Object.entries(this.fieldMapping)) {
      reverseMapping[toonField] = sheetField;
    }

    let addedCount = 0;
    const batchSize = RATE_LIMIT.batchSize;
    const retries = options.retries || 1;

    for (let i = 0; i < toonProspects.length; i += batchSize) {
      const batch = toonProspects.slice(i, Math.min(i + batchSize, toonProspects.length));
      const sheetRows = batch.map(toon => toonToSheetRow(toon, reverseMapping));

      let lastError = null;
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          await this.recordApiCall(() => sheet.addRows(sheetRows));
          addedCount += sheetRows.length;
          lastError = null;
          break;
        } catch (error) {
          lastError = error;
          if (attempt < retries - 1) {
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
          }
        }
      }

      if (lastError) {
        return {
          added: addedCount,
          total: toonProspects.length,
          error: lastError.message
        };
      }
    }

    return {
      added: addedCount,
      total: toonProspects.length
    };
  }

  /**
   * Update status for a specific prospect
   */
  async updateProspectStatus(email, newStatus) {
    if (!this.doc) {
      throw new Error('Google Sheets authentication required. Call authenticate() first.');
    }

    const sheet = this.doc.sheetsByTitle[this.sheetName];
    if (!sheet) {
      throw new Error(`Sheet "${this.sheetName}" not found`);
    }

    const rows = await this.recordApiCall(() => sheet.getRows());
    const targetRow = rows.find(r => r.Email?.toString().toLowerCase() === email.toLowerCase());

    if (!targetRow) {
      return {
        updated: 0,
        error: `Prospect with email "${email}" not found`
      };
    }

    targetRow.Status = newStatus;
    await this.recordApiCall(() => targetRow.save());

    return {
      updated: 1
    };
  }

  /**
   * Update specific fields in a prospect row (non-destructive write)
   *
   * @param {number} rowIndex - Row index (1-based, where 1 = first data row after header)
   * @param {Object} updates - Fields to update, e.g. { Timezone: 'EST', Notes: 'Called on 2026-01-15' }
   * @returns {Promise<{updated: number, rowIndex: number, error?: string}>}
   */
  async updateProspectRow(rowIndex, updates = {}) {
    if (!this.doc) {
      throw new Error('Google Sheets authentication required. Call authenticate() first.');
    }

    if (this.authMode !== 'write') {
      throw new Error('updateProspectRow requires write mode. Initialize with authMode="write".');
    }

    // Validate no protected fields
    const protectedSet = new Set(this.protectedFields || [
      'Name', 'Email', 'Company', 'Title', 'DateAdded', 'FirstContact'
    ]);

    for (const field of Object.keys(updates)) {
      if (protectedSet.has(field)) {
        return {
          updated: 0,
          rowIndex,
          error: `Cannot update protected field: ${field}`
        };
      }
    }

    const sheet = this.doc.sheetsByTitle[this.sheetName];
    if (!sheet) {
      return {
        updated: 0,
        rowIndex,
        error: `Sheet "${this.sheetName}" not found`
      };
    }

    try {
      const rows = await this.recordApiCall(() => sheet.getRows());

      // rowIndex is 1-based for user, but array is 0-based
      const targetRow = rows[rowIndex - 1];
      if (!targetRow) {
        return {
          updated: 0,
          rowIndex,
          error: `Row ${rowIndex} not found (total rows: ${rows.length})`
        };
      }

      // Apply updates
      for (const [field, value] of Object.entries(updates)) {
        targetRow[field] = value;
      }

      await this.recordApiCall(() => targetRow.save());

      return {
        updated: 1,
        rowIndex
      };
    } catch (error) {
      return {
        updated: 0,
        rowIndex,
        error: error.message
      };
    }
  }

  /**
   * Update prospect row by email address (find row, then update)
   *
   * @param {string} email - Prospect email address
   * @param {Object} updates - Fields to update
   * @returns {Promise<{updated: number, email: string, rowIndex?: number, error?: string}>}
   */
  async updateProspectByEmail(email, updates = {}) {
    if (!this.doc) {
      throw new Error('Google Sheets authentication required. Call authenticate() first.');
    }

    if (this.authMode !== 'write') {
      throw new Error('updateProspectByEmail requires write mode. Initialize with authMode="write".');
    }

    const sheet = this.doc.sheetsByTitle[this.sheetName];
    if (!sheet) {
      return {
        updated: 0,
        email,
        error: `Sheet "${this.sheetName}" not found`
      };
    }

    try {
      const rows = await this.recordApiCall(() => sheet.getRows());
      const targetRow = rows.find(r => r.Email?.toString().toLowerCase() === email.toLowerCase());

      if (!targetRow) {
        return {
          updated: 0,
          email,
          error: `Prospect with email "${email}" not found`
        };
      }

      // Find row index (1-based)
      const rowIndex = rows.indexOf(targetRow) + 1;

      // Use updateProspectRow for actual update (includes validation)
      return this.updateProspectRow(rowIndex, updates);
    } catch (error) {
      return {
        updated: 0,
        email,
        error: error.message
      };
    }
  }

  /**
   * Append new prospect row (new row, all fields)
   *
   * @param {Object} prospect - Prospect data in TOON format or sheet column format
   * @param {boolean} [toonFormat=false] - If true, convert from TOON to sheet columns
   * @returns {Promise<{appended: number, error?: string}>}
   */
  async appendProspectRow(prospect, toonFormat = false) {
    if (!this.doc) {
      throw new Error('Google Sheets authentication required. Call authenticate() first.');
    }

    if (this.authMode !== 'write') {
      throw new Error('appendProspectRow requires write mode. Initialize with authMode="write".');
    }

    const sheet = this.doc.sheetsByTitle[this.sheetName];
    if (!sheet) {
      return {
        appended: 0,
        error: `Sheet "${this.sheetName}" not found`
      };
    }

    try {
      // Convert TOON format to sheet columns if needed
      let sheetRow = prospect;
      if (toonFormat && this.fieldMapping) {
        const reverseMapping = {};
        for (const [sheetField, toonField] of Object.entries(this.fieldMapping)) {
          reverseMapping[toonField] = sheetField;
        }
        sheetRow = toonToSheetRow(prospect, reverseMapping);
      }

      await this.recordApiCall(() => sheet.addRows([sheetRow]));

      return {
        appended: 1
      };
    } catch (error) {
      return {
        appended: 0,
        error: error.message
      };
    }
  }

  /**
   * Full sync workflow: read, validate, exclude opt-outs
   */
  async fullSync() {
    if (!this.doc) {
      throw new Error('Google Sheets authentication required. Call authenticate() first.');
    }

    if (!this.fieldMapping) {
      await this.confirmFieldMapping(null, true);
    }

    // Read prospects and opt-outs
    const prospectsData = await this.readProspects({ includeMetadata: true });
    const optOuts = await this.readOptOuts();

    const optOutEmails = new Set(optOuts.map(o => o.em.toLowerCase()));

    // Filter out opted-out prospects
    const filteredProspects = prospectsData.prospects.filter(
      p => !optOutEmails.has((p.em || '').toLowerCase())
    );

    // Update metadata
    const updatedMetadata = {
      tot: filteredProspects.length,
      by_tr: this._countByTrack(filteredProspects),
      by_st: this._countByStatus(filteredProspects),
      lu: new Date().toISOString()
    };

    return {
      prospects: filteredProspects,
      metadata: updatedMetadata,
      summary: {
        totalRead: prospectsData.prospects.length,
        optedOutCount: optOuts.length,
        validatedCount: filteredProspects.length,
        trackBreakdown: updatedMetadata.by_tr,
        statusBreakdown: updatedMetadata.by_st
      }
    };
  }

  /**
   * Track API calls for rate limiting
   */
  recordApiCall(fn) {
    const now = Date.now();
    this.apiCallTimes = this.apiCallTimes.filter(
      t => now - t < RATE_LIMIT.windowMs
    );

    if (this.apiCallTimes.length >= RATE_LIMIT.maxCalls) {
      throw new Error('Rate limit exceeded (300 calls/min). Wait before retrying.');
    }

    this.apiCallTimes.push(now);
    this.apiCallCount++;

    return fn ? fn() : undefined;
  }

  /**
   * Get current API call count
   */
  getApiCallCount() {
    return this.apiCallCount;
  }

  /**
   * Invalidate cache (force re-detection of schema)
   */
  invalidateCache() {
    this.schema = null;
  }

  // ========================================================================
  // PRIVATE HELPERS
  // ========================================================================

  _countByTrack(prospects) {
    const counts = {
      'ai-enablement': 0,
      'product-maker': 0,
      'pace-car': 0
    };

    for (const p of prospects) {
      if (counts.hasOwnProperty(p.tr)) {
        counts[p.tr]++;
      }
    }

    return counts;
  }

  _countByStatus(prospects) {
    const counts = {};

    for (const status of VALID_STATUSES) {
      counts[status] = 0;
    }

    for (const p of prospects) {
      if (counts.hasOwnProperty(p.st)) {
        counts[p.st]++;
      }
    }

    return counts;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

const utils = require('./sheets-utils');

module.exports = {
  GoogleSheetsConnector,
  ...utils
};
