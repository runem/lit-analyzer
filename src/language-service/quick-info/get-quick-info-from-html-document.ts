import { QuickInfo } from "typescript";
import { quickInfoForHtmlAttr, quickInfoForHtmlNode } from "../../extensions/html/quick-info";
import { HTMLDocument } from "../../parsing/html-document/html-document";
import { TsLitPluginStore } from "../../state/store";
import { isHTMLAttr } from "../../types/html-node-attr-types";
import { isHTMLNode } from "../../types/html-node-types";

/**
 * Asks extensions for quick info at a specific position.
 * @param position
 * @param htmlDocument
 * @param checker
 * @param store
 */
export function getQuickInfoFromHtmlDocument(position: number, htmlDocument: HTMLDocument, store: TsLitPluginStore): QuickInfo | undefined {
	const hit = htmlDocument.htmlNodeOrAttrAtPosition(position);
	if (hit == null) return;

	if (isHTMLNode(hit)) {
		return quickInfoForHtmlNode(hit, store);
	}

	if (isHTMLAttr(hit)) {
		return quickInfoForHtmlAttr(hit, store);
	}
}
