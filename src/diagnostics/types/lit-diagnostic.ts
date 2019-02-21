import { IComponentDefinition } from "../../parsing/parse-components/component-types";
import { HtmlTagAttr } from "../../parsing/parse-html-data/html-tag";
import { HtmlNodeAttr } from "../../parsing/text-document/html-document/parse-html-node/types/html-node-attr-types";
import { HtmlNode } from "../../parsing/text-document/html-document/parse-html-node/types/html-node-types";
import { Range } from "../../types/range";

export enum LitHtmlDiagnosticKind {
	MISSING_IMPORT = "MISSING_IMPORT",
	MISSING_REQUIRED_ATTRS = "MISSING_REQUIRED_ATTRIBUTES",
	UNKNOWN_ATTRIBUTE = "UNKNOWN_ATTRIBUTE",
	UNKNOWN_TAG = "UNKNOWN_TAG",
	TAG_NOT_CLOSED = "TAG_NOT_CLOSED",
	BOOL_MOD_ON_NON_BOOL = "BOOL_MOD_ON_NON_BOOL",
	NO_EVENT_LISTENER_FUNCTION = "NO_EVENT_LISTENER_FUNCTION",
	PRIMITIVE_NOT_ASSIGNABLE_TO_COMPLEX = "PRIMITIVE_NOT_ASSIGNABLE_TO_COMPLEX",
	INVALID_ATTRIBUTE_EXPRESSION_TYPE = "INVALID_ATTRIBUTE_EXPRESSION_TYPE"
}

export interface LitDiagnosticBase {
	location: Range;
	message: string;
	tips?: string[];
	severity: "error" | "warning";
}

export interface LitHtmlDiagnosticUnknownTag extends LitDiagnosticBase {
	kind: LitHtmlDiagnosticKind.UNKNOWN_TAG;
	suggestedName?: string;
	htmlNode: HtmlNode;
}

export interface LitHtmlDiagnosticUnknownAttribute extends LitDiagnosticBase {
	kind: LitHtmlDiagnosticKind.UNKNOWN_ATTRIBUTE;
	suggestedName?: string;
	htmlAttr: HtmlNodeAttr;
}

export interface LitHtmlDiagnosticMissingImport extends LitDiagnosticBase {
	kind: LitHtmlDiagnosticKind.MISSING_IMPORT;
	htmlNode: HtmlNode;
	definition: IComponentDefinition;
	importPath: string;
}

export interface LitHtmlDiagnosticMissingProps extends LitDiagnosticBase {
	kind: LitHtmlDiagnosticKind.MISSING_REQUIRED_ATTRS;
	attrs: HtmlTagAttr[];
	htmlNode: HtmlNode;
}

export interface LitHtmlDiagnosticTagNotClosed extends LitDiagnosticBase {
	kind: LitHtmlDiagnosticKind.TAG_NOT_CLOSED;
	htmlNode: HtmlNode;
}

export interface LitHtmlDiagnosticHtmlBoolMod extends LitDiagnosticBase {
	kind: LitHtmlDiagnosticKind.BOOL_MOD_ON_NON_BOOL;
	htmlAttr: HtmlNodeAttr;
	typeA: string;
	typeB: string;
}

export interface LitHtmlDiagnosticPrimitiveNotAssignableToComplex extends LitDiagnosticBase {
	kind: LitHtmlDiagnosticKind.PRIMITIVE_NOT_ASSIGNABLE_TO_COMPLEX;
	htmlAttr: HtmlNodeAttr;
	typeA: string;
	typeB: string;
}

export interface LitHtmlDiagnosticHtmlNoEventListenerFunction extends LitDiagnosticBase {
	kind: LitHtmlDiagnosticKind.NO_EVENT_LISTENER_FUNCTION;
	typeB: string;
}

export interface LitHtmlDiagnosticHtmlInvalidAttributeExpressionType extends LitDiagnosticBase {
	kind: LitHtmlDiagnosticKind.INVALID_ATTRIBUTE_EXPRESSION_TYPE;
	htmlAttr: HtmlNodeAttr;
	typeA: string;
	typeB: string;
}

export type LitHtmlDiagnostic =
	| LitHtmlDiagnosticUnknownTag
	| LitHtmlDiagnosticMissingImport
	| LitHtmlDiagnosticMissingProps
	| LitHtmlDiagnosticHtmlBoolMod
	| LitHtmlDiagnosticUnknownAttribute
	| LitHtmlDiagnosticPrimitiveNotAssignableToComplex
	| LitHtmlDiagnosticHtmlInvalidAttributeExpressionType
	| LitHtmlDiagnosticHtmlNoEventListenerFunction
	| LitHtmlDiagnosticTagNotClosed;

export interface LitCssDiagnostic extends LitDiagnosticBase {}

export type LitDiagnostic = LitHtmlDiagnostic | LitCssDiagnostic;
