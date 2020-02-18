import { LitAnalyzerRequest } from "../../../lit-analyzer-context";
import { documentationForHtmlTag } from "../../../parse/parse-html-data/html-tag";
import { HtmlNode } from "../../../types/html-node/html-node-types";
import { LitQuickInfo } from "../../../types/lit-quick-info";
import { rangeFromHtmlNode } from "../../../util/lit-range-util";

export function quickInfoForHtmlNode(htmlNode: HtmlNode, { htmlStore, document }: LitAnalyzerRequest): LitQuickInfo | undefined {
	const htmlTag = htmlStore.getHtmlTag(htmlNode);
	if (htmlTag == null) return undefined;

	return {
		range: rangeFromHtmlNode(document, htmlNode),
		primaryInfo: `<${htmlNode.tagName}>`,
		secondaryInfo: documentationForHtmlTag(htmlTag, { markdown: true })
	};
}
