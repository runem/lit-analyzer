#!/usr/bin/env node

// A script that launches vscode with our extension installed and
// executes ./mocha-driver

import * as path from "path";

import { runTests } from "@vscode/test-electron";

async function main() {
	try {
		// Passed to `--extensionDevelopmentPath`
		const extensionDevelopmentPath = path.resolve(__dirname, "../../../");
		// The path to the extension test runner script
		const extensionTestsPath = path.resolve(__dirname, "./mocha-driver");

		// Download VS Code, unzip it and run the integration test
		await runTests({ extensionDevelopmentPath, extensionTestsPath });
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error(err);
		process.exit(1);
	}
}

main();
