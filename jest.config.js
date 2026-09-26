// jest.config.js
export default {
  testEnvironment: 'node',  // Run tests in Node.js
  transform: {},            // No Babel/TS transform needed
  testTimeout: 10000,       // Optional: increase timeout for async DB tests
  verbose: true,            // Optional: show each test name in console
  moduleFileExtensions: ['js', 'mjs'], // Ensure Jest recognizes your ESM files
};
