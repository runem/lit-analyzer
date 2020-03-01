import { LitCodeFix, LitCodeFixAction } from "lit-analyzer";
import { CodeFixAction, FileTextChanges, SourceFile } from "typescript";
import { translateRange } from "./translate-range";

export function translateCodeFixes(codeFixes: LitCodeFix[], file: SourceFile): CodeFixAction[] {
	return codeFixes.map(codeFix => translateCodeFix(file, codeFix));
}

export function translateCodeFix(file: SourceFile, codeFix: LitCodeFix): CodeFixAction {
	return {
		fixName: codeFix.name,
		description: codeFix.message,
		changes: codeFix.actions.map(action => translateCodeFixAction(file, action))
	};
}

function translateCodeFixAction(file: SourceFile, action: LitCodeFixAction): FileTextChanges {
	return {
		fileName: file.fileName,
		textChanges: [
			{
				span: translateRange(action.range),
				newText: action.newText
			}
		]
	};
}
