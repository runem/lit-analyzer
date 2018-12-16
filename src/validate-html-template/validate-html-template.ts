import { Node, TypeChecker } from "typescript";
import { HtmlAttr } from "../parse-html-nodes/types/html-attr-types";
import { HtmlNode, IHtmlTemplate } from "../parse-html-nodes/types/html-node-types";
import { IHtmlReportBase } from "../parse-html-nodes/types/html-report-types";
import { TsHtmlPluginStore } from "../state/store";
import { iterateHtmlTemplate } from "../util/iterate-html-template";
import { makeValidateAttributeAssignmentContext } from "./validate-attribute-assignment-context";

/**
 * Iterates through all html nodes and html attributes to generate reports for each of them.
 * @param template
 * @param checker
 * @param store
 */
export function validateHtmlTemplate(template: IHtmlTemplate, checker: TypeChecker, store: TsHtmlPluginStore) {
	iterateHtmlTemplate(template, {
		getNodeItems(htmlNode: HtmlNode, astNode: Node) {
			// Ask extensions for node reports
			addReportsToNode(htmlNode, store.extension.validateHtmlNode(htmlNode, { astNode, store }));
		},
		getAttrItems(htmlAttr: HtmlAttr, astNode: Node) {
			// Validate html attribute and add reports to it
			addReportsToNode(htmlAttr, store.extension.validateHtmlAttr(htmlAttr, { astNode, store }));

			// Validate html attr assignment and add reports to the attribute
			addReportsToNode(htmlAttr, store.extension.validateHtmlAttrAssignment(htmlAttr, makeValidateAttributeAssignmentContext(astNode, checker, store)));
		}
	});
}

/**
 * Adds reports to an object that has a "reports" array.
 * @param base
 * @param reports
 */
function addReportsToNode(base: { reports?: IHtmlReportBase[] }, reports?: IHtmlReportBase[]) {
	if (reports != null && reports.length > 0) {
		base.reports = base.reports || [];
		base.reports.push(...reports);
	}
}
