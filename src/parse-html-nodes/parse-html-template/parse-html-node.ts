import { isTagNode } from "../parse-html-p5/parse-html";
import { IP5TagNode, P5Node } from "../parse-html-p5/parse-html-types";
import { IHtmlNodeBase, IHtmlNodeSourceCodeLocation } from "../types/html-node-types";
import { IParseHtmlContext } from "./i-parse-html-context";
import { parseHtmlNodeAttrs } from "./parse-html-attribute";

/**
 * Parses multiple p5Nodes into multiple html nodes.
 * @param p5Nodes
 * @param context
 */
export function parseHtmlNodes(p5Nodes: P5Node[], context: IParseHtmlContext): IHtmlNodeBase[] {
	return p5Nodes.map(child => parseHtmlNode(child, context)).filter((elem): elem is IHtmlNodeBase => elem != null);
}

/**
 * Parses a single p5Node into a html node.
 * @param p5Node
 * @param context
 */
export function parseHtmlNode(p5Node: P5Node, context: IParseHtmlContext): IHtmlNodeBase | undefined {
	// Sometimes "sourceCodeLocation" is "undefined". This isn't a documented "parse5" behavior. TODO: Investigate.
	if (p5Node.sourceCodeLocation == null) return undefined;

	if (isTagNode(p5Node)) {
		const { store } = context;

		const htmlNode = store.extension.parseHtmlNode(p5Node, {
			store,
			htmlNodeBase: {
				tagName: p5Node.tagName,
				selfClosed: isSelfClosed(p5Node, context),
				attributes: [],
				location: makeHtmlNodeLocation(p5Node, context),
				childNodes: parseHtmlNodes(p5Node.childNodes || [], context)
			}
		});

		if (htmlNode == null) return;

		htmlNode.attributes = parseHtmlNodeAttrs(p5Node, { ...context, htmlNode });

		return htmlNode;
	}
}

/**
 * Returns if this node is self-closed.
 * @param p5Node
 * @param context
 */
function isSelfClosed(p5Node: IP5TagNode, context: IParseHtmlContext) {
	const isEmpty = p5Node.childNodes == null || p5Node.childNodes.length === 0;
	const isSelfClosed = p5Node.sourceCodeLocation.startTag.endOffset === p5Node.sourceCodeLocation.endOffset;
	return isEmpty && isSelfClosed;
}

/**
 * Creates source code location from a p5Node.
 * @param p5Node
 * @param context
 */
function makeHtmlNodeLocation(p5Node: IP5TagNode, context: IParseHtmlContext): IHtmlNodeSourceCodeLocation {
	const loc = p5Node.sourceCodeLocation;
	const get = context.getSourceCodeLocation;

	return {
		start: get(loc.startOffset),
		end: get(loc.endOffset),
		name: {
			start: get(loc.startTag.startOffset) + 1, // take '<' into account
			end: get(loc.startTag.startOffset) + 1 + p5Node.tagName.length
		},
		startTag: {
			start: get(loc.startTag.startOffset),
			end: get(loc.startTag.endOffset)
		},
		endTag:
			loc.endTag == null
				? undefined
				: {
						start: get(loc.endTag.startOffset),
						end: get(loc.endTag.endOffset)
				  }
	};
}
