import { JsxClosingTagInfo } from "typescript";
import { DiagnosticsContext } from "../diagnostics-context";
import { HtmlDocument } from "../../parsing/text-document/html-document/html-document";
import { TextDocument } from "../../parsing/text-document/text-document";
import { VscodeHtmlServiceWrapper } from "../html-document/vscode-html-languageservice/vscode-html-service-wrapper";

export function getClosingTagFromDocument(document: TextDocument, position: number, context: DiagnosticsContext): JsxClosingTagInfo | undefined {
	if (document instanceof HtmlDocument) {
		const wrapper = new VscodeHtmlServiceWrapper(document);
		return wrapper.doTagComplete(position);
	}
}
