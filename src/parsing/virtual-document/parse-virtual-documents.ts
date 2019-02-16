import { Node } from "typescript";
import { ParsingContext } from "../parsing-context";
import { VirtualDocument } from "./virtual-document";
import { visitTaggedTemplateNodes } from "./visit-tagged-template-nodes";

/**
 * Returns all virtual documents in a given file.
 * @param astNode
 * @param checker
 * @param store
 */
export function parseVirtualDocuments(astNode: Node, { checker, store }: ParsingContext): VirtualDocument[] {
	const virtualDocuments: VirtualDocument[] = [];

	visitTaggedTemplateNodes(astNode, {
		checker,
		shouldCheckTemplateTag(templateTag: string) {
			return store.config.htmlTemplateTags.includes(templateTag) || templateTag === "css";
		},
		emitTextDocument(document: VirtualDocument) {
			virtualDocuments.push(document);
		}
	});

	return virtualDocuments;
}
