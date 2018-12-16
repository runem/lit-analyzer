import { CompletionEntry, CompletionInfo } from "typescript";
import { ITsHtmlExtensionCompletionContext } from "../../extensions/i-ts-html-extension";
import { IHtmlAttrBase } from "../../parse-html-nodes/types/html-attr-types";
import { IHtmlNodeBase } from "../../parse-html-nodes/types/html-node-types";
import { TsHtmlPluginStore } from "../../state/store";
import { IHtmlPositionContext } from "../../util/get-html-position";
import { intersects } from "../../util/util";

/**
 * Returns completion info based on the position of the cursor using extensions.
 * @param htmlPosition
 * @param store
 */
export function getCompletionInfoFromHtmlPosition(htmlPosition: IHtmlPositionContext, store: TsHtmlPluginStore): CompletionInfo | undefined {
	const { htmlTemplate, beforeWord, position } = htmlPosition;

	// Get possible intersecting html attribute or attribute area.
	const htmlAttr = getIntersectingHtmlAttrName(htmlTemplate.childNodes, position) || undefined;
	const insideAttrAreaNode = getIntersectingHtmlNodeAttrArea(htmlTemplate.childNodes, position);

	const context: ITsHtmlExtensionCompletionContext = {
		...htmlPosition,
		store
	};

	// Get entries from the extensions
	let entries: CompletionEntry[] | undefined = [];
	if (htmlAttr != null) {
		entries = store.extension.completionsForHtmlAttrs(htmlAttr.htmlNode, context);

		if (entries != null) {
			// Make sure that every entry overwrites the entire attribute name.
			const { start, end } = htmlAttr.location.name;
			entries = entries.map(entry => ({
				...entry,
				replacementSpan: { start, length: end - start }
			}));
		}
	} else if (insideAttrAreaNode != null) {
		entries = store.extension.completionsForHtmlAttrs(insideAttrAreaNode, context);
	} else if (beforeWord === "<") {
		entries = store.extension.completionsForHtmlNodes(context);
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
function getIntersectingHtmlNodeAttrArea(htmlNode: IHtmlNodeBase | IHtmlNodeBase[], position: number): IHtmlNodeBase | undefined {
	if (Array.isArray(htmlNode)) {
		// Loop through all nodes in the array. Stop if a result is encountered.
		for (const childNode of htmlNode || []) {
			const res = getIntersectingHtmlNodeAttrArea(childNode, position);
			if (res != null) return res;
		}

		return undefined;
	} else {
		// Tests if the position is inside the start tag
		outer: if (intersects(position, htmlNode.location.startTag)) {
			// Check if the position intersects any attributes. Break if so.
			for (const htmlAttr of htmlNode.attributes || []) {
				if (intersects(position, htmlAttr.location)) {
					break outer;
				}
			}

			return htmlNode;
		}

		// Check recursively on all child nodes.
		return getIntersectingHtmlNodeAttrArea(htmlNode.childNodes || [], position);
	}
}

/**
 * Returns a htmlAttr that intersects with position.
 * @param htmlNode
 * @param position
 */
function getIntersectingHtmlAttrName(htmlNode: IHtmlNodeBase | IHtmlNodeBase[], position: number): IHtmlAttrBase | undefined {
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

		return getIntersectingHtmlAttrName(htmlNode.childNodes || [], position);
	}
}
