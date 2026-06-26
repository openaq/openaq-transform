import { defineConfig, type Options } from "tsdown";

const configs: Options[] = [
	{
		entry: ["src/browser/index.ts"],
		outDir: "dist/transform-browser",
		format: ["esm"],
		platform: "browser",
		sourcemap: true,
		clean: true,
		dts: true,
	},
	{
		entry: ["src/node/index.ts"],
		outDir: "dist/transform-node",
		format: ["esm"],
		platform: "node",
		sourcemap: true,
		clean: false,
		dts: true,
		external: ["fs/promises"],
	},
	{
		entry: ["src/core/index.ts"],
		outDir: "dist/transform-core",
		format: ["esm"],
		platform: "neutral",
		sourcemap: true,
		clean: false,
		dts: true,
	},
];

export default defineConfig(configs);