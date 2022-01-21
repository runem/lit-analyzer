import * as assert from "assert";
import { after } from "mocha";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";

suite("Extension Test Suite", () => {
	after(() => {
		vscode.window.showInformationMessage("All tests done!");
	});

	test("The extension is installed", () => {
		const extensionIds = vscode.extensions.all.map(extension => extension.id);
		const ourId = "runem.lit-plugin";
		assert.ok(extensionIds.includes(ourId), `Expected ${JSON.stringify(extensionIds)} to include '${ourId}'`);
	});
});
