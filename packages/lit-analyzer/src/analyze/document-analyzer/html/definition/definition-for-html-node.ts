import { LitAnalyzerContext } from "../../../lit-analyzer-context";
import { HtmlNode } from "../../../types/html-node/html-node-types";
import { LitDefinition } from "../../../types/lit-definition";
import { getNodeIdentifier } from "../../../util/ast-util";
import { rangeFromHtmlNode } from "../../../util/range-util";

export function definitionForHtmlNode(htmlNode: HtmlNode, { htmlStore, ts }: LitAnalyzerContext): LitDefinition | undefined {
	const tag = htmlStore.getHtmlTag(htmlNode);
	if (tag == null || tag.declaration == null) return undefined;

	const node = tag.declaration.node;

	return {
		fromRange: rangeFromHtmlNode(htmlNode),
		target: {
			kind: "node",
			node: getNodeIdentifier(node, ts) || node
		}
	};
}
