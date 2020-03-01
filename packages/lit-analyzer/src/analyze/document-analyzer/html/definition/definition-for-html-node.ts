import { LitAnalyzerContext } from "../../../lit-analyzer-context";
import { HtmlNode } from "../../../types/html-node/html-node-types";
import { DefinitionKind, LitDefinition } from "../../../types/lit-definition";
import { rangeFromHtmlNode } from "../../../util/range-util";

export function definitionForHtmlNode(htmlNode: HtmlNode, { htmlStore }: LitAnalyzerContext): LitDefinition | undefined {
	const tag = htmlStore.getHtmlTag(htmlNode);
	if (tag == null || tag.declaration == null) return undefined;

	return {
		kind: DefinitionKind.COMPONENT,
		fromRange: rangeFromHtmlNode(htmlNode),
		target: tag.declaration
	};
}
