module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    es6: true,
    node: true,
    mocha: true,
  },
  extends: ["eslint:recommended", "google"],
  rules: {
    quotes: ["error", "double"],
    indent: ["error", 2],
    "object-curly-spacing": ["error", "always"],
    "quote-props": ["error", "as-needed"],
  },
  overrides: [
    {
      files: ["*.js"],
      rules: {
        "require-jsdoc": "off",
        "operator-linebreak": "off",
      },
    },
  ],
};
