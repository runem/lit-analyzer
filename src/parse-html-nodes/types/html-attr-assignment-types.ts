import { SimpleType } from "ts-is-assignable";
import { Type } from "typescript";

export type HtmlAttrAssignmentType = Type | SimpleType;

export interface IHtmlAttrAssignment {
	value?: string;
	isBooleanAssignment: boolean;
	isMixedExpression: boolean;
	typeA: HtmlAttrAssignmentType;
	typeB: HtmlAttrAssignmentType;
}
