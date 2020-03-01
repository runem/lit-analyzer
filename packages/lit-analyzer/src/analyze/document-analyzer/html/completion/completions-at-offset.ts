import { LitAnalyzerContext } from "../../../lit-analyzer-context";
import { HtmlDocument } from "../../../parse/document/text-document/html-document/html-document";
import { LitCompletion } from "../../../types/lit-completion";
import { DocumentOffset } from "../../../types/range";
import { getPositionContextInDocument } from "../../../util/get-position-context-in-document";
import { rangeFromHtmlNodeAttr } from "../../../util/range-util";
import { completionsForHtmlAttrValues } from "./completions-for-html-attr-values";
import { completionsForHtmlAttrs } from "./completions-for-html-attrs";
import { completionsForHtmlNodes } from "./completions-for-html-nodes";

export function completionsAtOffset(document: HtmlDocument, offset: DocumentOffset, context: LitAnalyzerContext): LitCompletion[] {
	const positionContext = getPositionContextInDocument(document, offset);

	const { beforeWord } = positionContext;

	// Get possible intersecting html attribute or attribute area.
	const intersectingAttr = document.htmlAttrNameAtOffset(offset);
	const intersectingAttrAreaNode = document.htmlAttrAreaAtOffset(offset);
	const intersectingAttrAssignment = document.htmlAttrAssignmentAtOffset(offset);
	const intersectingClosestNode = document.htmlNodeClosestToOffset(offset);

	// Get entries from the extensions
	if (intersectingAttr != null) {
		const entries = completionsForHtmlAttrs(intersectingAttr.htmlNode, positionContext, context);

		// Make sure that every entry overwrites the entire attribute name.
		return entries.map(entry => ({
			...entry,
			range: rangeFromHtmlNodeAttr(intersectingAttr)
		}));
	} else if (intersectingAttrAssignment != null) {
		return completionsForHtmlAttrValues(intersectingAttrAssignment, positionContext, context);
	} else if (intersectingAttrAreaNode != null) {
		return completionsForHtmlAttrs(intersectingAttrAreaNode, positionContext, context);
	} else if (beforeWord === "<" || beforeWord === "/") {
		return completionsForHtmlNodes(document, intersectingClosestNode, positionContext, context);
	}

	return [];
}
