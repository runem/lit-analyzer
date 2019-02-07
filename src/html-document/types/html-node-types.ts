import { IComponentDeclaration } from "../../parse-components/component-types";
import { IHtmlAttrBase } from "./html-attr-types";
import { Range } from "../../types/range";

export interface IHtmlNodeSourceCodeLocation extends Range {
	name: Range;
	startTag: Range;
	endTag?: Range;
}

export enum HtmlNodeKind {
	COMPONENT = "COMPONENT",
	BUILT_IN = "BUILT_IN",
	UNKNOWN = "UNKNOWN"
}

export interface IHtmlNodeBase {
	tagName: string;
	location: IHtmlNodeSourceCodeLocation;
	attributes: IHtmlAttrBase[];
	children: IHtmlNodeBase[];
	selfClosed: boolean;
}

export interface IHtmlNodeCustomElement extends IHtmlNodeBase {
	kind: HtmlNodeKind.COMPONENT;
	component: IComponentDeclaration;
}

export interface IHtmlNodeBuiltIn extends IHtmlNodeBase {
	kind: HtmlNodeKind.BUILT_IN;
}

export interface IHtmlNodeUnknown extends IHtmlNodeBase {
	kind: HtmlNodeKind.UNKNOWN;
}

export type HtmlNode = IHtmlNodeCustomElement | IHtmlNodeBuiltIn | IHtmlNodeUnknown;

export function isHTMLNode(obj: any): obj is IHtmlNodeBase {
	return "tagName" in obj && "location" in obj && "attributes" in obj;
}
