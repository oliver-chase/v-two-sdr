/**
 * Draft Emails Tests
 * TDD: loadTemplates, selectTemplate, mergeDraft, generateDrafts
 *
 * Uses real temp files (same pattern as existing project tests).
 */

const fs = require('fs');
const path = require('path');

const { loadTemplates, selectTemplate, mergeDraft, generateDrafts, classifyTitle, classifyFunding, getGroupKey, groupProspects } = require('../scripts/draft-emails');

// ============================================================================
// TEMP FILE PATHS
// ============================================================================

const TMP = path.join(__dirname, 'fixtures');
const TEMPLATES_PATH = path.join(TMP, 'tmp-templates.md');
const PROSPECTS_PATH = path.join(TMP, 'tmp-prospects.json');
const OPT_OUTS_PATH = path.join(TMP, 'tmp-opt-outs.json');
const DRAFT_PLAN_PATH = path.join(TMP, 'tmp-draft-plan.json');

// ============================================================================
// FIXTURES
// ============================================================================

const TEMPLATES_MD = `# Email Templates -- V.Two SDR Outreach

## Template A -- Cold Outreach (Product Maker)

**Subject:** Quick question, [Name]

\`\`\`
Hi [Name],

Came across [Company] -- looks like you're scaling the product team fast.

At V.Two we build custom digital products end-to-end.

Worth a quick conversation?

[Oliver]
V.Two | vtwo.co
\`\`\`

---

## Template B -- Cold Outreach (AI Enablement)

**Subject:** AI infrastructure at [Company]

\`\`\`
Hi [Name],

Working with a few data and engineering leaders right now.

V.Two helps companies close that gap.

Open to a 20-minute call?

[Oliver]
V.Two | vtwo.co
\`\`\`

---

## Template C -- Cold Outreach (Pace Car)

**Subject:** Senior engineering capacity at [Company]

\`\`\`
Hi [Name],

Quick one -- if you ever need senior engineering capacity.

Would it be useful to connect?

[Oliver]
V.Two | vtwo.co
\`\`\`

---

## Template D -- Follow-Up (Day 5-7, no reply)

**Subject:** Re: [original subject]

\`\`\`
Hi [Name],

Just bumping this up -- happy to keep it brief if you're open to it.

[Oliver]
\`\`\`

---

## Template E -- Follow-Up (Day 12-14, final)

**Subject:** Closing the loop

\`\`\`
Hi [Name],

No worries if the timing isn't right -- I'll leave it here.

[Oliver]
V.Two | vtwo.co
\`\`\`
`;

const PROSPECT_PRODUCT = {
  id: 'p-000001', fn: 'Sarah', ln: 'Chen', em: 'sarah@acme.co',
  co: 'Acme', ti: 'CTO', tr: 'product-maker', st: 'new'
};

const PROSPECT_AI = {
  id: 'p-000002', fn: 'James', ln: 'Lee', em: 'james@beta.io',
  co: 'Beta', ti: 'VPE', tr: 'ai-enablement', st: 'email_discovered'
};

const PROSPECT_PACE = {
  id: 'p-000003', fn: 'Nina', ln: 'Roy', em: 'nina@gamma.co',
  co: 'Gamma', ti: 'Founder', tr: 'pace-car', st: 'new'
};

const PROSPECT_UNKNOWN = {
  id: 'p-000004', fn: 'Tom', ln: 'Smith', em: 'tom@delta.io',
  co: 'Delta', ti: 'CTO', tr: 'unknown-track', st: 'new'
};

const PROSPECT_NO_EMAIL = {
  id: 'p-000005', fn: 'Alice', ln: 'Wong',
  co: 'Epsilon', ti: 'CTO', tr: 'product-maker', st: 'new'
};

// Prospect Sarah is opted out in OPT_OUTS below
const PROSPECTS_JSON = {
  prospects: [PROSPECT_PRODUCT, PROSPECT_AI, PROSPECT_PACE],
  metadata: { tot: 3, lu: '2026-03-13T00:00:00Z' }
};

const OPT_OUTS = {
  opt_outs: [{ em: 'sarah@acme.co', ts: '2026-03-10T00:00:00Z' }],
  metadata: { tot: 1 }
};

const EMPTY_OPT_OUTS = { opt_outs: [], metadata: { tot: 0 } };

// ============================================================================
// SETUP / TEARDOWN
// ============================================================================

beforeAll(() => {
  if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });
});

