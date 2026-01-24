import { defineConfig } from "tsdown";

export default defineConfig([
	{
		entry: "src/browser/index.ts",
		outDir: "dist/transform-browser",
		format: ["esm"],
		platform: "browser",
		splitting: true,
		sourcemap: true,
		clean: true,
		dts: true,
	},
	{
		entry: "src/node/index.ts",
		outDir: "dist/transform-node",
		format: ["esm"],
		platform: "node",
		splitting: false,
		sourcemap: true,
		clean: false,
		dts: true,
		external: ["fs/promises"],
	},
	{
		entry: "src/core/index.ts",
		outDir: "dist/transform-core",
		format: ["esm"],
		platform: "neutral",
		splitting: false,
		sourcemap: true,
		clean: false,
		dts: true,
	},
]);
