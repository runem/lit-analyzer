import { isRuleEnabled } from "../../../lit-analyzer-config";
import { LitAnalyzerRequest } from "../../../lit-analyzer-context";
import { HtmlNode } from "../../../types/html-node/html-node-types";
import { LitHtmlDiagnostic } from "../../../types/lit-diagnostic";

export function validateHtmlNode(htmlNode: HtmlNode, request: LitAnalyzerRequest): LitHtmlDiagnostic[] {
	for (const rule of request.rules) {
		if (isRuleEnabled(request.config, rule.name) && rule.visitHtmlNode != null) {
			const result = rule.visitHtmlNode(htmlNode, request);

			if (result != null) {
				return result;
			}
		}
	}

	return [];
}
