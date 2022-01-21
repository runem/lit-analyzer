import * as assert from "assert";
import { after } from "mocha";
import * as path from "path";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
// import * as litPlugin from "../extension.js";

suite("Extension Test Suite", () => {
	after(() => {
		vscode.window.showInformationMessage("All tests done!");
	});

	test("The extension is installed", () => {
		const extensionIds = vscode.extensions.all.map(extension => extension.id);
		const ourId = "runem.lit-plugin";
		assert.ok(extensionIds.includes(ourId), `Expected ${JSON.stringify(extensionIds)} to include '${ourId}'`);
	});

	test("We produce a diagnostic", async () => {
		const config = vscode.workspace.getConfiguration();
		config.update("lit-plugin.logging", "verbose", true);
		config.update("lit-plugin.rules.no-missing-element-type-definition", "error", true);
		const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(path.join(__dirname, "../../src/test/fixtures/missing-elem-type.ts")));
		await vscode.window.showTextDocument(doc);

		// wait until the TS language server is ready and diagnostics are produced
		async function getDiagnostics() {
			for (let i = 0; i < 100; i++) {
				const diagnostics = vscode.languages.getDiagnostics(doc.uri);
				if (diagnostics.length > 0) {
					return diagnostics;
				}
				// Is there a better way to wait for the ts server to be ready?
				// Maybe we can listen for the event that displays and hides the "initializing TS/JS language features" message?
				await new Promise(resolve => setTimeout(resolve, 100));
			}
			throw new Error("No diagnostics found");
		}

		const diagnostics = await getDiagnostics();
		assert.deepStrictEqual(
			diagnostics.map(d => d.message),
			["'my-element' has not been registered on HTMLElementTagNameMap"]
		);
	});
});
