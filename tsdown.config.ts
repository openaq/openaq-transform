import { defineConfig } from "tsdown";

export default defineConfig([
	{
		entry: ["src/core/index.ts"],
		outDir: "dist/core",
		format: ["esm"],
		clean: true,
		dts: true,
		sourcemap: true,
	},
	{
		entry: ["src/node/index.ts"],
		outDir: "dist/node",
		format: ["esm"],
		platform: "node",
		sourcemap: true,
		dts: true,
	},
	{
		entry: ["src/browser/index.ts"],
		outDir: "dist/browser",
		format: ["esm"],
		platform: "browser",
		sourcemap: true,
		dts: true,
	},
]);
