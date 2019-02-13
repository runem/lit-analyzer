import { CompletionEntry, CompletionInfo } from "typescript";
import { CssDocument } from "../../parsing/text-document/css-document/css-document";
import { HtmlDocument } from "../../parsing/text-document/html-document/html-document";
import { TextDocument } from "../../parsing/text-document/text-document";
import { HtmlNodeAttr } from "../../types/html-node-attr-types";
import { HtmlNode } from "../../types/html-node-types";
import { DocumentPositionContext } from "../../util/get-html-position";
import { logger } from "../../util/logger";
import { intersects } from "../../util/util";
import { VscodeCssServiceWrapper } from "../css-document/vscode-css-languageservice/vscode-css-service-wrapper";
import { DiagnosticsContext } from "../diagnostics-context";
import { completionsForHtmlAttrs, completionsForHtmlNodes } from "../html-document/completions";

export function getCompletionInfoFromPosition(document: TextDocument, positionContext: DocumentPositionContext, context: DiagnosticsContext): CompletionInfo | undefined {
	const { beforeWord, position } = positionContext;

	if (document instanceof CssDocument) {
		return new VscodeCssServiceWrapper(document).getCompletionInfoAtPosition(positionContext.positionInText);
	} else if (document instanceof HtmlDocument) {
		// Get possible intersecting html attribute or attribute area.
		const htmlAttrName = getIntersectingHtmlAttrName(document.rootNodes, position) || undefined;
		const htmlAttrValue = getIntersectingHtmlAttrValue(document.rootNodes, position);
		const insideAttrAreaNode = getIntersectingHtmlNodeAttrArea(document.rootNodes, position);

		// Get entries from the extensions
		let entries: CompletionEntry[] | undefined = [];
		if (htmlAttrName != null) {
			entries = completionsForHtmlAttrs(htmlAttrName.htmlNode, positionContext, context);

			if (entries != null) {
				// Make sure that every entry overwrites the entire attribute name.
				const { start, end } = htmlAttrName.location.name;
				entries = entries.map(entry => ({
					...entry,
					replacementSpan: { start, length: end - start }
				}));
			}
		} else if (htmlAttrValue != null && ['"', "'", "="].includes(beforeWord)) {
			logger.debug(htmlAttrValue);
		} else if (insideAttrAreaNode != null) {
			entries = completionsForHtmlAttrs(insideAttrAreaNode, positionContext, context);
		} else if (beforeWord === "<") {
			entries = completionsForHtmlNodes(positionContext, context);
		}

		// Return completion info
		if (entries != null && entries.length > 0) {
			return {
				isGlobalCompletion: false,
				isMemberCompletion: false,
				isNewIdentifierLocation: false,
				entries
			};
		}
	}
}

/**
 * Traverses the html nodes and returns the first match if any exists.
 * @param htmlNode
 * @param position
 * @param traverser
 */
function traverseHtmlNodes<T>(htmlNode: HtmlNode[], position: number, traverser: (htmlNode: HtmlNode | HtmlNode[], position: number) => T | undefined): T | undefined {
	// Loop through all nodes in the array. Stop if a result is encountered.
	for (const childNode of htmlNode || []) {
		const res = traverser(childNode, position);
		if (res != null) return res;
	}

	return undefined;
}

/**
 * Loop through a htmlNode or more in order to * find out
 * if the position is inside the part of the start tag where
 * attributes are specified.
 * @param htmlNode
 * @param position
 */
function getIntersectingHtmlNodeAttrArea(htmlNode: HtmlNode | HtmlNode[], position: number): HtmlNode | undefined {
	if (Array.isArray(htmlNode)) {
		return traverseHtmlNodes(htmlNode, position, getIntersectingHtmlNodeAttrArea);
	}

	// Tests if the position is inside the start tag
	outer: if (position > htmlNode.location.name.end && intersects(position, htmlNode.location.startTag)) {
		// Check if the position intersects any attributes. Break if so.
		for (const htmlAttr of htmlNode.attributes) {
			if (intersects(position, htmlAttr.location)) {
				break outer;
			}
		}

		return htmlNode;
	}

	// Check recursively on all child nodes.
	return getIntersectingHtmlNodeAttrArea(htmlNode.children || [], position);
}

/**
 * Returns a htmlAttr that intersects with position.
 * @param htmlNode
 * @param position
 */
function getIntersectingHtmlAttrName(htmlNode: HtmlNode | HtmlNode[], position: number): HtmlNodeAttr | undefined {
	if (Array.isArray(htmlNode)) {
		return traverseHtmlNodes(htmlNode, position, getIntersectingHtmlAttrName);
	}

	// Loop through all attributes of this element.
	// Tests if position intersects with the part of the attribute before "=".
	for (const htmlAttr of htmlNode.attributes || []) {
		if (intersects(position, htmlAttr.location.name)) {
			return htmlAttr;
		}
	}

	return getIntersectingHtmlAttrName(htmlNode.children || [], position);
}

/**
 * Returns a htmlAttrValue that intersects with position.
 * @param htmlNode
 * @param position
 */
function getIntersectingHtmlAttrValue(htmlNode: HtmlNode | HtmlNode[], position: number): HtmlNodeAttr | undefined {
	if (Array.isArray(htmlNode)) {
		return traverseHtmlNodes(htmlNode, position, getIntersectingHtmlAttrValue);
	}

	// Loop through all attributes of this element.
	// Tests if position intersects with the part of the attribute before "=".
	for (const htmlAttr of htmlNode.attributes || []) {
		if (htmlAttr.assignment != null) {
			const start = htmlAttr.location.name.end;
			const end = htmlAttr.location.end;
			if (intersects(position, { start, end })) {
				return htmlAttr;
			}
		}
	}

	return getIntersectingHtmlAttrValue(htmlNode.children || [], position);
}
