module.exports = {
  env: {
    browser: false,
    es2021: true,
    mocha: true,
    node: true,
  },
  plugins: ["@typescript-eslint"],
  extends: ["standard", "plugin:prettier/recommended"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2021,
  },
  rules: {
    "node/no-unsupported-features/es-syntax": ["error", { ignores: ["modules"] }],
  },
}
