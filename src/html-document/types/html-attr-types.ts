import { IComponentDeclaration, IComponentDeclarationProp } from "../../parse-components/component-types";
import { Range } from "../../types/range";
import { IHtmlAttrAssignment } from "./html-attr-assignment-types";
import { HtmlNode } from "./html-node-types";

export enum HtmlAttrKind {
	CUSTOM_PROP = "CUSTOM_PROP",
	BUILT_IN = "BUILT_IN",
	UNKNOWN = "UNKNOWN"
}

export interface IHtmlAttrSourceCodeLocation extends Range {
	name: Range;
}

export interface IHtmlAttrBase {
	name: string;
	modifier?: string;
	location: IHtmlAttrSourceCodeLocation;
	assignment?: IHtmlAttrAssignment;
	htmlNode: HtmlNode;
}

export interface IHtmlAttrCustomProp extends IHtmlAttrBase {
	kind: HtmlAttrKind.CUSTOM_PROP;
	prop: IComponentDeclarationProp;
	component: IComponentDeclaration;
}

export interface IHtmlAttrBuiltIn extends IHtmlAttrBase {
	kind: HtmlAttrKind.BUILT_IN;
}

export interface IHtmlAttrUnknown extends IHtmlAttrBase {
	kind: HtmlAttrKind.UNKNOWN;
}

export type HtmlAttr = IHtmlAttrCustomProp | IHtmlAttrBuiltIn | IHtmlAttrUnknown;

export function isHTMLAttr(obj: any): obj is IHtmlAttrBase {
	return "name" in obj && "location" in obj && "htmlNode" in obj;
}
