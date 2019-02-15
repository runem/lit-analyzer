import { IComponentDeclaration } from "../parsing/parse-components/component-types";
import { HtmlTag } from "../parsing/parse-data/html-tag";
import { HtmlNodeAttr } from "./html-node-attr-types";
import { Range } from "./range";

export interface IHtmlNodeSourceCodeLocation extends Range {
	name: Range;
	startTag: Range;
	endTag?: Range;
}

export enum HtmlNodeKind {
	NODE = "NODE",
	STYLE = "STYLE",

	// OUTDATED
	KNOWN = "KNOWN",
	UNKNOWN = "UNKNOWN",
	COMPONENT = "COMPONENT",
	BUILT_IN = "BUILT_IN"
}

export interface IHtmlNodeBase {
	tagName: string;
	location: IHtmlNodeSourceCodeLocation;
	attributes: HtmlNodeAttr[];
	children: HtmlNode[];
	selfClosed: boolean;
}

export interface IHtmlNodeComponent extends IHtmlNodeBase {
	kind: HtmlNodeKind.COMPONENT;
	component: IComponentDeclaration;
}

export interface IHtmlNodeKnown extends IHtmlNodeBase {
	kind: HtmlNodeKind.KNOWN;
	tag: HtmlTag;
}

export interface IHtmlNodeBuiltIn extends IHtmlNodeBase {
	kind: HtmlNodeKind.BUILT_IN;
}

export interface IHtmlNodeUnknown extends IHtmlNodeBase {
	kind: HtmlNodeKind.UNKNOWN;
}

export interface IHtmlNode extends IHtmlNodeBase {
	kind: HtmlNodeKind.NODE;
}

export interface IHtmlNodeStyle extends IHtmlNodeBase {
	kind: HtmlNodeKind.STYLE;
}

export type HtmlNode = IHtmlNode | IHtmlNodeStyle | IHtmlNodeComponent | IHtmlNodeBuiltIn | IHtmlNodeUnknown | IHtmlNodeKnown;

export function isHTMLNode(obj: any): obj is IHtmlNodeBase {
	return "tagName" in obj && "location" in obj && "attributes" in obj;
}
