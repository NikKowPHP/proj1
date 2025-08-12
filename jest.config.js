module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  transform: {
    // This updated transform handles TS, TSX, JS, and JSX files,
    // and correctly transpiles JSX for the test environment.
    "^.+\\.(t|j)sx?$": [
      "ts-jest",
      {
        tsconfig: {
          ...require("./tsconfig.json").compilerOptions,
          jsx: "react-jsx",
        },
      },
    ],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transformIgnorePatterns: ["/node_modules/(?!(@supabase|zustand)/)"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testMatch: ["**/?(*.)+(spec|test).[tj]s?(x)"],
  modulePathIgnorePatterns: ["<rootDir>/e2e/"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
};