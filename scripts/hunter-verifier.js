#!/usr/bin/env node

/**
 * Hunter.io Email Verifier
 *
 * Email verification using Hunter.io v2/email-verifier endpoint ONLY
 * DO NOT use Finder API (email discovery - that's web search only)
 *
 * Responsibilities:
 * - Verify email addresses against Hunter's database
 * - Return status: 'valid' | 'risky' | 'invalid' | 'valid_catchall'
 * - Track API credits (1 credit per verification)
 * - Error handling: 401 (invalid key), 429 (rate limit), etc.
 * - Warn when approaching quota
 *
 * Integration: enrichment-engine.js calls verifyEmail() for borderline candidates (score 0.5-0.8)
 * Skips verification for high-confidence candidates (score >= 0.9)
 *
 * API: Hunter.io v2/email-verifier
 * Cost: 1 credit per verification
 * Free tier: 50 credits/month
 */

const https = require('https');
const url = require('url');

const HUNTER_API_URL = 'https://api.hunter.io/v2/email-verifier';
const REQUEST_TIMEOUT = 10000; // 10 second timeout for verification
const CREDIT_WARNING_THRESHOLD = 10; // Warn when remaining credits < 10

let verificationCount = 0;
let creditWarningIssued = false;

/**
 * Parse Hunter API response
 *
 * @param {string} data - Raw API response
 * @returns {Object|null} Parsed response or null if parse fails
 */
function parseHunterResponse(data) {
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error(`[hunter-verifier] Failed to parse API response: ${error.message}`);
    return null;
  }
}

/**
 * Call Hunter.io v2/email-verifier API
 * Verifies email and returns deliverability status
 *
 * @param {string} email - Email address to verify
 * @param {string} apiKey - Hunter.io API key
 * @returns {Promise<Object>} Response object
 */
function callHunterAPI(email, apiKey) {
  return new Promise((resolve) => {
    if (!apiKey) {
      console.warn('[hunter-verifier] HUNTER_IO_API_KEY not set, skipping verification');
      resolve({
        success: false,
        error: 'API_KEY_MISSING',
        email,
        status: null
      });
      return;
    }

    if (!email || !email.includes('@')) {
      resolve({
        success: false,
        error: 'INVALID_EMAIL',
        email,
        status: null
      });
      return;
    }

    const params = new URLSearchParams({
      email,
      domain: email.split('@')[1] // Include domain for better verification
    });

    const requestUrl = `${HUNTER_API_URL}?${params.toString()}`;
    const options = new url.URL(requestUrl);
    options.headers = {
      'Authorization': `Bearer ${apiKey}`,
      'User-Agent': 'SDR-Hunter-Verifier/1.0'
    };

    const request = https.get(options, { timeout: REQUEST_TIMEOUT }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        verificationCount++;

        // Handle error responses
        if (res.statusCode === 401) {
          console.error('[hunter-verifier] Invalid API key (401)');
          resolve({
            success: false,
            error: 'INVALID_API_KEY',
            email,
            status: null,
            statusCode: 401
          });
          return;
        }

        if (res.statusCode === 429) {
          console.warn('[hunter-verifier] Rate limit exceeded (429)');
          resolve({
            success: false,
            error: 'RATE_LIMIT_EXCEEDED',
            email,
            status: null,
            statusCode: 429
          });
          return;
        }

        if (res.statusCode === 400) {
          const parsed = parseHunterResponse(data);
          if (parsed && parsed.errors) {
            console.warn(`[hunter-verifier] Bad request: ${parsed.errors[0]?.message}`);
          }
          resolve({
            success: false,
            error: 'BAD_REQUEST',
            email,
            status: null,
            statusCode: 400
          });
          return;
        }

        if (res.statusCode !== 200) {
          console.warn(`[hunter-verifier] API returned ${res.statusCode}`);
          resolve({
            success: false,
            error: `HTTP_${res.statusCode}`,
            email,
            status: null,
            statusCode: res.statusCode
          });
          return;
        }

        // Parse successful response
        const parsed = parseHunterResponse(data);
        if (!parsed || !parsed.data) {
          resolve({
            success: false,
            error: 'INVALID_RESPONSE',
            email,
            status: null
          });
          return;
        }

        // Extract result from response
        const data_obj = parsed.data;
        const status = data_obj.status; // 'valid' | 'risky' | 'invalid' | 'valid_catchall'
        const score = data_obj.score || 0; // Confidence score (0-100)
        const result = data_obj.result; // 'deliverable' | 'undeliverable' | 'risky' | 'unknown'

        // Handle credit tracking
        const credits = parsed.meta?.credits_remaining;
        if (credits !== undefined && credits < CREDIT_WARNING_THRESHOLD && !creditWarningIssued) {
          creditWarningIssued = true;
          console.warn(`[hunter-verifier] Approaching credit limit: ${credits} credits remaining (free tier: 50/month)`);
        }

        resolve({
          success: true,
          email,
          status,
          result,
          score,
          sources: data_obj.sources || [],
          creditsRemaining: credits,
          verifiedAt: new Date().toISOString()
        });
      });
    });

    request.on('timeout', () => {
      request.destroy();
      console.warn('[hunter-verifier] API request timed out');
      resolve({
        success: false,
        error: 'REQUEST_TIMEOUT',
        email,
        status: null
      });
    });

    request.on('error', (error) => {
      console.error(`[hunter-verifier] API request failed: ${error.message}`);
      resolve({
        success: false,
        error: 'REQUEST_FAILED',
        message: error.message,
        email,
        status: null
      });
    });
  });
}

/**
 * Verify email address using Hunter.io
 *
 * Main entry point: called by enrichment-engine for borderline candidates
 *
 * Returns status:
 * - 'valid': Email exists and is deliverable
 * - 'valid_catchall': Email domain accepts all (risky)
 * - 'risky': Email exists but may bounce
 * - 'invalid': Email doesn't exist
 * - null: Verification failed (use enrichment-engine fallback logic)
 *
 * @param {string} email - Email to verify
 * @param {string} apiKey - Hunter.io API key (defaults to env var)
 * @returns {Promise<Object>} Verification result
 */
async function verifyEmail(email, apiKey) {
  apiKey = apiKey || process.env.HUNTER_IO_API_KEY || '';

  if (!email) {
    return {
      success: false,
      error: 'NO_EMAIL',
      email: email || '',
      status: null
    };
  }

  // Call Hunter API
  const result = await callHunterAPI(email, apiKey);

  return result;
}

/**
 * Get verification statistics (for monitoring)
 *
 * @returns {Object} Stats
 */
function getVerificationStats() {
  return {
    verificationsThisSession: verificationCount,
    creditWarningIssued: creditWarningIssued
  };
}

/**
 * Reset stats (for testing)
 */
function resetStats() {
  verificationCount = 0;
  creditWarningIssued = false;
}

module.exports = {
  // Main function
  verifyEmail,

  // Internal (for testing)
  callHunterAPI,
  parseHunterResponse,

  // Utilities
  getVerificationStats,
  resetStats,

  // Constants
  HUNTER_API_URL
};
