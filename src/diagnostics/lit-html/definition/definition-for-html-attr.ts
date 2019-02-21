import { HtmlNodeAttr } from "../../../parsing/text-document/html-document/parse-html-node/types/html-node-attr-types";
import { DiagnosticsContext } from "../../diagnostics-context";
import { LitDefinition, DefinitionKind } from "../../types/lit-definition";

export function definitionForHtmlAttr(htmlAttr: HtmlNodeAttr, { sourceFile, store }: DiagnosticsContext): LitDefinition | undefined {
	const decl = store.getComponentDeclaration(htmlAttr.htmlNode);
	const prop = store.getComponentDeclarationProp(htmlAttr);
	if (decl == null || prop == null) return undefined;

	return {
		kind: DefinitionKind.COMPONENT,
		fromRange: htmlAttr.location.name,
		targetClass: decl,
		targetProp: prop
	};
}
