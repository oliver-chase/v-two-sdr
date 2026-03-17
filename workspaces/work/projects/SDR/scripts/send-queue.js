/**
 * Send Queue — Queue approved emails with timezone-aware scheduling
 *
 * Takes an approved email and schedules it for the next Tue-Thu 9-11 AM
 * in the prospect's timezone.
 *
 * Usage: node scripts/send-queue.js <prospect-id>
 * Or: require('./send-queue').queueSend(prospect)
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const SDR_ROOT = path.join(__dirname, '..');
const QUEUE_FILE = path.join(SDR_ROOT, 'outreach', 'send-queue.json');

/**
 * Calculate next Tue-Thu 9-11 AM window in prospect's timezone
 *
 * @param {string} tzIana - IANA timezone (e.g., "America/New_York")
 * @returns {Date} Next valid send window start time
 */
function calculateNextSendWindow(tzIana) {
  if (!tzIana) {
    throw new Error('Timezone required');
  }

  const now = new Date();

  // Start checking from tomorrow
  let candidate = new Date(now);
  candidate.setDate(candidate.getDate() + 1);
  candidate.setHours(9, 0, 0, 0);

  // Find next Tue-Thu (2-4)
  for (let i = 0; i < 365; i++) {
    const dayOfWeek = new Date(candidate.toLocaleString('en-US', { timeZone: tzIana })).getDay();

    // Tue (2), Wed (3), Thu (4)
    if ([2, 3, 4].includes(dayOfWeek)) {
      // Random minute between 0-60 to spread sends
      const randomMinute = Math.floor(Math.random() * 60);
      candidate.setMinutes(randomMinute);

      // Convert back to UTC for storage
      // The candidate time is in prospect's local time, but Date object is in UTC
      // We need to find the UTC time that corresponds to 9 AM in their timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tzIana,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      // Get current time in their timezone
      const parts = formatter.formatToParts(now);
      const tzHour = parseInt(parts.find(p => p.type === 'hour').value);
      const tzMinute = parseInt(parts.find(p => p.type === 'minute').value);

      // Simple approach: add the offset
      const offsetMinutes = (now.getHours() * 60 + now.getMinutes()) - (tzHour * 60 + tzMinute);
      const sendTime = new Date(candidate);
      sendTime.setMinutes(sendTime.getMinutes() + offsetMinutes);

      return sendTime;
    }

    candidate.setDate(candidate.getDate() + 1);
  }

  throw new Error('Could not calculate send window');
}

/**
 * Commit queue file to git
 * @returns {boolean} True if committed
 */
function commitToGit() {
  try {
    const result = spawnSync('git', ['add', 'outreach/send-queue.json'], {
      cwd: SDR_ROOT,
      stdio: 'pipe'
    });

    if (result.status !== 0) {
      return false;
    }

    const commitResult = spawnSync('git', ['commit', '-m', 'feat: queue email for send'], {
      cwd: SDR_ROOT,
      stdio: 'pipe'
    });

    return commitResult.status === 0;
  } catch (err) {
    return false;
  }
}

/**
 * Queue a prospect for sending
 *
 * @param {Object} prospect - Prospect with {id, fn, em, co, tz, ...}
 * @returns {Object} Result {ok, id, scheduledSendAt, status, committed, error?}
 */
async function queueSend(prospect) {
  try {
    // Validate prospect
    if (!prospect.id) {
      return { ok: false, error: 'Missing prospect ID' };
    }
    if (!prospect.em) {
      return { ok: false, error: 'Missing prospect email' };
    }
    if (!prospect.tz) {
      return { ok: false, error: 'Missing prospect timezone' };
    }

    // Calculate send window
    const scheduledSendAt = calculateNextSendWindow(prospect.tz);

    // Read existing queue
    let queue = [];
    if (fs.existsSync(QUEUE_FILE)) {
      queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
    }

    // Add to queue
    const queuedItem = {
      id: prospect.id,
      fn: prospect.fn,
      em: prospect.em,
      co: prospect.co,
      tz: prospect.tz,
      ti: prospect.ti,
      status: 'queued',
      scheduledSendAt: scheduledSendAt.toISOString(),
      queuedAt: new Date().toISOString()
    };

    queue.push(queuedItem);

    // Write queue
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));

    // Commit to git
    const committed = commitToGit();

    return {
      ok: true,
      id: prospect.id,
      scheduledSendAt: scheduledSendAt.toISOString(),
      status: 'queued',
      committed
    };
  } catch (err) {
    return {
      ok: false,
      error: err.message
    };
  }
}

// CLI usage: node scripts/send-queue.js <prospect-id>
if (require.main === module) {
  const prospectId = process.argv[2];
  if (!prospectId) {
    console.error('Usage: node scripts/send-queue.js <prospect-id>');
    process.exit(1);
  }

  // For CLI, read from approved-sends.json
  const approvedPath = path.join(SDR_ROOT, 'outreach', 'approved-sends.json');
  if (!fs.existsSync(approvedPath)) {
    console.error('[SDR] No approved-sends.json found');
    process.exit(1);
  }

  const approved = JSON.parse(fs.readFileSync(approvedPath, 'utf8'));
  const prospect = approved.find(d => d.id === prospectId);

  if (!prospect) {
    console.error(`[SDR] Prospect ${prospectId} not found in approved-sends.json`);
    process.exit(1);
  }

  queueSend(prospect).then(result => {
    if (result.ok) {
      console.log(`[SDR] Queued ${prospect.em} for ${result.scheduledSendAt}`);
      process.exit(0);
    } else {
      console.error(`[SDR] Queue failed: ${result.error}`);
      process.exit(1);
    }
  });
}

module.exports = { queueSend, calculateNextSendWindow };
