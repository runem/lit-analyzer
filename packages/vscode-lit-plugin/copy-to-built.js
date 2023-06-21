const { copy, mkdirp, writeFile } = require("fs-extra");

/**
 * Copy files into the ./built directory.
 *
 * This is the directory that actually has the final filesystem layout for
 * the extension, and to keep the vsix file small we want to only include
 * those files that are needed.
 *
 * Note that ./built/bundle.js is generated directly by esbuild.script.js and
 * not copied by this script.
 */
async function main() {
	// We don't bundle the typescript compiler into ./built/bundle.js, so we need
	// a copy of it.
	await mkdirp("./node_modules/typescript/lib");
	await copy("./node_modules/typescript/package.json", "./built/node_modules/typescript/package.json");
	await copy("./node_modules/typescript/lib/typescript.js", "./built/node_modules/typescript/lib/typescript.js");
	await copy("./node_modules/typescript/lib/tsserverlibrary.js", "./built/node_modules/typescript/lib/tsserverlibrary.js");

	// For the TS compiler plugin, it must be in node modules because that's
	// hard coded by the TS compiler's custom module resolution logic.
	await mkdirp("./built/node_modules/ts-lit-plugin");
	const tsPluginPackageJson = require("../ts-lit-plugin/package.json");
	// We're only using the bundled version, so the plugin doesn't need any
	// dependencies.
	tsPluginPackageJson.dependencies = {};
	await writeFile("./built/node_modules/ts-lit-plugin/package.json", JSON.stringify(tsPluginPackageJson, null, 2));
	await copy("../ts-lit-plugin/index.js", "./built/node_modules/ts-lit-plugin/index.js");

	const pluginPackageJson = require("./package.json");
	// vsce is _very_ picky about the directories in node_modules matching the
	// extension's package.json, so we need an entry for ts-lit-plugin or it
	// will think that it's extraneous.
	pluginPackageJson.dependencies["ts-lit-plugin"] = "*";
	await writeFile("./built/package.json", JSON.stringify(pluginPackageJson, null, 2));

	// Copy static files used by the extension.
	await copy("./LICENSE.md", "./built/LICENSE.md");
	await copy("./README.md", "./built/README.md");
	await copy("./docs", "./built/docs");
	await copy("./syntaxes", "./built/syntaxes");
	await copy("./schemas", "./built/schemas");
}

main().catch(e => {
	// eslint-disable-next-line no-console
	console.error(e);
	process.exitCode = 1;
});
