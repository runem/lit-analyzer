import { Type, TypeChecker } from "typescript";
import { TsLitPluginStore } from "../state/store";
import { VirtualDocument } from "../virtual-document/virtual-document";
import { HTMLDocument } from "./html-document";
import { parseHtmlNodes } from "./parse-html-node/parse-html-node";
import { ParseHtmlContext } from "./parse-html-node/types/parse-html-context";
import { parseHtml } from "./parse-html-p5/parse-html";

export function parseHTMLDocuments(virtualDocuments: VirtualDocument[], checker: TypeChecker, store: TsLitPluginStore): HTMLDocument[] {
	return virtualDocuments.map(textDocument => parseHTMLDocument(textDocument, checker, store));
}

export function parseHTMLDocument(virtualDocument: VirtualDocument, checker: TypeChecker, store: TsLitPluginStore): HTMLDocument {
	const html = virtualDocument.text;
	const htmlAst = parseHtml(html);

	const context: ParseHtmlContext = {
		store,
		html,
		getSourceCodeLocation(htmlOffset: number): number {
			return virtualDocument.sourceCodePositionAtOffset(htmlOffset);
		},
		getTypeFromExpressionId(id: string): Type | undefined {
			const node = virtualDocument.getSubstitutionWithId(id);
			if (node != null) {
				return checker.getTypeAtLocation(node);
			}
		}
	};

	const childNodes = parseHtmlNodes(htmlAst.childNodes, context);

	const { astNode } = virtualDocument;

	const start = astNode.getStart();
	const end = astNode.getEnd();

	return new HTMLDocument(virtualDocument, astNode, childNodes, { start, end });
}
