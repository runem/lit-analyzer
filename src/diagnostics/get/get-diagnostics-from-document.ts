import { DiagnosticWithLocation } from "typescript";
import { CssDocument } from "../../parsing/text-document/css-document/css-document";
import { HtmlDocument } from "../../parsing/text-document/html-document/html-document";
import { TextDocument } from "../../parsing/text-document/text-document";
import { flatten } from "../../util/util";
import { VscodeCssServiceWrapper } from "../css-document/vscode-css-languageservice/vscode-css-service-wrapper";
import { DiagnosticsContext } from "../diagnostics-context";
import { diagnosticsForHtmlAttrReport, diagnosticsForHtmlNodeReport } from "../html-document/diagnostics";

export function getDiagnosticsFromDocument(document: TextDocument, context: DiagnosticsContext): DiagnosticWithLocation[] {
	if (document instanceof CssDocument) {
		return new VscodeCssServiceWrapper(document).getDiagnostics();
	} else if (document instanceof HtmlDocument) {
		return flatten(
			document.mapNodes(htmlNode => {
				return [
					...flatten(context.store.getReportsForHtmlNodeOrAttr(htmlNode).map(htmlReport => diagnosticsForHtmlNodeReport(htmlNode, htmlReport, context))),

					...flatten(
						htmlNode.attributes.map(htmlAttr => flatten(context.store.getReportsForHtmlNodeOrAttr(htmlAttr).map(htmlReport => diagnosticsForHtmlAttrReport(htmlAttr, htmlReport, context))))
					)
				];
			})
		);
	}

	return [];
}
