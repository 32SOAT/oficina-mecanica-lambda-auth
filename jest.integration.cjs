/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test/integration'],
  testMatch: ['**/*.integration.spec.ts'],
  setupFiles: ['<rootDir>/test/integration/setup.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: { types: ['node', 'jest'] } }],
  },
  testTimeout: 60000,
};
