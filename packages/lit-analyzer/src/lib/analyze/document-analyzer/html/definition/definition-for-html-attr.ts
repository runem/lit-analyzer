import { LitAnalyzerContext } from "../../../lit-analyzer-context";
import { isHtmlEvent, isHtmlMember } from "../../../parse/parse-html-data/html-tag";
import { HtmlNodeAttr } from "../../../types/html-node/html-node-attr-types";
import { LitDefinition } from "../../../types/lit-definition";
import { getNodeIdentifier } from "../../../util/ast-util";
import { rangeFromHtmlNodeAttr } from "../../../util/range-util";

export function definitionForHtmlAttr(htmlAttr: HtmlNodeAttr, { htmlStore, ts }: LitAnalyzerContext): LitDefinition | undefined {
	const target = htmlStore.getHtmlAttrTarget(htmlAttr);
	if (target == null) return undefined;

	if (isHtmlMember(target) && target.declaration != null) {
		const node = target.declaration.node;

		return {
			fromRange: rangeFromHtmlNodeAttr(htmlAttr),
			target: {
				kind: "node",
				node: getNodeIdentifier(node, ts) || node
			}
		};
	} else if (isHtmlEvent(target) && target.declaration != null) {
		const node = target.declaration.node;

		return {
			fromRange: rangeFromHtmlNodeAttr(htmlAttr),
			target: {
				kind: "node",
				node: getNodeIdentifier(node, ts) || node
			}
		};
	}
	return;
}
