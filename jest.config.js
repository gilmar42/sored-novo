
export default {
  projects: [
    {
      displayName: 'frontend',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      roots: ['<rootDir>/src'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
      testPathIgnorePatterns: ['<rootDir>/backend/', '<rootDir>/.next/', '<rootDir>/node_modules/'],
      modulePathIgnorePatterns: ['<rootDir>/.next/'],
      watchPathIgnorePatterns: ['<rootDir>/.next/'],
    },
    {
      displayName: 'backend',
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>/backend'],
      testMatch: ['<rootDir>/backend/tests/**/*.test.(ts|js)'],
      testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
      modulePathIgnorePatterns: ['<rootDir>/.next/'],
      watchPathIgnorePatterns: ['<rootDir>/.next/'],
      // Preferir TypeScript quando existir .ts e .js com o mesmo nome (evita cair em JS legado dentro de backend/src).
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    },
  ],
};
