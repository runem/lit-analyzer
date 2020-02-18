import { LitAnalyzerRequest } from "../../../lit-analyzer-context";
import { HtmlNode } from "../../../types/html-node/html-node-types";
import { DefinitionKind, LitDefinition } from "../../../types/lit-definition";
import { rangeFromHtmlNode } from "../../../util/lit-range-util";

export function definitionForHtmlNode(htmlNode: HtmlNode, { document, htmlStore }: LitAnalyzerRequest): LitDefinition | undefined {
	const tag = htmlStore.getHtmlTag(htmlNode);
	if (tag == null || tag.declaration == null) return undefined;

	return {
		kind: DefinitionKind.COMPONENT,
		fromRange: rangeFromHtmlNode(document, htmlNode),
		target: tag.declaration
	};
}
