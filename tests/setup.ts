// Jest setup file
import "jest";

// Increase timeout for integration tests
jest.setTimeout(30000);

// Mock console.warn to reduce noise during tests
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = jest.fn();
});

afterAll(() => {
  console.warn = originalWarn;
});
