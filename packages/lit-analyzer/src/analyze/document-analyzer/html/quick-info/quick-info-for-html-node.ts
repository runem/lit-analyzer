import { documentationForHtmlTag } from "../../../parse/parse-html-data/html-tag";
import { HtmlNode } from "../../../types/html-node/html-node-types";
import { LitAnalyzerRequest } from "../../../lit-analyzer-context";
import { LitQuickInfo } from "../../../types/lit-quick-info";

export function quickInfoForHtmlNode(htmlNode: HtmlNode, { htmlStore, document }: LitAnalyzerRequest): LitQuickInfo | undefined {
	const htmlTag = htmlStore.getHtmlTag(htmlNode);
	if (htmlTag == null) return undefined;

	return {
		range: { document, ...htmlNode.location.name },
		primaryInfo: `<${htmlNode.tagName}>`,
		secondaryInfo: documentationForHtmlTag(htmlTag, { markdown: true })
	};
}
