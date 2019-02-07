import { QuickInfo, TypeChecker } from "typescript";
import { HTMLDocument } from "../../html-document/html-document";
import { isHTMLAttr } from "../../html-document/types/html-attr-types";
import { isHTMLNode } from "../../html-document/types/html-node-types";
import { TsHtmlPluginStore } from "../../state/store";

/**
 * Asks extensions for quick info at a specific position.
 * @param position
 * @param htmlDocument
 * @param checker
 * @param store
 */
export function getQuickInfoFromHtmlDocument(position: number, htmlDocument: HTMLDocument, checker: TypeChecker, store: TsHtmlPluginStore): QuickInfo | undefined {
	const context = { file: htmlDocument.astNode.getSourceFile(), store, position, checker };

	const hit = htmlDocument.htmlNodeOrAttrAtPosition(position);
	if (hit == null) return;

	if (isHTMLNode(hit)) {
		return store.extension.quickInfoForHtmlNode(hit, context);
	}

	if (isHTMLAttr(hit)) {
		return store.extension.quickInfoForHtmlAttr(hit, context);
	}
}
