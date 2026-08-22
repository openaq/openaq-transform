import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: [
			{
				find: /^@openaq\/transform\/core$/,
				replacement: fileURLToPath(
					new URL("./src/core/index.ts", import.meta.url),
				),
			},
		],
	},
	test: {
		globals: true,
		globalSetup: "./tests/test-globals.ts",
		coverage: { provider: "v8" },
	},
});
