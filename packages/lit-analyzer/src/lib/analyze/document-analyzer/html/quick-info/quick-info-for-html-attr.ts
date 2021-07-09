import { LitAnalyzerContext } from "../../../lit-analyzer-context";
import { descriptionForTarget, targetKindAndTypeText } from "../../../parse/parse-html-data/html-tag";
import { HtmlNodeAttr } from "../../../types/html-node/html-node-attr-types";
import { LitQuickInfo } from "../../../types/lit-quick-info";
import { rangeFromHtmlNodeAttr } from "../../../util/range-util";

export function quickInfoForHtmlAttr(htmlAttr: HtmlNodeAttr, { htmlStore }: LitAnalyzerContext): LitQuickInfo | undefined {
	const target = htmlStore.getHtmlAttrTarget(htmlAttr);
	if (target == null) return undefined;

	return {
		range: rangeFromHtmlNodeAttr(htmlAttr),
		primaryInfo: targetKindAndTypeText(target, { modifier: htmlAttr.modifier }),
		secondaryInfo: descriptionForTarget(target, { markdown: true })
	};
}
