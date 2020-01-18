/* eslint-disable no-console */
const { copy, remove } = require("fs-extra");

/**
 * Run custom node commands
 * @param command
 * @returns {Promise<void>}
 */
async function run(command) {
	switch (command) {
		// VS Code doesn't support hoisted dependencies when debugging an extension.
		// Therefore in order to debug lit-analyzer and ts-lit-plugin in vscode,
		//   we need to copy over files to the "node_modules" of vscode-lit-plugin
		case "copylink":
			await copyPackage("lit-analyzer", "vscode-lit-plugin");
			await copyPackage("ts-lit-plugin", "vscode-lit-plugin");
			break;

		default:
			console.log(`Unknown command: "${command}"`);
			break;
	}
}

const command = process.argv[2];
run(command).catch(console.log);

/**
 * Copies content of a linkPackageName to the node_modules of destPackageName
 * @param linkPackageName
 * @param destPackageName
 * @returns {Promise<void>}
 */
async function copyPackage(linkPackageName, destPackageName) {
	// eslint-disable-next-line no-console
	console.log(`Copying ${linkPackageName} to ${destPackageName}/node_modules`);
	await copy(`./packages/${linkPackageName}/lib`, `./packages/${destPackageName}/node_modules/${linkPackageName}/lib`);
	await copy(`./packages/${linkPackageName}/package.json`, `./packages/${destPackageName}/node_modules/${linkPackageName}/package.json`);

	// Get rid of any "extraneous" according to "npm list --production --parseable --depth=99999" in nested node_modules
	// The reason this script needs to run is because vscode extension development doesn't yet support symlinked node_modules.
	const extraneous = [
		"web-component-analyzer",
		"fast-glob",
		"glob-parent",
		"micromatch",
		"@nodelib/fs.stat",
		"braces",
		"fill-range",
		"to-regex-range",
		"is-number"
	];
	for (const mod of extraneous) {
		await remove(`./packages/${destPackageName}/node_modules/${linkPackageName}/node_modules/${mod}`);
	}
}
