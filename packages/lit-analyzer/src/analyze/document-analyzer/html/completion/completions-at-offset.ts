import { LitAnalyzerRequest } from "../../../lit-analyzer-context";
import { HtmlDocument } from "../../../parse/document/text-document/html-document/html-document";
import { LitCompletion } from "../../../types/lit-completion";
import { getPositionContextInDocument } from "../../../util/get-position-context-in-document";
import { completionsForHtmlAttrValues } from "./completions-for-html-attr-values";
import { completionsForHtmlAttrs } from "./completions-for-html-attrs";
import { completionsForHtmlNodes } from "./completions-for-html-nodes";

export function completionsAtOffset(document: HtmlDocument, offset: number, request: LitAnalyzerRequest): LitCompletion[] {
	const positionContext = getPositionContextInDocument(document, offset);

	const { beforeWord } = positionContext;

	// Get possible intersecting html attribute or attribute area.
	const intersectingAttr = document.htmlAttrNameAtOffset(offset);
	const intersectingAttrAreaNode = document.htmlAttrAreaAtOffset(offset);
	const intersectingAttrAssignment = document.htmlAttrAssignmentAtOffset(offset);
	const intersectingClosestNode = document.htmlNodeClosestToOffset(offset);

	// Get entries from the extensions
	if (intersectingAttr != null) {
		const entries = completionsForHtmlAttrs(intersectingAttr.htmlNode, positionContext, request);

		// Make sure that every entry overwrites the entire attribute name.
		return entries.map(entry => ({
			...entry,
			range: { document: request.document, ...intersectingAttr.location.name }
		}));
	} else if (intersectingAttrAssignment != null) {
		return completionsForHtmlAttrValues(intersectingAttrAssignment, positionContext, request);
	} else if (intersectingAttrAreaNode != null) {
		return completionsForHtmlAttrs(intersectingAttrAreaNode, positionContext, request);
	} else if (beforeWord === "<" || beforeWord === "/") {
		return completionsForHtmlNodes(intersectingClosestNode, positionContext, request);
	}

	return [];
}
