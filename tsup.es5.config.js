import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/**/*.{ts,tsx}'],
    splitting: false,
    target: 'es5',
    format: ['esm', 'cjs'],
    dts: false,
    treeshake: false,
    bundle: false,
    clean: true,
    legacyOutput: false
  }
]);
