/**
 * Approve Drafts Tests
 * TDD: loadDrafts, saveDraftPlan, runApproval
 *
 * Uses real temp files (same pattern as existing project tests).
 */

const fs = require('fs');
const path = require('path');

const { loadDrafts, saveDraftPlan, runApproval } = require('../scripts/approve-drafts');

// ============================================================================
// TEMP FILE PATHS
// ============================================================================

const TMP = path.join(__dirname, 'fixtures');
const DRAFT_PLAN_PATH = path.join(TMP, 'tmp-approve-draft-plan.json');
const APPROVED_SENDS_PATH = path.join(TMP, 'tmp-approve-approved-sends.json');

const config = {
  paths: {
    draftPlanPath: DRAFT_PLAN_PATH,
    approvedSendsPath: APPROVED_SENDS_PATH
  }
};

// ============================================================================
// FIXTURES
// ============================================================================

const DRAFT_1 = {
  id: 'p-000001', em: 'sarah@acme.co', fn: 'Sarah', ln: 'Chen',
  co: 'Acme', ti: 'CTO', tr: 'product-maker', tpl: 'A',
  subject: 'Quick question, Sarah',
  body: 'Hi Sarah,\n\nCame across Acme.\n\n[Oliver]\nV.Two | vtwo.co',
  ts: '2026-03-13T10:00:00Z', status: 'draft'
};

const DRAFT_2 = {
  id: 'p-000002', em: 'james@beta.io', fn: 'James', ln: 'Lee',
  co: 'Beta', ti: 'VPE', tr: 'ai-enablement', tpl: 'B',
  subject: 'AI infrastructure at Beta',
  body: 'Hi James,\n\nWorking with a few engineering leaders.\n\n[Oliver]\nV.Two | vtwo.co',
  ts: '2026-03-13T10:00:00Z', status: 'draft'
};

const ALREADY_APPROVED = {
  id: 'p-000003', em: 'nina@gamma.co', fn: 'Nina', ln: 'Roy',
  co: 'Gamma', ti: 'Founder', tr: 'pace-car', tpl: 'C',
  subject: 'Senior engineering capacity at Gamma',
  body: 'Hi Nina,\n\nQuick one.\n\n[Oliver]',
  ts: '2026-03-13T10:00:00Z', status: 'approved'
};

const EXISTING_APPROVED_SEND = {
  id: 'p-old-001', em: 'old@example.com', status: 'approved', ts: '2026-03-12T08:00:00Z'
};

// ============================================================================
// SETUP / TEARDOWN
// ============================================================================

beforeAll(() => {
  if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });
});

afterEach(() => {
  [DRAFT_PLAN_PATH, APPROVED_SENDS_PATH].forEach(f => {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  });
});

// ============================================================================
// MOCK READLINE FACTORY
// ============================================================================

function makeMockReadline(answers) {
  let callCount = 0;
  return {
    question: jest.fn((_prompt, cb) => {
      const answer = answers[callCount] !== undefined ? answers[callCount] : 's';
      callCount++;
      cb(answer);
    }),
    close: jest.fn()
  };
}

// ============================================================================
// loadDrafts
// ============================================================================

describe('loadDrafts', () => {
  test('returns only entries with status=draft', () => {
    fs.writeFileSync(DRAFT_PLAN_PATH, JSON.stringify([DRAFT_1, DRAFT_2, ALREADY_APPROVED]));
    const drafts = loadDrafts(DRAFT_PLAN_PATH);
    expect(drafts.every(d => d.status === 'draft')).toBe(true);
  });

  test('filters out already-approved entries', () => {
    fs.writeFileSync(DRAFT_PLAN_PATH, JSON.stringify([DRAFT_1, DRAFT_2, ALREADY_APPROVED]));
    const drafts = loadDrafts(DRAFT_PLAN_PATH);
    expect(drafts.map(d => d.id)).not.toContain('p-000003');
  });

  test('returns correct count of draft-only entries', () => {
    fs.writeFileSync(DRAFT_PLAN_PATH, JSON.stringify([DRAFT_1, DRAFT_2, ALREADY_APPROVED]));
    const drafts = loadDrafts(DRAFT_PLAN_PATH);
    expect(drafts.length).toBe(2);
  });

  test('returns empty array when file has no draft entries', () => {
    fs.writeFileSync(DRAFT_PLAN_PATH, JSON.stringify([ALREADY_APPROVED]));
    const drafts = loadDrafts(DRAFT_PLAN_PATH);
    expect(drafts).toEqual([]);
  });

  test('returns empty array when file does not exist', () => {
    // DRAFT_PLAN_PATH doesn't exist (afterEach cleans up)
    const drafts = loadDrafts(DRAFT_PLAN_PATH);
    expect(drafts).toEqual([]);
  });

  test('returned entries have expected TOON fields', () => {
    fs.writeFileSync(DRAFT_PLAN_PATH, JSON.stringify([DRAFT_1, DRAFT_2]));
    loadDrafts(DRAFT_PLAN_PATH).forEach(d => {
      ['id', 'em', 'fn', 'subject', 'body'].forEach(f => expect(d).toHaveProperty(f));
    });
  });
});

// ============================================================================
// saveDraftPlan
// ============================================================================

