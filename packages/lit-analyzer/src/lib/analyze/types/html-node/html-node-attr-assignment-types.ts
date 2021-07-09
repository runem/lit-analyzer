import { Expression } from "typescript";
import { Range } from "../range";
import { HtmlNodeAttr } from "./html-node-attr-types";

export enum HtmlNodeAttrAssignmentKind {
	BOOLEAN = "BOOLEAN",
	EXPRESSION = "EXPRESSION",
	STRING = "STRING",
	MIXED = "MIXED"
}

export interface IHtmlNodeAttrAssignmentBase {
	location?: Range;
	htmlAttr: HtmlNodeAttr;
}

export interface IHtmlNodeAttrAssignmentExpression extends IHtmlNodeAttrAssignmentBase {
	kind: HtmlNodeAttrAssignmentKind.EXPRESSION;
	location: Range;
	expression: Expression;
}

export interface IHtmlNodeAttrAssignmentString extends IHtmlNodeAttrAssignmentBase {
	kind: HtmlNodeAttrAssignmentKind.STRING;
	location: Range;
	value: string;
}

export interface IHtmlNodeAttrAssignmentBoolean extends IHtmlNodeAttrAssignmentBase {
	kind: HtmlNodeAttrAssignmentKind.BOOLEAN;
}

export interface IHtmlNodeAttrAssignmentMixed extends IHtmlNodeAttrAssignmentBase {
	kind: HtmlNodeAttrAssignmentKind.MIXED;
	location: Range;
	values: (Expression | string)[];
}

export type HtmlNodeAttrAssignment =
	| IHtmlNodeAttrAssignmentBoolean
	| IHtmlNodeAttrAssignmentExpression
	| IHtmlNodeAttrAssignmentString
	| IHtmlNodeAttrAssignmentMixed;
