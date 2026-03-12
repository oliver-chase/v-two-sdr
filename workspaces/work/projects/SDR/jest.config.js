/**
 * Jest Configuration for SDR Project
 * TDD-focused with coverage tracking
 */

module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'sheets-connector.js',
    'scripts/**/*.js',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testMatch: [
    '**/__tests__/**/*.js',
    '**/tests/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  verbose: true,
  bail: false,
  testTimeout: 10000,
  forceExit: true
};