describe('saveDraftPlan', () => {
  const allDrafts = [DRAFT_1, DRAFT_2, ALREADY_APPROVED];

  test('writes JSON to the given path', () => {
    saveDraftPlan(allDrafts, DRAFT_PLAN_PATH);
    expect(fs.existsSync(DRAFT_PLAN_PATH)).toBe(true);
  });

  test('written data is valid JSON', () => {
    saveDraftPlan(allDrafts, DRAFT_PLAN_PATH);
    const raw = fs.readFileSync(DRAFT_PLAN_PATH, 'utf8');
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  test('written data preserves all entries', () => {
    saveDraftPlan(allDrafts, DRAFT_PLAN_PATH);
    const written = JSON.parse(fs.readFileSync(DRAFT_PLAN_PATH, 'utf8'));
    expect(written.length).toBe(allDrafts.length);
  });

  test('written data preserves status field changes', () => {
    const modified = allDrafts.map((d, i) => i === 0 ? { ...d, status: 'approved' } : d);
    saveDraftPlan(modified, DRAFT_PLAN_PATH);
    const written = JSON.parse(fs.readFileSync(DRAFT_PLAN_PATH, 'utf8'));
    expect(written[0].status).toBe('approved');
  });
});

// ============================================================================
// runApproval
// ============================================================================

describe('runApproval', () => {
  function writeDraftPlan(entries) {
    fs.writeFileSync(DRAFT_PLAN_PATH, JSON.stringify(entries));
  }

  function writeApprovedSends(entries) {
    fs.writeFileSync(APPROVED_SENDS_PATH, JSON.stringify(entries));
  }

  function readDraftPlan() {
    return JSON.parse(fs.readFileSync(DRAFT_PLAN_PATH, 'utf8'));
  }

  function readApprovedSends() {
    return JSON.parse(fs.readFileSync(APPROVED_SENDS_PATH, 'utf8'));
  }

  test('returns summary with approved/rejected/skipped keys', async () => {
    writeDraftPlan([DRAFT_1, DRAFT_2]);
    writeApprovedSends([]);
    const rl = makeMockReadline(['a', 'r']);
    const summary = await runApproval(config, rl);
    expect(summary).toHaveProperty('approved');
    expect(summary).toHaveProperty('rejected');
    expect(summary).toHaveProperty('skipped');
  });

  test('approved draft gets status=approved in draft-plan', async () => {
    writeDraftPlan([DRAFT_1, DRAFT_2]);
    writeApprovedSends([]);
    const rl = makeMockReadline(['a', 's']);
    await runApproval(config, rl);
    const sarah = readDraftPlan().find(d => d.id === 'p-000001');
    expect(sarah.status).toBe('approved');
  });

  test('rejected draft gets status=rejected in draft-plan', async () => {
    writeDraftPlan([DRAFT_1, DRAFT_2]);
    writeApprovedSends([]);
    const rl = makeMockReadline(['r', 's']);
    await runApproval(config, rl);
    const sarah = readDraftPlan().find(d => d.id === 'p-000001');
    expect(sarah.status).toBe('rejected');
  });

  test('skipped draft retains status=draft in draft-plan', async () => {
    writeDraftPlan([DRAFT_1, DRAFT_2]);
    writeApprovedSends([]);
    const rl = makeMockReadline(['s', 's']);
    await runApproval(config, rl);
    const sarah = readDraftPlan().find(d => d.id === 'p-000001');
    expect(sarah.status).toBe('draft');
  });

  test('approved drafts appear in approved-sends.json', async () => {
    writeDraftPlan([DRAFT_1, DRAFT_2]);
    writeApprovedSends([]);
    const rl = makeMockReadline(['a', 'a']);
    await runApproval(config, rl);
    const sends = readApprovedSends();
    expect(sends.length).toBe(2);
    expect(sends.map(d => d.id)).toContain('p-000001');
    expect(sends.map(d => d.id)).toContain('p-000002');
  });

  test('approved-sends.json preserves existing entries', async () => {
    writeDraftPlan([DRAFT_1]);
    writeApprovedSends([EXISTING_APPROVED_SEND]);
    const rl = makeMockReadline(['a']);
    await runApproval(config, rl);
    const sends = readApprovedSends();
    expect(sends.length).toBe(2); // 1 existing + 1 new
    expect(sends.map(d => d.id)).toContain('p-old-001');
    expect(sends.map(d => d.id)).toContain('p-000001');
  });

  test('summary counts match actions taken', async () => {
    writeDraftPlan([DRAFT_1, DRAFT_2]);
    writeApprovedSends([]);
    const rl = makeMockReadline(['a', 'r']);
    const summary = await runApproval(config, rl);
    expect(summary.approved).toBe(1);
    expect(summary.rejected).toBe(1);
    expect(summary.skipped).toBe(0);
  });

  test('no drafts returns zero summary', async () => {
    writeDraftPlan([]);
    writeApprovedSends([]);
    const rl = makeMockReadline([]);
    const summary = await runApproval(config, rl);
    expect(summary.approved).toBe(0);
    expect(summary.rejected).toBe(0);
    expect(summary.skipped).toBe(0);
  });

  test('approved entries in approved-sends have status=approved', async () => {
    writeDraftPlan([DRAFT_1, DRAFT_2]);
    writeApprovedSends([]);
    const rl = makeMockReadline(['a', 'a']);
    await runApproval(config, rl);
    readApprovedSends().forEach(d => expect(d.status).toBe('approved'));
  });
});
