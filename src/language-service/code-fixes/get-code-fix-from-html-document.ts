import { CodeFixAction } from "typescript";
import { HTMLDocument } from "../../html-document/html-document";
import { isHTMLAttr } from "../../html-document/types/html-attr-types";
import { isHTMLNode } from "../../html-document/types/html-node-types";
import { TsLitPluginStore } from "../../state/store";
import { flatten } from "../../util/util";

/**
 * Asks extensions for code fixes at a given position.
 * @param start
 * @param end
 * @param htmlDocument
 * @param store
 */
export function getCodeFixFromHtmlDocument(start: number, end: number, htmlDocument: HTMLDocument, store: TsLitPluginStore): CodeFixAction[] {
	const hit = htmlDocument.htmlNodeOrAttrAtPosition({ start, end });
	if (hit == null) return [];

	const reports = store.getReportsForHtmlNodeOrAttr(hit);

	const context = {
		file: htmlDocument.astNode.getSourceFile(),
		store
	};

	return flatten(
		reports
			.map(htmlReport => {
				if (isHTMLNode(hit)) {
					return store.extension.codeFixesForHtmlNodeReport(hit, htmlReport, context);
				} else if (isHTMLAttr(hit)) {
					return store.extension.codeFixesForHtmlAttrReport(hit, htmlReport, context);
				}
			})
			.filter((report): report is CodeFixAction[] => report != null)
	);
}
