import { HtmlNode } from "../../../types/html-node/html-node-types";
import { LitAnalyzerRequest } from "../../../lit-analyzer-context";
import { DefinitionKind, LitDefinition } from "../../../types/lit-definition";

export function definitionForHtmlNode(htmlNode: HtmlNode, { document, htmlStore }: LitAnalyzerRequest): LitDefinition | undefined {
	const tag = htmlStore.getHtmlTag(htmlNode);
	if (tag == null || tag.declaration == null) return undefined;

	return {
		kind: DefinitionKind.COMPONENT,
		fromRange: { document, ...htmlNode.location.name },
		target: tag.declaration
	};
}
