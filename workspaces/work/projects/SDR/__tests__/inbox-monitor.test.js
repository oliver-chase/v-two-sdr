/**
 * Inbox Monitor Tests
 * TDD: imapflow mocked entirely, tests subject matching, sends.json lookup,
 * reply logging, buildConfig env var reading
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// MOCK imapflow BEFORE requiring inbox-monitor
// ============================================================================

// We mock the module before any require of inbox-monitor
jest.mock('imapflow', () => {
  const mockFetch = jest.fn();
  const mockSearch = jest.fn();
  const mockGetMailboxLock = jest.fn();
  const mockConnect = jest.fn();
  const mockLogout = jest.fn();

  // Default: return empty results
  mockSearch.mockResolvedValue([]);
  mockGetMailboxLock.mockResolvedValue({ release: jest.fn() });
  mockConnect.mockResolvedValue(undefined);
  mockLogout.mockResolvedValue(undefined);

  const ImapFlowMock = jest.fn().mockImplementation(() => ({
    connect: mockConnect,
    logout: mockLogout,
    getMailboxLock: mockGetMailboxLock,
    search: mockSearch,
    fetch: mockFetch,
    // Store refs for test access
    _mockSearch: mockSearch,
    _mockFetch: mockFetch,
    _mockGetMailboxLock: mockGetMailboxLock,
    _mockConnect: mockConnect,
    _mockLogout: mockLogout
  }));

  ImapFlowMock._mockSearch = mockSearch;
  ImapFlowMock._mockFetch = mockFetch;
  ImapFlowMock._mockGetMailboxLock = mockGetMailboxLock;
  ImapFlowMock._mockConnect = mockConnect;
  ImapFlowMock._mockLogout = mockLogout;

  return { ImapFlow: ImapFlowMock };
});

// ============================================================================
// FIXTURES
// ============================================================================

const REPLIES_LOG = path.resolve(__dirname, '../outreach/replies-test.json');
const SENDS_FIXTURE = path.resolve(__dirname, 'fixtures/sends-inbox-test.json');

const MOCK_CONFIG = {
  gmail: {
    user: 'oliver@vtwo.co',
    pass: 'test-app-password'
  },
  paths: {
    sendsLog: '__tests__/fixtures/sends-inbox-test.json',
    repliesLog: 'outreach/replies-test.json'
  }
};

// Sample sent emails
const SAMPLE_SENDS = {
  sends: [
    {
      id: 'p-000001',
      em: 'sarah@techco.com',
      fn: 'Sarah',
      co: 'TechCo',
      su: 'Quick question, Sarah',
      sd: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      ok: true
    },
    {
      id: 'p-000002',
      em: 'mike@startup.io',
      fn: 'Mike',
      co: 'Startup',
      su: 'V.Two for Startup',
      sd: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
      ok: true
    }
  ],
  metadata: {}
};

// ============================================================================
// SETUP / TEARDOWN
// ============================================================================

beforeEach(() => {
  // Ensure fixtures dir exists
  const fixturesDir = path.dirname(SENDS_FIXTURE);
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }
  // Write sample sends fixture
  fs.writeFileSync(SENDS_FIXTURE, JSON.stringify(SAMPLE_SENDS, null, 2));

  // Clean up test replies log
  if (fs.existsSync(REPLIES_LOG)) fs.unlinkSync(REPLIES_LOG);
});

afterAll(() => {
  if (fs.existsSync(REPLIES_LOG)) fs.unlinkSync(REPLIES_LOG);
  if (fs.existsSync(SENDS_FIXTURE)) fs.unlinkSync(SENDS_FIXTURE);
});

// ============================================================================
// Helper: build a fake IMAP message generator
// ============================================================================

function makeFakeMessages(messages) {
  // Returns an async iterable of message objects
  return {
    [Symbol.asyncIterator]: async function* () {
      for (const msg of messages) {
        yield msg;
      }
    }
  };
}

// ============================================================================
// buildConfig
// ============================================================================

describe('buildConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('reads GMAIL_USER and GMAIL_APP_PASSWORD from env', () => {
    process.env.GMAIL_USER = 'test@vtwo.co';
    process.env.GMAIL_APP_PASSWORD = 'secret-app-pass';

    const { buildConfig } = require('../scripts/inbox-monitor');
    const config = buildConfig();

    expect(config.gmail.user).toBe('test@vtwo.co');
    expect(config.gmail.pass).toBe('secret-app-pass');
  });

  test('returns imap host and port', () => {
    process.env.GMAIL_USER = 'test@vtwo.co';
    process.env.GMAIL_APP_PASSWORD = 'secret';

    const { buildConfig } = require('../scripts/inbox-monitor');
    const config = buildConfig();

    expect(config.imap.host).toBe('imap.gmail.com');
    expect(config.imap.port).toBe(993);
  });
});

// ============================================================================
// Subject Matching Logic
// ============================================================================

describe('subject matching', () => {
  test('strips "Re: " prefix correctly', () => {
    const { _stripRePrefix } = require('../scripts/inbox-monitor');
    expect(_stripRePrefix('Re: Quick question, Sarah')).toBe('Quick question, Sarah');
  });

  test('strips "Re: " case-insensitively', () => {
    const { _stripRePrefix } = require('../scripts/inbox-monitor');
    expect(_stripRePrefix('RE: Quick question, Sarah')).toBe('Quick question, Sarah');
    expect(_stripRePrefix('re: Quick question, Sarah')).toBe('Quick question, Sarah');
  });

  test('leaves non-reply subjects unchanged', () => {
    const { _stripRePrefix } = require('../scripts/inbox-monitor');
    expect(_stripRePrefix('Quick question, Sarah')).toBe('Quick question, Sarah');
  });

  test('finds matching send by subject', () => {
    const { _findSendBySubject } = require('../scripts/inbox-monitor');
    const match = _findSendBySubject('Quick question, Sarah', SAMPLE_SENDS.sends);
    expect(match).not.toBeNull();
    expect(match.em).toBe('sarah@techco.com');
  });

  test('returns null for unmatched subject', () => {
    const { _findSendBySubject } = require('../scripts/inbox-monitor');
    const match = _findSendBySubject('Completely different subject', SAMPLE_SENDS.sends);
    expect(match).toBeNull();
  });

  test('subject match is case-insensitive', () => {
    const { _findSendBySubject } = require('../scripts/inbox-monitor');
    const match = _findSendBySubject('quick question, sarah', SAMPLE_SENDS.sends);
    expect(match).not.toBeNull();
  });
});

// ============================================================================
// Reply Logging
// ============================================================================

describe('reply logging', () => {
  test('creates replies.json if it does not exist', () => {
    const { _appendReply } = require('../scripts/inbox-monitor');
    const reply = {
      id: 'p-000001',
      em: 'sarah@techco.com',
      classification: 'positive',
      confidence: 0.8,
      ts: new Date().toISOString(),
      snippet: 'Sounds good! When are you free?'
    };

    _appendReply(REPLIES_LOG, reply);

    expect(fs.existsSync(REPLIES_LOG)).toBe(true);
    const contents = JSON.parse(fs.readFileSync(REPLIES_LOG, 'utf8'));
    expect(Array.isArray(contents)).toBe(true);
    expect(contents).toHaveLength(1);
  });

  test('appends to existing replies.json', () => {
    const { _appendReply } = require('../scripts/inbox-monitor');

    const reply1 = { id: 'p-1', em: 'a@co.com', classification: 'positive', confidence: 0.8, ts: new Date().toISOString(), snippet: 'Great!' };
    const reply2 = { id: 'p-2', em: 'b@co.com', classification: 'negative', confidence: 0.7, ts: new Date().toISOString(), snippet: 'Not now.' };

    _appendReply(REPLIES_LOG, reply1);
    _appendReply(REPLIES_LOG, reply2);

    const contents = JSON.parse(fs.readFileSync(REPLIES_LOG, 'utf8'));
    expect(contents).toHaveLength(2);
    expect(contents[0].em).toBe('a@co.com');
    expect(contents[1].em).toBe('b@co.com');
  });

  test('logged reply has all required fields', () => {
    const { _appendReply } = require('../scripts/inbox-monitor');
    const reply = {
      id: 'p-000001',
      em: 'sarah@techco.com',
      classification: 'positive',
      confidence: 0.75,
      ts: '2026-03-13T10:00:00Z',
      snippet: 'Yes, let us chat.'
    };

    _appendReply(REPLIES_LOG, reply);

    const contents = JSON.parse(fs.readFileSync(REPLIES_LOG, 'utf8'));
    const logged = contents[0];
    expect(logged).toHaveProperty('id');
    expect(logged).toHaveProperty('em');
    expect(logged).toHaveProperty('classification');
    expect(logged).toHaveProperty('confidence');
    expect(logged).toHaveProperty('ts');
    expect(logged).toHaveProperty('snippet');
  });
});

// ============================================================================
// checkInbox — Integration (mocked IMAP)
// ============================================================================

// Async generator that yields nothing (empty inbox)
async function* emptyAsyncGen() {}

describe('checkInbox', () => {
  let ImapFlow;
  let checkInbox;

  beforeEach(() => {
    jest.resetModules();

    // Re-mock imapflow for each test — no out-of-scope references allowed
    jest.mock('imapflow', () => {
      const mockRelease = jest.fn();
      const mockGetMailboxLock = jest.fn().mockResolvedValue({ release: mockRelease });
      const mockConnect = jest.fn().mockResolvedValue(undefined);
      const mockLogout = jest.fn().mockResolvedValue(undefined);
      const mockSearch = jest.fn().mockResolvedValue([]);
      // Return an async iterable that yields nothing
      const mockFetch = jest.fn().mockReturnValue((async function* () {})());

      const ImapFlowMock = jest.fn().mockImplementation(() => ({
        connect: mockConnect,
        logout: mockLogout,
        getMailboxLock: mockGetMailboxLock,
        search: mockSearch,
        fetch: mockFetch
      }));

      ImapFlowMock._mocks = {
        connect: mockConnect,
        logout: mockLogout,
        getMailboxLock: mockGetMailboxLock,
        search: mockSearch,
        fetch: mockFetch,
        release: mockRelease
      };

      return { ImapFlow: ImapFlowMock };
    });

    ({ ImapFlow } = require('imapflow'));
    ({ checkInbox } = require('../scripts/inbox-monitor'));
  });

  test('returns summary object with checked, newReplies, classified', async () => {
    const result = await checkInbox(MOCK_CONFIG);

    expect(result).toHaveProperty('checked');
    expect(result).toHaveProperty('newReplies');
    expect(result).toHaveProperty('classified');
    expect(Array.isArray(result.classified)).toBe(true);
  });

  test('returns zero counts when no messages found', async () => {
    const result = await checkInbox(MOCK_CONFIG);

    expect(result.checked).toBe(0);
    expect(result.newReplies).toBe(0);
    expect(result.classified).toHaveLength(0);
  });

  test('connects using gmail credentials from config', async () => {
    await checkInbox(MOCK_CONFIG);

    const instance = ImapFlow.mock.instances[0];
    // ImapFlow constructor should be called with host imap.gmail.com
    const constructorArgs = ImapFlow.mock.calls[0][0];
    expect(constructorArgs.host).toBe('imap.gmail.com');
    expect(constructorArgs.port).toBe(993);
  });

  test('uses config gmail credentials', async () => {
    await checkInbox(MOCK_CONFIG);

    const constructorArgs = ImapFlow.mock.calls[0][0];
    expect(constructorArgs.auth.user).toBe('oliver@vtwo.co');
    expect(constructorArgs.auth.pass).toBe('test-app-password');
  });
});
