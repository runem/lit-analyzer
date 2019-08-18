import { RuleModule } from "../analyze/types/rule-module";
import { LitHtmlDiagnosticKind } from "../analyze/types/lit-diagnostic";
import { litDiagnosticRuleSeverity } from "../analyze/lit-analyzer-config";
import { HtmlNodeAttr, HtmlNodeAttrKind } from "../analyze/types/html-node/html-node-attr-types";
import { HtmlNodeAttrAssignmentKind } from "../analyze/types/html-node/html-node-attr-assignment-types";
import { extractAttributeTypes } from "../analyze/util/attribute-util";
import { isLitDirective } from "../analyze/util/type-util";

const rule: RuleModule = context => {
	return {
		enterHtmlAttribute(node: HtmlNodeAttr) {
			const { assignment } = node;

			if (assignment == null) {
				return;
			}

			const { ts, document } = context;
			const htmlAttrTarget = context.htmlStore.getHtmlAttrTarget(node);

			if (htmlAttrTarget == null) {
				return;
			}

			const types = extractAttributeTypes(context, node);

			if (!types) {
				return;
			}

			const { typeB } = types;

			// Type check lit-html directives
			if (isLitDirective(typeB)) {
				if (assignment.kind === HtmlNodeAttrAssignmentKind.EXPRESSION && ts.isCallExpression(assignment.expression)) {
					const functionName = assignment.expression.expression.getText();
					const args = Array.from(assignment.expression.arguments);

					switch (functionName) {
						case "ifDefined":
							// Example: html`<img src="${ifDefined(imageUrl)}">`;
							// Take the argument to ifDefined and remove undefined from the type union (if possible).
							// Then test if this result is now assignable to the attribute type.

							if (args.length === 1) {
								// "ifDefined" only has an effect on "attribute" bindings
								if (node.kind !== HtmlNodeAttrKind.ATTRIBUTE) {
									context.reports.push({
										kind: LitHtmlDiagnosticKind.DIRECTIVE_NOT_ALLOWED_HERE,
										source: "no-invalid-directive-binding",
										severity: litDiagnosticRuleSeverity(context.config, "no-invalid-directive-binding"),
										message: `The 'ifDefined' directive has no effect here.`,
										location: { document, ...node.location.name }
									});
								}
							}

							break;

						case "classMap":
							// Report error if "classMap" is not being used on the "class" attribute.
							if (node.name !== "class" || node.kind !== HtmlNodeAttrKind.ATTRIBUTE) {
								context.reports.push({
									kind: LitHtmlDiagnosticKind.DIRECTIVE_NOT_ALLOWED_HERE,
									message: `The 'classMap' directive can only be used in an attribute binding for the 'class' attribute`,
									source: "no-invalid-directive-binding",
									severity: litDiagnosticRuleSeverity(context.config, "no-invalid-directive-binding"),
									location: { document, ...node.location.name }
								});
							}
							break;

						case "styleMap":
							// Report error if "styleMap" is not being used on the "style" attribute.
							if (node.name !== "style" || node.kind !== HtmlNodeAttrKind.ATTRIBUTE) {
								context.reports.push({
									kind: LitHtmlDiagnosticKind.DIRECTIVE_NOT_ALLOWED_HERE,
									message: `The 'styleMap' directive can only be used in an attribute binding for the 'style' attribute`,
									source: "no-invalid-directive-binding",
									severity: litDiagnosticRuleSeverity(context.config, "no-invalid-directive-binding"),
									location: { document, ...node.location.name }
								});
							}
							break;

						case "unsafeHTML":
						case "cache":
						case "repeat":
						case "asyncReplace":
						case "asyncAppend":
							// These directives can only be used within a text binding.
							// This function validating assignments is per definition used NOT in a text binding
							context.reports.push({
								kind: LitHtmlDiagnosticKind.DIRECTIVE_NOT_ALLOWED_HERE,
								message: `The '${functionName}' directive can only be used within a text binding.`,
								source: "no-invalid-directive-binding",
								severity: litDiagnosticRuleSeverity(context.config, "no-invalid-directive-binding"),
								location: { document, ...node.location.name }
							});
					}
				}
			}
		}
	};
};

export default rule;
