import { DefinitionInfoAndBoundSpan } from "typescript";
import { DiagnosticsContext } from "../diagnostics-context";
import { definitionAndBoundSpanForHtmlAttr, definitionAndBoundSpanForHtmlNode } from "../html-document/definitions";
import { HtmlDocument } from "../../parsing/text-document/html-document/html-document";
import { TextDocument } from "../../parsing/text-document/text-document";
import { isHTMLAttr } from "../../types/html-node-attr-types";
import { isHTMLNode } from "../../types/html-node-types";

export function getDefinitionAndBoundSpanFromDocument(document: TextDocument, position: number, context: DiagnosticsContext): DefinitionInfoAndBoundSpan | undefined {
	if (document instanceof HtmlDocument) {
		const hit = document.htmlNodeOrAttrAtPosition(position);
		if (hit == null) return;

		if (isHTMLNode(hit)) {
			return definitionAndBoundSpanForHtmlNode(hit, context);
		} else if (isHTMLAttr(hit)) {
			return definitionAndBoundSpanForHtmlAttr(hit, context);
		}
	}
}
