require("esbuild")
	.build({
		entryPoints: ["src/index.ts"],
		bundle: true,
		outfile: "lib/bundle-esbuild.js",
		platform: "node",
		external: ["typescript"],
		minify: true,
		target: "es2017",
		format: "cjs",
		color: true,
		mainFields: ["module", "main"]
	})
	.catch(() => process.exit(1));
