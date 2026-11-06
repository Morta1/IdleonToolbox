import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'

// Redesign guard: components read theme roles and format numbers through the game's notation.
// The baseline of old violations is gone: the guard stands at error with nothing excused, and a new one is a fix, not a suppression.
const HEX = '/#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\\b/'
const HEX_MESSAGE = 'Hex color in a component: use a theme role (Foundations board). Game and data colors belong in their own set outside components/.'
const NUMBER_MESSAGE = 'Raw number formatting: use formatNum or <Num> (Numbers board). Dates use the date helpers.'
// Status colors by job (Foundations board, Decision 3): words take text.success and kin, fills and edges success.main
// and kin; never a light or dark shade. Data colour sets live outside components/.
const SHADE = '/^(success|error|warning|info)\\.(light|dark)$/'
const SHADE_MESSAGE = 'Status shade in a component: words take the role (text.success), fills and edges the main shade (success.main). Foundations board.'
const TYPE_MESSAGE = 'h1 to h6 are not titles: use pageTitle, sectionTitle, cardTitle or groupLabel (Foundations board, Type).'
const LEGACY_FORMATTERS = { names: ['numberWithCommas'], message: NUMBER_MESSAGE }

const eslintConfig = defineConfig([
  ...nextVitals,
  {
    // Carried over from .eslintrc, which ESLint 9 never reads.
    rules: {
      '@next/next/no-img-element': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react/no-unescaped-entities': 'off',
      'react/display-name': 'off',
    },
  },
  {
    files: ['components/**/*.{js,jsx,ts,tsx}', 'pages/**/*.{js,jsx,ts,tsx}', 'hooks/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-restricted-syntax': ['error',
        { selector: `Literal[value=${HEX}]`, message: HEX_MESSAGE },
        { selector: `TemplateElement[value.raw=${HEX}]`, message: HEX_MESSAGE },
        { selector: "CallExpression[callee.property.name='toFixed']", message: NUMBER_MESSAGE },
        { selector: "CallExpression[callee.property.name='toLocaleString']", message: NUMBER_MESSAGE },
        { selector: `Literal[value=${SHADE}]`, message: SHADE_MESSAGE },
        { selector: "MemberExpression[property.name=/^(light|dark)$/][object.property.name=/^(success|error|warning|info)$/]", message: SHADE_MESSAGE },
        { selector: "JSXAttribute[name.name='variant'] Literal[value=/^h[1-6]$/]", message: TYPE_MESSAGE },
      ],
      'no-restricted-imports': ['error', {
        paths: [
          { name: '@utility/helpers', importNames: LEGACY_FORMATTERS.names, message: LEGACY_FORMATTERS.message },
          { name: 'utility/helpers', importNames: LEGACY_FORMATTERS.names, message: LEGACY_FORMATTERS.message },
          { name: '@utility/notate.mjs', importNames: LEGACY_FORMATTERS.names, message: LEGACY_FORMATTERS.message },
        ],
      }],
    },
  },
  // An undefined name in a .js or .jsx file passes tsc, the build and the hook, and crashes the page that reaches
  // it (phase 4: card search presets). TypeScript checks its own files.
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    rules: { 'no-undef': 'error' },
  },
  {
    // vitest.config.js sets globals: true
    files: ['__test__/**', '**/*.test.{js,jsx,mjs}'],
    languageOptions: {
      globals: Object.fromEntries(['describe', 'it', 'test', 'expect', 'vi', 'beforeAll', 'afterAll', 'beforeEach',
        'afterEach', 'suite', 'expectTypeOf', 'assertType'].map((name) => [name, 'readonly'])),
    },
  },
  {
    // utility/build-worker.mjs defines it at build
    files: ['workers/**'],
    languageOptions: { globals: { __WORKER_VERSION__: 'readonly' } },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Generated, local-only or not source.
    'public/**',
    'coverage/**',
    'test-results/**',
    'parsers/generated-types.ts',
    '.golden/**',
    '.superpowers/**',
    '.claude/**',
    '.cursor/**',
    '.idea/**',
    '.screens/**',
    '.screens-report/**',
    '.screens-today/**',
  ]),
])
 
export default eslintConfig
