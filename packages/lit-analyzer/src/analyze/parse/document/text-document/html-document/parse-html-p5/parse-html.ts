import { IP5CommentNode, IP5DocumentFragmentNode, IP5TagNode, IP5TextNode, P5Node } from "./parse-html-types";

const { parseFragment } = require("parse5");

/**
 * Returns if a p5Node is a tag node.
 * @param node
 */
export function isTagNode(node: P5Node): node is IP5TagNode {
	return !node.nodeName.includes("#");
}

/**
 * Returns if a p5Node is a document fragment.
 * @param node
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isDocumentFragmentNode(node: any): node is IP5DocumentFragmentNode {
	return node.nodeName === "#document-fragment";
}

/**
 * Returns if a p5Node is a text node.
 * @param node
 */
export function isTextNode(node: P5Node): node is IP5TextNode {
	return node.nodeName === "#text";
}

/**
 * Returns if a p5Node is a comment node.
 * @param node
 */
export function isCommentNode(node: P5Node): node is IP5CommentNode {
	return node.nodeName === "#comment";
}

/**
 * Parse a html string into p5Nodes.
 * @param html
 */
export function parseHtml(html: string): IP5DocumentFragmentNode {
	return parseFragment(html, { sourceCodeLocationInfo: true, locationInfo: true });
}
