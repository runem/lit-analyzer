import { DiagnosticWithLocation, Node } from "typescript";
import { HtmlAttr } from "../../parse-html-nodes/types/html-attr-types";
import { HtmlNode, IHtmlTemplate } from "../../parse-html-nodes/types/html-node-types";
import { HtmlReport } from "../../parse-html-nodes/types/html-report-types";
import { TsHtmlPluginStore } from "../../state/store";
import { iterateHtmlTemplateReports } from "../../util/iterate-html-template-reports";

/**
 * Returns diagnostics for html templates using the extensions.
 * @param templates
 * @param store
 */
export function getDiagnosticsFromHtmlTemplates(templates: IHtmlTemplate[], store: TsHtmlPluginStore): DiagnosticWithLocation[] {
	return iterateHtmlTemplateReports<DiagnosticWithLocation>(templates, {
		getNodeItems(htmlNode: HtmlNode, htmlReport: HtmlReport, astNode: Node) {
			return store.extension.diagnosticsForHtmlNode(htmlNode, htmlReport, {
				file: astNode.getSourceFile(),
				store,
				astNode
			});
		},
		getAttrItems(htmlAttr: HtmlAttr, htmlReport: HtmlReport, astNode: Node) {
			return store.extension.diagnosticsForHtmlAttr(htmlAttr, htmlReport, {
				file: astNode.getSourceFile(),
				store,
				astNode
			});
		}
	});
}
