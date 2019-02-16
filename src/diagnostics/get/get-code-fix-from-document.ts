import { CodeFixAction } from "typescript";
import { DiagnosticsContext } from "../diagnostics-context";
import { codeFixesForHtmlAttrReport, codeFixesForHtmlNodeReport } from "../html-document/code-fixes";
import { HtmlDocument } from "../../parsing/text-document/html-document/html-document";
import { TextDocument } from "../../parsing/text-document/text-document";
import { isHTMLAttr } from "../../types/html-node-attr-types";
import { isHTMLNode } from "../../types/html-node-types";
import { flatten } from "../../util/util";

export function getCodeFixFromDocument(start: number, end: number, document: TextDocument, context: DiagnosticsContext): CodeFixAction[] {
	if (document instanceof HtmlDocument) {
		const hit = document.htmlNodeOrAttrAtPosition({ start, end });
		if (hit == null) return [];

		const reports = context.store.getReportsForHtmlNodeOrAttr(hit);

		return flatten(
			reports
				.map(htmlReport => {
					if (isHTMLNode(hit)) {
						return codeFixesForHtmlNodeReport(hit, htmlReport, context);
					} else if (isHTMLAttr(hit)) {
						return codeFixesForHtmlAttrReport(hit, htmlReport, context);
					}
				})
				.filter((report): report is CodeFixAction[] => report != null)
		);
	}

	return [];
}
