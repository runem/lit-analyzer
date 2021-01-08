import { parseFragment, Element, DocumentFragment, Node, TextNode, CommentNode } from "parse5";

/**
 * Returns if a p5Node is a tag node.
 * @param node
 */
export function isTagNode(node: Node): node is Element {
	return !node.nodeName.includes("#");
}

/**
 * Returns if a p5Node is a document fragment.
 * @param node
 */
export function isDocumentFragmentNode(node: Node): node is DocumentFragment {
	return node.nodeName === "#document-fragment";
}

/**
 * Returns if a p5Node is a text node.
 * @param node
 */
export function isTextNode(node: Node): node is TextNode {
	return node.nodeName === "#text";
}

/**
 * Returns if a p5Node is a comment node.
 * @param node
 */
export function isCommentNode(node: Node): node is CommentNode {
	return node.nodeName === "#comment";
}

/**
 * Parse a html string into p5Nodes.
 * @param html
 */
export function parseHtml(html: string): DocumentFragment {
	return parseFragment(html, { sourceCodeLocationInfo: true });
}
