/**
 * Queue Executor — Process send queue and send due emails
 *
 * Reads outreach/send-queue.json, sends anything with scheduledSendAt
 * in the past, updates status to sent, and commits changes.
 *
 * Usage: node scripts/queue-executor.js
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { Mailer } = require('./mailer');

const SDR_ROOT = path.join(__dirname, '..');
const QUEUE_FILE = path.join(SDR_ROOT, 'outreach', 'send-queue.json');

/**
 * Commit queue file to git
 * @returns {boolean} True if committed
 */
function commitToGit(message) {
  try {
    const result = spawnSync('git', ['add', 'outreach/send-queue.json'], {
      cwd: SDR_ROOT,
      stdio: 'pipe'
    });

    if (result.status !== 0) {
      return false;
    }

    const commitResult = spawnSync('git', ['commit', '-m', message], {
      cwd: SDR_ROOT,
      stdio: 'pipe'
    });

    return commitResult.status === 0;
  } catch (err) {
    return false;
  }
}

/**
 * Execute send queue — send all due emails
 *
 * @returns {Object} Result {ok, processed, sent, skipped, failed}
 */
async function executeQueue() {
  try {
    // Read queue
    if (!fs.existsSync(QUEUE_FILE)) {
      return { ok: true, processed: 0, sent: 0, skipped: 0, failed: 0 };
    }

    const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
    const now = new Date();

    // Filter items to send (status queued AND scheduledSendAt is now or past)
    const toSend = queue.filter(item => {
      return item.status === 'queued' &&
             new Date(item.scheduledSendAt) <= now;
    });

    if (toSend.length === 0) {
      return { ok: true, processed: 0, sent: 0, skipped: queue.length, failed: 0 };
    }

    // Initialize mailer
    const config = require('../config.email');
    const oauthConfig = require('../config/config.oauth');
    const mailer = new Mailer(config, oauthConfig);

    try {
      await mailer.verify();
    } catch (err) {
      console.error(`[SDR] Mailer verification failed: ${err.message}`);
      return { ok: false, error: 'Mailer verification failed' };
    }

    // Send emails
    let sent = 0;
    let failed = 0;

    for (const item of toSend) {
      try {
        const prospect = {
          id: item.id,
          fn: item.fn,
          em: item.em,
          co: item.co
        };

        // Note: email body/subject should be in the queue item from approved-sends
        // For now, use placeholder
        const result = await mailer.send({
          prospect,
          subject: item.subject || '(queued email)',
          body: item.body || '(queued email body)'
        });

        if (result.ok) {
          item.status = 'sent';
          item.sentAt = new Date().toISOString();
          sent++;
          console.log(`[SDR] Sent to ${item.em}`);
        } else {
          item.status = 'failed';
          item.error = result.error;
          failed++;
          console.error(`[SDR] Failed to send ${item.em}: ${result.error}`);
        }
      } catch (err) {
        item.status = 'failed';
        item.error = err.message;
        failed++;
        console.error(`[SDR] Error sending ${item.em}: ${err.message}`);
      }
    }

    // Write updated queue
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));

    // Commit to git
    const message = `feat: executed queue — sent ${sent} emails`;
    const committed = commitToGit(message);

    return {
      ok: true,
      processed: toSend.length,
      sent,
      failed,
      skipped: queue.length - toSend.length,
      committed
    };
  } catch (err) {
    return {
      ok: false,
      error: err.message
    };
  }
}

// CLI usage
if (require.main === module) {
  executeQueue().then(result => {
    if (result.ok) {
      console.log(`[SDR] Queue executor complete: ${result.sent} sent, ${result.failed} failed, ${result.skipped} skipped`);
      process.exit(result.failed > 0 ? 1 : 0);
    } else {
      console.error(`[SDR] Queue executor failed: ${result.error}`);
      process.exit(1);
    }
  });
}

module.exports = { executeQueue };
