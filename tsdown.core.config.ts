import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/core/index.ts"],
	outDir: "dist/transform-core",
	format: ["esm"],
	platform: "neutral",
	sourcemap: true,
	clean: true,
	dts: true,
	deps: { onlyBundle: false },
});
