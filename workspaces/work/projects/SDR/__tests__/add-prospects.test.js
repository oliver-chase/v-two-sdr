/**
 * Tests for add-prospects.js
 */

const fs = require('fs');
const path = require('path');
const { readProspectsFile, validateProspect } = require('../scripts/add-prospects');

const TEST_DIR = path.join(__dirname, '..', 'outreach', 'test-prospects');

describe('add-prospects.js', () => {
  beforeEach(() => {
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
  });

  describe('readProspectsFile', () => {
    test('reads valid JSON prospect file', () => {
      const prospects = [
        {
          nm: 'John Smith',
          co: 'Example Corp',
          ti: 'VP Sales',
          em: 'john.smith@example.com'
        }
      ];

      const filePath = path.join(TEST_DIR, 'prospects.json');
      fs.writeFileSync(filePath, JSON.stringify(prospects, null, 2));

      const result = readProspectsFile(filePath);
      expect(result).toEqual(prospects);
    });

    test('throws error for missing file', () => {
      const filePath = path.join(TEST_DIR, 'nonexistent.json');
      expect(() => readProspectsFile(filePath)).toThrow('File not found');
    });

    test('throws error for invalid JSON', () => {
      const filePath = path.join(TEST_DIR, 'invalid.json');
      fs.writeFileSync(filePath, 'not valid json {]');

      expect(() => readProspectsFile(filePath)).toThrow('Failed to read prospects file');
    });

    test('throws error if not an array', () => {
      const filePath = path.join(TEST_DIR, 'not-array.json');
      fs.writeFileSync(filePath, JSON.stringify({ data: 'value' }));

      expect(() => readProspectsFile(filePath)).toThrow('must be an array');
    });

    test('reads empty array', () => {
      const filePath = path.join(TEST_DIR, 'empty.json');
      fs.writeFileSync(filePath, JSON.stringify([]));

      const result = readProspectsFile(filePath);
      expect(result).toEqual([]);
    });

    test('reads multiple prospects', () => {
      const prospects = [
        { nm: 'John Smith', co: 'Corp A', ti: 'VP Sales' },
        { nm: 'Jane Doe', co: 'Corp B', ti: 'CTO' },
        { nm: 'Bob Johnson', co: 'Corp C', ti: 'CEO' }
      ];

      const filePath = path.join(TEST_DIR, 'multi.json');
      fs.writeFileSync(filePath, JSON.stringify(prospects));

      const result = readProspectsFile(filePath);
      expect(result.length).toBe(3);
    });
  });

  describe('validateProspect', () => {
    test('validates complete prospect', () => {
      const prospect = {
        nm: 'John Smith',
        co: 'Example Corp',
        ti: 'VP Sales',
        em: 'john@example.com'
      };

      const errors = validateProspect(prospect, 0);
      expect(errors).toHaveLength(0);
    });

    test('validates prospect without email', () => {
      const prospect = {
        nm: 'John Smith',
        co: 'Example Corp',
        ti: 'VP Sales'
      };

      const errors = validateProspect(prospect, 0);
      expect(errors).toHaveLength(0);
    });

    test('detects missing name', () => {
      const prospect = {
        co: 'Example Corp',
        ti: 'VP Sales'
      };

      const errors = validateProspect(prospect, 0);
      expect(errors.some(e => e.includes('name'))).toBe(true);
    });

    test('detects missing company', () => {
      const prospect = {
        nm: 'John Smith',
        ti: 'VP Sales'
      };

      const errors = validateProspect(prospect, 0);
      expect(errors.some(e => e.includes('company'))).toBe(true);
    });

    test('detects missing title', () => {
      const prospect = {
        nm: 'John Smith',
        co: 'Example Corp'
      };

      const errors = validateProspect(prospect, 0);
      expect(errors.some(e => e.includes('title'))).toBe(true);
    });

    test('detects invalid email format', () => {
      const prospect = {
        nm: 'John Smith',
        co: 'Example Corp',
        ti: 'VP Sales',
        em: 'not-an-email'
      };

      const errors = validateProspect(prospect, 0);
      expect(errors.some(e => e.includes('Invalid email'))).toBe(true);
    });

    test('accepts valid email formats', () => {
      const validEmails = [
        'john@example.com',
        'john.smith@example.com',
        'j.smith@example.co.uk',
        'john_smith@example-corp.com'
      ];

      validEmails.forEach(em => {
        const prospect = {
          nm: 'John Smith',
          co: 'Example Corp',
          ti: 'VP Sales',
          em
        };
        const errors = validateProspect(prospect, 0);
        expect(errors.filter(e => e.includes('Invalid email'))).toHaveLength(0);
      });
    });

    test('includes index in error messages', () => {
      const prospect = {
        co: 'Example Corp',
        ti: 'VP Sales'
      };

      const errors = validateProspect(prospect, 5);
      expect(errors.every(e => e.includes('Prospect 5'))).toBe(true);
    });

    test('detects non-string fields', () => {
      const prospect = {
        nm: 123,
        co: { name: 'Corp' },
        ti: ['VP', 'Sales']
      };

      const errors = validateProspect(prospect, 0);
      expect(errors.length).toBeGreaterThan(0);
    });

    test('validates prospect with optional fields', () => {
      const prospect = {
        nm: 'John Smith',
        co: 'Example Corp',
        ti: 'VP Sales',
        loc: 'San Francisco, CA',
        no: 'Found via research'
      };

      const errors = validateProspect(prospect, 0);
      expect(errors).toHaveLength(0);
    });
  });

  describe('batch validation', () => {
    test('validates multiple prospects with errors', () => {
      const prospects = [
        { nm: 'John Smith', co: 'Corp A', ti: 'VP Sales' }, // valid
        { co: 'Corp B', ti: 'CTO' }, // missing name
        { nm: 'Bob Johnson', co: 'Corp C' } // missing title
      ];

      const errors = [];
      prospects.forEach((p, i) => {
        errors.push(...validateProspect(p, i));
      });

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('Prospect 1'))).toBe(true);
      expect(errors.some(e => e.includes('Prospect 2'))).toBe(true);
    });
  });
});
