/**
 * Smoke test to verify Jest and test infrastructure are working
 */

describe('Test Infrastructure', () => {
  it('should have jest available', () => {
    expect(jest).toBeDefined();
  });

  it('should have localStorage mock', () => {
    expect(localStorage).toBeDefined();
    expect(typeof localStorage.getItem).toBe('function');
    expect(typeof localStorage.setItem).toBe('function');
  });

  it('should have fetch mock', () => {
    expect(global.fetch).toBeDefined();
    expect(typeof global.fetch).toBe('function');
  });

  it('should have window.matchMedia mock', () => {
    expect(window.matchMedia).toBeDefined();
    expect(typeof window.matchMedia).toBe('function');
  });

  it('should have mock fixtures available', () => {
    const { mockTeam, mockSkills, mockMemory, mockAuditLog } = require('./fixtures');
    expect(mockTeam).toBeDefined();
    expect(mockTeam.lead.name).toBe('Kiana');
    expect(mockSkills.length).toBeGreaterThan(0);
    expect(mockMemory.length).toBeGreaterThan(0);
    expect(mockAuditLog.length).toBeGreaterThan(0);
  });

  it('should clear mocks between tests', () => {
    expect(global.fetch).toHaveBeenCalledTimes(0);
  });
});
