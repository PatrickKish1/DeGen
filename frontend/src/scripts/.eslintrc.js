module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
  },
  extends: ["eslint:recommended"],
  rules: {},
  // This tells ESLint to ignore Next.js specific rules for this directory
  ignorePatterns: ["*.js"],
};
