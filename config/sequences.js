'use strict';

/**
 * Follow-up sequence timing.
 *
 * Day counts are from lc (last_contact) of the previous touch.
 *
 * Touch 1 (initial):  email_sent, lc = day 0
 * Touch 2:            followup_due after 5 days  (day 5  from touch 1)
 * Touch 3:            followup_due after 7 days  (day 12 from touch 1)
 * Close:              closed_no_reply after 7 days (day 19 from touch 1)
 *
 * fuc (follow_up_count) reflects how many emails have been sent (1-indexed).
 * The scheduler reads fuc to determine which threshold to apply.
 */

const TOUCH_SCHEDULE = [
  { afterTouch: 1, waitDays: 5,  close: false }, // → followup_due (touch 2)
  { afterTouch: 2, waitDays: 7,  close: false }, // → followup_due (touch 3)
  { afterTouch: 3, waitDays: 7,  close: true  }, // → closed_no_reply (sequence done)
];

const MAX_TOUCHES = 3;

// Days to add to a parsed OOO return date before re-queuing
const OOO_BUFFER_DAYS = 1;

module.exports = { TOUCH_SCHEDULE, MAX_TOUCHES, OOO_BUFFER_DAYS };
