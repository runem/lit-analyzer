import { Node } from "typescript";
import { TextDocument } from "../parse/document/text-document/text-document";
import { HtmlNodeAttr } from "../types/html-node/html-node-attr-types";
import { HtmlNode } from "../types/html-node/html-node-types";
import { DocumentRange, NodeRange } from "../types/lit-range";

export function rangeFromHtmlNodeAttr(document: TextDocument | undefined, htmlAttr: HtmlNodeAttr): DocumentRange {
	return { document: document!, ...htmlAttr.location.name };
}

export function rangeFromHtmlNode(document: TextDocument | undefined, htmlAttr: HtmlNode): DocumentRange {
	return { document: document!, ...htmlAttr.location.name };
}

export function rangeFromNode(node: Node): NodeRange {
	return { node, start: node.getStart(), end: node.getEnd() };
}
