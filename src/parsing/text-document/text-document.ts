import { tsModule } from "../../ts-module";
import { Range } from "../../types/range";
import { findParent, getNodeAtPosition } from "../../util/ast-util";
import { VirtualDocument } from "../virtual-document/virtual-document";

export class TextDocument {
	constructor(public virtualDocument: VirtualDocument) {}
}

export function intersectingDocument(documents: TextDocument[], position: number | Range): TextDocument | undefined {
	if (documents.length === 0) return undefined;

	const sourceFile = documents[0].virtualDocument.astNode.getSourceFile();

	const token = getNodeAtPosition(sourceFile, position);
	const node = findParent(token, tsModule.ts.isTaggedTemplateExpression);

	if (node != null) {
		const start = node.getStart();
		return documents.find(htmlDocument => htmlDocument.virtualDocument.location.start === start);
	}
}
