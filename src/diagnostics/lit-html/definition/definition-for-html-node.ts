import { HtmlNode } from "../../../parsing/text-document/html-document/parse-html-node/types/html-node-types";
import { DiagnosticsContext } from "../../diagnostics-context";
import { DefinitionKind, LitDefinition } from "../../types/lit-definition";

export function definitionForHtmlNode(htmlNode: HtmlNode, { store }: DiagnosticsContext): LitDefinition | undefined {
	const decl = store.getComponentDeclaration(htmlNode);
	if (decl == null) return undefined;

	return {
		kind: DefinitionKind.COMPONENT,
		fromRange: htmlNode.location.name,
		targetClass: decl
	};
}
