/**
 * Mailer Tests
 * TDD: template merging, rate limiting, send logging, batch sending
 */

const fs = require('fs');
const path = require('path');

const mockSendMailWithRetry = jest.fn().mockResolvedValue({ ok: true, messageId: 'msg-123' });

jest.mock('../scripts/oauth-client', () => ({
  OAuthClient: jest.fn().mockImplementation(() => ({
    sendMailWithRetry: mockSendMailWithRetry
  }))
}));

const { Mailer, mergeTemplate, countTodaySends } = require('../scripts/mailer');
const { OAuthClient } = require('../scripts/oauth-client');

// ============================================================================
// FIXTURES
// ============================================================================

const MOCK_CONFIG = {
  sender: { name: 'Oliver Chase', email: 'test@vtwo.co', bcc: 'bcc@vtwo.co' },
  limits: { maxDaily: 3, delayMs: 0 },
  paths: { sendsLog: '__tests__/fixtures/sends-test.json', optOuts: 'outreach/opt-outs.json' }
};

const MOCK_OAUTH_CONFIG = {
  azure: {
    tenantId: 'test-tenant',
    clientId: 'test-client',
    clientSecret: 'test-secret'
  }
};

const MOCK_PROSPECT = { id: 'p-000001', fn: 'Sarah', ln: 'Chen', em: 'sarah@tech.io', co: 'TechCo', ti: 'CTO' };

const SENDS_LOG = path.resolve(__dirname, 'fixtures/sends-test.json');

beforeEach(() => {
  if (fs.existsSync(SENDS_LOG)) fs.unlinkSync(SENDS_LOG);
  if (!fs.existsSync(path.dirname(SENDS_LOG))) {
    fs.mkdirSync(path.dirname(SENDS_LOG), { recursive: true });
  }
});

afterAll(() => {
  if (fs.existsSync(SENDS_LOG)) fs.unlinkSync(SENDS_LOG);
});

// ============================================================================
// UNIT: Template Merging
// ============================================================================

describe('mergeTemplate', () => {
  test('replaces all placeholders', () => {
    const tmpl = 'Hi {{firstName}}, I saw {{company}} is hiring. - re: {{title}}';
    const result = mergeTemplate(tmpl, MOCK_PROSPECT);
    expect(result).toBe('Hi Sarah, I saw TechCo is hiring. - re: CTO');
  });

  test('case-insensitive placeholders', () => {
    const tmpl = 'Hi {{FirstName}} from {{COMPANY}}';
    const result = mergeTemplate(tmpl, MOCK_PROSPECT);
    expect(result).toBe('Hi Sarah from TechCo');
  });

  test('handles missing fields gracefully (empty string)', () => {
    const result = mergeTemplate('Hi {{firstName}} {{lastName}}', { fn: 'Sam' });
    expect(result).toBe('Hi Sam ');
  });
});

// ============================================================================
// UNIT: Daily Limit Tracking
// ============================================================================

describe('countTodaySends', () => {
  test('returns 0 when log does not exist', () => {
    expect(countTodaySends('/nonexistent/path.json')).toBe(0);
  });

  test('counts only todays sends', () => {
    const today = new Date().toISOString();
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const sends = [
      { sd: today, em: 'a@co.com' },
      { sd: today, em: 'b@co.com' },
      { sd: yesterday, em: 'c@co.com' }
    ];
    fs.writeFileSync(SENDS_LOG, JSON.stringify(sends));
    expect(countTodaySends(SENDS_LOG)).toBe(2);
  });
});

// ============================================================================
// UNIT: Mailer — Send
// ============================================================================

