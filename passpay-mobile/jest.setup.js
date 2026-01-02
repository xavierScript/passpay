// Jest setup file

// Mock Expo winter runtime globals
global.__ExpoImportMetaRegistry = {
  getEnv: () => ({}),
  getUrl: () => null,
};

global.structuredClone =
  global.structuredClone || ((obj) => JSON.parse(JSON.stringify(obj)));

// Mock expo modules that might not work in Jest environment
jest.mock("expo-constants", () => ({
  expoConfig: {
    extra: {},
  },
}));

jest.mock("expo-linking", () => ({
  openURL: jest.fn(),
}));
