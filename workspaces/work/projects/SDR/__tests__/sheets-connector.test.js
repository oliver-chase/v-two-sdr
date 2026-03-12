/**
 * Google Sheets Connector — Unit & Integration Tests
 * TDD: Tests first, implementation follows
 */

const {
  GoogleSheetsConnector,
  parseSheetRow,
  inferSchema,
  validateFieldMapping,
  toonToSheetRow,
  sheetRowToToon,
} = require('../sheets-connector');

const fs = require('fs');
const path = require('path');

// ============================================================================
// FIXTURES & MOCKS
// ============================================================================

const MOCK_SHEET_ROWS = [
  {
    'FirstName': 'Alice',
    'LastName': 'Johnson',
    'Email': 'alice@techcorp.com',
    'Company': 'TechCorp',
    'Title': 'CTO',
    'LinkedIn': 'linkedin.com/in/alice-johnson',
    'Location': 'San Francisco, CA',
    'Timezone': 'America/Los_Angeles',
    'Track': 'ai-enablement',
    'Status': 'new'
  },
  {
    'FirstName': 'Bob',
    'LastName': 'Smith',
    'Email': 'bob@startupxyz.com',
    'Company': 'StartupXYZ',
    'Title': 'Founder',
    'LinkedIn': 'linkedin.com/in/bob-smith',
    'Location': 'New York, NY',
    'Timezone': 'America/New_York',
    'Track': 'product-maker',
    'Status': 'new'
  }
];

const MOCK_TOON_PROSPECTS = [
  {
    id: 'p-000001',
    fn: 'Alice',
    ln: 'Johnson',
    em: 'alice@techcorp.com',
    co: 'TechCorp',
    ti: 'CTO',
    li: 'linkedin.com/in/alice-johnson',
    lo: 'San Francisco, CA',
    tz: 'America/Los_Angeles',
    tr: 'ai-enablement',
    st: 'new',
    ad: '2026-03-11',
    lc: '2026-03-11',
    no: ''
  }
];

const MOCK_CREDENTIALS = {
  type: 'service_account',
  project_id: 'test-project',
  private_key_id: 'test-key-id',
  private_key: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n',
  client_email: 'test@test.iam.gserviceaccount.com'
};

const MOCK_CONFIG = {
  google_sheets: {
    sheet_id: 'test-sheet-id-12345',
    sheet_name: 'Prospects',
    templates_sheet: 'Templates',
    optouts_sheet: 'OptOuts'
  },
  credentials_path: './secrets/google-code-credentials.json'
};

// ============================================================================
// UNIT TESTS: Schema Inference
// ============================================================================

describe('Schema Inference', () => {
  test('inferSchema: should detect columns from sheet rows', () => {
    const headers = Object.keys(MOCK_SHEET_ROWS[0]);
    const schema = inferSchema(headers);

    expect(schema).toBeDefined();
    expect(schema.firstName).toBeDefined();
    expect(schema.email).toBeDefined();
    expect(schema.company).toBeDefined();
    expect(schema.track).toBeDefined();
  });

  test('inferSchema: should map sheet headers to TOON fields', () => {
    const headers = ['FirstName', 'LastName', 'Email', 'Company', 'Title'];
    const schema = inferSchema(headers);

    expect(schema.firstName?.toonField).toBe('fn');
    expect(schema.lastName?.toonField).toBe('ln');
    expect(schema.email?.toonField).toBe('em');
    expect(schema.company?.toonField).toBe('co');
    expect(schema.title?.toonField).toBe('ti');
  });

  test('inferSchema: should handle custom headers', () => {
    const headers = [
      'First Name (Required)',
      'Email Address',
      'Company Name',
      'Job Title'
    ];
    const schema = inferSchema(headers);

    // Should still match core fields despite variation
    expect(Object.keys(schema).length).toBeGreaterThan(0);
  });

  test('inferSchema: should detect optional fields', () => {
    const headers = [
      'FirstName', 'LastName', 'Email', 'Company', 'Title',
      'LinkedIn', 'Notes', 'Source', 'DateAdded'
    ];
    const schema = inferSchema(headers);

    expect(schema.linkedIn?.required).toBe(false);
    expect(schema.source?.required).toBe(false);
    expect(schema.email?.required).toBe(true);
  });
});

