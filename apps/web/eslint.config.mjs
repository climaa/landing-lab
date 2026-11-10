import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

const config = [
  // `eslint .` lints everything not ignored. These are build output, never linted.
  { ignores: ['.next/**', '.turbo/**', 'next-env.d.ts'] },
  ...nextCoreWebVitals,
  {
    // A `key` after a `{...}` spread is invisible to the JSX transform; see
    // apps/visual-diff-ui/eslint.config.mjs for the incident.
    rules: { 'react/jsx-key': ['error', { checkKeyMustBeforeSpread: true }] },
  },
  {
    files: [
      'app/**/*.{ts,tsx}',
      'components/**/*.{ts,tsx}',
      'lib/**/*.{ts,tsx}',
      'data/**/*.ts',
    ],
    rules: { 'no-console': 'error' },
  },
];

export default config;
