import { JSDocUnknownTag } from "typescript";
import { LitAnalyzerContext } from "../../../lit-analyzer-context";
import { HtmlDocument } from "../../../parse/document/text-document/html-document/html-document";
import { HtmlNode } from "../../../types/html-node/html-node-types";
import { LitRenameLocation } from "../../../types/lit-rename-location";
import { findChild } from "../../../util/ast-util";

export function renameLocationsForTagName(tagName: string, request: LitAnalyzerContext): LitRenameLocation[] {
	const locations: LitRenameLocation[] = [];

	for (const sourceFile of request.program.getSourceFiles()) {
		const documents = request.documentStore.getDocumentsInFile(sourceFile, request.config);

		for (const document of documents) {
			if (document instanceof HtmlDocument) {
				document.rootNodes.forEach(rootNode =>
					visitHtmlNode(rootNode, {
						document,
						tagName,
						emitRenameLocation(location: LitRenameLocation): void {
							locations.push(location);
						}
					})
				);
			}
		}
	}

	const definition = request.definitionStore.getDefinitionForTagName(tagName);
	if (definition != null) {
		const { node: definitionNode } = definition;

		const fileName = definitionNode.getSourceFile().fileName;

		if (request.ts.isCallLikeExpression(definitionNode)) {
			const stringLiteralNode = findChild(definitionNode, child => request.ts.isStringLiteralLike(child) && child.text === tagName);

			if (stringLiteralNode != null) {
				locations.push({
					fileName,
					range: { start: stringLiteralNode.getStart() + 1, end: stringLiteralNode.getEnd() - 1 }
				});
			}
		} else if (definitionNode.kind === request.ts.SyntaxKind.JSDocTag) {
			const jsDocTagNode = definitionNode as JSDocUnknownTag;

			if (jsDocTagNode.comment != null) {
				const start = jsDocTagNode.tagName.getEnd() + 1;

				locations.push({
					fileName,
					range: { start, end: start + jsDocTagNode.comment.length }
				});
			}
		} else if (request.ts.isInterfaceDeclaration(definitionNode)) {
			const stringLiteralNode = findChild(definitionNode, child => request.ts.isStringLiteralLike(child) && child.text === tagName);

			if (stringLiteralNode != null) {
				locations.push({
					fileName,
					range: { start: stringLiteralNode.getStart() + 1, end: stringLiteralNode.getEnd() - 1 }
				});
			}
		}
	}

	return locations;
}

interface VisitHtmlNodeContext {
	document: HtmlDocument;
	tagName: string;
	emitRenameLocation(location: LitRenameLocation): void;
}

function visitHtmlNode(node: HtmlNode, context: VisitHtmlNodeContext) {
	if (node.tagName === context.tagName) {
		context.emitRenameLocation({
			range: { document: context.document, ...node.location.name },
			fileName: context.document.virtualDocument.fileName
		});

		if (node.location.endTag != null) {
			const { start, end } = node.location.endTag;
			context.emitRenameLocation({
				range: { document: context.document, start: start + 2, end: end - 1 },
				fileName: context.document.virtualDocument.fileName
			});
		}
	}

	node.children.forEach(childNode => visitHtmlNode(childNode, context));
}
