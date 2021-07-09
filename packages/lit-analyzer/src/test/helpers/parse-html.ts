import { Node, TaggedTemplateExpression } from "typescript";
import { HtmlDocument } from "../../lib/analyze/parse/document/text-document/html-document/html-document.js";
import { parseHtmlDocument } from "../../lib/analyze/parse/document/text-document/html-document/parse-html-document.js";
import { compileFiles } from "./compile-files.js";
import { getCurrentTsModule } from "./ts-test.js";

export function parseHtml(html: string): HtmlDocument {
	const { sourceFile } = compileFiles([`html\`${html}\``]);
	const taggedTemplateExpression = findTaggedTemplateExpression(sourceFile)!;
	return parseHtmlDocument(taggedTemplateExpression);
}

function findTaggedTemplateExpression(node: Node): TaggedTemplateExpression | undefined {
	if (getCurrentTsModule().isTaggedTemplateExpression(node)) {
		return node;
	}

	return node.forEachChild(findTaggedTemplateExpression);
}
