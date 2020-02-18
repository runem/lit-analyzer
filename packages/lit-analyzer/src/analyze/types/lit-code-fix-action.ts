import { LitRange } from "./lit-range";

export interface TextChange {
	range: LitRange;
	newText: string;
}

export enum CodeActionKind {
	TEXT_CHANGE = "TEXT_CHANGE",
	IMPORT_COMPONENT = "IMPORT_COMPONENT"
}

export interface CodeActionTextChange {
	kind: CodeActionKind.TEXT_CHANGE;
	change: TextChange;
}

export interface CodeActionImportComponent {
	kind: CodeActionKind.IMPORT_COMPONENT;
	importPath: string;
}

export type LitCodeFixAction = CodeActionTextChange | CodeActionImportComponent;
