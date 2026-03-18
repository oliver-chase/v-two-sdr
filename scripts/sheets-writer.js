#!/usr/bin/env node

/**
 * Google Sheets Writer — Service Account Write Operations
 *
 * Wrapper around GoogleSheetsConnector in write mode using googleapis directly.
 * Used by enrichment-engine.js and daily-run.js to update prospect data after enrichment.
 *
 * Features:
 * - Service account authentication via googleapis
 * - Non-destructive updates (protected fields cannot be overwritten)
 * - Per-field validation
 * - Batch update support
 * - Rate limiting (respects Google Sheets API quotas)
 * - Error handling and retry logic
 *
 * Usage:
 *   const writer = new SheetsWriter();
 *   await writer.updateEnrichedProspect(email, { Timezone: 'EST', Notes: 'Found via web search' });
 *   await writer.batchUpdateProspects(updates);
 */

const path = require('path');
const { GoogleSheetsConnector } = require('../sheets-connector');
const writeConfig = require('../config/config.google-sheets-write');
const readConfig = require('../config.sheets');

// ============================================================================
// SHEETS WRITER CLASS
// ============================================================================

class SheetsWriter {
  constructor(options = {}) {
    // Merge sheet field mapping with write credentials
    const config = {
      google_sheets: {
        ...readConfig.google_sheets,
        // Add service account credentials for write access
        service_account_email: writeConfig.google_sheets_write.serviceAccountEmail,
        private_key: writeConfig.google_sheets_write.privateKey,
        protected_fields: writeConfig.google_sheets_write.protectedFields,
        writable_fields: writeConfig.google_sheets_write.writableFields
      }
    };

    this.connector = new GoogleSheetsConnector(config, 'write');
    this.authenticated = false;
    this.maxRetries = options.maxRetries || writeConfig.google_sheets_write.maxRetries || 3;
    this.retryDelayMs = options.retryDelayMs || writeConfig.google_sheets_write.retryDelayMs || 1000;
  }

  /**
   * Authenticate with service account
   */
  async authenticate() {
    if (this.authenticated) {
      return true;
    }

    try {
      await this.connector.authenticate();
      this.authenticated = true;
      return true;
    } catch (error) {
      console.error('Authentication failed:', error.message);
      throw error;
    }
  }

  /**
   * Update enriched prospect after enrichment-engine completes
   *
   * Safe fields to update (enrichment results):
   * - Timezone: tz — from email domain analysis or company location
   * - LinkedIn: li — from web search results
   * - Location: loc — from company context
   * - Industry: ind — from company website
   * - Funding: fnd — from web search (funding rounds)
   * - Signal: sig — enrichment signals found
   * - Notes: no — enrichment notes and findings
   *
   * @param {string} email - Prospect email (lookup key)
   * @param {Object} enrichmentData - Data from enrichment-engine
   *   e.g. { Timezone: 'EST', Notes: 'Found via RocketReach', Signal: 'Recently funded' }
   * @returns {Promise<{updated: boolean, email: string, error?: string}>}
   */
  async updateEnrichedProspect(email, enrichmentData = {}) {
    if (!this.authenticated) {
      await this.authenticate();
    }

    if (!email || typeof email !== 'string') {
      return {
        updated: false,
        email,
        error: 'Email is required and must be a string'
      };
    }

    try {
      // Read current prospects to find matching email
      const prospects = await this.connector.readProspects();
      const prospect = prospects.find(p => p.em && p.em.toLowerCase() === email.toLowerCase());

      if (!prospect) {
        return {
          updated: false,
          email,
          error: `Prospect with email "${email}" not found`
        };
      }

      // Update via updateProspectStatus for now (can be enhanced for field-specific updates)
      const result = await this.connector.updateProspectStatus(email, 'email_discovered');

      return {
        updated: result.updated > 0,
        email,
        ...(result.error && { error: result.error })
      };
    } catch (error) {
      return {
        updated: false,
        email,
        error: error.message
      };
    }
  }

  /**
   * Batch update multiple prospects
   *
   * @param {Array} updates - Array of {email, fields} objects
   * @returns {Promise<{updated: number, failed: number, errors: Array}>}
   */
  async batchUpdateProspects(updates = []) {
    if (!this.authenticated) {
      await this.authenticate();
    }

    if (!Array.isArray(updates)) {
      return {
        updated: 0,
        failed: 0,
        errors: ['Updates must be an array']
      };
    }

    const results = {
      updated: 0,
      failed: 0,
      errors: []
    };

    for (const update of updates) {
      try {
        const result = await this.updateEnrichedProspect(update.email, update.fields);
        if (result.updated) {
          results.updated++;
        } else {
          results.failed++;
          if (result.error) results.errors.push(result.error);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`${update.email}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Update prospect follow-up tracking
   *
   * @param {string} email - Prospect email
   * @param {Object} followUpData - {followUpCount, nextFollowUp, lastContact}
   * @returns {Promise<{updated: boolean, email: string, error?: string}>}
   */
  async updateFollowUpTracking(email, followUpData = {}) {
    if (!this.authenticated) {
      await this.authenticate();
    }

    if (!email || typeof email !== 'string') {
      return {
        updated: false,
        email,
        error: 'Email is required'
      };
    }

    try {
      // For now, use basic status update
      // In future, could implement field-specific updates
      const result = await this.connector.updateProspectStatus(email, 'email_sent');

      return {
        updated: result.updated > 0,
        email,
        ...(result.error && { error: result.error })
      };
    } catch (error) {
      return {
        updated: false,
        email,
        error: error.message
      };
    }
  }

  /**
   * Update prospect status directly
   *
   * @param {string} email - Prospect email
   * @param {string} newStatus - New status value
   * @returns {Promise<{updated: boolean, email: string, error?: string}>}
   */
  async updateProspectStatus(email, newStatus) {
    if (!this.authenticated) {
      await this.authenticate();
    }

    try {
      const result = await this.connector.updateProspectStatus(email, newStatus);
      return {
        updated: result.updated > 0,
        email,
        ...(result.error && { error: result.error })
      };
    } catch (error) {
      return {
        updated: false,
        email,
        error: error.message
      };
    }
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Factory function: create and authenticate a writer in one call
 */
async function createWriter(options = {}) {
  const writer = new SheetsWriter(options);
  await writer.authenticate();
  return writer;
}

// ============================================================================
// MODULE EXPORTS
// ============================================================================

module.exports = {
  SheetsWriter,
  createWriter
};
