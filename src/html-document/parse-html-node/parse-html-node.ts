import { logger } from "../../util/logger";
import { isCommentNode, isTagNode } from "../parse-html-p5/parse-html";
import { IP5TagNode, P5Node } from "../parse-html-p5/parse-html-types";
import { HtmlNode, IHtmlNodeSourceCodeLocation } from "../types/html-node-types";
import { parseHtmlNodeAttrs } from "./parse-html-attribute";
import { ParseHtmlContext } from "./types/parse-html-context";

/**
 * Parses multiple p5Nodes into multiple html nodes.
 * @param p5Nodes
 * @param context
 */
export function parseHtmlNodes(p5Nodes: P5Node[], context: ParseHtmlContext): HtmlNode[] {
	const htmlNodes: HtmlNode[] = [];
	let ignoreNextNode = false;
	for (const p5Node of p5Nodes) {
		// Check ts-ignore comments and indicate that we wan't to ignore the next node
		if (isCommentNode(p5Node)) {
			if (p5Node.data != null && p5Node.data.includes("@ts-ignore")) {
				ignoreNextNode = true;
			}
		}

		if (isTagNode(p5Node)) {
			if (!ignoreNextNode) {
				const htmlNode = parseHtmlNode(p5Node, context);

				if (htmlNode != null) {
					htmlNodes.push(htmlNode);
				}
			} else {
				logger.debug("Ignoring node", p5Node.tagName);
				ignoreNextNode = false;
			}
		}
	}
	return htmlNodes;
}

/**
 * Parses a single p5Node into a html node.
 * @param p5Node
 * @param context
 */
export function parseHtmlNode(p5Node: IP5TagNode, context: ParseHtmlContext): HtmlNode | undefined {
	// `sourceCodeLocation` will be undefined if the element was implicitly created by the parser.
	if (p5Node.sourceCodeLocation == null) return undefined;

	const { store } = context;

	const htmlNode = store.extension.parseHtmlNode(p5Node, {
		store,
		htmlNodeBase: {
			tagName: p5Node.tagName,
			selfClosed: isSelfClosed(p5Node, context),
			attributes: [],
			location: makeHtmlNodeLocation(p5Node, context),
			children: parseHtmlNodes(p5Node.childNodes || [], context)
		}
	});

	if (htmlNode == null) return;

	htmlNode.attributes = parseHtmlNodeAttrs(p5Node, { ...context, htmlNode });

	return htmlNode;
}

/**
 * Returns if this node is self-closed.
 * @param p5Node
 * @param context
 */
function isSelfClosed(p5Node: IP5TagNode, context: ParseHtmlContext) {
	const isEmpty = p5Node.childNodes == null || p5Node.childNodes.length === 0;
	const isSelfClosed = p5Node.sourceCodeLocation.startTag.endOffset === p5Node.sourceCodeLocation.endOffset;
	return isEmpty && isSelfClosed;
}

/**
 * Creates source code location from a p5Node.
 * @param p5Node
 * @param context
 */
function makeHtmlNodeLocation(p5Node: IP5TagNode, context: ParseHtmlContext): IHtmlNodeSourceCodeLocation {
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
