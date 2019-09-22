import { litDiagnosticRuleSeverity } from "../analyze/lit-analyzer-config";
import { HtmlNodeAttrAssignmentKind } from "../analyze/types/html-node/html-node-attr-assignment-types";
import { HtmlNodeAttrKind } from "../analyze/types/html-node/html-node-attr-types";
import { LitHtmlDiagnosticKind } from "../analyze/types/lit-diagnostic";
import { RuleModule } from "../analyze/types/rule-module";

/**
 * This rule validates that non-attribute bindings are always used with an expression.
 */
const rule: RuleModule = {
	name: "no-expressionless-property-binding",
	visitHtmlAssignment(assignment, request) {
		const { htmlAttr } = assignment;

		// Only make this check non-expression type assignments.
		switch (assignment.kind) {
			case HtmlNodeAttrAssignmentKind.STRING:
			case HtmlNodeAttrAssignmentKind.BOOLEAN:
				switch (htmlAttr.kind) {
					case HtmlNodeAttrKind.EVENT_LISTENER:
						return [
							{
								kind: LitHtmlDiagnosticKind.PROPERTY_NEEDS_EXPRESSION,
								message: `You are using an event listener binding without an expression`,
								severity: litDiagnosticRuleSeverity(request.config, "no-expressionless-property-binding"),
								source: "no-expressionless-property-binding",
								location: { document: request.document, ...htmlAttr.location.name }
							}
						];
					case HtmlNodeAttrKind.BOOLEAN_ATTRIBUTE:
						return [
							{
								kind: LitHtmlDiagnosticKind.PROPERTY_NEEDS_EXPRESSION,
								message: `You are using a boolean attribute binding without an expression`,
								severity: litDiagnosticRuleSeverity(request.config, "no-expressionless-property-binding"),
								source: "no-expressionless-property-binding",
								location: { document: request.document, ...htmlAttr.location.name }
							}
						];
					case HtmlNodeAttrKind.PROPERTY:
						return [
							{
								kind: LitHtmlDiagnosticKind.PROPERTY_NEEDS_EXPRESSION,
								message: `You are using a property binding without an expression`,
								severity: litDiagnosticRuleSeverity(request.config, "no-expressionless-property-binding"),
								source: "no-expressionless-property-binding",
								location: { document: request.document, ...htmlAttr.location.name }
							}
						];
				}
		}

		return;
	}
};

export default rule;
