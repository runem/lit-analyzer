import { QuickInfo } from "typescript";
import { CssDocument } from "../../parsing/text-document/css-document/css-document";
import { HtmlDocument } from "../../parsing/text-document/html-document/html-document";
import { TextDocument } from "../../parsing/text-document/text-document";
import { isHTMLAttr } from "../../types/html-node-attr-types";
import { isHTMLNode } from "../../types/html-node-types";
import { DocumentPositionContext } from "../../util/get-html-position";
import { VscodeCssServiceWrapper } from "../css-document/vscode-css-languageservice/vscode-css-service-wrapper";
import { DiagnosticsContext } from "../diagnostics-context";
import { quickInfoForHtmlAttr, quickInfoForHtmlNode } from "../html-document/quick-info";

export function getQuickInfoFromDocument(document: TextDocument, positionContext: DocumentPositionContext, context: DiagnosticsContext): QuickInfo | undefined {
	if (document instanceof CssDocument) {
		return new VscodeCssServiceWrapper(document).getQuickInfoAtPosition(positionContext.positionInText);
	} else if (document instanceof HtmlDocument) {
		const hit = document.htmlNodeOrAttrAtPosition(positionContext.position);
		if (hit == null) return;

		if (isHTMLNode(hit)) {
			return quickInfoForHtmlNode(hit, context);
		}

		if (isHTMLAttr(hit)) {
			return quickInfoForHtmlAttr(hit, context);
		}
	}
}
