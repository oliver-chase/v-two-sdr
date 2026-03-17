/**
 * Hunter.io Email Verifier Tests
 *
 * Tests for email verification, credit tracking, and error handling
 */

const hunterVerifier = require('../scripts/hunter-verifier');

describe('hunter-verifier', () => {
  beforeEach(() => {
    hunterVerifier.resetStats();
  });

  describe('verifyEmail', () => {
    it('should return error for empty email', async () => {
      const result = await hunterVerifier.verifyEmail('');
      expect(result.success).toBe(false);
      expect(result.error).toBe('NO_EMAIL');
    });

    it('should return error for null email', async () => {
      const result = await hunterVerifier.verifyEmail(null);
      expect(result.success).toBe(false);
      expect(result.error).toBe('NO_EMAIL');
    });

    it('should return error when API key missing', async () => {
      // Ensure no env var
      const originalKey = process.env.HUNTER_IO_API_KEY;
      delete process.env.HUNTER_IO_API_KEY;

      const result = await hunterVerifier.verifyEmail('test@example.com', '');
      expect(result.success).toBe(false);
      expect(result.error).toBe('API_KEY_MISSING');

      // Restore
      if (originalKey) {
        process.env.HUNTER_IO_API_KEY = originalKey;
      }
    });

    it('should track verification count', async () => {
      const stats1 = hunterVerifier.getVerificationStats();
      const count1 = stats1.verificationsThisSession;

      // Try to verify with invalid key (will fail but count still increments)
      await hunterVerifier.verifyEmail('test@example.com', 'invalid-key');

      const stats2 = hunterVerifier.getVerificationStats();
      const count2 = stats2.verificationsThisSession;

      expect(count2).toBeGreaterThan(count1);
    });
  });

  describe('parseHunterResponse', () => {
    it('should parse valid JSON response', () => {
      const jsonStr = '{"data":{"email":"test@example.com","status":"valid"}}';
      const result = hunterVerifier.parseHunterResponse(jsonStr);

      expect(result).toHaveProperty('data');
      expect(result.data.email).toBe('test@example.com');
    });

    it('should return null for invalid JSON', () => {
      const result = hunterVerifier.parseHunterResponse('not valid json');
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = hunterVerifier.parseHunterResponse('');
      expect(result).toBeNull();
    });

    it('should handle malformed JSON gracefully', () => {
      const result = hunterVerifier.parseHunterResponse('{incomplete');
      expect(result).toBeNull();
    });
  });

  describe('statistics tracking', () => {
    it('should return verification stats', () => {
      const stats = hunterVerifier.getVerificationStats();

      expect(stats).toHaveProperty('verificationsThisSession');
      expect(stats).toHaveProperty('creditWarningIssued');
      expect(typeof stats.verificationsThisSession).toBe('number');
      expect(typeof stats.creditWarningIssued).toBe('boolean');
    });

    it('should reset stats', async () => {
      // Reset first
      hunterVerifier.resetStats();

      // Trigger a verification to increment counter
      await hunterVerifier.verifyEmail('test@example.com', 'fake-key');

      const beforeReset = hunterVerifier.getVerificationStats();
      expect(beforeReset.verificationsThisSession).toBeGreaterThan(0);

      hunterVerifier.resetStats();

      const afterReset = hunterVerifier.getVerificationStats();
      expect(afterReset.verificationsThisSession).toBe(0);
      expect(afterReset.creditWarningIssued).toBe(false);
    });
  });

  describe('response validation', () => {
    it('should return structured response for missing API key', async () => {
      const result = await hunterVerifier.verifyEmail('test@example.com');

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('error');
    });

    it('should include email in all responses', async () => {
      const result = await hunterVerifier.verifyEmail('john@example.com');

      expect(result.email).toBe('john@example.com');
    });
  });

  describe('email validation', () => {
    it('should reject email without @ symbol', async () => {
      hunterVerifier.resetStats();
      const result = await hunterVerifier.verifyEmail('invalid-email', 'test-key');
      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_EMAIL');
    });

    it('should accept valid email format', async () => {
      hunterVerifier.resetStats();
      // Will fail due to missing valid API key, but should pass email validation
      const result = await hunterVerifier.verifyEmail('test@example.com', 'test-key');
      // Should not have INVALID_EMAIL error
      expect(result.error).not.toBe('INVALID_EMAIL');
    });

    it('should extract domain from email', async () => {
      hunterVerifier.resetStats();
      // Verify that domain extraction works in API call
      const result = await hunterVerifier.verifyEmail('user@company.co.uk', 'test-key');
      // Should not error during domain extraction
      expect(result).toHaveProperty('email');
      expect(result.email).toBe('user@company.co.uk');
    });
  });

  describe('Hunter API endpoint', () => {
    it('should have correct API URL', () => {
      expect(hunterVerifier.HUNTER_API_URL).toBe('https://api.hunter.io/v2/email-verifier');
    });

    it('should not use Finder endpoint', () => {
      // Verify we're NOT using the Finder API
      expect(hunterVerifier.HUNTER_API_URL).not.toContain('email-finder');
      expect(hunterVerifier.HUNTER_API_URL).toContain('email-verifier');
    });
  });

  describe('response structure', () => {
    it('should have required fields in error response', async () => {
      hunterVerifier.resetStats();
      const result = await hunterVerifier.verifyEmail('', 'test-key');

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('status');
    });
  });
});
