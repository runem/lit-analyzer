import { LitAnalyzerRequest } from "../../../lit-analyzer-context";
import { documentationForHtmlTag } from "../../../parse/parse-html-data/html-tag";
import { HtmlNode } from "../../../types/html-node/html-node-types";
import { LitCompletion } from "../../../types/lit-completion";
import { isCustomElementTagName, lazy } from "../../../util/general-util";
import { DocumentPositionContext } from "../../../util/get-position-context-in-document";

export function completionsForHtmlNodes(
	intersectingClosestNode: HtmlNode | undefined,
	{ offset, leftWord, rightWord, beforeWord, afterWord }: DocumentPositionContext,
	{ document, htmlStore, logger }: LitAnalyzerRequest
): LitCompletion[] {
	const isClosingTag = beforeWord === "/";

	// This case handles closing the closest intersecting node.
	// For this case we only suggest closing the closest intersecting node: so 1 single suggestion.
	// Example:   <my-element></|
	// This doesn't handle:   <my-element></my-el|ement> , because in that case we would like to show all options to the user.
	if (isClosingTag && leftWord === "" && rightWord === "" && afterWord !== ">" && intersectingClosestNode != null) {
		const insert = `</${intersectingClosestNode.tagName}>`;

		return [
			{
				name: insert,
				insert,
				kind: "enumElement",
				importance: "high",
				range: {
					document,
					start: offset - leftWord.length - 2,
					end: offset + rightWord.length
				},
				documentation: lazy(() => {
					const htmlTag = htmlStore.getHtmlTag(intersectingClosestNode);
					return htmlTag != null ? documentationForHtmlTag(htmlTag) : undefined;
				})
			} as LitCompletion
		];
	}

	const htmlTags = Array.from(htmlStore.getGlobalTags());

	return htmlTags.map(htmlTag => {
		const isBuiltIn = !isCustomElementTagName(htmlTag.tagName);
		const hasDeclaration = htmlTag.declaration != null;

		const insert = isClosingTag ? "</" + htmlTag.tagName + ">" : htmlTag.tagName;

		return {
			name: insert,
			insert,
			kind: isBuiltIn ? "enumElement" : hasDeclaration ? "member" : "label",
			importance: isBuiltIn ? "low" : hasDeclaration ? "high" : "medium",
			range: {
				document,
				start: offset - leftWord.length - (isClosingTag ? 2 : 0),
				end: offset + rightWord.length + (isClosingTag && afterWord === ">" ? 1 : 0)
			},
			documentation: lazy(() => documentationForHtmlTag(htmlTag))
		} as LitCompletion;
	});
}
