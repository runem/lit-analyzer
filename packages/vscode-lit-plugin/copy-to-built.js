const { copy, mkdirp, writeFile } = require("fs-extra");
async function main() {
	await mkdirp("./built/node_modules/ts-lit-plugin/lib");
	const tsPluginPackageJson = require("../ts-lit-plugin/package.json");
	// Needed because we're using the bundle, so all deps have been packaged
	// in.
	tsPluginPackageJson.dependencies = {};
	await writeFile("./built/node_modules/ts-lit-plugin/package.json", JSON.stringify(tsPluginPackageJson, null, 2));
	await copy("../ts-lit-plugin/index.js", "./built/node_modules/ts-lit-plugin/index.js");
	await copy("../ts-lit-plugin/lib/bundle-esbuild.js", "./built/node_modules/ts-lit-plugin/lib/bundle-esbuild.js");

	const pluginPackageJson = require("./package.json");
	// Needed because vsce publish verifies the node_module directory
	pluginPackageJson.dependencies["ts-lit-plugin"] = "^v1.0.0-fake-version";
	await writeFile("./built/package.json", JSON.stringify(pluginPackageJson, null, 2));
	await copy("./LICENSE.md", "./built/LICENSE.md");
	await copy("./docs", "./built/docs");
	await copy("./README.md", "./built/README.md");

	await copy("./node_modules/typescript", "./built/node_modules/typescript");

	await copy("./node_modules/vscode-lit-html/LICENSE", "./built/syntaxes/vscode-lit-html/LICENSE");

	await copy("./node_modules/vscode-lit-html/syntaxes/lit-html.json", "./built/syntaxes/vscode-lit-html/lit-html.json");

	await copy(
		"./node_modules/vscode-lit-html/syntaxes/lit-html-string-injection.json",
		"./built/syntaxes/vscode-lit-html/lit-html-string-injection.json"
	);

	await copy(
		"./node_modules/vscode-lit-html/syntaxes/lit-html-style-injection.json",
		"./built/syntaxes/vscode-lit-html/lit-html-style-injection.json"
	);

	await copy("./node_modules/vscode-lit-html/syntaxes/lit-html-svg.json", "./built/syntaxes/vscode-lit-html/lit-html-svg.json");

	await copy("./node_modules/vscode-styled-components/LICENSE", "./built/syntaxes/vscode-styled-components/LICENSE");

	await copy("./node_modules/vscode-styled-components/syntaxes/css.styled.json", "./built/syntaxes/vscode-styled-components/css.styled.json");

	await copy(
		"./node_modules/vscode-styled-components/syntaxes/styled-components.json",
		"./built/syntaxes/vscode-styled-components/styled-components.json"
	);

	await copy("./schemas", "./built/schemas");
}

main().catch(e => {
	// eslint-disable-next-line no-console
	console.error(e);
	process.exitCode = 1;
});
