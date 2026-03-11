# Chunk 3: Shared Components Extraction

> **For agentic workers:** Each task follows TDD: write failing tests → verify failure → implement → verify pass → commit.

**Goal:** Extract 3 reusable components (SearchInput, ErrorBanner, LoadingState) used across multiple panels.

**Files to create:**
- Create: `system/dashboard/src/components/Shared/SearchInput.jsx`
- Create: `system/dashboard/src/components/Shared/SearchInput.css`
- Create: `system/dashboard/src/components/Shared/ErrorBanner.jsx`
- Create: `system/dashboard/src/components/Shared/ErrorBanner.css`
- Create: `system/dashboard/src/components/Shared/LoadingState.jsx`
- Create: `system/dashboard/__tests__/components/SearchInput.test.jsx`
- Create: `system/dashboard/__tests__/components/ErrorBanner.test.jsx`
- Create: `system/dashboard/__tests__/components/LoadingState.test.jsx`

---

## Task 6: Create SearchInput Component

### Step 1: Write failing tests

```javascript
// __tests__/components/SearchInput.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchInput from '../../src/components/Shared/SearchInput'

describe('SearchInput Component', () => {
  it('should render input with placeholder', () => {
    render(<SearchInput placeholder="Search..." />)
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
  })

  it('should call onChange with debounce', async () => {
    const onChange = jest.fn()
    render(<SearchInput placeholder="Search" value="" onChange={onChange} debounceMs={100} />)
    const input = screen.getByPlaceholderText('Search')
    await userEvent.type(input, 'test')
    expect(onChange).not.toHaveBeenCalled()
    await waitFor(() => expect(onChange).toHaveBeenCalled(), { timeout: 200 })
  })

  it('should show clear button when has value', () => {
    const { rerender } = render(<SearchInput value="" onChange={jest.fn()} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    rerender(<SearchInput value="test" onChange={jest.fn()} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should clear value on button click', () => {
    const onChange = jest.fn()
    render(<SearchInput value="test" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('should be disabled when loading', () => {
    render(<SearchInput loading={true} onChange={jest.fn()} />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })
})
```

### Step 2: Run tests to verify they fail

```bash
npm test -- __tests__/components/SearchInput.test.jsx --no-coverage
```

### Step 3: Implement SearchInput component

```javascript
// src/components/Shared/SearchInput.jsx
import { useState, useEffect } from 'react'
import './SearchInput.css'

export default function SearchInput({
  value = '',
  onChange = () => {},
  placeholder = 'Search...',
  loading = false,
  debounceMs = 300
}) {
  const [displayValue, setDisplayValue] = useState(value)
  const [debounceTimer, setDebounceTimer] = useState(null)

  useEffect(() => {
    setDisplayValue(value)
  }, [value])

  const handleChange = (e) => {
    const newValue = e.target.value
    setDisplayValue(newValue)
    if (debounceTimer) clearTimeout(debounceTimer)
    const timer = setTimeout(() => onChange(newValue), debounceMs)
    setDebounceTimer(timer)
  }

  const handleClear = () => {
    setDisplayValue('')
    onChange('')
  }

  return (
    <div className="search-input-wrapper">
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={loading}
        className="search-input"
        aria-label="Search"
      />
      {displayValue && (
        <button onClick={handleClear} className="search-clear" aria-label="Clear search">
          ✕
        </button>
      )}
      {loading && <div className="search-spinner" />}
    </div>
  )
}
```

### Step 4: Add CSS

```css
/* src/components/Shared/SearchInput.css */
.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 2px solid var(--color-light-pink);
  border-radius: var(--border-radius-md);
  font-family: var(--font-sans);
  font-size: var(--font-size-base);
  color: var(--color-dark);
  transition: border-color var(--transition-base);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-medium-pink);
  box-shadow: 0 0 0 3px rgba(255, 105, 180, 0.1);
}

.search-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.search-clear {
  position: absolute;
  right: var(--spacing-md);
  background: none;
  border: none;
  color: var(--color-gray-dark);
  cursor: pointer;
  font-size: 16px;
  padding: var(--spacing-xs);
}

.search-clear:hover {
  color: var(--color-dark);
}

.search-spinner {
  position: absolute;
  right: var(--spacing-lg);
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-light-pink);
  border-top-color: var(--color-medium-pink);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### Step 5: Run tests to verify they pass

```bash
npm test -- __tests__/components/SearchInput.test.jsx --no-coverage
```

### Step 6: Commit

```bash
git add src/components/Shared/SearchInput.jsx src/components/Shared/SearchInput.css __tests__/components/SearchInput.test.jsx
git commit -m "feat: extract SearchInput shared component with debounce"
```

---

## Task 7: Create ErrorBanner Component

### Pattern: Write tests → implement → verify → commit (TDD)

**Files:**
- `src/components/Shared/ErrorBanner.jsx`
- `src/components/Shared/ErrorBanner.css`
- `__tests__/components/ErrorBanner.test.jsx`

**Expected behavior:**
- Display error message with icon
- Show optional retry button
- Dismissible with close button
- Accessible (role="alert")

**Commits:**
```bash
git commit -m "feat: extract ErrorBanner shared component"
```

---

## Task 8: Create LoadingState Component

### Pattern: Write tests → implement → verify → commit (TDD)

**Files:**
- `src/components/Shared/LoadingState.jsx`
- `src/components/Shared/LoadingState.css`
- `__tests__/components/LoadingState.test.jsx`

**Expected behavior:**
- Show spinner animation
- Respect `prefers-reduced-motion` media query
- Optional message text
- Accessible (role="status")

**Commits:**
```bash
git commit -m "feat: extract LoadingState shared component"
```

---

**Status:** 3 shared components extracted (1 detailed, 2 summarized).
**Next:** Execute Chunk 4 (Modal Components)
