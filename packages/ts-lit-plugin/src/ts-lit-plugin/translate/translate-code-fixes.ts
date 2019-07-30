import { CodeFixAction, FileTextChanges, SourceFile } from "typescript";
import { tsModule } from "../../ts-module";
import { translateRange } from "./translate-range";
import { CodeActionKind, LitCodeFix, LitCodeFixAction } from "lit-analyzer";

export function translateCodeFixes(codeFixes: LitCodeFix[], file: SourceFile): CodeFixAction[] {
	return codeFixes.map(codeFix => translateCodeFix(file, codeFix));
}

export function translateCodeFix(file: SourceFile, codeFix: LitCodeFix): CodeFixAction {
	return {
		fixName: codeFix.kind.toLowerCase(),
		description: codeFix.message,
		changes: codeFix.actions.map(action => translateCodeFixAction(file, action))
	};
}

function translateCodeFixAction(file: SourceFile, action: LitCodeFixAction): FileTextChanges {
	switch (action.kind) {
		case CodeActionKind.DOCUMENT_TEXT_CHANGE:
			return {
				fileName: file.fileName,
				textChanges: [
					{
						span: translateRange(action.change.range),
						newText: action.change.newText
					}
				]
			};
		case CodeActionKind.IMPORT_COMPONENT: {
			// Get the import path and the position where it can be placed
			const lastImportIndex = getLastImportIndex(file);

			return {
				fileName: file.fileName,
				textChanges: [
					{
						span: { start: lastImportIndex, length: 0 },
						newText: `\nimport "${action.importPath}";`
					}
				]
			};
		}
	}
}

/**
 * Returns the position of the last import line.
 * @param sourceFile
 */
function getLastImportIndex(sourceFile: SourceFile): number {
	let lastImportIndex = 0;

	for (const statement of sourceFile.statements) {
		if (tsModule.ts.isImportDeclaration(statement)) {
			lastImportIndex = statement.getEnd();
		}
	}

	return lastImportIndex;
}
