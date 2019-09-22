import { isRuleEnabled } from "../../../lit-analyzer-config";
import { LitAnalyzerRequest } from "../../../lit-analyzer-context";
import { HtmlNodeAttrAssignment } from "../../../types/html-node/html-node-attr-assignment-types";
import { LitHtmlDiagnostic } from "../../../types/lit-diagnostic";

export function validateHtmlAttrAssignment(assignment: HtmlNodeAttrAssignment, request: LitAnalyzerRequest): LitHtmlDiagnostic[] {
	for (const rule of request.rules) {
		if (isRuleEnabled(request.config, rule.name) && rule.visitHtmlAssignment != null) {
			const result = rule.visitHtmlAssignment(assignment, request);

			if (result != null) {
				return result;
			}
		}
	}

	return [];
}
