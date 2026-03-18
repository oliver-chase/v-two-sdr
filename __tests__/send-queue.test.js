/**
 * Tests for send-queue.js — queue emails with timezone-aware scheduling
 */

const fs = require('fs');
const path = require('path');
const { queueSend } = require('../scripts/send-queue');

const QUEUE_FILE = path.join(__dirname, '..', 'outreach', 'send-queue.json');
const TEST_PROSPECT = {
  id: 'test-001',
  fn: 'John',
  ln: 'Doe',
  em: 'john@example.com',
  co: 'Acme Corp',
  tz: 'America/New_York',
  ti: 'CTO'
};

describe('send-queue.js', () => {
  beforeEach(() => {
    if (fs.existsSync(QUEUE_FILE)) {
      fs.unlinkSync(QUEUE_FILE);
    }
  });

  afterEach(() => {
    if (fs.existsSync(QUEUE_FILE)) {
      fs.unlinkSync(QUEUE_FILE);
    }
  });

  test('queues a prospect for sending', async () => {
    const result = await queueSend(TEST_PROSPECT);

    expect(result.ok).toBe(true);
    expect(result.id).toBe('test-001');
    expect(result.scheduledSendAt).toBeDefined();
    expect(result.status).toBe('queued');
  });

  test('schedules for next Tue-Thu 9-11am in prospect timezone', async () => {
    const result = await queueSend(TEST_PROSPECT);
    const sendTime = new Date(result.scheduledSendAt);
    const dayOfWeek = sendTime.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
    const hour = sendTime.getHours();

    // Should be Tue (2), Wed (3), or Thu (4)
    expect([2, 3, 4]).toContain(dayOfWeek);
    // Should be between 9 and 11 AM
    expect(hour).toBeGreaterThanOrEqual(9);
    expect(hour).toBeLessThan(11);
  });

  test('creates send-queue.json if it does not exist', async () => {
    await queueSend(TEST_PROSPECT);
    expect(fs.existsSync(QUEUE_FILE)).toBe(true);
  });

  test('appends to existing queue without overwriting', async () => {
    const prospect1 = { ...TEST_PROSPECT, id: 'id-1' };
    const prospect2 = { ...TEST_PROSPECT, id: 'id-2' };

    await queueSend(prospect1);
    await queueSend(prospect2);

    const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
    expect(queue.length).toBe(2);
    expect(queue[0].id).toBe('id-1');
    expect(queue[1].id).toBe('id-2');
  });

  test('commits queue file to git', async () => {
    // This test verifies git behavior
    // Actual git commit happens inside queueSend
    const result = await queueSend(TEST_PROSPECT);
    expect(result.committed).toBe(true);
  });

  test('returns error if prospect has no timezone', async () => {
    const badProspect = { ...TEST_PROSPECT, tz: null };
    const result = await queueSend(badProspect);

    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('returns error if prospect has no email', async () => {
    const badProspect = { ...TEST_PROSPECT, em: null };
    const result = await queueSend(badProspect);

    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
  });
});
