import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import ts from "@wessberg/rollup-plugin-ts";

const pkg = require("./package.json");
const watch = { include: "src/**" };
const external = [
	"typescript",
	"fast-glob",
	"util",
	"path",
	"fs",
	"chalk",
	"didyoumean2",
	"parse5",
	"ts-simple-type",
	"didyoumean2",
	"web-component-analyzer",
	"ts-simple-type",
	"chalk",
	"vscode-html-languageservice",
	"vscode-css-languageservice"
];
const plugins = [
	replace({
		VERSION: pkg.version,
		delimiters: ["<@", "@>"]
	}),
	resolve({
		preferBuiltins: true
	}),
	json({
		compact: true
	}),
	ts()
];

export default [
	{
		input: "src/index.ts",
		output: [
			{
				file: pkg.main,
				format: "cjs"
			}
		],
		plugins,
		external,
		watch
	}
];
