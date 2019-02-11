import { Node, TypeChecker } from "typescript";
import { TsLitPluginStore } from "../state/store";
import { VirtualDocument } from "./virtual-document";
import { visitTaggedTemplateNodes } from "./visit-tagged-template-nodes";

/**
 * Returns all virtual documents in a given file.
 * @param astNode
 * @param checker
 * @param store
 */
export function parseVirtualDocuments(astNode: Node, checker: TypeChecker, store: TsLitPluginStore): VirtualDocument[] {
	const textDocuments: VirtualDocument[] = [];

	visitTaggedTemplateNodes(astNode, {
		checker,
		store,
		emitTextDocument(document: VirtualDocument) {
			textDocuments.push(document);
		}
	});

	return textDocuments;
}
