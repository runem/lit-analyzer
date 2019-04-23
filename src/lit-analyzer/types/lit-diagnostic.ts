import { ComponentDefinition } from "web-component-analyzer";
import { HtmlAttr, HtmlAttrTarget } from "../../parsing/parse-html-data/html-tag";
import { HtmlNodeAttr } from "../../parsing/text-document/html-document/parse-html-node/types/html-node-attr-types";
import { HtmlNode } from "../../parsing/text-document/html-document/parse-html-node/types/html-node-types";
import { DocumentRange, SourceFileRange } from "./lit-range";
import { SourceFile } from "typescript";

export enum LitHtmlDiagnosticKind {
	MISSING_IMPORT = "MISSING_IMPORT",
	MISSING_REQUIRED_ATTRS = "MISSING_REQUIRED_ATTRIBUTES",
	UNKNOWN_TARGET = "UNKNOWN_TARGET",
	UNKNOWN_TAG = "UNKNOWN_TAG",
	TAG_NOT_CLOSED = "TAG_NOT_CLOSED",
	BOOL_MOD_ON_NON_BOOL = "BOOL_MOD_ON_NON_BOOL",
	PROPERTY_NEEDS_EXPRESSION = "PROPERTY_NEEDS_EXPRESSION",
	NO_EVENT_LISTENER_FUNCTION = "NO_EVENT_LISTENER_FUNCTION",
	PRIMITIVE_NOT_ASSIGNABLE_TO_COMPLEX = "PRIMITIVE_NOT_ASSIGNABLE_TO_COMPLEX",
	COMPLEX_NOT_ASSIGNABLE_TO_PRIMITIVE = "COMPLEX_NOT_ASSIGNABLE_TO_PRIMITIVE",
	INVALID_ATTRIBUTE_EXPRESSION_TYPE = "INVALID_ATTRIBUTE_EXPRESSION_TYPE",
	INVALID_SLOT_NAME = "INVALID_SLOT_NAME",
	MISSING_SLOT_ATTRIBUTE = "MISSING_SLOT_ATTRIBUTE"
}

export interface LitDiagnosticBase {
	location: SourceFileRange;
	message: string;
	suggestion?: string;
	severity: "error" | "warning";
}

export interface LitDocumentDiagnosticBase extends LitDiagnosticBase {
	location: DocumentRange;
}

export interface LitSourceFileDiagnosticBase extends LitDiagnosticBase {
	file: SourceFile;
}

export interface LitHtmlDiagnosticUnknownTag extends LitDocumentDiagnosticBase {
	kind: LitHtmlDiagnosticKind.UNKNOWN_TAG;
	suggestedName?: string;
	htmlNode: HtmlNode;
}

export interface LitHtmlDiagnosticUnknownMember extends LitDocumentDiagnosticBase {
	kind: LitHtmlDiagnosticKind.UNKNOWN_TARGET;
	htmlAttr: HtmlNodeAttr;
	suggestedTarget?: HtmlAttrTarget;
}

export interface LitHtmlDiagnosticMissingImport extends LitDocumentDiagnosticBase {
	kind: LitHtmlDiagnosticKind.MISSING_IMPORT;
	htmlNode: HtmlNode;
	definition: ComponentDefinition;
	importPath: string;
}

export interface LitHtmlDiagnosticMissingProps extends LitDocumentDiagnosticBase {
	kind: LitHtmlDiagnosticKind.MISSING_REQUIRED_ATTRS;
	attrs: HtmlAttr[];
	htmlNode: HtmlNode;
}

export interface LitHtmlDiagnosticTagNotClosed extends LitDocumentDiagnosticBase {
	kind: LitHtmlDiagnosticKind.TAG_NOT_CLOSED;
	htmlNode: HtmlNode;
}

export interface LitHtmlDiagnosticHtmlBoolMod extends LitDocumentDiagnosticBase {
	kind: LitHtmlDiagnosticKind.BOOL_MOD_ON_NON_BOOL;
	htmlAttr: HtmlNodeAttr;
	typeA: string;
	typeB: string;
}

export interface LitHtmlDiagnosticPrimitiveNotAssignableToComplex extends LitDocumentDiagnosticBase {
	kind: LitHtmlDiagnosticKind.PRIMITIVE_NOT_ASSIGNABLE_TO_COMPLEX;
	htmlAttr: HtmlNodeAttr;
	typeA: string;
	typeB: string;
}

export interface LitHtmlDiagnosticHtmlNoEventListenerFunction extends LitDocumentDiagnosticBase {
	kind: LitHtmlDiagnosticKind.NO_EVENT_LISTENER_FUNCTION;
	typeB: string;
}

export interface LitHtmlDiagnosticHtmlInvalidAttributeExpressionType extends LitDocumentDiagnosticBase {
	kind: LitHtmlDiagnosticKind.INVALID_ATTRIBUTE_EXPRESSION_TYPE;
	htmlAttr: HtmlNodeAttr;
	typeA: string;
	typeB: string;
}

export interface LitHtmlDiagnosticComplexNotAssignableToPrimitive extends LitDocumentDiagnosticBase {
	kind: LitHtmlDiagnosticKind.COMPLEX_NOT_ASSIGNABLE_TO_PRIMITIVE;
	htmlAttr: HtmlNodeAttr;
	typeA: string;
	typeB: string;
}

export interface LitHtmlDiagnosticHtmlPropertyNeedsExpression extends LitDocumentDiagnosticBase {
	kind: LitHtmlDiagnosticKind.PROPERTY_NEEDS_EXPRESSION;
}

export interface LitHtmlDiagnosticInvalidSlotName extends LitDocumentDiagnosticBase {
	kind: LitHtmlDiagnosticKind.INVALID_SLOT_NAME;
	validSlotNames: (string | undefined)[];
}

export interface LitHtmlDiagnosticMissingSlotAttr extends LitDocumentDiagnosticBase {
	kind: LitHtmlDiagnosticKind.MISSING_SLOT_ATTRIBUTE;
	htmlNode: HtmlNode;
	validSlotNames: string[];
}

export type LitHtmlDiagnostic =
	| LitHtmlDiagnosticUnknownTag
	| LitHtmlDiagnosticMissingImport
	| LitHtmlDiagnosticMissingProps
	| LitHtmlDiagnosticHtmlBoolMod
	| LitHtmlDiagnosticUnknownMember
	| LitHtmlDiagnosticPrimitiveNotAssignableToComplex
	| LitHtmlDiagnosticHtmlInvalidAttributeExpressionType
	| LitHtmlDiagnosticHtmlNoEventListenerFunction
	| LitHtmlDiagnosticComplexNotAssignableToPrimitive
	| LitHtmlDiagnosticHtmlPropertyNeedsExpression
	| LitHtmlDiagnosticInvalidSlotName
	| LitHtmlDiagnosticMissingSlotAttr
	| LitHtmlDiagnosticTagNotClosed;

export interface LitCssDiagnostic extends LitDocumentDiagnosticBase {}

export interface LitSourceFileDiagnostic extends LitSourceFileDiagnosticBase {}

export type LitDiagnostic = LitHtmlDiagnostic | LitCssDiagnostic | LitSourceFileDiagnostic;