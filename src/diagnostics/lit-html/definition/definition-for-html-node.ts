import { HtmlNode } from "../../../parsing/text-document/html-document/parse-html-node/types/html-node-types";
import { DiagnosticsContext } from "../../diagnostics-context";
import { DefinitionKind, LitDefinition } from "../../types/lit-definition";

export function definitionForHtmlNode(htmlNode: HtmlNode, { store }: DiagnosticsContext): LitDefinition | undefined {
	const tag = store.getHtmlTag(htmlNode);
	if (tag == null || tag.declaration == null) return undefined;

	return {
		kind: DefinitionKind.COMPONENT,
		fromRange: htmlNode.location.name,
		target: tag.declaration
	};
}
