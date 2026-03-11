import { debounce, fuzzySearch, filterByCategory } from '../../src/utils/filterHelpers'

describe('filterHelpers', () => {
  describe('debounce', () => {
    jest.useFakeTimers()

    it('should delay function execution', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 300)

      debouncedFn()
      expect(mockFn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(299)
      expect(mockFn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(1)
      expect(mockFn).toHaveBeenCalled()
    })

    it('should reset timer on subsequent calls', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 300)

      debouncedFn()
      jest.advanceTimersByTime(100)
      debouncedFn()
      jest.advanceTimersByTime(100)
      debouncedFn()

      jest.advanceTimersByTime(299)
      expect(mockFn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(1)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should call with correct arguments', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 300)

      debouncedFn('test', 42, { key: 'value' })
      jest.advanceTimersByTime(300)

      expect(mockFn).toHaveBeenCalledWith('test', 42, { key: 'value' })
    })
  })

  describe('fuzzySearch', () => {
    const items = [
      { id: 1, name: 'React Hook', description: 'A testing library' },
      { id: 2, name: 'Vue Component', description: 'A framework library' },
      { id: 3, name: 'Angular Service', description: 'A testing tool' }
    ]

    it('should find exact matches', () => {
      const results = fuzzySearch(items, 'React', ['name'])
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe(1)
    })

    it('should find partial matches', () => {
      const results = fuzzySearch(items, 'test', ['description'])
      expect(results).toHaveLength(2)
      expect(results.map(r => r.id)).toEqual([1, 3])
    })

    it('should search multiple fields', () => {
      const results = fuzzySearch(items, 'library', ['name', 'description'])
      expect(results).toHaveLength(2)
      expect(results.map(r => r.id)).toEqual([1, 2])
    })

    it('should be case-insensitive', () => {
      const results = fuzzySearch(items, 'REACT', ['name'])
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe(1)
    })
  })

  describe('filterByCategory', () => {
    const items = [
      { id: 1, category: 'testing', name: 'Jest' },
      { id: 2, category: 'frontend', name: 'React' },
      { id: 3, category: 'testing', name: 'Vitest' }
    ]

    it('should filter items by category', () => {
      const results = filterByCategory(items, 'testing')
      expect(results).toHaveLength(2)
      expect(results.map(r => r.id)).toEqual([1, 3])
    })

    it('should return empty for non-matching category', () => {
      const results = filterByCategory(items, 'backend')
      expect(results).toHaveLength(0)
    })
  })
})
