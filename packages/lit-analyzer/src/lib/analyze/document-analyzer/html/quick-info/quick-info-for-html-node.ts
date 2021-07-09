import { LitAnalyzerContext } from "../../../lit-analyzer-context";
import { documentationForHtmlTag } from "../../../parse/parse-html-data/html-tag";
import { HtmlNode } from "../../../types/html-node/html-node-types";
import { LitQuickInfo } from "../../../types/lit-quick-info";
import { rangeFromHtmlNode } from "../../../util/range-util";

export function quickInfoForHtmlNode(htmlNode: HtmlNode, { htmlStore }: LitAnalyzerContext): LitQuickInfo | undefined {
	const htmlTag = htmlStore.getHtmlTag(htmlNode);
	if (htmlTag == null) return undefined;

	return {
		range: rangeFromHtmlNode(htmlNode),
		primaryInfo: `<${htmlNode.tagName}>`,
		secondaryInfo: documentationForHtmlTag(htmlTag, { markdown: true })
	};
}