afterEach(() => {
  [TEMPLATES_PATH, PROSPECTS_PATH, OPT_OUTS_PATH, DRAFT_PLAN_PATH].forEach(f => {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  });
});

// ============================================================================
// loadTemplates
// ============================================================================

describe('loadTemplates', () => {
  beforeEach(() => {
    fs.writeFileSync(TEMPLATES_PATH, TEMPLATES_MD, 'utf8');
  });

  test('returns object with keys A, B, C, D, E', () => {
    const templates = loadTemplates(TEMPLATES_PATH);
    expect(Object.keys(templates).sort()).toEqual(['A', 'B', 'C', 'D', 'E']);
  });

  test('Template A has correct subject', () => {
    const templates = loadTemplates(TEMPLATES_PATH);
    expect(templates.A.subject).toBe('Quick question, [Name]');
  });

  test('Template B has correct subject', () => {
    const templates = loadTemplates(TEMPLATES_PATH);
    expect(templates.B.subject).toBe('AI infrastructure at [Company]');
  });

  test('Template C has correct subject', () => {
    const templates = loadTemplates(TEMPLATES_PATH);
    expect(templates.C.subject).toBe('Senior engineering capacity at [Company]');
  });

  test('Template D has correct subject', () => {
    const templates = loadTemplates(TEMPLATES_PATH);
    expect(templates.D.subject).toBe('Re: [original subject]');
  });

  test('Template E has correct subject', () => {
    const templates = loadTemplates(TEMPLATES_PATH);
    expect(templates.E.subject).toBe('Closing the loop');
  });

  test('Template A body contains [Name]', () => {
    const templates = loadTemplates(TEMPLATES_PATH);
    expect(templates.A.body).toContain('[Name]');
  });

  test('Template A body contains [Company]', () => {
    const templates = loadTemplates(TEMPLATES_PATH);
    expect(templates.A.body).toContain('[Company]');
  });

  test('Template B body is a non-empty string', () => {
    const templates = loadTemplates(TEMPLATES_PATH);
    expect(typeof templates.B.body).toBe('string');
    expect(templates.B.body.length).toBeGreaterThan(0);
  });

  test('Template E subject does not contain [Company]', () => {
    const templates = loadTemplates(TEMPLATES_PATH);
    expect(templates.E.subject).toBe('Closing the loop');
  });
});

// ============================================================================
// selectTemplate
// ============================================================================

describe('selectTemplate', () => {
  let templates;

  beforeEach(() => {
    fs.writeFileSync(TEMPLATES_PATH, TEMPLATES_MD, 'utf8');
    templates = loadTemplates(TEMPLATES_PATH);
  });

  test('product-maker track selects Template A', () => {
    expect(selectTemplate(templates, PROSPECT_PRODUCT)).toBe(templates.A);
  });

  test('ai-enablement track selects Template B', () => {
    expect(selectTemplate(templates, PROSPECT_AI)).toBe(templates.B);
  });

  test('pace-car track selects Template C', () => {
    expect(selectTemplate(templates, PROSPECT_PACE)).toBe(templates.C);
  });

  test('unknown track defaults to Template A', () => {
    expect(selectTemplate(templates, PROSPECT_UNKNOWN)).toBe(templates.A);
  });

  test('missing track defaults to Template A', () => {
    expect(selectTemplate(templates, { tr: undefined })).toBe(templates.A);
  });
});

// ============================================================================
// mergeDraft
// ============================================================================

describe('mergeDraft', () => {
  const template = {
    subject: 'Quick question, [Name]',
    body: 'Hi [Name],\n\nCame across [Company] -- interesting.\n\n[Oliver]'
  };

  test('replaces [Name] in subject with prospect fn', () => {
    expect(mergeDraft(template, PROSPECT_PRODUCT).subject).toBe('Quick question, Sarah');
  });

  test('replaces [Company] in subject with prospect co', () => {
    const tmpl = { subject: 'AI infrastructure at [Company]', body: 'Hi [Name]' };
    expect(mergeDraft(tmpl, PROSPECT_AI).subject).toBe('AI infrastructure at Beta');
  });

  test('replaces [Name] in body with prospect fn', () => {
    const result = mergeDraft(template, PROSPECT_PRODUCT);
    expect(result.body).toContain('Hi Sarah,');
    expect(result.body).not.toContain('[Name]');
  });

  test('replaces [Company] in body with prospect co', () => {
    const result = mergeDraft(template, PROSPECT_PRODUCT);
    expect(result.body).toContain('Acme');
    expect(result.body).not.toContain('[Company]');
  });

  test('returns object with subject and body keys', () => {
    const result = mergeDraft(template, PROSPECT_PRODUCT);
    expect(result).toHaveProperty('subject');
    expect(result).toHaveProperty('body');
  });

  test('handles missing fn gracefully (empty string)', () => {
    expect(mergeDraft(template, { fn: undefined, co: 'Acme' }).subject).toBe('Quick question, ');
  });

  test('handles multiple [Name] occurrences in body', () => {
    const tmpl = { subject: '[Name]', body: 'Hi [Name], goodbye [Name]' };
    expect(mergeDraft(tmpl, { fn: 'Sarah', co: 'Acme' }).body).toBe('Hi Sarah, goodbye Sarah');
  });
});

