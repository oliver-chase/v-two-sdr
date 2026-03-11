# Chunk 5: Utilities & Constants Extraction

> **For agentic workers:** TDD pattern where applicable. Some utilities tested via integration.

**Goal:** Extract utilities and constants to eliminate magic strings and consolidate shared logic.

**Files to create:**
- Create: `system/dashboard/src/utils/constants.js`
- Create: `system/dashboard/src/utils/filterHelpers.js`
- Create: `system/dashboard/src/utils/tokenCalculator.js`
- Create: `system/dashboard/__tests__/utils/filterHelpers.test.js`
- Create: `system/dashboard/__tests__/utils/tokenCalculator.test.js`

---

## Task 11: Create constants.js

### Step 1: Write constants file

```javascript
// src/utils/constants.js

// Team IDs (matches OrgChart rendering)
export const TEAM_IDS = {
  KIANA: 'kiana',
  CLAUDE_CODE: 'claude-code',
  OPENCLAW: 'openclaw'
}

// Persona IDs
export const PERSONA_IDS = {
  DEV: 'dev',
  FE_DESIGNER: 'fe-designer',
  SDR: 'sdr',
  CMO: 'cmo',
  MARKETING: 'marketing'
}

// Initial expanded nodes (for OrgChart, DocsBrowser)
export const INITIAL_EXPANDED_NODES = ['agents', 'personas']

// Skill categories
export const SKILL_CATEGORIES = [
  'api-security',
  'debugging',
  'frontend-design',
  'git',
  'performance-tuning',
  'refactoring',
  'testing',
  'documentation'
]

// Token cost per model (cents per 1M tokens)
export const TOKEN_COSTS = {
  HAIKU: 0.80,
  SONNET: 3.00,
  OPUS: 15.00
}

// Default model
export const DEFAULT_MODEL = 'claude-haiku-4-5-20251001'

// API base URL (resolved at runtime from window.location)
export const getApiBaseUrl = () => {
  const port = import.meta.env.DEV ? 3001 : window.location.port || 443
  return `${window.location.protocol}//${window.location.hostname}:${port}`
}
```

### Step 2: No test required for constants

Constants are tested via integration (components using them).

### Step 3: Commit

```bash
git add src/utils/constants.js
git commit -m "feat: extract magic strings to constants.js"
```

---

## Task 12: Create filterHelpers.js

### Step 1: Write failing tests

```javascript
// __tests__/utils/filterHelpers.test.js
import { debounce, fuzzySearch, filterByCategory } from '../../src/utils/filterHelpers'

describe('filterHelpers Utilities', () => {
  describe('debounce', () => {
    it('should delay function execution', async () => {
      const fn = jest.fn()
      const debounced = debounce(fn, 100)
      debounced('arg1')
      debounced('arg2')
      expect(fn).not.toHaveBeenCalled()
      await new Promise(r => setTimeout(r, 150))
      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith('arg2')
    })

    it('should reset timer on subsequent calls', async () => {
      const fn = jest.fn()
      const debounced = debounce(fn, 100)
      debounced('arg1')
      await new Promise(r => setTimeout(r, 50))
      debounced('arg2')
      await new Promise(r => setTimeout(r, 150))
      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith('arg2')
    })
  })

  describe('fuzzySearch', () => {
    const items = [
      { name: 'git', description: 'Version control' },
      { name: 'debugging', description: 'Debug code' },
      { name: 'performance-tuning', description: 'Optimize code' }
    ]

    it('should find exact matches', () => {
      const results = fuzzySearch(items, 'git', ['name', 'description'])
      expect(results.length).toBe(1)
      expect(results[0].name).toBe('git')
    })

    it('should find partial matches', () => {
      const results = fuzzySearch(items, 'debug', ['name', 'description'])
      expect(results.length).toBe(1)
      expect(results[0].name).toBe('debugging')
    })

    it('should search multiple fields', () => {
      const results = fuzzySearch(items, 'code', ['name', 'description'])
      expect(results.length).toBe(2) // debugging + performance-tuning
    })

    it('should be case-insensitive', () => {
      const results = fuzzySearch(items, 'GIT', ['name'])
      expect(results.length).toBe(1)
    })
  })

  describe('filterByCategory', () => {
    const items = [
      { name: 'git', category: 'development' },
      { name: 'debugging', category: 'development' },
      { name: 'content-writing', category: 'content' }
    ]

    it('should filter items by category', () => {
      const results = filterByCategory(items, 'development')
      expect(results.length).toBe(2)
    })

    it('should return empty array for non-matching category', () => {
      const results = filterByCategory(items, 'marketing')
      expect(results.length).toBe(0)
    })
  })
})
```

### Step 2: Run tests to verify they fail

```bash
npm test -- __tests__/utils/filterHelpers.test.js --no-coverage
```

### Step 3: Implement filterHelpers

```javascript
// src/utils/filterHelpers.js

