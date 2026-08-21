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
		deps: {
			onlyBundle: false,
			neverBundle: [/^@openaq\/transform\//],
			dts: {
				neverBundle: [/^@openaq\/transform\//],
			},
		},
	},
	{
		entry: ["src/node/index.ts"],
		outDir: "dist/transform-node",
		format: ["esm"],
		platform: "node",
		sourcemap: true,
		clean: false,
		dts: true,
		deps: {
			onlyBundle: false,
			neverBundle: [/^@openaq\/transform\//],
			dts: {
				neverBundle: [/^@openaq\/transform\//],
			},
		},
	},
];

export default defineConfig(configs);
