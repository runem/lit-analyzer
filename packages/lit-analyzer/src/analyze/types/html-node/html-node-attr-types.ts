import { LitHtmlAttributeModifier } from "../../constants";
import { HtmlNodeAttrAssignment } from "./html-node-attr-assignment-types";
import { HtmlNode } from "./html-node-types";
import { Range } from "../range";

export enum HtmlNodeAttrKind {
	EVENT_LISTENER = "EVENT_LISTENER",
	ATTRIBUTE = "ATTRIBUTE",
	BOOLEAN_ATTRIBUTE = "BOOLEAN_ATTRIBUTE",
	PROPERTY = "PROPERTY"
}

export interface IHtmlNodeAttrSourceCodeLocation extends Range {
	name: Range;
}

export interface IHtmlNodeAttrBase {
	name: string;
	modifier?: LitHtmlAttributeModifier;
	location: IHtmlNodeAttrSourceCodeLocation;
	assignment?: HtmlNodeAttrAssignment;
	htmlNode: HtmlNode;
}

export interface IHtmlNodeAttrEventListener extends IHtmlNodeAttrBase {
	kind: HtmlNodeAttrKind.EVENT_LISTENER;
	modifier: "@";
}

export interface IHtmlNodeAttrProp extends IHtmlNodeAttrBase {
	kind: HtmlNodeAttrKind.PROPERTY;
	modifier: ".";
}

export interface IHtmlNodeBooleanAttribute extends IHtmlNodeAttrBase {
	kind: HtmlNodeAttrKind.BOOLEAN_ATTRIBUTE;
	modifier: "?";
}

export interface IHtmlNodeAttr extends IHtmlNodeAttrBase {
	kind: HtmlNodeAttrKind.ATTRIBUTE;
	modifier: undefined;
}

export type HtmlNodeAttr = IHtmlNodeAttrEventListener | IHtmlNodeAttrProp | IHtmlNodeAttr | IHtmlNodeBooleanAttribute;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isHTMLAttr(obj: any): obj is IHtmlNodeAttrBase {
	return "name" in obj && "location" in obj && "htmlNode" in obj;
}
