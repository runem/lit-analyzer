import { HtmlNodeAttr } from "./html-node-attr-types";
import { Range } from "../range";

export interface IHtmlNodeSourceCodeLocation extends Range {
	name: Range;
	startTag: Range;
	endTag?: Range;
}

export enum HtmlNodeKind {
	NODE = "NODE",
	SVG = "SVG",
	STYLE = "STYLE"
}

export interface IHtmlNodeBase {
	tagName: string;
	location: IHtmlNodeSourceCodeLocation;
	attributes: HtmlNodeAttr[];
	parent?: HtmlNode;
	children: HtmlNode[];
	selfClosed: boolean;
}

export interface IHtmlNode extends IHtmlNodeBase {
	kind: HtmlNodeKind.NODE;
}

export interface IHtmlNodeStyleTag extends IHtmlNodeBase {
	kind: HtmlNodeKind.STYLE;
}

export interface IHtmlNodeSvgTag extends IHtmlNodeBase {
	kind: HtmlNodeKind.SVG;
}

export type HtmlNode = IHtmlNode | IHtmlNodeStyleTag | IHtmlNodeSvgTag;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isHTMLNode(obj: any): obj is IHtmlNodeBase {
	return "tagName" in obj && "location" in obj && "attributes" in obj;
}
