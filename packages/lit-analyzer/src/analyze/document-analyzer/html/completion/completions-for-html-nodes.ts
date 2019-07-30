import { documentationForHtmlTag } from "../../../parse/parse-html-data/html-tag";
import { DocumentPositionContext } from "../../../util/get-position-context-in-document";
import { isCustomElementTagName, lazy } from "../../../util/general-util";
import { LitAnalyzerRequest } from "../../../lit-analyzer-context";
import { LitCompletion } from "../../../types/lit-completion";

export function completionsForHtmlNodes(
	{ offset, leftWord, rightWord }: DocumentPositionContext,
	location: DocumentPositionContext,
	{ document, htmlStore }: LitAnalyzerRequest
): LitCompletion[] {
	const htmlTags = Array.from(htmlStore.getGlobalTags());

	return htmlTags.map(htmlTag => {
		const isBuiltIn = !isCustomElementTagName(htmlTag.tagName);
		const hasDeclaration = htmlTag.declaration != null;

		return {
			name: htmlTag.tagName,
			insert: htmlTag.tagName,
			kind: isBuiltIn ? "enumElement" : hasDeclaration ? "member" : "label",
			importance: isBuiltIn ? "low" : hasDeclaration ? "high" : "medium",
			range: {
				document,
				start: offset - leftWord.length,
				end: offset + rightWord.length
			},
			documentation: lazy(() => documentationForHtmlTag(htmlTag))
		} as LitCompletion;
	});
}
