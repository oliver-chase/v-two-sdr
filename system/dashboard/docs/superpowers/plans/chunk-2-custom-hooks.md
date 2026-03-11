# Chunk 2: Custom Hooks Extraction

> **For agentic workers:** Each task follows TDD: write failing tests → verify failure → implement → verify pass → commit.

**Goal:** Extract 3 custom hooks (useFetchData, useExpandedNodes, useLocalStorage) to eliminate code duplication.

**Files to create:**
- Create: `system/dashboard/src/hooks/useFetchData.js`
- Create: `system/dashboard/src/hooks/useExpandedNodes.js`
- Create: `system/dashboard/src/hooks/useLocalStorage.js`
- Create: `system/dashboard/src/utils/responseNormalizer.js`
- Create: `system/dashboard/__tests__/hooks/useFetchData.test.js`
- Create: `system/dashboard/__tests__/hooks/useExpandedNodes.test.js`
- Create: `system/dashboard/__tests__/hooks/useLocalStorage.test.js`

---

## Task 3: Create useFetchData Hook

### Step 1: Write failing tests

```javascript
// __tests__/hooks/useFetchData.test.js
import { renderHook, waitFor } from '@testing-library/react'
import { useFetchData } from '../../src/hooks/useFetchData'
import { mockFetch } from '../helpers'

describe('useFetchData Hook', () => {
  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useFetchData('/api/skills'))
    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()
  })

  it('should fetch data successfully', async () => {
    const mockData = [{ name: 'git', description: 'Version control' }]
    mockFetch(mockData)
    const { result } = renderHook(() => useFetchData('/api/skills'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual(mockData)
  })

  it('should handle fetch errors', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error')))
    const { result } = renderHook(() => useFetchData('/api/skills'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeTruthy()
  })

  it('should refetch when endpoint changes', async () => {
    const { result, rerender } = renderHook(
      ({ endpoint }) => useFetchData(endpoint),
      { initialProps: { endpoint: '/api/team' } }
    )
    expect(global.fetch).toHaveBeenCalledWith('/api/team')
    global.fetch.mockClear()
    rerender({ endpoint: '/api/skills' })
    expect(global.fetch).toHaveBeenCalledWith('/api/skills')
  })

  it('should convert TOON format to full format', async () => {
    const toonData = [{ nm: 'git', ds: 'Version control' }]
    mockFetch(toonData)
    const { result } = renderHook(() => useFetchData('/api/skills'))
    await waitFor(() => {
      expect(result.current.data).toEqual([{ name: 'git', description: 'Version control' }])
    })
  })

  it('should have refetch function', async () => {
    mockFetch([])
    const { result } = renderHook(() => useFetchData('/api/skills'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    result.current.refetch()
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })
})
```

### Step 2: Run tests to verify they fail

```bash
npm test -- __tests__/hooks/useFetchData.test.js --no-coverage
```

Expected: FAIL — hook not found.

### Step 3: Create responseNormalizer utility

```javascript
// src/utils/responseNormalizer.js
const TOON_MAP = {
  'nm': 'name', 'ds': 'description', 'c': 'content', 'p': 'path',
  't': 'type', 'e': 'emoji', 'd': 'isDir', 'ch': 'children',
  'en': 'enabled', 'v': 'version'
}

export function normalizeResponse(data) {
  if (Array.isArray(data)) return data.map(item => normalizeObject(item))
  return normalizeObject(data)
}

function normalizeObject(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  const normalized = {}
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = TOON_MAP[key] || key
    if (Array.isArray(value)) {
      normalized[fullKey] = value.map(v => normalizeObject(v))
    } else if (typeof value === 'object' && value !== null) {
      normalized[fullKey] = normalizeObject(value)
    } else {
      normalized[fullKey] = value
    }
  }
  return normalized
}
```

### Step 4: Implement useFetchData hook

```javascript
// src/hooks/useFetchData.js
import { useState, useEffect } from 'react'
import { normalizeResponse } from '../utils/responseNormalizer'

export function useFetchData(endpoint) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(endpoint)
      if (!response.ok) throw new Error(`Failed to fetch ${endpoint}: ${response.status}`)
      const jsonData = await response.json()
      const normalized = normalizeResponse(jsonData)
      setData(normalized)
    } catch (err) {
      setError(err.message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [endpoint])

  return { data, loading, error, refetch: fetchData }
}
```

### Step 5: Run tests to verify they pass

```bash
npm test -- __tests__/hooks/useFetchData.test.js --no-coverage
```

Expected: PASS (all 6 tests).

### Step 6: Commit

