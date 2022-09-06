#!/usr/bin/env node

// A script that launches vscode with our extension installed and
// executes ./mocha-driver

import * as path from "path";

import { runTests } from "@vscode/test-electron";

async function main() {
	try {
		if (process.argv.length !== 3) {
			throw new Error(`Usage: node ${process.argv[1]} <path to extension>`);
		}
		// When testing the packaged-and-then-unzipped extension, we'll be handed the path to it.
		const extensionPath = path.resolve(process.argv[2]);
		const extensionTestsPath = path.resolve(__dirname, "./mocha-driver");

		const fixturesDir = path.join(__dirname, "..", "..", "..", "src", "test", "fixtures");
		// Download VS Code, unzip it and run the integration test
		await runTests({ extensionDevelopmentPath: extensionPath, extensionTestsPath, launchArgs: [fixturesDir] });

		const inCI = !!process.env.CI;
		// For reasons unknown, the test runner sometimes fails to free some
		// resource after testing is done when running locally.
		// Note that at this point, the test has completed successfully.
		if (!inCI) {
			setTimeout(function () {
				// eslint-disable-next-line no-console
				console.log(`[tests completed successfully, but some resource leak is preventing the test runner from exiting, so manually exiting]`);
				process.exit(0);
			}, 1_000).unref();
		}
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error(err);
		process.exit(1);
	}
}

main();
