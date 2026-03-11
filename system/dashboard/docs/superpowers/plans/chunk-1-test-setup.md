# Chunk 1: Test Infrastructure Setup

> **For agentic workers:** TDD pattern: Write failing tests → verify failure → implement → verify pass → commit.

**Goal:** Set up Jest + React Testing Library infrastructure with mock fixtures and test helpers.

**Files to create/modify:**
- Create: `system/dashboard/jest.config.js`
- Create: `system/dashboard/__tests__/setup.js`
- Create: `.babelrc`
- Create: `system/dashboard/__tests__/helpers.js`
- Create: `system/dashboard/__tests__/fixtures.js`
- Modify: `system/dashboard/package.json` (add test dependencies)

---

## Task 1: Configure Jest and Test Environment

### Step 1: Add test dependencies to package.json

```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "jest": "^29.0.0",
    "jest-environment-jsdom": "^29.0.0",
    "identity-obj-proxy": "^3.0.0",
    "@babel/preset-react": "^7.18.0",
    "@babel/preset-env": "^7.20.0"
  },
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### Step 2: Create jest.config.js

```javascript
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  collectCoverageFrom: ['src/**/*.{js,jsx}', '!src/main.jsx', '!src/**/*.css'],
  coverageThreshold: { global: { branches: 80, functions: 80, lines: 80, statements: 80 } },
  testMatch: ['**/__tests__/**/*.test.{js,jsx}'],
  moduleNameMapper: { '\\.(css|less|scss|sass)$': 'identity-obj-proxy' },
  transform: { '^.+\\.(js|jsx)$': 'babel-jest' }
}
```

### Step 3: Create __tests__/setup.js

```javascript
import '@testing-library/jest-dom'

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}
global.localStorage = localStorageMock
global.fetch = jest.fn()

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
})

beforeEach(() => {
  jest.clearAllMocks()
})
```

### Step 4: Create .babelrc

```json
{
  "presets": [
    ["@babel/preset-env", { "targets": { "node": "current" } }],
    ["@babel/preset-react", { "runtime": "automatic" }]
  ]
}
```

### Step 5: Run npm install

```bash
cd /Users/oliver/OliverRepo/system/dashboard
npm install
```

Expected: All test dependencies installed, no errors.

### Step 6: Verify jest works

```bash
npm test -- --listTests
```

Expected: Shows 0 tests (no test files yet).

### Step 7: Commit

```bash
git add jest.config.js __tests__/setup.js package.json .babelrc
git commit -m "test: set up Jest + React Testing Library infrastructure"
```

---

## Task 2: Create Test Helpers and Fixtures

### Step 1: Create __tests__/helpers.js

```javascript
import { render } from '@testing-library/react'

export function renderComponent(component, options = {}) {
  return render(component, { ...options })
}

export function mockFetch(response, status = 200) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: status < 400,
      status,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response))
    })
  )
}

export function waitForElement(callback, timeout = 1000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    const check = () => {
      try {
        const result = callback()
        resolve(result)
      } catch (error) {
        if (Date.now() - startTime > timeout) {
          reject(error)
        } else {
          setTimeout(check, 50)
        }
      }
    }
    check()
  })
}
```

### Step 2: Create __tests__/fixtures.js

```javascript
export const mockTeam = {
  lead: { id: 'kiana', name: 'Kiana', type: 'human', emoji: '👑' },
  agents: [
    { id: 'claude-code', name: 'Claude Code', type: 'agent', emoji: '💻' },
    { id: 'openclaw', name: 'OpenClaw', type: 'agent', emoji: '🦅' }
  ],
  personas: [
    { id: 'dev', name: 'Developer', type: 'persona', emoji: '🎭', path: 'team/members/dev/persona_soul.md' }
  ]
}

export const mockSkills = [
  { name: 'git', description: 'Version control operations', path: 'skills/git/SKILL.md' },
  { name: 'debugging', description: 'Debug code issues', path: 'skills/debugging/SKILL.md' }
]

export const mockMemory = [
  { date: '2026-03-10', tokens: 42000, cost: 33.60 },
  { date: '2026-03-09', tokens: 38000, cost: 30.40 }
]

export const mockAuditLog = [
  {
    timestamp: '2026-03-10T10:15:00Z',
    agent: 'claude-code',
    action: 'config-change',
    details: { field: 'model', from: 'sonnet', to: 'haiku' },
    success: true
  }
]
```

### Step 3: Commit

```bash
git add __tests__/helpers.js __tests__/fixtures.js
git commit -m "test: add test helpers and mock data fixtures"
```

---

**Next:** Execute Chunk 2 (Custom Hooks)
