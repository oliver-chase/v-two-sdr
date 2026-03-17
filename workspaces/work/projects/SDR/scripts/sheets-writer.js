#!/usr/bin/env node

/**
 * Google Sheets Writer — Service Account Write Operations
 *
 * Wrapper around GoogleSheetsConnector in write mode.
 * Used by enrichment-engine.js and daily-run.js to update prospect data after enrichment.
 *
 * Features:
 * - Service account OAuth authentication
 * - Non-destructive updates (protected fields cannot be overwritten)
 * - Per-field field validation
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
    // Merge write config with sheet config
    const config = {
      google_sheets: {
        ...readConfig.google_sheets,
        ...writeConfig.google_sheets_write,
        // Ensure write mode is set
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

    // Filter to only writable fields
    const writableSet = new Set(writeConfig.google_sheets_write.writableFields || [
      'Timezone', 'LinkedIn', 'Location', 'Industry', 'Funding', 'Signal', 'Notes'
    ]);

    const safeUpdates = {};
    for (const [field, value] of Object.entries(enrichmentData)) {
      if (writableSet.has(field) && value !== null && value !== undefined) {
        safeUpdates[field] = value;
      }
    }

    if (Object.keys(safeUpdates).length === 0) {
      return {
        updated: false,
        email,
        reason: 'No valid fields to update'
      };
    }

    // Retry logic
    let lastError = null;
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const result = await this.connector.updateProspectByEmail(email, safeUpdates);

        if (result.updated === 1) {
          return {
            updated: true,
            email,
            fieldsUpdated: Object.keys(safeUpdates).length
          };
        }

        // updateProspectByEmail returned an error
        lastError = result.error;

        if (attempt < this.maxRetries - 1) {
          // Exponential backoff
          const delayMs = this.retryDelayMs * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        lastError = error.message;

        if (attempt < this.maxRetries - 1) {
          const delayMs = this.retryDelayMs * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    return {
      updated: false,
      email,
      error: lastError || 'Max retries exceeded'
    };
  }

  /**
   * Batch update multiple prospects (for efficiency)
   *
   * @param {Array} updates - Array of {email, data} objects
   *   e.g. [
   *     { email: 'john@example.com', data: { Timezone: 'EST', Notes: 'High intent' } },
   *     { email: 'jane@example.com', data: { Timezone: 'PST' } }
   *   ]
   * @returns {Promise<{total: number, succeeded: number, failed: number, errors: Array}>}
   */
  async batchUpdateProspects(updates = []) {
    if (!this.authenticated) {
      await this.authenticate();
    }

    if (!Array.isArray(updates) || updates.length === 0) {
      return {
        total: 0,
        succeeded: 0,
        failed: 0,
        errors: []
      };
    }

    const results = {
      total: updates.length,
      succeeded: 0,
      failed: 0,
      errors: []
    };

    for (const update of updates) {
      const result = await this.updateEnrichedProspect(update.email, update.data);

      if (result.updated) {
        results.succeeded++;
      } else {
        results.failed++;
        results.errors.push({
          email: update.email,
          reason: result.error || result.reason
        });
      }
    }

    return results;
  }

  /**
   * Update prospect status (state machine transitions)
   *
   * @param {string} email - Prospect email
   * @param {string} newStatus - New status (e.g., 'email_discovered', 'draft_generated', 'email_sent')
   * @returns {Promise<{updated: boolean, email: string, error?: string}>}
   */
  async updateProspectStatus(email, newStatus) {
    if (!this.authenticated) {
      await this.authenticate();
    }

    // Validate status
    const validStatuses = [
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

    if (!validStatuses.includes(newStatus)) {
      return {
        updated: false,
        email,
        error: `Invalid status: ${newStatus}. Must be one of: ${validStatuses.join(', ')}`
      };
    }

    return this.updateEnrichedProspect(email, { Status: newStatus });
  }

  /**
   * Add follow-up tracking fields
   *
   * @param {string} email - Prospect email
   * @param {Object} followUpData - {LastContact, FollowUpCount, NextFollowUp, Notes}
   * @returns {Promise<{updated: boolean, email: string, error?: string}>}
   */
  async updateFollowUpTracking(email, followUpData = {}) {
    if (!this.authenticated) {
      await this.authenticate();
    }

    const safeData = {};

    // Only allow specific follow-up fields
    if (followUpData.LastContact) safeData.LastContact = followUpData.LastContact;
    if (followUpData.FollowUpCount !== undefined) safeData.FollowUpCount = followUpData.FollowUpCount;
    if (followUpData.NextFollowUp) safeData.NextFollowUp = followUpData.NextFollowUp;
    if (followUpData.Notes) safeData.Notes = followUpData.Notes;

    if (Object.keys(safeData).length === 0) {
      return {
        updated: false,
        email,
        reason: 'No follow-up fields provided'
      };
    }

    return this.updateEnrichedProspect(email, safeData);
  }

  /**
   * Get API call count (for monitoring rate limits)
   */
  getApiCallCount() {
    return this.connector.getApiCallCount();
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  SheetsWriter,

  /**
   * Factory function: create and authenticate a writer in one call
   */
  async createWriter(options = {}) {
    const writer = new SheetsWriter(options);
    await writer.authenticate();
    return writer;
  }
};
