import { DocumentPositionContext } from "../../../util/get-html-position";
import { DiagnosticsContext } from "../../diagnostics-context";
import { LitCompletion } from "../../types/lit-completion";

export function completionsForHtmlNodes({ offset, leftWord, rightWord }: DocumentPositionContext, { store }: DiagnosticsContext): LitCompletion[] {
	const htmlTags = store.allHtmlTags;

	return htmlTags.map(
		htmlTag =>
			({
				name: htmlTag.name,
				insert: htmlTag.name,
				kind: htmlTag.hasDeclaration ? "member" : "label",
				importance: htmlTag.hasDeclaration ? "high" : "low",
				range: {
					start: offset - leftWord.length,
					end: offset + rightWord.length
				}
			} as LitCompletion)
	);
}