describe('Mailer.send', () => {
  let mailer;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSendMailWithRetry.mockResolvedValue({ ok: true, messageId: 'msg-123' });
    mailer = new Mailer(MOCK_CONFIG, MOCK_OAUTH_CONFIG);
  });

  test('sends email and returns success result', async () => {
    const result = await mailer.send({
      prospect: MOCK_PROSPECT,
      subject: 'Quick question, Sarah',
      body: 'Hi Sarah...'
    });

    expect(result.ok).toBe(true);
    expect(result.messageId).toBe('msg-123');
    expect(mockSendMailWithRetry).toHaveBeenCalledTimes(1);
  });

  test('includes BCC in mail options', async () => {
    await mailer.send({ prospect: MOCK_PROSPECT, subject: 'Test', body: 'Body' });

    const callArgs = mockSendMailWithRetry.mock.calls[0];
    const mailOpts = callArgs[0]; // sendMailWithRetry receives opts object as first arg
    expect(mailOpts.bcc).toBe('bcc@vtwo.co');
    expect(mailOpts.to).toBe('sarah@tech.io');
  });

  test('logs send to sends.json on success', async () => {
    await mailer.send({ prospect: MOCK_PROSPECT, subject: 'Test', body: 'Body' });

    const sends = JSON.parse(fs.readFileSync(SENDS_LOG, 'utf8'));
    expect(sends).toHaveLength(1);
    expect(sends[0].em).toBe('sarah@tech.io');
    expect(sends[0].ok).toBe(true);
  });

  test('logs failed send and returns error result', async () => {
    mockSendMailWithRetry.mockRejectedValueOnce(new Error('Graph API error'));

    const result = await mailer.send({ prospect: MOCK_PROSPECT, subject: 'Test', body: 'Body' });

    expect(result.ok).toBe(false);
    expect(result.error).toContain('Graph API error');

    const sends = JSON.parse(fs.readFileSync(SENDS_LOG, 'utf8'));
    expect(sends[0].ok).toBe(false);
  });

  test('enforces daily limit', async () => {
    // Pre-fill sends log with maxDaily entries for today
    const today = new Date().toISOString();
    const existingSends = Array(3).fill(null).map((_, i) => ({
      sd: today, em: `p${i}@co.com`, ok: true
    }));
    fs.writeFileSync(SENDS_LOG, JSON.stringify(existingSends));

    const result = await mailer.send({ prospect: MOCK_PROSPECT, subject: 'Test', body: 'Body' });

    expect(result.ok).toBe(false);
    expect(result.error).toContain('Daily limit');
    expect(mockSendMailWithRetry).not.toHaveBeenCalled();
  });

  test('throws if OAuth config not provided', async () => {
    const mailerNoOAuth = new Mailer(MOCK_CONFIG);
    await expect(mailerNoOAuth.send({
      prospect: MOCK_PROSPECT,
      subject: 'Test',
      body: 'Body'
    })).rejects.toThrow('OAuth config');
  });
});

// ============================================================================
// UNIT: Mailer — Batch Send
// ============================================================================

describe('Mailer.sendBatch', () => {
  let mailer;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSendMailWithRetry.mockResolvedValue({ ok: true, messageId: 'msg-ok' });
    mailer = new Mailer(MOCK_CONFIG, MOCK_OAUTH_CONFIG);
  });

  test('sends all emails and returns results array', async () => {
    const emails = [
      { prospect: { ...MOCK_PROSPECT, id: 'p-1', em: 'a@co.com' }, subject: 'S1', body: 'B1' },
      { prospect: { ...MOCK_PROSPECT, id: 'p-2', em: 'b@co.com' }, subject: 'S2', body: 'B2' }
    ];

    const results = await mailer.sendBatch(emails, { delayMs: 0 });

    expect(results).toHaveLength(2);
    expect(results.every(r => r.ok)).toBe(true);
  });

  test('stops batch when daily limit hit', async () => {
    // Fill to limit (3)
    const today = new Date().toISOString();
    const existing = Array(2).fill(null).map((_, i) => ({ sd: today, em: `x${i}@co.com`, ok: true }));
    fs.writeFileSync(SENDS_LOG, JSON.stringify(existing));

    const emails = [
      { prospect: { ...MOCK_PROSPECT, em: 'a@co.com' }, subject: 'S1', body: 'B1' },
      { prospect: { ...MOCK_PROSPECT, em: 'b@co.com' }, subject: 'S2', body: 'B2' }
    ];

    const results = await mailer.sendBatch(emails, { delayMs: 0 });

    // First succeeds (hits limit at 3), second stopped
    expect(results[0].ok).toBe(true);
    expect(results[1].ok).toBe(false);
    expect(results[1].error).toContain('Daily limit');
  });
});
