import { LitAnalyzerContext } from "../../../lit-analyzer-context.js";
import { isHtmlEvent, isHtmlMember } from "../../../parse/parse-html-data/html-tag.js";
import { HtmlNodeAttr } from "../../../types/html-node/html-node-attr-types.js";
import { LitDefinition } from "../../../types/lit-definition.js";
import { getNodeIdentifier } from "../../../util/ast-util.js";
import { rangeFromHtmlNodeAttr } from "../../../util/range-util.js";

export function definitionForHtmlAttr(htmlAttr: HtmlNodeAttr, { htmlStore, ts }: LitAnalyzerContext): LitDefinition | undefined {
	const target = htmlStore.getHtmlAttrTarget(htmlAttr);
	if (target == null) return undefined;

	if (isHtmlMember(target) && target.declaration != null) {
		const node = target.declaration.node;

		return {
			fromRange: rangeFromHtmlNodeAttr(htmlAttr),
			target: {
				kind: "node",
				node: getNodeIdentifier(node, ts) || node,
				name: target.name
			}
		};
	} else if (isHtmlEvent(target) && target.declaration != null) {
		const node = target.declaration.node;

		return {
			fromRange: rangeFromHtmlNodeAttr(htmlAttr),
			target: {
				kind: "node",
				node: getNodeIdentifier(node, ts) || node,
				name: target.name
			}
		};
	}
	return;
}
