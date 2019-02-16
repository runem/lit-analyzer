import { SimpleType } from "ts-simple-type";
import { Type } from "typescript";

export type HtmlNodeAttrAssignmentType = Type | SimpleType;

export interface IHtmlNodeAttrAssignmentBase {
	value?: string;
	isBooleanAssignment: boolean;
	isMixedExpression: boolean;
	typeB: HtmlNodeAttrAssignmentType;
}

export interface IHtmlNodeAttrAssignment extends IHtmlNodeAttrAssignmentBase {}

export type HtmlNodeAttrAssignment = IHtmlNodeAttrAssignment;