// ============================================================================
// generateDrafts
// ============================================================================

describe('generateDrafts', () => {
  const config = {
    paths: {
      templatesPath: TEMPLATES_PATH,
      prospectsPath: PROSPECTS_PATH,
      optOutsPath: OPT_OUTS_PATH,
      draftPlanPath: DRAFT_PLAN_PATH
    }
  };

  function writeFixtures(prospectsData, optOutsData) {
    fs.writeFileSync(TEMPLATES_PATH, TEMPLATES_MD, 'utf8');
    fs.writeFileSync(PROSPECTS_PATH, JSON.stringify(prospectsData), 'utf8');
    fs.writeFileSync(OPT_OUTS_PATH, JSON.stringify(optOutsData), 'utf8');
  }

  function readDraftPlan() {
    return JSON.parse(fs.readFileSync(DRAFT_PLAN_PATH, 'utf8'));
  }

  test('returns summary object with expected keys', () => {
    writeFixtures(PROSPECTS_JSON, OPT_OUTS);
    const result = generateDrafts(config);
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('drafted');
    expect(result).toHaveProperty('skipped_optout');
    expect(result).toHaveProperty('skipped_no_email');
    expect(result).toHaveProperty('errors');
  });

  test('skips opt-out prospects (sarah@acme.co is opted out)', () => {
    writeFixtures(PROSPECTS_JSON, OPT_OUTS);
    const result = generateDrafts(config);
    expect(result.skipped_optout).toBe(1);
  });

  test('drafts remaining eligible prospects', () => {
    writeFixtures(PROSPECTS_JSON, OPT_OUTS);
    const result = generateDrafts(config);
    expect(result.drafted).toBe(2);
  });

  test('skips prospects without email', () => {
    const data = {
      prospects: [PROSPECT_NO_EMAIL, PROSPECT_AI],
      metadata: { tot: 2 }
    };
    writeFixtures(data, EMPTY_OPT_OUTS);
    const result = generateDrafts(config);
    expect(result.skipped_no_email).toBe(1);
    expect(result.drafted).toBe(1);
  });

  test('written draft-plan has status=draft for each entry', () => {
    writeFixtures(PROSPECTS_JSON, OPT_OUTS);
    generateDrafts(config);
    readDraftPlan().forEach(d => expect(d.status).toBe('draft'));
  });

  test('draft entries contain required TOON fields', () => {
    writeFixtures(PROSPECTS_JSON, OPT_OUTS);
    generateDrafts(config);
    readDraftPlan().forEach(d => {
      ['id', 'em', 'fn', 'co', 'ti', 'tr', 'tpl', 'subject', 'body', 'ts', 'status'].forEach(f => {
        expect(d).toHaveProperty(f);
      });
    });
  });

  test('draft entry for ai-enablement prospect uses Template B subject', () => {
    writeFixtures(PROSPECTS_JSON, OPT_OUTS);
    generateDrafts(config);
    const jamesDraft = readDraftPlan().find(d => d.id === 'p-000002');
    expect(jamesDraft).toBeTruthy();
    expect(jamesDraft.tpl).toBe('B');
    expect(jamesDraft.subject).toContain('Beta');
  });

  test('only prospects with status new or email_discovered are included', () => {
    const mixed = {
      prospects: [
        { ...PROSPECT_PRODUCT, em: 'sarah2@acme.co', st: 'email_sent' }, // skip
        { ...PROSPECT_AI, st: 'new' },
        { ...PROSPECT_PACE, st: 'email_discovered' }
      ],
      metadata: { tot: 3 }
    };
    writeFixtures(mixed, EMPTY_OPT_OUTS);
    expect(generateDrafts(config).drafted).toBe(2);
  });

  test('total reflects all prospects loaded before filtering', () => {
    writeFixtures(PROSPECTS_JSON, OPT_OUTS);
    expect(generateDrafts(config).total).toBe(3);
  });
});

