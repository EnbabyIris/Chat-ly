export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@repo/shared/constants$': '<rootDir>/../../packages/shared/src/constants/index.ts',
  },
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|js)',
    '<rootDir>/src/**/?(*.)(spec|test).(ts|js)',
    '<rootDir>/__tests__/**/*.(ts|js)',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { useESM: true }],
  },
  collectCoverageFrom: [
    'src/**/*.(ts|js)',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/**/*.config.(ts|js)',
    '!src/db/index.ts',  // Skip database file with ES module issues
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    'src/db/index.ts',  // Skip problematic files
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
}