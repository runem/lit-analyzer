#!/usr/bin/env node

// A script that launches vscode with our extension installed and
// executes ./mocha-driver

import * as path from "path";

import { runTests } from "@vscode/test-electron";

async function main() {
	try {
		// Passed to `--extensionDevelopmentPath`
		let extensionDevelopmentPath;
		if (process.argv.length === 3) {
			extensionDevelopmentPath = path.resolve(process.argv[2]);
		} else {
			extensionDevelopmentPath = path.join(__dirname, "../../");
		}
		const extensionTestsPath = path.resolve(__dirname, "./mocha-driver");

		const fixturesDir = path.join(__dirname, "..", "..", "..", "src", "test", "fixtures");
		// Download VS Code, unzip it and run the integration test
		await runTests({ extensionDevelopmentPath, extensionTestsPath, launchArgs: [fixturesDir] });
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error(err);
		process.exit(1);
	}
}

main();
