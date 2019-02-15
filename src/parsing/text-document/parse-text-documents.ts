import { Node, TypeChecker } from "typescript";
import { TsLitPluginStore } from "../../state/store";
import { TextDocument } from "./text-document";
import { visitTaggedTemplateNodes } from "./visit-tagged-template-nodes";

/**
 * Returns all text documents in a given file.
 * @param astNode
 * @param checker
 * @param store
 */
export function parseTextDocuments(astNode: Node, checker: TypeChecker, store: TsLitPluginStore): TextDocument[] {
	const textDocuments: TextDocument[] = [];

	visitTaggedTemplateNodes(astNode, {
		checker,
		shouldCheckTemplateTag(templateTag: string) {
			return store.config.htmlTemplateTags.includes(templateTag);
		},
		emitTextDocument(document: TextDocument) {
			textDocuments.push(document);
		}
	});

	return textDocuments;
}