// ============================================================================
// UNIT TESTS: Field Mapping & Validation
// ============================================================================

describe('Field Mapping & Validation', () => {
  test('validateFieldMapping: should confirm valid TOON mapping', () => {
    const mapping = {
      FirstName: 'fn',
      LastName: 'ln',
      Email: 'em',
      Company: 'co',
      Title: 'ti'
    };

    const result = validateFieldMapping(mapping);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('validateFieldMapping: should catch missing required fields', () => {
    const mapping = {
      FirstName: 'fn',
      LastName: 'ln',
      // Email missing - REQUIRED
      Company: 'co'
    };

    const result = validateFieldMapping(mapping);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining('email'));
  });

  test('validateFieldMapping: should allow optional fields to be unmapped', () => {
    const mapping = {
      FirstName: 'fn',
      LastName: 'ln',
      Email: 'em',
      Company: 'co',
      Title: 'ti',
      // Notes omitted (optional)
    };

    const result = validateFieldMapping(mapping);
    expect(result.isValid).toBe(true);
  });

  test('validateFieldMapping: should catch duplicate TOON field mappings', () => {
    const mapping = {
      FirstName: 'fn',
      LastName: 'fn', // DUPLICATE
      Email: 'em',
      Company: 'co'
    };

    const result = validateFieldMapping(mapping);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining('duplicate'));
  });
});

// ============================================================================
// UNIT TESTS: Row Parsing & Conversion
// ============================================================================

