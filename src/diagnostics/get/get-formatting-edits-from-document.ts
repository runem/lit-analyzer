import { FormatCodeSettings, TextChange } from "typescript";
import { HtmlDocument } from "../../parsing/text-document/html-document/html-document";
import { TextDocument } from "../../parsing/text-document/text-document";
import { VscodeHtmlServiceWrapper } from "../html-document/vscode-html-languageservice/vscode-html-service-wrapper";
import { DiagnosticsContext } from "../diagnostics-context";

export function getFormattingEditsFromDocument(document: TextDocument, settings: FormatCodeSettings, context: DiagnosticsContext): TextChange[] {
	if (document instanceof HtmlDocument) {
		const wrapper = new VscodeHtmlServiceWrapper(document);
		return wrapper.format(settings);
	}

	return [];
}
