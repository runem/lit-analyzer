import { HtmlNode } from "../../../parsing/text-document/html-document/parse-html-node/types/html-node-types";
import { DiagnosticsContext } from "../../diagnostics-context";
import { LitQuickInfo } from "../../types/lit-quick-info";

export function quickInfoForHtmlNode(htmlNode: HtmlNode, { store }: DiagnosticsContext): LitQuickInfo | undefined {
	const htmlTag = store.getHtmlTag(htmlNode);
	if (htmlTag == null) return undefined;

	return {
		range: htmlNode.location.name,
		primaryInfo: `<${htmlNode.tagName}>`,
		secondaryInfo: htmlTag.description
	};
}
