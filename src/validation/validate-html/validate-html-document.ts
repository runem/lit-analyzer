import { Node, TypeChecker } from "typescript";
import { HTMLDocument } from "../../parsing/html-document/html-document";
import { TsLitPluginStore } from "../../state/store";
import { HtmlNodeAttr } from "../../types/html-node-attr-types";
import { HtmlNode } from "../../types/html-node-types";
import { HtmlReport } from "../../types/html-report-types";
import { iterateHtmlDocuments } from "../../util/iterate-html-documents";
import { validateHtmlNode } from "./validate-html-node";
import { validateHtmlAttr } from "./validate-html-node-attr";
import { validateHtmlAttrAssignment } from "./validate-html-node-attr-assignment";

export function validateHTMLDocuments(htmlDocuments: HTMLDocument[], checker: TypeChecker, store: TsLitPluginStore) {
	return iterateHtmlDocuments<{ source: HtmlNode | HtmlNodeAttr; reports: HtmlReport[] }>(htmlDocuments, {
		getNodeItems(htmlNode: HtmlNode, astNode: Node) {
			// Ask extensions for node reports
			return {
				source: htmlNode,
				reports: validateHtmlNode(htmlNode, astNode.getSourceFile(), store)
			};
		},
		getAttrItems(htmlAttr: HtmlNodeAttr) {
			const reports = [
				// Validate html attribute and add reports to it
				...validateHtmlAttr(htmlAttr, store),

				// Validate html attr assignment and add reports to the attribute
				...(!store.config.skipTypeChecking ? validateHtmlAttrAssignment(htmlAttr, checker, store) : [])
			];

			return {
				source: htmlAttr,
				reports
			};
		}
	});
}
