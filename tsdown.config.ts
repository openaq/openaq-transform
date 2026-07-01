import { defineConfig, type UserConfig } from "tsdown";

const configs: UserConfig[] = [
	{
		entry: ["src/browser/index.ts"],
		outDir: "dist/transform-browser",
		format: ["esm"],
		platform: "browser",
		sourcemap: true,
		clean: true,
		dts: true,
		deps: { onlyBundle: false }
	},
	{
		entry: ["src/node/index.ts"],
		outDir: "dist/transform-node",
		format: ["esm"],
		platform: "node",
		sourcemap: true,
		clean: false,
		dts: true,
		deps: { neverBundle: ["fs/promises"], onlyBundle: false  },
	},
	{
		entry: ["src/core/index.ts"],
		outDir: "dist/transform-core",
		format: ["esm"],
		platform: "neutral",
		sourcemap: true,
		clean: false,
		dts: true,
		deps: { onlyBundle: false },
	},
];

export default defineConfig(configs);
