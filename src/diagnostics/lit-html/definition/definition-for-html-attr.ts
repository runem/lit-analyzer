import { isHtmlEvent, isHtmlMember } from "../../../parsing/parse-html-data/html-tag";
import { HtmlNodeAttr } from "../../../parsing/text-document/html-document/parse-html-node/types/html-node-attr-types";
import { DiagnosticsContext } from "../../diagnostics-context";
import { DefinitionKind, LitDefinition } from "../../types/lit-definition";

export function definitionForHtmlAttr(htmlAttr: HtmlNodeAttr, { sourceFile, store }: DiagnosticsContext): LitDefinition | undefined {
	const target = store.getHtmlAttrTarget(htmlAttr);
	if (target == null) return undefined;

	if (isHtmlMember(target) && target.declaration != null) {
		return {
			kind: DefinitionKind.MEMBER,
			fromRange: htmlAttr.location.name,
			target: target.declaration
		};
	} else if (isHtmlEvent(target) && target.declaration != null) {
		return {
			kind: DefinitionKind.EVENT,
			fromRange: htmlAttr.location.name,
			target: target.declaration
		};
	}
}
