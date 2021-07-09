import { Expression, TaggedTemplateExpression } from "typescript";
import { DocumentRange } from "../../../../types/range";
import { VirtualAstHtmlDocument } from "../../virtual-document/virtual-html-document";
import { HtmlDocument } from "./html-document";
import { ParseHtmlContext } from "./parse-html-node/parse-html-context";
import { parseHtmlNodes } from "./parse-html-node/parse-html-node";
import { parseHtml } from "./parse-html-p5/parse-html";

export function parseHtmlDocuments(nodes: TaggedTemplateExpression[]): HtmlDocument[] {
	return nodes.map(parseHtmlDocument);
}

export function parseHtmlDocument(node: TaggedTemplateExpression): HtmlDocument {
	const virtualDocument = new VirtualAstHtmlDocument(node);
	const html = virtualDocument.text;
	const htmlAst = parseHtml(html);
	const document = new HtmlDocument(virtualDocument, []);

	const context: ParseHtmlContext = {
		html,
		document,
		getPartsAtOffsetRange(range: DocumentRange): (Expression | string)[] {
			return virtualDocument.getPartsAtDocumentRange(range);
		}
	};

	document.rootNodes = parseHtmlNodes(htmlAst.childNodes, undefined, context);

	return document;
}
