/** @type {import("prettier").Config} */
const config = {
  plugins: [
    // // sorts consistently class names in tailwindcss
    // 'prettier-plugin-tailwindcss',
  ],
  semi: true,
  trailingComma: 'none',
  singleQuote: true,
  printWidth: 140,
  tabWidth: 2,
  useTabs: false,
  endOfLine: 'lf',
  arrowParens: 'always',
  bracketSameLine: true,
  bracketSpacing: true,
  htmlWhitespaceSensitivity: 'css',
  jsxSingleQuote: false,
  proseWrap: 'preserve',
  quoteProps: 'consistent',
  singleAttributePerLine: false,
  experimentalTernaries: true,
  overrides: [
    {
      files: '*.html',
      options: {
        parser: 'html'
      }
    },
    {
      files: '*.css',
      options: {
        parser: 'css'
      }
    }
  ]
};

module.exports = config;
