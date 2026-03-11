# Chunk 6: Refactor Existing Components

> **For agentic workers:** Refactor each component to use new hooks + shared components. Pattern: test → update component → verify → commit.

**Goal:** Update 4 existing components to use extracted hooks and eliminate duplication.

**Components to refactor:**
- OrgChart.jsx (use useExpandedNodes, fix React keys)
- SkillsPanel.jsx (use useFetchData, use SearchInput)
- DocsBrowser.jsx (use useFetchData, useExpandedNodes, use SearchInput)
- AliasPanel.jsx (use useFetchData, use SearchInput)

---

## Task 14: Refactor OrgChart.jsx

### Step 1: Update tests to verify component still works

```bash
npm test -- __tests__/components/OrgChart.test.jsx --no-coverage
```

### Step 2: Update OrgChart.jsx to use useExpandedNodes and fix keys

**Key changes:**
- Replace array.map((item, idx) → idx) with item.id as key
- Use useExpandedNodes hook instead of useState
- Import INITIAL_EXPANDED_NODES from constants
- Remove duplicate expand/collapse logic

**Before:**
```javascript
const OrgChart = () => {
  const [expanded, setExpanded] = useState({ agents: true, personas: true })
  // ... duplicate toggle logic
  {members.map((m, idx) => <div key={idx}> ...)} // ❌ BAD KEY
}
```

**After:**
```javascript
import { useExpandedNodes } from '../hooks/useExpandedNodes'
import { INITIAL_EXPANDED_NODES } from '../utils/constants'

const OrgChart = () => {
  const { expandedNodes, toggleNode } = useExpandedNodes(INITIAL_EXPANDED_NODES)
  // ... use toggleNode instead of setExpanded
  {members.map(m => <div key={m.id}> ...)} // ✅ GOOD KEY
}
```

### Step 3: Run tests to verify they pass

```bash
npm test -- __tests__/components/OrgChart.test.jsx --no-coverage
```

### Step 4: Commit

```bash
git add src/components/OrgChart.jsx __tests__/components/OrgChart.test.jsx
git commit -m "refactor: update OrgChart to use useExpandedNodes hook and fix React keys"
```

---

## Task 15: Refactor SkillsPanel.jsx

### Step 1: Update tests

```bash
npm test -- __tests__/components/SkillsPanel.test.jsx --no-coverage
```

### Step 2: Update SkillsPanel.jsx

**Key changes:**
- Replace duplicate fetch logic with useFetchData hook
- Use SearchInput component instead of custom search input
- Use fuzzySearch from filterHelpers
- Replace array.map((item, idx) → idx) with item.id as key

**Before:**
```javascript
const SkillsPanel = () => {
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/skills')
      .then(r => r.json())
      .then(data => setSkills(data))
      .catch(err => setError(err))
      .finally(() => setLoading(false))
  }, [])

  const filtered = skills.filter(s => s.name.includes(search))

  return (
    <div>
      <input value={search} onChange={e => setSearch(e.target.value)} />
      {filtered.map((s, idx) => <div key={idx}> ...)} // ❌ BAD
    </div>
  )
}
```

**After:**
```javascript
import { useFetchData } from '../hooks/useFetchData'
import SearchInput from './Shared/SearchInput'
import { fuzzySearch } from '../utils/filterHelpers'

const SkillsPanel = () => {
  const { data: skills, loading } = useFetchData('/api/skills')
  const [search, setSearch] = useState('')

  const filtered = fuzzySearch(skills || [], search, ['name', 'description'])

  return (
    <div>
      <SearchInput value={search} onChange={setSearch} placeholder="Search skills..." />
      {filtered.map(s => <div key={s.id}> ...)} // ✅ GOOD
    </div>
  )
}
```

### Step 3: Run tests to verify they pass

```bash
npm test -- __tests__/components/SkillsPanel.test.jsx --no-coverage
```

### Step 4: Commit

```bash
git add src/components/SkillsPanel.jsx __tests__/components/SkillsPanel.test.jsx
git commit -m "refactor: update SkillsPanel to use useFetchData hook and SearchInput component"
```

---

## Task 16: Refactor DocsBrowser.jsx

### Step 1: Update tests

```bash
npm test -- __tests__/components/DocsBrowser.test.jsx --no-coverage
```

### Step 2: Update DocsBrowser.jsx

**Key changes:**
- Replace duplicate fetch logic with useFetchData hook
- Use useExpandedNodes hook for tree expansion
- Use SearchInput component
- Fix React keys (use node.id instead of array index)

**Pattern:**
- useFetchData for data fetching
- useExpandedNodes for tree state
- SearchInput for search
- fuzzySearch for filtering
- map(node => <item key={node.id})

### Step 3: Run tests

```bash
npm test -- __tests__/components/DocsBrowser.test.jsx --no-coverage
```

### Step 4: Commit

```bash
git add src/components/DocsBrowser.jsx __tests__/components/DocsBrowser.test.jsx
git commit -m "refactor: update DocsBrowser to use useFetchData, useExpandedNodes, and SearchInput"
```

---

## Task 17: Refactor AliasPanel.jsx

### Step 1: Update tests

```bash
npm test -- __tests__/components/AliasPanel.test.jsx --no-coverage
```

### Step 2: Update AliasPanel.jsx

**Key changes:**
- Replace duplicate fetch logic with useFetchData hook
- Use SearchInput component
- Fix React keys

### Step 3: Run tests

```bash
npm test -- __tests__/components/AliasPanel.test.jsx --no-coverage
```

### Step 4: Commit

```bash
git add src/components/AliasPanel.jsx __tests__/components/AliasPanel.test.jsx
git commit -m "refactor: update AliasPanel to use useFetchData hook and SearchInput component"
```

---

**Status:** 4 components refactored to use new hooks and shared components.
**Verification:** Run full test suite

```bash
npm test -- --coverage
```

Expected: 80%+ coverage threshold met, zero React key warnings.

**Next:** Execute Chunk 7 (Server Optimization)
