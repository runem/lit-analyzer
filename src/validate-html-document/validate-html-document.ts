import { Node, TypeChecker } from "typescript";
import { HTMLDocument } from "../html-document/html-document";
import { HtmlAttr } from "../html-document/types/html-attr-types";
import { HtmlNode } from "../html-document/types/html-node-types";
import { IHtmlReportBase } from "../html-document/types/html-report-types";
import { TsHtmlPluginStore } from "../state/store";
import { iterateHtmlDocuments } from "../util/iterate-html-documents";
import { makeValidateAttributeAssignmentContext } from "./validate-attribute-assignment-context";

export function validateHTMLDocuments(htmlDocuments: HTMLDocument[], checker: TypeChecker, store: TsHtmlPluginStore) {
	return iterateHtmlDocuments<{ source: HtmlNode | HtmlAttr; reports: IHtmlReportBase[] }>(htmlDocuments, {
		getNodeItems(htmlNode: HtmlNode, astNode: Node) {
			// Ask extensions for node reports
			const reports = store.extension.validateHtmlNode(htmlNode, { file: astNode.getSourceFile(), store }) || [];
			return {
				source: htmlNode,
				reports
			};
		},
		getAttrItems(htmlAttr: HtmlAttr, astNode: Node) {
			const reports = [
				// Validate html attribute and add reports to it
				...(store.extension.validateHtmlAttr(htmlAttr, { file: astNode.getSourceFile(), store }) || []),

				// Validate html attr assignment and add reports to the attribute
				...((!store.config.skipTypeChecking ? store.extension.validateHtmlAttrAssignment(htmlAttr, makeValidateAttributeAssignmentContext(astNode, checker, store)) : undefined) || [])
			];

			return {
				source: htmlAttr,
				reports
			};
		}
	});
}
