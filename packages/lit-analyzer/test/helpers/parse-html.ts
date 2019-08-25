import { isTaggedTemplateExpression, Node, TaggedTemplateExpression } from "typescript";
import { HtmlDocument } from "../../src/analyze/parse/document/text-document/html-document/html-document";
import { parseHtmlDocument } from "../../src/analyze/parse/document/text-document/html-document/parse-html-document";
import { compileFiles } from "./compile-files";

export function parseHtml(html: string): HtmlDocument {
	const { sourceFile } = compileFiles([`html\`${html}\``]);
	const taggedTemplateExpression = findTaggedTemplateExpression(sourceFile)!;
	return parseHtmlDocument(taggedTemplateExpression);
}

function findTaggedTemplateExpression(node: Node): TaggedTemplateExpression | undefined {
	if (isTaggedTemplateExpression(node)) {
		return node;
	}

	return node.forEachChild(findTaggedTemplateExpression);
}
