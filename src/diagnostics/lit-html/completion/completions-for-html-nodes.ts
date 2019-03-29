import { documentationForHtmlTag } from "../../../parsing/parse-html-data/html-tag";
import { DocumentPositionContext } from "../../../util/get-html-position";
import { isCustomElementTagName, lazy } from "../../../util/util";
import { DiagnosticsContext } from "../../diagnostics-context";
import { LitCompletion } from "../../types/lit-completion";

export function completionsForHtmlNodes({ offset, leftWord, rightWord }: DocumentPositionContext, location: DocumentPositionContext, { store }: DiagnosticsContext): LitCompletion[] {
	const htmlTags = Array.from(store.getGlobalTags());

	return htmlTags.map(htmlTag => {
		const isBuiltIn = !isCustomElementTagName(htmlTag.tagName);
		const hasDeclaration = htmlTag.declaration != null;

		return {
			name: htmlTag.tagName,
			insert: htmlTag.tagName,
			kind: isBuiltIn ? "enumElement" : hasDeclaration ? "member" : "label",
			importance: isBuiltIn ? "low" : hasDeclaration ? "high" : "medium",
			range: {
				start: offset - leftWord.length,
				end: offset + rightWord.length
			},
			documentation: lazy(() => documentationForHtmlTag(htmlTag))
		} as LitCompletion;
	});
}
