module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ["/node_modules/", "test/config.test.ts", "test/api/*", "/test/components/*"]
};