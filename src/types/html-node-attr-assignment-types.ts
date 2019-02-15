import { SimpleType } from "ts-simple-type";
import { Type } from "typescript";

export type HtmlNodeAttrAssignmentType = Type | SimpleType;

export enum HtmlNodeAttrAssignmentKind {
	ASSIGNMENT = "EVENT_LISTENER",
	ATTRIBUTE = "ATTRIBUTE",
	BOOLEAN_ATTRIBUTE = "ATTRIBUTE",
	PROP = "PROP",

	// DEPRECATED
	CUSTOM_PROP = "CUSTOM_PROP",
	BUILT_IN = "BUILT_IN",
	KNOWN = "KNOWN",
	UNKNOWN = "UNKNOWN"
}

export interface IHtmlNodeAttrAssignmentBase {
	value?: string;
	isBooleanAssignment: boolean;
	isMixedExpression: boolean;
	typeB: HtmlNodeAttrAssignmentType;
}

export interface IHtmlNodeAttrAssignment extends IHtmlNodeAttrAssignmentBase {
	//typeA: HtmlAttrAssignmentType;
}

export type HtmlNodeAttrAssignment = IHtmlNodeAttrAssignment;
