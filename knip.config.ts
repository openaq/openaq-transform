import type { KnipConfig } from 'knip';

export default {
  entry: ['src/browser/index.ts', 'src/core/index.ts', 'src/node/index.ts'],
} satisfies KnipConfig;
