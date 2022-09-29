import { LitAnalyzerContext } from "../../../lit-analyzer-context.js";
import { HtmlNode } from "../../../types/html-node/html-node-types.js";
import { LitDefinition } from "../../../types/lit-definition.js";
import { getNodeIdentifier } from "../../../util/ast-util.js";
import { rangeFromHtmlNode } from "../../../util/range-util.js";

export function definitionForHtmlNode(htmlNode: HtmlNode, { htmlStore, ts }: LitAnalyzerContext): LitDefinition | undefined {
	const tag = htmlStore.getHtmlTag(htmlNode);
	if (tag == null || tag.declaration == null) return undefined;

	const node = tag.declaration.node;

	return {
		fromRange: rangeFromHtmlNode(htmlNode),
		targets: [
			{
				kind: "node",
				node: getNodeIdentifier(node, ts) || node
			}
		]
	};
}
