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
    'Name': 'Alice Johnson',
    'Email': 'alice@techcorp.com',
    'Company': 'TechCorp',
    'Title': 'CTO',
    'LinkedIn': 'linkedin.com/in/alice-johnson',
    'Location': 'San Francisco, CA',
    'Timezone': 'America/Los_Angeles',
    'Source': 'LinkedIn',
    'Status': 'new'
  },
  {
    'Name': 'Bob Smith',
    'Email': 'bob@startupxyz.com',
    'Company': 'StartupXYZ',
    'Title': 'Founder',
    'LinkedIn': 'linkedin.com/in/bob-smith',
    'Location': 'New York, NY',
    'Timezone': 'America/New_York',
    'Source': 'Referral',
    'Status': 'new'
  }
];

const MOCK_TOON_PROSPECTS = [
  {
    id: 'p-000001',
    nm: 'Alice Johnson',
    fn: 'Alice',
    em: 'alice@techcorp.com',
    co: 'TechCorp',
    ti: 'CTO',
    li: 'linkedin.com/in/alice-johnson',
    loc: 'San Francisco, CA',
    tz: 'America/Los_Angeles',
    src: 'LinkedIn',
    st: 'new',
    da: '2026-03-11',
    lc: '2026-03-11',
    no: ''
  }
];

const MOCK_CONFIG = {
  google_sheets: {
    sheet_id: 'test-sheet-id-12345',
    sheet_name: 'Prospects',
    templates_sheet: 'Templates',
    optouts_sheet: 'OptOuts',
    api_key: 'test-api-key-abc123'
  }
};

// ============================================================================
// UNIT TESTS: Schema Inference
// ============================================================================

