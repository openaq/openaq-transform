import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/browser/index.ts'],
    outDir: 'dist/browser',
    format: ['esm'],
    platform: 'browser',
    splitting: true,
    sourcemap: true,
    clean: true,
    dts: true,
  },
  {
    entry: ['src/node/index.ts'],
    outDir: 'dist/node',
    format: ['esm'],
    platform: 'node',
    splitting: false,
    sourcemap: true,
    clean: false,
    dts: true,
    external: ['fs/promises'],
  },
]);
