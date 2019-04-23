import { LitCodeFixAction } from "./lit-code-fix-action";
import {
	LitHtmlDiagnostic,
	LitHtmlDiagnosticHtmlBoolMod,
	LitHtmlDiagnosticMissingImport,
	LitHtmlDiagnosticPrimitiveNotAssignableToComplex,
	LitHtmlDiagnosticUnknownMember,
	LitHtmlDiagnosticUnknownTag
} from "./lit-diagnostic";

export enum CodeFixKind {
	RENAME = "RENAME",
	ADD_TEXT = "ADD_TEXT",
	CHANGE_LIT_MODIFIER = "CHANGE_LIT_MODIFIER",
	IMPORT_COMPONENT = "IMPORT_COMPONENT"
}

export interface CodeFixBase {
	message: string;
	htmlReport: LitHtmlDiagnostic;
	actions: LitCodeFixAction[];
}

export interface CodeFixAddText extends CodeFixBase {
	kind: CodeFixKind.ADD_TEXT;
}

export interface CodeFixRename extends CodeFixBase {
	kind: CodeFixKind.RENAME;
	htmlReport: LitHtmlDiagnosticUnknownMember | LitHtmlDiagnosticUnknownTag;
}

export interface CodeFixChangeLitModifier extends CodeFixBase {
	kind: CodeFixKind.CHANGE_LIT_MODIFIER;
	htmlReport: LitHtmlDiagnosticHtmlBoolMod | LitHtmlDiagnosticPrimitiveNotAssignableToComplex;
}

export interface CodeFixImportComponent extends CodeFixBase {
	kind: CodeFixKind.IMPORT_COMPONENT;
	htmlReport: LitHtmlDiagnosticMissingImport;
}

export type LitCodeFix = CodeFixRename | CodeFixChangeLitModifier | CodeFixImportComponent | CodeFixAddText;
