import { QuickInfo } from "typescript";
import { HtmlDocument } from "../../parsing/text-document/html-document/html-document";
import { TextDocument } from "../../parsing/text-document/text-document";
import { isHTMLAttr } from "../../types/html-node-attr-types";
import { isHTMLNode } from "../../types/html-node-types";
import { DiagnosticsContext } from "../diagnostics-context";
import { quickInfoForHtmlAttr, quickInfoForHtmlNode } from "../html-document/quick-info";

export function getQuickInfoFromDocument(document: TextDocument, position: number, context: DiagnosticsContext): QuickInfo | undefined {
	if (document instanceof HtmlDocument) {
		const hit = document.htmlNodeOrAttrAtPosition(position);
		if (hit == null) return;

		if (isHTMLNode(hit)) {
			return quickInfoForHtmlNode(hit, context);
		}

		if (isHTMLAttr(hit)) {
			return quickInfoForHtmlAttr(hit, context);
		}
	}
}
