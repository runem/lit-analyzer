import { isSimpleTypeLiteral, SimpleType, SimpleTypeKind } from "ts-simple-type";
import { CompletionEntry, CompletionInfo } from "typescript";
import { HtmlDocument } from "../../../parsing/text-document/html-document/html-document";
import { tsModule } from "../../../ts-module";
import { HtmlNodeAttr } from "../../../types/html-node-attr-types";
import { HtmlNode } from "../../../types/html-node-types";
import { DocumentPositionContext } from "../../../util/get-html-position";
import { caseInsensitiveCmp, intersects } from "../../../util/util";
import { DiagnosticsContext } from "../../diagnostics-context";

export function completionsForHtmlAttrValues(htmlNodeAttr: HtmlNodeAttr, positionContext: DocumentPositionContext, { store }: DiagnosticsContext): CompletionEntry[] {
	const htmlTagAttr = store.getHtmlTagAttr(htmlNodeAttr);
	if (htmlTagAttr == null) return [];

	const options = getOptionsFromType(htmlTagAttr.type);

	return options.map((option, i) => ({
		name: option,
		insertText: option,
		kind: tsModule.ts.ScriptElementKind.label,
		sortText: i.toString()
	}));
}

function getOptionsFromType(type: SimpleType): string[] {
	switch (type.kind) {
		case SimpleTypeKind.UNION:
			return type.types.filter(isSimpleTypeLiteral).map(t => t.value.toString());
		case SimpleTypeKind.ENUM:
			return type.types
				.map(m => m.type)
				.filter(isSimpleTypeLiteral)
				.map(t => t.value.toString());
		case SimpleTypeKind.ALIAS:
			return getOptionsFromType(type.target);
	}

	return [];
}

export function completionsForHtmlAttrs(htmlNode: HtmlNode, positionContext: DocumentPositionContext, { store }: DiagnosticsContext): CompletionEntry[] {
	const htmlTagAttrs = store.getHtmlTagAttrs(htmlNode);

	const unusedAttrs = htmlTagAttrs.filter(htmlAttr => !(htmlNode.attributes.find(attr => caseInsensitiveCmp(htmlAttr.name, attr.name)) != null));

	return unusedAttrs.map(htmlTagAttr => ({
		name: `${htmlTagAttr.name}${htmlTagAttr.required ? "!" : ""}`,
		insertText: htmlTagAttr.name,
		kind: htmlTagAttr.hasProp ? tsModule.ts.ScriptElementKind.memberVariableElement : tsModule.ts.ScriptElementKind.label,
		sortText: htmlTagAttr.hasProp ? "0" : "1"
	}));
}

export function completionsForHtmlNodes({ position, leftWord, rightWord }: DocumentPositionContext, { store }: DiagnosticsContext): CompletionEntry[] {
	const htmlTags = store.allHtmlTags;

	return htmlTags.map(
		htmlTag =>
			({
				name: htmlTag.name,
				insertText: htmlTag.name,
				kind: htmlTag.hasDeclaration ? tsModule.ts.ScriptElementKind.memberVariableElement : tsModule.ts.ScriptElementKind.label,
				sortText: htmlTag.hasDeclaration ? "0" : "1",
				replacementSpan: {
					start: position - leftWord.length,
					length: leftWord.length + rightWord.length
				}
			} as CompletionEntry)
	);
}

export function getCompletionInfoAtPosition(document: HtmlDocument, positionContext: DocumentPositionContext, context: DiagnosticsContext): CompletionInfo | undefined {
	const { beforeWord, position } = positionContext;

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
		entries = completionsForHtmlAttrValues(htmlAttrValue, positionContext, context);
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
