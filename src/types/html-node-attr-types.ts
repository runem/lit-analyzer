import { LitHtmlAttributeModifier } from "../constants";
import { IComponentDeclaration, IComponentDeclarationProp } from "../parsing/parse-components/component-types";
import { HtmlNodeAttrAssignment } from "./html-node-attr-assignment-types";
import { HtmlNode } from "./html-node-types";
import { Range } from "./range";

export enum HtmlNodeAttrKind {
	EVENT_LISTENER = "EVENT_LISTENER",
	ATTRIBUTE = "ATTRIBUTE",
	BOOLEAN_ATTRIBUTE = "ATTRIBUTE",
	PROP = "PROP",

	// DEPRECATED
	CUSTOM_PROP = "CUSTOM_PROP",
	BUILT_IN = "BUILT_IN",
	KNOWN = "KNOWN",
	UNKNOWN = "UNKNOWN"
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

export interface IHtmlNodeAttrCustomProp extends IHtmlNodeAttrBase {
	kind: HtmlNodeAttrKind.CUSTOM_PROP;
	prop: IComponentDeclarationProp;
	component: IComponentDeclaration;
}

export interface IHtmlNodeAttrEventListener extends IHtmlNodeAttrBase {
	kind: HtmlNodeAttrKind.EVENT_LISTENER;
}

export interface IHtmlNodeAttrBuiltIn extends IHtmlNodeAttrBase {
	kind: HtmlNodeAttrKind.BUILT_IN;
}

export interface IHtmlNodeAttrUnknown extends IHtmlNodeAttrBase {
	kind: HtmlNodeAttrKind.UNKNOWN;
}

export interface IHtmlNodeAttrProp extends IHtmlNodeAttrBase {
	kind: HtmlNodeAttrKind.PROP;
}

export interface IHtmlNodeBooleanAttribute extends IHtmlNodeAttrBase {
	kind: HtmlNodeAttrKind.ATTRIBUTE;
}

export interface IHtmlNodeAttr extends IHtmlNodeAttrBase {
	kind: HtmlNodeAttrKind.ATTRIBUTE;
}

export type HtmlNodeAttr = IHtmlNodeAttrCustomProp | IHtmlNodeAttrBuiltIn | IHtmlNodeAttrUnknown | IHtmlNodeAttrEventListener | IHtmlNodeAttrProp | IHtmlNodeAttr | IHtmlNodeBooleanAttribute;

export function isHTMLAttr(obj: any): obj is IHtmlNodeAttrBase {
	return "name" in obj && "location" in obj && "htmlNode" in obj;
}
