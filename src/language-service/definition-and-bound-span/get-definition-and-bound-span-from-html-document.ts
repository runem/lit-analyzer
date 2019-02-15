import { DefinitionInfoAndBoundSpan } from "typescript";
import { HTMLDocument } from "../../parsing/html-document/html-document";
import { isHTMLAttr } from "../../types/html-node-attr-types";
import { isHTMLNode } from "../../types/html-node-types";
import { TsLitPluginStore } from "../../state/store";

/**
 * Asks extensions for definitions.
 * @param position
 * @param document
 * @param store
 */
export function getDefinitionAndBoundSpanFromHtmlDocument(position: number, document: HTMLDocument, store: TsLitPluginStore): DefinitionInfoAndBoundSpan | undefined {
	const hit = document.htmlNodeOrAttrAtPosition(position);
	if (hit == null) return;

	const context = {
		file: document.astNode.getSourceFile(),
		store,
		position
	};

	if (isHTMLNode(hit)) {
		return store.extension.definitionAndBoundSpanForHtmlNode(hit, context);
	} else if (isHTMLAttr(hit)) {
		return store.extension.definitionAndBoundSpanForHtmlAttr(hit, context);
	}
}
