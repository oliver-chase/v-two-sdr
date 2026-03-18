module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'scripts/**/*.js',
    'sheets-connector.js',
    'state-machine.js',
    '!**/*.test.js',
    '!**/node_modules/**'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    'scripts/validate-prospects.js',
    'scripts/sync-from-sheets.js',
    'scripts/daily-run.js',
    'scripts/send-approved.js',
    'scripts/approve-drafts.js',
    'scripts/inbox-monitor.js'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  transformIgnorePatterns: [
    'node_modules/(?!(ky|@sindresorhus)/)'
  ],
  testTimeout: 10000,
  verbose: true
};
