import { isRuleEnabled } from "../../../lit-analyzer-config";
import { LitAnalyzerRequest } from "../../../lit-analyzer-context";
import { HtmlNodeAttrAssignment } from "../../../types/html-node/html-node-attr-assignment-types";
import { LitHtmlDiagnostic } from "../../../types/lit-diagnostic";
import { extractBindingTypes } from "./rules/assignment/util/extract-binding-types";

/**
 * Validates an attribute assignment: lit-html style.
 * @param assignment
 * @param request
 */
export function validateHtmlAttrAssignment(assignment: HtmlNodeAttrAssignment, request: LitAnalyzerRequest): LitHtmlDiagnostic[] {
	const { typeA, typeB } = extractBindingTypes(assignment, request);

	for (const rule of request.rules) {
		if (isRuleEnabled(request.config, rule.name) && rule.visitHtmlAssignment != null) {
			const result = rule.visitHtmlAssignment(assignment, { typeA, typeB }, request);

			if (result != null) {
				return result;
			}
		}
	}

	return [];
}
