import { LitHtmlAttributeModifier } from "../../../../../constants";
import { HtmlNodeAttrAssignment } from "./html-node-attr-assignment-types";
import { HtmlNode } from "./html-node-types";
import { Range } from "../../../../../types/range";

export enum HtmlNodeAttrKind {
	EVENT_LISTENER = "EVENT_LISTENER",
	ATTRIBUTE = "ATTRIBUTE",
	BOOLEAN_ATTRIBUTE = "ATTRIBUTE",
	PROP = "PROP"
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
}

export interface IHtmlNodeAttrProp extends IHtmlNodeAttrBase {
	kind: HtmlNodeAttrKind.PROP;
}

export interface IHtmlNodeBooleanAttribute extends IHtmlNodeAttrBase {
	kind: HtmlNodeAttrKind.BOOLEAN_ATTRIBUTE;
}

export interface IHtmlNodeAttr extends IHtmlNodeAttrBase {
	kind: HtmlNodeAttrKind.ATTRIBUTE;
}

export type HtmlNodeAttr = IHtmlNodeAttrEventListener | IHtmlNodeAttrProp | IHtmlNodeAttr | IHtmlNodeBooleanAttribute;

export function isHTMLAttr(obj: any): obj is IHtmlNodeAttrBase {
	return "name" in obj && "location" in obj && "htmlNode" in obj;
}
