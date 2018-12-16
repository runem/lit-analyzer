import { CodeFixAction, Node } from "typescript";
import { HtmlAttr } from "../../parse-html-nodes/types/html-attr-types";
import { HtmlNode, IHtmlTemplate } from "../../parse-html-nodes/types/html-node-types";
import { HtmlReport } from "../../parse-html-nodes/types/html-report-types";
import { TsHtmlPluginStore } from "../../state/store";
import { iterateHtmlTemplateReports } from "../../util/iterate-html-template-reports";

/**
 * Asks extensions for code fixes at a given position.
 * @param start
 * @param end
 * @param templates
 * @param store
 */
export function getCodeFixFromHtmlTemplates(start: number, end: number, templates: IHtmlTemplate[], store: TsHtmlPluginStore): CodeFixAction[] {
	return iterateHtmlTemplateReports(templates, {
		position: { start, end },

		getNodeItems(htmlNode: HtmlNode, htmlReport: HtmlReport, astNode: Node) {
			return store.extension.codeFixesForHtmlNode(htmlNode, htmlReport, {
				file: astNode.getSourceFile(),
				astNode,
				store
			});
		},
		getAttrItems(htmlAttr: HtmlAttr, htmlReport: HtmlReport, astNode: Node) {
			return store.extension.codeFixesForHtmlAttr(htmlAttr, htmlReport, {
				file: astNode.getSourceFile(),
				astNode,
				store
			});
		}
	});
}
