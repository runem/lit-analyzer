import ts from "@wessberg/rollup-plugin-ts";
import resolve from "rollup-plugin-node-resolve";
import replace from "rollup-plugin-replace";

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
	"vscode-css-languageservice",
	"vscode-html-languageservice/lib/umd/languageFacts/data/html5Events",
	"vscode-html-languageservice/lib/umd/languageFacts/data/html5Tags",
	"vscode-html-languageservice/lib/umd/languageFacts/data/html5Aria",
	"vscode-html-languageservice/lib/umd/languageFacts/data/html5"
];
const plugins = [
	replace({
		VERSION: pkg.version,
		delimiters: ["<@", "@>"]
	}),
	resolve({
		preferBuiltins: true
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