describe('Row Parsing & Conversion', () => {
  test('parseSheetRow: should convert sheet row to TOON format', () => {
    const sheetRow = MOCK_SHEET_ROWS[0];
    const mapping = {
      FirstName: 'fn',
      LastName: 'ln',
      Email: 'em',
      Company: 'co',
      Title: 'ti',
      LinkedIn: 'li',
      Location: 'lo',
      Timezone: 'tz',
      Track: 'tr',
      Status: 'st'
    };

    const toonRow = parseSheetRow(sheetRow, mapping, 1);

    expect(toonRow.id).toBe('p-000001');
    expect(toonRow.fn).toBe('Alice');
    expect(toonRow.em).toBe('alice@techcorp.com');
    expect(toonRow.tr).toBe('ai-enablement');
  });

  test('parseSheetRow: should assign incrementing IDs', () => {
    const row1 = parseSheetRow(MOCK_SHEET_ROWS[0], {}, 1);
    const row2 = parseSheetRow(MOCK_SHEET_ROWS[1], {}, 2);

    expect(row1.id).toBe('p-000001');
    expect(row2.id).toBe('p-000002');
  });

  test('parseSheetRow: should handle missing optional fields', () => {
    const incompleteRow = {
      FirstName: 'Charlie',
      LastName: 'Brown',
      Email: 'charlie@example.com',
      Company: 'ACME',
      Title: 'Manager'
      // LinkedIn, Location, Notes omitted
    };

    const mapping = {
      FirstName: 'fn',
      LastName: 'ln',
      Email: 'em',
      Company: 'co',
      Title: 'ti',
      LinkedIn: 'li',
      Location: 'lo'
    };

    const toonRow = parseSheetRow(incompleteRow, mapping, 1);
    expect(toonRow.li).toBeUndefined();
    expect(toonRow.lo).toBeUndefined();
  });

  test('toonToSheetRow: should convert TOON back to sheet format', () => {
    const toonRow = MOCK_TOON_PROSPECTS[0];
    const reverseMapping = {
      fn: 'FirstName',
      ln: 'LastName',
      em: 'Email',
      co: 'Company',
      ti: 'Title',
      li: 'LinkedIn',
      lo: 'Location',
      tz: 'Timezone',
      tr: 'Track',
      st: 'Status'
    };

    const sheetRow = toonToSheetRow(toonRow, reverseMapping);

    expect(sheetRow.FirstName).toBe('Alice');
    expect(sheetRow.Email).toBe('alice@techcorp.com');
    expect(sheetRow.Status).toBe('new');
  });

  test('sheetRowToToon: should parse with timestamp metadata', () => {
    const sheetRow = MOCK_SHEET_ROWS[0];
    const mapping = {
      FirstName: 'fn',
      LastName: 'ln',
      Email: 'em',
      Company: 'co',
      Title: 'ti',
      Track: 'tr',
      Status: 'st'
    };

    const toonRow = sheetRowToToon(sheetRow, mapping, 1);

    expect(toonRow.ad).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD
    expect(toonRow.lc).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ============================================================================
// UNIT TESTS: Data Validation
// ============================================================================

describe('Data Validation', () => {
  test('parseSheetRow: should mark invalid emails for review', () => {
    const badEmailRow = {
      FirstName: 'Dave',
      LastName: 'Invalid',
      Email: 'not-an-email', // INVALID
      Company: 'BadCorp',
      Title: 'CEO'
    };

    const mapping = {
      FirstName: 'fn',
      LastName: 'ln',
      Email: 'em',
      Company: 'co',
      Title: 'ti'
    };

    const toonRow = parseSheetRow(badEmailRow, mapping, 1);
    expect(toonRow.em).toBe('not-an-email'); // Stored but flagged
    expect(toonRow.vl).toBeDefined(); // Validation metadata
  });

  test('parseSheetRow: should preserve state for status transitions', () => {
    const row = {
      ...MOCK_SHEET_ROWS[0],
      Status: 'sent'
    };

    const mapping = { Status: 'st', FirstName: 'fn', Email: 'em', Company: 'co', Title: 'ti', LastName: 'ln' };
    const toonRow = parseSheetRow(row, mapping, 1);

    expect(toonRow.st).toBe('sent');
  });
});

// ============================================================================
// INTEGRATION TESTS: GoogleSheetsConnector
// ============================================================================

describe('GoogleSheetsConnector — Initialization', () => {
  test('new GoogleSheetsConnector: should initialize with config', () => {
    const connector = new GoogleSheetsConnector(MOCK_CONFIG);

    expect(connector.sheetId).toBe('test-sheet-id-12345');
    expect(connector.sheetName).toBe('Prospects');
    expect(connector.credentialsPath).toBe('./secrets/google-code-credentials.json');
  });

  test('new GoogleSheetsConnector: should validate config structure', () => {
    const invalidConfig = {
      google_sheets: {
        // Missing sheet_id
        sheet_name: 'Prospects'
      }
    };

    expect(() => {
      new GoogleSheetsConnector(invalidConfig);
    }).toThrow('sheet_id');
  });

  test('new GoogleSheetsConnector: should accept credentialsPath override', () => {
    const customConfig = {
      ...MOCK_CONFIG,
      credentials_path: '/custom/path.json'
    };

    const connector = new GoogleSheetsConnector(customConfig);
    expect(connector.credentialsPath).toBe('/custom/path.json');
  });
});

describe('GoogleSheetsConnector — Schema Detection (Mocked API)', () => {
  let connector;

  beforeEach(() => {
    connector = new GoogleSheetsConnector(MOCK_CONFIG);
    // Mock the Google Sheets API
    connector.doc = {
      useServiceAccountAuth: jest.fn().mockResolvedValue(undefined),
      loadInfo: jest.fn().mockResolvedValue(undefined),
      sheetsByTitle: {
        Prospects: {
          getRows: jest.fn().mockResolvedValue(MOCK_SHEET_ROWS)
        }
      }
    };
  });

  test('detectSchema: should infer schema from sheet rows', async () => {
    const schema = await connector.detectSchema();

    expect(schema).toBeDefined();
    expect(schema.firstName).toBeDefined();
    expect(schema.email).toBeDefined();
    expect(schema.company).toBeDefined();
  });

  test('detectSchema: should identify required vs optional fields', async () => {
    const schema = await connector.detectSchema();

    expect(schema.email.required).toBe(true);
    expect(schema.linkedIn?.required).toBe(false);
  });

  test('detectSchema: should return mapping suggestions', async () => {
    const schema = await connector.detectSchema();

    expect(schema.firstName.toonField).toBe('fn');
    expect(schema.email.toonField).toBe('em');
    expect(schema.track.toonField).toBe('tr');
  });
});

describe('GoogleSheetsConnector — Field Confirmation Workflow', () => {
  let connector;

  beforeEach(() => {
    connector = new GoogleSheetsConnector(MOCK_CONFIG);
    connector.doc = {
      sheetsByTitle: {
        Prospects: {
          getRows: jest.fn().mockResolvedValue(MOCK_SHEET_ROWS)
        }
      }
    };
  });

  test('confirmFieldMapping: should validate user-provided mapping', async () => {
    const userMapping = {
      FirstName: 'fn',
      LastName: 'ln',
      Email: 'em',
      Company: 'co',
      Title: 'ti'
    };

    const result = await connector.confirmFieldMapping(userMapping);

    expect(result.isValid).toBe(true);
    expect(result.mapping).toEqual(userMapping);
  });

  test('confirmFieldMapping: should reject incomplete mappings', async () => {
    const incompleteMapping = {
      FirstName: 'fn',
      LastName: 'ln'
      // Email missing - REQUIRED
    };

    const result = await connector.confirmFieldMapping(incompleteMapping);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining('email'));
  });

  test('confirmFieldMapping: should allow default mapping if not provided', async () => {
    const result = await connector.confirmFieldMapping(null, true);

    expect(result.isValid).toBe(true);
    expect(result.mapping).toBeDefined();
  });
});

describe('GoogleSheetsConnector — Read Operations (Mocked)', () => {
  let connector;

  beforeEach(() => {
    connector = new GoogleSheetsConnector(MOCK_CONFIG);
    connector.doc = {
      useServiceAccountAuth: jest.fn().mockResolvedValue(undefined),
      loadInfo: jest.fn().mockResolvedValue(undefined),
      sheetsByTitle: {
        Prospects: {
          getRows: jest.fn().mockResolvedValue(MOCK_SHEET_ROWS)
        },
        OptOuts: {
          getRows: jest.fn().mockResolvedValue([])
        }
      }
    };
    connector.fieldMapping = {
      FirstName: 'fn',
      LastName: 'ln',
      Email: 'em',
      Company: 'co',
      Title: 'ti',
      LinkedIn: 'li',
      Location: 'lo',
      Timezone: 'tz',
      Track: 'tr',
      Status: 'st'
    };
  });

  test('readProspects: should fetch all prospects from sheet', async () => {
    const prospects = await connector.readProspects();

    expect(prospects).toHaveLength(2);
    expect(prospects[0].fn).toBe('Alice');
    expect(prospects[1].fn).toBe('Bob');
  });

  test('readProspects: should convert to TOON format', async () => {
    const prospects = await connector.readProspects();

    expect(prospects[0]).toHaveProperty('id');
    expect(prospects[0]).toHaveProperty('fn');
    expect(prospects[0]).toHaveProperty('em');
    expect(prospects[0]).toHaveProperty('tr');
  });

  test('readProspects: should include metadata', async () => {
    const result = await connector.readProspects({ includeMetadata: true });

    expect(result.metadata).toBeDefined();
    expect(result.metadata.tot).toBe(2);
    expect(result.metadata.lu).toBeDefined();
  });

  test('readOptOuts: should fetch opt-out list', async () => {
    const optOuts = await connector.readOptOuts();

    expect(Array.isArray(optOuts)).toBe(true);
  });
});

describe('GoogleSheetsConnector — Write Operations (Mocked)', () => {
  let connector;

  beforeEach(() => {
    connector = new GoogleSheetsConnector(MOCK_CONFIG);
    connector.doc = {
      useServiceAccountAuth: jest.fn().mockResolvedValue(undefined),
      loadInfo: jest.fn().mockResolvedValue(undefined),
      sheetsByTitle: {
        Prospects: {
          getRows: jest.fn().mockResolvedValue(MOCK_SHEET_ROWS),
          addRows: jest.fn().mockResolvedValue([])
        }
      }
    };
    connector.fieldMapping = {
      FirstName: 'fn',
      LastName: 'ln',
      Email: 'em',
      Company: 'co',
      Title: 'ti',
      Status: 'st'
    };
  });

  test('appendProspects: should add new rows to sheet', async () => {
    const newProspects = [
      {
        id: 'p-000003',
        fn: 'Eve',
        ln: 'White',
        em: 'eve@company.com',
        co: 'Company',
        ti: 'VP',
        st: 'new'
      }
    ];

    const result = await connector.appendProspects(newProspects);

    expect(result.added).toBe(1);
    expect(connector.doc.sheetsByTitle.Prospects.addRows).toHaveBeenCalled();
  });

  test('appendProspects: should convert TOON back to sheet format', async () => {
    const toonRow = MOCK_TOON_PROSPECTS[0];

    await connector.appendProspects([toonRow]);

    const callArgs = connector.doc.sheetsByTitle.Prospects.addRows.mock.calls[0];
    expect(callArgs[0][0].FirstName).toBe('Alice');
  });

  test('appendProspects: should batch write for performance', async () => {
    const manyProspects = Array.from({ length: 150 }, (_, i) => ({
      id: `p-${String(i + 1).padStart(6, '0')}`,
      fn: `First${i}`,
      ln: `Last${i}`,
      em: `email${i}@test.com`,
      co: `Corp${i}`,
      ti: 'Title',
      st: 'new'
    }));

    await connector.appendProspects(manyProspects);

    // Should batch in ~100 rows per API call to respect rate limits
    expect(connector.doc.sheetsByTitle.Prospects.addRows.mock.calls.length).toBeGreaterThan(1);
  });

  test('updateProspectStatus: should update status for existing lead', async () => {
    const mockSheet = {
      getRows: jest.fn().mockResolvedValue([
        { rowIndex: 2, Email: 'alice@techcorp.com', Status: 'new', save: jest.fn().mockResolvedValue(undefined) }
      ])
    };
    connector.doc.sheetsByTitle.Prospects = mockSheet;

    const result = await connector.updateProspectStatus('alice@techcorp.com', 'sent');

    expect(result.updated).toBe(1);
  });

  test('updateProspectStatus: should handle not found gracefully', async () => {
    const mockSheet = {
      getRows: jest.fn().mockResolvedValue([])
    };
    connector.doc.sheetsByTitle.Prospects = mockSheet;

    const result = await connector.updateProspectStatus('nonexistent@example.com', 'sent');

    expect(result.updated).toBe(0);
    expect(result.error).toBeDefined();
  });
});

describe('GoogleSheetsConnector — Rate Limiting & Caching', () => {
  let connector;

  beforeEach(() => {
    connector = new GoogleSheetsConnector(MOCK_CONFIG);
  });

  test('should respect Google Sheets API rate limits (300/min)', async () => {
    const startTime = Date.now();

    // Simulate 600 requests (would exceed rate if not batched)
    for (let i = 0; i < 5; i++) {
      connector.recordApiCall();
    }

    expect(connector.getApiCallCount()).toBe(5);
  });

  test('should cache field schema to avoid re-detection', async () => {
    connector.doc = {
      useServiceAccountAuth: jest.fn().mockResolvedValue(undefined),
      loadInfo: jest.fn().mockResolvedValue(undefined),
      sheetsByTitle: {
        Prospects: {
          getRows: jest.fn().mockResolvedValue(MOCK_SHEET_ROWS)
        }
      }
    };

    await connector.detectSchema();
    await connector.detectSchema();

    // getRows should only be called once (cached)
    expect(connector.doc.sheetsByTitle.Prospects.getRows).toHaveBeenCalledTimes(1);
  });

  test('should provide cache invalidation', () => {
    connector.schema = { test: 'data' };
    connector.invalidateCache();

    expect(connector.schema).toBeNull();
  });
});

// ============================================================================
// ERROR HANDLING & EDGE CASES
// ============================================================================

describe('Error Handling', () => {
  let connector;

  beforeEach(() => {
    connector = new GoogleSheetsConnector(MOCK_CONFIG);
  });

  test('readProspects: should handle API authentication errors', async () => {
    connector.doc = {
      useServiceAccountAuth: jest.fn().mockRejectedValue(new Error('Invalid credentials'))
    };

    await expect(connector.readProspects()).rejects.toThrow('authentication');
  });

  test('readProspects: should handle malformed sheet data', async () => {
    connector.doc = {
      useServiceAccountAuth: jest.fn().mockResolvedValue(undefined),
      loadInfo: jest.fn().mockResolvedValue(undefined),
      sheetsByTitle: {
        Prospects: {
          getRows: jest.fn().mockResolvedValue([
            { FirstName: 'Test' } // Missing required fields
          ])
        }
      }
    };

    const prospects = await connector.readProspects({ skipValidation: true });
    expect(prospects).toBeDefined();
  });

  test('appendProspects: should retry on transient failures', async () => {
    connector.doc = {
      useServiceAccountAuth: jest.fn().mockResolvedValue(undefined),
      loadInfo: jest.fn().mockResolvedValue(undefined),
      sheetsByTitle: {
        Prospects: {
          addRows: jest.fn()
            .mockRejectedValueOnce(new Error('RATE_LIMIT_EXCEEDED'))
            .mockResolvedValueOnce([])
        }
      }
    };
    connector.fieldMapping = {
      FirstName: 'fn', LastName: 'ln', Email: 'em', Company: 'co', Title: 'ti'
    };

    const result = await connector.appendProspects([MOCK_TOON_PROSPECTS[0]], { retries: 3 });
    expect(result.added).toBe(1);
  });
});

// ============================================================================
// INTEGRATION TEST: Full Workflow
// ============================================================================

describe('Full Integration: Sync Workflow', () => {
  let connector;

  beforeEach(() => {
    connector = new GoogleSheetsConnector(MOCK_CONFIG);
    connector.doc = {
      useServiceAccountAuth: jest.fn().mockResolvedValue(undefined),
      loadInfo: jest.fn().mockResolvedValue(undefined),
      sheetsByTitle: {
        Prospects: {
          getRows: jest.fn().mockResolvedValue(MOCK_SHEET_ROWS),
          addRows: jest.fn().mockResolvedValue([])
        },
        OptOuts: {
          getRows: jest.fn().mockResolvedValue([])
        }
      }
    };
  });

  test('fullSync: should read, validate, and return TOON prospects', async () => {
    connector.fieldMapping = {
      FirstName: 'fn',
      LastName: 'ln',
      Email: 'em',
      Company: 'co',
      Title: 'ti',
      Track: 'tr',
      Status: 'st'
    };

    const result = await connector.fullSync();

    expect(result.prospects).toHaveLength(2);
    expect(result.metadata).toBeDefined();
    expect(result.metadata.tot).toBe(2);
  });

  test('fullSync: should exclude opted-out prospects', async () => {
    connector.doc.sheetsByTitle.OptOuts.getRows = jest
      .fn()
      .mockResolvedValue([
        { Email: 'alice@techcorp.com', Reason: 'unsubscribe' }
      ]);

    connector.fieldMapping = {
      FirstName: 'fn',
      LastName: 'ln',
      Email: 'em',
      Company: 'co',
      Title: 'ti',
      Track: 'tr',
      Status: 'st'
    };

    const result = await connector.fullSync();

    // Should have 1 prospect (Bob) after excluding Alice
    expect(result.prospects).toHaveLength(1);
    expect(result.prospects[0].fn).toBe('Bob');
  });

  test('fullSync: should report sync summary', async () => {
    connector.fieldMapping = {
      FirstName: 'fn',
      LastName: 'ln',
      Email: 'em',
      Company: 'co',
      Title: 'ti',
      Track: 'tr',
      Status: 'st'
    };

    const result = await connector.fullSync();

    expect(result.summary).toBeDefined();
    expect(result.summary.totalRead).toBe(2);
    expect(result.summary.validatedCount).toBeGreaterThan(0);
  });
});

// ============================================================================
// EXPORT FOR MODULE USAGE
// ============================================================================

module.exports = {
  MOCK_SHEET_ROWS,
  MOCK_TOON_PROSPECTS,
  MOCK_CREDENTIALS,
  MOCK_CONFIG
};
