/**
 * Google Sheets Connector — Using googleapis Sheets v4 API directly
 *
 * Bidirectional sync between Google Sheets and prospects.json
 * Features:
 * - Service account authentication with googleapis
 * - Dynamic schema inference (detect columns → TOON field mapping)
 * - Field confirmation workflow (user validates mapping)
 * - Read operations (sync all leads from Sheet)
 * - Write operations (append enriched fields, state updates)
 * - Batch API optimization (respect rate limits, caching)
 */

const { google } = require('googleapis');
const fs = require('fs');
const {
  parseSheetRow,
  inferSchema,
  validateFieldMapping,
  toonToSheetRow,
  sheetRowToToon,
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
    this.sheets = null;
    this.authenticated = false;

    // Cache & rate limiting
    this.schema = null;
    // Use explicit field mapping from config if provided, otherwise will be inferred
    this.fieldMapping = config.google_sheets?.field_mapping || null;
    this.apiCallTimes = [];
    this.apiCallCount = 0;
  }

  /**
   * Authenticate with Google Sheets API using googleapis library
   *
   * Two modes:
   * - 'read' (default): Uses API key
   * - 'write': Uses service account with googleapis auth
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
      this.sheets = google.sheets({ version: 'v4', auth: key });
      this.authenticated = true;
      return true;
    } catch (error) {
      throw new Error(`Google Sheets authentication failed: ${error.message}`);
    }
  }

  /**
   * Authenticate using service account with googleapis
   */
  async _authenticateServiceAccount() {
    if (!this.serviceAccountEmail || !this.privateKey) {
      throw new Error(
        'Service account authentication required: GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY must be set'
      );
    }

    try {
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: this.serviceAccountEmail,
          private_key: this.privateKey
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      this.authenticated = true;
      return true;
    } catch (error) {
      throw new Error(`Service account authentication failed: ${error.message}`);
    }
  }

  /**
   * Get sheet metadata (columns, headers)
   */
  async _getSheetMetadata() {
    try {
      const response = await this.recordApiCall(() =>
        this.sheets.spreadsheets.get({
          spreadsheetId: this.sheetId,
          fields: 'sheets(properties,data(rowData(values(userEnteredValue))))'
        })
      );

      const sheet = response.data.sheets.find(s => s.properties.title === this.sheetName);
      if (!sheet) {
        throw new Error(`Sheet "${this.sheetName}" not found`);
      }

      return sheet;
    } catch (error) {
      throw new Error(`Failed to get sheet metadata: ${error.message}`);
    }
  }

  /**
   * Get all values from sheet
   */
  async _getSheetValues(range) {
    try {
      const response = await this.recordApiCall(() =>
        this.sheets.spreadsheets.values.get({
          spreadsheetId: this.sheetId,
          range: range || this.sheetName
        })
      );

      return response.data.values || [];
    } catch (error) {
      throw new Error(`Failed to get sheet values: ${error.message}`);
    }
  }

  /**
   * Detect schema from sheet headers
   */
  async detectSchema() {
    if (this.schema) {
      return this.schema;
    }

    if (!this.authenticated) {
      throw new Error('Google Sheets authentication required. Call authenticate() first.');
    }

    try {
      const values = await this._getSheetValues(`${this.sheetName}!A1:Z1`);

      if (values.length === 0) {
        throw new Error(`Sheet "${this.sheetName}" has no headers`);
      }

      const headers = values[0];
      this.schema = inferSchema(headers);

      return this.schema;
    } catch (error) {
      throw new Error(`Failed to detect schema: ${error.message}`);
    }
  }

  /**
   * Confirm field mapping from sheet headers to TOON fields
   */
  async confirmFieldMapping() {
    if (this.fieldMapping) {
      return this.fieldMapping;
    }

    const schema = await this.detectSchema();

    // Default mapping: use schema as-is
    const mapping = {};
    for (const [sheetField, toonField] of Object.entries(schema)) {
      mapping[sheetField] = toonField;
    }

    const validation = validateFieldMapping(mapping);
    if (!validation.valid) {
      throw new Error(`Invalid field mapping: ${validation.errors.join(', ')}`);
    }

    this.fieldMapping = mapping;
    return this.fieldMapping;
  }

  /**
   * Read all prospects from sheet
   */
  async readProspects() {
    if (!this.authenticated) {
      throw new Error('Google Sheets authentication required. Call authenticate() first.');
    }

    if (!this.fieldMapping) {
      await this.confirmFieldMapping();
    }

    try {
      const values = await this._getSheetValues(this.sheetName);

      if (values.length < 2) {
        return [];
      }

      const headers = values[0];
      const prospects = [];

      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        if (!row || row.length === 0) continue;

        const sheetRow = {};
        for (let j = 0; j < headers.length; j++) {
          sheetRow[headers[j]] = row[j] || '';
        }

        const toonProspect = parseSheetRow(sheetRow, this.fieldMapping, i + 1);
        prospects.push(toonProspect);
      }

      return prospects;
    } catch (error) {
      throw new Error(`Failed to read prospects: ${error.message}`);
    }
  }

  /**
   * Read opt-out list
   */
  async readOptOuts() {
    if (!this.authenticated) {
      throw new Error('Google Sheets authentication required. Call authenticate() first.');
    }

    try {
      const values = await this._getSheetValues(this.optOutsSheetName);

      if (values.length < 2) {
        return [];
      }

      const emails = [];
      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        if (row && row[0]) {
          emails.push(row[0].toLowerCase());
        }
      }

      return emails;
    } catch (error) {
      console.warn(`Warning: Could not read opt-outs: ${error.message}`);
      return [];
    }
  }

  /**
   * Append prospects to sheet
   */
  async appendProspects(toonProspects, options = {}) {
    if (!this.authenticated) {
      throw new Error('Google Sheets authentication required. Call authenticate() first.');
    }

    if (!this.fieldMapping) {
      throw new Error('Field mapping not set. Call confirmFieldMapping() first.');
    }

    try {
      console.log(`[SDR] Writing to sheet: "${this.sheetName}"`);

      const reverseMapping = {};
      for (const [sheetField, toonField] of Object.entries(this.fieldMapping)) {
        reverseMapping[toonField] = sheetField;
      }

      let addedCount = 0;
      const batchSize = RATE_LIMIT.batchSize;
      const retries = options.retries || 1;

      // Get current row count
      const values = await this._getSheetValues(this.sheetName);
      let nextRowIndex = values.length + 1;

      for (let i = 0; i < toonProspects.length; i += batchSize) {
        const batch = toonProspects.slice(i, Math.min(i + batchSize, toonProspects.length));
        const batchIndex = Math.floor(i / batchSize);

        console.log(`[SDR] Batch ${batchIndex + 1}: Writing ${batch.length} row(s)...`);

        const sheetRows = batch.map(toon => {
          const sheetRow = toonToSheetRow(toon, reverseMapping);
          // Convert to array format for sheets API
          return Object.values(this.fieldMapping).map(field => sheetRow[field] || '');
        });

        let lastError = null;
        let addedInBatch = 0;

        for (let attempt = 0; attempt < retries; attempt++) {
          try {
            const range = `${this.sheetName}!A${nextRowIndex}`;

            await this.recordApiCall(() =>
              this.sheets.spreadsheets.values.update({
                spreadsheetId: this.sheetId,
                range,
                valueInputOption: 'RAW',
                resource: {
                  values: sheetRows
                }
              })
            );

            // Verify rows were written
            if (!sheetRows || sheetRows.length === 0) {
              throw new Error('No rows to write');
            }

            sheetRows.forEach((row, idx) => {
              console.log(`[SDR]   Row ${nextRowIndex + idx}: ${row[0] || '(no name)'}`);
            });

            addedInBatch = sheetRows.length;
            addedCount += addedInBatch;
            nextRowIndex += addedInBatch;
            lastError = null;
            break;
          } catch (error) {
            lastError = error;
            console.error(`[SDR] Batch ${batchIndex + 1} attempt ${attempt + 1} failed: ${error.message}`);
            if (attempt < retries - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
            }
          }
        }

        if (lastError) {
          throw new Error(`Failed to add batch ${batchIndex + 1}: ${lastError.message}`);
        }

        if (addedInBatch === 0) {
          throw new Error(`Batch ${batchIndex + 1} returned 0 rows added - silent write failure detected`);
        }
      }

      console.log(`[SDR] Successfully wrote ${addedCount}/${toonProspects.length} prospect(s)`);

      return {
        added: addedCount,
        total: toonProspects.length
      };
    } catch (error) {
      return {
        added: 0,
        total: toonProspects.length,
        error: error.message
      };
    }
  }

  /**
   * Update prospect status
   */
  async updateProspectStatus(email, newStatus) {
    if (!this.authenticated) {
      throw new Error('Google Sheets authentication required. Call authenticate() first.');
    }

    if (!this.fieldMapping) {
      await this.confirmFieldMapping();
    }

    try {
      const prospects = await this.readProspects();
      const prospect = prospects.find(p => p.em && p.em.toLowerCase() === email.toLowerCase());

      if (!prospect) {
        return {
          updated: 0,
          error: `Prospect with email "${email}" not found`
        };
      }

      const rowIndex = prospect.rowIndex;
      const statusField = Object.keys(this.fieldMapping).find(k => this.fieldMapping[k] === 'st');

      if (!statusField) {
        return {
          updated: 0,
          error: 'Status field not found in sheet'
        };
      }

      // Find column index
      const values = await this._getSheetValues(`${this.sheetName}!A1:Z1`);
      const colIndex = values[0].indexOf(statusField);

      if (colIndex === -1) {
        return {
          updated: 0,
          error: 'Status column not found'
        };
      }

      const colLetter = String.fromCharCode(65 + colIndex);

      await this.recordApiCall(() =>
        this.sheets.spreadsheets.values.update({
          spreadsheetId: this.sheetId,
          range: `${this.sheetName}!${colLetter}${rowIndex}`,
          valueInputOption: 'RAW',
          resource: {
            values: [[newStatus]]
          }
        })
      );

      return { updated: 1 };
    } catch (error) {
      return {
        updated: 0,
        error: error.message
      };
    }
  }

  /**
   * Rate limit tracking and recording
   */
  recordApiCall(apiCall) {
    const now = Date.now();
    this.apiCallTimes.push(now);

    // Remove old timestamps outside the rate limit window
    const windowStart = now - 60000; // 60 seconds
    this.apiCallTimes = this.apiCallTimes.filter(t => t > windowStart);

    // Check if we're within rate limits
    if (this.apiCallTimes.length > RATE_LIMIT.requestsPerMinute) {
      const oldestCall = this.apiCallTimes[0];
      const waitTime = 60000 - (now - oldestCall) + 100;
      console.log(`[SDR] Rate limit approaching (${this.apiCallTimes.length}/${RATE_LIMIT.requestsPerMinute}), waiting ${waitTime}ms`);
      return new Promise((resolve, reject) => {
        setTimeout(() => apiCall().then(resolve).catch(reject), waitTime);
      });
    }

    return apiCall();
  }

  /**
   * Full sync workflow
   */
  async fullSync(options = {}) {
    try {
      const prospects = await this.readProspects();
      const optOuts = await this.readOptOuts();

      // Filter out opted-out prospects
      const filtered = prospects.filter(p => !optOuts.includes(p.em?.toLowerCase()));

      return {
        prospects: filtered,
        metadata: {
          total: prospects.length,
          optedOut: prospects.length - filtered.length,
          lastUpdate: new Date().toISOString()
        },
        summary: `Synced ${filtered.length}/${prospects.length} prospects (${prospects.length - filtered.length} opted out)`
      };
    } catch (error) {
      throw new Error(`Full sync failed: ${error.message}`);
    }
  }

  /**
   * Clear cached schema and mapping
   */
  clearCache() {
    this.schema = null;
    this.fieldMapping = null;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  GoogleSheetsConnector,
  parseSheetRow,
  inferSchema,
  validateFieldMapping,
  toonToSheetRow,
  sheetRowToToon,
  VALID_STATUSES
};
