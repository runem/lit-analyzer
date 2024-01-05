import * as assert from "assert";
import { after } from "mocha";
import * as path from "path";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
// import * as litPlugin from "../extension.js";

// wait until the TS language server is ready and diagnostics are produced
async function getDiagnostics(docUri: vscode.Uri, retries = 1000) {
	for (let i = 0; i < retries; i++) {
		const diagnostics = vscode.languages.getDiagnostics(docUri);
		if (diagnostics.length > 0) {
			return diagnostics;
		}
		// Is there a better way to wait for the ts server to be ready?
		// Maybe we can listen for the event that displays and hides the "initializing TS/JS language features" message?
		await new Promise(resolve => setTimeout(resolve, 100));
	}
	throw new Error("No diagnostics found");
}

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

		const diagnostics = await getDiagnostics(doc.uri);
		assert.deepStrictEqual(
			diagnostics.map(d => d.message),
			["'my-element' has not been registered on HTMLElementTagNameMap"]
		);
	});

	test("We detect no-missing-import properly", async () => {
		const config = vscode.workspace.getConfiguration();
		config.update("lit-plugin.logging", "verbose", true);
		config.update("lit-plugin.rules.no-missing-import", "error", true);
		const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(path.join(__dirname, "../../src/test/fixtures/missing-import.ts")));
		const editor = await vscode.window.showTextDocument(doc);

		const diagnostics = await getDiagnostics(doc.uri);
		assert.deepStrictEqual(
			diagnostics.map(d => d.message),
			["Missing import for <my-other-element>\n  You can disable this check by disabling the 'no-missing-import' rule."]
		);

		// now add the fix
		const editRange = doc.lineAt(0).range.start;
		editor.edit(builder => {
			if (!editor) {
				throw new Error("No editor found");
			}
			editor.insertSnippet(new vscode.SnippetString("import './my-other-element';\n"), editRange);
		});

		// give it some time to settle
		await new Promise(resolve => setTimeout(resolve, 1000));

		assert.rejects(getDiagnostics(doc.uri, 3), "Expected rejection as no diagnostics will be found.");
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
});