// ============================================================================
// classifyTitle
// ============================================================================

describe('classifyTitle', () => {
  test('CEO returns executive', () => {
    expect(classifyTitle('CEO')).toBe('executive');
  });

  test('CTO returns executive', () => {
    expect(classifyTitle('CTO')).toBe('executive');
  });

  test('Founder returns executive', () => {
    expect(classifyTitle('Founder')).toBe('executive');
  });

  test('Co-Founder returns executive', () => {
    expect(classifyTitle('Co-Founder')).toBe('executive');
  });

  test('President returns executive', () => {
    expect(classifyTitle('President')).toBe('executive');
  });

  test('Managing Director returns executive', () => {
    expect(classifyTitle('Managing Director')).toBe('executive');
  });

  test('VP of Engineering returns vp-director', () => {
    expect(classifyTitle('VP of Engineering')).toBe('vp-director');
  });

  test('VP of Engineering returns vp-director (short form)', () => {
    expect(classifyTitle('VP of Sales')).toBe('vp-director');
  });

  test('Director of Product returns vp-director', () => {
    expect(classifyTitle('Director of Product')).toBe('vp-director');
  });

  test('Head of Design returns vp-director', () => {
    expect(classifyTitle('Head of Design')).toBe('vp-director');
  });

  test('Engineering Manager returns manager', () => {
    expect(classifyTitle('Engineering Manager')).toBe('manager');
  });

  test('Tech Lead returns manager', () => {
    expect(classifyTitle('Tech Lead')).toBe('manager');
  });

  test('Principal Engineer returns manager', () => {
    expect(classifyTitle('Principal Engineer')).toBe('manager');
  });

  test('Senior Software Engineer returns manager', () => {
    expect(classifyTitle('Senior Software Engineer')).toBe('manager');
  });

  test('Staff Engineer returns manager', () => {
    expect(classifyTitle('Staff Engineer')).toBe('manager');
  });

  test('Software Engineer returns ic', () => {
    expect(classifyTitle('Software Engineer')).toBe('ic');
  });

  test('empty string returns ic', () => {
    expect(classifyTitle('')).toBe('ic');
  });

  test('null/undefined returns ic', () => {
    expect(classifyTitle(null)).toBe('ic');
    expect(classifyTitle(undefined)).toBe('ic');
  });

  test('case insensitive matching', () => {
    expect(classifyTitle('ceo')).toBe('executive');
    expect(classifyTitle('vp engineering')).toBe('vp-director');
  });
});

// ============================================================================
// classifyFunding
// ============================================================================

describe('classifyFunding', () => {
  test('empty string returns bootstrap', () => {
    expect(classifyFunding('')).toBe('bootstrap');
  });

  test('null returns bootstrap', () => {
    expect(classifyFunding(null)).toBe('bootstrap');
  });

  test('undefined returns bootstrap', () => {
    expect(classifyFunding(undefined)).toBe('bootstrap');
  });

  test('Bootstrapped returns bootstrap', () => {
    expect(classifyFunding('Bootstrapped')).toBe('bootstrap');
  });

  test('Self-funded returns bootstrap', () => {
    expect(classifyFunding('Self-funded')).toBe('bootstrap');
  });

  test('Unfunded returns bootstrap', () => {
    expect(classifyFunding('Unfunded')).toBe('bootstrap');
  });

  test('Pre-Seed returns pre-seed', () => {
    expect(classifyFunding('Pre-Seed')).toBe('pre-seed');
  });

  test('pre seed (space) returns pre-seed', () => {
    expect(classifyFunding('pre seed')).toBe('pre-seed');
  });

  test('Seed returns seed', () => {
    expect(classifyFunding('Seed')).toBe('seed');
  });

  test('Series A returns series-a', () => {
    expect(classifyFunding('Series A')).toBe('series-a');
  });

  test('Series B returns growth', () => {
    expect(classifyFunding('Series B')).toBe('growth');
  });

  test('Series C returns growth', () => {
    expect(classifyFunding('Series C')).toBe('growth');
  });

  test('Growth stage returns growth', () => {
    expect(classifyFunding('Growth')).toBe('growth');
  });

  test('Public returns public', () => {
    expect(classifyFunding('Public')).toBe('public');
  });

  test('NASDAQ returns public', () => {
    expect(classifyFunding('NASDAQ')).toBe('public');
  });

  test('NYSE listed returns public', () => {
    expect(classifyFunding('NYSE')).toBe('public');
  });

  test('IPO returns public', () => {
    expect(classifyFunding('IPO')).toBe('public');
  });

  test('Unknown stage returns unknown', () => {
    expect(classifyFunding('Angel Round')).toBe('unknown');
  });
});

