
export default {
  projects: [
    {
      displayName: 'frontend',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      setupFiles: ['<rootDir>/jest.setup.js'],
      testPathIgnorePatterns: ['<rootDir>/backend/'],
    },
    {
      displayName: 'backend',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/backend/tests/**/*.test.(ts|js)'],
    },
  ],
};
