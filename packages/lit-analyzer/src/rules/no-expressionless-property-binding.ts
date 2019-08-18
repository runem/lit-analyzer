import { RuleModule } from "../analyze/types/rule-module";
import { LitHtmlDiagnosticKind } from "../analyze/types/lit-diagnostic";
import { litDiagnosticRuleSeverity } from "../analyze/lit-analyzer-config";
import { HtmlNodeAttr, HtmlNodeAttrKind } from "../analyze/types/html-node/html-node-attr-types";
import { HtmlNodeAttrAssignmentKind } from "../analyze/types/html-node/html-node-attr-assignment-types";

const rule: RuleModule = context => {
	return {
		enterHtmlAttribute(node: HtmlNodeAttr) {
			const { assignment } = node;

			if (assignment == null || node.kind !== HtmlNodeAttrKind.PROPERTY) {
				return;
			}

			const { document } = context;

			if (assignment.kind === HtmlNodeAttrAssignmentKind.STRING || assignment.kind === HtmlNodeAttrAssignmentKind.BOOLEAN) {
				context.reports.push({
					kind: LitHtmlDiagnosticKind.PROPERTY_NEEDS_EXPRESSION,
					message: `You are using a property binding without an expression`,
					severity: litDiagnosticRuleSeverity(context.config, "no-expressionless-property-binding"),
					source: "no-expressionless-property-binding",
					location: { document, ...node.location.name }
				});
			}
		}
	};
};

export default rule;
