import { LitAnalyzerContext } from "../../../lit-analyzer-context.js";
import { documentationForHtmlTag } from "../../../parse/parse-html-data/html-tag.js";
import { HtmlNode } from "../../../types/html-node/html-node-types.js";
import { LitQuickInfo } from "../../../types/lit-quick-info.js";
import { rangeFromHtmlNode } from "../../../util/range-util.js";

export function quickInfoForHtmlNode(htmlNode: HtmlNode, { htmlStore }: LitAnalyzerContext): LitQuickInfo | undefined {
	const htmlTag = htmlStore.getHtmlTag(htmlNode);
	if (htmlTag == null) return undefined;

	return {
		range: rangeFromHtmlNode(htmlNode),
		primaryInfo: `<${htmlNode.tagName}>`,
		secondaryInfo: documentationForHtmlTag(htmlTag, { markdown: true })
	};
}
