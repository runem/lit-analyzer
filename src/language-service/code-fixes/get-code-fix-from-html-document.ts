import { CodeFixAction } from "typescript";
import { codeFixesForHtmlAttrReport, codeFixesForHtmlNodeReport } from "../../extensions/html/code-fixes";
import { HTMLDocument } from "../../parsing/html-document/html-document";
import { TsLitPluginStore } from "../../state/store";
import { isHTMLAttr } from "../../types/html-node-attr-types";
import { isHTMLNode } from "../../types/html-node-types";
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

	const sourceFile = htmlDocument.astNode.getSourceFile();

	return flatten(
		reports
			.map(htmlReport => {
				if (isHTMLNode(hit)) {
					return codeFixesForHtmlNodeReport(hit, htmlReport, sourceFile, store);
				} else if (isHTMLAttr(hit)) {
					return codeFixesForHtmlAttrReport(hit, htmlReport, sourceFile, store);
				}
			})
			.filter((report): report is CodeFixAction[] => report != null)
	);
}