// ============================================================================
// getGroupKey
// ============================================================================

describe('getGroupKey', () => {
  test('returns pipe-separated string of titleLevel|industry|funding', () => {
    const prospect = { ti: 'CEO', ind: 'SaaS', fnd: 'Series A' };
    expect(getGroupKey(prospect)).toBe('executive|saas|series-a');
  });

  test('defaults missing industry to tech', () => {
    const prospect = { ti: 'Software Engineer', fnd: 'Seed' };
    expect(getGroupKey(prospect)).toBe('ic|tech|seed');
  });

  test('defaults missing funding to bootstrap', () => {
    const prospect = { ti: 'VP Engineering', ind: 'Fintech' };
    expect(getGroupKey(prospect)).toBe('vp-director|fintech|bootstrap');
  });

  test('sanitizes industry to lowercase with hyphens', () => {
    const prospect = { ti: 'Director of Product', ind: 'Health Care & Life Sciences', fnd: 'Seed' };
    const key = getGroupKey(prospect);
    // industry sanitized: no special chars, lowercase, hyphenated, max 20 chars
    expect(key.startsWith('vp-director|')).toBe(true);
    expect(key).toMatch(/^[a-z-]+\|[a-z0-9-]+\|[a-z-]+$/);
  });

  test('truncates long industry names to 20 chars', () => {
    const prospect = { ti: 'CEO', ind: 'Very Long Industry Name Here', fnd: 'Seed' };
    const [, industry] = getGroupKey(prospect).split('|');
    expect(industry.length).toBeLessThanOrEqual(20);
  });

  test('handles null/undefined fields without throwing', () => {
    expect(() => getGroupKey({})).not.toThrow();
    expect(() => getGroupKey({ ti: null, ind: null, fnd: null })).not.toThrow();
  });
});

// ============================================================================
// groupProspects
// ============================================================================

describe('groupProspects', () => {
  test('returns a Map', () => {
    expect(groupProspects([])).toBeInstanceOf(Map);
  });

  test('empty array returns empty Map', () => {
    expect(groupProspects([]).size).toBe(0);
  });

  test('prospects with same key are grouped together', () => {
    const p1 = { ti: 'CEO', ind: 'SaaS', fnd: 'Series A' };
    const p2 = { ti: 'Founder', ind: 'SaaS', fnd: 'Series A' };
    const groups = groupProspects([p1, p2]);
    // Both should be executive|saas|series-a
    expect(groups.size).toBe(1);
    const [members] = groups.values();
    expect(members).toHaveLength(2);
  });

  test('prospects with different keys are in separate groups', () => {
    const p1 = { ti: 'CEO', ind: 'SaaS', fnd: 'Seed' };
    const p2 = { ti: 'Software Engineer', ind: 'Fintech', fnd: 'Series B' };
    const groups = groupProspects([p1, p2]);
    expect(groups.size).toBe(2);
  });

  test('each group value is an array of prospects', () => {
    const prospects = [
      { ti: 'CEO', ind: 'SaaS', fnd: 'Seed' },
      { ti: 'VP Engineering', ind: 'Fintech', fnd: 'Series A' }
    ];
    const groups = groupProspects(prospects);
    for (const members of groups.values()) {
      expect(Array.isArray(members)).toBe(true);
      expect(members.length).toBeGreaterThan(0);
    }
  });

  test('single prospect produces one group with one member', () => {
    const p = { ti: 'CTO', ind: 'AI', fnd: 'Pre-Seed' };
    const groups = groupProspects([p]);
    expect(groups.size).toBe(1);
    const [members] = groups.values();
    expect(members).toHaveLength(1);
    expect(members[0]).toBe(p);
  });

  test('group keys match getGroupKey output', () => {
    const p = { ti: 'Director of Engineering', ind: 'Cloud', fnd: 'Series C' };
    const groups = groupProspects([p]);
    const expectedKey = getGroupKey(p);
    expect(groups.has(expectedKey)).toBe(true);
  });
});
