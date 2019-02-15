import { Type, TypeChecker } from "typescript";
import { TsLitPluginStore } from "../../state/store";
import { TextDocument } from "../text-document/text-document";
import { HTMLDocument } from "./html-document";
import { parseHtmlNodes } from "./parse-html-node/parse-html-node";
import { ParseHtmlContext } from "./parse-html-node/types/parse-html-context";
import { parseHtml } from "./parse-html-p5/parse-html";

export function parseHTMLDocuments(textDocuments: TextDocument[], checker: TypeChecker, store: TsLitPluginStore): HTMLDocument[] {
	return textDocuments.map(textDocument => parseHTMLDocument(textDocument, checker, store));
}

export function parseHTMLDocument(textDocument: TextDocument, checker: TypeChecker, store: TsLitPluginStore): HTMLDocument {
	const html = textDocument.text;
	const htmlAst = parseHtml(html);

	const context: ParseHtmlContext = {
		store,
		html,
		getSourceCodeLocation(htmlOffset: number): number {
			return textDocument.sourceCodePositionAtOffset(htmlOffset);
		},
		getTypeFromExpressionId(id: string): Type | undefined {
			const node = textDocument.getSubstitutionWithId(id);
			if (node != null) {
				return checker.getTypeAtLocation(node);
			}
		}
	};

	const childNodes = parseHtmlNodes(htmlAst.childNodes, context);

	const { astNode } = textDocument;

	const start = astNode.getStart();
	const end = astNode.getEnd();

	return new HTMLDocument(textDocument, astNode, childNodes, { start, end });
}
