import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        globalSetup: './tests/test-globals.ts',
        coverage: {
            provider: 'v8'
        },
    },
})
