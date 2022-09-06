import { JSDocUnknownTag } from "typescript";
import { LitAnalyzerContext } from "../../../lit-analyzer-context.js";
import { HtmlDocument } from "../../../parse/document/text-document/html-document/html-document.js";
import { HtmlNode } from "../../../types/html-node/html-node-types.js";
import { LitRenameLocation } from "../../../types/lit-rename-location.js";
import { findChild } from "../../../util/ast-util.js";
import { iterableFirst } from "../../../util/iterable-util.js";
import { documentRangeToSFRange, makeSourceFileRange } from "../../../util/range-util.js";

export function renameLocationsForTagName(tagName: string, context: LitAnalyzerContext): LitRenameLocation[] {
	const locations: LitRenameLocation[] = [];

	for (const sourceFile of context.program.getSourceFiles()) {
		const documents = context.documentStore.getDocumentsInFile(sourceFile, context.config);

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

	const definition = context.definitionStore.getDefinitionForTagName(tagName);
	if (definition != null) {
		// TODO
		const definitionNode = iterableFirst(definition.tagNameNodes);

		if (definitionNode != null) {
			const fileName = definitionNode.getSourceFile().fileName;

			if (context.ts.isCallLikeExpression(definitionNode)) {
				const stringLiteralNode = findChild(definitionNode, child => context.ts.isStringLiteralLike(child) && child.text === tagName);

				if (stringLiteralNode != null) {
					locations.push({
						fileName,
						range: makeSourceFileRange({ start: stringLiteralNode.getStart() + 1, end: stringLiteralNode.getEnd() - 1 })
					});
				}
			} else if (definitionNode.kind === context.ts.SyntaxKind.JSDocTag) {
				const jsDocTagNode = definitionNode as JSDocUnknownTag;

				if (jsDocTagNode.comment != null) {
					const start = jsDocTagNode.tagName.getEnd() + 1;

					locations.push({
						fileName,
						range: makeSourceFileRange({ start, end: start + jsDocTagNode.comment.length })
					});
				}
			} else if (context.ts.isInterfaceDeclaration(definitionNode)) {
				const stringLiteralNode = findChild(definitionNode, child => context.ts.isStringLiteralLike(child) && child.text === tagName);

				if (stringLiteralNode != null) {
					locations.push({
						fileName,
						range: makeSourceFileRange({ start: stringLiteralNode.getStart() + 1, end: stringLiteralNode.getEnd() - 1 })
					});
				}
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
			range: documentRangeToSFRange(context.document, node.location.name),
			fileName: context.document.virtualDocument.fileName
		});

		if (node.location.endTag != null) {
			const { start, end } = node.location.endTag;
			context.emitRenameLocation({
				range: documentRangeToSFRange(context.document, { start: start + 2, end: end - 1 }),
				fileName: context.document.virtualDocument.fileName
			});
		}
	}

	node.children.forEach(childNode => visitHtmlNode(childNode, context));
}
