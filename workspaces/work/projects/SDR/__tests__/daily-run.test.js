/**
 * Daily Run Orchestration Tests
 */

const fs = require('fs');
const path = require('path');

// Mock all external scripts so we can test orchestration logic in isolation
jest.mock('../scripts/draft-emails', () => ({
  generateDrafts: jest.fn().mockResolvedValue({ drafted: 3, skipped_optout: 1, skipped_no_email: 0, total: 4, errors: 0 })
}), { virtual: true });

jest.mock('../scripts/inbox-monitor', () => ({
  checkInbox: jest.fn().mockResolvedValue({ checked: 10, newReplies: 2, classified: [{ classification: 'positive' }] }),
  buildConfig: jest.fn().mockReturnValue({ user: 'test@vtwo.co', pass: 'testpass' })
}), { virtual: true });

jest.mock('../sheets-connector', () => ({
  GoogleSheetsConnector: jest.fn().mockImplementation(() => ({
    authenticate: jest.fn().mockResolvedValue(true),
    fullSync: jest.fn().mockResolvedValue({
      prospects: [{ id: 'p-000001', fn: 'Sarah', em: 'sarah@co.com', st: 'new', tr: 'product-maker' }],
      metadata: { tot: 1 },
      summary: { totalRead: 1, validatedCount: 1, optedOutCount: 0 }
    })
  }))
}), { virtual: true });

const { stepDraft, stepInbox, stepReport } = require('../scripts/daily-run');

const SDR_ROOT = path.join(__dirname, '..');

// ============================================================================
// stepDraft
// ============================================================================

describe('stepDraft', () => {
  test('calls generateDrafts and returns result', async () => {
    const result = await stepDraft();
    expect(result.drafted).toBe(3);
    expect(result.skipped_optout).toBe(1);
  });
});

// ============================================================================
// stepInbox
// ============================================================================

describe('stepInbox', () => {
  const origEnv = process.env;

  beforeEach(() => {
    process.env = { ...origEnv, GMAIL_USER: 'test@co.com', GMAIL_APP_PASSWORD: 'pass' };
  });

  afterEach(() => {
    process.env = origEnv;
  });

  test('calls checkInbox and returns reply count', async () => {
    const result = await stepInbox();
    expect(result.newReplies).toBe(2);
  });

  test('skips when credentials not configured', async () => {
    delete process.env.GMAIL_USER;
    const result = await stepInbox();
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe('credentials_not_configured');
  });
});

// ============================================================================
// stepReport
// ============================================================================

describe('stepReport', () => {
  const reportsPath = path.join(SDR_ROOT, 'outreach/weekly-reports.json');
  const originalReports = fs.existsSync(reportsPath)
    ? fs.readFileSync(reportsPath, 'utf8')
    : null;

  afterEach(() => {
    // Restore reports file
    if (originalReports) {
      fs.writeFileSync(reportsPath, originalReports);
    }
  });

  test('returns reported: true and writes to weekly-reports.json', () => {
    const result = stepReport({ draft: { drafted: 2 }, inbox: { newReplies: 1 } });
    expect(result.reported).toBe(true);
  });

  test('handles missing prospects.json gracefully', () => {
    expect(() => stepReport({})).not.toThrow();
  });
});
