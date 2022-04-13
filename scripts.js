/* eslint-disable no-console */
const { copy, mkdirp, writeFile } = require("fs-extra");

/**
 * Run custom node commands
 * @param command
 * @returns {Promise<void>}
 */
async function run(command) {
	switch (command) {
		case "copylink": {
			await mkdirp("./packages/vscode-lit-plugin/built/node_modules/ts-lit-plugin/lib");
			const tsPluginPackageJson = require("./packages/ts-lit-plugin/package.json");
			// Needed because we're using the bundle, so all deps have been packaged
			// in.
			tsPluginPackageJson.dependencies = {};
			await writeFile("./packages/vscode-lit-plugin/built/node_modules/ts-lit-plugin/package.json", JSON.stringify(tsPluginPackageJson, null, 2));
			await copy("./packages/ts-lit-plugin/index.js", "./packages/vscode-lit-plugin//built/node_modules/ts-lit-plugin/index.js");
			await copy(
				"./packages/ts-lit-plugin/lib/bundle-rollup.js",
				"./packages/vscode-lit-plugin//built/node_modules/ts-lit-plugin/lib/bundle-rollup.js"
			);
			await copy(
				"./packages/ts-lit-plugin/lib/bundle-esbuild.js",
				"./packages/vscode-lit-plugin//built/node_modules/ts-lit-plugin/lib/bundle-esbuild.js"
			);

			const pluginPackageJson = require("./packages/vscode-lit-plugin/package.json");
			// Needed because vsce publish verifies the node_module directory
			pluginPackageJson.dependencies["ts-lit-plugin"] = "^v1.0.0-fake-version";
			await writeFile("./packages/vscode-lit-plugin/built/package.json", JSON.stringify(pluginPackageJson, null, 2));
			await copy("./packages/vscode-lit-plugin/LICENSE.md", "./packages/vscode-lit-plugin/built/LICENSE.md");
			await copy("./packages/vscode-lit-plugin/docs", "./packages/vscode-lit-plugin/built/docs");
			await copy("./packages/vscode-lit-plugin/README.md", "./packages/vscode-lit-plugin/built/README.md");

			await copy("./packages/vscode-lit-plugin/node_modules/typescript", "./packages/vscode-lit-plugin/built/node_modules/typescript");

			await copy(
				"./packages/vscode-lit-plugin/node_modules/vscode-lit-html/LICENSE",
				"./packages/vscode-lit-plugin/built/syntaxes/vscode-lit-html/LICENSE"
			);

			await copy(
				"./packages/vscode-lit-plugin/node_modules/vscode-lit-html/syntaxes/lit-html.json",
				"./packages/vscode-lit-plugin/built/syntaxes/vscode-lit-html/lit-html.json"
			);

			await copy(
				"./packages/vscode-lit-plugin/node_modules/vscode-lit-html/syntaxes/lit-html-string-injection.json",
				"./packages/vscode-lit-plugin/built/syntaxes/vscode-lit-html/lit-html-string-injection.json"
			);

			await copy(
				"./packages/vscode-lit-plugin/node_modules/vscode-lit-html/syntaxes/lit-html-style-injection.json",
				"./packages/vscode-lit-plugin/built/syntaxes/vscode-lit-html/lit-html-style-injection.json"
			);

			await copy(
				"./packages/vscode-lit-plugin/node_modules/vscode-lit-html/syntaxes/lit-html-svg.json",
				"./packages/vscode-lit-plugin/built/syntaxes/vscode-lit-html/lit-html-svg.json"
			);

			await copy(
				"./packages/vscode-lit-plugin/node_modules/vscode-styled-components/LICENSE",
				"./packages/vscode-lit-plugin/built/syntaxes/vscode-styled-components/LICENSE"
			);

			await copy(
				"./packages/vscode-lit-plugin/node_modules/vscode-styled-components/syntaxes/css.styled.json",
				"./packages/vscode-lit-plugin/built/syntaxes/vscode-styled-components/css.styled.json"
			);

			await copy(
				"./packages/vscode-lit-plugin/node_modules/vscode-styled-components/syntaxes/styled-components.json",
				"./packages/vscode-lit-plugin/built/syntaxes/vscode-styled-components/styled-components.json"
			);

			await copy("./packages/vscode-lit-plugin/schemas", "./packages/vscode-lit-plugin/built/schemas");

			break;
		}
		default:
			console.log(`Unknown command: "${command}"`);
			break;
	}
}

const command = process.argv[2];
run(command).catch(e => {
	console.error(e);
	process.exitCode = 1;
});
