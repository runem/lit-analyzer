import { CompletionEntry, CompletionInfo } from "typescript";
import { completionsForHtmlAttrs, completionsForHtmlNodes } from "../../extensions/html/completions";
import { TsLitPluginStore } from "../../state/store";
import { IHtmlNodeAttrBase } from "../../types/html-node-attr-types";
import { HtmlNode } from "../../types/html-node-types";
import { IHtmlPositionContext } from "../../util/get-html-position";
import { intersects } from "../../util/util";

/**
 * Returns completion info based on the position of the cursor using extensions.
 * @param positionContext
 * @param store
 */
export function getCompletionInfoFromHtmlPosition(positionContext: IHtmlPositionContext, store: TsLitPluginStore): CompletionInfo | undefined {
	const { htmlDocument, beforeWord, position } = positionContext;

	// Get possible intersecting html attribute or attribute area.
	const htmlAttr = getIntersectingHtmlAttrName(htmlDocument.rootNodes, position) || undefined;
	const insideAttrAreaNode = getIntersectingHtmlNodeAttrArea(htmlDocument.rootNodes, position);

	// Get entries from the extensions
	let entries: CompletionEntry[] | undefined = [];
	if (htmlAttr != null) {
		entries = completionsForHtmlAttrs(htmlAttr.htmlNode, positionContext, store);

		if (entries != null) {
			// Make sure that every entry overwrites the entire attribute name.
			const { start, end } = htmlAttr.location.name;
			entries = entries.map(entry => ({
				...entry,
				replacementSpan: { start, length: end - start }
			}));
		}
	} else if (insideAttrAreaNode != null) {
		entries = completionsForHtmlAttrs(insideAttrAreaNode, positionContext, store);
	} else if (beforeWord === "<") {
		entries = completionsForHtmlNodes(positionContext, store);
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

/**
 * Loop through a htmlNode or more in order to * find out
 * if the position is inside the part of the start tag where
 * attributes are specified.
 * @param htmlNode
 * @param position
 */
function getIntersectingHtmlNodeAttrArea(htmlNode: HtmlNode | HtmlNode[], position: number): HtmlNode | undefined {
	if (Array.isArray(htmlNode)) {
		// Loop through all nodes in the array. Stop if a result is encountered.
		for (const childNode of htmlNode || []) {
			const res = getIntersectingHtmlNodeAttrArea(childNode, position);
			if (res != null) return res;
		}

		return undefined;
	} else {
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
}

/**
 * Returns a htmlAttr that intersects with position.
 * @param htmlNode
 * @param position
 */
function getIntersectingHtmlAttrName(htmlNode: HtmlNode | HtmlNode[], position: number): IHtmlNodeAttrBase | undefined {
	if (Array.isArray(htmlNode)) {
		// Loop through all nodes in the array. Stop if a result is encountered.
		for (const childNode of htmlNode || []) {
			const res = getIntersectingHtmlAttrName(childNode, position);
			if (res != null) return res;
		}

		return undefined;
	} else {
		// Loop through all attributes of this element.
		// Tests if position intersects with the part of the attribute before "=".
		for (const htmlAttr of htmlNode.attributes || []) {
			if (intersects(position, htmlAttr.location.name)) {
				return htmlAttr;
			}
		}

		return getIntersectingHtmlAttrName(htmlNode.children || [], position);
	}
}
