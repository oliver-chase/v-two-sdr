export default {
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.js', '**/__tests__/**/*.test.jsx'],
  testPathIgnorePatterns: ['/__tests__/server\\.test\\.js'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    'server.js',
    '!src/main.jsx',
    '!**/node_modules/**',
    '!**/dist/**'
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(chart\\.js|react-chartjs-2)/)'
  ]
}
