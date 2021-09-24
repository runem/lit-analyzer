import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import ts from "@rollup/plugin-typescript";
import commonJS from "@rollup/plugin-commonjs";

const pkg = require("./package.json");
const watch = { include: "src/**" };
const external = ["typescript", "util", "path", "fs", "vscode-html-languageservice", "vscode-css-languageservice"];
export default [
	{
		input: "src/extension.ts",
		output: [
			{
				file: pkg.main,
				format: "cjs",
				sourcemap: true
			}
		],
		plugins: [
			commonJS(),
			resolve({
				preferBuiltins: true
			}),
			json({
				compact: true
			}),
			ts()
		],
		external,
		watch
	}
];
