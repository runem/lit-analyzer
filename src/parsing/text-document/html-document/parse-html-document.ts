import { Type } from "typescript";
import { ParsingContext } from "../../parsing-context";
import { VirtualDocument } from "../../virtual-document/virtual-document";
import { HtmlDocument } from "./html-document";
import { parseHtmlNodes } from "./parse-html-node/parse-html-node";
import { ParseHtmlContext } from "./parse-html-node/types/parse-html-context";
import { parseHtml } from "./parse-html-p5/parse-html";

export function parseHtmlDocuments(virtualDocuments: VirtualDocument[], context: ParsingContext): HtmlDocument[] {
	return virtualDocuments.map(virtualDocument => parseHtmlDocument(virtualDocument, context));
}

export function parseHtmlDocument(virtualDocument: VirtualDocument, { checker, store }: ParsingContext): HtmlDocument {
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

	return new HtmlDocument(virtualDocument, childNodes);
}
