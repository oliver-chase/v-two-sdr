import { calculateTokenCost, formatTokenCount, calculateTrend } from '../../src/utils/tokenCalculator'

describe('tokenCalculator', () => {
  describe('calculateTokenCost', () => {
    it('should calculate cost for Haiku tokens', () => {
      const cost = calculateTokenCost(1000000, 'claude-haiku-4-5-20251001')
      expect(cost).toBe(0.80)
    })

    it('should calculate cost for Sonnet tokens', () => {
      const cost = calculateTokenCost(1000000, 'SONNET')
      expect(cost).toBe(3.00)
    })

    it('should calculate cost for Opus tokens', () => {
      const cost = calculateTokenCost(1000000, 'opus')
      expect(cost).toBe(15.00)
    })

    it('should default to Haiku for unknown models', () => {
      const cost = calculateTokenCost(1000000, 'unknown-model')
      expect(cost).toBe(0.80)
    })

    it('should handle partial token counts', () => {
      const cost = calculateTokenCost(500000, 'HAIKU')
      expect(cost).toBe(0.40)
    })
  })

  describe('formatTokenCount', () => {
    it('should format token count with commas', () => {
      expect(formatTokenCount(1000)).toBe('1,000')
      expect(formatTokenCount(1000000)).toBe('1,000,000')
      expect(formatTokenCount(999)).toBe('999')
    })
  })

  describe('calculateTrend', () => {
    it('should calculate trend (up/down/stable)', () => {
      expect(calculateTrend(100, 50)).toBe('up')
      expect(calculateTrend(50, 100)).toBe('down')
      expect(calculateTrend(100, 100)).toBe('stable')
    })
  })
})
