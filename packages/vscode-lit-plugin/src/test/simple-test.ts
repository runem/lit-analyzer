import * as assert from "assert";
import { after } from "mocha";
import * as path from "path";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { HSLA, RGBA } from "../color.js";
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
			for (let i = 0; i < 1000; i++) {
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

	test("We generate completions", async () => {
		const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(path.join(__dirname, "../../src/test/fixtures/completions.ts")));
		const editor = await vscode.window.showTextDocument(doc);

		const tagCompletionPosition = new vscode.Position(27, 8);
		const propertyCompletionPosition = new vscode.Position(25, 6);

		editor.selection = new vscode.Selection(tagCompletionPosition, tagCompletionPosition);

		async function getCompletions(expected: string) {
			for (let i = 0; i < 1000; i++) {
				const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
					"vscode.executeCompletionItemProvider",
					doc.uri,
					editor.selection.active
				);
				if (completions && completions.items.length > 0) {
					for (const completion of completions.items) {
						if (completion.label === expected) {
							return completions.items;
						}
					}
				}
				// Is there a better way to wait for the ts server to be ready?
				// Maybe we can listen for the event that displays and hides the "initializing TS/JS language features" message?
				await new Promise(resolve => setTimeout(resolve, 100));
			}
			throw new Error("No completions found");
		}

		const elemCompletions = await getCompletions("complete-me");
		const elemLabels = elemCompletions.map(c => c.label);
		assert.ok(elemLabels.includes("complete-me"), `Expected to find completion 'complete-me' in completions: ${JSON.stringify(elemLabels)}`);

		editor.selection = new vscode.Selection(propertyCompletionPosition, propertyCompletionPosition);
		// type a '.' character
		await editor.edit(editBuilder => {
			editBuilder.insert(editor.selection.active, ".");
		});

		const propCompletions = await getCompletions(".prop1");
		const propLabels = propCompletions.map(c => c.label);
		assert.ok(propLabels.includes(".prop1"), `Expected to find completion '.prop1' in completions: ${JSON.stringify(propLabels)}`);
		assert.ok(propLabels.includes(".prop2"), `Expected to find completion '.prop2' in completions: ${JSON.stringify(propLabels)}`);
		assert.ok(propLabels.includes(".prop3"), `Expected to find completion '.prop3' in completions: ${JSON.stringify(propLabels)}`);
	});

	test("We provide colors", async () => {
		const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(path.join(__dirname, "../../src/test/fixtures/color-detection.ts")));
		//const editor = await vscode.window.showTextDocument(doc);

		// see: https://code.visualstudio.com/api/references/commands
		const colors = await vscode.commands.executeCommand<vscode.ColorInformation[]>("vscode.executeDocumentColorProvide", doc.uri);

		const reds = colors.slice(0, 4);
		const greens = colors.slice(4, 10);
		const blues = colors.slice(10, 16);

		// Confirm that all reds are as they're supposed to be
		assert.strictEqual(
			reds.every(c => RGBA.equals(RGBA.fromVSCodeColor(c.color), new RGBA(255, 0, 0, 1.0))),
			true
		);

		// Confirm that all greens are as they're supposed to be
		assert.strictEqual(
			greens.every(c => c.color.green === 1.0),
			true
		);

		// Confirm that all blues are as they're supposed to be
		assert.strictEqual(
			blues.every(c => HSLA.fromRGBA(RGBA.fromVSCodeColor(c.color)).h === 230),
			true
		);
	});
});
