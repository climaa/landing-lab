import path from 'node:path';
import { defineConfig, mergeConfig } from 'vitest/config';

import { preset } from '../../vitest.shared.mjs';

// Run: pnpm --filter @lab/web test  (or `turbo run test` from the root)
const config = defineConfig({
  // `oxc`, not `esbuild`: Vitest always sets oxc, so an esbuild block is dropped.
  oxc: { jsx: { runtime: 'automatic' } },
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname) },
  },
  test: {
    include: ['__tests__/**/*.test.{ts,tsx}'],
    environment: 'node',
  },
});

export default mergeConfig(preset, config);
