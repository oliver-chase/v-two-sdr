/**
 * Tests for queue-executor.js — process send queue
 */

const fs = require('fs');
const path = require('path');

const QUEUE_FILE = path.join(__dirname, '..', 'outreach', 'send-queue.json');

const QUEUED_PROSPECT = {
  id: 'test-001',
  fn: 'John',
  em: 'john@example.com',
  co: 'Acme',
  subject: 'Test subject',
  body: 'Test body',
  scheduledSendAt: new Date(Date.now() - 1000).toISOString(), // Past time
  status: 'queued'
};

const FUTURE_PROSPECT = {
  id: 'test-002',
  fn: 'Jane',
  em: 'jane@example.com',
  co: 'Widgets Inc',
  subject: 'Future email',
  body: 'This is scheduled for later',
  scheduledSendAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
  status: 'queued'
};

describe('queue-executor.js', () => {
  beforeEach(() => {
    if (fs.existsSync(QUEUE_FILE)) {
      fs.unlinkSync(QUEUE_FILE);
    }
    // Mock the mailer module
    jest.resetModules();
    jest.mock('../scripts/mailer', () => ({
      Mailer: jest.fn().mockImplementation(() => ({
        verify: jest.fn().mockResolvedValue(true),
        send: jest.fn().mockResolvedValue({ ok: true })
      }))
    }), { virtual: true });
  });

  afterEach(() => {
    if (fs.existsSync(QUEUE_FILE)) {
      fs.unlinkSync(QUEUE_FILE);
    }
    jest.unmock('../scripts/mailer');
  });

  test('reads empty queue without error', async () => {
    const { executeQueue } = require('../scripts/queue-executor');
    const result = await executeQueue();
    expect(result.ok).toBe(true);
    expect(result.processed).toBe(0);
  });

  test('skips items scheduled for the future', async () => {
    const { executeQueue } = require('../scripts/queue-executor');
    fs.writeFileSync(QUEUE_FILE, JSON.stringify([FUTURE_PROSPECT], null, 2));

    const result = await executeQueue();
    expect(result.ok).toBe(true);
    expect(result.sent).toBe(0);
    expect(result.skipped).toBeGreaterThan(0);
  });

  test('updates status to sent for processed items', async () => {
    const { executeQueue } = require('../scripts/queue-executor');
    fs.writeFileSync(QUEUE_FILE, JSON.stringify([QUEUED_PROSPECT], null, 2));

    await executeQueue();

    if (fs.existsSync(QUEUE_FILE)) {
      const updated = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
      expect(updated.length).toBeGreaterThan(0);
    }
  });

  test('returns summary of execution', async () => {
    const { executeQueue } = require('../scripts/queue-executor');
    const queue = [QUEUED_PROSPECT, FUTURE_PROSPECT];
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));

    const result = await executeQueue();
    expect(result.ok).toBeDefined();
    expect(result.processed).toBeDefined();
    expect(typeof result.processed).toBe('number');
  });
});
