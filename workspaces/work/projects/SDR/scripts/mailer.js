/**
 * Mailer — Microsoft Graph API email sender for SDR outreach
 *
 * Responsibilities:
 * - Merge prospect data into templates ({{firstName}}, {{company}}, etc.)
 * - Send via Microsoft Graph API with OAuth token management
 * - Enforce daily limits and per-send delay
 * - Log every send to outreach/sends.json (TOON format)
 * - Return structured result for state machine
 */

const { OAuthClient } = require('./oauth-client');
const fs = require('fs');
const path = require('path');

// ============================================================================
// TEMPLATE MERGING
// ============================================================================

/**
 * Replace {{placeholders}} in template with prospect TOON fields
 * Supports: {{firstName}}, {{lastName}}, {{company}}, {{title}}
 */
function mergeTemplate(template, prospect) {
  return template
    .replace(/\{\{firstName\}\}/gi, prospect.fn || '')
    .replace(/\{\{lastName\}\}/gi, prospect.ln || '')
    .replace(/\{\{company\}\}/gi, prospect.co || '')
    .replace(/\{\{title\}\}/gi, prospect.ti || '');
}

// ============================================================================
// DAILY LIMIT TRACKING
// ============================================================================

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function countTodaySends(sendsLog) {
  if (!fs.existsSync(sendsLog)) return 0;

  const sends = JSON.parse(fs.readFileSync(sendsLog, 'utf8'));
  const today = getTodayKey();
  return sends.filter(s => s.sd && s.sd.startsWith(today)).length;
}

// ============================================================================
// LOGGING
// ============================================================================

function logSend(sendsLog, prospect, subject, result) {
  const sends = fs.existsSync(sendsLog)
    ? JSON.parse(fs.readFileSync(sendsLog, 'utf8'))
    : [];

  sends.push({
    id: prospect.id,
    em: prospect.em,
    fn: prospect.fn,
    co: prospect.co,
    su: subject,
    sd: new Date().toISOString(),
    ok: result.ok,
    er: result.error || null,
    ms: result.messageId || null
  });

  fs.writeFileSync(sendsLog, JSON.stringify(sends, null, 2));
}

// ============================================================================
// MAILER CLASS
// ============================================================================

class Mailer {
  constructor(config, oauthConfig) {
    this.config = config;
    this.oauthConfig = oauthConfig;
    this.oauthClient = null;
  }

  /**
   * Initialize OAuth client with token caching
   */
  connect() {
    if (this.oauthClient) return;

    if (!this.oauthConfig || !this.oauthConfig.azure) {
      throw new Error('OAuth config must be provided to Mailer');
    }

    this.oauthClient = new OAuthClient(this.oauthConfig);
  }

  /**
   * Verify OAuth connection by attempting to get access token
   */
  async verify() {
    this.connect();

    try {
      await this.oauthClient.getAccessToken();
      return true;
    } catch (error) {
      throw new Error(`OAuth verification failed: ${error.message}`);
    }
  }

  /**
   * Send a single email to a prospect via Microsoft Graph API
   *
   * @param {Object} opts
   * @param {Object} opts.prospect - TOON prospect object
   * @param {string} opts.subject - Email subject (pre-merged)
   * @param {string} opts.body - Email body (pre-merged)
   * @returns {{ ok: boolean, messageId?: string, error?: string }}
   */
  async send({ prospect, subject, body }) {
    this.connect();

    const sendsLog = path.resolve(__dirname, '..', this.config.paths.sendsLog);
    const todayCount = countTodaySends(sendsLog);

    if (todayCount >= this.config.limits.maxDaily) {
      return {
        ok: false,
        error: `Daily limit reached (${this.config.limits.maxDaily} sends/day)`
      };
    }

    try {
      const result = await this.oauthClient.sendMailWithRetry({
        to: prospect.em,
        subject,
        body,
        from: this.config.sender.name,
        bcc: this.config.sender.bcc
      });

      logSend(sendsLog, prospect, subject, result);
      return result;
    } catch (error) {
      const result = { ok: false, error: error.message };
      logSend(sendsLog, prospect, subject, result);
      return result;
    }
  }

  /**
   * Send a batch with delay between each
   * Returns array of results in same order as prospects
   */
  async sendBatch(emails, { delayMs } = {}) {
    const delay = delayMs ?? this.config.limits.delayMs;
    const results = [];

    for (let i = 0; i < emails.length; i++) {
      const result = await this.send(emails[i]);
      results.push(result);

      if (!result.ok && result.error?.includes('Daily limit')) break;
      if (i < emails.length - 1) {
        await new Promise(r => setTimeout(r, delay));
      }
    }

    return results;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = { Mailer, mergeTemplate, countTodaySends };
