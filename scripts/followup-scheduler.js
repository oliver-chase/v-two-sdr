'use strict';

/**
 * Follow-up Scheduler
 *
 * Exported function called by sync.js with the full prospect list.
 * Mutates prospects in-place and returns counts.
 *
 * Transitions applied:
 *   email_sent  → followup_due    (fuc=1 after 5 days, fuc=2 after 7 days)
 *   email_sent  → closed_no_reply (fuc=3 after 7 days — sequence exhausted)
 *   ooo_pending → followup_due    (when nfu date is today or past)
 */

const { TOUCH_SCHEDULE } = require('../config/sequences');

/**
 * Days elapsed since a date string (ISO or YYYY-MM-DD).
 * Returns null if the date is missing or unparseable.
 */
function daysSince(dateStr) {
  if (!dateStr) return null;
  const then = new Date(dateStr);
  if (isNaN(then.getTime())) return null;
  const diffMs = Date.now() - then.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Parse a date string for <= comparison with today (midnight local).
 * Returns null if unparseable.
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Schedule follow-ups for eligible prospects.
 *
 * @param {Object[]} prospects - TOON-format prospect objects (mutated in-place)
 * @returns {{ flagged: number, closed: number }}
 */
function scheduleFollowups(prospects) {
  let flagged = 0;
  let closed = 0;

  // today at midnight for OOO comparisons
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const p of prospects) {
    if (p.st === 'email_sent') {
      // Use explicit contact date columns (most recent touch first).
      // Fall back to lc + fuc if no date columns are set yet.
      let refDate = null;
      let entry = null;

      if (p.tc) {
        refDate = p.tc;
        entry = TOUCH_SCHEDULE.find(function(s) { return s.afterTouch === 3; });
      } else if (p.sc) {
        refDate = p.sc;
        entry = TOUCH_SCHEDULE.find(function(s) { return s.afterTouch === 2; });
      } else if (p.fc) {
        refDate = p.fc;
        entry = TOUCH_SCHEDULE.find(function(s) { return s.afterTouch === 1; });
      } else {
        refDate = p.lc;
        const fuc = parseInt(p.fuc, 10) || 1;
        entry = TOUCH_SCHEDULE.find(function(s) { return s.afterTouch === fuc; });
      }

      if (!entry || !refDate) continue;
      const days = daysSince(refDate);
      if (days === null) continue;

      if (days >= entry.waitDays) {
        if (entry.close) {
          p.st = 'closed_no_reply';
          closed++;
        } else {
          p.st = 'followup_due';
          flagged++;
        }
      }
    } else if (p.st === 'ooo_pending') {
      const nfu = parseDate(p.nfu);
      if (nfu && nfu <= today) {
        p.st = 'followup_due';
        flagged++;
      }
    }
  }

  return { flagged, closed };
}

module.exports = { scheduleFollowups };
