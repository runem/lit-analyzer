import { HtmlNodeAttr } from "./html-node-attr-types";
import { Range } from "./range";

export interface IHtmlNodeSourceCodeLocation extends Range {
	name: Range;
	startTag: Range;
	endTag?: Range;
}

export enum HtmlNodeKind {
	NODE = "NODE",
	STYLE = "STYLE"
}

export interface IHtmlNodeBase {
	tagName: string;
	location: IHtmlNodeSourceCodeLocation;
	attributes: HtmlNodeAttr[];
	children: HtmlNode[];
	selfClosed: boolean;
}

export interface IHtmlNode extends IHtmlNodeBase {
	kind: HtmlNodeKind.NODE;
}

export interface IHtmlNodeStyleTag extends IHtmlNodeBase {
	kind: HtmlNodeKind.STYLE;
}

export type HtmlNode = IHtmlNode | IHtmlNodeStyleTag;

export function isHTMLNode(obj: any): obj is IHtmlNodeBase {
	return "tagName" in obj && "location" in obj && "attributes" in obj;
}
