import { SimpleType } from "ts-simple-type";
import { SourceFile } from "typescript";
import { ComponentDefinition } from "web-component-analyzer";
import { LitAnalyzerRuleName } from "../lit-analyzer-config";
import { HtmlAttr, HtmlAttrTarget } from "../parse/parse-html-data/html-tag";
import { IHtmlNodeAttrAssignmentExpression } from "./html-node/html-node-attr-assignment-types";
import { HtmlNodeAttr, IHtmlNodeAttr } from "./html-node/html-node-attr-types";
import { HtmlNode } from "./html-node/html-node-types";
import { DocumentRange, SourceFileRange } from "./lit-range";

export enum LitHtmlDiagnosticKind {
	MISSING_IMPORT = "MISSING_IMPORT",
	MISSING_REQUIRED_ATTRS = "MISSING_REQUIRED_ATTRIBUTES",
	UNKNOWN_TARGET = "UNKNOWN_TARGET",
	UNKNOWN_TAG = "UNKNOWN_TAG",
	TAG_NOT_CLOSED = "TAG_NOT_CLOSED",
	BOOL_MOD_ON_NON_BOOL = "BOOL_MOD_ON_NON_BOOL",
	PROPERTY_NEEDS_EXPRESSION = "PROPERTY_NEEDS_EXPRESSION",
	NO_EVENT_LISTENER_FUNCTION = "NO_EVENT_LISTENER_FUNCTION",
	PRIMITIVE_NOT_ASSIGNABLE_TO_COMPLEX = "PRIMITIVE_NOT_BINDING_IN_ATTRIBUTE_BINDING",
	COMPLEX_NOT_BINDABLE_IN_ATTRIBUTE_BINDING = "COMPLEX_NOT_BINDABLE_IN_ATTRIBUTE_BINDING",
	EXPRESSION_ONLY_ASSIGNABLE_WITH_BOOLEAN_BINDING = "EXPRESSION_ONLY_ASSIGNABLE_WITH_BOOLEAN_BINDING",
	INVALID_ATTRIBUTE_EXPRESSION_TYPE_UNDEFINED = "INVALID_ATTRIBUTE_EXPRESSION_TYPE_UNDEFINED",
	INVALID_ATTRIBUTE_EXPRESSION_TYPE_NULL = "INVALID_ATTRIBUTE_EXPRESSION_TYPE_NULL",
	INVALID_ATTRIBUTE_EXPRESSION_TYPE = "INVALID_ATTRIBUTE_EXPRESSION_TYPE",
	INVALID_SLOT_NAME = "INVALID_SLOT_NAME",
	MISSING_SLOT_ATTRIBUTE = "MISSING_SLOT_ATTRIBUTE",
	DIRECTIVE_NOT_ALLOWED_HERE = "DIRECTIVE_NOT_ALLOWED_HERE",
	INVALID_MIXED_BINDING = "INVALID_MIXED_BINDING"
}

export type LitDiagnosticSeverity = "error" | "warning";

export interface LitDiagnosticBase {
	location: SourceFileRange;
	message: string;
	fix?: string;
	source: LitAnalyzerRuleName;
	suggestion?: string;
	severity: LitDiagnosticSeverity;
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
	typeA: SimpleType;
	typeB: SimpleType;
}

export interface LitHtmlDiagnosticPrimitiveNotAssignableToComplex extends LitDocumentDiagnosticBase {
	kind: LitHtmlDiagnosticKind.PRIMITIVE_NOT_ASSIGNABLE_TO_COMPLEX;
	htmlAttr: HtmlNodeAttr;
	typeA: SimpleType;
	typeB: SimpleType;
}

export interface LitHtmlDiagnosticHtmlNoEventListenerFunction extends LitDocumentDiagnosticBase {
	kind: LitHtmlDiagnosticKind.NO_EVENT_LISTENER_FUNCTION;
	typeB: SimpleType;
}

export interface LitHtmlDiagnosticHtmlInvalidAttributeExpressionType extends LitDocumentDiagnosticBase {
	kind: LitHtmlDiagnosticKind.INVALID_ATTRIBUTE_EXPRESSION_TYPE;
	htmlAttr: HtmlNodeAttr;
	typeA: SimpleType;
	typeB: SimpleType;
}

