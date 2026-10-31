import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
 
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
