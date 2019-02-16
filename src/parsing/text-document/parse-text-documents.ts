import { ParsingContext } from "../parsing-context";
import { VirtualDocument } from "../virtual-document/virtual-document";
import { CssDocument } from "./css-document/css-document";
import { parseHtmlDocument } from "./html-document/parse-html-document";
import { TextDocument } from "./text-document";

export function parseTextDocuments(virtualDocuments: VirtualDocument[], context: ParsingContext): TextDocument[] {
	return virtualDocuments.map(document => {
		if (document.templateTag === "css") {
			return new CssDocument(document);
		}

		return parseHtmlDocument(document, context);
	});
}
