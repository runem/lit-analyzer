import { parseHtml } from "../parse-html-p5/parse-html";
import { HtmlNode, IHtmlTemplate } from "../types/html-node-types";
import { IParseHtmlContext } from "./i-parse-html-context";
import { parseHtmlNode } from "./parse-html-node";

/**
 * Parses a html template.
 * @param context
 */
export function parseHtmlTemplate(context: IParseHtmlContext): IHtmlTemplate {
	const htmlAst = parseHtml(context.html);

	const childNodes = htmlAst.childNodes.map(childNode => parseHtmlNode(childNode, context)).filter(elem => elem != null) as HtmlNode[];

	const { astNode } = context;

	const start = astNode.getStart();
	const end = astNode.getEnd();

	return {
		childNodes,
		astNode,
		location: { start, end }
	};
}
