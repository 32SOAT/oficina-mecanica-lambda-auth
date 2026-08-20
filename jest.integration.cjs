/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.integration.spec.ts'],
  setupFiles: ['<rootDir>/src/integration/setup.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: { types: ['node', 'jest'] } }],
  },
  testTimeout: 60000,
};
