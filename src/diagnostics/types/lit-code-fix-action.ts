import { Range } from "../../types/range";

export interface TextChange {
	range: Range;
	newText: string;
}

export enum CodeActionKind {
	DOCUMENT_TEXT_CHANGE = "TEXT_CHANGE",
	IMPORT_COMPONENT = "IMPORT_COMPONENT"
}

export interface CodeActionTextChange {
	kind: CodeActionKind.DOCUMENT_TEXT_CHANGE;
	change: TextChange;
}

export interface CodeActionImportComponent {
	kind: CodeActionKind.IMPORT_COMPONENT;
	importPath: string;
}

export type LitCodeFixAction = CodeActionTextChange | CodeActionImportComponent;
