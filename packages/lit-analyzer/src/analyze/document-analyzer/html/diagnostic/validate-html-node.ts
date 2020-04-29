import { LitAnalyzerRequest } from "../../../lit-analyzer-context";
import { HtmlNode } from "../../../types/html-node/html-node-types";
import { LitHtmlDiagnostic } from "../../../types/lit-diagnostic";

export function validateHtmlNode(htmlNode: HtmlNode, request: LitAnalyzerRequest): LitHtmlDiagnostic[] {
	for (const rule of request.enabledRules) {
		if (rule.visitHtmlNode != null) {
			const result = rule.visitHtmlNode(htmlNode, request);

			if (result != null) {
				return result;
			}
		}
	}

	return [];
}
