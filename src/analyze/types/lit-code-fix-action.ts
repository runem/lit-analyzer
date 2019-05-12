import { DocumentRange, SourceFileRange } from "./lit-range";

export interface DocumentTextChange {
	range: DocumentRange;
	newText: string;
}

export interface TextChange {
	range: SourceFileRange;
	newText: string;
}

export enum CodeActionKind {
	DOCUMENT_TEXT_CHANGE = "TEXT_CHANGE",
	IMPORT_COMPONENT = "IMPORT_COMPONENT"
}

export interface CodeActionTextChange {
	kind: CodeActionKind.DOCUMENT_TEXT_CHANGE;
	change: DocumentTextChange;
}

export interface CodeActionImportComponent {
	kind: CodeActionKind.IMPORT_COMPONENT;
	importPath: string;
}

export type LitCodeFixAction = CodeActionTextChange | CodeActionImportComponent;
