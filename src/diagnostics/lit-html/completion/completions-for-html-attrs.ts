import { HtmlNode } from "../../../parsing/text-document/html-document/parse-html-node/types/html-node-types";
import { caseInsensitiveCmp } from "../../../util/util";
import { DiagnosticsContext } from "../../diagnostics-context";
import { LitCompletion } from "../../types/lit-completion";

export function completionsForHtmlAttrs(htmlNode: HtmlNode, { store }: DiagnosticsContext): LitCompletion[] {
	const htmlTagAttrs = store.getHtmlTagAttrs(htmlNode);

	const unusedAttrs = htmlTagAttrs.filter(htmlAttr => !(htmlNode.attributes.find(attr => caseInsensitiveCmp(htmlAttr.name, attr.name)) != null));

	return unusedAttrs.map(
		htmlTagAttr =>
			({
				name: `${htmlTagAttr.name}${htmlTagAttr.required ? "!" : ""}`,
				insert: htmlTagAttr.name,
				kind: htmlTagAttr.hasProp ? "member" : "label",
				importance: htmlTagAttr.hasProp ? "high" : "low"
			} as LitCompletion)
	);
}
