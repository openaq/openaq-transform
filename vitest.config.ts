import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@openaq/transform/core/client": new URL(
				"./src/core/client.ts",
				import.meta.url,
			).pathname,
			"@openaq/transform/core/readers": new URL(
				"./src/core/readers.ts",
				import.meta.url,
			).pathname,
			"@openaq/transform/core/parsers": new URL(
				"./src/core/parsers.ts",
				import.meta.url,
			).pathname,
			"@openaq/transform/core": new URL("./src/core/index.ts", import.meta.url)
				.pathname,
		},
	},
	test: {
		globals: true,
		globalSetup: "./tests/test-globals.ts",
		coverage: {
			provider: "v8",
		},
	},
});