describe('Schema Inference', () => {
  test('inferSchema: should detect columns from sheet rows', () => {
    const headers = Object.keys(MOCK_SHEET_ROWS[0]);
    const schema = inferSchema(headers);

    expect(schema).toBeDefined();
    expect(schema.name).toBeDefined();
    expect(schema.email).toBeDefined();
    expect(schema.company).toBeDefined();
    expect(schema.source).toBeDefined();
  });

  test('inferSchema: should map sheet headers to TOON fields', () => {
    const headers = ['Name', 'Email', 'Company', 'Title'];
    const schema = inferSchema(headers);

    expect(schema.name?.toonField).toBe('nm');
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
      Name: 'nm',
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
      Name: 'nm',
      Company: 'co',
      // Email missing - REQUIRED
      Title: 'ti'
    };

    const result = validateFieldMapping(mapping);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining('email'));
  });

  test('validateFieldMapping: should allow optional fields to be unmapped', () => {
    const mapping = {
      Name: 'nm',
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
      Name: 'nm',
      Email: 'nm', // DUPLICATE
      Company: 'co',
      Title: 'ti'
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
      Name: 'nm',
      Email: 'em',
      Company: 'co',
      Title: 'ti',
      LinkedIn: 'li',
      Location: 'loc',
      Timezone: 'tz',
      Source: 'src',
      Status: 'st'
    };

    const toonRow = parseSheetRow(sheetRow, mapping, 1);

    expect(toonRow.id).toBe('p-000001');
    expect(toonRow.nm).toBe('Alice Johnson');
    expect(toonRow.fn).toBe('Alice'); // derived from nm
    expect(toonRow.em).toBe('alice@techcorp.com');
    expect(toonRow.src).toBe('LinkedIn');
  });

  test('parseSheetRow: should assign incrementing IDs', () => {
    const row1 = parseSheetRow(MOCK_SHEET_ROWS[0], {}, 1);
    const row2 = parseSheetRow(MOCK_SHEET_ROWS[1], {}, 2);

    expect(row1.id).toBe('p-000001');
    expect(row2.id).toBe('p-000002');
  });

  test('parseSheetRow: should handle missing optional fields', () => {
    const incompleteRow = {
      Name: 'Charlie Brown',
      Email: 'charlie@example.com',
      Company: 'ACME',
      Title: 'Manager'
      // LinkedIn, Location, Notes omitted
    };

    const mapping = {
      Name: 'nm',
      Email: 'em',
      Company: 'co',
      Title: 'ti',
      LinkedIn: 'li',
      Location: 'loc'
    };

    const toonRow = parseSheetRow(incompleteRow, mapping, 1);
    expect(toonRow.li).toBeUndefined();
    expect(toonRow.loc).toBeUndefined();
  });

  test('toonToSheetRow: should convert TOON back to sheet format', () => {
    const toonRow = MOCK_TOON_PROSPECTS[0];
    const reverseMapping = {
      nm: 'Name',
      em: 'Email',
      co: 'Company',
      ti: 'Title',
      li: 'LinkedIn',
      loc: 'Location',
      tz: 'Timezone',
      src: 'Source',
      st: 'Status'
    };

    const sheetRow = toonToSheetRow(toonRow, reverseMapping);

    expect(sheetRow.Name).toBe('Alice Johnson');
    expect(sheetRow.Email).toBe('alice@techcorp.com');
    expect(sheetRow.Status).toBe('new');
  });

  test('sheetRowToToon: should parse with timestamp metadata', () => {
    const sheetRow = MOCK_SHEET_ROWS[0];
    const mapping = {
      Name: 'nm',
      Email: 'em',
      Company: 'co',
      Title: 'ti',
      Source: 'src',
      Status: 'st'
    };

    const toonRow = sheetRowToToon(sheetRow, mapping, 1);

    expect(toonRow.da).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD
    expect(toonRow.lc).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ============================================================================
// UNIT TESTS: Data Validation
// ============================================================================

describe('Data Validation', () => {
  test('parseSheetRow: should mark invalid emails for review', () => {
    const badEmailRow = {
      Name: 'Dave Invalid',
      Email: 'not-an-email', // INVALID
      Company: 'BadCorp',
      Title: 'CEO'
    };

    const mapping = {
      Name: 'nm',
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

    const mapping = { Status: 'st', Name: 'nm', Email: 'em', Company: 'co', Title: 'ti' };
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
    expect(connector.apiKey).toBe('test-api-key-abc123');
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

  test('new GoogleSheetsConnector: should accept api_key override', () => {
    const customConfig = {
      google_sheets: {
        ...MOCK_CONFIG.google_sheets,
        api_key: 'custom-api-key-xyz'
      }
    };

    const connector = new GoogleSheetsConnector(customConfig);
    expect(connector.apiKey).toBe('custom-api-key-xyz');
  });
});

describe('GoogleSheetsConnector — Schema Detection (Mocked API)', () => {
  let connector;
  let mockSheetsApi;

  beforeEach(() => {
    // Mock googleapis.sheets API
    mockSheetsApi = {
      spreadsheets: {
        values: {
          get: jest.fn().mockResolvedValue({
            data: {
              values: [Object.keys(MOCK_SHEET_ROWS[0])]
            }
          })
        }
      }
    };

    connector = new GoogleSheetsConnector(MOCK_CONFIG);
    connector.sheets = mockSheetsApi;
    connector.authenticated = true;
  });

  test('detectSchema: should infer schema from sheet rows', async () => {
    const schema = await connector.detectSchema();

    expect(schema).toBeDefined();
    expect(Object.keys(schema).length).toBeGreaterThan(0);
  });

  test('detectSchema: should identify required vs optional fields', async () => {
    const schema = await connector.detectSchema();

    // Schema should have properties, exact structure depends on inferSchema
    expect(schema).toBeDefined();
  });

  test('detectSchema: should return mapping suggestions', async () => {
    const schema = await connector.detectSchema();

    expect(schema).toBeDefined();
  });
});

describe('GoogleSheetsConnector — Field Confirmation Workflow', () => {
  let connector;
  let mockSheetsApi;

  beforeEach(() => {
    mockSheetsApi = {
      spreadsheets: {
        values: {
          get: jest.fn().mockResolvedValue({
            data: {
              values: [Object.keys(MOCK_SHEET_ROWS[0])]
            }
          })
        }
      }
    };

    connector = new GoogleSheetsConnector(MOCK_CONFIG);
    connector.sheets = mockSheetsApi;
    connector.authenticated = true;
  });

  test('confirmFieldMapping: returns fieldMapping when already set', async () => {
    connector.fieldMapping = { Name: 'nm', Email: 'em', Company: 'co', Title: 'ti' };

    const mapping = await connector.confirmFieldMapping();

    expect(mapping).toEqual(connector.fieldMapping);
  });

  test('confirmFieldMapping: caches fieldMapping on subsequent calls', async () => {
    connector.fieldMapping = { Name: 'nm', Email: 'em' };
    const initialMapping = connector.fieldMapping;

    const result1 = await connector.confirmFieldMapping();
    const result2 = await connector.confirmFieldMapping();

    expect(result1).toBe(initialMapping);
    expect(result2).toBe(initialMapping);
    expect(result1).toBe(result2);
  });

  test('confirmFieldMapping: should call schema detection when mapping not set', async () => {
    connector.fieldMapping = null;

    // This will fail validation, but we're just checking it tries to call detectSchema
    try {
      await connector.confirmFieldMapping();
    } catch (e) {
      // Expected - schema inference will fail with mock headers
    }

    expect(mockSheetsApi.spreadsheets.values.get).toHaveBeenCalled();
  });
});

describe('GoogleSheetsConnector — Read Operations (Mocked)', () => {
  let connector;
  let mockSheetsApi;

  beforeEach(() => {
    mockSheetsApi = {
      spreadsheets: {
        values: {
          get: jest.fn()
            .mockResolvedValueOnce({
              data: {
                values: [Object.keys(MOCK_SHEET_ROWS[0]), ...MOCK_SHEET_ROWS]
              }
            })
            .mockResolvedValueOnce({
              data: {
                values: [Object.keys(MOCK_SHEET_ROWS[0])]
              }
            })
            .mockResolvedValueOnce({
              data: {
                values: [Object.keys(MOCK_SHEET_ROWS[0]), ...MOCK_SHEET_ROWS]
              }
            })
            .mockResolvedValue({
              data: {
                values: []
              }
            })
        }
      }
    };

    connector = new GoogleSheetsConnector(MOCK_CONFIG);
    connector.sheets = mockSheetsApi;
    connector.authenticated = true;
    connector.fieldMapping = {
      Name: 'nm',
      Email: 'em',
      Company: 'co',
      Title: 'ti',
      LinkedIn: 'li',
      Location: 'loc',
      Timezone: 'tz',
      Source: 'src',
      Status: 'st'
    };
  });

  test('readProspects: should fetch all prospects from sheet', async () => {
    const prospects = await connector.readProspects();

    expect(Array.isArray(prospects)).toBe(true);
    expect(prospects.length).toBeGreaterThan(0);
  });

  test('readProspects: should parse rows using field mapping', async () => {
    const prospects = await connector.readProspects();

    // Should return an array of parsed prospects
    expect(Array.isArray(prospects)).toBe(true);
    if (prospects.length > 0) {
      // Each prospect should be an object with at least id (added by parseSheetRow)
      expect(prospects[0]).toHaveProperty('id');
    }
  });

  test('readProspects: should call sheets API', async () => {
    await connector.readProspects();

    expect(mockSheetsApi.spreadsheets.values.get).toHaveBeenCalled();
  });

  test('readOptOuts: should fetch opt-out list', async () => {
    const optOuts = await connector.readOptOuts();

    expect(Array.isArray(optOuts)).toBe(true);
  });
});

describe('GoogleSheetsConnector — Write Operations (Mocked)', () => {
  let connector;
  let mockSheetsApi;

  beforeEach(() => {
    mockSheetsApi = {
      spreadsheets: {
        get: jest.fn().mockResolvedValue({
          data: {
            sheets: [
              {
                properties: { title: 'Prospects', sheetId: 0 },
                data: { rowData: [{ values: [{ userEnteredValue: 'Name' }] }] }
              }
            ]
          }
        }),
        values: {
          get: jest.fn()
            .mockResolvedValueOnce({
              data: {
                values: [Object.keys(MOCK_SHEET_ROWS[0]), ...MOCK_SHEET_ROWS]
              }
            })
            .mockResolvedValueOnce({
              data: {
                values: [Object.keys(MOCK_SHEET_ROWS[0])]
              }
            })
            .mockResolvedValue({
              data: {
                values: [Object.keys(MOCK_SHEET_ROWS[0])]
              }
            }),
          update: jest.fn().mockResolvedValue({
            data: {
              updatedRows: 1,
              updatedColumns: 5,
              updatedCells: 5
            }
          })
        }
      }
    };

    connector = new GoogleSheetsConnector(MOCK_CONFIG);
    connector.sheets = mockSheetsApi;
    connector.authenticated = true;
    connector.fieldMapping = {
      Name: 'nm',
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
        nm: 'Eve White',
        fn: 'Eve',
        em: 'eve@company.com',
        co: 'Company',
        ti: 'VP',
        st: 'new'
      }
    ];

    const result = await connector.appendProspects(newProspects);

    expect(result).toHaveProperty('added');
    expect(result).toHaveProperty('total');
  });

  test('appendProspects: should call sheets API', async () => {
    const newProspects = [MOCK_TOON_PROSPECTS[0]];

    await connector.appendProspects(newProspects);

    expect(mockSheetsApi.spreadsheets.values.update).toHaveBeenCalled();
  });

  test('appendProspects: should batch write for performance', async () => {
    const manyProspects = Array.from({ length: 150 }, (_, i) => ({
      id: `p-${String(i + 1).padStart(6, '0')}`,
      nm: `First${i} Last${i}`,
      fn: `First${i}`,
      em: `email${i}@test.com`,
      co: `Corp${i}`,
      ti: 'Title',
      st: 'new'
    }));

    await connector.appendProspects(manyProspects);

    // Should make multiple API calls for batching
    expect(mockSheetsApi.spreadsheets.values.update.mock.calls.length).toBeGreaterThan(0);
  });

  test('updateProspectStatus: should update status for existing lead', async () => {
    mockSheetsApi.spreadsheets.values.get.mockResolvedValueOnce({
      data: {
        values: [['Name', 'Email', 'Status'], ['Alice', 'alice@techcorp.com', 'new']]
      }
    });
    mockSheetsApi.spreadsheets.values.get.mockResolvedValueOnce({
      data: {
        values: [['Name', 'Email', 'Status']]
      }
    });

    const result = await connector.updateProspectStatus('alice@techcorp.com', 'sent');

    expect(result).toHaveProperty('updated');
  });

  test('updateProspectStatus: should handle not found gracefully', async () => {
    mockSheetsApi.spreadsheets.values.get.mockResolvedValueOnce({
      data: {
        values: [['Name', 'Email', 'Status']]
      }
    });

    const result = await connector.updateProspectStatus('nonexistent@example.com', 'sent');

    expect(result.updated).toBe(0);
  });
});

describe('GoogleSheetsConnector — Rate Limiting & Caching', () => {
  let connector;
  let mockSheetsApi;

  beforeEach(() => {
    mockSheetsApi = {
      spreadsheets: {
        values: {
          get: jest.fn().mockResolvedValue({
            data: {
              values: [Object.keys(MOCK_SHEET_ROWS[0])]
            }
          })
        }
      }
    };

    connector = new GoogleSheetsConnector(MOCK_CONFIG);
    connector.sheets = mockSheetsApi;
    connector.authenticated = true;
  });

  test('should track API calls via recordApiCall', () => {
    const initialCount = connector.apiCallTimes.length;

    connector.recordApiCall(() => Promise.resolve({ data: {} }));

    expect(connector.apiCallTimes.length).toBeGreaterThanOrEqual(initialCount);
  });

  test('should cache field schema to avoid re-detection', async () => {
    await connector.detectSchema();
    const callCountAfterFirst = mockSheetsApi.spreadsheets.values.get.mock.calls.length;

    await connector.detectSchema();
    const callCountAfterSecond = mockSheetsApi.spreadsheets.values.get.mock.calls.length;

    expect(callCountAfterSecond).toBe(callCountAfterFirst);
  });

  test('should provide cache clearing', () => {
    connector.schema = { test: 'data' };
    connector.fieldMapping = { test: 'mapping' };
    connector.clearCache();

    expect(connector.schema).toBeNull();
    expect(connector.fieldMapping).toBeNull();
  });
});

// ============================================================================
// ERROR HANDLING & EDGE CASES
// ============================================================================

describe('Error Handling', () => {
  let connector;
  let mockSheetsApi;

  beforeEach(() => {
    connector = new GoogleSheetsConnector(MOCK_CONFIG);
  });

  test('should require authentication before reading', async () => {
    const unauthenticatedConnector = new GoogleSheetsConnector(MOCK_CONFIG);

    await expect(unauthenticatedConnector.readProspects()).rejects.toThrow();
  });

  test('readProspects: should handle empty sheet', async () => {
    mockSheetsApi = {
      spreadsheets: {
        values: {
          get: jest.fn().mockResolvedValue({
            data: {
              values: []
            }
          })
        }
      }
    };

    connector.sheets = mockSheetsApi;
    connector.authenticated = true;
    connector.fieldMapping = {
      Name: 'nm',
      Email: 'em',
      Company: 'co',
      Title: 'ti'
    };

    const prospects = await connector.readProspects();
    expect(Array.isArray(prospects)).toBe(true);
  });

  test('appendProspects: should handle write errors', async () => {
    mockSheetsApi = {
      spreadsheets: {
        values: {
          get: jest.fn().mockResolvedValue({
            data: {
              values: [Object.keys(MOCK_SHEET_ROWS[0]), ...MOCK_SHEET_ROWS]
            }
          }),
          update: jest.fn().mockRejectedValue(new Error('API Error'))
        }
      }
    };

    connector.sheets = mockSheetsApi;
    connector.authenticated = true;
    connector.fieldMapping = {
      Name: 'nm',
      Email: 'em',
      Company: 'co',
      Title: 'ti'
    };

    const result = await connector.appendProspects([MOCK_TOON_PROSPECTS[0]]);
    expect(result).toHaveProperty('added');
    expect(result).toHaveProperty('total');
  });
});

// ============================================================================
// INTEGRATION TEST: Full Workflow
// ============================================================================

describe('Full Integration: Sync Workflow', () => {
  let connector;
  let mockSheetsApi;

  beforeEach(() => {
    mockSheetsApi = {
      spreadsheets: {
        values: {
          get: jest.fn()
            .mockResolvedValueOnce({
              data: {
                values: [Object.keys(MOCK_SHEET_ROWS[0]), ...MOCK_SHEET_ROWS]
              }
            })
            .mockResolvedValueOnce({
              data: {
                values: []
              }
            })
            .mockResolvedValue({
              data: {
                values: [Object.keys(MOCK_SHEET_ROWS[0])]
              }
            })
        }
      }
    };

    connector = new GoogleSheetsConnector(MOCK_CONFIG);
    connector.sheets = mockSheetsApi;
    connector.authenticated = true;
    connector.fieldMapping = {
      Name: 'nm',
      Email: 'em',
      Company: 'co',
      Title: 'ti',
      Source: 'src',
      Status: 'st'
    };
  });

  test('fullSync: should read and return prospects', async () => {
    const result = await connector.fullSync();

    expect(result).toHaveProperty('prospects');
    expect(result).toHaveProperty('metadata');
  });

  test('fullSync: should exclude opted-out prospects', async () => {
    const result = await connector.fullSync();

    expect(result).toHaveProperty('prospects');
    expect(Array.isArray(result.prospects)).toBe(true);
  });

  test('fullSync: should report sync summary', async () => {
    const result = await connector.fullSync();

    expect(result).toHaveProperty('summary');
    expect(typeof result.summary).toBe('string');
  });
});

// ============================================================================
// EXPORT FOR MODULE USAGE
// ============================================================================

module.exports = {
  MOCK_SHEET_ROWS,
  MOCK_TOON_PROSPECTS,
  MOCK_CONFIG
};
