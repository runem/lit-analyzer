import * as esbuild from "esbuild";

const buildUs = esbuild.build({
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
});

const buildTsLitPlugin = esbuild.build({
  entryPoints: ["../ts-lit-plugin/src/index.ts"],
  bundle: true,
  outfile: "built/node_modules/ts-lit-plugin/lib/index.js",
  platform: "node",
  external: ["typescript"],
  minify: true,
  target: "es2017",
  format: "cjs",
  color: true,
  mainFields: ["module", "main"]
});

try {
  await Promise.all([buildUs, buildTsLitPlugin]);
} catch (e) {
  process.exit(1);
}
