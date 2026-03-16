/**
 * Mailer — Gmail SMTP email sender for SDR outreach
 *
 * Responsibilities:
 * - Merge prospect data into templates ({{firstName}}, {{company}}, etc.)
 * - Send via Gmail SMTP with BCC
 * - Enforce daily limits and per-send delay
 * - Log every send to outreach/sends.json (TOON format)
 * - Return structured result for state machine
 */

const nodemailer = require('nodemailer');
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
  constructor(config) {
    this.config = config;
    this.transporter = null;
  }

  /**
   * Initialize SMTP transporter
   */
  connect() {
    if (this.transporter) return;

    if (!this.config.smtp.user || !this.config.smtp.pass) {
      throw new Error('OUTLOOK_USER and OUTLOOK_PASSWORD must be set in .env');
    }

    this.transporter = nodemailer.createTransport({
      host: this.config.smtp.host,
      port: this.config.smtp.port,
      secure: this.config.smtp.secure,
      requireTLS: this.config.smtp.requireTLS,
      auth: {
        user: this.config.smtp.user,
        pass: this.config.smtp.pass
      }
    });
  }

  /**
   * Verify SMTP connection
   */
  async verify() {
    this.connect();
    return this.transporter.verify();
  }

  /**
   * Send a single email to a prospect
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

    const mailOptions = {
      from: `"${this.config.sender.name}" <${this.config.sender.email}>`,
      to: prospect.em,
      bcc: this.config.sender.bcc,
      subject,
      text: body
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      const result = { ok: true, messageId: info.messageId };
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