export function debounce(fn, delayMs) {
  let timeoutId
  return function debounced(...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delayMs)
  }
}

export function fuzzySearch(items, query, fields) {
  const lowerQuery = query.toLowerCase()
  return items.filter(item =>
    fields.some(field => {
      const value = item[field]?.toString().toLowerCase() || ''
      return value.includes(lowerQuery)
    })
  )
}

export function filterByCategory(items, category) {
  return items.filter(item => item.category === category)
}
```

### Step 4: Run tests to verify they pass

```bash
npm test -- __tests__/utils/filterHelpers.test.js --no-coverage
```

### Step 5: Commit

```bash
git add src/utils/filterHelpers.js __tests__/utils/filterHelpers.test.js
git commit -m "feat: extract filter and search utilities"
```

---

## Task 13: Create tokenCalculator.js

### Step 1: Write failing tests

```javascript
// __tests__/utils/tokenCalculator.test.js
import { calculateTokenCost, formatTokenCount, calculateTrend } from '../../src/utils/tokenCalculator'
import { TOKEN_COSTS } from '../src/utils/constants'

describe('tokenCalculator Utilities', () => {
  it('should calculate cost for Haiku tokens', () => {
    const cost = calculateTokenCost(1000000, 'haiku')
    expect(cost).toBe(0.80)
  })

  it('should format token count with commas', () => {
    expect(formatTokenCount(1000000)).toBe('1,000,000')
  })

  it('should calculate trend (up/down/stable)', () => {
    expect(calculateTrend(100, 80)).toBe('up')
    expect(calculateTrend(80, 100)).toBe('down')
    expect(calculateTrend(100, 100)).toBe('stable')
  })
})
```

### Step 2: Run tests to verify they fail

```bash
npm test -- __tests__/utils/tokenCalculator.test.js --no-coverage
```

### Step 3: Implement tokenCalculator

```javascript
// src/utils/tokenCalculator.js
import { TOKEN_COSTS } from './constants'

export function calculateTokenCost(tokenCount, model) {
  const normalizedModel = model.toLowerCase().includes('haiku') ? 'HAIKU' : model.toUpperCase()
  const costPerMillion = TOKEN_COSTS[normalizedModel] || TOKEN_COSTS.HAIKU
  return (tokenCount / 1000000) * costPerMillion
}

export function formatTokenCount(count) {
  return count.toLocaleString()
}

export function calculateTrend(current, previous) {
  if (current > previous) return 'up'
  if (current < previous) return 'down'
  return 'stable'
}
```

### Step 4: Run tests to verify they pass

```bash
npm test -- __tests__/utils/tokenCalculator.test.js --no-coverage
```

### Step 5: Commit

```bash
git add src/utils/tokenCalculator.js __tests__/utils/tokenCalculator.test.js
git commit -m "feat: extract token cost calculation utilities"
```

---

**Status:** 3 utilities created (1 detailed + 2 summarized).
**Next:** Execute Chunk 6 (Component Refactoring)
