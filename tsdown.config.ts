import { defineConfig, type UserConfig } from "tsdown";

const shared = {
	format: ["esm"],
	dts: true,
	sourcemap: true,
	clean: true,
	outExtensions: () => ({ js: ".mjs", dts: ".d.mts" }),
	deps: {
		neverBundle: [
			/^@openaq\/transform($|\/)/,
			"geojson", "luxon", "proj4", "csv-parse", "fast-xml-parser",
			/^@jmespath-community/,
		],
	},
} satisfies UserConfig;

export default defineConfig([
	{ ...shared, entry: ["src/core/index.ts"], outDir: "dist/core", platform: "neutral" },
	{ ...shared, entry: ["src/node/index.ts"], outDir: "dist/node", platform: "node" },
	{ ...shared, entry: ["src/browser/index.ts"], outDir: "dist/browser", platform: "browser", target: "es2023" },
]);
