import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'

// Redesign guard: components read theme roles and format numbers through the game's notation.
// Today's violations live in eslint-suppressions.json, which only ever shrinks: a commit that fixes
// some runs `npx eslint . --prune-suppressions`, nobody runs --suppress-all again.
const HEX = '/#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\\b/'
const HEX_MESSAGE = 'Hex color in a component: use a theme role (Foundations board). Game and data colors belong in their own set outside components/.'
const NUMBER_MESSAGE = 'Raw number formatting: use formatNum or <Num> (Numbers board). Dates use the date helpers.'
// Status colors by job (Foundations board, Decision 3): words take text.success and kin, fills and edges success.main
// and kin; never a light or dark shade. The data colour sets and the identity edges the owner keeps (phase 5) sit in
// the suppressions.
const SHADE = '/^(success|error|warning|info)\\.(light|dark)$/'
const SHADE_MESSAGE = 'Status shade in a component: words take the role (text.success), fills and edges the main shade (success.main). Foundations board.'

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
      ],
    },
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
