import { HtmlDocument } from "../../../parsing/text-document/html-document/html-document";
import { getPositionContextInDocument } from "../../../util/get-html-position";
import { logger } from "../../../util/logger";
import { DiagnosticsContext } from "../../diagnostics-context";
import { LitCompletion } from "../../types/lit-completion";
import { completionsForHtmlAttrValues } from "./completions-for-html-attr-values";
import { completionsForHtmlAttrs } from "./completions-for-html-attrs";
import { completionsForHtmlNodes } from "./completions-for-html-nodes";

export function completionsAtOffset(document: HtmlDocument, offset: number, context: DiagnosticsContext): LitCompletion[] {
	const positionContext = getPositionContextInDocument(document, offset);

	const { beforeWord } = positionContext;

	// Get possible intersecting html attribute or attribute area.
	const intersectingAttr = document.htmlAttrNameAtOffset(offset);
	const intersectingAttrAreaNode = document.htmlAttrAreaAtOffset(offset);
	const intersectingAttrAssignment = document.htmlAttrAssignmentAtOffset(offset);

	logger.verbose("completionsAtOffset", {
		positionContext,
		intersectingAttr,
		intersectingAttrAreaNode,
		intersectingAttrAssignment
	});

	// Get entries from the extensions
	if (intersectingAttr != null) {
		const entries = completionsForHtmlAttrs(intersectingAttr.htmlNode, positionContext, context);

		// Make sure that every entry overwrites the entire attribute name.
		return entries.map(entry => ({
			...entry,
			range: intersectingAttr.location.name
		}));
	} else if (intersectingAttrAssignment != null) {
		return completionsForHtmlAttrValues(intersectingAttrAssignment, positionContext, context);
	} else if (intersectingAttrAreaNode != null) {
		return completionsForHtmlAttrs(intersectingAttrAreaNode, positionContext, context);
	} else if (beforeWord === "<") {
		return completionsForHtmlNodes(positionContext, positionContext, context);
	}

	return [];
}
