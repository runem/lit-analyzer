import { Type, TypeChecker } from "typescript";
import { TsHtmlPluginStore } from "../state/store";
import { VirtualDocument } from "../virtual-document/virtual-document";
import { HTMLDocument } from "./html-document";
import { parseHtmlNode } from "./parse-html-node/parse-html-node";
import { ParseHtmlContext } from "./parse-html-node/types/parse-html-context";
import { parseHtml } from "./parse-html-p5/parse-html";
import { IHtmlNodeBase } from "./types/html-node-types";

export function parseHTMLDocuments(virtualDocuments: VirtualDocument[], checker: TypeChecker, store: TsHtmlPluginStore): HTMLDocument[] {
	return virtualDocuments.map(textDocument => parseHTMLDocument(textDocument, checker, store));
}

export function parseHTMLDocument(virtualDocument: VirtualDocument, checker: TypeChecker, store: TsHtmlPluginStore): HTMLDocument {
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

	const childNodes = htmlAst.childNodes.map(childNode => parseHtmlNode(childNode, context)).filter((elem): elem is IHtmlNodeBase => elem != null);

	const { astNode } = virtualDocument;

	const start = astNode.getStart();
	const end = astNode.getEnd();

	return new HTMLDocument(virtualDocument, astNode, childNodes, { start, end });
}
