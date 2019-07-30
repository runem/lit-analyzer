import { isHtmlEvent, isHtmlMember } from "../../../parse/parse-html-data/html-tag";
import { HtmlNodeAttr } from "../../../types/html-node/html-node-attr-types";
import { LitAnalyzerRequest } from "../../../lit-analyzer-context";
import { DefinitionKind, LitDefinition } from "../../../types/lit-definition";

export function definitionForHtmlAttr(htmlAttr: HtmlNodeAttr, { htmlStore, document }: LitAnalyzerRequest): LitDefinition | undefined {
	const target = htmlStore.getHtmlAttrTarget(htmlAttr);
	if (target == null) return undefined;

	if (isHtmlMember(target) && target.declaration != null) {
		return {
			kind: DefinitionKind.MEMBER,
			fromRange: { document, ...htmlAttr.location.name },
			target: target.declaration
		};
	} else if (isHtmlEvent(target) && target.declaration != null) {
		return {
			kind: DefinitionKind.EVENT,
			fromRange: { document, ...htmlAttr.location.name },
			target: target.declaration
		};
	}
	return;
}
