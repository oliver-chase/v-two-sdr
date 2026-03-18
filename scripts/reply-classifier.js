/**
 * Reply Classifier
 * Pure functions — no external dependencies
 *
 * classifyReply(emailText, subject) → { classification, confidence, signals }
 * getStatusUpdate(classification) → string | null
 *
 * Classifications checked in priority order:
 *   bounce → opt_out → auto_reply → positive → negative → unknown
 */

// ============================================================================
// SIGNAL DEFINITIONS
// Priority order is enforced by the ordered array below
// ============================================================================

const CLASSIFICATIONS = [
  {
    name: 'bounce',
    signals: [
      'delivery failed',
      'mailer-daemon',
      'does not exist',
      'no such user',
      'undeliverable',
      'address not found',
      'not found'
    ]
  },
  {
    name: 'opt_out',
    signals: [
      'unsubscribe',
      'remove me',
      'opt out',
      'stop emailing',
      'please remove',
      'take me off'
    ]
  },
  {
    name: 'auto_reply',
    signals: [
      'out of office',
      'on vacation',
      'automatic reply',
      'auto-reply',
      'will be back',
      'on leave'
    ]
  },
  // Negative is checked BEFORE positive so "not interested" beats "interested"
  {
    name: 'negative',
    signals: [
      'not interested',
      'no thanks',
      'not the right time',
      'not relevant',
      'not a fit',
      'pass',
      'decline'
    ]
  },
  {
    name: 'positive',
    signals: [
      'yes',
      'interested',
      'sounds good',
      'would love',
      "let's chat",
      'open to',
      'happy to',
      'schedule',
      'call',
      'meeting',
      'connect'
    ]
  }
];

// ============================================================================
// STATUS MAP
// ============================================================================

const STATUS_MAP = {
  bounce: 'bounced',
  opt_out: 'opted_out',
  positive: 'replied',
  negative: 'replied',
  auto_reply: null,
  unknown: null
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Normalize text for matching: lowercase, collapse whitespace
 */
function normalize(text) {
  if (!text || typeof text !== 'string') return '';
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Count how many signals from a list match in the combined text
 */
function countMatches(normalizedText, signals) {
  return signals.filter(signal => normalizedText.includes(signal));
}

// ============================================================================
// MAIN EXPORT: classifyReply
// ============================================================================

/**
 * Classify an email reply based on text content and subject.
 *
 * @param {string} emailText - Body of the email
 * @param {string} subject   - Subject line of the email
 * @returns {{ classification: string, confidence: number, signals: string[] }}
 */
function classifyReply(emailText, subject) {
  const combined = normalize((emailText || '') + ' ' + (subject || ''));

  // Walk classifications in priority order
  for (const { name, signals } of CLASSIFICATIONS) {
    const matched = countMatches(combined, signals);

    if (matched.length > 0) {
      // Confidence: matched / total signals, floored at 0.3, capped at 1.0
      const raw = matched.length / signals.length;
      const confidence = Math.min(1.0, Math.max(0.3, raw));

      return {
        classification: name,
        confidence: Math.round(confidence * 100) / 100,
        signals: matched
      };
    }
  }

  // Nothing matched
  return {
    classification: 'unknown',
    confidence: 0,
    signals: []
  };
}

// ============================================================================
// MAIN EXPORT: getStatusUpdate
// ============================================================================

/**
 * Map a classification to a lead status string.
 *
 * @param {string} classification
 * @returns {string|null} New status string, or null if no status change required
 */
function getStatusUpdate(classification) {
  if (Object.prototype.hasOwnProperty.call(STATUS_MAP, classification)) {
    return STATUS_MAP[classification];
  }
  return null;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = { classifyReply, getStatusUpdate };
