import { IComponentDeclarationProp } from "../parsing/parse-components/component-types";

export enum HtmlReportKind {
	MISSING_IMPORT = "MISSING_IMPORT",
	MISSING_PROPS = "MISSING_ATTRIBUTES",
	UNKNOWN = "UNKNOWN",
	TAG_NOT_CLOSED = "TAG_NOT_CLOSED",
	LIT_BOOL_MOD_ON_NON_BOOL = "LIT_BOOL_MOD_ON_NON_BOOL",
	LIT_PRIMITIVE_NOT_ASSIGNABLE_TO_COMPLEX = "LIT_PRIMITIVE_NOT_ASSIGNABLE_TO_COMPLEX",
	LIT_INVALID_ATTRIBUTE_EXPRESSION_TYPE = "LIT_INVALID_ATTRIBUTE_EXPRESSION_TYPE"
}

export interface IHtmlReportBase {
	kind: string;
}

export interface IHtmlReportUnknown extends IHtmlReportBase {
	kind: HtmlReportKind.UNKNOWN;
	suggestedName?: string;
}

export interface IHtmlReportMissingImport extends IHtmlReportBase {
	kind: HtmlReportKind.MISSING_IMPORT;
}

export interface IHtmlReportMissingProps extends IHtmlReportBase {
	kind: HtmlReportKind.MISSING_PROPS;
	props: IComponentDeclarationProp[];
}

export interface IHtmlReportTagNotClosed extends IHtmlReportBase {
	kind: HtmlReportKind.TAG_NOT_CLOSED;
}

interface IHtmlReportLitHtmlBoolMod extends IHtmlReportBase {
	kind: HtmlReportKind.LIT_BOOL_MOD_ON_NON_BOOL;
	typeA: string;
	typeB: string;
}

interface IHtmlReportLitHtmlPrimitiveNotAssignableToComplex extends IHtmlReportBase {
	kind: HtmlReportKind.LIT_PRIMITIVE_NOT_ASSIGNABLE_TO_COMPLEX;
	isBooleanAssignment: boolean;
	typeA: string;
	typeB: string;
}

interface IHtmlReportLitHtmlInvalidAttributeExpressionType extends IHtmlReportBase {
	kind: HtmlReportKind.LIT_INVALID_ATTRIBUTE_EXPRESSION_TYPE;
	typeA: string;
	typeB: string;
}

export type HtmlReport =
	| IHtmlReportUnknown
	| IHtmlReportMissingImport
	| IHtmlReportMissingProps
	| IHtmlReportLitHtmlBoolMod
	| IHtmlReportLitHtmlPrimitiveNotAssignableToComplex
	| IHtmlReportLitHtmlInvalidAttributeExpressionType
	| IHtmlReportTagNotClosed;
