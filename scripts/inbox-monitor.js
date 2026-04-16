/**
 * Inbox Monitor
 * Checks Gmail IMAP for replies to sent outreach emails.
 * Classifies replies and logs to outreach/replies.json.
 *
 * checkInbox(config) → { checked, newReplies, classified }
 * buildConfig()      → imap config object from process.env
 * _stripRePrefix(subject) → string (exported for testing)
 * _findSendBySubject(subject, sends) → send object | null (exported for testing)
 * _appendReply(repliesLog, reply) → void (exported for testing)
 */

const fs = require('fs');
const path = require('path');
const { ImapFlow } = require('imapflow');
const { classifyReply } = require('./reply-classifier');

// ============================================================================
// CONSTANTS
// ============================================================================

const IMAP_HOST = 'outlook.office365.com';
const IMAP_PORT = 993;
const LOOKBACK_DAYS = 30;

// ============================================================================
// buildConfig
// ============================================================================

/**
 * Build IMAP config from environment variables.
 * OUTLOOK_USER and OUTLOOK_PASSWORD must be set.
 *
 * @returns {{ outlook: { user, pass }, imap: { host, port } }}
 */
function buildConfig() {
  return {
    outlook: {
      user: process.env.OUTLOOK_USER || '',
      pass: process.env.OUTLOOK_PASSWORD || ''
    },
    imap: {
      host: IMAP_HOST,
      port: IMAP_PORT
    }
  };
}

// ============================================================================
// SUBJECT HELPERS
// ============================================================================

/**
 * Strip "Re: " (case-insensitive) from a subject line.
 *
 * @param {string} subject
 * @returns {string}
 */
function _stripRePrefix(subject) {
  if (!subject) return '';
  return subject.replace(/^re:\s*/i, '');
}

/**
 * Find a sent email record whose subject matches a reply subject.
 * Comparison is case-insensitive after stripping "Re: ".
 *
 * @param {string} replySubject - Subject from inbox (with or without "Re: ")
 * @param {Array}  sends        - Array of send records from sends.json
 * @returns {Object|null} Matching send record, or null
 */
function _findSendBySubject(replySubject, sends) {
  const cleaned = _stripRePrefix(replySubject).toLowerCase().trim();
  return sends.find(s => s.su && s.su.toLowerCase().trim() === cleaned) || null;
}

// ============================================================================
// REPLY LOGGING
// ============================================================================

/**
 * Append a classified reply to the replies log JSON file.
 * Creates the file (as an empty array) if it does not exist.
 *
 * @param {string} repliesLog - Absolute path to replies.json
 * @param {Object} reply      - Reply record to append
 */
function _appendReply(repliesLog, reply) {
  let existing = [];
  if (fs.existsSync(repliesLog)) {
    try {
      existing = JSON.parse(fs.readFileSync(repliesLog, 'utf8'));
      if (!Array.isArray(existing)) existing = [];
    } catch (_) {
      existing = [];
    }
  }
  existing.push(reply);
  fs.writeFileSync(repliesLog, JSON.stringify(existing, null, 2));
}

// ============================================================================
// LOADS SENDS JSON
// ============================================================================

/**
 * Load sends from sends.json, resolving relative paths from the SDR root.
 *
 * @param {string} sendsLogPath - Relative path (e.g. "outreach/sends.json")
 * @returns {Array} Array of send records
 */
function _loadSends(sendsLogPath) {
  const resolved = path.resolve(__dirname, '..', sendsLogPath);
  if (!fs.existsSync(resolved)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(resolved, 'utf8'));
    // sends.json can be { sends: [...] } or a bare array
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.sends)) return data.sends;
    return [];
  } catch (_) {
    return [];
  }
}

// ============================================================================
// SNIPPET EXTRACTION
// ============================================================================

/**
 * Extract a short text snippet from a message body.
 *
 * @param {string} text - Full email body text
 * @param {number} maxLen - Max snippet length (default 200)
 * @returns {string}
 */
function _snippet(text, maxLen = 200) {
  if (!text) return '';
  const trimmed = text.replace(/\s+/g, ' ').trim();
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) + '...' : trimmed;
}

// ============================================================================
// DATE HELPERS
// ============================================================================

/**
 * Return a Date object N days in the past.
 */
function _daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ============================================================================
// MAIN: checkInbox
// ============================================================================

/**
 * Connect to Outlook IMAP, search for replies, classify them, and log results.
 *
 * @param {Object} config
 * @param {Object} config.outlook        - { user, pass }
 * @param {Object} [config.imap]         - Override imap host/port
 * @param {Object} [config.paths]        - { sendsLog, repliesLog }
 * @returns {Promise<{ checked: number, newReplies: number, classified: Array }>}
 */
async function checkInbox(config) {
  const outlookUser = config.outlook?.user || process.env.OUTLOOK_USER || '';
  const outlookPass = config.outlook?.pass || process.env.OUTLOOK_PASSWORD || '';
  const accessToken = config.outlook?.accessToken || null;

  const imapHost = config.imap?.host || IMAP_HOST;
  const imapPort = config.imap?.port || IMAP_PORT;

  const sendsLogPath = config.paths?.sendsLog || 'outreach/sends.json';
  const repliesLogPath = path.resolve(
    __dirname,
    '..',
    config.paths?.repliesLog || 'outreach/replies.json'
  );

  const sends = _loadSends(sendsLogPath);

  // Prefer OAuth access token over password — M365 blocks basic auth by default
  const auth = accessToken
    ? { user: outlookUser, accessToken }
    : { user: outlookUser, pass: outlookPass };

  const client = new ImapFlow({
    host: imapHost,
    port: imapPort,
    secure: true,
    auth,
    logger: false
  });

  const classified = [];
  let checked = 0;

  try {
    await client.connect();

    const lock = await client.getMailboxLock('INBOX');

    try {
      // Search for messages with "Re:" in subject received in the last 30 days
      const since = _daysAgo(LOOKBACK_DAYS);
      const uids = await client.search({
        since,
        subject: 'Re:'
      });

      if (uids && uids.length > 0) {
        const messages = client.fetch(uids, {
          envelope: true,
          bodyStructure: false,
          source: true
        });

        for await (const msg of messages) {
          checked++;

          const subject = msg.envelope?.subject || '';
          const strippedSubject = _stripRePrefix(subject);
          const matchedSend = _findSendBySubject(strippedSubject, sends);

          if (!matchedSend) continue;

          // Extract plain text from source buffer
          const bodyText = msg.source ? msg.source.toString('utf8') : '';
          const { classification, confidence, signals } = classifyReply(bodyText, subject);

          const ts = msg.envelope?.date
            ? new Date(msg.envelope.date).toISOString()
            : new Date().toISOString();

          const reply = {
            id: matchedSend.id,
            em: matchedSend.em,
            classification,
            confidence,
            ts,
            snippet: _snippet(bodyText)
          };

          _appendReply(repliesLogPath, reply);
          classified.push(reply);
        }
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }

  return {
    checked,
    newReplies: classified.length,
    classified
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  checkInbox,
  buildConfig,
  // Exported for unit testing
  _stripRePrefix,
  _findSendBySubject,
  _appendReply
};