export interface LitHtmlDiagnosticHtmlInvalidAttributeExpressionTypeUndefined extends LitDocumentDiagnosticBase {
	kind: LitHtmlDiagnosticKind.INVALID_ATTRIBUTE_EXPRESSION_TYPE_UNDEFINED;
	htmlAttr: IHtmlNodeAttr & { assignment: IHtmlNodeAttrAssignmentExpression };
	typeA: SimpleType;
	typeB: SimpleType;
}

export interface LitHtmlDiagnosticHtmlInvalidAttributeExpressionTypeNull extends LitDocumentDiagnosticBase {
	kind: LitHtmlDiagnosticKind.INVALID_ATTRIBUTE_EXPRESSION_TYPE_NULL;
	htmlAttr: IHtmlNodeAttr & { assignment: IHtmlNodeAttrAssignmentExpression };
	typeA: SimpleType;
	typeB: SimpleType;
}

export interface LitHtmlDiagnosticHtmlExpressionOnlyAssignableWithBooleanBinding extends LitDocumentDiagnosticBase {
	kind: LitHtmlDiagnosticKind.EXPRESSION_ONLY_ASSIGNABLE_WITH_BOOLEAN_BINDING;
	htmlAttr: HtmlNodeAttr;
	typeA: SimpleType;
	typeB: SimpleType;
}

export interface LitHtmlDiagnosticComplexNotBindableInAttributeBinding extends LitDocumentDiagnosticBase {
	kind: LitHtmlDiagnosticKind.COMPLEX_NOT_BINDABLE_IN_ATTRIBUTE_BINDING;
	htmlAttr: HtmlNodeAttr;
	typeA: SimpleType;
	typeB: SimpleType;
}

export interface LitHtmlDiagnosticHtmlPropertyNeedsExpression extends LitDocumentDiagnosticBase {
	kind: LitHtmlDiagnosticKind.PROPERTY_NEEDS_EXPRESSION;
}

export interface LitHtmlDiagnosticHtmlDirectiveNotAllowedHere extends LitDocumentDiagnosticBase {
	kind: LitHtmlDiagnosticKind.DIRECTIVE_NOT_ALLOWED_HERE;
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

export interface LitHtmlDiagnosticInvalidMixedBinding extends LitDocumentDiagnosticBase {
	kind: LitHtmlDiagnosticKind.INVALID_MIXED_BINDING;
}

export type LitHtmlDiagnostic =
	| LitHtmlDiagnosticUnknownTag
	| LitHtmlDiagnosticMissingImport
	| LitHtmlDiagnosticMissingProps
	| LitHtmlDiagnosticHtmlBoolMod
	| LitHtmlDiagnosticUnknownMember
	| LitHtmlDiagnosticHtmlDirectiveNotAllowedHere
	| LitHtmlDiagnosticPrimitiveNotAssignableToComplex
	| LitHtmlDiagnosticHtmlInvalidAttributeExpressionType
	| LitHtmlDiagnosticHtmlInvalidAttributeExpressionTypeUndefined
	| LitHtmlDiagnosticHtmlInvalidAttributeExpressionTypeNull
	| LitHtmlDiagnosticHtmlNoEventListenerFunction
	| LitHtmlDiagnosticComplexNotBindableInAttributeBinding
	| LitHtmlDiagnosticHtmlPropertyNeedsExpression
	| LitHtmlDiagnosticHtmlExpressionOnlyAssignableWithBooleanBinding
	| LitHtmlDiagnosticInvalidSlotName
	| LitHtmlDiagnosticMissingSlotAttr
	| LitHtmlDiagnosticInvalidMixedBinding
	| LitHtmlDiagnosticTagNotClosed;

export interface LitCssDiagnostic extends LitDocumentDiagnosticBase {}

export interface LitSourceFileDiagnostic extends LitSourceFileDiagnosticBase {}

export type LitDiagnostic = LitHtmlDiagnostic | LitCssDiagnostic | LitSourceFileDiagnostic;
