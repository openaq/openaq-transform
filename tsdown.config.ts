import { defineConfig } from "tsdown";

export default defineConfig([
	{
		entry: ["src/core/**/*.ts", "!**/*.spec.ts"],
		outDir: "dist/core",
		root: "src/core",
		format: ["esm"],
		clean: true,
		dts: true,
		unbundle: true,
		deps: {
			neverBundle: [/node_modules/],
			dts: {
				neverBundle: [/node_modules/],
			},
		},
	},
	{
		entry: ["src/node/index.ts"],
		outDir: "dist/node",
		format: ["esm"],
		platform: "node",
		sourcemap: true,
		dts: true,
		deps: {
			neverBundle: [/^\.\.\/core/],
			dts: {
				neverBundle: [/^\.\.\/core/],
			},
		},
	},
	{
		entry: ["src/browser/index.ts"],
		outDir: "dist/browser",
		format: ["esm"],
		platform: "browser",
		sourcemap: true,
		dts: true,
		deps: {
			neverBundle: [/^\.\.\/core/],
			dts: {
				neverBundle: [/^\.\.\/core/],
			},
		},
	},
]);
