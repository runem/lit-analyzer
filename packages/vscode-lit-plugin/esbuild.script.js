require("esbuild")
	.build({
		entryPoints: ["src/extension.ts"],
		bundle: true,
		outfile: "built/bundle.js",
		platform: "node",
		minify: true,
		target: "es2017",
		format: "cjs",
		color: true,
		external: ["vscode", "typescript"],
		mainFields: ["module", "main"]
	})
	.catch(() => process.exit(1));
