import { Expression, TaggedTemplateExpression } from "typescript";
import { Range } from "../../../../types/range";
import { VirtualAstHtmlDocument } from "../../virtual-document/virtual-html-document";
import { HtmlDocument } from "./html-document";
import { parseHtmlNodes } from "./parse-html-node/parse-html-node";
import { ParseHtmlContext } from "./parse-html-node/parse-html-context";
import { parseHtml } from "./parse-html-p5/parse-html";

export function parseHtmlDocuments(nodes: TaggedTemplateExpression[]): HtmlDocument[] {
	return nodes.map(parseHtmlDocument);
}

export function parseHtmlDocument(node: TaggedTemplateExpression): HtmlDocument {
	const virtualDocument = new VirtualAstHtmlDocument(node);
	const html = virtualDocument.text;
	const htmlAst = parseHtml(html);

	const context: ParseHtmlContext = {
		html,
		getPartsAtOffsetRange(range: Range): (Expression | string)[] {
			return virtualDocument.getPartsAtOffsetRange(range);
		}
	};

	const childNodes = parseHtmlNodes(htmlAst.childNodes, undefined, context);

	return new HtmlDocument(virtualDocument, childNodes);
}
