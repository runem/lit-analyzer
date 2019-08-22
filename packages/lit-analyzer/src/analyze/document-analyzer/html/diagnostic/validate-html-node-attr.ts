import { isRuleEnabled } from "../../../lit-analyzer-config";
import { LitAnalyzerRequest } from "../../../lit-analyzer-context";
import { HtmlNodeAttr } from "../../../types/html-node/html-node-attr-types";
import { LitHtmlDiagnostic } from "../../../types/lit-diagnostic";

export function validateHtmlAttr(htmlAttr: HtmlNodeAttr, request: LitAnalyzerRequest): LitHtmlDiagnostic[] {
	for (const rule of request.rules) {
		if (isRuleEnabled(request.config, rule.name) && rule.visitHtmlAttribute != null) {
			const result = rule.visitHtmlAttribute(htmlAttr, request);

			if (result != null) {
				return result;
			}
		}
	}

	return [];
}
