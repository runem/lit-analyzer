import { LitAnalyzerRequest } from "../../../lit-analyzer-context";
import { HtmlDocument } from "../../../parse/document/text-document/html-document/html-document";
import { HtmlNodeAttr } from "../../../types/html-node/html-node-attr-types";
import { HtmlNode } from "../../../types/html-node/html-node-types";
import { LitHtmlDiagnostic } from "../../../types/lit-diagnostic";
import { validateHtmlNode } from "./validate-html-node";
import { validateHtmlAttr } from "./validate-html-node-attr";
import { validateHtmlAttrAssignment } from "./validate-html-node-attr-assignment";

export function validateHTMLDocument(htmlDocument: HtmlDocument, request: LitAnalyzerRequest): LitHtmlDiagnostic[] {
	const reports: LitHtmlDiagnostic[] = [];

	const iterateNodes = (nodes: HtmlNode[]) => {
		for (const childNode of nodes) {
			reports.push(...validateHtmlNode(childNode, request));

			const iterateAttrs = (attrs: HtmlNodeAttr[]) => {
				for (const attr of attrs) {
					reports.push(...validateHtmlAttr(attr, request));

					if (attr.assignment != null) {
						reports.push(...validateHtmlAttrAssignment(attr.assignment, request));
					}
				}
			};

			iterateAttrs(childNode.attributes);

			iterateNodes(childNode.children);
		}
	};

	iterateNodes(htmlDocument.rootNodes);

	return reports;
}
