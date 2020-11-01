import { Element, Node } from "parse5";
import { TS_IGNORE_FLAG } from "../../../../../constants";
import { HtmlNode, HtmlNodeKind, IHtmlNodeBase, IHtmlNodeSourceCodeLocation } from "../../../../../types/html-node/html-node-types";
import { isCommentNode, isTagNode } from "../parse-html-p5/parse-html";
import { parseHtmlNodeAttrs } from "./parse-html-attribute";
import { ParseHtmlContext } from "./parse-html-context";

/**
 * Parses multiple p5Nodes into multiple html nodes.
 * @param p5Nodes
 * @param parent
 * @param context
 */
export function parseHtmlNodes(p5Nodes: Node[], parent: HtmlNode | undefined, context: ParseHtmlContext): HtmlNode[] {
	const htmlNodes: HtmlNode[] = [];
	let ignoreNextNode = false;
	for (const p5Node of p5Nodes) {
		// Check ts-ignore comments and indicate that we wan't to ignore the next node
		if (isCommentNode(p5Node)) {
			if (p5Node.data != null && p5Node.data.includes(TS_IGNORE_FLAG)) {
				ignoreNextNode = true;
			}
		}

		if (isTagNode(p5Node)) {
			if (!ignoreNextNode) {
				const htmlNode = parseHtmlNode(p5Node, parent, context);

				if (htmlNode != null) {
					htmlNodes.push(htmlNode);
				}
			} else {
				ignoreNextNode = false;
			}
		}
	}
	return htmlNodes;
}

/**
 * Parses a single p5Node into a html node.
 * @param p5Node
 * @param parent
 * @param context
 */
export function parseHtmlNode(p5Node: Element, parent: HtmlNode | undefined, context: ParseHtmlContext): HtmlNode | undefined {
	// `sourceCodeLocation` will be undefined if the element was implicitly created by the parser.
	if (p5Node.sourceCodeLocation == null) return undefined;

	const htmlNodeBase: IHtmlNodeBase = {
		tagName: p5Node.tagName.toLowerCase(),
		selfClosed: isSelfClosed(p5Node, context),
		attributes: [],
		location: makeHtmlNodeLocation(p5Node, context),
		children: [],
		document: context.document,
		parent
	};

	const htmlNode = parseHtmlNodeBase(htmlNodeBase);

	// Don't parse children of <style> and <svg> as of now
	if (htmlNode.kind === HtmlNodeKind.NODE) {
		htmlNode.children = parseHtmlNodes(p5Node.childNodes || [], htmlNode, context);
	}

	htmlNode.attributes = parseHtmlNodeAttrs(p5Node, { ...context, htmlNode });

	return htmlNode;
}

/**
 * Returns if this node is self-closed.
 * @param p5Node
 * @param context
 */
function isSelfClosed(p5Node: Element, context: ParseHtmlContext) {
	const isEmpty = p5Node.childNodes == null || p5Node.childNodes.length === 0;
	const isSelfClosed = p5Node.sourceCodeLocation!.startTag.endOffset === p5Node.sourceCodeLocation!.endOffset;
	return isEmpty && isSelfClosed;
}

/**
 * Creates source code location from a p5Node.
 * @param p5Node
 * @param context
 */
function makeHtmlNodeLocation(p5Node: Element, context: ParseHtmlContext): IHtmlNodeSourceCodeLocation {
	const loc = p5Node.sourceCodeLocation!;

	return {
		start: loc.startOffset,
		end: loc.endOffset,
		name: {
			start: loc.startTag.startOffset + 1, // take '<' into account
			end: loc.startTag.startOffset + 1 + p5Node.tagName.length
		},
		startTag: {
			start: loc.startTag.startOffset,
			end: loc.startTag.endOffset
		},
		endTag:
			loc.endTag == null
				? undefined
				: {
						start: loc.endTag.startOffset,
						end: loc.endTag.endOffset
				  }
	};
}

function parseHtmlNodeBase(htmlNodeBase: IHtmlNodeBase): HtmlNode {
	if (htmlNodeBase.tagName === "style") {
		return {
			kind: HtmlNodeKind.STYLE,
			...htmlNodeBase,
			children: []
		};
	} else if (htmlNodeBase.tagName === "svg") {
		// Ignore children of "svg" for now
		return {
			kind: HtmlNodeKind.SVG,
			...htmlNodeBase,
			children: []
		};
	}

	return {
		kind: HtmlNodeKind.NODE,
		...htmlNodeBase
	};

	/*if (component != null) {
	 return {
	 ...htmlNodeBase,
	 kind: HtmlNodeKind.COMPONENT,
	 component
	 };
	 }

	 if (isBuiltInTag(htmlNodeBase.tagName)) {
	 // For now: opt out of svg and style children tags
	 // TODO: Handle svg and style tags
	 const isBlacklisted = ["svg", "style"].includes(htmlNodeBase.tagName);

	 return {
	 ...htmlNodeBase,
	 kind: HtmlNodeKind.BUILT_IN,
	 children: isBlacklisted ? [] : htmlNodeBase.children
	 };
	 }*/

	/*return {
	 kind: HtmlNodeKind.UNKNOWN,
	 ...htmlNodeBase
	 };*/
}