```bash
git add src/hooks/useFetchData.js src/utils/responseNormalizer.js __tests__/hooks/useFetchData.test.js
git commit -m "feat: extract useFetchData hook with TOON response normalization"
```

---

## Task 4: Create useExpandedNodes Hook

### Step 1: Write failing tests

```javascript
import { renderHook, act } from '@testing-library/react'
import { useExpandedNodes } from '../../src/hooks/useExpandedNodes'

describe('useExpandedNodes Hook', () => {
  it('should initialize with provided nodes expanded', () => {
    const { result } = renderHook(() => useExpandedNodes(['agents', 'personas']))
    expect(result.current.expandedNodes.has('agents')).toBe(true)
  })

  it('should toggle node expansion', () => {
    const { result } = renderHook(() => useExpandedNodes([]))
    act(() => result.current.toggleNode('agents'))
    expect(result.current.expandedNodes.has('agents')).toBe(true)
    act(() => result.current.toggleNode('agents'))
    expect(result.current.expandedNodes.has('agents')).toBe(false)
  })

  it('should expand all nodes', () => {
    const { result } = renderHook(() => useExpandedNodes([]))
    act(() => result.current.expandAll(['agents', 'personas', 'dev']))
    expect(result.current.expandedNodes.size).toBe(3)
  })

  it('should collapse all nodes', () => {
    const { result } = renderHook(() => useExpandedNodes(['agents', 'personas']))
    act(() => result.current.collapseAll())
    expect(result.current.expandedNodes.size).toBe(0)
  })

  it('should check if node is expanded', () => {
    const { result } = renderHook(() => useExpandedNodes(['agents']))
    expect(result.current.isExpanded('agents')).toBe(true)
    expect(result.current.isExpanded('personas')).toBe(false)
  })
})
```

### Step 2: Run tests to verify they fail

```bash
npm test -- __tests__/hooks/useExpandedNodes.test.js --no-coverage
```

### Step 3: Implement hook

```javascript
// src/hooks/useExpandedNodes.js
import { useState, useCallback } from 'react'

export function useExpandedNodes(initialIds = []) {
  const [expandedNodes, setExpandedNodes] = useState(new Set(initialIds))

  const toggleNode = useCallback((id) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      newSet.has(id) ? newSet.delete(id) : newSet.add(id)
      return newSet
    })
  }, [])

  const expandAll = useCallback((ids) => setExpandedNodes(new Set(ids)), [])
  const collapseAll = useCallback(() => setExpandedNodes(new Set()), [])
  const isExpanded = useCallback((id) => expandedNodes.has(id), [expandedNodes])

  return { expandedNodes, toggleNode, expandAll, collapseAll, isExpanded }
}
```

### Step 4: Run tests to verify they pass

```bash
npm test -- __tests__/hooks/useExpandedNodes.test.js --no-coverage
```

### Step 5: Commit

```bash
git add src/hooks/useExpandedNodes.js __tests__/hooks/useExpandedNodes.test.js
git commit -m "feat: extract useExpandedNodes hook for tree expansion state"
```

---

## Task 5: Create useLocalStorage Hook

### Step 1: Write failing tests

```javascript
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from '../../src/hooks/useLocalStorage'

describe('useLocalStorage Hook', () => {
  beforeEach(() => localStorage.clear())

  it('should return default value if not in storage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'))
    expect(result.current[0]).toBe('default')
  })

  it('should return value from storage if exists', () => {
    localStorage.setItem('test-key', JSON.stringify('stored'))
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'))
    expect(result.current[0]).toBe('stored')
  })

  it('should set value and persist to storage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
    act(() => result.current[1]('updated'))
    expect(result.current[0]).toBe('updated')
    expect(localStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify('updated'))
  })

  it('should handle objects', () => {
    const { result } = renderHook(() => useLocalStorage('obj-key', { name: 'test', value: 42 }))
    act(() => result.current[1]({ name: 'updated', value: 99 }))
    expect(result.current[0]).toEqual({ name: 'updated', value: 99 })
  })
})
```

### Step 2: Run tests to verify they fail

```bash
npm test -- __tests__/hooks/useLocalStorage.test.js --no-coverage
```

### Step 3: Implement hook

```javascript
// src/hooks/useLocalStorage.js
import { useState } from 'react'

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue]
}
```

### Step 4: Run tests to verify they pass

```bash
npm test -- __tests__/hooks/useLocalStorage.test.js --no-coverage
```

### Step 5: Commit

```bash
git add src/hooks/useLocalStorage.js __tests__/hooks/useLocalStorage.test.js
git commit -m "feat: extract useLocalStorage hook for persistent settings"
```

---

**Status:** 3 hooks extracted, all tests passing.
**Next:** Execute Chunk 3 (Shared Components)
