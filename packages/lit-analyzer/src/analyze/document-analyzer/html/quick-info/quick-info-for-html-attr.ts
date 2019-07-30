import { descriptionForTarget, targetKindAndTypeText } from "../../../parse/parse-html-data/html-tag";
import { HtmlNodeAttr } from "../../../types/html-node/html-node-attr-types";
import { LitAnalyzerRequest } from "../../../lit-analyzer-context";
import { LitQuickInfo } from "../../../types/lit-quick-info";

export function quickInfoForHtmlAttr(htmlAttr: HtmlNodeAttr, { document, htmlStore }: LitAnalyzerRequest): LitQuickInfo | undefined {
	const target = htmlStore.getHtmlAttrTarget(htmlAttr);
	if (target == null) return undefined;

	return {
		range: { document, ...htmlAttr.location.name },
		primaryInfo: targetKindAndTypeText(target, { modifier: htmlAttr.modifier }),
		secondaryInfo: descriptionForTarget(target, { markdown: true })
	};
}
